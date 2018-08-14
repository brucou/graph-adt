import * as QUnit from "qunitjs"
import { constructGraph, findPathsBetweenTwoVertices } from "../src"

const graphSettings = {
  getEdgeTarget: x => x.target,
  getEdgeOrigin: x => x.origin,
  constructEdge: (s, t) => ({ origin: s, target: t })
};

const vertex1 = { v: 'v' };
const vertex2 = { w: 'w' };
const vertices = [vertex1, vertex2];
const edge1 = graphSettings.constructEdge(vertices[0], vertices[0]);
const edge2 = graphSettings.constructEdge(vertices[0], vertices[1]);
const edge3 = graphSettings.constructEdge(vertices[1], vertices[1]);
const edge4 = graphSettings.constructEdge(vertices[1], vertices[1]);
const edge5 = graphSettings.constructEdge(vertices[1], vertices[0]);
const edges = [edge1, edge2, edge3, edge4, edge5];
const graph = constructGraph(graphSettings, edges, vertices);

QUnit.module("Testing findPathsBetweenTwoVertices(settings, graph, s, t)", {});

// TODO later
QUnit.test("paths(s,s) : Ignores self-loops on target vertex", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertices = [vertex1, vertex2];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[1], target: vertices[1] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(graphSettings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 2 };

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex1), [
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

