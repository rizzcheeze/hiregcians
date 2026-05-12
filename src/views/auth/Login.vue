<template>
  <div class="auth-container">
    <div class="left-panel">
      <div class="lp-logo">Hire <span>GCians!</span></div>
      <div class="lp-hero">
        <div class="lp-label">Platform access</div>
        <div class="lp-heading">Find roles that <em>actually</em> fit you.</div>
        <div class="lp-sub">Access the student, employer, and admin workflows from one shared platform experience.</div>
        <div class="lp-cards">
          <div class="lp-card">
            <div class="lp-card-dot"></div>
            <div>
              <div class="lp-card-title">AI-powered matching</div>
              <div class="lp-card-sub">Resume-derived skill extraction</div>
            </div>
            <div class="lp-pct">94%</div>
          </div>
          <div class="lp-card">
            <div class="lp-card-dot"></div>
            <div>
              <div class="lp-card-title">Real-time tracking</div>
              <div class="lp-card-sub">Application status updates</div>
            </div>
            <div class="lp-pct">Active</div>
          </div>
        </div>
      </div>
    </div>

    <div class="right-panel">
      <div class="auth-box">
        <div class="auth-tabs">
          <div class="auth-tab active">Log in</div>
          <div class="auth-tab" @click="$router.push('/register')">Sign up</div>
        </div>

        <div class="auth-heading">Welcome back</div>

        <!-- Login type toggle -->
        <div class="role-selector">
          <div class="role-card" :class="{ selected: loginType === 'student' }" @click="loginType = 'student'">
            <div class="role-title">Student</div>
            <div class="role-sub">GC email login</div>
          </div>
          <div class="role-card" :class="{ selected: loginType === 'other' }" @click="loginType = 'other'">
            <div class="role-title">Employer / Admin</div>
            <div class="role-sub">Email login</div>
          </div>
        </div>

        <!-- Student login -->
        <template v-if="loginType === 'student'">
          <label class="form-label">Student ID Number</label>
          <div class="id-input-wrapper">
            <input
              class="form-input id-input"
              v-model="studentId"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="000000000"
              @input="studentId = studentId.replace(/\D/g, '').slice(0, 9)"
            />
            <span class="id-suffix">@gordoncollege.edu.ph</span>
          </div>
          <div v-if="studentId.length > 0 && studentId.length < 9" class="field-hint">
            {{ 9 - studentId.length }} more digit{{ studentId.length === 8 ? '' : 's' }} needed
          </div>
        </template>

        <!-- Employer/Admin login -->
        <template v-else>
          <label class="form-label">Email</label>
          <input class="form-input" v-model="form.email" type="email" placeholder="yourname@example.com" />
        </template>

        <label class="form-label">Password</label>
        <input class="form-input" v-model="form.password" type="password" placeholder="••••••••" @keyup.enter="handleLogin" />

        <p v-if="error" class="error-message">{{ error }}</p>

        <button class="btn-full" @click="handleLogin" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>

        <div class="terms">
          By continuing, you agree to our
          <a href="/terms" target="_blank">Terms of Use</a> and
          <a href="/privacy" target="_blank">Privacy Policy</a>.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()

const loginType = ref('student')
const studentId = ref('')
const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

const resolvedEmail = computed(() => {
  if (loginType.value === 'student') {
    return studentId.value + '@gordoncollege.edu.ph'
  }
  return form.value.email
})

