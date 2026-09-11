<template>
  <el-dialog v-model="visible" title="编辑素材类别规则" :width="dialogWidth" destroy-on-close draggable>
    <div v-if="category" class="category-summary">
      <div>
        <span class="summary-name">{{ category.name }}</span>
        <el-tag effect="plain">{{ category.code }}</el-tag>
      </div>
      <span class="summary-scene">资源场景：{{ category.resourceSceneCode }}</span>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" label-position="right">
      <el-form-item label="允许格式" prop="allowedExts">
        <el-checkbox-group v-model="form.allowedExts" class="extension-options">
          <el-checkbox-button v-for="ext in category?.supportedExts || []" :key="ext" :value="ext">
            .{{ ext }}
          </el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="大小上限" prop="maxSizeValue">
        <div class="size-input">
          <el-input-number
            v-model="form.maxSizeValue"
            :min="sizeMinValue"
            :max="sizeMaxValue"
            :precision="sizePrecision"
            :step="sizeStep"
            controls-position="right"
          />
          <el-select v-model="selectedSizeUnit" class="size-unit" aria-label="文件大小单位">
            <el-option v-for="unit in sizeUnits" :key="unit" :label="unit" :value="unit" />
          </el-select>
        </div>
        <span class="field-tip">单位可选 KB、MB、GB，最终按字节保存；不能超过系统 multipart 的 10 MiB 限制</span>
      </el-form-item>

      <template v-if="form.code === 'IMAGE'">
        <el-form-item label="尺寸规则" prop="imageDimensionMode">
          <el-radio-group v-model="form.imageDimensionMode">
            <el-radio-button value="NONE">不限制</el-radio-button>
            <el-radio-button value="FIXED">固定尺寸</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.imageDimensionMode === 'FIXED'" label="显示尺寸" required>
          <div class="dimension-inputs">
            <el-input-number v-model="form.imageWidth" :min="1" :precision="0" controls-position="right" placeholder="宽度" />
            <span>×</span>
            <el-input-number v-model="form.imageHeight" :min="1" :precision="0" controls-position="right" placeholder="高度" />
            <span>px</span>
          </div>
          <div class="field-tip block-tip">按 EXIF 方向修正后的显示宽高进行校验</div>
        </el-form-item>
      </template>

      <el-form-item v-if="isMedia" label="时长上限" prop="maxDurationSeconds">
        <el-input-number v-model="form.maxDurationSeconds" :min="1" :precision="0" controls-position="right" />
        <span class="field-suffix">秒</span>
      </el-form-item>

      <el-form-item label="AI 分析">
        <el-switch v-model="form.aiAnalysisEnabled" inline-prompt active-text="开" inactive-text="关" />
        <span class="field-tip">仅保存开关，本期不触发 AI 分析任务</span>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :precision="0" controls-position="right" />
      </el-form-item>

      <el-form-item label="说明">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="填写该类别的使用说明"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存规则</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { updateMaterialCategoryApi } from '@/modules/material/api/materialCategory';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import type {
  ImageDimensionMode,
  MaterialCategory,
  MaterialCategoryCode,
  MaterialCategoryUpdate
} from '@/modules/material/types/materialCategory';

type SizeUnit = 'KB' | 'MB' | 'GB';

type EditFormModel = {
  code: MaterialCategoryCode;
  allowedExts: string[];
  maxSizeValue: number;
  maxSizeUnit: SizeUnit;
  imageDimensionMode: ImageDimensionMode | null;
  imageWidth: number | null;
  imageHeight: number | null;
  maxDurationSeconds: number | null;
  aiAnalysisEnabled: boolean;
  sort: number;
  remark: string;
};

const KIBIBYTE = 1024;
const MEBIBYTE = KIBIBYTE * 1024;
const GIBIBYTE = MEBIBYTE * 1024;
const MAX_SIZE_BYTES = 10 * MEBIBYTE;
const sizeUnits: SizeUnit[] = ['KB', 'MB', 'GB'];
const SIZE_UNIT_BYTES: Record<SizeUnit, number> = { KB: KIBIBYTE, MB: MEBIBYTE, GB: GIBIBYTE };

const visible = ref(false);
const submitting = ref(false);
const category = ref<MaterialCategory>();
const formRef = ref<FormInstance>();
const dialogWidth = useDialogWidth('720px');
const emit = defineEmits<{ saved: [] }>();

const form = reactive<EditFormModel>({
  code: 'IMAGE',
  allowedExts: [],
  maxSizeValue: 1,
  maxSizeUnit: 'MB',
  imageDimensionMode: 'NONE',
  imageWidth: null,
  imageHeight: null,
  maxDurationSeconds: null,
  aiAnalysisEnabled: false,
  sort: 10,
  remark: ''
});

const rules: FormRules<EditFormModel> = {
  allowedExts: [{ type: 'array', required: true, min: 1, message: '至少选择一种允许格式', trigger: 'change' }],
  maxSizeValue: [{ required: true, message: '请填写文件大小上限', trigger: 'blur' }],
  imageDimensionMode: [{ required: true, message: '请选择图片尺寸规则', trigger: 'change' }],
  maxDurationSeconds: [{ required: true, message: '请填写最大时长', trigger: 'blur' }],
  sort: [{ required: true, message: '请填写排序值', trigger: 'blur' }]
};

