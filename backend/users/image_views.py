import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.core.files.storage import default_storage

class ImageUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.data.get('image')
        if not file_obj:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Create media directory if it doesn't exist
        if not os.path.exists(settings.MEDIA_ROOT):
            os.makedirs(settings.MEDIA_ROOT)

        # Use tenant-specific folder name if available
        school_id = getattr(request, 'tenant_id', 'general')
        file_path = f'landing_images/{school_id}/{file_obj.name}'
        
        # Save file
        path = default_storage.save(file_path, file_obj)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + path)

        return Response({"url": file_url}, status=status.HTTP_201_CREATED)
