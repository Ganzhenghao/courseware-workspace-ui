<template>
  <div class="table-box ai-provider-page">
    <ProTable
      ref="tableRef"
      title="AI 提供商"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <template #adapterType="{ row }"
        ><el-tag effect="plain">{{ adapterName(row.adapterType) }}</el-tag></template
      >
      <template #credentialConfigured="{ row }">
        <el-tag :type="row.credentialConfigured ? 'success' : 'warning'">
          {{ row.credentialConfigured ? `已配置 ${row.credentialHint || ''}` : '未配置' }}
        </el-tag>
      </template>
      <template #enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-auth="'ai.provider.update'" type="primary" link :icon="EditPen" @click="openEdit(row)">编辑</el-button>
        <el-button v-auth="'ai.provider.status'" :type="row.enabled ? 'warning' : 'success'" link @click="changeStatus(row)">
          {{ row.enabled ? '停用' : '启用' }}
        </el-button>
        <el-button v-auth="'ai.provider.delete'" type="danger" link :icon="Delete" @click="remove(row)">删除</el-button>
      </template>
      <template #tableHeader>
        <el-button v-auth="'ai.provider.create'" type="primary" :icon="Plus" @click="openCreate">新增提供商</el-button>
      </template>
    </ProTable>
    <ProviderDialog ref="dialogRef" @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Delete, EditPen, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable from '@/components/ProTable/index.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import ProviderDialog from './components/ProviderDialog.vue';
import {
  changeAiProviderStatusApi,
  deleteAiProviderApi,
  getAiProviderByIdApi,
  getAiProviderPageApi
} from '@/modules/ai/api/provider';
import type { AiAdapterType, AiProvider } from '@/modules/ai/types/provider';

defineOptions({ name: 'AiProviderView' });

const tableRef = ref<ProTableInstance>();
const dialogRef = ref<InstanceType<typeof ProviderDialog>>();
const adapterOptions = [
  { label: 'OpenAI', value: 'OPENAI' },
  { label: 'DeepSeek', value: 'DEEPSEEK' },
  { label: '通义千问', value: 'DASHSCOPE' },
  { label: 'Ollama', value: 'OLLAMA' }
] as const;
const searchColumns: SearchProps[] = [
  { el: 'input', label: '提供商名称', prop: 'providerName', props: { clearable: true } },
  { el: 'input', label: '提供商编码', prop: 'providerCode', props: { clearable: true } },
  { el: 'select', label: '适配器', prop: 'adapterType', enum: [...adapterOptions] },
  {
    el: 'select',
    label: '状态',
    prop: 'enabled',
    enum: [
      { label: '启用', value: true },
      { label: '停用', value: false }
    ]
  }
];
const columns: ColumnProps<AiProvider>[] = [
  { prop: 'providerName', label: '提供商名称', minWidth: 150 },
  { prop: 'providerCode', label: '编码', minWidth: 130 },
  { prop: 'adapterType', label: '适配器', width: 110 },
  { prop: 'effectiveBaseUrl', label: '有效 Base URL', minWidth: 250, showOverflowTooltip: true },
  { prop: 'credentialConfigured', label: '凭证', width: 150 },
  { prop: 'enabled', label: '状态', width: 80 },
  { prop: 'updateTime', label: '更新时间', width: 180 },
  { prop: 'operation', label: '操作', width: 220, fixed: 'right' }
];
const adapterName = (value: AiAdapterType) => adapterOptions.find(item => item.value === value)?.label || value;
const getTableList = (params: Record<string, unknown>) => getAiProviderPageApi(params);
const refresh = () => tableRef.value?.getTableList();
const openCreate = () => dialogRef.value?.open();
const openEdit = async (row: AiProvider) => dialogRef.value?.open((await getAiProviderByIdApi(row.id)).data);
const changeStatus = async (row: AiProvider) => {
  try {
    await ElMessageBox.confirm(`确定要${row.enabled ? '停用' : '启用'}「${row.providerName}」吗？`, '状态确认', {
      type: 'warning'
    });
  } catch {
    return;
  }
  await changeAiProviderStatusApi({ id: row.id, enabled: !row.enabled });
  ElMessage.success('状态已更新');
  refresh();
};
const remove = async (row: AiProvider) => {
  try {
    await ElMessageBox.confirm(`删除「${row.providerName}」后不可恢复，且存在模型时将拒绝删除。是否继续？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除'
    });
  } catch {
    return;
  }
  await deleteAiProviderApi(row.id);
  ElMessage.success('提供商已删除');
  refresh();
};
</script>

<style scoped lang="scss">
.ai-provider-page {
  display: flex;
  flex-direction: column;
}
</style>
