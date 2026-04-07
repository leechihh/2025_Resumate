# core/urls.py
from django.urls import path
from .views import (
    ResumeUploadView,
    MatchJobView,
    JobPositionListCreateView,
    JobPositionDetailView,
    JobApplicationListView,
    ApplicationDetailView,
    GenerateEmailView,
    EmailTaskDetailView,
    ApplicationEmailTasksView,
    EmailPolishView,
    EmailTaskCreateView,
    EmailListView,
    SendEmailView,
)


urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('match/', MatchJobView.as_view(), name='match-job'),
    path('jobs/', JobPositionListCreateView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', JobPositionDetailView.as_view(), name='job-detail'),
    path('jobs/<int:pk>/applications/', JobApplicationListView.as_view(), name='job-applications'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:pk>/email-tasks/', ApplicationEmailTasksView.as_view(), name='application-email-tasks'),
    path('generate-email/', GenerateEmailView.as_view(), name='generate-email'),
    path('email-tasks/', EmailTaskCreateView.as_view(), name='email-task-create'),
    path('email-tasks/all/', EmailListView.as_view(), name='email-task-list'),
    path('email-tasks/<int:pk>/', EmailTaskDetailView.as_view(), name='email-task-detail'),
    path('email-tasks/<int:pk>/send/', SendEmailView.as_view(), name='email-task-send'),
    path('polish-email/', EmailPolishView.as_view(), name='email-polish'),
]
