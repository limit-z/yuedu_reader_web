/**
 * 阅读器管理端类型定义，约束页面与后端接口之间的数据结构。
 */
export interface ReaderWorkAdminVO extends BaseEntity {
  /** 主键ID。 */
  id: string | number;
  /** 作品类型。 */
  workType: 'NOVEL' | 'COMIC';
  /** 作品标题。 */
  title: string;
  /** 内容分类，例如玄幻、言情、修仙。 */
  categoryName?: string;
  /** 发布状态。 */
  publishStatus: string;
  /** 来源类型。 */
  sourceType: string;
  /** 简介内容。 */
  intro?: string;
  /** 封面地址。 */
  coverUrl?: string;
  /** 连载状态。 */
  serialStatus?: string;
  /** 是否允许被搜索。 */
  allowSearch?: string;
  /** 总章节数。 */
  totalChapters?: number;
  /** 总页数。 */
  totalPages?: number;
  /** 最新审核状态。 */
  auditStatus?: string;
}

export interface ReaderWorkAdminQuery extends PageQuery {
  /** 搜索关键词。 */
  keyword?: string;
  /** 作品类型。 */
  workType?: 'NOVEL' | 'COMIC';
  /** 发布状态。 */
  publishStatus?: string;
  /** 来源类型。 */
  sourceType?: string;
}

export interface ReaderImportTaskVO extends BaseEntity {
  /** 主键ID。 */
  id: string | number;
  /** 导入任务名称。 */
  taskName: string;
  /** 内容类型。 */
  contentType?: 'NOVEL' | 'COMIC';
  /** 内容分类，例如玄幻、言情、修仙。 */
  categoryName?: string;
  /** 当前状态。 */
  status: string;
  /** 总处理单元数。 */
  totalUnits?: number;
  /** 已完成处理单元数。 */
  processedUnits?: number;
  /** 当前进度百分比。 */
  progressPercent?: number;
  /** 当前进度说明。 */
  progressMessage?: string;
  /** 失败原因。 */
  failReason?: string;
  /** OSS 文件ID。 */
  ossId?: string | number;
  /** 作品封面 OSS 文件ID，上传组件以字符串形式返回。 */
  coverOssId?: string;
}

export interface ReaderImportTaskQuery extends PageQuery {
  /** 当前状态。 */
  status?: string;
  /** 导入任务名称。 */
  taskName?: string;
}

export interface ReaderImportTaskForm {
  /** 导入任务名称。 */
  taskName: string;
  /** 内容类型。 */
  contentType: 'NOVEL' | 'COMIC';
  /** 内容分类，不与小说/漫画作品类型混用。 */
  categoryName?: string;
  /** OSS 文件ID。 */
  ossId: string | number;
  /** 作品封面 OSS 文件ID，上传组件以字符串形式返回。 */
  coverOssId?: string;
}

export interface ReaderAuditRecordVO extends BaseEntity {
  /** 主键ID。 */
  id: string | number;
  /** 作品ID。 */
  workId: string | number;
  /** 作品标题。 */
  workTitle?: string;
  /** 审核状态。 */
  auditStatus: string;
  /** 审核意见。 */
  auditComment?: string;
}

export interface ReaderAuditRecordQuery extends PageQuery {
  /** 审核状态。 */
  auditStatus?: string;
  /** 作品标题。 */
  workTitle?: string;
}

export interface ReaderWorkDetailAdminVO extends ReaderWorkAdminVO {
  /** 创建时间。 */
  createTime?: string;
  /** 更新时间。 */
  updateTime?: string;
}

export interface ReaderCatalogAdminVO {
  /** 章节ID。 */
  chapterId: string | number;
  /** 章节名。 */
  chapterName: string;
  /** 章节序号。 */
  chapterNo?: number;
  /** 卷名。 */
  volumeName?: string;
  /** 字数。 */
  wordCount?: number;
  /** 页数。 */
  pageCount?: number;
  /** 发布状态。 */
  publishStatus?: string;
  /** 更新时间。 */
  updateTime?: string;
}

