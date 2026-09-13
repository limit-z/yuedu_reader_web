<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="m-0 text-base font-semibold">作品管理</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">
              对接 `ruoyi-reader` 作品列表、上架和下架动作，作为 P0 联调入口。
            </p>
          </div>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="queryParams.keyword" placeholder="标题关键词" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="作品类型" prop="workType">
          <el-select v-model="queryParams.workType" placeholder="全部" clearable style="width: 140px">
            <el-option label="小说" value="NOVEL" />
            <el-option label="漫画" value="COMIC" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布状态" prop="publishStatus">
          <el-select v-model="queryParams.publishStatus" placeholder="全部" clearable style="width: 160px">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="待审核" value="PENDING_REVIEW" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已下架" value="OFFLINE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="m-0 text-base font-semibold">作品列表</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">当前共 {{ total }} 条记录。</p>
          </div>
          <div class="flex items-center gap-2">
            <el-button type="primary" plain icon="Picture" @click="openGlobalCoverDialog">全局封面配置</el-button>
            <el-button :disabled="!selectedWorks.length" @click="batchWorkStatus('publish')">批量上架</el-button>
            <el-button type="danger" plain :disabled="!selectedWorks.length" @click="batchWorkStatus('offline')">批量下架</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="workList" border @selection-change="value => selectedWorks = value">
        <el-table-column type="selection" width="48" />
        <el-table-column label="ID" prop="id" width="90" />
        <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip />
        <el-table-column label="类型" prop="workType" width="100">
          <template #default="{ row }">{{ workTypeLabel(row.workType) }}</template>
        </el-table-column>
        <el-table-column label="分类" prop="categoryName" width="120" show-overflow-tooltip />
        <el-table-column label="状态" prop="publishStatus" width="140">
          <template #default="{ row }">
            <el-tag :type="getPublishStatusType(row.publishStatus)">{{ row.publishStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" prop="auditStatus" width="140">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)">{{ row.auditStatus || '未提交' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" prop="sourceType" width="120" />
        <el-table-column label="章节数" prop="totalChapters" width="100" />
        <el-table-column label="页数" prop="totalPages" width="100" />
        <el-table-column label="更新时间" prop="updateTime" min-width="180" />
        <el-table-column label="操作" fixed="right" width="290" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row as ReaderWorkAdminVO)">详情</el-button>
            <el-button link type="primary" @click="openWorkCoverDialog(row as ReaderWorkAdminVO)">封面设置</el-button>
            <el-button
              v-if="row.publishStatus !== 'PUBLISHED' && row.auditStatus === 'APPROVED'"
              link
              type="success"
              @click="handlePublish(row as ReaderWorkAdminVO)"
            >
              上架
            </el-button>
            <el-button
              v-if="row.publishStatus === 'PUBLISHED'"
              link
              type="danger"
              @click="handleOffline(row as ReaderWorkAdminVO)"
            >
              下架
            </el-button>
            <el-tag
              v-if="row.publishStatus !== 'PUBLISHED' && row.auditStatus !== 'APPROVED'"
              type="warning"
              effect="plain"
            >
              审核后上架
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog
      v-model="coverDialog.visible"
      :title="coverDialog.scope === 'GLOBAL' ? '全局自动封面配置' : `《${coverDialog.workTitle}》封面设置`"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form label-width="96px">
        <el-form-item label="背景来源">
          <el-radio-group v-model="coverForm.mode" @change="handleCoverModeChange">
            <el-radio-button v-if="coverDialog.scope === 'WORK'" value="GLOBAL">继承全局</el-radio-button>
            <el-radio-button value="COLOR">背景色</el-radio-button>
            <el-radio-button value="IMAGE">背景图片</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="coverForm.mode === 'COLOR'">
          <el-form-item label="内置浅色">
            <div class="cover-preset-grid">
              <button
                v-for="preset in coverPresets"
                :key="preset.key"
                type="button"
                class="cover-preset"
                :class="{ 'is-active': coverForm.color === preset.color }"
                @click="coverForm.color = preset.color"
              >
                <span class="cover-preset__swatch" :style="{ backgroundColor: preset.color }" />
                <span>{{ preset.name }}</span>
              </button>
            </div>
          </el-form-item>
          <el-form-item label="自定义颜色">
            <el-color-picker v-model="coverForm.color" />
            <el-input v-model="coverForm.color" class="ml-3" style="width: 150px" placeholder="#FFF4F2" />
          </el-form-item>
        </template>

        <el-form-item v-if="coverForm.mode === 'IMAGE'" label="背景图片">
          <image-upload
            :model-value="coverForm.backgroundOssId == null ? '' : String(coverForm.backgroundOssId)"
            @update:model-value="coverForm.backgroundOssId = $event"
            :limit="1"
            :file-size="10"
            :file-type="['png', 'jpg', 'jpeg', 'webp']"
            :is-show-tip="false"
            :oss-ext="{ bizType: 'reader-cover-background', source: 'reader-admin' }"
          />
        </el-form-item>

        <el-alert
          v-if="coverDialog.scope === 'WORK' && coverForm.mode === 'GLOBAL'"
          type="info"
          :closable="false"
          title="该作品会继承全局背景配置，并立即重新生成横版和竖版封面。"
        />
        <el-alert
          v-else
          type="info"
          :closable="false"
          title="保存后会重新生成受此配置影响的横版和竖版封面。"
        />
        <div v-if="coverDialog.scope === 'WORK'" class="cover-crawl-preview">
          <div class="cover-crawl-preview__header">
            <span>已采集候选封面</span>
            <el-tag v-if="coverCrawlStatus" size="small">{{ coverCrawlStatus }}</el-tag>
          </div>
          <div v-if="coverCandidates.length" class="cover-crawl-preview__grid">
            <div v-for="candidate in coverCandidates" :key="candidate.id" class="cover-crawl-preview__item">
              <img :src="resolveReaderAssetUrl(candidate.storedImageUrl)" :alt="candidate.orientation" />
              <span>{{ candidate.orientation === 'PORTRAIT' ? '竖版' : '横版' }} · {{ candidate.sourceProvider }}</span>
              <a v-if="candidate.sourcePageUrl" :href="candidate.sourcePageUrl" target="_blank" rel="noreferrer">来源</a>
            </div>
          </div>
          <span v-else class="cover-crawl-preview__empty">暂无候选图片，章节采集完成后会自动生成。</span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="coverDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="coverDialog.submitting" @click="submitCoverSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 阅读器管理端作品列表页，负责作品筛选、查看详情与上下架操作。
// 表单实例类型用于筛选栏重置和校验调用。
import type { FormInstance } from 'element-plus';
// 作品列表和上下架动作统一走阅读器后台 API，保证状态流转口径一致。
import {
  getReaderCoverCrawlTask,
  getReaderGlobalCoverStyle,
  listReaderWorks,
  offlineReaderWork,
  batchReaderWorkStatus,
  publishReaderWork,
  updateReaderGlobalCoverStyle,
  updateReaderWorkCoverStyle
} from '@/api/reader/admin';
// 列表查询参数与作品展示结构来自共享类型定义，避免页面自行约定字段。
import type {
  ReaderCoverMode,
  ReaderCoverCandidateAdminVO,
  ReaderCoverPresetVO,
  ReaderCoverStyleForm,
  ReaderWorkAdminQuery,
  ReaderWorkAdminVO
} from '@/api/reader/admin/types';
import { resolveReaderAssetUrl } from '@/utils/readerAsset';

defineOptions({ name: 'ReaderAdminWorkPage' });

const router = useRouter();
const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const workList = ref<ReaderWorkAdminVO[]>([]);
const selectedWorks = ref<ReaderWorkAdminVO[]>([]);
const coverPresets = ref<ReaderCoverPresetVO[]>([]);
const coverCandidates = ref<ReaderCoverCandidateAdminVO[]>([]);
const coverCrawlStatus = ref('');
const globalCoverStyle = ref<ReaderCoverStyleForm>();
const coverDialog = reactive({
  visible: false,
  submitting: false,
  scope: 'GLOBAL' as 'GLOBAL' | 'WORK',
  workId: undefined as string | number | undefined,
  workTitle: ''
});
const coverForm = reactive<ReaderCoverStyleForm>({
  mode: 'COLOR',
  color: '#FFF4F2',
  backgroundOssId: undefined
});
const queryParams = reactive<ReaderWorkAdminQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  workType: undefined,
  publishStatus: undefined,
  sourceType: undefined
});

const workTypeLabel = (value?: string) => (value === 'COMIC' ? '漫画' : value === 'NOVEL' ? '小说' : value || '-');

// 把作品发布状态转换成标签颜色，便于运营快速查看上架情况。
const getPublishStatusType = (status?: string) => {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'OFFLINE') return 'danger';
  if (status === 'PENDING_REVIEW') return 'warning';
  return 'info';
};

