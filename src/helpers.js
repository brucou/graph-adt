/**
 *
 * @param {Vertex} s
 * @param {Vertex} t
 * @returns {boolean}
 */
export function isVertexEqual(s, t) {
  // NOTE : we use referential equality because we never touch the vertices (or does our client do?) Be careful with
  // that. In our FSM context, our vertex are control states, we do not touch that so we are fine.
  return s === t
}

/**
 *
 * @param {Graph} graph
 * @param {EdgePath} edgePath
 * @returns {*}
 */
export function getLastVertexInPath(graph, edgePath) {
  const { getEdgeTarget, constructEdge} = graph;
  const lastEdge = edgePath[edgePath.length - 1];

  return getEdgeTarget(lastEdge)
}

export function isEdgeInEdgePath(edgePath, edge) {
  return edgePath.includes(edge)
}

export function print(obj) {
  if (obj.print && typeof obj.print === 'function') {
    return obj.print(obj)
  }
  else {
    return JSON.stringify(obj)
  }
}
