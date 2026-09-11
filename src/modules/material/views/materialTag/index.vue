<template>
  <div class="table-box material-tag-page">
    <ProTable
      ref="tableRef"
      title="受控标签库"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <template #categories="{ row }">
        <el-tag v-for="item in row.categories" :key="item.categoryCode" size="small" effect="plain">{{
          item.categoryName
        }}</el-tag>
      </template>
      <template #enabled="{ row }"
        ><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag></template
      >
      <template #remark="{ row }"
        ><span>{{ row.remark?.trim() || '--' }}</span></template
      >
      <template #operation="{ row }">
        <el-button v-auth="'material.tag.update'" type="primary" link :icon="EditPen" @click="openEdit(row)">编辑</el-button>
        <el-button v-auth="'material.tag.status'" :type="row.enabled ? 'danger' : 'success'" link @click="changeStatus(row)">{{
          row.enabled ? '停用' : '启用'
        }}</el-button>
      </template>
      <template #tableHeader>
        <el-button v-auth="'material.tag.create'" type="primary" :icon="Plus" @click="openCreate">新增标签</el-button>
      </template>
    </ProTable>
    <TagDialog ref="dialogRef" @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EditPen, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable from '@/components/ProTable/index.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import TagDialog from './components/TagDialog.vue';
import { changeMaterialTagStatusApi, getMaterialTagByIdApi, getMaterialTagPageApi } from '@/modules/material/api/materialTag';
import type { MaterialTag } from '@/modules/material/types/materialTag';

defineOptions({ name: 'MaterialTagView' });
const tableRef = ref<ProTableInstance>();
const dialogRef = ref<InstanceType<typeof TagDialog>>();
const categoryOptions = [
  { label: '图片', value: 'IMAGE' },
  { label: '文档', value: 'DOCUMENT' },
  { label: '视频', value: 'VIDEO' },
  { label: '音频', value: 'AUDIO' }
];
const searchColumns: SearchProps[] = [
  { el: 'input', label: '标签名称', prop: 'name', props: { clearable: true, placeholder: '请输入标签名称' } },
  {
    el: 'select',
    label: '状态',
    prop: 'enabled',
    enum: [
      { label: '启用', value: true },
      { label: '停用', value: false }
    ]
  },
  { el: 'select', label: '适用类别', prop: 'categoryCode', enum: categoryOptions }
];
const columns: ColumnProps<MaterialTag>[] = [
  { prop: 'name', label: '标签名称', minWidth: 160 },
  { prop: 'remark', label: '说明', minWidth: 220 },
  { prop: 'categories', label: '适用类别', minWidth: 220 },
  { prop: 'enabled', label: '状态', width: 90 },
  { prop: 'updateTime', label: '更新时间', width: 180 },
  { prop: 'operation', label: '操作', width: 180, fixed: 'right' }
];
const getTableList = (params: Record<string, unknown>) => getMaterialTagPageApi(params);
const refresh = () => tableRef.value?.getTableList();
const openCreate = () => dialogRef.value?.open();
const openEdit = async (row: MaterialTag) => dialogRef.value?.open((await getMaterialTagByIdApi(row.id)).data);
const changeStatus = async (row: MaterialTag) => {
  try {
    await ElMessageBox.confirm(`确定要${row.enabled ? '停用' : '启用'}「${row.name}」标签吗？`, '状态确认', { type: 'warning' });
  } catch {
    return;
  }
  await changeMaterialTagStatusApi({ id: row.id, enabled: !row.enabled });
  ElMessage.success(`${row.name}已${row.enabled ? '停用' : '启用'}`);
  refresh();
};
</script>

<style scoped lang="scss">
.material-tag-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.material-tag-page :deep(.el-tag) {
  margin-right: 6px;
}
</style>
