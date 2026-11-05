# Realtime protocol

All sockets authenticate with the simplejwt access token in the query string:
`ws(s)://<host>/ws/<path>?token=<access>`. Invalid or missing tokens are accepted
then immediately closed after an `unauthorized` / `error` frame.

## Notifications: `/ws/notification-server/<anything>/`

The server identifies the user from the token; the path segment is ignored (the client sends `me`).

Server frames (JSON):

| field                                                               | notes                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `type`                                                              | `"notification"`                                             |
| `message`                                                           | display text                                                 |
| `sender_image`, `datetime`, `count`, `dm_count`                     | badge counters come from `count` / `dm_count`                |
| one of `comment`, `favourite`, `reaction`, `mention`, `post_upload` | `{ post_id }`                                                |
| `follow`, `follow_request`                                          | `{ user_id }`                                                |
| `chat_room`                                                         | `{ chat_room, uuid, user }` where `chat_room` is the room id |
| `dm_request`                                                        | `{ room_id }`                                                |
| `thread`                                                            | `{ thread_id }`                                              |

## Chat: `/ws/chat/<room_id>/`

Client sends: `{ "message": "<text up to 1000 chars>" }`.

Server frames:

- `{ type: "chat", uuid, message, user, datetime }` broadcast to everyone in the room, **including the sender** (used to replace the optimistic copy).
- `{ type: "chat_status", uuid, status: [<user uuid that saw it>, ...] }`.
- `{ type: "online_users", users: [{ uuid, username }] }` (only users with active status enabled).
- `{ type: "error" | "Invalid_room_id" | "user_blocked", message }`.

Message body conventions: plain text, `[<postId>][post]` for a shared post, `[<url>][image]` for an image.

History and room lists are plain HTTP (`GET /api/chat/get_message/?room_id=`, `GET /api/chat/list_rooms/`);
`POST /api/chat/send_message/` is the offline fallback.

## Push

`POST /api/chat/device_token/ { token, platform }` registers an Expo push token; `DELETE` with `{ token }` removes it.
`UserNotification.save()` fans every notification out through Expo's push service (`chat/push.py`).
