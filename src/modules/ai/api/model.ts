import { createModuleHttp } from '@/api/client';
import type { IPage } from '@/api/types';
import type { AiStatusPayload } from '@/modules/ai/types/provider';
import type { AiModel, AiModelPayload, AiModelQuery, AiModelTestResult, AiModelUpdate } from '@/modules/ai/types/model';

const aiHttp = createModuleHttp('ai');

export const getAiModelPageApi = (params: AiModelQuery) => aiHttp.get<IPage<AiModel>>('/model/pageQuery', params);
export const getAiModelByIdApi = (id: number) => aiHttp.get<AiModel>(`/model/getById/${id}`);
export const createAiModelApi = (params: AiModelPayload) => aiHttp.post<number>('/model/create', params);
export const updateAiModelApi = (params: AiModelUpdate) => aiHttp.post<void>('/model/update', params);
export const changeAiModelStatusApi = (params: AiStatusPayload) => aiHttp.post<void>('/model/changeStatus', params);
export const deleteAiModelApi = (id: number) => aiHttp.post<void>(`/model/delete/${id}`);
export const testAiModelApi = (id: number) => aiHttp.post<AiModelTestResult>(`/model/test/${id}`);
