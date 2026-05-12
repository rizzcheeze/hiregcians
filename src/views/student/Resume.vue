<template>
  <div class="dash">
    <aside class="sidebar">
      <div class="s-logo">Hire <span>GCians!</span></div>
      <div class="s-user">
        <div class="s-avatar">{{ initials }}</div>
        <div>
          <div class="s-name">{{ firstName }} {{ lastName }}</div>
          <div class="s-prog">{{ program }} {{ section }}</div>
        </div>
      </div>
      <ul class="s-nav">
        <li @click="$router.push('/student/dashboard')">⬡ Dashboard</li>
        <li @click="$router.push('/student/jobs')">⬡ Browse jobs</li>
        <li @click="$router.push('/student/applications')">⬡ My applications</li>
        <li @click="$router.push('/student/saved')">⬡ Saved</li>
        <div class="s-nav-label">Account</div>
        <li @click="$router.push('/student/profile')">⬡ Edit profile</li>
        <li class="active">⬡ Skills &amp; resume</li>
        <li @click="$router.push('/student/settings')">⬡ Settings</li>
        <li @click="handleLogout">⬡ Logout</li>
      </ul>
    </aside>

    <main class="main">
      <div class="main-header">
        <div>
          <div class="page-title">Skills &amp; Resume</div>
          <div class="page-sub">Upload your PDF resume and preview the extracted profile used for compatibility scoring.</div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-outline" @click="$router.push('/student/public-profile')">Public profile</button>
          <button class="btn-sm" @click="$router.push('/student/applications')">My applications</button>
        </div>
      </div>

      <div class="content">
        <div>
          <div class="card">
            <div class="card-title">Resume upload</div>
            <div style="font-size:0.82rem;color:var(--gc-muted);line-height:1.7;margin-bottom:1rem">
              Upload a PDF resume. The platform uses resume content to extract skills, support matching, and analyze profile strength.
            </div>
            <input type="file" accept=".pdf" @change="handleFileSelect" class="form-input" style="margin-bottom:0.75rem" />
            <button class="btn-sm" @click="uploadResume" :disabled="!selectedFile || uploading">
              {{ uploading ? uploadStatus || 'Processing...' : 'Analyze PDF resume' }}
            </button>
            <div v-if="uploadStatus && !uploading" class="upload-status" :class="{ 'status-success': uploadSuccess, 'status-error': !uploadSuccess }">
              {{ uploadStatus }}
            </div>
            <div v-if="uploading" class="upload-steps">
              <div class="step" :class="{ active: uploadStep >= 1, done: uploadStep > 1 }">1. Uploading file</div>
              <div class="step" :class="{ active: uploadStep >= 2, done: uploadStep > 2 }">2. Reading PDF</div>
              <div class="step" :class="{ active: uploadStep >= 3, done: uploadStep > 3 }">3. AI analyzing</div>
              <div class="step" :class="{ active: uploadStep >= 4, done: uploadStep > 4 }">4. Saving skills</div>
              <div class="step" :class="{ active: uploadStep >= 5, done: uploadStep > 5 }">5. Computing matches</div>
            </div>
          </div>

          <div class="card" v-if="extractedSkills.length">
            <div class="card-title">Extracted skills</div>
            <div class="skills-grid">
              <span v-for="skill in extractedSkills" :key="skill" class="skill-chip">{{ skill }}</span>
            </div>
          </div>

          <div class="card" v-if="achievements.length">
            <div class="card-title">Quantifiable achievements</div>
            <div v-for="(achievement, index) in achievements" :key="index" class="quant-row">{{ achievement }}</div>
          </div>
        </div>

        <div>
          <div class="card" v-if="aiSummary">
            <div class="card-title">AI summary</div>
            <div class="ai-summary">{{ aiSummary }}</div>
          </div>

          <div class="ai-tip" v-if="recruiterTip">
            <div class="ai-tip-label">Recruiter readiness</div>
            <div class="ai-tip-body">{{ recruiterTip }}</div>
          </div>

          <div class="card">
            <div class="card-title">Public profile preview</div>
            <button class="btn-outline" style="width:100%" @click="$router.push('/student/public-profile')">Open public profile</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'