// 审核状态和发布状态分开显示，便于运营识别“未过审不能上架”的真实原因。
const getAuditStatusType = (status?: string) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'info';
};

// 按当前筛选条件拉取作品列表，供表格和分页组件统一回显。
const getList = async () => {
  loading.value = true;
  try {
    const { data } = await listReaderWorks({ ...queryParams });
    workList.value = data?.rows ?? [];
    total.value = Number(data?.total ?? 0);
  } finally {
    loading.value = false;
  }
};

// 查询前回到第一页，避免切换筛选后继续停在历史页码。
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

// 清空筛选条件并恢复默认列表视角。
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  getList();
};

// 跳转到作品详情页，进入目录预览与章节预览工作流。
const handleDetail = (row: ReaderWorkAdminVO) => {
  router.push(`/reader-admin/work/${row.id}`);
};

const loadGlobalCoverStyle = async () => {
  const { data } = await getReaderGlobalCoverStyle();
  globalCoverStyle.value = {
    mode: data.mode,
    color: data.color,
    backgroundOssId: data.backgroundOssId
  };
  coverPresets.value = data.presets ?? [];
  return data;
};

const applyCoverForm = (mode: ReaderCoverMode, color?: string, backgroundOssId?: string | number) => {
  coverForm.mode = mode;
  coverForm.color = color || '#FFF4F2';
  coverForm.backgroundOssId = backgroundOssId == null ? undefined : String(backgroundOssId);
};

