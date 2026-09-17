import { defineModule } from '@/core';

/** AI 基础配置模块页面与动态菜单映射。 */
export const aiModule = defineModule({
  name: 'ai',
  components: {
    '/ai/provider/index': () => import('./views/provider/index.vue'),
    '/ai/model/index': () => import('./views/model/index.vue')
  }
});
