import { defineModule } from '@/core';

/**
 * 素材模块页面与后端菜单组件路径的显式映射。
 */
export const materialModule = defineModule({
  name: 'material',
  components: {
    '/material/materialCategory/index': () => import('./views/materialCategory/index.vue')
  }
});
