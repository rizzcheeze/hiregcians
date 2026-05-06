<template>
  <div class="dash employer-dashboard">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="emp-badge">Employer account</div></div>
      <div class="s-user">
        <div class="s-avatar">{{ initials }}</div>
        <div>
          <div class="s-name">{{ companyName || firstName }}</div>
          <div class="s-dept">Third-party employer</div>
        </div>
      </div>
      <ul class="s-nav">
        <li class="active">⬡ Dashboard</li>
        <li @click="$router.push('/employer/jobs/create')">⬡ Post a job</li>
        <li @click="$router.push('/employer/applicants')">⬡ Applicants <span class="badge">{{ totalApplications }}</span></li>
        <li @click="$router.push('/employer/jobs')">⬡ Active listings</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/employer/company')">⬡ Company profile</li>
        <li @click="$router.push('/employer/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Employer Dashboard</div>
          <div class="page-sub">{{ companyName || firstName }} · Hiring Gordon College students</div>
        </div>
        <button class="btn-primary" @click="$router.push('/employer/jobs/create')">+ Post a new job</button>
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="metric-val">{{ totalJobs }}</div>
          <div class="metric-label">Active job listings</div>
        </div>
        <div class="metric">
          <div class="metric-val">{{ totalApplications }}</div>
          <div class="metric-label">Total applicants</div>
        </div>
        <div class="metric">
          <div class="metric-val">{{ hiredCount }}</div>
          <div class="metric-label">Hired students</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Left Column - Job Listings -->
        <div class="listings-section">
          <div class="section-header">
            <h3>Your active job listings</h3>
            <button class="text-link" @click="$router.push('/employer/jobs')">Manage all →</button>
          </div>
          
          <div v-if="loading" class="empty-card">Loading your jobs...</div>
          <div v-else-if="recentJobs.length === 0" class="empty-card">
            <div class="empty-icon">📋</div>
            <p>No active job listings yet</p>
            <button class="btn-primary" @click="$router.push('/employer/jobs/create')">Post your first job →</button>
          </div>
          
          <div v-else class="jobs-list">
            <div v-for="job in recentJobs" :key="job.id" class="job-item">
              <div class="job-info">
                <div class="job-title">{{ job.title }}</div>
                <div class="job-meta">Posted {{ formatDate(job.posted_at) }} · {{ job.slots || 1 }} slot(s)</div>
              </div>
              <div class="job-stats">
                <div class="stat-badge">
                  <span class="stat-label">Applicants</span>
                  <span class="stat-number">{{ getApplicantCount(job.id) }}</span>
                </div>
                <div class="status-badge" :class="job.status === 'active' ? 'status-active' : 'status-closed'">
                  {{ job.status }}
                </div>
                <button class="icon-btn" @click="goToApplicants(job.id)" title="View applicants">👥</button>
                <button class="icon-btn" @click="editJob(job.id)" title="Edit job">✎</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Recent Activity -->
        <div class="activity-section">
          <div class="section-header">
            <h3>Recent applicants</h3>
          </div>
          <div class="activity-card">
            <div v-for="applicant in recentApplicants" :key="applicant.id" class="activity-item">
              <div class="activity-avatar" :style="{ background: getAvatarColor(applicant.name) }">
                {{ getInitials(applicant.name) }}
              </div>
              <div class="activity-details">
                <div class="activity-name">{{ applicant.name }}</div>
                <div class="activity-text">Applied for {{ applicant.job_title }}</div>
                <div class="activity-time">{{ formatDate(applicant.applied_at) }}</div>
              </div>
              <div class="activity-score" :class="getScoreClass(applicant.match_score)">
                {{ Math.round((applicant.match_score || 0) * 100) }}%
              </div>
            </div>
            <div v-if="recentApplicants.length === 0" class="empty-activity">No recent applicants</div>
            <div class="view-all" @click="$router.push('/employer/applicants')">
              View all applicants →
            </div>
          </div>

          <div class="section-header" style="margin-top: 1.5rem;">
            <h3>Recent activity</h3>
          </div>
          <div class="activity-card">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-dot"></div>
              <div class="activity-details">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
            <div v-if="recentActivities.length === 0" class="empty-activity">No recent activity</div>
          </div>
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
const totalJobs = ref(0)
const totalApplications = ref(0)
const hiredCount = ref(0)
const recentJobs = ref([])
const recentApplicants = ref([])
const recentActivities = ref([])
const companyName = ref('')
const firstName = ref('')

