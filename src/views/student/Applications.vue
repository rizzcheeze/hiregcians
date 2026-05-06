<template>
  <div class="dash">
    <aside class="sidebar">
      <div class="s-logo">Hire <span>GCians!</span></div>
      <div class="s-user">
        <div class="s-avatar">{{ initials }}</div>
        <div>
          <div class="s-name">{{ firstName }} {{ lastName }}</div>
          <div class="s-prog">{{ program }} {{ section }}</div>
        </div>
      </div>
      <ul class="s-nav">
        <li @click="$router.push('/student/dashboard')">⬡ Dashboard</li>
        <li @click="$router.push('/student/jobs')">⬡ Browse jobs</li>
        <li class="active">⬡ My applications <span class="badge">{{ applications.length }}</span></li>
        <li @click="$router.push('/student/saved')">⬡ Saved</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/student/profile')">⬡ Edit profile</li>
        <li @click="$router.push('/student/resume')">⬡ Skills &amp; resume</li>
        <li @click="$router.push('/student/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="page-title">My Applications</div>

      <div class="summary-row">
        <div class="sum-card">
          <div class="sum-val">{{ applications.length }}</div>
          <div class="sum-label">Total applications</div>
        </div>
        <div class="sum-card">
          <div class="sum-val">{{ pendingCount }}</div>
          <div class="sum-label">Pending review</div>
        </div>
        <div class="sum-card">
          <div class="sum-val">{{ interviewCount }}</div>
          <div class="sum-label">Interview</div>
        </div>
        <div class="sum-card">
          <div class="sum-val">{{ hiredCount }}</div>
          <div class="sum-label">Hired</div>
        </div>
      </div>

      <div class="status-tabs">
        <div class="stab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
          All <span class="stab-count">{{ applications.length }}</span>
        </div>
        <div class="stab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
          Pending <span class="stab-count">{{ pendingCount }}</span>
        </div>
        <div class="stab" :class="{ active: activeTab === 'review' }" @click="activeTab = 'review'">
          Under review <span class="stab-count">{{ reviewCount }}</span>
        </div>
        <div class="stab" :class="{ active: activeTab === 'interview' }" @click="activeTab = 'interview'">
          Interview <span class="stab-count">{{ interviewCount }}</span>
        </div>
        <div class="stab" :class="{ active: activeTab === 'hired' }" @click="activeTab = 'hired'">
          Hired <span class="stab-count">{{ hiredCount }}</span>
        </div>
      </div>

      <div v-if="loading" class="text-center" style="padding: 2rem;">Loading your applications...</div>
      
      <div v-else-if="applications.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No applications yet</div>
        <div class="empty-sub">Start applying to jobs and they'll appear here.</div>
        <button class="btn-primary" @click="$router.push('/student/jobs')">Browse Jobs →</button>
      </div>

      <div v-else>
        <div v-for="app in filteredApplications" :key="app.id" class="app-card">
          <div>
            <div class="app-title">{{ app.job_title || 'Position' }}</div>
            <div class="app-dept">{{ app.company_name || 'Company' }}</div>
            <div class="app-meta">
              <span class="app-chip">{{ app.job_type || 'Job type' }}</span>
              <span class="app-chip neutral">{{ app.work_setup || 'Work setup' }}</span>
              <span class="app-date">Applied {{ formatDate(app.applied_at) }}</span>
            </div>
            
            <div class="timeline">
              <div class="tl-row">
                <div class="tl-dot" :class="{ 'tl-done': app.status !== 'pending' }"></div>
                <div class="tl-text"><strong>Application submitted</strong> · {{ formatDate(app.applied_at) }}</div>
              </div>
              <div class="tl-row">
                <div class="tl-dot" :class="{ 'tl-done': app.status === 'review' || app.status === 'interview' || app.status === 'hired' }"></div>
                <div class="tl-text"><strong>Under review</strong></div>
              </div>
              <div class="tl-row">
                <div class="tl-dot" :class="{ 'tl-done': app.status === 'interview' || app.status === 'hired' }"></div>
                <div class="tl-text"><strong>Interview</strong></div>
              </div>
              <div class="tl-row">
                <div class="tl-dot" :class="{ 'tl-done': app.status === 'hired' }"></div>
                <div class="tl-text"><strong>Decision</strong> · {{ getDecisionText(app.status) }}</div>
              </div>
            </div>
          </div>
          
          <div class="app-right">
            <div class="status-pill" :class="getStatusClass(app.status)">
              {{ getStatusText(app.status) }}
            </div>
            <div class="match-pct">
              <strong>{{ Math.round((app.match_score || 0) * 100) }}%</strong> match
            </div>
            <button 
              v-if="app.status === 'pending'" 
              class="withdraw-btn" 
              @click="withdrawApplication(app)"
            >
              Withdraw application
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const applications = ref([])
const activeTab = ref('all')
const program = ref('')
const section = ref('')

