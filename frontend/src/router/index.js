// django-vue/frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
 {
  path: '/home',
  name: 'Home',
  component: () => import('@/views/HomeView.vue'),
  meta: {
   requiresAuth: true,
  }
 },
 {
  path: '/',
  name: 'Login',
  component: () => import('@/components/LoginComponent.vue'),
  meta: {
   requiresAuth: false,
  }
 },
 {
    path: '/measurements',
    name: 'Measurement',
    component: () => import('@/components/MeasurementComponent.vue'),
    meta: {
     requiresAuth: false,
    }
   },
  {
  path: '/export',
  name: 'Export',
  component: () => import('@/views/ExportView.vue'),
  meta: {
    requiresAuth: false,
  }
 },
]

const router = createRouter({
 history: createWebHistory(),
 routes
})

router.beforeEach((to, from) => {
 if (to.meta.requiresAuth) {
  return { name: 'Login' }
 }
})

export default router;
