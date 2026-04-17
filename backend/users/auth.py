from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import ValidationError

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
            if not user.school:
                raise ValidationError("No school assigned to this user.")
            if user.school.status != 'Approved':
                raise ValidationError(f"Your school '{user.school.name}' is {user.school.status}. Please wait for approval or contact the platform administrator.")
        
        return data