const openGlobalCoverDialog = async () => {
  const style = await loadGlobalCoverStyle();
  coverDialog.scope = 'GLOBAL';
  coverDialog.workId = undefined;
  coverDialog.workTitle = '';
  coverCandidates.value = [];
  coverCrawlStatus.value = '';
  applyCoverForm(style.mode === 'GLOBAL' ? 'COLOR' : style.mode, style.color, style.backgroundOssId);
  coverDialog.visible = true;
};

const openWorkCoverDialog = async (row: ReaderWorkAdminVO) => {
  if (!globalCoverStyle.value) await loadGlobalCoverStyle();
  coverDialog.scope = 'WORK';
  coverDialog.workId = row.id;
  coverDialog.workTitle = row.title;
  applyCoverForm(row.coverBackgroundMode || 'GLOBAL', row.coverBackgroundColor, row.coverBackgroundOssId);
  const { data } = await getReaderCoverCrawlTask(row.id);
  coverCandidates.value = data?.candidates ?? [];
  coverCrawlStatus.value = data?.status || '';
  coverDialog.visible = true;
};

const handleCoverModeChange = () => {
  if (coverForm.mode === 'COLOR' && !coverForm.color) {
    coverForm.color = globalCoverStyle.value?.color || coverPresets.value[0]?.color || '#FFF4F2';
  }
};

const submitCoverSettings = async () => {
  if (coverForm.mode === 'COLOR' && !/^#[0-9a-fA-F]{6}$/.test(coverForm.color || '')) {
    ElMessage.warning('请输入 #RRGGBB 格式的背景色');
    return;
  }
  if (coverForm.mode === 'IMAGE' && !coverForm.backgroundOssId) {
    ElMessage.warning('请先上传背景图片');
    return;
  }
  const payload: ReaderCoverStyleForm = {
    mode: coverForm.mode,
    color: coverForm.mode === 'COLOR' ? coverForm.color : undefined,
    backgroundOssId: coverForm.mode === 'IMAGE' ? coverForm.backgroundOssId : undefined
  };
  coverDialog.submitting = true;
  try {
    if (coverDialog.scope === 'GLOBAL') {
      const { data } = await updateReaderGlobalCoverStyle(payload);
      ElMessage.success(`全局封面配置已保存，已重新生成 ${data ?? 0} 本作品封面`);
      globalCoverStyle.value = payload;
    } else if (coverDialog.workId != null) {
      await updateReaderWorkCoverStyle(coverDialog.workId, payload);
      ElMessage.success('作品横版和竖版封面已重新生成');
    }
    coverDialog.visible = false;
    await getList();
  } finally {
    coverDialog.submitting = false;
  }
};

// 管理端上架动作会联动作品与章节状态，因此成功后需要刷新列表状态。
const handlePublish = async (row: ReaderWorkAdminVO) => {
  if (row.auditStatus !== 'APPROVED') {
    ElMessage.warning('作品未审核通过，禁止上架');
    return;
  }
  await ElMessageBox.confirm(`确认上架作品《${row.title}》吗？`, '提示', { type: 'warning' });
  await publishReaderWork(row.id);
  ElMessage.success('作品及章节已上架');
  getList();
};

// 下架后同样刷新列表，避免表格仍显示旧的已上架状态。
const handleOffline = async (row: ReaderWorkAdminVO) => {
  await ElMessageBox.confirm(`确认下架作品《${row.title}》吗？`, '提示', { type: 'warning' });
  await offlineReaderWork(row.id);
  ElMessage.success('作品及章节已下架');
  getList();
};

const batchWorkStatus = async (action: 'publish' | 'offline') => {
  if (!selectedWorks.value.length) return ElMessage.warning('请先选择作品');
  await ElMessageBox.confirm(`确认批量${action === 'publish' ? '上架' : '下架'}选中的 ${selectedWorks.value.length} 部作品吗？`, '批量操作确认', { type: 'warning' });
  const { data } = await batchReaderWorkStatus(action, selectedWorks.value.map(row => row.id));
  ElMessage.success(`批量操作完成，成功 ${data?.successCount ?? 0} 条，失败 ${data?.failureCount ?? 0} 条`);
  await getList();
  selectedWorks.value = [];
};

// 页面初始化时先加载作品列表，作为后台运营入口的默认视图。
onMounted(() => {
  getList();
});
</script>

<style scoped>
.cover-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.cover-preset {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.cover-preset:hover,
.cover-preset.is-active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.cover-preset__swatch {
  width: 24px;
  height: 24px;
  flex: none;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 4px;
}

.cover-crawl-preview {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.cover-crawl-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
}

.cover-crawl-preview__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.cover-crawl-preview__item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.cover-crawl-preview__item img {
  width: 100%;
  height: 100px;
  object-fit: contain;
  background: #f8f5ef;
}

.cover-crawl-preview__item span,
.cover-crawl-preview__item a {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-crawl-preview__empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
