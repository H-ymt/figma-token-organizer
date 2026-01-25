import type { TokenOutput } from "../api/types";
import type { ExtractedColor, ApplyResult } from "../types/index";

const COLLECTION_NAME = "Design Tokens";

/**
 * トークンからFigma変数を作成し、ノードに適用する
 */
export async function createAndApplyTokens(
  tokens: TokenOutput[],
  extractedColors: ExtractedColor[]
): Promise<ApplyResult> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // 1. コレクションを取得または作成
    const collection = await getOrCreateCollection(COLLECTION_NAME);
    const modeId = collection.modes[0].modeId;

    // 2. 既存の変数名を取得
    const existingNames = new Set<string>();
    for (const varId of collection.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(varId);
      if (v) existingNames.add(v.name);
    }

    // 3. hex -> variableId のマップを作成
    const hexToVariableId = new Map<string, string>();
    const usedNames = new Set<string>(existingNames);

    // 4. 各トークンの変数を作成
    for (const token of tokens) {
      try {
        // ユニークな名前を生成
        let name = token.name;
        let counter = 1;
        while (usedNames.has(name)) {
          name = `${token.name}_${counter}`;
          counter++;
        }
        usedNames.add(name);

        const variable = figma.variables.createVariable(
          name,
          collection,
          "COLOR"
        );

        const rgb = hexToRgb(token.hex);
        variable.setValueForMode(modeId, rgb);

        hexToVariableId.set(token.hex.toUpperCase(), variable.id);
      } catch (err) {
        errors.push(`Failed to create "${token.name}": ${err}`);
      }
    }

    // 4. 各ノードに変数を適用
    for (const color of extractedColors) {
      const variableId = hexToVariableId.get(color.hex.toUpperCase());
      if (!variableId) {
        continue; // このトークンに対応する変数がない
      }

      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (!variable) {
        errors.push(`Variable not found for ${color.hex}`);
        failed += color.usages.length;
        continue;
      }

      for (const usage of color.usages) {
        try {
          const node = figma.getNodeById(usage.nodeId);
          if (!node) {
            errors.push(`Node not found: ${usage.nodeId}`);
            failed++;
            continue;
          }

          if (usage.type === "fill" && "fills" in node) {
            const fills = (node as GeometryMixin).fills;
            if (Array.isArray(fills) && fills[usage.index]) {
              const newFills = [...fills];
              newFills[usage.index] = figma.variables.setBoundVariableForPaint(
                newFills[usage.index] as SolidPaint,
                "color",
                variable
              );
              (node as GeometryMixin).fills = newFills;
              success++;
            }
          } else if (usage.type === "stroke" && "strokes" in node) {
            const strokes = (node as GeometryMixin).strokes;
            if (Array.isArray(strokes) && strokes[usage.index]) {
              const newStrokes = [...strokes];
              newStrokes[usage.index] = figma.variables.setBoundVariableForPaint(
                newStrokes[usage.index] as SolidPaint,
                "color",
                variable
              );
              (node as GeometryMixin).strokes = newStrokes;
              success++;
            }
          }
        } catch (err) {
          errors.push(`Failed to apply to node ${usage.nodeId}: ${err}`);
          failed++;
        }
      }
    }
  } catch (err) {
    errors.push(`Critical error: ${err}`);
  }

  return { success, failed, errors };
}

/**
 * コレクションを取得または作成
 */
async function getOrCreateCollection(name: string): Promise<VariableCollection> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existing = collections.find((c) => c.name === name);

  if (existing) {
    return existing;
  }

  return figma.variables.createVariableCollection(name);
}

/**
 * HEX を RGB オブジェクトに変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}
