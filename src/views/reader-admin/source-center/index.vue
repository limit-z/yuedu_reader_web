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
  pauseReaderSourceTask,
  publishReaderSourceRule,
  resumeReaderSourceTask,
  startReaderSourceTask,
  updateReaderSourcePolicy,
  updateReaderSourceRule,
  updateReaderSourceSite
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
  ReaderSourceError
} from '@/api/reader/admin/types';

defineOptions({ name: 'ReaderAdminSourceCenterPage' });

const activeTab = ref('sites');
const submitting = ref(false);
const loading = reactive({ sites: false, policies: false, rules: false, tasks: false, runs: false, diffs: false, errors: false });
const sites = ref<ReaderSourceSite[]>([]);
const policies = ref<ReaderSourcePolicy[]>([]);
const rules = ref<ReaderSourceRule[]>([]);
const tasks = ref<ReaderSourceTask[]>([]);
const runs = ref<ReaderSourceTaskRun[]>([]);
const snapshots = ref<ReaderSourceChapterSnapshot[]>([]);
const errors = ref<ReaderSourceError[]>([]);
const siteTotal = ref(0);
const policyTotal = ref(0);
const ruleTotal = ref(0);
const taskTotal = ref(0);
const runTotal = ref(0);
const snapshotTotal = ref(0);
const errorTotal = ref(0);
const siteQuery = reactive({ pageNum: 1, pageSize: 10, siteName: '', complianceStatus: '' });
const policyQuery = reactive({ pageNum: 1, pageSize: 10, policyName: '' });
const ruleQuery = reactive<{ pageNum: number; pageSize: number; siteId?: string | number; status: string }>({ pageNum: 1, pageSize: 10, siteId: undefined, status: '' });
const taskQuery = reactive({ pageNum: 1, pageSize: 10, taskName: '', status: '' });
const runQuery = reactive({ pageNum: 1, pageSize: 10 });
const diffQuery = reactive({ pageNum: 1, pageSize: 10 });
const errorQuery = reactive({ pageNum: 1, pageSize: 10 });

const blankSite = (): ReaderSourceSiteForm => ({ siteName: '', baseUrl: '', allowedHost: '', authorizationNote: '', defaultPolicyId: undefined, remark: '' });
const blankPolicy = (): ReaderSourcePolicyForm => ({ policyName: '', concurrencyLimit: 1, minDelayMs: 3000, maxDelayMs: 8000, requestsPerMinute: 10, dailyRequestLimit: 1000, connectTimeoutMs: 10000, readTimeoutMs: 20000, maxRetries: 2, circuitBreakerThreshold: 5, honorRetryAfter: '1', remark: '' });
const blankRule = (): ReaderSourceRuleForm => ({ siteId: '', ruleName: '', catalogUrlTemplate: '', chapterUrlTemplate: '', selectorJson: '{\n  "catalog": { "item": ".chapter-item", "title": ".chapter-title" },\n  "chapter": { "title": "h1", "content": ".content" }\n}', testUrl: '', remark: '' });
const blankTask = (): ReaderSourceTaskForm => ({ taskName: '', siteId: undefined, ruleId: undefined, policyId: undefined, executorType: 'JAVA', sourceWorkUrl: '', sourceWorkTitle: '', startChapterNo: 1, endChapterNo: undefined, incremental: '1' });
const siteDialog = reactive({ visible: false, editing: false, form: blankSite() });
const policyDialog = reactive({ visible: false, editing: false, form: blankPolicy() });
const ruleDialog = reactive({ visible: false, editing: false, form: blankRule() });
const taskDialog = reactive({ visible: false, form: blankTask() });
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
const handleTabChange = (name: string | number) => { if (name === 'policies' && !policies.value.length) loadPolicies(); if (name === 'rules') loadRules(); if (name === 'tasks') loadTasks(); };
const resetSiteQuery = () => { siteQuery.pageNum = 1; siteQuery.siteName = ''; siteQuery.complianceStatus = ''; loadSites(); };

const openSiteDialog = (row?: ReaderSourceSite) => { siteDialog.editing = !!row; siteDialog.form = row ? { ...row } : blankSite(); siteDialog.visible = true; };
const openPolicyDialog = (row?: ReaderSourcePolicy) => { policyDialog.editing = !!row; policyDialog.form = row ? { ...row } : blankPolicy(); policyDialog.visible = true; };
const openRuleDialog = (row?: ReaderSourceRule) => { ruleDialog.editing = !!row; ruleDialog.form = row ? { ...row } : blankRule(); ruleDialog.visible = true; };
const openTaskDialog = () => { taskDialog.form = blankTask(); taskRulesOptions.value = []; taskDialog.visible = true; };
const openComplianceDialog = (site: ReaderSourceSite) => { complianceDialog.site = site; complianceDialog.approved = site.complianceStatus !== 'REJECTED'; complianceDialog.note = site.authorizationNote || ''; complianceDialog.visible = true; };
const openRuns = (task: ReaderSourceTask) => { runsDialog.task = task; runsDialog.tab = 'runs'; runQuery.pageNum = 1; runsDialog.visible = true; loadRuns(); };
const openDiffs = (task: ReaderSourceTask) => { runsDialog.task = task; runsDialog.tab = 'diffs'; diffQuery.pageNum = 1; runsDialog.visible = true; loadDiffs(); };
const handleRunsTabChange = (name: string | number) => { if (name === 'runs') loadRuns(); if (name === 'diffs') loadDiffs(); if (name === 'errors') loadErrors(); };

