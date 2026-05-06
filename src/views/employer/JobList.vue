<template>
  <div class="dash employer-listings">
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
        <li @click="$router.push('/employer/dashboard')">⬡ Dashboard</li>
        <li @click="$router.push('/employer/jobs/create')">⬡ Post a job</li>
        <li @click="$router.push('/employer/applicants')">⬡ Applicants</li>
        <li class="active">⬡ Active listings</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/employer/company')">⬡ Company profile</li>
        <li @click="$router.push('/employer/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Active Listings</div>
          <div class="page-sub">Manage your job postings and review applicants</div>
        </div>
        <button class="btn-primary" @click="$router.push('/employer/jobs/create')">+ Post a new job</button>
      </div>

      <!-- Stats Summary -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ totalJobs }}</div>
          <div class="stat-label">Total Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activeJobs }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ closedJobs }}</div>
          <div class="stat-label">Closed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalApplicantsAll }}</div>
          <div class="stat-label">Total Applicants</div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button class="filter-tab" :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">
          All Jobs ({{ totalJobs }})
        </button>
        <button class="filter-tab" :class="{ active: activeFilter === 'active' }" @click="activeFilter = 'active'">
          Active ({{ activeJobs }})
        </button>
        <button class="filter-tab" :class="{ active: activeFilter === 'closed' }" @click="activeFilter = 'closed'">
          Closed ({{ closedJobs }})
        </button>
      </div>

      <!-- Jobs List -->
      <div v-if="loading" class="loading-state">Loading your jobs...</div>
      <div v-else-if="filteredJobs.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No job listings found</div>
        <div class="empty-sub">Click "Post a new job" to create your first listing</div>
        <button class="btn-primary" @click="$router.push('/employer/jobs/create')">Post a new job →</button>
      </div>

      <div v-else class="jobs-container">
        <div v-for="job in filteredJobs" :key="job.id" class="job-card">
          <div class="job-header">
            <div>
              <div class="job-title">{{ job.title }}</div>
              <div class="job-meta">
                <span>Posted {{ formatDate(job.posted_at) }}</span>
                <span>•</span>
                <span>{{ job.slots || 1 }} slot(s) available</span>
              </div>
            </div>
            <div class="job-status" :class="job.status === 'active' ? 'status-active' : 'status-closed'">
              {{ job.status === 'active' ? 'Active' : 'Closed' }}
            </div>
          </div>

          <div class="job-body">
            <div class="job-description">{{ truncateText(job.description, 150) }}</div>
            <div class="job-skills">
              <span v-for="skill in (job.required_skills || []).slice(0, 5)" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
              <span v-if="(job.required_skills || []).length > 5" class="skill-tag more">
                +{{ job.required_skills.length - 5 }} more
              </span>
            </div>
          </div>

          <div class="job-footer">
            <div class="job-stats">
              <div class="stat">
                <span class="stat-number">{{ getApplicantCount(job.id) }}</span>
                <span class="stat-label">Applicants</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ job.job_type || 'N/A' }}</span>
                <span class="stat-label">Type</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ job.work_setup || 'N/A' }}</span>
                <span class="stat-label">Setup</span>
              </div>
            </div>
            <div class="job-actions">
              <button class="action-btn view" @click="viewJob(job.id)">View Details</button>
              <button class="action-btn applicants" @click="goToApplicants(job.id)">Applicants</button>
              <button class="action-btn edit" @click="editJob(job.id)">Edit</button>
              <button v-if="job.status === 'active'" class="action-btn close" @click="closeJob(job.id)">Close</button>
              <button v-if="job.status === 'closed'" class="action-btn reopen" @click="reopenJob(job.id)">Reopen</button>
              <button class="action-btn delete" @click="deleteJob(job.id)">Delete</button>
            </div>
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
const allJobs = ref([])
const applicantsCount = ref({})
const activeFilter = ref('all')
const companyName = ref('')
const firstName = ref('')

