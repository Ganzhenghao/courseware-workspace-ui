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
