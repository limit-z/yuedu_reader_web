<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div>
          <h3 class="m-0 text-base font-semibold">反馈工单</h3>
          <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">
            承接小程序“意见反馈”的后台处理闭环，支持筛选、状态流转和管理员回复。
          </p>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="queryParams.keyword" placeholder="昵称 / 手机号 / 微信号 / 内容" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="反馈类型" prop="feedbackType">
          <el-select v-model="queryParams.feedbackType" placeholder="全部" clearable style="width: 180px">
            <el-option label="功能异常" value="功能异常" />
            <el-option label="内容问题" value="内容问题" />
            <el-option label="体验建议" value="体验建议" />
            <el-option label="账号问题" value="账号问题" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 160px">
            <el-option label="待处理" value="PENDING" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已回复" value="REPLIED" />
            <el-option label="已完成" value="DONE" />
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
            <h3 class="m-0 text-base font-semibold">工单列表</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">当前共 {{ total }} 条反馈记录。</p>
          </div>
          <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          <el-dropdown @command="handleBatchStatus"><el-button :disabled="!selectedFeedback.length">批量改状态<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button><template #dropdown><el-dropdown-menu><el-dropdown-item command="PENDING">批量待处理</el-dropdown-item><el-dropdown-item command="PROCESSING">批量处理中</el-dropdown-item><el-dropdown-item command="REPLIED">批量已回复</el-dropdown-item><el-dropdown-item command="DONE">批量已完成</el-dropdown-item></el-dropdown-menu></template></el-dropdown>
        </div>
      </template>

      <el-table v-loading="loading" :data="feedbackList" border @selection-change="value => selectedFeedback = value">
        <el-table-column type="selection" width="48" />
        <el-table-column label="反馈ID" prop="feedbackId" width="100" />
        <el-table-column label="身份" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.accountType === 'USER' ? 'success' : 'info'">{{ row.accountType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="昵称" prop="nickName" min-width="120" />
        <el-table-column label="反馈类型" prop="feedbackType" min-width="120" />
        <el-table-column label="联系方式" min-width="220">
          <template #default="{ row }">
            <div class="feedback-contact">
              <span>{{ row.contactMobile || '未填写手机号' }}</span>
              <span>{{ row.contactWechat || '未填写微信号' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="反馈内容" prop="feedbackContent" min-width="280" show-overflow-tooltip />
        <el-table-column label="处理状态" prop="status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回复摘要" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.replyContent || '暂未回复' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" prop="createTime" min-width="180" />
        <el-table-column label="操作" fixed="right" width="220" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleReply(row as ReaderFeedbackAdminVO)">回复</el-button>
            <el-dropdown @command="command => handleStatusChange(row as ReaderFeedbackAdminVO, String(command))">
              <el-button link type="warning">
                改状态
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="PENDING">待处理</el-dropdown-item>
                  <el-dropdown-item command="PROCESSING">处理中</el-dropdown-item>
                  <el-dropdown-item command="REPLIED">已回复</el-dropdown-item>
                  <el-dropdown-item command="DONE">已完成</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <el-dialog v-model="replyDialogVisible" title="回复反馈" width="620px" append-to-body>
      <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules" label-width="90px">
        <el-form-item label="反馈类型">
          <el-input :model-value="currentFeedback?.feedbackType || '--'" disabled />
        </el-form-item>
        <el-form-item label="反馈内容">
          <el-input :model-value="currentFeedback?.feedbackContent || '--'" type="textarea" :rows="4" disabled />
        </el-form-item>
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="replyForm.status" placeholder="请选择状态" style="width: 220px">
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已回复" value="REPLIED" />
            <el-option label="已完成" value="DONE" />
          </el-select>
        </el-form-item>
        <el-form-item label="回复内容" prop="replyContent">
          <el-input v-model="replyForm.replyContent" type="textarea" :rows="5" placeholder="请输入管理员回复内容" maxlength="1000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelReply">取 消</el-button>
          <el-button type="primary" :loading="replySubmitting" @click="submitReply">提 交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 阅读器反馈管理页，负责承接后台对用户反馈工单的筛选、回复和状态流转。
// 表单实例类型用于查询表单与回复弹窗表单的校验调用。
import type { FormInstance, FormRules } from 'element-plus';
// 反馈工单接口统一从阅读器后台 API 模块引入，保证页面和后端契约一致。
import { batchUpdateReaderFeedbackStatus, listReaderFeedback, replyReaderFeedback, updateReaderFeedbackStatus } from '@/api/reader/admin';
// 反馈工单相关类型统一走共享定义，避免页面硬编码字段结构。
import type {
  ReaderFeedbackAdminQuery,
  ReaderFeedbackAdminVO,
  ReaderFeedbackReplyForm
} from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminFeedbackPage' });

const queryFormRef = ref<FormInstance>();
const replyFormRef = ref<FormInstance>();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const feedbackList = ref<ReaderFeedbackAdminVO[]>([]);
const selectedFeedback = ref<ReaderFeedbackAdminVO[]>([]);
const replyDialogVisible = ref(false);
const replySubmitting = ref(false);
const currentFeedback = ref<ReaderFeedbackAdminVO>();
const queryParams = reactive<ReaderFeedbackAdminQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  feedbackType: undefined,
  status: undefined
});
const replyForm = reactive<ReaderFeedbackReplyForm>({
  replyContent: '',
  status: 'REPLIED'
});
const replyRules: FormRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  replyContent: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
};

