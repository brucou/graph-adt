import * as QUnit from "qunitjs"
import { constructGraph, findPaths } from "../src"

const settings = {
  getEdgeTarget: x => x.target,
  getEdgeOrigin: x => x.origin,
  constructEdge: (s, t) => ({ origin: s, target: t })
};
QUnit.module("Testing constructGraph(settings, edges, vertices)", {});

QUnit.test("no edge, no vertices", function exec_test(assert) {
  const edges = [];
  const vertices = [];
  const graph = constructGraph(settings, edges, vertices);

  assert.deepEqual(Object.keys(graph), [
    "outgoingEdges",
    "incomingEdges",
    "showVertex",
    "showEdge",
    "vertices",
    "edges",
    "getEdgeTarget",
    "getEdgeOrigin",
    "constructEdge"
  ], `...`);
});

QUnit.test("edge, vertices", function exec_test(assert) {
  const vertex1 = { v: 'v', print: () => `{ v: 'v'}` };
  const vertex2 = { w: 'w', print: () => `{ w: 'w'}` };
  const vertices = [vertex1, vertex2];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[1], target: vertices[1] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(settings, edges, vertices);

  assert.deepEqual(JSON.parse(JSON.stringify(graph.outgoingEdges(vertex1))), [
    { "origin": { "v": "v" }, "target": { "v": "v" } },
    { "origin": { "v": "v" }, "target": { "w": "w" } }
  ], `Outgoing edges are properly computed`);
  assert.deepEqual(JSON.parse(JSON.stringify(graph.outgoingEdges(vertex2))), [
    { "origin": { "w": "w" }, "target": { "w": "w" } },
    { "origin": { "w": "w" }, "target": { "w": "w" } }
  ], `Loops are accepted. Multigraphs with several edges between two vertices are accepted`);
  assert.deepEqual(JSON.parse(JSON.stringify(graph.incomingEdges(vertex1))),
    [{ "origin": { "v": "v" }, "target": { "v": "v" } }
    ], `Incoming edges are computed correctly`);
  assert.deepEqual(JSON.parse(JSON.stringify(graph.incomingEdges(vertex2))), [
    { "origin": { "v": "v" }, "target": { "w": "w" } },
    { "origin": { "w": "w" }, "target": { "w": "w" } },
    { "origin": { "w": "w" }, "target": { "w": "w" } }
  ], `Incoming edges are computed correctly, including multiloops and multiedges`);
  assert.deepEqual(graph.showVertex(vertex1), "Vertex #0 : { v: 'v'}", `Vertices are printed correctly`);
  assert.deepEqual(graph.showVertex(vertex2), "Vertex #1 : { w: 'w'}", `Vertices are printed correctly`);
  assert.deepEqual(graph.showEdge(edge1), "Edge #0 : {\"origin\":{\"v\":\"v\"},\"target\":{\"v\":\"v\"}}", `Edges are printed correctly`);
  assert.deepEqual(graph.showEdge(edge2), "Edge #1 : {\"origin\":{\"v\":\"v\"},\"target\":{\"w\":\"w\"}}", `Edges are printed correctly`);
});

QUnit.module("Testing findPaths(settings, s, t, graph)", {});

QUnit.test("paths(s,s) : Ignores self-loops on target vertex", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertices = [vertex1, vertex2];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[1], target: vertices[1] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(settings, edges, vertices);

  const findPathSettings = { maxNumberOfCircleTraversal: 2 };

  assert.deepEqual(findPaths(findPathSettings, vertex1, vertex1, graph), [
    [
      {
        "origin": null,
        "target": {
          "v": "v"
        }
      },
      {
        "origin": {
          "v": "v"
        },
        "target": {
          "v": "v"
        }
      }
    ]
  ], `As soon as the target is found, the path enumeration stops. That means self-loops on target vertex are ignored in the path enumeration`);
});

QUnit.test("paths(s, s) : Multi-self-loops are correctly enumerated when the target is the source", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertices = [vertex1, vertex2];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[1], target: vertices[1] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(settings, edges, vertices);

  const findPathSettings = { maxNumberOfCircleTraversal: 2 };

  assert.deepEqual(findPaths(findPathSettings, vertex2, vertex2, graph),
    [
      [
        {
          "origin": null,
          "target": {
            "w": "w"
          }
        },
        {
          "origin": {
            "w": "w"
          },
          "target": {
            "w": "w"
          }
        }
      ],
      [
        {
          "origin": null,
          "target": {
            "w": "w"
          }
        },
        {
          "origin": {
            "w": "w"
          },
          "target": {
            "w": "w"
          }
        }
      ]
    ], `...`);
});

QUnit.test("paths(s, t) : self-loops on target vertex are ignored and paths are correctly enumerated", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertices = [vertex1, vertex2];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[1], target: vertices[1] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(settings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 2 };

  assert.deepEqual(findPaths(findPathSettings, vertex1, vertex2, graph), [
    [
      { "origin": null, "target": { "v": "v" } },
      { "origin": { "v": "v" }, "target": { "v": "v" } },
      { "origin": { "v": "v" }, "target": { "v": "v" } },
      { "origin": { "v": "v" }, "target": { "w": "w" } }
    ],
      [
        { "origin": null, "target": { "v": "v" } },
        { "origin": { "v": "v" }, "target": { "v": "v" } },
        { "origin": { "v": "v" }, "target": { "w": "w" } }
      ],
      [
        { "origin": null, "target": { "v": "v" } },
        { "origin": { "v": "v" }, "target": { "w": "w" } }
      ]
  ], `...`);
});

QUnit.test("paths(s, t) : loops with maxNumberOfCircleTraversal are correctly enumerated", function exec_test(assert) {
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

  const findPathSettings = { maxNumberOfTraversals: 2 };
  const foundPaths = findPaths(findPathSettings, vertex1, vertex1, graph);

  const foundIdPaths = foundPaths.map(path => path.map(x => x.id));

  assert.deepEqual(foundIdPaths, [
    [6, 1],
    [6, 2, 3, 3, 4, 4, 5],
    [6, 2, 3, 3, 4, 5],
    [6, 2, 3, 3, 5],
    [6, 2, 3, 4, 3, 4, 5],
    [6, 2, 3, 4, 3, 5],
    [6, 2, 3, 4, 4, 3, 5],
    [6, 2, 3, 4, 4, 5],
    [6, 2, 3, 4, 5],
    [6, 2, 3, 5],
    [6, 2, 4, 3, 3, 4, 5],
    [6, 2, 4, 3, 3, 5],
    [6, 2, 4, 3, 4, 3, 5],
    [6, 2, 4, 3, 4, 5],
    [6, 2, 4, 3, 5],
    [6, 2, 4, 4, 3, 3, 5],
    [6, 2, 4, 4, 3, 5],
    [6, 2, 4, 4, 5],
    [6, 2, 4, 5],
    [6, 2, 5]
  ], `no more than maxNumberOfTraversal repetition for the same edge in a given path`);
});
