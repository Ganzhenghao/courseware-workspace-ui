<template>
  <Teleport to="body">
    <Transition name="login-loading-fade">
      <div v-if="visible" class="login-loading-overlay" role="status" aria-live="polite">
        <div class="login-loading-card">
          <div class="brand-loader" aria-hidden="true">
            <span class="brand-loader__orbit brand-loader__orbit--outer"></span>
            <span class="brand-loader__orbit brand-loader__orbit--inner"></span>
            <span class="brand-loader__core">
              <el-icon><Reading /></el-icon>
            </span>
          </div>
          <strong class="login-loading-title">正在进入工作台</strong>
          <span class="login-loading-message">{{ message }}</span>
          <div class="login-loading-steps" aria-hidden="true">
            <span class="is-complete"></span>
            <span class="is-active"></span>
            <span></span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Reading } from '@element-plus/icons-vue';

defineProps<{
  visible: boolean;
  message: string;
}>();
</script>

<style scoped lang="scss">
.login-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(6 35 32 / 68%);
  backdrop-filter: blur(4px);
}

.login-loading-card {
  box-sizing: border-box;
  display: flex;
  width: min(300px, calc(100vw - 40px));
  min-height: 220px;
  padding: 30px 28px 25px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  box-shadow: 0 24px 72px rgb(0 40 36 / 32%);
}

.brand-loader {
  position: relative;
  width: 82px;
  height: 82px;
  margin-bottom: 21px;
}

.brand-loader__orbit {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 50%;
}

.brand-loader__orbit--outer {
  inset: 0;
  border-top-color: var(--el-color-primary);
  border-right-color: var(--el-color-primary-light-7);
  animation: login-loading-spin 1.15s linear infinite;
}

.brand-loader__orbit--inner {
  inset: 8px;
  border-bottom-color: var(--el-color-primary-light-3);
  animation: login-loading-spin-reverse 1.7s linear infinite;
}

.brand-loader__core {
  position: absolute;
  inset: 16px;
  display: grid;
  place-items: center;
  color: var(--el-color-white);
  background: linear-gradient(145deg, var(--el-color-primary-light-3), var(--el-color-primary));
  border-radius: 50%;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 28%, transparent);

  .el-icon {
    font-size: 23px;
  }
}

.login-loading-title {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.login-loading-message {
  min-height: 21px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.login-loading-steps {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 18px;

  span {
    width: 5px;
    height: 5px;
    background: var(--el-border-color);
    border-radius: 5px;
    transition: width 0.2s ease;
  }

  .is-complete {
    background: var(--el-color-primary-light-5);
  }

  .is-active {
    width: 17px;
    background: var(--el-color-primary);
  }
}

.login-loading-fade-enter-active,
.login-loading-fade-leave-active {
  transition: opacity 0.2s ease;

  .login-loading-card {
    transition: transform 0.2s ease;
  }
}

.login-loading-fade-enter-from,
.login-loading-fade-leave-to {
  opacity: 0;

  .login-loading-card {
    transform: translateY(6px) scale(0.98);
  }
}

@keyframes login-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes login-loading-spin-reverse {
  to {
    transform: rotate(-360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-loader__orbit,
  .login-loading-fade-enter-active,
  .login-loading-fade-leave-active,
  .login-loading-card {
    animation: none;
    transition: none;
  }
}
</style>
