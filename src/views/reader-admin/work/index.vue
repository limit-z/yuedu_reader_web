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
          <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
        </div>
      </template>

      <el-table v-loading="loading" :data="workList" border>
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
        <el-table-column label="操作" fixed="right" width="220" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row as ReaderWorkAdminVO)">详情</el-button>
            <el-button
              link
              type="success"
              :disabled="row.publishStatus === 'PUBLISHED' || row.auditStatus !== 'APPROVED'"
              @click="handlePublish(row as ReaderWorkAdminVO)"
            >
              上架
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="row.publishStatus === 'OFFLINE'"
              @click="handleOffline(row as ReaderWorkAdminVO)"
            >
              下架
            </el-button>
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
  </div>
</template>

<script setup lang="ts">
// 阅读器管理端作品列表页，负责作品筛选、查看详情与上下架操作。
// 表单实例类型用于筛选栏重置和校验调用。
import type { FormInstance } from 'element-plus';
// 作品列表和上下架动作统一走阅读器后台 API，保证状态流转口径一致。
import { listReaderWorks, offlineReaderWork, publishReaderWork } from '@/api/reader/admin';
// 列表查询参数与作品展示结构来自共享类型定义，避免页面自行约定字段。
import type { ReaderWorkAdminQuery, ReaderWorkAdminVO } from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminWorkPage' });

const router = useRouter();
const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const workList = ref<ReaderWorkAdminVO[]>([]);
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

// 页面初始化时先加载作品列表，作为后台运营入口的默认视图。
onMounted(() => {
  getList();
});
</script>
