[**frontend**](../../README.md)

***

[frontend](../../README.md) / [PermissionsLogic](../README.md) / permissionsLogic

# Function: permissionsLogic()

> **permissionsLogic**(): `object`

Defined in: src/composables/PermissionsLogic.ts:25

Function to manage user permissions and groups

## Returns

### allPermissions()

> **allPermissions**: () => `string`[]

Returns all permissions of the user

#### Returns

`string`[]

an array of all permissions

### fetchPermissions()

> **fetchPermissions**: () => `Promise`\<`void`\>

Fetches the permissions and groups of the user

#### Returns

`Promise`\<`void`\>

### hasPermission()

> **hasPermission**: (`perm`) => `boolean`

Checks if the user has a specific permission

#### Parameters

##### perm

`string`

the permission to check

#### Returns

`boolean`

true if the user has the permission, false otherwise

### inGroup()

> **inGroup**: (`group`) => `boolean`

Checks if the user is in a specific group

#### Parameters

##### group

`string`

the group to check

#### Returns

`boolean`

true if the user is in the group, false otherwise

### isSuperuser

> **isSuperuser**: `Ref`\<`boolean`, `boolean`\>

### loaded

> **loaded**: `Ref`\<`boolean`, `boolean`\>

## Example
