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
 * @property {function () : ()} clear free any resources that was used
 */
/**
 * @typedef {Object} FindPathSettings
 * @property {Number} [maxNumberOfTraversals=1] a number greater or equal to 0. Set to 1 by default
 * @property {String} [strategy='BFS'] search strategy : depth-first or breadth-first (default)
 */
/**
 * @typedef {() => Store<P>} StoreFactory Store constructor
 * @constructor
 */
/**
 * @typedef {Object} StoreInterface
 * @property {Store<P> | StoreFactory} empty empty store or constructor for an empty store
 * @property {function (Array<P>, Store<P>) : Store<P>} add adds a list of values into a store
 * @property {function (Store<P>) : {popped, newStore: Store<P>}} takeAndRemoveOne empty store. removes one value
 * from the store and returns that value and the new store without that value
 * @property {function (Store<P>): Boolean} isEmpty predicate which returns true iff the store is empty
 * @template P
 */

/**
 * @typedef {Map} GraphTraversalState `graphTraversalState` is shared state between search, result accumulation and
 * visiting functions. As such it must be used carefully. Ideally it is not necessary. If it is necessary then only
 * one function should modify it while the others read from it. That eliminates the need to think about order of
 * function application.
 */
/**
 * @typedef {{value:*, isProduced:Boolean}} SearchOutput
 */
/**
 * @typedef {Object} SearchSpecs
 * @property {function (Edge, Graph, PathTraversalState, GraphTraversalState) : {graphTraversalState : GraphTraversalState, isGoalReached : Boolean, output: SearchOutput} } evaluateGoal predicate which assesses whether a given goal is reached, or if instead the search should continue. To assess the goal, the provided information is the edge being visited, and the current edge traversal state (roughly the sequence of edges visited so far). If the goal is reached, this means we have some results for the search, and those results are aggregated somewhere in the graph traversal state for posterior extraction through `showResults`.
 * @property {*} initialGoalEvalState seed for the reducer associated to goal evaluation
 * @property {function (GraphTraversalState) : Search<Result>} showResults returns the accumulated results which
 * have been stored in the graph traversal state
 */
/**
 * @typedef {*} PathTraversalState
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
