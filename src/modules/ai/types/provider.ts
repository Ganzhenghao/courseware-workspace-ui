import type { IPageQuery } from '@/api/types';

export type AiAdapterType = 'OPENAI' | 'DEEPSEEK' | 'DASHSCOPE' | 'OLLAMA';
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
