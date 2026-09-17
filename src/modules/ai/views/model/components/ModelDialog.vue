<template>
  <el-dialog v-model="visible" class="model-dialog" :width="dialogWidth" :show-close="false" destroy-on-close draggable>
    <template #header>
      <div class="dialog-header">
        <div class="header-title">
          <div class="title-icon"><Cpu /></div>
          <div>
            <div class="title-row">
              <h2>{{ editing ? '编辑模型' : '新增模型' }}</h2>
              <el-tag size="small" effect="plain">CHAT</el-tag>
            </div>
            <p>{{ editing ? '更新模型连接与生成策略' : '配置一个可供智能应用调用的对话模型' }}</p>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">
            <span>模型编码</span><strong>{{ form.modelCode || '未填写' }}</strong>
          </div>
          <div class="meta-item">
            <span>提供商</span><strong>{{ currentProvider?.providerName || '待选择' }}</strong>
          </div>
          <el-tag :type="form.enabled ? 'success' : 'info'" effect="light">
            {{ form.enabled ? '已启用' : '已停用' }}
          </el-tag>
          <el-button class="close-button" text @click="visible = false"><Close /></el-button>
        </div>
      </div>
    </template>

    <div class="dialog-layout">
      <aside class="section-nav">
        <div class="nav-caption">配置项</div>
        <button
          v-for="item in sections"
          :key="item.key"
          type="button"
          class="nav-item"
          :class="{ active: activeSection === item.key }"
          @click="activeSection = item.key"
        >
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
          <el-icon class="nav-arrow"><ArrowRight /></el-icon>
        </button>
        <div class="nav-tip">
          <InfoFilled />
          <span>带 <b>*</b> 的字段为必填项</span>
        </div>
      </aside>

      <el-form ref="formRef" class="model-form" :model="form" :rules="rules" label-position="top">
        <section v-show="activeSection === 'basic'" class="form-section">
          <div class="section-heading">
            <div>
              <h3>基本信息</h3>
              <p>定义模型身份以及它连接的服务提供商。</p>
            </div>
          </div>
          <el-row :gutter="20">
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
                <el-select v-model="form.providerId" filterable class="full-width" @change="handleProviderChange">
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
                <el-input-number
                  v-model="form.contextWindow"
                  class="full-width"
                  :min="1"
                  :max="2000000000"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section v-show="activeSection === 'capability'" class="form-section">
          <div class="section-heading">
            <div>
              <h3>模型能力</h3>
              <p>声明模型支持的输入输出能力及默认运行方式。</p>
            </div>
          </div>
          <div class="subheading"><span>模型能力</span><small>TEXT 能力始终开启</small></div>
          <div class="capability-grid">
            <button
              v-for="item in capabilityOptions"
              :key="item.value"
              type="button"
              class="capability-card"
              :class="{ active: form.capabilities.includes(item.value), locked: item.value === 'TEXT' }"
              @click="toggleCapability(item.value)"
            >
              <span class="capability-icon">
                <component :is="item.icon" />
                <CircleCheck v-if="form.capabilities.includes(item.value)" class="selected-mark" />
              </span>
              <span class="capability-copy">
                <strong>{{ item.label }}</strong
                ><small>{{ item.description }}</small>
              </span>
            </button>
          </div>

          <div class="subheading settings-title"><span>运行设置</span><small>模型级别的默认行为</small></div>
          <div class="settings-list">
            <div class="setting-row">
              <span class="setting-icon"><CircleCheck /></span>
              <div><strong>启用模型</strong><small>关闭后不会出现在可用模型列表中</small></div>
              <el-switch v-model="form.enabled" />
            </div>
            <div class="setting-row">
              <span class="setting-icon"><ChatDotRound /></span>
              <div><strong>默认流式输出</strong><small>按增量片段返回生成结果</small></div>
              <el-switch v-model="form.streamEnabled" />
            </div>
            <div class="setting-row">
              <span class="setting-icon"><MagicStick /></span>
              <div><strong>思考模式</strong><small>允许模型返回额外的推理过程</small></div>
              <el-switch v-model="form.thinkingEnabled" />
            </div>
          </div>
        </section>

        <section v-show="activeSection === 'generation'" class="form-section">
          <div class="section-heading">
            <div>
              <h3>生成参数</h3>
              <p>控制采样方式、输出长度以及推理稳定性。</p>
            </div>
          </div>
          <div class="parameter-group">
            <div class="group-title"><span>采样策略</span><small>留空时使用服务默认值</small></div>
            <el-row :gutter="20">
              <el-col :span="8"
                ><el-form-item label="Temperature"
                  ><el-input-number v-model="form.temperature" class="full-width" :min="0" :max="2" :step="0.1" /></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="Top P"
                  ><el-input-number v-model="form.topP" class="full-width" :min="0" :max="1" :step="0.1" /></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="Top K"><el-input-number v-model="form.topK" class="full-width" :min="1" /></el-form-item
              ></el-col>
            </el-row>
          </div>
          <div class="parameter-group">
            <div class="group-title"><span>输出控制</span><small>两种 Token 上限只能选择一种</small></div>
            <el-radio-group v-model="tokenLimitType" class="token-toggle" @change="handleTokenLimitChange">
              <el-radio-button value="maxTokens">Max Tokens</el-radio-button>
              <el-radio-button value="maxCompletionTokens">Max Completion Tokens</el-radio-button>
            </el-radio-group>
            <el-row :gutter="20" class="token-row">
              <el-col :span="12">
                <el-form-item label="输出上限">
                  <el-input-number
                    v-if="tokenLimitType === 'maxTokens'"
                    v-model="form.maxTokens"
                    class="full-width"
                    :min="1"
                    placeholder="传统输出上限"
                  />
                  <el-input-number
                    v-else
                    v-model="form.maxCompletionTokens"
                    class="full-width"
                    :min="1"
                    placeholder="完成内容上限"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12"
                ><el-form-item label="思考预算"
                  ><el-input-number v-model="form.thinkingBudget" class="full-width" :min="1" /></el-form-item
              ></el-col>
            </el-row>
          </div>
          <div class="parameter-group">
            <div class="group-title"><span>推理与稳定性</span><small>按需调整模型的生成偏好</small></div>
            <el-row :gutter="20">
              <el-col :span="8"
                ><el-form-item label="推理强度"
                  ><el-select v-model="form.reasoningEffort" class="full-width" clearable
                    ><el-option label="低" value="low" /><el-option label="中" value="medium" /><el-option
                      label="高"
                      value="high" /></el-select></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="频率惩罚"
                  ><el-input-number
                    v-model="form.frequencyPenalty"
                    class="full-width"
                    :min="-2"
                    :max="2"
                    :step="0.1" /></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="存在惩罚"
                  ><el-input-number
                    v-model="form.presencePenalty"
                    class="full-width"
                    :min="-2"
                    :max="2"
                    :step="0.1" /></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="随机种子"><el-input-number v-model="form.seed" class="full-width" :min="0" /></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="超时（秒）"
                  ><el-input-number v-model="form.timeoutSeconds" class="full-width" :min="1" /></el-form-item
              ></el-col>
              <el-col :span="8"
                ><el-form-item label="最大尝试次数"
                  ><el-input-number v-model="form.maxAttempts" class="full-width" :min="1" :max="10" /></el-form-item
              ></el-col>
            </el-row>
          </div>
        </section>

        <section v-show="activeSection === 'advanced'" class="form-section">
          <div class="section-heading">
            <div>
              <h3>高级配置</h3>
              <p>补充请求参数和运行时开关，适合有明确适配需求时使用。</p>
            </div>
          </div>
          <div class="settings-list">
            <div class="setting-row">
              <span class="setting-icon"><Lock /></span>
              <div>
                <strong>提示词缓存标记</strong><small>{{ cacheControlProfile }}</small>
              </div>
              <el-switch v-model="form.cacheControl" :disabled="cacheControlDisabled" />
            </div>
            <div class="setting-row">
              <span class="setting-icon"><Tools /></span>
              <div><strong>并行工具调用</strong><small>允许模型同时执行多个工具调用</small></div>
              <el-switch v-model="form.parallelToolCalls" />
            </div>
          </div>
          <el-alert class="cache-alert" type="info" :closable="false" show-icon>
            仅影响请求标记；AgentScope CachePolicy 当前固定为 DISABLED。
          </el-alert>
          <el-collapse class="advanced-collapse">
            <el-collapse-item title="附加请求 JSON" name="advanced-json">
              <el-alert type="warning" :closable="false" show-icon>
                扩展请求体不能覆盖 model、messages、stream、tools 等核心字段；敏感值使用完整的
                <code>${credential}</code>。
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
          <div class="subheading settings-title"><span>管理信息</span><small>用于列表排序和内部备注</small></div>
          <el-row :gutter="20">
            <el-col :span="8"
              ><el-form-item label="排序"
                ><el-input-number v-model="form.sort" class="full-width" :min="0" :max="9999" /></el-form-item
            ></el-col>
            <el-col :span="16"
              ><el-form-item label="备注"><el-input v-model="form.remark" maxlength="500" placeholder="可选" /></el-form-item
            ></el-col>
          </el-row>
        </section>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <span class="footer-hint">{{ currentProvider ? `当前适配器：${currentProvider.adapterType}` : '请先选择提供商' }}</span>
        <div>
          <el-button @click="visible = false">取消</el-button
          ><el-button type="primary" :loading="saving" @click="submit">保存模型</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
  ArrowRight,
  ChatDotRound,
  CircleCheck,
  Close,
  Cpu,
  Grid,
  InfoFilled,
  Lock,
  MagicStick,
  Operation,
  Picture,
  Tools
} from '@element-plus/icons-vue';
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
type SectionKey = 'basic' | 'capability' | 'generation' | 'advanced';
type TokenLimitType = 'maxTokens' | 'maxCompletionTokens';

