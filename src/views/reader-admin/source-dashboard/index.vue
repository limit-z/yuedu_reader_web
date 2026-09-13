<template>
  <div class="p-2 app-container source-dashboard-page">
    <div class="dashboard-header">
      <div>
        <div class="eyebrow">SOURCE OPERATIONS</div>
        <h1>采集中心大盘</h1>
        <p>从站点、任务、运行、书籍、章节到错误和日志，统一查看真实采集状态。</p>
      </div>
      <div class="header-actions">
        <el-select v-model="trendDays" style="width: 128px" @change="loadOverview">
          <el-option :value="7" label="近 7 天" />
          <el-option :value="14" label="近 14 天" />
          <el-option :value="30" label="近 30 天" />
          <el-option :value="60" label="近 60 天" />
        </el-select>
        <el-button type="primary" icon="Refresh" :loading="loading.overview" @click="refreshAll">刷新数据</el-button>
      </div>
    </div>

    <el-alert
      v-if="overview"
      class="mb-3"
      :title="`数据更新时间：${overview.generatedAt || '刚刚'}`"
      description="指标来自当前数据库实时聚合；小说追踪表支持下钻查看任务链、章节正文完整度、错误明细和自动化日志。"
      type="info"
      show-icon
      :closable="false"
    />

    <div v-loading="loading.overview" class="metric-grid">
      <button v-for="metric in metrics" :key="metric.key" class="metric-card" type="button" @click="focusMetric(metric.key)">
        <span class="metric-label">{{ metric.label }}</span>
        <strong>{{ formatNumber(metric.value) }}</strong>
        <span class="metric-foot" :class="metric.tone">{{ metric.note }}</span>
      </button>
    </div>

    <el-row :gutter="12" class="dashboard-grid">
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="panel chart-panel">
          <template #header><div class="panel-heading"><span>任务状态</span><small>{{ overview?.taskTotal || 0 }} 个任务</small></div></template>
          <div ref="taskStatusChart" class="chart chart-sm" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="panel chart-panel">
          <template #header><div class="panel-heading"><span>章节处理量</span><small>计划与结果</small></div></template>
          <div ref="chapterChart" class="chart chart-sm" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="panel chart-panel">
          <template #header><div class="panel-heading"><span>失败分类</span><small>{{ overview?.unresolvedErrorTotal || 0 }} 条待处理</small></div></template>
          <div ref="failureChart" class="chart chart-sm" />
        </el-card>
      </el-col>
      <el-col :span="24">
        <el-card shadow="never" class="panel chart-panel">
          <template #header><div class="panel-heading"><span>运行趋势</span><small>请求、成功、失败</small></div></template>
          <div ref="trendChart" class="chart chart-wide" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="dashboard-grid">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel" id="site-report">
          <template #header><div class="panel-heading"><span>站点运行对比</span><small>按任务、书籍和请求量查看</small></div></template>
          <el-table :data="overview?.siteStats || []" border stripe height="380">
            <el-table-column label="站点" min-width="180"><template #default="{ row }"><strong>{{ row.siteName }}</strong><div class="muted">{{ row.allowedHost }}</div></template></el-table-column>
            <el-table-column label="许可" width="90"><template #default="{ row }"><el-tag :type="row.complianceStatus === 'APPROVED' ? 'success' : 'warning'">{{ row.complianceStatus === 'APPROVED' ? '已确认' : '待确认' }}</el-tag></template></el-table-column>
            <el-table-column label="任务/运行" width="105"><template #default="{ row }">{{ row.taskCount }} / {{ row.runCount }}</template></el-table-column>
            <el-table-column label="书籍" prop="bookCount" width="75" />
            <el-table-column label="成功章节" prop="successChapterCount" width="95" />
            <el-table-column label="失败章节" prop="failedChapterCount" width="95" />
            <el-table-column label="请求数" prop="requestCount" width="85" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel" id="center-report">
          <template #header><div class="panel-heading"><span>中心资源清单</span><small>配置与产物</small></div></template>
          <div class="resource-list">
            <div v-for="item in resourceItems" :key="item.label" class="resource-row"><span>{{ item.label }}</span><strong>{{ formatNumber(item.value) }}</strong><el-tag :type="item.type" size="small">{{ item.note }}</el-tag></div>
          </div>
          <el-divider />
          <div class="mini-summary">
            <div><span>执行器</span><strong>{{ mapTotal(overview?.executorCounts) }}</strong></div>
            <div><span>触发方式</span><strong>{{ mapTotal(overview?.triggerCounts) }}</strong></div>
            <div><span>未解决错误</span><strong class="danger-text">{{ overview?.unresolvedErrorTotal || 0 }}</strong></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="panel works-panel" id="work-report">
      <template #header>
        <div class="works-header">
          <div class="panel-heading"><span>小说采集追踪</span><small>按小说聚合所有任务、章节计划和正文落库情况</small></div>
          <el-button icon="Refresh" link @click="loadWorks">刷新列表</el-button>
        </div>
      </template>
      <div class="filter-row">
        <el-input v-model="workQuery.keyword" clearable placeholder="搜索书名、作者或分类" style="width: 260px" @keyup.enter="loadWorks" />
        <el-input v-model="workQuery.categoryName" clearable placeholder="分类" style="width: 150px" @keyup.enter="loadWorks" />
        <el-select v-model="workQuery.status" clearable placeholder="当前任务状态" style="width: 160px" @change="loadWorks">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" icon="Search" @click="loadWorks">查询</el-button>
      </div>
      <el-table v-loading="loading.works" :data="works" border stripe row-key="workId" @row-click="openWorkDetail">
        <el-table-column label="小说" min-width="230"><template #default="{ row }"><div class="work-title">{{ row.title }}</div><div class="muted">{{ row.authorName || '未知作者' }} · {{ row.categoryName || '未分类' }}</div></template></el-table-column>
        <el-table-column label="当前任务" min-width="190"><template #default="{ row }"><div>{{ row.currentTaskName || '暂无任务' }}</div><el-tag v-if="row.currentTaskStatus" size="small" :type="statusType(row.currentTaskStatus)">{{ statusLabel(row.currentTaskStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="任务/书籍" width="105"><template #default="{ row }">{{ row.taskCount }} / {{ row.bookRecordCount }}</template></el-table-column>
        <el-table-column label="章节处理" min-width="180"><template #default="{ row }"><el-progress :percentage="row.progressPercent" :stroke-width="8" /><div class="muted">{{ row.processedChapterCount }} / {{ row.plannedChapterCount }}，正文 {{ row.contentReadyChapterCount }} / {{ row.chapterTotal }}</div></template></el-table-column>
        <el-table-column label="成功/失败" width="105"><template #default="{ row }"><span class="success-text">{{ row.successChapterCount }}</span> / <span class="danger-text">{{ row.failedChapterCount }}</span></template></el-table-column>
        <el-table-column label="最近活动" prop="lastActivityAt" width="170" />
        <el-table-column label="下钻" width="80" fixed="right"><template #default="{ row }"><el-button link type="primary" @click.stop="openWorkDetail(row)">查看</el-button></template></el-table-column>
      </el-table>
      <pagination v-show="workTotal > 0" v-model:page="workQuery.pageNum" v-model:limit="workQuery.pageSize" :total="workTotal" @pagination="loadWorks" />
    </el-card>

    <el-drawer v-model="detailVisible" :title="detail ? `${detail.title} · 采集详情` : '小说采集详情'" size="88%" destroy-on-close>
      <template v-if="detail">
        <div class="detail-hero">
          <div><div class="eyebrow">NOVEL TRACE</div><h2>{{ detail.title }}</h2><p>{{ detail.authorName || '未知作者' }} · {{ detail.categoryName || '未分类' }} · {{ serialLabel(detail.serialStatus) }}</p></div>
          <el-progress type="dashboard" :percentage="detail.progressPercent" :width="92" />
        </div>
        <div class="detail-metrics">
          <div><span>任务数</span><strong>{{ detail.taskCount }}</strong></div><div><span>章节总数</span><strong>{{ detail.chapterTotal }}</strong></div><div><span>正文可用</span><strong class="success-text">{{ detail.contentReadyChapterCount }}</strong></div><div><span>正文缺失</span><strong class="danger-text">{{ detail.contentMissingChapterCount }}</strong></div><div><span>成功章节</span><strong>{{ detail.successChapterCount }}</strong></div><div><span>失败章节</span><strong class="danger-text">{{ detail.failedChapterCount }}</strong></div>
        </div>
        <el-tabs v-model="detailTab" class="detail-tabs">
          <el-tab-pane label="任务链" name="tasks"><el-table :data="detail.tasks" border stripe><el-table-column label="任务" min-width="210"><template #default="{ row }"><strong>{{ row.taskName }}</strong><div class="muted">{{ row.siteName || '未知站点' }} · {{ row.executorType }}</div></template></el-table-column><el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template></el-table-column><el-table-column label="书籍" prop="bookCount" width="70" /><el-table-column label="章节进度" min-width="180"><template #default="{ row }"><el-progress :percentage="row.progressPercent" :stroke-width="8" /><div class="muted">{{ row.processedChapterCount }} / {{ row.plannedChapterCount }}</div></template></el-table-column><el-table-column label="成功/失败" width="105"><template #default="{ row }">{{ row.successChapterCount }} / <span class="danger-text">{{ row.failedChapterCount }}</span></template></el-table-column><el-table-column label="失败分类" prop="failureCode" width="120" /><el-table-column label="最近运行" prop="lastRunAt" width="170" /></el-table></el-tab-pane>
          <el-tab-pane label="章节正文" name="chapters"><div class="chapter-toolbar"><el-radio-group v-model="chapterQuery.contentStatus" @change="loadChapters"><el-radio-button label="">全部</el-radio-button><el-radio-button label="READY">正文可用</el-radio-button><el-radio-button label="MISSING">正文缺失</el-radio-button></el-radio-group></div><el-table v-loading="loading.chapters" :data="chapters" border stripe><el-table-column label="序号" prop="chapterNo" width="80" /><el-table-column label="章节" min-width="300"><template #default="{ row }">{{ row.volumeName ? `${row.volumeName} · ` : '' }}{{ row.chapterName }}</template></el-table-column><el-table-column label="字数" prop="wordCount" width="90" /><el-table-column label="正文" width="110"><template #default="{ row }"><el-tag :type="row.contentStatus === 'READY' ? 'success' : 'danger'">{{ row.contentStatus === 'READY' ? '可用' : '缺失' }}</el-tag></template></el-table-column><el-table-column label="发布" width="90"><template #default="{ row }">{{ row.publishStatus === '1' ? '已发布' : '未发布' }}</template></el-table-column><el-table-column label="更新时间" prop="updateTime" width="170" /></el-table><pagination v-show="chapterTotal > 0" v-model:page="chapterQuery.pageNum" v-model:limit="chapterQuery.pageSize" :total="chapterTotal" @pagination="loadChapters" /></el-tab-pane>
          <el-tab-pane label="错误与日志" name="events"><div class="event-columns"><div><h3>最近错误</h3><el-timeline><el-timeline-item v-for="item in detail.recentErrors" :key="`e-${item.id}`" :timestamp="item.createTime" type="danger"><strong>{{ item.errorType }}{{ item.httpStatus ? ` / ${item.httpStatus}` : '' }}</strong><div>{{ item.message }}</div></el-timeline-item></el-timeline><el-empty v-if="!detail.recentErrors.length" description="暂无错误" /></div><div><h3>自动化日志</h3><el-timeline><el-timeline-item v-for="item in detail.recentLogs" :key="`l-${item.id}`" :timestamp="item.eventAt" :type="item.level === 'ERROR' ? 'danger' : item.level === 'WARN' ? 'warning' : 'primary'"><strong>{{ item.eventType }}</strong><div>{{ item.message }}</div></el-timeline-item></el-timeline><el-empty v-if="!detail.recentLogs.length" description="暂无日志" /></div></div></el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else description="正在加载小说采集详情" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import {
  getReaderSourceDashboardOverview,
  getReaderSourceDashboardWorkDetail,
  listReaderSourceDashboardWorkChapters,
  listReaderSourceDashboardWorks
} from '@/api/reader/admin';
import type {
  ReaderSourceDashboardChapterVO,
  ReaderSourceDashboardWorkDetailVO,
  ReaderSourceDashboardWorkVO,
  ReaderSourceDashboardVO
} from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminSourceDashboardPage' });

