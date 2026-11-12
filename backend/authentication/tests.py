"""End-to-end API tests for the flows the mobile app relies on."""
import io

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, APITestCase

from authentication.models import ForgotPassword, User


def signup(client, username, email=None, password="Passw0rd!x"):
    email = email or f"{username}@example.com"
    return client.post(
        "/api/user/",
        {
            "username": username,
            "email": email,
            "password": password,
            "first_name": username.title(),
            "last_name": "Tester",
            "date_of_birth": "1995-04-12",
            "gender": "M",
            "terms_confirmed": True,
        },
        format="json",
    )


def login(client, email, password="Passw0rd!x"):
    response = client.post("/api/user/authorize/", {"email": email, "password": password}, format="json")
    assert response.status_code == 200, response.content
    data = response.json()["data"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['accessToken']}")
    return data


class AppFlowTests(APITestCase):
    def make_user(self, username):
        client = APIClient()
        self.assertEqual(signup(client, username).status_code, 200)
        data = login(client, f"{username}@example.com")
        return client, data["uuid"]

    # ------------------------------------------------------------ auth
    def test_signup_login_profile(self):
        client = APIClient()
        response = signup(client, "alice")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertNotIn("password", response.json()["data"])

        duplicate = signup(client, "alice")
        self.assertEqual(duplicate.status_code, 409)

        bad = client.post("/api/user/authorize/", {"email": "alice@example.com", "password": "nope"}, format="json")
        self.assertEqual(bad.status_code, 401)

        data = login(client, "alice@example.com")
        profile = client.get(f"/api/user/{data['uuid']}/")
        self.assertEqual(profile.status_code, 200)
        self.assertNotIn("password", profile.json())

        patch = client.patch(
            f"/api/user/{data['uuid']}/",
            {"bio": "Hello there", "city": "Lahore", "first_name": "Alice", "me": "calm, kind"},
            format="json",
        )
        self.assertEqual(patch.status_code, 200, patch.content)
        self.assertEqual(patch.json()["bio"], "Hello there")

    def test_cannot_edit_someone_elses_profile(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        self.assertEqual(b.patch(f"/api/user/{a_id}/", {"bio": "hacked"}, format="json").status_code, 403)
        self.assertEqual(b.delete(f"/api/user/{a_id}/").status_code, 403)

    def test_unauthenticated_requests_are_rejected(self):
        client = APIClient()
        self.assertEqual(client.get("/api/post/?type=like").status_code, 401)
        self.assertEqual(client.get("/api/usersfilters/").status_code, 401)
        self.assertEqual(client.get("/api/most_seen/").status_code, 200)

    def test_password_reset_flow(self):
        client = APIClient()
        signup(client, "alice")
        missing = client.post("/api/user/request_forgotpassword/", {"email": "ghost@example.com"}, format="json")
        self.assertEqual(missing.status_code, 404)

        sent = client.post("/api/user/request_forgotpassword/", {"email": "alice@example.com"}, format="json")
        self.assertEqual(sent.status_code, 200, sent.content)
        code = ForgotPassword.objects.get(email="alice@example.com").code
        self.assertEqual(len(str(code)), 6)

        wrong = client.post(
            "/api/validate-otp/",
            {"email": "alice@example.com", "code": "000000", "validation_type": "forgot password"},
            format="json",
        )
        self.assertEqual(wrong.status_code, 403)

        valid = client.post(
            "/api/validate-otp/",
            {"email": "alice@example.com", "code": code, "validation_type": "forgot password"},
            format="json",
        )
        self.assertEqual(valid.status_code, 200, valid.content)
        change_code = valid.json()["data"]["otp_code"]

        changed = client.patch(
            "/api/forget_password/",
            {"email": "alice@example.com", "code": change_code, "password": "NewPassw0rd!y"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200, changed.content)
        login(client, "alice@example.com", "NewPassw0rd!y")

    def test_change_password(self):
        client = APIClient()
        signup(client, "alice")
        login(client, "alice@example.com")
        response = client.patch(
            "/api/change_password/",
            {"old_password": "Passw0rd!x", "new_password1": "Another1!pass", "new_password2": "Another1!pass"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        wrong = client.patch(
            "/api/change_password/",
            {"old_password": "bad", "new_password1": "Another1!pass2", "new_password2": "Another1!pass2"},
            format="json",
        )
        self.assertEqual(wrong.status_code, 400)

    def test_deactivate_then_login_reactivates(self):
        client, uid = self.make_user("alice")
        response = client.post(
            f"/api/user/{uid}/account-action/", {"action": "deactivate", "reason": "break"}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        fresh = APIClient()
        login(fresh, "alice@example.com")
        self.assertTrue(User.objects.get(uuid=uid).is_active)

    def test_delete_account(self):
        client, uid = self.make_user("alice")
        response = client.post(
            f"/api/user/{uid}/account-action/", {"action": "delete", "reason": "leaving"}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        again = APIClient().post(
            "/api/user/authorize/", {"email": "alice@example.com", "password": "Passw0rd!x"}, format="json"
        )
        self.assertEqual(again.status_code, 401)

    # ------------------------------------------------------------ posts
    def create_post(self, client, content="A great day", post_type="like", mood="I'm loving"):
        response = client.post(
            "/api/post/",
            {"post_type": post_type, "mood_type": mood, "content": content, "why_content": "because"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()["uuid"]

    def test_post_lifecycle(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        post_id = self.create_post(a)
        self.create_post(a, "Rain again", "dislike", "I dislike")

        feed = b.get("/api/post/?type=like&limit=30")
        self.assertEqual(feed.status_code, 200, feed.content)
        results = feed.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["uuid"], post_id)
        self.assertEqual(results[0]["mood_type"], "I'm loving")
        self.assertEqual(results[0]["user"], "alice")
        self.assertEqual(results[0]["posted_time"], "just now")

        single = b.get(f"/api/post_by_id/{post_id}")
        self.assertEqual(single.status_code, 200, single.content)
        self.assertEqual(single.json()["content"], "A great day")

        # reactions toggle
        react = b.post("/api/reactions/", {"post": post_id, "reaction": "like"}, format="json")
        self.assertEqual(react.status_code, 200, react.content)
        self.assertEqual(react.json()["data"]["like_count"], 1)
        self.assertTrue(b.get(f"/api/post_by_id/{post_id}").json()["is_like"])
        again = b.post("/api/reactions/", {"post": post_id, "reaction": "like"}, format="json")
        self.assertEqual(again.json()["data"]["like_count"], 0)

        # favourites
        self.assertEqual(b.post("/api/favourites/", {"post": post_id}, format="json").status_code, 200)
        favourites = b.get("/api/favourites/?type=like").json()["results"]
        self.assertEqual([p["uuid"] for p in favourites], [post_id])
        b.post("/api/favourites/", {"post": post_id}, format="json")
        self.assertEqual(b.get("/api/favourites/?type=like").json()["results"], [])

        # only the owner can edit or delete
        self.assertEqual(
            b.patch(f"/api/post_update/{post_id}", {"content": "hijack"}, format="json").status_code, 403
        )
        self.assertEqual(b.delete(f"/api/post_update/{post_id}").status_code, 403)
        edited = a.patch(f"/api/post_update/{post_id}", {"content": "Edited", "like_count": 999}, format="json")
        self.assertEqual(edited.status_code, 200, edited.content)
        self.assertEqual(edited.json()["content"], "Edited")
        self.assertEqual(edited.json()["like_count"], 0)
        self.assertTrue(edited.json()["edited"])

        mine = a.get(f"/api/my_posts/?user_id={a_id}").json()["results"]
        self.assertEqual(len(mine), 2)

        self.assertEqual(a.delete(f"/api/post_update/{post_id}").status_code, 204)
        self.assertEqual(b.get(f"/api/post_by_id/{post_id}").status_code, 404)

    def test_comments_and_share(self):
        a, _ = self.make_user("alice")
        b, _ = self.make_user("bob")
        post_id = self.create_post(a)
        response = b.post("/api/comment/", {"post": post_id, "comment": "Nice!"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["comment"]["username"], "bob")
        empty = b.post("/api/comment/", {"post": post_id, "comment": "  "}, format="json")
        self.assertEqual(empty.status_code, 400)
        comments = b.get(f"/api/get_post_comments/{post_id}").json()
        self.assertEqual([c["comment"] for c in comments], ["Nice!"])
        shared = b.post("/api/increase_share_count/", {"post_id": post_id}, format="json")
        self.assertEqual(shared.json()["share_count"], 1)

    def test_private_account_posts_hidden_until_followed(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        post_id = self.create_post(a)
        self.assertEqual(a.post("/api/privacy_setting/", {"privacy_settings": 1}, format="json").status_code, 201)
        self.assertEqual(b.get("/api/post/?type=like").json()["results"], [])
        self.assertEqual(b.get(f"/api/post_by_id/{post_id}").status_code, 404)

        sent = b.post("/api/send_follow_request/", {"receiver": a_id}, format="json")
        self.assertEqual(sent.status_code, 200, sent.content)
        approve = a.post("/api/approve_follow_request/", {"request_id": sent.json()["request_id"]}, format="json")
        self.assertEqual(approve.status_code, 200, approve.content)
        self.assertEqual(len(b.get("/api/post/?type=like").json()["results"]), 1)

    # ------------------------------------------------------------ social
    def test_follow_flow_and_notifications(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")

        self.assertEqual(b.post("/api/send_follow_request/", {"receiver": b_id}, format="json").status_code, 400)
        sent = b.post("/api/send_follow_request/", {"receiver": a_id}, format="json")
        self.assertEqual(sent.status_code, 200, sent.content)
        request_id = sent.json()["request_id"]
        self.assertEqual(b.post("/api/send_follow_request/", {"receiver": a_id}, format="json").json()["status"], "pending")

        users = b.get("/api/usersfilters/?search=alice").json()
        self.assertEqual(users[0]["follow_request_status"], "pending")
        self.assertFalse(users[0]["is_following"])
        self.assertNotIn("password", users[0])

        notifications = a.get("/api/all_notifications/").json()
        incoming = [n for n in notifications if n["follow_request"]]
        self.assertEqual(len(incoming), 1)
        self.assertTrue(incoming[0]["follow_request"]["incoming"])
        self.assertEqual(incoming[0]["from_user"]["username"], "bob")

        self.assertEqual(
            a.post("/api/approve_follow_request/", {"request_id": request_id}, format="json").status_code, 200
        )
        users = b.get("/api/usersfilters/?search=alice").json()
        self.assertTrue(users[0]["is_following"])

        lists = a.get(f"/api/follow/?user_id={a_id}").json()["data"]
        self.assertEqual([u["username"] for u in lists["followers"]], ["bob"])
        self.assertEqual(lists["following"], [])

        # accepted-request notification reaches the sender, as non-incoming
        bob_notes = b.get("/api/all_notifications/").json()
        accepted = [n for n in bob_notes if n["follow_request"] and not n["follow_request"]["incoming"]]
        self.assertEqual(len(accepted), 1)

        removed = b.delete(f"/api/remove_follow/{a_id}?type=following")
        self.assertEqual(removed.status_code, 200, removed.content)
        self.assertFalse(b.get("/api/usersfilters/?search=alice").json()[0]["is_following"])

    def test_reject_follow_request(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        sent = b.post("/api/send_follow_request/", {"receiver": a_id}, format="json").json()
        rejected = a.post("/api/reject_follow_request/", {"request_id": sent["request_id"]}, format="json")
        self.assertEqual(rejected.status_code, 200, rejected.content)
        # may ask again after a rejection
        again = b.post("/api/send_follow_request/", {"receiver": a_id}, format="json")
        self.assertEqual(again.json()["status"], "pending")

    def test_reaction_comment_notifications_and_mark_seen(self):
        a, a_id = self.make_user("alice")
        b, _ = self.make_user("bob")
        post_id = self.create_post(a)
        b.post("/api/reactions/", {"post": post_id, "reaction": "like"}, format="json")
        b.post("/api/comment/", {"post": post_id, "comment": "Nice!"}, format="json")
        b.post("/api/favourites/", {"post": post_id}, format="json")
        # own activity never notifies yourself
        a.post("/api/comment/", {"post": post_id, "comment": "thanks"}, format="json")

        counts = a.get(f"/api/follow/?user_id={a_id}").json()["data"]["count"]
        self.assertEqual(counts, 3)
        notes = a.get("/api/all_notifications/").json()
        kinds = sorted(n["notification_type"] for n in notes)
        self.assertEqual(kinds, ["comment", "favourite", "reaction"])
        comment = [n for n in notes if n["notification_type"] == "comment"][0]
        self.assertEqual(comment["comment_text"], "Nice!")
        self.assertEqual(comment["post_id"], post_id)

        self.assertEqual(a.post("/api/notifications/mark_all_seen/").json()["updated"], 3)
        self.assertTrue(all(n["seen"] for n in a.get("/api/all_notifications/").json()))
        self.assertEqual(a.get(f"/api/follow/?user_id={a_id}").json()["data"]["count"], 0)

    def test_block_and_mute(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        self.create_post(a)
        self.assertEqual(len(b.get("/api/post/?type=like").json()["results"]), 1)

        self.assertEqual(b.post("/api/mute_user/", {"user_id": a_id, "action": "mute"}, format="json").status_code, 200)
        self.assertEqual(b.get("/api/post/?type=like").json()["results"], [])
        self.assertEqual(b.get("/api/mute_user/").json()["count"], 1)
        b.post("/api/mute_user/", {"user_id": a_id, "action": "unmute"}, format="json")
        self.assertEqual(len(b.get("/api/post/?type=like").json()["results"]), 1)

        self.assertEqual(b.post("/api/block_user/", {"user_id": a_id}, format="json").status_code, 200)
        self.assertEqual(b.post("/api/block_user/", {"user_id": a_id}, format="json").status_code, 200)
        self.assertEqual(b.get("/api/post/?type=like").json()["results"], [])
        self.assertEqual(len(b.get("/api/block_user/").json()), 1)
        self.assertEqual(b.get("/api/usersfilters/?search=alice").json(), [])
        self.assertEqual(
            a.post("/api/send_follow_request/", {"receiver": b_id}, format="json").status_code, 403
        )
        self.assertEqual(b.post("/api/unblock_user/", {"user_id": a_id}, format="json").status_code, 200)
        self.assertEqual(len(b.get("/api/post/?type=like").json()["results"]), 1)

    def test_report_post(self):
        a, _ = self.make_user("alice")
        b, _ = self.make_user("bob")
        post_id = self.create_post(a)
        response = b.post("/api/post_report/", {"post": post_id, "reason": "Spam"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)

    # ------------------------------------------------------------ settings
    def test_settings_endpoints(self):
        a, _ = self.make_user("alice")
        privacy = a.get("/api/privacy_setting/")
        self.assertEqual(privacy.status_code, 200, privacy.content)
        self.assertEqual(
            a.post("/api/privacy_setting/", {"allow_requests": False}, format="json").status_code, 201
        )
        self.assertFalse(a.get("/api/privacy_setting/").json()["allow_requests"])
        self.assertEqual(
            a.post("/api/privacy_setting/", {"privacy_settings": 9}, format="json").status_code, 400
        )

        advanced = a.post("/api/privacy_setting_advanced/", {"show_online_status": False}, format="json")
        self.assertEqual(advanced.status_code, 200)
        self.assertFalse(a.get("/api/privacy_setting_advanced/").json()["show_online_status"])

        notif = a.get("/api/notifications/general_notifications_settings/")
        self.assertEqual(notif.status_code, 200, notif.content)
        categories = notif.json()["categories"]
        self.assertTrue(categories)
        key = categories[0]["key"]
        option = categories[0]["options"][0]["key"]
        patched = a.patch(
            "/api/notifications/general_notifications_settings/",
            {"categories": {key: {option: False}}},
            format="json",
        )
        self.assertEqual(patched.status_code, 200, patched.content)

    def test_contact_and_invite(self):
        a, _ = self.make_user("alice")
        contact = a.post(
            "/api/contact_us/", {"name": "Alice", "email": "alice@example.com", "message": "Hi"}, format="json"
        )
        self.assertEqual(contact.status_code, 200, contact.content)
        invite = a.post("/api/invite_user/", {"email": "friend@example.com"}, format="json")
        self.assertEqual(invite.status_code, 200, invite.content)

    # ------------------------------------------------------------ threads
    def test_ask_why_threads(self):
        a, _ = self.make_user("alice")
        b, _ = self.make_user("bob")
        post_id = self.create_post(a)
        self.assertEqual(b.get(f"/api/post_threads/{post_id}").json()["data"], [])
        created = b.post(f"/api/post_threads/{post_id}", {"name": "Why though?"}, format="json")
        self.assertEqual(created.status_code, 201, created.content)
        thread_id = created.json()["data"]["uuid"]
        self.assertEqual(created.json()["data"]["username"], "bob")
        invalid = b.post(f"/api/post_threads/{post_id}", {}, format="json")
        self.assertEqual(invalid.status_code, 400)

        reply = a.post(f"/api/threads/{thread_id}/comments/", {"comment": "Because."}, format="json")
        self.assertEqual(reply.status_code, 201, reply.content)
        listing = b.get(f"/api/threads/{thread_id}/comments/").json()["data"]
        self.assertEqual([c["comment"] for c in listing], ["Because."])
        self.assertEqual(listing[0]["username"], "alice")

        self.assertEqual(a.patch(f"/api/post/{post_id}/toggle_new_ask_why_permission/").status_code, 200)
        closed = b.post(f"/api/post_threads/{post_id}", {"name": "Again?"}, format="json")
        self.assertEqual(closed.status_code, 406)

    def test_why_reactions(self):
        a, _ = self.make_user("alice")
        b, _ = self.make_user("bob")
        post_id = self.create_post(a)
        response = b.post("/api/why_reactions/", {"post": post_id, "reaction": "like"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(b.get(f"/api/post_by_id/{post_id}").json()["why_like_count"], 1)

    def test_trending_is_public(self):
        a, _ = self.make_user("alice")
        self.create_post(a)
        response = APIClient().get("/api/most_seen/?limit=10")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(response.json()["results"]), 1)

    # ------------------------------------------------------------ chat
    def test_direct_messages(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        sent = a.post(
            "/api/chat/send_message/", {"action": "private", "receiver": b_id, "message": "Hello Bob"}, format="json"
        )
        self.assertEqual(sent.status_code, 200, sent.content)
        room_id = sent.json()["room_id"]

        reply = b.post(
            "/api/chat/send_message/", {"action": "private", "receiver": a_id, "message": "Hi Alice"}, format="json"
        )
        self.assertEqual(reply.json()["room_id"], room_id)  # same conversation, not a duplicate

        rooms = b.get("/api/chat/list_rooms/").json()
        self.assertEqual(len(rooms), 1)
        self.assertEqual(rooms[0]["room_id"], room_id)
        self.assertEqual(rooms[0]["chat_name"], "Alice Tester")
        self.assertEqual(rooms[0]["participants"]["user"][0]["username"] in {"alice", "bob"}, True)

        messages = b.get(f"/api/chat/get_message/?room_id={room_id}").json()
        self.assertEqual([m["message"] for m in messages], ["Hello Bob", "Hi Alice"])
        self.assertEqual(messages[0]["user"], a_id)
        self.assertEqual(
            a.post(
                "/api/chat/send_message/", {"action": "private", "receiver": b_id, "message": "  "}, format="json"
            ).status_code,
            400,
        )
        outsider, _ = self.make_user("carol")
        self.assertEqual(outsider.get(f"/api/chat/get_message/?room_id={room_id}").status_code, 404)

    def test_dm_requests(self):
        a, a_id = self.make_user("alice")
        b, b_id = self.make_user("bob")
        sent = a.post(
            "/api/chat/dm_requests/", {"type": "private", "receiver": b_id, "message": "Can we talk?"}, format="json"
        )
        self.assertEqual(sent.status_code, 200, sent.content)
        pending = b.get("/api/chat/handle_dm_requests/").json()
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["sender_info"]["username"], "alice")
        room_id = pending[0]["room_id"]
        accepted = b.patch(
            "/api/chat/handle_dm_requests/", {"action": "accept_request", "room_id": room_id}, format="json"
        )
        self.assertEqual(accepted.status_code, 200, accepted.content)
        messages = b.get(f"/api/chat/get_message/?room_id={room_id}").json()
        self.assertEqual([m["message"] for m in messages], ["Can we talk?"])
        self.assertEqual(b.get("/api/chat/handle_dm_requests/").json(), [])

    # ------------------------------------------------------------ uploads
    def test_upload(self):
        a, _ = self.make_user("alice")
        file = SimpleUploadedFile("pic.png", b"\x89PNG\r\n\x1a\n" + b"0" * 64, content_type="image/png")
        response = a.post("/api/upload/", {"file": file, "dir_name": "img"}, format="multipart")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIn("/api/media/img/", response.json()["file_url"])
        self.assertEqual(a.post("/api/upload/", {}, format="multipart").status_code, 400)


class ActivationTests(APITestCase):
    def test_activation_link_works_and_lands_on_backend_page(self):
        from authentication.views import ActivationToken

        client = APIClient()
        signup(client, "alice")
        user = User.objects.get(email="alice@example.com")
        self.assertFalse(user.is_activated)
        token = str(ActivationToken.for_inactive_user(user))
        response = client.get(f"/api/account/activate/{user.uuid}/{token}/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/api/activation.html", response["Location"])
        user.refresh_from_db()
        self.assertTrue(user.is_activated)
        page = client.get("/api/activation.html")
        self.assertEqual(page.status_code, 200)

    def test_bad_token_is_rejected(self):
        client = APIClient()
        signup(client, "alice")
        user = User.objects.get(email="alice@example.com")
        response = client.get(f"/api/account/activate/{user.uuid}/garbage/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("failed", response["Location"])
        user.refresh_from_db()
        self.assertFalse(user.is_activated)


class MethodOverrideTests(APITestCase):
    def test_patch_and_delete_work_over_post(self):
        client = APIClient()
        signup(client, "alice")
        data = login(client, "alice@example.com")
        patched = client.post(
            f"/api/user/{data['uuid']}/", {"bio": "via override"}, format="json", HTTP_X_HTTP_METHOD_OVERRIDE="PATCH"
        )
        self.assertEqual(patched.status_code, 200, patched.content)
        self.assertEqual(patched.json()["bio"], "via override")
        post = client.post(
            "/api/post/", {"post_type": "like", "mood_type": "x", "content": "hi"}, format="json"
        ).json()["uuid"]
        deleted = client.post(f"/api/post_update/{post}", HTTP_X_HTTP_METHOD_OVERRIDE="DELETE")
        self.assertEqual(deleted.status_code, 204, deleted.content)
