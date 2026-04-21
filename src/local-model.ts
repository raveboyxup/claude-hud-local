import { t } from "./i18n/index.js";

export interface LocalModelInfo {
  name: string;
  contextWindow: number;
}

const DEFAULT_API_URL = "http://127.0.0.1:8086";

export async function fetchLocalModelInfo(
  apiUrl: string = DEFAULT_API_URL,
): Promise<LocalModelInfo | null> {
  try {
    const response = await fetch(`${apiUrl}/v1/models`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // OpenAI-compatible API returns data array with model details
    const models = data.data || data.models || [];
    if (!Array.isArray(models) || models.length === 0) {
      return null;
    }

    const model = models[0];
    const name = model.id || model.name || "local-model";
    const contextWindow = model.meta?.n_ctx_train || model.parameters?.n_ctx || 0;

    if (!contextWindow || contextWindow <= 0) {
      return null;
    }

    return { name, contextWindow };
  } catch {
    return null;
  }
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}k`;
  }
  return tokens.toString();
}
