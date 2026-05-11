<template>
  <div class="dash">
    <aside class="sidebar">
      <div class="s-logo">Hire <span>GCians!</span></div>
      <div class="s-user">
        <!-- FIX #4: Show uploaded avatar in sidebar too if available -->
        <div class="s-avatar" :style="avatarUrl ? `background-image:url(${avatarUrl});background-size:cover;background-position:center;` : ''">
          <span v-if="!avatarUrl">{{ initials }}</span>
        </div>
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
          <!-- FIX #4: Avatar with click-to-upload, hover overlay, spinner, hidden file input -->
          <div class="avatar-big-wrap" @click="triggerAvatarInput">
            <div
              class="avatar-big"
              :style="avatarUrl ? `background-image:url(${avatarUrl});background-size:cover;background-position:center;color:transparent;` : ''"
            >{{ avatarUrl ? '' : initials }}</div>
            <div class="avatar-overlay">
              <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div v-if="avatarUploading" class="avatar-spinner">
              <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10"/>
              </svg>
            </div>
          </div>
          <!-- Hidden file input -->
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display:none"
            @change="handleAvatarChange"
          />

          <div class="ph-info">
            <h2>{{ firstName }} {{ lastName }}</h2>
            <p>{{ form.program }} {{ form.section }} · Gordon College, Olongapo City</p>
            <div v-if="avatarError" style="font-size:0.72rem;color:#B03030;margin-top:0.3rem">{{ avatarError }}</div>
            <div v-if="avatarSuccess" style="font-size:0.72rem;color:var(--gc-green);margin-top:0.3rem">Profile picture updated!</div>
            <div class="ph-tags">
              <span class="ph-tag" v-for="skill in skills.slice(0, 5)" :key="skill">{{ skill }}</span>
              <span v-if="skills.length === 0" class="ph-tag neutral">No skills uploaded yet</span>
            </div>
          </div>

          <div class="ph-actions">
            <!-- FIX #4: Button now triggers the same file input -->
            <button class="btn-outline" style="font-size:0.72rem" @click="triggerAvatarInput">
              {{ avatarUploading ? 'Uploading...' : 'Upload photo' }}
            </button>
          </div>
        </div>
      </div>

      <div class="content">
        <!-- Left Column — unchanged -->
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
              Experience &amp; involvement
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
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <button class="btn-sm" @click="saveExperience(index)">Save</button>
                  <button class="btn-outline" @click="cancelEditExperience(index)">Cancel</button>
                </div>
              </div>
              <div v-else>
                <div class="exp-title">{{ exp.title || 'Untitled' }}</div>
                <div class="exp-sub">{{ exp.organization || 'No organization' }} · {{ exp.year || 'No year' }}</div>
                <div class="exp-desc">{{ exp.description || 'No description' }}</div>
                <div style="text-align: right; margin-top: 0.5rem;">
                  <span class="edit-link" @click="editExperience(index)" style="margin-right: 0.75rem;">Edit</span>
                  <span class="edit-link" @click="removeExperience(index)" style="color: #B03030;">Remove</span>
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
              <div style="margin-top: 0.5rem; text-align: right;">
                <button class="btn-sm" @click="saveAbout">Save</button>
                <button class="btn-outline" style="margin-left: 0.5rem;" @click="editAbout = false">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column — unchanged -->
        <div>
          <div class="card">
            <div class="card-title">Profile completeness</div>
            <div class="comp-ring">
              <div class="comp-num">{{ completenessPercent }}%</div>
              <div class="comp-sub">Almost there!</div>
            </div>
            <div class="comp-bar-bg">
              <div class="comp-bar" :style="{ width: completenessPercent + '%' }"></div>
            </div>
            <div class="checklist-row">
              <span class="check-done">✓</span> Basic info added
            </div>
            <div class="checklist-row">
              <span :class="skills.length > 0 ? 'check-done' : 'check-todo'">○</span> Skills extracted from resume
            </div>
            <div class="checklist-row">
              <span :class="experiences.length > 0 ? 'check-done' : 'check-todo'">○</span> Experience added
            </div>
            <div class="checklist-row">
              <span :class="form.resume_url ? 'check-done' : 'check-todo'">○</span> Resume uploaded
            </div>
          </div>

          <div class="ai-tip">
            <div class="ai-tip-label">AI engine suggests</div>
            <div class="ai-tip-body">{{ aiSuggestion }}</div>
          </div>

          <div class="card">
            <div class="card-title">Program &amp; Section</div>
            <label class="form-label">Program</label>
            <select v-model="form.program" class="form-select">
              <option value="">Select program</option>
              <option value="BSCS">BSCS - Computer Science</option>
              <option value="BSIT">BSIT - Information Technology</option>
              <option value="BSIS">BSIS - Information Systems</option>
              <option value="Other">Other</option>
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

