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
        <el-switch
          v-model="form.aiAnalysisEnabled"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleAiAnalysisChange"
        />
        <span class="field-tip">仅保存开关与模型绑定，本期不触发 AI 分析任务</span>
      </el-form-item>

      <el-form-item label="分析模型" prop="aiProviderCode">
        <el-select
          v-model="selectedModelKey"
          class="model-select"
          filterable
          clearable
          :loading="modelLoading"
          placeholder="选择 AI 分析模型"
          @visible-change="handleModelSelectVisible"
        >
          <el-option-group v-for="group in modelOptionGroups" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.key" :label="item.label" :value="item.key" />
          </el-option-group>
        </el-select>
        <div class="field-tip block-tip">
          <span>{{ modelTip }}</span>
          <el-button v-if="modelLoadFailed" type="primary" link @click="loadModelOptions">重新加载</el-button>
        </div>
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
import { getAiModelOptionsApi } from '@/modules/ai/api/model';
import { updateMaterialCategoryApi } from '@/modules/material/api/materialCategory';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import type { AiModelOption } from '@/modules/ai/types/model';
import type {
  ImageDimensionMode,
  MaterialCategory,
  MaterialCategoryCode,
  MaterialCategoryUpdate
} from '@/modules/material/types/materialCategory';

type SizeUnit = 'KB' | 'MB' | 'GB';

type ModelSelectOption = {
  key: string;
  label: string;
  group: string;
  providerCode: string;
  modelCode: string;
  available: boolean;
};

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
  aiProviderCode: string | null;
  aiModelCode: string | null;
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
  aiProviderCode: null,
  aiModelCode: null,
  sort: 10,
  remark: ''
});

