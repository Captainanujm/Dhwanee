from django.contrib import admin
from .models import Bill, SalesReturn, DeliveryChallan, DeliveryChallanItem
# Register your models here.
@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    pass


@admin.register(SalesReturn)
class SalesReturnAdmin(admin.ModelAdmin):
    pass

admin.site.register([DeliveryChallan, DeliveryChallanItem])