const firstName = computed(() => authStore.profile?.first_name || 'Allyana')
const lastName = computed(() => authStore.profile?.last_name || 'Espiridion')
const initials = computed(() => (firstName.value.charAt(0) || 'A') + (lastName.value.charAt(0) || 'E'))

const pendingCount = computed(() => applications.value.filter(a => a.status === 'pending').length)
const reviewCount = computed(() => applications.value.filter(a => a.status === 'review').length)
const interviewCount = computed(() => applications.value.filter(a => a.status === 'interview').length)
const hiredCount = computed(() => applications.value.filter(a => a.status === 'hired').length)

const filteredApplications = computed(() => {
  if (activeTab.value === 'all') return applications.value
  return applications.value.filter(a => a.status === activeTab.value)
})

const formatDate = (dateString) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    review: 'Under review',
    interview: 'Interview',
    hired: 'Hired',
    rejected: 'Rejected'
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  const classMap = {
    pending: 'status-pending',
    review: 'status-review',
    interview: 'status-interview',
    hired: 'status-hired',
    rejected: 'status-rejected'
  }
  return classMap[status] || 'status-pending'
}

const getDecisionText = (status) => {
  if (status === 'hired') return 'Hired! 🎉'
  if (status === 'rejected') return 'Not selected'
  return 'In progress'
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const withdrawApplication = async (app) => {
  if (confirm('Are you sure you want to withdraw this application?')) {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', app.id)
      
      if (error) throw error
      
      applications.value = applications.value.filter(a => a.id !== app.id)
      alert('Application withdrawn successfully')
    } catch (error) {
      console.error('Error withdrawing:', error)
      alert('Failed to withdraw application')
    }
  }
}

// Main fetch function
const fetchApplications = async () => {
  console.log('🔄 Fetching applications...')
  loading.value = true
  
  try {
    // Get student profile
    const { data: studentData } = await supabase
      .from('student_profiles')
      .select('program, section')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    if (studentData) {
      program.value = studentData.program || ''
      section.value = studentData.section || ''
    }
    
    // Get all applications for this student
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', authStore.user.id)
      .order('applied_at', { ascending: false })
    
    if (appsError) {
      console.error('Error fetching apps:', appsError)
      throw appsError
    }
    
    console.log(`📋 Found ${apps?.length || 0} applications`)
    
    if (!apps || apps.length === 0) {
      applications.value = []
      loading.value = false
      return
    }
    
    // Get job details and match scores for each application
    const enrichedApps = []
    
    for (const app of apps) {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, job_type, work_setup, description, employer_id')
        .eq('id', app.job_id)
        .maybeSingle()
      
      if (jobError) {
        console.error('Error fetching job:', jobError)
      }
      
      // Get company name from employer_profiles
      let companyName = 'Company'
      if (job?.employer_id) {
        const { data: employer } = await supabase
          .from('employer_profiles')
          .select('company_name')
          .eq('user_id', job.employer_id)
          .maybeSingle()
        
        if (employer?.company_name) {
          companyName = employer.company_name
        }
      }
      
      // Get match score
      const { data: match } = await supabase
        .from('match_scores')
        .select('score')
        .eq('student_id', authStore.user.id)
        .eq('job_id', app.job_id)
        .maybeSingle()
      
      enrichedApps.push({
        id: app.id,
        status: app.status,
        applied_at: app.applied_at,
        job_id: app.job_id,
        job_title: job?.title || 'Unknown Job',
        company_name: companyName,
        job_type: job?.job_type || '',
        work_setup: job?.work_setup || '',
        description: job?.description || '',
        match_score: match?.score || 0
      })
    }
    
    applications.value = enrichedApps
    console.log(`✅ Loaded ${enrichedApps.length} applications with details`)
    
  } catch (error) {
    console.error('❌ Error in fetchApplications:', error)
  } finally {
    loading.value = false
  }
}

