<template>
  <div class="dash employer-settings">
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
        <li @click="$router.push('/employer/applicants')">⬡ Applicants</li>
        <li @click="$router.push('/employer/jobs')">⬡ Active listings</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/employer/company')">⬡ Company profile</li>
        <li class="active">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Employer Settings</div>
          <div class="page-sub">Configure your account preferences and notification settings</div>
        </div>
        <button class="btn-primary" @click="saveSettings" :disabled="saving">{{ saving ? 'Saving...' : 'Save settings' }}</button>
      </div>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="settings-layout">
        <!-- Left Column - Account Settings -->
        <div class="settings-section">
          <div class="card">
            <div class="card-header">
              <h3>Account Information</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" class="form-input" v-model="accountForm.first_name" placeholder="First name" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-input" v-model="accountForm.last_name" placeholder="Last name" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" v-model="accountForm.email" disabled placeholder="Email cannot be changed" />
                <span class="field-hint">Email address cannot be changed</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Notification Preferences</h3>
            </div>
            <div class="card-body">
              <div class="toggle-group">
                <div class="toggle-item">
                  <div>
                    <div class="toggle-label">New application alerts</div>
                    <div class="toggle-hint">Receive email when a student applies to your job</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="notifications.newApplication" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="toggle-item">
                  <div>
                    <div class="toggle-label">Job posting updates</div>
                    <div class="toggle-hint">Receive updates about your job postings</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="notifications.jobUpdates" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Preferences & Danger Zone -->
        <div class="settings-section">
          <div class="card">
            <div class="card-header">
              <h3>Job Posting Defaults</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Default Job Type</label>
                <select class="form-select" v-model="defaults.job_type">
                  <option value="">Select default job type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Default Work Setup</label>
                <select class="form-select" v-model="defaults.work_setup">
                  <option value="">Select default work setup</option>
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Default Slots</label>
                <input type="number" class="form-input" v-model="defaults.slots" min="1" max="50" />
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Display Preferences</h3>
            </div>
            <div class="card-body">
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Show company logo in listings</div>
                  <div class="toggle-hint">Display your company logo next to job postings</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="preferences.showLogo" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Show contact information</div>
                  <div class="toggle-hint">Display company contact info to applicants</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="preferences.showContact" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="card danger-card">
            <div class="card-header">
              <h3>Danger Zone</h3>
            </div>
            <div class="card-body">
              <div class="danger-item">
                <div>
                  <div class="danger-label">Delete all job postings</div>
                  <div class="danger-hint">This will permanently delete all your job postings and applications</div>
                </div>
                <button class="danger-btn" @click="deleteAllJobs">Delete All Jobs</button>
              </div>
              <div class="danger-item">
                <div>
                  <div class="danger-label">Delete account</div>
                  <div class="danger-hint">Permanently delete your employer account and all associated data</div>
                </div>
                <button class="danger-btn delete-account" @click="deleteAccount">Delete Account</button>
              </div>
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
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const sidebarOpen = ref(false)
const errorMessage = ref('')
const companyName = ref('')
const firstName = ref('')
const lastName = ref('')
const userEmail = ref('')

const accountForm = ref({
  first_name: '',
  last_name: '',
  email: ''
})

const notifications = ref({
  newApplication: true,
  jobUpdates: true
})

const defaults = ref({
  job_type: '',
  work_setup: '',
  slots: 1
})

const preferences = ref({
  showLogo: true,
  showContact: false
})

const initials = computed(() => {
  if (companyName.value) return companyName.value.charAt(0).toUpperCase()
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const saveSettings = async () => {
  saving.value = true
  errorMessage.value = ''
  
  try {
    // Update profile first name and last name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: accountForm.value.first_name,
        last_name: accountForm.value.last_name
      })
      .eq('id', authStore.user.id)
    
    if (profileError) throw profileError
    
    // Save employer settings
    const settingsData = {
      notifications: notifications.value,
      defaults: defaults.value,
      preferences: preferences.value
    }
    
    const { error: settingsError } = await supabase
      .from('employer_profiles')
      .update({ settings: settingsData })
      .eq('user_id', authStore.user.id)
    
    if (settingsError && !settingsError.message.includes('column "settings" does not exist')) {
      console.warn('Settings column not found, saving to localStorage')
      localStorage.setItem('employer_settings', JSON.stringify(settingsData))
    }
    
    alert('Settings saved successfully!')
  } catch (error) {
    console.error('Error saving settings:', error)
    errorMessage.value = error.message || 'Failed to save settings'
    alert('Failed to save settings: ' + error.message)
  } finally {
    saving.value = false
  }
}

