from django.contrib import admin
from .models import PaymentMethod, PaymentLabel, Account, AccountLedger
# Register your models here.

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    pass
@admin.register(PaymentLabel)
class PaymentLabelAdmin(admin.ModelAdmin):
    pass
@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    pass
@admin.register(AccountLedger)
class AccountLedgerAdmin(admin.ModelAdmin):
    pass
