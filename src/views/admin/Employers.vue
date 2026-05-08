<template>
  <div class="dash admin-employers">
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
          <div class="page-title">Employers</div>
          <div class="page-sub">Management and participation metrics for external hiring partners</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> System Live</div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ totalEmployers }}</div><div class="stat-label">Total Employers</div></div>
        <div class="stat-card"><div class="stat-value">{{ activeEmployers }}</div><div class="stat-label">Active Employers</div></div>
        <div class="stat-card"><div class="stat-value">{{ totalJobsPosted }}</div><div class="stat-label">Jobs Posted</div></div>
        <div class="stat-card"><div class="stat-value">{{ totalHiresByEmployers }}</div><div class="stat-label">Total Hires</div></div>
      </div>

      <div class="filters-bar"><input type="text" v-model="searchQuery" placeholder="Search by company name or email..." class="search-input" /></div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">Loading employers...</div>
        <div v-else class="employers-table">
          <div class="table-header"><div>Employer</div><div>Company</div><div>Industry</div><div>Jobs</div><div>Applications</div><div>Hires</div><div>Joined</div><div>Status</div><div>Actions</div></div>
          <div v-for="employer in filteredEmployers" :key="employer.id" class="table-row">
            <div class="employer-info"><div class="employer-avatar" :style="{ background: getAvatarColor(employer.company_name) }">{{ getInitials(employer.company_name) }}</div><div><div class="employer-name">{{ employer.name }}</div><div class="employer-email">{{ employer.email }}</div></div></div>
            <div>{{ employer.company_name }}</div><div>{{ employer.industry || 'N/A' }}</div><div class="stat-number">{{ employer.jobs_count }}</div><div class="stat-number">{{ employer.applications_count }}</div><div class="stat-number">{{ employer.hires_count }}</div><div>{{ formatDate(employer.created_at) }}</div>
            <div><span class="status-badge" :class="employer.is_active ? 'status-active' : 'status-inactive'">{{ employer.is_active ? 'Active' : 'Inactive' }}</span></div>
            <div class="actions"><button class="action-icon" @click="viewEmployer(employer)">👁️</button><button class="action-icon" @click="toggleEmployerStatus(employer)">{{ employer.is_active ? '🔒' : '🔓' }}</button></div>
          </div>
          <div v-if="filteredEmployers.length === 0" class="empty-state">No employers found</div>
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
const employers = ref([])
const searchQuery = ref('')

const totalEmployers = computed(() => employers.value.length)
const activeEmployers = computed(() => employers.value.filter(e => e.is_active).length)
const totalJobsPosted = computed(() => employers.value.reduce((sum, e) => sum + e.jobs_count, 0))
const totalHiresByEmployers = computed(() => employers.value.reduce((sum, e) => sum + e.hires_count, 0))

const filteredEmployers = computed(() => {
  if (!searchQuery.value) return employers.value
  const q = searchQuery.value.toLowerCase()
  return employers.value.filter(e => e.company_name.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
})

const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?'
const getAvatarColor = (name) => { const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']; return colors[(name?.length || 0) % colors.length] }
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }
const viewEmployer = (employer) => { alert(`View employer: ${employer.company_name}\n\nDetailed view coming soon.`) }
const toggleEmployerStatus = async (employer) => { if (confirm(`${employer.is_active ? 'Deactivate' : 'Activate'} ${employer.company_name}?`)) { try { await supabase.from('profiles').update({ is_active: !employer.is_active }).eq('id', employer.id); employer.is_active = !employer.is_active; alert(`Employer ${employer.is_active ? 'activated' : 'deactivated'}`) } catch (error) { alert('Failed to update status') } } }

const fetchEmployers = async () => {
  loading.value = true
  try {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'employer').order('created_at', { ascending: false })
    if (!profiles || profiles.length === 0) { employers.value = []; loading.value = false; return }
    const employerIds = profiles.map(p => p.id)
    const { data: employerProfiles } = await supabase.from('employer_profiles').select('*').in('user_id', employerIds)
    const employerMap = new Map(employerProfiles?.map(e => [e.user_id, e]) || [])
    const { data: jobs } = await supabase.from('jobs').select('employer_id, id').in('employer_id', employerIds)
    const jobCounts = {}; const jobIds = []
    jobs?.forEach(job => { jobCounts[job.employer_id] = (jobCounts[job.employer_id] || 0) + 1; jobIds.push(job.id) })
    let appCounts = {}, hireCounts = {}
    if (jobIds.length > 0) {
      const { data: applications } = await supabase.from('applications').select('job_id, status').in('job_id', jobIds)
      applications?.forEach(app => { const job = jobs?.find(j => j.id === app.job_id); if (job) { appCounts[job.employer_id] = (appCounts[job.employer_id] || 0) + 1; if (app.status === 'hired') hireCounts[job.employer_id] = (hireCounts[job.employer_id] || 0) + 1 } })
    }
    employers.value = profiles.map(profile => ({ id: profile.id, name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown', email: profile.email || '', company_name: employerMap.get(profile.id)?.company_name || 'N/A', industry: employerMap.get(profile.id)?.industry || 'N/A', jobs_count: jobCounts[profile.id] || 0, applications_count: appCounts[profile.id] || 0, hires_count: hireCounts[profile.id] || 0, created_at: profile.created_at, is_active: profile.is_active !== false }))
  } catch (error) { console.error('Error fetching employers:', error) } finally { loading.value = false }
}

onMounted(() => { fetchEmployers() })
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
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.search-input { flex: 1; max-width: 300px; padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; font-size: 0.8rem; }
.table-container { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow-x: auto; }
.employers-table { width: 100%; min-width: 1000px; }
.table-header { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 60px 90px 60px 100px 80px 80px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 60px 90px 60px 100px 80px 80px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.8rem; }
.table-row:hover { background: #FAFAF7; }
.employer-info { display: flex; align-items: center; gap: 0.75rem; }
.employer-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; }
.employer-name { font-weight: 500; }
.employer-email { font-size: 0.65rem; color: var(--gc-muted); }
.stat-number { font-weight: 600; color: var(--gc-green); }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem; font-weight: 500; display: inline-block; }
.status-active { background: #EAF3DE; color: var(--gc-green); }
.status-inactive { background: #F1EFE8; color: var(--gc-muted); }
.actions { display: flex; gap: 0.5rem; }
.action-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--gc-muted); }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>