const initials = computed(() => {
  if (companyName.value) return companyName.value.charAt(0).toUpperCase()
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const formatDate = (dateString) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const getAvatarColor = (name) => {
  const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']
  const index = (name?.length || 0) % colors.length
  return colors[index]
}

const getScoreClass = (score) => {
  const percent = (score || 0) * 100
  if (percent >= 70) return 'score-high'
  if (percent >= 40) return 'score-mid'
  return 'score-low'
}

const getApplicantCount = (jobId) => {
  const job = recentJobs.value.find(j => j.id === jobId)
  return job?.applicant_count || 0
}

const goToApplicants = (jobId) => {
  router.push(`/employer/applicants?job=${jobId}`)
}

const editJob = (jobId) => {
  router.push(`/employer/jobs/${jobId}/edit`)
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    // Get employer profile
    const { data: profile } = await supabase
      .from('employer_profiles')
      .select('company_name')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    companyName.value = profile?.company_name || ''
    firstName.value = authStore.profile?.first_name || ''

    // Get jobs for this employer
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', authStore.user.id)
      .order('posted_at', { ascending: false })
    
    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map(j => j.id)
      
      // Get applicant counts for each job
      const { data: applications } = await supabase
        .from('applications')
        .select('job_id, status')
        .in('job_id', jobIds)
      
      // Enrich jobs with applicant counts
      const jobsWithCounts = jobs.map(job => ({
        ...job,
        applicant_count: applications?.filter(a => a.job_id === job.id).length || 0
      }))
      
      recentJobs.value = jobsWithCounts.slice(0, 5)
      totalJobs.value = jobs.filter(j => j.status === 'active').length || 0
      
      // Get hired count
      hiredCount.value = applications?.filter(a => a.status === 'hired').length || 0
      totalApplications.value = applications?.length || 0

      // Get recent applicants
      const { data: recentApps } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          student_id,
          job_id
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false })
        .limit(5)
      
      if (recentApps && recentApps.length > 0) {
        const studentIds = [...new Set(recentApps.map(a => a.student_id))]
        const jobIdsForApps = [...new Set(recentApps.map(a => a.job_id))]
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', studentIds)
        
        const { data: jobsForApps } = await supabase
          .from('jobs')
          .select('id, title')
          .in('id', jobIdsForApps)
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        const jobMap = new Map(jobsForApps?.map(j => [j.id, j]) || [])
        
        recentApplicants.value = recentApps.map(app => ({
          id: app.id,
          name: `${profileMap.get(app.student_id)?.first_name || ''} ${profileMap.get(app.student_id)?.last_name || ''}`.trim() || 'Student',
          job_title: jobMap.get(app.job_id)?.title || 'Unknown Job',
          applied_at: app.applied_at,
          match_score: 0.75
        }))
      }

      // Create recent activities
      const activities = []
      if (recentApps && recentApps.length > 0) {
        recentApps.slice(0, 3).forEach(app => {
          activities.push({
            id: app.id,
            text: `New application received for ${jobMap?.get(app.job_id)?.title || 'a job'}`,
            time: formatDate(app.applied_at)
          })
        })
      }
      recentActivities.value = activities
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.emp-badge {
  font-size: 0.65rem;
  background: rgba(192,221,151,0.15);
  color: #97C459;
  padding: 2px 8px;
  border-radius: 20px;
  margin-top: 0.35rem;
  display: inline-block;
}

.s-dept {
  font-size: 0.72rem;
  color: #97C459;
  opacity: 0.7;
}

.badge {
  background: var(--gc-green);
  color: #fff;
  font-size: 0.62rem;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: auto;
}

.btn-primary {
  background: var(--gc-green);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 0.5rem 1.25rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.text-link {
  background: none;
  border: none;
  color: var(--gc-green-mid);
  font-size: 0.75rem;
  cursor: pointer;
}

.text-link:hover {
  text-decoration: underline;
}

.icon-btn {
  background: none;
  border: 1px solid #C0DD97;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #FAFAF7;
  border-color: var(--gc-green);
}

/* Metrics */
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric {
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 12px;
  padding: 1rem;
}

.metric-val {
  font-family: 'DM Serif Display', serif;
  font-size: 2rem;
  color: var(--gc-green);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--gc-muted);
  margin-top: 0.25rem;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
}

/* Listings Section */
.listings-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #C0DD97;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #EAF3DE;
}

.section-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.jobs-list {
  padding: 0.5rem 0;
}

.job-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #EAF3DE;
  transition: background 0.2s;
}

.job-item:hover {
  background: #FAFAF7;
}

.job-info {
  flex: 1;
}

.job-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.job-meta {
  font-size: 0.7rem;
  color: var(--gc-muted);
}

.job-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-badge {
  text-align: center;
  min-width: 50px;
}

.stat-label {
  display: block;
  font-size: 0.6rem;
  color: var(--gc-muted);
}

.stat-number {
  display: block;
  font-weight: 600;
  font-size: 1rem;
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background: #EAF3DE;
  color: var(--gc-green);
}

.status-closed {
  background: #F1EFE8;
  color: var(--gc-muted);
}

/* Activity Section */
.activity-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #C0DD97;
  padding: 0.5rem 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #EAF3DE;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
}

.activity-name {
  font-weight: 500;
  font-size: 0.85rem;
}

.activity-text {
  font-size: 0.7rem;
  color: var(--gc-muted);
}

.activity-time {
  font-size: 0.65rem;
  color: #B4B2A9;
  margin-top: 0.2rem;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gc-green);
  flex-shrink: 0;
}

.activity-score {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}

.score-high {
  background: var(--gc-green);
  color: #fff;
}

.score-mid {
  background: #C0DD97;
  color: #27500A;
}

.score-low {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.view-all {
  text-align: center;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--gc-green);
  cursor: pointer;
  border-top: 1px solid #EAF3DE;
}

.view-all:hover {
  text-decoration: underline;
}

.empty-card, .empty-activity {
  text-align: center;
  padding: 2rem;
  color: var(--gc-muted);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .job-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .job-stats {
    width: 100%;
    justify-content: flex-start;
  }
  
  .main-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .sidebar-toggle {
    display: flex;
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: var(--gc-green);
    color: white;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 101;
    font-size: 24px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    height: auto;
    max-height: 80vh;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 100;
  }
  
  .sidebar.open {
    transform: translateY(0);
  }
}

.sidebar-toggle {
  display: none;
}

@media (min-width: 901px) {
  .sidebar-toggle {
    display: none;
  }
}
</style>