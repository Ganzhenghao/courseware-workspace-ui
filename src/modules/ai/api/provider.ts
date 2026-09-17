import { createModuleHttp } from '@/api/client';
import type { IPage } from '@/api/types';
import type {
  AiAdapterOption,
  AiProvider,
  AiProviderOption,
  AiProviderPayload,
  AiProviderQuery,
  AiProviderUpdate,
  AiStatusPayload
} from '@/modules/ai/types/provider';

const aiHttp = createModuleHttp('ai');

export const getAiProviderPageApi = (params: AiProviderQuery) => aiHttp.get<IPage<AiProvider>>('/provider/pageQuery', params);
export const getAiProviderByIdApi = (id: number) => aiHttp.get<AiProvider>(`/provider/getById/${id}`);
export const getAiAdapterOptionsApi = () => aiHttp.get<AiAdapterOption[]>('/provider/adapterOptions');
export const getAiProviderOptionsApi = () => aiHttp.get<AiProviderOption[]>('/provider/options');
export const createAiProviderApi = (params: AiProviderPayload) => aiHttp.post<number>('/provider/create', params);
export const updateAiProviderApi = (params: AiProviderUpdate) => aiHttp.post<void>('/provider/update', params);
export const changeAiProviderStatusApi = (params: AiStatusPayload) => aiHttp.post<void>('/provider/changeStatus', params);
export const deleteAiProviderApi = (id: number) => aiHttp.post<void>(`/provider/delete/${id}`);
