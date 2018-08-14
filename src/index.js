import {
  computeTimesCircledOn, getLastVertexInPath, isFunction, isTargetEdgeReached, merge, print, queueStore,
  shouldEdgeBeTraversedYetAgain
} from "./helpers"

export * from './types'
export * from './properties'
export * from './helpers'
export * from './types'

/**
 *
 * @param {FindPathSettings} settings
 * @param {Graph} graph
 * @param {Vertex} s origin vertex
 * @param {Vertex} t target vertex
 * @returns {Array}
 */
export function findPathsBetweenVertices({ maxNumberOfTraversals }, graph, s, t) {
  const { constructEdge } = graph;
  const settings = {
    isGoalReached: isTargetEdgeReached,
    isTraversableEdge: shouldEdgeBeTraversedYetAgain,
    maxNumberOfTraversals
  };
  const traversalState = { allFoundPaths: [] };
  findEdgesPaths(settings, graph, [constructEdge(null, s)], t, traversalState);

  // store = [[constructEdge(null, s)]]
  // pop one edge path
  // foreach outgoing edges of target vertex(edge path)
  //   if isTraversableEdge and isGoalReached
  //     update traversalState (reducer)
  //   if isTraversableEdge and !isGoalReached
  //     push the edge path [edge, outgoing edge]
  // stop when store empty

  return traversalState.allFoundPaths
}

/**
 * Prints all paths which end in t and can be obtained by adding vertices to path `edgePath`
 * @param {FindPathSettings} settings
 * @param {Graph} graph
 * @param {EdgePath} edgePath
 * @param {Vertex} t
 * @param {TraversalState} traversalState
 * @return {Array}
 */
function findEdgesPaths(settings, graph, edgePath, t, traversalState) {
  const lastVertexInPath = getLastVertexInPath(graph, edgePath);
  const { isTraversableEdge, isGoalReached } = settings;
  const { outgoingEdges } = graph;

  outgoingEdges(lastVertexInPath).forEach(edge => {
    if (isTraversableEdge(settings, graph, t, edgePath, edge)) {
      const newPath = edgePath.concat(edge);

      if (isGoalReached(settings, graph, edgePath, t, edge)) {
        traversalState.allFoundPaths = traversalState.allFoundPaths.concat([newPath]);
      }
      else {
        findEdgesPaths(settings, graph, newPath, t, traversalState)
      }
    }
    else {
      // No more circling on that edge, there is no path here to be added
    }
  });
}

/**
 *
 * @param {Array<Edge>} edges
 * @param {Array<Vertex>} vertices array of **unique** vertices (sameness is referential equality)
 * @param {EdgeADT} settings
 * @return {Graph}
 * CONTRACT : cannot have in `vertices` two equal (referential equality) vertices
 * CONTRACT : vertex, edge must be object (because of WeakMap)
 */
export function constructGraph(settings, edges, vertices) {
  const { getEdgeTarget, getEdgeOrigin, constructEdge } = settings;
  const vertexMap = new WeakMap();
  const edgeMap = new WeakMap();
  const outgoingEdges = new WeakMap();
  const incomingEdges = new WeakMap();

  // NOTE : we associated a numerical index to each vertex and edge.
  // This will be used for labelling or displaying purposes
  (vertices || []).forEach((vertex, index) => vertexMap.set(vertex, index));
  edges.forEach((edge, index) => {
    edgeMap.set(edge, index);

    const s = getEdgeOrigin(edge);
    const t = getEdgeTarget(edge);
    if (!vertexMap.has(s)) throw `constructGraph : origin vertex for edge #${index} referenced in edges but not referenced in vertices!`
    if (!vertexMap.has(t)) throw `constructGraph : target vertex for edge #${index} referenced in edges but not referenced in vertices!`

    const outgoingEdgeList = outgoingEdges.get(s) || [];
    const incomingEdgeList = incomingEdges.get(t) || [];
    outgoingEdges.set(s, outgoingEdgeList.concat([edge]));
    incomingEdges.set(t, incomingEdgeList.concat([edge]));
  });

  return {
    outgoingEdges: (vertex) => outgoingEdges.get(vertex) || [],
    incomingEdges: (vertex) => incomingEdges.get(vertex) || [],
    // NOTE : reuses `toString` method of Vertex
    showVertex: (vertex) => `Vertex #${vertexMap.get(vertex)} : ${print(vertex)}`,
    showEdge: (edge) => `Edge #${edgeMap.get(edge)} : ${print(edge)}`,
    vertices,
    edges,
    getEdgeTarget,
    getEdgeOrigin,
    constructEdge
  }
}

/**
 * @typedef {Map} GraphTraversalState `graphTraversalState` is shared state between search, result accumulation and
 * visiting functions. As such it must be used carefully. Ideally it is not necessary. If it is necessary then only
 * one function should modify it while the others read from it. That eliminates the need to think about order of
 * function application.
 */
