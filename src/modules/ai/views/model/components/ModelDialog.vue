<template>
  <el-dialog v-model="visible" :title="editing ? '编辑模型' : '新增模型'" :width="dialogWidth" destroy-on-close draggable>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="模型名称" prop="displayName">
            <el-input v-model="form.displayName" maxlength="100" placeholder="例如：GPT-4.1 主模型" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模型编码" prop="modelCode">
            <el-input v-model="form.modelCode" :disabled="editing" maxlength="64" placeholder="例如：GPT-4.1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属提供商" prop="providerId">
            <el-select v-model="form.providerId" filterable>
              <el-option
                v-for="item in providerOptions"
                :key="item.id"
                :label="`${item.providerName}${item.enabled ? '' : '（已停用）'}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="远端模型名" prop="remoteModelName">
            <el-input v-model="form.remoteModelName" maxlength="200" placeholder="例如：gpt-4.1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模型类型"><el-input model-value="CHAT" disabled /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上下文窗口">
            <el-input-number v-model="form.contextWindow" :min="1" :max="2000000000" controls-position="right" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="模型能力">
        <el-checkbox-group v-model="form.capabilities">
          <el-checkbox v-for="item in capabilityOptions" :key="item.value" :value="item.value" :disabled="item.value === 'TEXT'">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8"
          ><el-form-item label="启用模型"><el-switch v-model="form.enabled" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="默认流式"><el-switch v-model="form.streamEnabled" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="思考模式"><el-switch v-model="form.thinkingEnabled" /></el-form-item
        ></el-col>
      </el-row>

      <el-divider content-position="left">标准生成参数</el-divider>
      <el-row :gutter="16">
        <el-col :span="8"
          ><el-form-item label="Temperature"
            ><el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="Top P"><el-input-number v-model="form.topP" :min="0" :max="1" :step="0.1" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="Top K"><el-input-number v-model="form.topK" :min="1" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="Max Tokens"
            ><el-input-number v-model="form.maxTokens" :min="1" :disabled="form.maxCompletionTokens != null" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="Max Completion Tokens"
            ><el-input-number v-model="form.maxCompletionTokens" :min="1" :disabled="form.maxTokens != null" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="思考预算"><el-input-number v-model="form.thinkingBudget" :min="1" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="频率惩罚"
            ><el-input-number v-model="form.frequencyPenalty" :min="-2" :max="2" :step="0.1" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="存在惩罚"
            ><el-input-number v-model="form.presencePenalty" :min="-2" :max="2" :step="0.1" /></el-form-item
        ></el-col>
        <el-col :span="8">
          <el-form-item label="推理强度">
            <el-select v-model="form.reasoningEffort" clearable
              ><el-option label="低" value="low" /><el-option label="中" value="medium" /><el-option label="高" value="high"
            /></el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8"
          ><el-form-item label="随机种子"><el-input-number v-model="form.seed" :min="0" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="超时（秒）"><el-input-number v-model="form.timeoutSeconds" :min="1" /></el-form-item
        ></el-col>
        <el-col :span="8"
          ><el-form-item label="最大尝试次数"><el-input-number v-model="form.maxAttempts" :min="1" :max="10" /></el-form-item
        ></el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12"
          ><el-form-item label="缓存控制"><el-switch v-model="form.cacheControl" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="并行工具调用"><el-switch v-model="form.parallelToolCalls" /></el-form-item
        ></el-col>
      </el-row>

      <el-collapse>
        <el-collapse-item title="高级请求 JSON" name="advanced">
          <el-alert type="warning" :closable="false" show-icon>
            扩展请求体不能覆盖 model、messages、stream、tools 等核心字段；敏感值使用完整的 <code>${credential}</code>。
          </el-alert>
          <el-form-item label="附加请求头 JSON" prop="headersJson"
            ><el-input v-model="form.headersJson" type="textarea" :rows="4"
          /></el-form-item>
          <el-form-item label="附加请求体 JSON" prop="bodyJson"
            ><el-input v-model="form.bodyJson" type="textarea" :rows="5"
          /></el-form-item>
          <el-form-item label="附加查询参数 JSON" prop="queryJson"
            ><el-input v-model="form.queryJson" type="textarea" :rows="4"
          /></el-form-item>
        </el-collapse-item>
      </el-collapse>

      <el-row :gutter="16" class="management-row">
        <el-col :span="8"
          ><el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" :max="9999" /></el-form-item
        ></el-col>
        <el-col :span="16"
          ><el-form-item label="备注"><el-input v-model="form.remark" maxlength="500" /></el-form-item
        ></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import { getAiProviderOptionsApi } from '@/modules/ai/api/provider';