const isMedia = computed(() => form.code === 'VIDEO' || form.code === 'AUDIO');
const sizePrecision = computed(() => (form.maxSizeUnit === 'GB' ? 6 : 2));
const sizeStep = computed(() => (form.maxSizeUnit === 'KB' ? 1 : form.maxSizeUnit === 'MB' ? 0.1 : 0.001));
const sizeMinValue = computed(() => (form.maxSizeUnit === 'GB' ? 0.000001 : 0.01));
const sizeMaxValue = computed(() => {
  const factor = 10 ** sizePrecision.value;
  return Math.floor((MAX_SIZE_BYTES / SIZE_UNIT_BYTES[form.maxSizeUnit]) * factor) / factor;
});

const selectedSizeUnit = computed<SizeUnit>({
  get: () => form.maxSizeUnit,
  set: unit => {
    if (unit === form.maxSizeUnit) return;
    const bytes = form.maxSizeValue * SIZE_UNIT_BYTES[form.maxSizeUnit];
    form.maxSizeUnit = unit;
    const factor = 10 ** (unit === 'GB' ? 6 : 2);
    const convertedValue = Math.floor((bytes / SIZE_UNIT_BYTES[unit]) * factor) / factor;
    form.maxSizeValue = Math.max(unit === 'GB' ? 0.000001 : 0.01, convertedValue);
  }
});

const getSizeInput = (bytes: number): { value: number; unit: SizeUnit } => {
  const unit: SizeUnit = bytes >= GIBIBYTE ? 'GB' : bytes >= MEBIBYTE ? 'MB' : 'KB';
  const precision = unit === 'GB' ? 6 : 2;
  return { value: Number((bytes / SIZE_UNIT_BYTES[unit]).toFixed(precision)), unit };
};

const open = async (row: MaterialCategory) => {
  category.value = row;
  const sizeInput = getSizeInput(row.maxSizeBytes);
  Object.assign(form, {
    code: row.code,
    allowedExts: [...row.allowedExts],
    maxSizeValue: sizeInput.value,
    maxSizeUnit: sizeInput.unit,
    imageDimensionMode: row.code === 'IMAGE' ? row.imageDimensionMode || 'NONE' : null,
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    maxDurationSeconds: row.maxDurationSeconds,
    aiAnalysisEnabled: row.aiAnalysisEnabled,
    sort: row.sort,
    remark: row.remark || ''
  });
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};

const validateConditionalFields = () => {
  const maxSizeBytes = Math.round(form.maxSizeValue * SIZE_UNIT_BYTES[form.maxSizeUnit]);
  if (maxSizeBytes <= 0 || maxSizeBytes > MAX_SIZE_BYTES) {
    ElMessage.warning('文件大小上限必须大于 0 且不能超过 10 MiB');
    return false;
  }
  if (form.code === 'IMAGE' && form.imageDimensionMode === 'FIXED' && (!form.imageWidth || !form.imageHeight)) {
    ElMessage.warning('固定尺寸模式下必须填写有效的图片宽高');
    return false;
  }
  if (isMedia.value && (!form.maxDurationSeconds || form.maxDurationSeconds <= 0)) {
    ElMessage.warning('音视频最大时长必须为正整数');
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !validateConditionalFields()) return;

  const isImage = form.code === 'IMAGE';
  const params: MaterialCategoryUpdate = {
    code: form.code,
    allowedExts: [...form.allowedExts],
    maxSizeBytes: Math.round(form.maxSizeValue * SIZE_UNIT_BYTES[form.maxSizeUnit]),
    imageDimensionMode: isImage ? form.imageDimensionMode : null,
    imageWidth: isImage && form.imageDimensionMode === 'FIXED' ? form.imageWidth : null,
    imageHeight: isImage && form.imageDimensionMode === 'FIXED' ? form.imageHeight : null,
    maxDurationSeconds: isMedia.value ? form.maxDurationSeconds : null,
    aiAnalysisEnabled: form.aiAnalysisEnabled,
    sort: form.sort,
    remark: form.remark.trim() || null
  };

  submitting.value = true;
  try {
    await updateMaterialCategoryApi(params);
    ElMessage.success('素材类别规则已保存');
    visible.value = false;
    emit('saved');
  } finally {
    submitting.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.category-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.summary-name {
  margin-right: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.summary-scene,
.field-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.extension-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.extension-options :deep(.el-checkbox-button__inner) {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: none;
}

.field-suffix {
  margin-left: 8px;
  color: var(--el-text-color-regular);
}

.size-input {
  display: flex;
  gap: 8px;
}

.size-unit {
  width: 92px;
}

.dimension-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.block-tip {
  width: 100%;
  margin: 6px 0 0;
}

@media (max-width: 640px) {
  .category-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .summary-scene {
    margin-left: 0;
  }

  .dimension-inputs {
    flex-wrap: wrap;
  }
}
</style>
