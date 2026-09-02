import os
import uuid
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.utils import get_current_school, is_superadmin
from users.presence import touch_presence
from .models import ChatMessage, ChatThread
from .services import (
    allowed_contact_ids,
    allowed_contacts,
    get_or_create_direct,
    mark_read,
    other_member,
    serialize_message,
    serialize_thread,
)

User = get_user_model()
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
FILE_EXTS = IMAGE_EXTS | {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".zip"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


class ChatBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if is_superadmin(request):
            raise PermissionDenied("School chat belongs to each school's staff and parents.")
        if not get_current_school(request):
            raise PermissionDenied("No school assigned.")
        touch_presence(request.user)


class ChatContactListView(ChatBaseView):
    def get(self, request):
        return Response(allowed_contacts(request))


class ChatThreadListView(ChatBaseView):
    def get(self, request):
        school = get_current_school(request)
        threads = (
            ChatThread.objects.filter(school=school, memberships__user=request.user, messages__isnull=False)
            .distinct()
            .prefetch_related("messages", "memberships__user")
        )
        data = [serialize_thread(thread, request.user) for thread in threads]
        data.sort(key=lambda item: item.get("last_at") or "", reverse=True)
        return Response(data)

    def post(self, request):
        school = get_current_school(request)
        try:
            user_id = int(request.data.get("user_id"))
        except (TypeError, ValueError):
            raise ValidationError({"user_id": "Choose a person to chat with."})
        if user_id == request.user.id:
            raise ValidationError({"user_id": "You cannot chat with yourself."})
        if user_id not in allowed_contact_ids(request):
            raise PermissionDenied("You cannot start a chat with this person.")
        other = User.objects.filter(id=user_id, is_active=True).first()
        if not other or (other.school_id and other.school_id != school.id):
            raise ValidationError({"user_id": "Person not found."})
        thread, _ = get_or_create_direct(school, request.user, other)
        return Response(serialize_thread(thread, request.user), status=status.HTTP_201_CREATED)


class ChatMessageListView(ChatBaseView):
    def _thread(self, request, pk):
        school = get_current_school(request)
        thread = ChatThread.objects.filter(pk=pk, school=school, memberships__user=request.user).first()
        if not thread:
            raise PermissionDenied("Chat not found.")
        return thread

    def get(self, request, pk):
        thread = self._thread(request, pk)
        qs = thread.messages.select_related("sender").order_by("created_at", "id")
        after = request.query_params.get("after")
        other = other_member(thread, request.user)
        other_read = other.last_read_at if other else None
        if after:
            try:
                qs = qs.filter(id__gt=int(after))
            except (TypeError, ValueError):
                pass
            rows = list(qs[:80])
            mark_read(thread, request.user)
            return Response([serialize_message(row, other_read) for row in rows])
        qs = qs.order_by("-created_at", "-id")[:80]
        rows = list(reversed(list(qs)))
        mark_read(thread, request.user)
        return Response([serialize_message(row, other_read) for row in rows])

    def post(self, request, pk):
        thread = self._thread(request, pk)
        body = (request.data.get("body") or "").strip()
        attachment_url = (request.data.get("attachment_url") or "").strip()[:2000]
        attachment_name = (request.data.get("attachment_name") or "").strip()[:255]
        attachment_type = (request.data.get("attachment_type") or "").strip()[:20]
        if not body and not attachment_url:
            raise ValidationError({"body": "Type a message or attach a file."})
        if len(body) > 4000:
            raise ValidationError({"body": "Message is too long."})
        if attachment_type not in {"", "image", "file"}:
            attachment_type = "file" if attachment_url else ""
        other_ids = set(thread.memberships.exclude(user=request.user).values_list("user_id", flat=True))
        allowed = allowed_contact_ids(request)
        if other_ids and not other_ids.issubset(allowed | {request.user.id}):
            raise PermissionDenied("You cannot message this chat.")
        message = ChatMessage.objects.create(
            thread=thread,
            sender=request.user,
            body=body,
            attachment_url=attachment_url,
            attachment_name=attachment_name,
            attachment_type=attachment_type if attachment_url else "",
        )
        thread.save(update_fields=["updated_at"])
        mark_read(thread, request.user)
        other = other_member(thread, request.user)
        other_read = other.last_read_at if other else None
        return Response(serialize_message(message, other_read), status=status.HTTP_201_CREATED)


class ChatUploadView(ChatBaseView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.data.get("file") or request.data.get("image")
        if not file_obj:
            raise ValidationError({"file": "Choose a photo or file."})
        size = getattr(file_obj, "size", 0) or 0
        if size > MAX_UPLOAD_BYTES:
            raise ValidationError({"file": "File is too large (max 8 MB)."})
        ext = Path(getattr(file_obj, "name", "") or "file.bin").suffix.lower()
        if ext not in FILE_EXTS:
            raise ValidationError({"file": "Use an image, PDF, Word, Excel, PowerPoint, text, or ZIP file."})
        school = get_current_school(request)
        if not os.path.exists(settings.MEDIA_ROOT):
            os.makedirs(settings.MEDIA_ROOT)
        kind = "image" if ext in IMAGE_EXTS else "file"
        name = Path(getattr(file_obj, "name", "file")).name[:180]
        path = default_storage.save(
            f"chat/{getattr(school, 'id', 'general')}/{request.user.id}/{uuid.uuid4().hex}{ext}",
            file_obj,
        )
        url = request.build_absolute_uri(settings.MEDIA_URL + path)
        return Response({"url": url, "name": name, "type": kind}, status=status.HTTP_201_CREATED)