// 把工单状态转换成标签颜色，方便运营快速识别当前处理进度。
const getStatusType = (status?: string) => {
  if (status === 'DONE') return 'success';
  if (status === 'REPLIED') return 'primary';
  if (status === 'PROCESSING') return 'warning';
  if (status === 'PENDING') return 'info';
  return 'info';
};

// 拉取反馈工单列表，并同步分页总数供表格和分页组件复用。
const getList = async () => {
  loading.value = true;
  try {
    const { data } = await listReaderFeedback({ ...queryParams });
    feedbackList.value = data?.rows ?? [];
    total.value = Number(data?.total ?? 0);
  } finally {
    loading.value = false;
  }
};

// 执行筛选查询前先回到第一页，避免历史页码影响结果回显。
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

// 重置筛选表单，恢复默认列表视图。
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  getList();
};

// 打开回复弹窗前，先把当前工单和回复表单上下文同步好。
const handleReply = (row: ReaderFeedbackAdminVO) => {
  currentFeedback.value = row;
  replyForm.status = row.status === 'DONE' ? 'DONE' : row.status === 'PROCESSING' ? 'PROCESSING' : 'REPLIED';
  replyForm.replyContent = row.replyContent || '';
  replyDialogVisible.value = true;
};

// 关闭回复弹窗时清理表单状态，避免上一条工单的回复残留到下一条。
const handleCancelReply = () => {
  replyDialogVisible.value = false;
  currentFeedback.value = undefined;
  replyForm.replyContent = '';
  replyForm.status = 'REPLIED';
  replyFormRef.value?.clearValidate();
};

// 提交管理员回复后刷新列表，确保工单状态和回复摘要及时回写。
const submitReply = async () => {
  if (!currentFeedback.value) {
    return;
  }
  const valid = await replyFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  replySubmitting.value = true;
  try {
    await replyReaderFeedback(currentFeedback.value.feedbackId, { ...replyForm });
    ElMessage.success('反馈回复已提交');
    handleCancelReply();
    getList();
  } finally {
    replySubmitting.value = false;
  }
};

// 允许运营在不打开回复弹窗的情况下快速切换工单状态，方便清理与归档。
const handleStatusChange = async (row: ReaderFeedbackAdminVO, status: string) => {
  await updateReaderFeedbackStatus(row.feedbackId, { status });
  ElMessage.success(`工单状态已更新为 ${status}`);
  getList();
};

const handleBatchStatus = async (status: string) => {
  if (!selectedFeedback.value.length) return ElMessage.warning('请先选择反馈工单');
  await ElMessageBox.confirm(`确认批量更新 ${selectedFeedback.value.length} 条工单状态吗？`, '批量操作确认', { type: 'warning' });
  const { data } = await batchUpdateReaderFeedbackStatus(selectedFeedback.value.map(row => row.feedbackId), status);
  ElMessage.success(`批量更新完成，成功 ${data?.successCount ?? 0} 条，失败 ${data?.failureCount ?? 0} 条`);
  await getList();
  selectedFeedback.value = [];
};

// 页面初始化时先拉一次反馈工单列表，方便后台直接进入处理工作台。
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.feedback-contact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.4;
}
</style>
