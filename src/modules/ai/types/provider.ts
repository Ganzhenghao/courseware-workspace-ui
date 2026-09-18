import type { IPageQuery } from '@/api/types';

export type AiAdapterType = 'OPENAI' | 'DEEPSEEK' | 'DASHSCOPE' | 'OLLAMA';
/** 为空时走后端框架默认协议；模型侧为空时继承提供商配置 */
export type AiHttpProtocol = 'HTTP_1_1' | 'HTTP_2';
export type AiProviderConnectionConfig = {
  additionalHeaders: Record<string, string>;
  additionalQueryParams: Record<string, string>;
};
export type AiAdapterOption = {
  value: AiAdapterType;
  label: string;
  defaultBaseUrl: string;
  credentialRequired: boolean;
};
export type AiProviderOption = {
  id: number;
  providerCode: string;
  providerName: string;
  adapterType: AiAdapterType;
  enabled: boolean;
};
export type AiProvider = AiProviderOption & {
  baseUrl?: string | null;
  effectiveBaseUrl: string;
  endpointPath?: string | null;
  httpProtocol?: AiHttpProtocol | null;
  credentialConfigured: boolean;
  credentialHint?: string | null;
  connectionConfig: AiProviderConnectionConfig;
  sort: number;
  remark?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
};
export type AiProviderQuery = IPageQuery & {
  providerCode?: string;
  providerName?: string;
  adapterType?: AiAdapterType;
  enabled?: boolean;
};
export type AiProviderPayload = {
  providerCode: string;
  providerName: string;
  adapterType: AiAdapterType;
  baseUrl?: string | null;
  endpointPath?: string | null;
  httpProtocol?: AiHttpProtocol | null;
  credential?: string | null;
  connectionConfig: AiProviderConnectionConfig;
  enabled: boolean;
  sort: number;
  remark?: string | null;
};
export type AiProviderUpdate = Omit<AiProviderPayload, 'providerCode' | 'adapterType'> & {
  id: number;
  clearCredential?: boolean;
};
export type AiStatusPayload = { id: number; enabled: boolean };
