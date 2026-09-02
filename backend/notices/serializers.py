from datetime import date

from rest_framework import serializers

from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = "__all__"
        read_only_fields = ["school", "posted_by"]

    def get_status(self, obj):
        if obj.expires_at and obj.expires_at < date.today():
            return "Expired"
        return "Active" if obj.is_active else "Archived"


class PublicNoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ["id", "title", "content", "category", "priority", "class_name", "is_pinned", "created_at", "expires_at"]
