<template>
  <div class="dash job-browse">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
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
        <li class="active">⬡ Browse jobs</li>
        <li @click="$router.push('/student/applications')">⬡ My applications</li>
        <li @click="$router.push('/student/saved')">⬡ Saved</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/student/profile')">⬡ Edit profile</li>
        <li @click="$router.push('/student/resume')">⬡ Skills &amp; resume</li>
        <li @click="$router.push('/student/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Browse Jobs</div>
          <div class="page-sub">Search, filter, and review jobs matched to your profile.</div>
        </div>
        <div class="search-row">
          <span style="color:#97C459;font-size:14px">🔍</span>
          <input class="search-input" v-model="searchQuery" placeholder="Search jobs, skills, companies..." />
        </div>
      </div>

      <div class="layout">
        <div class="filters">
          <div class="filter-title">Job Type</div>
          <div class="filter-group">
            <div v-for="type in jobTypes" :key="type" class="filter-option" :class="{ active: selectedJobType === type }" @click="selectedJobType = selectedJobType === type ? '' : type">
              <span class="checkbox" :class="{ checked: selectedJobType === type }"></span>{{ type }}
            </div>
          </div>
          <div class="filter-title">Work Setup</div>
          <div class="filter-group">
            <div v-for="setup in workSetups" :key="setup" class="filter-option" :class="{ active: selectedWorkSetup === setup }" @click="selectedWorkSetup = selectedWorkSetup === setup ? '' : setup">
              <span class="checkbox" :class="{ checked: selectedWorkSetup === setup }"></span>{{ setup }}
            </div>
          </div>
        </div>

        <div class="jobs-col">
          <div class="jobs-header">
            <div class="jobs-count">{{ filteredJobs.length }} opportunities found</div>
            <select class="sort-select" v-model="sortBy">
              <option value="match">Sort: Best match</option>
              <option value="recent">Sort: Most recent</option>
            </select>
          </div>
          <div v-if="loading" class="text-center" style="padding:2rem;">Loading jobs...</div>
          <div v-else-if="filteredJobs.length === 0" class="text-center" style="padding:2rem;">No jobs found.</div>
          <div v-else>
            <div v-for="job in filteredJobs" :key="job.id" class="job-row" :class="{ selected: selectedJob?.id === job.id }" @click="selectJob(job)">
              <div class="jr-top">
                <div><div class="jr-title">{{ job.title }}</div><div class="jr-dept">{{ job.company_name || 'Company' }}</div></div>
                <div class="pct" :class="getMatchClass(job.match_score)">{{ Math.round((job.match_score || 0) * 100) }}%</div>
              </div>
              <div class="jr-meta">
                <span class="jr-chip type">{{ job.job_type || 'Not specified' }}</span>
                <span class="jr-chip">{{ job.work_setup || 'Work setup' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-panel" v-if="selectedJob">
          <div class="dp-tag">{{ selectedJob.job_type || 'Position' }}</div>
          <div class="dp-title">{{ selectedJob.title }}</div>
          <div class="dp-dept">{{ selectedJob.company_name || 'Company' }} · Posted {{ formatDate(selectedJob.posted_at) }}</div>
          <div class="dp-match-box">
            <div class="dp-match-label">AI match score</div>
            <div class="dp-match-num">{{ Math.round((selectedJob.match_score || 0) * 100) }}%</div>
            <div class="dp-bar-bg"><div class="dp-bar" :style="{ width: ((selectedJob.match_score || 0) * 100) + '%' }"></div></div>
          </div>
          <div class="dp-section"><div class="dp-section-label">About this role</div><div class="dp-section-body">{{ selectedJob.description }}</div></div>
          <div class="dp-section"><div class="dp-section-label">Required skills</div><div class="dp-section-body"><div v-for="skill in selectedJob.required_skills || []" :key="skill" class="skill-match-row"><span class="skill-match-name">{{ skill }}</span><span class="skill-match-yes">✓ Matching</span></div></div></div>
          <button class="apply-btn-big" @click="handleApply" :disabled="applying">{{ applying ? 'Applying...' : 'Apply now →' }}</button>
        </div>
        <div class="detail-panel" v-else><div class="text-center" style="padding:2rem;">Select a job to view details</div></div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApplicationsStore } from '@/stores/applications'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()
const applicationsStore = useApplicationsStore()

const loading = ref(true)
const applying = ref(false)
const sidebarOpen = ref(false)
const allJobs = ref([])
const selectedJob = ref(null)
const searchQuery = ref('')
const selectedJobType = ref('')
const selectedWorkSetup = ref('')
const sortBy = ref('match')
const program = ref('')
const section = ref('')

const jobTypes = ['full-time', 'part-time', 'internship', 'volunteer']
const workSetups = ['on-site', 'remote', 'flexible']

const firstName = computed(() => authStore.profile?.first_name || 'Allyana')
const lastName = computed(() => authStore.profile?.last_name || 'Espiridion')
const initials = computed(() => (firstName.value.charAt(0) || 'A') + (lastName.value.charAt(0) || 'E'))

const filteredJobs = computed(() => {
  let result = [...allJobs.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(j => j.title?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q))
  }
  if (selectedJobType.value) result = result.filter(j => j.job_type === selectedJobType.value)
  if (selectedWorkSetup.value) result = result.filter(j => j.work_setup === selectedWorkSetup.value)
  if (sortBy.value === 'match') result.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
  else result.sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))
  return result
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'Recently'
const getMatchClass = (s) => { const p = (s || 0) * 100; return p >= 70 ? 'p-high' : p >= 40 ? 'p-mid' : 'p-low' }
const selectJob = (j) => selectedJob.value = j
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }

