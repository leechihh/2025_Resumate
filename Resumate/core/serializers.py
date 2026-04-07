from rest_framework import serializers
from .models import JobPosition, Application, Candidate, EmailTask

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
        fields = ['id', 'candidate', 'status', 'ai_match_score', 'ai_analysis_report', 'applied_at', 'note']

class EmailTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTask
        fields = ['id', 'application', 'email_type', 'status', 'subject', 'body', 'custom_intent', 'created_at', 'updated_at', 'sent_at', 'error_message']

class EmailTaskListSerializer(serializers.ModelSerializer):
    """用於信件中心列表，附帶候選人與職缺資訊"""
    candidate_name = serializers.CharField(source='application.candidate.name', read_only=True)
    candidate_email = serializers.CharField(source='application.candidate.email', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    application_id = serializers.IntegerField(source='application.id', read_only=True)

    class Meta:
        model = EmailTask
        fields = [
            'id', 'application_id', 'email_type', 'status',
            'subject', 'body', 'created_at', 'sent_at', 'error_message',
            'candidate_name', 'candidate_email', 'job_title',
        ]