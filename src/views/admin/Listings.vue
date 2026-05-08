<template>
  <div class="dash admin-listings">
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
          <div class="page-title">All Listings</div>
          <div class="page-sub">Centralized view of every job opportunity on the platform</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> System Live</div>
      </div>

      <div class="filters-bar">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="Search by title or employer..." class="search-input" />
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">Loading listings...</div>
        <div v-else class="jobs-table">
          <div class="table-header">
            <div>Position</div>
            <div>Employer</div>
            <div>Applicants</div>
            <div>Match Avg.</div>
            <div>Posted</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div v-for="job in filteredJobs" :key="job.id" class="table-row">
            <div class="job-title">{{ job.title }}</div>
            <div>{{ job.employer_name }}</div>
            <div class="applicant-count">{{ job.applicant_count }}</div>
            <div>
              <div class="match-cell">
                <span class="match-percent">{{ job.avg_match_score }}%</span>
                <div class="mini-bar"><div class="mini-fill" :style="{ width: job.avg_match_score + '%' }"></div></div>
              </div>
            </div>
            <div>{{ formatDate(job.posted_at) }}</div>
            <div><span class="status-badge" :class="job.status === 'active' ? 'status-active' : 'status-closed'">{{ job.status }}</span></div>
            <div class="actions">
              <button class="action-icon" @click="viewJob(job)">👁️</button>
              <button v-if="job.status === 'active'" class="action-icon" @click="closeJob(job)">🔒</button>
              <button v-if="job.status === 'closed'" class="action-icon" @click="reopenJob(job)">🔓</button>
              <button class="action-icon delete" @click="deleteJob(job)">🗑️</button>
            </div>
          </div>
          <div v-if="filteredJobs.length === 0" class="empty-state">No job listings found</div>
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
const jobs = ref([])
const statusFilter = ref('all')
const searchQuery = ref('')

const filteredJobs = computed(() => {
  let result = jobs.value
  if (statusFilter.value !== 'all') result = result.filter(j => j.status === statusFilter.value)
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter(j => j.title.toLowerCase().includes(q) || j.employer_name.toLowerCase().includes(q)) }
  return result
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }
const viewJob = (job) => { alert(`View job: ${job.title}\n\nDetailed view coming soon.`) }
const closeJob = async (job) => { if (confirm(`Close "${job.title}"?`)) { try { await supabase.from('jobs').update({ status: 'closed' }).eq('id', job.id); job.status = 'closed'; alert('Job closed') } catch (error) { alert('Failed to close job') } } }
const reopenJob = async (job) => { if (confirm(`Reopen "${job.title}"?`)) { try { await supabase.from('jobs').update({ status: 'active' }).eq('id', job.id); job.status = 'active'; alert('Job reopened') } catch (error) { alert('Failed to reopen job') } } }
const deleteJob = async (job) => { if (confirm(`Delete "${job.title}"? This cannot be undone.`)) { try { await supabase.from('applications').delete().eq('job_id', job.id); await supabase.from('saved_jobs').delete().eq('job_id', job.id); await supabase.from('jobs').delete().eq('id', job.id); jobs.value = jobs.value.filter(j => j.id !== job.id); alert('Job deleted') } catch (error) { alert('Failed to delete job') } } }

const fetchJobs = async () => {
  loading.value = true
  try {
    const { data: allJobs } = await supabase.from('jobs').select('*').order('posted_at', { ascending: false })
    jobs.value = await Promise.all((allJobs || []).map(async (job) => {
      const { data: employer } = await supabase.from('employer_profiles').select('company_name').eq('user_id', job.employer_id).maybeSingle()
      const { count: applicantCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_id', job.id)
      const { data: matchScores } = await supabase.from('match_scores').select('score').eq('job_id', job.id)
      const avgMatch = matchScores?.length ? Math.round(matchScores.reduce((a, b) => a + b.score, 0) / matchScores.length * 100) : 0
      return { id: job.id, title: job.title, employer_name: employer?.company_name || 'Unknown', applicant_count: applicantCount || 0, avg_match_score: avgMatch, posted_at: job.posted_at, status: job.status }
    }))
  } catch (error) { console.error('Error fetching jobs:', error) } finally { loading.value = false }
}

onMounted(() => { fetchJobs() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.search-input { flex: 1; max-width: 300px; padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; font-size: 0.8rem; }
.table-container { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow-x: auto; }
.jobs-table { width: 100%; min-width: 900px; }
.table-header { display: grid; grid-template-columns: 2fr 1.5fr 100px 120px 120px 100px 100px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 2fr 1.5fr 100px 120px 120px 100px 100px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.8rem; }
.table-row:hover { background: #FAFAF7; }
.job-title { font-weight: 500; }
.applicant-count { font-weight: 500; color: var(--gc-green); }
.match-cell { display: flex; align-items: center; gap: 0.5rem; }
.match-percent { font-weight: 500; min-width: 40px; }
.mini-bar { width: 60px; height: 4px; background: #EAF3DE; border-radius: 2px; overflow: hidden; }
.mini-fill { height: 100%; background: var(--gc-green); border-radius: 2px; }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem; font-weight: 500; display: inline-block; }
.status-active { background: #EAF3DE; color: var(--gc-green); }
.status-closed { background: #F1EFE8; color: var(--gc-muted); }
.actions { display: flex; gap: 0.5rem; }
.action-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--gc-muted); }
@media (max-width: 900px) { .table-header, .table-row { grid-template-columns: 1fr; gap: 0.5rem; } .table-header { display: none; } .table-row { padding: 1rem; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>