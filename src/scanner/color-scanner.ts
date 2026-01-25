import type { ColorUsageContext, ExtractedColor, NodeColorInfo } from "../types/index";

/**
 * 選択されたノードから全ての色を抽出する
 * - 直接設定された色
 * - スタイル経由の色
 * - 変数経由の色
 * 全て収集して、ユニークな色リストを返す
 *
 * 各色に対してコンテキスト情報（ノード名、親階層、使用タイプ）も収集し、
 * AIがより適切なトークン名を生成できるようにする
 */
export function scanSelectedNodes(): { colors: ExtractedColor[]; nodeInfos: NodeColorInfo[] } {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    return { colors: [], nodeInfos: [] };
  }

  const colorMap = new Map<string, ExtractedColor>();
  const nodeInfos: NodeColorInfo[] = [];

  for (const node of selection) {
    extractColorsFromNode(node, colorMap, nodeInfos, []);
  }

  return {
    colors: Array.from(colorMap.values()),
    nodeInfos,
  };
}

/**
 * ノードの親階層パスを構築する
 * 例: "Frame/Card/Button" のような形式
 */
function buildParentPath(parentNames: string[]): string {
  if (parentNames.length === 0) return "";
  // 最大3階層まで表示（深すぎると冗長になるため）
  const relevantNames = parentNames.slice(-3);
  return relevantNames.join("/");
}

function extractColorsFromNode(
  node: SceneNode,
  colorMap: Map<string, ExtractedColor>,
  nodeInfos: NodeColorInfo[],
  parentNames: string[]
) {
  const fills: Array<{ hex: string; index: number }> = [];
  const strokes: Array<{ hex: string; index: number }> = [];
  const parentPath = buildParentPath(parentNames);

  // fills を抽出
  if ("fills" in node && Array.isArray(node.fills)) {
    node.fills.forEach((fill, index) => {
      if (fill.type === "SOLID" && fill.visible !== false) {
        const hex = rgbToHex(fill.color);
        fills.push({ hex, index });
        addToColorMap(colorMap, hex, node.id, "fill", index, {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          parentPath,
          usageType: "fill",
        });
      }
    });
  }

  // strokes を抽出
  if ("strokes" in node && Array.isArray(node.strokes)) {
    node.strokes.forEach((stroke, index) => {
      if (stroke.type === "SOLID" && stroke.visible !== false) {
        const hex = rgbToHex(stroke.color);
        strokes.push({ hex, index });
        addToColorMap(colorMap, hex, node.id, "stroke", index, {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          parentPath,
          usageType: "stroke",
        });
      }
    });
  }

  if (fills.length > 0 || strokes.length > 0) {
    nodeInfos.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      parentPath,
      fills,
      strokes,
    });
  }

  // 子ノードを再帰的に処理（現在のノード名を親パスに追加）
  if ("children" in node) {
    const newParentNames = [...parentNames, node.name];
    for (const child of node.children) {
      extractColorsFromNode(child, colorMap, nodeInfos, newParentNames);
    }
  }
}

function addToColorMap(
  colorMap: Map<string, ExtractedColor>,
  hex: string,
  nodeId: string,
  type: "fill" | "stroke",
  index: number,
  context: ColorUsageContext
) {
  const existing = colorMap.get(hex);
  if (existing) {
    existing.usages.push({ nodeId, type, index });
    existing.contexts.push(context);
    existing.count++;
  } else {
    colorMap.set(hex, {
      hex,
      count: 1,
      usages: [{ nodeId, type, index }],
      contexts: [context],
    });
  }
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}
