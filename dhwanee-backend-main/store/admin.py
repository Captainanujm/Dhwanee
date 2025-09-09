from django.contrib import admin
from .models import Agency, Branch
# Register your models here.

admin.site.register([Agency, Branch])
