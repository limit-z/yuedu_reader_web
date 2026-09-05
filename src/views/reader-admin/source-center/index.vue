<template>
  <div class="p-2 app-container source-center-page">
    <el-alert
      title="仅采集已获授权或明确允许的公开内容"
      description="平台负责站点合规、限流和任务审计，执行器只返回结构化结果；401/403 会暂停任务，429 遵循 Retry-After。采集结果不会自动发布。"
      type="info"
      show-icon
      class="mb-4"
    />

    <el-card shadow="hover">
      <template #header>
        <div class="center-header">
          <div>
            <h3 class="m-0 text-base font-semibold">书源采集中心</h3>
            <p class="m-0 mt-1 text-sm text-[var(--el-text-color-secondary)]">统一维护书源站点、解析规则、访问策略和可审计采集任务。</p>
          </div>
          <div class="header-actions">
            <el-tag type="info">Java / Python / Go</el-tag>
            <el-button type="primary" icon="Plus" @click="openTaskDialog">新建采集任务</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="自动发现" name="discovery">
          <el-alert
            title="自动发现只读取已配置的公开索引或授权 Feed"
            description="系统会先拦截黑名单和内网地址，再检查 robots.txt 与基础连通性；候选必须人工审核后才能进入书源站点。不会扫描搜索引擎或随机探测互联网。"
            type="warning"
            show-icon
            :closable="false"
            class="mb-4"
          />
          <el-tabs v-model="discoveryTab" @tab-change="handleDiscoveryTabChange">
            <el-tab-pane label="发现源" name="providers">
              <div class="toolbar-row">
                <el-form :inline="true" :model="providerQuery" @submit.prevent>
                  <el-form-item label="发现源名称"><el-input v-model="providerQuery.providerName" clearable placeholder="搜索发现源" @keyup.enter="loadDiscoveryProviders" /></el-form-item>
                  <el-form-item label="状态"><el-select v-model="providerQuery.status" clearable placeholder="全部" style="width: 120px"><el-option label="启用" value="1" /><el-option label="停用" value="0" /></el-select></el-form-item>
                  <el-button type="primary" icon="Search" @click="loadDiscoveryProviders">查询</el-button>
                </el-form>
                <el-button type="primary" icon="Plus" @click="openProviderDialog()">新增发现源</el-button>
              </div>
              <el-table v-loading="loading.discoveryProviders" :data="discoveryProviders" border>
                <el-table-column label="发现源" min-width="220"><template #default="{ row }"><div class="primary-text">{{ row.providerName }}</div><div class="muted-text">{{ row.providerType }} · {{ row.providerUrl }}</div></template></el-table-column>
                <el-table-column label="授权说明" min-width="200" prop="authorizationNote" show-overflow-tooltip />
                <el-table-column label="轮询/间隔" width="150"><template #default="{ row }">{{ row.pollIntervalSeconds }}秒 / {{ row.requestIntervalMs }}ms</template></el-table-column>
                <el-table-column label="最近运行" width="150"><template #default="{ row }"><el-tag :type="providerRunTag(row.lastRunStatus)">{{ providerRunLabel(row.lastRunStatus) }}</el-tag><div class="muted-text">{{ row.lastRunAt || '尚未运行' }}</div></template></el-table-column>
                <el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '启用' : '停用' }}</el-tag></template></el-table-column>
                <el-table-column label="操作" fixed="right" width="240" align="center"><template #default="{ row }"><el-button link type="primary" @click="openProviderDialog(row)">编辑</el-button><el-button link type="success" :disabled="row.status !== '1'" @click="runDiscoveryProvider(row)">立即运行</el-button><el-button v-if="row.status !== '1'" link type="success" @click="toggleDiscoveryProvider(row, true)">启用</el-button><el-button v-else link type="danger" @click="toggleDiscoveryProvider(row, false)">停用</el-button></template></el-table-column>
              </el-table>
              <pagination v-show="providerTotal > 0" v-model:page="providerQuery.pageNum" v-model:limit="providerQuery.pageSize" :total="providerTotal" @pagination="loadDiscoveryProviders" />
            </el-tab-pane>
            <el-tab-pane label="黑名单" name="blacklist">
              <div class="toolbar-row"><el-form :inline="true" :model="blacklistQuery" @submit.prevent><el-form-item label="匹配类型"><el-select v-model="blacklistQuery.matcherType" clearable placeholder="全部" style="width: 120px"><el-option label="精确主机" value="HOST" /><el-option label="域名后缀" value="SUFFIX" /><el-option label="精确地址" value="URL" /></el-select></el-form-item><el-button type="primary" icon="Search" @click="loadDiscoveryBlacklist">查询</el-button></el-form><el-button type="primary" icon="Plus" @click="openBlacklistDialog()">新增黑名单</el-button></div>
              <el-table v-loading="loading.discoveryBlacklist" :data="discoveryBlacklist" border><el-table-column label="匹配类型" width="110"><template #default="{ row }">{{ matcherTypeLabel(row.matcherType) }}</template></el-table-column><el-table-column label="匹配值" min-width="260" prop="matcherValue" show-overflow-tooltip /><el-table-column label="原因" min-width="220" prop="reason" show-overflow-tooltip /><el-table-column label="来源" width="140" prop="source" /><el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === '1' ? 'danger' : 'info'">{{ row.status === '1' ? '拦截中' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" fixed="right" width="210" align="center"><template #default="{ row }"><el-button link type="primary" @click="openBlacklistDialog(row)">编辑</el-button><el-button v-if="row.status === '1'" link type="warning" @click="toggleBlacklist(row, false)">停用</el-button><el-button v-else link type="success" @click="toggleBlacklist(row, true)">启用</el-button><el-button link type="danger" @click="removeBlacklist(row)">删除</el-button></template></el-table-column></el-table>
              <pagination v-show="blacklistTotal > 0" v-model:page="blacklistQuery.pageNum" v-model:limit="blacklistQuery.pageSize" :total="blacklistTotal" @pagination="loadDiscoveryBlacklist" />
            </el-tab-pane>
            <el-tab-pane label="候选审核" name="candidates">
              <div class="toolbar-row"><el-form :inline="true" :model="candidateQuery" @submit.prevent><el-form-item label="审核状态"><el-select v-model="candidateQuery.discoveryStatus" clearable placeholder="全部" style="width: 140px"><el-option label="待审核" value="NEEDS_REVIEW" /><el-option label="已拦截" value="BLOCKED" /><el-option label="检查失败" value="CHECK_FAILED" /><el-option label="已通过" value="APPROVED" /><el-option label="已拒绝" value="REJECTED" /></el-select></el-form-item><el-form-item label="关键词"><el-input v-model="candidateQuery.keyword" clearable placeholder="地址或主机" @keyup.enter="loadDiscoveryCandidates" /></el-form-item><el-button type="primary" icon="Search" @click="loadDiscoveryCandidates">查询</el-button></el-form></div>
              <el-table v-loading="loading.discoveryCandidates" :data="discoveryCandidates" border><el-table-column label="候选地址" min-width="280"><template #default="{ row }"><div class="primary-text">{{ row.candidateName || row.candidateHost }}</div><div class="muted-text">{{ row.candidateUrl }}</div></template></el-table-column><el-table-column label="黑名单" width="90"><template #default="{ row }"><el-tag :type="row.blacklistStatus === 'MATCHED' ? 'danger' : 'success'">{{ row.blacklistStatus === 'MATCHED' ? '已命中' : '未命中' }}</el-tag></template></el-table-column><el-table-column label="robots" width="110"><template #default="{ row }"><el-tag :type="robotsTag(row.robotsStatus)">{{ robotsLabel(row.robotsStatus) }}</el-tag></template></el-table-column><el-table-column label="可用性" width="100"><template #default="{ row }"><el-tag :type="row.availabilityStatus === 'AVAILABLE' ? 'success' : 'info'">{{ row.availabilityStatus === 'AVAILABLE' ? '可访问' : '未通过' }}</el-tag></template></el-table-column><el-table-column label="审核状态" width="100"><template #default="{ row }"><el-tag :type="candidateTag(row.discoveryStatus)">{{ candidateLabel(row.discoveryStatus) }}</el-tag></template></el-table-column><el-table-column label="检查摘要" min-width="220" prop="checkMessage" show-overflow-tooltip /><el-table-column label="操作" fixed="right" width="220" align="center"><template #default="{ row }"><el-button v-if="!['APPROVED', 'REJECTED', 'BLOCKED'].includes(row.discoveryStatus)" link type="primary" @click="checkDiscoveryCandidate(row)">重新检查</el-button><el-button v-if="row.discoveryStatus === 'NEEDS_REVIEW'" link type="success" @click="approveDiscoveryCandidate(row)">审核通过</el-button><el-button v-if="!['APPROVED', 'REJECTED'].includes(row.discoveryStatus)" link type="danger" @click="rejectDiscoveryCandidate(row)">拒绝</el-button></template></el-table-column></el-table>
              <pagination v-show="candidateTotal > 0" v-model:page="candidateQuery.pageNum" v-model:limit="candidateQuery.pageSize" :total="candidateTotal" @pagination="loadDiscoveryCandidates" />
            </el-tab-pane>
            <el-tab-pane label="运行记录" name="discovery-runs">
              <el-table v-loading="loading.discoveryRuns" :data="discoveryRuns" border><el-table-column label="运行ID" prop="id" width="90" /><el-table-column label="发现源ID" prop="providerId" width="100" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'COMPLETED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="候选/拦截/可用/失败" min-width="170"><template #default="{ row }">{{ row.candidateCount }} / {{ row.blockedCount }} / {{ row.availableCount }} / {{ row.failedCount }}</template></el-table-column><el-table-column label="robots拒绝" width="100" prop="robotsDeniedCount" /><el-table-column label="开始时间" width="170" prop="startedAt" /><el-table-column label="错误摘要" min-width="220" prop="errorMessage" show-overflow-tooltip /></el-table>
              <pagination v-show="discoveryRunTotal > 0" v-model:page="discoveryRunQuery.pageNum" v-model:limit="discoveryRunQuery.pageSize" :total="discoveryRunTotal" @pagination="loadDiscoveryRuns" />
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        <el-tab-pane label="书源站点" name="sites">
          <div class="toolbar-row">
            <el-form :inline="true" :model="siteQuery" @submit.prevent>
              <el-form-item label="站点名称">
                <el-input v-model="siteQuery.siteName" clearable placeholder="搜索站点" @keyup.enter="loadSites" />
              </el-form-item>
              <el-form-item label="合规状态">
                <el-select v-model="siteQuery.complianceStatus" clearable placeholder="全部" style="width: 150px">
                  <el-option label="未确认" value="UNCONFIRMED" />
                  <el-option label="已确认" value="APPROVED" />
                  <el-option label="不允许" value="REJECTED" />
                </el-select>
              </el-form-item>
              <el-button type="primary" icon="Search" @click="loadSites">查询</el-button>
              <el-button icon="Refresh" @click="resetSiteQuery">重置</el-button>
            </el-form>
            <el-button icon="Plus" @click="openSiteDialog()">新增站点</el-button>
          </div>
          <el-table v-loading="loading.sites" :data="sites" border>
            <el-table-column label="站点" min-width="190">
              <template #default="{ row }">
                <div class="primary-text">{{ row.siteName }}</div>
                <div class="muted-text">{{ row.allowedHost }}</div>
              </template>
            </el-table-column>
            <el-table-column label="站点地址" prop="baseUrl" min-width="250" show-overflow-tooltip />
            <el-table-column label="合规" width="110">
              <template #default="{ row }"><el-tag :type="complianceTag(row.complianceStatus)">{{ complianceLabel(row.complianceStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="运行状态" width="100">
              <template #default="{ row }"><el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '已启用' : '已停用' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="策略ID" prop="defaultPolicyId" width="100" />
            <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="250" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="openSiteDialog(row)">编辑</el-button>
                <el-button link type="warning" @click="openComplianceDialog(row)">合规确认</el-button>
                <el-button v-if="row.status !== '1'" link type="success" :disabled="row.complianceStatus !== 'APPROVED'" @click="toggleSite(row, true)">启用</el-button>
                <el-button v-else link type="danger" @click="toggleSite(row, false)">停用</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="siteTotal > 0" v-model:page="siteQuery.pageNum" v-model:limit="siteQuery.pageSize" :total="siteTotal" @pagination="loadSites" />
        </el-tab-pane>

        <el-tab-pane label="限流策略" name="policies">
          <div class="toolbar-row">
            <el-form :inline="true" :model="policyQuery" @submit.prevent>
              <el-form-item label="策略名称"><el-input v-model="policyQuery.policyName" clearable placeholder="搜索策略" @keyup.enter="loadPolicies" /></el-form-item>
              <el-button type="primary" icon="Search" @click="loadPolicies">查询</el-button>
            </el-form>
            <el-button icon="Plus" @click="openPolicyDialog()">新增策略</el-button>
          </div>
          <el-table v-loading="loading.policies" :data="policies" border>
            <el-table-column label="策略名称" prop="policyName" min-width="160" />
            <el-table-column label="并发" prop="concurrencyLimit" width="70" />
            <el-table-column label="请求间隔" min-width="130"><template #default="{ row }">{{ row.minDelayMs }} - {{ row.maxDelayMs }} ms</template></el-table-column>
            <el-table-column label="频率上限" min-width="130"><template #default="{ row }">{{ row.requestsPerMinute }}/分钟 · {{ row.dailyRequestLimit }}/日</template></el-table-column>
            <el-table-column label="超时" min-width="140"><template #default="{ row }">{{ row.connectTimeoutMs }}/{{ row.readTimeoutMs }} ms</template></el-table-column>
            <el-table-column label="重试/熔断" min-width="125"><template #default="{ row }">{{ row.maxRetries }} 次 / {{ row.circuitBreakerThreshold }} 次</template></el-table-column>
            <el-table-column label="Retry-After" width="115"><template #default="{ row }">{{ row.honorRetryAfter === '1' ? '遵循' : '不遵循' }}</template></el-table-column>
            <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="80" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openPolicyDialog(row)">编辑</el-button></template></el-table-column>
          </el-table>
          <pagination v-show="policyTotal > 0" v-model:page="policyQuery.pageNum" v-model:limit="policyQuery.pageSize" :total="policyTotal" @pagination="loadPolicies" />
        </el-tab-pane>

        <el-tab-pane label="解析规则" name="rules">
          <div class="toolbar-row">
            <el-form :inline="true" :model="ruleQuery" @submit.prevent>
              <el-form-item label="所属站点"><el-select v-model="ruleQuery.siteId" clearable placeholder="全部站点" style="width: 190px" @change="loadRules"><el-option v-for="site in sites" :key="site.id" :label="site.siteName" :value="site.id" /></el-select></el-form-item>
              <el-form-item label="状态"><el-select v-model="ruleQuery.status" clearable placeholder="全部" style="width: 130px" @change="loadRules"><el-option label="草稿" value="0" /><el-option label="启用" value="1" /><el-option label="停用" value="2" /></el-select></el-form-item>
            </el-form>
            <el-button icon="Plus" @click="openRuleDialog()">新增规则</el-button>
          </div>
          <el-table v-loading="loading.rules" :data="rules" border>
            <el-table-column label="规则名称" prop="ruleName" min-width="170" />
            <el-table-column label="站点ID" prop="siteId" width="90" />
            <el-table-column label="版本" width="80"><template #default="{ row }">v{{ row.versionNo }}</template></el-table-column>
            <el-table-column label="地址模板" min-width="260"><template #default="{ row }"><div class="template-cell">{{ row.catalogUrlTemplate || row.detailUrlTemplate || '未配置' }}</div></template></el-table-column>
            <el-table-column label="选择器" min-width="230" show-overflow-tooltip><template #default="{ row }">{{ row.selectorJson }}</template></el-table-column>
            <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="ruleTag(row.status)">{{ ruleLabel(row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openRuleDialog(row)">编辑</el-button><el-button v-if="row.status !== '1'" link type="success" @click="toggleRule(row, true)">发布</el-button><el-button v-else link type="warning" @click="toggleRule(row, false)">停用</el-button></template></el-table-column>
          </el-table>
          <pagination v-show="ruleTotal > 0" v-model:page="ruleQuery.pageNum" v-model:limit="ruleQuery.pageSize" :total="ruleTotal" @pagination="loadRules" />
        </el-tab-pane>

        <el-tab-pane label="采集任务" name="tasks">
          <div class="toolbar-row">
            <el-form :inline="true" :model="taskQuery" @submit.prevent>
              <el-form-item label="任务名称"><el-input v-model="taskQuery.taskName" clearable placeholder="搜索任务" @keyup.enter="loadTasks" /></el-form-item>
              <el-form-item label="状态"><el-select v-model="taskQuery.status" clearable placeholder="全部" style="width: 140px" @change="loadTasks"><el-option v-for="item in taskStatuses" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
              <el-button type="primary" icon="Search" @click="loadTasks">查询</el-button>
            </el-form>
          </div>
          <el-table v-loading="loading.tasks" :data="tasks" border>
            <el-table-column label="任务" min-width="200"><template #default="{ row }"><div class="primary-text">{{ row.taskName }}</div><div class="muted-text">{{ row.sourceWorkTitle || row.sourceWorkUrl }}</div></template></el-table-column>
            <el-table-column label="执行器" width="100"><template #default="{ row }"><el-tag>{{ row.executorType }}</el-tag></template></el-table-column>
            <el-table-column label="范围" width="135"><template #default="{ row }">{{ row.startChapterNo || 1 }} - {{ row.endChapterNo || '最新' }}</template></el-table-column>
            <el-table-column label="游标" width="90" prop="currentChapterNo" />
            <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="taskTag(row.status)">{{ taskLabel(row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="最近运行" prop="lastRunAt" min-width="170" />
            <el-table-column label="失败原因" prop="failReason" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="365" align="center">
              <template #default="{ row }">
                <el-button v-if="['DRAFT', 'READY'].includes(row.status)" link type="success" @click="operateTask(row, 'start')">启动</el-button>
                <el-button v-if="row.status === 'PAUSED'" link type="success" @click="operateTask(row, 'resume')">恢复</el-button>
                <el-button v-if="row.status === 'RUNNING'" link type="warning" @click="operateTask(row, 'pause')">暂停</el-button>
                <el-button v-if="!['CANCELED', 'COMPLETED'].includes(row.status)" link type="danger" @click="operateTask(row, 'cancel')">取消</el-button>
                <el-button link type="primary" @click="openRuns(row)">运行记录</el-button>
                <el-button link type="warning" @click="openDiffs(row)">章节差异</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="taskTotal > 0" v-model:page="taskQuery.pageNum" v-model:limit="taskQuery.pageSize" :total="taskTotal" @pagination="loadTasks" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="providerDialog.visible" :title="providerDialog.editing ? '编辑发现源' : '新增发现源'" width="650px" append-to-body>
      <el-alert title="请填写你有权使用的公开索引、订阅 Feed 或授权目录，不要填写搜索引擎结果页或未知站点地址。" type="info" :closable="false" class="mb-4" />
      <el-form label-width="125px">
        <el-form-item label="发现源名称"><el-input v-model="providerDialog.form.providerName" maxlength="128" /></el-form-item>
        <el-form-item label="Feed 地址"><el-input v-model="providerDialog.form.providerUrl" placeholder="https://example.org/public-sources.txt" /></el-form-item>
        <el-form-item label="内容类型"><el-select v-model="providerDialog.form.providerType" style="width: 180px"><el-option label="纯文本" value="TEXT" /><el-option label="JSON" value="JSON" /><el-option label="RSS/XML" value="RSS" /></el-select></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="轮询间隔(秒)"><el-input-number v-model="providerDialog.form.pollIntervalSeconds" :min="900" :max="604800" /></el-form-item></el-col><el-col :span="12"><el-form-item label="检查间隔(ms)"><el-input-number v-model="providerDialog.form.requestIntervalMs" :min="1000" :max="600000" /></el-form-item></el-col></el-row>
        <el-form-item label="单次候选上限"><el-input-number v-model="providerDialog.form.maxCandidates" :min="1" :max="100" /></el-form-item>
        <el-form-item label="授权说明"><el-input v-model="providerDialog.form.authorizationNote" type="textarea" :rows="4" maxlength="1000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button @click="providerDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitProvider">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="blacklistDialog.visible" :title="blacklistDialog.editing ? '编辑黑名单' : '新增黑名单'" width="560px" append-to-body>
      <el-alert title="黑名单命中后不会访问对应地址。域名后缀匹配会覆盖该域名及其子域名。" type="warning" :closable="false" class="mb-4" />
      <el-form label-width="110px">
        <el-form-item label="匹配类型"><el-select v-model="blacklistDialog.form.matcherType" style="width: 180px"><el-option label="精确主机" value="HOST" /><el-option label="域名后缀" value="SUFFIX" /><el-option label="精确地址" value="URL" /></el-select></el-form-item>
        <el-form-item label="匹配值"><el-input v-model="blacklistDialog.form.matcherValue" placeholder="例如 official.example.com" /></el-form-item>
        <el-form-item label="拦截原因"><el-input v-model="blacklistDialog.form.reason" type="textarea" :rows="3" maxlength="500" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="blacklistDialog.form.source" maxlength="128" placeholder="例如 官方网站、版权方通知" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="blacklistDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitBlacklist">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="siteDialog.visible" :title="siteDialog.editing ? '编辑书源站点' : '新增书源站点'" width="560px" append-to-body>
      <el-form ref="siteFormRef" :model="siteDialog.form" :rules="siteRules" label-width="105px">
        <el-form-item label="站点名称" prop="siteName"><el-input v-model="siteDialog.form.siteName" maxlength="128" /></el-form-item>
        <el-form-item label="站点根地址" prop="baseUrl"><el-input v-model="siteDialog.form.baseUrl" placeholder="https://example.com" /></el-form-item>
        <el-form-item label="允许主机" prop="allowedHost"><el-input v-model="siteDialog.form.allowedHost" placeholder="默认取站点地址主机" /></el-form-item>
        <el-form-item label="默认策略"><el-select v-model="siteDialog.form.defaultPolicyId" clearable placeholder="可选，创建任务时可覆盖" style="width: 100%"><el-option v-for="policy in policies" :key="policy.id" :label="`${policy.policyName} (#${policy.id})`" :value="policy.id" /></el-select></el-form-item>
        <el-form-item label="授权说明"><el-input v-model="siteDialog.form.authorizationNote" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
        <el-form-item label="备注"><el-input v-model="siteDialog.form.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button @click="siteDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitSite">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="complianceDialog.visible" title="站点合规确认" width="520px" append-to-body>
      <el-alert title="请仅确认你有权采集、且站点条款或 robots.txt 未禁止的公开内容。" type="warning" :closable="false" class="mb-4" />
      <el-form label-width="90px"><el-form-item label="站点"><span>{{ complianceDialog.site?.siteName }}</span></el-form-item><el-form-item label="确认结果"><el-radio-group v-model="complianceDialog.approved"><el-radio :value="true">允许采集</el-radio><el-radio :value="false">不允许采集</el-radio></el-radio-group></el-form-item><el-form-item label="确认说明"><el-input v-model="complianceDialog.note" type="textarea" :rows="4" maxlength="1000" show-word-limit /></el-form-item></el-form>
      <template #footer><el-button @click="complianceDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitCompliance">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="policyDialog.visible" :title="policyDialog.editing ? '编辑限流策略' : '新增限流策略'" width="720px" append-to-body>
      <el-form ref="policyFormRef" :model="policyDialog.form" :rules="policyRules" label-width="130px">
        <el-form-item label="策略名称" prop="policyName"><el-input v-model="policyDialog.form.policyName" /></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="单站点并发" prop="concurrencyLimit"><el-input-number v-model="policyDialog.form.concurrencyLimit" :min="1" :max="32" /></el-form-item></el-col><el-col :span="12"><el-form-item label="每分钟请求" prop="requestsPerMinute"><el-input-number v-model="policyDialog.form.requestsPerMinute" :min="1" :max="600" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="最小间隔(ms)" prop="minDelayMs"><el-input-number v-model="policyDialog.form.minDelayMs" :min="1000" /></el-form-item></el-col><el-col :span="12"><el-form-item label="最大间隔(ms)" prop="maxDelayMs"><el-input-number v-model="policyDialog.form.maxDelayMs" :min="1000" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="每日请求上限" prop="dailyRequestLimit"><el-input-number v-model="policyDialog.form.dailyRequestLimit" :min="1" /></el-form-item></el-col><el-col :span="12"><el-form-item label="最大重试次数" prop="maxRetries"><el-input-number v-model="policyDialog.form.maxRetries" :min="0" :max="5" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="连接超时(ms)" prop="connectTimeoutMs"><el-input-number v-model="policyDialog.form.connectTimeoutMs" :min="1000" /></el-form-item></el-col><el-col :span="12"><el-form-item label="读取超时(ms)" prop="readTimeoutMs"><el-input-number v-model="policyDialog.form.readTimeoutMs" :min="1000" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="连续失败熔断" prop="circuitBreakerThreshold"><el-input-number v-model="policyDialog.form.circuitBreakerThreshold" :min="1" /></el-form-item></el-col><el-col :span="12"><el-form-item label="遵循 Retry-After"><el-switch v-model="policyDialog.form.honorRetryAfter" active-value="1" inactive-value="0" /></el-form-item></el-col></el-row>
        <el-form-item label="备注"><el-input v-model="policyDialog.form.remark" type="textarea" :rows="2" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="policyDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitPolicy">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="ruleDialog.visible" :title="ruleDialog.editing ? '编辑解析规则' : '新增解析规则'" width="760px" append-to-body>
      <el-form ref="ruleFormRef" :model="ruleDialog.form" :rules="ruleRules" label-width="125px">
        <el-form-item label="所属站点" prop="siteId"><el-select v-model="ruleDialog.form.siteId" placeholder="请选择站点" style="width: 100%"><el-option v-for="site in sites" :key="site.id" :label="site.siteName" :value="site.id" /></el-select></el-form-item>
        <el-form-item label="规则名称" prop="ruleName"><el-input v-model="ruleDialog.form.ruleName" /></el-form-item>
        <el-form-item label="目录地址模板"><el-input v-model="ruleDialog.form.catalogUrlTemplate" placeholder="https://example.com/book/{id}" /></el-form-item>
        <el-form-item label="章节地址模板"><el-input v-model="ruleDialog.form.chapterUrlTemplate" placeholder="https://example.com/chapter/{id}" /></el-form-item>
        <el-form-item label="选择器 JSON" prop="selectorJson"><el-input v-model="ruleDialog.form.selectorJson" type="textarea" :rows="8" placeholder="只允许 CSS/XPath/JSONPath 声明，不允许脚本" /></el-form-item>
        <el-form-item label="测试地址"><el-input v-model="ruleDialog.form.testUrl" placeholder="可选，仅用于后续低频规则测试" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="ruleDialog.form.remark" type="textarea" :rows="2" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="ruleDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitRule">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="taskDialog.visible" title="新建采集任务" width="650px" append-to-body>
      <el-form ref="taskFormRef" :model="taskDialog.form" :rules="taskRules" label-width="115px">
        <el-form-item label="任务名称" prop="taskName"><el-input v-model="taskDialog.form.taskName" maxlength="255" /></el-form-item>
        <el-form-item label="站点" prop="siteId"><el-select v-model="taskDialog.form.siteId" placeholder="先选择已启用站点" style="width: 100%" @change="handleTaskSiteChange"><el-option v-for="site in enabledSites" :key="site.id" :label="site.siteName" :value="site.id" /></el-select></el-form-item>
        <el-form-item label="解析规则" prop="ruleId"><el-select v-model="taskDialog.form.ruleId" placeholder="选择已启用规则" style="width: 100%"><el-option v-for="rule in taskRulesOptions" :key="rule.id" :label="`${rule.ruleName} v${rule.versionNo}`" :value="rule.id" /></el-select></el-form-item>
        <el-form-item label="访问策略" prop="policyId"><el-select v-model="taskDialog.form.policyId" clearable placeholder="不填则使用站点默认策略" style="width: 100%"><el-option v-for="policy in activePolicies" :key="policy.id" :label="`${policy.policyName} (#${policy.id})`" :value="policy.id" /></el-select></el-form-item>
        <el-form-item label="执行器" prop="executorType"><el-radio-group v-model="taskDialog.form.executorType"><el-radio value="JAVA">Java</el-radio><el-radio value="PYTHON">Python</el-radio><el-radio value="GO">Go</el-radio></el-radio-group></el-form-item>
        <el-form-item label="作品地址" prop="sourceWorkUrl"><el-input v-model="taskDialog.form.sourceWorkUrl" placeholder="必须属于已允许站点主机" /></el-form-item>
        <el-form-item label="作品标题"><el-input v-model="taskDialog.form.sourceWorkTitle" /></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="起始章节"><el-input-number v-model="taskDialog.form.startChapterNo" :min="1" /></el-form-item></el-col><el-col :span="12"><el-form-item label="结束章节"><el-input-number v-model="taskDialog.form.endChapterNo" :min="1" /></el-form-item></el-col></el-row>
        <el-form-item label="增量采集"><el-switch v-model="taskDialog.form.incremental" active-value="1" inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="taskDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitTask">创建</el-button></template>
    </el-dialog>

    <el-drawer v-model="runsDialog.visible" :title="`任务 #${runsDialog.task?.id || ''} 运行详情`" size="860px">
      <el-tabs v-model="runsDialog.tab" @tab-change="handleRunsTabChange">
        <el-tab-pane label="运行记录" name="runs">
          <el-table v-loading="loading.runs" :data="runs" border>
            <el-table-column label="运行ID" prop="id" width="90" />
            <el-table-column label="执行器" prop="executorType" width="90" />
            <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="taskTag(row.status)">{{ taskLabel(row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="请求/成功/失败" min-width="140"><template #default="{ row }">{{ row.requestCount }} / {{ row.successCount }} / {{ row.failureCount }}</template></el-table-column>
            <el-table-column label="429" prop="tooManyRequestsCount" width="70" />
            <el-table-column label="心跳" prop="heartbeatAt" min-width="170" />
            <el-table-column label="错误摘要" prop="errorMessage" min-width="180" show-overflow-tooltip />
          </el-table>
          <pagination v-show="runTotal > 0" v-model:page="runQuery.pageNum" v-model:limit="runQuery.pageSize" :total="runTotal" @pagination="loadRuns" />
        </el-tab-pane>
        <el-tab-pane label="章节差异" name="diffs">
          <el-table v-loading="loading.diffs" :data="snapshots" border>
            <el-table-column label="章节" min-width="180"><template #default="{ row }">{{ row.chapterNo || '-' }} · {{ row.chapterName || row.sourceChapterId }}</template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.snapshotStatus === 'CHANGED' ? 'warning' : row.snapshotStatus === 'CONFIRMED' ? 'success' : 'info'">{{ row.snapshotStatus }}</el-tag></template></el-table-column>
            <el-table-column label="正文哈希" min-width="180" show-overflow-tooltip prop="contentHash" />
            <el-table-column label="采集时间" min-width="170" prop="capturedAt" />
            <el-table-column label="正文预览" min-width="240" show-overflow-tooltip prop="content" />
          </el-table>
          <pagination v-show="snapshotTotal > 0" v-model:page="diffQuery.pageNum" v-model:limit="diffQuery.pageSize" :total="snapshotTotal" @pagination="loadDiffs" />
        </el-tab-pane>
        <el-tab-pane label="错误记录" name="errors">
          <el-table v-loading="loading.errors" :data="errors" border>
            <el-table-column label="类型" width="100" prop="errorType" />
            <el-table-column label="HTTP" width="70" prop="httpStatus" />
            <el-table-column label="错误摘要" min-width="260" show-overflow-tooltip prop="message" />
            <el-table-column label="重试时间" min-width="170" prop="retryAt" />
            <el-table-column label="状态" width="90"><template #default="{ row }">{{ row.resolved === '1' ? '已处理' : '待处理' }}</template></el-table-column>
          </el-table>
          <pagination v-show="errorTotal > 0" v-model:page="errorQuery.pageNum" v-model:limit="errorQuery.pageSize" :total="errorTotal" @pagination="loadErrors" />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import {
  cancelReaderSourceTask,
  checkReaderSourceCompliance,
  createReaderSourcePolicy,
  createReaderSourceRule,
  createReaderSourceSite,
  createReaderSourceTask,
  createReaderSourceDiscoveryBlacklist,
  createReaderSourceDiscoveryProvider,
  approveReaderSourceDiscoveryCandidate,
  checkReaderSourceDiscoveryCandidate,
  deleteReaderSourceDiscoveryBlacklist,
  disableReaderSourceDiscoveryBlacklist,
  disableReaderSourceDiscoveryProvider,
  enableReaderSourceDiscoveryBlacklist,
  enableReaderSourceDiscoveryProvider,
  disableReaderSourceSite,
  disableReaderSourceRule,
  enableReaderSourceSite,
  listReaderSourcePolicies,
  listReaderSourceRules,
  listReaderSourceSites,
  listReaderSourceTaskDiffs,
  listReaderSourceTaskErrors,
  listReaderSourceTaskRuns,
  listReaderSourceTasks,
  listReaderSourceDiscoveryBlacklist,
  listReaderSourceDiscoveryCandidates,
  listReaderSourceDiscoveryProviders,
  listReaderSourceDiscoveryRuns,
  pauseReaderSourceTask,
  publishReaderSourceRule,
  rejectReaderSourceDiscoveryCandidate,
  resumeReaderSourceTask,
  startReaderSourceTask,
  runReaderSourceDiscoveryProvider,
  updateReaderSourcePolicy,
  updateReaderSourceRule,
  updateReaderSourceSite,
  updateReaderSourceDiscoveryBlacklist,
  updateReaderSourceDiscoveryProvider
} from '@/api/reader/admin';
import type {
  ReaderSourcePolicy,
  ReaderSourcePolicyForm,
  ReaderSourceRule,
  ReaderSourceRuleForm,
  ReaderSourceSite,
  ReaderSourceSiteForm,
  ReaderSourceTask,
  ReaderSourceTaskForm,
  ReaderSourceTaskRun,
  ReaderSourceChapterSnapshot,
  ReaderSourceError,
  ReaderSourceDiscoveryProvider,
  ReaderSourceDiscoveryProviderForm,
  ReaderSourceDiscoveryBlacklist,
  ReaderSourceDiscoveryBlacklistForm,
  ReaderSourceDiscoveryCandidate,
  ReaderSourceDiscoveryRun
} from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminSourceCenterPage' });

const activeTab = ref('sites');
const discoveryTab = ref('providers');
const submitting = ref(false);
const loading = reactive({ sites: false, policies: false, rules: false, tasks: false, runs: false, diffs: false, errors: false, discoveryProviders: false, discoveryBlacklist: false, discoveryCandidates: false, discoveryRuns: false });
const sites = ref<ReaderSourceSite[]>([]);
const policies = ref<ReaderSourcePolicy[]>([]);
const rules = ref<ReaderSourceRule[]>([]);
const tasks = ref<ReaderSourceTask[]>([]);
const runs = ref<ReaderSourceTaskRun[]>([]);
const snapshots = ref<ReaderSourceChapterSnapshot[]>([]);
const errors = ref<ReaderSourceError[]>([]);
const discoveryProviders = ref<ReaderSourceDiscoveryProvider[]>([]);
const discoveryBlacklist = ref<ReaderSourceDiscoveryBlacklist[]>([]);
const discoveryCandidates = ref<ReaderSourceDiscoveryCandidate[]>([]);
const discoveryRuns = ref<ReaderSourceDiscoveryRun[]>([]);
const siteTotal = ref(0);
const policyTotal = ref(0);
const ruleTotal = ref(0);
const taskTotal = ref(0);
const runTotal = ref(0);
const snapshotTotal = ref(0);
const errorTotal = ref(0);
const providerTotal = ref(0);
const blacklistTotal = ref(0);
const candidateTotal = ref(0);
const discoveryRunTotal = ref(0);
const siteQuery = reactive({ pageNum: 1, pageSize: 10, siteName: '', complianceStatus: '' });
const policyQuery = reactive({ pageNum: 1, pageSize: 10, policyName: '' });
const ruleQuery = reactive<{ pageNum: number; pageSize: number; siteId?: string | number; status: string }>({ pageNum: 1, pageSize: 10, siteId: undefined, status: '' });
const taskQuery = reactive({ pageNum: 1, pageSize: 10, taskName: '', status: '' });
const runQuery = reactive({ pageNum: 1, pageSize: 10 });
const diffQuery = reactive({ pageNum: 1, pageSize: 10 });
const errorQuery = reactive({ pageNum: 1, pageSize: 10 });
const providerQuery = reactive({ pageNum: 1, pageSize: 10, providerName: '', status: '' });
const blacklistQuery = reactive({ pageNum: 1, pageSize: 10, matcherType: '' });
const candidateQuery = reactive({ pageNum: 1, pageSize: 10, discoveryStatus: '', candidateHost: '', keyword: '' });
const discoveryRunQuery = reactive({ pageNum: 1, pageSize: 10, providerId: undefined as string | number | undefined });

const blankSite = (): ReaderSourceSiteForm => ({ siteName: '', baseUrl: '', allowedHost: '', authorizationNote: '', defaultPolicyId: undefined, remark: '' });
const blankPolicy = (): ReaderSourcePolicyForm => ({ policyName: '', concurrencyLimit: 1, minDelayMs: 3000, maxDelayMs: 8000, requestsPerMinute: 10, dailyRequestLimit: 1000, connectTimeoutMs: 10000, readTimeoutMs: 20000, maxRetries: 2, circuitBreakerThreshold: 5, honorRetryAfter: '1', remark: '' });
const blankRule = (): ReaderSourceRuleForm => ({ siteId: '', ruleName: '', catalogUrlTemplate: '', chapterUrlTemplate: '', selectorJson: '{\n  "catalog": { "item": ".chapter-item", "title": ".chapter-title" },\n  "chapter": { "title": "h1", "content": ".content" }\n}', testUrl: '', remark: '' });
const blankTask = (): ReaderSourceTaskForm => ({ taskName: '', siteId: undefined, ruleId: undefined, policyId: undefined, executorType: 'JAVA', sourceWorkUrl: '', sourceWorkTitle: '', startChapterNo: 1, endChapterNo: undefined, incremental: '1' });
const blankProvider = (): ReaderSourceDiscoveryProviderForm => ({ providerName: '', providerUrl: '', providerType: 'TEXT', authorizationNote: '', pollIntervalSeconds: 3600, requestIntervalMs: 3000, maxCandidates: 20 });
const blankBlacklist = (): ReaderSourceDiscoveryBlacklistForm => ({ matcherType: 'HOST', matcherValue: '', reason: '', source: '' });
const siteDialog = reactive({ visible: false, editing: false, form: blankSite() });
const policyDialog = reactive({ visible: false, editing: false, form: blankPolicy() });
const ruleDialog = reactive({ visible: false, editing: false, form: blankRule() });
const taskDialog = reactive({ visible: false, form: blankTask() });
const providerDialog = reactive({ visible: false, editing: false, form: blankProvider() });
const blacklistDialog = reactive({ visible: false, editing: false, form: blankBlacklist() });
const complianceDialog = reactive<{ visible: boolean; approved: boolean; note: string; site?: ReaderSourceSite }>({ visible: false, approved: true, note: '', site: undefined });
const runsDialog = reactive<{ visible: boolean; tab: string; task?: ReaderSourceTask }>({ visible: false, tab: 'runs', task: undefined });
const siteFormRef = ref<FormInstance>();
const policyFormRef = ref<FormInstance>();
const ruleFormRef = ref<FormInstance>();
const taskFormRef = ref<FormInstance>();
const enabledSites = computed(() => sites.value.filter(item => item.status === '1' && item.complianceStatus === 'APPROVED'));
const activePolicies = computed(() => policies.value.filter(item => item.status === '1'));
const taskRulesOptions = ref<ReaderSourceRule[]>([]);
const taskStatuses = [{ label: '草稿', value: 'DRAFT' }, { label: '准备中', value: 'READY' }, { label: '运行中', value: 'RUNNING' }, { label: '已暂停', value: 'PAUSED' }, { label: '待审核', value: 'WAITING_REVIEW' }, { label: '已完成', value: 'COMPLETED' }, { label: '失败', value: 'FAILED' }, { label: '已取消', value: 'CANCELED' }];
const siteRules = { siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }], baseUrl: [{ required: true, message: '请输入站点根地址', trigger: 'blur' }] };
const policyRules = { policyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }] };
const ruleRules = { siteId: [{ required: true, message: '请选择站点', trigger: 'change' }], ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }], selectorJson: [{ required: true, message: '请输入选择器 JSON', trigger: 'blur' }] };
const taskRules = { taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }], siteId: [{ required: true, message: '请选择站点', trigger: 'change' }], ruleId: [{ required: true, message: '请选择规则', trigger: 'change' }], sourceWorkUrl: [{ required: true, message: '请输入作品地址', trigger: 'blur' }] };

const unwrap = <T,>(data: { rows?: T[]; total?: number } | undefined) => ({ rows: data?.rows ?? [], total: Number(data?.total ?? 0) });
const loadSites = async () => { loading.sites = true; try { const { data } = await listReaderSourceSites(siteQuery); const result = unwrap(data); sites.value = result.rows; siteTotal.value = result.total; } finally { loading.sites = false; } };
const loadPolicies = async () => { loading.policies = true; try { const { data } = await listReaderSourcePolicies(policyQuery); const result = unwrap(data); policies.value = result.rows; policyTotal.value = result.total; } finally { loading.policies = false; } };
const loadRules = async () => { loading.rules = true; try { const { data } = await listReaderSourceRules(ruleQuery); const result = unwrap(data); rules.value = result.rows; ruleTotal.value = result.total; } finally { loading.rules = false; } };
const loadTasks = async () => { loading.tasks = true; try { const { data } = await listReaderSourceTasks(taskQuery); const result = unwrap(data); tasks.value = result.rows; taskTotal.value = result.total; } finally { loading.tasks = false; } };
const loadRuns = async () => { if (!runsDialog.task) return; loading.runs = true; try { const { data } = await listReaderSourceTaskRuns(runsDialog.task.id, runQuery); const result = unwrap(data); runs.value = result.rows; runTotal.value = result.total; } finally { loading.runs = false; } };
const loadDiffs = async () => { if (!runsDialog.task) return; loading.diffs = true; try { const { data } = await listReaderSourceTaskDiffs(runsDialog.task.id, diffQuery); const result = unwrap(data); snapshots.value = result.rows; snapshotTotal.value = result.total; } finally { loading.diffs = false; } };
const loadErrors = async () => { if (!runsDialog.task) return; loading.errors = true; try { const { data } = await listReaderSourceTaskErrors(runsDialog.task.id, errorQuery); const result = unwrap(data); errors.value = result.rows; errorTotal.value = result.total; } finally { loading.errors = false; } };
const loadDiscoveryProviders = async () => { loading.discoveryProviders = true; try { const { data } = await listReaderSourceDiscoveryProviders(providerQuery); const result = unwrap(data); discoveryProviders.value = result.rows; providerTotal.value = result.total; } finally { loading.discoveryProviders = false; } };
const loadDiscoveryBlacklist = async () => { loading.discoveryBlacklist = true; try { const { data } = await listReaderSourceDiscoveryBlacklist(blacklistQuery); const result = unwrap(data); discoveryBlacklist.value = result.rows; blacklistTotal.value = result.total; } finally { loading.discoveryBlacklist = false; } };
const loadDiscoveryCandidates = async () => { loading.discoveryCandidates = true; try { const { data } = await listReaderSourceDiscoveryCandidates(candidateQuery); const result = unwrap(data); discoveryCandidates.value = result.rows; candidateTotal.value = result.total; } finally { loading.discoveryCandidates = false; } };
const loadDiscoveryRuns = async () => { loading.discoveryRuns = true; try { const { data } = await listReaderSourceDiscoveryRuns(discoveryRunQuery); const result = unwrap(data); discoveryRuns.value = result.rows; discoveryRunTotal.value = result.total; } finally { loading.discoveryRuns = false; } };
const handleTabChange = (name: string | number) => { if (name === 'discovery') loadDiscoveryProviders(); if (name === 'policies' && !policies.value.length) loadPolicies(); if (name === 'rules') loadRules(); if (name === 'tasks') loadTasks(); };
const handleDiscoveryTabChange = (name: string | number) => { if (name === 'providers') loadDiscoveryProviders(); if (name === 'blacklist') loadDiscoveryBlacklist(); if (name === 'candidates') loadDiscoveryCandidates(); if (name === 'discovery-runs') loadDiscoveryRuns(); };
const resetSiteQuery = () => { siteQuery.pageNum = 1; siteQuery.siteName = ''; siteQuery.complianceStatus = ''; loadSites(); };

const openSiteDialog = (row?: ReaderSourceSite) => { siteDialog.editing = !!row; siteDialog.form = row ? { ...row } : blankSite(); siteDialog.visible = true; };
const openPolicyDialog = (row?: ReaderSourcePolicy) => { policyDialog.editing = !!row; policyDialog.form = row ? { ...row } : blankPolicy(); policyDialog.visible = true; };
const openRuleDialog = (row?: ReaderSourceRule) => { ruleDialog.editing = !!row; ruleDialog.form = row ? { ...row } : blankRule(); ruleDialog.visible = true; };
const openTaskDialog = () => { taskDialog.form = blankTask(); taskRulesOptions.value = []; taskDialog.visible = true; };
const openProviderDialog = (row?: ReaderSourceDiscoveryProvider) => { providerDialog.editing = !!row; providerDialog.form = row ? { ...row } : blankProvider(); providerDialog.visible = true; };
const openBlacklistDialog = (row?: ReaderSourceDiscoveryBlacklist) => { blacklistDialog.editing = !!row; blacklistDialog.form = row ? { ...row } : blankBlacklist(); blacklistDialog.visible = true; };
const openComplianceDialog = (site: ReaderSourceSite) => { complianceDialog.site = site; complianceDialog.approved = site.complianceStatus !== 'REJECTED'; complianceDialog.note = site.authorizationNote || ''; complianceDialog.visible = true; };
const openRuns = (task: ReaderSourceTask) => { runsDialog.task = task; runsDialog.tab = 'runs'; runQuery.pageNum = 1; runsDialog.visible = true; loadRuns(); };
const openDiffs = (task: ReaderSourceTask) => { runsDialog.task = task; runsDialog.tab = 'diffs'; diffQuery.pageNum = 1; runsDialog.visible = true; loadDiffs(); };
const handleRunsTabChange = (name: string | number) => { if (name === 'runs') loadRuns(); if (name === 'diffs') loadDiffs(); if (name === 'errors') loadErrors(); };

const submitSite = async () => { if (!(await siteFormRef.value?.validate())) return; submitting.value = true; try { if (siteDialog.editing && siteDialog.form.id) await updateReaderSourceSite(siteDialog.form.id, siteDialog.form); else await createReaderSourceSite(siteDialog.form); ElMessage.success('站点已保存，需通过合规确认后才能启用'); siteDialog.visible = false; await loadSites(); } finally { submitting.value = false; } };
const submitPolicy = async () => { if (!(await policyFormRef.value?.validate())) return; submitting.value = true; try { if (policyDialog.editing && policyDialog.form.id) await updateReaderSourcePolicy(policyDialog.form.id, policyDialog.form); else await createReaderSourcePolicy(policyDialog.form); ElMessage.success('访问策略已保存'); policyDialog.visible = false; await loadPolicies(); } finally { submitting.value = false; } };
const submitRule = async () => { if (!(await ruleFormRef.value?.validate())) return; submitting.value = true; try { if (ruleDialog.editing && ruleDialog.form.id) await updateReaderSourceRule(ruleDialog.form.id, ruleDialog.form); else await createReaderSourceRule(ruleDialog.form); ElMessage.success('解析规则已保存为草稿'); ruleDialog.visible = false; await loadRules(); } finally { submitting.value = false; } };
const submitCompliance = async () => { if (!complianceDialog.site) return; submitting.value = true; try { await checkReaderSourceCompliance(complianceDialog.site.id, { approved: complianceDialog.approved, authorizationNote: complianceDialog.note }); ElMessage.success('合规确认已记录'); complianceDialog.visible = false; await loadSites(); } finally { submitting.value = false; } };
const submitTask = async () => { if (!(await taskFormRef.value?.validate())) return; submitting.value = true; try { await createReaderSourceTask(taskDialog.form); ElMessage.success('采集任务已创建，请从任务列表启动'); taskDialog.visible = false; activeTab.value = 'tasks'; await loadTasks(); } finally { submitting.value = false; } };
const submitProvider = async () => { if (!providerDialog.form.providerName || !providerDialog.form.providerUrl || !providerDialog.form.authorizationNote) { ElMessage.warning('发现源名称、地址和授权说明不能为空'); return; } submitting.value = true; try { if (providerDialog.editing && providerDialog.form.id) await updateReaderSourceDiscoveryProvider(providerDialog.form.id, providerDialog.form); else await createReaderSourceDiscoveryProvider(providerDialog.form); ElMessage.success('发现源已保存，启用后会按轮询时间自动运行'); providerDialog.visible = false; await loadDiscoveryProviders(); } finally { submitting.value = false; } };
const submitBlacklist = async () => { if (!blacklistDialog.form.matcherValue || !blacklistDialog.form.reason) { ElMessage.warning('匹配值和拦截原因不能为空'); return; } submitting.value = true; try { if (blacklistDialog.editing && blacklistDialog.form.id) await updateReaderSourceDiscoveryBlacklist(blacklistDialog.form.id, blacklistDialog.form); else await createReaderSourceDiscoveryBlacklist(blacklistDialog.form); ElMessage.success('黑名单已保存，后续发现请求会优先拦截'); blacklistDialog.visible = false; await loadDiscoveryBlacklist(); } finally { submitting.value = false; } };
const toggleSite = async (row: ReaderSourceSite, enabled: boolean) => { await (enabled ? enableReaderSourceSite(row.id) : disableReaderSourceSite(row.id)); ElMessage.success(enabled ? '站点已启用' : '站点已停用'); loadSites(); };
const toggleRule = async (row: ReaderSourceRule, enabled: boolean) => { await (enabled ? publishReaderSourceRule(row.id) : disableReaderSourceRule(row.id)); ElMessage.success(enabled ? '解析规则已发布' : '解析规则已停用'); loadRules(); };
const operateTask = async (row: ReaderSourceTask, action: 'start' | 'pause' | 'resume' | 'cancel') => { await ElMessageBox.confirm(`确认${action === 'start' ? '启动' : action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '取消'}任务“${row.taskName}”吗？`, '任务操作', { type: action === 'cancel' ? 'warning' : 'info' }); if (action === 'start') await startReaderSourceTask(row.id); if (action === 'pause') await pauseReaderSourceTask(row.id); if (action === 'resume') await resumeReaderSourceTask(row.id); if (action === 'cancel') await cancelReaderSourceTask(row.id); ElMessage.success('任务状态已更新'); loadTasks(); };
const runDiscoveryProvider = async (row: ReaderSourceDiscoveryProvider) => { await ElMessageBox.confirm('运行会读取配置的公开 Feed，并按间隔检查新候选地址，是否继续？', '运行发现源', { type: 'warning' }); submitting.value = true; try { await runReaderSourceDiscoveryProvider(row.id); ElMessage.success('发现源运行完成，候选已进入审核列表'); await Promise.all([loadDiscoveryProviders(), loadDiscoveryCandidates()]); } finally { submitting.value = false; } };
const toggleDiscoveryProvider = async (row: ReaderSourceDiscoveryProvider, enabled: boolean) => { await (enabled ? enableReaderSourceDiscoveryProvider(row.id) : disableReaderSourceDiscoveryProvider(row.id)); ElMessage.success(enabled ? '发现源已启用' : '发现源已停用'); await loadDiscoveryProviders(); };
const toggleBlacklist = async (row: ReaderSourceDiscoveryBlacklist, enabled: boolean) => { await (enabled ? enableReaderSourceDiscoveryBlacklist(row.id) : disableReaderSourceDiscoveryBlacklist(row.id)); ElMessage.success(enabled ? '黑名单已启用' : '黑名单已停用'); await loadDiscoveryBlacklist(); };
const removeBlacklist = async (row: ReaderSourceDiscoveryBlacklist) => { await ElMessageBox.confirm(`确认删除黑名单“${row.matcherValue}”吗？`, '删除确认', { type: 'warning' }); await deleteReaderSourceDiscoveryBlacklist(row.id); ElMessage.success('黑名单已删除'); await loadDiscoveryBlacklist(); };
const checkDiscoveryCandidate = async (row: ReaderSourceDiscoveryCandidate) => { submitting.value = true; try { await checkReaderSourceDiscoveryCandidate(row.id); ElMessage.success('候选地址检查完成'); await loadDiscoveryCandidates(); } finally { submitting.value = false; } };
const approveDiscoveryCandidate = async (row: ReaderSourceDiscoveryCandidate) => { await ElMessageBox.confirm('审核通过后会生成一个停用的正式书源站点，仍需完成授权确认、解析规则和限流策略配置，是否继续？', '候选审核', { type: 'warning' }); await approveReaderSourceDiscoveryCandidate(row.id); ElMessage.success('候选已通过，正式站点仍处于停用状态'); await Promise.all([loadDiscoveryCandidates(), loadSites()]); };
const rejectDiscoveryCandidate = async (row: ReaderSourceDiscoveryCandidate) => { const result = await ElMessageBox.prompt('请输入拒绝原因', '拒绝候选地址', { inputValue: '未通过人工审核', inputValidator: value => !!value?.trim() || '请输入拒绝原因' }); await rejectReaderSourceDiscoveryCandidate(row.id, result.value); ElMessage.success('候选已拒绝'); await loadDiscoveryCandidates(); };
const handleTaskSiteChange = async (siteId?: string | number) => { taskDialog.form.ruleId = undefined; taskRulesOptions.value = []; if (siteId) { const { data } = await listReaderSourceRules({ siteId, status: '1', pageNum: 1, pageSize: 100 }); taskRulesOptions.value = data?.rows ?? []; } };

const complianceLabel = (value: string) => value === 'APPROVED' ? '已确认' : value === 'REJECTED' ? '不允许' : '未确认';
const complianceTag = (value: string) => value === 'APPROVED' ? 'success' : value === 'REJECTED' ? 'danger' : 'warning';
const ruleLabel = (value: string) => value === '1' ? '启用' : value === '2' ? '停用' : '草稿';
const ruleTag = (value: string) => value === '1' ? 'success' : value === '2' ? 'info' : 'warning';
const taskLabel = (value: string) => taskStatuses.find(item => item.value === value)?.label || value;
const taskTag = (value: string) => ['RUNNING', 'WAITING_REVIEW'].includes(value) ? 'warning' : ['COMPLETED'].includes(value) ? 'success' : ['FAILED', 'CANCELED'].includes(value) ? 'danger' : 'info';
const providerRunLabel = (value?: string) => value === 'COMPLETED' ? '已完成' : value === 'FAILED' ? '失败' : value === 'RUNNING' ? '运行中' : '未运行';
const providerRunTag = (value?: string) => value === 'COMPLETED' ? 'success' : value === 'FAILED' ? 'danger' : value === 'RUNNING' ? 'warning' : 'info';
const matcherTypeLabel = (value: string) => value === 'HOST' ? '精确主机' : value === 'SUFFIX' ? '域名后缀' : '精确地址';
const robotsLabel = (value: string) => value === 'ALLOWED' ? '允许' : value === 'DISALLOWED' ? '已拒绝' : value === 'UNAVAILABLE' ? '无法检查' : '未检查';
const robotsTag = (value: string) => value === 'ALLOWED' ? 'success' : value === 'DISALLOWED' ? 'danger' : 'warning';
const candidateLabel = (value: string) => value === 'NEEDS_REVIEW' ? '待审核' : value === 'BLOCKED' ? '已拦截' : value === 'CHECK_FAILED' ? '检查失败' : value === 'APPROVED' ? '已通过' : value === 'REJECTED' ? '已拒绝' : value;
const candidateTag = (value: string) => value === 'NEEDS_REVIEW' ? 'warning' : value === 'APPROVED' ? 'success' : value === 'BLOCKED' || value === 'REJECTED' ? 'danger' : 'info';

onMounted(async () => { await Promise.all([loadSites(), loadPolicies(), loadDiscoveryProviders()]); });
</script>

<style scoped lang="scss">
.center-header, .toolbar-row, .header-actions { display: flex; align-items: center; }
.center-header, .toolbar-row { justify-content: space-between; gap: 16px; }
.header-actions { gap: 12px; }
.toolbar-row { margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-row :deep(.el-form-item) { margin-bottom: 0; }
.primary-text { color: var(--el-text-color-primary); font-weight: 600; }
.muted-text { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
.template-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 900px) {
  .center-header, .toolbar-row { align-items: flex-start; flex-direction: column; }
  .header-actions { width: 100%; justify-content: space-between; }
}
</style>
