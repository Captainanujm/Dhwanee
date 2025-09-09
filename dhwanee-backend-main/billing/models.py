from django.db import models

from products.models import ProductItem
from accounts.models import AccountLedger
from customers.models import CustomerLedger, Customer
from store.models import Agency, Branch

# Create your views here.

# class PaymentMethod(models.Model):


class Bill(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    number = models.CharField("Bill Number", max_length=10)
    po_number = models.CharField("Bill PO Number", max_length=20, default=None, null=True, blank=True)
    date = models.DateTimeField()
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, default=None)
    products = models.ManyToManyField(ProductItem)
    subtotal = models.DecimalField("Subtotal", decimal_places=2, max_digits=10)
    cgst = models.DecimalField("cgst", decimal_places=2, max_digits=10)
    sgst = models.DecimalField("sgst", decimal_places=2, max_digits=10)
    igst = models.DecimalField("igst", decimal_places=2, max_digits=10)
    roundoff = models.DecimalField("roundoff", decimal_places=2, max_digits=3)
    total = models.DecimalField("total = subtotal + taxes + roundoff", decimal_places=2, max_digits=10)
    payable = models.DecimalField("Payable = total + previous balance", decimal_places=2, max_digits=10)
    payments = models.ManyToManyField(AccountLedger)
    ledger = models.ManyToManyField(CustomerLedger)
    use_previous_balance = models.BooleanField("Use previous balance?", default=True)
    class Meta:
        ordering = ["-date"]


class SalesReturn(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    number = models.CharField("Bill Number", max_length=10)
    date = models.DateTimeField()
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, default=None)
    bill = models.ForeignKey(Bill, on_delete=models.SET_NULL, null=True, default=None)
    products = models.ManyToManyField(ProductItem)
    total = models.DecimalField("total", decimal_places=2, max_digits=10)
    ledger = models.ForeignKey(CustomerLedger, on_delete=models.CASCADE)
    class Meta:
        ordering = ["-date"]


class DeliveryChallanItem(models.Model):
    product = models.ForeignKey(ProductItem, on_delete=models.PROTECT)
    is_converted = models.BooleanField()
    remarks = models.CharField(max_length=200)


class DeliveryChallan(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    number = models.CharField("Delivery Number", max_length=10)
    date = models.DateTimeField()
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        related_name="delivery_challan",
    )
    items = models.ManyToManyField(DeliveryChallanItem)
    subtotal = models.DecimalField("Subtotal", decimal_places=2, max_digits=10)
    cgst = models.DecimalField("cgst", decimal_places=2, max_digits=10)
    sgst = models.DecimalField("sgst", decimal_places=2, max_digits=10)
    igst = models.DecimalField("igst", decimal_places=2, max_digits=10)
    roundoff = models.DecimalField("roundoff", decimal_places=2, max_digits=3)
    total = models.DecimalField("total", decimal_places=2, max_digits=10)
    converted_to = models.ForeignKey(
        Bill,
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
        verbose_name="Converted to bill",
    )

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self) -> str:
        return self.number

