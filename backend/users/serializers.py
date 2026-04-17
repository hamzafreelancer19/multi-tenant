from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    school_name = serializers.ReadOnlyField(source='school.name')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'school', 'school_name', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']