// FIX #4: Avatar state
const avatarUrl = ref('')
const avatarInputRef = ref(null)
const avatarUploading = ref(false)
const avatarError = ref('')
const avatarSuccess = ref(false)

const form = ref({
  program: '',
  section: '',
  about: '',
  resume_url: null
})

const firstName = computed(() => authStore.profile?.first_name || 'Allyana')
const lastName  = computed(() => authStore.profile?.last_name || 'Espiridion')
const initials  = computed(() => (firstName.value.charAt(0) || 'A') + (lastName.value.charAt(0) || 'E'))

const completenessPercent = computed(() => {
  let score = 0
  if (firstName.value && lastName.value) score += 15
  if (form.value.program) score += 15
  if (form.value.section) score += 15
  if (skills.value.length > 0) score += 20
  if (experiences.value.length > 0) score += 20
  if (form.value.about) score += 15
  return Math.min(score, 100)
})

const aiSuggestion = computed(() => {
  if (skills.value.length === 0) return 'Upload your resume to get AI-powered skill extraction. This will help employers find you based on your actual abilities.'
  if (experiences.value.length === 0) return "Add your experience and involvement to showcase what you've accomplished. Employers love seeing real-world projects!"
  if (completenessPercent.value < 70) return 'Your profile looks good! Add more details to increase your match scores with potential employers.'
  return "Your profile is complete! You're ready to get matched with great opportunities."
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// FIX #4: Avatar upload logic
const triggerAvatarInput = () => { avatarInputRef.value?.click() }

const handleAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  avatarError.value = ''
  avatarSuccess.value = false

  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = 'Image too large. Max 2MB.'
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    avatarError.value = 'Only JPG, PNG, or WebP allowed.'
    return
  }

  // Show a local preview immediately while uploading
  const localPreview = URL.createObjectURL(file)
  avatarUrl.value = localPreview
  avatarUploading.value = true

  try {
    const ext = file.name.split('.').pop()
    const filePath = `avatars/${authStore.user.id}/avatar.${ext}`

    // Upload to 'avatars' bucket — ensure this bucket exists in Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })
    if (uploadErr) throw uploadErr

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const finalUrl = publicUrl + '?t=' + Date.now() // cache-bust

    // Save URL to student_profiles
    const { error: updateErr } = await supabase
      .from('student_profiles')
      .update({ avatar_url: finalUrl })
      .eq('user_id', authStore.user.id)
    if (updateErr) throw updateErr

    avatarUrl.value = finalUrl
    avatarSuccess.value = true
  } catch (err) {
    avatarError.value = 'Upload failed: ' + err.message
    avatarUrl.value = '' // revert preview on failure
  } finally {
    avatarUploading.value = false
    // Reset input so same file can be re-selected if needed
    e.target.value = ''
  }
}

// All existing profile methods — unchanged
const saveProfile = async () => {
  saving.value = true
  try {
    const { error } = await supabase
      .from('student_profiles')
      .update({ program: form.value.program, section: form.value.section, about: form.value.about })
      .eq('user_id', authStore.user.id)
    if (error) throw error
    alert('Profile saved successfully!')
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Failed to save profile')
  } finally {
    saving.value = false
  }
}

const saveAbout = async () => { editAbout.value = false; await saveProfile() }

const addExperience = () => {
  experiences.value.push({ id: Date.now(), title: '', organization: '', year: new Date().getFullYear().toString(), description: '', editing: true })
}

