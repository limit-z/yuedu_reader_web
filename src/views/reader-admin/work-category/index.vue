<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="m-0 text-base font-semibold">作品分类</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">维护作品内容分类，书源采集发现的分类会自动登记到这里。</p>
          </div>
          <div class="batch-actions"><el-button type="primary" icon="Plus" @click="openDialog()">新增分类</el-button><el-button :disabled="!selectedRows.length" @click="batchStatus('1')">批量启用</el-button><el-button :disabled="!selectedRows.length" @click="batchStatus('0')">批量停用</el-button></div>
        </div>
      </template>
      <el-form :inline="true" :model="query" class="mb-4" @submit.prevent>
        <el-form-item label="分类名称"><el-input v-model="query.categoryName" clearable @keyup.enter="loadList" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="query.status" clearable style="width: 120px"><el-option label="启用" value="1" /><el-option label="停用" value="0" /></el-select></el-form-item>
        <el-button type="primary" icon="Search" @click="loadList">查询</el-button>
      </el-form>
      <el-table v-loading="loading" :data="rows" border @selection-change="value => selectedRows = value">
        <el-table-column type="selection" width="48" />
        <el-table-column label="分类名称" prop="categoryName" min-width="180" />
        <el-table-column label="规范化名称" prop="normalizedName" min-width="180" />
        <el-table-column label="来源" width="120"><template #default="{ row }">{{ row.sourceType === 'SOURCE' ? '书源发现' : '手工维护' }}</template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="更新时间" prop="updateTime" min-width="180" />
        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="openDialog(row as ReaderWorkCategory)">编辑</el-button><el-button link :type="row.status === '1' ? 'warning' : 'success'" @click="toggleStatus(row as ReaderWorkCategory)">{{ row.status === '1' ? '停用' : '启用' }}</el-button></template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
    </el-card>
    <el-dialog v-model="dialog.visible" :title="dialog.row ? '编辑分类' : '新增分类'" width="420px" append-to-body>
      <el-form label-width="90px"><el-form-item label="分类名称"><el-input v-model="dialog.form.categoryName" maxlength="64" /></el-form-item></el-form>
      <template #footer><el-button @click="dialog.visible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { batchUpdateReaderWorkCategoryStatus, createReaderWorkCategory, listReaderWorkCategories, updateReaderWorkCategory, updateReaderWorkCategoryStatus } from '@/api/reader/admin';
import type { ReaderWorkCategory } from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminWorkCategoryPage' });
const loading = ref(false);
const rows = ref<ReaderWorkCategory[]>([]);
const selectedRows = ref<ReaderWorkCategory[]>([]);
const total = ref(0);
const query = reactive({ pageNum: 1, pageSize: 10, categoryName: '', status: '' });
const dialog = reactive<{ visible: boolean; row?: ReaderWorkCategory; form: Partial<ReaderWorkCategory> }>({ visible: false, form: {} });
const loadList = async () => { loading.value = true; try { const { data } = await listReaderWorkCategories(query); rows.value = data?.rows ?? []; total.value = Number(data?.total ?? 0); } finally { loading.value = false; } };
const openDialog = (row?: ReaderWorkCategory) => { dialog.row = row; dialog.form = row ? { ...row } : { categoryName: '' }; dialog.visible = true; };
const save = async () => { if (!dialog.form.categoryName?.trim()) return ElMessage.warning('请输入分类名称'); if (dialog.row) await updateReaderWorkCategory(dialog.row.id, dialog.form); else await createReaderWorkCategory(dialog.form); ElMessage.success('分类已保存'); dialog.visible = false; await loadList(); };
const toggleStatus = async (row: ReaderWorkCategory) => { await updateReaderWorkCategoryStatus(row.id, row.status === '1' ? '0' : '1'); ElMessage.success('分类状态已更新'); await loadList(); };
const batchStatus = async (status: string) => { if (!selectedRows.value.length) return ElMessage.warning('请先选择分类'); await ElMessageBox.confirm(`确认批量${status === '1' ? '启用' : '停用'}选中的 ${selectedRows.value.length} 个分类吗？`, '批量操作确认', { type: 'warning' }); const { data } = await batchUpdateReaderWorkCategoryStatus(status, selectedRows.value.map(row => row.id)); ElMessage.success(`批量操作完成，成功 ${data?.successCount ?? 0} 条，失败 ${data?.failureCount ?? 0} 条`); await loadList(); selectedRows.value = []; };
onMounted(loadList);
</script>
