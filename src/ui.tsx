import { Button, Container, render, Text, Textbox, VerticalSpace } from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { Fragment, h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import styles from "./styles.css";
import { useConfigStore } from "./store";

const PROVIDER_LABELS: Record<string, string> = {
  groq: "Groq",
  claude: "Claude",
  zai: "Z.AI",
  ollama: "Ollama",
  "openai-compatible": "OpenAI互換",
};

type Step = "idle" | "scanning" | "scanned" | "generating" | "generated" | "refining" | "applying" | "done";

interface Token {
  hex: string;
  name: string;
}

function Plugin() {
  const {
    provider,
    groqApiKey,
    claudeApiKey,
    zaiApiKey,
    ollamaBaseURL,
    ollamaModel,
    openaiCompatibleBaseURL,
    openaiCompatibleApiKey,
    openaiCompatibleModel,
    namingStyle,
    existingTokens,
    setProvider,
    setGroqApiKey,
    setClaudeApiKey,
    setZaiApiKey,
    setOllamaBaseURL,
    setOllamaModel,
    setOpenaiCompatibleBaseURL,
    setOpenaiCompatibleApiKey,
    setOpenaiCompatibleModel,
    setNamingStyle,
    setExistingTokens,
  } = useConfigStore();

  const [step, setStep] = useState<Step>("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promptSettingsOpen, setPromptSettingsOpen] = useState(false);

  const [scanResult, setScanResult] = useState<{
    colorCount: number;
    nodeCount: number;
    colors: Array<{ hex: string; count: number }>;
  } | null>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [applyResult, setApplyResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribers = [
      on("SCAN_COMPLETE", (data: any) => {
        console.log("[ui] SCAN_COMPLETE:", data);
        setScanResult(data);
        setStep("scanned");
      }),
      on("SCAN_ERROR", (data: any) => {
        setError(typeof data === "string" ? data : data?.error || JSON.stringify(data));
        setStep("idle");
      }),
      on("GENERATE_TOKENS_COMPLETE", (data: { tokens: Token[] }) => {
        console.log("[ui] GENERATE_TOKENS_COMPLETE:", data);
        setTokens(data.tokens || []);
        setStep("generated");
      }),
      on("GENERATE_TOKENS_ERROR", (data: any) => {
        setError(typeof data === "string" ? data : data?.error || JSON.stringify(data));
        setStep("scanned");
      }),
      on("APPLY_TOKENS_COMPLETE", (data: any) => {
        console.log("[ui] APPLY_TOKENS_COMPLETE:", data);
        setApplyResult(data);
        setStep("done");
      }),
      on("APPLY_TOKENS_ERROR", (data: any) => {
        setError(typeof data === "string" ? data : data?.error || JSON.stringify(data));
        setStep("generated");
      }),
      on("REFINE_TOKENS_COMPLETE", (data: { tokens: Token[] }) => {
        console.log("[ui] REFINE_TOKENS_COMPLETE:", data);
        setTokens(data.tokens || []);
        setStep("generated");
        setChatInput("");
        setSelectedTokenIndex(null);
      }),
      on("REFINE_TOKENS_ERROR", (data: any) => {
        setError(typeof data === "string" ? data : data?.error || JSON.stringify(data));
        setStep("generated");
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const getApiConfig = () => {
    switch (provider) {
      case "groq":
        return { apiKey: groqApiKey };
      case "claude":
        return { apiKey: claudeApiKey };
      case "zai":
        return { apiKey: zaiApiKey };
      case "ollama":
        return { baseURL: ollamaBaseURL, model: ollamaModel };
      case "openai-compatible":
        return {
          apiKey: openaiCompatibleApiKey,
          baseURL: openaiCompatibleBaseURL,
          model: openaiCompatibleModel,
        };
      default:
        return {};
    }
  };

  const isConfigValid = () => {
    switch (provider) {
      case "groq":
        return !!groqApiKey;
      case "claude":
        return !!claudeApiKey;
      case "zai":
        return !!zaiApiKey;
      case "ollama":
        return !!ollamaBaseURL;
      case "openai-compatible":
        return !!openaiCompatibleBaseURL;
      default:
        return false;
    }
  };

  const handleScan = useCallback(() => {
    setStep("scanning");
    setError(null);
    setScanResult(null);
    setTokens([]);
    setApplyResult(null);
    emit("SCAN");
  }, []);

  const handleGenerate = useCallback(() => {
    if (!scanResult || !isConfigValid()) {
      setError(scanResult ? "API設定が必要です" : "先にスキャンしてください");
      return;
    }
    setStep("generating");
    setError(null);
    setTokens([]);
    emit("GENERATE_TOKENS", {
      provider,
      ...getApiConfig(),
      promptConfig: {
        namingStyle,
        existingTokens: existingTokens || undefined,
      },
    });
  }, [scanResult, provider, groqApiKey, claudeApiKey, zaiApiKey, ollamaBaseURL, ollamaModel, openaiCompatibleBaseURL, openaiCompatibleApiKey, openaiCompatibleModel, namingStyle, existingTokens]);

  const handleApply = useCallback(() => {
    if (tokens.length === 0) {
      setError("適用するトークンがありません");
      return;
    }
    setStep("applying");
    setError(null);
    emit("APPLY_TOKENS", { tokens });
  }, [tokens]);

  const handleReset = useCallback(() => {
    setStep("idle");
    setScanResult(null);
    setTokens([]);
    setApplyResult(null);
    setError(null);
    setEditingIndex(null);
    setSelectedTokenIndex(null);
    setChatInput("");
  }, []);

  // トークン名の直接編集
  const handleStartEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditingValue(tokens[index].name);
  }, [tokens]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex !== null && editingValue.trim()) {
      setTokens((prev) => prev.map((t, i) => (i === editingIndex ? { ...t, name: editingValue.trim() } : t)));
    }
    setEditingIndex(null);
    setEditingValue("");
  }, [editingIndex, editingValue]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
  }, []);

  // トークンの選択（個別チャット用）
  const handleSelectToken = useCallback((index: number) => {
    setSelectedTokenIndex((prev) => (prev === index ? null : index));
  }, []);

  // チャットでトークン改善
  const handleRefine = useCallback(() => {
    if (!chatInput.trim() || !isConfigValid()) return;

    setStep("refining");
    setError(null);

    const request = selectedTokenIndex !== null
      ? {
          currentTokens: tokens,
          feedback: chatInput.trim(),
          targetToken: tokens[selectedTokenIndex],
        }
      : {
          currentTokens: tokens,
          feedback: chatInput.trim(),
        };

    emit("REFINE_TOKENS", {
      provider,
      ...getApiConfig(),
      request,
    });
  }, [chatInput, tokens, selectedTokenIndex, provider, getApiConfig, isConfigValid]);

  const isProcessing = step === "scanning" || step === "generating" || step === "applying" || step === "refining";

  return (
    <Container space="medium">
      <VerticalSpace space="small" />

      {/* ヘッダー */}
      <div class={styles.header}>
        <div class={styles.headerLeft}>
          {isConfigValid() ? (
            <div class={styles.providerBadge}>
              <span class={styles.statusDot} />
              {PROVIDER_LABELS[provider]}
            </div>
          ) : (
            <div class={styles.providerBadgeInactive}>未設定</div>
          )}
        </div>
        <button class={styles.settingsButton} onClick={() => setSettingsOpen(!settingsOpen)}>
          設定
        </button>
      </div>

      {/* 設定パネル */}
      {settingsOpen && (
        <div class={styles.settingsPanel}>
          <VerticalSpace space="small" />
          <Text>
            <span class={styles.label}>AIプロバイダー</span>
          </Text>
          <VerticalSpace space="extraSmall" />
          <select class={styles.select} onChange={(e: any) => setProvider(e.target.value)} value={provider}>
            <option value="groq">Groq (高速・無料枠あり)</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="zai">Z.AI (GLM)</option>
            <option value="ollama">Ollama (ローカル)</option>
            <option value="openai-compatible">OpenAI互換</option>
          </select>
          <VerticalSpace space="small" />

          {provider === "groq" && (
            <div>
              <Text>
                <span class={styles.label}>API Key</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={groqApiKey} onValueInput={setGroqApiKey} placeholder="gsk_..." password />
              <div class={styles.hint}>
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener">
                  Groq Consoleで取得
                </a>
              </div>
            </div>
          )}

          {provider === "claude" && (
            <div>
              <Text>
                <span class={styles.label}>API Key</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={claudeApiKey} onValueInput={setClaudeApiKey} placeholder="sk-ant-..." password />
              <div class={styles.hint}>
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener">
                  Anthropic Consoleで取得
                </a>
              </div>
            </div>
          )}

          {provider === "zai" && (
            <div>
              <Text>
                <span class={styles.label}>API Key</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={zaiApiKey} onValueInput={setZaiApiKey} placeholder="Z.AI API Key" password />
              <div class={styles.hint}>
                <a href="https://z.ai/model-api" target="_blank" rel="noopener">
                  Z.AIで取得
                </a>
              </div>
            </div>
          )}

          {provider === "ollama" && (
            <div>
              <Text>
                <span class={styles.label}>エンドポイント</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={ollamaBaseURL} onValueInput={setOllamaBaseURL} placeholder="http://localhost:11434/v1" />
              <VerticalSpace space="small" />
              <Text>
                <span class={styles.label}>モデル</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={ollamaModel} onValueInput={setOllamaModel} placeholder="gemma3" />
              <div class={styles.hint}>OLLAMA_ORIGINS="*" ollama serve で起動</div>
            </div>
          )}

          {provider === "openai-compatible" && (
            <div>
              <Text>
                <span class={styles.label}>Base URL</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={openaiCompatibleBaseURL} onValueInput={setOpenaiCompatibleBaseURL} placeholder="http://localhost:8080/v1" />
              <VerticalSpace space="small" />
              <Text>
                <span class={styles.label}>API Key (任意)</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={openaiCompatibleApiKey} onValueInput={setOpenaiCompatibleApiKey} placeholder="" password />
              <VerticalSpace space="small" />
              <Text>
                <span class={styles.label}>モデル</span>
              </Text>
              <VerticalSpace space="extraSmall" />
              <Textbox value={openaiCompatibleModel} onValueInput={setOpenaiCompatibleModel} placeholder="model-name" />
            </div>
          )}
          <VerticalSpace space="small" />
        </div>
      )}

      {/* プロンプト設定ボタン */}
      <VerticalSpace space="small" />
      <button class={styles.settingsButton} onClick={() => setPromptSettingsOpen(!promptSettingsOpen)} style={{ width: "100%" }}>
        プロンプト設定 {promptSettingsOpen ? "▲" : "▼"}
      </button>

      {/* プロンプト設定パネル */}
      {promptSettingsOpen && (
        <div class={styles.settingsPanel}>
          <VerticalSpace space="small" />
          <Text>
            <span class={styles.label}>命名スタイル</span>
          </Text>
          <VerticalSpace space="extraSmall" />
          <select class={styles.select} onChange={(e: any) => setNamingStyle(e.target.value)} value={namingStyle}>
            <option value="custom">セマンティック (Text/, Background/, Border/...)</option>
            <option value="tailwind">Tailwind (blue-500, gray-100...)</option>
            <option value="material">Material (primary, surface, onPrimary...)</option>
          </select>
          <VerticalSpace space="small" />

          <Text>
            <span class={styles.label}>既存トークンの例（任意）</span>
          </Text>
          <VerticalSpace space="extraSmall" />
          <textarea
            class={styles.textarea}
            value={existingTokens}
            onInput={(e: any) => setExistingTokens(e.target.value)}
            placeholder="例:&#10;Primary/Main&#10;Primary/Light&#10;Text/Body&#10;Background/Surface"
            rows={4}
          />
          <div class={styles.hint}>AIにこのパターンに従わせたい場合に入力</div>
          <VerticalSpace space="small" />
        </div>
      )}

      <VerticalSpace space="medium" />

      {/* ステップインジケーター */}
      <div class={styles.steps}>
        <div class={`${styles.step} ${step !== "idle" ? styles.stepActive : ""} ${["scanned", "generated", "done"].includes(step) ? styles.stepDone : ""}`}>
          <div class={styles.stepNumber}>1</div>
          <div class={styles.stepLabel}>抽出</div>
        </div>
        <div class={styles.stepLine} />
        <div class={`${styles.step} ${["generating", "generated", "applying", "done"].includes(step) ? styles.stepActive : ""} ${["generated", "done"].includes(step) ? styles.stepDone : ""}`}>
          <div class={styles.stepNumber}>2</div>
          <div class={styles.stepLabel}>AI命名</div>
        </div>
        <div class={styles.stepLine} />
        <div class={`${styles.step} ${["applying", "done"].includes(step) ? styles.stepActive : ""} ${step === "done" ? styles.stepDone : ""}`}>
          <div class={styles.stepNumber}>3</div>
          <div class={styles.stepLabel}>作成</div>
        </div>
      </div>

      <VerticalSpace space="medium" />

      {/* メインコンテンツ */}
      {step === "idle" && (
        <div class={styles.card}>
          <div class={styles.cardIcon}>🎨</div>
          <div class={styles.cardTitle}>デザイントークン生成</div>
          <div class={styles.cardDesc}>選択したデザインから色を抽出し、AIがセマンティックなトークン名を提案します</div>
          <VerticalSpace space="small" />
          <Button fullWidth onClick={handleScan} disabled={!isConfigValid()}>
            色を抽出
          </Button>
          {!isConfigValid() && <div class={styles.cardHint}>まずAI設定を完了してください</div>}
        </div>
      )}

      {step === "scanning" && (
        <div class={styles.card}>
          <div class={styles.loader} />
          <div class={styles.cardTitle}>スキャン中...</div>
          <div class={styles.cardDesc}>選択中のノードから色を抽出しています</div>
        </div>
      )}

      {step === "scanned" && scanResult && (
        <div class={styles.card}>
          <div class={styles.scanResults}>
            <div class={styles.scanStat}>
              <div class={styles.scanStatValue}>{scanResult.colorCount}</div>
              <div class={styles.scanStatLabel}>色</div>
            </div>
            <div class={styles.scanStatDivider} />
            <div class={styles.scanStat}>
              <div class={styles.scanStatValue}>{scanResult.nodeCount}</div>
              <div class={styles.scanStatLabel}>ノード</div>
            </div>
          </div>
          <VerticalSpace space="small" />
          {scanResult.colorCount === 0 ? (
            <div>
              <div class={styles.warningBox}>色が見つかりません。Figmaでオブジェクトを選択してください。</div>
              <VerticalSpace space="small" />
              <Button fullWidth onClick={handleScan} secondary>
                再スキャン
              </Button>
            </div>
          ) : (
            <div>
              <div class={styles.colorPreview}>
                {scanResult.colors.slice(0, 10).map((c, i) => (
                  <div key={i} class={styles.colorSwatch} style={{ backgroundColor: c.hex }} title={`${c.hex} (${c.count})`} />
                ))}
                {scanResult.colors.length > 10 && <div class={styles.colorMore}>+{scanResult.colors.length - 10}</div>}
              </div>
              <VerticalSpace space="small" />
              <Button fullWidth onClick={handleGenerate}>
                AIでトークン名を生成
              </Button>
            </div>
          )}
        </div>
      )}

      {step === "generating" && (
        <div class={styles.card}>
          <div class={styles.loader} />
          <div class={styles.cardTitle}>AI分析中...</div>
          <div class={styles.cardDesc}>{PROVIDER_LABELS[provider]}がセマンティックなトークン名を考えています</div>
        </div>
      )}

      {step === "generated" && (
        <div class={styles.card}>
          {tokens.length > 0 ? (
            <div>
              <div class={styles.patchHeader}>
                <span class={styles.patchCount}>{tokens.length}個</span>のトークンを提案
              </div>
              <div class={styles.tokenList}>
                {tokens.map((token, i) => (
                  <div
                    class={`${styles.tokenItem} ${editingIndex === i ? styles.tokenItemEditing : ""} ${selectedTokenIndex === i ? styles.tokenItemEditing : ""}`}
                    key={i}
                  >
                    <div class={styles.tokenSwatch} style={{ backgroundColor: token.hex }} />
                    <div class={styles.tokenInfo}>
                      {editingIndex === i ? (
                        <input
                          type="text"
                          class={styles.tokenNameInput}
                          value={editingValue}
                          onInput={(e: any) => setEditingValue(e.target.value)}
                          onKeyDown={(e: any) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          class={styles.tokenNameEditable}
                          onClick={() => handleStartEdit(i)}
                          title="クリックして編集"
                        >
                          {token.name}
                        </div>
                      )}
                      <div class={styles.tokenHex}>{token.hex}</div>
                    </div>
                    <div class={styles.tokenActions}>
                      {editingIndex === i ? (
                        <Fragment>
                          <button class={styles.tokenActionBtn} onClick={handleSaveEdit} title="保存">
                            ✓
                          </button>
                          <button class={styles.tokenActionBtn} onClick={handleCancelEdit} title="キャンセル">
                            ✕
                          </button>
                        </Fragment>
                      ) : (
                        <button
                          class={`${styles.tokenActionBtn} ${selectedTokenIndex === i ? styles.tokenActionBtnActive : ""}`}
                          onClick={() => handleSelectToken(i)}
                          title="AIに再提案を依頼"
                        >
                          💬
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* チャットセクション */}
              <div class={styles.chatSection}>
                <div class={styles.chatHeader}>
                  💬 AIにフィードバック
                </div>
                {selectedTokenIndex !== null && (
                  <div class={styles.selectedTokenInfo}>
                    <span>選択中: {tokens[selectedTokenIndex].name}</span>
                    <button class={styles.selectedTokenClear} onClick={() => setSelectedTokenIndex(null)}>
                      ✕
                    </button>
                  </div>
                )}
                <div class={styles.chatInputWrapper}>
                  <input
                    type="text"
                    class={styles.chatInput}
                    value={chatInput}
                    onInput={(e: any) => setChatInput(e.target.value)}
                    onKeyDown={(e: any) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRefine();
                      }
                    }}
                    placeholder={selectedTokenIndex !== null ? "この名前を変えてほしい理由..." : "全体への指示（例: 青系をもっとシンプルに）"}
                  />
                  <button class={styles.chatSendBtn} onClick={handleRefine} disabled={!chatInput.trim()}>
                    送信
                  </button>
                </div>
              </div>

              <VerticalSpace space="small" />
              <Button fullWidth onClick={handleApply}>
                変数を作成して適用
              </Button>
            </div>
          ) : (
            <div>
              <div class={styles.cardIcon}>⚠</div>
              <div class={styles.cardTitle}>トークンが生成されませんでした</div>
              <VerticalSpace space="small" />
              <Button fullWidth onClick={handleGenerate} secondary>
                再試行
              </Button>
            </div>
          )}
        </div>
      )}

      {step === "refining" && (
        <div class={styles.card}>
          <div class={styles.loader} />
          <div class={styles.cardTitle}>AIが再考中...</div>
          <div class={styles.cardDesc}>フィードバックを元にトークン名を改善しています</div>
        </div>
      )}

      {step === "applying" && (
        <div class={styles.card}>
          <div class={styles.loader} />
          <div class={styles.cardTitle}>作成中...</div>
          <div class={styles.cardDesc}>Figma変数を作成してノードに適用しています</div>
        </div>
      )}

      {step === "done" && applyResult && (
        <div class={styles.card}>
          <div class={styles.cardIcon}>{applyResult.failed === 0 ? "✓" : "⚠"}</div>
          <div class={styles.cardTitle}>{applyResult.failed === 0 ? "完了!" : "一部エラー"}</div>
          <div class={styles.doneStats}>
            <span class={styles.doneSuccess}>{applyResult.success}件 成功</span>
            {applyResult.failed > 0 && <span class={styles.doneFailed}>{applyResult.failed}件 失敗</span>}
          </div>
          {applyResult.errors.length > 0 && (
            <div class={styles.errors}>
              {applyResult.errors.slice(0, 3).map((err, i) => (
                <div key={i}>{err}</div>
              ))}
              {applyResult.errors.length > 3 && <div>...他{applyResult.errors.length - 3}件</div>}
            </div>
          )}
          <VerticalSpace space="small" />
          <div class={styles.cardDesc}>「Design Tokens」コレクションに変数が作成されました</div>
          <VerticalSpace space="small" />
          <Button fullWidth onClick={handleReset} secondary>
            新しいスキャンを開始
          </Button>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div>
          <VerticalSpace space="small" />
          <div class={styles.errorBox}>{error}</div>
        </div>
      )}

      <VerticalSpace space="medium" />
    </Container>
  );
}

export default render(Plugin);
