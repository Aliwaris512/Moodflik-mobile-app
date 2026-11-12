from django.urls import path
from chat.views import (
    UserPrefrenceChatNotifications,
    SendDmRequests,
    HandleDmRequests,
    SendMessage,
    ChatView,
    ChatRoomListView,
    ChatMessagesView,
    UserChatsView,
)

urlpatterns = [
    path('send_message/', SendMessage.as_view(), name = 'send_message'),
    path('view_messaged/', ChatView.as_view(), name='chat_dispatch'),
    path('create_room/', UserChatsView.as_view({'post': 'create_room'}), name='create_room'),
    path('list_rooms/', ChatRoomListView.as_view(), name='list_rooms'),
    path('get_message/', ChatMessagesView.as_view(), name='get_message'),
    path('user_prefrence_chat_notifications/', UserPrefrenceChatNotifications.as_view()),
    path('dm_requests/', SendDmRequests.as_view()),
    path('handle_dm_requests/', HandleDmRequests.as_view() ),

    # path('search_participants/', SearchParticipantsView.as_view(), name='search_participants'),
]
