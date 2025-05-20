// django-vue/frontend/src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/components/LoginComponent.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: "/",
    name: "Map",
    component: () => import("@/views/MapView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: "/measurements",
    name: "Measurement",
    component: () => import("@/components/MeasurementComponent.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: "/export",
    name: "Export",
    component: () => import("@/views/ExportView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !cookies.get("sessionid")) {
    return { name: "Login" };
  }
});

export default router;
