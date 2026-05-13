<template>
  <div class="dash">
    <aside class="sidebar">
      <div class="s-logo">Hire <span>GCians!</span></div>
      <div class="s-user">
        <div class="s-avatar">{{ initials }}</div>
        <div>
          <div class="s-name">{{ firstName }} {{ lastName }}</div>
          <div class="s-prog">{{ form.program }} {{ form.section }}</div>
        </div>
      </div>
      <ul class="s-nav">
        <li @click="$router.push('/student/dashboard')">⬡ Dashboard</li>
        <li @click="$router.push('/student/jobs')">⬡ Browse jobs</li>
        <li @click="$router.push('/student/applications')">⬡ My applications</li>
        <li @click="$router.push('/student/saved')">⬡ Saved</li>
        <div class="s-nav-label">Account</div>
        <li class="active">⬡ Edit profile</li>
        <li @click="$router.push('/student/resume')">⬡ Skills &amp; resume</li>
        <li @click="$router.push('/student/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Edit Profile</div>
          <div class="page-sub">Your skills are generated from your uploaded PDF resume and used for job matching.</div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-outline" @click="$router.push('/student/resume')">Open resume analysis</button>
          <button class="btn-sm" @click="saveProfile" :disabled="saving">{{ saving ? 'Saving...' : 'Save changes' }}</button>
        </div>
      </div>

      <div class="profile-hero">
        <div class="ph-inner">
          <!-- Avatar with upload -->
          <div class="avatar-wrapper">
            <div class="avatar-big" :style="avatarUrl ? 'padding:0;overflow:hidden;' : ''">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Profile photo" style="width:100%;height:100%;object-fit:cover;" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="avatar-overlay" @click="triggerUpload">
              <span>{{ uploadingPhoto ? '...' : '📷' }}</span>
            </div>
            <input
              ref="photoInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="handlePhotoUpload"
            />
          </div>

          <div class="ph-info">
            <h2>{{ firstName }} {{ lastName }}</h2>
            <p>{{ form.program }} {{ form.section }} · Gordon College, Olongapo City</p>
            <div class="ph-tags">
              <span class="ph-tag" v-for="skill in skills.slice(0, 5)" :key="skill">{{ skill }}</span>
              <span v-if="skills.length === 0" class="ph-tag neutral">No skills uploaded yet</span>
            </div>
          </div>
        </div>
        <p v-if="photoError" class="error-msg">{{ photoError }}</p>
        <p v-if="photoSuccess" class="success-msg">{{ photoSuccess }}</p>
      </div>

      <div class="content">
        <!-- Left Column -->
        <div>
          <div class="card">
            <div class="card-title">
              AI-extracted skills
              <span class="edit-link">From resume PDF</span>
            </div>
            <div class="skills-grid">
              <span v-for="skill in skills" :key="skill" class="skill-chip">{{ skill }}</span>
              <span v-if="skills.length === 0" class="skill-chip neutral">No skills extracted yet</span>
            </div>
          </div>

          <div class="card">
            <div class="card-title">
              Experience & involvement
              <span class="edit-link" @click="addExperience">+ Add</span>
            </div>
            <div v-if="experiences.length === 0" class="exp-row" style="color: var(--gc-muted);">
              No experience added yet. Click + Add to add your experience.
            </div>
            <div v-for="(exp, index) in experiences" :key="exp.id || index" class="exp-row">
              <div v-if="exp.editing" class="exp-edit-form">
                <input v-model="exp.title" class="form-input" placeholder="Title (e.g., Web Dev Intern)" />
                <input v-model="exp.organization" class="form-input" placeholder="Organization" />
                <input v-model="exp.year" class="form-input" placeholder="Year (e.g., 2024)" />
                <textarea v-model="exp.description" class="form-textarea" rows="3" placeholder="Describe your role and achievements..."></textarea>
                <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                  <button class="btn-sm" @click="saveExperience(index)">Save</button>
                  <button class="btn-outline" @click="cancelEditExperience(index)">Cancel</button>
                </div>
              </div>
              <div v-else>
                <div class="exp-title">{{ exp.title || 'Untitled' }}</div>
                <div class="exp-sub">{{ exp.organization || 'No organization' }} · {{ exp.year || 'No year' }}</div>
                <div class="exp-desc">{{ exp.description || 'No description' }}</div>
                <div style="text-align:right;margin-top:0.5rem;">
                  <span class="edit-link" @click="editExperience(index)" style="margin-right:0.75rem;">Edit</span>
                  <span class="edit-link" @click="removeExperience(index)" style="color:#B03030;">Remove</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">
              About me
              <span class="edit-link" @click="editAbout = !editAbout">Edit</span>
            </div>
            <div v-if="!editAbout" class="exp-desc" style="font-size:0.82rem;">
              {{ form.about || 'No bio added yet. Click Edit to tell employers about yourself.' }}
            </div>
            <div v-else>
              <textarea v-model="form.about" class="form-textarea" rows="4" placeholder="Tell employers about yourself, your goals, and what you're looking for..."></textarea>
              <div style="margin-top:0.5rem;text-align:right;">
                <button class="btn-sm" @click="saveAbout">Save</button>
                <button class="btn-outline" style="margin-left:0.5rem;" @click="editAbout = false">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div>
          <div class="card">
            <div class="card-title">Profile completeness</div>
            <div class="comp-ring">
              <div class="comp-num">{{ completenessPercent }}%</div>
              <div class="comp-sub">{{ completenessPercent === 100 ? 'Complete!' : 'Almost there!' }}</div>
            </div>
            <div class="comp-bar-bg">
              <div class="comp-bar" :style="{ width: completenessPercent + '%' }"></div>
            </div>
            <div class="checklist-row">
              <span :class="firstName && lastName ? 'check-done' : 'check-todo'">{{ firstName && lastName ? '✓' : '○' }}</span> Basic info added
            </div>
            <div class="checklist-row">
              <span :class="avatarUrl ? 'check-done' : 'check-todo'">{{ avatarUrl ? '✓' : '○' }}</span> Profile photo uploaded
            </div>
            <div class="checklist-row">
              <span :class="form.program && form.section ? 'check-done' : 'check-todo'">{{ form.program && form.section ? '✓' : '○' }}</span> Program & year level set
            </div>
            <div class="checklist-row">
              <span :class="skills.length > 0 ? 'check-done' : 'check-todo'">{{ skills.length > 0 ? '✓' : '○' }}</span> Skills extracted from resume
            </div>
            <div class="checklist-row">
              <span :class="experiences.length > 0 ? 'check-done' : 'check-todo'">{{ experiences.length > 0 ? '✓' : '○' }}</span> Experience added
            </div>
            <div class="checklist-row">
              <span :class="form.about ? 'check-done' : 'check-todo'">{{ form.about ? '✓' : '○' }}</span> About me filled in
            </div>
            <div class="checklist-row">
              <span :class="form.resume_url ? 'check-done' : 'check-todo'">{{ form.resume_url ? '✓' : '○' }}</span> Resume uploaded
            </div>
          </div>

          <div class="ai-tip">
            <div class="ai-tip-label">AI engine suggests</div>
            <div class="ai-tip-body">{{ aiSuggestion }}</div>
          </div>

          <div class="card">
            <div class="card-title">Program & Section</div>
            <label class="form-label">Program</label>
            <select v-model="form.program" class="form-select">
              <option value="">Select program</option>
              <option value="BSCS">BSCS - Computer Science</option>
              <option value="BSIT">BSIT - Information Technology</option>
              <option value="BSEMC">BSEMC - Entertainment and Multimedia Computing</option>
            </select>
            <label class="form-label">Section / Year Level</label>
            <select v-model="form.section" class="form-select">
              <option value="">Select section</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
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
const saving = ref(false)
const editAbout = ref(false)
const skills = ref([])
const experiences = ref([])
const avatarUrl = ref(null)
const uploadingPhoto = ref(false)
const photoError = ref('')
const photoSuccess = ref('')
const photoInput = ref(null)

