- [Motivation](#motivation)
- [API](#api)
  * [Types](#types)
  * [Contracts](#contracts)
  * [constructGraph :: EdgeADT -> Array<Edge> -> Array<Vertex> -> Graph](#constructgraph----edgeadt----array-edge-----array-vertex-----graph)
  * [findPathsBetweenTwoVertices :: FindPathSettings -> Vertex -> Vertex -> Graph -> Array<EdgePath>](#findpathsbetweentwovertices----findpathsettings----vertex----vertex----graph----array-edgepath-)
  * [searchGraphEdges :: TraversalSpecs -> Vertex -> Graph -> SearchResults](#searchgraphedges----traversalspecs----vertex----graph----searchresults)
    + [Search algorithm](#search-algorithm)
    + [Description](#description)
    + [Semantics](#semantics)
    + [Contracts](#contracts-1)
  * [searchGraphEdgesGenerator](#searchgraphedgesgenerator)
    + [Contracts](#contracts-2)
  * [Provided searches](#provided-searches)
  * [Tests](#tests)
  * [Examples](#examples)
- [Tips and gotchas](#tips-and-gotchas)
- [Related](#related)

# Motivation
We had trouble finding a library for graph data structure which addresses our requirements. The 
principal need and motivator for now is model-based testing (MBT): a reactive system is modelled 
as a state-machine, which itself can be modelled as a [multidigraph](https://en.wikipedia.org/wiki/Multigraph#Directed_multigraph_(edges_without_own_identity)), or [quiver](https://en.wikipedia.org/wiki/Quiver_(mathematics)). 
We could not find libraries which can handle such constructs. To generate input sequences for 
model testing, we need to examine the associated graph in a certain number of ways. This library 
aims at gathering such ways.

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
 - generic graph **edge** search, which can be customized to implement some of the 
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
  type. This includes in particular :
  
  - the two lensing functions `getEdgeOrigin` and `getEdgeTarget`, which return the origin and 
  target vertices for any given edge

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

## searchGraphEdges :: TraversalSpecs -> Vertex -> Graph -> SearchResults
### Search algorithm
We did not bother much with a sophisticated algorithm. A collection of search algorithms can be 
found in the assets directory of this repository. We used an iterative version of a brute-force 
enumeration algorithm, adapted for the need of enumerating **edges**, accounting for loops, cycles, and 
multi-edges. The algorithm can be found in 
[Enumeration algorithm, p14](https://www.springer.com/cda/content/document/cda_downloaddocument/9789462390966-c2.pdf?SGWID=0-0-45-1499691-p177134948) 

### Description
The function `findPathsBetweenTwoVertices` uses under the hood the search algorithm implemented by 
`searchGraphEdges`. `searchGraphEdges` returns results from the graph search starting from a 
given vertex , based on the configuration passed in `TraversalSpecs`. 

`TraversalSpecs` contains three properties (`search`, `store`, `visit`) respectively dictating what are 
and how to build search results (for instance a result is a path between given origin and target 
and is to be aggregated in an array), the traversal order (for instance breadth-first), and the 
traversal criteria (for instance do not pass through the same edge twice).

The `search` property contains the following properties : `initialGoalEvalState`, `evaluateGoal`, 
`showResults`, respectively specifying :
- the initial value for the search state (generally an empty container of results)
- when a search is successful (`isGoalReached`), what/if to output as a result (`output`), and the 
update of the search state (`graphTraversalState`).
- the final output of the search. This is generally a data structure containing all results.

The `visit` property contains the following properties : `initialPathTraversalState`, 
`visitEdge`, respectively specifying :
- the initial value for the traversal state
- whether a traversal candidate edge should indeed be traversed (`isTraversableEdge`) or 
alternatively the search should backtrack, and the update of the traversal 
state (`pathTraversalState`).

The `store` property contains the following properties :
- `empty` : empty store
- `add` : adds elements to the store
- `takeAndRemoveOne`: remove an element from the store and returns a store with the same elements
 except the removed element
- `isEmpty`: predicate which returns true iff the store is empty
 
For instance, for the `findPathsBetweenTwoVertices` function:
- the store is a queue or a stack according to whether we want a `BFS` or `DFS` search
- `visitEdge` accumulates all traversable edges in an array (with `initialPathTraversalState` 
initially an empty array), forming an edge path. A traversable edge being an edge such that when 
added to the current edge path, does not feature more than a given number 
(`maxNumberOfTraversals`) of edge repetition.
- `isGoalReached` returns true iff the final edge of the current edge path is the target vertex. 
`graphTraversalState`, initially an empty array (`initialGoalEvalState`, accumulates results, i.e
. the paths we have found which fulfiil our search criteria). Finally `showResults` simply 
outputs the accumulated array. 

As such, the `searchGraphEdges` is fairly generic, and can implement a large variety of 
graph (edge) searches. Among the thing which can be done :
- probabilistic searches, or prefix searches can be done by configuring the `store` property, all
 else being equal

The invariant part of the function, is that for any traversed edge, the outgoing edges from that 
edge will be enumerated as potential traversable edges. What is a traversable edge and how those 
edges are eventually accumulated into search results is the parameterizable part of the function. 

### Semantics
- we start with initializing the search state, the traversal state and an empty store
- we start the enumeration with adding to the store the outgoing edges of the initial 
vertex
- for any edge in the store, we removed the edge from the store and visit it
  - if the edge is not traversable, we continue reviewing edges in the store
  - if the edge is traversable, it is traversed
    - we evaluate if the search goal is reached
      - if the search goal is reached, we update the search state and possibly compute and output 
      the result of the search
      - if the search goal is not reached, we add the outgoing edges for the traversed edge to 
      the store, and update the traversal state 
    - we continue reviewing edges in the store

### Contracts
The following contracts apply : type contracts, graph contracts, edge contracts, vertex contracts.

We could consider it an implicit contract that the search must terminate, i.e. that the search 
parameters (in particular `isGoalReached` and `isTraversableEdge`) have to be configured in a way 
that the store eventually returns to being empty. This is not enforced but important as a graph 
may have loops in which case the enumeration of edge paths would be infinite.


## searchGraphEdgesGenerator
The `searchGraphEdgesGenerator` follows the same algorithm as `searchGraphEdges`, except for the 
fact that when a search result is found, that result is yielded to the function caller. 
`searchGraphEdgesGenerator` is indeed a generator, which when called returns an iterator. That 
iterator, for each `next` call will return a new search result, till the enumeration is finished 
(emptied store). Note that the generator returns the list of all found results. As usual, the 
return value of a generator cannot be retrieved in a `for..of` loop. We provide the 
`getIteratorReturnValue` function to that purpose.

We included this version of the search because :
- for large graphs, or graph featuring loops, the enumeration may be expensive, and we might want
 to instead process results one by one, instead of computing them synchronously and process the 
 whole results
  - this is typically the case for testing, where we want to have tests failing as soon as possible
- in particular the enumeration may be infinite, and we might be interested in only some of the 
results, and want to stop the iteration at discretion
- we can interface it for further processing with :
  - transducers (for instance [transducers-js](https://github.com/cognitect-labs/transducers-js))
  - iterator combinators for processing (for instance [`ixjs`](https://github.com/ReactiveX/IxJS),
    the pull version of `rxjs`)
  - property-based testing libraries ([jsverify](https://github.com/jsverify/jsverify), or 
  [jscheck](http://www.jscheck.org/))

### Contracts
Same contracts as `searchGraphEdges`, except that the implicit contract that the search must 
terminate can be relaxed.

## Provided searches
For the sake of our needs, we provided two parameter presets (a preset is a 
configuration of `isTraversableEdge`, and `isGoalReached`):
- `ALL_n_TRANSITIONS` : will reject edge paths which features more than `n` repetitions of any 
given edge. A successful search is the one generating an edge path whose final edge has a given 
target vertex
- `ALL_TRANSITIONS` : `ALL_n_TRANSITIONS` with n = 1.

This is specific to our [state transducer library](https://github.com/brucou/state-transducer) and our need to automatically generate test sequences.

In that context, note that `ALL_TRANSITIONS` helps enumerating a set of paths (input tests) 
which includes all transitions from a given vertex to a target vertex. That set of paths however 
is not the minimal set of such paths. It is in fact the **maximal set**. As there is no unicity of 
the minimum set, we chose to enumerate the maximal set and let the user pick from that set the 
sequences he favors. 

## Tests
Tests can be run with `npm run test`

## Examples
Examples can be found in the [test directory](https://github.com/brucou/state-transducer/tree/master/test)

# Tips and gotchas
- edges which are not reachable from the starting vertex won't be reached. That sounds obvious but 
it is easy to forget.
- the `GraphTraversalState` can be used to implement early termination of the search. Typically 
`visit` would update some flag in the graph traversal state, and `isTraversableEdge` would not 
produce any further edges after consulting that flag.

# Related
- [search-algorithms](http://hackage.haskell.org/package/search-algorithms)
- [enumeration algorithms](https://www.springer.com/cda/content/document/cda_downloaddocument/9789462390966-c2.pdf?SGWID=0-0-45-1499691-p177134948)
