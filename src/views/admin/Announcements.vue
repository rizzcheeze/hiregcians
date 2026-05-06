<template>
  <div class="dash admin-announcements">
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
          <div class="page-title">Announcements</div>
          <div class="page-sub">Create and manage platform announcements</div>
        </div>
        <button class="btn-primary" @click="showCreateModal = true">+ New Announcement</button>
      </div>

      <!-- Announcements List -->
      <div class="announcements-container">
        <div v-if="loading" class="loading-state">Loading announcements...</div>
        <div v-else-if="announcements.length === 0" class="empty-state">
          <div class="empty-icon">📢</div>
          <div class="empty-title">No announcements yet</div>
          <button class="btn-primary" @click="showCreateModal = true">Create your first announcement</button>
        </div>
        <div v-else>
          <div v-for="announcement in announcements" :key="announcement.id" class="announcement-card">
            <div class="announcement-header">
              <div>
                <div class="announcement-title">{{ announcement.title }}</div>
                <div class="announcement-meta">Posted by {{ announcement.author }} on {{ formatDate(announcement.created_at) }}</div>
              </div>
              <div class="announcement-actions">
                <button class="action-icon" @click="editAnnouncement(announcement)">✏️</button>
                <button class="action-icon delete" @click="deleteAnnouncement(announcement.id)">🗑️</button>
              </div>
            </div>
            <div class="announcement-content">{{ announcement.content }}</div>
            <div class="announcement-footer">
              <span class="audience-badge" :class="announcement.audience === 'all' ? 'audience-all' : announcement.audience === 'students' ? 'audience-students' : 'audience-employers'">
                {{ announcement.audience === 'all' ? 'All Users' : announcement.audience === 'students' ? 'Students Only' : 'Employers Only' }}
              </span>
              <span class="priority-badge" :class="announcement.priority === 'high' ? 'priority-high' : 'priority-normal'">
                {{ announcement.priority }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement' }}</h3>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input type="text" class="form-input" v-model="announcementForm.title" placeholder="Announcement title" />
            </div>
            <div class="form-group">
              <label class="form-label">Content</label>
              <textarea class="form-textarea" v-model="announcementForm.content" rows="5" placeholder="Announcement content..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Audience</label>
                <select class="form-select" v-model="announcementForm.audience">
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="employers">Employers Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-select" v-model="announcementForm.priority">
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" @click="closeModal">Cancel</button>
            <button class="btn-primary" @click="saveAnnouncement" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
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

const loading = ref(true)
const saving = ref(false)
const sidebarOpen = ref(false)
const announcements = ref([])
const showCreateModal = ref(false)
const editingAnnouncement = ref(null)

const announcementForm = ref({
  title: '',
  content: '',
  audience: 'all',
  priority: 'normal'
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const handleLogout = async () => { await authStore.logout(); router.push('/') }

const closeModal = () => {
  showCreateModal.value = false
  editingAnnouncement.value = null
  announcementForm.value = { title: '', content: '', audience: 'all', priority: 'normal' }
}

const editAnnouncement = (announcement) => {
  editingAnnouncement.value = announcement
  announcementForm.value = {
    title: announcement.title,
    content: announcement.content,
    audience: announcement.audience,
    priority: announcement.priority
  }
  showCreateModal.value = true
}

const saveAnnouncement = async () => {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    alert('Please fill in all fields')
    return
  }

  saving.value = true
  try {
    if (editingAnnouncement.value) {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: announcementForm.value.title,
          content: announcementForm.value.content,
          audience: announcementForm.value.audience,
          priority: announcementForm.value.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAnnouncement.value.id)
      if (error) throw error
      alert('Announcement updated')
    } else {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: announcementForm.value.title,
          content: announcementForm.value.content,
          audience: announcementForm.value.audience,
          priority: announcementForm.value.priority,
          author_id: authStore.user.id,
          author: `${authStore.profile?.first_name || 'Admin'} ${authStore.profile?.last_name || ''}`.trim()
        })
      if (error) throw error
      alert('Announcement created')
    }
    closeModal()
    fetchAnnouncements()
  } catch (error) {
    console.error('Error saving announcement:', error)
    alert('Failed to save announcement')
  } finally {
    saving.value = false
  }
}

const deleteAnnouncement = async (id) => {
  if (confirm('Delete this announcement? This cannot be undone.')) {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
      announcements.value = announcements.value.filter(a => a.id !== id)
      alert('Announcement deleted')
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Failed to delete announcement')
    }
  }
}

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    announcements.value = data || []
  } catch (error) {
    console.error('Error fetching announcements:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchAnnouncements() })
</script>

<style scoped>
.admin-badge { font-size: 0.65rem; background: rgba(192,221,151,0.15); color: #97C459; padding: 2px 8px; border-radius: 20px; margin-top: 0.35rem; display: inline-block; }
.s-role { font-size: 0.7rem; color: #97C459; opacity: 0.7; margin-top: 0.2rem; }
.btn-primary { background: var(--gc-green); color: #fff; border: none; border-radius: 24px; padding: 0.5rem 1.25rem; font-size: 0.85rem; cursor: pointer; }
.btn-outline { background: transparent; color: var(--gc-green); border: 1px solid var(--gc-green); border-radius: 24px; padding: 0.5rem 1.25rem; font-size: 0.85rem; cursor: pointer; }
.announcements-container { display: flex; flex-direction: column; gap: 1rem; }
.announcement-card { background: #fff; border: 1px solid #C0DD97; border-radius: 12px; padding: 1.25rem; }
.announcement-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.announcement-title { font-weight: 600; font-size: 1rem; }
.announcement-meta { font-size: 0.7rem; color: var(--gc-muted); margin-top: 0.2rem; }
.announcement-content { font-size: 0.85rem; color: var(--gc-muted); line-height: 1.5; margin-bottom: 0.75rem; }
.announcement-footer { display: flex; gap: 0.5rem; }
.audience-badge, .priority-badge { font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 20px; }
.audience-all { background: #EAF3DE; color: var(--gc-green); }
.audience-students { background: #E8F0FF; color: #2D5FC4; }
.audience-employers { background: #FFF8E7; color: #B07D00; }
.priority-high { background: #FEF0F0; color: #B03030; }
.priority-normal { background: #F1EFE8; color: var(--gc-muted); }
.action-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem; }
.action-icon.delete:hover { color: #B03030; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #EAF3DE; }
.modal-header h3 { margin: 0; }
.close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
.modal-body { padding: 1.25rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.25rem; border-top: 1px solid #EAF3DE; }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.75rem; font-weight: 500; margin-bottom: 0.3rem; }
.form-input, .form-select, .form-textarea { width: 100%; border: 1px solid #C0DD97; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.85rem; outline: none; }
.form-textarea { resize: vertical; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.loading-state, .empty-state { text-align: center; padding: 3rem; color: var(--gc-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-title { font-size: 1rem; margin-bottom: 0.5rem; }
@media (max-width: 900px) { .modal { max-width: 90%; } .form-row { grid-template-columns: 1fr; } .sidebar-toggle { display: flex; position: fixed; bottom: 1rem; right: 1rem; background: var(--gc-green); color: white; width: 50px; height: 50px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 101; font-size: 24px; } .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: auto; max-height: 80vh; transform: translateY(100%); transition: transform 0.3s ease; z-index: 100; } .sidebar.open { transform: translateY(0); } }
.sidebar-toggle { display: none; }
@media (min-width: 901px) { .sidebar-toggle { display: none; } }
</style>