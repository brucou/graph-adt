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
 * @typedef {{allFoundPaths : Array<EdgePath>}} TraversalState
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
 * @property {function (Edge, EdgesPaths, Graph, GraphTraversalState) : Boolean} isGoalReached predicate which
 * assesses whether a sequence of edges realize the search goal, or if instead the search should continue
 * @property {function (Edge, EdgesPaths, Graph, GraphTraversalState) : Boolean} isTraversableEdge predicate which
 * examines whether a given edge should be traversed i.e. included in the search
 */
/**
 * @typedef {{path : EdgePath, edgesPathState:*}} EdgesPaths
 */
/**
 * @typedef {function (Result, EdgesPaths, GraphTraversalState, graph: Graph) : Result} ReducerResult
 */
/**
 * @typedef {{initialEdgesPathState:*, visitEdge : ReducerEdge}} VisitSpecs
 */
/**
 * @typedef {function (*, EdgePath, GraphTraversalState) : *} ReducerEdge
 */
/**
 * @typedef {*} Result
 */
