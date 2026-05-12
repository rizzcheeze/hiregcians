<template>
  <main class="public-page">
    <div class="public-shell">
      <div class="topbar">
        <div class="brand" @click="$router.push('/')">Hire <span>GCians!</span></div>
        <button v-if="isOwnProfile" class="btn-outline" @click="$router.push('/employer/company')">Edit company</button>
      </div>

      <div v-if="loading" class="state-card">Loading company...</div>
      <div v-else-if="errorMessage" class="state-card error">{{ errorMessage }}</div>

      <template v-else>
        <section class="company-hero">
          <div class="logo">
            <img v-if="profile.logo_url" :src="profile.logo_url" alt="" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="hero-main">
            <div class="eyebrow">Company profile</div>
            <h1>{{ profile.company_name || 'Company' }}</h1>
            <p>{{ [profile.industry, profile.location].filter(Boolean).join(' · ') || 'Gordon College hiring partner' }}</p>
            <div class="meta-row">
              <span v-if="profile.company_size" class="meta-pill">{{ profile.company_size }} employees</span>
              <a v-if="profile.website" class="meta-pill link" :href="normalizedWebsite" target="_blank" rel="noreferrer">{{ displayWebsite }}</a>
            </div>
          </div>
        </section>

        <section class="content-grid">
          <div>
            <div class="panel">
              <div class="panel-title">About the company</div>
              <p class="body-copy">{{ profile.description || 'This company has not published a description yet.' }}</p>
            </div>

            <div class="panel">
              <div class="panel-title">Open opportunities</div>
              <div v-if="profile.jobs.length" class="job-list">
                <div v-for="job in profile.jobs" :key="job.id" class="job-card">
                  <div>
                    <div class="job-title">{{ job.title }}</div>
                    <div class="job-meta">{{ [job.job_type, job.work_setup, formatDate(job.posted_at)].filter(Boolean).join(' · ') }}</div>
                    <p>{{ job.description || 'No description provided.' }}</p>
                    <div class="skill-row">
                      <span v-for="skill in (job.required_skills || []).slice(0, 6)" :key="skill" class="skill-pill">{{ skill }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-line">No active jobs posted right now.</div>
            </div>
          </div>

          <aside>
            <div class="panel stats">
              <div>
                <div class="stat-value">{{ profile.jobs.length }}</div>
                <div class="stat-label">Active jobs</div>
              </div>
              <div>
                <div class="stat-value">{{ profile.industry || 'Partner' }}</div>
                <div class="stat-label">Industry</div>
              </div>
              <div>
                <div class="stat-value">{{ profile.location || 'Not listed' }}</div>
                <div class="stat-label">Location</div>
              </div>
            </div>

            <div class="note-panel">
              <div class="panel-title">For students</div>
              <p>Review active roles from this employer and apply from your student dashboard.</p>
              <button class="btn-primary" @click="$router.push('/student/jobs')">Browse jobs</button>
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
  company_name: '',
  industry: '',
  website: '',
  company_size: '',
  location: '',
  description: '',
  logo_url: '',
  jobs: [],
})

const profileId = computed(() => route.params.id || authStore.user?.id || '')
const isOwnProfile = computed(() => authStore.user?.id && authStore.user.id === profileId.value)
const initials = computed(() => (profile.value.company_name?.charAt(0) || 'C').toUpperCase())
const normalizedWebsite = computed(() => {
  if (!profile.value.website) return ''
  if (/^https?:\/\//i.test(profile.value.website)) return profile.value.website
  return `https://${profile.value.website}`
})
const displayWebsite = computed(() => profile.value.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0])

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : ''

const loadProfile = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    if (!profileId.value) throw new Error('Company not found')
    const { data, error } = await supabase.functions.invoke('public-profile', {
      body: { type: 'company', id: profileId.value },
    })
    if (error || data?.success === false) throw new Error(data?.error || error?.message || 'Company not found')
    profile.value = {
      ...profile.value,
      ...data.profile,
      jobs: data.profile.jobs || [],
    }
  } catch (error) {
    errorMessage.value = error.message || 'Company not found'
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
  width: min(1080px, calc(100% - 2rem));
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

.company-hero {
  min-height: 280px;
  background: #fff;
  border: 1px solid #C0DD97;
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: var(--gc-green);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'DM Serif Display', serif;
  font-size: 2.4rem;
  flex: 0 0 auto;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.hero-main p,
.body-copy,
.job-card p,
.note-panel p {
  color: var(--gc-muted);
  line-height: 1.7;
}

.meta-row,
.skill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 1rem;
}

.meta-pill,
.skill-pill {
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  font-size: 0.74rem;
}

.meta-pill {
  background: #F1EFE8;
  color: var(--gc-muted);
  text-decoration: none;
}

.meta-pill.link {
  color: var(--gc-green);
}

.skill-pill {
  background: var(--gc-green-light);
  color: var(--gc-green);
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

.job-card {
  padding: 0.9rem 0;
  border-bottom: 1px solid #EAF3DE;
}

.job-card:last-child {
  border-bottom: 0;
}

.job-title {
  font-weight: 700;
}

.job-meta,
.empty-line,
.stat-label {
  color: var(--gc-muted);
  font-size: 0.78rem;
}

.stats {
  display: grid;
  gap: 1rem;
}

.stat-value {
  font-family: 'DM Serif Display', serif;
  color: var(--gc-green);
  font-size: 1.4rem;
}

.error {
  color: #B03030;
  border-color: #F0C0C0;
}

@media (max-width: 760px) {
  .company-hero,
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
