<template>
  <el-dialog v-model="visible" :width="dialogWidth" destroy-on-close draggable class="material-tag-dialog" :show-close="false">
    <template #header>
      <div class="dialog-header">
        <div>
          <span class="dialog-eyebrow">受控标签库</span>
          <h2>{{ editing ? '编辑标签' : '新增标签' }}</h2>
        </div>
        <el-button class="close-button" text circle aria-label="关闭" @click="visible = false">
          <el-icon :size="22"><Close /></el-icon>
        </el-button>
      </div>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="tag-form">
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="form.name" maxlength="64" show-word-limit placeholder="例如：雨天" />
        <span class="field-tip">用于快速检索和素材归类，建议使用简短明确的名称</span>
      </el-form-item>

      <el-form-item label="标签说明">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="补充标签的使用范围或业务含义（选填）"
        />
      </el-form-item>

      <el-form-item prop="categories" class="category-form-item">
        <template #label>
          <div class="category-label">
            <span>适用类别</span>
            <span class="category-label-tip">至少选择 1 项，可开启 AI 命中判断</span>
          </div>
        </template>

        <el-checkbox-group v-model="selectedCategories" class="category-grid">
          <div
            v-for="item in categoryOptions"
            :key="item.value"
            class="category-card"
            :class="{ 'is-selected': selectedCategories.includes(item.value) }"
          >
            <div class="category-card-head">
              <el-checkbox :value="item.value">
                <span class="category-name">
                  <el-icon><component :is="item.icon" /></el-icon>
                  {{ item.label }}
                </span>
              </el-checkbox>

              <el-switch
                v-if="categoriesByCode[item.value]"
                v-model="categoriesByCode[item.value]!.aiAnalysisEnabled"
                active-text="参与 AI"
              />
              <el-switch v-else :model-value="false" active-text="参与 AI" disabled />
            </div>

            <el-input
              v-if="categoriesByCode[item.value]?.aiAnalysisEnabled"
              v-model="categoriesByCode[item.value]!.aiDescription"
              maxlength="1000"
              show-word-limit
              type="textarea"
              :rows="2"
              :placeholder="item.label + '命中判定说明，例如：描述应被识别为该标签的内容特征'"
            />
          </div>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <span class="footer-tip"
          ><el-icon><InfoFilled /></el-icon>保存后可在标签列表中继续编辑</span
        >
        <div class="footer-actions">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submit">保存标签</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Close, Document, Headset, InfoFilled, Picture, VideoCamera } from '@element-plus/icons-vue';
import { createMaterialTagApi, updateMaterialTagApi } from '@/modules/material/api/materialTag';
import { useDialogWidth } from '@/hooks/useDialogWidth';
import type { MaterialTag, MaterialTagCategory, MaterialTagPayload } from '@/modules/material/types/materialTag';

