<template>
  <el-dialog v-model="visible" :title="editing ? '编辑提供商' : '新增提供商'" :width="dialogWidth" destroy-on-close draggable>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="提供商名称" prop="providerName">
            <el-input v-model="form.providerName" maxlength="100" placeholder="例如：公司 OpenAI" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="提供商编码" prop="providerCode">
            <el-input v-model="form.providerCode" :disabled="editing" maxlength="64" placeholder="例如：openai_main" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="适配器" prop="adapterType">
            <el-select v-model="form.adapterType" :disabled="editing" @change="onAdapterChange">
              <el-option v-for="item in adapterOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Base URL" prop="baseUrl">
        <el-input v-model="form.baseUrl" :placeholder="currentAdapter?.defaultBaseUrl || 'https://example.com/v1'" />
        <span class="field-tip">留空使用适配器默认地址；允许受控内网 HTTP/HTTPS 地址。</span>
      </el-form-item>
      <el-form-item label="Endpoint Path">
        <el-input v-model="form.endpointPath" placeholder="可选，例如 /chat/completions" />
      </el-form-item>
      <el-form-item label="凭证" prop="credential">
        <el-input
          v-model="form.credential"
          type="password"
          show-password
          autocomplete="new-password"
          placeholder="输入新的 API Key 或 Token"
        />
        <span class="field-tip">
          {{
            editing
              ? `出于安全原因不回填；留空将保留现有凭证${credentialHint ? `（${credentialHint}）` : ''}`
              : '凭证仅加密保存且不会通过接口返回'
          }}
        </span>
      </el-form-item>
      <el-form-item v-if="editing && form.adapterType === 'OLLAMA' && credentialConfigured">
        <el-checkbox v-model="form.clearCredential">清除现有 Ollama 凭证</el-checkbox>
      </el-form-item>

      <el-collapse>
        <el-collapse-item title="连接扩展 JSON" name="advanced">
          <el-alert type="info" :closable="false" show-icon>
            敏感键只能使用完整值 <code>${credential}</code>，运行时才会替换。
          </el-alert>
          <el-form-item label="附加请求头 JSON" prop="headersJson">
            <JsonEditor
              v-model="form.headersJson"
              height="140px"
              placeholder='{ "X-Api-Key": "${credential}" }'
              @blur="validateJsonField('headersJson')"
            />
          </el-form-item>
          <el-form-item label="附加查询参数 JSON" prop="queryJson">
            <JsonEditor v-model="form.queryJson" height="120px" placeholder="{}" @blur="validateJsonField('queryJson')" />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <el-row :gutter="16" class="management-row">
        <el-col :span="12"
          ><el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item
        ></el-col>
        <el-col :span="12">
          <el-form-item label="备注"><el-input v-model="form.remark" maxlength="500" /></el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { createAiProviderApi, getAiAdapterOptionsApi, updateAiProviderApi } from '@/modules/ai/api/provider';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import JsonEditor from '@/components/JsonEditor/index.vue';
import type { AiAdapterOption, AiAdapterType, AiProvider } from '@/modules/ai/types/provider';

type ProviderForm = {
  id?: number;
  providerName: string;
  providerCode: string;
  adapterType?: AiAdapterType;
  baseUrl: string;
  endpointPath: string;
  credential: string;
  clearCredential: boolean;
  headersJson: string;
  queryJson: string;
  enabled: boolean;
  sort: number;
  remark: string;
};

const visible = ref(false);
const saving = ref(false);
const editing = ref(false);
const credentialConfigured = ref(false);
const credentialHint = ref('');
const adapterOptions = ref<AiAdapterOption[]>([]);
const formRef = ref<FormInstance>();
const dialogWidth = useDialogWidth('780px');
const emit = defineEmits<{ saved: [] }>();
const form = reactive<ProviderForm>({
  providerName: '',
  providerCode: '',
  baseUrl: '',
  endpointPath: '',
  credential: '',
  clearCredential: false,
  headersJson: '{}',
  queryJson: '{}',
  enabled: true,
  sort: 0,
  remark: ''
});
const currentAdapter = computed(() => adapterOptions.value.find(item => item.value === form.adapterType));
const rules: FormRules<ProviderForm> = {
  providerName: [{ required: true, message: '请输入提供商名称', trigger: 'blur' }],
  providerCode: [
    { required: true, message: '请输入提供商编码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_-]*$/, message: '以小写字母开头，仅支持小写字母、数字、下划线和中划线', trigger: 'blur' }
  ],
  adapterType: [{ required: true, message: '请选择适配器', trigger: 'change' }],
  credential: [
    {
      validator: (_rule, value: string, callback) => {
        if (!editing.value && currentAdapter.value?.credentialRequired && !value.trim())
          callback(new Error('该适配器必须配置凭证'));
        else callback();
      },
      trigger: 'blur'
    }
  ],
  headersJson: [{ validator: (_rule, value: string, callback) => validateJson(value, callback), trigger: 'blur' }],
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
// JsonEditor 是自定义组件，不会自动触发 el-form 校验，失焦时显式执行对应字段规则
const validateJsonField = (field: 'headersJson' | 'queryJson') => {
  formRef.value?.validateField(field).catch(() => {});
};
const loadOptions = async () => {
  if (!adapterOptions.value.length) adapterOptions.value = (await getAiAdapterOptionsApi()).data;
};
const onAdapterChange = () => formRef.value?.validateField('credential');
const open = async (provider?: AiProvider) => {
  await loadOptions();
  editing.value = Boolean(provider);
  credentialConfigured.value = Boolean(provider?.credentialConfigured);
  credentialHint.value = provider?.credentialHint || '';
  Object.assign(form, {
    id: provider?.id,
    providerName: provider?.providerName || '',
    providerCode: provider?.providerCode || '',
    adapterType: provider?.adapterType,
    baseUrl: provider?.baseUrl || '',
    endpointPath: provider?.endpointPath || '',
    credential: '',
    clearCredential: false,
    headersJson: JSON.stringify(provider?.connectionConfig?.additionalHeaders || {}, null, 2),
    queryJson: JSON.stringify(provider?.connectionConfig?.additionalQueryParams || {}, null, 2),
    enabled: provider?.enabled ?? true,
    sort: provider?.sort ?? 0,
    remark: provider?.remark || ''
  });
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};
const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !form.adapterType) return;
  const payload = {
    providerName: form.providerName.trim(),
    baseUrl: form.baseUrl.trim() || null,
    endpointPath: form.endpointPath.trim() || null,
    credential: form.credential.trim() || null,
    connectionConfig: {
      additionalHeaders: JSON.parse(form.headersJson || '{}') as Record<string, string>,
      additionalQueryParams: JSON.parse(form.queryJson || '{}') as Record<string, string>
    },
    enabled: form.enabled,
    sort: form.sort,
    remark: form.remark.trim() || null
  };
  saving.value = true;
  try {
    if (editing.value && form.id) {
      await updateAiProviderApi({ ...payload, id: form.id, clearCredential: form.clearCredential });
    } else {
      await createAiProviderApi({
        ...payload,
        providerCode: form.providerCode.trim(),
        adapterType: form.adapterType
      });
    }
    ElMessage.success('提供商已保存');
    visible.value = false;
    emit('saved');
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.field-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.management-row {
  margin-top: 18px;
}

code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--el-fill-color);
}
</style>
