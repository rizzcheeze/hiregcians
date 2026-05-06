<template>
  <div class="dash admin-applications">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="admin-badge">Admin panel</div></div>
      <div class="s-user">
        <div class="s-avatar">AD</div>
        <div>
          <div class="s-name">Admin User</div>
          <div class="s-role">Gordon College oversight</div>
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
        <div>
          <div class="page-title">Applications</div>
          <div class="page-sub">Current application movement across the platform</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> Live</div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ totalApplications }}</div><div class="stat-label">Total Applications</div></div>
        <div class="stat-card"><div class="stat-value">{{ pendingCount }}</div><div class="stat-label">Pending</div></div>
        <div class="stat-card"><div class="stat-value">{{ reviewCount }}</div><div class="stat-label">Under Review</div></div>
        <div class="stat-card"><div class="stat-value">{{ interviewCount }}</div><div class="stat-label">Interview</div></div>
        <div class="stat-card"><div class="stat-value">{{ hiredCount }}</div><div class="stat-label">Hired</div></div>
        <div class="stat-card"><div class="stat-value">{{ rejectedCount }}</div><div class="stat-label">Rejected</div></div>
      </div>

      <div class="filters-bar">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="review">Under Review</option>
          <option value="interview">Interview</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
        <select v-model="dateFilter" class="filter-select">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="Search by student, job, or employer..." class="search-input" />
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">Loading applications...</div>
        <div v-else class="apps-table">
          <div class="table-header">
            <div>Student</div><div>Job</div><div>Employer</div><div>Match</div><div>Applied</div><div>Status</div><div>Actions</div>
          </div>
          <div v-for="app in filteredApplications" :key="app.id" class="table-row">
            <div class="student-info">
              <div class="student-avatar" :style="{ background: getAvatarColor(app.student_name) }">{{ getInitials(app.student_name) }}</div>
              <div><div class="student-name">{{ app.student_name }}</div><div class="student-email">{{ app.student_email }}</div></div>
            </div>
            <div class="job-title">{{ app.job_title }}</div>
            <div>{{ app.employer_name }}</div>
            <div><div class="match-score" :class="getScoreClass(app.match_score)">{{ app.match_score }}%</div><div class="mini-bar"><div class="mini-fill" :style="{ width: app.match_score + '%' }"></div></div></div>
            <div>{{ formatDate(app.applied_at) }}</div>
            <div><span class="status-badge" :class="getStatusClass(app.status)">{{ getStatusText(app.status) }}</span></div>
            <div class="actions"><button class="action-icon" @click="viewApplication(app)">👁️</button><button v-if="app.status !== 'hired' && app.status !== 'rejected'" class="action-icon" @click="updateStatus(app, 'hired')">✅</button><button v-if="app.status !== 'hired' && app.status !== 'rejected'" class="action-icon" @click="updateStatus(app, 'rejected')">❌</button></div>
          </div>
          <div v-if="filteredApplications.length === 0" class="empty-state">No applications found</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const sidebarOpen = ref(false)
const applications = ref([])
const statusFilter = ref('all')
const dateFilter = ref('all')
const searchQuery = ref('')

const totalApplications = computed(() => applications.value.length)
const pendingCount = computed(() => applications.value.filter(a => a.status === 'pending').length)
const reviewCount = computed(() => applications.value.filter(a => a.status === 'review').length)
const interviewCount = computed(() => applications.value.filter(a => a.status === 'interview').length)
const hiredCount = computed(() => applications.value.filter(a => a.status === 'hired').length)
const rejectedCount = computed(() => applications.value.filter(a => a.status === 'rejected').length)

const filteredApplications = computed(() => {
  let result = [...applications.value]
  if (statusFilter.value !== 'all') result = result.filter(a => a.status === statusFilter.value)
  if (dateFilter.value !== 'all') { const now = new Date(); if (dateFilter.value === 'today') { const today = new Date().setHours(0,0,0,0); result = result.filter(a => new Date(a.applied_at) >= today) } else if (dateFilter.value === 'week') { const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); result = result.filter(a => new Date(a.applied_at) >= weekAgo) } else if (dateFilter.value === 'month') { const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1); result = result.filter(a => new Date(a.applied_at) >= monthAgo) } }
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter(a => a.student_name.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q) || a.employer_name.toLowerCase().includes(q)) }
  return result
})

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?'
const getAvatarColor = (name) => { const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']; return colors[(name?.length || 0) % colors.length] }
const getScoreClass = (score) => { if (score >= 70) return 'score-high'; if (score >= 40) return 'score-mid'; return 'score-low' }
const getStatusText = (status) => ({ pending: 'Pending', review: 'Under Review', interview: 'Interview', hired: 'Hired', rejected: 'Rejected' }[status] || status)
const getStatusClass = (status) => ({ pending: 'status-pending', review: 'status-review', interview: 'status-interview', hired: 'status-hired', rejected: 'status-rejected' }[status] || 'status-pending')
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }
const viewApplication = (app) => { alert(`Application from ${app.student_name} for ${app.job_title}\nStatus: ${getStatusText(app.status)}\nMatch: ${app.match_score}%`) }
const updateStatus = async (app, newStatus) => { if (confirm(`Change status to ${getStatusText(newStatus)}?`)) { try { await supabase.from('applications').update({ status: newStatus, reviewed_at: new Date().toISOString() }).eq('id', app.id); app.status = newStatus; alert(`Status updated to ${getStatusText(newStatus)}`) } catch (error) { alert('Failed to update status') } } }

