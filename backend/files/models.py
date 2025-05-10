from django.db import models
import uuid
import os
import django_filters
import hashlib

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    ext = filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join("uploads", filename)


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    count = models.PositiveIntegerField(
        default=1
    )  # Track number of uploads for the same file
    file_hash = models.CharField(max_length=64, unique=True)  # Store the file hash

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_filename

    def save(self, *args, **kwargs):
        # Compute the hash of the file (e.g., using SHA256)
        if not self.file_hash:
            self.file_hash = self.generate_file_hash()
        super().save(*args, **kwargs)

    def generate_file_hash(self):
        """Generate a hash based on the file content"""
        hash_sha256 = hashlib.sha256()
        for chunk in self.file.chunks():
            hash_sha256.update(chunk)
        return hash_sha256.hexdigest()


class FileFilter(django_filters.FilterSet):
    filename = django_filters.CharFilter(
        field_name="original_filename", lookup_expr="icontains", label="Filename"
    )
    file_type = django_filters.CharFilter(
        field_name="file_type", lookup_expr="icontains", label="File Type"
    )
    size_min = django_filters.NumberFilter(
        field_name="size", lookup_expr="gte", label="Min Size (bytes)"
    )
    size_max = django_filters.NumberFilter(
        field_name="size", lookup_expr="lte", label="Max Size (bytes)"
    )
    uploaded_after = django_filters.DateTimeFilter(
        field_name="uploaded_at", lookup_expr="gte", label="Uploaded After"
    )
    uploaded_before = django_filters.DateTimeFilter(
        field_name="uploaded_at", lookup_expr="lte", label="Uploaded Before"
    )

    class Meta:
        model = File
        fields = [
            "filename",
            "file_type",
            "size_min",
            "size_max",
            "uploaded_after",
            "uploaded_before",
        ]
