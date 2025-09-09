from django.db import models

from store.models import Agency, Branch

# Create your models here.
class Customer(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("Name of the customer", max_length=100)
    number = models.CharField("number of the customer", max_length=20)
    address = models.CharField("address of the customer", max_length=200, blank=True, null=True)
    shipping_address = models.CharField("shipping address of the customer", max_length=200, blank=True, null=True)
    gstin = models.CharField("gstin of the customer", max_length=100, blank=True, null=True)
    balance = models.DecimalField("Balance", max_digits=10, decimal_places=2)
    markdown = models.DecimalField("Markdown in percentage", max_digits=5, decimal_places=2, default=0)
    state = models.CharField("State", max_length=50, default="UTTAR PRADESH - 09")
    def __str__(self):
        return self.name

class CustomerLedger(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    remarks = models.CharField("remarks", max_length=200)
    balance_before = models.DecimalField("Balance Before", max_digits=10, decimal_places=2)
    balance_after = models.DecimalField("Balance after", max_digits=10, decimal_places=2)
    amount = models.DecimalField("amount", max_digits=10, decimal_places=2)
    date = models.DateTimeField()
    link = models.CharField("Linked To", max_length=50, null=True, blank=True, default=None)