const rules: FormRules<EditFormModel> = {
  allowedExts: [{ type: 'array', required: true, min: 1, message: '至少选择一种允许格式', trigger: 'change' }],
  maxSizeValue: [{ required: true, message: '请填写文件大小上限', trigger: 'blur' }],
  imageDimensionMode: [{ required: true, message: '请选择图片尺寸规则', trigger: 'change' }],
  maxDurationSeconds: [{ required: true, message: '请填写最大时长', trigger: 'blur' }],
  aiProviderCode: [
    {
      validator: (_rule, _value, callback) => {
        if (form.aiAnalysisEnabled && !(form.aiProviderCode && form.aiModelCode)) {
          callback(new Error('启用 AI 分析时必须选择分析模型'));
          return;
        }
        callback();
      },
      trigger: 'change'
    }
  ],
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

const MODEL_KEY_SEPARATOR = '::';
const buildModelKey = (providerCode: string, modelCode: string) => `${providerCode}${MODEL_KEY_SEPARATOR}${modelCode}`;

const formatModelLabel = (displayName: string | null | undefined, modelCode: string) => {
  const name = displayName?.trim();
  return name && name !== modelCode ? `${name}（${modelCode}）` : modelCode;
};

// 提供商记录缺失的模型没有可绑定的 providerCode，无法作为类别分析模型选项
const toModelSelectOption = (item: AiModelOption, status?: string): ModelSelectOption | null => {
  if (!item.providerCode) return null;
  const label = formatModelLabel(item.displayName, item.modelCode);
  return {
    key: buildModelKey(item.providerCode, item.modelCode),
    label: status ? `${label} · ${status}` : label,
    group: item.providerName?.trim() || item.providerCode,
    providerCode: item.providerCode,
    modelCode: item.modelCode,
    available: item.available
  };
};

const modelOptions = ref<ModelSelectOption[]>([]);
const modelLoading = ref(false);
const modelLoaded = ref(false);
const modelLoadFailed = ref(false);
const boundModelNames = ref<{ providerName: string | null; modelName: string | null }>({
  providerName: null,
  modelName: null
});

const loadModelOptions = async () => {
  if (modelLoading.value || modelLoaded.value) return;
  modelLoading.value = true;
  modelLoadFailed.value = false;
  try {
    const response = await getAiModelOptionsApi();
    modelOptions.value = response.data
      .map(item => toModelSelectOption(item))
      .filter((item): item is ModelSelectOption => item !== null);
    modelLoaded.value = true;
  } catch {
    // 请求层已提示业务错误，此处仅标记失败并在表单内提供重试入口
    modelLoadFailed.value = true;
  } finally {
    modelLoading.value = false;
  }
};

const boundModelKey = computed(() =>
  form.aiProviderCode && form.aiModelCode ? buildModelKey(form.aiProviderCode, form.aiModelCode) : null
);

const matchedBoundModel = computed(() =>
  boundModelKey.value ? modelOptions.value.find(item => item.key === boundModelKey.value) : undefined
);

// 已绑定项不在选项列表中时用它兜底展示，避免打开弹窗后选择被静默清空
const boundModelFallback = computed<ModelSelectOption | null>(() => {
  const providerCode = form.aiProviderCode;
  const modelCode = form.aiModelCode;
  if (!providerCode || !modelCode) return null;
  const status = modelLoaded.value ? '已失效，请重新选择' : undefined;
  const label = formatModelLabel(boundModelNames.value.modelName, modelCode);
  return {
    key: buildModelKey(providerCode, modelCode),
    label: status ? `${label} · ${status}` : label,
    group: boundModelNames.value.providerName?.trim() || providerCode,
    providerCode,
    modelCode,
    available: false
  };
});

const selectableModelOptions = computed<ModelSelectOption[]>(() => {
  const available = modelOptions.value.filter(item => item.available);
  const boundKey = boundModelKey.value;
  if (!boundKey || available.some(item => item.key === boundKey)) return available;
  const matched = matchedBoundModel.value;
  if (matched) return [...available, { ...matched, label: `${matched.label} · 已停用` }];
  const fallback = boundModelFallback.value;
  return fallback ? [...available, fallback] : available;
});

const modelOptionGroups = computed(() => {
  const groups = new Map<string, ModelSelectOption[]>();
  for (const item of selectableModelOptions.value) {
    const group = groups.get(item.group);
    if (group) group.push(item);
    else groups.set(item.group, [item]);
  }
  return [...groups].map(([label, options]) => ({ label, options }));
});

const modelOptionMap = computed(() => new Map(selectableModelOptions.value.map(item => [item.key, item])));

const selectedModelKey = computed<string | null>({
  get: () => boundModelKey.value,
  set: key => {
    if (!key) {
      form.aiProviderCode = null;
      form.aiModelCode = null;
      return;
    }
    const option = modelOptionMap.value.get(key);
    if (!option) return;
    form.aiProviderCode = option.providerCode;
    form.aiModelCode = option.modelCode;
  }
});

const modelTip = computed(() => {
  if (modelLoading.value) return '正在加载 AI 模型选项…';
  if (modelLoadFailed.value) return '模型选项加载失败，请确认已获得「AI 管理 → 模型管理 → 查询」权限后重试。';
  if (form.aiAnalysisEnabled && !boundModelKey.value) return '启用 AI 分析时必须选择模型，且仅能选择可用（模型与提供商均已启用）的模型。';
  if (modelLoaded.value && boundModelKey.value && !matchedBoundModel.value) return '当前绑定的分析模型已不存在，请重新选择后再保存。';
  if (matchedBoundModel.value && !matchedBoundModel.value.available) return '当前绑定的模型或其提供商已停用，可继续保存或改选其他模型。';
  return '仅能选择可用（模型与提供商均已启用）的模型；关闭开关不会解除引用，清除选择后该模型才允许删除。';
});

const handleAiAnalysisChange = async (value: boolean) => {
  if (value && !modelLoaded.value) await loadModelOptions();
  formRef.value?.validateField('aiProviderCode').catch(() => {});
};

const handleModelSelectVisible = (visible: boolean) => {
  if (visible && !modelLoaded.value) void loadModelOptions();
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
    aiProviderCode: row.aiProviderCode ?? null,
    aiModelCode: row.aiModelCode ?? null,
    sort: row.sort,
    remark: row.remark || ''
  });
  boundModelNames.value = { providerName: row.aiProviderName, modelName: row.aiModelName };
  // 仅在需要展示已绑定模型或启用开关时加载，避免无权限的操作者每次打开都触发失败请求
  if (row.aiAnalysisEnabled || row.aiProviderCode) await loadModelOptions();
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
  if (modelLoaded.value && boundModelKey.value && !matchedBoundModel.value) {
    ElMessage.warning('当前绑定的分析模型已不存在，请重新选择');
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
    aiProviderCode: form.aiProviderCode,
    aiModelCode: form.aiModelCode,
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

.model-select {
  width: 100%;
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
