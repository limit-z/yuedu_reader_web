<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="m-0 text-base font-semibold">榜单管理</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">自动榜按规则生成，手工榜按你选择的作品顺序展示。</p>
          </div>
          <div class="batch-actions"><el-button type="primary" icon="Plus" @click="openDialog()">新增榜单</el-button><el-button :disabled="!selectedRows.length" @click="batchStatus('1')">批量启用</el-button><el-button :disabled="!selectedRows.length" @click="batchStatus('0')">批量停用</el-button></div>
        </div>
      </template>
      <el-form :inline="true" :model="query" class="mb-4" @submit.prevent>
        <el-form-item label="榜单名称"><el-input v-model="query.rankingName" clearable @keyup.enter="loadList" /></el-form-item>
        <el-form-item label="模式"><el-select v-model="query.rankingMode" clearable style="width: 120px"><el-option label="自动榜" value="AUTO" /><el-option label="手工榜" value="MANUAL" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="query.status" clearable style="width: 120px"><el-option label="启用" value="1" /><el-option label="停用" value="0" /></el-select></el-form-item>
        <el-button type="primary" icon="Search" @click="loadList">查询</el-button>
      </el-form>
      <el-table v-loading="loading" :data="rows" border @selection-change="value => selectedRows = value">
        <el-table-column type="selection" width="48" />
        <el-table-column label="榜单名称" prop="rankingName" min-width="150" />
        <el-table-column label="标识" prop="rankingKey" min-width="130" />
        <el-table-column label="模式" width="100"><template #default="{ row }">{{ row.rankingMode === 'MANUAL' ? '手工榜' : '自动榜' }}</template></el-table-column>
        <el-table-column label="自动规则" width="120"><template #default="{ row }">{{ ruleLabel(row.sortRule) }}</template></el-table-column>
        <el-table-column label="顺序" prop="sortNo" width="80" />
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="说明" prop="rankingDesc" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="180" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="openDialog(row)">编辑</el-button><el-button link :type="row.status === '1' ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === '1' ? '停用' : '启用' }}</el-button></template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.row ? '编辑榜单' : '新增榜单'" width="680px" append-to-body destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="榜单标识"><el-input v-model="dialog.form.rankingKey" maxlength="64" placeholder="例如 editor-choice" :disabled="Boolean(dialog.row)" /></el-form-item>
        <el-form-item label="榜单名称"><el-input v-model="dialog.form.rankingName" maxlength="64" placeholder="例如 编辑精选" /></el-form-item>
        <el-form-item label="榜单说明"><el-input v-model="dialog.form.rankingDesc" maxlength="255" placeholder="面向读者展示的榜单说明" /></el-form-item>
        <el-form-item label="榜单模式"><el-radio-group v-model="dialog.form.rankingMode"><el-radio-button value="AUTO">自动榜</el-radio-button><el-radio-button value="MANUAL">手工榜</el-radio-button></el-radio-group></el-form-item>
        <el-form-item v-if="dialog.form.rankingMode === 'AUTO'" label="自动规则"><el-select v-model="dialog.form.sortRule" style="width: 220px"><el-option v-for="item in rules" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="展示顺序"><el-input-number v-model="dialog.form.sortNo" :min="1" :max="999" /></el-form-item>
        <el-form-item v-if="dialog.form.rankingMode === 'MANUAL'" label="选择作品">
          <el-checkbox-group v-model="dialog.workIds" class="ranking-work-options">
            <el-checkbox v-for="work in availableWorks" :key="work.id" :value="String(work.id)">{{ work.title }}<span class="ml-1 text-xs text-[var(--el-text-color-secondary)]">{{ work.categoryName || '未分类' }}</span></el-checkbox>
          </el-checkbox-group>
          <span class="mt-2 block text-xs text-[var(--el-text-color-secondary)]">勾选顺序即为榜单展示顺序。</span>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog.visible = false">取消</el-button><el-button type="primary" :loading="dialog.submitting" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  createReaderRanking,
  listReaderRankingWorkRelations,
  listReaderRankingWorks,
  listReaderRankings,
  saveReaderRankingWorks,
  updateReaderRanking,
  batchUpdateReaderRankingStatus,
  updateReaderRankingStatus
} from '@/api/reader/admin';
import type { ReaderRanking, ReaderRankingWorkOption } from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminRankingPage' });

