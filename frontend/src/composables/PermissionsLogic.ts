// src/composables/PermissionsLogic.ts
import { ref } from "vue";

const userPermissions = ref<Set<string>>(new Set());
const userGroups = ref<Set<string>>(new Set());
const isSuperuser = ref(false);
const loaded = ref(false);

/**
 * Function to manage user permissions and groups
 *
 * @example ```ts
 * import { permissionsLogic } from '@/composables/PermissionsLogic.ts'
 * const {
 *     fetchPermissions,
 *     hasPermission,
 *     inGroup,
 *     loaded
 * } = permissionsLogic()
 * onMounted(async () => {
 *     await fetchPermissions()
 * })
 * ```
 */
export function permissionsLogic() {
    /**
     * Fetches the permissions and groups of the user
     */
    const fetchPermissions = async () => {
        const res = await fetch("/api/user-permissions/", {
            credentials: "same-origin",
        });

        if (res.ok) {
            const data = await res.json();
            userPermissions.value = new Set(data.permissions);
            userGroups.value = new Set(data.groups);
            isSuperuser.value = data.is_superuser;
            loaded.value = true;
        } else {
            console.error("Failed to fetch user permissions");
        }
    };

    /**
     * Checks if the user has a specific permission
     *
     * @param {string} perm - the permission to check
     * @returns {boolean} true if the user has the permission, false otherwise
     */
    const hasPermission = (perm: string) => {
        return isSuperuser.value || userPermissions.value.has(perm);
    };

    /**
     * Returns all permissions of the user
     *
     * @returns {string[]} an array of all permissions
     */
    const allPermissions = () => {
        return Array.from(userPermissions.value);
    };

    /**
     * Checks if the user is in a specific group
     *
     * @param {string} group - the group to check
     * @returns {boolean} true if the user is in the group, false otherwise
     */
    const inGroup = (group: string) => {
        return userGroups.value.has(group);
    };

    return {
        fetchPermissions,
        hasPermission,
        inGroup,
        isSuperuser,
        loaded,
        allPermissions,
    };
}
