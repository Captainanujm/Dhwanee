from django.contrib import admin
from .models import BillNumber
# Register your models here.
@admin.register(BillNumber)
class BillNumberAdmin(admin.ModelAdmin):
    pass