import { computeMatchesForStudent } from '@/api/matching'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

const router = useRouter()
const authStore = useAuthStore()

const uploading = ref(false)
const uploadStep = ref(0)
const selectedFile = ref(null)
const uploadStatus = ref('')
const uploadSuccess = ref(false)
const extractedSkills = ref([])
const achievements = ref([])
const aiSummary = ref('')
const recruiterTip = ref('')
const program = ref('')
const section = ref('')
let lastResumeId = null

const firstName = computed(() => authStore.profile?.first_name || '')
const lastName = computed(() => authStore.profile?.last_name || '')
const initials = computed(() => (firstName.value.charAt(0) || '') + (lastName.value.charAt(0) || ''))

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  const isPdf = file && (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'))
  if (isPdf) {
    selectedFile.value = file
    uploadStatus.value = ''
    uploadSuccess.value = false
  } else {
    selectedFile.value = null
    uploadStatus.value = 'Please select a valid PDF file'
  }
}

const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    fullText += textContent.items.map(item => item.str).join(' ') + '\n'
  }
  return fullText.trim()
}

const uploadResume = async () => {
  if (!selectedFile.value) {
    uploadStatus.value = 'Please select a PDF file first'
    return
  }

  uploading.value = true
  uploadStep.value = 1
  uploadStatus.value = ''
  uploadSuccess.value = false

  try {
    // Step 1 — Upload file to storage
    uploadStep.value = 1
    const fileExt = selectedFile.value.name.split('.').pop()
    const fileName = `${authStore.user.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, selectedFile.value)
    if (uploadError) throw new Error('File upload failed: ' + uploadError.message)
    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName)
    const resumeUrl = urlData.publicUrl

    // Step 2 — Extract text from PDF
    uploadStep.value = 2
    const extractedText = await extractTextFromPDF(selectedFile.value)
    if (!extractedText || extractedText.length < 50) {
      throw new Error('Could not extract enough text from the PDF. Make sure it is not a scanned image.')
    }

    // Step 3 — AI analysis via Edge Function
    uploadStep.value = 3
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: { text: extractedText }
    })
    if (error) throw new Error('AI analysis failed: ' + error.message)
    if (data?.error) throw new Error('AI analysis failed: ' + data.error)
    if (!data?.skills?.length) throw new Error('AI could not extract skills from this resume. Try a different PDF.')

    extractedSkills.value = data.skills
    achievements.value = data.achievements
    aiSummary.value = data.summary
    recruiterTip.value = data.recruiterTip

    uploadStep.value = 4

    await supabase
      .from('resumes')
      .update({ is_active: false })
      .eq('student_id', authStore.user.id)
      .eq('is_active', true)

    const { data: resumeData, error: saveError } = await supabase.from('resumes').insert({
      student_id: authStore.user.id,
      file_url: resumeUrl,
      is_active: true,
      raw_text: extractedText.substring(0, 2000),
      parsed_skills: data.skills,
      parsed_experience: data.achievements.map(a => ({ description: a, quantifiable: true })),
      ai_summary: data.summary,
      recruiter_tip: data.recruiterTip
    }).select()

    if (saveError) throw new Error('Failed to save resume: ' + saveError.message)

    const newResume = Array.isArray(resumeData) ? resumeData[0] : resumeData
    lastResumeId = newResume?.id
    console.log('Resume saved with ID:', lastResumeId)

    const { error: skillsError } = await supabase
      .from('student_profiles')
      .update({ skills: data.skills })
      .eq('user_id', authStore.user.id)
    if (skillsError) throw new Error('Failed to save skills: ' + skillsError.message)

    uploadStatus.value = 'Resume analyzed successfully. Computing job matches...'
    uploadSuccess.value = true
    uploading.value = false
    uploadStep.value = 0

    uploadStep.value = 5
    try {
      if (lastResumeId && extractedText) {
        const { data: embedData, error: embedError } = await supabase.functions.invoke('embed-resume', {
          body: {
            resumeId: lastResumeId,
            text: extractedText
          }
        })

        console.log('Embed response:', { embedData, embedError })

        if (embedError) {
          console.error('Embed error:', embedError)
        } else {
          console.log('Embed success:', embedData)
        }
      } else {
        console.warn('Skipping embed - missing resumeId or text')
      }
    } catch (embedError) {
      console.error('Embed error:', embedError)
    }

    try {
      await computeMatchesForStudent(authStore.user.id)
      uploadStatus.value = 'Resume analyzed successfully. Job match scores are ready.'
    } catch (matchError) {
      console.error('Match computation error:', matchError)
      uploadStatus.value = 'Resume analyzed successfully. Job matches will update shortly.'
    }

    uploadSuccess.value = true
  } catch (error) {
    console.error('Resume upload error:', error)
    uploadStatus.value = error.message || 'Something went wrong. Please try again.'
    uploadSuccess.value = false
  } finally {
    uploading.value = false
    uploadStep.value = 0
  }
}

const fetchExistingResume = async () => {
  try {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('program, section, skills')
      .eq('user_id', authStore.user.id)
      .maybeSingle()
    if (profile) {
      program.value = profile.program || ''
      section.value = profile.section || ''
      extractedSkills.value = profile.skills || []
    }

    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('student_id', authStore.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (resume) {
      if (resume.parsed_skills?.length) extractedSkills.value = resume.parsed_skills
      if (resume.parsed_experience?.length) {
        achievements.value = resume.parsed_experience
          .filter(e => e.quantifiable)
          .map(e => e.description)
      }
      if (resume.ai_summary) aiSummary.value = resume.ai_summary
      if (resume.recruiter_tip) recruiterTip.value = resume.recruiter_tip
      lastResumeId = resume.id
    }
  } catch (err) {
    console.error('Error loading existing resume:', err)
  }
}

onMounted(() => { fetchExistingResume() })
</script>

<style scoped>
.page-title { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: var(--gc-dark); margin-bottom: 0.25rem; }
.page-sub { font-size: 0.82rem; color: var(--gc-muted); }
.btn-sm { background: var(--gc-green); color: #fff; padding: 0.35rem 1rem; border-radius: 20px; border: none; font-size: 0.78rem; cursor: pointer; }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--gc-green); border: 1px solid var(--gc-green); padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.78rem; cursor: pointer; }
.content { display: grid; grid-template-columns: 1fr 280px; gap: 1rem; }
.card { background: #fff; border-radius: 10px; border: 0.5px solid #C0DD97; padding: 1rem 1.1rem; margin-bottom: 0.85rem; }
.card-title { font-size: 0.78rem; font-weight: 500; color: var(--gc-dark); margin-bottom: 0.75rem; }
.form-input { width: 100%; border: 0.5px solid #C0DD97; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; font-family: 'DM Sans', sans-serif; color: var(--gc-dark); background: #fff; outline: none; }
.form-input:focus { border-color: var(--gc-green); }
.upload-status { margin-top: 0.75rem; font-size: 0.75rem; padding: 0.5rem; border-radius: 8px; }
.status-success { background: var(--gc-green-light); color: var(--gc-green); }
.status-error { background: #FEF0F0; color: #B03030; }
.upload-steps { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; }
.step { font-size: 0.72rem; color: #B4B2A9; padding: 0.25rem 0; transition: color 0.2s; }
.step.active { color: var(--gc-green); font-weight: 500; }
.step.done { color: #97C459; }
.skills-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.skill-chip { font-size: 0.75rem; background: var(--gc-green-light); color: var(--gc-green); padding: 4px 12px; border-radius: 20px; }
.quant-row { padding: 0.65rem 0; border-bottom: 0.5px solid #EAF3DE; font-size: 0.8rem; color: var(--gc-muted); line-height: 1.6; }
.quant-row:last-child { border-bottom: none; }
.ai-summary { font-size: 0.82rem; color: var(--gc-muted); line-height: 1.7; }
.ai-tip { background: var(--gc-green-light); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.85rem; }
.ai-tip-label { font-size: 0.72rem; font-weight: 500; color: var(--gc-green); margin-bottom: 0.35rem; }
.ai-tip-body { font-size: 0.75rem; color: var(--gc-muted); line-height: 1.6; }
</style>