export interface ReaderNovelChapterAdminVO {
  /** 作品ID。 */
  workId: string | number;
  /** 章节ID。 */
  chapterId: string | number;
  /** 卷名。 */
  volumeName?: string;
  /** 章节名。 */
  chapterName: string;
  /** 章节序号。 */
  chapterNo?: number;
  /** 字数。 */
  wordCount?: number;
  /** 发布状态。 */
  publishStatus?: string;
  /** 正文内容。 */
  content: string;
}

export interface ReaderComicChapterAdminVO {
  /** 作品ID。 */
  workId: string | number;
  /** 章节ID。 */
  chapterId: string | number;
  /** 章节名。 */
  chapterName: string;
  /** 章节序号。 */
  chapterNo?: number;
  /** 页数。 */
  pageCount?: number;
  /** 发布状态。 */
  publishStatus?: string;
  /** 图片地址列表。 */
  imageUrls: string[];
}

export interface ReaderFeedbackAdminVO extends BaseEntity {
  /** 反馈记录ID。 */
  feedbackId: string | number;
  /** 读者主体ID。 */
  readerId: string | number;
  /** 读者身份类型。 */
  accountType: 'USER' | 'VISITOR' | string;
  /** 反馈类型。 */
  feedbackType: string;
  /** 反馈内容。 */
  feedbackContent: string;
  /** 提交时昵称。 */
  nickName?: string;
  /** 提交时手机号。 */
  contactMobile?: string;
  /** 提交时微信号。 */
  contactWechat?: string;
  /** 工单状态。 */
  status: string;
  /** 管理员回复内容。 */
  replyContent?: string;
  /** 最后回复人ID。 */
  replyBy?: string | number;
  /** 最后回复时间。 */
  replyTime?: string;
}

export interface ReaderFeedbackAdminQuery extends PageQuery {
  /** 工单状态。 */
  status?: string;
  /** 反馈类型。 */
  feedbackType?: string;
  /** 关键词。 */
  keyword?: string;
}

export interface ReaderFeedbackReplyForm {
  /** 管理员回复内容。 */
  replyContent: string;
  /** 回复后工单状态。 */
  status?: string;
}

export interface ReaderFeedbackStatusForm {
  /** 目标状态。 */
  status: string;
}

export interface ReaderSourceSite extends BaseEntity {
  id: string | number;
  siteName: string;
  baseUrl: string;
  allowedHost: string;
  authorizationNote?: string;
  complianceStatus: 'UNCONFIRMED' | 'APPROVED' | 'REJECTED' | string;
  complianceCheckedAt?: string;
  complianceCheckedBy?: string | number;
  status: string;
  defaultPolicyId?: string | number;
  remark?: string;
}

export interface ReaderSourceSiteForm {
  id?: string | number;
  siteName: string;
  baseUrl: string;
  allowedHost?: string;
  authorizationNote?: string;
  defaultPolicyId?: string | number;
  remark?: string;
}

export interface ReaderSourcePolicy extends BaseEntity {
  id: string | number;
  policyName: string;
  concurrencyLimit: number;
  minDelayMs: number;
  maxDelayMs: number;
  requestsPerMinute: number;
  dailyRequestLimit: number;
  connectTimeoutMs: number;
  readTimeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  honorRetryAfter: string;
  status: string;
  remark?: string;
}

export interface ReaderSourcePolicyForm {
  id?: string | number;
  policyName: string;
  concurrencyLimit: number;
  minDelayMs: number;
  maxDelayMs: number;
  requestsPerMinute: number;
  dailyRequestLimit: number;
  connectTimeoutMs: number;
  readTimeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  honorRetryAfter: string;
  remark?: string;
}

export interface ReaderSourceRule extends BaseEntity {
  id: string | number;
  siteId: string | number;
  ruleName: string;
  versionNo: number;
  status: string;
  searchUrlTemplate?: string;
  detailUrlTemplate?: string;
  catalogUrlTemplate?: string;
  chapterUrlTemplate?: string;
  selectorJson: string;
  testUrl?: string;
  remark?: string;
}

