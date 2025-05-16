// src/composables/PermissionsLogic.ts
import { all } from 'axios'
import { ref } from 'vue'

const userPermissions = ref<Set<string>>(new Set())
const userGroups = ref<Set<string>>(new Set())
const isSuperuser = ref(false)
const loaded = ref(false)

export function permissionsLogic() {

    const fetchPermissions = async () => {
        const res = await fetch('/api/user-permissions/', {
            credentials: 'same-origin',
        })

        if (res.ok) {
            const data = await res.json()
            userPermissions.value = new Set(data.permissions)
            userGroups.value = new Set(data.groups)
            isSuperuser.value = data.is_superuser
            loaded.value = true
        } else {
            console.error('Failed to fetch user permissions')
        }
    }

    const hasPermission = (perm: string) => {
        return isSuperuser.value || userPermissions.value.has(perm)
    }

    const allPermissions = () => {
        return Array.from(userPermissions.value)
    }

    const inGroup = (group: string) => {
        return userGroups.value.has(group)
    }

    return {
        fetchPermissions,
        hasPermission,
        inGroup,
        isSuperuser,
        loaded,
        allPermissions,
    }
}

//Usage example
// import { permissionsLogic } from '@/composables/PermissionsLogic.ts'
//
// const {
//     fetchPermissions,
//     hasPermission,
//     inGroup,
//     loaded
// } = permissionsLogic()
//
// onMounted(async () => {
//   await fetchPermissions()
// })
