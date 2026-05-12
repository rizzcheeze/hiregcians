<template>
  <div class="dash admin-users">
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
          <div class="page-title">Users</div>
          <div class="page-sub">Comprehensive directory of student, employer, and admin accounts</div>
        </div>
        <div class="live-badge"><div class="live-dot"></div> System Live</div>
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

      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="content-area">
        <!-- Table -->
        <div class="table-container">
          <div v-if="loading" class="loading-state">Loading users...</div>
          <div v-else class="users-table">
            <div class="table-header">
              <div>User</div>
              <div>Role</div>
              <div>Program / Company</div>
              <div>Joined</div>
              <div>Actions</div>
            </div>
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="table-row"
              :class="{ selected: selectedUser?.id === user.id }"
              @click="selectUser(user)"
            >
              <div class="user-info">
                <div class="user-avatar" :style="{ background: getAvatarColor(user.name) }">
                  <img v-if="user.avatar_url" :src="user.avatar_url" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
                  <span v-else>{{ getInitials(user.name) }}</span>
                </div>
                <div>
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email || 'No email on record' }}</div>
                </div>
              </div>
              <div><span class="role-badge" :class="'role-' + user.role">{{ user.role }}</span></div>
              <div>{{ user.programOrCompany }}</div>
              <div>{{ formatDate(user.created_at) }}</div>
              <div class="actions" @click.stop>
                <button class="action-btn" @click="deleteUser(user)">Delete</button>
              </div>
            </div>
            <div v-if="filteredUsers.length === 0" class="empty-state">No users found</div>
          </div>
        </div>

        <!-- Side Panel -->
        <transition name="panel">
          <div class="detail-panel" v-if="selectedUser">
            <div class="panel-header">
              <button class="close-btn" @click="selectedUser = null">✕</button>
              <div class="panel-avatar" :style="{ background: getAvatarColor(selectedUser.name) }">
                <img v-if="selectedUser.avatar_url" :src="selectedUser.avatar_url" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
                <span v-else>{{ getInitials(selectedUser.name) }}</span>
              </div>
              <div class="panel-name">{{ selectedUser.name }}</div>
              <span class="role-badge" :class="'role-' + selectedUser.role">{{ selectedUser.role }}</span>
              <div class="panel-joined">Joined {{ formatDate(selectedUser.created_at) }}</div>
            </div>

            <div class="panel-body">
              <div class="detail-row">
                <div class="detail-label">Email</div>
                <div class="detail-value">{{ selectedUser.email || '—' }}</div>
              </div>

              <!-- Student -->
              <template v-if="selectedUser.role === 'student'">
                <div class="detail-row">
                  <div class="detail-label">Program</div>
                  <div class="detail-value">{{ selectedUser.program || '—' }}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Year level</div>
                  <div class="detail-value">{{ selectedUser.section || '—' }}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">About</div>
                  <div class="detail-value muted">{{ selectedUser.about || 'No bio provided' }}</div>
                </div>
                <div class="detail-section-title">Skills</div>
                <div class="skills-list">
                  <span v-for="skill in selectedUser.skills" :key="skill" class="skill-badge">{{ skill }}</span>
                  <span v-if="!selectedUser.skills?.length" class="no-data">No skills listed</span>
                </div>
                <div class="detail-section-title">Experience</div>
                <div v-if="selectedUser.experience?.length">
                  <div v-for="(exp, i) in selectedUser.experience" :key="i" class="exp-item">
                    <div class="exp-title">{{ exp.title }}</div>
                    <div class="exp-org">{{ exp.organization }}{{ exp.year ? ' · ' + exp.year : '' }}</div>
                    <div class="exp-desc">{{ exp.description }}</div>
                  </div>
                </div>
                <div v-else class="no-data">No experience listed</div>
              </template>

              <!-- Employer -->
              <template v-if="selectedUser.role === 'employer'">
                <div class="detail-row">
                  <div class="detail-label">Company</div>
                  <div class="detail-value">{{ selectedUser.company_name || '—' }}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Industry</div>
                  <div class="detail-value">{{ selectedUser.industry || '—' }}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Location</div>
                  <div class="detail-value">{{ selectedUser.location || '—' }}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">About</div>
                  <div class="detail-value muted">{{ selectedUser.about || 'No description provided' }}</div>
                </div>
              </template>

              <!-- Admin -->
              <template v-if="selectedUser.role === 'admin'">
                <div class="detail-row">
                  <div class="detail-label">Access level</div>
                  <div class="detail-value">Full system access</div>
                </div>
              </template>

              <div class="panel-actions">
                <button class="action-btn delete" @click="deleteUser(selectedUser)">Delete user</button>
              </div>
            </div>
          </div>
        </transition>
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
const errorMessage = ref('')
const selectedUser = ref(null)

