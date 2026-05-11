<template>
  <div class="landing-page">
    <nav class="nav">
      <div class="logo" @click="$router.push('/')" style="cursor:pointer">Hire <span>GCians!</span></div>
      <div class="nav-links">
        <a href="#" @click.prevent="$router.push('/about')">About</a>
        <button class="btn-outline" @click="$router.push('/login')">Log in</button>
        <button class="btn-primary" @click="$router.push('/register')">Sign up free</button>
      </div>
    </nav>

    <div class="hero">
      <div>
        <div class="hero-tag">Career platform for College of Computer Science Gordon College students</div>
        <h1>Your campus career, <em>intelligently</em> matched.</h1>
        <p>Hire GCians! connects Gordon College students with third-party employers and campus-facing opportunities using resume-derived matching and structured hiring workflows.</p>
        <div class="hero-btns">
          <button class="btn-primary" @click="$router.push('/login')">Find opportunities</button>
          <button class="btn-outline" @click="$router.push('/login')">Post a job</button>
        </div>
      </div>
      <div class="hero-visual">
        <img :src="qrCode" class="hero-qr" alt="Hire GCians QR code">
      </div>
    </div>

    <div class="how-section">
      <div class="section-label">How it works</div>
      <div class="section-title">Three steps to your next opportunity</div>
      <div class="steps">
        <div class="step-card">
          <div class="step-num">1</div>
          <div class="step-title">Build your profile</div>
          <div class="step-desc">Create a student profile and upload a PDF resume to drive profile strength and opportunity matching.</div>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <div class="step-title">Get matched</div>
          <div class="step-desc">The app ranks openings using resume-derived skills and surfaces the strongest opportunities first.</div>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <div class="step-title">Apply in one click</div>
          <div class="step-desc">Apply through the hiring workflow and track status changes across your applications.</div>
        </div>
      </div>
    </div>

    <div class="footer">Hire GCians! · Gordon College career platform</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import qrCode from '@/assets/qr.png'

const router = useRouter()
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.landing-page {
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
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  font-size: 0.85rem;
  color: var(--gc-muted);
  text-decoration: none;
  font-weight: 400;
  cursor: pointer;
}

.nav-links a:hover {
  color: var(--gc-green);
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
  padding: 2rem;
  position: relative;
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 320px;
}

.hero-qr {
  width: min(300px, 70vw);
  height: auto;
  display: block;
  border-radius: 12px;
  max-width: 100%;
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

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.step-card {
  background: #fff;
  border-radius: 12px;
  border: 0.5px solid #C0DD97;
  padding: 1.25rem;
}

.step-num {
  width: 32px;
  height: 32px;
  background: var(--gc-green-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Serif Display', serif;
  color: var(--gc-green);
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.step-title {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--gc-dark);
  margin-bottom: 0.4rem;
}

.step-desc {
  font-size: 0.8rem;
  color: var(--gc-muted);
  line-height: 1.6;
}

.footer {
  background: var(--gc-dark);
  color: #97C459;
  text-align: center;
  padding: 1rem;
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .hero, .steps {
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

  .hero {
    padding: 2rem 1rem;
  }

  .hero-visual {
    min-height: auto;
    padding: 1.25rem;
  }

  .hero-qr {
    width: min(280px, 78vw);
  }
}

@media (max-width: 560px) {
  .nav {
    padding: 1rem;
  }

  .nav-links,
  .nav-links button,
  .hero-btns,
  .hero-btns button {
    width: 100%;
  }

  .nav-links {
    gap: 0.65rem;
  }

  .nav-links a {
    width: 100%;
  }

  .hero h1 {
    font-size: 1.9rem;
  }

  .how-section {
    padding: 2rem 1rem;
  }
}
</style>
