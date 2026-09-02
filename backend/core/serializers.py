from rest_framework import serializers
from .models import ActivityLog, Notification

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'name', 'action', 'avatar', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "message", "is_read", "created_at", "audience", "link_path"]

    def get_is_read(self, obj):
        return False
