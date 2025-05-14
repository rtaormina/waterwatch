import sessionView from "../../src/components/LoginComponent.vue"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { nextTick, ref, type Ref } from "vue";

describe("sessionView Tests", () => {
    beforeEach(() => {
        // Mock the global fetch function
        global.fetch = vi.fn()

        // Spy on console.log
        vi.spyOn(console, 'log')
    })
    it("sets an error and focuses input if val is not a number", async () => {
    });
});
