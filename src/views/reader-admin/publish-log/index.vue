<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <template #header>
        <div>
          <h3 class="m-0 text-base font-semibold">发布说明</h3>
          <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">
            P0 阶段先把发布动作收敛在“作品管理”和“内容审核”两页，独立发布日志待后续版本表与操作日志接入后再升级。
          </p>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="当前上架入口">
          `PUT /reader/admin/works/{workId}/publish`
        </el-descriptions-item>
        <el-descriptions-item label="当前下架入口">
          `PUT /reader/admin/works/{workId}/offline`
        </el-descriptions-item>
        <el-descriptions-item label="当前审核通过入口">
          `POST /reader/admin/audits/{auditId}/approve`
        </el-descriptions-item>
        <el-descriptions-item label="当前阶段目标">
          先保证 import -> audit -> publish/offline -> app read 的最小闭环联调成功，再补发布版本追踪、回滚记录和审计视图。
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 阅读器管理端发布日志页，预留作品发布链路的记录查看入口。
defineOptions({ name: 'ReaderAdminPublishGuidePage' });
</script>
