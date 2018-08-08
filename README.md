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

This was chosen for pragmatic reasons. From this included algorithm, it is possible to implement 
most of the above-mentioned coverage criteria.
 
# API
## Types
```javascript
/**
 * @typedef {Object} Edge must be an object (we use referential equality so this is to avoid surprises with
 * equality of native types)
 */
/**
 * @typedef {Array<Edge>} EdgePath
 */
/**
 * @typedef {Object} Vertex must be an object (we use referential equality so this is to avoid surprises with
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
 This however means that the user must provide concrete realization for the edge abstraction data
  type. This includes in particular the two lensing functions, which return the origin and target
   vertices for any given edge.

The array of vertices is mandatory, and must contain any and every vertex part of the graph. This
 means in particular that no edge can be based on vertices which do not figure in the passed vertex 
 array. This is checked by contract, by means of referential equality.

## findPaths :: FindPathSettings -> Vertex -> Vertex -> Graph -> Array<EdgePath>
Finds all paths between two vertices in a graph. Note that a path here is not an array of vertices
 but an array of edges. This is a requirement as we commonly deal in MBT with graphs with several
  guards between two states, with same-state transitions, and other circles.
  
If such paths exist, they are computed and returned in the form of array in which all elements 
are unique, i.e. there are no two same paths, with sameness defined by referential equality of 
the contained edges.

It is possible to configure the maximum number of occurrences of a given edge in a path. Sameness
 is defined by referential equality. The default value is set to 1 (no repetition of a given edge - this ensures loop-free paths). Settings that parameter to a value greater than 1 allows to 
  have some control over the traversal of the graph cycles.

**Note that the first edge** in any returned path has a `null` vertex as origin vertex. Keep that
 in mind when using the returned paths : drop the first edge of the path.

## Algorithm
We did not bother much with sophisticated algorithm. A collection of such can be found in the 
directory. We use a recursive, brute-force enumeration algorithm, adapted for the need of 
enumerate cycles and loops. 

