# core/urls.py
from django.urls import path
from .views import (
    ResumeUploadView, 
    MatchJobView, 
    JobPositionListCreateView, 
    JobPositionDetailView
)

urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('match-job/', MatchJobView.as_view(), name='match-job'),
    path('jobs/', JobPositionListCreateView.as_view(), name='job-list-create'), # GET: 列表, POST: 新增
    path('jobs/<int:pk>/', JobPositionDetailView.as_view(), name='job-detail'), # GET: 詳細, PUT: 修改, DELETE: 刪除
]