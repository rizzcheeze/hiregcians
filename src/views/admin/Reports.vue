<template>
  <div class="dash admin-reports">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="admin-badge">Admin panel</div></div>
      <div class="s-user">
        <div class="s-avatar">AD</div>
        <div><div class="s-name">Admin User</div><div class="s-role">Gordon College oversight</div></div>
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
        <div><div class="page-title">Reports</div><div class="page-sub">Platform analytics and exportable reports</div></div>
        <div class="live-badge"><div class="live-dot"></div> Live</div>
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

      <div v-if="generating" class="loading-state">Generating report...</div>
      <div v-else-if="reportData" class="report-container">
        <div class="report-header"><h2>{{ reportTitle }}</h2><p>Generated on {{ new Date().toLocaleString() }}</p></div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value">{{ reportData.total }}</div><div class="stat-label">Total</div></div>
          <div class="stat-card"><div class="stat-value">{{ reportData.active }}</div><div class="stat-label">Active</div></div>
          <div class="stat-card"><div class="stat-value">{{ reportData.inactive }}</div><div class="stat-label">Inactive</div></div>
          <div class="stat-card"><div class="stat-value">{{ reportData.percentage }}%</div><div class="stat-label">Engagement</div></div>
        </div>
        <div class="data-card"><div class="card-header"><h3>Details</h3></div><div class="report-details"><pre>{{ JSON.stringify(reportData.data, null, 2) }}</pre></div></div>
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
const startDate = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const generateReport = async () => {
  generating.value = true
  try {
    if (reportType.value === 'overview') {
      const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      const { count: employers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer')
      const { count: jobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true })
      const { count: activeJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active')
      const { count: applications } = await supabase.from('applications').select('*', { count: 'exact', head: true })
      const { count: hired } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'hired')
      reportTitle.value = 'Platform Overview Report'
      reportData.value = { total: users || 0, active: activeJobs || 0, inactive: (users || 0) - (activeJobs || 0), percentage: users ? Math.round((activeJobs || 0) / users * 100) : 0, data: { students: students || 0, employers: employers || 0, total_jobs: jobs || 0, active_jobs: activeJobs || 0, total_applications: applications || 0, hired_students: hired || 0 } }
    } else if (reportType.value === 'users') {
      const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      reportTitle.value = 'User Report'
      reportData.value = { total: users?.length || 0, active: users?.filter(u => u.is_active !== false).length || 0, inactive: users?.filter(u => u.is_active === false).length || 0, percentage: users?.length ? Math.round(users.filter(u => u.is_active !== false).length / users.length * 100) : 0, data: users || [] }
    } else if (reportType.value === 'jobs') {
      const { data: jobs } = await supabase.from('jobs').select('*, employer_profiles(company_name)').order('posted_at', { ascending: false })
      reportTitle.value = 'Jobs Report'
      reportData.value = { total: jobs?.length || 0, active: jobs?.filter(j => j.status === 'active').length || 0, inactive: jobs?.filter(j => j.status !== 'active').length || 0, percentage: jobs?.length ? Math.round(jobs.filter(j => j.status === 'active').length / jobs.length * 100) : 0, data: jobs || [] }
    } else if (reportType.value === 'applications') {
      const { data: apps } = await supabase.from('applications').select('*, profiles(first_name,last_name), jobs(title)').order('applied_at', { ascending: false })
      reportTitle.value = 'Applications Report'
      reportData.value = { total: apps?.length || 0, active: apps?.filter(a => a.status !== 'rejected').length || 0, inactive: apps?.filter(a => a.status === 'rejected').length || 0, percentage: apps?.length ? Math.round(apps.filter(a => a.status !== 'rejected').length / apps.length * 100) : 0, data: apps || [] }
    } else if (reportType.value === 'matches') {
      const { data: matches } = await supabase.from('match_scores').select('*, profiles(first_name,last_name), jobs(title)').order('computed_at', { ascending: false })
      reportTitle.value = 'AI Match Report'
      reportData.value = { total: matches?.length || 0, active: matches?.filter(m => m.score >= 0.5).length || 0, inactive: matches?.filter(m => m.score < 0.5).length || 0, percentage: matches?.length ? Math.round(matches.filter(m => m.score >= 0.5).length / matches.length * 100) : 0, data: matches || [] }
    }
  } catch (error) { console.error('Error generating report:', error); alert('Failed to generate report') } finally { generating.value = false }
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
  if (!data || !data.length) return ''
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  for (const row of data) { const values = headers.map(header => JSON.stringify(row[header] || '')); csvRows.push(values.join(',')) }
  return csvRows.join('\n')
}
</script>

<style scoped>
.admin-badge, .s-role { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; display: inline-block; }
.s-role { display: block; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
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
.report-details { padding: 1rem; max-height: 400px; overflow-y: auto; }
.report-details pre { font-size: 0.7rem; background: #FAFAF7; padding: 1rem; border-radius: 8px; overflow-x: auto; }
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