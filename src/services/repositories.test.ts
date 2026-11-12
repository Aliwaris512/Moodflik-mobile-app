import { describe, expect, test } from 'bun:test';
import { extractMessage } from './errors';
import {
  mapMessage,
  mapNotification,
  mapPost,
  mapRoom,
  mapUser,
  notificationKind,
  parseServerDate,
  timeAgo,
  toIsoDate,
} from './mappers';

describe('error messages', () => {
  test('reads the message from each shape the backend uses', () => {
    expect(extractMessage({ message: 'Password is incorrect' }, 'x')).toBe('Password is incorrect');
    expect(extractMessage({ detail: 'Token is invalid' }, 'x')).toBe('Token is invalid');
    expect(extractMessage({ username: ['Username already present'] }, 'x')).toBe(
      'Username already present',
    );
    expect(extractMessage('Cannot follow yourself', 'x')).toBe('Cannot follow yourself');
  });

  test('falls back for html error pages and empty bodies', () => {
    expect(extractMessage('<html>500</html>', 'Server error')).toBe('Server error');
    expect(extractMessage(null, 'Fallback')).toBe('Fallback');
  });
});

describe('dates', () => {
  test('treats server timestamps as UTC', () => {
    expect(parseServerDate('2026-01-02 03:04:05')?.toISOString()).toBe('2026-01-02T03:04:05.000Z');
    expect(parseServerDate('2026-01-02T03:04:05Z')?.toISOString()).toBe('2026-01-02T03:04:05.000Z');
    expect(parseServerDate('not a date')).toBeNull();
  });

  test('formats relative times', () => {
    const now = new Date('2026-01-02T12:00:00Z');
    expect(timeAgo('2026-01-02 11:55:00', now)).toBe('5 mins ago');
    expect(timeAgo('2026-01-02 09:00:00', now)).toBe('3 hrs ago');
    expect(timeAgo('2026-01-01 11:00:00', now)).toBe('Yesterday');
  });

  test('converts the sign-up date to ISO', () => {
    expect(toIsoDate('12/04/1995')).toBe('1995-04-12');
  });
});

describe('mappers', () => {
  test('maps a user', () => {
    const user = mapUser(
      {
        uuid: 'u1',
        username: 'maya',
        first_name: 'Maya',
        last_name: 'J',
        city: 'London',
        me: 'calm',
      },
      { followers: 3, following: 4 },
    );
    expect(user).toMatchObject({
      id: 'u1',
      displayName: 'Maya J',
      location: 'London',
      threeWords: 'calm',
      followers: 3,
      following: 4,
    });
  });

  test('maps a post and flags my own', () => {
    const raw = {
      uuid: 'p1',
      posted_by: 'u1',
      user: 'maya',
      first_name: 'Maya',
      last_name: 'J',
      created_at: '2026-01-01 10:00:00',
      posted_time: '2 hours ago',
      content: 'Tea',
      post_type: 'dislike',
      mood_type: 'I dislike',
      why_content: 'cold',
      media_url: 'http://x/y.mp4',
      like_count: 2,
      dislike_count: 1,
      comments_count: 5,
      is_like: true,
    };
    const mine = mapPost(raw, 'u1');
    expect(mine.mine).toBe(true);
    expect(mine.type).toBe('dislike');
    expect(mine.reacted).toBe('like');
    expect(mine.media?.[0].type).toBe('video');
    expect(mapPost(raw, 'someone-else').mine).toBe(false);
  });

  test('turns notification sentences into titles and kinds', () => {
    const base = {
      uuid: 'n1',
      message: 'bob reacted to your post.',
      seen: false,
      datetime: '2026-01-01 10:00:00',
      from_user: { uuid: 'u2', username: 'bob' },
      post_id: 'p1',
      post_content: 'Tea',
      comment_text: null,
      chat_room: null,
    };
    const reaction = mapNotification({
      ...base,
      notification_type: 'reaction',
      follow_request: null,
    });
    expect(reaction.title).toBe('reacted to your post.');
    expect(reaction.kind).toBe('reaction');
    expect(reaction.body).toBe('Tea');
    const request = { request_id: 'r1', status: 'pending', incoming: true };
    expect(notificationKind({ notification_type: 'friend_request', follow_request: request })).toBe(
      'follow-request',
    );
    expect(
      notificationKind({
        notification_type: 'friend_request',
        follow_request: { ...request, incoming: false },
      }),
    ).toBe('follow');
  });

  test('maps rooms and messages', () => {
    const room = mapRoom(
      {
        room_id: 'room-1',
        chat_name: 'Maya J',
        image: null,
        date_modified: '2026-01-01 10:00:00',
        unseen_message_count: 2,
        latest_message: 'Hi',
        participants: {
          user: [
            { uuid: 'me', first_name: 'Me', last_name: '', photo_url: null },
            { uuid: 'u2', username: 'maya', first_name: 'Maya', last_name: 'J', photo_url: null },
          ],
        },
      },
      'me',
    );
    expect(room.id).toBe('room-1');
    expect(room.participant.id).toBe('u2');
    expect(room.unreadCount).toBe(2);
    const message = mapMessage(
      { uuid: 'm1', message: 'Hello', datetime: '2026-01-01 10:00:00', user: 'u2' },
      'room-1',
    );
    expect(message).toMatchObject({
      id: 'm1',
      senderId: 'u2',
      body: 'Hello',
      conversationId: 'room-1',
    });
  });
});