const fetchApplications = async () => {
  loading.value = true
  try {
    const { data: apps } = await supabase.from('applications').select('*').order('applied_at', { ascending: false })
    if (!apps || apps.length === 0) { applications.value = []; loading.value = false; return }
    const studentIds = [...new Set(apps.map(a => a.student_id))]; const jobIds = [...new Set(apps.map(a => a.job_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', studentIds)
    const { data: jobs } = await supabase.from('jobs').select('id, title, employer_id').in('id', jobIds)
    const employerIds = [...new Set(jobs?.map(j => j.employer_id) || [])]
    const { data: employers } = await supabase.from('employer_profiles').select('user_id, company_name').in('user_id', employerIds)
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []); const jobMap = new Map(jobs?.map(j => [j.id, j]) || []); const employerMap = new Map(employers?.map(e => [e.user_id, e]) || [])
    const matchPromises = apps.map(async (app) => { const { data: match } = await supabase.from('match_scores').select('score').eq('student_id', app.student_id).eq('job_id', app.job_id).maybeSingle(); return match?.score || 0 })
    const matchScores = await Promise.all(matchPromises)
    applications.value = apps.map((app, index) => { const job = jobMap.get(app.job_id); const employer = employerMap.get(job?.employer_id); const student = profileMap.get(app.student_id); return { id: app.id, student_name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Unknown', student_email: student?.email || '', job_title: job?.title || 'Unknown', employer_name: employer?.company_name || 'Unknown', match_score: Math.round((matchScores[index] || 0) * 100), applied_at: app.applied_at, status: app.status } })
  } catch (error) { console.error('Error fetching applications:', error) } finally { loading.value = false }
}

onMounted(() => { fetchApplications() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { background: #fff; border: 1px solid #C0DD97; border-radius: 12px; padding: 1rem; text-align: center; }
.stat-value { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: var(--gc-green); }
.stat-label { font-size: 0.65rem; color: var(--gc-muted); margin-top: 0.25rem; }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.search-input { flex: 1; max-width: 300px; padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; font-size: 0.8rem; }
.table-container { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow-x: auto; }
.apps-table { width: 100%; min-width: 900px; }
.table-header { display: grid; grid-template-columns: 1.5fr 1.5fr 1.2fr 80px 100px 110px 80px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 1.2fr 80px 100px 110px 80px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.8rem; }
.table-row:hover { background: #FAFAF7; }
.student-info { display: flex; align-items: center; gap: 0.75rem; }
.student-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; }
.student-name { font-weight: 500; }
.student-email { font-size: 0.65rem; color: var(--gc-muted); }
.job-title { font-weight: 500; }
.match-score { font-weight: 600; font-size: 0.85rem; margin-bottom: 0.2rem; }
.score-high { color: var(--gc-green); }
.score-mid { color: #B07D00; }
.score-low { color: #B03030; }
.mini-bar { width: 60px; height: 3px; background: #EAF3DE; border-radius: 2px; overflow: hidden; }
.mini-fill { height: 100%; background: var(--gc-green); border-radius: 2px; }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem; font-weight: 500; display: inline-block; }
.status-pending { background: #FFF8E7; color: #B07D00; }
.status-review { background: #EAF3DE; color: var(--gc-green); }
.status-interview { background: #E8F0FF; color: #2D5FC4; }
.status-hired { background: var(--gc-green); color: #fff; }
.status-rejected { background: #FEF0F0; color: #B03030; }
.actions { display: flex; gap: 0.5rem; }
.action-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--gc-muted); }
@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .table-header, .table-row { grid-template-columns: 1fr; gap: 0.5rem; } .table-header { display: none; } .table-row { padding: 1rem; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>