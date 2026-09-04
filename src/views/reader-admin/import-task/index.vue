<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="m-0 text-base font-semibold">导入任务</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">聚焦 P0 文件导入任务状态和失败原因排查。</p>
          </div>
          <el-button type="primary" icon="Upload" @click="handleCreate">创建导入任务</el-button>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="queryParams.taskName" placeholder="导入任务名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 160px">
            <el-option label="已创建" value="CREATED" />
            <el-option label="解析中" value="PARSING" />
            <el-option label="待审核" value="PENDING_REVIEW" />
            <el-option label="解析失败" value="PARSE_FAILED" />
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
            <h3 class="m-0 text-base font-semibold">任务列表</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">当前共 {{ total }} 条记录。</p>
          </div>
          <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
        </div>
      </template>

      <el-table v-loading="loading" :data="taskList" border>
        <el-table-column label="ID" prop="id" width="90" />
        <el-table-column label="任务名称" prop="taskName" min-width="220" show-overflow-tooltip />
        <el-table-column label="内容类型" prop="contentType" width="120">
          <template #default="{ row }">{{ contentTypeLabel(row.contentType) }}</template>
        </el-table-column>
        <el-table-column label="分类" prop="categoryName" width="120" show-overflow-tooltip />
        <el-table-column label="任务状态" prop="status" width="140">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="导入进度" min-width="260">
          <template #default="{ row }">
            <el-progress :percentage="Number(row.progressPercent || 0)" :stroke-width="12" />
            <div class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
              {{ row.progressMessage || '等待执行' }}
              <span v-if="row.totalUnits">（{{ row.processedUnits || 0 }}/{{ row.totalUnits }}）</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failReason" min-width="240" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" min-width="180" />
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建导入任务" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="form.taskName" placeholder="例如：三体 EPUB 导入" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容类型" prop="contentType">
          <el-radio-group v-model="form.contentType">
            <el-radio value="NOVEL">小说</el-radio>
            <el-radio value="COMIC">漫画</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容分类" prop="categoryName">
          <el-select v-model="form.categoryName" placeholder="请选择或输入分类" filterable allow-create clearable>
            <el-option v-for="category in categoryOptions" :key="category" :label="category" :value="category" />
          </el-select>
        </el-form-item>
        <el-form-item label="导入文件" prop="ossId">
          <file-upload
            v-model="uploadValue"
            :limit="1"
            :file-size="100"
            :file-type="allowedFileTypes"
            :oss-ext="{ bizType: 'reader-import', source: 'reader-admin' }"
          />
          <div class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
            支持 `txt` / `epub` / `zip` / `cbz`。当前最小闭环会基于上传文件直接生成草稿作品与待审记录。
          </div>
        </el-form-item>
        <el-form-item label="作品封面" prop="coverOssId">
          <image-upload
            v-model="form.coverOssId"
            :limit="1"
            :file-size="5"
            :file-type="coverFileTypes"
            :is-show-tip="false"
            :oss-ext="{ bizType: 'reader-cover', source: 'reader-admin' }"
          />
          <div class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
            可选，支持 JPG、PNG、WEBP；未上传时读者端使用默认封面。
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取 消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 阅读器管理端导入任务页，负责文件上传、任务创建与失败排查。
// 表单实例类型用于约束筛选表单和弹窗表单的校验调用。
import type { FormInstance } from 'element-plus';
// 平台统一消息提示插件，负责成功反馈与错误提示展示。
import modal from '@/plugins/modal';
// 导入任务接口统一从阅读器后台 API 模块引入，避免页面分散拼接请求。
import { createReaderImportTask, listReaderImportTasks } from '@/api/reader/admin';
// 页面表单和列表类型与后台契约保持同步，减少字段名漂移。
import type { ReaderImportTaskForm, ReaderImportTaskQuery, ReaderImportTaskVO } from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminImportTaskPage' });