const overview = ref<ReaderSourceDashboardVO>();
const works = ref<ReaderSourceDashboardWorkVO[]>([]);
const workTotal = ref(0);
const detail = ref<ReaderSourceDashboardWorkDetailVO>();
const chapters = ref<ReaderSourceDashboardChapterVO[]>([]);
const chapterTotal = ref(0);
const detailVisible = ref(false);
const detailTab = ref('tasks');
const trendDays = ref(14);
const loading = reactive({ overview: false, works: false, chapters: false });
const workQuery = reactive({ pageNum: 1, pageSize: 10, keyword: '', categoryName: '', status: '' });
const chapterQuery = reactive({ pageNum: 1, pageSize: 12, contentStatus: '' });
const taskStatusChart = ref<HTMLElement>();
const chapterChart = ref<HTMLElement>();
const failureChart = ref<HTMLElement>();
const trendChart = ref<HTMLElement>();
let chartInstances: echarts.ECharts[] = [];
const statusOptions = [{ label: '运行中', value: 'RUNNING' }, { label: '已暂停', value: 'PAUSED' }, { label: '失败', value: 'FAILED' }, { label: '待审核', value: 'WAITING_REVIEW' }, { label: '已完成', value: 'COMPLETED' }];

const unwrap = <T,>(data: { rows?: T[]; total?: number } | undefined) => ({ rows: data?.rows ?? [], total: Number(data?.total ?? 0) });
const formatNumber = (value?: number) => Number(value || 0).toLocaleString();
const mapTotal = (value?: Record<string, number>) => Object.values(value || {}).reduce((sum, item) => sum + Number(item || 0), 0);
const statusLabel = (value?: string) => ({ RUNNING: '运行中', PAUSED: '已暂停', FAILED: '失败', COMPLETED: '已完成', WAITING_REVIEW: '待审核', CANCELED: '已取消', DRAFT: '草稿', READY: '准备中' }[value || ''] || value || '-');
const statusType = (value?: string) => ({ RUNNING: 'primary', PAUSED: 'warning', FAILED: 'danger', COMPLETED: 'success', WAITING_REVIEW: 'warning', CANCELED: 'info' }[value || ''] || 'info');
const serialLabel = (value?: string) => value === 'FINISHED' ? '完结' : value === 'ONGOING' ? '连载' : '状态未知';
const metrics = computed(() => overview.value ? [
  { key: 'tasks', label: '采集任务', value: overview.value.taskTotal, note: `${overview.value.activeTaskTotal} 个运行中`, tone: 'blue' },
  { key: 'runs', label: '运行记录', value: overview.value.runTotal, note: `${overview.value.runningRunTotal} 个当前运行`, tone: 'teal' },
  { key: 'works', label: '采集小说', value: overview.value.workTotal, note: `${overview.value.bookTotal} 条任务书籍明细`, tone: 'violet' },
  { key: 'chapters', label: '业务章节', value: overview.value.chapterTotal, note: `正文可用 ${overview.value.contentReadyChapterTotal}`, tone: 'green' },
  { key: 'pending', label: '待处理章节', value: overview.value.pendingChapterTotal, note: `已处理 ${overview.value.processedChapterTotal}`, tone: 'amber' },
  { key: 'errors', label: '未解决错误', value: overview.value.unresolvedErrorTotal, note: `错误总数 ${overview.value.errorTotal}`, tone: 'red' },
  { key: 'sites', label: '可用站点', value: overview.value.enabledSiteTotal, note: `授权确认 ${overview.value.approvedSiteTotal}`, tone: 'blue' },
  { key: 'logs', label: '自动化日志', value: overview.value.taskLogTotal, note: `快照 ${overview.value.snapshotTotal}`, tone: 'teal' }
] : []);
const resourceItems = computed(() => overview.value ? [
  { label: '授权站点', value: overview.value.approvedSiteTotal, note: `${overview.value.enabledSiteTotal} 个已启用`, type: 'success' },
  { label: '访问策略', value: overview.value.policyTotal, note: `${overview.value.activePolicyTotal} 个已启用`, type: 'info' },
  { label: '解析规则', value: overview.value.ruleTotal, note: `${overview.value.activeRuleTotal} 个已启用`, type: 'info' },
  { label: '备用书源路由', value: overview.value.fallbackTotal, note: '自动续采', type: 'info' },
  { label: '发现源 / 候选', value: overview.value.discoveryProviderTotal + overview.value.discoveryCandidateTotal, note: `${overview.value.discoveryCandidateTotal} 个候选`, type: 'warning' },
  { label: '封面任务', value: overview.value.coverTaskTotal, note: `完成 ${overview.value.coverCompletedTotal}`, type: 'success' },
  { label: '正文缺失章节', value: Math.max(0, overview.value.chapterTotal - overview.value.contentReadyChapterTotal), note: '需要补采或复核', type: 'danger' }
] : []);

