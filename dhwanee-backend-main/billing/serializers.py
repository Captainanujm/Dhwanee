from rest_framework.serializers import ModelSerializer, StringRelatedField

from accounts.serializers import AccountLedgerSerializerForTrxn
from .models import Bill, DeliveryChallan, DeliveryChallanItem, SalesReturn

from products.serializers import ProductItemSerializerDeep
from customers.serializers import CustomerLedgerSerializer, CustomerSerializer

class BillSerializer(ModelSerializer):
    products = ProductItemSerializerDeep(many=True)
    ledger = CustomerLedgerSerializer(many=True)
    customer = CustomerSerializer()
    payments = AccountLedgerSerializerForTrxn(many=True)
    class Meta:
        model = Bill
        fields = "__all__"


class BillSerializer2(ModelSerializer):
    customer = StringRelatedField()
    class Meta:
        model = Bill
        fields = ['date', 'id', 'number', 'payable', 'customer']


class SalesReturnSerializer(ModelSerializer):
    products = ProductItemSerializerDeep(many=True)
    ledger = CustomerLedgerSerializer()
    customer = CustomerSerializer()
    bill = BillSerializer()
    class Meta:
        model = SalesReturn
        fields = "__all__"


class SalesReturnSearchSerializer(ModelSerializer):
    class Meta:
        model = SalesReturn
        fields = ['date', 'number', 'id']


class DeliveryChallanItemSerializer(ModelSerializer):
    product = ProductItemSerializerDeep()

    class Meta:
        model = DeliveryChallanItem
        fields = "__all__"


class DeliveryChallanSerializer(ModelSerializer):
    items = DeliveryChallanItemSerializer(many=True)
    customer = CustomerSerializer()
    converted_to = StringRelatedField()

    class Meta:
        model = DeliveryChallan
        fields = "__all__"


class DeliveryChallanSerializer2(ModelSerializer):
    customer = CustomerSerializer()
    class Meta:
        model = DeliveryChallan
        fields = ["date", "id", "number", "total", "customer"]
