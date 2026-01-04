from django.contrib import admin

# Register your models here.

from .models import JobPosition, Candidate, Application, EmailLog, Note

admin.site.register(JobPosition)
admin.site.register(Candidate)
admin.site.register(Application)
admin.site.register(EmailLog)
admin.site.register(Note)