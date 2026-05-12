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
        <li class="active">⬡ Dashboard</li>
        <li @click="$router.push('/student/jobs')">⬡ Browse jobs</li>
        <li @click="$router.push('/student/applications')">⬡ My applications <span class="badge">{{ applicationsCount }}</span></li>
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
          <div class="main-title">Welcome back, {{ firstName }}</div>
          <div class="main-sub">{{ recommendedJobs.length }} new matches since your last visit</div>
        </div>
        <button class="btn-sm" @click="$router.push('/student/profile')">Update profile</button>
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="metric-val">{{ recommendedJobs.length }}</div>
          <div class="metric-label">Recommended jobs</div>
        </div>
        <div class="metric">
          <div class="metric-val">{{ applicationsCount }}</div>
          <div class="metric-label">Applications sent</div>
        </div>
        <div class="metric">
          <div class="metric-val">{{ topMatchScore }}%</div>
          <div class="metric-label">Top match score</div>
        </div>
      </div>

      <div class="dashboard-layout">
        <div>
          <div class="section-head">
            Recommended for you
            <span class="see-all" @click="$router.push('/student/jobs')">See all →</span>
          </div>

          <div v-if="loading" class="text-center" style="padding:2rem;">Loading recommendations...</div>
          <div v-else-if="recommendedJobs.length === 0" class="text-center" style="padding:2rem; background:white; border-radius:10px;">
            No job matches yet. Upload your resume to get personalized matches!
          </div>
          <div v-else>
            <div v-for="job in recommendedJobs.slice(0, 5)" :key="job.id" class="job-card">
              <div>
                <div class="job-title">{{ job.title }}</div>
                <button
                  v-if="job.employer_id"
                  class="job-company-btn"
                  @click="openCompanyProfile(job.employer_id)"
                >
                  {{ job.company_name || 'Gordon College Partner' }}
                </button>
                <div v-else class="job-dept">{{ job.company_name || 'Gordon College Partner' }}</div>
                <div class="job-tags">
                  <span v-for="skill in (job.required_skills || []).slice(0, 3)" :key="skill" class="jtag">{{ skill }}</span>
                </div>
              </div>
              <div class="job-right">
                <div class="pct-pill" :class="getMatchClass(job.match_score)">
                  {{ Math.round((job.match_score || 0) * 100) }}% match
                </div>
                <button class="apply-btn" @click="applyForJob(job)">Apply</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="section-head">Your profile</div>

          <div class="profile-card">
            <div class="profile-label">Skills on file</div>
            <div class="skills-wrap">
              <span v-for="skill in skills.slice(0, 8)" :key="skill" class="skill-tag">{{ skill }}</span>
              <span v-if="skills.length === 0" class="skill-tag">No skills yet</span>
            </div>
          </div>

          <div class="profile-card">
            <div class="profile-label">Profile completeness</div>
            <div class="prog-bar-bg">
              <div class="prog-bar" :style="{ width: completenessPercent + '%' }"></div>
            </div>
            <div class="prog-label">
              <span>{{ completenessPercent }}% complete</span>
              <span @click="$router.push('/student/resume')" style="cursor:pointer">Add resume →</span>
            </div>
          </div>

          <div class="profile-card" style="background:var(--gc-green-light);border-color:#97C459">
            <div style="font-size:0.78rem;color:var(--gc-green);font-weight:500;margin-bottom:0.35rem">💡 Tip from the AI engine</div>
            <div style="font-size:0.75rem;color:var(--gc-muted);line-height:1.6">
              {{ aiTip }}
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
import { useApplicationsStore } from '@/stores/applications'
import { supabase } from '@/api/supabase'
import { computeMatchesForStudent } from '@/api/matching'

const router = useRouter()
const authStore = useAuthStore()
const applicationsStore = useApplicationsStore()

const loading = ref(true)
const recommendedJobs = ref([])
const applicationsCount = ref(0)
const skills = ref([])
const experiences = ref([])
const about = ref('')
const topMatchScore = ref(0)
const program = ref('')
const section = ref('')
const resumeUrl = ref(null)

