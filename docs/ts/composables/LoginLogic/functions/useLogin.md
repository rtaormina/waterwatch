[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/LoginLogic](../README.md) / useLogin

# Function: useLogin()

> **useLogin**(): `object`

Defined in: src/composables/LoginLogic.ts:7

## Returns

`object`

### errorMessage

> **errorMessage**: `Ref`\<`string`, `string`\>

### formData

> **formData**: `object`

#### formData.password

> **password**: `string` = `''`

#### formData.username

> **username**: `string` = `''`

### handleSubmit()

> **handleSubmit**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### isLoggedIn()

> **isLoggedIn**: () => `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

### loggedIn

> **loggedIn**: `Ref`\<`boolean`, `boolean`\>

### login()

> **login**: () => `void`

#### Returns

`void`

### logout()

> **logout**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### showError

> **showError**: `Ref`\<`boolean`, `boolean`\>
