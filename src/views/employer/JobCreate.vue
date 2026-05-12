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
                <label class="form-label">Industry</label>
                <select class="form-select" v-model="form.industry" @change="onIndustryChange">
                  <option value="">Select industry (for skill suggestions)</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Web & Mobile Development">Web & Mobile Development</option>
                  <option value="IT Services & Consulting">IT Services & Consulting</option>
                  <option value="Artificial Intelligence">Artificial Intelligence / ML</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Cloud Computing">Cloud Computing & DevOps</option>
                  <option value="Data Analytics">Data Analytics & BI</option>
                  <option value="Game Development">Game Development</option>
                </select>
              </div>
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
            </div>

            <hr class="divider" />

            <div class="form-row">
              <div class="form-section" style="margin-bottom:0">
                <label class="form-label">Work setup</label>
                <select class="form-select" v-model="form.work_setup">
                  <option value="">Select setup</option>
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div class="form-section" style="margin-bottom:0">
                <label class="form-label">Schedule</label>
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
              <label class="form-label">Number of slots</label>
              <input class="form-input" type="number" v-model="form.slots" placeholder="e.g., 2" style="width:100px" />
            </div>

            <hr class="divider" />

            <div class="form-section">
              <label class="form-label">Job description</label>
              <textarea class="form-textarea" v-model="form.description" rows="6" placeholder="Describe the role, responsibilities, and who should apply."></textarea>
            </div>

            <div class="form-section">
              <label class="form-label">Required skills <span>(used for AI matching)</span></label>
              
              <!-- Suggested skills based on industry -->
              <div v-if="suggestedSkills.length" class="suggested-skills">
                <label class="form-label" style="font-size:0.7rem; color:var(--gc-green-mid)">Suggested skills for {{ form.industry }}:</label>
                <div class="skill-chips suggested">
                  <span v-for="skill in suggestedSkills" :key="skill" class="skill-chip suggested" @click="addSkill(skill)">
                    + {{ skill }}
                  </span>
                </div>
              </div>

              <!-- Selected skills -->
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
                  @keydown.enter.prevent="addCustomSkill"
                  @keydown.tab.prevent="addCustomSkill"
                  placeholder="+ Add custom skill" 
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

            <div class="skills-preview" v-if="skills.length">
              <div class="preview-label">Required skills</div>
              <div class="preview-skills">
                <span v-for="skill in skills.slice(0, 8)" :key="skill" class="preview-skill">{{ skill }}</span>
              </div>
            </div>

            <div class="ai-preview-box">
              <div class="ai-preview-label">AI match estimate</div>
              <div class="ai-preview-body">
                Based on your listed skills, approximately <strong style="color:var(--gc-green)">14 students</strong> on the platform have a match score above 70% for this role.
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
  industry: '',
  job_type: '',
  work_setup: '',
  schedule: '',
  slots: 1,
  description: '',
  status: 'active'
})

// Industry-specific skill suggestions
const industrySkills = {
  'Software Development': ['JavaScript', 'Python', 'Java', 'C++', 'Git', 'Agile', 'REST APIs', 'SQL', 'Data Structures', 'OOP'],
  'Web & Mobile Development': ['HTML/CSS', 'JavaScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Flutter', 'React Native', 'Tailwind', 'REST APIs'],
  'IT Services & Consulting': ['Network Security', 'System Administration', 'ITIL', 'Cloud Computing', 'Customer Support', 'Troubleshooting', 'Documentation'],
  'Artificial Intelligence': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science', 'NLP', 'Computer Vision', 'Pandas', 'NumPy'],
  'Cybersecurity': ['Network Security', 'Penetration Testing', 'Risk Assessment', 'Firewalls', 'Encryption', 'Security Audits', 'Compliance'],
  'Cloud Computing': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'DevOps'],
  'Data Analytics': ['SQL', 'Python', 'Tableau', 'Power BI', 'Excel', 'Data Visualization', 'Statistics', 'Pandas', 'ETL'],
  'Game Development': ['C#', 'Unity', 'Unreal Engine', 'C++', '3D Modeling', 'Animation', 'Game Design', 'Shader Programming']
}

const suggestedSkills = computed(() => {
  return industrySkills[form.value.industry] || []
})

const initials = computed(() => {
  if (companyName.value) return companyName.value.charAt(0).toUpperCase()
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const addSkill = (skill) => {
  if (skill && !skills.value.includes(skill)) {
    skills.value.push(skill)
  }
}

const addCustomSkill = () => {
  const skill = skillInput.value.trim()
  if (skill && !skills.value.includes(skill)) {
    skills.value.push(skill)
    skillInput.value = ''
  }
}

const removeSkill = (index) => {
  skills.value.splice(index, 1)
}

const onIndustryChange = () => {
  // Optional: Auto-add some suggested skills or just show them for manual addition
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
      await computeMatchesForJob(job.id)
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

.suggested-skills {
  margin-bottom: 0.75rem;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.skill-chips.suggested {
  margin-bottom: 0.5rem;
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

.skill-chip.suggested {
  background: #E8F0FF;
  color: #2D5FC4;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-chip.suggested:hover {
  background: #2D5FC4;
  color: #fff;
}

.skill-chip-x {
  font-size: 10px;
  cursor: pointer;
  color: var(--gc-green-mid);
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

.skills-preview {
  margin-bottom: 0.85rem;
  padding-top: 0.5rem;
  border-top: 0.5px solid #EAF3DE;
}

.preview-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.preview-skill {
  font-size: 0.65rem;
  background: var(--gc-green-light);
  color: var(--gc-green);
  padding: 2px 8px;
  border-radius: 20px;
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