import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getActiveJobs, getEmployerJobs } from '@/api/jobs'
import { getStudentApplications, getSavedJobs } from '@/api/applications'

export const useJobsStore = defineStore('jobs', () => {
  const activeJobs = ref([])
  const employerJobs = ref([])
  const myApplications = ref([])
  const savedJobs = ref([])
  const loading = ref(false)

  async function fetchActiveJobs() {
    loading.value = true
    try { activeJobs.value = await getActiveJobs() }
    finally { loading.value = false }
  }

  async function fetchEmployerJobs(employerId) {
    loading.value = true
    try { employerJobs.value = await getEmployerJobs(employerId) }
    finally { loading.value = false }
  }

  async function fetchStudentApplications(studentId) {
    myApplications.value = await getStudentApplications(studentId)
  }

  async function fetchSavedJobs(studentId) {
    savedJobs.value = await getSavedJobs(studentId)
  }

  function isApplied(jobId) {
    return myApplications.value.some(a => a.job_id === jobId)
  }

  function isSaved(jobId) {
    return savedJobs.value.some(j => j?.id === jobId)
  }

  return {
    activeJobs, employerJobs, myApplications, savedJobs, loading,
    fetchActiveJobs, fetchEmployerJobs, fetchStudentApplications,
    fetchSavedJobs, isApplied, isSaved
  }
})