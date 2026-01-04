from rest_framework import serializers
from .models import JobPosition

class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField() # 告訴前端：這裡有一個檔案上傳欄位

class MatchJobSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField(help_text="請輸入候選人 ID")
    job_id = serializers.IntegerField(help_text="請輸入職缺 ID")

class JobPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosition
        fields = '__all__' # 或者列出 ['id', 'title', 'description', 'requirements', 'culture_traits', 'status']