const form = ref({
  program: '',
  section: '',
  about: '',
  resume_url: null
})

const firstName = computed(() => authStore.profile?.first_name || '')
const lastName = computed(() => authStore.profile?.last_name || '')
const initials = computed(() => (firstName.value.charAt(0) || '') + (lastName.value.charAt(0) || ''))

const completenessPercent = computed(() => {
  const checks = [
    !!(firstName.value && lastName.value),
    !!avatarUrl.value,
    !!(form.value.program && form.value.section),
    skills.value.length > 0,
    experiences.value.length > 0,
    !!form.value.about,
    !!form.value.resume_url,
  ]
  const score = checks.filter(Boolean).length
  return Math.round((score / checks.length) * 100)
})

const aiSuggestion = computed(() => {
  if (!form.value.resume_url) return 'Upload your resume to get AI-powered skill extraction. This will help employers find you based on your actual abilities.'
  if (skills.value.length === 0) return 'Your resume is uploaded but skills haven\'t been extracted yet. Go to Skills & Resume to run the AI analysis.'
  if (!avatarUrl.value) return 'Add a profile photo so employers can put a face to your application.'
  if (experiences.value.length === 0) return "Add your experience and involvement to showcase what you've accomplished. Employers love seeing real-world projects!"
  if (!form.value.about) return 'Fill in your About Me section to tell employers about yourself and your goals.'
  if (completenessPercent.value < 100) return 'Your profile looks great! Fill in the remaining details to reach 100%.'
  return "Your profile is complete! You're ready to get matched with great opportunities."
})

