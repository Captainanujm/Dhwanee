from rest_framework import serializers
from .models import (
    Supplier,
    SupplierBill,
    SupplierLedger,
    SupplierBillExtraExpenses,
    PurchaseReturn,
)
from products.serializers import ProductItemSerializerDeep


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class SupplierBillExtraExpensesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierBillExtraExpenses
        fields = "__all__"


class SupplierProductItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    quantity = serializers.DecimalField(max_digits=6, decimal_places=2)
    tax = serializers.DecimalField(max_digits=5, decimal_places=2)
    buying_cgst = serializers.DecimalField(max_digits=8, decimal_places=2)
    buying_sgst = serializers.DecimalField(max_digits=8, decimal_places=2)
    buying_igst = serializers.DecimalField(max_digits=8, decimal_places=2)
    buying_price = serializers.DecimalField(
        max_digits=7, decimal_places=2, required=False
    )
    # selling_price = serializers.DecimalField(max_digits=7, decimal_places=2)
    # total_price = serializers.DecimalField(max_digits=7, decimal_places=2)


class InitialStockSerializer(serializers.Serializer):
    date = serializers.CharField()
    ref = serializers.CharField(required=False)
    products = SupplierProductItemSerializer(many=True)


class SupplierBillSerializerAtCreation(serializers.Serializer):
    date = serializers.CharField()
    number = serializers.CharField()
    supplier = serializers.IntegerField()
    products = SupplierProductItemSerializer(many=True)
    extra_expenses = SupplierBillExtraExpensesSerializer(many=True)
    received_status = serializers.BooleanField(required=True)
    cgst = serializers.DecimalField(max_digits=8, decimal_places=2)
    sgst = serializers.DecimalField(max_digits=8, decimal_places=2)
    igst = serializers.DecimalField(max_digits=8, decimal_places=2)
    cash_discount = serializers.DecimalField(max_digits=8, decimal_places=2)
    cash_discount_type = serializers.ChoiceField(choices=("percentage", "amount"))


class SupplierBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierBill
        fields = "__all__"


class SupplierLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierLedger
        fields = "__all__"


class SupplierBillSerializerDeep(serializers.ModelSerializer):
    supplier = SupplierSerializer()
    products = ProductItemSerializerDeep(many=True)
    extra_expenses = SupplierBillExtraExpensesSerializer(many=True)
    ledger = SupplierLedgerSerializer()

    class Meta:
        model = SupplierBill
        fields = "__all__"


class PurchaseReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseReturn
        fields = "__all__"


class PurchaseReturnSerializerDeep(serializers.ModelSerializer):
    supplier = SupplierSerializer()
    products = ProductItemSerializerDeep(many=True)
    ledger = SupplierLedgerSerializer()

    class Meta:
        model = PurchaseReturn
        fields = "__all__"
