<template>
  <div class="dash employer-profile">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="emp-badge">Employer account</div></div>
      <div class="s-user">
        <div class="s-avatar">
          <img v-if="logoUrl" :src="logoUrl" class="s-avatar-img" />
          <span v-else>{{ initials }}</span>
        </div>
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
        <li class="active">⬡ Company profile</li>
        <li @click="$router.push('/employer/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Company Profile</div>
          <div class="page-sub">Manage how your organization appears to students</div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn-outline" @click="$router.push('/employer/public-company')">Open public page</button>
          <button class="btn-primary" @click="saveProfile" :disabled="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="profile-layout">
        <!-- Left Column - Company Info -->
        <div class="info-section">
          <div class="card">
            <div class="card-header">
              <h3>Company Information</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Company Name</label>
                <input type="text" class="form-input" v-model="form.company_name" placeholder="e.g., BrightPath Digital Solutions" />
              </div>
              <div class="form-group">
                <label class="form-label">Industry</label>
                <select class="form-select" v-model="form.industry">
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Website</label>
                <input type="url" class="form-input" v-model="form.website" placeholder="https://www.yourcompany.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Company Size</label>
                <select class="form-select" v-model="form.company_size">
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Location</label>
                <input type="text" class="form-input" v-model="form.location" placeholder="e.g., Olongapo City, Philippines" />
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Company Description</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <textarea class="form-textarea" v-model="form.description" rows="6" placeholder="Describe your company, mission, culture, and what you offer to students..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Stats & Preview -->
        <div class="preview-section">
          <div class="card">
            <div class="card-header">
              <h3>Company Preview</h3>
              <span class="badge">Visible to students</span>
            </div>
            <div class="preview-card">
              <!-- Logo with upload button -->
              <div class="logo-wrap">
                <div class="preview-avatar">
                  <img v-if="logoUrl" :src="logoUrl" class="logo-img" />
                  <span v-else>{{ getCompanyInitials() }}</span>
                </div>
                <button
                  class="logo-upload-btn"
                  @click="logoInput.click()"
                  :disabled="logoUploading"
                  :title="logoUploading ? 'Uploading...' : 'Upload company logo'"
                >
                  {{ logoUploading ? '⏳' : '📷' }}
                </button>
                <input
                  ref="logoInput"
                  type="file"
                  accept="image/*"
                  style="display:none"
                  @change="handleLogoUpload"
                />
              </div>
              <div v-if="logoStatus" class="logo-status" :class="{ error: logoError }">{{ logoStatus }}</div>
              <div class="preview-name">{{ form.company_name || 'Your Company Name' }}</div>
              <div class="preview-industry">{{ form.industry || 'Industry not specified' }}</div>
              <div class="preview-location">{{ form.location || 'Location not specified' }}</div>
              <div class="preview-website">
                <a v-if="form.website" :href="form.website" target="_blank">{{ truncateUrl(form.website) }}</a>
                <span v-else>No website provided</span>
              </div>
              <div class="preview-description">{{ form.description ? truncateText(form.description, 120) : 'No description provided yet.' }}</div>
            </div>
          </div>

          <div class="card stats-card">
            <div class="card-header">
              <h3>Company Stats</h3>
            </div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-value">{{ totalJobs }}</div>
                <div class="stat-label">Total Jobs Posted</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ activeJobs }}</div>
                <div class="stat-label">Active Jobs</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ totalApplicants }}</div>
                <div class="stat-label">Total Applicants</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ hiredCount }}</div>
                <div class="stat-label">Hired Students</div>
              </div>
            </div>
          </div>

          <div class="card tip-card">
            <div class="card-header">
              <h3>Profile Tip</h3>
            </div>
            <div class="tip-content">
              <div class="tip-icon">💡</div>
              <div class="tip-text">A complete company profile attracts more qualified applicants. Add your logo, industry, and a detailed description to stand out to students.</div>
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
const totalJobs = ref(0)
const activeJobs = ref(0)
const totalApplicants = ref(0)
const hiredCount = ref(0)
const companyName = ref('')
const firstName = ref('')

// Logo upload
const logoUrl       = ref(null)
const logoUploading = ref(false)
const logoStatus    = ref('')
const logoError     = ref(false)
const logoInput     = ref(null)

const form = ref({
  company_name: '',
  industry: '',
  website: '',
  company_size: '',
  location: '',
  description: ''
})

const initials = computed(() => {
  if (companyName.value) return companyName.value.charAt(0).toUpperCase()
  return firstName.value.charAt(0).toUpperCase() || 'E'
})

