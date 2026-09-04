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
  ReaderWorkDetailAdminVO
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