export interface ReaderSourceRuleForm {
  id?: string | number;
  siteId: string | number;
  ruleName: string;
  searchUrlTemplate?: string;
  detailUrlTemplate?: string;
  catalogUrlTemplate?: string;
  chapterUrlTemplate?: string;
  selectorJson: string;
  testUrl?: string;
  remark?: string;
}

export interface ReaderSourceTask extends BaseEntity {
  id: string | number;
  taskName: string;
  siteId: string | number;
  ruleId: string | number;
  policyId: string | number;
  executorType: 'JAVA' | 'PYTHON' | 'GO' | string;
  sourceWorkUrl: string;
  sourceWorkTitle?: string;
  startChapterNo?: number;
  endChapterNo?: number;
  incremental: string;
  status: string;
  currentChapterNo?: number;
  plannedChapterCount?: number;
  lastRunAt?: string;
  failReason?: string;
}

export interface ReaderSourceTaskForm {
  id?: string | number;
  taskName: string;
  siteId?: string | number;
  ruleId?: string | number;
  policyId?: string | number;
  executorType: 'JAVA' | 'PYTHON' | 'GO';
  sourceWorkUrl: string;
  sourceWorkTitle?: string;
  startChapterNo?: number;
  endChapterNo?: number;
  incremental: string;
}

export interface ReaderSourceTaskRun {
  id: string | number;
  taskId: string | number;
  executorType: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  heartbeatAt?: string;
  requestCount: number;
  successCount: number;
  skippedCount: number;
  failureCount: number;
  tooManyRequestsCount: number;
  circuitOpen: string;
  errorMessage?: string;
  resultSummary?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ReaderSourceChapterSnapshot {
  id: string | number;
  taskId: string | number;
  sourceChapterId: string;
  sourceUrl: string;
  chapterNo?: number;
  chapterName?: string;
  contentHash: string;
  titleHash?: string;
  content?: string;
  snapshotStatus: string;
  capturedAt?: string;
}

export interface ReaderSourceError {
  id: string | number;
  taskId: string | number;
  runId?: string | number;
  errorType: string;
  httpStatus?: number;
  sourceUrl?: string;
  message: string;
  retryAt?: string;
  resolved: string;
  createTime?: string;
}

export interface ReaderSourceDiscoveryProvider {
  id: string | number;
  providerName: string;
  providerUrl: string;
  providerType: 'TEXT' | 'JSON' | 'RSS' | string;
  authorizationNote: string;
  pollIntervalSeconds: number;
  requestIntervalMs: number;
  maxCandidates: number;
  status: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunStatus?: string;
  lastError?: string;
}

export interface ReaderSourceDiscoveryProviderForm {
  id?: string | number;
  providerName: string;
  providerUrl: string;
  providerType: 'TEXT' | 'JSON' | 'RSS';
  authorizationNote: string;
  pollIntervalSeconds: number;
  requestIntervalMs: number;
  maxCandidates: number;
}

export interface ReaderSourceDiscoveryBlacklist {
  id: string | number;
  matcherType: 'HOST' | 'SUFFIX' | 'URL' | string;
  matcherValue: string;
  reason: string;
  source?: string;
  status: string;
}

export interface ReaderSourceDiscoveryBlacklistForm {
  id?: string | number;
  matcherType: 'HOST' | 'SUFFIX' | 'URL';
  matcherValue: string;
  reason: string;
  source?: string;
}

export interface ReaderSourceDiscoveryCandidate {
  id: string | number;
  providerId: string | number;
  candidateUrl: string;
  candidateHost: string;
  candidateName?: string;
  discoveryStatus: string;
  blacklistStatus: string;
  robotsStatus: string;
  availabilityStatus: string;
  httpStatus?: number;
  checkMessage?: string;
  lastCheckedAt?: string;
  reviewedBy?: string | number;
  reviewedAt?: string;
  siteId?: string | number;
}

export interface ReaderSourceDiscoveryRun {
  id: string | number;
  providerId: string | number;
  runToken?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  candidateCount: number;
  blockedCount: number;
  robotsDeniedCount: number;
  availableCount: number;
  failedCount: number;
  errorMessage?: string;
}