/**
 * @typedef {Object} SearchSpecs
 * @property {function (Edge, EdgesPaths, Graph, GraphTraversalState) : Boolean} isGoalReached predicate which
 * assesses whether a sequence of edges realize the search goal, or if instead the search should continue
 * @property {function (Edge, EdgesPaths, Graph, GraphTraversalState) : Boolean} isTraversableEdge predicate which
 * examines whether a given edge should be traversed i.e. included in the search
 */
/**
 * @typedef {{path : EdgePath, edgesPathState:*}} EdgesPaths
 */
/**
 * @typedef {function (Result, EdgesPaths, GraphTraversalState, graph: Graph) : Result} ReducerResult
 */
/**
 * @typedef {{initialEdgesPathState:*, visitEdge : ReducerEdge}} VisitSpecs
 */
/**
 * @typedef {function (*, EdgePath, GraphTraversalState) : *} ReducerEdge
 */

/**
 * @typedef {*} Result
 */

/**
 * Starting from an initial edge, (brute-force) iteratively search the graph traversing edges which fulfill some
 * conditions (`isTraversableEdge`), till a goal is reached (`isGoalReached`).
 * Search results are accumulated via a provided reducer function (`addSearchResult`).
 * @param {{store: Store, traverse: {results : ReducerResult, search: SearchSpecs, visit : VisitSpecs}}} traversalSpecs
 * @param {Edge} startingEdge
 * @param {Graph} graph
 * @returns {*} the accumulated result of the searches
 */
export function searchGraphEdges(traversalSpecs, startingEdge, graph) {
  const { store, traverse } = traversalSpecs;
  const { empty: storeConstructor, add, isEmpty } = store;
  const { results, visit } = traverse;
  const { empty: resultConstructor } = results;
  const { initialEdgesPathState } = visit;

  const graphTraversalState = new Map();
  // NOTE : having a constructor allows to build non-JSON objects.
  const emptySearchResults = isFunction(resultConstructor) ? new (resultConstructor()) : resultConstructor;
  const emptyStore = isFunction(storeConstructor) ? new (storeConstructor()) : storeConstructor;
  // TODO : initialEdgesPathState = { inputSequence: [], noMoreInputs: false } to put in client function
  const initialEdgePaths = { path: [startingEdge], edgesPathState: initialEdgesPathState };

  let searchResults = emptySearchResults;
  let currentStore = add([initialEdgePaths], emptyStore);

  while ( !isEmpty(currentStore) ) {
    const {
      searchResults: newSearchResults,
      store: newStore
    } = traverseNext(searchResults, currentStore, graphTraversalState, traversalSpecs, graph);
    searchResults = newSearchResults;
    currentStore = newStore;
  }

  // Free the references to avoid possible memory leaks
  graphTraversalState.clear();

  return searchResults;
}

function traverseNext(searchResults, store, graphTraversalState, traversalSpecs, graph) {
  const { store: storeSpecs, traverse } = traversalSpecs;
  const { add, takeAndRemoveOne } = storeSpecs;
  const { results: resultsReducerSpecs, search, visit } = traverse;
  const { visitEdge } = visit;
  const { add: addSearchResult } = resultsReducerSpecs;
  const { isGoalReached, isTraversableEdge } = search;
  const { outgoingEdges: getOutgoingEdges, getEdgeTarget } = graph;

  // TODO :  write VisitEdge the last edge (even when given the whole array)
  // TODO make sure that edgePAthState or visitEdge has access to the transformed state machines and other
  const { popped: edgesPaths, newStore } = takeAndRemoveOne(store);
  const { path: edges, edgesPathState } = edgesPaths;
  const lastEdge = edges[edges.length - 1];
  edgesPaths.edgesPathState = visitEdge(edgesPathState, edges, graphTraversalState);

  if (!isTraversableEdge(lastEdge, edgesPaths, graph, graphTraversalState)) return { searchResults, newStore };
  if (isGoalReached(lastEdge, edgesPaths, graph, graphTraversalState)) {
    const newSearchResults = addSearchResult(searchResults, edgesPaths, graphTraversalState, graph);
    return { searchResults: newSearchResults, newStore }
  }
  else {
    const lastVertexOnEdgePath = getEdgeTarget(lastEdge);
    const outgoingEdges = getOutgoingEdges(lastVertexOnEdgePath);
    const newEdgesPaths = outgoingEdges.map(edge => {
      return {
        path: edges.concat([edge]),
        edgesPathState
      }
    });
    return { searchResults, store: add(newEdgesPaths, newStore) };
  }
}

/**
 *
 * @param {Map} traversalState
 * @param {Edge} edge
 * @returns
 * @modifies {traversalState}
 */
function updateVisitInTraversalState(traversalState, edge) {
  const edgeTraversalState = traversalState.get(edge);
  const timesVisited = edgeTraversalState.timesVisited;
  traversalState.set(
    edge,
    merge(edgeTraversalState, { timesVisited: timesVisited + 1 })
  );
}

export function breadthFirstTraverseGraphEdges(traverse, startingEdge, graph) {
  const traversalSpecs = {
    store: queueStore,
    traverse
  };

  return searchGraphEdges(traversalSpecs, startingEdge, graph);
}

