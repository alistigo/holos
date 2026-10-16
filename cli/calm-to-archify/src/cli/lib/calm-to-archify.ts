import path from "node:path";
import { computeLayout, type GroupLayout, type LayoutInput } from "./layout.js";

export interface CalmNode {
  "unique-id": string;
  "node-type": string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface CalmRelationship {
  "unique-id": string;
  description?: string;
  "relationship-type":
    | { "composed-of": { container: string; nodes: string[] } }
    | { "deployed-in": { container: string; nodes: string[] } }
    | { connects: { source: { node: string }; destination: { node: string } } }
    | { interacts: { actor: string; nodes: string[] } };
}

export interface CalmDocument {
  "unique-id": string;
  name: string;
  description?: string;
  metadata?: Array<Record<string, unknown>>;
  nodes: CalmNode[];
  relationships: CalmRelationship[];
}

export interface ArchifyComponent {
  id: string;
  type: string;
  label: string;
  sublabel?: string;
  tag?: string;
  pos: [number, number];
  size: [number, number];
}

export interface ArchifyBoundary {
  kind: string;
  label: string;
  wraps: string[];
}

export interface ArchifyConnection {
  id: string;
  from: string;
  to: string;
  via?: [number, number][];
}

export interface ArchifyDocument {
  schema_version: 1;
  diagram_type: "architecture";
  meta: {
    title: string;
    subtitle?: string;
    output: string;
    legend?: { entries: Record<string, { label: string }> };
  };
  components: ArchifyComponent[];
  boundaries: ArchifyBoundary[];
  connections: ArchifyConnection[];
}

interface ArchifyHint {
  "component-type": string;
  "legend-label"?: string;
  sublabel?: string;
  tag?: string;
}

// fallow-ignore-next-line complexity
function extractArchifyNodeTypes(calm: CalmDocument): Map<string, ArchifyHint> {
  const map = new Map<string, ArchifyHint>();
  if (!calm.metadata) return map;
  for (const entry of calm.metadata) {
    const archify = entry["x-archify"];
    if (!archify || typeof archify !== "object") continue;
    const nodeTypes = (archify as Record<string, unknown>)["node-types"];
    if (!nodeTypes || typeof nodeTypes !== "object") continue;
    for (const [type, hint] of Object.entries(nodeTypes as Record<string, unknown>)) {
      if (hint && typeof hint === "object") map.set(type, hint as ArchifyHint);
    }
  }
  return map;
}

// fallow-ignore-next-line complexity
function mapNodeType(nodeType: string, name: string, hintMap: Map<string, ArchifyHint>): string {
  const hint = hintMap.get(nodeType);
  if (hint) return hint["component-type"];
  const lower = name.toLowerCase();
  switch (nodeType) {
    case "actor":
      return "external";
    case "database":
      return "database";
    case "data-asset":
      return "external";
    case "system": {
      return "backend";
    }
    case "service": {
      if (lower.includes("cdn") || lower.includes("npm")) return "cloud";
      if (lower.includes("bus") || lower.includes("event")) return "messagebus";
      if (
        lower.includes("presentation") ||
        lower.includes("react") ||
        lower.includes("ui") ||
        lower.includes("frontend")
      )
        return "frontend";
      return "backend";
    }
    default:
      return "backend";
  }
}

function firstSentence(text: string): string {
  const dot = text.indexOf(".");
  const maxLen = 120;
  if (dot === -1 || dot > maxLen)
    return text.length <= maxLen ? text : `${text.slice(0, maxLen - 1)}…`;
  return text.slice(0, dot + 1);
}

// Node types whose nodes are pure visual grouping containers — rendered only as boundary
// regions, not as individual component boxes. Add new group node-types here as needed.
const GROUP_NODE_TYPES = new Set(["group"]);

interface SimpleConnection {
  source: string;
  destination: string;
}

// Kahn's topological layering: nodes whose predecessors are all in earlier layers
// share a row. Respects the original declaration order within each layer for stability.
// fallow-ignore-next-line complexity
function topoLayers(nodes: string[], edges: SimpleConnection[]): string[][] {
  const inDegree = new Map<string, number>(nodes.map((n) => [n, 0]));
  const adj = new Map<string, string[]>(nodes.map((n) => [n, []]));
  for (const { source, destination } of edges) {
    inDegree.set(destination, (inDegree.get(destination) ?? 0) + 1);
    adj.get(source)!.push(destination);
  }
  const layers: string[][] = [];
  let current = nodes.filter((n) => (inDegree.get(n) ?? 0) === 0);
  while (current.length > 0) {
    layers.push(current);
    const next: string[] = [];
    for (const node of current) {
      for (const neighbor of adj.get(node) ?? []) {
        const d = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, d);
        if (d === 0) next.push(neighbor);
      }
    }
    current = next;
  }
  return layers;
}