const visible = ref(false);
const saving = ref(false);
const editing = ref(false);
const formRef = ref<FormInstance>();
const providerOptions = ref<AiProviderOption[]>([]);
const dialogWidth = useDialogWidth('1080px');
const activeSection = ref<SectionKey>('basic');
const tokenLimitType = ref<TokenLimitType>('maxTokens');
const emit = defineEmits<{ saved: [] }>();
const sections = [
  { key: 'basic' as const, label: '基本信息', icon: Grid },
  { key: 'capability' as const, label: '模型能力', icon: Cpu },
  { key: 'generation' as const, label: '生成参数', icon: Operation },
  { key: 'advanced' as const, label: '高级配置', icon: Tools }
];
const capabilityOptions: {
  label: string;
  value: AiModelCapability;
  description: string;
  icon: typeof Picture;
}[] = [
  { label: '文本', value: 'TEXT', description: '基础对话与文本生成', icon: ChatDotRound },
  { label: '视觉', value: 'VISION', description: '理解图片和视觉内容', icon: Picture },
  { label: '工具调用', value: 'TOOL_CALL', description: '连接外部工具与函数', icon: Tools },
  { label: '结构化输出', value: 'STRUCTURED_OUTPUT', description: '按 JSON 结构返回结果', icon: Grid },
  { label: '思考', value: 'THINKING', description: '支持推理过程与思考预算', icon: MagicStick }
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
const currentProvider = computed(() => providerOptions.value.find(item => item.id === form.providerId));
const cacheControlDisabled = computed(() => currentProvider.value?.adapterType === 'OLLAMA');
const cacheControlProfile = computed(() => {
  if (!currentProvider.value) return '选择提供商后查看适配器能力';
  if (currentProvider.value.adapterType === 'DASHSCOPE') {
    return 'AgentScope 已支持：为 system 与最后一条消息添加 ephemeral 标记';
  }
  if (currentProvider.value.adapterType === 'OLLAMA') {
    return 'AgentScope 2.0.3 的 Ollama 适配器不会消费该配置，因此当前不可开启';
  }
  return '兼容性能力：发送 cache_control 标记，是否生效取决于上游服务';
});
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
const handleProviderChange = () => {
  if (currentProvider.value?.adapterType === 'OLLAMA') form.cacheControl = false;
};
const toggleCapability = (capability: AiModelCapability) => {
  if (capability === 'TEXT') return;
  const index = form.capabilities.indexOf(capability);
  if (index >= 0) form.capabilities.splice(index, 1);
  else form.capabilities.push(capability);
};
const handleTokenLimitChange = (type: string | number | boolean | undefined) => {
  if (type === 'maxTokens') form.maxCompletionTokens = undefined;
  else if (type === 'maxCompletionTokens') form.maxTokens = undefined;
};
const open = async (model?: AiModel) => {
  await loadProviders();
  editing.value = Boolean(model);
  activeSection.value = 'basic';
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
    capabilities: model?.capabilities?.includes('TEXT') ? [...model.capabilities] : ['TEXT', ...(model?.capabilities || [])],
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
  tokenLimitType.value = form.maxCompletionTokens != null ? 'maxCompletionTokens' : 'maxTokens';
  handleProviderChange();
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
      cacheControl: currentProvider.value?.adapterType === 'OLLAMA' ? false : form.cacheControl,
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
:global(.model-dialog) {
  --el-dialog-margin-top: 5vh;
  overflow: hidden;
  border-radius: 14px;
}
:global(.model-dialog .el-dialog__header) {
  margin: 0;
  padding: 0;
}
:global(.model-dialog .el-dialog__body) {
  padding: 0;
}
:global(.model-dialog .el-dialog__footer) {
  padding: 0;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 28px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.header-title,
.title-row,
.header-meta,
.dialog-footer,
.setting-row {
  display: flex;
  align-items: center;
}
.header-title {
  gap: 13px;
  min-width: 0;
}
.title-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 10px;
  font-size: 22px;
}
.title-row {
  gap: 9px;
}
.title-row h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.3;
}
.header-title p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.header-meta {
  gap: 20px;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.meta-item span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.meta-item strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}
.close-button {
  margin-left: -8px;
  font-size: 18px;
}
.dialog-layout {
  display: flex;
  height: min(68vh, 620px);
  min-height: 520px;
}
.section-nav {
  display: flex;
  width: 194px;
  flex: 0 0 194px;
  flex-direction: column;
  padding: 22px 12px;
  background: var(--el-fill-color-lighter);
  border-right: 1px solid var(--el-border-color-lighter);
}
.nav-caption {
  padding: 0 12px 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 2px 0;
  padding: 11px 12px;
  border: 0;
  border-radius: 7px;
  color: var(--el-text-color-regular);
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: all 0.2s;
}
.nav-item > svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}
.nav-item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.nav-item.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
  font-weight: 600;
}
.nav-arrow {
  margin-left: auto;
  font-size: 13px;
}
.nav-tip {
  display: flex;
  gap: 7px;
  margin-top: auto;
  padding: 12px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
}
.nav-tip > svg {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  margin-top: 1px;
}
.nav-tip b {
  color: var(--el-color-danger);
}
.model-form {
  min-width: 0;
  flex: 1;
  padding: 28px 32px 18px;
  overflow: auto;
}
.form-section {
  min-height: 100%;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}