const filteredUsers = computed(() => {
  let result = users.value
  if (roleFilter.value !== 'all') result = result.filter(u => u.role === roleFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }
  return result
})

const getInitials = (name) => name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?'
const getAvatarColor = (name) => {
  const colors = ['#3B6D11', '#639922', '#97C459', '#5F5E5A']
  return colors[(name?.length || 0) % colors.length]
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const selectUser = (user) => {
  selectedUser.value = selectedUser.value?.id === user.id ? null : user
}

const deleteUser = async (user) => {
  if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
  try {
    if (user.role === 'student') await supabase.from('student_profiles').delete().eq('user_id', user.id)
    if (user.role === 'employer') await supabase.from('employer_profiles').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    if (selectedUser.value?.id === user.id) selectedUser.value = null
  } catch (err) {
    alert('Failed to delete user')
    console.error(err)
  }
}

const fetchUsers = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, email, role, created_at,
        student_profiles(program, section, about, skills, experience, avatar_url),
        employer_profiles(company_name, industry, location)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    users.value = (profiles || []).map(profile => {
      const sp = profile.student_profiles?.[0]
      const ep = profile.employer_profiles?.[0]
      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
        email: profile.email || '',
        role: profile.role,
        created_at: profile.created_at,
        programOrCompany: sp?.program || ep?.company_name || '—',
        avatar_url: sp?.avatar_url || null,
        // student
        program: sp?.program || '',
        section: sp?.section || '',
        about: sp?.about || '',
        skills: sp?.skills || [],
        experience: sp?.experience || [],
        // employer
        company_name: ep?.company_name || '',
        industry: ep?.industry || '',
        location: ep?.location || '',
      }
    })
  } catch (err) {
    console.error('Error fetching users:', err)
    users.value = []
    errorMessage.value = `Failed to load users: ${err.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchUsers() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.live-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; background: rgba(151,196,89,0.15); padding: 0.3rem 0.8rem; border-radius: 20px; color: #97C459; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #97C459; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.error-banner { background: #FEF0F0; color: #B03030; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.82rem; }
.filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select { padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; background: #fff; font-size: 0.8rem; }
.search-input { flex: 1; max-width: 300px; padding: 0.5rem 0.75rem; border: 1px solid #C0DD97; border-radius: 8px; font-size: 0.8rem; }

.content-area { display: flex; gap: 1rem; align-items: flex-start; }
.table-container { flex: 1; min-width: 0; background: #fff; border-radius: 12px; border: 1px solid #C0DD97; overflow: hidden; }
.users-table { width: 100%; }
.table-header { display: grid; grid-template-columns: 2fr 100px 1.5fr 130px 100px; background: #FAFAF7; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--gc-muted); border-bottom: 1px solid #C0DD97; }
.table-row { display: grid; grid-template-columns: 2fr 100px 1.5fr 130px 100px; padding: 0.75rem 1rem; border-bottom: 1px solid #EAF3DE; align-items: center; font-size: 0.8rem; cursor: pointer; transition: background 0.15s; }
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: #FAFAF7; }
.table-row.selected { background: var(--gc-green-light); border-left: 3px solid var(--gc-green); }
.user-info { display: flex; align-items: center; gap: 0.75rem; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; font-size: 0.8rem; flex-shrink: 0; overflow: hidden; }
.user-name { font-weight: 500; font-size: 0.85rem; }
.user-email { font-size: 0.65rem; color: var(--gc-muted); }
.role-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.65rem; font-weight: 500; display: inline-block; }
.role-student { background: #EAF3DE; color: var(--gc-green); }
.role-employer { background: #E8F0FF; color: #2D5FC4; }
.role-admin { background: #FEF0F0; color: #B03030; }
.actions { display: flex; gap: 0.5rem; }
.action-btn { background: none; border: 0.5px solid #F0C0C0; color: #B03030; border-radius: 20px; padding: 3px 10px; font-size: 0.7rem; cursor: pointer; }
.action-btn:hover { background: #FEF0F0; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--gc-muted); font-size: 0.85rem; }

/* Side Panel */
.detail-panel { width: 300px; flex-shrink: 0; background: #fff; border: 1px solid #C0DD97; border-radius: 12px; overflow: hidden; position: sticky; top: 1rem; }
.panel-header { background: var(--gc-green-light); padding: 1.25rem 1rem; text-align: center; position: relative; }
.close-btn { position: absolute; top: 0.6rem; right: 0.75rem; background: none; border: none; font-size: 1rem; color: var(--gc-muted); cursor: pointer; }
.close-btn:hover { color: var(--gc-dark); }
.panel-avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 500; font-size: 1.2rem; margin: 0 auto 0.5rem; overflow: hidden; }
.panel-name { font-weight: 500; font-size: 0.95rem; color: var(--gc-dark); margin-bottom: 0.35rem; }
.panel-joined { font-size: 0.65rem; color: var(--gc-muted); margin-top: 0.35rem; }
.panel-body { padding: 1rem; max-height: calc(100vh - 260px); overflow-y: auto; }
.detail-row { padding: 0.5rem 0; border-bottom: 0.5px solid #EAF3DE; }
.detail-row:last-of-type { border-bottom: none; }
.detail-label { font-size: 0.63rem; font-weight: 600; color: var(--gc-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
.detail-value { font-size: 0.82rem; color: var(--gc-dark); word-break: break-word; }
.detail-value.muted { color: var(--gc-muted); line-height: 1.5; }
.detail-section-title { font-size: 0.63rem; font-weight: 600; color: var(--gc-muted); text-transform: uppercase; letter-spacing: 0.04em; margin: 0.85rem 0 0.4rem; }
.skills-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }
.skill-badge { font-size: 0.68rem; padding: 3px 9px; background: var(--gc-green-light); color: var(--gc-green); border-radius: 20px; }
.no-data { font-size: 0.75rem; color: #B4B2A9; font-style: italic; }
.exp-item { padding: 0.5rem 0; border-bottom: 0.5px solid #EAF3DE; }
.exp-item:last-child { border-bottom: none; }
.exp-title { font-size: 0.82rem; font-weight: 500; color: var(--gc-dark); }
.exp-org { font-size: 0.7rem; color: #97C459; margin-top: 0.1rem; }
.exp-desc { font-size: 0.72rem; color: var(--gc-muted); margin-top: 0.2rem; line-height: 1.5; }
.panel-actions { margin-top: 1rem; padding-top: 0.75rem; border-top: 0.5px solid #EAF3DE; }
.action-btn.delete { width: 100%; text-align: center; padding: 0.45rem; border-radius: 8px; font-size: 0.75rem; }

.panel-enter-active, .panel-leave-active { transition: opacity 0.2s, transform 0.2s; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateX(12px); }

@media (max-width: 900px) {
  .content-area { flex-direction: column; }
  .detail-panel { width: 100%; position: static; }
  .table-header { display: none; }
  .table-row { grid-template-columns: 1fr; gap: 0.5rem; padding: 1rem; }
  .sidebar-toggle { display: flex !important; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; }
  .sidebar.open { transform: translateY(0); }
}
.sidebar-toggle { display: none; }
</style>