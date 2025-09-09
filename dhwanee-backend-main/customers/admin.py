from django.contrib import admin
from .models import Customer, CustomerLedger
# Register your models here.
@admin.register(CustomerLedger)
class CustomerLedgerAdmin(admin.ModelAdmin):
    pass

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    pass