// Check for refresh flag from JobBrowse
const checkForNewApplications = () => {
  const shouldRefresh = localStorage.getItem('refreshApplications')
  if (shouldRefresh === 'true') {
    console.log('🔔 Refresh flag detected! Fetching new applications...')
    localStorage.removeItem('refreshApplications')
    fetchApplications()
    return true
  }
  return false
}

// Handle visibility change (when user comes back to tab)
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && window.location.pathname === '/student/applications') {
    console.log('👁️ Page became visible, checking for updates')
    checkForNewApplications()
  }
}

// Watch for route changes (when navigating to this page)
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/student/applications' && oldPath !== newPath) {
    console.log('🔀 Navigated to applications page, checking for updates')
    checkForNewApplications()
  }
})

// Refresh when component mounts
onMounted(() => {
  console.log('📱 Applications page mounted')
  fetchApplications()
  checkForNewApplications()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// Refresh when component becomes active (for keep-alive)
onActivated(() => {
  console.log('📱 Applications page activated')
  checkForNewApplications()
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.text-center { text-align: center; }
.badge {
  background: var(--gc-green);
  color: #fff;
  font-size: 0.62rem;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: auto;
}
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}
.sum-card {
  background: #fff;
  border: 0.5px solid #C0DD97;
  border-radius: 10px;
  padding: 0.9rem 1rem;
}
.sum-val {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem;
  color: var(--gc-green);
}
.sum-label {
  font-size: 0.72rem;
  color: var(--gc-muted);
  margin-top: 0.1rem;
}
.status-tabs {
  display: flex;
  gap: 0;
  border-bottom: 0.5px solid #C0DD97;
  margin-bottom: 1.5rem;
}
.stab {
  font-size: 0.82rem;
  color: var(--gc-muted);
  padding: 0.5rem 1.1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.stab.active {
  color: var(--gc-green);
  font-weight: 500;
  border-bottom-color: var(--gc-green);
}
.stab-count {
  font-size: 0.68rem;
  background: #F1EFE8;
  color: var(--gc-muted);
  padding: 1px 6px;
  border-radius: 10px;
}
.stab.active .stab-count {
  background: var(--gc-green-light);
  color: var(--gc-green);
}
.app-card {
  background: #fff;
  border: 0.5px solid #C0DD97;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 0.75rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: start;
}
.app-title {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--gc-dark);
  margin-bottom: 0.2rem;
}
.app-dept {
  font-size: 0.78rem;
  color: var(--gc-muted);
}
.app-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
.app-chip {
  font-size: 0.7rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 2px 10px;
  border-radius: 20px;
}
.app-chip.neutral {
  background: #F1EFE8;
  color: var(--gc-muted);
}
.app-date {
  font-size: 0.72rem;
  color: #B4B2A9;
}
.app-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}
.status-pill {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}
.status-pending {
  background: #FFF8E7;
  color: #B07D00;
  border: 0.5px solid #F0D070;
}
.status-review {
  background: #EAF3DE;
  color: var(--gc-green);
  border: 0.5px solid #C0DD97;
}
.status-interview {
  background: #E8F0FF;
  color: #2D5FC4;
  border: 0.5px solid #B0C4F0;
}
.status-hired {
  background: var(--gc-green);
  color: #fff;
}
.status-rejected {
  background: #FEF0F0;
  color: #B03030;
  border: 0.5px solid #F0C0C0;
}
.match-pct {
  font-size: 0.72rem;
  color: var(--gc-muted);
}
.match-pct strong {
  color: var(--gc-green);
}
.withdraw-btn {
  font-size: 0.7rem;
  color: #B4B2A9;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
.withdraw-btn:hover {
  color: #B03030;
}
.timeline {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 0.5px solid #EAF3DE;
}
.tl-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
.tl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
  background: #E0DDD5;
}
.tl-done {
  background: var(--gc-green);
}
.tl-text {
  font-size: 0.75rem;
  color: var(--gc-muted);
}
.tl-text strong {
  color: var(--gc-dark);
}
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 12px;
  border: 0.5px solid #C0DD97;
}
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.empty-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.2rem;
  color: var(--gc-dark);
  margin-bottom: 0.5rem;
}
.empty-sub {
  font-size: 0.82rem;
  color: var(--gc-muted);
  line-height: 1.6;
  margin-bottom: 1.25rem;
}
.btn-primary {
  background: var(--gc-green);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}
</style>