/**
 * 阅读器管理端 API 封装，统一维护作品、导入任务和审核相关接口。
 */
// Axios 返回类型定义，保证调用方能拿到准确的分页与详情类型约束。
import type { AxiosPromise } from '@/utils/api-types';
// 管理端请求实例统一处理网关前缀、鉴权头与错误提示。
import request from '@/utils/request';
// 阅读器后台业务类型集中从本地 types 文件引入，保持与后端契约同步演进。
import type {
  ReaderAuditRecordQuery,
  ReaderAuditRecordVO,
  ReaderCatalogAdminVO,
  ReaderComicChapterAdminVO,
  ReaderFeedbackAdminQuery,
  ReaderFeedbackAdminVO,
  ReaderFeedbackReplyForm,
  ReaderFeedbackStatusForm,
  ReaderImportTaskForm,
  ReaderImportTaskQuery,
  ReaderImportTaskVO,
  ReaderNovelChapterAdminVO,
  ReaderWorkAdminQuery,
  ReaderWorkAdminVO,
  ReaderWorkDetailAdminVO,
  ReaderSourceSite,
  ReaderSourceSiteForm,
  ReaderSourcePolicy,
  ReaderSourcePolicyForm,
  ReaderSourceRule,
  ReaderSourceRuleForm,
  ReaderSourceTask,
  ReaderSourceTaskForm,
  ReaderSourceTaskRun,
  ReaderSourceChapterSnapshot,
  ReaderSourceError,
  ReaderSourceDiscoveryProvider,
  ReaderSourceDiscoveryProviderForm,
  ReaderSourceDiscoveryBlacklist,
  ReaderSourceDiscoveryBlacklistForm,
  ReaderSourceDiscoveryCandidate,
  ReaderSourceDiscoveryRun
} from './types';
// 分页壳类型复用平台通用定义，避免各业务模块重复声明。
import type { PageResult } from '@/api/types';

export const listReaderWorks = (query: ReaderWorkAdminQuery): AxiosPromise<PageResult<ReaderWorkAdminVO>> => {
  return request({
    url: '/reader/admin/works/list',
    method: 'get',
    params: query
  });
};

export const getReaderWorkDetail = (workId: string | number): AxiosPromise<ReaderWorkDetailAdminVO> => {
  return request({
    url: `/reader/admin/works/${workId}`,
    method: 'get'
  });
};

export const listReaderWorkCatalog = (workId: string | number): AxiosPromise<ReaderCatalogAdminVO[]> => {
  return request({
    url: `/reader/admin/works/${workId}/catalog`,
    method: 'get'
  });
};

export const getReaderNovelChapterPreview = (chapterId: string | number): AxiosPromise<ReaderNovelChapterAdminVO> => {
  return request({
    url: `/reader/admin/works/novels/${chapterId}`,
    method: 'get'
  });
};

export const getReaderComicChapterPreview = (chapterId: string | number): AxiosPromise<ReaderComicChapterAdminVO> => {
  return request({
    url: `/reader/admin/works/comics/${chapterId}`,
    method: 'get'
  });
};

export const listReaderImportTasks = (query: ReaderImportTaskQuery): AxiosPromise<PageResult<ReaderImportTaskVO>> => {
  return request({
    url: '/reader/admin/import/tasks/list',
    method: 'get',
    params: query
  });
};

export const createReaderImportTask = (data: ReaderImportTaskForm) => {
  return request({
    url: '/reader/admin/import/tasks',
    method: 'post',
    data
  });
};

export const listReaderAuditRecords = (query: ReaderAuditRecordQuery): AxiosPromise<PageResult<ReaderAuditRecordVO>> => {
  return request({
    url: '/reader/admin/audits/list',
    method: 'get',
    params: query
  });
};

export const publishReaderWork = (workId: string | number) => {
  return request({
    url: `/reader/admin/works/${workId}/publish`,
    method: 'put'
  });
};

export const offlineReaderWork = (workId: string | number) => {
  return request({
    url: `/reader/admin/works/${workId}/offline`,
    method: 'put'
  });
};

export const approveReaderAudit = (auditId: string | number) => {
  return request({
    url: `/reader/admin/audits/${auditId}/approve`,
    method: 'post'
  });
};

export const listReaderFeedback = (query: ReaderFeedbackAdminQuery): AxiosPromise<PageResult<ReaderFeedbackAdminVO>> => {
  return request({
    url: '/reader/admin/feedback/list',
    method: 'get',
    params: query
  });
};

export const replyReaderFeedback = (feedbackId: string | number, data: ReaderFeedbackReplyForm) => {
  return request({
    url: `/reader/admin/feedback/${feedbackId}/reply`,
    method: 'put',
    data
  });
};

export const updateReaderFeedbackStatus = (feedbackId: string | number, data: ReaderFeedbackStatusForm) => {
  return request({
    url: `/reader/admin/feedback/${feedbackId}/status`,
    method: 'put',
    data
  });
};

export const listReaderSourceSites = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceSite>> =>
  request({ url: '/reader/admin/source/sites/list', method: 'get', params: query });

export const createReaderSourceSite = (data: ReaderSourceSiteForm) =>
  request({ url: '/reader/admin/source/sites', method: 'post', data });

export const updateReaderSourceSite = (id: string | number, data: ReaderSourceSiteForm) =>
  request({ url: `/reader/admin/source/sites/${id}`, method: 'put', data });

