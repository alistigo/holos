import path from "node:path";
import { computeLayout, type LayoutInput } from "./layout.js";

export interface CalmNode {
  "unique-id": string;
  "node-type": string;
  name: string;
  description?: string;
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
  nodes: CalmNode[];
  relationships: CalmRelationship[];
}

export interface ArchifyComponent {
  id: string;
  type: string;
  label: string;
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
  };
  components: ArchifyComponent[];
  boundaries: ArchifyBoundary[];
  connections: ArchifyConnection[];
}

// fallow-ignore-next-line complexity
function mapNodeType(nodeType: string, name: string): string {
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

// fallow-ignore-next-line complexity
export function transformCalmToArchify(calm: CalmDocument, outputPath: string): ArchifyDocument {
  const groupNodeIds = new Set(
    calm.nodes.filter((n) => GROUP_NODE_TYPES.has(n["node-type"])).map((n) => n["unique-id"]),
  );
  const nodeIds = calm.nodes.map((n) => n["unique-id"]);

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

  const composedOfSets: string[][] = [];
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
      if (!children.some((id) => groupNodeIds.has(id))) {
        composedOfSets.push(componentChildren);
      }
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
    .map((node) => {
      const pos = positions.get(node["unique-id"]) ?? { x: 0, y: 0, w: 140, h: 55 };
      return {
        id: node["unique-id"],
        type: mapNodeType(node["node-type"], node.name),
        label: node.name,
        pos: [pos.x, pos.y],
        size: [pos.w, pos.h],
      };
    });

  const subtitle = calm.description ? firstSentence(calm.description) : undefined;

  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: calm.name,
      ...(subtitle && { subtitle }),
      output: path.isAbsolute(outputPath) ? outputPath : outputPath,
    },
    components,
    boundaries,
    connections,
  };
}
