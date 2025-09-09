from django.http import FileResponse
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_500_INTERNAL_SERVER_ERROR,
    HTTP_404_NOT_FOUND,
)

from django.utils import timezone
from django.db.models import Q

from products.models import ProductItem, ProductLedger
from accounts.models import AccountLedger, PaymentLabel, PaymentMethod
from internals.models import BillNumber
from customers.models import Customer, CustomerLedger
from products.utils import (
    correct_all_product_ledgers_after,
    get_product_opening_balance,
)

from .models import Bill, DeliveryChallan, DeliveryChallanItem, SalesReturn
from .serializers import (
    BillSerializer,
    BillSerializer2,
    DeliveryChallanSerializer,
    DeliveryChallanSerializer2,
    SalesReturnSerializer,
    SalesReturnSearchSerializer,
)

from customers.utils import get_opening_balance, correct_all_ledgers_after
from accounts.utils import (
    get_opening_balance as get_account_opening_balance,
    correct_all_ledgers_after as correct_all_account_ledgers_after,
)


class BillViewSet(ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            super().get_queryset().filter(branch__in=self.request.user.branch_set.all())
        )

    def get_serializer_class(self):
        if self.action == "list":
            return BillSerializer2
        return super().get_serializer_class()

    def create(self, request):
        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        data = request.data

        try:
            customer = Customer.objects.get(id=data["customer"])
        except:
            return Response(
                {"message": "Invalid Customer"}, status=HTTP_400_BAD_REQUEST
            )

        products = []
        subtotal = 0
        total = 0
        cgst = 0
        sgst = 0
        igst = 0

        if data.get("branch") is None:
            return Response(
                {"error": "Branch of the bill was not specified"},
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            number = BillNumber.objects.get(
                name="BILL_NUMBER",
                branch_id=request.data.get("branch"),
                agency=request.user.agency_set.first(),
            )
        except:
            number = BillNumber.objects.create(
                name="BILL_NUMBER",
                branch_id=request.data.get("branch"),
                agency=request.user.agency_set.first(),
                next_bill_number=1,
                fy_1=str(date.year)[-2:],
                fy_2=str(date.year + 1)[-2:],
            )
        if (
            number.fy_1 != str(date.year)[-2:]
            if date.month > 3
            else str(date.year - 1)[-2:]
        ):
            number.fy_1 = (
                str(date.year)[-2:] if date.month > 3 else str(date.year - 1)[-2:]
            )
            number.fy_1 = (
                str(date.year + 1)[-2:] if date.month > 3 else str(date.year)[-2:]
            )
        _date = date
        ledgers = []
        for product in data["products"]:
            _prod = ProductItem.objects.get(id=product["id"])
            if _prod.size is not None and float(_prod.size) >= product["size"]:
                __product = ProductItem(
                    product=_prod.product,
                    uuid=_prod.uuid,
                    parent=_prod,
                    status="SOLD",
                    price=product["price"] or _prod.price,
                    size=product["size"],
                    original_size=product["size"],
                    tax=_prod.tax,
                    discount=product["discount"],
                )

                _prod.size = float(_prod.size) - product["size"]
                if _prod.size <= 0:
                    _prod.status = "SOLD"
                _prod.save()
                unit_price_before_tax = round(
                    float(__product.price) * (100 / (100 + float(__product.tax))),
                    2,
                )
                price_before_tax = round(
                    unit_price_before_tax * float(__product.size), 2
                )
            elif _prod.size is None:
                _prod.price = product["price"] or _prod.price
                _prod.discount = product["discount"]
                _prod.status = "SOLD"
                __product = _prod
                price_before_tax = round(
                    float(__product.price) * (100 / (100 + float(__product.tax))),
                    2,
                )
            else:
                return Response(
                    {"error": "product size is more than available quantity"},
                    status=HTTP_400_BAD_REQUEST,
                )

            __product.save()
            tax = round(float(__product.tax) * 0.01 * price_before_tax, 2)
            if customer.state == "UTTAR PRADESH - 09":
                _cgst = _sgst = round(tax / 2, 2)
                _igst = 0
            else:
                _cgst = _sgst = 0
                _igst = tax
            subtotal += price_before_tax
            cgst += _cgst
            sgst += _sgst
            igst += _igst

            opening = get_product_opening_balance(_prod.product, date)
            amount = float(__product.size) if __product.size is not None else 1
            _date = _date + timezone.timedelta(seconds=1)
            ledgers.append(
                ProductLedger.objects.create(
                    product=_prod.product,
                    date=_date,
                    amount=-amount,
                    bal_before=opening,
                    bal_after=opening - amount,
                    remarks="Sold on bill {}".format(
                        number.format.replace(
                            "__number__", str(number.next_bill_number)
                        )
                        .replace("__fy_1__", str(number.fy_1))
                        .replace("__fy_2__", str(number.fy_2))
                    ),
                ).id
            )
            _prod.product.current_stock = correct_all_product_ledgers_after(
                _prod.product, date
            )
            _prod.product.save()
            products.append(__product.id)

        total = round(
            subtotal + cgst + sgst + igst,
            2,
        )
        roundoff = round(1 - (total % 1) if total % 1 > 0.49 else -(total % 1), 2)
        total += roundoff
        payable = total + (
            float(customer.balance) if data.get("use_previous_balance", True) else 0
        )

        bill = Bill.objects.create(
            branch_id=request.data.get("branch"),
            agency=request.user.agency_set.first(),
            customer=customer,
            date=date,
            number=number.format.replace("__number__", str(number.next_bill_number))
            .replace("__fy_1__", str(number.fy_1))
            .replace("__fy_2__", str(number.fy_2)),
            subtotal=subtotal,
            cgst=cgst,
            sgst=sgst,
            igst=igst,
            total=total,
            roundoff=roundoff,
            payable=payable,
            use_previous_balance=data.get("use_previous_balance", True),
        )
        ProductLedger.objects.filter(id__in=ledgers).update(link="BILL/" + str(bill.id))

        ledgers.clear()
        received = 0
        for payment in data["payments"]:
            if payment is not None:
                method = PaymentMethod.objects.get(id=payment["id"])
                received += payment["amount"]
                opening = get_account_opening_balance(method.account, date)
                ledgers.append(
                    AccountLedger.objects.create(
                        remarks="Sale on bill number: " + bill.number,
                        amount=payment["amount"],
                        balance_before=opening,
                        balance_after=opening + payment["amount"],
                        date=date,
                        method=method,
                        account=method.account,
                        link="BILL/" + str(bill.id),
                    )
                )
                method.account.balance = correct_all_account_ledgers_after(
                    method.account, date
                )
                method.account.save()
                ledgers[-1].labels.add(
                    PaymentLabel.objects.get_or_create(
                        name="Sales", agency=bill.agency, branch=bill.branch
                    )[0].id
                )
        bill.payments.set(ledgers)

        ledgers.clear()
        opening = get_opening_balance(customer, date)
        ledgers.append(
            CustomerLedger.objects.create(
                date=date,
                remarks="Invoice #%s" % bill.number,
                balance_before=opening,
                balance_after=opening + total,
                amount=total,
                customer=customer,
                link="BILL/" + str(bill.id),
            ).id
        )
        if received > 0:
            ledgers.append(
                CustomerLedger.objects.create(
                    date=date,
                    remarks="Payment for invoice #%s" % bill.number,
                    balance_before=opening + total,
                    balance_after=opening + total - received,
                    amount=-received,
                    customer=customer,
                    link="BILL/" + str(bill.id),
                ).id
            )

        customer.balance = correct_all_ledgers_after(customer, date)
        customer.save()
        bill.products.set(products)
        bill.ledger.set(ledgers)
        bill.save()

        number.next_bill_number += 1
        number.save()

        return Response({"bill": bill.id, "number": bill.number})

    def update(self, request, pk, *args, **kwargs):
        data = request.data

        # Load the bill
        try:
            bill = (
                self.get_queryset()
                .prefetch_related("customer", "ledger", "products", "payments")
                .get(pk=pk)
            )
        except Bill.DoesNotExist:
            return Response({"message": "Bill not found"}, status=HTTP_400_BAD_REQUEST)

        # Reset the status of all products
        for prod in bill.products.all():
            date = bill.date + timezone.timedelta(seconds=1)
            opening = get_product_opening_balance(prod.product, date)
            amount = float(prod.size) if prod.size is not None else 1
            ProductLedger.objects.create(
                product=prod.product,
                date=date,
                amount=amount,
                bal_before=opening,
                bal_after=opening + amount,
                remarks="Product Ledger reverse due to bill update {}".format(
                    bill.number
                ),
            )
            prod.product.current_stock = correct_all_product_ledgers_after(
                prod.product, date
            )
            prod.product.save()

            if prod.parent is None:
                prod.status = "UNSOLD"
                prod.save()
            else:
                prod.parent.size = float(prod.parent.size) + float(prod.size)
                prod.parent.status = "UNSOLD"
                prod.parent.save()
                prod.delete()

        # Delete records
        bill.ledger.all().delete()
        for payment in bill.payments.all():
            account = payment.account
            payment.delete()
            account.balance = correct_all_account_ledgers_after(
                account.id, bill.date - timezone.timedelta(seconds=1)
            )
            account.save()

        try:
            customer = Customer.objects.get(id=data["customer"])
        except:
            return Response(
                {"message": "Invalid Customer"}, status=HTTP_400_BAD_REQUEST
            )

        if customer != bill.customer:
            bill.customer.balance = correct_all_ledgers_after(
                bill.customer, bill.date - timezone.timedelta(seconds=1)
            )
            bill.customer.save()

        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        products = []
        subtotal = 0
        total = 0
        cgst = 0
        sgst = 0
        igst = 0

        if data.get("branch") is None:
            return Response(
                {"error": "Branch of the bill was not specified"},
                status=HTTP_400_BAD_REQUEST,
            )
        _date = date
        ledgers = []
        for product in data["products"]:
            _prod = ProductItem.objects.get(
                id=product["id"] if product["parent"] is None else product["parent"]
            )
            if _prod.size is not None and float(_prod.size) >= product["size"]:
                __product = ProductItem(
                    product=_prod.product,
                    uuid=_prod.uuid,
                    parent=_prod,
                    status="SOLD",
                    price=product["price"] or _prod.price,
                    size=product["size"],
                    original_size=product["size"],
                    tax=_prod.tax,
                    discount=product["discount"],
                )

                _prod.size = float(_prod.size) - product["size"]
                if _prod.size <= 0:
                    _prod.status = "SOLD"
                _prod.save()
                unit_price_before_tax = round(
                    float(__product.price) * (100 / (100 + float(__product.tax))),
                    2,
                )
                price_before_tax = round(
                    unit_price_before_tax * float(__product.size), 2
                )
            elif _prod.size is None:
                _prod.price = product["price"] or _prod.price
                _prod.discount = product["discount"]
                _prod.status = "SOLD"
                __product = _prod
                price_before_tax = round(
                    float(__product.price) * (100 / (100 + float(__product.tax))),
                    2,
                )
            else:
                return Response(
                    {"error": "product size is more than available quantity"},
                    status=HTTP_400_BAD_REQUEST,
                )

            __product.save()
            tax = round(float(__product.tax) * 0.01 * price_before_tax, 2)
            if customer.state == "UTTAR PRADESH - 09":
                _cgst = _sgst = round(tax / 2, 2)
                _igst = 0
            else:
                _cgst = _sgst = 0
                _igst = tax
            subtotal += price_before_tax
            cgst += _cgst
            sgst += _sgst
            igst += _igst

            opening = get_product_opening_balance(_prod.product, date)
            amount = float(__product.size) if __product.size is not None else 1
            _date = _date + timezone.timedelta(seconds=1)
            ledgers.append(
                ProductLedger.objects.create(
                    product=_prod.product,
                    date=_date,
                    amount=-amount,
                    bal_before=opening,
                    bal_after=opening - amount,
                    remarks="Sold on bill {}".format(bill.number),
                ).id
            )
            _prod.product.current_stock = correct_all_product_ledgers_after(
                _prod.product, date
            )
            _prod.product.save()
            products.append(__product.id)

        total = round(
            subtotal + cgst + sgst + igst,
            2,
        )
        roundoff = round(1 - (total % 1) if total % 1 > 0.49 else -(total % 1), 2)
        total += roundoff
        payable = total + (
            float(customer.balance) if data.get("use_previous_balance", True) else 0
        )

        bill.date = date
        bill.subtotal = subtotal
        bill.cgst = cgst
        bill.sgst = sgst
        bill.igst = igst
        bill.total = total
        bill.roundoff = roundoff
        bill.payable = payable
        bill.use_previous_balance = data.get("use_previous_balance", True)
        ProductLedger.objects.filter(id__in=ledgers).update(link="BILL/" + str(bill.id))

        ledgers.clear()
        received = 0
        for payment in data["payments"]:
            if payment is not None:
                method = PaymentMethod.objects.get(id=payment["id"])
                received += payment["amount"]
                opening = get_account_opening_balance(method.account, date)
                ledgers.append(
                    AccountLedger.objects.create(
                        remarks="Sale on bill number: " + bill.number,
                        amount=payment["amount"],
                        balance_before=opening,
                        balance_after=opening + payment["amount"],
                        date=date,
                        method=method,
                        account=method.account,
                        link="BILL/" + str(bill.id),
                    )
                )
                method.account.balance = correct_all_account_ledgers_after(
                    method.account, date
                )
                method.account.save()
                ledgers[-1].labels.add(
                    PaymentLabel.objects.get_or_create(
                        name="Sales", agency=bill.agency, branch=bill.branch
                    )[0].id
                )
        bill.payments.set(ledgers)

        ledgers.clear()
        opening = get_opening_balance(customer, date)
        ledgers.append(
            CustomerLedger.objects.create(
                date=date,
                remarks="Invoice #%s" % bill.number,
                balance_before=opening,
                balance_after=opening + total,
                amount=total,
                customer=customer,
                link="BILL/" + str(bill.id),
            ).id
        )
        if received > 0:
            ledgers.append(
                CustomerLedger.objects.create(
                    date=date,
                    remarks="Payment for invoice #%s" % bill.number,
                    balance_before=opening + total,
                    balance_after=opening + total - received,
                    amount=-received,
                    customer=customer,
                    link="BILL/" + str(bill.id),
                ).id
            )

        customer.balance = correct_all_ledgers_after(customer, date)
        customer.save()
        bill.products.set(products)
        bill.ledger.set(ledgers)
        bill.save()

        return Response({"bill": bill.id, "number": bill.number})

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
            bills = (
                self.get_queryset()
                .filter(Q(number__icontains=request.GET.get("q", "")) | Q(customer__name__icontains=request.GET.get("q", "")))
                .order_by("-date")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get Bills!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(bills)
        serialized = BillSerializer2(page, context={"request": request}, many=True)
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"], url_path="by-day")
    def by_day(self, request):
        if request.GET.get("from") is None or request.GET.get("to") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )

        try:
            from_date = timezone.datetime.fromisoformat(request.GET.get("from"))
            to_date = timezone.datetime.fromisoformat(request.GET.get("to"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        try:
            bills = (
                self.get_queryset()
                .filter(date__gte=from_date, date__lte=to_date)
                .prefetch_related("ledger", "customer", "payments", "products")
                .order_by("date")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get Bills!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serialized = self.serializer_class(
            bills, context={"request": request}, many=True
        )
        return Response(serialized.data)


class SalesReturnViewSet(ModelViewSet):
    queryset = SalesReturn.objects.all()
    serializer_class = SalesReturnSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request):
        data = request.data

        # Load the bill
        try:
            bill = Bill.objects.prefetch_related(
                "customer",
                "ledger",
                "products",
            ).get(pk=data.get("bill"), branch__in=self.request.user.branch_set.all())
        except Bill.DoesNotExist:
            return Response({"message": "Bill not found"}, status=HTTP_400_BAD_REQUEST)

        returned = []
        total = 0
        # Reset the status of all products
        for _prod in request.data.get("products"):
            prod = ProductItem.objects.get(id=_prod)
            if prod.parent_prod is None:
                prod.status = "UNSOLD"
                total += float(prod.selling_price)
                print(prod.selling_price)
                prod.selling_price = float(prod.selling_price) + float(prod.discount)
                prod.discount = 0
                prod.save()
                returned.append(prod.id)
            else:
                prod.parent_prod.length = float(prod.parent_prod.length) + float(
                    prod.length
                )
                prod.parent_prod.status = "UNSOLD"
                prod.parent_prod.save()
                total += float(prod.selling_price) * float(prod.length)
                returned.append(prod.parent_prod)

        date = timezone.now()
        number = BillNumber.objects.filter(name="RETURN_NUMBER").first()

        ledger = CustomerLedger.objects.create(
            date=date,
            remarks="[SalesReturn] Return number RET/%s for bill number %s"
            % (number.next_bill_number, bill.number),
            balance_before=bill.customer.balance,
            balance_after=float(bill.customer.balance) - total,
            amount=-total,
            customer=bill.customer,
        )
        bill.customer.balance = ledger.balance_after
        bill.customer.save()
        obj = SalesReturn.objects.create(
            bill=bill,
            customer=bill.customer,
            total=total,
            date=date,
            number="RET/{}".format(number.next_bill_number),
            ledger=ledger,
        )
        obj.products.set(returned)
        number.next_bill_number += 1
        number.save()
        return Response({"success": True, "id": obj.id})

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
            bills = SalesReturn.objects.filter(
                number__icontains=request.GET.get("q", "")
            ).order_by("-date")
        except:
            return Response(
                {"success": False, "message": "Unable to get Bills!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(bills)
        serialized = SalesReturnSearchSerializer(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)


class DeliveryChallanViewSet(ModelViewSet):
    queryset = DeliveryChallan.objects.all()
    serializer_class = DeliveryChallanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            super().get_queryset().filter(branch__in=self.request.user.branch_set.all())
        )

    def get_serializer_class(self):
        if self.action == "list":
            return DeliveryChallanSerializer2
        return super().get_serializer_class()


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
            bills = (
                self.get_queryset()
                .filter(Q(number__icontains=request.GET.get("q", "")) | Q(customer__name__icontains=request.GET.get("q", "")))
                .order_by("-date")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get deliery challans!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(bills)
        serialized = DeliveryChallanSerializer2(page, context={"request": request}, many=True)
        return self.get_paginated_response(serialized.data)


    def create(self, request):
        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        data = request.data

        try:
            customer = Customer.objects.get(id=data["customer"])
        except:
            return Response(
                {"message": "Invalid Customer"}, status=HTTP_400_BAD_REQUEST
            )

        products = []
        subtotal = 0
        total = 0
        cgst = 0
        sgst = 0
        igst = 0

        if data.get("branch") is None:
            return Response(
                {"error": "Branch of the bill was not specified"},
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            number = BillNumber.objects.get(
                name="CHALLAN_NUMBER",
                branch_id=request.data.get("branch"),
                agency=request.user.agency_set.first(),
            )
        except:
            number = BillNumber.objects.create(
                name="CHALLAN_NUMBER",
                branch_id=request.data.get("branch"),
                agency=request.user.agency_set.first(),
                next_bill_number=1,
                fy_1=str(date.year)[-2:],
                fy_2=str(date.year + 1)[-2:],
            )
        if (
            number.fy_1 != str(date.year)[-2:]
            if date.month > 3
            else str(date.year - 1)[-2:]
        ):
            number.fy_1 = (
                str(date.year)[-2:] if date.month > 3 else str(date.year - 1)[-2:]
            )
            number.fy_2 = (
                str(date.year + 1)[-2:] if date.month > 3 else str(date.year)[-2:]
            )
        _date = date
        ledgers = []
        for product in data["products"]:
            _prod = ProductItem.objects.get(id=product["id"])
            if _prod.size is not None and float(_prod.size) >= product["size"]:
                __product = ProductItem(
                    product=_prod.product,
                    uuid=_prod.uuid,
                    parent=_prod,
                    status="SOLD",
                    price=product["price"] or _prod.price,
                    size=product["size"],
                    original_size=product["size"],
                    tax=_prod.tax,
                    discount=product["discount"],
                )

                _prod.size = float(_prod.size) - product["size"]
                if _prod.size <= 0:
                    _prod.status = "SOLD"
                _prod.save()
                unit_price_before_tax = round(
                    float(__product.price) * (100 / (100 + float(__product.tax))),
                    2,
                )
                price_before_tax = round(
                    unit_price_before_tax * float(__product.size), 2
                )
            elif _prod.size is None:
                _prod.price = product["price"] or _prod.price
                _prod.discount = product["discount"]
                _prod.status = "SOLD"
                __product = _prod
                price_before_tax = round(
                    float(__product.price) * (100 / (100 + float(__product.tax))),
                    2,
                )
            else:
                return Response(
                    {"error": "product size is more than available quantity"},
                    status=HTTP_400_BAD_REQUEST,
                )

            __product.save()
            tax = round(float(__product.tax) * 0.01 * price_before_tax, 2)
            if customer.state == "UTTAR PRADESH - 09":
                _cgst = _sgst = round(tax / 2, 2)
                _igst = 0
            else:
                _cgst = _sgst = 0
                _igst = tax
            subtotal += price_before_tax
            cgst += _cgst
            sgst += _sgst
            igst += _igst

            opening = get_product_opening_balance(_prod.product, date)
            amount = float(__product.size) if __product.size is not None else 1
            _date = _date + timezone.timedelta(seconds=1)
            ledgers.append(
                ProductLedger.objects.create(
                    product=_prod.product,
                    date=_date,
                    amount=-amount,
                    bal_before=opening,
                    bal_after=opening - amount,
                    remarks="Sold on challan number {}".format(
                        number.format.replace(
                            "__number__", str(number.next_bill_number)
                        )
                        .replace("__fy_1__", str(number.fy_1))
                        .replace("__fy_2__", str(number.fy_2))
                    ),
                ).id
            )
            _prod.product.current_stock = correct_all_product_ledgers_after(
                _prod.product, date
            )
            _prod.product.save()
            products.append(
                DeliveryChallanItem.objects.create(
                    product=__product, is_converted=False, remarks=product["remarks"]
                )
            )

        total = round(
            subtotal + cgst + sgst + igst,
            2,
        )
        roundoff = round(1 - (total % 1) if total % 1 > 0.49 else -(total % 1), 2)
        total += roundoff

        challan = DeliveryChallan.objects.create(
            branch_id=request.data.get("branch"),
            agency=request.user.agency_set.first(),
            customer=customer,
            date=date,
            number=number.format.replace("__number__", str(number.next_bill_number))
            .replace("__fy_1__", str(number.fy_1))
            .replace("__fy_2__", str(number.fy_2)),
            subtotal=subtotal,
            cgst=cgst,
            sgst=sgst,
            igst=igst,
            total=total,
            roundoff=roundoff,
        )
        ProductLedger.objects.filter(id__in=ledgers).update(
            link="CHALLAN/" + str(challan.id)
        )
        challan.items.set(products)
        challan.save()

        number.next_bill_number += 1
        number.save()

        return Response({"challan": challan.id, "number": challan.number})

    def partial_update(self, request, *args, **kwargs):
        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        data = request.data

        try:
            customer = Customer.objects.get(
                id=data["customer"], branch__in=self.request.user.branch_set.all()
            )
        except:
            return Response(
                {"message": "Invalid Customer"}, status=HTTP_400_BAD_REQUEST
            )
        challan = self.get_object()

        products = []
        subtotal = 0
        total = 0
        cgst = 0
        sgst = 0
        igst = 0

        _date = date
        ledgers = []
        for product in data["products"]:
            _prod = ProductItem.objects.get(id=product["id"])
            if product.get("old_id") is None:
                if _prod.size is not None and float(_prod.size) >= product["size"]:
                    __product = ProductItem(
                        product=_prod.product,
                        uuid=_prod.uuid,
                        parent=_prod,
                        status="SOLD",
                        price=product["price"] or _prod.price,
                        size=product["size"],
                        original_size=product["size"],
                        tax=_prod.tax,
                        discount=product["discount"],
                    )

                    _prod.size = float(_prod.size) - product["size"]
                    if _prod.size <= 0:
                        _prod.status = "SOLD"
                    _prod.save()
                    unit_price_before_tax = round(
                        float(__product.price) * (100 / (100 + float(__product.tax))),
                        2,
                    )
                    price_before_tax = round(
                        unit_price_before_tax * float(__product.size), 2
                    )
                elif _prod.size is None:
                    _prod.price = product["price"] or _prod.price
                    _prod.discount = product["discount"]
                    _prod.status = "SOLD"
                    __product = _prod
                    price_before_tax = round(
                        float(__product.price) * (100 / (100 + float(__product.tax))),
                        2,
                    )
                else:
                    return Response(
                        {"error": "product size is more than available quantity"},
                        status=HTTP_400_BAD_REQUEST,
                    )

                __product.save()
                tax = round(float(__product.tax) * 0.01 * price_before_tax, 2)
                if customer.state == "UTTAR PRADESH - 09":
                    _cgst = _sgst = round(tax / 2, 2)
                    _igst = 0
                else:
                    _cgst = _sgst = 0
                    _igst = tax
                subtotal += price_before_tax
                cgst += _cgst
                sgst += _sgst
                igst += _igst

                opening = get_product_opening_balance(_prod.product, date)
                amount = float(__product.size) if __product.size is not None else 1
                _date = _date + timezone.timedelta(seconds=1)
                ledgers.append(
                    ProductLedger.objects.create(
                        product=_prod.product,
                        date=_date,
                        amount=-amount,
                        bal_before=opening,
                        bal_after=opening - amount,
                        remarks="Sold on challan number {}".format(challan.number),
                    ).id
                )
                _prod.product.current_stock = correct_all_product_ledgers_after(
                    _prod.product, date
                )
                _prod.product.save()
                products.append(
                    DeliveryChallanItem.objects.create(
                        product=__product,
                        is_converted=False,
                        remarks=product["remarks"],
                    )
                )
            else:
                if _prod.size is not None:
                    unit_price_before_tax = round(
                        float(product["price"]) * (100 / (100 + float(_prod.tax))),
                        2,
                    )
                    price_before_tax = round(
                        unit_price_before_tax * float(product["size"]), 2
                    )
                else:
                    price_before_tax = round(
                        float(product["price"]) * (100 / (100 + float(_prod.tax))),
                        2,
                    )

                tax = round(float(_prod.tax) * 0.01 * price_before_tax, 2)
                if customer.state == "UTTAR PRADESH - 09":
                    _cgst = _sgst = round(tax / 2, 2)
                    _igst = 0
                else:
                    _cgst = _sgst = 0
                    _igst = tax
                subtotal += price_before_tax
                cgst += _cgst
                sgst += _sgst
                igst += _igst
                products.append(product["old_id"])

        total = round(
            subtotal + cgst + sgst + igst,
            2,
        )
        roundoff = round(1 - (total % 1) if total % 1 > 0.49 else -(total % 1), 2)
        total += roundoff
        challan.branch_id = request.data.get("branch")
        challan.agency = request.user.agency_set.first()
        challan.customer = customer
        challan.date = date
        challan.subtotal = subtotal
        challan.cgst = cgst
        challan.sgst = sgst
        challan.igst = igst
        challan.total = total
        challan.roundoff = roundoff
        challan.items.set(products)
        challan.save()
        return Response({"challan": challan.id, "number": challan.number})

    @action(detail=True, methods=["PUT"], url_path="convert")
    def convert_to_invoice(self, request, pk):
        if request.data.get("items") is None:
            return Response(
                {"message": "selected items cannot be null"},
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            challan = DeliveryChallan.objects.get(
                pk=pk, branch__in=self.request.user.branch_set.all()
            )
        except DeliveryChallan.DoesNotExist:
            return Response(
                {"error": ["Requested challan was not found"]},
                status=HTTP_404_NOT_FOUND,
            )
        date = timezone.now()
        try:
            number = BillNumber.objects.get(
                name="BILL_NUMBER",
                branch_id=challan.branch,
                agency=request.user.agency_set.first(),
            )
        except:
            number = BillNumber.objects.create(
                name="BILL_NUMBER",
                branch_id=request.data.get("branch"),
                agency=request.user.agency_set.first(),
                next_bill_number=1,
                fy_1=str(date.year)[-2:],
                fy_2=str(date.year + 1)[-2:],
            )
        if (
            number.fy_1 != str(date.year)[-2:]
            if date.month > 3
            else str(date.year - 1)[-2:]
        ):
            number.fy_1 = (
                str(date.year)[-2:] if date.month > 3 else str(date.year - 1)[-2:]
            )
            number.fy_2 = (
                str(date.year + 1)[-2:] if date.month > 3 else str(date.year)[-2:]
            )
        bill = Bill(
            number=number.format.replace("__number__", str(number.next_bill_number))
            .replace("__fy_1__", str(number.fy_1))
            .replace("__fy_2__", str(number.fy_2)),
            date=date,
        )

        all_items = request.data.get("items")

        subtotal = 0
        total = 0
        cgst = 0
        sgst = 0
        igst = 0
        products = []
        for item in challan.items.prefetch_related("product").all():
            print(item)
            if item.id in all_items:
                price_before_tax = round(
                    float(item.product.price) * (100 / (100 + float(item.product.tax))),
                    2,
                )

                item.product.status = "SOLD"
                item.is_converted = True
                item.save()
                item.product.save()

                _cgst = (
                    round(float(item.product.tax) / 2 * 0.01 * price_before_tax, 2)
                    if challan.customer.state == "UTTAR PRADESH - 09"
                    else 0
                )
                _sgst = _cgst
                _igst = (
                    round(float(item.product.tax) * 0.01 * price_before_tax, 2)
                    if challan.customer.state != "UTTAR PRADESH - 09"
                    else 0
                )
                subtotal += price_before_tax
                cgst += _cgst
                sgst += _sgst
                igst += _igst
                products.append(item.product.id)
            else:
                if item.product.parent:
                    print(
                        item.product.parent,
                        item.product.parent.size,
                        item.product.size,
                    )
                    item.product.parent.size = float(item.product.parent.size) + float(
                        item.product.size
                    )
                    item.product.parent.status = "UNSOLD"
                    item.product.parent.save()

                    opening = get_product_opening_balance(item.product.product, date)
                    ProductLedger.objects.create(
                        product=item.product.product,
                        date=date,
                        amount=float(item.product.size),
                        bal_before=opening,
                        bal_after=opening + float(item.product.size),
                        remarks="Return on delivery challan {}".format(challan.number),
                    )
                    item.product.product.current_stock = (
                        correct_all_product_ledgers_after(item.product.product, date)
                    )
                    item.product.product.save()

        total = round(subtotal + cgst + sgst + igst, 2)
        roundoff = round(1 - (total % 1) if total % 1 > 0.49 else -(total % 1), 2)
        total += roundoff
        payable = total

        bill.agency = challan.agency
        bill.branch = challan.branch
        bill.customer = challan.customer
        bill.subtotal = challan.subtotal
        bill.cgst = challan.cgst
        bill.sgst = challan.sgst
        bill.igst = challan.igst
        bill.total = total
        bill.roundoff = roundoff
        bill.payable = payable
        bill.use_previous_balance = False
        bill.save()

        number.next_bill_number += 1
        number.save()

        ledgers = []
        ledgers.append(
            CustomerLedger.objects.create(
                date=bill.date,
                remarks="Invoice #%s" % bill.number,
                balance_before=challan.customer.balance,
                balance_after=float(challan.customer.balance) + total,
                amount=total,
                customer=challan.customer,
            ).id
        )
        challan.customer.balance = correct_all_ledgers_after(
            challan.customer, bill.date + timezone.timedelta(seconds=1)
        )
        challan.customer.save()
        bill.ledger.set(ledgers)
        bill.products.set(products)
        challan.converted_to = bill
        challan.save()
        return Response({"bill": bill.id})
