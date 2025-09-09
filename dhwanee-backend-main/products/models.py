from django.db import models
from django.db.models.functions import Lower

from store.models import Agency, Branch


# Create your models here.
class Category(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("Name of the category", max_length=100)
    def __str__(self):
        return self.name

class SubCategory(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("Name of the subcategory", max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    def __str__(self):
        return self.name

class RecipeIngredient(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    percentage = models.DecimalField('Percentage of this product needed', max_digits=5, decimal_places=2)

class Product(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField("name", max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, default=None)
    hsn = models.CharField("hsn", max_length=100, default="520811")
    default_selling_price = models.DecimalField(
        "Selling price", max_digits=7, decimal_places=2
    )
    current_stock = models.DecimalField("Current Stock", decimal_places=2, max_digits=10, default=0)
    default_tax = models.DecimalField("Tax Percentage", decimal_places=2, max_digits=5, default=5)
    bulk = models.BooleanField("Is this product sold in bulk")
    is_pieces = models.BooleanField("Is product sold in quantity or pieces")
    finished = models.BooleanField("Is this a finished product or an in progress product")
    recipe = models.ManyToManyField(RecipeIngredient, blank=True, related_name="ingredient")

    def __str__(self):
        return self.name
    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("name"), name="unique_lower_name_category")
        ]

class ProductItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    uuid = models.CharField("UUID of the product", max_length=13)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, default=None, blank=True)
    status = models.CharField(
        "Status of the product",
        choices=(
            ("SOLD", "SOLD"),
            ("UNSOLD", "UNSOLD"),
            ("AWAITED", "AWAITED"),
            ("RETURNED", "RETURNED"),
        ),
        default="UNSOLD",
        max_length=8,
    )
    price = models.DecimalField("Selling price", max_digits=7, decimal_places=2)
    cost = models.DecimalField("Cost price", max_digits=7, decimal_places=2, default=0)
    original_size = models.DecimalField(
        "Original Size of the packet in g",
        decimal_places=2,
        max_digits=7,
        null=True,
    )
    size = models.DecimalField(
        "Current Size of the packet in g",
        decimal_places=2,
        max_digits=7,
        null=True,
    )
    discount = models.DecimalField("Discount", decimal_places=2, max_digits=6, default=0)
    tax = models.DecimalField("Tax Percentage", decimal_places=2, max_digits=5, default=5)

class ProductLedger(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    date = models.DateTimeField()
    remarks = models.CharField(max_length=300)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    bal_before = models.DecimalField(max_digits=8, decimal_places=2)
    bal_after = models.DecimalField(max_digits=8, decimal_places=2)
    link = models.CharField("Linked To", max_length=50, null=True, blank=True, default=None)

    class Meta:
        ordering = ['-date', '-id']
