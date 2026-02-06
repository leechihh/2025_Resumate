from rest_framework import serializers
from .models import JobPosition, Application, Candidate

class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField() # 告訴前端：這裡有一個檔案上傳欄位

class MatchJobSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField(help_text="請輸入候選人 ID")
    job_id = serializers.IntegerField(help_text="請輸入職缺 ID")

class JobPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosition
        fields = '__all__' # 或者列出 ['id', 'title', 'description', 'requirements', 'culture_traits', 'status']

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'email', 'phone', 'resume_file', 'parsed_data'] # 包含 parsed_data 以便前端顯示摘要

class ApplicationSerializer(serializers.ModelSerializer):
    # 這裡用 nested serializer，把 candidate 的詳細資料直接包進來
    candidate = CandidateSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'candidate', 'status', 'ai_match_score', 'ai_analysis_report', 'applied_at']