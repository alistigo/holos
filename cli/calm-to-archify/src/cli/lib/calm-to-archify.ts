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

// fallow-ignore-next-line complexity
export function transformCalmToArchify(calm: CalmDocument, outputPath: string): ArchifyDocument {
  const nodeIds = calm.nodes.map((n) => n["unique-id"]);

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
      composedOfSets.push(children);
      boundaries.push({ kind: "region", label, wraps: children });
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
    nodeIds,
    composedOfSets,
    deployedInSets,
  };

  const positions = computeLayout(layoutInput);

  const components: ArchifyComponent[] = calm.nodes.map((node) => {
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
