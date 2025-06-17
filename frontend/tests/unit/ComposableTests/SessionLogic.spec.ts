import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSession } from '../../../src/composables/useSession';

type SessionData = { isAuthenticated: boolean; groups: string[] };

// Helper to mock fetch response
const mockFetchResponse = (status: number, body: Partial<SessionData> | null, shouldReject = false) => {
  if (shouldReject) {
    vi.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.reject(new Error('network error')) as any);
  } else {
    const json = body ? Promise.resolve(body) : Promise.resolve({});
    const response = {
      ok: status >= 200 && status < 300,
      status,
      json: () => json,
    };
    vi.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.resolve(response as any));
  }
};

describe('useSession', () => {
  let session: ReturnType<typeof useSession>;

  beforeEach(() => {
    session = useSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch session and return authentication and groups', async () => {
    const data = { isAuthenticated: true, groups: ['admin', 'researcher'] };
    mockFetchResponse(200, data);

    const isAuth = await session.isAuthenticated();
    expect(isAuth).toBe(true);

    // fetchSession is cached, so getUserGroups should not trigger a new fetch
    const groups = await session.getUserGroups();
    expect(groups).toEqual(['admin', 'researcher']);
  });

  it('should cache the fetch session promise and call fetch only once', async () => {
    const data = { isAuthenticated: false, groups: ['researcher'] };
    mockFetchResponse(200, data);

    // Call multiple times
    const [auth1, auth2, groups1, groups2] = await Promise.all([
      session.isAuthenticated(),
      session.isAuthenticated(),
      session.getUserGroups(),
      session.getUserGroups(),
    ]);

    expect(auth1).toBe(false);
    expect(auth2).toBe(false);
    expect(groups1).toEqual(['researcher']);
    expect(groups2).toEqual(['researcher']);
    // fetch should have been called only once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should treat non-OK response as failure and return defaults', async () => {
    mockFetchResponse(500, null);

    const isAuth = await session.isAuthenticated();
    const groups = await session.getUserGroups();

    expect(isAuth).toBe(false);
    expect(groups).toEqual([]);
  });

  it('should handle network errors and return defaults', async () => {
    mockFetchResponse(0, null, true);

    const isAuth = await session.isAuthenticated();
    const groups = await session.getUserGroups();

    expect(isAuth).toBe(false);
    expect(groups).toEqual([]);
  });

  it('should include credentials option on fetch', async () => {
    const data = { isAuthenticated: true, groups: [] };
    mockFetchResponse(200, data);

    await session.isAuthenticated();

    // Inspect the arguments fetch was called with
    expect(global.fetch).toHaveBeenCalledWith('/api/session/', { credentials: 'same-origin' });
  });
});
