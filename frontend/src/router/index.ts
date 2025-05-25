// django-vue/frontend/src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useSession } from "../composables/useSession";

const routes = [
    {
        path: "/login",
        name: "Login",
        /**
         *
         */
        component: () => import("@/components/LoginComponent.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/",
        name: "Map",
        /**
         *
         */
        component: () => import("@/views/MapView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/measurements",
        name: "Measurement",
        /**
         *
         */
        component: () => import("@/components/MeasurementComponent.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/export",
        name: "Export",
        /**
         *
         */
        component: () => import("@/views/ExportView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/tutorial",
        name: "Tutorial",
        /**
         *
         */
        component: () => import("@/views/TutorialView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/about",
        name: "About",
        /**
         *
         */
        component: () => import("@/views/AboutView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const session = useSession();

router.beforeEach(async (to) => {
    const isAuthenticated = session.isAuthenticated();
    if (to.meta.requiresAuth && !(await isAuthenticated)) {
        return { name: "Login" };
    }
});

export default router;
