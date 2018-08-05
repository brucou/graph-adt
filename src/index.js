import { getLastVertexInPath, isEdgeInEdgePath, isVertexEqual } from "./helpers"

export * from './types'
export * from './properties'
export * from './helpers'

export function findPaths(settings, s, t, graph) {
  return findEdgesPaths(settings, [s], t, graph, { edgesVisited: new Map(), allFoundPaths: [] })
}

/**
 * Prints all paths which end in t and can be obtained by adding vertices to path `edgePath`
 * @param edgePath
 * @param t
 * @param graph
 * @param {FindPathSettings} settings
 * @param {TraversalState} traversalState
 * @return {Array}
 */
function findEdgesPaths(settings, edgePath, t, graph, traversalState) {
  const lastVertexInPath = getLastVertexInPath(graph, edgePath);
  const { maxNumberOfCircleTraversal } = settings;
  const { edgesVisited } = traversalState;
  const { getOutgoingEdges } = graph;

  getOutgoingEdges(lastVertexInPath).forEach(edge => {
    if (isEdgeInEdgePath(edgePath, edge)) {
      const timesCircledOn = edgesVisited.get(edge).timesCircledOn;
      edgesVisited.set(edge, { timesCircledOn: timesCircledOn + 1 });

      if (timesCircledOn + 1 >= maxNumberOfCircleTraversal) {
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

  return traversalState.allFoundPaths
}

function addPaths(settings, edgePath, t, graph, traversalState, edge) {
  const { getEdgeTarget } = graph;
  const newPath = edgePath.concat(edge);
  const edgeTarget = getEdgeTarget(edge);

  if (isVertexEqual(edgeTarget, t)) {
    traversalState.allFoundPaths = traversalState.allFoundPaths.concat([newPath]);
  }
  else {
    traversalState.allFoundPaths = traversalState.allFoundPaths.concat(findEdgesPaths(settings, newPath, t, graph, traversalState))
  }
}

/**
 *
 * @param {Array<Edge>} edges
 * @param vertices
 * @return {{outgoingEdges}}
 * @param {Graph} settings
 * CONTRACT : cannot have in vertices two equal (referential equality) vertices
 */
export function constructGraph(settings, edges, vertices) {
  const { getEdgeTarget, getEdgeOrigin } = settings;
  const vertexMap = new WeakMap();
  const edgeMap = new WeakMap();
  const outgoingEdges = new WeakMap();
  const incomingEdges = new WeakMap();

  // NOTE : we associated a numerical index to each vertex and edge.
  // This will be used for labelling or displaying purposes
  vertices.forEach((vertex, index) => vertexMap.set(vertex, index));
  edges.forEach((edge, index) => {
    edgeMap.set(edge, index);

    const s = getEdgeOrigin(edge);
    const t = getEdgeTarget(edge);
    const outgoingEdgeList = outgoingEdges.get(s) || [];
    const incomingEdgeList = outgoingEdges.get(s) || [];
    outgoingEdges.set(s, outgoingEdgeList.concat([edge]));
    incomingEdges.set(t, incomingEdgeList.concat([edge]));
  });

  return {
    outgoingEdges: (vertex) => outgoingEdges.get(vertex) || [],
    incomingEdges: (vertex) => incomingEdges.get(vertex) || [],
    // NOTE : reuses `toString` method of Vertex
    showVertex: (vertex) => `Vertex #${vertexMap.get(vertex)} : ${vertex}`,
    showEdge: (edge) => `Edge #${vertexMap.get(edge)} : ${edge}`,
    vertices,
    edges,
    getEdgeTarget,
    getEdgeOrigin
  }
}

