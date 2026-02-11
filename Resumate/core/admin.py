from django.contrib import admin

# Register your models here.

from .models import JobPosition, Candidate, Application, EmailTask, Note, EmailTemplate

admin.site.register(JobPosition)
admin.site.register(Candidate)
admin.site.register(Application)
admin.site.register(EmailTask)
admin.site.register(Note)
admin.site.register(EmailTemplate)