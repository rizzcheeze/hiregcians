<template>
  <div class="auth-container">
    <div class="left-panel">
      <div class="lp-logo">Hire <span>GCians!</span></div>
      <img src="/logo.png" alt="Hire GCians logo" class="lp-logo-img" />
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

        <div v-if="emailSent" class="email-sent-box">
          <div class="email-sent-icon">✉</div>
          <div class="email-sent-title">Check your email</div>
          <div class="email-sent-sub">
            We sent a confirmation link to <strong>{{ resolvedEmail }}</strong>.
            Click it to activate your account and get started.
          </div>
          <div class="email-sent-note">Didn't receive it? Check your spam folder.</div>
          <button class="btn-full" style="margin-top: 1.5rem;" @click="emailSent = false">Back to sign up</button>
        </div>

        <template v-else>
          <div class="auth-tabs">
            <div class="auth-tab" @click="$router.push('/login')">Log in</div>
            <div class="auth-tab active">Sign up</div>
          </div>

          <div class="auth-heading">Create account</div>

          <div class="role-selector">
            <div class="role-card" :class="{ selected: signupRole === 'student' }" @click="signupRole = 'student'">
              <div class="role-title">Student</div>
              <div class="role-sub">Browse & apply</div>
            </div>
            <div class="role-card" :class="{ selected: signupRole === 'employer' }" @click="signupRole = 'employer'">
              <div class="role-title">Employer</div>
              <div class="role-sub">Post & hire</div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <label class="form-label">First name</label>
              <input class="form-input" v-model="signupForm.first_name" placeholder="First name" />
            </div>
            <div>
              <label class="form-label">Last name</label>
              <input class="form-input" v-model="signupForm.last_name" placeholder="Last name" />
            </div>
          </div>

          <!-- Student: ID number input -->
          <template v-if="signupRole === 'student'">
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

          <!-- Employer: regular email -->
          <template v-else>
            <label class="form-label">Email</label>
            <input class="form-input" v-model="signupForm.email" type="email" placeholder="yourname@example.com" />
          </template>

          <!-- Student Extras -->
          <div v-if="signupRole === 'student'">
            <div class="form-row">
              <div>
                <label class="form-label">Program</label>
                <select class="form-select" v-model="signupForm.program">
                  <option value="">Select program</option>
                  <option value="BSCS">BSCS - Computer Science</option>
                  <option value="BSIT">BSIT - Information Technology</option>
                  <option value="BSEMC">BSEMC - Entertainment and Multimedia Computing</option>
                </select>
              </div>
              <div>
                <label class="form-label">Year level</label>
                <select class="form-select" v-model="signupForm.year_level">
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Employer Extras -->
          <div v-if="signupRole === 'employer'">
            <label class="form-label">Company name</label>
            <input class="form-input" v-model="signupForm.company_name" placeholder="Company name" />
          </div>

          <label class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              class="form-input"
              v-model="signupForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder=""
              style="margin-bottom: 0.5rem; padding-right: 3.5rem;"
            />
            <span class="pw-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </span>
          </div>

          <div v-if="signupForm.password.length > 0" class="strength-wrapper">
            <div class="strength-bar">
              <div class="strength-fill" :style="{ width: strengthPercent + '%', background: strengthColor }"></div>
            </div>
            <div class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</div>
          </div>

          <div v-if="signupForm.password.length > 0" class="pw-checklist">
            <div class="pw-check" :class="{ met: checks.length }">{{ checks.length ? '✓' : '✗' }} At least 8 characters</div>
            <div class="pw-check" :class="{ met: checks.uppercase }">{{ checks.uppercase ? '✓' : '✗' }} One uppercase letter</div>
            <div class="pw-check" :class="{ met: checks.lowercase }">{{ checks.lowercase ? '✓' : '✗' }} One lowercase letter</div>
            <div class="pw-check" :class="{ met: checks.number }">{{ checks.number ? '✓' : '✗' }} One number</div>
            <div class="pw-check" :class="{ met: checks.special }">{{ checks.special ? '✓' : '✗' }} One special character (!@#$%^&*)</div>
          </div>

          <p v-if="signupError" class="error-message">{{ signupError }}</p>

          <button class="btn-full" @click="handleSignup" :disabled="signupLoading">
            {{ signupLoading ? 'Creating account...' : 'Create my account' }}
          </button>

          <div class="terms">
            By continuing, you agree to our
            <a href="/terms" target="_blank">Terms of Use</a> and
            <a href="/privacy" target="_blank">Privacy Policy</a>.
          </div>
        </template>

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

const signupRole = ref('student')
const studentId = ref('')
const showPassword = ref(false)
const emailSent = ref(false)

const signupForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  program: '',
  year_level: '',
  company_name: ''
})
const signupLoading = ref(false)
const signupError = ref('')

const resolvedEmail = computed(() => {
  if (signupRole.value === 'student') {
    return studentId.value + '@gordoncollege.edu.ph'
  }
  return signupForm.value.email
})

const checks = computed(() => ({
  length:    signupForm.value.password.length >= 8,
  uppercase: /[A-Z]/.test(signupForm.value.password),
  lowercase: /[a-z]/.test(signupForm.value.password),
  number:    /[0-9]/.test(signupForm.value.password),
  special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signupForm.value.password),
}))

