import * as QUnit from "qunitjs"
import { breadthFirstTraverseGraphEdges, constructGraph } from "../src"

// TODO
let edgeCounter = 0;
const settings = {
  getEdgeTarget: x => x.target,
  getEdgeOrigin: x => x.origin,
  constructEdge: (s, t) => ({ origin: s, target: t, id: ++edgeCounter })
};
const vertex1 = { v: 'v' };
const vertex2 = { w: 'w' };
const vertices = [vertex1, vertex2];
const edge1 = settings.constructEdge(vertices[0], vertices[0]);
const edge2 = settings.constructEdge(vertices[0], vertices[1]);
const edge3 = settings.constructEdge(vertices[1], vertices[1]);
const edge4 = settings.constructEdge(vertices[1], vertices[1]);
const edge5 = settings.constructEdge(vertices[1], vertices[0]);
const edges = [edge1, edge2, edge3, edge4, edge5];
const graph = constructGraph(settings, edges, vertices);

QUnit.module("Testing breadthFirstTraverseGraphEdges(traverse, graph)", {});

QUnit.test("Edge case : no edge, no vertices", function exec_test(assert) {
  const edges = [];
  const vertices = [];
  const graph = constructGraph(settings, edges, vertices);
  const traverse = {
    visit: (visitAcc, graphTraversalState, edge, graph) => {},
    startingEdge: [], // NOTE : does not matter, the graph is empty
    pickTraversableEdges: x => x,
    seed: {}
  };
  const traversalResult = breadthFirstTraverseGraphEdges(traverse, graph);

  // TODO this is a throw
  assert.deepEqual(traversalResult, [], `It is not possible to traverse an empty graph!`);
});

QUnit.test("multigraph - no cycle allowed", function exec_test(assert) {
  const maxTimesVisited = 1;
  const traverse = {
    seed: [],
    visit: (visitAcc, graphTraversalState, edge, graph) => {
      const timesVisited = graphTraversalState.get(edge).timesVisited;
      return visitAcc.concat(`Edge #${edge.id} visited ${timesVisited} times`)
    },
    startingEdge: [], // NOTE : does not matter, the graph is empty
    pickTraversableEdges: (outgoingEdges, graphTraversalState, graph) => {
      return outgoingEdges.filter(edge => graphTraversalState.get(edge).timesVisited < maxTimesVisited)
    },
  };
  const traversalResult = breadthFirstTraverseGraphEdges(traverse, graph);

  assert.deepEqual(traversalResult, [], `Graph is traversed without occuring into any cycle`);
});
