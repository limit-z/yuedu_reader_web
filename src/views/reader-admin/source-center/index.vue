<template>
  <div class="p-2 app-container source-center-page">
    <el-alert
      title="风险提示与采集许可分开管理"
      description="系统只负责展示黑名单、robots、地址、访问状态和限流风险，不替管理员判断授权来源；你可在确认说明中填写合同、版权方、合作方或其他授权依据，再自行打开站点的采集许可。"
      type="info"
      show-icon
      class="mb-4"
    />

    <el-card shadow="never" class="workflow-card mb-4">
      <div class="workflow-head">
        <div>
          <div class="workflow-kicker">首次使用指南</div>
          <h3 class="workflow-title">按流程完成一次安全采集</h3>
          <p class="workflow-description">每一步都对应真实接口和后端状态。有现成地址从站点登记开始，没有地址可先走自动发现。</p>
        </div>
        <el-button type="primary" plain icon="QuestionFilled" @click="openGuide">查看操作引导</el-button>
      </div>
      <div class="workflow-progress">
        <div
          v-for="(step, index) in guideSteps"
          :key="step.key"
          class="workflow-step"
          :class="{ 'is-current': index === activeGuideIndex, 'is-complete': step.complete }"
          role="button"
          tabindex="0"
          @click="handleGuideStep(step)"
          @keydown.enter="handleGuideStep(step)"
        >
          <div class="workflow-step-index">{{ step.complete ? '✓' : index + 1 }}</div>
          <div class="workflow-step-body">
            <div class="workflow-step-title">{{ step.title }}</div>
            <div class="workflow-step-status">{{ step.statusLabel }}</div>
          </div>
        </div>
      </div>
      <div v-if="nextGuideStep" class="workflow-next">
        <div>
          <span class="workflow-next-label">当前待办</span>
          <strong>{{ nextGuideStep.title }}</strong>
          <span class="workflow-next-description">{{ nextGuideStep.description }}</span>
        </div>
        <el-button type="primary" @click="handleGuideStep(nextGuideStep)">{{ nextGuideStep.actionLabel }}</el-button>
      </div>
      <el-alert v-else title="流程已走到最后一步" description="请打开采集任务的章节差异，确认快照内容后，再按你们现有的作品审核流程发布到作品管理。" type="success" :closable="false" show-icon class="workflow-finished" />
    </el-card>

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
                <div class="batch-actions"><el-button type="primary" icon="Plus" @click="openProviderDialog()">新增发现源</el-button><el-button :disabled="!selectedProviders.length" @click="batchAction(selectedProviders, ids => batchReaderSourceDiscoveryProviders('enable', ids), loadDiscoveryProviders, '确认批量启用选中的发现源吗？')">批量启用</el-button><el-button :disabled="!selectedProviders.length" @click="batchAction(selectedProviders, ids => batchReaderSourceDiscoveryProviders('disable', ids), loadDiscoveryProviders, '确认批量停用选中的发现源吗？')">批量停用</el-button></div>
              </div>
              <el-table v-loading="loading.discoveryProviders" :data="discoveryProviders" border @selection-change="value => selectedProviders = value"><el-table-column type="selection" width="48" />
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
              <div class="toolbar-row"><el-form :inline="true" :model="blacklistQuery" @submit.prevent><el-form-item label="匹配类型"><el-select v-model="blacklistQuery.matcherType" clearable placeholder="全部" style="width: 120px"><el-option label="精确主机" value="HOST" /><el-option label="域名后缀" value="SUFFIX" /><el-option label="精确地址" value="URL" /></el-select></el-form-item><el-button type="primary" icon="Search" @click="loadDiscoveryBlacklist">查询</el-button></el-form><div class="batch-actions"><el-button type="primary" icon="Plus" @click="openBlacklistDialog()">新增黑名单</el-button><el-button :disabled="!selectedBlacklist.length" @click="batchAction(selectedBlacklist, ids => batchReaderSourceDiscoveryBlacklist('enable', ids), loadDiscoveryBlacklist, '确认批量启用选中的黑名单吗？')">批量启用</el-button><el-button :disabled="!selectedBlacklist.length" @click="batchAction(selectedBlacklist, ids => batchReaderSourceDiscoveryBlacklist('disable', ids), loadDiscoveryBlacklist, '确认批量停用选中的黑名单吗？')">批量停用</el-button><el-button type="danger" plain :disabled="!selectedBlacklist.length" @click="batchAction(selectedBlacklist, ids => batchReaderSourceDiscoveryBlacklist('delete', ids), loadDiscoveryBlacklist, '确认批量删除选中的黑名单吗？删除后不可恢复。')">批量删除</el-button></div></div>
              <el-table v-loading="loading.discoveryBlacklist" :data="discoveryBlacklist" border @selection-change="value => selectedBlacklist = value"><el-table-column type="selection" width="48" /><el-table-column label="匹配类型" width="110"><template #default="{ row }">{{ matcherTypeLabel(row.matcherType) }}</template></el-table-column><el-table-column label="匹配值" min-width="260" prop="matcherValue" show-overflow-tooltip /><el-table-column label="原因" min-width="220" prop="reason" show-overflow-tooltip /><el-table-column label="来源" width="140" prop="source" /><el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === '1' ? 'danger' : 'info'">{{ row.status === '1' ? '拦截中' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" fixed="right" width="210" align="center"><template #default="{ row }"><el-button link type="primary" @click="openBlacklistDialog(row)">编辑</el-button><el-button v-if="row.status === '1'" link type="warning" @click="toggleBlacklist(row, false)">停用</el-button><el-button v-else link type="success" @click="toggleBlacklist(row, true)">启用</el-button><el-button link type="danger" @click="removeBlacklist(row)">删除</el-button></template></el-table-column></el-table>
              <pagination v-show="blacklistTotal > 0" v-model:page="blacklistQuery.pageNum" v-model:limit="blacklistQuery.pageSize" :total="blacklistTotal" @pagination="loadDiscoveryBlacklist" />
            </el-tab-pane>
            <el-tab-pane label="候选审核" name="candidates">
              <div class="toolbar-row"><el-form :inline="true" :model="candidateQuery" @submit.prevent><el-form-item label="审核状态"><el-select v-model="candidateQuery.discoveryStatus" clearable placeholder="全部" style="width: 140px"><el-option label="待审核" value="NEEDS_REVIEW" /><el-option label="已拦截" value="BLOCKED" /><el-option label="检查失败" value="CHECK_FAILED" /><el-option label="已通过" value="APPROVED" /><el-option label="已拒绝" value="REJECTED" /></el-select></el-form-item><el-form-item label="关键词"><el-input v-model="candidateQuery.keyword" clearable placeholder="地址或主机" @keyup.enter="loadDiscoveryCandidates" /></el-form-item><el-button type="primary" icon="Search" @click="loadDiscoveryCandidates">查询</el-button></el-form><div class="batch-actions"><el-button :disabled="!selectedCandidates.length" @click="batchAction(selectedCandidates, ids => batchReaderSourceDiscoveryCandidates('check', ids), loadDiscoveryCandidates, '确认批量重新检查选中的候选地址吗？')">批量检查</el-button><el-button type="success" :disabled="!selectedCandidates.length" @click="batchAction(selectedCandidates, ids => batchReaderSourceDiscoveryCandidates('approve', ids), loadDiscoveryCandidates, '确认批量通过选中的候选地址吗？')">批量通过</el-button><el-button type="danger" plain :disabled="!selectedCandidates.length" @click="batchAction(selectedCandidates, ids => batchReaderSourceDiscoveryCandidates('reject', ids, '批量拒绝'), loadDiscoveryCandidates, '确认批量拒绝选中的候选地址吗？')">批量拒绝</el-button></div></div>
              <el-table v-loading="loading.discoveryCandidates" :data="discoveryCandidates" border @selection-change="value => selectedCandidates = value"><el-table-column type="selection" width="48" /><el-table-column label="候选地址" min-width="280"><template #default="{ row }"><div class="primary-text">{{ row.candidateName || row.candidateHost }}</div><div class="muted-text">{{ row.candidateUrl }}</div></template></el-table-column><el-table-column label="黑名单" width="90"><template #default="{ row }"><el-tag :type="row.blacklistStatus === 'MATCHED' ? 'danger' : 'success'">{{ row.blacklistStatus === 'MATCHED' ? '已命中' : '未命中' }}</el-tag></template></el-table-column><el-table-column label="robots" width="110"><template #default="{ row }"><el-tag :type="robotsTag(row.robotsStatus)">{{ robotsLabel(row.robotsStatus) }}</el-tag></template></el-table-column><el-table-column label="可用性" width="100"><template #default="{ row }"><el-tag :type="row.availabilityStatus === 'AVAILABLE' ? 'success' : 'info'">{{ row.availabilityStatus === 'AVAILABLE' ? '可访问' : '未通过' }}</el-tag></template></el-table-column><el-table-column label="审核状态" width="100"><template #default="{ row }"><el-tag :type="candidateTag(row.discoveryStatus)">{{ candidateLabel(row.discoveryStatus) }}</el-tag></template></el-table-column><el-table-column label="检查摘要" min-width="220" prop="checkMessage" show-overflow-tooltip /><el-table-column label="操作" fixed="right" width="220" align="center"><template #default="{ row }"><el-button v-if="!['APPROVED', 'REJECTED', 'BLOCKED'].includes(row.discoveryStatus)" link type="primary" @click="checkDiscoveryCandidate(row)">重新检查</el-button><el-button v-if="row.discoveryStatus === 'NEEDS_REVIEW'" link type="success" @click="approveDiscoveryCandidate(row)">审核通过</el-button><el-button v-if="!['APPROVED', 'REJECTED'].includes(row.discoveryStatus)" link type="danger" @click="rejectDiscoveryCandidate(row)">拒绝</el-button></template></el-table-column></el-table>
              <pagination v-show="candidateTotal > 0" v-model:page="candidateQuery.pageNum" v-model:limit="candidateQuery.pageSize" :total="candidateTotal" @pagination="loadDiscoveryCandidates" />
            </el-tab-pane>
            <el-tab-pane label="运行记录" name="discovery-runs">
              <el-table v-loading="loading.discoveryRuns" :data="discoveryRuns" border><el-table-column label="运行ID" prop="id" width="90" /><el-table-column label="发现源ID" prop="providerId" width="100" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'COMPLETED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="候选/拦截/可用/失败" min-width="170"><template #default="{ row }">{{ row.candidateCount }} / {{ row.blockedCount }} / {{ row.availableCount }} / {{ row.failedCount }}</template></el-table-column><el-table-column label="robots拒绝" width="100" prop="robotsDeniedCount" /><el-table-column label="开始时间" width="170" prop="startedAt" /><el-table-column label="错误摘要" min-width="220" prop="errorMessage" show-overflow-tooltip /></el-table>
              <pagination v-show="discoveryRunTotal > 0" v-model:page="discoveryRunQuery.pageNum" v-model:limit="discoveryRunQuery.pageSize" :total="discoveryRunTotal" @pagination="loadDiscoveryRuns" />
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        <el-tab-pane label="书源站点" name="sites">
          <el-alert
            title="采集许可由你控制，风险信息仅供判断"
            description="系统不会因为未检测到站点直接授权就替你作出授权结论。完成授权来源确认后，采集许可开关仍由你自主打开或关闭；黑名单、robots 明确拒绝、内网地址、401/403 和 429 退避等技术安全边界仍由后端执行。"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />
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
            <div class="batch-actions"><el-button icon="Plus" @click="openSiteDialog()">新增站点</el-button><el-button :disabled="!selectedSites.length" @click="batchAction(selectedSites, ids => batchReaderSourceSites('enable', ids), loadSites, '确认批量启用选中的书源站点吗？')">批量启用</el-button><el-button :disabled="!selectedSites.length" @click="batchAction(selectedSites, ids => batchReaderSourceSites('disable', ids), loadSites, '确认批量停用选中的书源站点吗？')">批量停用</el-button></div>
          </div>
          <el-table v-loading="loading.sites" :data="sites" border @selection-change="value => selectedSites = value"><el-table-column type="selection" width="48" />
            <el-table-column label="站点" min-width="190">
              <template #default="{ row }">
                <div class="primary-text">{{ row.siteName }}</div>
                <div class="muted-text">{{ row.allowedHost }}</div>
              </template>
            </el-table-column>
            <el-table-column label="站点地址" prop="baseUrl" min-width="250" show-overflow-tooltip />
            <el-table-column label="授权确认" width="110">
              <template #default="{ row }"><el-tag :type="complianceTag(row.complianceStatus)">{{ complianceLabel(row.complianceStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="采集许可" width="125">
              <template #default="{ row }">
                <el-tooltip :content="row.complianceStatus === 'APPROVED' ? '由你控制该站点是否允许新采集任务运行' : '请先填写授权来源并完成确认'" placement="top">
                  <el-switch
                    :model-value="row.status === '1'"
                    :disabled="row.complianceStatus !== 'APPROVED'"
                    :loading="submitting"
                    @change="value => toggleSite(row, Boolean(value))"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="策略ID" prop="defaultPolicyId" width="100" />
            <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="250" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="openSiteDialog(row)">编辑</el-button>
                <el-button link type="warning" @click="openComplianceDialog(row)">风险与许可确认</el-button>
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
            <div class="batch-actions"><el-button icon="Plus" @click="openPolicyDialog()">新增策略</el-button><el-button :disabled="!selectedPolicies.length" @click="batchAction(selectedPolicies, ids => batchReaderSourcePolicies('enable', ids), loadPolicies, '确认批量启用选中的限流策略吗？')">批量启用</el-button><el-button :disabled="!selectedPolicies.length" @click="batchAction(selectedPolicies, ids => batchReaderSourcePolicies('disable', ids), loadPolicies, '确认批量停用选中的限流策略吗？')">批量停用</el-button></div>
          </div>
          <el-table v-loading="loading.policies" :data="policies" border @selection-change="value => selectedPolicies = value">
            <el-table-column type="selection" width="48" />
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
            <div class="batch-actions"><el-button icon="Plus" @click="openRuleDialog()">新增规则</el-button><el-button :disabled="!selectedRules.length" @click="batchAction(selectedRules, ids => batchReaderSourceRules('publish', ids), loadRules, '确认批量发布选中的解析规则吗？')">批量发布</el-button><el-button :disabled="!selectedRules.length" @click="batchAction(selectedRules, ids => batchReaderSourceRules('disable', ids), loadRules, '确认批量停用选中的解析规则吗？')">批量停用</el-button></div>
          </div>
          <el-table v-loading="loading.rules" :data="rules" border @selection-change="value => selectedRules = value"><el-table-column type="selection" width="48" />
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
          <div class="batch-actions task-batch-actions"><el-button :disabled="!selectedTasks.length" @click="batchAction(selectedTasks, ids => batchReaderSourceTasks('start', ids), loadTasks, '确认批量启动选中的采集任务吗？')">批量启动</el-button><el-button :disabled="!selectedTasks.length" @click="batchAction(selectedTasks, ids => batchReaderSourceTasks('resume', ids), loadTasks, '确认批量恢复选中的采集任务吗？')">批量恢复</el-button><el-button :disabled="!selectedTasks.length" @click="batchAction(selectedTasks, ids => batchReaderSourceTasks('pause', ids), loadTasks, '确认批量暂停选中的采集任务吗？')">批量暂停</el-button><el-button type="danger" plain :disabled="!selectedTasks.length" @click="batchAction(selectedTasks, ids => batchReaderSourceTasks('cancel', ids), loadTasks, '确认批量取消选中的采集任务吗？取消后不可恢复。')">批量取消</el-button><el-button type="warning" plain :disabled="!selectedTasks.length" @click="batchAction(selectedTasks, ids => batchReaderSourceTasks('retry-circuit', ids), loadTasks, '确认批量重置熔断并重试选中的采集任务吗？')">批量熔断重试</el-button></div>
          <el-table ref="taskTableRef" v-loading="loading.tasks" :data="tasks" row-key="id" reserve-selection border @selection-change="handleTaskSelectionChange"><el-table-column type="selection" width="48" />
            <el-table-column label="任务" min-width="200"><template #default="{ row }"><div class="primary-text">{{ row.taskName }}</div><div class="muted-text">{{ row.collectionMode === 'ALL' ? '全站书籍' : row.collectionMode === 'CATEGORY' ? `分类：${row.categoryName}` : (row.sourceWorkTitle || row.sourceWorkUrl) }}</div></template></el-table-column>
            <el-table-column label="执行器" width="100"><template #default="{ row }"><el-tag>{{ row.executorType }}</el-tag></template></el-table-column>
            <el-table-column label="采集模式" width="105"><template #default="{ row }">{{ collectionModes.find(item => item.value === row.collectionMode)?.label || '单本采集' }}</template></el-table-column>
            <el-table-column label="书籍进度" width="145"><template #default="{ row }"><el-progress :percentage="row.progressPercent || 0" :stroke-width="8" /><div class="muted-text">{{ row.processedBooks || 0 }} / {{ row.totalBooks || 0 }} 本</div></template></el-table-column>
            <el-table-column label="每日额度重试" width="145"><template #default="{ row }"><div>{{ row.dailyRetryCount || 0 }} 次</div><div class="muted-text">次日00:00后 · {{ row.lastDailyRetryAt || '尚未触发' }}</div></template></el-table-column>
            <el-table-column label="范围" width="135"><template #default="{ row }">{{ row.startChapterNo || 1 }} - {{ row.endChapterNo || '最新' }}</template></el-table-column>
            <el-table-column label="游标" width="90" prop="currentChapterNo" />
            <el-table-column label="状态" width="150"><template #default="{ row }"><el-tag :type="taskTag(row.status)">{{ taskLabel(row.status) }}</el-tag><div class="muted-text">{{ executionLabel(row.executionState) }}</div></template></el-table-column>
            <el-table-column label="最近运行" prop="lastRunAt" min-width="170" />
            <el-table-column label="失败分类" width="135"><template #default="{ row }"><el-tag v-if="row.failureCode" :type="failureTag(row.failureCode)">{{ failureLabel(row.failureCode) }}</el-tag><span v-else class="muted-text">-</span></template></el-table-column>
            <el-table-column label="失败原因" prop="failReason" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="430" align="center">
              <template #default="{ row }">
                <el-button v-if="['DRAFT', 'READY'].includes(row.status)" link type="success" @click="operateTask(row, 'start')">启动</el-button>
                <el-button v-if="row.status === 'PAUSED'" link type="success" @click="operateTask(row, 'resume')">恢复</el-button>
                <el-button v-if="row.failureCode === 'CIRCUIT_OPEN' && ['FAILED', 'PAUSED'].includes(row.status)" link type="danger" @click="retryCircuitTask(row)">重置熔断重试</el-button>
                <el-button v-if="row.status === 'RUNNING'" link type="warning" @click="operateTask(row, 'pause')">暂停</el-button>
                <el-button v-if="!['CANCELED', 'COMPLETED'].includes(row.status)" link type="danger" @click="operateTask(row, 'cancel')">取消</el-button>
                <el-button v-if="row.collectionMode !== 'SINGLE'" link type="success" @click="openTaskBooks(row)">书籍明细</el-button>
                <el-button link type="primary" @click="openTaskDetail(row)">配置详情</el-button>
                <el-button v-if="row.status === 'WAITING_REVIEW'" link type="success" @click="materializeTask(row)">写入审核</el-button>
                <el-button link type="primary" @click="openRuns(row)">运行记录</el-button>
                <el-button link type="warning" @click="openDiffs(row)">章节差异</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="taskTotal > 0" v-model:page="taskQuery.pageNum" v-model:limit="taskQuery.pageSize" :total="taskTotal" @pagination="loadTasks" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="guideVisible" title="书源采集操作引导" width="760px" append-to-body>
      <el-alert
        title="建议按顺序完成，不要跳过风险确认"
        description="风险提示、授权确认和采集许可是不同概念。系统会展示风险并保留审计记录；黑名单、robots 明确拒绝、内网地址、401/403 和 429 退避等后端安全边界不可关闭。"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <div class="optional-discovery">
        <div>
          <strong>没有现成书源地址？</strong>
          <span>可先配置你有权使用的公开索引或授权 Feed，完成候选审核后再进入主流程。</span>
        </div>
        <el-button link type="primary" @click="goDiscovery">去自动发现</el-button>
      </div>
      <div class="guide-list">
        <div v-for="(step, index) in guideSteps" :key="step.key" class="guide-row" :class="{ 'is-current': index === activeGuideIndex, 'is-complete': step.complete }">
          <div class="guide-number">{{ step.complete ? '✓' : index + 1 }}</div>
          <div class="guide-content">
            <div class="guide-title-row">
              <strong>{{ step.title }}</strong>
              <el-tag :type="step.complete ? 'success' : index === activeGuideIndex ? 'warning' : 'info'" size="small">{{ step.statusLabel }}</el-tag>
            </div>
            <p>{{ step.description }}</p>
          </div>
          <el-button link type="primary" @click="handleGuideStep(step)">{{ step.actionLabel }}</el-button>
        </div>
      </div>
      <el-alert title="关于作品管理" description="采集任务完成后会先形成章节快照并进入待审核状态，不会自动把未经审核的第三方内容发布为作品。请在运行详情的“章节差异”中完成核验，再按作品审核流程处理。" type="info" :closable="false" show-icon class="mt-4" />
      <template #footer><el-button type="primary" @click="guideVisible = false">知道了</el-button></template>
    </el-dialog>

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

    <el-dialog v-model="complianceDialog.visible" title="风险与采集许可确认" width="560px" append-to-body>
      <el-alert title="系统不能验证你与目标站点之外的授权关系，请根据实际授权材料自行判断。" description="可填写版权方授权、合同授权、合作方授权、站点书面许可或其他合法授权依据。该确认会被记录到站点审计信息中；风险门禁不会因确认而关闭。" type="warning" :closable="false" class="mb-4" />
      <el-form label-width="120px"><el-form-item label="站点"><span>{{ complianceDialog.site?.siteName }}</span></el-form-item><el-form-item label="采集许可"><el-radio-group v-model="complianceDialog.approved"><el-radio :value="true">我确认允许采集</el-radio><el-radio :value="false">暂不允许采集</el-radio></el-radio-group></el-form-item><el-form-item label="授权来源说明" required><el-input v-model="complianceDialog.note" type="textarea" :rows="4" maxlength="1000" show-word-limit placeholder="例如：版权方合同编号、合作方授权邮件、授权范围和有效期等" /><div class="form-tip">选择“我确认允许采集”时必填；选择“暂不允许采集”可填写拒绝或待核实原因。</div></el-form-item></el-form>
      <template #footer><el-button @click="complianceDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitCompliance">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="policyDialog.visible" :title="policyDialog.editing ? '编辑限流策略' : '新增限流策略'" width="720px" append-to-body>
      <el-form ref="policyFormRef" :model="policyDialog.form" :rules="policyRules" label-width="130px">
        <el-form-item label="策略名称" prop="policyName"><el-input v-model="policyDialog.form.policyName" /></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="单站点并发" prop="concurrencyLimit"><el-input-number v-model="policyDialog.form.concurrencyLimit" :min="1" :max="32" /></el-form-item></el-col><el-col :span="12"><el-form-item label="每分钟请求" prop="requestsPerMinute"><el-input-number v-model="policyDialog.form.requestsPerMinute" :min="1" :max="600" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="最小间隔(ms)" prop="minDelayMs"><el-input-number v-model="policyDialog.form.minDelayMs" :min="1000" /></el-form-item></el-col><el-col :span="12"><el-form-item label="最大间隔(ms)" prop="maxDelayMs"><el-input-number v-model="policyDialog.form.maxDelayMs" :min="1000" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="每日请求上限" prop="dailyRequestLimit"><el-input-number v-model="policyDialog.form.dailyRequestLimit" :min="1" /></el-form-item></el-col><el-col :span="12"><el-form-item label="最大重试次数" prop="maxRetries"><el-input-number v-model="policyDialog.form.maxRetries" :min="0" :max="5" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="连接超时(ms)" prop="connectTimeoutMs"><el-input-number v-model="policyDialog.form.connectTimeoutMs" :min="1000" /></el-form-item></el-col><el-col :span="12"><el-form-item label="读取超时(ms)" prop="readTimeoutMs"><el-input-number v-model="policyDialog.form.readTimeoutMs" :min="1000" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="连续失败熔断" prop="circuitBreakerThreshold"><el-input-number v-model="policyDialog.form.circuitBreakerThreshold" :min="1" /></el-form-item></el-col><el-col :span="12"><el-form-item label="遵循 Retry-After"><el-switch :model-value="true" disabled /><span class="locked-policy">强制开启</span></el-form-item></el-col></el-row>
        <el-divider content-position="left">不可关闭的安全门禁</el-divider>
        <div class="guard-grid">
          <div v-for="guard in hardGuards" :key="guard.label" class="guard-item">
            <span>{{ guard.label }}</span>
            <el-switch :model-value="true" disabled />
          </div>
        </div>
        <el-alert title="这些门禁由后端强制执行，管理端开关仅用于展示状态。" type="warning" :closable="false" class="mt-3" />
        <el-form-item label="备注"><el-input v-model="policyDialog.form.remark" type="textarea" :rows="2" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="policyDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitPolicy">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="ruleDialog.visible" :title="ruleDialog.editing ? '编辑解析规则' : '新增解析规则'" width="760px" append-to-body>
      <el-form ref="ruleFormRef" :model="ruleDialog.form" :rules="ruleRules" label-width="125px">
        <el-form-item label="所属站点" prop="siteId"><el-select v-model="ruleDialog.form.siteId" placeholder="请选择站点" style="width: 100%"><el-option v-for="site in sites" :key="site.id" :label="site.siteName" :value="site.id" /></el-select></el-form-item>
        <el-form-item label="规则名称" prop="ruleName"><el-input v-model="ruleDialog.form.ruleName" /></el-form-item>
        <el-form-item label="搜索地址模板"><el-input v-model="ruleDialog.form.searchUrlTemplate" placeholder="用于备用书源匹配，例如 https://example.com/search" /><div class="form-tip">仅填写已验证的公开搜索入口；POST 参数请在选择器 JSON 的 search.method 和 search.params 中声明。</div></el-form-item>
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
        <el-form-item label="采集模式" prop="collectionMode"><el-radio-group v-model="taskDialog.form.collectionMode"><el-radio v-for="mode in collectionModes" :key="mode.value" :value="mode.value">{{ mode.label }}</el-radio></el-radio-group></el-form-item>
        <el-form-item v-if="taskDialog.form.collectionMode === 'CATEGORY'" label="来源分类" prop="categoryName"><el-input v-model="taskDialog.form.categoryName" placeholder="例如：玄幻、言情、修仙" /></el-form-item>
        <el-form-item label="书籍数量上限" prop="bookLimit"><el-input-number v-model="taskDialog.form.bookLimit" :min="1" :max="10000" :step="1" /><span class="muted-text ml-2">{{ taskDialog.form.collectionMode === 'SINGLE' ? '单本任务固定为 1' : '限制本次最多采集的书籍数' }}</span></el-form-item>
        <template v-if="taskDialog.form.collectionMode === 'SINGLE'">
          <el-form-item label="作品地址" prop="sourceWorkUrl"><el-input v-model="taskDialog.form.sourceWorkUrl" placeholder="必须属于已允许站点主机" /></el-form-item>
          <el-form-item label="作品标题"><el-input v-model="taskDialog.form.sourceWorkTitle" /></el-form-item>
        </template>
        <el-form-item v-else label="书籍列表地址" prop="sourceWorkUrl">
          <el-input v-model="taskDialog.form.sourceWorkUrl" placeholder="例如：https://www.bookcheng8.com/xuanhuan/1.html" />
        </el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="起始章节"><el-input-number v-model="taskDialog.form.startChapterNo" :min="1" /></el-form-item></el-col><el-col :span="12"><el-form-item label="结束章节"><el-input-number v-model="taskDialog.form.endChapterNo" :min="1" /></el-form-item></el-col></el-row>
        <el-form-item label="增量采集"><el-switch v-model="taskDialog.form.incremental" active-value="1" inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="taskDialog.visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitTask">创建</el-button></template>
    </el-dialog>

    <el-drawer v-model="taskBooksDialog.visible" :title="`任务 #${taskBooksDialog.task?.id || ''} 书籍明细`" size="1050px">
      <div class="toolbar-row">
        <el-form :inline="true" :model="taskBookQuery" @submit.prevent>
          <el-form-item label="书名/作者"><el-input v-model="taskBookQuery.keyword" clearable @keyup.enter="loadTaskBooks" /></el-form-item>
          <el-form-item label="去重动作"><el-select v-model="taskBookQuery.dedupeAction" clearable style="width: 140px"><el-option label="新作品" value="NEW" /><el-option label="增量" value="INCREMENTAL" /><el-option label="无变化" value="UNCHANGED" /></el-select></el-form-item>
          <el-button type="primary" icon="Search" @click="loadTaskBooks">查询</el-button>
        </el-form>
      </div>
      <el-table v-loading="loading.books" :data="taskBooks" border @row-click="openTaskBookSnapshots">
        <el-table-column label="书名 / 作者" min-width="210"><template #default="{ row }"><div class="primary-text">{{ row.sourceWorkTitle }}</div><div class="muted-text">{{ row.authorName }}</div></template></el-table-column>
        <el-table-column label="分类" prop="categoryName" width="110" />
        <el-table-column label="批次" prop="batchNo" width="180" show-overflow-tooltip />
        <el-table-column label="去重结果" width="100"><template #default="{ row }">{{ row.dedupeAction }}</template></el-table-column>
        <el-table-column label="章节进度" width="170"><template #default="{ row }">{{ row.processedChapterCount || 0 }} / {{ row.plannedChapterCount || 0 }}<div class="muted-text">本地 {{ row.localLatestChapterNo || 0 }} · 来源 {{ row.remoteLatestChapterNo || 0 }}</div></template></el-table-column>
        <el-table-column label="状态" width="105"><template #default="{ row }"><el-tag :type="taskTag(row.status)">{{ taskLabel(row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="时间" prop="startedAt" min-width="170" />
        <el-table-column label="错误" prop="lastError" min-width="180" show-overflow-tooltip />
      </el-table>
      <pagination v-show="taskBookTotal > 0" v-model:page="taskBookQuery.pageNum" v-model:limit="taskBookQuery.pageSize" :total="taskBookTotal" @pagination="loadTaskBooks" />
      <el-divider v-if="taskBooksDialog.selected" content-position="left">{{ taskBooksDialog.selected.sourceWorkTitle }} · 章节快照</el-divider>
      <el-table v-if="taskBooksDialog.selected" v-loading="loading.bookSnapshots" :data="taskBookSnapshots" border>
        <el-table-column label="章节" min-width="180"><template #default="{ row }">{{ row.chapterNo || '-' }} · {{ row.chapterName || '-' }}</template></el-table-column>
        <el-table-column label="快照状态" prop="snapshotStatus" width="110" />
        <el-table-column label="正文哈希" prop="contentHash" min-width="180" show-overflow-tooltip />
        <el-table-column label="正文预览" prop="content" min-width="300" show-overflow-tooltip />
        <el-table-column label="采集时间" prop="capturedAt" width="170" />
      </el-table>
      <pagination v-if="taskBooksDialog.selected && taskBookSnapshotTotal > 0" v-model:page="taskBookSnapshotQuery.pageNum" v-model:limit="taskBookSnapshotQuery.pageSize" :total="taskBookSnapshotTotal" @pagination="loadTaskBookSnapshots" />
    </el-drawer>

    <el-drawer v-model="taskDetailDialog.visible" :title="`采集任务配置 #${taskDetailDialog.task?.id || ''}`" size="680px">
      <el-descriptions v-if="taskDetailDialog.task" :column="1" border>
        <el-descriptions-item label="任务名称">{{ taskDetailDialog.task.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">{{ taskLabel(taskDetailDialog.task.status) }}</el-descriptions-item>
        <el-descriptions-item label="站点 / 规则 / 策略">{{ taskDetailDialog.task.siteId }} / {{ taskDetailDialog.task.ruleId }} / {{ taskDetailDialog.task.policyId }}</el-descriptions-item>
        <el-descriptions-item label="执行器">{{ taskDetailDialog.task.executorType }}</el-descriptions-item>
        <el-descriptions-item label="采集模式">{{ collectionModes.find(item => item.value === taskDetailDialog.task?.collectionMode)?.label }}</el-descriptions-item>
        <el-descriptions-item label="来源分类">{{ taskDetailDialog.task.categoryName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="书籍数量上限">{{ taskDetailDialog.task.bookLimit || 1 }}</el-descriptions-item>
        <el-descriptions-item label="章节范围">{{ taskDetailDialog.task.startChapterNo || 1 }} - {{ taskDetailDialog.task.endChapterNo || '最新' }}</el-descriptions-item>
        <el-descriptions-item label="增量采集">{{ taskDetailDialog.task.incremental === '1' ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="来源地址">{{ taskDetailDialog.task.sourceWorkUrl }}</el-descriptions-item>
        <el-descriptions-item label="来源作品">{{ taskDetailDialog.task.sourceWorkTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="批次进度">{{ taskDetailDialog.task.processedBooks || 0 }} / {{ taskDetailDialog.task.totalBooks || 0 }} 本，{{ taskDetailDialog.task.progressPercent || 0 }}%</el-descriptions-item>
        <el-descriptions-item label="每日额度自动重试">{{ taskDetailDialog.task.dailyRetryEnabled === '0' ? '已关闭' : '已启用（次日00:00后检查）' }}</el-descriptions-item>
        <el-descriptions-item label="重试统计">每日额度 {{ taskDetailDialog.task.dailyRetryCount || 0 }} 次；普通异常 {{ taskDetailDialog.task.autoRetryCount || 0 }} / {{ taskDetailDialog.task.maxAutoRetryCount || 3 }} 次</el-descriptions-item>
        <el-descriptions-item label="失败分类"><el-tag v-if="taskDetailDialog.task.failureCode" :type="failureTag(taskDetailDialog.task.failureCode)">{{ failureLabel(taskDetailDialog.task.failureCode) }}</el-tag><span v-else>-</span><span class="muted-text ml-2">{{ taskDetailDialog.task.retryAfter ? `下次重试：${taskDetailDialog.task.retryAfter}` : '' }}</span><el-button v-if="taskDetailDialog.task.failureCode === 'CIRCUIT_OPEN' && ['FAILED', 'PAUSED'].includes(taskDetailDialog.task.status)" class="ml-2" link type="danger" @click="retryCircuitTask(taskDetailDialog.task)">重置熔断并重试</el-button></el-descriptions-item>
        <el-descriptions-item label="失败原因">{{ taskDetailDialog.task.failReason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">备用书源自动续采</el-divider>
      <div class="fallback-toolbar">
        <el-alert title="仅使用已授权、已启用的站点；401/403 不会盲目重试" description="系统会按优先级尝试其他站点的搜索规则，匹配到同名作品后为未完成书籍创建子任务，并从本地最新章节继续。" type="info" :closable="false" show-icon />
        <el-button type="primary" plain icon="Refresh" :loading="loading.fallbacks" @click="autoProvisionFallbacks">立即扫描并同步备用源</el-button>
      </div>
      <el-table :data="fallbackRoutes" border size="small" class="mb-3">
        <el-table-column label="优先级" prop="priority" width="75" />
        <el-table-column label="站点/规则" min-width="190"><template #default="{ row }"><div>{{ siteLabel(row.siteId) }}</div><div class="muted-text">{{ ruleLabelById(row.ruleId) }}</div></template></el-table-column>
        <el-table-column label="搜索地址模板" prop="sourceUrlTemplate" min-width="260" show-overflow-tooltip />
        <el-table-column label="自动切换" width="90"><template #default="{ row }">{{ row.autoEnabled === '1' && row.status === '1' ? '启用' : '停用' }}</template></el-table-column>
        <el-table-column label="最近子任务" prop="lastChildTaskId" width="105" />
      </el-table>
      <el-empty v-if="!fallbackRoutes.length" description="暂未同步到可用备用站点，请先为其他授权站点配置启用的搜索规则" :image-size="70" />
      <el-divider content-position="left">续采子任务链路</el-divider>
      <el-alert v-if="!taskChildren.length" title="当前还没有子任务" description="主任务发生 401/403 等授权阻断且存在未完成书籍时，系统会自动按备用站点顺序创建子任务；已尝试过的站点不会重复使用。" type="info" :closable="false" show-icon class="mb-3" />
      <el-table v-else v-loading="loading.children" :data="taskChildren" border size="small" class="mb-3">
        <el-table-column label="子任务" min-width="210"><template #default="{ row }"><div class="primary-text">#{{ row.id }} · {{ row.taskName }}</div><div class="muted-text">父任务 #{{ row.parentTaskId || taskDetailDialog.task?.id }}</div></template></el-table-column>
        <el-table-column label="站点/规则" min-width="170"><template #default="{ row }"><div>{{ siteLabel(row.siteId) }}</div><div class="muted-text">{{ ruleLabelById(row.ruleId) }}</div></template></el-table-column>
        <el-table-column label="续采范围" width="125"><template #default="{ row }">第 {{ row.startChapterNo || 1 }} 章起<div class="muted-text">至 {{ row.endChapterNo || '最新' }}</div></template></el-table-column>
        <el-table-column label="状态" width="105"><template #default="{ row }"><el-tag :type="taskTag(row.status)">{{ taskLabel(row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="失败分类" width="125"><template #default="{ row }"><el-tag v-if="row.failureCode" :type="failureTag(row.failureCode)">{{ failureLabel(row.failureCode) }}</el-tag><span v-else>-</span></template></el-table-column>
        <el-table-column label="进度/原因" min-width="210"><template #default="{ row }"><div>{{ row.currentChapterNo ? `当前第 ${row.currentChapterNo} 章` : '尚未开始' }}</div><div class="muted-text">{{ row.failReason || '无异常' }}</div></template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openRuns(row)">运行记录</el-button></template></el-table-column>
      </el-table>
      <el-form :model="fallbackForm" inline label-width="76px" @submit.prevent>
        <el-form-item label="备用站点"><el-select v-model="fallbackForm.siteId" placeholder="选择已授权站点" style="width: 180px" @change="loadFallbackRules"><el-option v-for="site in enabledSites" :key="site.id" :label="site.siteName" :value="site.id" /></el-select></el-form-item>
        <el-form-item label="解析规则"><el-select v-model="fallbackForm.ruleId" placeholder="选择已发布规则" style="width: 160px"><el-option v-for="rule in fallbackRules" :key="rule.id" :label="rule.ruleName" :value="rule.id" /></el-select></el-form-item>
        <el-form-item label="访问策略"><el-select v-model="fallbackForm.policyId" placeholder="选择策略" style="width: 150px"><el-option v-for="policy in activePolicies" :key="policy.id" :label="policy.policyName" :value="policy.id" /></el-select></el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="fallbackForm.priority" :min="1" :max="99" /></el-form-item>
        <el-form-item label="地址模板" class="fallback-url-item"><el-input v-model="fallbackForm.sourceUrlTemplate" placeholder="https://备用站点/book?title={title}&author={author}" style="width: 310px" /></el-form-item>
        <el-form-item><el-button type="primary" :disabled="!taskDetailDialog.task" @click="saveFallbackRoute">保存备用书源</el-button></el-form-item>
      </el-form>
    </el-drawer>

    <el-drawer v-model="runsDialog.visible" :title="`任务 #${runsDialog.task?.id || ''} 运行详情`" size="860px">
      <el-tabs v-model="runsDialog.tab" @tab-change="handleRunsTabChange">
        <el-tab-pane label="运行记录" name="runs">
          <el-table v-loading="loading.runs" :data="runs" border>
            <el-table-column label="运行ID" prop="id" width="90" />
            <el-table-column label="触发/序号" width="145"><template #default="{ row }">{{ triggerLabel(row.triggerType) }} / {{ row.retryNo || 0 }}</template></el-table-column>
            <el-table-column label="执行器" prop="executorType" width="90" />
            <el-table-column label="状态" width="125"><template #default="{ row }"><el-tag :type="runTag(row)">{{ runLabel(row) }}</el-tag></template></el-table-column>
            <el-table-column label="请求/成功/失败" min-width="140"><template #default="{ row }">{{ row.requestCount }} / {{ row.successCount }} / {{ row.failureCount }}</template></el-table-column>
            <el-table-column label="跳过" prop="skippedCount" width="70" />
            <el-table-column label="429" prop="tooManyRequestsCount" width="70" />
            <el-table-column label="触发原因" prop="triggerReason" min-width="160" show-overflow-tooltip />
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
        <el-tab-pane label="自动化日志" name="logs">
          <el-table v-loading="loading.logs" :data="logs" border>
            <el-table-column label="时间" prop="eventAt" width="170" />
            <el-table-column label="级别" width="75"><template #default="{ row }"><el-tag :type="row.level === 'ERROR' ? 'danger' : row.level === 'WARN' ? 'warning' : 'info'">{{ row.level }}</el-tag></template></el-table-column>
            <el-table-column label="阶段" prop="eventType" width="95" />
            <el-table-column label="消息" prop="message" min-width="300" show-overflow-tooltip />
            <el-table-column label="关联" min-width="125"><template #default="{ row }">运行 {{ row.runId || '-' }}<br />书籍 {{ row.taskBookId || '-' }}</template></el-table-column>
            <el-table-column label="详情" prop="detailJson" min-width="220" show-overflow-tooltip />
          </el-table>
          <pagination v-show="logTotal > 0" v-model:page="logQuery.pageNum" v-model:limit="logQuery.pageSize" :total="logTotal" @pagination="loadLogs" />
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
  listReaderSourceTaskBooks,
  listReaderSourceTaskBookSnapshots,
  listReaderSourceTaskFallbacks,
  autoProvisionReaderSourceTaskFallbacks,
  listReaderSourceTaskChildren,
  saveReaderSourceTaskFallback,
  listReaderSourceTaskLogs,
  listReaderSourceTasks,
  getReaderSourceTask,
  materializeReaderSourceTask,
  listReaderSourceDiscoveryBlacklist,
  listReaderSourceDiscoveryCandidates,
  listReaderSourceDiscoveryProviders,
  listReaderSourceDiscoveryRuns,
  pauseReaderSourceTask,
  publishReaderSourceRule,
  rejectReaderSourceDiscoveryCandidate,
  resumeReaderSourceTask,
  retryCircuitReaderSourceTask,
  startReaderSourceTask,
  runReaderSourceDiscoveryProvider,
  updateReaderSourcePolicy,
  updateReaderSourceRule,
  updateReaderSourceSite,
  updateReaderSourceDiscoveryBlacklist,
  updateReaderSourceDiscoveryProvider,
  batchReaderSourceSites,
  batchReaderSourcePolicies,
  batchReaderSourceRules,
  batchReaderSourceTasks,
  batchReaderSourceDiscoveryProviders,
  batchReaderSourceDiscoveryBlacklist,
  batchReaderSourceDiscoveryCandidates
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
  ReaderSourceTaskBook,
  ReaderSourceTaskBookSnapshot,
  ReaderSourceTaskFallback,
  ReaderSourceTaskLog,
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
const guideVisible = ref(false);
const submitting = ref(false);
const loading = reactive({ sites: false, policies: false, rules: false, tasks: false, runs: false, diffs: false, errors: false, logs: false, books: false, bookSnapshots: false, fallbacks: false, children: false, discoveryProviders: false, discoveryBlacklist: false, discoveryCandidates: false, discoveryRuns: false });
const sites = ref<ReaderSourceSite[]>([]);
const policies = ref<ReaderSourcePolicy[]>([]);
const rules = ref<ReaderSourceRule[]>([]);
const tasks = ref<ReaderSourceTask[]>([]);
const runs = ref<ReaderSourceTaskRun[]>([]);
const snapshots = ref<ReaderSourceChapterSnapshot[]>([]);
const errors = ref<ReaderSourceError[]>([]);
const logs = ref<ReaderSourceTaskLog[]>([]);
const fallbackRoutes = ref<ReaderSourceTaskFallback[]>([]);
const taskChildren = ref<ReaderSourceTask[]>([]);
const fallbackRules = ref<ReaderSourceRule[]>([]);
const taskBooks = ref<ReaderSourceTaskBook[]>([]);
const taskBookSnapshots = ref<ReaderSourceTaskBookSnapshot[]>([]);
const discoveryProviders = ref<ReaderSourceDiscoveryProvider[]>([]);
const discoveryBlacklist = ref<ReaderSourceDiscoveryBlacklist[]>([]);
const discoveryCandidates = ref<ReaderSourceDiscoveryCandidate[]>([]);
const discoveryRuns = ref<ReaderSourceDiscoveryRun[]>([]);
const selectedSites = ref<ReaderSourceSite[]>([]);
const selectedPolicies = ref<ReaderSourcePolicy[]>([]);
const selectedRules = ref<ReaderSourceRule[]>([]);
const selectedTasks = ref<ReaderSourceTask[]>([]);
const taskTableRef = ref<ElTableInstance>();
const taskSelectionIds = ref<Set<string>>(new Set());
const restoringTaskSelection = ref(false);
const selectedProviders = ref<ReaderSourceDiscoveryProvider[]>([]);
const selectedBlacklist = ref<ReaderSourceDiscoveryBlacklist[]>([]);
const selectedCandidates = ref<ReaderSourceDiscoveryCandidate[]>([]);
const siteTotal = ref(0);
const policyTotal = ref(0);
const ruleTotal = ref(0);
const taskTotal = ref(0);
const runTotal = ref(0);
const snapshotTotal = ref(0);
const errorTotal = ref(0);
const logTotal = ref(0);
const taskBookTotal = ref(0);
const taskBookSnapshotTotal = ref(0);
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
const taskBookQuery = reactive({ pageNum: 1, pageSize: 10, status: '', dedupeAction: '', keyword: '' });
const taskBookSnapshotQuery = reactive({ pageNum: 1, pageSize: 10 });
const errorQuery = reactive({ pageNum: 1, pageSize: 10 });
const logQuery = reactive({ pageNum: 1, pageSize: 20 });
const providerQuery = reactive({ pageNum: 1, pageSize: 10, providerName: '', status: '' });
const blacklistQuery = reactive({ pageNum: 1, pageSize: 10, matcherType: '' });
const candidateQuery = reactive({ pageNum: 1, pageSize: 10, discoveryStatus: '', candidateHost: '', keyword: '' });
const discoveryRunQuery = reactive({ pageNum: 1, pageSize: 10, providerId: undefined as string | number | undefined });

const blankSite = (): ReaderSourceSiteForm => ({ siteName: '', baseUrl: '', allowedHost: '', authorizationNote: '', defaultPolicyId: undefined, remark: '' });
const blankPolicy = (): ReaderSourcePolicyForm => ({ policyName: '', concurrencyLimit: 1, minDelayMs: 3000, maxDelayMs: 8000, requestsPerMinute: 10, dailyRequestLimit: 1000, connectTimeoutMs: 10000, readTimeoutMs: 20000, maxRetries: 2, circuitBreakerThreshold: 5, honorRetryAfter: '1', remark: '' });
const blankRule = (): ReaderSourceRuleForm => ({ siteId: '', ruleName: '', searchUrlTemplate: '', catalogUrlTemplate: '', chapterUrlTemplate: '', selectorJson: '{\n  "catalog": { "item": ".chapter-item", "title": ".chapter-title" },\n  "chapter": { "title": "h1", "content": ".content" }\n}', testUrl: '', remark: '' });
const blankTask = (): ReaderSourceTaskForm => ({ taskName: '', siteId: undefined, ruleId: undefined, policyId: undefined, executorType: 'JAVA', sourceWorkUrl: '', sourceWorkTitle: '', startChapterNo: 1, endChapterNo: undefined, incremental: '1', collectionMode: 'SINGLE', categoryName: '', bookLimit: 1 });
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
const taskBooksDialog = reactive<{ visible: boolean; task?: ReaderSourceTask; selected?: ReaderSourceTaskBook }>({ visible: false, task: undefined, selected: undefined });
const taskDetailDialog = reactive<{ visible: boolean; task?: ReaderSourceTask }>({ visible: false, task: undefined });
const fallbackForm = reactive<ReaderSourceTaskFallback>({ taskId: 0, priority: 1, siteId: 0, ruleId: 0, policyId: undefined, sourceUrlTemplate: '', autoEnabled: '1', status: '1' });
const siteFormRef = ref<FormInstance>();
const policyFormRef = ref<FormInstance>();
const ruleFormRef = ref<FormInstance>();
const taskFormRef = ref<FormInstance>();
const enabledSites = computed(() => sites.value.filter(item => item.status === '1' && item.complianceStatus === 'APPROVED'));
const activePolicies = computed(() => policies.value.filter(item => item.status === '1'));
const taskRulesOptions = ref<ReaderSourceRule[]>([]);
const taskStatuses = [{ label: '草稿', value: 'DRAFT' }, { label: '准备中', value: 'READY' }, { label: '运行中', value: 'RUNNING' }, { label: '已暂停', value: 'PAUSED' }, { label: '待审核', value: 'WAITING_REVIEW' }, { label: '已完成', value: 'COMPLETED' }, { label: '失败', value: 'FAILED' }, { label: '已取消', value: 'CANCELED' }];
const collectionModes = [{ label: '单本采集', value: 'SINGLE' }, { label: '全站书籍', value: 'ALL' }, { label: '按分类采集', value: 'CATEGORY' }];
const hardGuards = [
  { label: '黑名单拦截' },
  { label: 'robots 明确拒绝拦截' },
  { label: '公网地址与 SSRF 防护' },
  { label: '同主机访问' },
  { label: '401/403 自动暂停' },
  { label: '429 退避与 Retry-After' },
  { label: '人工审核后入库' },
  { label: '禁止绕过反爬机制' },
];
const siteRules = { siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }], baseUrl: [{ required: true, message: '请输入站点根地址', trigger: 'blur' }] };
const policyRules = { policyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }] };
const ruleRules = { siteId: [{ required: true, message: '请选择站点', trigger: 'change' }], ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }], selectorJson: [{ required: true, message: '请输入选择器 JSON', trigger: 'blur' }] };
const taskRules = computed(() => ({
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  siteId: [{ required: true, message: '请选择站点', trigger: 'change' }],
  ruleId: [{ required: true, message: '请选择规则', trigger: 'change' }],
  collectionMode: [{ required: true, message: '请选择采集模式', trigger: 'change' }],
  categoryName: [{
    validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
      if (taskDialog.form.collectionMode === 'CATEGORY' && !value?.trim()) callback(new Error('请输入来源分类'));
      else callback();
    },
    trigger: 'blur'
  }],
  sourceWorkUrl: [{
    validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
      if (taskDialog.form.collectionMode !== 'SINGLE' && !value?.trim()) callback(new Error('请输入书籍列表地址'));
      else callback();
    },
    trigger: 'blur'
  }]
}));

const unwrap = <T,>(data: { rows?: T[]; total?: number } | undefined) => ({ rows: data?.rows ?? [], total: Number(data?.total ?? 0) });
const selectedIds = <T extends { id: string | number }>(rows: T[]) => rows.map(row => row.id);
const showBatchResult = (result: { requestedCount?: number; successCount?: number; failureCount?: number; failures?: Array<{ id: string | number; reason: string }> }) => {
  const failures = result.failures ?? [];
  const detail = failures.slice(0, 5).map(item => `#${item.id}: ${item.reason}`).join('\n');
  ElMessage[failures.length ? 'warning' : 'success'](`已处理 ${result.successCount ?? 0}/${result.requestedCount ?? 0} 条${failures.length ? `，失败 ${result.failureCount ?? failures.length} 条${detail ? `\n${detail}` : ''}` : ''}`);
};
const confirmBatch = async (message: string) => ElMessageBox.confirm(message, '批量操作确认', { type: 'warning' });
const batchAction = async <T extends { id: string | number }>(rows: T[], action: (ids: Array<string | number>) => Promise<{ data?: any }>, reload: () => Promise<void>, message: string) => {
  if (!rows.length) return ElMessage.warning('请先选择要操作的记录');
  await confirmBatch(message);
  submitting.value = true;
  try {
    const { data } = await action(selectedIds(rows));
    showBatchResult(data ?? {});
    if (rows === selectedTasks.value) {
      taskSelectionIds.value = new Set();
      taskTableRef.value?.clearSelection();
    }
    await reload();
    rows.splice(0, rows.length);
  } finally {
    submitting.value = false;
  }
};
const loadSites = async () => { loading.sites = true; try { const { data } = await listReaderSourceSites(siteQuery); const result = unwrap(data); sites.value = result.rows; siteTotal.value = result.total; } finally { loading.sites = false; } };
const loadPolicies = async () => { loading.policies = true; try { const { data } = await listReaderSourcePolicies(policyQuery); const result = unwrap(data); policies.value = result.rows; policyTotal.value = result.total; } finally { loading.policies = false; } };
const loadRules = async () => { loading.rules = true; try { const { data } = await listReaderSourceRules(ruleQuery); const result = unwrap(data); rules.value = result.rows; ruleTotal.value = result.total; } finally { loading.rules = false; } };
const handleTaskSelectionChange = (rows: ReaderSourceTask[]) => {
  if (restoringTaskSelection.value) return;
  selectedTasks.value = rows;
  taskSelectionIds.value = new Set(rows.map(row => String(row.id)));
};
const loadTasks = async () => {
  loading.tasks = true;
  restoringTaskSelection.value = true;
  try {
    const selectedIds = new Set(taskSelectionIds.value);
    const { data } = await listReaderSourceTasks(taskQuery);
    const result = unwrap(data);
    tasks.value = result.rows;
    taskTotal.value = result.total;
    await nextTick();
    result.rows.forEach(row => {
      if (selectedIds.has(String(row.id))) taskTableRef.value?.toggleRowSelection(row, true);
    });
    selectedTasks.value = result.rows.filter(row => selectedIds.has(String(row.id)));
  } finally {
    restoringTaskSelection.value = false;
    loading.tasks = false;
  }
};
const refreshTaskMonitor = () => {
  if (activeTab.value === 'tasks' && !loading.tasks) loadTasks();
  if (taskBooksDialog.visible && taskBooksDialog.task && !loading.books) loadTaskBooks();
};
const loadTaskBooks = async () => { if (!taskBooksDialog.task) return; loading.books = true; try { const { data } = await listReaderSourceTaskBooks(taskBooksDialog.task.id, taskBookQuery); const result = unwrap(data); taskBooks.value = result.rows; taskBookTotal.value = result.total; } finally { loading.books = false; } };
const loadTaskBookSnapshots = async () => { if (!taskBooksDialog.task || !taskBooksDialog.selected) return; loading.bookSnapshots = true; try { const { data } = await listReaderSourceTaskBookSnapshots(taskBooksDialog.task.id, taskBooksDialog.selected.id, taskBookSnapshotQuery); const result = unwrap(data); taskBookSnapshots.value = result.rows; taskBookSnapshotTotal.value = result.total; } finally { loading.bookSnapshots = false; } };
const loadRuns = async () => { if (!runsDialog.task) return; loading.runs = true; try { const { data } = await listReaderSourceTaskRuns(runsDialog.task.id, runQuery); const result = unwrap(data); runs.value = result.rows; runTotal.value = result.total; } finally { loading.runs = false; } };
const loadDiffs = async () => { if (!runsDialog.task) return; loading.diffs = true; try { const { data } = await listReaderSourceTaskDiffs(runsDialog.task.id, diffQuery); const result = unwrap(data); snapshots.value = result.rows; snapshotTotal.value = result.total; } finally { loading.diffs = false; } };
const loadErrors = async () => { if (!runsDialog.task) return; loading.errors = true; try { const { data } = await listReaderSourceTaskErrors(runsDialog.task.id, errorQuery); const result = unwrap(data); errors.value = result.rows; errorTotal.value = result.total; } finally { loading.errors = false; } };
const loadLogs = async () => { if (!runsDialog.task) return; loading.logs = true; try { const { data } = await listReaderSourceTaskLogs(runsDialog.task.id, logQuery); const result = unwrap(data); logs.value = result.rows; logTotal.value = result.total; } finally { loading.logs = false; } };
const loadFallbacks = async () => { if (!taskDetailDialog.task) return; const { data } = await listReaderSourceTaskFallbacks(taskDetailDialog.task.id); fallbackRoutes.value = Array.isArray(data) ? data : []; };
const loadTaskChildren = async () => { if (!taskDetailDialog.task) return; loading.children = true; try { const { data } = await listReaderSourceTaskChildren(taskDetailDialog.task.id); taskChildren.value = Array.isArray(data) ? data : []; } finally { loading.children = false; } };
const autoProvisionFallbacks = async () => { if (!taskDetailDialog.task) return; loading.fallbacks = true; try { const { data } = await autoProvisionReaderSourceTaskFallbacks(taskDetailDialog.task.id); ElMessage.success(`已同步 ${Number(data || 0)} 条可用备用路由`); await Promise.all([loadFallbacks(), loadTaskChildren()]); } finally { loading.fallbacks = false; } };
const loadFallbackRules = async (siteId?: string | number) => { fallbackForm.ruleId = 0; fallbackRules.value = siteId ? (await listReaderSourceRules({ siteId, status: '1', pageNum: 1, pageSize: 100 })).data?.rows ?? [] : []; };
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
const openTaskBooks = (task: ReaderSourceTask) => { taskBooksDialog.task = task; taskBooksDialog.selected = undefined; taskBookQuery.pageNum = 1; taskBooksDialog.visible = true; loadTaskBooks(); };
const openTaskDetail = async (task: ReaderSourceTask) => { const { data } = await getReaderSourceTask(task.id); taskDetailDialog.task = data || task; taskDetailDialog.visible = true; fallbackForm.taskId = task.id; fallbackForm.siteId = 0; fallbackForm.ruleId = 0; fallbackForm.policyId = undefined; fallbackForm.sourceUrlTemplate = ''; try { await autoProvisionReaderSourceTaskFallbacks(task.id); } catch (error) { console.warn('自动同步备用书源失败', error); } await Promise.all([loadFallbacks(), loadTaskChildren()]); };
const saveFallbackRoute = async () => { if (!taskDetailDialog.task || !fallbackForm.siteId || !fallbackForm.ruleId || !fallbackForm.policyId || !fallbackForm.sourceUrlTemplate.trim()) { ElMessage.warning('请完整填写备用站点、规则、策略和地址模板'); return; } await saveReaderSourceTaskFallback(taskDetailDialog.task.id, { ...fallbackForm, taskId: taskDetailDialog.task.id }); ElMessage.success('备用书源已保存'); await loadFallbacks(); };
const materializeTask = async (task: ReaderSourceTask) => { await ElMessageBox.confirm('会把当前任务的快照补偿写入作品管理、章节正文和内容审核，是否继续？', '写入审核', { type: 'warning' }); const { data } = await materializeReaderSourceTask(task.id); ElMessage.success(`已补偿 ${data || 0} 条章节快照`); await loadTasks(); };
const openTaskBookSnapshots = (book: ReaderSourceTaskBook) => { taskBooksDialog.selected = book; taskBookSnapshotQuery.pageNum = 1; loadTaskBookSnapshots(); };
const handleRunsTabChange = (name: string | number) => { if (name === 'runs') loadRuns(); if (name === 'diffs') loadDiffs(); if (name === 'errors') loadErrors(); if (name === 'logs') loadLogs(); };

const siteLabel = (siteId?: string | number) => sites.value.find(item => String(item.id) === String(siteId))?.siteName || `站点 #${siteId || '-'}`;
const ruleLabelById = (ruleId?: string | number) => rules.value.find(item => String(item.id) === String(ruleId))?.ruleName || `规则 #${ruleId || '-'}`;

type GuideStep = {
  key: string;
  title: string;
  description: string;
  complete: boolean;
  statusLabel: string;
  actionLabel: string;
  action: () => void;
};

const openGuide = () => { guideVisible.value = true; };
const goDiscovery = () => { activeTab.value = 'discovery'; discoveryTab.value = 'providers'; guideVisible.value = false; };
const handleGuideStep = (step: GuideStep) => { step.action(); };

const guideSteps = computed<GuideStep[]>(() => {
  const hasSite = sites.value.length > 0;
  const unconfirmedSite = sites.value.find(item => item.complianceStatus !== 'APPROVED') || sites.value[0];
  const hasApprovedSite = sites.value.some(item => item.complianceStatus === 'APPROVED');
  const hasEnabledSite = sites.value.some(item => item.status === '1' && item.complianceStatus === 'APPROVED');
  const hasPolicy = activePolicies.value.length > 0;
  const draftRule = rules.value.find(item => item.status !== '1');
  const hasPublishedRule = rules.value.some(item => item.status === '1');
  const hasTask = tasks.value.length > 0;
  const reviewTask = tasks.value.find(item => ['WAITING_REVIEW', 'COMPLETED'].includes(item.status));

  return [
    {
      key: 'site',
      title: '登记书源站点',
      description: '填写站点名称、根地址、允许主机和备注，先把目标站点登记到系统。',
      complete: hasSite,
      statusLabel: hasSite ? '已完成' : '待新增',
      actionLabel: hasSite ? '查看站点' : '新增站点',
      action: () => { activeTab.value = 'sites'; guideVisible.value = false; if (!hasSite) openSiteDialog(); }
    },
    {
      key: 'compliance',
      title: '确认授权来源与采集许可',
      description: '根据实际授权材料填写说明；确认后，仍需单独打开站点的采集许可。',
      complete: hasApprovedSite,
      statusLabel: hasApprovedSite ? '已确认' : '待确认',
      actionLabel: hasApprovedSite ? '查看确认' : '去确认',
      action: () => { activeTab.value = 'sites'; guideVisible.value = false; if (unconfirmedSite) openComplianceDialog(unconfirmedSite); else openSiteDialog(); }
    },
    {
      key: 'enable-site',
      title: '打开站点采集许可',
      description: '授权确认后，在站点列表打开采集许可；未确认的站点不能被启用。',
      complete: hasEnabledSite,
      statusLabel: hasEnabledSite ? '已开启' : '待开启',
      actionLabel: hasEnabledSite ? '查看开关' : '去开启',
      action: () => { activeTab.value = 'sites'; guideVisible.value = false; }
    },
    {
      key: 'policy',
      title: '配置限流策略',
      description: '按目标站点的规则设置并发、访问间隔、频率上限、超时和重试参数。',
      complete: hasPolicy,
      statusLabel: hasPolicy ? '已配置' : '待配置',
      actionLabel: hasPolicy ? '查看策略' : '新增策略',
      action: () => { activeTab.value = 'policies'; guideVisible.value = false; if (!hasPolicy) openPolicyDialog(); }
    },
    {
      key: 'rule',
      title: '测试并发布解析规则',
      description: '配置目录、章节地址模板和选择器，保存为草稿后确认解析结果，再发布规则。',
      complete: hasPublishedRule,
      statusLabel: hasPublishedRule ? '已发布' : '待发布',
      actionLabel: hasPublishedRule ? '查看规则' : '配置规则',
      action: () => {
        activeTab.value = 'rules';
        guideVisible.value = false;
        if (!hasPublishedRule) {
          if (draftRule) openRuleDialog(draftRule);
          else {
            openRuleDialog();
            if (sites.value[0]) ruleDialog.form.siteId = sites.value[0].id;
          }
        }
      }
    },
    {
      key: 'task',
      title: '创建并启动采集任务',
      description: '选择已启用站点、已发布规则、访问策略和执行器，填写作品地址后创建任务并启动。',
      complete: hasTask,
      statusLabel: hasTask ? '已创建' : '待创建',
      actionLabel: hasTask ? '查看任务' : '新建任务',
      action: () => { activeTab.value = 'tasks'; guideVisible.value = false; if (!hasTask) openTaskDialog(); }
    },
    {
      key: 'review',
      title: '核验章节快照并发布作品',
      description: reviewTask ? '任务已形成快照，请在运行详情的“章节差异”中核对内容，再按作品审核流程发布。' : '任务完成后，先核对章节快照；系统不会自动发布未经审核的内容。',
      complete: false,
      statusLabel: reviewTask ? '待核验' : '等待采集',
      actionLabel: reviewTask ? '查看章节差异' : '查看采集任务',
      action: () => {
        activeTab.value = 'tasks';
        guideVisible.value = false;
        if (reviewTask) openDiffs(reviewTask);
        else loadTasks();
      }
    }
  ];
});

const activeGuideIndex = computed(() => {
  const index = guideSteps.value.findIndex(step => !step.complete);
  return index === -1 ? guideSteps.value.length - 1 : index;
});
const nextGuideStep = computed(() => guideSteps.value.find(step => !step.complete));

const submitSite = async () => { if (!(await siteFormRef.value?.validate())) return; submitting.value = true; try { if (siteDialog.editing && siteDialog.form.id) await updateReaderSourceSite(siteDialog.form.id, siteDialog.form); else await createReaderSourceSite(siteDialog.form); ElMessage.success('站点已保存，采集许可由你自主控制'); siteDialog.visible = false; await loadSites(); } finally { submitting.value = false; } };
const submitPolicy = async () => { if (!(await policyFormRef.value?.validate())) return; submitting.value = true; try { if (policyDialog.editing && policyDialog.form.id) await updateReaderSourcePolicy(policyDialog.form.id, policyDialog.form); else await createReaderSourcePolicy(policyDialog.form); ElMessage.success('访问策略已保存'); policyDialog.visible = false; await loadPolicies(); } finally { submitting.value = false; } };
const submitRule = async () => { if (!(await ruleFormRef.value?.validate())) return; submitting.value = true; try { if (ruleDialog.editing && ruleDialog.form.id) await updateReaderSourceRule(ruleDialog.form.id, ruleDialog.form); else await createReaderSourceRule(ruleDialog.form); ElMessage.success('解析规则已保存为草稿'); ruleDialog.visible = false; await loadRules(); } finally { submitting.value = false; } };
const submitCompliance = async () => { if (!complianceDialog.site) return; if (complianceDialog.approved && !complianceDialog.note.trim()) { ElMessage.warning('允许采集时请填写授权来源说明'); return; } submitting.value = true; try { await checkReaderSourceCompliance(complianceDialog.site.id, { approved: complianceDialog.approved, authorizationNote: complianceDialog.note.trim() }); ElMessage.success('风险确认已记录，采集许可仍由你自主控制'); complianceDialog.visible = false; await loadSites(); } finally { submitting.value = false; } };
const submitTask = async () => { if (!(await taskFormRef.value?.validate())) return; submitting.value = true; try { const payload = { ...taskDialog.form }; if (payload.collectionMode === 'SINGLE') payload.bookLimit = 1; else payload.sourceWorkTitle = ''; await createReaderSourceTask(payload); ElMessage.success('采集任务已创建，请从任务列表启动'); taskDialog.visible = false; activeTab.value = 'tasks'; await loadTasks(); } finally { submitting.value = false; } };
const submitProvider = async () => { if (!providerDialog.form.providerName || !providerDialog.form.providerUrl || !providerDialog.form.authorizationNote) { ElMessage.warning('发现源名称、地址和授权说明不能为空'); return; } submitting.value = true; try { if (providerDialog.editing && providerDialog.form.id) await updateReaderSourceDiscoveryProvider(providerDialog.form.id, providerDialog.form); else await createReaderSourceDiscoveryProvider(providerDialog.form); ElMessage.success('发现源已保存，启用后会按轮询时间自动运行'); providerDialog.visible = false; await loadDiscoveryProviders(); } finally { submitting.value = false; } };
const submitBlacklist = async () => { if (!blacklistDialog.form.matcherValue || !blacklistDialog.form.reason) { ElMessage.warning('匹配值和拦截原因不能为空'); return; } submitting.value = true; try { if (blacklistDialog.editing && blacklistDialog.form.id) await updateReaderSourceDiscoveryBlacklist(blacklistDialog.form.id, blacklistDialog.form); else await createReaderSourceDiscoveryBlacklist(blacklistDialog.form); ElMessage.success('黑名单已保存，后续发现请求会优先拦截'); blacklistDialog.visible = false; await loadDiscoveryBlacklist(); } finally { submitting.value = false; } };
const toggleSite = async (row: ReaderSourceSite, enabled: boolean) => { await (enabled ? enableReaderSourceSite(row.id) : disableReaderSourceSite(row.id)); ElMessage.success(enabled ? '站点已启用' : '站点已停用'); loadSites(); };
const toggleRule = async (row: ReaderSourceRule, enabled: boolean) => { await (enabled ? publishReaderSourceRule(row.id) : disableReaderSourceRule(row.id)); ElMessage.success(enabled ? '解析规则已发布' : '解析规则已停用'); loadRules(); };
const operateTask = async (row: ReaderSourceTask, action: 'start' | 'pause' | 'resume' | 'cancel') => { await ElMessageBox.confirm(`确认${action === 'start' ? '启动' : action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '取消'}任务“${row.taskName}”吗？`, '任务操作', { type: action === 'cancel' ? 'warning' : 'info' }); if (action === 'start') await startReaderSourceTask(row.id); if (action === 'pause') await pauseReaderSourceTask(row.id); if (action === 'resume') await resumeReaderSourceTask(row.id); if (action === 'cancel') await cancelReaderSourceTask(row.id); ElMessage.success('任务状态已更新'); loadTasks(); };
const retryCircuitTask = async (row: ReaderSourceTask) => { await ElMessageBox.confirm('将清除该站点的连续失败计数和熔断标志，然后重新创建一次采集运行。原失败记录和日志会保留，是否继续？', '重置熔断并重试', { type: 'warning', confirmButtonText: '确认重试' }); await retryCircuitReaderSourceTask(row.id); ElMessage.success('已重置熔断并创建重试运行'); await loadTasks(); };
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
const executionLabel = (value?: string) => ({ WAITING_WORKER: '等待 Worker 领取', COLLECTING: 'Worker 实际采集中', WAITING_RATE_LIMIT: '等待分钟限流窗口', WAITING_DAILY_LIMIT: '等待每日额度恢复', WAITING_MANUAL: '等待人工处理', PAUSED: '已暂停' } as Record<string, string>)[value || ''] || (value ? value : '无运行记录');
const runLabel = (row: ReaderSourceTaskRun) => row.status === 'RUNNING' ? (row.claimedAt ? 'Worker 实际执行' : '等待 Worker 领取') : taskLabel(row.status);
const runTag = (row: ReaderSourceTaskRun) => row.status === 'RUNNING' ? (row.claimedAt ? 'warning' : 'info') : taskTag(row.status);
const failureLabel = (value?: string) => ({ DAILY_LIMIT: '每日额度已满', HTTP_401: '401 未授权', HTTP_403: '403 被拒绝', HTTP_5XX: '站点 5xx 暂时故障', HTTP_ERROR: 'HTTP 请求异常', TIMEOUT: '访问超时', PARSE: '解析失败', QUALITY: '正文质量校验', POLICY: '策略阻断', SSRF: '地址安全阻断', RATE_LIMIT: '分钟限流' } as Record<string, string>)[value || ''] || value || '未知';
const failureTag = (value?: string) => ['HTTP_401', 'HTTP_403', 'SSRF', 'POLICY'].includes(value || '') ? 'danger' : value === 'DAILY_LIMIT' ? 'warning' : 'info';
const triggerLabel = (value?: string) => ({ DAILY_LIMIT: '每日额度', AUTO_RETRY: '自动重试', FALLBACK: '备用续采', RATE_LIMIT: '分钟限流', LEASE_RECOVERY: '租约恢复', MANUAL: '人工启动' } as Record<string, string>)[value || ''] || value || '未知触发';
const providerRunLabel = (value?: string) => value === 'COMPLETED' ? '已完成' : value === 'FAILED' ? '失败' : value === 'RUNNING' ? '运行中' : '未运行';
const providerRunTag = (value?: string) => value === 'COMPLETED' ? 'success' : value === 'FAILED' ? 'danger' : value === 'RUNNING' ? 'warning' : 'info';
const matcherTypeLabel = (value: string) => value === 'HOST' ? '精确主机' : value === 'SUFFIX' ? '域名后缀' : '精确地址';
const robotsLabel = (value: string) => value === 'ALLOWED' ? '允许' : value === 'DISALLOWED' ? '已拒绝' : value === 'UNAVAILABLE' ? '无法检查' : '未检查';
const robotsTag = (value: string) => value === 'ALLOWED' ? 'success' : value === 'DISALLOWED' ? 'danger' : 'warning';
const candidateLabel = (value: string) => value === 'NEEDS_REVIEW' ? '待审核' : value === 'BLOCKED' ? '已拦截' : value === 'CHECK_FAILED' ? '检查失败' : value === 'APPROVED' ? '已通过' : value === 'REJECTED' ? '已拒绝' : value;
const candidateTag = (value: string) => value === 'NEEDS_REVIEW' ? 'warning' : value === 'APPROVED' ? 'success' : value === 'BLOCKED' || value === 'REJECTED' ? 'danger' : 'info';

const taskRefreshTimer = window.setInterval(refreshTaskMonitor, 5000);
onMounted(async () => { await Promise.all([loadSites(), loadPolicies(), loadDiscoveryProviders()]); });
onUnmounted(() => window.clearInterval(taskRefreshTimer));
</script>

<style scoped lang="scss">
.center-header, .toolbar-row, .header-actions { display: flex; align-items: center; }
.center-header, .toolbar-row { justify-content: space-between; gap: 16px; }
.header-actions { gap: 12px; }
.batch-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.task-batch-actions { margin-bottom: 12px; justify-content: flex-end; }
.toolbar-row { margin-bottom: 16px; flex-wrap: wrap; }
.fallback-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.fallback-toolbar .el-alert { flex: 1; }
.toolbar-row :deep(.el-form-item) { margin-bottom: 0; }
.workflow-card { border: 1px solid var(--el-color-primary-light-7); background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color)); }
.workflow-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.workflow-kicker { color: var(--el-color-primary); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.workflow-title { margin: 4px 0 0; color: var(--el-text-color-primary); font-size: 18px; line-height: 1.4; }
.workflow-description { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.5; }
.workflow-progress { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-top: 22px; }
.workflow-step { display: flex; min-width: 0; align-items: center; gap: 8px; padding: 10px 8px; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: border-color 0.2s, background-color 0.2s; }
.workflow-step:hover, .workflow-step.is-current { border-color: var(--el-color-primary-light-5); background: var(--el-fill-color-blank); }
.workflow-step.is-complete .workflow-step-index { color: var(--el-color-success); border-color: var(--el-color-success-light-3); background: var(--el-color-success-light-9); }
.workflow-step-index { display: inline-flex; flex: 0 0 24px; align-items: center; justify-content: center; width: 24px; height: 24px; border: 1px solid var(--el-border-color); border-radius: 50%; color: var(--el-text-color-secondary); font-size: 12px; font-weight: 600; }
.workflow-step.is-current .workflow-step-index { color: var(--el-color-primary); border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.workflow-step-body { min-width: 0; }
.workflow-step-title { overflow: hidden; color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.workflow-step-status { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.workflow-next { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 16px; padding: 12px 14px; border-radius: 8px; background: var(--el-fill-color-blank); }
.workflow-next > div { min-width: 0; }
.workflow-next-label { margin-right: 8px; color: var(--el-color-primary); font-size: 12px; font-weight: 600; }
.workflow-next strong { color: var(--el-text-color-primary); font-size: 13px; }
.workflow-next-description { display: block; margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.workflow-finished { margin-top: 16px; }
.guide-list { display: flex; flex-direction: column; gap: 10px; }
.optional-discovery { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; padding: 11px 14px; border: 1px dashed var(--el-border-color); border-radius: 8px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.optional-discovery strong { margin-right: 8px; color: var(--el-text-color-primary); }
.guide-row { display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; }
.guide-row.is-current { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.guide-row.is-complete { border-color: var(--el-color-success-light-7); }
.guide-number { display: inline-flex; flex: 0 0 28px; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--el-border-color); border-radius: 50%; color: var(--el-text-color-secondary); font-size: 13px; font-weight: 600; }
.guide-row.is-complete .guide-number { color: var(--el-color-success); border-color: var(--el-color-success-light-3); background: var(--el-color-success-light-9); }
.guide-content { flex: 1; min-width: 0; }
.guide-title-row { display: flex; align-items: center; gap: 8px; }
.guide-content p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.primary-text { color: var(--el-text-color-primary); font-weight: 600; }
.muted-text { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
.template-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.locked-policy { margin-left: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
.form-tip { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.guard-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 20px; padding: 2px 4px 4px; }
.guard-item { display: flex; align-items: center; justify-content: space-between; min-height: 30px; color: var(--el-text-color-regular); font-size: 13px; }
@media (max-width: 900px) {
  .center-header, .toolbar-row { align-items: flex-start; flex-direction: column; }
  .fallback-toolbar { align-items: stretch; flex-direction: column; }
  .header-actions { width: 100%; justify-content: space-between; }
  .workflow-head, .workflow-next { align-items: flex-start; flex-direction: column; }
  .workflow-progress { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .guard-grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .workflow-progress { grid-template-columns: 1fr; }
  .optional-discovery { align-items: flex-start; flex-direction: column; }
  .guide-row { align-items: flex-start; }
  .guide-row :deep(.el-button) { margin-left: auto; }
}
</style>
