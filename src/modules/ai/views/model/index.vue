<template>
  <div class="table-box ai-model-page">
    <ProTable
      ref="tableRef"
      title="AI 模型"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <template #displayName="{ row }">
        <div class="model-name">
          <strong>{{ row.displayName }}</strong
          ><span>{{ row.modelCode }}</span>
        </div>
      </template>
      <template #providerName="{ row }">
        <span>{{ row.providerName || '--' }}</span>
        <el-tag v-if="!row.providerEnabled" type="warning" size="small">提供商停用</el-tag>
      </template>
      <template #httpProtocol="{ row }">
        <el-tag effect="plain">{{ httpProtocolLabel(row.httpProtocol) }}</el-tag>
      </template>
      <template #capabilities="{ row }">
        <el-tag v-for="capability in row.capabilities" :key="capability" size="small" effect="plain">
          {{ capabilityName(capability) }}
        </el-tag>
      </template>
      <template #enabled="{ row }">
        <el-tag :type="row.available ? 'success' : row.enabled ? 'warning' : 'info'">
          {{ row.available ? '可用' : row.enabled ? '提供商停用' : '停用' }}
        </el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-auth="'ai.model.test'" type="success" link :icon="Connection" @click="openTest(row)">测试</el-button>
        <el-button v-auth="'ai.model.update'" type="primary" link :icon="EditPen" @click="openEdit(row)">编辑</el-button>
        <el-button v-auth="'ai.model.status'" :type="row.enabled ? 'warning' : 'success'" link @click="changeStatus(row)">
          {{ row.enabled ? '停用' : '启用' }}
        </el-button>
        <el-button v-auth="'ai.model.delete'" type="danger" link :icon="Delete" @click="remove(row)">删除</el-button>
      </template>
      <template #tableHeader>
        <el-button v-auth="'ai.model.create'" type="primary" :icon="Plus" @click="openCreate">新增模型</el-button>
      </template>
    </ProTable>
    <ModelDialog ref="dialogRef" @saved="refresh" />
    <ModelTestDialog ref="testDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Connection, Delete, EditPen, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable from '@/components/ProTable/index.vue';
import type { ColumnProps, EnumProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import ModelDialog from './components/ModelDialog.vue';
import ModelTestDialog from './components/ModelTestDialog.vue';
import { getAiProviderOptionsApi } from '@/modules/ai/api/provider';
import type { AiHttpProtocol } from '@/modules/ai/types/provider';
import { changeAiModelStatusApi, deleteAiModelApi, getAiModelByIdApi, getAiModelPageApi } from '@/modules/ai/api/model';
import type { AiModel, AiModelCapability } from '@/modules/ai/types/model';

defineOptions({ name: 'AiModelView' });

const tableRef = ref<ProTableInstance>();
const dialogRef = ref<InstanceType<typeof ModelDialog>>();
const testDialogRef = ref<InstanceType<typeof ModelTestDialog>>();
const providerOptions = ref<EnumProps[]>([]);
const searchColumns: SearchProps[] = [
  { el: 'input', label: '模型编码', prop: 'modelCode', props: { clearable: true } },
  { el: 'input', label: '模型名称', prop: 'displayName', props: { clearable: true } },
  { el: 'select', label: '提供商', prop: 'providerId', enum: providerOptions },
  { el: 'input', label: '远端模型名', prop: 'remoteModelName', props: { clearable: true } },
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
const columns: ColumnProps<AiModel>[] = [
  { prop: 'displayName', label: '模型', minWidth: 170 },
  { prop: 'providerName', label: '提供商', minWidth: 150 },
  { prop: 'remoteModelName', label: '远端模型名', minWidth: 180, showOverflowTooltip: true },
  { prop: 'capabilities', label: '能力', minWidth: 230 },
  { prop: 'contextWindow', label: '上下文窗口', width: 115 },
  { prop: 'httpProtocol', label: '协议', width: 100 },
  { prop: 'enabled', label: '运行状态', width: 120 },
  { prop: 'updateTime', label: '更新时间', width: 180 },
  { prop: 'operation', label: '操作', width: 280, fixed: 'right' }
];
const capabilityLabels: Record<AiModelCapability, string> = {
  TEXT: '文本',
  VISION: '视觉',
  TOOL_CALL: '工具调用',
  STRUCTURED_OUTPUT: '结构化输出',
  THINKING: '思考'
};
const capabilityName = (value: AiModelCapability) => capabilityLabels[value];
const httpProtocolLabel = (value?: AiHttpProtocol | null) =>
  value === 'HTTP_1_1' ? 'HTTP/1.1' : value === 'HTTP_2' ? 'HTTP/2' : '继承';
const getTableList = (params: Record<string, unknown>) => getAiModelPageApi(params);
const refresh = () => tableRef.value?.getTableList();
const openCreate = () => dialogRef.value?.open();
const openEdit = async (row: AiModel) => dialogRef.value?.open((await getAiModelByIdApi(row.id)).data);
const openTest = (row: AiModel) => testDialogRef.value?.open(row);
const changeStatus = async (row: AiModel) => {
  try {
    await ElMessageBox.confirm(`确定要${row.enabled ? '停用' : '启用'}「${row.displayName}」吗？`, '状态确认', {
      type: 'warning'
    });
  } catch {
    return;
  }
  await changeAiModelStatusApi({ id: row.id, enabled: !row.enabled });
  ElMessage.success('状态已更新');
  refresh();
};
const remove = async (row: AiModel) => {
  try {
    await ElMessageBox.confirm(`删除模型「${row.displayName}」后不可恢复，是否继续？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除'
    });
  } catch {
    return;
  }
  await deleteAiModelApi(row.id);
  ElMessage.success('模型已删除');
  refresh();
};

onMounted(async () => {
  providerOptions.value = (await getAiProviderOptionsApi()).data.map(item => ({
    label: `${item.providerName}${item.enabled ? '' : '（已停用）'}`,
    value: item.id
  }));
});
</script>

<style scoped lang="scss">
.model-name {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.ai-model-page :deep(.el-tag) {
  margin-right: 4px;
}
</style>
