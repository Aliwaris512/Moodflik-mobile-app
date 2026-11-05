import { describe, expect, test } from 'bun:test';
import { authService, feedService, profileService } from './repositories';

describe('Moodflik mock services', () => {
  test('auth service rejects invalid credentials', async () => {
    await expect(authService.signIn('invalid', '123')).rejects.toThrow();
  });

  test('feed service returns page metadata', async () => {
    const page = await feedService.list();
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.nextCursor).toBeNull();
  });

  test('profile search is case insensitive', async () => {
    const page = await profileService.listUsers('MAYA');
    expect(page.items[0]?.username).toBe('maya.j');
  });
});
