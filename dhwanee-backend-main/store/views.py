from rest_framework.viewsets import ViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import AccountLedger
from billing.models import Bill

# from .utils import get_opening_balance, correct_all_ledgers_after
from django.utils import timezone
from django.db.models import Count, Sum


class ReportViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["GET"], url_path="bills-overview")
    def bills_overview(self, request):
        filters = {
            "agency": request.user.agency_set.first(),
            "branch__in": request.user.branch_set.all(),
        }
        if request.GET.get("branch"):
            filters["branch__in"] = request.user.branch_set.filter(
                id__in=request.GET.get("branch").split(",")
            )
        if request.GET.get("from"):
            filters["date__gte"] = timezone.datetime.fromisoformat(
                request.GET.get("from").replace(" ", "+")
            )
        if request.GET.get("to"):
            filters["date__lte"] = timezone.datetime.fromisoformat(
                request.GET.get("to").replace(" ", "+")
            )
        data = {}
        bills = Bill.objects.filter(**filters)

        # data["daily"] = (
        #     bills.values("date__day", "date__month", "date__year")
        #     .annotate(
        #         count=Count("id"),
        #         sum=Sum("total"),
        #     )
        #     .order_by("date__month", "date__day")
        # )

        data["products"] = bills.annotate(products_count=Count("products")).aggregate(
            total_products=Sum("products_count")
        )

        data["payment_methods"] = (
            AccountLedger.objects.filter(bill__in=bills)
            .values("method", "method__name")
            .annotate(count=Count("id"), total=Sum("amount"))
        )

        data["sales"] = bills.aggregate(count=Count("id"), sum=Sum("total"))

        return Response({"data": data})
