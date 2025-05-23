[**frontend**](../../README.md)

***

[frontend](../../modules.md) / [PermissionsLogic](../README.md) / permissionsLogic

# Function: permissionsLogic()

> **permissionsLogic**(): `object`

Defined in: src/composables/PermissionsLogic.ts:25

## Returns

`object`

### allPermissions()

> **allPermissions**: () => `string`[]

#### Returns

`string`[]

### fetchPermissions()

> **fetchPermissions**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### hasPermission()

> **hasPermission**: (`perm`) => `boolean`

#### Parameters

##### perm

`string`

#### Returns

`boolean`

### inGroup()

> **inGroup**: (`group`) => `boolean`

#### Parameters

##### group

`string`

#### Returns

`boolean`

### isSuperuser

> **isSuperuser**: `Ref`\<`boolean`, `boolean`\>

### loaded

> **loaded**: `Ref`\<`boolean`, `boolean`\>
