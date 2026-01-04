from django.db import models

# Create your models here.

from django.contrib.auth.models import User

# 1. 職缺 (JobPosition)
class JobPosition(models.Model):
    STATUS_CHOICES = [('open', '開放中'), ('closed', '已關閉')]
    
    title = models.CharField(max_length=200, verbose_name="職稱")
    description = models.TextField(verbose_name="職缺描述 (JD)")
    requirements = models.TextField(verbose_name="硬性條件")
    
    # AI 評分標準：例如 ["Proactive", "React", "Team Player"]
    culture_traits = models.JSONField(default=list, blank=True, verbose_name="文化特質偏好")
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# 2. 人才庫 (Candidate)
class Candidate(models.Model):
    name = models.CharField(max_length=100, verbose_name="姓名")
    email = models.EmailField(unique=True, verbose_name="Email") # 設為唯一，避免重複
    phone = models.CharField(max_length=50, blank=True, null=True)
    
    # 原始檔案存放路徑 (Django 會自動處理上傳)
    resume_file = models.FileField(upload_to='resumes/', verbose_name="原始履歷")
    
    # AI 通用解析結果：例如 {"education": "...", "skills": ["Python", "Django"]}
    parsed_data = models.JSONField(null=True, blank=True, verbose_name="AI解析資料")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# 3. 應徵紀錄 (Application)
class Application(models.Model):
    STATUS_CHOICES = [
        ('new', '新進履歷'),
        ('screening', '初篩中'),
        ('interview', '面試中'),
        ('offer', '錄取'),
        ('rejected', '婉拒'),
    ]

    job = models.ForeignKey(JobPosition, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    
    # 針對這個職缺的 AI 匹配分數
    ai_match_score = models.IntegerField(default=0, verbose_name="AI匹配分")
    
    # 針對這個職缺的詳細報告 (盲測摘要、面試題)
    ai_analysis_report = models.JSONField(null=True, blank=True)
    
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.candidate.name} -> {self.job.title}"


# 4. 信件紀錄 (EmailLog)
class EmailLog(models.Model):
    STATUS_CHOICES = [('draft', '草稿'), ('sent', '已寄出'), ('failed', '失敗')]

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='emails')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# 5. 內部筆記 (Note)
class Note(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True) # 連結到 Django 內建使用者
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