const strengthScore   = computed(() => Object.values(checks.value).filter(Boolean).length)
const strengthPercent = computed(() => (strengthScore.value / 5) * 100)
const strengthColor   = computed(() => {
  if (strengthScore.value <= 1) return '#E53535'
  if (strengthScore.value === 2) return '#E57F35'
  if (strengthScore.value === 3) return '#E5C535'
  if (strengthScore.value === 4) return '#7DB84A'
  return '#3B6D11'
})
const strengthLabel = computed(() => {
  if (strengthScore.value <= 1) return 'Very weak'
  if (strengthScore.value === 2) return 'Weak'
  if (strengthScore.value === 3) return 'Fair'
  if (strengthScore.value === 4) return 'Good'
  return 'Strong'
})
const isPasswordValid = computed(() => Object.values(checks.value).every(Boolean))
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const handleSignup = async () => {
  signupError.value = ''

  if (!signupForm.value.first_name || !signupForm.value.last_name) {
    signupError.value = 'Please enter your full name.'
    return
  }

  if (signupRole.value === 'student') {
    if (studentId.value.length !== 9) {
      signupError.value = 'Student ID must be exactly 9 digits.'
      return
    }
  } else {
    if (!validateEmail(signupForm.value.email)) {
      signupError.value = 'Please enter a valid email address.'
      return
    }
  }

  if (!isPasswordValid.value) {
    signupError.value = 'Please make sure your password meets all requirements.'
    return
  }

  signupLoading.value = true
  try {
    await authStore.register({
      email: resolvedEmail.value,
      password: signupForm.value.password,
      first_name: signupForm.value.first_name,
      last_name: signupForm.value.last_name,
      role: signupRole.value
    })

    if (authStore.user?.id) {
      if (signupRole.value === 'student') {
        await supabase.from('student_profiles').insert({
          user_id: authStore.user.id,
          program: signupForm.value.program,
          section: signupForm.value.year_level
        })
      } else if (signupRole.value === 'employer') {
        await supabase.from('employer_profiles').insert({
          user_id: authStore.user.id,
          company_name: signupForm.value.company_name
        })
      }
      router.push(signupRole.value === 'student' ? '/student/dashboard' : '/employer/dashboard')
    } else {
      sessionStorage.setItem('pending_signup', JSON.stringify({
        role: signupRole.value,
        program: signupForm.value.program,
        year_level: signupForm.value.year_level,
        company_name: signupForm.value.company_name
      }))
      emailSent.value = true
    }
  } catch (err) {
    signupError.value = err.message || 'Failed to create account'
  } finally {
    signupLoading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.auth-container { font-family: 'DM Sans', sans-serif; background: var(--gc-cream); color: var(--gc-dark); min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
.left-panel { background: var(--gc-dark); padding: 3rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.left-panel::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 20%, rgba(99,153,34,0.25) 0%, transparent 60%); pointer-events: none; }
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

.email-sent-box { text-align: center; padding: 1rem 0; }
.email-sent-icon { font-size: 3rem; margin-bottom: 1rem; }
.email-sent-title { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: var(--gc-dark); margin-bottom: 0.75rem; }
.email-sent-sub { font-size: 0.88rem; color: var(--gc-muted); line-height: 1.7; margin-bottom: 0.5rem; }
.email-sent-note { font-size: 0.75rem; color: #B4B2A9; margin-top: 0.5rem; }

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
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.form-select { width: 100%; border: 0.5px solid #C0DD97; border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-family: 'DM Sans', sans-serif; color: var(--gc-dark); background: #fff; outline: none; margin-bottom: 1rem; }

.id-input-wrapper {
  display: flex;
  align-items: stretch;
  border: 0.5px solid #C0DD97;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 0.5rem;
  overflow: hidden;
  transition: border-color 0.15s;
}
.id-input-wrapper:focus-within { border-color: var(--gc-green); }
.id-input {
  border: none;
  margin-bottom: 0;
  border-radius: 0;
  flex: 1;
  min-width: 0;
}
.id-suffix {
  font-size: 0.78rem;
  color: var(--gc-muted);
  padding: 0 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
  border-left: 0.5px solid #EAF3DE;
  background: #FAFAF7;
  display: flex;
  align-items: center;
}

.field-hint { font-size: 0.7rem; color: var(--gc-muted); margin-bottom: 0.75rem; }

.password-wrapper { position: relative; }
.pw-toggle { position: absolute; right: 0.75rem; top: 0.6rem; cursor: pointer; font-size: 0.75rem; color: var(--gc-muted); user-select: none; }

.strength-wrapper { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.strength-bar { flex: 1; height: 6px; background: #EAF3DE; border-radius: 4px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 4px; transition: width 0.3s, background 0.3s; }
.strength-label { font-size: 0.72rem; font-weight: 500; min-width: 60px; }

.pw-checklist { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; }
.pw-check { font-size: 0.72rem; color: #B4B2A9; transition: color 0.2s; }
.pw-check.met { color: var(--gc-green); }

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
  .form-row { grid-template-columns: 1fr; }
  .role-selector { grid-template-columns: 1fr; }
}
</style>