const visible = ref(false);
const saving = ref(false);
const editing = ref(false);
const formRef = ref<FormInstance>();
const dialogWidth = useDialogWidth('760px');
const emit = defineEmits<{ saved: [] }>();
const categoryOptions = [
  { label: '图片', value: 'IMAGE', icon: Picture },
  { label: '文档', value: 'DOCUMENT', icon: Document },
  { label: '视频', value: 'VIDEO', icon: VideoCamera },
  { label: '音频', value: 'AUDIO', icon: Headset }
] as const;
const form = reactive<{ id?: number; name: string; remark: string; categories: MaterialTagCategory[] }>({
  name: '',
  remark: '',
  categories: []
});
const selectedCategories = computed<string[]>({
  get: () => form.categories.map(item => item.categoryCode),
  set: values => {
    form.categories = values.map(
      code =>
        form.categories.find(item => item.categoryCode === code) || {
          categoryCode: code as MaterialTagCategory['categoryCode'],
          aiAnalysisEnabled: false,
          aiDescription: null
        }
    );
  }
});
const categoriesByCode = computed<Partial<Record<MaterialTagCategory['categoryCode'], MaterialTagCategory>>>(() =>
  Object.fromEntries(form.categories.map(item => [item.categoryCode, item]))
);
const rules: FormRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  categories: [{ required: true, message: '至少选择一个适用类别', trigger: 'change' }]
};
const categoryName = (code: string) => categoryOptions.find(item => item.value === code)?.label || code;
const open = async (tag?: MaterialTag) => {
  editing.value = Boolean(tag);
  Object.assign(form, {
    id: tag?.id,
    name: tag?.name || '',
    remark: tag?.remark || '',
    categories: tag?.categories?.map(item => ({ ...item })) || []
  });
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};
const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  for (const category of form.categories)
    if (category.aiAnalysisEnabled && !category.aiDescription?.trim()) {
      ElMessage.warning(`${categoryName(category.categoryCode)}开启 AI 后必须填写判定说明`);
      return;
    }
  const payload: MaterialTagPayload = {
    name: form.name.trim(),
    remark: form.remark.trim() || null,
    categories: form.categories.map(item => ({ ...item, aiDescription: item.aiDescription?.trim() || null }))
  };
  saving.value = true;
  try {
    if (editing.value && form.id) await updateMaterialTagApi({ ...payload, id: form.id });
    else await createMaterialTagApi(payload);
    ElMessage.success('标签已保存');
    visible.value = false;
    emit('saved');
  } finally {
    saving.value = false;
  }
};
defineExpose({ open });
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  h2 {
    margin: 4px 0 0;
    color: var(--el-text-color-primary);
    font-size: 24px;
    font-weight: 500;
    line-height: 1.25;
  }
}

.dialog-eyebrow {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.close-button {
  margin-top: -4px;
  color: var(--el-text-color-secondary);
}

.tag-form {
  padding: 2px 0;

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    height: auto;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
    font-weight: 500;
    line-height: 22px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 10px;
  }
}

.field-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.category-form-item {
  margin-bottom: 0 !important;

  :deep(.el-form-item__content) {
    display: block;
  }
}

.category-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.category-label-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.category-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  transition:
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;

  &.is-selected {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 4px 12px rgb(15 157 145 / 8%);
  }

  :deep(.el-checkbox) {
    height: auto;
    margin-right: 8px;
  }

  :deep(.el-switch__label) {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  :deep(.el-switch.is-checked .el-switch__label) {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  :deep(.el-textarea) {
    margin-top: 12px;
  }

  :deep(.el-textarea__inner) {
    background: var(--el-fill-color-blank);
    font-size: 13px;
  }
}

.category-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.category-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-weight: 500;

  .el-icon {
    color: var(--el-text-color-secondary);
  }
}

.is-selected .category-name,
.is-selected .category-name .el-icon {
  color: var(--el-color-primary);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.footer-actions {
  display: flex;
  gap: 4px;
}

:global(.material-tag-dialog) {
  --el-dialog-margin-top: 6vh;

  overflow: hidden;
  border-radius: 18px;
}

:global(.material-tag-dialog .el-dialog__header) {
  padding: 24px 30px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.material-tag-dialog .el-dialog__body) {
  max-height: min(58vh, 560px);
  padding: 22px 30px 24px;
  overflow-y: auto;
}

:global(.material-tag-dialog .el-dialog__footer) {
  padding: 16px 30px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 767px) {
  .category-grid {
    grid-template-columns: 1fr;
  }

  .category-label,
  .dialog-footer {
    align-items: flex-start;
    gap: 8px;
    flex-direction: column;
  }

  .footer-actions {
    align-self: flex-end;
  }

  :global(.material-tag-dialog) {
    width: 92vw !important;
  }

  :global(.material-tag-dialog .el-dialog__header),
  :global(.material-tag-dialog .el-dialog__body),
  :global(.material-tag-dialog .el-dialog__footer) {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
