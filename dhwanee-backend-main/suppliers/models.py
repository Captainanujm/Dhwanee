from django.db import models

from products.models import ProductItem
from store.models import Agency, Branch


# Create your models here.
class Supplier(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("Name of the supplier", max_length=200)
    number = models.CharField("Number of the supplier", max_length=20)
    address = models.CharField("Address of the supplier", max_length=200)
    balance = models.DecimalField("Current Balance", max_digits=10, decimal_places=2)
    state = models.CharField("State", default="UTTAR PRADESH - 09", max_length=50)
    gstin = models.CharField("GSTIN", max_length=20, default="", blank=True)

class SupplierLedger(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    remarks = models.CharField("remarks", max_length=200)
    balance_before = models.DecimalField(
        "Balance Before", max_digits=10, decimal_places=2
    )
    balance_after = models.DecimalField(
        "Balance after", max_digits=10, decimal_places=2
    )
    amount = models.DecimalField("amount", max_digits=10, decimal_places=2)
    date = models.DateTimeField()
    link = models.CharField("Linked To", max_length=50, null=True, blank=True)


class SupplierBillExtraExpenses(models.Model):
    description = models.CharField("Description", max_length=200)
    amount = models.DecimalField("Amount", max_digits=8, decimal_places=2)
    tax_incl = models.BooleanField("Is Tax Inclusive?", default=False)
    cgst = models.DecimalField("Cgst", decimal_places=2, max_digits=5, default=0)
    sgst = models.DecimalField("Sgst", decimal_places=2, max_digits=5, default=0)
    igst = models.DecimalField("Igst", decimal_places=2, max_digits=5, default=0)
    total_amount = models.DecimalField("Total Amount (after taxes)", max_digits=8, decimal_places=2)

class SupplierBill(models.Model):
    number = models.CharField("Bill Number", max_length=50)
    date = models.DateTimeField()
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    products = models.ManyToManyField(ProductItem)
    extra_expenses = models.ManyToManyField(SupplierBillExtraExpenses)
    received_status = models.BooleanField(
        "Are the products received", default=True
    )
    cash_discount = models.DecimalField(
        "Cash Discount", max_digits=8, decimal_places=2, default=0
    )
    cash_discount_type = models.CharField(
        "Type of cash discount",
        choices=(("Percentage", "percentage"), ("Amount", "amount")),
        default="percentage",
        max_length=10
    )
    cgst = models.DecimalField("Cgst", decimal_places=2, max_digits=10, default=0)
    sgst = models.DecimalField("Sgst", decimal_places=2, max_digits=10, default=0)
    igst = models.DecimalField("Igst", decimal_places=2, max_digits=10, default=0)
    buying_price_gst_incl = models.BooleanField("is buying price of products inclusive of gst?", default=False)
    subtotal = models.DecimalField(
        "Subtotal", decimal_places=2, max_digits=10, default=0
    )
    payable = models.DecimalField("Payable", decimal_places=2, max_digits=10, default=0)
    ledger = models.ForeignKey(SupplierLedger, on_delete=models.CASCADE, null=True, default=None)


class InitialStockEntry(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    date = models.DateTimeField()
    ref = models.CharField("Reference", max_length=300)
    products = models.ManyToManyField(ProductItem)


class PurchaseReturn(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    number = models.CharField("Return Number", max_length=50)
    date = models.DateTimeField()
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    products = models.ManyToManyField(ProductItem)
    total = models.DecimalField("total", decimal_places=2, max_digits=10, default=0)
    roundoff = models.DecimalField("roundoff", decimal_places=2, max_digits=3, default=0)
    ledger = models.ForeignKey(SupplierLedger, on_delete=models.CASCADE, null=True, default=None)
    remarks = models.CharField("Remarks", max_length=300)
