// tests/unit/ComponentTests/NavBarComponent/NavBarComponent.spec.ts
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory, Router } from "vue-router";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Navbar from "../../../../src/components/NavBar.vue";
import { nextTick } from "vue";

// stub out <Transition> so v-if toggles happen immediately
const TransitionStub = {
    render(this: any) {
        return this.$slots.default?.();
    },
};

// -- composable mock setup ------------------------------------------------
const loginMock = vi.fn();
const logoutMock = vi.fn();
let loggedInFlag = false;

// Single mock for useLogin, reading the mutable loggedInFlag
vi.mock("../../../../src/composables/LoginLogic", () => ({
    useLogin: () => ({
        login: loginMock,
        logout: logoutMock,
        // make sure this reads the latest value per-test
        get loggedIn() {
            return loggedInFlag;
        },
    }),
}));
// --------------------------------------------------------------------------

// navItems from the component
const navItems = [
    { label: "Map", to: "/", name: "Map" },
    { label: "Tutorial", to: "/tutorial", name: "Tutorial" },
    { label: "Data", to: "/export", name: "Export" },
    { label: "About", to: "/about", name: "About" },
    { label: "Contact", to: "/contact", name: "Contact" },
];

// build a router with all the needed routes, including /login and /register
function makeRouter(): Router {
    const routes = [
        // the main nav items
        ...navItems.map((item) => ({
            path: item.to,
            name: item.name,
            component: { template: `<div>${item.name}</div>` },
        })),
        // login & register pages
        {
            path: "/login",
            name: "Login",
            component: { template: "<div>Login Page</div>" },
        },
        {
            path: "/register",
            name: "Register",
            component: { template: "<div>Register Page</div>" },
        },
    ];
    const router = createRouter({
        history: createMemoryHistory(),
        routes,
    });
    router.push("/");
    return router;
}

describe("Navbar.vue", () => {
    let router: Router;

    beforeEach(async () => {
        // fresh router
        router = makeRouter();
        await router.isReady();

        // reset the composable flags & mocks
        loggedInFlag = false;
        loginMock.mockReset();
        logoutMock.mockReset();

        // default environment: desktop
        Object.defineProperty(window, "innerWidth", {
            value: 1024,
            writable: true,
            configurable: true,
        });
    });

    it("renders desktop nav when width ≥ 1024", async () => {
        window.innerWidth = 1024;
        const wrapper = mount(Navbar, {
            global: {
                plugins: [router],
                stubs: { Transition: TransitionStub },
            },
        });
        await nextTick();

        // The .font-custom div concatenates logo + all links
        expect(wrapper.get("div.font-custom").text()).toBe("WATERWATCHMapTutorialDataAboutContact");
        navItems.forEach((item) => {
            expect(wrapper.html()).toContain(item.label);
        });
    });

    it("navigates when desktop link is clicked", async () => {
        window.innerWidth = 1024;
        const wrapper = mount(Navbar, {
            global: {
                plugins: [router],
                stubs: { Transition: TransitionStub },
            },
        });
        await flushPromises();

        const tutorialLink = wrapper.find('a[href="/tutorial"]');
        expect(tutorialLink.exists()).toBe(true);

        await tutorialLink.trigger("click");
        await flushPromises();
        expect(router.currentRoute.value.name).toBe("Tutorial");
    });

    it("toggles mobile overlay when width < 768", async () => {
        window.innerWidth = 500;
        const wrapper = mount(Navbar, {
            global: {
                plugins: [router],
                stubs: { Transition: TransitionStub },
            },
        });
        await nextTick();

        // hidden initially
        expect(wrapper.find(".fixed.inset-0").exists()).toBe(false);

        // open
        const hamburger = wrapper.find('button[aria-label="Toggle menu"]');
        await hamburger.trigger("click");
        await nextTick();
        expect(wrapper.find(".fixed.inset-0").exists()).toBe(true);

        // click Contact
        const overlayLinks = wrapper.findAll(".fixed.inset-0 a");
        const contact = overlayLinks.find((a) => a.text() === "Contact")!;
        await contact.trigger("click");
        await flushPromises();
        expect(router.currentRoute.value.name).toBe("Contact");
        expect(wrapper.find(".fixed.inset-0").exists()).toBe(false); // overlay should close
        // close
        await hamburger.trigger("click");
        await nextTick();
        expect(wrapper.find(".fixed.inset-0").exists()).toBe(true);
    });

    it("updates isMobile on resize", async () => {
        const wrapper = mount(Navbar, {
            global: {
                plugins: [router],
                stubs: { Transition: TransitionStub },
            },
        });
        await nextTick();

        expect(wrapper.find(".relative.z-30").exists()).toBe(true);

        window.innerWidth = 400;
        window.dispatchEvent(new Event("resize"));
        await nextTick();

        expect(wrapper.find(".relative.z-60").exists()).toBe(true);
    });

    it("shows login icon when logged out and routes to Login", async () => {
        // simulate that login() actually pushes to the named route
        loginMock.mockImplementation(() => {
            return router.push({ name: "Login" });
        });

        window.innerWidth = 1024;
        const wrapper = mount(Navbar, {
            global: {
                plugins: [router],
                stubs: { Transition: TransitionStub },
            },
        });
        await nextTick();

        // desktop shows a svg.user-icon when loggedOut
        const userIcon = wrapper.find("svg.w-7.h-10");
        expect(userIcon.exists()).toBe(true);

        await userIcon.trigger("click");
        await flushPromises();

        // login() was called, and router went to Login
        expect(router.currentRoute.value.name).toBe("Login");
    });

    it("shows logout link when logged in and routes to home + calls logout", async () => {
        // mark as logged in
        loggedInFlag = true;

        // mount in mobile so overlay appears
        window.innerWidth = 500;
        const wrapper = mount(Navbar, {
            global: {
                plugins: [router],
                stubs: { Transition: TransitionStub },
            },
        });
        await nextTick();

        // open overlay
        const hamburger = wrapper.find('button[aria-label="Toggle menu"]');
        await hamburger.trigger("click");
        await nextTick();

        // find Logout link
        const logoutLink = wrapper.findAll(".fixed.inset-0 a").find((a) => a.text() === "Logout");
        expect(logoutLink).toBeTruthy();

        // clicking it should call logout() and navigate to "/"
        logoutMock.mockImplementation(() => {
            // no-op, since the <router-link to="/"> handles navigation
        });
        await logoutLink!.trigger("click");
        await flushPromises();

        expect(logoutMock).toHaveBeenCalled();
        // "/" is named "Map"
        expect(router.currentRoute.value.name).toBe("Map");
    });
});
