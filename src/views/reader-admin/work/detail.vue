<template>
  <div class="p-2 app-container reader-work-detail-page">
    <el-page-header class="mb-4" @back="router.back()">
      <template #content>
        <span class="text-base font-semibold">作品详情</span>
      </template>
    </el-page-header>

    <el-row :gutter="16" v-loading="loading">
      <el-col :xs="24" :lg="9">
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="m-0 text-base font-semibold">{{ detail?.title || '作品详情' }}</h3>
                <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  导入后的作品信息、状态和章节规模都在这里查看。
                </p>
              </div>
              <el-tag :type="getPublishStatusType(detail?.publishStatus)">{{ detail?.publishStatus || '--' }}</el-tag>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="作品ID">{{ detail?.id || '--' }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ detail?.workType || '--' }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ detail?.sourceType || '--' }}</el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="getAuditStatusType(detail?.auditStatus)">{{ detail?.auditStatus || '未提交' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="连载状态">{{ detail?.serialStatus || '--' }}</el-descriptions-item>
            <el-descriptions-item label="章节数">{{ detail?.totalChapters ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="页数">{{ detail?.totalPages ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="搜索可见">{{ detail?.allowSearch === '1' ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ detail?.updateTime || '--' }}</el-descriptions-item>
          </el-descriptions>

          <div class="mt-4 reader-work-detail__actions">
            <el-button
              type="success"
              :disabled="detail?.publishStatus === 'PUBLISHED' || detail?.auditStatus !== 'APPROVED'"
              @click="handlePublish"
            >
              上架作品
            </el-button>
            <el-button type="danger" plain :disabled="detail?.publishStatus === 'OFFLINE'" @click="handleOffline">下架作品</el-button>
          </div>

          <div v-if="detail?.auditStatus !== 'APPROVED'" class="mt-3 reader-work-detail__audit-warning">
            当前作品最新审核状态为 {{ detail?.auditStatus || '未提交' }}，未审核通过前禁止上架。
          </div>

          <div class="mt-4">
            <div class="text-sm font-medium mb-2">作品简介</div>
            <div class="reader-work-detail__intro">{{ detail?.intro || '暂无简介' }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="15">
        <div class="reader-work-detail__main">
        <el-card shadow="hover" class="reader-work-detail__catalog-card">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="m-0 text-base font-semibold">章节目录</h3>
                <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  当前导入后的章节结构。点击任一章节即可预览正文或图片。
                </p>
              </div>
              <div class="reader-work-detail__catalog-toolbar">
                <span class="reader-work-detail__catalog-count">共 {{ catalog.length }} 章</span>
                <el-button text @click="loadData">刷新</el-button>
              </div>
            </div>
          </template>

          <el-table
            :data="catalog"
            border
            highlight-current-row
            row-key="chapterId"
            height="360"
            :row-class-name="({ row }) => (String(row.chapterId) === String(activeChapterId) ? 'is-active-row' : '')"
            @row-click="handleSelectChapter"
          >
            <el-table-column label="章节ID" prop="chapterId" width="110" />
            <el-table-column label="序号" prop="chapterNo" width="90" />
            <el-table-column label="章节名" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="reader-work-detail__chapter-cell">
                  <span class="reader-work-detail__chapter-name">{{ row.chapterName }}</span>
                  <span v-if="row.volumeName" class="reader-work-detail__chapter-volume">{{ row.volumeName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="字数/页数" min-width="120">
              <template #default="{ row }">
                {{ row.wordCount || row.pageCount || 0 }}{{ detail?.workType === 'COMIC' ? ' 页' : ' 字' }}
              </template>
            </el-table-column>
            <el-table-column label="章节状态" prop="publishStatus" width="140">
              <template #default="{ row }">
                <el-tag :type="getPublishStatusType(row.publishStatus)">{{ row.publishStatus || '--' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card ref="previewCardRef" shadow="hover" class="reader-work-detail__preview-card">
          <template #header>
            <div class="reader-work-detail__preview-header">
              <div>
                <h3 class="m-0 text-base font-semibold">章节预览</h3>
                <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  当前为管理端预览，不受 app 侧 `PUBLISHED` 过滤限制。
                </p>
              </div>
              <div class="reader-work-detail__preview-toolbar">
                <span class="reader-work-detail__preview-title">{{ previewTitle }}</span>
                <el-button link :disabled="!hasPreviousChapter" @click="selectAdjacentChapter(-1)">上一章</el-button>
                <el-button link :disabled="!hasNextChapter" @click="selectAdjacentChapter(1)">下一章</el-button>
                <el-button type="primary" plain :disabled="!activeChapterId" @click="previewDrawerVisible = true">
                  沉浸预览
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="previewLoading" class="reader-work-detail__empty">章节内容加载中...</div>
          <div v-else-if="!activeChapterId" class="reader-work-detail__empty">请选择一条章节查看详情。</div>

          <template v-else>
            <div class="reader-work-detail__chapter-summary">
              <span>章节ID：{{ activeChapterId }}</span>
              <span v-if="selectedCatalog?.chapterNo">序号：{{ selectedCatalog.chapterNo }}</span>
              <span v-if="detail?.workType === 'COMIC'">页数：{{ comicPreview?.pageCount || selectedCatalog?.pageCount || 0 }} 页</span>
              <span v-else>字数：{{ novelPreview?.wordCount || selectedCatalog?.wordCount || 0 }} 字</span>
              <span>状态：{{ selectedCatalog?.publishStatus || '--' }}</span>
            </div>
            <component :is="detail?.workType === 'COMIC' ? 'div' : 'section'">
              <template v-if="detail?.workType === 'COMIC'">
                <div class="reader-work-detail__comic-grid reader-work-detail__comic-grid--inline">
                  <div
                    v-for="(url, index) in comicPreview?.imageUrls || []"
                    :key="`${url}-${index}`"
                    class="reader-work-detail__comic-item"
                  >
                    <div class="reader-work-detail__comic-index">第 {{ index + 1 }} 页</div>
                    <img :src="url" class="reader-work-detail__comic-image" alt="comic-page" />
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="reader-work-detail__novel-meta">
                  当前选中章节会在这里常驻展示，目录再长也不会把正文挤到页面外。
                </div>
                <pre class="reader-work-detail__novel-content">{{ novelPreview?.content || '暂无正文内容' }}</pre>
              </template>
            </component>
          </template>
        </el-card>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb-4 reader-work-detail__cover-card">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="m-0 text-base font-semibold">封面采集</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">章节全部完成后异步执行，图片保留来源地址供追溯。</p>
          </div>
          <div class="flex items-center gap-2">
            <el-tag v-if="coverTask" :type="coverTaskStatusType(coverTask.status)">{{ coverTask.status }}</el-tag>
            <el-button v-if="coverTask" text :loading="coverLoading" @click="loadCoverCrawl">刷新</el-button>
            <el-button v-if="coverTask?.status === 'FAILED'" type="primary" plain @click="retryCoverCrawl">重新采集</el-button>
          </div>
        </div>
      </template>

      <template v-if="coverTask">
        <el-progress :percentage="coverTask.progressPercent || 0" :status="coverTask.status === 'FAILED' ? 'exception' : undefined" />
        <div class="reader-work-detail__cover-summary">
          <span>竖版 {{ coverTask.portraitSuccessCount }}/{{ coverTask.portraitTargetCount }}</span>
          <span>横版 {{ coverTask.landscapeSuccessCount }}/{{ coverTask.landscapeTargetCount }}</span>
          <span v-if="coverTask.currentProvider">当前来源：{{ coverTask.currentProvider }}</span>
          <span v-if="coverTask.finishedAt">完成时间：{{ coverTask.finishedAt }}</span>
        </div>
        <el-alert v-if="coverTask.lastError" class="mb-3" type="warning" :closable="false" :title="coverTask.lastError" />
        <div class="reader-work-detail__cover-grid">
          <div v-for="candidate in coverTask.candidates" :key="candidate.id" class="reader-work-detail__cover-candidate">
            <img :src="resolveReaderAssetUrl(candidate.storedImageUrl)" :alt="`${candidate.orientation}-${candidate.id}`" />
            <div class="reader-work-detail__cover-candidate-meta">
              <strong>{{ candidate.orientation === 'PORTRAIT' ? '竖版' : '横版' }} · {{ candidate.sourceProvider }}</strong>
              <a v-if="candidate.sourcePageUrl" :href="candidate.sourcePageUrl" target="_blank" rel="noreferrer">查看来源页</a>
              <span>{{ candidate.capturedAt || '--' }}</span>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="reader-work-detail__empty">章节采集完成后会自动创建封面采集任务。</div>
    </el-card>

    <el-drawer
      v-model="previewDrawerVisible"
      :title="previewTitle"
      size="70%"
      destroy-on-close
      class="reader-work-detail__drawer"
    >
      <div class="reader-work-detail__drawer-toolbar">
        <el-button link :disabled="!hasPreviousChapter" @click="selectAdjacentChapter(-1)">上一章</el-button>
        <el-button link :disabled="!hasNextChapter" @click="selectAdjacentChapter(1)">下一章</el-button>
        <span class="reader-work-detail__drawer-meta">
          {{ detail?.workType === 'COMIC' ? `共 ${comicPreview?.imageUrls?.length || 0} 页` : `共 ${novelPreview?.wordCount || 0} 字` }}
        </span>
      </div>

      <template v-if="detail?.workType === 'COMIC'">
        <div class="reader-work-detail__comic-grid">
          <div v-for="(url, index) in comicPreview?.imageUrls || []" :key="`${url}-${index}`" class="reader-work-detail__comic-item">
            <div class="reader-work-detail__comic-index">第 {{ index + 1 }} 页</div>
            <img :src="url" class="reader-work-detail__comic-image" alt="comic-page" />
          </div>
        </div>
      </template>

      <template v-else>
        <pre class="reader-work-detail__novel-content reader-work-detail__novel-content--drawer">
{{ novelPreview?.content || '暂无正文内容' }}
        </pre>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
// 阅读器管理端作品详情页，承接目录预览、正文预览与上下架联动。
// 详情页需要同时读取详情、目录、预览和上下架动作，所以集中引入后台作品相关接口。
import {
  getReaderCoverCrawlTask,
  getReaderComicChapterPreview,
  getReaderNovelChapterPreview,
  getReaderWorkDetail,
  listReaderWorkCatalog,
  offlineReaderWork,
  publishReaderWork,
  retryReaderCoverCrawl
} from '@/api/reader/admin';
// 目录、详情和章节预览类型来自共享契约，保证小说/漫画预览切换时字段可控。
import type {
  ReaderCatalogAdminVO,
  ReaderComicChapterAdminVO,
  ReaderNovelChapterAdminVO,
  ReaderWorkDetailAdminVO,
  ReaderCoverCrawlTaskAdminVO
} from '@/api/reader/admin/types';
import { resolveReaderAssetUrl } from '@/utils/readerAsset';

defineOptions({ name: 'ReaderAdminWorkDetailPage' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const previewLoading = ref(false);
const detail = ref<ReaderWorkDetailAdminVO>();
const catalog = ref<ReaderCatalogAdminVO[]>([]);
const activeChapterId = ref<string | number>();
const novelPreview = ref<ReaderNovelChapterAdminVO>();
const comicPreview = ref<ReaderComicChapterAdminVO>();
const previewDrawerVisible = ref(false);
const previewCardRef = ref();
const coverTask = ref<ReaderCoverCrawlTaskAdminVO>();
const coverLoading = ref(false);
let coverPollTimer: ReturnType<typeof window.setInterval> | undefined;

const workId = computed(() => route.params.workId as string);
const activeChapterIndex = computed(() =>
  catalog.value.findIndex(item => String(item.chapterId) === String(activeChapterId.value))
);
const selectedCatalog = computed(() => {
  if (activeChapterIndex.value < 0) {
    return undefined;
  }
  return catalog.value[activeChapterIndex.value];
});
const previewTitle = computed(() => {
  if (!activeChapterId.value) {
    return '未选择章节';
  }
  return selectedCatalog.value?.chapterName || `章节 ${activeChapterId.value}`;
});
const hasPreviousChapter = computed(() => activeChapterIndex.value > 0);
const hasNextChapter = computed(() => activeChapterIndex.value > -1 && activeChapterIndex.value < catalog.value.length - 1);

const coverTaskStatusType = (status?: string) => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'RUNNING') return 'warning';
  return 'info';
};

const loadCoverCrawl = async () => {
  coverLoading.value = true;
  try {
    coverTask.value = (await getReaderCoverCrawlTask(workId.value)).data;
  } finally {
    coverLoading.value = false;
  }
};

const retryCoverCrawl = async () => {
  await retryReaderCoverCrawl(workId.value);
  ElMessage.success('封面采集已重新排队');
  await loadCoverCrawl();
};

// 把发布状态转换为标签颜色，便于详情区快速识别当前可见状态。
const getPublishStatusType = (status?: string) => {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'OFFLINE') return 'danger';
  if (status === 'PENDING_REVIEW') return 'warning';
  return 'info';
};

// 管理端把审核状态单独展示出来，帮助运营理解上架门禁来自审核而不是发布状态本身。
const getAuditStatusType = (status?: string) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'info';
};

// 按当前作品类型加载对应章节预览，驱动右侧正文预览面板切换。
const loadPreview = async (chapterId: string | number) => {
  if (!detail.value) {
    return;
  }
  // 详情页会根据作品类型切换不同的章节预览接口，确保小说和漫画共用一套页面骨架。
  previewLoading.value = true;
  activeChapterId.value = chapterId;
  try {
    if (detail.value.workType === 'COMIC') {
      comicPreview.value = (await getReaderComicChapterPreview(chapterId)).data;
      novelPreview.value = undefined;
    } else {
      novelPreview.value = (await getReaderNovelChapterPreview(chapterId)).data;
      comicPreview.value = undefined;
    }
  } finally {
    previewLoading.value = false;
  }
  // 预览切换后同步到路由参数，便于刷新页面时保留当前定位的章节。
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      chapterId: String(chapterId)
    }
  });
};

// 详情页同时拉取作品详情与目录，并在首次进入时默认预览首章内容。
const loadData = async () => {
  loading.value = true;
  try {
    const [detailRes, catalogRes, coverRes] = await Promise.all([
      getReaderWorkDetail(workId.value),
      listReaderWorkCatalog(workId.value),
      getReaderCoverCrawlTask(workId.value)
    ]);
    detail.value = detailRes.data;
    catalog.value = catalogRes.data || [];
    coverTask.value = coverRes.data;
    // 首次进入详情页时优先恢复路由里的章节定位，其次沿用当前选中章节，最后才回落到首章。
    const routeChapterId = route.query.chapterId as string | undefined;
    const nextChapterId = routeChapterId || activeChapterId.value || catalog.value[0]?.chapterId;
    if (nextChapterId) {
      await loadPreview(nextChapterId);
    }
  } finally {
    loading.value = false;
  }
};

// 点击目录行后切换右侧预览内容，保持单页内完成内容核查。
const handleSelectChapter = async (row: ReaderCatalogAdminVO) => {
  await loadPreview(row.chapterId);
};

// 允许在预览区直接切换前后章节，减少回到目录区重新点选的成本。
const selectAdjacentChapter = async (offset: -1 | 1) => {
  const nextIndex = activeChapterIndex.value + offset;
  const nextChapter = catalog.value[nextIndex];
  if (!nextChapter) {
    return;
  }
  await loadPreview(nextChapter.chapterId);
};

// 在详情页执行上架动作，并重新刷新详情、目录和预览状态。
const handlePublish = async () => {
  if (!detail.value) {
    return;
  }
  if (detail.value.auditStatus !== 'APPROVED') {
    ElMessage.warning('作品未审核通过，禁止上架');
    return;
  }
  // 上架后会重新拉取详情和目录，确保作品状态、章节状态与预览内容全部同步刷新。
  await ElMessageBox.confirm(`确认上架作品《${detail.value.title}》吗？`, '提示', { type: 'warning' });
  await publishReaderWork(detail.value.id);
  ElMessage.success('作品及章节已上架');
  await loadData();
};

// 在详情页执行下架动作，并同步刷新当前页全部状态回显。
const handleOffline = async () => {
  if (!detail.value) {
    return;
  }
  // 下架后的刷新逻辑与上架保持一致，避免页面仍显示旧的可读状态。
  await ElMessageBox.confirm(`确认下架作品《${detail.value.title}》吗？`, '提示', { type: 'warning' });
  await offlineReaderWork(detail.value.id);
  ElMessage.success('作品及章节已下架');
  await loadData();
};

// 进入详情页后立即拉取当前作品的详情、目录和首章预览。
onMounted(() => {
  loadData();
  coverPollTimer = window.setInterval(() => {
    if (coverTask.value?.status === 'PENDING' || coverTask.value?.status === 'RUNNING') loadCoverCrawl();
  }, 10000);
});

onUnmounted(() => {
  if (coverPollTimer) window.clearInterval(coverPollTimer);
});
</script>

<style scoped lang="scss">
.reader-work-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.reader-work-detail__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reader-work-detail__catalog-card,
.reader-work-detail__preview-card,
.reader-work-detail__cover-card {
  margin-bottom: 0;
}

.reader-work-detail__cover-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin: 12px 0 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.reader-work-detail__cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.reader-work-detail__cover-candidate {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.reader-work-detail__cover-candidate img {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: contain;
  background: #f8f5ef;
}

.reader-work-detail__cover-candidate-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  font-size: 12px;
}

.reader-work-detail__catalog-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reader-work-detail__catalog-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.reader-work-detail__intro {
  color: var(--el-text-color-regular);
  line-height: 1.8;
  white-space: pre-wrap;
}

.reader-work-detail__audit-warning {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff7e8;
  color: #b26a00;
  font-size: 13px;
  line-height: 1.6;
}

.reader-work-detail__empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.reader-work-detail__novel-meta {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.reader-work-detail__chapter-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7f8fb;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.reader-work-detail__preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.reader-work-detail__preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.reader-work-detail__preview-title {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.reader-work-detail__novel-content {
  margin: 0;
  min-height: 320px;
  max-height: 480px;
  overflow: auto;
  padding: 16px;
  border-radius: 12px;
  background: #f8f5ef;
  color: #3b2f24;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
}

.reader-work-detail__novel-content--drawer {
  min-height: auto;
  max-height: calc(100vh - 180px);
}

.reader-work-detail__comic-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reader-work-detail__comic-grid--inline {
  max-height: 520px;
  overflow: auto;
  padding-right: 4px;
}

.reader-work-detail__comic-item {
  padding: 14px;
  border-radius: 12px;
  background: #faf7f2;
}

.reader-work-detail__comic-index {
  margin-bottom: 12px;
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.reader-work-detail__comic-image {
  width: 100%;
  border-radius: 10px;
  background: #f0ede7;
}

.reader-work-detail__chapter-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reader-work-detail__chapter-name {
  color: var(--el-text-color-primary);
}

.reader-work-detail__chapter-volume {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.reader-work-detail__drawer-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reader-work-detail__drawer-meta {
  margin-left: auto;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@media (max-width: 992px) {
  .reader-work-detail__preview-header {
    flex-direction: column;
  }

  .reader-work-detail__preview-toolbar {
    justify-content: flex-start;
  }

  .reader-work-detail__novel-content {
    max-height: 360px;
  }
}
</style>
