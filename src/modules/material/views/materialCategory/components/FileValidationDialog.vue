<template>
  <el-dialog v-model="visible" title="文件校验" :width="dialogWidth" destroy-on-close draggable @closed="reset">
    <el-alert type="info" :closable="false" show-icon class="validation-tip">
      <template #title> 当前按「{{ category?.name }}」规则校验，仅检测文件，不会保存素材或上传到对象存储。 </template>
    </el-alert>

    <div v-if="category" class="rule-strip">
      <span>格式：{{ category.allowedExts.map(ext => `.${ext}`).join('、') }}</span>
      <span>大小：≤ {{ formatBytes(category.maxSizeBytes) }}</span>
      <span v-if="category.maxDurationSeconds">时长：≤ {{ category.maxDurationSeconds }} 秒</span>
      <span v-if="category.imageDimensionMode === 'FIXED'">尺寸：{{ category.imageWidth }} × {{ category.imageHeight }} px</span>
    </div>

    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      drag
      action="#"
      :auto-upload="false"
      :accept="accept"
      :limit="1"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      class="validation-upload"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
      <template #tip>
        <div class="el-upload__tip">一次仅校验一个文件，实际格式和 MIME 由服务端读取文件内容识别。</div>
      </template>
    </el-upload>

    <el-result v-if="result" icon="success" title="文件校验通过" sub-title="以下信息来自服务端实际检测结果">
      <template #extra>
        <el-descriptions :column="2" border class="result-details">
          <el-descriptions-item label="文件名">{{ result.originalFilename }}</el-descriptions-item>
          <el-descriptions-item label="检测 MIME">{{ result.detectedMime }}</el-descriptions-item>
          <el-descriptions-item label="规范扩展名">.{{ result.extension }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatBytes(result.sizeBytes) }}</el-descriptions-item>
          <el-descriptions-item v-if="result.width && result.height" label="显示尺寸">
            {{ result.width }} × {{ result.height }} px
          </el-descriptions-item>
          <el-descriptions-item v-if="result.durationSeconds !== null" label="精确时长">
            {{ result.durationSeconds }} 秒
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-result>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :disabled="!rawFile" :loading="validating" @click="handleValidate">开始校验</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, type UploadFile, type UploadInstance, type UploadUserFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { validateMaterialFileApi } from '@/modules/material/api/materialCategory';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import type { MaterialCategory, MaterialFileValidation } from '@/modules/material/types/materialCategory';

const visible = ref(false);
const validating = ref(false);
const category = ref<MaterialCategory>();
const rawFile = ref<File>();
const fileList = ref<UploadUserFile[]>([]);
const result = ref<MaterialFileValidation>();
const uploadRef = ref<UploadInstance>();
const dialogWidth = useDialogWidth('760px');

const accept = computed(() => category.value?.allowedExts.map(ext => `.${ext}`).join(',') || '');

const open = (row: MaterialCategory) => {
  reset();
  category.value = row;
  visible.value = true;
};

const reset = () => {
  rawFile.value = undefined;
  fileList.value = [];
  result.value = undefined;
  uploadRef.value?.clearFiles();
};

const handleFileChange = (file: UploadFile) => {
  rawFile.value = file.raw;
  result.value = undefined;
};

const handleFileRemove = () => {
  rawFile.value = undefined;
  result.value = undefined;
};

const handleValidate = async () => {
  if (!category.value || !rawFile.value) {
    ElMessage.warning('请先选择待校验文件');
    return;
  }
  if (rawFile.value.size > category.value.maxSizeBytes) {
    ElMessage.warning(`文件大小不能超过 ${formatBytes(category.value.maxSizeBytes)}`);
    return;
  }

  validating.value = true;
  try {
    const response = await validateMaterialFileApi(category.value.code, rawFile.value);
    result.value = response.data;
    ElMessage.success('文件校验通过');
  } finally {
    validating.value = false;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${Number((bytes / 1024 / 1024).toFixed(2))} MiB`;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.validation-tip {
  margin-bottom: 14px;
}

.rule-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.validation-upload {
  margin-bottom: 10px;
}

.result-details {
  width: min(620px, 100%);
  text-align: left;
}

:deep(.el-result) {
  padding-bottom: 0;
}

@media (max-width: 640px) {
  :deep(.el-descriptions__body .el-descriptions__table) {
    table-layout: fixed;
  }
}
</style>
