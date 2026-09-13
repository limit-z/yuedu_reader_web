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
  ReaderSourceTaskBook,
  ReaderSourceTaskBookSnapshot,
  ReaderSourceTaskFallback,
  ReaderSourceTaskLog,
  ReaderSourceChapterSnapshot,
  ReaderSourceError,
  ReaderSourceDashboardVO,
  ReaderSourceDashboardWorkVO,
  ReaderSourceDashboardWorkDetailVO,
  ReaderSourceDashboardChapterVO,
  ReaderSourceDiscoveryProvider,
  ReaderSourceDiscoveryProviderForm,
  ReaderSourceDiscoveryBlacklist,
  ReaderSourceDiscoveryBlacklistForm,
  ReaderSourceDiscoveryCandidate,
  ReaderSourceDiscoveryRun,
  ReaderWorkCategory,
  ReaderCoverStyleForm,
  ReaderCoverStyleVO
  ,ReaderCoverCrawlTaskAdminVO
  ,ReaderRanking
  ,ReaderRankingWork
  ,ReaderRankingWorkOption
} from './types';
// 分页壳类型复用平台通用定义，避免各业务模块重复声明。
import type { PageResult } from '@/api/types';

export interface ReaderBatchActionFailure {
  id: string | number;
  reason: string;
}

export interface ReaderBatchActionResult {
  requestedCount: number;
  successCount: number;
  failureCount: number;
  failures: ReaderBatchActionFailure[];
}

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

export const batchReaderImportTasks = (action: 'cancel' | 'retry', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/import/tasks/batch/${action}`, method: 'post', data: ids });

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

export const batchReaderWorkStatus = (action: 'publish' | 'offline', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/works/batch/${action}`, method: 'post', data: ids });

export const getReaderGlobalCoverStyle = (): AxiosPromise<ReaderCoverStyleVO> =>
  request({ url: '/reader/admin/works/cover-settings', method: 'get' });

export const updateReaderGlobalCoverStyle = (data: ReaderCoverStyleForm) =>
  request({ url: '/reader/admin/works/cover-settings', method: 'put', data });

export const updateReaderWorkCoverStyle = (workId: string | number, data: ReaderCoverStyleForm) =>
  request({ url: `/reader/admin/works/${workId}/cover-settings`, method: 'put', data });

export const getReaderCoverCrawlTask = (workId: string | number): AxiosPromise<ReaderCoverCrawlTaskAdminVO> =>
  request({ url: `/reader/admin/works/${workId}/cover-crawl`, method: 'get' });

export const retryReaderCoverCrawl = (workId: string | number) =>
  request({ url: `/reader/admin/works/${workId}/cover-crawl/retry`, method: 'post' });

export const reformatReaderNovelContents = () =>
  request({ url: '/reader/admin/works/chapters/reformat', method: 'post' });

export const approveReaderAudit = (auditId: string | number) => {
  return request({
    url: `/reader/admin/audits/${auditId}/approve`,
    method: 'post'
  });
};

export const batchApproveReaderAudits = (ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: '/reader/admin/audits/batch/approve', method: 'post', data: ids });

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

export const batchUpdateReaderFeedbackStatus = (ids: Array<string | number>, status: string): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: '/reader/admin/feedback/batch/status', method: 'post', data: { ids, status } });

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

export const batchReaderSourceSites = (action: 'enable' | 'disable', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source/sites/batch/${action}`, method: 'post', data: ids });

export const listReaderSourcePolicies = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourcePolicy>> =>
  request({ url: '/reader/admin/source/policies/list', method: 'get', params: query });

export const createReaderSourcePolicy = (data: ReaderSourcePolicyForm) =>
  request({ url: '/reader/admin/source/policies', method: 'post', data });

export const updateReaderSourcePolicy = (id: string | number, data: ReaderSourcePolicyForm) =>
  request({ url: `/reader/admin/source/policies/${id}`, method: 'put', data });

export const batchReaderSourcePolicies = (action: 'enable' | 'disable', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source/policies/batch/${action}`, method: 'post', data: ids });

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