const firstName = computed(() => authStore.profile?.first_name || '')
const lastName = computed(() => authStore.profile?.last_name || '')
const initials = computed(() => (firstName.value.charAt(0) || '') + (lastName.value.charAt(0) || ''))

const completenessPercent = computed(() => {
  let score = 0
  if (firstName.value && lastName.value) score += 15
  if (program.value) score += 15
  if (section.value) score += 15
  if (skills.value.length > 0) score += 20
  if (experiences.value.length > 0) score += 20
  if (about.value) score += 15
  return Math.min(score, 100)
})

const aiTip = computed(() => {
  if (skills.value.length === 0) return 'Upload your resume to get AI-powered skill extraction!'
  if (experiences.value.length === 0) return 'Add your experience and involvement to stand out to employers!'
  if (completenessPercent.value < 70) return 'Complete your profile to increase match scores!'
  return 'Your profile looks great! Keep applying!'
})

const getMatchClass = (score) => {
  const percent = (score || 0) * 100
  if (percent >= 70) return 'pct-high'
  if (percent >= 40) return 'pct-mid'
  return 'pct-low'
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const openCompanyProfile = (employerId) => {
  if (!employerId) return
  router.push(`/companies/${employerId}`)
}

const applyForJob = async (job) => {
  try {
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

    applicationsStore.triggerRefresh()
    alert('Application submitted successfully!')
  } catch (error) {
    console.error('Error applying:', error)
    alert('Failed to submit application')
  }
}

const loadMatchedJobs = async () => {
  const { data: matches, error } = await supabase
    .from('match_scores')
    .select(`
      score,
      job:job_id (
        id,
        title,
        employer_id,
        required_skills,
        posted_at,
        status
      )
    `)
    .eq('student_id', authStore.user.id)
    .order('score', { ascending: false })
    .limit(10)

  if (error) throw error
  if (!matches?.length) return []

  const employerIds = [...new Set(matches.map(m => m.job?.employer_id).filter(Boolean))]
  const { data: employers } = employerIds.length
    ? await supabase
        .from('employer_profiles')
        .select('user_id, company_name')
        .in('user_id', employerIds)
    : { data: [] }
  const employerMap = new Map((employers || []).map(e => [e.user_id, e.company_name]))

  return matches
    .filter(m => m.job)
    .map(m => ({
      ...m.job,
      company_name: employerMap.get(m.job.employer_id) || 'Gordon College Partner',
      match_score: m.score
    }))
}

const fetchData = async () => {
  loading.value = true
  try {
    const { data: studentData } = await supabase
      .from('student_profiles')
      .select('program, section, skills, experience, about')
      .eq('user_id', authStore.user.id)
      .maybeSingle()

    if (studentData) {
      program.value = studentData.program || ''
      section.value = studentData.section || ''
      skills.value = studentData.skills || []
      experiences.value = studentData.experience || []
      about.value = studentData.about || ''
    }

    const { data: resume } = await supabase
      .from('resumes')
      .select('file_url')
      .eq('student_id', authStore.user.id)
      .eq('is_active', true)
      .maybeSingle()

    resumeUrl.value = resume?.file_url || null

    let matchedJobs = await loadMatchedJobs()

    if (!matchedJobs.length && skills.value.length) {
      await computeMatchesForStudent(authStore.user.id)
      matchedJobs = await loadMatchedJobs()
    }

    if (matchedJobs.length > 0) {
      recommendedJobs.value = matchedJobs
      topMatchScore.value = Math.round((matchedJobs[0].match_score || 0) * 100)
    } else {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .limit(10)
      recommendedJobs.value = jobs || []
    }

    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', authStore.user.id)

    applicationsCount.value = count || 0
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
.text-center { text-align: center; }
.badge {
  background: var(--gc-green);
  color: #fff;
  font-size: 0.62rem;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: auto;
}
.pct-low { background: #F1EFE8; color: var(--gc-muted); }
.pct-mid { background: #C0DD97; color: #27500A; }
.pct-high { background: var(--gc-green); color: #fff; }

.job-company-btn {
  background: none;
  border: none;
  padding: 0;
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--gc-green);
  cursor: pointer;
  text-align: left;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1rem;
}

@media (max-width: 900px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
}
</style>