const disposeCharts = () => { chartInstances.forEach(chart => chart.dispose()); chartInstances = []; };
const chartData = (source: Record<string, number> | undefined) => Object.entries(source || {}).map(([name, value]) => ({ name: statusLabel(name), value }));
const renderCharts = async () => {
  await nextTick();
  if (!overview.value) return;
  disposeCharts();
  const colors = ['#2f6fed', '#15aabf', '#f59f00', '#e64980', '#40c057', '#7950f2', '#868e96'];
  if (taskStatusChart.value) {
    const chart = echarts.init(taskStatusChart.value); chartInstances.push(chart);
    chart.setOption({ color: colors, tooltip: { trigger: 'item' }, legend: { bottom: 0, type: 'scroll' }, series: [{ type: 'pie', radius: ['42%', '70%'], center: ['50%', '43%'], label: { formatter: '{b}\n{d}%' }, data: chartData(overview.value.taskStatusCounts) }] });
  }
  if (chapterChart.value) {
    const chart = echarts.init(chapterChart.value); chartInstances.push(chart);
    chart.setOption({ color: ['#2f6fed', '#40c057', '#f59f00', '#e03131'], tooltip: { trigger: 'axis' }, grid: { left: 45, right: 18, top: 20, bottom: 28 }, xAxis: { type: 'category', data: ['计划', '已处理', '成功', '跳过', '失败', '待处理'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', barMaxWidth: 28, data: [overview.value.plannedChapterTotal, overview.value.processedChapterTotal, overview.value.successChapterTotal, overview.value.skippedChapterTotal, overview.value.failedChapterTotal, overview.value.pendingChapterTotal] }] });
  }
  if (failureChart.value) {
    const chart = echarts.init(failureChart.value); chartInstances.push(chart);
    const data = Object.entries(overview.value.errorTypeCounts || {}).toSorted((a, b) => b[1] - a[1]).slice(0, 8);
    chart.setOption({ color: ['#e03131', '#f76707', '#f59f00', '#7950f2', '#2f6fed'], tooltip: { trigger: 'axis' }, grid: { left: 72, right: 18, top: 15, bottom: 24 }, xAxis: { type: 'value' }, yAxis: { type: 'category', data: data.map(item => item[0]).toReversed() }, series: [{ type: 'bar', data: data.map(item => item[1]).toReversed(), barMaxWidth: 20 }] });
  }
  if (trendChart.value) {
    const chart = echarts.init(trendChart.value); chartInstances.push(chart);
    const trend = overview.value.recentTrend || [];
    chart.setOption({ color: ['#2f6fed', '#40c057', '#e03131'], tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 42, right: 22, top: 34, bottom: 30 }, xAxis: { type: 'category', data: trend.map(item => item.date?.slice(5)) }, yAxis: { type: 'value' }, series: [{ name: '请求', type: 'line', smooth: true, data: trend.map(item => item.requestCount) }, { name: '成功', type: 'line', smooth: true, data: trend.map(item => item.successCount) }, { name: '失败', type: 'line', smooth: true, data: trend.map(item => item.failureCount) }] });
  }
};
const handleResize = () => chartInstances.forEach(chart => chart.resize());
const loadOverview = async () => { loading.overview = true; try { const { data } = await getReaderSourceDashboardOverview(trendDays.value); overview.value = data; await renderCharts(); } finally { loading.overview = false; } };
const loadWorks = async () => { loading.works = true; try { const { data } = await listReaderSourceDashboardWorks(workQuery); const result = unwrap(data); works.value = result.rows; workTotal.value = result.total; } finally { loading.works = false; } };
const loadChapters = async () => { if (!detail.value) return; loading.chapters = true; try { const { data } = await listReaderSourceDashboardWorkChapters(detail.value.workId, chapterQuery); const result = unwrap(data); chapters.value = result.rows; chapterTotal.value = result.total; } finally { loading.chapters = false; } };
const openWorkDetail = async (row: ReaderSourceDashboardWorkVO) => { detailVisible.value = true; detailTab.value = 'tasks'; chapterQuery.pageNum = 1; detail.value = undefined; const { data } = await getReaderSourceDashboardWorkDetail(row.workId); detail.value = data; await loadChapters(); };
const refreshAll = async () => { await Promise.all([loadOverview(), loadWorks()]); };
const focusMetric = (key: string) => { if (key === 'works' || key === 'chapters' || key === 'pending') document.getElementById('work-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); else if (key === 'sites') document.getElementById('site-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); else document.getElementById('center-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

onMounted(() => { window.addEventListener('resize', handleResize); refreshAll(); });
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); disposeCharts(); });
</script>

<style lang="scss" scoped>
.source-dashboard-page { background: var(--app-page-bg-color, #f5f7fa); min-height: calc(100vh - 84px); }
.dashboard-header, .works-header, .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.dashboard-header { padding: 12px 4px 18px; }
.dashboard-header h1 { margin: 4px 0 6px; color: var(--el-text-color-primary); font-size: 26px; letter-spacing: 0; }
.dashboard-header p, .panel-heading small { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.eyebrow { color: #2f6fed; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
.header-actions, .filter-row, .chapter-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.metric-grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
.metric-card { min-height: 112px; padding: 16px; border: 1px solid var(--app-surface-border, #e7eaf0); border-radius: 8px; background: var(--el-bg-color, #fff); color: var(--el-text-color-primary); text-align: left; cursor: pointer; transition: border-color .2s ease, transform .2s ease; }
.metric-card:hover { border-color: #2f6fed; transform: translateY(-2px); }
.metric-label, .metric-foot { display: block; }
.metric-label { color: var(--el-text-color-secondary); font-size: 12px; }
.metric-card strong { display: block; margin: 8px 0 7px; font-size: 26px; line-height: 1; }
.metric-foot { font-size: 12px; }
.blue { color: #2f6fed; } .teal { color: #1098ad; } .violet { color: #7950f2; } .green, .success-text { color: #2f9e44; } .amber { color: #e67700; } .red, .danger-text { color: #d63939; }
.dashboard-grid { row-gap: 12px; margin-bottom: 12px; }
.panel { border-color: var(--app-surface-border, #e7eaf0); }
.chart { width: 100%; } .chart-sm { height: 286px; } .chart-wide { height: 300px; }
.resource-list { display: grid; gap: 4px; }
.resource-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; min-height: 48px; gap: 12px; border-bottom: 1px solid var(--app-surface-border, #eef0f3); }
.resource-row span { color: var(--el-text-color-secondary); } .resource-row strong { font-size: 18px; }
.mini-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; } .mini-summary div { display: grid; gap: 4px; } .mini-summary span, .muted { color: var(--el-text-color-secondary); font-size: 12px; }
.works-panel { margin-bottom: 12px; } .filter-row { margin-bottom: 14px; }
.work-title { font-weight: 650; } .detail-hero { display: flex; align-items: center; justify-content: space-between; padding: 4px 4px 18px; } .detail-hero h2 { margin: 5px 0; font-size: 22px; } .detail-hero p { margin: 0; color: var(--el-text-color-secondary); }
.detail-metrics { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 18px; } .detail-metrics div { padding: 12px; border: 1px solid var(--app-surface-border, #e7eaf0); border-radius: 6px; } .detail-metrics span, .detail-metrics strong { display: block; } .detail-metrics span { color: var(--el-text-color-secondary); font-size: 12px; } .detail-metrics strong { margin-top: 7px; font-size: 20px; }
.detail-tabs { min-height: 460px; } .event-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; } .event-columns h3 { margin: 0 0 14px; font-size: 15px; }
@media (max-width: 1300px) { .metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 768px) { .dashboard-header { align-items: flex-start; flex-direction: column; } .header-actions { width: 100%; } .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-card strong { font-size: 22px; } .detail-metrics { grid-template-columns: repeat(2, 1fr); } .event-columns { grid-template-columns: 1fr; } .panel-heading { align-items: flex-start; flex-direction: column; gap: 4px; } }
</style>
