# Function: useSession()

> **useSession**(): `object`

Defined in: src/composables/useSession.ts:114

Function to handle session information (singleton)

## Returns

### fetchSession()

> **fetchSession**: (`force`) => `Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

Fetches the session information from the server.
This is used to avoid multiple fetch requests for the same session data.

#### Parameters

##### force

`boolean` = `false`

#### Returns

`Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

A promise that resolves to the session information.

### getSession()

> **getSession**: () => `Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

Ensures session is loaded and returns the session data
This is the main method that should be used by consumers

#### Returns

`Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

### getUserGroups()

> **getUserGroups**: () => `Promise`\<`string`[]\>

Gets the groups the user belongs to.

#### Returns

`Promise`\<`string`[]\>

### initializeSession()

> **initializeSession**: () => `Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

Initialize session (fetch CSRF token) - call this early in app lifecycle
This ensures the CSRF token is set before any authentication attempts

#### Returns

`Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

### invalidateSession()

> **invalidateSession**: () => `void`

Invalidates the current session, forcing a new fetch on the next call.
This is useful for logout or session expiration scenarios.

#### Returns

`void`

### isAuthenticated()

> **isAuthenticated**: () => `Promise`\<`boolean`\>

Checks if the user is authenticated.

#### Returns

`Promise`\<`boolean`\>

### refreshSession()

> **refreshSession**: () => `Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>

Refreshes the session by invalidating the current session and fetching a new one.

#### Returns

`Promise`\<\{ `groups`: `string`[]; `isAuthenticated`: `boolean`; \}\>