const editExperience = (i) => { experiences.value[i].editing = true }

const cancelEditExperience = (i) => {
  const exp = experiences.value[i]
  if (!exp.title && !exp.organization && !exp.description) experiences.value.splice(i, 1)
  else exp.editing = false
}

const saveExperience = async (i) => {
  const exp = experiences.value[i]
  if (!exp.title || !exp.organization) { alert('Please enter at least a title and organization'); return }
  exp.editing = false
  await saveExperiences()
}

const removeExperience = (i) => {
  if (confirm('Remove this experience?')) { experiences.value.splice(i, 1); saveExperiences() }
}

const saveExperiences = async () => {
  try {
    const toSave = experiences.value.map(({ editing, id, ...rest }) => rest)
    const { error } = await supabase.from('student_profiles').update({ experience: toSave }).eq('user_id', authStore.user.id)
    if (error) throw error
  } catch (err) { console.error('Error saving experiences:', err) }
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', authStore.user.id)
      .maybeSingle()

    if (profile) {
      form.value.program = profile.program || ''
      form.value.section = profile.section || ''
      form.value.about   = profile.about || ''
      skills.value       = profile.skills || []
      // FIX #4: Load saved avatar_url
      if (profile.avatar_url) avatarUrl.value = profile.avatar_url
      experiences.value  = (profile.experience || []).map(exp => ({ ...exp, editing: false, id: Date.now() + Math.random() }))
    }

    const { data: resume } = await supabase
      .from('resumes').select('file_url')
      .eq('student_id', authStore.user.id).eq('is_active', true).maybeSingle()
    form.value.resume_url = resume?.file_url || null
  } catch (err) {
    console.error('Error fetching profile:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchProfile() })
</script>

<style scoped>
/* All original styles preserved — only avatar-related styles added below */
.page-title { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: var(--gc-dark); margin-bottom: 0.25rem; }
.page-sub { font-size: 0.82rem; color: var(--gc-muted); }
.btn-sm { background: var(--gc-green); color: #fff; padding: 0.35rem 1rem; border-radius: 20px; border: none; font-size: 0.78rem; cursor: pointer; }
.btn-outline { background: transparent; color: var(--gc-green); border: 1px solid var(--gc-green); padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.78rem; cursor: pointer; }
.profile-hero { background: #fff; border: 0.5px solid #C0DD97; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
.ph-inner { display: flex; gap: 1.25rem; align-items: flex-start; }

/* FIX #4: Avatar wrapper with hover overlay */
.avatar-big-wrap { position: relative; width: 72px; height: 72px; flex-shrink: 0; cursor: pointer; border-radius: 50%; overflow: hidden; }
.avatar-big {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--gc-green); color: #C0DD97;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Serif Display', serif; font-size: 1.6rem;
}
.avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.45);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.avatar-big-wrap:hover .avatar-overlay { opacity: 1; }
.avatar-spinner {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

.ph-info h2 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: var(--gc-dark); }
.ph-info p { font-size: 0.82rem; color: var(--gc-muted); margin-top: 0.2rem; }
.ph-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem; }
.ph-tag { font-size: 0.72rem; background: var(--gc-green-light); color: var(--gc-green); padding: 3px 10px; border-radius: 20px; }
.ph-tag.neutral { background: #F1EFE8; color: var(--gc-muted); }
.ph-actions { margin-left: auto; display: flex; gap: 0.5rem; align-items: flex-start; }
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
.comp-bar { background: var(--gc-green); border-radius: 4px; height: 8px; }
.checklist-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; padding: 0.25rem 0; color: var(--gc-muted); }
.check-done { color: var(--gc-green); font-size: 12px; }
.check-todo { color: #D3D1C7; font-size: 12px; }
.ai-tip { background: var(--gc-green-light); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.85rem; }
.ai-tip-label { font-size: 0.72rem; font-weight: 500; color: var(--gc-green); margin-bottom: 0.35rem; }
.ai-tip-body { font-size: 0.75rem; color: var(--gc-muted); line-height: 1.6; }
</style>