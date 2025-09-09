from rest_framework.viewsets import ModelViewSet, ViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_201_CREATED

from .models import Customer, CustomerLedger
from .serializers import CustomerSerializer, CustomerLedgerSerializer


from accounts.models import AccountLedger, Account
from accounts.utils import (
    get_opening_balance as get_account_opening_balance,
    correct_all_ledgers_after as correct_all_account_ledgers_after,
)
from .utils import get_opening_balance, correct_all_ledgers_after
from django.utils import timezone
class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(branch__in=self.request.user.branch_set.all())

    def create(self, request):
        data = dict(request.data)
        data["agency"] = request.user.agency_set.values('pk').first().get('pk')
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['GET'])
    def search(self, request):
        if request.GET.get('q') is None:
            return Response({
                'message': 'Search Parameter not provided',
                'success': False,
            }, status=HTTP_400_BAD_REQUEST)
        try:
            customers = self.get_queryset().filter(
                name__icontains=request.GET.get("q", ""))
        except:
            return Response({
                "success": False,
                "message": "Unable to get customers!"}, status=HTTP_500_INTERNAL_SERVER_ERROR)

        page = self.paginate_queryset(customers)
        serialized = self.serializer_class(
            page, context={'request': request}, many=True)
        return self.get_paginated_response(serialized.data)
    @action(detail=True, methods=['GET'])
    def ledger(self, request, pk):
        ledgers = CustomerLedger.objects.filter(customer=pk, customer__in=self.get_queryset()).order_by('-date')

        page = self.paginate_queryset(ledgers)
        serialized = CustomerLedgerSerializer(
            page, context={'request': request}, many=True)
        return self.get_paginated_response(serialized.data)
    
    @action(detail=True, methods=["POST"], url_path="payment")
    def create_payment(self, request, pk):
        if (
            request.data.get("remarks") is None
            or request.data.get("date") is None
            or request.data.get("account") is None
            or request.data.get("amount") is None
            or request.data.get("labels") is None
        ):
            return Response(
                {"message": "Not all fields were provided"},
                status=HTTP_400_BAD_REQUEST,
            )

        try:
            account = Account.objects.get(id=request.data.get("account"))
        except Account.DoesNotExist:
            return Response(
                {"message": "Invalid account id"}, status=HTTP_400_BAD_REQUEST
            )

        try:
            customer = self.get_queryset().get(pk=pk)
        except Account.DoesNotExist:
            return Response(
                {"message": "Invalid customer id"}, status=HTTP_400_BAD_REQUEST
            )

        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except ValueError:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        opening_balance = get_account_opening_balance(account.id, date)
        ledger = AccountLedger.objects.create(
            remarks=(
                request.data.get("remarks")
                if request.data.get("remarks") != ""
                else f"Payment made to {customer.name}"
            ),
            amount=-request.data.get("amount"),
            date=date,
            balance_before=opening_balance,
            balance_after=opening_balance - request.data.get("amount"),
            account_id=request.data.get("account"),
            method_id=request.data.get("method"),
        )
        ledger.labels.set(request.data.get("labels"))
        account.balance = correct_all_account_ledgers_after(account.id, date)
        account.save()
        opening_balance = get_opening_balance(customer, date)
        ledger = CustomerLedger.objects.create(
            customer=customer,
            remarks=ledger.remarks,
            amount=-request.data.get("amount"),
            date=date,
            balance_before=opening_balance,
            balance_after=opening_balance - request.data.get("amount"),
        )
        customer.balance = correct_all_ledgers_after(customer, date)
        customer.save()
        return Response(self.serializer_class(customer).data)