const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const taskList = ref<ReaderImportTaskVO[]>([]);
const dialogVisible = ref(false);
const submitting = ref(false);
const uploadValue = ref('');
let pollTimer: number | undefined;
const queryParams = reactive<ReaderImportTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  taskName: undefined,
  status: undefined
});
const form = reactive<ReaderImportTaskForm>({
  taskName: '',
  contentType: 'NOVEL',
  categoryName: '',
  ossId: '',
  coverOssId: ''
});
const allowedFileTypes = ['txt', 'epub', 'zip', 'cbz'];
const coverFileTypes = ['jpg', 'jpeg', 'png', 'webp'];
const categoryOptions = ['玄幻', '言情', '修仙', '都市', '历史', '科幻', '悬疑', '武侠', '青春', '其他'];
const rules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  categoryName: [{ required: true, message: '请选择或填写内容分类', trigger: 'change' }],
  ossId: [{ required: true, message: '请先上传导入文件', trigger: 'change' }]
};

const contentTypeLabel = (value?: string) => (value === 'COMIC' ? '漫画' : value === 'NOVEL' ? '小说' : value || '-');

watch(uploadValue, value => {
  // file-upload 组件返回的是 OSS 记录主键，提交任务时需要同步回表单字段。
  form.ossId = value;
});

// 把导入任务状态映射为标签颜色，便于快速识别解析进度与失败任务。
const getTaskStatusType = (status?: string) => {
  if (status === 'COMPLETED' || status === 'APPROVED') return 'success';
  if (status === 'FAILED' || status === 'PARSE_FAILED' || status === 'CANCELED') return 'danger';
  if (status === 'PARSING' || status === 'PROCESSING' || status === 'PENDING_REVIEW') return 'warning';
  return 'info';
};

// 拉取导入任务列表，并同步分页总数供表格与分页组件共用。
const getList = async () => {
  loading.value = true;
  try {
    const { data } = await listReaderImportTasks({ ...queryParams });
    taskList.value = data?.rows ?? [];
    total.value = Number(data?.total ?? 0);
  } finally {
    loading.value = false;
  }
};

// 只要列表里还有待处理任务，就定时刷新进度，减少手动反复点击刷新。
const startPolling = () => {
  stopPolling();
  pollTimer = window.setInterval(() => {
    const hasRunningTask = taskList.value.some(item => ['CREATED', 'PARSING'].includes(item.status));
    if (hasRunningTask) {
      getList();
      return;
    }
    stopPolling();
  }, 3000);
};

// 停止自动轮询，避免页面离开后继续请求。
const stopPolling = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
};

// 执行筛选查询前先重置到第一页，避免沿用旧页码导致空列表误判。
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

// 重置筛选项后重新查询，让任务列表回到默认视图。
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  getList();
};

// 重置创建任务表单，确保任务名称、内容类型和上传文件都回到初始态。
const resetForm = () => {
  // 创建任务弹窗每次都重置上传结果，避免上一次的 OSS 文件被误提交。
  form.taskName = '';
  form.contentType = 'NOVEL';
  form.categoryName = '';
  form.ossId = '';
  form.coverOssId = '';
  uploadValue.value = '';
  formRef.value?.clearValidate();
};

// 打开创建任务弹窗前，先清空上一次任务的表单与上传残留。
const handleCreate = () => {
  resetForm();
  dialogVisible.value = true;
};

// 关闭弹窗时同步回收表单状态，避免下次打开时看到旧值。
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

// 校验通过后创建导入任务，并在成功后刷新任务列表查看解析状态。
const handleSubmit = async () => {
  // 提交前再次取一次上传组件值，确保异步上传完成后的最新 ossId 被带上。
  form.ossId = uploadValue.value;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await createReaderImportTask({ ...form });
    modal.msgSuccess('导入任务已创建，后台开始解析');
    dialogVisible.value = false;
    resetForm();
    await getList();
    startPolling();
  } finally {
    submitting.value = false;
  }
};

// 页面初始化时立即拉取一次列表，保证进入模块就能看到当前任务进度。
onMounted(() => {
  getList().then(startPolling);
});

// 页面离开时停止轮询，避免产生无意义的后台请求。
onUnmounted(() => {
  stopPolling();
});
</script>
