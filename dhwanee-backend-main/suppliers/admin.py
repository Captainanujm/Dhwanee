from django.contrib import admin
from .models import Supplier, InitialStockEntry, SupplierBill, SupplierLedger


# Register your models here.
@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    pass


@admin.register(InitialStockEntry)
class InitialStockEntryAdmin(admin.ModelAdmin):
    pass


@admin.register(SupplierBill)
class SupplierBillAdmin(admin.ModelAdmin):
    pass


@admin.register(SupplierLedger)
class SupplierLedgerAdmin(admin.ModelAdmin):
    pass
