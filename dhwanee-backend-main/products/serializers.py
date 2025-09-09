from rest_framework.serializers import ModelSerializer, PrimaryKeyRelatedField
from .models import Category, ProductLedger, SubCategory, Product, ProductItem, RecipeIngredient


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubCategorySerializer(ModelSerializer):
    product_set = PrimaryKeyRelatedField(many=True, read_only=True)
    class Meta:
        model = SubCategory
        fields = "__all__"


class SubCategorySerializer2(ModelSerializer):
    category = CategorySerializer()
    class Meta:
        model = SubCategory
        fields = "__all__"
class ProductSerializer(ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

class RecipeIngredientSerializer(ModelSerializer):
    product=ProductSerializer()
    class Meta:
        model = RecipeIngredient
        fields = "__all__"

class RecipeIngredientMinimalSerializer(ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = "__all__"

class ProductSerializerDeep(ModelSerializer):
    category=CategorySerializer()
    subcategory = SubCategorySerializer2()
    recipe=RecipeIngredientSerializer(many=True)
    class Meta:
        model = Product
        fields = "__all__"

class ProductItemSerializer(ModelSerializer):
    class Meta:
        model = ProductItem
        fields = "__all__"

class ProductItemSerializerDeep(ModelSerializer):
    product=ProductSerializer()
    class Meta:
        model = ProductItem
        fields = "__all__"


class ProductLedgerSerializer(ModelSerializer):
    class Meta:
        model = ProductLedger
        # fields = "__all__"
        exclude = ["product"]

class ProductLedgerSerializerDeep(ModelSerializer):
    product = ProductSerializer()
    class Meta:
        model = ProductLedger
        fields = "__all__"
