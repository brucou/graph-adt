import { BFS, computeTimesCircledOn, DFS, initializeState, print, queueStore, stackStore } from "./helpers"

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
  const { store, traverse } = traversalSpecs;
  const { empty: storeConstructor, add, isEmpty } = store;
  const { results, visit, search } = traverse;
  const { empty: resultConstructor } = results;
  const { initialPathTraversalState } = visit;
  const { initialGoalEvalState } = search;

  // NOTE : having a constructor allows to build non-JSON objects.
  const graphTraversalState = initializeState(initialGoalEvalState);
  const emptySearchResults = initializeState(resultConstructor);
  const emptyStore = initializeState(storeConstructor);
  const initialStoreValue = { edge: startingEdge, pathTraversalState: initializeState(initialPathTraversalState) };
  let searchResults = emptySearchResults;
  let currentStore = add([initialStoreValue], emptyStore);
  debugger
  while ( !isEmpty(currentStore) ) {
    const {
      searchResults: newSearchResults,
      store: newStore
    } = traverseNext(searchResults, currentStore, traversalSpecs, graph, graphTraversalState);
    searchResults = newSearchResults;
    currentStore = newStore;
  }

  // NOTE : We do not have the possibility to clear ressources for the state we have created for each reducer
  // function to manipulate. If possible, to avoid memory leaks, use `WeakMap` instead of `Map`, etc.
  return searchResults;
}

function traverseNext(searchResults, store, traversalSpecs, graph, graphTraversalState) {
  const { store: storeSpecs, traverse } = traversalSpecs;
  const { add, takeAndRemoveOne } = storeSpecs;
  const { results: resultsReducerSpecs, search, visit } = traverse;
  const { visitEdge } = visit;
  const { add: addSearchResult } = resultsReducerSpecs;
  const { initialEvaluation, evaluateGoal } = search;
  const { outgoingEdges: getOutgoingEdges, getEdgeTarget } = graph;

  // TODO :  write VisitEdge the last edge (even when given the whole array)
  const { popped: edgeAndPaths, newStore } = takeAndRemoveOne(store);
  const { edge, pathTraversalState } = edgeAndPaths;
  const {
    pathTraversalState  : newPathTraversalState,
    isTraversableEdge
  } = visitEdge(edge, graph, pathTraversalState, graphTraversalState);

  if (!isTraversableEdge) {
    return { searchResults, store: newStore }
  }

  const { isGoalReached, graphTraversalState: newGraphTraversalState } = evaluateGoal(edge, graph, newPathTraversalState, graphTraversalState);
  if (isGoalReached) {
    const newSearchResults = addSearchResult(searchResults, graph, newPathTraversalState, newGraphTraversalState);

    return { searchResults: newSearchResults, store: newStore }
  }
  else {
    const lastVertexOnEdgePath = getEdgeTarget(edge);
    const outgoingEdges = getOutgoingEdges(lastVertexOnEdgePath);
    const newEdgesPaths = outgoingEdges.map(edge => ({ edge: edge, pathTraversalState: newPathTraversalState }));

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
  };
  const search = {
    initialGoalEvalState : {},
    evaluateGoal : (edge, graph, pathTraversalState, graphTraversalState) => {
      const { getEdgeTarget, getEdgeOrigin } = graph;
      const lastPathVertex = getEdgeTarget(edge);
      // Edge case : accounting for initial vertex
      const vertexOrigin = getEdgeOrigin(edge);

      return {
        isGoalReached: vertexOrigin ? lastPathVertex === t : false,
        graphTraversalState
      }
    },
  };
  const visit = {
    // NOTE : visit does not do much as the information we want in this search is already kept in `edgesPaths.path`
    initialPathTraversalState: { path: [] },
    visitEdge: (edge, graph, pathTraversalState, graphTraversalState) => {
      return {
        pathTraversalState : {path: pathTraversalState.path.concat([edge])},
        isTraversableEdge : computeTimesCircledOn(pathTraversalState.path, edge) < (maxNumberOfTraversals || 1)
      }
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
