<template>
  <div class="dash admin-ai-logs">
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
        <div>
          <div class="page-title">AI Match Logs</div>
          <div class="page-sub">Transparency log for resume-to-job matching scores and rationales</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> System Live</div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ totalMatches }}</div><div class="stat-label">Total Matches</div></div>
        <div class="stat-card"><div class="stat-value">{{ avgScore }}%</div><div class="stat-label">Average Match Score</div></div>
        <div class="stat-card"><div class="stat-value">{{ highScoreCount }}</div><div class="stat-label">High Matches (>80%)</div></div>
        <div class="stat-card"><div class="stat-value">{{ lowScoreCount }}</div><div class="stat-label">Low Matches (<30%)</div></div>
      </div>

      <div class="filters-bar">
        <select v-model="dateFilter" class="filter-select"><option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select>
        <input type="text" v-model="searchQuery" placeholder="Search by student or job..." class="search-input" />
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">Loading AI match logs...</div>
        <div v-else class="logs-table">
          <div class="table-header"><div>Student</div><div>Job</div><div>Match Score</div><div>Rationale</div><div>Date</div></div>
          <div v-for="log in filteredLogs" :key="log.id" class="table-row">
            <div class="student-info"><div class="student-avatar" :style="{ background: getAvatarColor(log.student_name) }">{{ getInitials(log.student_name) }}</div><div><div class="student-name">{{ log.student_name }}</div><div class="student-email">{{ log.student_email }}</div></div></div>
            <div class="job-title">{{ log.job_title }}</div>
            <div><div class="match-score" :class="getScoreClass(log.match_score)">{{ log.match_score }}%</div><div class="mini-bar"><div class="mini-fill" :style="{ width: log.match_score + '%' }"></div></div></div>
            <div class="rationale">{{ log.rationale || 'No rationale generated' }}</div>
            <div>{{ formatDate(log.computed_at) }}</div>
          </div>
          <div v-if="filteredLogs.length === 0" class="empty-state">No AI match logs found</div>
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
const matchLogs = ref([])
const dateFilter = ref('all')
const searchQuery = ref('')

const totalMatches = computed(() => matchLogs.value.length)
const avgScore = computed(() => matchLogs.value.length ? Math.round(matchLogs.value.reduce((a, b) => a + b.match_score, 0) / matchLogs.value.length) : 0)
const highScoreCount = computed(() => matchLogs.value.filter(l => l.match_score >= 80).length)
const lowScoreCount = computed(() => matchLogs.value.filter(l => l.match_score < 30).length)

const filteredLogs = computed(() => {
  let result = [...matchLogs.value]
  if (dateFilter.value !== 'all') { const now = new Date(); if (dateFilter.value === 'today') { const today = new Date().setHours(0,0,0,0); result = result.filter(l => new Date(l.computed_at) >= today) } else if (dateFilter.value === 'week') { const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); result = result.filter(l => new Date(l.computed_at) >= weekAgo) } else if (dateFilter.value === 'month') { const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1); result = result.filter(l => new Date(l.computed_at) >= monthAgo) } }
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter(l => l.student_name.toLowerCase().includes(q) || l.job_title.toLowerCase().includes(q)) }
  return result
})

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?'
const getAvatarColor = (name) => { const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']; return colors[(name?.length || 0) % colors.length] }
const getScoreClass = (score) => { if (score >= 70) return 'score-high'; if (score >= 40) return 'score-mid'; return 'score-low' }
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const fetchMatchLogs = async () => {
  loading.value = true
  try {
    const { data: matches } = await supabase.from('match_scores').select('*').order('computed_at', { ascending: false })
    if (!matches || matches.length === 0) { matchLogs.value = []; loading.value = false; return }
    const studentIds = [...new Set(matches.map(m => m.student_id))]; const jobIds = [...new Set(matches.map(m => m.job_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', studentIds)
    const { data: jobs } = await supabase.from('jobs').select('id, title').in('id', jobIds)
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []); const jobMap = new Map(jobs?.map(j => [j.id, j]) || [])
    matchLogs.value = matches.map(match => ({ id: match.id, student_name: `${profileMap.get(match.student_id)?.first_name || ''} ${profileMap.get(match.student_id)?.last_name || ''}`.trim() || 'Unknown', student_email: profileMap.get(match.student_id)?.email || '', job_title: jobMap.get(match.job_id)?.title || 'Unknown', match_score: Math.round((match.score || 0) * 100), rationale: match.rationale, computed_at: match.computed_at }))
  } catch (error) { console.error('Error fetching match logs:', error) } finally { loading.value = false }
}

onMounted(() => { fetchMatchLogs() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { background: #fff; border: 1px solid #C0DD97; border-radius: 12px; padding: 1rem; text-align: center; }
.stat-value { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: var(--gc-green); }
.stat-label { font-size: 0.7rem; color: var(--gc-muted); margin-top: 0.25rem; }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.search-input { flex: 1; max-width: 300px; padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; font-size: 0.8rem; }
.table-container { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow-x: auto; }
.logs-table { width: 100%; min-width: 900px; }
.table-header { display: grid; grid-template-columns: 1.5fr 1.5fr 100px 2fr 140px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 100px 2fr 140px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.8rem; }
.table-row:hover { background: #FAFAF7; }
.student-info { display: flex; align-items: center; gap: 0.75rem; }
.student-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; }
.student-name { font-weight: 500; }
.student-email { font-size: 0.65rem; color: var(--gc-muted); }
.job-title { font-weight: 500; }
.match-score { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem; }
.score-high { color: var(--gc-green); }
.score-mid { color: #B07D00; }
.score-low { color: #B03030; }
.mini-bar { width: 80px; height: 3px; background: #EAF3DE; border-radius: 2px; overflow: hidden; }
.mini-fill { height: 100%; background: var(--gc-green); border-radius: 2px; }
.rationale { font-size: 0.75rem; color: var(--gc-muted); line-height: 1.4; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--gc-muted); }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .table-header, .table-row { grid-template-columns: 1fr; gap: 0.5rem; } .table-header { display: none; } .table-row { padding: 1rem; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>