.section-heading h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
}
.section-heading p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.full-width {
  width: 100%;
}
.subheading,
.group-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 5px 0 14px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}
.subheading small,
.group-title small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}
.settings-title {
  margin-top: 23px;
}
.capability-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.capability-card {
  display: flex;
  min-height: 100px;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  padding: 13px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: all 0.2s;
}
.capability-card:hover {
  border-color: var(--el-color-primary-light-5);
}
.capability-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.capability-card.locked {
  cursor: default;
}
.capability-icon {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  color: var(--el-color-primary);
  font-size: 19px;
}
.capability-icon > svg:first-child {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
}
.selected-mark {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  color: var(--el-color-success);
}
.capability-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.capability-copy strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
}
.capability-copy small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}
.settings-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.setting-row {
  gap: 12px;
  min-height: 64px;
  padding: 10px 14px;
}
.setting-row + .setting-row {
  border-top: 1px solid var(--el-border-color-lighter);
}
.setting-row > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}
.setting-row strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
}
.setting-row small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}
.setting-icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 7px;
}
.parameter-group {
  padding: 17px 0 2px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.parameter-group:first-of-type {
  padding-top: 0;
  border-top: 0;
}
.token-toggle {
  margin-bottom: 16px;
}
.token-row {
  margin-top: 2px;
}
.cache-alert {
  margin: 16px 0;
}
.advanced-collapse {
  margin-top: 18px;
}
.advanced-collapse :global(.el-collapse-item__header) {
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.advanced-collapse :global(.el-collapse-item__content) {
  padding-bottom: 4px;
}
.dialog-footer {
  justify-content: space-between;
  padding: 14px 28px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.footer-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--el-fill-color);
}
@media (max-width: 760px) {
  .dialog-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 18px 14px;
  }
  .header-meta {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }
  .meta-item:nth-child(2) {
    display: none;
  }
  :global(.model-dialog) {
    width: 94vw !important;
  }
  .dialog-layout {
    height: 70vh;
    min-height: 0;
    flex-direction: column;
  }
  .section-nav {
    width: auto;
    flex: none;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    padding: 8px;
    overflow-x: auto;
  }
  .nav-caption,
  .nav-tip,
  .nav-arrow {
    display: none;
  }
  .nav-item {
    width: auto;
    flex: 0 0 auto;
    padding: 9px 12px;
    white-space: nowrap;
  }
  .model-form {
    padding: 22px 18px 10px;
  }
  .capability-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .capability-card:last-child {
    grid-column: span 2;
  }
  .dialog-footer {
    padding: 12px 18px;
  }
  .footer-hint {
    display: none;
  }
}
</style>
