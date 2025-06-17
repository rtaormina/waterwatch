// django-vue/frontend/src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useSession } from "../composables/useSession";

const routes = [
    {
        path: "/login",
        name: "Login",
        /** */
        component: () => import("@/components/LoginComponent.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/",
        alias: ["/home"],
        name: "Map",
        /** */
        component: () => import("@/views/MapView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/measurements",
        name: "Measurement",
        /** */
        component: () => import("@/components/MeasurementComponent.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/export",
        alias: ["/data"],
        name: "Export",
        /** */
        component: () => import("@/views/ExportView.vue"),
        meta: {
            requiresAuth: true,
            requiredGroups: ["researcher", "admin", "staff"],
        },
    },
    {
        path: "/export/map",
        alias: ["/data/map"],
        name: "ExportMap",
        /**
         *
         */
        component: () => import("@/views/ExportMapView.vue"),
        meta: {
            requiresAuth: true,
            requiredGroups: ["researcher", "admin", "staff"],
        },
    },
    {
        path: "/tutorial",
        name: "Tutorial",
        /** */
        component: () => import("@/views/TutorialView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/about",
        name: "About",
        /** */
        component: () => import("@/views/AboutView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/contact",
        name: "Contact",
        /** */
        component: () => import("@/views/ContactView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/unauthenticated",
        name: "Unauthenticated",
        /** */
        component: () => import("@/views/UnauthenticatedView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/unauthorized",
        name: "Unauthorized",
        /** */
        component: () => import("@/views/UnauthorizedView.vue"),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/:pathMatch(.*)*",
        /** */
        component: () => import("@/views/PageNotFound.vue"),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    strict: false,
});

const session = useSession();

router.beforeEach(async (to) => {
    // Group‐based auth
    const requiredGroups = to.meta.requiredGroups as string[] | undefined;
    if (requiredGroups?.length) {
        const userGroups = await session.getUserGroups();
        const ok = requiredGroups.some((g) => userGroups.includes(g));
        return ok ? true : { name: "Unauthorized" };
    }

    // General auth
    if (to.meta.requiresAuth) {
        const ok = await session.isAuthenticated();
        return ok ? true : { name: "Unauthenticated" };
    }

    // Public route
    return true;
});

export default router;
