import { clone, getLastVertexInPath, isEdgeInEdgePath, isVertexEqual, merge, print } from "./helpers"

export * from './types'
export * from './properties'
export * from './helpers'
export * from './types'

///// Utility functions
// Cheap cloning, which is enough for our needs : we only clone seeds and empty values, which are generally simple
// objects

/**
 *
 * @param {FindPathSettings} settings
 * @param {Vertex} s
 * @param {Vertex} t
 * @param {Graph} graph
 * @returns {Array}
 */
export function findPaths(settings, s, t, graph) {
  const { constructEdge } = graph;
  const traversalState = { allFoundPaths: [] };
  findEdgesPaths(settings, [constructEdge(null, s)], t, graph, traversalState);

  return traversalState.allFoundPaths
}

/**
 * Prints all paths which end in t and can be obtained by adding vertices to path `edgePath`
 * @param {EdgePath} edgePath
 * @param {Vertex} t
 * @param {Graph} graph
 * @param {FindPathSettings} settings
 * @param {TraversalState} traversalState
 * @return {Array}
 */
function findEdgesPaths(settings, edgePath, t, graph, traversalState) {
  const lastVertexInPath = getLastVertexInPath(graph, edgePath);
  const { maxNumberOfTraversals } = settings;
  const { outgoingEdges } = graph;

  outgoingEdges(lastVertexInPath).forEach(edge => {
    if (isEdgeInEdgePath(edgePath, edge)) {
      const timesCircledOn = edgePath.reduce((acc, edgeInEdgePath) => edgeInEdgePath === edge ? acc + 1 : acc, 0);

      if (timesCircledOn >= (maxNumberOfTraversals || 1)) {
        // No more circling on that edge, there is no path here to be added
      }
      else {
        addPaths(settings, edgePath, t, graph, traversalState, edge)
      }
    }
    else {
      addPaths(settings, edgePath, t, graph, traversalState, edge)
    }
  });
}

function addPaths(settings, edgePath, t, graph, traversalState, edge) {
  const { getEdgeTarget } = graph;
  const newPath = edgePath.concat(edge);
  const edgeTarget = getEdgeTarget(edge);

  if (isVertexEqual(edgeTarget, t)) {
    traversalState.allFoundPaths = traversalState.allFoundPaths.concat([newPath]);
  }
  else {
    findEdgesPaths(settings, newPath, t, graph, traversalState)
  }
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
 *
 * @param {{store: Store, traverse: {visit, startingEdge, pickTraversableEdges, seed}}} traversalSpecs
 * @param {Graph} graph
 * @returns {*} the accumulated result of the visit while traversing
 */
export function visitGraphEdges(traversalSpecs, graph) {
  const { store, traverse } = traversalSpecs;
  const { empty: emptyOrEmptyConstructor, add, takeAndRemoveOne, isEmpty } = store;
  const { outgoingEdges: getOutgoingEdges } = graph;
  const { seed: seedOrSeedConstructor, visit, startingEdge, pickTraversableEdges, } = traverse;

  // CONTRACT : startingEdge must be in edge array
  if (!graph.edges.includes(startingEdge)) throw `visitGraphEdges : startingEdge must be in edge array!`

  const graphTraversalState = new Map();
  // NOTE : This allows to have seeds which are non-JSON objects, such as new Map(). We force a new here to make
  // sure we have an object that cannot be modified out of the scope of visitTree and collaborators
  const seed = (typeof seedOrSeedConstructor === 'function')
    ? new (seedOrSeedConstructor())
    : clone(seedOrSeedConstructor);
  const emptyStore = (typeof emptyOrEmptyConstructor === 'function')
    ? new (emptyOrEmptyConstructor())
    : clone(emptyOrEmptyConstructor);

  let currentStore = emptyStore;
  let visitAcc = seed;
  add([startingEdge], currentStore);
  // NOTE : having the number of times an edge is visited is so common in many algorithm
  // that we include it here de facto.
  graphTraversalState.set(startingEdge, { timesVisited: 0 });

  while ( !isEmpty(currentStore) ) {
    const edge = takeAndRemoveOne(currentStore);
    const outgoingEdges = getOutgoingEdges(edge);
    const newEdgesToTraverse = pickTraversableEdges(outgoingEdges, graphTraversalState, graph);

    add(newEdgesToTraverse, currentStore);
    visitAcc = visit(visitAcc, graphTraversalState, edge, graph);
    updateVisitInTraversalState(graphTraversalState, edge);
  }

  // Free the references to the tree/subtrees
  graphTraversalState.clear();

  return visitAcc;
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

export function breadthFirstTraverseGraphEdges(traverse, graph) {
  const traversalSpecs = {
    store: {
      empty: [],
      takeAndRemoveOne: store => store.shift(),
      isEmpty: store => store.length === 0,
      add: (subTrees, store) => store.push.apply(store, subTrees)
    },
    traverse
  };

  return visitGraphEdges(traversalSpecs, graph);
}
