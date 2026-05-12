<template>
  <div class="dash employer-applicants">
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
        <li class="active">⬡ Applicants <span class="badge">{{ totalApplicants }}</span></li>
        <li @click="$router.push('/employer/jobs')">⬡ Active listings</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/employer/company')">⬡ Company profile</li>
        <li @click="$router.push('/employer/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <div class="applicants-container">
      <!-- Job Selector -->
      <div class="job-selector">
        <select v-model="selectedJobId" class="job-select">
          <option value="all">All Jobs ({{ totalApplicants }})</option>
          <option v-for="job in jobs" :key="job.id" :value="job.id">
            {{ job.title }} ({{ getApplicantCount(job.id) }})
          </option>
        </select>
      </div>

      <!-- Three Column Layout -->
      <div class="applicants-layout">
        <!-- Left Column - Applicants List -->
        <div class="applicants-list">
          <div class="list-header">
            <div class="list-title">Applicants</div>
            <div class="stage-tabs">
              <button class="stage-tab" :class="{ active: activeStage === 'all' }" @click="activeStage = 'all'">All ({{ filteredApplicants.length }})</button>
              <button class="stage-tab" :class="{ active: activeStage === 'pending' }" @click="activeStage = 'pending'">Pending ({{ pendingCount }})</button>
              <button class="stage-tab" :class="{ active: activeStage === 'review' }" @click="activeStage = 'review'">Review ({{ reviewCount }})</button>
              <button class="stage-tab" :class="{ active: activeStage === 'interview' }" @click="activeStage = 'interview'">Interview ({{ interviewCount }})</button>
              <button class="stage-tab" :class="{ active: activeStage === 'hired' }" @click="activeStage = 'hired'">Hired ({{ hiredCount }})</button>
              <button class="stage-tab" :class="{ active: activeStage === 'rejected' }" @click="activeStage = 'rejected'">Rejected ({{ rejectedCount }})</button>
            </div>
          </div>
          
          <div class="list-scroll">
            <div v-if="loading" class="loading-state">Loading applicants...</div>
            <div v-else-if="filteredApplicants.length === 0" class="empty-state">No applicants found</div>
            <div v-else>
              <div 
                v-for="applicant in filteredApplicants" 
                :key="applicant.id" 
                class="applicant-card"
                :class="{ selected: selectedApplicant?.id === applicant.id }"
                @click="selectApplicant(applicant)"
              >
                <div class="applicant-avatar" :style="{ background: getAvatarColor(applicant.name) }">
                  {{ getInitials(applicant.name) }}
                </div>
                <div class="applicant-info">
                  <div class="applicant-name">{{ applicant.name }}</div>
                  <div class="applicant-meta">{{ applicant.program }} {{ applicant.section }}</div>
                  <div class="applicant-job">{{ applicant.job_title }}</div>
                </div>
                <div class="applicant-score" :class="getScoreClass(applicant.match_score)">
                  {{ Math.round((applicant.match_score || 0) * 100) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle Column - Applicant Details -->
        <div class="applicant-details" v-if="selectedApplicant">
          <div class="details-header">
            <button class="back-btn" @click="selectedApplicant = null">← Back</button>
            <div class="details-profile">
              <div class="details-avatar" :style="{ background: getAvatarColor(selectedApplicant.name) }">
                {{ getInitials(selectedApplicant.name) }}
              </div>
              <div>
                <div class="details-name">{{ selectedApplicant.name }}</div>
                <div class="details-meta">{{ selectedApplicant.program }} {{ selectedApplicant.section }}</div>
                <div class="details-date">Applied {{ formatDate(selectedApplicant.applied_at) }}</div>
              </div>
              <button
                class="profile-btn"
                @click="$router.push(`/students/${selectedApplicant.student_id}`)"
                v-if="selectedApplicant.student_id"
              >
                View public profile
              </button>
            </div>
          </div>

          <div class="details-section">
            <div class="section-title">Match Score</div>
            <div class="match-card">
              <div class="match-value">{{ Math.round((selectedApplicant.match_score || 0) * 100) }}%</div>
              <div class="match-bar">
                <div class="match-fill" :style="{ width: ((selectedApplicant.match_score || 0) * 100) + '%' }"></div>
              </div>
              <div class="match-note">{{ selectedApplicant.match_rationale || 'No match rationale available' }}</div>
            </div>
          </div>

          <div class="details-section">
            <div class="section-title">About</div>
            <div class="section-content">{{ selectedApplicant.about || 'No bio provided' }}</div>
          </div>

          <div class="details-section">
            <div class="section-title">Skills</div>
            <div class="skills-list">
              <span v-for="skill in selectedApplicant.skills" :key="skill" class="skill-badge">{{ skill }}</span>
              <span v-if="!selectedApplicant.skills?.length" class="no-data">No skills listed</span>
            </div>
          </div>

          <div class="details-section">
            <div class="section-title">Required Skills</div>
            <div class="skills-list">
              <span v-for="skill in selectedApplicant.required_skills" :key="skill" class="skill-badge required" :class="{ matched: selectedApplicant.skills?.includes(skill) }">
                {{ skill }}
              </span>
              <span v-if="!selectedApplicant.required_skills?.length" class="no-data">No required skills</span>
            </div>
          </div>

          <div class="details-section">
            <div class="section-title">Experience</div>
            <div v-if="selectedApplicant.experience?.length">
              <div v-for="(exp, idx) in selectedApplicant.experience" :key="idx" class="experience-item">
                <div class="exp-title">{{ exp.title || 'Experience' }}</div>
                <div class="exp-org">{{ exp.organization }} {{ exp.year ? '(' + exp.year + ')' : '' }}</div>
                <div class="exp-desc">{{ exp.description }}</div>
              </div>
            </div>
            <div v-else class="no-data">No experience listed</div>
          </div>
        </div>

        <div class="applicant-details empty" v-else>
          <div class="empty-detail">Select an applicant to view details</div>
        </div>

        <!-- Right Column - Actions -->
        <div class="applicant-actions" v-if="selectedApplicant">
          <div class="actions-title">Application Stage</div>
          <div class="status-buttons">
            <button class="status-btn" :class="{ active: selectedApplicant.status === 'pending' }" @click="updateStatus('pending')">Pending</button>
            <button class="status-btn" :class="{ active: selectedApplicant.status === 'review' }" @click="updateStatus('review')">Review</button>
            <button class="status-btn" :class="{ active: selectedApplicant.status === 'interview' }" @click="updateStatus('interview')">Interview</button>
            <button class="status-btn" :class="{ active: selectedApplicant.status === 'hired' }" @click="updateStatus('hired')">Hired</button>
            <button class="status-btn reject" :class="{ active: selectedApplicant.status === 'rejected' }" @click="updateStatus('rejected')">Reject</button>
          </div>

          <div class="divider"></div>

          <div class="actions-title">Internal Notes</div>
          <textarea class="notes-input" v-model="applicantNote" placeholder="Add private notes about this applicant..."></textarea>
          <button class="save-btn" @click="saveNote">Save Note</button>
        </div>

        <div class="applicant-actions empty" v-else>
          <div class="empty-detail">Select an applicant</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const sidebarOpen = ref(false)
const jobs = ref([])
const applicants = ref([])
const selectedApplicant = ref(null)
const selectedJobId = ref('all')
const activeStage = ref('all')
const applicantNote = ref('')
const companyName = ref('')
const firstName = ref('')

const initials = computed(() => {
  if (companyName.value) return companyName.value.charAt(0).toUpperCase()
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const totalApplicants = computed(() => applicants.value.length)

const pendingCount = computed(() => applicants.value.filter(a => a.status === 'pending').length)
const reviewCount = computed(() => applicants.value.filter(a => a.status === 'review').length)
const interviewCount = computed(() => applicants.value.filter(a => a.status === 'interview').length)
const hiredCount = computed(() => applicants.value.filter(a => a.status === 'hired').length)
const rejectedCount = computed(() => applicants.value.filter(a => a.status === 'rejected').length)

const filteredApplicants = computed(() => {
  let result = applicants.value
  if (selectedJobId.value !== 'all') {
    result = result.filter(a => a.job_id === selectedJobId.value)
  }
  if (activeStage.value !== 'all') {
    result = result.filter(a => a.status === activeStage.value)
  } else {
    result = result.filter(a => a.status !== 'rejected')
  }
  return result
})

const getApplicantCount = (jobId) => {
  return applicants.value.filter(a => a.job_id === jobId && a.status !== 'rejected').length
}

const getInitials = (name) => {
  if (!name || name === 'Student') return 'S'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const getAvatarColor = (name) => {
  const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A', '#1a2e0a']
  const index = (name?.length || 0) % colors.length
  return colors[index]
}

const getScoreClass = (score) => {
  const percent = (score || 0) * 100
  if (percent >= 70) return 'score-high'
  if (percent >= 40) return 'score-mid'
  return 'score-low'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const selectApplicant = (applicant) => {
  selectedApplicant.value = applicant
  applicantNote.value = applicant.employer_notes || ''
}

const updateStatus = async (status) => {
  if (!selectedApplicant.value) return
  
  try {
    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', selectedApplicant.value.id)
    
    if (error) throw error
    
    if (status === 'rejected') {
      console.log(`Rejection recorded for ${selectedApplicant.value.name}`)
    }
    
    const index = applicants.value.findIndex(a => a.id === selectedApplicant.value.id)
    if (index !== -1) applicants.value[index].status = status
    
    alert(`Application marked as ${status}`)
    await fetchData()
  } catch (error) {
    console.error('Error updating status:', error)
    alert('Failed to update status')
  }
}

const saveNote = async () => {
  if (!selectedApplicant.value) return
  
  try {
    const { error } = await supabase
      .from('applications')
      .update({ employer_notes: applicantNote.value })
      .eq('id', selectedApplicant.value.id)
    
    if (error) throw error
    
    const index = applicants.value.findIndex(a => a.id === selectedApplicant.value.id)
    if (index !== -1) applicants.value[index].employer_notes = applicantNote.value
    
    alert('Note saved')
  } catch (error) {
    console.error('Error saving note:', error)
    alert('Failed to save note')
  }
}

watch(selectedApplicant, (newVal) => {
  if (newVal) {
    applicantNote.value = newVal.employer_notes || ''
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const { data: profile } = await supabase
      .from('employer_profiles')
      .select('company_name')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    companyName.value = profile?.company_name || ''
    firstName.value = authStore.profile?.first_name || ''

    const { data: employerJobs } = await supabase
      .from('jobs')
      .select('id, title, required_skills')
      .eq('employer_id', authStore.user.id)
    
    jobs.value = employerJobs || []

    if (jobs.value.length === 0) {
      loading.value = false
      return
    }

    const jobIds = jobs.value.map(j => j.id)

    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .in('job_id', jobIds)
      .order('applied_at', { ascending: false })

    if (!apps || apps.length === 0) {
      loading.value = false
      return
    }

    const studentIds = [...new Set(apps.map(a => a.student_id))]
    
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', studentIds)
    
    const { data: studentProfiles } = await supabase
      .from('student_profiles')
      .select('user_id, program, section, about, skills, experience')
      .in('user_id', studentIds)
    
    const userMap = new Map(userProfiles?.map(p => [p.id, p]) || [])
    const studentMap = new Map(studentProfiles?.map(s => [s.user_id, s]) || [])
    
    const enrichedApps = []
    
    for (const app of apps) {
      const job = jobs.value.find(j => j.id === app.job_id)
      const user = userMap.get(app.student_id)
      const student = studentMap.get(app.student_id)
      
      const { data: match } = await supabase
        .from('match_scores')
        .select('score, rationale')
        .eq('student_id', app.student_id)
        .eq('job_id', app.job_id)
        .maybeSingle()
      
      const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Student'
      
        enrichedApps.push({
          id: app.id,
        student_id: app.student_id,
        job_id: app.job_id,
        job_title: job?.title || 'Unknown Job',
        name: fullName,
        program: student?.program || 'Not specified',
        section: student?.section || '',
        about: student?.about || 'No bio provided',
        skills: student?.skills || [],
        experience: student?.experience || [],
        status: app.status,
        applied_at: app.applied_at,
        employer_notes: app.employer_notes || '',
        match_score: match?.score || 0,
        match_rationale: match?.rationale || 'No match rationale available',
        required_skills: job?.required_skills || []
      })
    }
    
    applicants.value = enrichedApps
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

.applicants-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gc-cream);
}

.job-selector {
  background: #fff;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #C0DD97;
}

.job-select {
  width: 100%;
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #fff;
}

.applicants-layout {
  display: grid;
  grid-template-columns: 320px 1fr 280px;
  gap: 0;
  height: calc(100vh - 70px);
  overflow: hidden;
}

/* Left Column - Applicants List */
.applicants-list {
  background: #fff;
  border-right: 1px solid #C0DD97;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid #EAF3DE;
  flex-shrink: 0;
}

.list-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.stage-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.stage-tab {
  font-size: 0.7rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  border: none;
  background: #F1EFE8;
  color: var(--gc-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.stage-tab.active {
  background: var(--gc-green);
  color: #fff;
}

.list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.applicant-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.applicant-card:hover {
  background: #FAFAF7;
}

.applicant-card.selected {
  background: var(--gc-green-light);
  border-left: 3px solid var(--gc-green);
}

.applicant-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 500;
  flex-shrink: 0;
}

.applicant-info {
  flex: 1;
  min-width: 0;
}

.applicant-name {
  font-weight: 500;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.applicant-meta {
  font-size: 0.65rem;
  color: var(--gc-muted);
}

.applicant-job {
  font-size: 0.7rem;
  color: var(--gc-green);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.applicant-score {
  font-size: 0.75rem;
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

/* Middle Column - Details */
.applicant-details {
  background: #fff;
  padding: 1.25rem;
  overflow-y: auto;
}

.applicant-details.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.details-header {
  margin-bottom: 1.25rem;
}

.back-btn {
  display: none;
  background: none;
  border: none;
  color: var(--gc-muted);
  cursor: pointer;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.details-profile {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.details-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.details-name {
  font-family: 'DM Serif Display', serif;
  font-size: 1.2rem;
}

.details-meta {
  font-size: 0.75rem;
  color: var(--gc-muted);
}

.details-date {
  font-size: 0.7rem;
  color: #97C459;
}

.profile-btn {
  margin-left: auto;
  background: transparent;
  color: var(--gc-green);
  border: 1px solid var(--gc-green);
  border-radius: 20px;
  padding: 0.45rem 0.85rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.details-section {
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gc-dark);
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #EAF3DE;
}

.section-content {
  font-size: 0.85rem;
  color: var(--gc-muted);
  line-height: 1.5;
}

.match-card {
  background: var(--gc-green-light);
  border-radius: 10px;
  padding: 0.85rem;
}

.match-value {
  font-family: 'DM Serif Display', serif;
  font-size: 2rem;
  color: var(--gc-green);
}

.match-bar {
  background: #C0DD97;
  border-radius: 4px;
  height: 6px;
  margin: 0.5rem 0;
}

.match-fill {
  background: var(--gc-green);
  border-radius: 4px;
  height: 6px;
}

.match-note {
  font-size: 0.7rem;
  color: var(--gc-green);
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-badge {
  font-size: 0.7rem;
  padding: 4px 10px;
  background: var(--gc-green-light);
  color: var(--gc-green);
  border-radius: 20px;
}

.skill-badge.required {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.skill-badge.matched {
  background: var(--gc-green);
  color: #fff;
}

.experience-item {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #EAF3DE;
}

.exp-title {
  font-weight: 500;
  font-size: 0.85rem;
}

.exp-org {
  font-size: 0.7rem;
  color: #97C459;
}

.exp-desc {
  font-size: 0.75rem;
  color: var(--gc-muted);
  margin-top: 0.25rem;
}

.no-data {
  font-size: 0.8rem;
  color: #B4B2A9;
  font-style: italic;
}

/* Right Column - Actions */
.applicant-actions {
  background: #fff;
  border-left: 1px solid #C0DD97;
  padding: 1.25rem;
  overflow-y: auto;
}

.applicant-actions.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-title {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.status-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-btn {
  padding: 0.6rem;
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.status-btn:hover {
  background: #FAFAF7;
}

.status-btn.active {
  background: var(--gc-green);
  color: #fff;
  border-color: var(--gc-green);
}

.status-btn.reject.active {
  background: #B03030;
  border-color: #B03030;
}

.divider {
  height: 1px;
  background: #EAF3DE;
  margin: 1rem 0;
}

.notes-input {
  width: 100%;
  min-height: 100px;
  padding: 0.6rem;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
  resize: vertical;
}

.save-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--gc-green);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 0.75rem;
  cursor: pointer;
}

.empty-detail, .loading-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gc-muted);
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .applicants-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .applicants-list, .applicant-details, .applicant-actions {
    border-right: none;
    border-bottom: 1px solid #C0DD97;
  }
  
  .back-btn {
    display: inline-block;
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
