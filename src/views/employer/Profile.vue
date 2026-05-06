<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10">
    <div class="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-8">
      <h2 class="text-2xl font-bold text-green-700 mb-1">Company Profile</h2>
      <p class="text-gray-500 text-sm mb-6">Help students learn more about your company.</p>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            v-model="form.company_name"
            type="text"
            required
            placeholder="e.g. Acme Corporation"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            v-model="form.industry"
            type="text"
            placeholder="e.g. Information Technology"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            v-model="form.website"
            type="url"
            placeholder="https://yourcompany.com"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="Tell students what your company does..."
            class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <p v-if="success" class="text-green-600 text-sm">{{ success }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : 'Save Profile' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <router-link to="/employer/dashboard" class="text-sm text-green-600 hover:underline">
          ← Back to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  company_name: '',
  industry: '',
  website: '',
  description: '',
})

onMounted(async () => {
  const { data } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single()
  if (data) {
    form.value.company_name = data.company_name ?? ''
    form.value.industry = data.industry ?? ''
    form.value.website = data.website ?? ''
    form.value.description = data.description ?? ''
  }
})

async function handleSave() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const { error: err } = await supabase
      .from('employer_profiles')
      .upsert({
        id: auth.user.id,
        company_name: form.value.company_name,
        industry: form.value.industry,
        website: form.value.website,
        description: form.value.description,
        updated_at: new Date().toISOString(),
      })
    if (err) throw err
    success.value = 'Profile saved successfully!'
  } catch (err) {
    error.value = err.message || 'Failed to save profile.'
  } finally {
    loading.value = false
  }
}
</script>