const loading = ref(false);
const rows = ref<ReaderRanking[]>([]);
const selectedRows = ref<ReaderRanking[]>([]);
const total = ref(0);
const availableWorks = ref<ReaderRankingWorkOption[]>([]);
const query = reactive({ pageNum: 1, pageSize: 10, rankingName: '', rankingMode: '', status: '' });
const rules = [
  { value: 'HOT', label: '畅销/热度' },
  { value: 'RISING', label: '近期飙升' },
  { value: 'COMPLETED', label: '完结优先' },
  { value: 'NEW', label: '最近上架' },
  { value: 'UPDATE', label: '最近更新' }
];
const dialog = reactive<{ visible: boolean; submitting: boolean; row?: ReaderRanking; form: Partial<ReaderRanking>; workIds: string[] }>({
  visible: false,
  submitting: false,
  form: {},
  workIds: []
});

const ruleLabel = (rule?: string) => rules.find((item) => item.value === rule)?.label || rule || '-';

const loadList = async () => {
  loading.value = true;
  try {
    const { data } = await listReaderRankings(query);
    rows.value = data?.rows ?? [];
    total.value = Number(data?.total ?? 0);
  } finally {
    loading.value = false;
  }
};

const loadAvailableWorks = async () => {
  const { data } = await listReaderRankingWorks({ pageNum: 1, pageSize: 200 });
  availableWorks.value = data?.rows ?? [];
};

const openDialog = async (row?: ReaderRanking) => {
  dialog.row = row;
  dialog.form = row ? { ...row } : { rankingKey: '', rankingName: '', rankingDesc: '', rankingMode: 'AUTO', sortRule: 'UPDATE', sortNo: 99, status: '1' };
  dialog.workIds = [];
  if (row?.rankingMode === 'MANUAL') {
    const { data } = await listReaderRankingWorkRelations(row.id);
    dialog.workIds = (data ?? []).toSorted((a, b) => Number(a.sortNo ?? 0) - Number(b.sortNo ?? 0)).map((item) => String(item.workId));
  }
  if (!availableWorks.value.length) await loadAvailableWorks();
  dialog.visible = true;
};

const save = async () => {
  if (!dialog.form.rankingKey?.trim() || !dialog.form.rankingName?.trim()) return ElMessage.warning('请输入榜单标识和名称');
  dialog.submitting = true;
  try {
    const result = dialog.row ? await updateReaderRanking(dialog.row.id, dialog.form) : await createReaderRanking(dialog.form);
    const rankingId = dialog.row?.id ?? result.data;
    if (dialog.form.rankingMode === 'MANUAL' && rankingId) await saveReaderRankingWorks(rankingId, dialog.workIds);
    ElMessage.success('榜单已保存');
    dialog.visible = false;
    await loadList();
  } finally {
    dialog.submitting = false;
  }
};

const toggleStatus = async (row: ReaderRanking) => {
  await updateReaderRankingStatus(row.id, row.status === '1' ? '0' : '1');
  ElMessage.success('榜单状态已更新');
  await loadList();
};

const batchStatus = async (status: string) => { if (!selectedRows.value.length) return ElMessage.warning('请先选择榜单'); await ElMessageBox.confirm(`确认批量${status === '1' ? '启用' : '停用'}选中的 ${selectedRows.value.length} 个榜单吗？`, '批量操作确认', { type: 'warning' }); const { data } = await batchUpdateReaderRankingStatus(status, selectedRows.value.map(row => row.id)); ElMessage.success(`批量操作完成，成功 ${data?.successCount ?? 0} 条，失败 ${data?.failureCount ?? 0} 条`); await loadList(); selectedRows.value = []; };

onMounted(async () => { await Promise.all([loadList(), loadAvailableWorks()]); });
</script>

<style scoped>
.ranking-work-options {
  display: grid;
  max-height: 260px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
  overflow-y: auto;
}

.ranking-work-options :deep(.el-checkbox) {
  margin-right: 0;
}
</style>