const initials = computed(() => {
  if (companyName.value) return companyName.value.charAt(0).toUpperCase()
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const totalJobs = computed(() => allJobs.value.length)
const activeJobs = computed(() => allJobs.value.filter(j => j.status === 'active').length)
const closedJobs = computed(() => allJobs.value.filter(j => j.status === 'closed').length)
const totalApplicantsAll = computed(() => Object.values(applicantsCount.value).reduce((a, b) => a + b, 0))

const filteredJobs = computed(() => {
  if (activeFilter.value === 'all') return allJobs.value
  return allJobs.value.filter(j => j.status === activeFilter.value)
})

const formatDate = (dateString) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const getApplicantCount = (jobId) => {
  return applicantsCount.value[jobId] || 0
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const viewJob = (jobId) => {
  router.push(`/employer/jobs/${jobId}`)
}

const goToApplicants = (jobId) => {
  router.push(`/employer/applicants?job=${jobId}`)
}

const editJob = (jobId) => {
  router.push(`/employer/jobs/${jobId}/edit`)
}

const closeJob = async (jobId) => {
  if (confirm('Close this job posting? Applicants will no longer be able to apply.')) {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId)
      
      if (error) throw error
      
      const index = allJobs.value.findIndex(j => j.id === jobId)
      if (index !== -1) allJobs.value[index].status = 'closed'
      
      alert('Job closed successfully')
    } catch (error) {
      console.error('Error closing job:', error)
      alert('Failed to close job')
    }
  }
}

const reopenJob = async (jobId) => {
  if (confirm('Reopen this job posting? Students will be able to apply again.')) {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'active' })
        .eq('id', jobId)
      
      if (error) throw error
      
      const index = allJobs.value.findIndex(j => j.id === jobId)
      if (index !== -1) allJobs.value[index].status = 'active'
      
      alert('Job reopened successfully')
    } catch (error) {
      console.error('Error reopening job:', error)
      alert('Failed to reopen job')
    }
  }
}

const deleteJob = async (jobId) => {
  if (confirm('WARNING: This will permanently delete this job posting and all associated applications. This action cannot be undone. Are you sure?')) {
    try {
      // First delete applications
      await supabase
        .from('applications')
        .delete()
        .eq('job_id', jobId)
      
      // Then delete saved jobs references
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('job_id', jobId)
      
      // Finally delete the job
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
      
      if (error) throw error
      
      allJobs.value = allJobs.value.filter(j => j.id !== jobId)
      delete applicantsCount.value[jobId]
      
      alert('Job deleted successfully')
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    }
  }
}

const fetchData = async () => {
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

    // Get all jobs for this employer
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', authStore.user.id)
      .order('posted_at', { ascending: false })
    
    allJobs.value = jobs || []

    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map(j => j.id)
      
      // Get applicant counts for each job
      const { data: applications } = await supabase
        .from('applications')
        .select('job_id')
        .in('job_id', jobIds)
      
      const counts = {}
      applications?.forEach(app => {
        counts[app.job_id] = (counts[app.job_id] || 0) + 1
      })
      applicantsCount.value = counts
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
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

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-family: 'DM Serif Display', serif;
  font-size: 1.8rem;
  color: var(--gc-green);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--gc-muted);
  margin-top: 0.25rem;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 24px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  border-color: var(--gc-green);
}

.filter-tab.active {
  background: var(--gc-green);
  color: #fff;
  border-color: var(--gc-green);
}

/* Jobs Container */
.jobs-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.job-card {
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 12px;
  padding: 1.25rem;
  transition: box-shadow 0.2s;
}

.job-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.job-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.2rem;
  color: var(--gc-dark);
}

.job-meta {
  font-size: 0.7rem;
  color: var(--gc-muted);
  margin-top: 0.25rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.job-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-active {
  background: #EAF3DE;
  color: var(--gc-green);
}

.status-closed {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.job-body {
  margin-bottom: 1rem;
}

.job-description {
  font-size: 0.85rem;
  color: var(--gc-muted);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.job-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  font-size: 0.7rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 4px 10px;
  border-radius: 20px;
}

.skill-tag.more {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #EAF3DE;
  flex-wrap: wrap;
  gap: 1rem;
}

.job-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
}

.stat-label {
  font-size: 0.65rem;
  color: var(--gc-muted);
}

.job-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.view {
  background: #EAF3DE;
  color: var(--gc-green);
}

.action-btn.view:hover {
  background: var(--gc-green);
  color: #fff;
}

.action-btn.applicants {
  background: #E8F0FF;
  color: #2D5FC4;
}

.action-btn.applicants:hover {
  background: #2D5FC4;
  color: #fff;
}

.action-btn.edit {
  background: #FFF8E7;
  color: #B07D00;
}

.action-btn.edit:hover {
  background: #B07D00;
  color: #fff;
}

.action-btn.close {
  background: #FEF0F0;
  color: #B03030;
}

.action-btn.close:hover {
  background: #B03030;
  color: #fff;
}

.action-btn.reopen {
  background: #EAF3DE;
  color: var(--gc-green);
}

.action-btn.reopen:hover {
  background: var(--gc-green);
  color: #fff;
}

.action-btn.delete {
  background: #FEF0F0;
  color: #B03030;
}

.action-btn.delete:hover {
  background: #B03030;
  color: #fff;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #C0DD97;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.empty-sub {
  font-size: 0.8rem;
  color: var(--gc-muted);
  margin-bottom: 1rem;
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .job-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .job-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .job-stats {
    justify-content: space-around;
  }
  
  .job-actions {
    justify-content: center;
  }
  
  .main-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
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

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .job-stats {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
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