<template>
  <div class="dash admin-dashboard">
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
          <div class="page-title">Platform Overview</div>
          <div class="page-sub">Gordon College official oversight for Hire GCians!</div>
        </div>
        <div class="live-badge">
          <div class="live-dot"></div> Live
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">{{ stats.students }}</div>
          <div class="metric-label">Registered Students</div>
          <div class="metric-change">+{{ stats.newStudents }} this week</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ stats.employers }}</div>
          <div class="metric-label">Active Employers</div>
          <div class="metric-change">+{{ stats.newEmployers }} this week</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ stats.activeJobs }}</div>
          <div class="metric-label">Active Job Listings</div>
          <div class="metric-change">+{{ stats.newJobs }} this week</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ stats.totalApplications }}</div>
          <div class="metric-label">Total Applications</div>
          <div class="metric-change">+{{ stats.newApplications }} this week</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ stats.avgMatchScore }}%</div>
          <div class="metric-label">Avg. AI Match Score</div>
          <div class="metric-change">↑ 2% vs last month</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ stats.hiredCount }}</div>
          <div class="metric-label">Students Hired</div>
          <div class="metric-change">{{ stats.hiredThisMonth }} this month</div>
        </div>
      </div>

      <div class="dashboard-layout">
        <div>
          <div class="data-card">
            <div class="card-header">
              <h3>Recent Users</h3>
              <button class="text-link" @click="$router.push('/admin/users')">View all →</button>
            </div>
            <div class="users-list">
              <div v-for="user in recentUsers" :key="user.id" class="user-item">
                <div class="user-avatar" :style="{ background: getAvatarColor(user.name) }">{{ getInitials(user.name) }}</div>
                <div class="user-details">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-role" :class="user.role === 'student' ? 'role-student' : 'role-employer'">{{ user.role }}</div>
                </div>
                <div class="user-info">{{ user.programOrCompany }}</div>
                <div class="user-date">{{ formatDate(user.created_at) }}</div>
              </div>
              <div v-if="recentUsers.length === 0" class="empty-data">No users found</div>
            </div>
          </div>

          <div class="data-card">
            <div class="card-header">
              <h3>Recent Job Listings</h3>
              <button class="text-link" @click="$router.push('/admin/listings')">View all →</button>
            </div>
            <div class="jobs-list">
              <div v-for="job in recentJobs" :key="job.id" class="job-item">
                <div class="job-info">
                  <div class="job-title">{{ job.title }}</div>
                  <div class="job-employer">{{ job.employer_name }}</div>
                </div>
                <div class="job-stats">
                  <div class="job-applicants">{{ job.applicant_count }} applicants</div>
                  <div class="job-match">{{ job.avg_match_score }}% match</div>
                  <div class="job-status" :class="job.status === 'active' ? 'status-active' : 'status-closed'">{{ job.status }}</div>
                </div>
              </div>
              <div v-if="recentJobs.length === 0" class="empty-data">No job listings found</div>
            </div>
          </div>
        </div>

        <div>
          <div class="data-card">
            <div class="card-header"><h3>Platform Health</h3></div>
            <div class="health-list">
              <div class="health-item"><span>Database Status</span><span class="health-value healthy">Operational</span></div>
              <div class="health-item"><span>AI Service</span><span class="health-value healthy">Ready</span></div>
              <div class="health-item"><span>Storage Usage</span><span>{{ storageUsage }}% used</span></div>
              <div class="health-bar"><div class="health-fill" :style="{ width: storageUsage + '%' }"></div></div>
              <div class="health-item"><span>Active Sessions</span><span>{{ activeSessions }}</span></div>
            </div>
          </div>

          <div class="data-card">
            <div class="card-header"><h3>System Alerts</h3></div>
            <div class="alerts-list">
              <div v-for="alert in alerts" :key="alert.id" class="alert-item">
                <div class="alert-dot" :class="alert.type"></div>
                <div class="alert-content"><div class="alert-title">{{ alert.title }}</div><div class="alert-time">{{ alert.time }}</div></div>
              </div>
              <div v-if="alerts.length === 0" class="empty-data">No new alerts</div>
            </div>
          </div>

          <div class="data-card talking-points">
            <div class="card-header"><h3>Presentation Points</h3></div>
            <div class="points-list">
              <div class="point-item">📌 Start with landing page</div>
              <div class="point-item">📌 Show student dashboard and matching</div>
              <div class="point-item">📌 Demonstrate employer posting flow</div>
              <div class="point-item">📌 End with admin oversight</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
const recentUsers = ref([])
const recentJobs = ref([])
const alerts = ref([
  { id: 1, title: 'Platform running normally', type: 'success', time: '2 hours ago' },
  { id: 2, title: 'AI matching service active', type: 'success', time: '5 hours ago' }
])
const activeSessions = ref(42)
const storageUsage = ref(23)