// fallow-ignore-next-line complexity
function computeGroupLayers(members: string[], allConnections: SimpleConnection[]): string[][] {
  const memberSet = new Set(members);

  const internalEdges = allConnections.filter(
    (c) => memberSet.has(c.source) && memberSet.has(c.destination),
  );

  // Entry nodes: group members that receive a connection from outside the group
  const entryNodes = new Set(
    allConnections
      .filter((c) => !memberSet.has(c.source) && memberSet.has(c.destination))
      .map((c) => c.destination),
  );

  // Reversed adjacency: dest → [nodes that depend on dest]
  const reversedAdj = new Map<string, string[]>(members.map((m) => [m, []]));
  for (const { source, destination } of internalEdges) {
    reversedAdj.get(destination)!.push(source);
  }

  // BFS from entry nodes using reversed edges (places nodes with many dependents near the top)
  const layerOf = new Map<string, number>();
  if (entryNodes.size > 0) {
    const queue: Array<[string, number]> = [...entryNodes].map((n) => [n, 0]);
    for (const [n, l] of queue) layerOf.set(n, l);
    while (queue.length > 0) {
      const [id, layer] = queue.shift()!;
      for (const neighbor of reversedAdj.get(id) ?? []) {
        if (!layerOf.has(neighbor)) {
          layerOf.set(neighbor, layer + 1);
          queue.push([neighbor, layer + 1]);
        }
      }
    }
  }

  // Topological sub-layers for nodes unreached by the reversed BFS
  const unreached = members.filter((m) => !layerOf.has(m));
  if (unreached.length > 0) {
    const unreachedSet = new Set(unreached);
    const subEdges = internalEdges.filter(
      (e) => unreachedSet.has(e.source) && unreachedSet.has(e.destination),
    );
    const subLayers = topoLayers(unreached, subEdges);
    const baseLayer = layerOf.size > 0 ? Math.max(...layerOf.values()) + 1 : 0;
    for (let i = 0; i < subLayers.length; i++) {
      for (const node of subLayers[i] ?? []) layerOf.set(node, baseLayer + i);
    }
  }

  const rows = new Map<number, string[]>();
  for (const [node, layer] of layerOf) {
    if (!rows.has(layer)) rows.set(layer, []);
    rows.get(layer)!.push(node);
  }
  if (rows.size === 0) return [members];
  const maxIdx = Math.max(...rows.keys());
  return Array.from({ length: maxIdx + 1 }, (_, i) => rows.get(i) ?? []);
}

