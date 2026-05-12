<template>
  <div class="dash">
    <aside class="sidebar">
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
        <li class="active">⬡ Post a job</li>
        <li @click="$router.push('/employer/applicants')">⬡ Applicants</li>
        <li @click="$router.push('/employer/jobs')">⬡ Active listings</li>
        <li @click="$router.push('/employer/hired')">⬡ Hired students</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/employer/company')">⬡ Company profile</li>
        <li @click="$router.push('/employer/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Post a new opportunity</div>
          <div class="page-sub">Fill in the details below and the matching engine will rank likely student fits.</div>
        </div>
      </div>

      <div class="layout">
        <div>
          <div class="form-card">
            <div class="form-section">
              <label class="form-label">Job title <span>(required)</span></label>
              <input class="form-input" v-model="form.title" placeholder="e.g., Web Development Assistant" />
            </div>

            <div class="form-row">
              <div class="form-section" style="margin-bottom:0">
                <label class="form-label">Job type</label>
                <select class="form-select" v-model="form.job_type">
                  <option value="">Select type</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="full-time">Full-time</option>
                </select>
              </div>
              <div class="form-section" style="margin-bottom:0">
                <label class="form-label">Work setup</label>
                <select class="form-select" v-model="form.work_setup">
                  <option value="">Select setup</option>
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <hr class="divider" />

            <div class="form-row">
              <div class="form-section" style="margin-bottom:0">
                <label class="form-label">Schedule / Shift</label>
                <select v-model="form.schedule" class="form-select">
                  <option value="">Select schedule</option>
                  <option value="weekdays_morning">Weekdays - Morning (8AM - 12PM)</option>
                  <option value="weekdays_afternoon">Weekdays - Afternoon (1PM - 5PM)</option>
                  <option value="weekdays_evening">Weekdays - Evening (6PM - 9PM)</option>
                  <option value="weekends_morning">Weekends - Morning (8AM - 12PM)</option>
                  <option value="weekends_afternoon">Weekends - Afternoon (1PM - 5PM)</option>
                  <option value="full_time">Full-time (40 hours/week)</option>
                  <option value="part_time">Part-time (20 hours/week)</option>
                  <option value="flexible">Flexible schedule</option>
                </select>
              </div>
            </div>

            <hr class="divider" />

            <div class="form-section">
              <label class="form-label">Job description</label>
              <textarea class="form-textarea" v-model="form.description" rows="6" placeholder="Describe the role, responsibilities, and who should apply."></textarea>
            </div>

            <div class="form-section">
              <label class="form-label">Required skills <span>(used for AI matching)</span></label>
              <div class="skill-input-wrap">
                <div class="skill-chips">
                  <span v-for="(skill, index) in skills" :key="index" class="skill-chip">
                    {{ skill }}
                    <span class="skill-chip-x" @click="removeSkill(index)">×</span>
                  </span>
                </div>
                <input 
                  class="skill-input-ghost" 
                  v-model="skillInput" 
                  @keydown.enter.prevent="addSkill"
                  @keydown.tab.prevent="addSkill"
                  placeholder="+ Add skill" 
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="preview-card">
            <div class="preview-label">Live preview</div>
            <div class="preview-title">{{ form.title || 'New job draft' }}</div>
            <div class="preview-dept">{{ companyName }} · Posted just now</div>
            <div class="preview-tags">
              <span class="ptag" v-if="form.job_type">{{ form.job_type }}</span>
              <span class="ptag type" v-if="form.work_setup">{{ form.work_setup }}</span>
            </div>
            <div class="preview-desc">{{ form.description || 'Your role description preview will appear here.' }}</div>

            <div class="ai-preview-box">
              <div class="ai-preview-label">AI match estimate</div>
              <div class="ai-preview-body">
                Based on your listed skills, approximately <strong style="color:var(--gc-green)">14 students</strong> on the platform have a match score above 70% for this role.
              </div>
            </div>

            <div class="applicants-preview">
              <div class="ap-label">Top predicted matches</div>
              <div class="ap-row" v-for="(match, idx) in predictedMatches" :key="idx">
                <span class="ap-name">{{ match.name }}</span>
                <span class="ap-pct">{{ match.score }}%</span>
              </div>
            </div>

            <button class="submit-btn" @click="createJob" :disabled="loading">
              {{ loading ? 'Publishing...' : 'Publish this listing' }}
            </button>
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
import { computeMatchesForJob } from '@/api/matching'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const companyName = ref('')
const firstName = ref('')
const skills = ref([])
const skillInput = ref('')

const form = ref({
  title: '',
  job_type: '',
  work_setup: '',
  schedule: '',
  slots: 1,
  description: '',
  status: 'active'
})

