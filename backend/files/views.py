from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import File, FileFilter
from .serializers import FileSerializer

# Create your views here.

from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import File
from .serializers import FileSerializer
import hashlib


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = FileFilter

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Compute file hash to identify duplicates
        hash_sha256 = hashlib.sha256()
        for chunk in file_obj.chunks():
            hash_sha256.update(chunk)
        file_hash = hash_sha256.hexdigest()

        # Check if the file with this hash already exists
        existing_file = File.objects.filter(file_hash=file_hash).first()

        if existing_file:
            # Increment count of existing file
            existing_file.count += 1
            existing_file.save()
            return Response(
                {
                    "id": existing_file.id,
                    "original_filename": existing_file.original_filename,
                    "file_type": existing_file.file_type,
                    "size": existing_file.size,
                    "uploaded_at": existing_file.uploaded_at,
                    "count": existing_file.count,
                },
                status=status.HTTP_200_OK,
            )
        else:
            # If not duplicate, create a new file entry
            data = {
                "file": file_obj,
                "original_filename": file_obj.name,
                "file_type": file_obj.content_type,
                "size": file_obj.size,
                "file_hash": file_hash,  # Store the hash
            }
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            headers = self.get_success_headers(serializer.data)
            return Response(
                {
                    **serializer.data,
                    "count": 1,  # Since it's a new file, count starts at 1
                },
                status=status.HTTP_201_CREATED,
                headers=headers,
            )