// fallow-ignore-next-line complexity
export function transformCalmToArchify(calm: CalmDocument, outputPath: string): ArchifyDocument {
  const hintMap = extractArchifyNodeTypes(calm);

  const groupNodeIds = new Set(
    calm.nodes.filter((n) => GROUP_NODE_TYPES.has(n["node-type"])).map((n) => n["unique-id"]),
  );
  const nodeIds = calm.nodes.map((n) => n["unique-id"]);

  // Pre-collect all connects edges for topology-aware group layer computation
  const allConnections: SimpleConnection[] = calm.relationships.flatMap((rel) => {
    const rt = rel["relationship-type"];
    if ("connects" in rt) {
      return [{ source: rt.connects.source.node, destination: rt.connects.destination.node }];
    }
    return [];
  });

  // Pre-pass: record direct component members of each group node for boundary expansion
  const groupComponents = new Map<string, string[]>();
  for (const rel of calm.relationships) {
    const rt = rel["relationship-type"];
    if ("composed-of" in rt) {
      const { container, nodes: children } = rt["composed-of"];
      if (groupNodeIds.has(container)) {
        groupComponents.set(
          container,
          children.filter((id) => !groupNodeIds.has(id)),
        );
      }
    }
  }
  const expandGroups = (ids: string[]): string[] =>
    ids.flatMap((id) => (groupNodeIds.has(id) ? (groupComponents.get(id) ?? []) : [id]));

  const composedGroups: Array<{ layout: GroupLayout; expandedCount: number }> = [];
  const deployedInSets: string[][] = [];
  const boundaries: ArchifyBoundary[] = [];
  const connections: ArchifyConnection[] = [];
  const connIdsSeen = new Set<string>();

  function safeConnId(base: string): string {
    let id = base;
    let counter = 1;
    while (connIdsSeen.has(id)) {
      id = `${base}-${counter++}`;
    }
    connIdsSeen.add(id);
    return id;
  }

  for (const rel of calm.relationships) {
    const rt = rel["relationship-type"];

    if ("composed-of" in rt) {
      const { container, nodes: children } = rt["composed-of"];
      const containerNode = calm.nodes.find((n) => n["unique-id"] === container);
      const label = containerNode?.name ?? container;
      const componentChildren = expandGroups(children);
      const directChildren = children.filter((id) => !groupNodeIds.has(id));
      const layers = computeGroupLayers(directChildren, allConnections);
      composedGroups.push({ layout: { layers }, expandedCount: componentChildren.length });
      boundaries.push({ kind: "region", label, wraps: componentChildren });
      continue;
    }

    if ("deployed-in" in rt) {
      const { container, nodes: children } = rt["deployed-in"];
      const containerNode = calm.nodes.find((n) => n["unique-id"] === container);
      const label = containerNode?.name ?? container;
      deployedInSets.push(children);
      boundaries.push({ kind: "region", label, wraps: children });
      continue;
    }

    if ("connects" in rt) {
      const { source, destination } = rt.connects;
      connections.push({
        id: safeConnId(rel["unique-id"]),
        from: source.node,
        to: destination.node,
      });
      continue;
    }

    if ("interacts" in rt) {
      const { actor, nodes: targets } = rt.interacts;
      for (const target of targets) {
        connections.push({
          id: safeConnId(`${rel["unique-id"]}-${target}`),
          from: actor,
          to: target,
        });
      }
    }
  }

  // Largest (outermost) groups first — use expanded count so nesting order is correct
  // even when a nested group has more direct children than its parent.
  composedGroups.sort((a, b) => b.expandedCount - a.expandedCount);
  const composedOfSets = composedGroups.map((g) => g.layout);

  const layoutInput: LayoutInput = {
    nodeIds: nodeIds.filter((id) => !groupNodeIds.has(id)),
    composedOfSets,
    deployedInSets,
  };

  const positions = computeLayout(layoutInput);

  // For cross-column connections spanning 3+ rows the auto-router creates an S-shaped path
  // that cuts through intermediate nodes. Route these via the right outer margin instead,
  // approaching the destination through the row gap above/below it to avoid same-row siblings.
  const VIA_X = 590; // outside the 2-column grid (rightmost component edge = 310+240 = 550)
  const COMP_H = 55;
  const ROW_GAP = 40;
  const ROW_HEIGHT = COMP_H + ROW_GAP;
  const COL_BOUNDARY = 290; // midpoint between col0 right-edge(270) and col1 left-edge(310)
  for (const conn of connections) {
    const src = positions.get(conn.from);
    const dst = positions.get(conn.to);
    if (!src || !dst) continue;
    const srcCol = src.x > COL_BOUNDARY ? 1 : 0;
    const dstCol = dst.x > COL_BOUNDARY ? 1 : 0;
    // Only col1→col0 connections need the right-margin detour; col0→col1 routes cleanly
    // through the inter-column gap at x≈290 and adding via there would cross same-row col1 nodes.
    if (srcCol !== 1 || dstCol !== 0) continue;
    const srcCenterY = src.y + src.h / 2;
    const dstCenterY = dst.y + dst.h / 2;
    if (Math.abs(srcCenterY - dstCenterY) > 3 * ROW_HEIGHT) {
      const dstCenterX = dst.x + dst.w / 2;
      // Approach the destination through the row gap to avoid its same-row sibling in the other column
      const gapY =
        dstCenterY > srcCenterY
          ? dst.y - ROW_GAP / 2 // dest below: enter gap above dest row
          : dst.y + dst.h + ROW_GAP / 2; // dest above: enter gap below dest row
      conn.via = [
        [VIA_X, srcCenterY],
        [VIA_X, gapY],
        [dstCenterX, gapY],
      ];
    }
  }

  const components: ArchifyComponent[] = calm.nodes
    .filter((node) => !groupNodeIds.has(node["unique-id"]))
    // fallow-ignore-next-line complexity
    .map((node) => {
      const pos = positions.get(node["unique-id"]) ?? { x: 0, y: 0, w: 140, h: 55 };
      const hint = hintMap.get(node["node-type"]);
      const sublabel =
        hint?.["sublabel"] && typeof node[hint["sublabel"]] === "string"
          ? (node[hint["sublabel"]] as string)
          : undefined;
      const tag =
        hint?.["tag"] && typeof node[hint["tag"]] === "string"
          ? (node[hint["tag"]] as string)
          : undefined;
      return {
        id: node["unique-id"],
        type: mapNodeType(node["node-type"], node.name, hintMap),
        label: node.name,
        ...(sublabel && { sublabel }),
        ...(tag && { tag }),
        pos: [pos.x, pos.y],
        size: [pos.w, pos.h],
      };
    });

  const subtitle = calm.description ? firstSentence(calm.description) : undefined;

  const legendOverrides: Record<string, { label: string }> = {};
  for (const node of calm.nodes.filter((n) => !groupNodeIds.has(n["unique-id"]))) {
    const hint = hintMap.get(node["node-type"]);
    if (hint?.["legend-label"]) {
      legendOverrides[hint["component-type"]] = { label: hint["legend-label"] };
    }
  }

  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: calm.name,
      ...(subtitle && { subtitle }),
      output: path.isAbsolute(outputPath) ? outputPath : outputPath,
      ...(Object.keys(legendOverrides).length > 0 && { legend: { entries: legendOverrides } }),
    },
    components,
    boundaries,
    connections,
  };
}
