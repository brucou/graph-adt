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
 * @property {String} [strategy='BFS'] search strategy : depth-first or breadth-first (default)
 */
/**
 * @typedef {Object} Store
 * @property {*} empty empty store or constructor for an empty store
 * @property {function (Array<>, Store) : ()} add adds values into a store
 * @property {function (Store) : *} takeAndRemoveOne empty store. removes one value from the store and returns that
 * value
 * @property {function (Store): Boolean} isEmpty predicate which returns true iff the store is empty
 */

/**
 * @typedef {Map} GraphTraversalState `graphTraversalState` is shared state between search, result accumulation and
 * visiting functions. As such it must be used carefully. Ideally it is not necessary. If it is necessary then only
 * one function should modify it while the others read from it. That eliminates the need to think about order of
 * function application.
 */
/**
 * @typedef {Object} SearchSpecs
 * @property {function (Edge, Graph, PathTraversalState, GraphTraversalState) : {graphTraversalState : GraphTraversalState, isGoalReached : Boolean} } evaluateGoal predicate which assesses whether a given goal is reached, or if instead the search should continue. To assess the goal, the provided information is the edge being visited, and the current edge traversal state (roughly the sequence of edges visited so far).
 * @property {*} initialGoalEvalState seed for the reducer associated to goal evaluation
 */
/**
 * @typedef {*} PathTraversalState
 */
/**
 * @typedef {function (Result, Graph, PathTraversalState, GraphTraversalState ) : Result} ReducerResult
 */
/**
 * @typedef {{initialPathTraversalState:*, visitEdge : ReducerEdge}} VisitSpecs
 */
/**
 * @typedef {function (Edge, Graph, PathTraversalState, GraphTraversalState) : {isTraversableEdge :Boolean,  pathTraversalState:PathTraversalState}} ReducerEdge
 * function which visit the edge, updates the state of the edge traversal, and evaluates if the visited edge
 * should be included in the search (`isTraversableEdge` set to true) or not.
 */
/**
 * @typedef {*} Result
 */
