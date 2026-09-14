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
  /** 横版封面地址。 */
  coverLandscapeUrl?: string;
  /** 封面背景模式：GLOBAL、COLOR、IMAGE。 */
  coverBackgroundMode?: ReaderCoverMode;
  /** 作品级封面背景色。 */
  coverBackgroundColor?: string;
  /** 作品级封面背景图片 OSS ID。 */
  coverBackgroundOssId?: string | number;
  /** 自动封面缓存版本。 */
  coverRevision?: number;
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

export type ReaderCoverMode = 'GLOBAL' | 'COLOR' | 'IMAGE';

export interface ReaderCoverPresetVO {
  key: string;
  name: string;
  color: string;
}

export interface ReaderCoverStyleVO {
  mode: ReaderCoverMode;
  color?: string;
  backgroundOssId?: string | number;
  backgroundImageUrl?: string;
  presets: ReaderCoverPresetVO[];
}

export interface ReaderCoverStyleForm {
  mode: ReaderCoverMode;
  color?: string;
  backgroundOssId?: string | number;
}

export interface ReaderCoverCandidateAdminVO {
  id: string | number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  sourceProvider: string;
  sourceQuery: string;
  sourcePageUrl?: string;
  sourceImageUrl?: string;
  uploadedOssId?: string | number;
  storedImageUrl?: string;
  width?: number;
  height?: number;
  status: string;
  failureReason?: string;
  capturedAt?: string;
}

export interface ReaderCoverCrawlTaskAdminVO {
  id: string | number;
  workId: string | number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  portraitTargetCount: number;
  landscapeTargetCount: number;
  portraitSuccessCount: number;
  landscapeSuccessCount: number;
  currentProvider?: string;
  progressPercent: number;
  lastError?: string;
  startedAt?: string;
  finishedAt?: string;
  candidates: ReaderCoverCandidateAdminVO[];
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
  sourceTaskId?: string | number;
  sourceTaskBookId?: string | number;
  /** 作品标题。 */
  workTitle?: string;
  /** 审核状态。 */
  auditStatus: string;
  /** 审核意见。 */
  auditComment?: string;
}

export interface ReaderWorkCategory extends BaseEntity {
  id: string | number;
  categoryName: string;
  normalizedName: string;
  sourceType: string;
  status: string;
}

export interface ReaderRanking {
  id: string | number;
  rankingKey: string;
  rankingName: string;
  rankingDesc?: string;
  rankingMode: 'AUTO' | 'MANUAL' | string;
  sortRule: 'HOT' | 'RISING' | 'COMPLETED' | 'NEW' | 'UPDATE' | string;
  sortNo: number;
  status: string;
}

export interface ReaderRankingWork {
  id?: string | number;
  rankingId: string | number;
  workId: string | number;
  sortNo?: number;
  status?: string;
}