const submitSite = async () => { if (!(await siteFormRef.value?.validate())) return; submitting.value = true; try { if (siteDialog.editing && siteDialog.form.id) await updateReaderSourceSite(siteDialog.form.id, siteDialog.form); else await createReaderSourceSite(siteDialog.form); ElMessage.success('站点已保存，需通过合规确认后才能启用'); siteDialog.visible = false; await loadSites(); } finally { submitting.value = false; } };
const submitPolicy = async () => { if (!(await policyFormRef.value?.validate())) return; submitting.value = true; try { if (policyDialog.editing && policyDialog.form.id) await updateReaderSourcePolicy(policyDialog.form.id, policyDialog.form); else await createReaderSourcePolicy(policyDialog.form); ElMessage.success('访问策略已保存'); policyDialog.visible = false; await loadPolicies(); } finally { submitting.value = false; } };
const submitRule = async () => { if (!(await ruleFormRef.value?.validate())) return; submitting.value = true; try { if (ruleDialog.editing && ruleDialog.form.id) await updateReaderSourceRule(ruleDialog.form.id, ruleDialog.form); else await createReaderSourceRule(ruleDialog.form); ElMessage.success('解析规则已保存为草稿'); ruleDialog.visible = false; await loadRules(); } finally { submitting.value = false; } };
const submitCompliance = async () => { if (!complianceDialog.site) return; submitting.value = true; try { await checkReaderSourceCompliance(complianceDialog.site.id, { approved: complianceDialog.approved, authorizationNote: complianceDialog.note }); ElMessage.success('合规确认已记录'); complianceDialog.visible = false; await loadSites(); } finally { submitting.value = false; } };
const submitTask = async () => { if (!(await taskFormRef.value?.validate())) return; submitting.value = true; try { await createReaderSourceTask(taskDialog.form); ElMessage.success('采集任务已创建，请从任务列表启动'); taskDialog.visible = false; activeTab.value = 'tasks'; await loadTasks(); } finally { submitting.value = false; } };
const toggleSite = async (row: ReaderSourceSite, enabled: boolean) => { await (enabled ? enableReaderSourceSite(row.id) : disableReaderSourceSite(row.id)); ElMessage.success(enabled ? '站点已启用' : '站点已停用'); loadSites(); };
const toggleRule = async (row: ReaderSourceRule, enabled: boolean) => { await (enabled ? publishReaderSourceRule(row.id) : disableReaderSourceRule(row.id)); ElMessage.success(enabled ? '解析规则已发布' : '解析规则已停用'); loadRules(); };
const operateTask = async (row: ReaderSourceTask, action: 'start' | 'pause' | 'resume' | 'cancel') => { await ElMessageBox.confirm(`确认${action === 'start' ? '启动' : action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '取消'}任务“${row.taskName}”吗？`, '任务操作', { type: action === 'cancel' ? 'warning' : 'info' }); if (action === 'start') await startReaderSourceTask(row.id); if (action === 'pause') await pauseReaderSourceTask(row.id); if (action === 'resume') await resumeReaderSourceTask(row.id); if (action === 'cancel') await cancelReaderSourceTask(row.id); ElMessage.success('任务状态已更新'); loadTasks(); };
const handleTaskSiteChange = async (siteId?: string | number) => { taskDialog.form.ruleId = undefined; taskRulesOptions.value = []; if (siteId) { const { data } = await listReaderSourceRules({ siteId, status: '1', pageNum: 1, pageSize: 100 }); taskRulesOptions.value = data?.rows ?? []; } };

const complianceLabel = (value: string) => value === 'APPROVED' ? '已确认' : value === 'REJECTED' ? '不允许' : '未确认';
const complianceTag = (value: string) => value === 'APPROVED' ? 'success' : value === 'REJECTED' ? 'danger' : 'warning';
const ruleLabel = (value: string) => value === '1' ? '启用' : value === '2' ? '停用' : '草稿';
const ruleTag = (value: string) => value === '1' ? 'success' : value === '2' ? 'info' : 'warning';
const taskLabel = (value: string) => taskStatuses.find(item => item.value === value)?.label || value;
const taskTag = (value: string) => ['RUNNING', 'WAITING_REVIEW'].includes(value) ? 'warning' : ['COMPLETED'].includes(value) ? 'success' : ['FAILED', 'CANCELED'].includes(value) ? 'danger' : 'info';

onMounted(async () => { await Promise.all([loadSites(), loadPolicies()]); });
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