const deleteAllJobs = async () => {
  if (confirm('WARNING: This will permanently delete ALL your job postings and all applications. This action cannot be undone. Are you absolutely sure?')) {
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('employer_id', authStore.user.id)
      
      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map(j => j.id)
        
        await supabase.from('applications').delete().in('job_id', jobIds)
        await supabase.from('saved_jobs').delete().in('job_id', jobIds)
        
        const { error } = await supabase.from('jobs').delete().in('id', jobIds)
        if (error) throw error
      }
      
      alert('All job postings have been deleted')
      router.push('/employer/dashboard')
    } catch (error) {
      console.error('Error deleting jobs:', error)
      alert('Failed to delete jobs: ' + error.message)
    }
  }
}

const deleteAccount = async () => {
  if (confirm('WARNING: This will permanently delete your account and ALL associated data. This action cannot be undone. Are you absolutely sure?')) {
    if (confirm('Type "DELETE" to confirm account deletion:')) {
      const confirmation = prompt('Type "DELETE" to confirm account deletion:')
      if (confirmation === 'DELETE') {
        try {
          const { data: jobs } = await supabase
            .from('jobs')
            .select('id')
            .eq('employer_id', authStore.user.id)
          
          if (jobs && jobs.length > 0) {
            const jobIds = jobs.map(j => j.id)
            
            await supabase.from('applications').delete().in('job_id', jobIds)
            await supabase.from('saved_jobs').delete().in('job_id', jobIds)
            await supabase.from('jobs').delete().in('id', jobIds)
          }
          
          await supabase.from('employer_profiles').delete().eq('user_id', authStore.user.id)
          await supabase.from('profiles').delete().eq('id', authStore.user.id)
          await supabase.auth.signOut()
          
          alert('Account deleted successfully')
          router.push('/')
        } catch (error) {
          console.error('Error deleting account:', error)
          alert('Failed to delete account: ' + error.message)
        }
      } else {
        alert('Account deletion cancelled')
      }
    }
  }
}

const loadSettings = async () => {
  loading.value = true
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', authStore.user.id)
      .maybeSingle()
    
    if (profile) {
      accountForm.value.first_name = profile.first_name || ''
      accountForm.value.last_name = profile.last_name || ''
      firstName.value = profile.first_name || ''
      lastName.value = profile.last_name || ''
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      accountForm.value.email = user.email || ''
      userEmail.value = user.email || ''
    }
    
    const { data: employer } = await supabase
      .from('employer_profiles')
      .select('company_name, settings')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    if (employer) {
      companyName.value = employer.company_name || ''
      
      if (employer.settings) {
        const settings = employer.settings
        if (settings.notifications) notifications.value = { ...notifications.value, ...settings.notifications }
        if (settings.defaults) defaults.value = { ...defaults.value, ...settings.defaults }
        if (settings.preferences) preferences.value = { ...preferences.value, ...settings.preferences }
      } else {
        const saved = localStorage.getItem('employer_settings')
        if (saved) {
          const settings = JSON.parse(saved)
          if (settings.notifications) notifications.value = { ...notifications.value, ...settings.notifications }
          if (settings.defaults) defaults.value = { ...defaults.value, ...settings.defaults }
          if (settings.preferences) preferences.value = { ...preferences.value, ...settings.preferences }
        }
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSettings()
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

.btn-primary {
  background: var(--gc-green);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 0.5rem 1.25rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.error-banner {
  background: #FEF0F0;
  color: #B03030;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #F0C0C0;
}

.settings-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
}

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #C0DD97;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #EAF3DE;
}

.card-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gc-dark);
  margin-bottom: 0.4rem;
}

.form-input, .form-select {
  width: 100%;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus {
  border-color: var(--gc-green);
}

.form-input:disabled {
  background: #F7F5EE;
  cursor: not-allowed;
}

.field-hint {
  display: block;
  font-size: 0.65rem;
  color: var(--gc-muted);
  margin-top: 0.25rem;
}

/* Toggle Switch */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #EAF3DE;
}

.toggle-item:last-child {
  border-bottom: none;
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.2rem;
}

.toggle-hint {
  font-size: 0.7rem;
  color: var(--gc-muted);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--gc-green);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Danger Zone */
.danger-card {
  border-color: #F0C0C0;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #EAF3DE;
}

.danger-item:last-child {
  border-bottom: none;
}

.danger-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #B03030;
}

.danger-hint {
  font-size: 0.7rem;
  color: var(--gc-muted);
}

.danger-btn {
  padding: 0.4rem 0.8rem;
  background: #FEF0F0;
  border: 1px solid #B03030;
  color: #B03030;
  border-radius: 20px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover {
  background: #B03030;
  color: #fff;
}

.danger-btn.delete-account {
  background: #B03030;
  color: #fff;
}

.danger-btn.delete-account:hover {
  background: #8B2020;
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  
  .main-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .danger-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
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