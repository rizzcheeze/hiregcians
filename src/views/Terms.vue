<template>
  <div class="doc-container">
    <div class="doc-header">
      <div class="doc-logo" @click="$router.push('/')">Hire <span>GCians!</span></div>
    </div>
    <div class="doc-body">
      <h1>Terms of Use</h1>
      <p class="doc-date">Effective date: May 1, 2026</p>

      <p>Welcome to Hire GCians!, a job matching platform developed for Gordon College students and partner employers. By accessing or using this platform, you agree to be bound by these Terms of Use. Please read them carefully.</p>

      <h2>1. Eligibility</h2>
      <p>This platform is intended for use by currently enrolled students of Gordon College, verified third-party employers, and authorized platform administrators. By registering, you confirm that the information you provide is accurate and complete.</p>

      <h2>2. User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your login information with any other person. Any activity that occurs under your account is your responsibility. If you suspect unauthorized access, notify the platform administrators immediately.</p>

      <h2>3. Student Responsibilities</h2>
      <p>Students agree to:</p>
      <ul>
        <li>Upload only their own authentic resume documents</li>
        <li>Provide accurate personal and academic information</li>
        <li>Use the platform solely for legitimate job search and application purposes</li>
        <li>Not misrepresent their qualifications, skills, or experience to employers</li>
        <li>Respond professionally to employer communications</li>
      </ul>

      <h2>4. Employer Responsibilities</h2>
      <p>Employers agree to:</p>
      <ul>
        <li>Post only legitimate job opportunities appropriate for students</li>
        <li>Provide accurate company and job posting information</li>
        <li>Not use student data for purposes other than recruitment</li>
        <li>Comply with all applicable labor laws and regulations in the Philippines</li>
        <li>Treat all applicants with professionalism and respect</li>
      </ul>

      <h2>5. AI-Powered Matching</h2>
      <p>Hire GCians! uses artificial intelligence to analyze resume content and generate match scores between students and job postings. These scores are provided as a guide only and do not constitute a guarantee of employment or suitability. The platform is not liable for hiring decisions made based on AI-generated match scores or rationale.</p>

      <h2>6. Resume and Data Processing</h2>
      <p>By uploading a resume, you grant Hire GCians! a limited, non-exclusive license to process and analyze its contents for the purpose of generating skill profiles and job match scores. Your resume data will not be sold or shared with third parties outside the platform without your consent.</p>

      <h2>7. Prohibited Conduct</h2>
      <p>Users may not:</p>
      <ul>
        <li>Upload malicious files or attempt to compromise platform security</li>
        <li>Scrape, copy, or redistribute platform data without authorization</li>
        <li>Impersonate another person or organization</li>
        <li>Post fraudulent, misleading, or illegal job listings</li>
        <li>Harass or discriminate against other users</li>
        <li>Attempt to manipulate AI match scores through deceptive means</li>
      </ul>

      <h2>8. Intellectual Property</h2>
      <p>All platform content, design, and technology are the property of Hire GCians! and Gordon College. Users retain ownership of their own uploaded content but grant the platform the rights necessary to provide its services.</p>

      <h2>9. Termination</h2>
      <p>The platform reserves the right to suspend or terminate accounts that violate these Terms of Use, without prior notice. Students who graduate or are no longer enrolled may have their accounts deactivated.</p>

      <h2>10. Limitation of Liability</h2>
      <p>Hire GCians! is provided as an academic and career development tool. The platform is not liable for any employment outcomes, missed opportunities, or decisions made by employers or students based on platform data. The service is provided "as is" without warranties of any kind.</p>

      <h2>11. Changes to Terms</h2>
      <p>These Terms of Use may be updated from time to time. Continued use of the platform after changes are posted constitutes acceptance of the updated terms. Users will be notified of significant changes via email or platform notification.</p>

      <h2>12. Governing Law</h2>
      <p>These terms are governed by the laws of the Republic of the Philippines. Any disputes arising from use of this platform shall be subject to the jurisdiction of the courts of Olongapo City, Zambales.</p>

      <h2>13. Contact</h2>
      <p>For questions regarding these Terms of Use, please contact the platform administrators through Gordon College's official channels or via the platform's support email.</p>
    </div>
    <div class="doc-footer">
      <button class="back-btn" @click="$router.go(-1)">← Back</button>
    </div>
  </div>
</template>

<script setup>
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