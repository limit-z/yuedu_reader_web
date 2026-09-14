<template>
  <div class="p-2 app-container"><el-card shadow="hover"><template #header><div><h3 class="m-0 text-base font-semibold">积分规则</h3><p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">展示移动端当前实际生效的积分任务和成就配置。</p></div></template><el-alert :title="rules?.storage || '正在读取积分存储说明'" type="info" :closable="false" show-icon class="mb-4" /><el-row :gutter="16"><el-col :xs="24" :md="12"><el-card shadow="never"><template #header>积分任务</template><el-table :data="rules?.tasks ?? []" border><el-table-column label="任务" prop="title" /><el-table-column label="奖励" width="90"><template #default="{ row }">{{ row.points }} 分</template></el-table-column><el-table-column label="完成条件" prop="condition" /></el-table></el-card></el-col><el-col :xs="24" :md="12"><el-card shadow="never"><template #header>成就奖励</template><el-table :data="rules?.rewards ?? []" border><el-table-column label="成就" prop="title" /><el-table-column label="奖励" width="90"><template #default="{ row }">{{ row.points }} 分</template></el-table-column><el-table-column label="说明" prop="condition" /></el-table></el-card></el-col></el-row></el-card>
  </div>
</template>
<script setup lang="ts">
import { getReaderH5PointsRules } from '@/api/reader/admin';
import type { ReaderPointsRuleAdminVO } from '@/api/reader/admin/types';
defineOptions({ name: 'ReaderAdminH5PointsPage' });
const rules = ref<ReaderPointsRuleAdminVO>();
onMounted(async () => { const { data } = await getReaderH5PointsRules(); rules.value = data; });
</script>