const triggerUpload = () => {
  if (!uploadingPhoto.value) photoInput.value?.click()
}

const handlePhotoUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  photoError.value = ''
  photoSuccess.value = ''

  if (!file.type.startsWith('image/')) {
    photoError.value = 'Please select an image file.'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'Image must be under 2MB.'
    return
  }

  uploadingPhoto.value = true
  try {
    const ext = file.name.split('.').pop()
    const path = authStore.user.id + '/avatar.' + ext

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = data.publicUrl + '?t=' + Date.now()

    const { error: dbError } = await supabase
      .from('student_profiles')
      .upsert({ user_id: authStore.user.id, avatar_url: data.publicUrl })

    if (dbError) throw dbError

    avatarUrl.value = publicUrl
    photoSuccess.value = 'Photo updated successfully!'
  } catch (err) {
    console.error('Photo upload error:', err)
    photoError.value = 'Failed to upload photo. Please try again.'
  } finally {
    uploadingPhoto.value = false
    event.target.value = ''
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const saveProfile = async () => {
  saving.value = true
  try {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        user_id: authStore.user.id,
        program: form.value.program,
        section: form.value.section,
        about: form.value.about
      })
    if (error) throw error
    alert('Profile saved successfully!')
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Failed to save profile')
  } finally {
    saving.value = false
  }
}

const saveAbout = async () => {
  editAbout.value = false
  await saveProfile()
}

const addExperience = () => {
  experiences.value.push({
    id: Date.now(),
    title: '',
    organization: '',
    year: new Date().getFullYear().toString(),
    description: '',
    editing: true
  })
}

const editExperience = (index) => {
  experiences.value[index].editing = true
}

const cancelEditExperience = (index) => {
  const exp = experiences.value[index]
  if (!exp.title && !exp.organization && !exp.description) {
    experiences.value.splice(index, 1)
  } else {
    exp.editing = false
  }
}

const saveExperience = async (index) => {
  const exp = experiences.value[index]
  if (!exp.title || !exp.organization) {
    alert('Please enter at least a title and organization')
    return
  }
  exp.editing = false
  await saveExperiences()
}

const removeExperience = (index) => {
  if (confirm('Remove this experience?')) {
    experiences.value.splice(index, 1)
    saveExperiences()
  }
}

