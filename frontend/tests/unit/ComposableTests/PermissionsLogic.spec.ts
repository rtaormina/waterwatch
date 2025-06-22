import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Dynamically import to reset module state per test
const importModule = async () => {
  const module = await import('../../../src/composables/PermissionsLogic.ts');
  return module;
};

describe('permissionsLogic', () => {
  let permissionsLogic: ReturnType<Awaited<ReturnType<typeof importModule>>['permissionsLogic']>;
  let isSuperuser: { value: boolean };
  let loaded: { value: boolean };
  let hasPermission: (perm: string) => boolean;
  let inGroup: (group: string) => boolean;
  let allPermissions: () => string[];

  // Helper to mock fetch
  const mockFetch = (status: number, body: any, ok = true) => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    } as any);
  };

  beforeEach(async () => {
    vi.resetModules();
    const module = await importModule();
    const logic = module.permissionsLogic();
    permissionsLogic = logic;
    ({ isSuperuser, loaded } = logic);
    hasPermission = logic.hasPermission;
    inGroup = logic.inGroup;
    allPermissions = logic.allPermissions;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchPermissions sets permissions, groups, superuser, and loaded on success', async () => {
    const data = { permissions: ['read', 'write'], groups: ['admin'], is_superuser: true };
    mockFetch(200, data);

    await permissionsLogic.fetchPermissions();
    expect(allPermissions().sort()).toEqual(['read', 'write']);
    expect(inGroup('admin')).toBe(true);
    expect(isSuperuser.value).toBe(true);
    expect(loaded.value).toBe(true);
  });

  it('hasPermission returns true for superuser regardless of specific permission', async () => {
    const data = { permissions: [], groups: [], is_superuser: true };
    mockFetch(200, data);

    await permissionsLogic.fetchPermissions();
    expect(isSuperuser.value).toBe(true);
    expect(hasPermission('anything')).toBe(true);
  });

  it('hasPermission checks specific permissions when not superuser', async () => {
    const data = { permissions: ['edit'], groups: [], is_superuser: false };
    mockFetch(200, data);

    await permissionsLogic.fetchPermissions();
    expect(isSuperuser.value).toBe(false);
    expect(hasPermission('edit')).toBe(true);
    expect(hasPermission('delete')).toBe(false);
  });

  it('inGroup returns false when group not present', async () => {
    const data = { permissions: [], groups: ['users'], is_superuser: false };
    mockFetch(200, data);

    await permissionsLogic.fetchPermissions();
    expect(inGroup('admin')).toBe(false);
  });

  it('allPermissions returns empty array when no permissions', async () => {
    const data = { permissions: [], groups: [], is_superuser: false };
    mockFetch(200, data);

    await permissionsLogic.fetchPermissions();
    expect(allPermissions()).toEqual([]);
  });

  it('does not set loaded or other state on non-OK response and logs error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(500, {}, false);

    await permissionsLogic.fetchPermissions();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch user permissions');
    expect(loaded.value).toBe(false);
    expect(isSuperuser.value).toBe(false);
    expect(allPermissions()).toEqual([]);
    expect(inGroup('any')).toBe(false);
  });

  it('propagates network errors from fetchPermissions', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'));

    await expect(permissionsLogic.fetchPermissions()).rejects.toThrow('network error');
    // After rejection, state remains unchanged
    expect(loaded.value).toBe(false);
    expect(isSuperuser.value).toBe(false);
  });

  it('uses credentials option on fetch', async () => {
    const data = { permissions: [], groups: [], is_superuser: false };
    mockFetch(200, data);

    await permissionsLogic.fetchPermissions();
    expect(global.fetch).toHaveBeenCalledWith('/api/user-permissions/', { credentials: 'same-origin' });
  });
});
