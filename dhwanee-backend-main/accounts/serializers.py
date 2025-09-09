from rest_framework.serializers import ModelSerializer, StringRelatedField

from store.serializers import BranchSerializer
from .models import Account, AccountLedger, PaymentMethod, PaymentLabel


class AccountSerializer(ModelSerializer):
    branch = BranchSerializer()
    class Meta:
        model = Account
        fields = "__all__"


class AccountSerializerShallow(ModelSerializer):
    class Meta:
        model = Account
        fields = ["name", "id"]


class AccountLedgerSerializerShallow(ModelSerializer):
    class Meta:
        model = AccountLedger
        fields = "__all__"


class PaymentMethodSerializer(ModelSerializer):
    account = AccountSerializer(read_only=True)
    branch = BranchSerializer()

    class Meta:
        model = PaymentMethod
        fields = "__all__"


class PaymentMethodSerializerForCreate(ModelSerializer):

    class Meta:
        model = PaymentMethod
        fields = "__all__"


class PaymentMethodSerializerShallow(ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["name", "id"]

class PaymentLabelSerializer(ModelSerializer):
    class Meta:
        model = PaymentLabel
        fields = "__all__"


class AccountLedgerSerializer(ModelSerializer):
    account = StringRelatedField()
    method = StringRelatedField()
    labels = PaymentLabelSerializer(many=True)

    class Meta:
        model = AccountLedger
        fields = "__all__"


class AccountLedgerSerializerForTrxn(ModelSerializer):
    account = AccountSerializer()
    method = PaymentMethodSerializerShallow()
    labels = PaymentLabelSerializer(many=True)

    class Meta:
        model = AccountLedger
        fields = "__all__"
