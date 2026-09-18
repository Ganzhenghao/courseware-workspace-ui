import type { IPageQuery } from '@/api/types';
import type { AiHttpProtocol } from '@/modules/ai/types/provider';

export type AiModelCapability = 'TEXT' | 'VISION' | 'TOOL_CALL' | 'STRUCTURED_OUTPUT' | 'THINKING';
export type AiGenerationConfig = {
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  maxCompletionTokens?: number | null;
  frequencyPenalty?: number | null;
  presencePenalty?: number | null;
  thinkingBudget?: number | null;
  reasoningEffort?: 'low' | 'medium' | 'high' | null;
  topK?: number | null;
  seed?: number | null;
  cacheControl?: boolean | null;
  parallelToolCalls?: boolean | null;
  timeoutSeconds?: number | null;
  maxAttempts?: number | null;
  additionalHeaders: Record<string, string>;
  additionalBodyParams: Record<string, unknown>;
  additionalQueryParams: Record<string, string>;
};
export type AiModel = {
  id: number;
  providerId: number;
  providerCode?: string | null;
  providerName?: string | null;
  providerEnabled: boolean;
  modelCode: string;
  displayName: string;
  remoteModelName: string;
  modelType: 'CHAT';
  contextWindow?: number | null;
  httpProtocol?: AiHttpProtocol | null;
  streamEnabled: boolean;
  thinkingEnabled: boolean;
  capabilities: AiModelCapability[];
  generationConfig: AiGenerationConfig;
  enabled: boolean;
  available: boolean;
  sort: number;
  remark?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
};
export type AiModelQuery = IPageQuery & {
  modelCode?: string;
  displayName?: string;
  remoteModelName?: string;
  providerId?: number;
  enabled?: boolean;
};
export type AiModelPayload = {
  modelCode: string;
  providerId: number;
  displayName: string;
  remoteModelName: string;
  contextWindow?: number | null;
  httpProtocol?: AiHttpProtocol | null;
  streamEnabled: boolean;
  thinkingEnabled: boolean;
  capabilities: AiModelCapability[];
  generationConfig: AiGenerationConfig;
  enabled: boolean;
  sort: number;
  remark?: string | null;
};
export type AiModelUpdate = Omit<AiModelPayload, 'modelCode'> & { id: number };
export type AiModelOption = {
  id: number;
  providerId: number;
  /** 提供商记录缺失时后端返回 null */
  providerCode: string | null;
  providerName: string | null;
  modelCode: string;
  displayName: string;
  enabled: boolean;
  /** 模型启用且所属提供商启用 */
  available: boolean;
};
export type AiModelTestResult = {
  elapsedMillis: number;
  responseText?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
};
