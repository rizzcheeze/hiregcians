<template>
  <div class="dash admin-settings">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="admin-badge">Admin panel</div></div>
      <div class="s-user"><div class="s-avatar">AD</div><div><div class="s-name">Admin User</div><div class="s-role">Gordon College oversight</div></div></div>
<ul class="s-nav">
  <li :class="{ active: $route.path === '/admin/dashboard' }" @click="$router.push('/admin/dashboard')">⬡ Overview</li>
  <li :class="{ active: $route.path === '/admin/users' }" @click="$router.push('/admin/users')">⬡ Users</li>
  <li :class="{ active: $route.path === '/admin/listings' }" @click="$router.push('/admin/listings')">⬡ All listings</li>
  <li :class="{ active: $route.path === '/admin/applications' }" @click="$router.push('/admin/applications')">⬡ Applications</li>
  <li :class="{ active: $route.path === '/admin/ai-logs' }" @click="$router.push('/admin/ai-logs')">⬡ AI match logs</li>
  <div class="s-nav-label">Management</div>
  <li :class="{ active: $route.path === '/admin/employers' }" @click="$router.push('/admin/employers')">⬡ Employers</li>
  <li :class="{ active: $route.path === '/admin/announcements' }" @click="$router.push('/admin/announcements')">⬡ Announcements</li>
  <li :class="{ active: $route.path === '/admin/reports' }" @click="$router.push('/admin/reports')">⬡ Reports</li>
  <div class="s-nav-label">System</div>
  <li :class="{ active: $route.path === '/admin/settings' }" @click="$router.push('/admin/settings')">⬡ Settings</li>
  <li :class="{ active: $route.path === '/admin/audit-logs' }" @click="$router.push('/admin/audit-logs')">⬡ Audit logs</li>
  <li @click="handleLogout">⬡ Logout</li>
</ul>
    </aside>

    <main class="main">
      <div class="main-header"><div><div class="page-title">Admin Settings</div><div class="page-sub">Platform configuration and system settings</div></div><button class="btn-primary" @click="saveSettings" :disabled="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button></div>
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="settings-layout">
        <div class="settings-section">
          <div class="card"><div class="card-header"><h3>Platform Settings</h3></div><div class="card-body">
            <div class="form-group"><label class="form-label">Platform Name</label><input type="text" class="form-input" v-model="settings.platform_name" /></div>
            <div class="form-group"><label class="form-label">Contact Email</label><input type="email" class="form-input" v-model="settings.contact_email" /></div>
            <div class="form-group"><label class="form-label">Maintenance Mode</label><label class="toggle-switch"><input type="checkbox" v-model="settings.maintenance_mode" /><span class="toggle-slider"></span></label></div>
          </div></div>
          <div class="card"><div class="card-header"><h3>AI Configuration</h3></div><div class="card-body">
            <div class="form-group"><label class="form-label">Enable AI Matching</label><label class="toggle-switch"><input type="checkbox" v-model="settings.ai_enabled" /><span class="toggle-slider"></span></label></div>
            <div class="form-group"><label class="form-label">Min Match Score Threshold</label><input type="range" v-model="settings.min_match_threshold" min="0" max="100" /><span>{{ settings.min_match_threshold }}%</span></div>
            <div class="form-group"><label class="form-label">Max Recommendations per User</label><input type="number" class="form-input" v-model="settings.max_recommendations" min="5" max="50" /></div>
          </div></div>
        </div>
        <div class="settings-section">
          <div class="card"><div class="card-header"><h3>Job Settings</h3></div><div class="card-body">
            <div class="form-group"><label class="form-label">Default Job Duration (days)</label><input type="number" class="form-input" v-model="settings.job_duration_days" min="7" max="90" /></div>
            <div class="form-group"><label class="form-label">Auto-close expired jobs</label><label class="toggle-switch"><input type="checkbox" v-model="settings.auto_close_jobs" /><span class="toggle-slider"></span></label></div>
          </div></div>
          <div class="card"><div class="card-header"><h3>Security Settings</h3></div><div class="card-body">
            <div class="form-group"><label class="form-label">Require Email Verification</label><label class="toggle-switch"><input type="checkbox" v-model="settings.require_email_verification" /><span class="toggle-slider"></span></label></div>
            <div class="form-group"><label class="form-label">Session Timeout (minutes)</label><input type="number" class="form-input" v-model="settings.session_timeout" min="15" max="480" /></div>
          </div></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const sidebarOpen = ref(false)
const errorMessage = ref('')

const settings = ref({
  platform_name: 'Hire GCians!',
  contact_email: 'admin@gordoncollege.edu.ph',
  maintenance_mode: false,
  ai_enabled: true,
  min_match_threshold: 40,
  max_recommendations: 10,
  job_duration_days: 30,
  auto_close_jobs: true,
  require_email_verification: false,
  session_timeout: 60
})

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const saveSettings = async () => {
  saving.value = true
  errorMessage.value = ''
  try {
    localStorage.setItem('admin_settings', JSON.stringify(settings.value))
    alert('Settings saved successfully!')
  } catch (error) { errorMessage.value = error.message } finally { saving.value = false }
}

const loadSettings = () => {
  const saved = localStorage.getItem('admin_settings')
  if (saved) settings.value = { ...settings.value, ...JSON.parse(saved) }
}

onMounted(() => { loadSettings() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.btn-primary { background: var(--gc-green); color: #fff; border: none; border-radius: 24px; padding: 0.5rem 1.25rem; cursor: pointer; }
.error-banner { background: #FEF0F0; color: #B03030; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
.settings-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.card { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow: hidden; margin-bottom: 1.5rem; }
.card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #EAF3DE; }
.card-header h3 { font-size: 0.9rem; margin: 0; }
.card-body { padding: 1.25rem; }
.form-group { margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.form-label { font-size: 0.8rem; font-weight: 500; flex: 1; }
.form-input { width: 200px; border: 1px solid #C0DD97; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.85rem; }
.toggle-switch { position: relative; display: inline-block; width: 50px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px; }
.toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; }
.toggle-switch input:checked + .toggle-slider { background-color: var(--gc-green); }
.toggle-switch input:checked + .toggle-slider:before { transform: translateX(26px); }
input[type="range"] { width: 150px; }
@media (max-width: 900px) { .settings-layout { grid-template-columns: 1fr; } .form-group { flex-direction: column; align-items: flex-start; gap: 0.5rem; } .form-input { width: 100%; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>