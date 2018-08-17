import { BFS, computeTimesCircledOn, DFS, isFunction, print, queueStore, stackStore } from "./helpers"

export * from './types'
export * from './properties'
export * from './helpers'
export * from './types'

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
 * Starting from an initial edge, (brute-force) iteratively search the graph traversing edges which fulfill some
 * conditions (`isTraversableEdge`), till a goal is reached (`isGoalReached`).
 * Search results are accumulated via a provided reducer function (`addSearchResult`).
 * @param {{store: Store, traverse: {results : ReducerResult, search: SearchSpecs, visit : VisitSpecs}}} traversalSpecs
 * @param {Edge} startingEdge
 * @param {Graph} graph
 * @returns {*} the accumulated result of the searches
 */
export function searchGraphEdges(traversalSpecs, startingEdge, graph) {
  // TODO : API put graphTraversalState always last arg, I hardly ever use it
  const { store, traverse } = traversalSpecs;
  const { empty: storeConstructor, add, isEmpty } = store;
  const { results, visit } = traverse;
  const { empty: resultConstructor } = results;
  const { initialPathTraversalState } = visit;

  const graphTraversalState = new Map();
  // NOTE : having a constructor allows to build non-JSON objects.
  const emptySearchResults = isFunction(resultConstructor) ? new (resultConstructor()) : resultConstructor;
  const emptyStore = isFunction(storeConstructor) ? new (storeConstructor()) : storeConstructor;
  const initialStoreValue = {edge : startingEdge, pathTraversalState : initialPathTraversalState}
  let searchResults = emptySearchResults;
  let currentStore = add([initialStoreValue], emptyStore);
debugger
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
  const { popped: edgeAndPaths, newStore } = takeAndRemoveOne(store);
  const { edge, pathTraversalState } = edgeAndPaths;
  const newPathTraversalState = visitEdge(edge, pathTraversalState, graphTraversalState);

  if (!isTraversableEdge(edge, graph, newPathTraversalState, graphTraversalState)) {
    return { searchResults, store: newStore }
  }
  if (isGoalReached(edge, graph, newPathTraversalState, graphTraversalState)) {
    const newSearchResults = addSearchResult(searchResults, graph, newPathTraversalState, graphTraversalState);

    return { searchResults: newSearchResults, store: newStore }
  }
  else {
    const lastVertexOnEdgePath = getEdgeTarget(edge);
    const outgoingEdges = getOutgoingEdges(lastVertexOnEdgePath);
    const newEdgesPaths = outgoingEdges.map(edge => ({ edge: edge, pathTraversalState : newPathTraversalState }));

    return { searchResults, store: add(newEdgesPaths, newStore) };
  }
}

export function breadthFirstTraverseGraphEdges(traverse, startingEdge, graph) {
  const traversalSpecs = {
    store: queueStore,
    traverse
  };

  return searchGraphEdges(traversalSpecs, startingEdge, graph);
}

export function depthFirstTraverseGraphEdges(traverse, startingEdge, graph) {
  const traversalSpecs = {
    store: stackStore,
    traverse
  };

  return searchGraphEdges(traversalSpecs, startingEdge, graph);
}

// DOC : with this algorithm, traversing a graph like in
// https://stackoverflow.com/questions/36488968/post-order-graph-traversal will leave the vertex 3 unscanned!

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
  const { maxNumberOfTraversals, strategy } = settings;
  const startingEdge = constructEdge(null, s);
  const results = {
    empty: [],
    add: (searchResults, graph, pathTraversalState, graphTraversalState) => {
      return searchResults.concat([pathTraversalState.path])
    }
  }
  const search = {
    isGoalReached: (edge, graph, pathTraversalState, graphTraversalState) => {
      const { getEdgeTarget, getEdgeOrigin } = graph;
      const lastPathVertex = getEdgeTarget(edge);
      // Edge case : acounting for initial vertex
      const vertexOrigin = getEdgeOrigin(edge);

      return vertexOrigin ? lastPathVertex === t : false
    },
    isTraversableEdge: (edge, graph, pathTraversalState, graphTraversalState) => {
      return computeTimesCircledOn(pathTraversalState.path, edge) <= (maxNumberOfTraversals || 1)
    },
  };
  const visit = {
    // NOTE : visit does not do much as the information we want in this search is already kept in `edgesPaths.path`
    initialPathTraversalState: {path : []},
    visitEdge: (edge, pathTraversalState, graphTraversalState) => {
      return { path: pathTraversalState.path.concat([edge]) }
    }
  };
  const traverse = { results, search, visit };
  const traversalImpl = {
    [BFS]: breadthFirstTraverseGraphEdges,
    [DFS]: depthFirstTraverseGraphEdges
  };

  const allFoundPaths = traversalImpl[strategy || BFS](traverse, startingEdge, graph);

  return allFoundPaths
}
