<template>
  <div class="dash admin-users">
    <div class="sidebar-toggle" @click="toggleSidebar">☰</div>
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="s-logo">Hire <span>GCians!</span><div class="admin-badge">Admin panel</div></div>
      <div class="s-user">
        <div class="s-avatar">AD</div>
        <div>
          <div class="s-name">Admin User</div>
          <div class="s-role">Gordon College oversight</div>
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
          <div class="page-title">Users</div>
          <div class="page-sub">Student, employer, and admin accounts in one directory</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> Live roster</div>
      </div>

      <div class="filters-bar">
        <select v-model="roleFilter" class="filter-select">
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="employer">Employers</option>
          <option value="admin">Admins</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="Search by name or email..." class="search-input" />
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">Loading users...</div>
        <div v-else class="users-table">
          <div class="table-header">
            <div>User</div>
            <div>Role</div>
            <div>Program / Company</div>
            <div>Joined</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div v-for="user in filteredUsers" :key="user.id" class="table-row">
            <div class="user-info">
              <div class="user-avatar" :style="{ background: getAvatarColor(user.name) }">{{ getInitials(user.name) }}</div>
              <div>
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
              </div>
            </div>
            <div><span class="role-badge" :class="user.role === 'student' ? 'role-student' : user.role === 'employer' ? 'role-employer' : 'role-admin'">{{ user.role }}</span></div>
            <div>{{ user.programOrCompany }}</div>
            <div>{{ formatDate(user.created_at) }}</div>
            <div><span class="status-badge" :class="user.is_active ? 'status-active' : 'status-inactive'">{{ user.is_active ? 'Active' : 'Inactive' }}</span></div>
            <div class="actions">
              <button class="action-icon" @click="viewUser(user)">👁️</button>
              <button class="action-icon" @click="toggleUserStatus(user)">{{ user.is_active ? '🔒' : '🔓' }}</button>
              <button class="action-icon delete" @click="deleteUser(user)">🗑️</button>
            </div>
          </div>
          <div v-if="filteredUsers.length === 0" class="empty-state">No users found</div>
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
const users = ref([])
const roleFilter = ref('all')
const searchQuery = ref('')

const filteredUsers = computed(() => {
  let result = users.value
  if (roleFilter.value !== 'all') result = result.filter(u => u.role === roleFilter.value)
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) }
  return result
})

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?'
const getAvatarColor = (name) => { const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']; return colors[(name?.length || 0) % colors.length] }
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }
const viewUser = (user) => { alert(`View user: ${user.name}\n\nDetailed view coming soon.`) }
const toggleUserStatus = async (user) => { if (confirm(`${user.is_active ? 'Deactivate' : 'Activate'} ${user.name}?`)) { try { await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id); user.is_active = !user.is_active; alert(`User ${user.is_active ? 'activated' : 'deactivated'}`) } catch (error) { alert('Failed to update status') } } }
const deleteUser = async (user) => { if (confirm(`Delete ${user.name}? This cannot be undone.`)) { try { if (user.role === 'student') await supabase.from('student_profiles').delete().eq('user_id', user.id); if (user.role === 'employer') await supabase.from('employer_profiles').delete().eq('user_id', user.id); await supabase.from('profiles').delete().eq('id', user.id); users.value = users.value.filter(u => u.id !== user.id); alert('User deleted') } catch (error) { alert('Failed to delete user') } } }

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const enrichedUsers = await Promise.all((profiles || []).map(async (profile) => {
      let programOrCompany = ''
      if (profile.role === 'student') { const { data: student } = await supabase.from('student_profiles').select('program').eq('user_id', profile.id).maybeSingle(); programOrCompany = student?.program || 'N/A' }
      else if (profile.role === 'employer') { const { data: employer } = await supabase.from('employer_profiles').select('company_name').eq('user_id', profile.id).maybeSingle(); programOrCompany = employer?.company_name || 'N/A' }
      return { id: profile.id, name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown', email: profile.email || '', role: profile.role, programOrCompany, created_at: profile.created_at, is_active: profile.is_active !== false }
    }))
    users.value = enrichedUsers
  } catch (error) { console.error('Error fetching users:', error) } finally { loading.value = false }
}

onMounted(() => { fetchUsers() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.search-input { flex: 1; max-width: 300px; padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; font-size: 0.8rem; }
.table-container { background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow: hidden; }
.users-table { width: 100%; }
.table-header { display: grid; grid-template-columns: 2fr 100px 1.5fr 120px 100px 100px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 2fr 100px 1.5fr 120px 100px 100px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.8rem; }
.table-row:hover { background: #FAFAF7; }
.user-info { display: flex; align-items: center; gap: 0.75rem; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; }
.user-name { font-weight: 500; }
.user-email { font-size: 0.65rem; color: var(--gc-muted); }
.role-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.65rem; font-weight: 500; display: inline-block; }
.role-student { background: #EAF3DE; color: var(--gc-green); }
.role-employer { background: #E8F0FF; color: #2D5FC4; }
.role-admin { background: #FEF0F0; color: #B03030; }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem; font-weight: 500; }
.status-active { background: #EAF3DE; color: var(--gc-green); }
.status-inactive { background: #F1EFE8; color: var(--gc-muted); }
.actions { display: flex; gap: 0.5rem; }
.action-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem; }
.action-icon.delete:hover { color: #B03030; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--gc-muted); }
@media (max-width: 900px) { .table-header, .table-row { grid-template-columns: 1fr; gap: 0.5rem; } .table-header { display: none; } .table-row { padding: 1rem; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>