const saveExperiences = async () => {
  try {
    const experiencesToSave = experiences.value.map(({ editing, id, ...rest }) => rest)
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        user_id: authStore.user.id,
        experience: experiencesToSave
      })
    if (error) throw error
  } catch (error) {
    console.error('Error saving experiences:', error)
  }
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', authStore.user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (profile) {
      form.value.program = profile.program || ''
      form.value.section = profile.section || ''
      form.value.about = profile.about || ''
      skills.value = profile.skills || []
      avatarUrl.value = profile.avatar_url || null
      experiences.value = (profile.experience || []).map(exp => ({
        ...exp,
        editing: false,
        id: Date.now() + Math.random()
      }))
    }

    const { data: resume } = await supabase
      .from('resumes')
      .select('file_url')
      .eq('student_id', authStore.user.id)
      .eq('is_active', true)
      .maybeSingle()

    form.value.resume_url = resume?.file_url || null
  } catch (error) {
    console.error('Error fetching profile:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.page-title { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: var(--gc-dark); margin-bottom: 0.25rem; }
.page-sub { font-size: 0.82rem; color: var(--gc-muted); }
.btn-sm { background: var(--gc-green); color: #fff; padding: 0.35rem 1rem; border-radius: 20px; border: none; font-size: 0.78rem; cursor: pointer; }
.btn-outline { background: transparent; color: var(--gc-green); border: 1px solid var(--gc-green); padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.78rem; cursor: pointer; }

.profile-hero { background: #fff; border: 0.5px solid #C0DD97; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
.ph-inner { display: flex; gap: 1.25rem; align-items: flex-start; }

.avatar-wrapper { position: relative; width: 72px; height: 72px; flex-shrink: 0; cursor: pointer; }
.avatar-big { width: 72px; height: 72px; border-radius: 50%; background: var(--gc-green); color: #C0DD97; display: flex; align-items: center; justify-content: center; font-family: 'DM Serif Display', serif; font-size: 1.6rem; }
.avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; font-size: 1.2rem; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }

.ph-info h2 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: var(--gc-dark); }
.ph-info p { font-size: 0.82rem; color: var(--gc-muted); margin-top: 0.2rem; }
.ph-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem; }
.ph-tag { font-size: 0.72rem; background: var(--gc-green-light); color: var(--gc-green); padding: 3px 10px; border-radius: 20px; }
.ph-tag.neutral { background: #F1EFE8; color: var(--gc-muted); }

.error-msg { font-size: 0.75rem; color: #B03030; margin-top: 0.5rem; }
.success-msg { font-size: 0.75rem; color: var(--gc-green); margin-top: 0.5rem; }

.content { display: grid; grid-template-columns: 1fr 280px; gap: 1rem; }
.card { background: #fff; border-radius: 10px; border: 0.5px solid #C0DD97; padding: 1rem 1.1rem; margin-bottom: 0.85rem; }
.card-title { font-size: 0.78rem; font-weight: 500; color: var(--gc-dark); margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
.edit-link { font-size: 0.7rem; color: var(--gc-green-mid); cursor: pointer; }
.skills-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.skill-chip { font-size: 0.75rem; background: var(--gc-green-light); color: var(--gc-green); padding: 4px 12px; border-radius: 20px; }
.skill-chip.neutral { background: #F1EFE8; color: var(--gc-muted); }

.form-label { font-size: 0.78rem; font-weight: 500; color: var(--gc-dark); margin-bottom: 0.4rem; display: block; }
.form-select { width: 100%; border: 0.5px solid #C0DD97; border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-family: 'DM Sans', sans-serif; color: var(--gc-dark); background: #fff; outline: none; margin-bottom: 1rem; }
.form-textarea { width: 100%; border: 0.5px solid #C0DD97; border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-family: 'DM Sans', sans-serif; color: var(--gc-dark); background: #fff; outline: none; resize: vertical; }
.form-input { width: 100%; border: 0.5px solid #C0DD97; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; font-family: 'DM Sans', sans-serif; color: var(--gc-dark); background: #fff; outline: none; }
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--gc-green); }

.exp-row { padding: 0.6rem 0; border-bottom: 0.5px solid #EAF3DE; }
.exp-row:last-child { border-bottom: none; }
.exp-edit-form { display: flex; flex-direction: column; gap: 0.5rem; }
.exp-title { font-size: 0.85rem; font-weight: 500; color: var(--gc-dark); }
.exp-sub { font-size: 0.75rem; color: var(--gc-muted); margin-top: 0.15rem; }
.exp-desc { font-size: 0.75rem; color: var(--gc-muted); line-height: 1.6; margin-top: 0.3rem; }

.comp-ring { text-align: center; padding: 0.5rem 0 0.75rem; }
.comp-num { font-family: 'DM Serif Display', serif; font-size: 2rem; color: var(--gc-green); }
.comp-sub { font-size: 0.72rem; color: var(--gc-muted); }
.comp-bar-bg { background: #EAF3DE; border-radius: 4px; height: 8px; margin: 0.5rem 0; }
.comp-bar { background: var(--gc-green); border-radius: 4px; height: 8px; transition: width 0.4s ease; }
.checklist-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; padding: 0.25rem 0; color: var(--gc-muted); }
.check-done { color: var(--gc-green); font-size: 12px; }
.check-todo { color: #D3D1C7; font-size: 12px; }

.ai-tip { background: var(--gc-green-light); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.85rem; }
.ai-tip-label { font-size: 0.72rem; font-weight: 500; color: var(--gc-green); margin-bottom: 0.35rem; }
.ai-tip-body { font-size: 0.75rem; color: var(--gc-muted); line-height: 1.6; }

.badge { background: var(--gc-green); color: #fff; font-size: 0.62rem; padding: 1px 6px; border-radius: 10px; margin-left: auto; }

@media (max-width: 900px) {
  .content { grid-template-columns: 1fr; }
  .ph-inner { flex-wrap: wrap; }
}
</style>