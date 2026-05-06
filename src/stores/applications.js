import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useApplicationsStore = defineStore('applications', () => {
  const refreshTrigger = ref(0)
  
  const triggerRefresh = () => {
    refreshTrigger.value++
  }
  
  return { refreshTrigger, triggerRefresh }
})