const handleLogout = async () => { 
  await authStore.logout() 
  router.push('/') 
}

const handleApply = async () => {
  if (!selectedJob.value) return
  
  applying.value = true
  try {
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', selectedJob.value.id)
      .eq('student_id', authStore.user.id)
      .maybeSingle()
    
    if (existing) {
      alert('You have already applied for this job!')
      return
    }
    
    const { error } = await supabase
      .from('applications')
      .insert({
        job_id: selectedJob.value.id,
        student_id: authStore.user.id,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    localStorage.setItem('refreshApplications', 'true')
    alert('Application submitted successfully!')
  } catch (error) {
    console.error('Error applying:', error)
    alert('Failed to submit application')
  } finally {
    applying.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { data: student } = await supabase.from('student_profiles').select('program, section').eq('user_id', authStore.user.id).maybeSingle()
    if (student) { program.value = student.program || ''; section.value = student.section || '' }
    const { data: matches } = await supabase.from('match_scores').select(`score, job:job_id(*)`).eq('student_id', authStore.user.id).order('score', { ascending: false })
    if (matches?.length) {
      allJobs.value = matches.map(m => ({ ...m.job, match_score: m.score }))
      selectedJob.value = allJobs.value[0]
    } else {
      const { data: jobs } = await supabase.from('jobs').select('*').eq('status', 'active')
      allJobs.value = jobs || []
      if (allJobs.value.length) selectedJob.value = allJobs.value[0]
    }
  } catch (error) { console.error(error) } finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.text-center { text-align: center; }

.layout {
  display: grid;
  grid-template-columns: 220px 1fr 320px;
  gap: 0;
  min-height: 600px;
}

.filters {
  background: #fff;
  border-right: 0.5px solid #C0DD97;
  padding: 1.25rem;
}

.filter-title {
  font-size: 0.72rem;
  color: #B4B2A9;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}

.filter-group {
  margin-bottom: 1.25rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--gc-muted);
  padding: 0.25rem 0;
  cursor: pointer;
}

.filter-option.active {
  color: var(--gc-green);
  font-weight: 500;
}

.checkbox {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #C0DD97;
  background: #fff;
  display: inline-block;
}

.checkbox.checked {
  background: var(--gc-green);
  border-color: var(--gc-green);
}

.jobs-col {
  padding: 1.25rem;
  overflow-y: auto;
}

.jobs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.jobs-count {
  font-size: 0.82rem;
  color: var(--gc-muted);
}

.sort-select {
  font-size: 0.78rem;
  color: var(--gc-green);
  background: transparent;
  border: 0.5px solid #C0DD97;
  border-radius: 20px;
  padding: 3px 10px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
}

.job-row {
  background: #fff;
  border-radius: 10px;
  border: 0.5px solid #C0DD97;
  padding: 1rem;
  margin-bottom: 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.job-row.selected {
  border-color: var(--gc-green);
  border-width: 1.5px;
}

.jr-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.35rem;
}

.jr-title {
  font-weight: 500;
  font-size: 0.88rem;
  color: var(--gc-dark);
}

.jr-dept {
  font-size: 0.75rem;
  color: var(--gc-muted);
}

.jr-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.jr-chip {
  font-size: 0.68rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 2px 8px;
  border-radius: 20px;
}

.jr-chip.type {
  background: #F7F5EE;
  color: var(--gc-muted);
}

.pct {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 20px;
}

.p-low { background: #F1EFE8; color: var(--gc-muted); }
.p-mid { background: #C0DD97; color: #27500A; }
.p-high { background: var(--gc-green); color: #fff; }

.detail-panel {
  background: #fff;
  border-left: 0.5px solid #C0DD97;
  padding: 1.25rem;
  overflow-y: auto;
}

.dp-tag {
  display: inline-block;
  background: var(--gc-green-light);
  color: var(--gc-green);
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

.dp-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.4rem;
  color: var(--gc-dark);
  margin-bottom: 0.25rem;
}

.dp-dept {
  font-size: 0.8rem;
  color: var(--gc-muted);
  margin-bottom: 1rem;
}

.dp-match-box {
  background: var(--gc-green-light);
  border-radius: 10px;
  padding: 0.85rem;
  margin-bottom: 1rem;
}

.dp-match-label {
  font-size: 0.72rem;
  color: var(--gc-green);
  margin-bottom: 0.25rem;
}

.dp-match-num {
  font-family: 'DM Serif Display', serif;
  font-size: 1.8rem;
  color: var(--gc-green);
}

.dp-bar-bg {
  background: #97C459;
  border-radius: 4px;
  height: 6px;
  margin: 0.4rem 0;
}

.dp-bar {
  background: var(--gc-green);
  border-radius: 4px;
  height: 6px;
}

.dp-section {
  margin-bottom: 0.85rem;
}

.dp-section-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--gc-dark);
  margin-bottom: 0.4rem;
}

.dp-section-body {
  font-size: 0.8rem;
  color: var(--gc-muted);
  line-height: 1.7;
}

.skill-match-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  padding: 0.3rem 0;
  border-bottom: 0.5px solid #EAF3DE;
}

.skill-match-name {
  color: var(--gc-dark);
}

.skill-match-yes {
  color: var(--gc-green);
  font-weight: 500;
}

.apply-btn-big {
  width: 100%;
  background: var(--gc-green);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.65rem;
  font-size: 0.88rem;
  font-family: 'DM Serif Display', serif;
  cursor: pointer;
  margin-top: 0.75rem;
}

.apply-btn-big:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: #F7F5EE;
  border: 0.5px solid #C0DD97;
  border-radius: 20px;
  padding: 0.4rem 0.75rem;
  min-width: 260px;
}

.search-input {
  border: none;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  color: var(--gc-dark);
  outline: none;
  flex: 1;
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  
  .filters {
    border-right: none;
    border-bottom: 0.5px solid #C0DD97;
  }
  
  .detail-panel {
    border-left: none;
    border-top: 0.5px solid #C0DD97;
  }
  
  .main-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-row {
    width: 100%;
  }
  
  .filters {
    padding: 1rem;
  }
  
  .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .filter-option {
    padding: 0.25rem 0.5rem;
    background: #F7F5EE;
    border-radius: 20px;
  }
}

.sidebar-toggle {
  display: none;
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

@media (max-width: 900px) {
  .sidebar-toggle {
    display: flex;
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
</style>