const handleLogin = async () => {
  error.value = ''

  if (loginType.value === 'student' && studentId.value.length !== 9) {
    error.value = 'Student ID must be exactly 9 digits.'
    return
  }

  if (loginType.value === 'other' && !form.value.email) {
    error.value = 'Please enter your email.'
    return
  }

  loading.value = true
  try {
    await authStore.login(resolvedEmail.value, form.value.password)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authStore.user.id)
      .single()

    if (profileError) throw profileError

    if (profile.role === 'student') {
      router.push('/student/dashboard')
    } else if (profile.role === 'employer') {
      router.push('/employer/dashboard')
    } else if (profile.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/')
    }
  } catch (err) {
    error.value = err.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.auth-container {
  font-family: 'DM Sans', sans-serif;
  background: var(--gc-cream);
  color: var(--gc-dark);
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.left-panel {
  background: var(--gc-dark);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.left-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(99,153,34,0.25) 0%, transparent 60%);
  pointer-events: none;
}

.lp-logo { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: #C0DD97; position: relative; z-index: 1; }
.lp-logo span { color: #97C459; }
.lp-hero { position: relative; z-index: 1; margin: 2rem 0; }
.lp-label { font-size: 0.72rem; color: #97C459; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1rem; }
.lp-heading { font-family: 'DM Serif Display', serif; font-size: 2.4rem; line-height: 1.2; color: #fff; margin-bottom: 1rem; }
.lp-heading em { color: #C0DD97; font-style: italic; }
.lp-sub { font-size: 0.88rem; color: #97C459; line-height: 1.7; max-width: 340px; }
.lp-cards { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 2rem; }
.lp-card { background: rgba(255,255,255,0.06); border: 0.5px solid rgba(192,221,151,0.2); border-radius: 10px; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; }
.lp-card-dot { width: 8px; height: 8px; background: #97C459; border-radius: 50%; }
.lp-card-title { font-size: 0.8rem; font-weight: 500; color: #fff; }
.lp-card-sub { font-size: 0.72rem; color: #97C459; }
.lp-pct { font-size: 0.72rem; font-weight: 500; background: var(--gc-green); color: #C0DD97; padding: 2px 8px; border-radius: 20px; margin-left: auto; }

.right-panel { display: flex; align-items: center; justify-content: center; padding: 2rem; }
.auth-box { width: 100%; max-width: 400px; }

.auth-tabs { display: flex; border-bottom: 0.5px solid #C0DD97; margin-bottom: 1.75rem; }
.auth-tab { font-size: 0.88rem; color: var(--gc-muted); padding: 0.6rem 1.25rem; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.auth-tab.active { color: var(--gc-green); font-weight: 500; border-bottom-color: var(--gc-green); }

.auth-heading { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: var(--gc-dark); margin-bottom: 1rem; }

.role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1.5rem; }
.role-card { border: 1.5px solid #C0DD97; border-radius: 10px; padding: 0.85rem; cursor: pointer; text-align: center; transition: all 0.15s; background: #fff; }
.role-card.selected { border-color: var(--gc-green); background: var(--gc-green-light); }
.role-title { font-size: 0.82rem; font-weight: 500; color: var(--gc-dark); }
.role-sub { font-size: 0.7rem; color: var(--gc-muted); margin-top: 0.15rem; }

.form-label { font-size: 0.78rem; font-weight: 500; color: var(--gc-dark); margin-bottom: 0.4rem; display: block; }
.form-input { width: 100%; border: 0.5px solid #C0DD97; border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-family: 'DM Sans', sans-serif; color: var(--gc-dark); background: #fff; outline: none; margin-bottom: 1rem; transition: border-color 0.15s; }
.form-input:focus { border-color: var(--gc-green); }

.id-input-wrapper { display: flex; align-items: center; border: 0.5px solid #C0DD97; border-radius: 8px; background: #fff; margin-bottom: 0.5rem; overflow: hidden; transition: border-color 0.15s; }
.id-input-wrapper:focus-within { border-color: var(--gc-green); }
.id-input { border: none; margin-bottom: 0; border-radius: 0; flex: 0 0 auto; width: 7rem; }
.id-suffix { font-size: 0.78rem; color: var(--gc-muted); padding-right: 0.75rem; white-space: nowrap; }

.field-hint { font-size: 0.7rem; color: var(--gc-muted); margin-bottom: 0.75rem; }

.btn-full { width: 100%; background: var(--gc-green); color: #fff; border: none; border-radius: 20px; padding: 0.7rem; font-size: 0.9rem; font-family: 'DM Serif Display', serif; cursor: pointer; transition: opacity 0.15s; margin-top: 0.5rem; }
.btn-full:hover { opacity: 0.9; }
.btn-full:disabled { opacity: 0.5; cursor: not-allowed; }

.error-message { color: #B03030; font-size: 0.75rem; margin-bottom: 0.5rem; text-align: center; }

.terms { font-size: 0.72rem; color: #B4B2A9; text-align: center; margin-top: 1.25rem; line-height: 1.6; }
.terms a { color: var(--gc-green-mid); text-decoration: none; }
.terms a:hover { text-decoration: underline; }

@media (max-width: 900px) {
  .auth-container { grid-template-columns: 1fr; }
  .left-panel { padding: 2rem; min-height: auto; }
  .right-panel { padding: 1.25rem; }
}
</style>