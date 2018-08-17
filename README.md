# Motivation
We had trouble finding a library for graph data structure which addresses our requirements. The 
principal need and motivator for now is model-based testing (MBT): a reactive system is modelled 
as a state-machine, which itself can be modelled as a [multigraph](https://en.wikipedia.org/wiki/Multigraph). We could not find libraries which can handle multigraphs. To generate 
input sequences for model testing, we need to examine the associated graph in a certain number 
of ways. This library aims at gathering such ways.

As such it is not and does not intend to be a all-purpose graph manipulation library. It just has
 what we need for model-based testing. Typically, the model coverage criteria used in MBT for 
 transition-based models are :
 
 - **all paths:** Every path traversed at
                 least once (exhaustive
                 testing of control structure) 
   - **all transition pairs:** Every pair of adjacent
                                transitions traversed
                                at least once 
     - **all transitions:** Every transition of
                             the model traversed
                             at least once
   - **all states:** Every state is visited
                      at least once 
   - **all one-loop paths:** Visit all the loop-free
                            paths plus all the
                            paths that loop once 
     - **all round trips:** Test each loop
                             (iterate only once),
                             but no need to check
                             all paths preceding or following a loop
                             (transition coverage
                             required) 
     - **all loop-free paths:** Every loop-free (no
                                 repetition of config/
                                 states) path traversed
                                 at least once   
 
 We currently offer :
 
 - enumeration of all edge paths between two vertices, with a configurable maximum for edge 
 repetition
 - generic BFS and DFS graph **edge** search, which can be customized to implement some of the 
 criteria presented thereabove

This was chosen for pragmatic reasons. From this included algorithm, it is possible to implement 
most of the above-mentioned coverage criteria.
 
# API
## Types
```javascript
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
 * @property {function (Edge, Graph, PathTraversalState, GraphTraversalState) : Boolean} isGoalReached predicate which
 * assesses whether a sequence of edges realize the search goal, or if instead the search should continue
 * @property {function (Edge, Graph, PathTraversalState, GraphTraversalState) : Boolean} isTraversableEdge predicate which
 * examines whether a given edge should be traversed i.e. included in the search
 */
/**
 * @typedef {{path : EdgePath, edgesPathState:*}} PathTraversalState
 */
/**
 * @typedef {function (Result, Graph, PathTraversalState, GraphTraversalState ) : Result} ReducerResult
 */
/**
 * @typedef {{initialPathTraversalState:*, visitEdge : ReducerEdge}} VisitSpecs
 */
/**
 * @typedef {function (PathTraversalState, Edge, GraphTraversalState) : *} ReducerEdge
 */
/**
 * @typedef {*} Result
 */
```

## Contracts
Both edges and vertices must be objects! The good behaviour of the library is not guaranteed for 
edges or vertices having native types.

## constructGraph :: EdgeADT -> Array<Edge> -> Array<Vertex> -> Graph
A graph is constructed from its array of edges and its vertices. An edge itself must contain two 
vertices. A vertex can be anything.

A complete description should be :

- V a set of vertices or nodes,
- A a set of edges or lines,
-  `source :: e -> V`, assigning to each edge its source node,
-  `target :: e -> V`, assigning to each edge its target node.

In order to keep the maximum generality, we are not imposing a concrete data structure for edges.
 This however means that the user must provide concrete realization for the edge abstract data
  type. This includes in particular the two lensing functions, which return the origin and target
   vertices for any given edge.

The array of vertices is mandatory, and must contain any and every vertex part of the graph. This
 means in particular that no edge can be based on vertices which do not figure in the passed vertex 
 array. This is checked by contract, by means of referential equality.

## findPathsBetweenTwoVertices :: FindPathSettings -> Vertex -> Vertex -> Graph -> Array<EdgePath>
Finds all paths between two vertices in a graph. Note that a path here is not an array of vertices
 but an array of edges. This is a requirement as we commonly deal in MBT with graphs with several
  guards between two states, with same-state transitions, and other circles.

If such paths exist, they are computed and returned in the form of array in which all elements 
are unique, i.e. there are no two same paths, with sameness defined by referential equality of 
the contained edges.
 
It is possible to configure the maximum number of occurrences of a given edge in a path. Sameness
 is defined by referential equality. The default value is set to 1 (no repetition of a given edge - this ensures loop-free paths). Settings that parameter to a value greater than 1 allows to have some control over the traversal of the graph cycles.

**Note that because the search starts with a vertex and not an edge**, it is necessary to pass a 
'fake' starting edge whose origin is a `null` vertex, and target is the starting vertex. As a 
result, in any returned path the first edge will feature a `null` origin vertex. Keep that in 
mind when using the returned paths : drop the first edge of the path.

## Algorithm
We did not bother much with a sophisticated algorithm. A collection of search algorithms can be 
found in the assets directory of this repository. We used an iterative, brute-force enumeration 
algorithm, adapted for the need of enumerate **edges**, accounting for loops, cycles, and 
multi-edges. The algorithm can be found in 
[Enumeration algorithm, p14](https://www.springer.com/cda/content/document/cda_downloaddocument/9789462390966-c2.pdf?SGWID=0-0-45-1499691-p177134948) 

## Tests
`npm run test`

# Tips and gotchas
- edges which are not reachable from the starting edge won't be reached. That sounds obvious but 
it is easy to forget.
- the `GraphTraversalState` can be used to implement early termination of the search. Typically 
`visit` would update some flag in the graph traversal state, and `isTraversableEdge` would not 
produce any further edges after consulting that flag.