export const batchReaderSourceRules = (action: 'publish' | 'disable', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source/rules/batch/${action}`, method: 'post', data: ids });

export const listReaderSourceTasks = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTask>> =>
  request({ url: '/reader/admin/source/tasks/list', method: 'get', params: query });

export const getReaderSourceDashboardOverview = (days = 14): AxiosPromise<ReaderSourceDashboardVO> =>
  request({ url: '/reader/admin/source/dashboard/overview', method: 'get', params: { days } });

export const listReaderSourceDashboardWorks = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDashboardWorkVO>> =>
  request({ url: '/reader/admin/source/dashboard/works', method: 'get', params: query });

export const getReaderSourceDashboardWorkDetail = (workId: string | number): AxiosPromise<ReaderSourceDashboardWorkDetailVO> =>
  request({ url: `/reader/admin/source/dashboard/works/${workId}`, method: 'get' });

export const listReaderSourceDashboardWorkChapters = (
  workId: string | number,
  query: Record<string, unknown>
): AxiosPromise<PageResult<ReaderSourceDashboardChapterVO>> =>
  request({ url: `/reader/admin/source/dashboard/works/${workId}/chapters`, method: 'get', params: query });

export const getReaderSourceTask = (id: string | number): AxiosPromise<ReaderSourceTask> =>
  request({ url: `/reader/admin/source/tasks/${id}`, method: 'get' });

export const materializeReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/materialize`, method: 'post' });

export const createReaderSourceTask = (data: ReaderSourceTaskForm) =>
  request({ url: '/reader/admin/source/tasks', method: 'post', data });

export const startReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/start`, method: 'post' });

export const pauseReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/pause`, method: 'post' });

export const resumeReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/resume`, method: 'post' });

export const retryCircuitReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/retry-circuit`, method: 'post' });

export const cancelReaderSourceTask = (id: string | number) =>
  request({ url: `/reader/admin/source/tasks/${id}/cancel`, method: 'post' });

export const batchReaderSourceTasks = (action: 'start' | 'pause' | 'resume' | 'cancel' | 'retry-circuit', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source/tasks/batch/${action}`, method: 'post', data: ids });

export const listReaderSourceTaskRuns = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTaskRun>> =>
  request({ url: `/reader/admin/source/tasks/${id}/runs`, method: 'get', params: query });

export const listReaderSourceTaskDiffs = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceChapterSnapshot>> =>
  request({ url: `/reader/admin/source/tasks/${id}/diffs`, method: 'get', params: query });

export const listReaderSourceTaskErrors = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceError>> =>
  request({ url: `/reader/admin/source/tasks/${id}/errors`, method: 'get', params: query });

export const listReaderSourceTaskBooks = (id: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTaskBook>> =>
  request({ url: `/reader/admin/source/tasks/${id}/books`, method: 'get', params: query });

export const getReaderSourceTaskBook = (taskId: string | number, taskBookId: string | number) =>
  request({ url: `/reader/admin/source/tasks/${taskId}/books/${taskBookId}`, method: 'get' });

export const listReaderSourceTaskBookSnapshots = (taskId: string | number, taskBookId: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTaskBookSnapshot>> =>
  request({ url: `/reader/admin/source/tasks/${taskId}/books/${taskBookId}/snapshots`, method: 'get', params: query });

export const listReaderSourceTaskFallbacks = (taskId: string | number): AxiosPromise<ReaderSourceTaskFallback[]> =>
  request({ url: `/reader/admin/source/tasks/${taskId}/fallbacks`, method: 'get' });

export const autoProvisionReaderSourceTaskFallbacks = (taskId: string | number) =>
  request({ url: `/reader/admin/source/tasks/${taskId}/fallbacks/auto-provision`, method: 'post' });

export const listReaderSourceTaskChildren = (taskId: string | number): AxiosPromise<ReaderSourceTask[]> =>
  request({ url: `/reader/admin/source/tasks/${taskId}/children`, method: 'get' });

export const saveReaderSourceTaskFallback = (taskId: string | number, data: ReaderSourceTaskFallback) =>
  request({ url: `/reader/admin/source/tasks/${taskId}/fallbacks`, method: 'post', data });

export const listReaderSourceTaskLogs = (taskId: string | number, query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceTaskLog>> =>
  request({ url: `/reader/admin/source/tasks/${taskId}/logs`, method: 'get', params: query });

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

export const batchReaderSourceDiscoveryProviders = (action: 'enable' | 'disable', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source-discovery/providers/batch/${action}`, method: 'post', data: ids });

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

