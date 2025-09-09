from django.db import models

from store.models import Agency, Branch

# Create your models here.
class Account(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("Name of the account", max_length=30)
    balance = models.DecimalField("Current Balance", max_digits=10, decimal_places=2)
    short = models.DecimalField("Account Short", max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.name

class PaymentMethod(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("Name of the payment method", max_length=50)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    def __str__(self) -> str:
        return self.name

class PaymentLabel(models.Model):
    name = models.CharField("Name of the label", max_length=30)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class AccountLedger(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    remarks = models.CharField("Description of the transaction", max_length=500)
    amount = models.DecimalField("Amount of transaction", max_digits=10, decimal_places=2)
    balance_before = models.DecimalField("Balance before", max_digits=10, decimal_places=2)
    balance_after = models.DecimalField("Balance After", max_digits=10, decimal_places=2)
    date = models.DateTimeField("Timestamp")
    method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE, null=True, default=None)
    labels = models.ManyToManyField(PaymentLabel)
    link = models.CharField("Linked To", max_length=50, null=True, blank=True)
