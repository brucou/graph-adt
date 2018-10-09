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
  const { getEdgeTarget, getEdgeOrigin } = settings;
  // NOTE: we need a map, because weak map does not accept string, and for our use cases, we need to use string vertices
  const vertexMap = new Map();
  const edgeMap = new WeakMap();
  const outgoingEdges = new Map();
  const incomingEdges = new Map();

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
    clear : () => {vertexMap.clear(); outgoingEdges.clear(); incomingEdges.clear()}
  }
}

/**
 * Starting from an initial edge, (brute-force) iteratively search the graph traversing edges which fulfill some
 * conditions (`isTraversableEdge`), till a goal is reached (`isGoalReached`).
 * Search results are accumulated via a provided reducer function (`addSearchResult`).
 * @param {{store: Store, search: SearchSpecs, visit : VisitSpecs}} traversalSpecs
 * @param {Vertex} startingVertex
 * @param {Graph} graph
 * @returns {*} the accumulated result of the searches
 */
export function searchGraphEdges(traversalSpecs, startingVertex, graph) {
  const {outgoingEdges} = graph;
  const { store, visit, search } = traversalSpecs;
  const { empty: storeConstructor, add, isEmpty } = store;
  const { initialPathTraversalState } = visit;
  const { initialGoalEvalState, showResults } = search;
  let searchResults;

  // NOTE : having a constructor allows to build non-JSON objects.
  let graphTraversalState = initializeState(initialGoalEvalState);
  const emptyStore = initializeState(storeConstructor);
  const initialStoreValues = outgoingEdges(startingVertex).map(edge => {
    return { edge, pathTraversalState: initializeState(initialPathTraversalState) }
  })
  let currentStore = add(initialStoreValues, emptyStore);

  while ( !isEmpty(currentStore) ) {
    const {
      graphTraversalState: newGraphTraversalState,
      store: newStore
    } = traverseNext(currentStore, traversalSpecs, graph, graphTraversalState);
    currentStore = newStore;
    graphTraversalState = newGraphTraversalState;
  }

  // NOTE : We do not have the possibility to clear ressources for the state we have created for each reducer
  // function to manipulate. If possible, to avoid memory leaks, use `WeakMap` instead of `Map`, etc.
  return showResults(graphTraversalState)
}

function traverseNext(store, traversalSpecs, graph, graphTraversalState) {
  const { store: storeSpecs, search, visit } = traversalSpecs;
  const { add, takeAndRemoveOne } = storeSpecs;
  const { visitEdge } = visit;
  const { evaluateGoal } = search;
  const { outgoingEdges: getOutgoingEdges, getEdgeTarget } = graph;

  const { popped: edgeAndPaths, newStore } = takeAndRemoveOne(store);
  const { edge, pathTraversalState } = edgeAndPaths;
  const {
    pathTraversalState: newPathTraversalState,
    isTraversableEdge
  } = visitEdge(edge, graph, pathTraversalState, graphTraversalState);

  if (!isTraversableEdge) {
    return { graphTraversalState, store: newStore }
  }

  const {
    isGoalReached,
    graphTraversalState: newGraphTraversalState,
  } = evaluateGoal(edge, graph, newPathTraversalState, graphTraversalState);
  if (isGoalReached) {
    return { graphTraversalState: newGraphTraversalState, store: newStore }
  }
  else {
    const lastVertexOnEdgePath = getEdgeTarget(edge);
    const outgoingEdges = getOutgoingEdges(lastVertexOnEdgePath);
    const newEdgesPaths = outgoingEdges.map(edge => ({ edge: edge, pathTraversalState: newPathTraversalState }));

    return { graphTraversalState: newGraphTraversalState, store: add(newEdgesPaths, newStore) };
  }
}

export function breadthFirstTraverseGraphEdges(search, visit, startingVertex, graph) {
  const traversalSpecs = {
    store: queueStore,
    search,
    visit
  };

  return searchGraphEdges(traversalSpecs, startingVertex, graph);
}

export function depthFirstTraverseGraphEdges(search, visit, startingVertex, graph) {
  const traversalSpecs = {
    store: stackStore,
    search,
    visit
  };

  return searchGraphEdges(traversalSpecs, startingVertex, graph);
}

/**
 *
 * @param {FindPathSettings} settings
 * @param {Graph} graph
 * @param {Vertex} s origin vertex
 * @param {Vertex} t target vertex
 * @returns {Array}
 */
export function findPathsBetweenTwoVertices(settings, graph, s, t) {
  const { maxNumberOfTraversals, strategy } = settings;
  const search = {
    initialGoalEvalState: { results: [] },
    showResults : graphTraversalState => graphTraversalState.results,
    evaluateGoal: (edge, graph, pathTraversalState, graphTraversalState) => {
      const { results } = graphTraversalState;
      const { getEdgeTarget, getEdgeOrigin } = graph;
      const lastPathVertex = getEdgeTarget(edge);
      // Edge case : accounting for initial vertex
      const vertexOrigin = getEdgeOrigin(edge);

      const isGoalReached = vertexOrigin ? lastPathVertex === t : false;

      const newResults = isGoalReached
        ? results.concat([pathTraversalState.path])
        : results;
      const newGraphTraversalState = { results: newResults };

      return {
        isGoalReached,
        graphTraversalState: newGraphTraversalState
      }
    },
  };
  const visit = {
    // NOTE : visit does not do much as the information we want in this search is already kept in `edgesPaths.path`
    initialPathTraversalState: { path: [] },
    visitEdge: (edge, graph, pathTraversalState, graphTraversalState) => {
      return {
        pathTraversalState: { path: pathTraversalState.path.concat([edge]) },
        isTraversableEdge: computeTimesCircledOn(pathTraversalState.path, edge) < (maxNumberOfTraversals || 1)
      }
    }
  };
  const traversalImpl = {
    [BFS]: breadthFirstTraverseGraphEdges,
    [DFS]: depthFirstTraverseGraphEdges
  };

  const allFoundPaths = traversalImpl[strategy || BFS](search, visit, s, graph);

  return allFoundPaths
}

export const ALL_PATHS_LIMITED_TO_N_LOOPS = ({maxNumberOfTraversals, targetVertex}) => ({
  isTraversableEdge: (edge, graph, pathTraversalState, graphTraversalState) => {
    return computeTimesCircledOn(pathTraversalState.path, edge) < (maxNumberOfTraversals || 1)
  },
  isGoalReached: (edge, graph, pathTraversalState, graphTraversalState) => {
    const { getEdgeTarget, getEdgeOrigin } = graph;
    const lastPathVertex = getEdgeTarget(edge);
    // Edge case : accounting for initial vertex
    const vertexOrigin = getEdgeOrigin(edge);

    const isGoalReached = vertexOrigin ? lastPathVertex === targetVertex : false;
    return isGoalReached
  }
});
