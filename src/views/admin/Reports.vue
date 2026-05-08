<template>
  <div class="dash admin-reports">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="admin-badge">Admin panel</div></div>
      <div class="s-user">
        <div class="s-avatar">{{ getInitials(authStore.profile?.first_name + ' ' + authStore.profile?.last_name) || 'AD' }}</div>
        <div>
          <div class="s-name">{{ authStore.profile?.first_name }} {{ authStore.profile?.last_name }}</div>
          <div class="s-role">{{ authStore.profile?.role === 'admin' ? 'System Administrator' : authStore.profile?.role }}</div>
        </div>
      </div>
<ul class="s-nav">
  <li :class="{ active: $route.path === '/admin/dashboard' }" @click="$router.push('/admin/dashboard')">⬡ Overview</li>
  <li :class="{ active: $route.path === '/admin/users' }" @click="$router.push('/admin/users')">⬡ Users</li>
  <li :class="{ active: $route.path === '/admin/listings' }" @click="$router.push('/admin/listings')">⬡ All listings</li>
  <li :class="{ active: $route.path === '/admin/applications' }" @click="$router.push('/admin/applications')">⬡ Applications</li>
  <li :class="{ active: $route.path === '/admin/ai-logs' }" @click="$router.push('/admin/ai-logs')">⬡ AI match logs</li>
  <div class="s-nav-label">Management</div>
  <li :class="{ active: $route.path === '/admin/employers' }" @click="$router.push('/admin/employers')">⬡ Employers</li>
  <li :class="{ active: $route.path === '/admin/announcements' }" @click="$router.push('/admin/announcements')">⬡ Announcements</li>
  <li :class="{ active: $route.path === '/admin/reports' }" @click="$router.push('/admin/reports')">⬡ Reports</li>
  <div class="s-nav-label">System</div>
  <li :class="{ active: $route.path === '/admin/settings' }" @click="$router.push('/admin/settings')">⬡ Settings</li>
  <li :class="{ active: $route.path === '/admin/audit-logs' }" @click="$router.push('/admin/audit-logs')">⬡ Audit logs</li>
  <li @click="handleLogout">⬡ Logout</li>
</ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div><div class="page-title">Reports</div><div class="page-sub">Analytics and downloadable platform activity data</div></div>
        <div class="live-badge"><div class="live-dot"></div> System Live</div>
      </div>

      <div class="filters-bar">
        <select v-model="reportType" class="filter-select">
          <option value="overview">Overview Report</option>
          <option value="users">User Report</option>
          <option value="jobs">Jobs Report</option>
          <option value="applications">Applications Report</option>
          <option value="matches">Match Report</option>
        </select>
        <input type="date" v-model="startDate" class="filter-select" />
        <input type="date" v-model="endDate" class="filter-select" />
        <button class="btn-primary" @click="generateReport">Generate Report</button>
        <button class="btn-outline" @click="exportReport" :disabled="!reportData">Export CSV</button>
      </div>
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div v-if="generating" class="loading-state">Generating report...</div>
      <div v-else-if="reportData" class="report-container">
        <div class="report-header"><h2>{{ reportTitle }}</h2><p>Generated on {{ new Date().toLocaleString() }}</p></div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value">{{ reportData.total }}</div><div class="stat-label">Total</div></div>
          <div class="stat-card"><div class="stat-value">{{ reportData.active }}</div><div class="stat-label">Active / Valid</div></div>
          <div class="stat-card"><div class="stat-value">{{ reportData.inactive }}</div><div class="stat-label">Inactive / Other</div></div>
          <div class="stat-card"><div class="stat-value">{{ reportData.percentage }}%</div><div class="stat-label">Metric Ratio</div></div>
        </div>
        
        <div class="data-card">
          <div class="card-header"><h3>Detailed Data</h3></div>
          <div class="report-table-container">
            <table class="report-table">
              <thead>
                <tr v-if="reportType === 'overview'">
                  <th>Metric</th><th>Count</th>
                </tr>
                <tr v-else-if="reportType === 'users'">
                  <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th>
                </tr>
                <tr v-else-if="reportType === 'jobs'">
                  <th>Title</th><th>Employer</th><th>Posted</th><th>Status</th>
                </tr>
                <tr v-else-if="reportType === 'applications'">
                  <th>Student</th><th>Job</th><th>Applied</th><th>Status</th>
                </tr>
                <tr v-else-if="reportType === 'matches'">
                  <th>Student</th><th>Job</th><th>Score</th><th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="reportType === 'overview'">
                  <tr v-for="(val, key) in reportData.data" :key="key">
                    <td>{{ key.replace(/_/g, ' ').toUpperCase() }}</td><td>{{ val }}</td>
                  </tr>
                </template>
                <template v-else-if="reportType === 'users'">
                  <tr v-for="u in reportData.data" :key="u.id">
                    <td>{{ u.first_name }} {{ u.last_name }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td><td>{{ formatDate(u.created_at) }}</td><td>{{ u.is_active !== false ? 'Active' : 'Inactive' }}</td>
                  </tr>
                </template>
                <template v-else-if="reportType === 'jobs'">
                  <tr v-for="j in reportData.data" :key="j.id">
                    <td>{{ j.title }}</td><td>{{ j.employer_name || 'N/A' }}</td><td>{{ formatDate(j.posted_at) }}</td><td>{{ j.status }}</td>
                  </tr>
                </template>
                <template v-else-if="reportType === 'applications'">
                  <tr v-for="a in reportData.data" :key="a.id">
                    <td>{{ a.student_name }}</td><td>{{ a.job_title }}</td><td>{{ formatDate(a.applied_at) }}</td><td>{{ a.status }}</td>
                  </tr>
                </template>
                <template v-else-if="reportType === 'matches'">
                  <tr v-for="m in reportData.data" :key="m.id">
                    <td>{{ m.student_name }}</td><td>{{ m.job_title }}</td><td>{{ Math.round((m.score || 0) * 100) }}%</td><td class="rationale-cell">{{ m.rationale || 'No rationale available' }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Select filters and click Generate Report</div></div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
const generating = ref(false)
const reportData = ref(null)
const reportTitle = ref('')
const reportType = ref('overview')
const errorMessage = ref('')
const startDate = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : 'AD'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }
const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A'

const safeCount = async (table, apply = query => query) => {
  const { count, error } = await apply(supabase.from(table).select('*', { count: 'exact', head: true }))
  if (error) throw new Error(`${table}: ${error.message}`)
  return count || 0
}

const safeSelect = async (table, columns = '*', apply = query => query) => {
  const { data, error } = await apply(supabase.from(table).select(columns))
  if (error) throw new Error(`${table}: ${error.message}`)
  return data || []
}

const applyDateRange = (query, column) => {
  let next = query
  if (startDate.value) next = next.gte(column, new Date(`${startDate.value}T00:00:00`).toISOString())
  if (endDate.value) next = next.lte(column, new Date(`${endDate.value}T23:59:59`).toISOString())
  return next
}

const generateReport = async () => {
  generating.value = true
  errorMessage.value = ''
  try {
    if (reportType.value === 'overview') {
      const [users, profileStudents, profileEmployers, studentProfiles, employerProfiles, jobs, activeJobs, applications, hired] = await Promise.all([
        safeCount('profiles'),
        safeCount('profiles', q => q.eq('role', 'student')),
        safeCount('profiles', q => q.eq('role', 'employer')),
        safeCount('student_profiles'),
        safeCount('employer_profiles'),
        safeCount('jobs'),
        safeCount('jobs', q => q.eq('status', 'active')),
        safeCount('applications'),
        safeCount('applications', q => q.eq('status', 'hired'))
      ])
      const students = profileStudents || studentProfiles
      const employers = profileEmployers || employerProfiles
      reportTitle.value = 'Platform Overview Report'
      reportData.value = { total: users || 0, active: activeJobs || 0, inactive: Math.max((jobs || 0) - (activeJobs || 0), 0), percentage: jobs ? Math.round((activeJobs || 0) / jobs * 100) : 0, data: { students: students || 0, employers: employers || 0, total_jobs: jobs || 0, active_jobs: activeJobs || 0, total_applications: applications || 0, hired_students: hired || 0 } }
    } else if (reportType.value === 'users') {
      const users = await safeSelect('profiles', 'id, first_name, last_name, email, role, created_at, is_active', q => applyDateRange(q, 'created_at').order('created_at', { ascending: false }))
      reportTitle.value = 'User Report'
      reportData.value = { total: users?.length || 0, active: users?.filter(u => u.is_active !== false).length || 0, inactive: users?.filter(u => u.is_active === false).length || 0, percentage: users?.length ? Math.round(users.filter(u => u.is_active !== false).length / users.length * 100) : 0, data: users || [] }
    } else if (reportType.value === 'jobs') {
      const jobs = await safeSelect('jobs', 'id, employer_id, title, status, posted_at', q => applyDateRange(q, 'posted_at').order('posted_at', { ascending: false }))
      const employerIds = [...new Set(jobs.map(j => j.employer_id).filter(Boolean))]
      const employers = employerIds.length ? await safeSelect('employer_profiles', 'user_id, company_name', q => q.in('user_id', employerIds)) : []
      const employerMap = new Map(employers.map(e => [e.user_id, e.company_name]))
      const enrichedJobs = jobs.map(job => ({ ...job, employer_name: employerMap.get(job.employer_id) || 'N/A' }))
      reportTitle.value = 'Jobs Report'
      reportData.value = { total: enrichedJobs.length, active: enrichedJobs.filter(j => j.status === 'active').length, inactive: enrichedJobs.filter(j => j.status !== 'active').length, percentage: enrichedJobs.length ? Math.round(enrichedJobs.filter(j => j.status === 'active').length / enrichedJobs.length * 100) : 0, data: enrichedJobs }
    } else if (reportType.value === 'applications') {
      const apps = await safeSelect('applications', 'id, student_id, job_id, status, applied_at, reviewed_at, match_score', q => applyDateRange(q, 'applied_at').order('applied_at', { ascending: false }))
      const studentIds = [...new Set(apps.map(a => a.student_id).filter(Boolean))]
      const jobIds = [...new Set(apps.map(a => a.job_id).filter(Boolean))]
      const profiles = studentIds.length ? await safeSelect('profiles', 'id, first_name, last_name', q => q.in('id', studentIds)) : []
      const jobs = jobIds.length ? await safeSelect('jobs', 'id, title', q => q.in('id', jobIds)) : []
      const profileMap = new Map(profiles.map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown']))
      const jobMap = new Map(jobs.map(j => [j.id, j.title]))
      const enrichedApps = apps.map(app => ({ ...app, student_name: profileMap.get(app.student_id) || 'Unknown', job_title: jobMap.get(app.job_id) || 'Unknown' }))
      reportTitle.value = 'Applications Report'
      reportData.value = { total: enrichedApps.length, active: enrichedApps.filter(a => a.status !== 'rejected').length, inactive: enrichedApps.filter(a => a.status === 'rejected').length, percentage: enrichedApps.length ? Math.round(enrichedApps.filter(a => a.status !== 'rejected').length / enrichedApps.length * 100) : 0, data: enrichedApps }
    } else if (reportType.value === 'matches') {
      const matches = await safeSelect('match_scores', 'id, student_id, job_id, score, rationale, computed_at', q => applyDateRange(q, 'computed_at').order('computed_at', { ascending: false }))
      const studentIds = [...new Set(matches.map(m => m.student_id).filter(Boolean))]
      const jobIds = [...new Set(matches.map(m => m.job_id).filter(Boolean))]
      const profiles = studentIds.length ? await safeSelect('profiles', 'id, first_name, last_name', q => q.in('id', studentIds)) : []
      const jobs = jobIds.length ? await safeSelect('jobs', 'id, title', q => q.in('id', jobIds)) : []
      const profileMap = new Map(profiles.map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown']))
      const jobMap = new Map(jobs.map(j => [j.id, j.title]))
      const enrichedMatches = matches.map(match => ({ ...match, student_name: profileMap.get(match.student_id) || 'Unknown', job_title: jobMap.get(match.job_id) || 'Unknown' }))
      reportTitle.value = 'AI Match Report'
      reportData.value = { total: enrichedMatches.length, active: enrichedMatches.filter(m => m.score >= 0.5).length, inactive: enrichedMatches.filter(m => m.score < 0.5).length, percentage: enrichedMatches.length ? Math.round(enrichedMatches.filter(m => m.score >= 0.5).length / enrichedMatches.length * 100) : 0, data: enrichedMatches }
    }
  } catch (error) {
    console.error('Error generating report:', error)
    reportData.value = null
    errorMessage.value = `Failed to generate report: ${error.message || 'Unknown Supabase error'}`
  } finally { generating.value = false }
}

const exportReport = () => {
  if (!reportData.value) return
  const csv = convertToCSV(reportData.value.data)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reportTitle.value.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const convertToCSV = (data) => {
  const isArray = Array.isArray(data)
  if (!data || (isArray && !data.length)) return ''
  const rows = isArray ? data : [data]
  const headers = Object.keys(rows[0])
  const csvRows = [headers.join(',')]
  for (const row of rows) { const values = headers.map(header => JSON.stringify(row[header] || '')); csvRows.push(values.join(',')) }
  return csvRows.join('\n')
}
</script>

<style scoped>
.admin-badge, .s-role { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; display: inline-block; }
.s-role { display: block; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.error-banner { background: #FEF0F0; color: #B03030; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.82rem; }
.btn-primary { background: var(--gc-green); color: #fff; border: none; border-radius: 24px; padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; }
.btn-outline { background: transparent; color: var(--gc-green); border: 1px solid var(--gc-green); border-radius: 24px; padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
.filter-select { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { background: #fff; border: 1px solid #C0DD97; border-radius: 12px; padding: 1rem; text-align: center; }
.stat-value { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: var(--gc-green); }
.stat-label { font-size: 0.7rem; color: var(--gc-muted); margin-top: 0.25rem; }
.data-card { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow: hidden; }
.card-header { padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; }
.card-header h3 { font-size: 0.85rem; margin: 0; }
.report-table-container { padding: 0; overflow-x: auto; max-height: 500px; }
.report-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.report-table th { background: #FAFAF7; text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #C0DD97; color: var(--gc-muted); font-weight: 600; }
.report-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; }
.report-table tr:hover { background: #FAFAF7; }
.rationale-cell { max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.7rem; color: var(--gc-muted); }
.loading-state, .empty-state { text-align: center; padding: 3rem; color: var(--gc-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-title { font-size: 1rem; }
.report-header { margin-bottom: 1rem; }
.report-header h2 { font-size: 1.2rem; }
.report-header p { font-size: 0.7rem; color: var(--gc-muted); }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .filters-bar { flex-direction: column; } .filter-select { width: 100%; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>
