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

export function isFunction(obj){
  return typeof obj === 'function'
}

export function clone(a) {
  return a === undefined ? undefined : JSON.parse(JSON.stringify(a))
}

export function merge(objA, objB) {
  return Object.assign({}, objA, objB);
}

export function computeTimesCircledOn(edgePath, edge) {
  return edgePath.reduce((acc, edgeInEdgePath) => edgeInEdgePath === edge ? acc + 1 : acc, 0);
}

export function shouldEdgeBeTraversedYetAgain(settings, graph, t, edgePath, edge) {
  const {maxNumberOfTraversals } = settings;
  return (
    !isEdgeInEdgePath(edgePath, edge) ||
    computeTimesCircledOn(edgePath, edge) < (maxNumberOfTraversals || 1)
  )
}

export function isTargetEdgeReached(settings, graph, edgePath, t, edge){
  const {getEdgeTarget} = graph;

  return isVertexEqual(getEdgeTarget(edge), t)
}

export const queueStore = {
  empty: [],
  takeAndRemoveOne: store => ({popped : store[0], newStore: store.slice(1)}),
  isEmpty: store => store.length === 0,
  add: (subTrees, store) => store.concat(subTrees)
}

export const stackStore = {
  empty: [],
  takeAndRemoveOne: store => ({popped : store[0], newStore: store.slice(1)}),
  isEmpty: store => store.length === 0,
  // NOTE : vs. bfs, only `add` changes
  add: (subTrees, store) => subTrees.concat(store)
};

export const BFS = 'BFS'
export const DFS = 'DFS'
