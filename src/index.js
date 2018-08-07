import { getLastVertexInPath, isEdgeInEdgePath, isVertexEqual, print } from "./helpers"

export * from './types'
export * from './properties'
export * from './helpers'

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
  const traversalState = { edgesVisited: new Map(), allFoundPaths: [] };
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
  const { edgesVisited } = traversalState;
  const { outgoingEdges } = graph;

  outgoingEdges(lastVertexInPath).forEach(edge => {
    if (!edgesVisited.has(edge)) {
      edgesVisited.set(edge, {})
    }
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