const getCompanyInitials = () => {
  if (form.value.company_name) {
    return form.value.company_name.charAt(0).toUpperCase()
  }
  return 'C'
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const truncateUrl = (url) => {
  if (!url) return ''
  return url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const handleLogoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    logoError.value  = true
    logoStatus.value = 'Please select an image file (JPG, PNG, etc.)'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    logoError.value  = true
    logoStatus.value = 'Image must be under 2MB'
    return
  }

  logoUploading.value = true
  logoStatus.value    = ''
  logoError.value     = false

  try {
    const ext  = file.name.split('.').pop()
    const path = `${authStore.user.id}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    logoUrl.value = urlData.publicUrl + '?t=' + Date.now()

    const { error: dbError } = await supabase
      .from('employer_profiles')
      .update({ logo_url: urlData.publicUrl })
      .eq('user_id', authStore.user.id)
    if (dbError) throw dbError

    logoStatus.value = 'Logo updated!'
    logoError.value  = false
    setTimeout(() => { logoStatus.value = '' }, 3000)
  } catch (err) {
    console.error('Logo upload failed:', err)
    logoError.value  = true
    logoStatus.value = 'Upload failed: ' + err.message
  } finally {
    logoUploading.value = false
    if (logoInput.value) logoInput.value.value = ''
  }
}

const saveProfile = async () => {
  saving.value = true
  errorMessage.value = ''
  
  try {
    const profileData = {
      company_name: form.value.company_name || null,
      industry: form.value.industry || null,
      website: form.value.website || null,
      company_size: form.value.company_size || null,
      location: form.value.location || null,
      description: form.value.description || null
    }
    
    console.log('Saving profile data:', profileData)
    console.log('User ID:', authStore.user.id)
    
    const { data: existing, error: checkError } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking existing profile:', checkError)
      errorMessage.value = 'Error checking existing profile: ' + checkError.message
      return
    }
    
    let result
    if (existing) {
      console.log('Updating existing profile')
      result = await supabase
        .from('employer_profiles')
        .update(profileData)
        .eq('user_id', authStore.user.id)
    } else {
      console.log('Creating new profile')
      result = await supabase
        .from('employer_profiles')
        .insert({
          user_id: authStore.user.id,
          ...profileData
        })
    }
    
    if (result.error) {
      console.error('Database error:', result.error)
      errorMessage.value = 'Database error: ' + result.error.message
      throw result.error
    }
    
    companyName.value = form.value.company_name
    alert('Company profile saved successfully!')
  } catch (error) {
    console.error('Error saving profile:', error)
    errorMessage.value = error.message || 'Failed to save profile'
    alert('Failed to save profile: ' + error.message)
  } finally {
    saving.value = false
  }
}

const fetchStats = async () => {
  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('employer_id', authStore.user.id)
    
    totalJobs.value = jobs?.length || 0
    activeJobs.value = jobs?.filter(j => j.status === 'active').length || 0
    
    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map(j => j.id)
      
      const { data: applications } = await supabase
        .from('applications')
        .select('status')
        .in('job_id', jobIds)
      
      totalApplicants.value = applications?.length || 0
      hiredCount.value = applications?.filter(a => a.status === 'hired').length || 0
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const { data: profile, error } = await supabase
      .from('employer_profiles')
      .select('company_name, industry, website, company_size, location, description, logo_url')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching profile:', error)
    }
    
    if (profile) {
      form.value.company_name = profile.company_name || ''
      form.value.industry     = profile.industry     || ''
      form.value.website      = profile.website      || ''
      form.value.company_size = profile.company_size || ''
      form.value.location     = profile.location     || ''
      form.value.description  = profile.description  || ''
      companyName.value       = profile.company_name || ''
      logoUrl.value           = profile.logo_url     || null
    }
    
    firstName.value = authStore.profile?.first_name || ''
    
    await fetchStats()
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

/* Sidebar avatar */
.s-avatar {
  overflow: hidden;
}
.s-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
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

/* Profile Layout */
.profile-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
}

/* Cards */
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

/* Form Elements */
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

.form-input, .form-select, .form-textarea {
  width: 100%;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--gc-green);
}

.form-textarea {
  resize: vertical;
}

/* Preview Card */
.preview-card {
  padding: 1.25rem;
  text-align: center;
}

.logo-wrap {
  position: relative;
  width: 80px;
  margin: 0 auto 0.5rem;
}

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--gc-green);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 500;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.logo-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--gc-green);
  border: 2px solid #fff;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: transform 0.15s;
}

.logo-upload-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.logo-upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logo-status {
  font-size: 0.72rem;
  color: var(--gc-green);
  margin-bottom: 0.5rem;
}

.logo-status.error {
  color: #B03030;
}

.preview-name {
  font-family: 'DM Serif Display', serif;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.preview-industry, .preview-location {
  font-size: 0.7rem;
  color: var(--gc-muted);
  margin-bottom: 0.1rem;
}

.preview-website {
  font-size: 0.7rem;
  margin: 0.5rem 0;
}

.preview-website a {
  color: var(--gc-green);
  text-decoration: none;
}

.preview-website a:hover {
  text-decoration: underline;
}

.preview-description {
  font-size: 0.75rem;
  color: var(--gc-muted);
  line-height: 1.5;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #EAF3DE;
}

/* Stats List */
.stats-list {
  padding: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #EAF3DE;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-value {
  font-family: 'DM Serif Display', serif;
  font-size: 1.3rem;
  color: var(--gc-green);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gc-muted);
}

/* Tip Card */
.tip-card {
  background: var(--gc-green-light);
  border-color: #C0DD97;
}

.tip-content {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
}

.tip-icon {
  font-size: 1.5rem;
}

.tip-text {
  font-size: 0.75rem;
  color: var(--gc-muted);
  line-height: 1.5;
  flex: 1;
}

.badge {
  background: var(--gc-green-light);
  color: var(--gc-green);
  font-size: 0.6rem;
  padding: 2px 8px;
  border-radius: 20px;
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
  
  .main-header {
    flex-direction: column;
    gap: 0.75rem;
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
