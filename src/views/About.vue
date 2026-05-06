<template>
  <div class="about-page">
    <nav class="nav">
      <div class="logo" @click="$router.push('/')" style="cursor:pointer">Hire <span>GCians!</span></div>
      <div class="nav-links">
        <button class="btn-outline" @click="$router.push('/login')">Log in</button>
        <button class="btn-primary" @click="$router.push('/register')">Sign up free</button>
      </div>
    </nav>

    <div class="hero hero-compact">
      <div>
        <div class="hero-tag">About the platform</div>
        <h1>A campus hiring app built around <em>fit</em>, not just forms.</h1>
        <p>Hire GCians! is designed to connect Gordon College students with third-party employers using structured profiles, job requirements, and AI-assisted resume analysis.</p>
        <div class="hero-btns">
          <button class="btn-primary" @click="$router.push('/login')">Browse current jobs</button>
          <button class="btn-outline" @click="$router.push('/register')">Create an account</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="ai-badge">
          <div class="ai-dot"></div> Product overview
        </div>
        <div class="panel-list">
          <div class="panel-row">🎯 AI-powered resume skill extraction</div>
          <div class="panel-row">📊 Smart job matching using pgvector</div>
          <div class="panel-row">💼 Employer-friendly applicant review</div>
          <div class="panel-row">📈 Track application status in real-time</div>
        </div>
      </div>
    </div>

    <section class="how-section">
      <div class="section-label">Core ideas</div>
      <div class="section-title">What the platform is trying to solve</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-title">Better student matching</div>
          <div class="info-desc">Students should see openings ranked by skill fit instead of manually checking every posting.</div>
        </div>
        <div class="info-card">
          <div class="info-title">Cleaner employer review</div>
          <div class="info-desc">Third-party employers need one place to publish roles, screen applicants, and move strong candidates forward.</div>
        </div>
        <div class="info-card">
          <div class="info-title">Resume intelligence</div>
          <div class="info-desc">The planned AI pipeline should scan PDF resumes, identify skills, and detect whether achievements are measurable or quantifiable.</div>
        </div>
      </div>
    </section>

    <section class="how-section">
      <div class="section-label">Current build</div>
      <div class="section-title">What works today</div>
      <div class="split-panel">
        <div class="panel-card">
          <div class="panel-title">Student side</div>
          <div class="panel-list">
            <div class="panel-row">Browse jobs, save listings, and apply</div>
            <div class="panel-row">Edit profile and view applications</div>
            <div class="panel-row">Upload resume for AI analysis</div>
            <div class="panel-row">View AI match scores and rationales</div>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-title">Employer side</div>
          <div class="panel-list">
            <div class="panel-row">Post and manage job listings</div>
            <div class="panel-row">Review applicants and update stages</div>
            <div class="panel-row">View match scores for each candidate</div>
            <div class="panel-row">Manage company profile and settings</div>
          </div>
        </div>
      </div>
    </section>

    <div class="footer">Hire GCians! · Resume-driven career platform</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.about-page {
  font-family: 'DM Sans', sans-serif;
  background: var(--gc-cream);
  color: var(--gc-dark);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #fff;
  border-bottom: 0.5px solid #C0DD97;
}

.logo {
  font-family: 'DM Serif Display', serif;
  font-size: 1.25rem;
  color: var(--gc-green);
  letter-spacing: -0.5px;
  cursor: pointer;
}

.logo span {
  color: var(--gc-green-mid);
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-primary {
  background: var(--gc-green);
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  border: none;
  font-size: 0.85rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: var(--gc-green);
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  border: 1.5px solid var(--gc-green);
  font-size: 0.85rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  cursor: pointer;
}

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 3rem 2rem;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
}

.hero-compact {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

.hero-tag {
  display: inline-block;
  background: var(--gc-green-light);
  color: var(--gc-green);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 1rem;
}

.hero h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 2.8rem;
  line-height: 1.15;
  color: var(--gc-dark);
  margin-bottom: 1rem;
}

.hero h1 em {
  font-style: italic;
  color: var(--gc-green-mid);
}

.hero p {
  font-size: 0.95rem;
  color: var(--gc-muted);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  max-width: 420px;
}

.hero-btns {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-visual {
  background: #fff;
  border-radius: 16px;
  border: 0.5px solid #C0DD97;
  padding: 1.25rem;
  position: relative;
}

.ai-badge {
  background: var(--gc-dark);
  color: #C0DD97;
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 0.75rem;
}

.ai-dot {
  width: 6px;
  height: 6px;
  background: #97C459;
  border-radius: 50%;
}

.panel-list {
  display: grid;
  gap: 0.75rem;
}

.panel-row {
  background: var(--gc-green-light);
  border: 0.5px solid #C0DD97;
  border-radius: 12px;
  color: var(--gc-dark);
  font-size: 0.82rem;
  line-height: 1.6;
  padding: 0.85rem 0.9rem;
}

.how-section {
  padding: 2.5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.section-label {
  font-size: 0.75rem;
  color: var(--gc-green-mid);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.section-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.8rem;
  color: var(--gc-dark);
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.info-card {
  background: #fff;
  border-radius: 14px;
  border: 0.5px solid #C0DD97;
  padding: 1.25rem;
}

.info-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gc-dark);
  margin-bottom: 0.5rem;
}

.info-desc {
  font-size: 0.82rem;
  color: var(--gc-muted);
  line-height: 1.7;
}

.split-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.panel-card {
  background: #fff;
  border-radius: 14px;
  border: 0.5px solid #C0DD97;
  padding: 1.25rem;
}

.panel-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gc-dark);
  margin-bottom: 0.75rem;
}

.footer {
  background: var(--gc-dark);
  color: #97C459;
  text-align: center;
  padding: 1rem;
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .hero, .info-grid, .split-panel {
    grid-template-columns: 1fr;
  }
  
  .nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }
  
  .nav-links {
    flex-wrap: wrap;
  }
  
  .hero h1 {
    font-size: 2.1rem;
  }
}
</style>