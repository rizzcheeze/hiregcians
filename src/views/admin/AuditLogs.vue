<template>
  <div class="dash admin-audit-logs">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="admin-badge">Admin panel</div></div>
      <div class="s-user">
        <div class="s-avatar">{{ getInitials(authStore.profile?.first_name + ' ' + authStore.profile?.last_name) }}</div>
        <div>
          <div class="s-name">{{ authStore.profile?.first_name }} {{ authStore.profile?.last_name }}</div>
          <div class="s-role">System Administrator</div>
        </div>
      </div>
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
      <div class="main-header">
        <div>
          <div class="page-title">Audit Logs</div>
          <div class="page-sub">Security trail and administrative action history</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> System Live</div>
      </div>

      <div class="filters-bar">
        <select v-model="actionFilter" class="filter-select">
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
        </select>
        <select v-model="userFilter" class="filter-select">
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="employer">Employers</option>
          <option value="student">Students</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="Search..." class="search-input" />
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">Loading audit logs...</div>
        <div v-else-if="filteredLogs.length === 0" class="empty-state">
          <div class="empty-icon">🗒️</div>
          <div>No audit logs found</div>
        </div>
        <div v-else class="logs-table">
          <div class="table-header">
            <div>Timestamp</div>
            <div>User</div>
            <div>Action</div>
            <div>Resource</div>
            <div>Details</div>
            <div>IP Address</div>
          </div>
          <div v-for="log in filteredLogs" :key="log.id" class="table-row">
            <div>{{ formatDate(log.created_at) }}</div>
            <div><span class="user-badge" :class="log.user_role">{{ log.user_name }}</span></div>
            <div><span class="action-badge" :class="log.action">{{ log.action }}</span></div>
            <div>{{ log.resource }}</div>
            <div class="details">{{ log.details }}</div>
            <div>{{ log.ip_address || 'N/A' }}</div>
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
const sidebarOpen = ref(false)
const auditLogs = ref([])
const actionFilter = ref('all')
const userFilter = ref('all')
const searchQuery = ref('')

const filteredLogs = computed(() => {
  let result = auditLogs.value
  if (actionFilter.value !== 'all') result = result.filter(l => l.action === actionFilter.value)
  if (userFilter.value !== 'all') result = result.filter(l => l.user_role === userFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(l =>
      (l.user_name || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q)
    )
  }
  return result
})

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?'
const formatDate = (d) => d ? new Date(d).toLocaleString() : '—'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const fetchAuditLogs = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    auditLogs.value = data || []
  } catch (error) {
    console.error('Error fetching audit logs:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchAuditLogs() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select, .search-input { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.search-input { flex: 1; max-width: 300px; }
.table-container { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow-x: auto; }
.logs-table { width: 100%; min-width: 800px; }
.table-header { display: grid; grid-template-columns: 160px 150px 100px 150px 1fr 120px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 160px 150px 100px 150px 1fr 120px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.75rem; }
.table-row:hover { background: #FAFAF7; }
.user-badge, .action-badge { padding: 0.15rem 0.4rem; border-radius: 12px; font-size: 0.65rem; font-weight: 500; display: inline-block; }
.user-badge.admin { background: #FEF0F0; color: #B03030; }
.user-badge.employer { background: #FFF8E7; color: #B07D00; }
.user-badge.student { background: #EAF3DE; color: var(--gc-green); }
.action-badge.create { background: #EAF3DE; color: var(--gc-green); }
.action-badge.update { background: #E8F0FF; color: #2D5FC4; }
.action-badge.delete { background: #FEF0F0; color: #B03030; }
.action-badge.login { background: #EAF3DE; color: var(--gc-green); }
.details { font-size: 0.7rem; color: var(--gc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.loading-state, .empty-state { text-align: center; padding: 3rem; color: var(--gc-muted); font-size: 0.85rem; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
@media (max-width: 900px) {
  .table-header { display: none; }
  .table-row { grid-template-columns: 1fr; gap: 0.5rem; padding: 1rem; }
  .sidebar-toggle { display: flex !important; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; }
  .sidebar.open { transform: translateY(0); }
}
.sidebar-toggle { display: none; }
</style>