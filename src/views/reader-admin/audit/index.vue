<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div>
          <h3 class="m-0 text-base font-semibold">内容审核</h3>
          <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">查看审核记录并触发最小可用的审核通过动作。</p>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="作品标题" prop="workTitle">
          <el-input v-model="queryParams.workTitle" placeholder="作品标题" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="审核状态" prop="auditStatus">
          <el-select v-model="queryParams.auditStatus" placeholder="全部" clearable style="width: 160px">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
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
            <h3 class="m-0 text-base font-semibold">审核记录</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">当前共 {{ total }} 条记录。</p>
          </div>
          <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
        </div>
      </template>

      <el-table v-loading="loading" :data="auditList" border>
        <el-table-column label="审核ID" prop="id" width="100" />
        <el-table-column label="作品ID" prop="workId" width="100" />
        <el-table-column label="作品标题" prop="workTitle" min-width="220" show-overflow-tooltip />
        <el-table-column label="审核状态" prop="auditStatus" width="140">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)">{{ row.auditStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" prop="auditComment" min-width="220" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" min-width="180" />
        <el-table-column label="操作" fixed="right" width="120" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="row.auditStatus === 'APPROVED'"
              @click="handleApprove(row as ReaderAuditRecordVO)"
            >
              通过
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
// 阅读器管理端审核页，负责待审记录查询与审核操作。
// 表单实例类型用于筛选条件重置。
import type { FormInstance } from 'element-plus';
// 审核列表与审核通过动作统一复用后台 API 封装。
import { approveReaderAudit, listReaderAuditRecords } from '@/api/reader/admin';
// 审核查询参数与列表结构使用共享类型，避免页面写死状态字段。
import type { ReaderAuditRecordQuery, ReaderAuditRecordVO } from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminAuditPage' });

const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const auditList = ref<ReaderAuditRecordVO[]>([]);
const queryParams = reactive<ReaderAuditRecordQuery>({
  pageNum: 1,
  pageSize: 10,
  auditStatus: undefined,
  workTitle: undefined
});

// 把审核状态转换成标签颜色，方便列表里快速区分待审与已处理记录。
const getAuditStatusType = (status?: string) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'info';
};

// 拉取待审记录列表，并同步总数给分页组件使用。
const getList = async () => {
  loading.value = true;
  try {
    const { data } = await listReaderAuditRecords({ ...queryParams });
    auditList.value = data?.rows ?? [];
    total.value = Number(data?.total ?? 0);
  } finally {
    loading.value = false;
  }
};

// 执行筛选查询时回到第一页，避免历史页码影响结果展示。
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

// 重置审核筛选项后恢复默认待审列表。
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  getList();
};

// 审核通过后刷新列表，确保当前记录状态及时从待审切到已通过。
const handleApprove = async (row: ReaderAuditRecordVO) => {
  await ElMessageBox.confirm(`确认通过审核记录 #${row.id} 吗？`, '提示', { type: 'warning' });
  await approveReaderAudit(row.id);
  ElMessage.success('审核已通过');
  getList();
};

// 页面初始化时拉取一次待审记录，方便运营直接进入审核工作台。
onMounted(() => {
  getList();
});
</script>