// TODO : do also immutable store for depthFirstSearch!!
/**
 *
 * @param {FindPathSettings} settings
 * @param {Graph} graph
 * @param {Vertex} s origin vertex
 * @param {Vertex} t target vertex
 * @returns {Array}
 */
export function findPathsBetweenTwoVertices(settings, graph, s, t) {
  const { constructEdge } = graph;
  const { maxNumberOfTraversals } = settings;
  const startingEdge = [constructEdge(null, s)];
  const results = {
    empty: [],
    addSearchResult: (searchResults, edgesPaths, graphTraversalState, graph) => {
      return searchResults.concat([edgesPaths.path])
    }
  }
  const search = {
    isGoalReached: (lastEdge, edgesPaths, graph, graphTraversalState) => {
      const { getEdgeTarget } = graph;
      const lastPathVertex = getEdgeTarget(lastEdge);

      return lastPathVertex === t
    },
    isTraversableEdge: (lastEdge, edgesPaths, graph, graphTraversalState) => {
      // put here maximum number of traversal
      return computeTimesCircledOn(edgesPaths.path, lastEdge) < (maxNumberOfTraversals || 1)
    },
  };
  const visit = {
    // NOTE : visit does not do much as the information we want in this search is already kept in `edgesPaths.path`
    initialEdgesPathState: {},
    visitEdge: (edgesPathState, EdgePath, GraphTraversalState) => {
      return edgesPathState
    }
  };
  const traverse = { results, search, visit };

  const allFoundPaths = breadthFirstTraverseGraphEdges(traverse, startingEdge, graph);

  return allFoundPaths
}

// store = [{[constructEdge(null, s)], edge path state = }]
// while store is not empty
//   pop one edge path and edge path state
//   if !isTraversableEdge continue
//   if isGoalReached
//     update traversalState (reducer)
//   if !isGoalReached
//     foreach outgoing edges of target vertex(edge path)
//       push the {edge path [edge, outgoing edge], updated edgePathState (reducer with edge)}
//     end foreach
// end while

// be careful to compute isTraversableEdge only once, mmm might have to rather compute false || value instead of
// Boolean not to compute twice. So rather call it traverseEdge returns false || something? I can use in the reducer?


// isTraversableEdge is : - test_criteria pass && generator can generate
// I need in settings :
// - traced fsm
// - map generator vs. control state and transition
// - reducer edge path state:: edgePathState -> traversalState -> popped edge or what else? -> edgePathState
// - reducer traversal state:: visitAcc -> traversalState -> popped edge -> visitAcc (and maybe modif traversalState)
// the reducer traversal state is what will be returned by the find!!
// NOTE : traversalState is for possible communication between reducers, otherwise not used
// the edge path state here will be:
// - input sequence
// - isNoInput basically if the generator could not generate inputs, so we can use it for isTraversableEdge!!!
// edge path state reducer will :
// - add input generated by generator to input sequence
// traversal state will have to hold the final input sequence generated, and the output sequence

/**
 * @typedef {Object} Edge Edge must be an object (we use referential equality so this is to avoid surprises with
 * equality of native types)
 */
/**
 * @typedef {Array<Edge>} EdgePath
 */
/**
 * @typedef {Object} Vertex Vertices must be an object (we use referential equality so this is to avoid surprises with
 * equality of native types)
 */
/**
 * @typedef {{allFoundPaths : Array<EdgePath>}} TraversalState
 */
/**
 * @typedef {Object} EdgeADT
 * @property {function(Edge) : Vertex} getEdgeTarget
 * @property {function(Edge) : Vertex} getEdgeOrigin
 * @property {function(Vertex, Vertex) : Edge} constructEdge
 */
/**
 * @typedef {Object} Graph
 * @property {function (Vertex) : Array<Edge>} outgoingEdges
 * @property {function (Vertex) : Array<Edge>} incomingEdges
 * @property {function (Vertex) : Array<Vertex>} getNeighbours
 * @property {function (Vertex) : Array<Vertex>} vertices
 * @property {function (Vertex) : Array<Vertex>} edges
 * @property {function (Vertex) : Array<Vertex>} settings
 * @property {function (Edge) : Vertex} getEdgeOrigin
 * @property {function (Edge) : Vertex} getEdgeTarget
 * @property {function(Vertex, Vertex) : Edge} constructEdge
 * @property {function (Vertex) : ()} showVertex
 * @property {function (Vertex) : ()} showEdge
 */
/**
 * @typedef {Object} FindPathSettings
 * @property {Number} [maxNumberOfTraversals=1] a number greater or equal to 0. Set to 1 by default
 */
/**
 * @typedef {Object} Store
 * @property {*} empty empty store or constructor for an empty store
 * @property {function (Array<>, Store) : ()} add adds values into a store
 * @property {function (Store) : *} takeAndRemoveOne empty store. removes one value from the store and returns that
 * value
 * @property {function (Store): Boolean} isEmpty predicate which returns true iff the store is empty
 */