export const checkReaderSourceCompliance = (id: string | number, data: { approved: boolean; authorizationNote?: string }) =>
  request({ url: `/reader/admin/source/sites/${id}/check-compliance`, method: 'post', data });

export const enableReaderSourceSite = (id: string | number) =>
  request({ url: `/reader/admin/source/sites/${id}/enable`, method: 'post' });

export const disableReaderSourceSite = (id: string | number) =>
  request({ url: `/reader/admin/source/sites/${id}/disable`, method: 'post' });

export const listReaderSourcePolicies = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourcePolicy>> =>
  request({ url: '/reader/admin/source/policies/list', method: 'get', params: query });

export const createReaderSourcePolicy = (data: ReaderSourcePolicyForm) =>
  request({ url: '/reader/admin/source/policies', method: 'post', data });

export const updateReaderSourcePolicy = (id: string | number, data: ReaderSourcePolicyForm) =>
  request({ url: `/reader/admin/source/policies/${id}`, method: 'put', data });

export const listReaderSourceRules = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceRule>> =>
  request({ url: '/reader/admin/source/rules/list', method: 'get', params: query });

export const createReaderSourceRule = (data: ReaderSourceRuleForm) =>
  request({ url: '/reader/admin/source/rules', method: 'post', data });

export const updateReaderSourceRule = (id: string | number, data: ReaderSourceRuleForm) =>
  request({ url: `/reader/admin/source/rules/${id}`, method: 'put', data });

export const publishReaderSourceRule = (id: string | number) =>
  request({ url: `/reader/admin/source/rules/${id}/publish`, method: 'post' });

export const disableReaderSourceRule = (id: string | number) =>
  request({ url: `/reader/admin/source/rules/${id}/disable`, method: 'post' });

export const listReaderSourceTasks = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTask>> =>
  request({ url: '/reader/admin/source/tasks/list', method: 'get', params: query });

export const createReaderSourceTask = (data: ReaderSourceTaskForm) =>
  request({ url: '/reader/admin/source/tasks', method: 'post', data });

export const startReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/start`, method: 'post' });

export const pauseReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/pause`, method: 'post' });

export const resumeReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/resume`, method: 'post' });

export const cancelReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/cancel`, method: 'post' });

export const listReaderSourceTaskRuns = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTaskRun>> =>
  request({ url: `/reader/admin/source/tasks/${id}/runs`, method: 'get', params: query });

export const listReaderSourceTaskDiffs = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceChapterSnapshot>> =>
  request({ url: `/reader/admin/source/tasks/${id}/diffs`, method: 'get', params: query });

export const listReaderSourceTaskErrors = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceError>> =>
  request({ url: `/reader/admin/source/tasks/${id}/errors`, method: 'get', params: query });

export const listReaderSourceDiscoveryProviders = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDiscoveryProvider>> =>
  request({ url: '/reader/admin/source-discovery/providers', method: 'get', params: query });

export const createReaderSourceDiscoveryProvider = (data: ReaderSourceDiscoveryProviderForm) =>
  request({ url: '/reader/admin/source-discovery/providers', method: 'post', data });

export const updateReaderSourceDiscoveryProvider = (id: string | number, data: ReaderSourceDiscoveryProviderForm) =>
  request({ url: `/reader/admin/source-discovery/providers/${id}`, method: 'put', data });

export const runReaderSourceDiscoveryProvider = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/providers/${id}/run`, method: 'post' });

export const enableReaderSourceDiscoveryProvider = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/providers/${id}/enable`, method: 'post' });

export const disableReaderSourceDiscoveryProvider = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/providers/${id}/disable`, method: 'post' });

export const listReaderSourceDiscoveryBlacklist = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDiscoveryBlacklist>> =>
  request({ url: '/reader/admin/source-discovery/blacklist', method: 'get', params: query });

export const createReaderSourceDiscoveryBlacklist = (data: ReaderSourceDiscoveryBlacklistForm) =>
  request({ url: '/reader/admin/source-discovery/blacklist', method: 'post', data });

export const updateReaderSourceDiscoveryBlacklist = (id: string | number, data: ReaderSourceDiscoveryBlacklistForm) =>
  request({ url: `/reader/admin/source-discovery/blacklist/${id}`, method: 'put', data });

export const deleteReaderSourceDiscoveryBlacklist = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/blacklist/${id}`, method: 'delete' });

export const enableReaderSourceDiscoveryBlacklist = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/blacklist/${id}/enable`, method: 'post' });

export const disableReaderSourceDiscoveryBlacklist = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/blacklist/${id}/disable`, method: 'post' });

export const listReaderSourceDiscoveryCandidates = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDiscoveryCandidate>> =>
  request({ url: '/reader/admin/source-discovery/candidates', method: 'get', params: query });

export const checkReaderSourceDiscoveryCandidate = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/candidates/${id}/check`, method: 'post' });

export const approveReaderSourceDiscoveryCandidate = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/candidates/${id}/approve`, method: 'post' });

export const rejectReaderSourceDiscoveryCandidate = (id: string | number, reason?: string) =>
  request({ url: `/reader/admin/source-discovery/candidates/${id}/reject`, method: 'post', params: { reason } });

export const listReaderSourceDiscoveryRuns = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDiscoveryRun>> =>
  request({ url: '/reader/admin/source-discovery/runs', method: 'get', params: query });
