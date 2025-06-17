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

// Initialize session early - this sets the CSRF token
// Wait for this to complete before setting up router guards
let sessionInitialized = false;
const initPromise = session
    .initializeSession()
    .then(() => {
        sessionInitialized = true;
    })
    .catch((err) => {
        console.error("Failed to initialize session:", err);
        sessionInitialized = true; // Still allow app to continue
    });

router.beforeEach(async (to) => {
    // Ensure session is initialized before checking auth
    if (!sessionInitialized) {
        await initPromise;
    }

    try {
        // Group-based auth
        const requiredGroups = to.meta.requiredGroups as string[] | undefined;
        if (requiredGroups?.length) {
            // Get fresh session data to avoid cache issues
            const currentSession = await session.getSession();
            const hasRequiredGroup = requiredGroups.some((requiredGroup) =>
                currentSession.groups.includes(requiredGroup),
            );

            if (!hasRequiredGroup) {
                return { name: "Unauthorized" };
            }
        }

        // General auth check
        if (to.meta.requiresAuth) {
            const isAuth = await session.isAuthenticated();
            if (!isAuth) {
                return { name: "Unauthenticated" };
            }
        }

        // Public route or authorized
        return true;
    } catch (error) {
        console.error("Error in router guard:", error);
        // On error, redirect to safe page
        return { name: "Unauthenticated" };
    }
});

export default router;