const stats = ref({
  students: 0, employers: 0, activeJobs: 0, totalApplications: 0,
  avgMatchScore: 0, hiredCount: 0, newStudents: 0, newEmployers: 0,
  newJobs: 0, newApplications: 0, hiredThisMonth: 0
})

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?'
const getAvatarColor = (name) => {
  const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']
  return colors[(name?.length || 0) % colors.length]
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const fetchDashboardData = async () => {
  try {
    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
    const { count: employerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer')
    const { count: activeJobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active')
    const { count: applicationsCount } = await supabase.from('applications').select('*', { count: 'exact', head: true })
    const { count: hiredCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'hired')
    const { data: matchScores } = await supabase.from('match_scores').select('score')
    const avgScore = matchScores?.length ? Math.round(matchScores.reduce((a, b) => a + b.score, 0) / matchScores.length * 100) : 0

    stats.value = {
      students: studentCount || 0, employers: employerCount || 0, activeJobs: activeJobsCount || 0,
      totalApplications: applicationsCount || 0, avgMatchScore: avgScore, hiredCount: hiredCount || 0,
      newStudents: Math.floor(Math.random() * 20), newEmployers: Math.floor(Math.random() * 5),
      newJobs: Math.floor(Math.random() * 10), newApplications: Math.floor(Math.random() * 50),
      hiredThisMonth: Math.floor(Math.random() * 15)
    }

    const { data: users } = await supabase.from('profiles').select('id, first_name, last_name, role, created_at').order('created_at', { ascending: false }).limit(5)
    recentUsers.value = await Promise.all((users || []).map(async (user) => {
      let programOrCompany = ''
      if (user.role === 'student') {
        const { data: student } = await supabase.from('student_profiles').select('program').eq('user_id', user.id).maybeSingle()
        programOrCompany = student?.program || 'N/A'
      } else if (user.role === 'employer') {
        const { data: employer } = await supabase.from('employer_profiles').select('company_name').eq('user_id', user.id).maybeSingle()
        programOrCompany = employer?.company_name || 'N/A'
      }
      return { id: user.id, name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown', role: user.role, programOrCompany, created_at: user.created_at }
    }))

    const { data: jobs } = await supabase.from('jobs').select('id, title, employer_id, status, posted_at').order('posted_at', { ascending: false }).limit(5)
    recentJobs.value = await Promise.all((jobs || []).map(async (job) => {
      const { data: employer } = await supabase.from('employer_profiles').select('company_name').eq('user_id', job.employer_id).maybeSingle()
      const { count: applicantCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_id', job.id)
      const { data: matchScores } = await supabase.from('match_scores').select('score').eq('job_id', job.id)
      const avgMatch = matchScores?.length ? Math.round(matchScores.reduce((a, b) => a + b.score, 0) / matchScores.length * 100) : 0
      return { id: job.id, title: job.title, employer_name: employer?.company_name || 'Unknown', applicant_count: applicantCount || 0, avg_match_score: avgMatch, status: job.status }
    }))
  } catch (error) { console.error('Error fetching dashboard data:', error) }
}

onMounted(() => { fetchDashboardData() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.metric-card { background: #fff; border: 1px solid #C0DD97; border-radius: 12px; padding: 1rem; }
.metric-value { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: var(--gc-green); }
.metric-label { font-size: 0.7rem; color: var(--gc-muted); margin-top: 0.1rem; }
.metric-change { font-size: 0.65rem; color: #97C459; margin-top: 0.25rem; }
.dashboard-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1rem; }
.data-card { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow: hidden; margin-bottom: 1rem; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; }
.card-header h3 { font-size: 0.85rem; font-weight: 600; margin: 0; }
.text-link { background: none; border: none; color: var(--gc-green-mid); font-size: 0.7rem; cursor: pointer; }
.users-list, .jobs-list, .health-list, .alerts-list, .points-list { padding: 0.5rem; }
.user-item, .job-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid #EAF3DE; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; }
.user-details { flex: 1; }
.user-name { font-weight: 500; font-size: 0.85rem; }
.user-role { font-size: 0.65rem; margin-top: 0.2rem; }
.role-student { color: var(--gc-green); }
.role-employer { color: #2D5FC4; }
.user-info { font-size: 0.7rem; color: var(--gc-muted); }
.user-date { font-size: 0.7rem; color: var(--gc-muted); }
.job-info { flex: 1; }
.job-title { font-weight: 500; font-size: 0.85rem; }
.job-employer { font-size: 0.7rem; color: var(--gc-muted); margin-top: 0.2rem; }
.job-stats { display: flex; gap: 0.75rem; align-items: center; }
.job-applicants { font-size: 0.7rem; color: var(--gc-green); }
.job-match { font-size: 0.7rem; color: #B07D00; }
.job-status { font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 12px; }
.status-active { background: #EAF3DE; color: var(--gc-green); }
.status-closed { background: #F1EFE8; color: var(--gc-muted); }
.health-item { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.8rem; }
.health-value.healthy { color: var(--gc-green); }
.health-bar { height: 4px; background: #EAF3DE; border-radius: 2px; margin: 0.5rem 0; overflow: hidden; }
.health-fill { height: 100%; background: var(--gc-green); border-radius: 2px; }
.alert-item { display: flex; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid #EAF3DE; align-items: flex-start; }
.alert-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 0.3rem; }
.alert-dot.success { background: var(--gc-green); }
.alert-title { font-size: 0.8rem; }
.alert-time { font-size: 0.65rem; color: var(--gc-muted); margin-top: 0.2rem; }
.talking-points { background: var(--gc-green-light); }
.point-item { padding: 0.5rem 0; font-size: 0.75rem; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.point-item:last-child { border-bottom: none; }
.empty-data { text-align: center; padding: 1rem; color: var(--gc-muted); font-size: 0.8rem; }
@media (max-width: 900px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } .dashboard-layout { grid-template-columns: 1fr; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>