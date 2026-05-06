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
        <li @click="$router.push('/student/applications')">⬡ My applications</li>
        <li class="active">⬡ Saved</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/student/profile')">⬡ Edit profile</li>
        <li @click="$router.push('/student/resume')">⬡ Skills &amp; resume</li>
        <li @click="$router.push('/student/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="page-title">Saved Jobs</div>
      <div class="page-sub">Opportunities you've bookmarked. Don't wait too long — some are closing soon.</div>

      <div class="toolbar">
        <div class="saved-count">{{ savedJobs.length }} saved opportunities</div>
        <div class="sort-row">
          <span class="sort-label">Sort by</span>
          <select class="sort-select" v-model="sortBy">
            <option value="match">Match score</option>
            <option value="recent">Date saved</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="text-center" style="padding: 2rem;">Loading saved jobs...</div>
      
      <div v-else-if="savedJobs.length === 0" class="empty-state">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">No saved jobs yet</div>
        <div class="empty-sub">Save jobs you're interested in and they'll appear here.</div>
        <button class="btn-primary" @click="$router.push('/student/jobs')">Browse Jobs →</button>
      </div>

      <div v-else class="saved-grid">
        <div v-for="job in sortedJobs" :key="job.id" class="saved-card">
          <button class="save-btn" @click="removeSavedJob(job.id)">✕</button>
          <div class="sc-title">{{ job.title }}</div>
          <div class="sc-dept">{{ job.company_name || 'Company' }}</div>
          <div class="sc-tags">
            <span class="sc-tag">{{ job.job_type || 'Job type' }}</span>
            <span class="sc-tag neutral">{{ job.work_setup || 'Work setup' }}</span>
          </div>
          <div class="sc-footer">
            <div class="sc-match">
              <strong>{{ Math.round((job.match_score || 0) * 100) }}%</strong> match
            </div>
            <div class="sc-actions">
              <button class="view-btn" @click="viewJob(job.id)">View</button>
              <button class="apply-btn" @click="applyForJob(job)">Apply</button>
            </div>
          </div>
          <div class="deadline" v-if="job.posted_at">
            Saved {{ formatDate(job.saved_at) }}
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
const savedJobs = ref([])
const sortBy = ref('match')
const program = ref('')
const section = ref('')

const firstName = computed(() => authStore.profile?.first_name || 'Allyana')
const lastName = computed(() => authStore.profile?.last_name || 'Espiridion')
const initials = computed(() => (firstName.value.charAt(0) || 'A') + (lastName.value.charAt(0) || 'E'))

const sortedJobs = computed(() => {
  const jobs = [...savedJobs.value]
  if (sortBy.value === 'match') {
    jobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
  } else if (sortBy.value === 'recent') {
    jobs.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at))
  }
  return jobs
})

const formatDate = (dateString) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const viewJob = (jobId) => {
  router.push(`/student/jobs?job=${jobId}`)
}

const applyForJob = async (job) => {
  try {
    // Check if already applied
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('student_id', authStore.user.id)
      .maybeSingle()
    
    if (existing) {
      alert('You have already applied for this job!')
      return
    }
    
    const { error } = await supabase
      .from('applications')
      .insert({
        job_id: job.id,
        student_id: authStore.user.id,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    // Set refresh flag for applications page
    localStorage.setItem('refreshApplications', 'true')
    alert('Application submitted successfully!')
  } catch (error) {
    console.error('Error applying:', error)
    alert('Failed to submit application')
  }
}

const removeSavedJob = async (jobId) => {
  if (confirm('Remove this job from your saved list?')) {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('student_id', authStore.user.id)
        .eq('job_id', jobId)
      
      if (error) throw error
      
      // Remove from local array
      savedJobs.value = savedJobs.value.filter(job => job.id !== jobId)
      alert('Job removed from saved')
    } catch (error) {
      console.error('Error removing saved job:', error)
      alert('Failed to remove job')
    }
  }
}

const fetchSavedJobs = async () => {
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
    
    // Get saved jobs with job details
    const { data: saved, error: savedError } = await supabase
      .from('saved_jobs')
      .select('job_id, saved_at')
      .eq('student_id', authStore.user.id)
    
    if (savedError) throw savedError
    
    if (!saved || saved.length === 0) {
      savedJobs.value = []
      loading.value = false
      return
    }
    
    // Get job details for each saved job
    const jobsWithDetails = await Promise.all(saved.map(async (savedItem) => {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, job_type, work_setup, description, employer_id, posted_at')
        .eq('id', savedItem.job_id)
        .maybeSingle()
      
      if (jobError) {
        console.error('Error fetching job:', jobError)
        return null
      }
      
      // Get company name
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
        .eq('job_id', savedItem.job_id)
        .maybeSingle()
      
      return {
        id: job?.id,
        title: job?.title || 'Unknown Job',
        company_name: companyName,
        job_type: job?.job_type || '',
        work_setup: job?.work_setup || '',
        description: job?.description || '',
        posted_at: job?.posted_at,
        saved_at: savedItem.saved_at,
        match_score: match?.score || 0
      }
    }))
    
    savedJobs.value = jobsWithDetails.filter(job => job !== null)
    console.log(`✅ Loaded ${savedJobs.value.length} saved jobs`)
    
  } catch (error) {
    console.error('Error fetching saved jobs:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSavedJobs()
})
</script>

<style scoped>
.text-center { text-align: center; }

.page-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.6rem;
  color: var(--gc-dark);
  margin-bottom: 0.3rem;
}

.page-sub {
  font-size: 0.82rem;
  color: var(--gc-muted);
  margin-bottom: 1.5rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.saved-count {
  font-size: 0.82rem;
  color: var(--gc-muted);
}

.sort-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sort-label {
  font-size: 0.78rem;
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
  outline: none;
}

.saved-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

.saved-card {
  background: #fff;
  border: 0.5px solid #C0DD97;
  border-radius: 12px;
  padding: 1.2rem;
  position: relative;
  transition: border-color 0.15s;
}

.saved-card:hover {
  border-color: var(--gc-green-mid);
}

.save-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--gc-green);
  font-weight: bold;
}

.save-btn:hover {
  color: #B03030;
}

.sc-title {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--gc-dark);
  margin-bottom: 0.2rem;
  padding-right: 1.5rem;
}

.sc-dept {
  font-size: 0.75rem;
  color: var(--gc-muted);
  margin-bottom: 0.75rem;
}

.sc-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.sc-tag {
  font-size: 0.68rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 2px 8px;
  border-radius: 20px;
}

.sc-tag.neutral {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.sc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
}

.sc-match {
  font-size: 0.78rem;
  color: var(--gc-muted);
}

.sc-match strong {
  color: var(--gc-green);
  font-size: 0.85rem;
}

.sc-actions {
  display: flex;
  gap: 0.5rem;
}

.apply-btn {
  font-size: 0.75rem;
  background: var(--gc-green);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 4px 14px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}

.view-btn {
  font-size: 0.75rem;
  background: transparent;
  color: var(--gc-green);
  border: 0.5px solid var(--gc-green);
  border-radius: 20px;
  padding: 4px 14px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}

.deadline {
  font-size: 0.7rem;
  color: #B07D00;
  background: #FFF8E7;
  border: 0.5px solid #F0D070;
  padding: 2px 8px;
  border-radius: 20px;
  margin-top: 0.75rem;
  display: inline-block;
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

.badge {
  background: var(--gc-green);
  color: #fff;
  font-size: 0.62rem;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: auto;
}
</style>