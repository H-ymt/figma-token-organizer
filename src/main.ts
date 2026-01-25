import { emit, on, showUI } from "@create-figma-plugin/utilities";
import { scanSelectedNodes } from "./scanner/color-scanner";
import { createAndApplyTokens } from "./patcher/color-patcher";
import { GroqClient } from "./api/groq";
import { ClaudeClient } from "./api/claude";
import { ZaiClient } from "./api/zai";
import { OpenAICompatibleClient } from "./api/openai-compatible";
import type { AIClient } from "./api/base";
import type { ExtractedColor } from "./types/index";
import type { PromptConfig, RefineTokensRequest } from "./api/types";

// スキャン結果を保持
let lastScanResult: { colors: ExtractedColor[]; nodeInfos: any[] } | null = null;

export default function () {
  console.log("[main] Plugin started");

  // スキャン: 選択ノードから色を抽出
  on("SCAN", async () => {
    console.log("[main] SCAN received");
    try {
      const result = scanSelectedNodes();
      lastScanResult = result;
      console.log("[main] colors:", result.colors.length, "nodes:", result.nodeInfos.length);
      emit("SCAN_COMPLETE", {
        colorCount: result.colors.length,
        nodeCount: result.nodeInfos.length,
        colors: result.colors.map((c) => ({ hex: c.hex, count: c.count })),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[main] SCAN error:", errorMessage);
      emit("SCAN_ERROR", { error: errorMessage });
    }
  });

  // AI分析: 色からセマンティックトークンを生成
  on("GENERATE_TOKENS", async (msg: {
    provider: string;
    apiKey?: string;
    baseURL?: string;
    model?: string;
    promptConfig: PromptConfig;
  }) => {
    console.log("[main] GENERATE_TOKENS received");
    if (!lastScanResult || lastScanResult.colors.length === 0) {
      emit("GENERATE_TOKENS_ERROR", { error: "No colors to analyze. Please scan first." });
      return;
    }

    try {
      const { provider, apiKey, baseURL, model, promptConfig } = msg;
      let client: AIClient;

      switch (provider) {
        case "groq":
          client = new GroqClient({ apiKey: apiKey! });
          break;
        case "claude":
          client = new ClaudeClient({ apiKey: apiKey! });
          break;
        case "zai":
          client = new ZaiClient({ apiKey: apiKey! });
          break;
        case "ollama":
          client = new OpenAICompatibleClient({
            apiKey: "",
            baseURL: baseURL || "http://localhost:11434/v1",
            model: model || "gemma3",
          });
          break;
        case "openai-compatible":
          client = new OpenAICompatibleClient({
            apiKey: apiKey || "",
            baseURL: baseURL!,
            model: model!,
          });
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // コンテキスト情報を含めてAIに渡す（トークン名精度向上のため）
      const colors = lastScanResult.colors.map((c) => ({
        hex: c.hex,
        count: c.count,
        contexts: c.contexts.map((ctx) => ({
          nodeName: ctx.nodeName,
          nodeType: ctx.nodeType,
          parentPath: ctx.parentPath,
          usageType: ctx.usageType,
        })),
      }));

      console.log("[main] Calling AI with", colors.length, "colors, style:", promptConfig.namingStyle);
      const response = await client.generateTokens(colors, promptConfig);
      console.log("[main] AI returned", response.tokens?.length, "tokens");

      emit("GENERATE_TOKENS_COMPLETE", { tokens: response.tokens });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[main] GENERATE_TOKENS error:", errorMessage);
      emit("GENERATE_TOKENS_ERROR", { error: errorMessage });
    }
  });

  // チャット: トークン名の改善
  on("REFINE_TOKENS", async (msg: {
    provider: string;
    apiKey?: string;
    baseURL?: string;
    model?: string;
    request: RefineTokensRequest;
  }) => {
    console.log("[main] REFINE_TOKENS received");
    try {
      const { provider, apiKey, baseURL, model, request } = msg;
      let client: AIClient;

      switch (provider) {
        case "groq":
          client = new GroqClient({ apiKey: apiKey! });
          break;
        case "claude":
          client = new ClaudeClient({ apiKey: apiKey! });
          break;
        case "zai":
          client = new ZaiClient({ apiKey: apiKey! });
          break;
        case "ollama":
          client = new OpenAICompatibleClient({
            apiKey: "",
            baseURL: baseURL || "http://localhost:11434/v1",
            model: model || "gemma3",
          });
          break;
        case "openai-compatible":
          client = new OpenAICompatibleClient({
            apiKey: apiKey || "",
            baseURL: baseURL!,
            model: model!,
          });
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      console.log("[main] Refining tokens with feedback:", request.feedback);
      const response = await client.refineTokens(request);
      console.log("[main] AI returned", response.tokens?.length, "refined tokens");

      emit("REFINE_TOKENS_COMPLETE", { tokens: response.tokens });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[main] REFINE_TOKENS error:", errorMessage);
      emit("REFINE_TOKENS_ERROR", { error: errorMessage });
    }
  });

  // 適用: トークンを変数として作成し、ノードに適用
  on("APPLY_TOKENS", async (msg: { tokens: Array<{ hex: string; name: string }> }) => {
    console.log("[main] APPLY_TOKENS received");
    if (!lastScanResult) {
      emit("APPLY_TOKENS_ERROR", { error: "No scan result. Please scan first." });
      return;
    }

    try {
      const result = await createAndApplyTokens(msg.tokens, lastScanResult.colors);
      console.log("[main] Applied:", result.success, "success,", result.failed, "failed");
      emit("APPLY_TOKENS_COMPLETE", result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[main] APPLY_TOKENS error:", errorMessage);
      emit("APPLY_TOKENS_ERROR", { error: errorMessage });
    }
  });

  showUI({ height: 560, width: 400 });
}
