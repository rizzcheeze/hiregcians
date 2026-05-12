import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/Landing.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue')
  },
{
  path: '/terms',
  name: 'Terms',
  component: () => import('@/views/Terms.vue')
},
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/Privacy.vue')
  },
  {
    path: '/students/:id',
    name: 'PublicStudentProfile',
    component: () => import('@/views/public/StudentProfile.vue'),
    meta: { showShell: false }
  },
  {
    path: '/companies/:id',
    name: 'PublicCompanyProfile',
    component: () => import('@/views/public/CompanyProfile.vue'),
    meta: { showShell: false }
  },
  // Student routes
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: () => import('@/views/student/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/jobs',
    name: 'StudentJobs',
    component: () => import('@/views/student/JobBrowse.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/applications',
    name: 'StudentApplications',
    component: () => import('@/views/student/Applications.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/saved',
    name: 'StudentSavedJobs',
    component: () => import('@/views/student/SavedJobs.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/profile',
    name: 'StudentProfile',
    component: () => import('@/views/student/Profile.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },

  {
    path: '/student/resume',
    name: 'StudentResume',
    component: () => import('@/views/student/Resume.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/settings',
    name: 'StudentSettings',
    component: () => import('@/views/student/Settings.vue'),
    meta: { requiresAuth: true, role: 'student' }
  },

  // Employer routes
  {
    path: '/employer/dashboard',
    name: 'EmployerDashboard',
    component: () => import('@/views/employer/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/jobs',
    name: 'EmployerJobs',
    component: () => import('@/views/employer/JobList.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/jobs/create',
    name: 'EmployerJobCreate',
    component: () => import('@/views/employer/JobCreate.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/applicants',
    name: 'EmployerApplicants',
    component: () => import('@/views/employer/Applicants.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/profile',
    name: 'EmployerProfile',
    component: () => import('@/views/employer/Profile.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/settings',
    name: 'EmployerSettings',
    component: () => import('@/views/employer/Settings.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/company',
    name: 'EmployerCompany',
    component: () => import('@/views/employer/CompanyProfile.vue'),
    meta: { requiresAuth: true, role: 'employer' }
  },
  {
    path: '/employer/public-company',
    name: 'EmployerPublicCompany',
    component: () => import('@/views/public/CompanyProfile.vue'),
    meta: { requiresAuth: true, role: 'employer', showShell: false }
  },

  // Admin routes
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/Users.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/listings',
    name: 'AdminListings',
    component: () => import('@/views/admin/Listings.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/applications',
    name: 'AdminApplications',
    component: () => import('@/views/admin/Applications.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/ai-logs',
    name: 'AdminAiLogs',
    component: () => import('@/views/admin/AiLogs.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/employers',
    name: 'AdminEmployers',
    component: () => import('@/views/admin/Employers.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },

  // Add these to your admin routes section
{
  path: '/admin/announcements',
  name: 'AdminAnnouncements',
  component: () => import('@/views/admin/Announcements.vue'),
  meta: { requiresAuth: true, role: 'admin' }
},
{
  path: '/admin/reports',
  name: 'AdminReports',
  component: () => import('@/views/admin/Reports.vue'),
  meta: { requiresAuth: true, role: 'admin' }
},
{
  path: '/admin/settings',
  name: 'AdminSettings',
  component: () => import('@/views/admin/Settings.vue'),
  meta: { requiresAuth: true, role: 'admin' }
},
{
  path: '/admin/audit-logs',
  name: 'AdminAuditLogs',
  component: () => import('@/views/admin/AuditLogs.vue'),
  meta: { requiresAuth: true, role: 'admin' }
},

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const redirectToDashboard = (role) => {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'employer') return '/employer/dashboard'
  return '/student/dashboard'
}

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Wait for auth to finish initializing
  if (auth.loading) {
    await new Promise(resolve => {
      const stop = setInterval(() => {
        if (!auth.loading) {
          clearInterval(stop)
          resolve()
        }
      }, 50)
    })
  }

  const loggedIn = auth.isLoggedIn()
  const userRole = auth.role

  const publicRoutes = ['/', '/about', '/login', '/register']

  if (publicRoutes.includes(to.path)) {
    // If already logged in and trying to hit a public route, send to their dashboard
    if (loggedIn && to.path === '/') {
      next(redirectToDashboard(userRole))
      return
    }
    next()
    return
  }

  if (to.meta.requiresAuth) {
    if (!loggedIn) {
      next('/')
      return
    }

    // If the route's required role doesn't match the user's actual role, redirect correctly
    if (to.meta.role && to.meta.role !== userRole) {
      next(redirectToDashboard(userRole))
      return
    }
  }

  next()
})

export default router
