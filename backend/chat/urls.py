from django.urls import path
from .views import ChatContactListView, ChatThreadListView, ChatMessageListView, ChatUploadView

urlpatterns = [
    path("contacts/", ChatContactListView.as_view()),
    path("upload/", ChatUploadView.as_view()),
    path("threads/", ChatThreadListView.as_view()),
    path("threads/<int:pk>/messages/", ChatMessageListView.as_view()),
]