export interface ReaderRankingWorkOption {
  id: string | number;
  title: string;
  categoryName?: string;
  publishStatus?: string;
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
  /** 作品级背景图片的预览地址。 */
  coverBackgroundImageUrl?: string;
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

export interface ReaderUserAdminVO {
  accountId: string | number;
  nickName?: string;
  gender?: string;
  region?: string;
  status: string;
  lastClientType?: string;
  lastLoginAt?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ReaderUserAdminQuery extends PageQuery {
  keyword?: string;
  status?: string;
  lastClientType?: string;
}

export interface ReaderReadingCommentAdminVO {
  id: string | number;
  readerId: string | number;
  accountType: string;
  workId?: string | number;
  workTitle?: string;
  chapterId?: string | number;
  quoteText?: string;
  commentContent: string;
  score?: number;
  likeCount?: number;
  status: string;
  nickName?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ReaderReadingCommentAdminQuery extends PageQuery {
  keyword?: string;
  status?: string;
  workId?: string | number;
}

export interface ReaderPointsRuleAdminVO {
  storage: string;
  tasks: Array<{ key: string; title: string; points: number; condition: string }>;
  rewards: Array<{ title: string; points: number; condition: string }>;
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
  /** 采集模式：SINGLE单本、ALL全站、CATEGORY按分类。 */
  collectionMode: 'SINGLE' | 'ALL' | 'CATEGORY' | string;
  /** 按分类采集时的来源分类。 */
  categoryName?: string;
  /** 批量采集最多处理的书籍数量。 */
  bookLimit?: number;
  /** 当前采集批次号。 */
  batchNo?: string;
  /** 当前批次书籍与进度统计。 */
  totalBooks?: number;
  processedBooks?: number;
  successBooks?: number;
  skippedBooks?: number;
  failedBooks?: number;
  progressPercent?: number;
  /** 是否允许每日额度跨日自动重试。 */
  dailyRetryEnabled?: string;
  /** 因每日额度耗尽触发的累计自动重试次数。 */
  dailyRetryCount?: number;
  /** 最近一次自动重试日期与时间。 */
  lastDailyRetryDate?: string;
  lastDailyRetryAt?: string;
  /** 最近一次失败分类和自动化续采配置。 */
  failureCode?: string;
  autoRetryEnabled?: string;
  autoRetryCount?: number;
  maxAutoRetryCount?: number;
  retryAfter?: string;
  parentTaskId?: string | number;
  fallbackId?: string | number;
  fallbackSourceTaskBookId?: string | number;
  status: string;
  currentChapterNo?: number;
  plannedChapterCount?: number;
  lastRunAt?: string;
  failReason?: string;
  /** 最新运行记录及真实执行状态，仅用于管理端展示。 */
  latestRunId?: string | number;
  latestRunStatus?: string;
  latestRunClaimedAt?: string;
  executionState?: 'WAITING_WORKER' | 'COLLECTING' | 'WAITING_RATE_LIMIT' | 'WAITING_DAILY_LIMIT' | 'WAITING_MANUAL' | 'PAUSED' | string;
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
  collectionMode: 'SINGLE' | 'ALL' | 'CATEGORY';
  categoryName?: string;
  /** 批量采集最多处理的书籍数量。 */
  bookLimit?: number;
}

export interface ReaderSourceTaskBook {
  id: string | number;
  taskId: string | number;
  runId?: string | number;
  batchNo?: string;
  sourceWorkUrl: string;
  sourceWorkTitle: string;
  authorName: string;
  categoryName?: string;
  workDedupeKey: string;
  workId?: string | number;
  dedupeAction: string;
  status: string;
  localLatestChapterNo?: number;
  remoteLatestChapterNo?: number;
  plannedChapterCount?: number;
  processedChapterCount?: number;
  successChapterCount?: number;
  skippedChapterCount?: number;
  failureChapterCount?: number;
  startedAt?: string;
  finishedAt?: string;
  lastError?: string;
}

export interface ReaderSourceTaskBookSnapshot extends ReaderSourceChapterSnapshot {
  taskBookId?: string | number;
  workId?: string | number;
  runId?: string | number;
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
  retryNo?: number;
  triggerType?: string;
  triggerReason?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ReaderSourceTaskFallback {
  id?: string | number;
  taskId: string | number;
  priority: number;
  siteId: string | number;
  ruleId: string | number;
  policyId?: string | number;
  sourceUrlTemplate: string;
  autoEnabled: string;
  status: string;
  lastChildTaskId?: string | number;
}

export interface ReaderSourceTaskLog {
  id: string | number;
  taskId: string | number;
  runId?: string | number;
  taskBookId?: string | number;
  level: string;
  eventType: string;
  message: string;
  detailJson?: string;
  eventAt?: string;
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

export interface ReaderSourceDashboardCountItem {
  key: string;
  label: string;
  count: number;
}

export interface ReaderSourceDashboardSiteStat {
  siteId: string | number;
  siteName: string;
  allowedHost?: string;
  status: string;
  complianceStatus: string;
  taskCount: number;
  runningTaskCount: number;
  bookCount: number;
  successChapterCount: number;
  failedChapterCount: number;
  requestCount: number;
  runCount: number;
}

export interface ReaderSourceDashboardTrendStat {
  date: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  requestCount: number;
}

export interface ReaderSourceDashboardVO {
  generatedAt?: string;
  taskTotal: number;
  activeTaskTotal: number;
  runTotal: number;
  runningRunTotal: number;
  bookTotal: number;
  workTotal: number;
  chapterTotal: number;
  contentReadyChapterTotal: number;
  plannedChapterTotal: number;
  processedChapterTotal: number;
  successChapterTotal: number;
  skippedChapterTotal: number;
  failedChapterTotal: number;
  pendingChapterTotal: number;
  snapshotTotal: number;
  errorTotal: number;
  unresolvedErrorTotal: number;
  taskLogTotal: number;
  enabledSiteTotal: number;
  approvedSiteTotal: number;
  policyTotal: number;
  activePolicyTotal: number;
  ruleTotal: number;
  activeRuleTotal: number;
  fallbackTotal: number;
  discoveryProviderTotal: number;
  discoveryCandidateTotal: number;
  coverTaskTotal: number;
  coverCompletedTotal: number;
  coverRunningTotal: number;
  coverFailedTotal: number;
  taskStatusCounts: Record<string, number>;
  runStatusCounts: Record<string, number>;
  bookStatusCounts: Record<string, number>;
  failureCodeCounts: Record<string, number>;
  errorTypeCounts: Record<string, number>;
  executorCounts: Record<string, number>;
  triggerCounts: Record<string, number>;
  siteStats: ReaderSourceDashboardSiteStat[];
  recentTrend: ReaderSourceDashboardTrendStat[];
  recentFailures: ReaderSourceDashboardCountItem[];
}

export interface ReaderSourceDashboardWorkVO {
  workId: string | number;
  title: string;
  authorName?: string;
  categoryName?: string;
  serialStatus?: string;
  publishStatus?: string;
  taskCount: number;
  bookRecordCount: number;
  plannedChapterCount: number;
  processedChapterCount: number;
  successChapterCount: number;
  skippedChapterCount: number;
  failedChapterCount: number;
  chapterTotal: number;
  contentReadyChapterCount: number;
  contentMissingChapterCount: number;
  currentTaskId?: string | number;
  currentTaskName?: string;
  currentTaskStatus?: string;
  progressPercent: number;
  lastActivityAt?: string;
}

export interface ReaderSourceDashboardTaskVO {
  taskId: string | number;
  taskName: string;
  siteId?: string | number;
  siteName?: string;
  executorType?: string;
  status: string;
  failureCode?: string;
  failReason?: string;
  bookCount: number;
  plannedChapterCount: number;
  processedChapterCount: number;
  successChapterCount: number;
  skippedChapterCount: number;
  failedChapterCount: number;
  progressPercent: number;
  current: boolean;
  lastRunAt?: string;
  lastActivityAt?: string;
}

export interface ReaderSourceDashboardChapterVO {
  chapterId: string | number;
  workId: string | number;
  chapterNo?: number;
  volumeName?: string;
  chapterName?: string;
  wordCount?: number;
  publishStatus?: string;
  contentStatus: 'READY' | 'MISSING' | string;
  updateTime?: string;
}

export interface ReaderSourceDashboardErrorVO {
  id: string | number;
  taskId: string | number;
  runId?: string | number;
  errorType: string;
  httpStatus?: number;
  message: string;
  resolved: string;
  retryAt?: string;
  createTime?: string;
}

export interface ReaderSourceDashboardLogVO {
  id: string | number;
  taskId: string | number;
  runId?: string | number;
  taskBookId?: string | number;
  level: string;
  eventType: string;
  message: string;
  detailJson?: string;
  eventAt?: string;
}

export interface ReaderSourceDashboardWorkDetailVO {
  workId: string | number;
  title: string;
  authorName?: string;
  categoryName?: string;
  serialStatus?: string;
  publishStatus?: string;
  currentTaskId?: string | number;
  currentTaskName?: string;
  currentTaskStatus?: string;
  taskCount: number;
  bookRecordCount: number;
  chapterTotal: number;
  contentReadyChapterCount: number;
  contentMissingChapterCount: number;
  plannedChapterCount: number;
  processedChapterCount: number;
  successChapterCount: number;
  skippedChapterCount: number;
  failedChapterCount: number;
  progressPercent: number;
  taskStatusCounts: Record<string, number>;
  bookStatusCounts: Record<string, number>;
  chapterStatusCounts: Record<string, number>;
  tasks: ReaderSourceDashboardTaskVO[];
  recentErrors: ReaderSourceDashboardErrorVO[];
  recentLogs: ReaderSourceDashboardLogVO[];
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
