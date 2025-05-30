[**frontend**](../../README.md)

***

[frontend](../../README.md) / [LoginLogic](../README.md) / useLogin

# Function: useLogin()

> **useLogin**(): `object`

Defined in: src/composables/LoginLogic.ts:10

Function to handle login/logout logic

## Returns

### errorMessage

> **errorMessage**: `Ref`\<`string`, `string`\>

### formData

> **formData**: `object`

#### formData.password

> **password**: `string` = `""`

#### formData.username

> **username**: `string` = `""`

### handleSubmit()

> **handleSubmit**: () => `Promise`\<`void`\>

Function to handle a user trying to log in

#### Returns

`Promise`\<`void`\>

### isLoggedIn()

> **isLoggedIn**: () => `Promise`\<`boolean`\>

Function to check if the user is logged in

#### Returns

`Promise`\<`boolean`\>

- Returns true if the user is logged in, false otherwise

### loggedIn

> **loggedIn**: `Ref`\<`boolean`, `boolean`\>

### login()

> **login**: () => `void`

Function to handle login redirection

#### Returns

`void`

### logout()

> **logout**: () => `Promise`\<`void`\>

Function to handle logout

#### Returns

`Promise`\<`void`\>

### showError

> **showError**: `Ref`\<`boolean`, `boolean`\>
