from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.response import Response


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        if user.school:
            token['school_id'] = user.school.id
            token['school_name'] = user.school.name
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if school is approved
        user = self.user
        if user.role != 'superadmin':
            from core.platform import MAINTENANCE_MESSAGE, get_global_setting
            gs = get_global_setting()
            if gs.maintenance_mode:
                raise AuthenticationFailed(MAINTENANCE_MESSAGE)
            if not user.school:
                raise ValidationError("No school assigned to this user.")
            if user.school.status != 'Approved':
                raise ValidationError(f"Your school '{user.school.name}' is {user.school.status}. Please wait for approval or contact the platform administrator.")
        
        # Add school domain to response
        if user.school:
            data['school_domain'] = user.school.domain
            data['school_name'] = user.school.name

        from users.presence import mark_online
        mark_online(user)

        return data


class MyTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        from core.platform import get_global_setting, maintenance_payload
        gs = get_global_setting()
        if gs.maintenance_mode:
            refresh = request.data.get("refresh")
            if refresh:
                from django.contrib.auth import get_user_model
                from rest_framework_simplejwt.exceptions import TokenError
                from rest_framework_simplejwt.tokens import RefreshToken
                try:
                    token = RefreshToken(refresh)
                    uid = token.payload.get("user_id")
                    user = get_user_model().objects.filter(pk=uid).only("role").first()
                    if user and getattr(user, "role", None) != "superadmin":
                        return Response(maintenance_payload(), status=503)
                except TokenError:
                    pass
        return super().post(request, *args, **kwargs)
