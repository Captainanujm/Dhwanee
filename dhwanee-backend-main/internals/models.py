from django.db import models

from store.models import Agency, Branch

# Create your models here.
class BillNumber(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField('Name of the constant', max_length=50)
    fy_1 = models.CharField("Fiscal year 1", max_length=4, default=24)
    fy_2 = models.CharField("Fiscal year 2", max_length=4, default=25)
    next_bill_number = models.IntegerField("Next bill Number", default=1)
    format = models.CharField("Bill Number Format", default="__fy_1__-__fy_2__-__number__")