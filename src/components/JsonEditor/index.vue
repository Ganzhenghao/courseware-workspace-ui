<template>
  <div class="json-editor" :class="{ 'is-disabled': disabled }">
    <el-button
      v-if="!disabled"
      class="json-editor-format"
      type="primary"
      link
      size="small"
      :icon="MagicStick"
      @click="handleFormat"
    >
      格式化
    </el-button>
    <Codemirror
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :extensions="extensions"
      :style="{ height }"
      @update:model-value="handleInput"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { MagicStick } from '@element-plus/icons-vue';
import { Codemirror } from 'vue-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';
import { useAppStore } from '@/stores/modules/app';

defineOptions({
  name: 'JsonEditor'
});

interface JsonEditorProps {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  height?: string;
}

const props = withDefaults(defineProps<JsonEditorProps>(), {
  placeholder: '',
  disabled: false,
  height: '140px'
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  blur: [];
}>();

const appStore = useAppStore();

const parseLinter = jsonParseLinter();
// 空内容与表单校验保持一致（value || '{}'），不标红
const jsonLinter = linter(view => (view.state.doc.length ? parseLinter(view) : []));
const baseExtensions = [json(), jsonLinter];
// extensions 数组整体替换时，vue-codemirror 会通过 Compartment 热重配，用于切换暗色主题
const extensions = computed(() => (appStore.isDark ? [...baseExtensions, oneDark] : baseExtensions));

const handleInput = (value: string) => {
  emit('update:modelValue', value);
  emit('change', value);
};

const handleFormat = () => {
  try {
    const formatted = JSON.stringify(JSON.parse(props.modelValue || '{}'), null, 2);
    emit('update:modelValue', formatted);
    emit('change', formatted);
  } catch {
    ElMessage.warning('JSON 格式不正确，无法格式化');
  }
};

const handleBlur = () => emit('blur');
</script>

<style scoped lang="scss">
.json-editor {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-fill-color-blank);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-border-color-hover);
  }

  &:focus-within {
    border-color: var(--el-color-primary);
  }

  &.is-disabled {
    cursor: not-allowed;
    border-color: var(--el-border-color-lighter);
    background-color: var(--el-disabled-bg-color);
  }

  .json-editor-format {
    position: absolute;
    top: 3px;
    right: 10px;
    z-index: 10;
    padding: 2px 6px;
    background-color: var(--el-bg-color);
    border-radius: 4px;
    opacity: 0.9;
  }

  // 编辑器聚焦边框由容器 focus-within 负责，去掉 CodeMirror 默认虚线
  :deep(.cm-editor.cm-focused) {
    outline: none;
  }

  :deep(.cm-placeholder) {
    color: var(--el-text-color-placeholder);
  }
}
</style>
