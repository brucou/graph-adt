import * as QUnit from "qunitjs"
import { constructGraph, DFS, findPathsBetweenTwoVertices } from "../src"

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

QUnit.module("Testing findPathsBetweenTwoVertices(settings, graph, s, t) - bfs", {});

// First we test it with an previous written custom implementation : findPathsBetweenVertices
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

QUnit.test("paths(s, s) : Multi-self-loops are correctly enumerated when the target is the source", function exec_test(assert) {
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

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex2, vertex2),
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
  const graph = constructGraph(graphSettings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 2 };

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex2), [
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
          "w": "w"
        }
      }
    ],
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
      },
      {
        "origin": {
          "v": "v"
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
      },
      {
        "origin": {
          "v": "v"
        },
        "target": {
          "v": "v"
        }
      },
      {
        "origin": {
          "v": "v"
        },
        "target": {
          "w": "w"
        }
      }
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
  const foundPaths = findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex1);

  const foundIdPaths = foundPaths.map(path => path.map(x => x.id));

  assert.deepEqual(foundIdPaths, [
    [
      6,
      1
    ],
    [
      6,
      2,
      5
    ],
    [
      6,
      2,
      3,
      5
    ],
    [
      6,
      2,
      4,
      5
    ],
    [
      6,
      2,
      3,
      3,
      5
    ],
    [
      6,
      2,
      3,
      4,
      5
    ],
    [
      6,
      2,
      4,
      3,
      5
    ],
    [
      6,
      2,
      4,
      4,
      5
    ],
    [
      6,
      2,
      3,
      3,
      4,
      5
    ],
    [
      6,
      2,
      3,
      4,
      3,
      5
    ],
    [
      6,
      2,
      3,
      4,
      4,
      5
    ],
    [
      6,
      2,
      4,
      3,
      3,
      5
    ],
    [
      6,
      2,
      4,
      3,
      4,
      5
    ],
    [
      6,
      2,
      4,
      4,
      3,
      5
    ],
    [
      6,
      2,
      3,
      3,
      4,
      4,
      5
    ],
    [
      6,
      2,
      3,
      4,
      3,
      4,
      5
    ],
    [
      6,
      2,
      3,
      4,
      4,
      3,
      5
    ],
    [
      6,
      2,
      4,
      3,
      3,
      4,
      5
    ],
    [
      6,
      2,
      4,
      3,
      4,
      3,
      5
    ],
    [
      6,
      2,
      4,
      4,
      3,
      3,
      5
    ]
  ], `no more than maxNumberOfTraversal repetition for the same edge in a given path`);
});

QUnit.test("paths(s,t) : no paths!", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertex3 = { u: 'u' };
  const vertices = [vertex1, vertex2, vertex3];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[2], target: vertices[2] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(graphSettings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 1 };

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex3), [], `If there is no path between the two vertices, an empty array is returned`);
});

QUnit.module("Testing findPathsBetweenTwoVertices(settings, graph, s, t) - dfs", {});

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

  const findPathSettings = { maxNumberOfTraversals: 2, strategy: DFS };

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

QUnit.test("paths(s, s) : Multi-self-loops are correctly enumerated when the target is the source", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertices = [vertex1, vertex2];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[1], target: vertices[1] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(graphSettings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 2, strategy: DFS };

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex2, vertex2),
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
  const graph = constructGraph(graphSettings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 2, strategy: DFS };

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex2), [
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

  const findPathSettings = { maxNumberOfTraversals: 2, strategy: DFS };
  const foundPaths = findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex1);

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

QUnit.test("paths(s,t) : no paths!", function exec_test(assert) {
  const vertex1 = { v: 'v' };
  const vertex2 = { w: 'w' };
  const vertex3 = { u: 'u' };
  const vertices = [vertex1, vertex2, vertex3];
  const edge1 = { origin: vertices[0], target: vertices[0] };
  const edge2 = { origin: vertices[0], target: vertices[1] };
  const edge3 = { origin: vertices[1], target: vertices[1] };
  const edge4 = { origin: vertices[2], target: vertices[2] };
  const edges = [edge1, edge2, edge3, edge4];
  const graph = constructGraph(graphSettings, edges, vertices);

  const findPathSettings = { maxNumberOfTraversals: 2, strategy: DFS };

  assert.deepEqual(findPathsBetweenTwoVertices(findPathSettings, graph, vertex1, vertex3), [], `If there is no path between the two vertices, an empty array is returned`);
});
