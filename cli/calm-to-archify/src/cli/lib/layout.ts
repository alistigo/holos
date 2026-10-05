const COMP_W = 240;
const COMP_H = 55;
const COL_GAP = 40;
const ROW_GAP = 40;
const COLS = 2;
const SECTION_Y_GAP = 70;
const EXTERNAL_START_X = 30;
const EXTERNAL_START_Y = 30;

export interface LayoutInput {
  nodeIds: string[];
  composedOfSets: string[][];
  deployedInSets: string[][];
}

export interface NodePosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

function layoutRow(
  ids: string[],
  startX: number,
  startY: number,
  cols: number,
): Map<string, NodePosition> {
  const result = new Map<string, NodePosition>();
  ids.forEach((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    result.set(id, {
      x: startX + col * (COMP_W + COL_GAP),
      y: startY + row * (COMP_H + ROW_GAP),
      w: COMP_W,
      h: COMP_H,
    });
  });
  return result;
}

// fallow-ignore-next-line complexity
export function computeLayout(input: LayoutInput): Map<string, NodePosition> {
  const { nodeIds, composedOfSets, deployedInSets } = input;

  // Nodes that appear in composed-of children (deepest level)
  const composedChildren = new Set(composedOfSets.flat());
  // Nodes that appear in deployed-in children (middle level, not already composed children)
  const deployedChildren = new Set(deployedInSets.flat().filter((id) => !composedChildren.has(id)));
  // All nodes that are container targets (the "container" node itself, i.e. the node that wraps others)
  // These are nodes referenced as containers in the relationships — we identify them by exclusion:
  // they appear in the overall node list but are not children themselves
  const allChildIds = new Set([...composedChildren, ...deployedChildren]);
  const external = nodeIds.filter((id) => !allChildIds.has(id));

  const positions = new Map<string, NodePosition>();

  // Row 0: external nodes
  const externalLayout = layoutRow(external, EXTERNAL_START_X, EXTERNAL_START_Y, COLS);
  for (const [id, pos] of externalLayout) positions.set(id, pos);

  const externalRows = Math.ceil(external.length / COLS);
  const externalHeight = externalRows * (COMP_H + ROW_GAP);
  let nextY = EXTERNAL_START_Y + externalHeight + SECTION_Y_GAP;

  // Row 1: deployed-only nodes (not composed children), laid out before composed children
  const deployedOnlyList = [...deployedChildren];
  if (deployedOnlyList.length > 0) {
    const deployedLayout = layoutRow(deployedOnlyList, EXTERNAL_START_X, nextY, COLS);
    for (const [id, pos] of deployedLayout) positions.set(id, pos);
    const deployedRows = Math.ceil(deployedOnlyList.length / COLS);
    nextY += deployedRows * (COMP_H + ROW_GAP) + SECTION_Y_GAP;
  }

  // Row 2+: composed children, laid out per composed-of group
  const processedComposed = new Set<string>();
  for (const group of composedOfSets) {
    const toLayout = group.filter((id) => !processedComposed.has(id));
    if (toLayout.length === 0) continue;
    const groupLayout = layoutRow(toLayout, EXTERNAL_START_X, nextY, COLS);
    groupLayout.forEach((pos, id) => {
      positions.set(id, pos);
      processedComposed.add(id);
    });
    const groupRows = Math.ceil(toLayout.length / COLS);
    nextY += groupRows * (COMP_H + ROW_GAP) + SECTION_Y_GAP;
  }

  // Any remaining nodes not yet positioned
  const remaining = nodeIds.filter((id) => !positions.has(id));
  if (remaining.length > 0) {
    const remainingLayout = layoutRow(remaining, EXTERNAL_START_X, nextY, COLS);
    for (const [id, pos] of remainingLayout) positions.set(id, pos);
  }

  return positions;
}