const initials = computed(() => {
  if (companyName.value) {
    return companyName.value.charAt(0).toUpperCase()
  }
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const predictedMatches = ref([
  { name: 'Allyana Espiridion', score: 94 },
  { name: 'John David Cruz', score: 87 },
  { name: 'Maria Santos', score: 82 }
])

const addSkill = () => {
  const skill = skillInput.value.trim()
  if (skill && !skills.value.includes(skill)) {
    skills.value.push(skill)
    skillInput.value = ''
  }
}

const removeSkill = (index) => {
  skills.value.splice(index, 1)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const createJob = async () => {
  if (!form.value.title) {
    alert('Please enter a job title')
    return
  }
  if (!form.value.description) {
    alert('Please enter a job description')
    return
  }

  loading.value = true
  try {
    const jobData = {
      employer_id: authStore.user.id,
      title: form.value.title,
      description: form.value.description,
      job_type: form.value.job_type || null,
      work_setup: form.value.work_setup || null,
      schedule: form.value.schedule || null,
      required_skills: skills.value,
      slots: parseInt(form.value.slots) || 1,
      status: 'active',
      posted_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()

    if (error) throw error

    const job = Array.isArray(data) ? data[0] : data
    if (job?.id) {
      let embeddingGenerated = false

      // Generate embedding for cosine similarity
      try {
        const { data: embedData, error: embedError } = await supabase.functions.invoke('embed-job', {
          body: {
            jobId: job.id,
            title: form.value.title,
            description: form.value.description,
            skills: skills.value
          }
        })
        if (embedError || embedData?.success === false) {
          throw new Error(embedData?.error || embedError?.message || 'Failed to generate job embedding')
        }
        embeddingGenerated = true
        console.log('Embedding generated for job')
      } catch (embedError) {
        console.error('Failed to generate embedding:', embedError)
      }

      if (embeddingGenerated) {
        try {
          await computeMatchesForJob(job.id)
        } catch (matchError) {
          console.error('Failed to compute cosine matches:', matchError)
        }
      }
    }

    alert('Job posted successfully!')
    router.push('/employer/jobs')
  } catch (error) {
    console.error('Error creating job:', error)
    alert('Failed to create job: ' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchEmployerData = async () => {
  try {
    const { data: profile } = await supabase
      .from('employer_profiles')
      .select('company_name')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    companyName.value = profile?.company_name || ''
    firstName.value = authStore.profile?.first_name || ''
  } catch (error) {
    console.error('Error fetching employer data:', error)
  }
}

onMounted(() => {
  fetchEmployerData()
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

.page-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.6rem;
  color: var(--gc-dark);
  margin-bottom: 0.25rem;
}

.page-sub {
  font-size: 0.82rem;
  color: var(--gc-muted);
}

.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
}

.form-card {
  background: #fff;
  border-radius: 10px;
  border: 0.5px solid #C0DD97;
  padding: 1.25rem;
}

.form-section {
  margin-bottom: 1.25rem;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--gc-dark);
  margin-bottom: 0.4rem;
  display: block;
}

.form-label span {
  color: #B4B2A9;
  font-weight: 400;
}

.form-input {
  width: 100%;
  border: 0.5px solid #C0DD97;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.82rem;
  font-family: 'DM Sans', sans-serif;
  color: var(--gc-dark);
  background: #fff;
  outline: none;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: var(--gc-green);
}

.form-textarea {
  width: 100%;
  border: 0.5px solid #C0DD97;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.82rem;
  font-family: 'DM Sans', sans-serif;
  color: var(--gc-dark);
  background: #fff;
  outline: none;
  resize: vertical;
}

.form-select {
  width: 100%;
  border: 0.5px solid #C0DD97;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.82rem;
  font-family: 'DM Sans', sans-serif;
  color: var(--gc-dark);
  background: #fff;
  outline: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.divider {
  border: none;
  border-top: 0.5px solid #EAF3DE;
  margin: 1rem 0;
}

.skill-input-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  border: 0.5px solid #C0DD97;
  border-radius: 8px;
  padding: 0.5rem;
  background: #fff;
  min-height: 44px;
  align-items: center;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.skill-chip {
  font-size: 0.72rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 3px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.skill-chip-x {
  font-size: 10px;
  cursor: pointer;
  color: var(--gc-green-mid);
}

.skill-input-ghost {
  font-size: 0.78rem;
  color: #B4B2A9;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  flex: 1;
  min-width: 100px;
}

.preview-card {
  background: #fff;
  border-radius: 10px;
  border: 0.5px solid #C0DD97;
  padding: 1rem;
  position: sticky;
  top: 1rem;
}

.preview-label {
  font-size: 0.68rem;
  color: #B4B2A9;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.preview-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.1rem;
  color: var(--gc-dark);
  margin-bottom: 0.2rem;
}

.preview-dept {
  font-size: 0.75rem;
  color: var(--gc-muted);
  margin-bottom: 0.75rem;
}

.preview-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.ptag {
  font-size: 0.68rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 2px 8px;
  border-radius: 20px;
}

.ptag.type {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.preview-desc {
  font-size: 0.75rem;
  color: var(--gc-muted);
  line-height: 1.6;
  margin-bottom: 0.85rem;
}

.ai-preview-box {
  background: var(--gc-green-light);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.ai-preview-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--gc-green);
  margin-bottom: 0.4rem;
}

.ai-preview-body {
  font-size: 0.72rem;
  color: var(--gc-muted);
  line-height: 1.5;
}

.applicants-preview {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 0.5px solid #EAF3DE;
}

.ap-label {
  font-size: 0.7rem;
  color: var(--gc-muted);
  margin-bottom: 0.5rem;
}

.ap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
}

.ap-name {
  font-size: 0.75rem;
  color: var(--gc-dark);
}

.ap-pct {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--gc-green);
}

.submit-btn {
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

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
