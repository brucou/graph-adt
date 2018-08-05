# Motivation
We had trouble finding a library for graph data structure which addresses our requirements. The 
principal need and motivator for now is model-based testing : a reactive system is modelled as a 
state-machine, which itself can be modelled as a [multigraph](https://en.wikipedia.org/wiki/Multigraph). We
could not find libraries which can handle multigraphs. To generate input sequences, we need to 
examine that graph in a certain number of ways, those ways are the algorithms included in the library.

As such it is not and does not intend to be a all=purpose graph manipulation library. It just has
 what we need for model-based testing.
 
# API
**TODO** update APIs signatures
## constructGraph :: Array<Edge> -> Optional<Array<Vertex>> -> Graph
A graph is constructed by its array of edges. An edge itself is an array of two vertices. A 
vertex can be anything. Note that this constructor is a bit restrictive. It is possible to think 
about graphs with vertex which are not linked through edges. A complete description should be :

- V a set of vertices or nodes,
- A a set of edges or lines,
- {\displaystyle s:A\rightarrow V} s:A\rightarrow V, assigning to each edge its source node,
- {\displaystyle t:A\rightarrow V} t:A\rightarrow V, assigning to each edge its target node.

## getOutgoingEdges :: Vertex -> Graph -> Array<Edge>
Return the list (possibly empty) of edges with origin a given vertex. 
 
## findPaths :: Vertex -> Vertex -> Array<Path>
Finds all path between two vertices in a graph. Note that a path here is defined by `Path :: 
Array<Edge>`. It is thus not an array of vertices but an array of edges. This is so to cater from
 the edge case where several edges exist between two vertices. 

If such paths exist, they are computed and returned in the form of array in which all elements 
are unique, i.e. there are no two same paths, with sameness defined by referential equality.
