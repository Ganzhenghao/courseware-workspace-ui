<template>
  <el-dialog v-model="visible" title="模型连通性测试" :width="dialogWidth" destroy-on-close>
    <el-alert type="info" :closable="false" show-icon>
      将向「{{ model?.displayName }}」固定发送“请仅回复 OK”，最多等待 30 秒；停用状态不影响测试。
    </el-alert>
    <div v-if="result" class="test-result">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="耗时">{{ result.elapsedMillis }} ms</el-descriptions-item>
        <el-descriptions-item label="Token 总量">{{ result.totalTokens ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="输入 Token">{{ result.inputTokens ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="输出 Token">{{ result.outputTokens ?? '--' }}</el-descriptions-item>
      </el-descriptions>
      <div class="response-title">响应摘要</div>
      <pre>{{ result.responseText || '（无文本响应）' }}</pre>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="testing" @click="runTest">开始测试</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import { testAiModelApi } from '@/modules/ai/api/model';
import type { AiModel, AiModelTestResult } from '@/modules/ai/types/model';

const visible = ref(false);
const testing = ref(false);
const model = ref<AiModel>();
const result = ref<AiModelTestResult>();
const dialogWidth = useDialogWidth('640px');
const open = (value: AiModel) => {
  model.value = value;
  result.value = undefined;
  visible.value = true;
};
const runTest = async () => {
  if (!model.value) return;
  testing.value = true;
  try {
    result.value = (await testAiModelApi(model.value.id)).data;
    ElMessage.success('模型测试完成');
  } finally {
    testing.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.test-result {
  margin-top: 18px;
}

.response-title {
  margin: 18px 0 8px;
  font-weight: 600;
}

pre {
  max-height: 240px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
