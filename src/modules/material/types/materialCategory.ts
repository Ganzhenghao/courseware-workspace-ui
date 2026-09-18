export type MaterialCategoryCode = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';

export type ImageDimensionMode = 'NONE' | 'FIXED';

export interface MaterialCategory {
  id: number;
  code: MaterialCategoryCode;
  name: string;
  resourceSceneCode: string;
  allowedExts: string[];
  supportedExts: string[];
  maxSizeBytes: number;
  imageDimensionMode: ImageDimensionMode | null;
  imageWidth: number | null;
  imageHeight: number | null;
  maxDurationSeconds: number | null;
  enabled: boolean;
  aiAnalysisEnabled: boolean;
  /** 以下四个字段来自类别查询接口联查填充,悬空引用时名称为 null */
  aiProviderCode: string | null;
  aiProviderName: string | null;
  aiModelCode: string | null;
  aiModelName: string | null;
  sort: number;
  remark: string | null;
  updateTime: string | null;
}

export interface MaterialCategoryUpdate {
  code: MaterialCategoryCode;
  allowedExts: string[];
  maxSizeBytes: number;
  imageDimensionMode: ImageDimensionMode | null;
  imageWidth: number | null;
  imageHeight: number | null;
  maxDurationSeconds: number | null;
  aiAnalysisEnabled: boolean;
  /** 提供商编码与模型编码必须成对下发,均为 null 表示解除模型引用 */
  aiProviderCode: string | null;
  aiModelCode: string | null;
  sort: number;
  remark: string | null;
}

export interface MaterialCategoryStatus {
  code: MaterialCategoryCode;
  enabled: boolean;
}

export interface MaterialFileValidation {
  categoryCode: MaterialCategoryCode;
  originalFilename: string;
  extension: string;
  detectedMime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}
