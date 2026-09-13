/**
 * 阅读器管理端路由配置，组织导入、审核、反馈、作品与详情页面入口。
 */
import type { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const readerAdminRoutes: RouteRecordRaw[] = [
  {
    path: '/reader-admin',
    component: Layout,
    name: 'ReaderAdmin',
    redirect: '/reader-admin/work',
    // 本地补充路由会先经过权限过滤，目录节点需要挂一组可命中的权限才能被真正注入。
    permissions: ['reader:work:list', 'reader:import-task:list', 'reader:audit:list', 'reader:feedback:list', 'reader:publish-log:list', 'reader:source:list', 'reader:category:list'],
    alwaysShow: true,
    meta: { title: '阅读器管理', icon: 'document' },
    children: [
      {
        path: 'work',
        name: 'ReaderAdminWork',
        component: () => import('@/views/reader-admin/work/index.vue'),
        meta: { title: '作品管理', icon: 'document' }
      },
      {
        path: 'work/:workId',
        name: 'ReaderAdminWorkDetail',
        component: () => import('@/views/reader-admin/work/detail.vue'),
        meta: { title: '作品详情', activeMenu: '/reader-admin/work' },
        hidden: true
      },
      {
        path: 'import-task',
        name: 'ReaderAdminImportTask',
        component: () => import('@/views/reader-admin/import-task/index.vue'),
        meta: { title: '导入任务', icon: 'upload' }
      },
      {
        path: 'audit',
        name: 'ReaderAdminAudit',
        component: () => import('@/views/reader-admin/audit/index.vue'),
        meta: { title: '内容审核', icon: 'check' }
      },
      {
        path: 'feedback',
        name: 'ReaderAdminFeedback',
        component: () => import('@/views/reader-admin/feedback/index.vue'),
        meta: { title: '反馈工单', icon: 'chat-dot-round' }
      },
      {
        path: 'publish-log',
        name: 'ReaderAdminPublishLog',
        component: () => import('@/views/reader-admin/publish-log/index.vue'),
        meta: { title: '发布说明', icon: 'clock' }
      },
      {
        path: 'source-center',
        name: 'ReaderAdminSourceCenter',
        component: () => import('@/views/reader-admin/source-center/index.vue'),
        permissions: ['reader:source:list'],
        meta: { title: '书源采集中心', icon: 'connection' }
      },
      {
        path: 'source-dashboard',
        name: 'ReaderAdminSourceDashboard',
        component: () => import('@/views/reader-admin/source-dashboard/index.vue'),
        permissions: ['reader:source:list'],
        meta: { title: '采集数据大盘', icon: 'data-analysis' }
      },
      {
        path: 'work-category',
        name: 'ReaderAdminWorkCategory',
        component: () => import('@/views/reader-admin/work-category/index.vue'),
        permissions: ['reader:category:list'],
        meta: { title: '作品分类', icon: 'collection-tag' }
      },
      {
        path: 'ranking',
        name: 'ReaderAdminRanking',
        component: () => import('@/views/reader-admin/ranking/index.vue'),
        permissions: ['reader:ranking:list'],
        meta: { title: '榜单管理', icon: 'trend-charts' }
      }
    ]
  }
];

export default readerAdminRoutes;