export const batchReaderSourceDiscoveryBlacklist = (action: 'enable' | 'disable' | 'delete', ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source-discovery/blacklist/batch/${action}`, method: 'post', data: ids });

export const listReaderSourceDiscoveryCandidates = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDiscoveryCandidate>> =>
  request({ url: '/reader/admin/source-discovery/candidates', method: 'get', params: query });

export const checkReaderSourceDiscoveryCandidate = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/candidates/${id}/check`, method: 'post' });

export const approveReaderSourceDiscoveryCandidate = (id: string | number) =>
  request({ url: `/reader/admin/source-discovery/candidates/${id}/approve`, method: 'post' });

export const rejectReaderSourceDiscoveryCandidate = (id: string | number, reason?: string) =>
  request({ url: `/reader/admin/source-discovery/candidates/${id}/reject`, method: 'post', params: { reason } });

export const batchReaderSourceDiscoveryCandidates = (action: 'check' | 'approve' | 'reject', ids: Array<string | number>, reason?: string): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/source-discovery/candidates/batch/${action}`, method: 'post', data: ids, params: { reason } });

export const listReaderSourceDiscoveryRuns = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderSourceDiscoveryRun>> =>
  request({ url: '/reader/admin/source-discovery/runs', method: 'get', params: query });

export const listReaderWorkCategories = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderWorkCategory>> =>
  request({ url: '/reader/admin/work-categories/list', method: 'get', params: query });

export const createReaderWorkCategory = (data: Partial<ReaderWorkCategory>) =>
  request({ url: '/reader/admin/work-categories', method: 'post', data });

export const updateReaderWorkCategory = (id: string | number, data: Partial<ReaderWorkCategory>) =>
  request({ url: `/reader/admin/work-categories/${id}`, method: 'put', data });

export const updateReaderWorkCategoryStatus = (id: string | number, status: string) =>
  request({ url: `/reader/admin/work-categories/${id}/status/${status}`, method: 'post' });

export const batchUpdateReaderWorkCategoryStatus = (status: string, ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/work-categories/batch/status/${status}`, method: 'post', data: ids });

export const listReaderRankings = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderRanking>> =>
  request({ url: '/reader/admin/rankings/list', method: 'get', params: query });

export const createReaderRanking = (data: Partial<ReaderRanking>) =>
  request({ url: '/reader/admin/rankings', method: 'post', data });

export const updateReaderRanking = (id: string | number, data: Partial<ReaderRanking>) =>
  request({ url: `/reader/admin/rankings/${id}`, method: 'put', data });

export const updateReaderRankingStatus = (id: string | number, status: string) =>
  request({ url: `/reader/admin/rankings/${id}/status/${status}`, method: 'post' });

export const batchUpdateReaderRankingStatus = (status: string, ids: Array<string | number>): AxiosPromise<ReaderBatchActionResult> =>
  request({ url: `/reader/admin/rankings/batch/status/${status}`, method: 'post', data: ids });

export const listReaderRankingWorks = (query: Record<string, unknown>): AxiosPromise<PageResult<ReaderRankingWorkOption>> =>
  request({ url: '/reader/admin/rankings/available-works', method: 'get', params: query });

export const listReaderRankingWorkRelations = (id: string | number): AxiosPromise<ReaderRankingWork[]> =>
  request({ url: `/reader/admin/rankings/${id}/works`, method: 'get' });

export const saveReaderRankingWorks = (id: string | number, workIds: Array<string | number>) =>
  request({ url: `/reader/admin/rankings/${id}/works`, method: 'put', data: workIds });