import { createAiModelApi, updateAiModelApi } from '@/modules/ai/api/model';
import type { AiProviderOption } from '@/modules/ai/types/provider';
import type { AiModel, AiModelCapability } from '@/modules/ai/types/model';

type ModelForm = {
  id?: number;
  modelCode: string;
  displayName: string;
  providerId?: number;
  remoteModelName: string;
  contextWindow?: number;
  streamEnabled: boolean;
  thinkingEnabled: boolean;
  capabilities: AiModelCapability[];
  enabled: boolean;
  sort: number;
  remark: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  maxCompletionTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  thinkingBudget?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  topK?: number;
  seed?: number;
  cacheControl: boolean;
  parallelToolCalls: boolean;
  timeoutSeconds?: number;
  maxAttempts?: number;
  headersJson: string;
  bodyJson: string;
  queryJson: string;
};

const visible = ref(false);
const saving = ref(false);
const editing = ref(false);
const formRef = ref<FormInstance>();
const providerOptions = ref<AiProviderOption[]>([]);
const dialogWidth = useDialogWidth('980px');
const emit = defineEmits<{ saved: [] }>();
const capabilityOptions: { label: string; value: AiModelCapability }[] = [
  { label: '文本', value: 'TEXT' },
  { label: '视觉', value: 'VISION' },
  { label: '工具调用', value: 'TOOL_CALL' },
  { label: '结构化输出', value: 'STRUCTURED_OUTPUT' },
  { label: '思考', value: 'THINKING' }
];
const defaults = (): ModelForm => ({
  modelCode: '',
  displayName: '',
  remoteModelName: '',
  streamEnabled: false,
  thinkingEnabled: false,
  capabilities: ['TEXT'],
  enabled: true,
  sort: 0,
  remark: '',
  cacheControl: false,
  parallelToolCalls: false,
  headersJson: '{}',
  bodyJson: '{}',
  queryJson: '{}'
});
const form = reactive<ModelForm>(defaults());
const rules: FormRules<ModelForm> = {
  modelCode: [
    { required: true, message: '请输入模型编码', trigger: 'blur' },
    {
      pattern: /^[A-Za-z][A-Za-z0-9_.-]*$/,
      message: '以字母开头，仅支持大小写字母、数字、下划线、中划线和英文句点',
      trigger: 'blur'
    }
  ],
  displayName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  providerId: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  remoteModelName: [{ required: true, message: '请输入远端模型名', trigger: 'blur' }],
  headersJson: [{ validator: (_rule, value: string, callback) => validateJson(value, callback), trigger: 'blur' }],
  bodyJson: [{ validator: (_rule, value: string, callback) => validateJson(value, callback), trigger: 'blur' }],
  queryJson: [{ validator: (_rule, value: string, callback) => validateJson(value, callback), trigger: 'blur' }]
};
const validateJson = (value: string, callback: (error?: Error) => void) => {
  try {
    const parsed: unknown = JSON.parse(value || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') callback(new Error('请输入 JSON 对象'));
    else callback();
  } catch {
    callback(new Error('JSON 格式不正确'));
  }
};
const loadProviders = async () => {
  providerOptions.value = (await getAiProviderOptionsApi()).data;
};
const open = async (model?: AiModel) => {
  await loadProviders();
  editing.value = Boolean(model);
  const config = model?.generationConfig;
  Object.assign(form, defaults(), {
    id: model?.id,
    modelCode: model?.modelCode || '',
    displayName: model?.displayName || '',
    providerId: model?.providerId,
    remoteModelName: model?.remoteModelName || '',
    contextWindow: model?.contextWindow ?? undefined,
    streamEnabled: model?.streamEnabled ?? false,
    thinkingEnabled: model?.thinkingEnabled ?? false,
    capabilities: model?.capabilities?.length ? [...model.capabilities] : ['TEXT'],
    enabled: model?.enabled ?? true,
    sort: model?.sort ?? 0,
    remark: model?.remark || '',
    temperature: config?.temperature ?? undefined,
    topP: config?.topP ?? undefined,
    maxTokens: config?.maxTokens ?? undefined,
    maxCompletionTokens: config?.maxCompletionTokens ?? undefined,
    frequencyPenalty: config?.frequencyPenalty ?? undefined,
    presencePenalty: config?.presencePenalty ?? undefined,
    thinkingBudget: config?.thinkingBudget ?? undefined,
    reasoningEffort: config?.reasoningEffort ?? undefined,
    topK: config?.topK ?? undefined,
    seed: config?.seed ?? undefined,
    cacheControl: config?.cacheControl ?? false,
    parallelToolCalls: config?.parallelToolCalls ?? false,
    timeoutSeconds: config?.timeoutSeconds ?? undefined,
    maxAttempts: config?.maxAttempts ?? undefined,
    headersJson: JSON.stringify(config?.additionalHeaders || {}, null, 2),
    bodyJson: JSON.stringify(config?.additionalBodyParams || {}, null, 2),
    queryJson: JSON.stringify(config?.additionalQueryParams || {}, null, 2)
  });
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};
const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || form.providerId == null) return;
  if (form.maxTokens != null && form.maxCompletionTokens != null) {
    ElMessage.warning('Max Tokens 与 Max Completion Tokens 不能同时配置');
    return;
  }
  const capabilities: AiModelCapability[] = form.capabilities.includes('TEXT')
    ? form.capabilities
    : ['TEXT', ...form.capabilities];
  const payload = {
    providerId: form.providerId,
    displayName: form.displayName.trim(),
    remoteModelName: form.remoteModelName.trim(),
    contextWindow: form.contextWindow ?? null,
    streamEnabled: form.streamEnabled,
    thinkingEnabled: form.thinkingEnabled,
    capabilities,
    generationConfig: {
      temperature: form.temperature ?? null,
      topP: form.topP ?? null,
      maxTokens: form.maxTokens ?? null,
      maxCompletionTokens: form.maxCompletionTokens ?? null,
      frequencyPenalty: form.frequencyPenalty ?? null,
      presencePenalty: form.presencePenalty ?? null,
      thinkingBudget: form.thinkingBudget ?? null,
      reasoningEffort: form.reasoningEffort ?? null,
      topK: form.topK ?? null,
      seed: form.seed ?? null,
      cacheControl: form.cacheControl,
      parallelToolCalls: form.parallelToolCalls,
      timeoutSeconds: form.timeoutSeconds ?? null,
      maxAttempts: form.maxAttempts ?? null,
      additionalHeaders: JSON.parse(form.headersJson || '{}') as Record<string, string>,
      additionalBodyParams: JSON.parse(form.bodyJson || '{}') as Record<string, unknown>,
      additionalQueryParams: JSON.parse(form.queryJson || '{}') as Record<string, string>
    },
    enabled: form.enabled,
    sort: form.sort,
    remark: form.remark.trim() || null
  };
  saving.value = true;
  try {
    if (editing.value && form.id) await updateAiModelApi({ ...payload, id: form.id });
    else await createAiModelApi({ ...payload, modelCode: form.modelCode.trim() });
    ElMessage.success('模型已保存');
    visible.value = false;
    emit('saved');
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.management-row {
  margin-top: 18px;
}

code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--el-fill-color);
}
</style>
