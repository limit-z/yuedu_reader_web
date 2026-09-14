/**
 * 阅读器管理端路由配置，按作品、采集和 H5 运营职责分组。
 */
import type { RouteRecordRaw } from 'vue-router';
import ParentView from '@/components/ParentView/index.vue';
import Layout from '@/layout/index.vue';

const readerAdminRoutes: RouteRecordRaw[] = [
  {
    path: '/reader-admin',
    component: Layout,
    name: 'ReaderAdmin',
    redirect: '/reader-admin/works/list',
    // 本地补充路由会先经过权限过滤，目录节点需要挂一组可命中的权限才能被真正注入。
    permissions: [
      'reader:work:list',
      'reader:import-task:list',
      'reader:audit:list',
      'reader:feedback:list',
      'reader:h5-user:list',
      'reader:h5-comment:list',
      'reader:h5-points:list',
      'reader:publish-log:list',
      'reader:source:list',
      'reader:category:list',
      'reader:ranking:list'
    ],
    alwaysShow: true,
    meta: { title: '阅读器管理', icon: 'documentation' },
    children: [
      {
        path: 'works',
        name: 'ReaderAdminWorksGroup',
        component: ParentView,
        redirect: '/reader-admin/works/list',
        alwaysShow: true,
        meta: { title: '作品管理', icon: 'documentation' },
        children: [
          {
            path: 'list',
            name: 'ReaderAdminWork',
            component: () => import('@/views/reader-admin/work/index.vue'),
            meta: { title: '作品列表', icon: 'clipboard' }
          },
          {
            path: 'list/:workId',
            name: 'ReaderAdminWorkDetail',
            component: () => import('@/views/reader-admin/work/detail.vue'),
            meta: { title: '作品详情', activeMenu: '/reader-admin/works/list' },
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
            meta: { title: '内容审核', icon: 'finish' }
          },
          {
            path: 'publish-log',
            name: 'ReaderAdminPublishLog',
            component: () => import('@/views/reader-admin/publish-log/index.vue'),
            meta: { title: '发布记录', icon: 'time' }
          },
          {
            path: 'category',
            name: 'ReaderAdminWorkCategory',
            component: () => import('@/views/reader-admin/work-category/index.vue'),
            permissions: ['reader:category:list'],
            meta: { title: '作品分类', icon: 'category' }
          },
          {
            path: 'ranking',
            name: 'ReaderAdminRanking',
            component: () => import('@/views/reader-admin/ranking/index.vue'),
            permissions: ['reader:ranking:list'],
            meta: { title: '榜单管理', icon: 'star' }
          }
        ]
      },
      {
        path: 'sources',
        name: 'ReaderAdminSourcesGroup',
        component: ParentView,
        redirect: '/reader-admin/sources/tasks',
        alwaysShow: true,
        permissions: ['reader:source:list'],
        meta: { title: '采集中心', icon: 'link' },
        children: [
          {
            path: 'tasks',
            name: 'ReaderAdminSourceCenter',
            component: () => import('@/views/reader-admin/source-center/index.vue'),
            permissions: ['reader:source:list'],
            meta: { title: '采集任务', icon: 'link' }
          },
          {
            path: 'dashboard',
            name: 'ReaderAdminSourceDashboard',
            component: () => import('@/views/reader-admin/source-dashboard/index.vue'),
            permissions: ['reader:source:list'],
            meta: { title: '采集数据大盘', icon: 'chart' }
          }
        ]
      },
      {
        path: 'h5',
        name: 'ReaderAdminH5Group',
        component: ParentView,
        redirect: '/reader-admin/h5/users',
        alwaysShow: true,
        permissions: ['reader:h5-user:list', 'reader:h5-comment:list', 'reader:h5-points:list', 'reader:feedback:list'],
        meta: { title: 'H5 管理', icon: 'phone' },
        children: [
          {
            path: 'users',
            name: 'ReaderAdminH5Users',
            component: () => import('@/views/reader-admin/h5-user/index.vue'),
            permissions: ['reader:h5-user:list'],
            meta: { title: '读者用户', icon: 'user' }
          },
          {
            path: 'comments',
            name: 'ReaderAdminH5Comments',
            component: () => import('@/views/reader-admin/h5-comment/index.vue'),
            permissions: ['reader:h5-comment:list'],
            meta: { title: '书评管理', icon: 'message' }
          },
          {
            path: 'points',
            name: 'ReaderAdminH5Points',
            component: () => import('@/views/reader-admin/h5-points/index.vue'),
            permissions: ['reader:h5-points:list'],
            meta: { title: '积分规则', icon: 'money' }
          },
          {
            path: 'feedback',
            name: 'ReaderAdminFeedback',
            component: () => import('@/views/reader-admin/feedback/index.vue'),
            permissions: ['reader:feedback:list'],
            meta: { title: '用户反馈', icon: 'message' }
          }
        ]
      },
      // 保留旧地址的无菜单兼容入口，避免历史书签或已打开标签页失效。
      {
        path: 'work',
        redirect: '/reader-admin/works/list',
        hidden: true
      },
      {
        path: 'work/:workId',
        redirect: to => `/reader-admin/works/list/${to.params.workId}`,
        hidden: true
      },
      {
        path: 'import-task',
        redirect: '/reader-admin/works/import-task',
        hidden: true
      },
      {
        path: 'audit',
        redirect: '/reader-admin/works/audit',
        hidden: true
      },
      {
        path: 'publish-log',
        redirect: '/reader-admin/works/publish-log',
        hidden: true
      },
      {
        path: 'work-category',
        redirect: '/reader-admin/works/category',
        hidden: true
      },
      {
        path: 'ranking',
        redirect: '/reader-admin/works/ranking',
        hidden: true
      },
      {
        path: 'source-center',
        redirect: '/reader-admin/sources/tasks',
        hidden: true
      },
      {
        path: 'source-dashboard',
        redirect: '/reader-admin/sources/dashboard',
        hidden: true
      },
      {
        path: 'feedback',
        redirect: '/reader-admin/h5/feedback',
        hidden: true
      }
    ]
  }
];

export default readerAdminRoutes;
