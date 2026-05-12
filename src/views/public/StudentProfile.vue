<template>
  <main class="public-page">
    <div class="public-shell">
      <div class="topbar">
        <div class="brand" @click="$router.push('/')">Hire <span>GCians!</span></div>
        <button v-if="isOwnProfile" class="btn-outline" @click="$router.push('/student/profile')">Edit profile</button>
      </div>

      <div v-if="loading" class="state-card">Loading profile...</div>
      <div v-else-if="errorMessage" class="state-card error">{{ errorMessage }}</div>

      <template v-else>
        <section class="profile-hero">
          <div class="avatar">{{ initials }}</div>
          <div class="hero-main">
            <div class="eyebrow">Student profile</div>
            <h1>{{ fullName }}</h1>
            <p>{{ profile.program || 'Gordon College student' }} {{ profile.section ? `· ${profile.section}` : '' }}</p>
            <div class="skill-row">
              <span v-for="skill in profile.skills.slice(0, 8)" :key="skill" class="skill-pill">{{ skill }}</span>
              <span v-if="!profile.skills.length" class="muted-pill">No skills listed yet</span>
            </div>
          </div>
        </section>

        <section class="content-grid">
          <div>
            <div class="panel">
              <div class="panel-title">About</div>
              <p class="body-copy">{{ profile.about || profile.ai_summary || 'No public bio has been added yet.' }}</p>
            </div>

            <div class="panel">
              <div class="panel-title">Experience</div>
              <div v-if="profile.experience.length" class="timeline">
                <div v-for="(item, index) in profile.experience" :key="index" class="timeline-item">
                  <div class="item-title">{{ item.title || 'Experience' }}</div>
                  <div class="item-sub">{{ [item.organization, item.year].filter(Boolean).join(' · ') || 'Gordon College' }}</div>
                  <p>{{ item.description || 'No description provided.' }}</p>
                </div>
              </div>
              <div v-else class="empty-line">No experience added yet.</div>
            </div>
          </div>

          <aside>
            <div class="panel">
              <div class="panel-title">Skills</div>
              <div class="compact-skills">
                <span v-for="skill in profile.skills" :key="skill" class="skill-pill">{{ skill }}</span>
                <span v-if="!profile.skills.length" class="empty-line">No skills listed yet.</span>
              </div>
            </div>

            <div class="note-panel">
              <div class="panel-title">Recruiter note</div>
              <p>{{ profile.recruiter_tip || 'This student has not published an AI recruiter note yet.' }}</p>
            </div>
          </aside>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/api/supabase'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(true)
const errorMessage = ref('')
const profile = ref({
  first_name: '',
  last_name: '',
  program: '',
  section: '',
  about: '',
  skills: [],
  experience: [],
  ai_summary: '',
  recruiter_tip: '',
})

const profileId = computed(() => route.params.id || authStore.user?.id || '')
const isOwnProfile = computed(() => authStore.user?.id && authStore.user.id === profileId.value)
const fullName = computed(() => `${profile.value.first_name} ${profile.value.last_name}`.trim() || 'Student')
const initials = computed(() => {
  const first = profile.value.first_name?.charAt(0) || 'S'
  const last = profile.value.last_name?.charAt(0) || ''
  return `${first}${last}`.toUpperCase()
})

const loadProfile = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    if (!profileId.value) throw new Error('Profile not found')
    const { data, error } = await supabase.functions.invoke('public-profile', {
      body: { type: 'student', id: profileId.value },
    })
    if (error || data?.success === false) throw new Error(data?.error || error?.message || 'Profile not found')
    profile.value = {
      ...profile.value,
      ...data.profile,
      skills: data.profile.skills || [],
      experience: data.profile.experience || [],
    }
  } catch (error) {
    errorMessage.value = error.message || 'Profile not found'
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped>
.public-page {
  min-height: 100vh;
  background: #F7F5EE;
  color: var(--gc-dark);
}

.public-shell {
  width: min(1040px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.25rem 0 3rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.brand {
  font-family: 'DM Serif Display', serif;
  color: var(--gc-green);
  font-size: 1.1rem;
  cursor: pointer;
}

.brand span {
  color: var(--gc-green-mid);
}

.profile-hero {
  min-height: 260px;
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--gc-green);
  color: #C0DD97;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Serif Display', serif;
  font-size: 2.2rem;
  flex: 0 0 auto;
}

.eyebrow {
  color: var(--gc-green);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.4rem;
}

h1 {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.hero-main p,
.body-copy,
.timeline-item p,
.note-panel p {
  color: var(--gc-muted);
  line-height: 1.7;
}

.skill-row,
.compact-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 1rem;
}

.skill-pill,
.muted-pill {
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  font-size: 0.74rem;
}

.skill-pill {
  background: var(--gc-green-light);
  color: var(--gc-green);
}

.muted-pill {
  background: #F1EFE8;
  color: var(--gc-muted);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
  margin-top: 1rem;
}

.panel,
.note-panel,
.state-card {
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.note-panel {
  background: var(--gc-green-light);
}

.panel-title {
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.timeline-item {
  padding: 0.8rem 0;
  border-bottom: 1px solid #EAF3DE;
}

.timeline-item:last-child {
  border-bottom: 0;
}

.item-title {
  font-weight: 700;
}

.item-sub,
.empty-line {
  color: var(--gc-muted);
  font-size: 0.78rem;
}

.error {
  color: #B03030;
  border-color: #F0C0C0;
}

@media (max-width: 760px) {
  .profile-hero,
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
