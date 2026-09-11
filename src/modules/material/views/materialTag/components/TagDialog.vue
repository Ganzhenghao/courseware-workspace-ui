<template>
  <el-dialog v-model="visible" :title="editing ? '编辑标签' : '新增标签'" width="720px" destroy-on-close draggable>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="标签名称" prop="name"><el-input v-model="form.name" maxlength="64" show-word-limit /></el-form-item>
      <el-form-item label="标签说明"
        ><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit
      /></el-form-item>
      <el-form-item label="适用类别" prop="categories">
        <div class="category-list">
          <div v-for="category in form.categories" :key="category.categoryCode" class="category-item">
            <div class="category-head">
              <el-tag>{{ categoryName(category.categoryCode) }}</el-tag
              ><el-switch v-model="category.aiAnalysisEnabled" active-text="参与 AI" />
            </div>
            <el-input
              v-if="category.aiAnalysisEnabled"
              v-model="category.aiDescription"
              maxlength="1000"
              show-word-limit
              type="textarea"
              placeholder="填写命中判定说明"
            />
          </div>
          <el-checkbox-group v-model="selectedCategories"
            ><el-checkbox v-for="item in categoryOptions" :key="item.value" :value="item.value">{{
              item.label
            }}</el-checkbox></el-checkbox-group
          >
        </div>
      </el-form-item>
    </el-form>
    <template #footer
      ><el-button @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template
    >
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { createMaterialTagApi, updateMaterialTagApi } from '@/modules/material/api/materialTag';
import type { MaterialTag, MaterialTagCategory, MaterialTagPayload } from '@/modules/material/types/materialTag';

const visible = ref(false);
const saving = ref(false);
const editing = ref(false);
const formRef = ref<FormInstance>();
const emit = defineEmits<{ saved: [] }>();
const categoryOptions = [
  { label: '图片', value: 'IMAGE' },
  { label: '文档', value: 'DOCUMENT' },
  { label: '视频', value: 'VIDEO' },
  { label: '音频', value: 'AUDIO' }
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
.category-list {
  width: 100%;
}
.category-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
