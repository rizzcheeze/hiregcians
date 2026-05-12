<template>
  <div class="doc-container">
    <div class="doc-header">
      <div class="doc-logo" @click="$router.push('/')">Hire <span>GCians!</span></div>
    </div>
    <div class="doc-body">
      <h1>Privacy Policy</h1>
      <p class="doc-date">Effective date: May 1, 2026</p>

      <p>Hire GCians! is committed to protecting the privacy of its users. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data. This platform is operated under the supervision of Gordon College, Olongapo City, Philippines.</p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following types of information when you use the platform:</p>
      <ul>
        <li><strong>Account information:</strong> Your name, email address, role (student or employer), and password</li>
        <li><strong>Student profile data:</strong> Academic program, year level, section, and personal bio</li>
        <li><strong>Resume data:</strong> Uploaded PDF files and extracted text content including skills, experience, and education</li>
        <li><strong>Employer data:</strong> Company name, industry, website, location, and company description</li>
        <li><strong>Application data:</strong> Job applications submitted, application status, and employer notes</li>
        <li><strong>Usage data:</strong> Pages visited, features used, and actions taken on the platform</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>Your information is used to:</p>
      <ul>
        <li>Create and manage your account</li>
        <li>Generate AI-powered skill profiles from your uploaded resume</li>
        <li>Calculate job match scores between students and job postings</li>
        <li>Facilitate job applications and employer-student communication</li>
        <li>Display your profile to employers when you apply for a job</li>
        <li>Improve platform features and user experience</li>
        <li>Send notifications about application status updates</li>
        <li>Provide administrative oversight for Gordon College</li>
      </ul>

      <h2>3. AI Processing of Resume Data</h2>
      <p>When you upload a resume, its contents are sent to Google's Gemini AI API for processing. This processing extracts skills, achievements, and generates a career summary. By uploading a resume, you consent to this processing. Google's data handling is governed by their own privacy policies. We do not store raw resume data beyond what is necessary to provide the service.</p>

      <h2>4. Data Sharing</h2>
      <p>We do not sell your personal data. Your information may be shared in the following limited circumstances:</p>
      <ul>
        <li><strong>With employers:</strong> When you apply for a job, your name, skills, and application details are shared with the relevant employer</li>
        <li><strong>With Gordon College administrators:</strong> Platform administrators have oversight access to user accounts and activity for institutional purposes</li>
        <li><strong>With service providers:</strong> We use Supabase for database and authentication services, and Google Gemini for AI processing. These providers have their own privacy policies</li>
        <li><strong>As required by law:</strong> We may disclose information if required by Philippine law or a valid legal process</li>
      </ul>

      <h2>5. Data Storage and Security</h2>
      <p>Your data is stored securely using Supabase, which provides encrypted storage and secure authentication. Resume files are stored in Supabase Storage with access controls. We implement industry-standard security measures including row-level security policies on all database tables. However, no system is completely secure and we cannot guarantee absolute security.</p>

      <h2>6. Data Retention</h2>
      <p>We retain your data for as long as your account is active. Student accounts may be deactivated upon graduation. You may request deletion of your account and associated data at any time. Certain records may be retained for a limited period after deletion for legal or institutional compliance purposes.</p>

      <h2>7. Your Rights</h2>
      <p>Under the Data Privacy Act of 2012 (Republic Act 10173) of the Philippines, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Correct inaccurate or incomplete data</li>
        <li>Request deletion of your personal data</li>
        <li>Object to the processing of your data</li>
        <li>Be informed of how your data is being used</li>
        <li>File a complaint with the National Privacy Commission</li>
      </ul>

      <h2>8. Cookies and Local Storage</h2>
      <p>The platform uses browser local storage and session cookies to maintain your login session and preferences. These are essential for the platform to function and cannot be disabled. We do not use tracking cookies or third-party advertising cookies.</p>

      <h2>9. Children's Privacy</h2>
      <p>This platform is intended for college students who are at least 18 years of age or older. We do not knowingly collect data from individuals under 18. If you believe a minor has registered, please contact the platform administrators.</p>

      <h2>10. Third-Party Services</h2>
      <p>This platform uses the following third-party services:</p>
      <ul>
        <li><strong>Supabase</strong> — database, authentication, and file storage</li>
        <li><strong>Google Gemini API</strong> — AI resume parsing and job matching</li>
        <li><strong>Vercel</strong> — frontend hosting and deployment</li>
      </ul>
      <p>Each of these services has its own privacy policy which governs their handling of data.</p>

      <h2>11. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of the platform after changes are posted constitutes acceptance of the updated policy.</p>

      <h2>12. Contact Us</h2>
      <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact the platform administrators through Gordon College's official channels or the platform's support email. You may also reach out to the Gordon College Data Protection Officer.</p>
    </div>
    <div class="doc-footer">
      <button class="back-btn" @click="$router.go(-1)">← Back</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.doc-container {
  font-family: 'DM Sans', sans-serif;
  background: var(--gc-cream);
  min-height: 100vh;
  color: var(--gc-dark);
}

.doc-header {
  background: var(--gc-dark);
  padding: 1.25rem 3rem;
}

.doc-logo {
  font-family: 'DM Serif Display', serif;
  font-size: 1.3rem;
  color: #C0DD97;
  cursor: pointer;
}

.doc-logo span {
  color: #97C459;
}

.doc-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 2.2rem;
  color: var(--gc-dark);
  margin-bottom: 0.5rem;
}

.doc-date {
  font-size: 0.8rem;
  color: var(--gc-muted);
  margin-bottom: 2rem;
}

h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 1.15rem;
  color: var(--gc-dark);
  margin-top: 2rem;
  margin-bottom: 0.6rem;
}

p {
  font-size: 0.88rem;
  line-height: 1.8;
  color: #3a3a3a;
  margin-bottom: 1rem;
}

ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

ul li {
  font-size: 0.88rem;
  line-height: 1.8;
  color: #3a3a3a;
  margin-bottom: 0.25rem;
}

.doc-footer {
  max-width: 760px;
  margin: 0 auto;
  padding: 1rem 2rem 3rem;
}

.back-btn {
  background: none;
  border: 1px solid #C0DD97;
  border-radius: 20px;
  padding: 0.5rem 1.25rem;
  font-size: 0.82rem;
  color: var(--gc-green);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gc-green);
  color: #fff;
}
</style>