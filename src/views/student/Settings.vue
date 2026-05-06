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
        <li @click="$router.push('/student/saved')">⬡ Saved</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/student/profile')">⬡ Edit profile</li>
        <li @click="$router.push('/student/resume')">⬡ Skills &amp; resume</li>
        <li class="active">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Settings</div>
          <div class="page-sub">Manage notifications, visibility, and work preferences.</div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-outline" @click="$router.push('/student/profile')">Edit profile</button>
          <button class="btn-sm" @click="saveSettings" :disabled="saving">{{ saving ? 'Saving...' : 'Save settings' }}</button>
        </div>
      </div>

      <div v-if="loading" class="text-center" style="padding: 2rem;">Loading your settings...</div>
      
      <div v-else>
        <div class="content">
          <div>
            <div class="card">
              <div class="card-title">Notifications</div>
              <label class="settings-row">
                <span>Email me for new matches</span>
                <input type="checkbox" v-model="settings.emailMatches" />
              </label>
              <label class="settings-row">
                <span>Email me for application updates</span>
                <input type="checkbox" v-model="settings.emailApplications" />
              </label>
              <label class="settings-row">
                <span>Show my public profile to employers</span>
                <input type="checkbox" v-model="settings.publicProfile" />
              </label>
            </div>

            <div class="card">
              <div class="card-title">Work preferences</div>
              <label class="form-label">Preferred work setup</label>
              <select v-model="settings.preferredWorkSetup" class="form-select">
                <option value="">Any</option>
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="flexible">Flexible</option>
              </select>
              
              <label class="form-label">Preferred job type</label>
              <select v-model="settings.preferredJobType" class="form-select">
                <option value="">Any</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="volunteer">Volunteer</option>
              </select>
              
              <label class="form-label">Availability</label>
              <select v-model="settings.availability" class="form-select">
                <option value="">Select availability</option>
                <option value="weekdays_morning">Weekdays - Morning (8AM - 12PM)</option>
                <option value="weekdays_afternoon">Weekdays - Afternoon (1PM - 5PM)</option>
                <option value="weekdays_evening">Weekdays - Evening (6PM - 9PM)</option>
                <option value="weekends_morning">Weekends - Morning (8AM - 12PM)</option>
                <option value="weekends_afternoon">Weekends - Afternoon (1PM - 5PM)</option>
                <option value="full_time">Full-time availability</option>
                <option value="flexible">Flexible schedule</option>
              </select>
            </div>
          </div>

          <div>
            <div class="ai-tip">
              <div class="ai-tip-label">Privacy note</div>
              <div class="ai-tip-body">
                Your settings help us match you with the right opportunities. 
                Your email is never shared with employers without your permission.
                You can control what's visible on your public profile at any time.
              </div>
            </div>

            <div class="card">
              <div class="card-title">Account</div>
              <label class="settings-row">
                <span>Delete my account</span>
                <button class="danger-btn" @click="confirmDelete">Delete account</button>
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const loading = ref(true)
const program = ref('')
const section = ref('')

// Default settings
const defaultSettings = {
  emailMatches: true,
  emailApplications: true,
  publicProfile: true,
  preferredWorkSetup: '',
  preferredJobType: '',
  availability: ''
}

const settings = ref({ ...defaultSettings })

const firstName = computed(() => authStore.profile?.first_name || 'Allyana')
const lastName = computed(() => authStore.profile?.last_name || 'Espiridion')
const initials = computed(() => (firstName.value.charAt(0) || 'A') + (lastName.value.charAt(0) || 'E'))

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const saveSettings = async () => {
  saving.value = true
  try {
    // Save to database using the settings JSONB column
    const { error } = await supabase
      .from('student_profiles')
      .update({ 
        settings: settings.value 
      })
      .eq('user_id', authStore.user.id)
    
    if (error) throw error
    
    alert('Settings saved successfully!')
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Failed to save settings: ' + error.message)
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  if (confirm('WARNING: This will permanently delete your account and all your data. This action cannot be undone. Are you absolutely sure?')) {
    deleteAccount()
  }
}

const deleteAccount = async () => {
  try {
    await supabase.auth.signOut()
    alert('Account deletion request submitted. Please contact support.')
    router.push('/login')
  } catch (error) {
    console.error('Error deleting account:', error)
    alert('Failed to delete account')
  }
}

const fetchSettings = async () => {
  loading.value = true
  try {
    const { data: profile, error } = await supabase
      .from('student_profiles')
      .select('program, section, settings')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    if (error) throw error
    
    if (profile) {
      program.value = profile.program || ''
      section.value = profile.section || ''
      
      // Merge saved settings with defaults
      if (profile.settings) {
        settings.value = { ...defaultSettings, ...profile.settings }
      } else {
        settings.value = { ...defaultSettings }
      }
    }
    
    console.log('Settings loaded from DB:', settings.value)
  } catch (error) {
    console.error('Error fetching settings:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})

// Refresh when navigating back to this page
onActivated(() => {
  fetchSettings()
})
</script>

<style scoped>
.text-center {
  text-align: center;
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

.btn-sm {
  background: var(--gc-green);
  color: #fff;
  padding: 0.35rem 1rem;
  border-radius: 20px;
  border: none;
  font-size: 0.78rem;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: var(--gc-green);
  border: 1px solid var(--gc-green);
  padding: 0.35rem 1rem;
  border-radius: 20px;
  font-size: 0.78rem;
  cursor: pointer;
}

.content {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1rem;
}

.card {
  background: #fff;
  border-radius: 10px;
  border: 0.5px solid #C0DD97;
  padding: 1rem 1.1rem;
  margin-bottom: 0.85rem;
}

.card-title {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--gc-dark);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: var(--gc-dark);
  padding: 0.55rem 0;
  border-bottom: 0.5px solid #EAF3DE;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--gc-green);
}

.form-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--gc-dark);
  margin-bottom: 0.4rem;
  display: block;
  margin-top: 0.5rem;
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

.form-select:focus {
  border-color: var(--gc-green);
}

.ai-tip {
  background: var(--gc-green-light);
  border-radius: 10px;
  padding: 0.85rem;
  margin-bottom: 0.85rem;
}

.ai-tip-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--gc-green);
  margin-bottom: 0.35rem;
}

.ai-tip-body {
  font-size: 0.75rem;
  color: var(--gc-muted);
  line-height: 1.6;
}

.danger-btn {
  background: transparent;
  color: #B03030;
  border: 1px solid #B03030;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.72rem;
  cursor: pointer;
}

.danger-btn:hover {
  background: #B03030;
  color: #fff;
}
</style>