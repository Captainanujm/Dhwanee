from django.contrib import admin
from .models import Product, ProductItem, RecipeIngredient
# Register your models here.
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    pass

@admin.register(ProductItem)
class ProductItemAdmin(admin.ModelAdmin):
    pass

@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    pass


