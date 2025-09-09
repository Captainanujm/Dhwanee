from rest_framework.serializers import ModelSerializer
from .models import Customer, CustomerLedger

class CustomerSerializer(ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"

class CustomerLedgerSerializer(ModelSerializer):
    class Meta:
        model = CustomerLedger
        fields = "__all__"
