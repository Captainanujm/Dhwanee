from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import AccountLedger, Account, PaymentMethod, PaymentLabel
from .serializers import (
    AccountSerializer,
    PaymentMethodSerializer,
    PaymentLabelSerializer,
    AccountLedgerSerializerForTrxn,
    AccountLedgerSerializer,
    PaymentMethodSerializerForCreate,
    PaymentMethodSerializerShallow
)
from .utils import (
    get_opening_balance,
    correct_all_ledgers_after,
)
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_201_CREATED


class AccountViewSet(ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(branch__in=self.request.user.branch_set.all())

    def create(self, request):
        if (
            request.data.get("name") is None
            or type(request.data.get("balance")) is not int
        ):
            return Response(
                {"message": "Provide all fields"}, status=HTTP_400_BAD_REQUEST
            )

        account = Account.objects.create(
            name=request.data.get("name"),
            balance=request.data.get("balance"),
            branch_id=request.data.get("branch"),
            agency_id= request.user.agency_set.values('pk').first().get('pk')
        )

        if request.data.get("balance") != 0:
            AccountLedger.objects.create(
                account=account,
                date=timezone.now(),
                amount=request.data.get("balance"),
                balance_before=0,
                balance_after=request.data.get("balance"),
                remarks="Opening Balance",
            )
        return Response(self.serializer_class(account).data, status=HTTP_201_CREATED)

    @action(detail=False, methods=["GET"])
    def search(self, request):
        if request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            results = self.queryset.filter(name__icontains=request.GET.get("q", ""))
        except:
            return Response(
                {"success": False, "message": "Unable to get results!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(results)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"])
    def transactions(self, request):
        filters = {}
        try:
            if request.GET.get('from'):
                filters["date__gte"] = timezone.datetime.fromisoformat(
                    request.GET.get("from")
                )
            if request.GET.get('to'):
                filters["date__lte"] = timezone.datetime.fromisoformat(
                    request.GET.get("to")
                )
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )
        if request.GET.get("account"):
            filters["account_id__in"] = request.GET.get("account").split(",")

        if request.GET.get("method"):
            filters["method_id__in"] = request.GET.get("method").split(",")
        if request.GET.get("labels"):
            filters["labels__in"] = request.GET.get("labels").split(",")
        if request.GET.get("desc"):
            filters["remarks__icontains"] = request.GET.get("desc")

        print(filters)
        accounts = AccountLedger.objects.filter(**filters).order_by("-date", "-id")

        page = self.paginate_queryset(accounts)
        serialized = AccountLedgerSerializerForTrxn(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=True, methods=["GET"])
    def ledger(self, request, pk):
        filters = {"account_id": pk}
        try:
            if request.GET.get('from'):
                filters["date__gte"] = timezone.datetime.fromisoformat(
                    request.GET.get("from")
                )
            if request.GET.get('to'):
                filters["date__lte"] = timezone.datetime.fromisoformat(
                    request.GET.get("to")
                )
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        if request.GET.get("methods"):
            filters["method_id__in"] = request.GET.get("methods").split(",")
        if request.GET.get("labels"):
            filters["labels__in"] = request.GET.get("labels").split(",")
        if request.GET.get("desc"):
            filters["remarks__icontains"] = request.GET.get("desc")

        accounts = AccountLedger.objects.filter(**filters).order_by("-date", "-id")

        page = self.paginate_queryset(accounts)
        serialized = AccountLedgerSerializer(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)
    
    @action(detail=True, url_path="delete-transaction", methods=["DELETE"])
    def delete_transaction(self, request, pk):
        try:
            trxn = AccountLedger.objects.get(account__in=self.get_queryset(), pk=pk)
            date = trxn.date
            account = trxn.account
            trxn.delete()
            account.balance = correct_all_ledgers_after(account.id, date)
            account.save()
            return Response({
                'detail': ['Deleted succesfully']
            })
        except AccountLedger.DoesNotExist:
            return Response({
                'detail': ['Does not exist']
            }, status=HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["POST"], url_path="create-transaction")
    def create_transaction(self, request):
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
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except ValueError:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        opening_balance = get_opening_balance(account.id, date)
        ledger = AccountLedger.objects.create(
            remarks=request.data.get("remarks"),
            amount=-request.data.get("amount"),
            date=date,
            balance_before=opening_balance,
            balance_after=opening_balance - request.data.get("amount"),
            account_id=request.data.get("account"),
            method_id=request.data.get("method"),
        )
        ledger.labels.set(request.data.get("labels"))
        account.balance = correct_all_ledgers_after(account.id, date)
        account.save()
        return Response({"success": True})


class PaymentMethodViewSet(ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(branch__in=self.request.user.branch_set.all())

    def create(self, request):
        data = dict(request.data)
        data["agency"] = request.user.agency_set.values('pk').first().get('pk')
        serializer = PaymentMethodSerializerForCreate(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["GET"])
    def search(self, request):
        if request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            results = self.queryset.filter(name__icontains=request.GET.get("q", ""))
            print(request.GET.get("q", ""))
        except:
            return Response(
                {"success": False, "message": "Unable to get results!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(results)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)
    
    @action(detail=True, methods=["GET"])
    def ledger(self, request, pk):
        filters = {"method_id": pk}
        try:
            if request.GET.get('from'):
                filters["date__gte"] = timezone.datetime.fromisoformat(
                    request.GET.get("from")
                )
            if request.GET.get('to'):
                filters["date__lte"] = timezone.datetime.fromisoformat(
                    request.GET.get("to")
                )
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        if request.GET.get("methods"):
            filters["method_id__in"] = request.GET.get("methods").split(",")
        if request.GET.get("labels"):
            filters["labels__in"] = request.GET.get("labels").split(",")
        if request.GET.get("desc"):
            filters["remarks__icontains"] = request.GET.get("desc")

        print(filters)
        accounts = AccountLedger.objects.filter(**filters).order_by("-date", "-id")

        page = self.paginate_queryset(accounts)
        serialized = AccountLedgerSerializer(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)


class PaymentLabelViewSet(ModelViewSet):
    queryset = PaymentLabel.objects.all()
    serializer_class = PaymentLabelSerializer
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

    @action(detail=False, methods=["GET"])
    def search(self, request):
        if request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            results = self.queryset.filter(name__icontains=request.GET.get("q", ""))
        except:
            return Response(
                {"success": False, "message": "Unable to get results!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(results)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=True, methods=["GET"])
    def ledger(self, request, pk):
        filters = {"labels__in": [pk]}
        try:
            if request.GET.get('from'):
                filters["date__gte"] = timezone.datetime.fromisoformat(
                    request.GET.get("from")
                )
            if request.GET.get('to'):
                filters["date__lte"] = timezone.datetime.fromisoformat(
                    request.GET.get("to")
                )
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        if request.GET.get("methods"):
            filters["method_id__in"] = request.GET.get("methods").split(",")
        if request.GET.get("labels"):
            filters["labels__in"] = request.GET.get("labels").split(",")
        if request.GET.get("desc"):
            filters["remarks__icontains"] = request.GET.get("desc")

        print(filters)
        accounts = AccountLedger.objects.filter(**filters).order_by("-date", "-id")

        page = self.paginate_queryset(accounts)
        serialized = AccountLedgerSerializer(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)