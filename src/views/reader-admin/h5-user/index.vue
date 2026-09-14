<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <template #header><div class="flex items-center justify-between"><div><h3 class="m-0 text-base font-semibold">读者用户</h3><p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">管理 H5 登录用户资料和访问状态。</p></div><div><el-button :disabled="!selectedRows.length" @click="batchStatus('0')">批量启用</el-button><el-button :disabled="!selectedRows.length" type="warning" @click="batchStatus('1')">批量停用</el-button></div></div></template>
      <el-form :inline="true" :model="query" @submit.prevent><el-form-item label="昵称/账号"><el-input v-model="query.keyword" clearable @keyup.enter="loadList" /></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable style="width: 120px"><el-option label="正常" value="0" /><el-option label="停用" value="1" /></el-select></el-form-item><el-form-item label="客户端"><el-select v-model="query.lastClientType" clearable style="width: 140px"><el-option label="H5" value="H5" /><el-option label="小程序" value="MINI_PROGRAM" /></el-select></el-form-item><el-button type="primary" icon="Search" @click="loadList">查询</el-button></el-form>
      <el-table v-loading="loading" :data="rows" border @selection-change="selectedRows = $event"><el-table-column type="selection" width="48" /><el-table-column label="账号ID" prop="accountId" width="160" /><el-table-column label="昵称" prop="nickName" min-width="160" /><el-table-column label="地区" prop="region" width="130" /><el-table-column label="客户端" prop="lastClientType" width="130" /><el-table-column label="最近登录" prop="lastLoginAt" min-width="180" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'danger'">{{ row.status === '0' ? '正常' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" fixed="right" width="120"><template #default="{ row }"><el-button link :type="row.status === '0' ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === '0' ? '停用' : '启用' }}</el-button></template></el-table-column></el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { batchUpdateReaderH5UserStatus, listReaderH5Users, updateReaderH5UserStatus } from '@/api/reader/admin';
import type { ReaderUserAdminQuery, ReaderUserAdminVO } from '@/api/reader/admin/types';
defineOptions({ name: 'ReaderAdminH5UserPage' });
const loading = ref(false); const rows = ref<ReaderUserAdminVO[]>([]); const selectedRows = ref<ReaderUserAdminVO[]>([]); const total = ref(0);
const query = reactive<ReaderUserAdminQuery>({ pageNum: 1, pageSize: 10, keyword: undefined, status: undefined, lastClientType: undefined });
const loadList = async () => { loading.value = true; try { const { data } = await listReaderH5Users(query); rows.value = data?.rows ?? []; total.value = Number(data?.total ?? 0); } finally { loading.value = false; } };
const toggleStatus = async (row: ReaderUserAdminVO) => { await updateReaderH5UserStatus(row.accountId, row.status === '0' ? '1' : '0'); ElMessage.success('用户状态已更新'); await loadList(); };
const batchStatus = async (status: string) => { if (!selectedRows.value.length) return ElMessage.warning('请先选择用户'); await ElMessageBox.confirm(`确认批量${status === '0' ? '启用' : '停用'} ${selectedRows.value.length} 个用户吗？`, '批量操作确认', { type: 'warning' }); const { data } = await batchUpdateReaderH5UserStatus(selectedRows.value.map(row => row.accountId), status); ElMessage.success(`批量操作完成，成功 ${data?.successCount ?? 0} 条，失败 ${data?.failureCount ?? 0} 条`); selectedRows.value = []; await loadList(); };
onMounted(loadList);
</script>
