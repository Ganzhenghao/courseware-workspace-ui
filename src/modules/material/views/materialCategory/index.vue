<template>
  <div class="table-box material-category-page">
    <div class="page-intro card">
      <div>
        <div class="intro-title">素材类别规则</div>
        <div class="intro-description">统一管理图片、文档、视频和音频的格式、大小及内容校验边界。</div>
      </div>
      <div class="intro-notice">
        <el-icon><InfoFilled /></el-icon>
        本期文件校验不会保存素材或上传对象存储
      </div>
    </div>

    <ProTable
      ref="proTableRef"
      title="固定素材类别"
      :columns="columns"
      :search-columns="[]"
      :request-api="getTableList"
      :pagination="false"
      :tool-button="['refresh', 'setting']"
      row-key="code"
    >
      <template #name="{ row }">
        <div class="category-cell">
          <span class="category-icon" :class="`is-${row.code.toLowerCase()}`">
            <el-icon><component :is="getCategoryIcon(row.code)" /></el-icon>
          </span>
          <div>
            <div class="category-name">{{ row.name }}</div>
            <div class="category-code">{{ row.code }} · {{ row.resourceSceneCode }}</div>
          </div>
        </div>
      </template>

      <template #allowedExts="{ row }">
        <div class="extension-tags">
          <el-tag v-for="ext in row.allowedExts" :key="ext" size="small" effect="plain">.{{ ext }}</el-tag>
        </div>
      </template>

      <template #maxSizeBytes="{ row }">
        <span class="limit-value">{{ formatBytes(row.maxSizeBytes) }}</span>
      </template>

      <template #rule="{ row }">
        <div class="rule-cell">
          <span v-if="row.code === 'IMAGE'">{{ formatImageRule(row) }}</span>
          <span v-else-if="row.maxDurationSeconds">最长 {{ row.maxDurationSeconds }} 秒</span>
          <span v-else>仅校验格式与大小</span>
        </div>
      </template>

      <template #aiAnalysisEnabled="{ row }">
        <el-tag :type="row.aiAnalysisEnabled ? 'success' : 'info'" effect="light">
          {{ row.aiAnalysisEnabled ? '已开启' : '未开启' }}
        </el-tag>
      </template>

      <template #enabled="{ row }">
        <span class="status-pill" :class="{ 'is-enabled': row.enabled }"> <i></i>{{ row.enabled ? '启用' : '停用' }} </span>
      </template>

      <template #remark="{ row }">
        <span>{{ row.remark?.trim() || '--' }}</span>
      </template>

      <template #operation="{ row }">
        <div class="operation-buttons">
          <el-button v-auth="'material.category.update'" type="primary" link :icon="EditPen" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button
            v-auth="'material.category.validate'"
            type="primary"
            link
            :icon="DocumentChecked"
            @click="openValidation(row)"
          >
            校验文件
          </el-button>
          <el-button
            v-auth="'material.category.status'"
            :type="row.enabled ? 'danger' : 'success'"
            link
            @click="changeStatus(row)"
          >
            {{ row.enabled ? '停用' : '启用' }}
          </el-button>
        </div>
      </template>
    </ProTable>

    <CategoryRuleDialog ref="ruleDialogRef" @saved="refreshTable" />
    <FileValidationDialog ref="validationDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue';
import { Document, DocumentChecked, EditPen, Headset, InfoFilled, Picture, VideoCamera } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable from '@/components/ProTable/index.vue';
import CategoryRuleDialog from '@/modules/material/views/materialCategory/components/CategoryRuleDialog.vue';
import FileValidationDialog from '@/modules/material/views/materialCategory/components/FileValidationDialog.vue';
import {
  changeMaterialCategoryStatusApi,
  getMaterialCategoryByCodeApi,
  getMaterialCategoryListApi
} from '@/modules/material/api/materialCategory';
import type { ColumnProps, ProTableInstance } from '@/components/ProTable/interface';
import type { MaterialCategory, MaterialCategoryCode } from '@/modules/material/types/materialCategory';

defineOptions({
  name: 'MaterialCategoryView'
});

const proTableRef = ref<ProTableInstance>();
const ruleDialogRef = ref<InstanceType<typeof CategoryRuleDialog>>();
const validationDialogRef = ref<InstanceType<typeof FileValidationDialog>>();

const categoryMeta: Record<MaterialCategoryCode, { icon: Component }> = {
  IMAGE: { icon: Picture },
  DOCUMENT: { icon: Document },
  VIDEO: { icon: VideoCamera },
  AUDIO: { icon: Headset }
};

const getCategoryIcon = (code: MaterialCategoryCode) => categoryMeta[code].icon;

const columns: ColumnProps<MaterialCategory>[] = [
  { prop: 'name', label: '素材类别', minWidth: 240, align: 'left', showOverflowTooltip: false },
  { prop: 'allowedExts', label: '允许格式', minWidth: 260, showOverflowTooltip: false },
  { prop: 'maxSizeBytes', label: '大小上限', width: 110 },
  { prop: 'rule', label: '附加规则', minWidth: 160 },
  { prop: 'aiAnalysisEnabled', label: 'AI 分析', width: 110 },
  { prop: 'enabled', label: '状态', width: 90 },
  { prop: 'sort', label: '排序', width: 80 },
  { prop: 'remark', label: '说明', minWidth: 180, align: 'left' },
  { prop: 'operation', label: '操作', width: 260, fixed: 'right' }
];

const getTableList = () => getMaterialCategoryListApi();

const refreshTable = () => proTableRef.value?.getTableList();

const openEdit = async (row: MaterialCategory) => {
  const response = await getMaterialCategoryByCodeApi(row.code);
  ruleDialogRef.value?.open(response.data);
};

const openValidation = (row: MaterialCategory) => {
  if (!row.enabled) {
    ElMessage.warning('该素材类别已停用，不能校验文件');
    return;
  }
  validationDialogRef.value?.open(row);
};

const changeStatus = async (row: MaterialCategory) => {
  const nextEnabled = !row.enabled;
  try {
    await ElMessageBox.confirm(`确定要${nextEnabled ? '启用' : '停用'}「${row.name}」素材类别吗？`, '状态确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true
    });
  } catch {
    return;
  }
  await changeMaterialCategoryStatusApi({ code: row.code, enabled: nextEnabled });
  ElMessage.success(`${row.name}已${nextEnabled ? '启用' : '停用'}`);
  refreshTable();
};

const formatBytes = (bytes: number) => `${Number((bytes / 1024 / 1024).toFixed(2))} MiB`;

const formatImageRule = (row: MaterialCategory) => {
  if (row.imageDimensionMode !== 'FIXED') return '不限制图片尺寸';
  return `固定 ${row.imageWidth} × ${row.imageHeight} px`;
};
</script>

<style scoped lang="scss">
.material-category-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.intro-title {
  margin-bottom: 6px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.intro-description,
.intro-notice {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.intro-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  display: inline-flex;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  font-size: 20px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 10px;
}

.category-icon.is-document {
  color: #67c23a;
  background: #f0f9eb;
}

.category-icon.is-video {
  color: #e6a23c;
  background: #fdf6ec;
}

.category-icon.is-audio {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.category-name {
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
}

.category-code {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.extension-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.limit-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.rule-cell {
  color: var(--el-text-color-regular);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}

.status-pill i {
  width: 7px;
  height: 7px;
  background: var(--el-color-info);
  border-radius: 50%;
}

.status-pill.is-enabled {
  color: var(--el-color-success);
}

.status-pill.is-enabled i {
  background: var(--el-color-success);
}

.operation-buttons {
  display: flex;
  justify-content: center;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .page-intro {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
