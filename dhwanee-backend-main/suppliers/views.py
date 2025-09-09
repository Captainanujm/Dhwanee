
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_500_INTERNAL_SERVER_ERROR,
    HTTP_404_NOT_FOUND,
    HTTP_201_CREATED
)

from django.utils import timezone
from utils.pad import pad


from products.models import Product, ProductItem, ProductLedger
from internals.models import BillNumber

from accounts.models import AccountLedger, Account
from accounts.utils import (
    get_opening_balance as get_account_opening_balance,
    correct_all_ledgers_after as correct_all_account_ledgers_after,
)

from .models import (
    Supplier,
    InitialStockEntry,
    SupplierBill,
    SupplierLedger,
    PurchaseReturn,
)
from .serializers import (
    SupplierSerializer,
    InitialStockSerializer,
    SupplierBillSerializerAtCreation,
    SupplierBillSerializer,
    SupplierBillSerializerDeep,
    SupplierLedgerSerializer,
    SupplierBillExtraExpensesSerializer,
    PurchaseReturnSerializer,
    PurchaseReturnSerializerDeep,
)
from .utils import get_opening_balance, correct_all_ledgers_after


class SupplierViewSet(ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
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
            suppliers = Supplier.objects.filter(
                name__icontains=request.GET.get("q", "")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get suppliers!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(suppliers)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=True, methods=["GET"])
    def ledger(self, request, pk):
        filters = {}
        if request.GET.get("from"):
            try:
                filters["date__gte"] = timezone.datetime.fromisoformat(
                    request.GET.get("from")
                )
            except:
                return Response({"error": "invalid date format"})

        if request.GET.get("to"):
            try:
                filters["date__lte"] = timezone.datetime.fromisoformat(
                    request.GET.get("to")
                )
            except:
                return Response({"error": "invalid date format"})
        ledgers = SupplierLedger.objects.filter(supplier=pk, **filters).order_by(
            "-date", "-id"
        )

        page = self.paginate_queryset(ledgers)
        serialized = SupplierLedgerSerializer(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=True, methods=["GET"], url_path="check-product-supplier")
    def check_product_supplier(self, request, pk):
        if request.GET.get("product") is None:
            return Response({"error": "product not found"}, status=HTTP_400_BAD_REQUEST)
        try:
            pi = ProductItem.objects.get(id=request.GET.get("product"))
        except ProductItem.DoesNotExist:
            return Response({"error": "product not found"}, status=HTTP_400_BAD_REQUEST)

        try:
            bill = pi.supplierbill_set.first()
        except:
            return Response({"is_same": False, "bill": None})
        if bill is None:
            return Response({"is_same": False, "bill": None})

        return Response({"is_same": str(bill.supplier.id) == pk, "bill": bill.number})

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
            supplier = Supplier.objects.get(pk=pk)
        except Account.DoesNotExist:
            return Response(
                {"message": "Invalid supplier id"}, status=HTTP_400_BAD_REQUEST
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
                else f"Payment made to {supplier.name}"
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
        opening_balance = get_opening_balance(supplier, date)
        ledger = SupplierLedger.objects.create(
            supplier=supplier,
            remarks=ledger.remarks,
            amount=-request.data.get("amount"),
            date=date,
            balance_before=opening_balance,
            balance_after=opening_balance - request.data.get("amount"),
        )
        supplier.balance = correct_all_ledgers_after(supplier, date)
        supplier.save()
        return Response(self.serializer_class(supplier).data)


class InitialStockViewSet(ModelViewSet):
    queryset = InitialStockEntry.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = InitialStockSerializer

    @action(detail=False, methods=["POST"], url_name="generate")
    def generate(self, request):
        serializer = self.serializer_class(data=request.data)
        supplier = Supplier.objects.get(name="INITIAL_STOCK_DUMMY_SUPPLIER")

        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        if serializer.is_valid():
            products = []
            for product_item in serializer.initial_data["products"]:
                if product_item["id"]:
                    product = Product.objects.get(id=product_item["id"])
                else:
                    product = Product.objects.create(
                        name=product_item["name"],
                        unit=product_item["unit"],
                        default_selling_price=product_item["selling_price"],
                        default_buying_price=product_item["buying_price"],
                        default_cgst=product_item["cgst"],
                        default_sgst=product_item["sgst"],
                        default_igst=product_item["igst"],
                    )
                if product.bulk == True:
                    prod = ProductItem.objects.create(
                        product=product,
                        uuid="{}{}".format(
                            supplier.label_series, pad(supplier.next_label_value, 10)
                        ),
                        selling_price=product_item["selling_price"],
                        buying_price=product_item["buying_price"],
                        length=product_item["quantity"],
                        tax=product_item["tax"],
                    )
                    for _ in range(product_item["quantity"]):
                        products.append(prod.id)
                    supplier.next_label_value += 1
                    ProductLedger.objects.create(
                        product=product,
                        date=timezone.now(),
                        amount=prod.length,
                        bal_before=product.current_stock,
                        bal_after=float(product.current_stock) + float(prod.length),
                        remarks=request.data.get(
                            "ref", "Added using initial stock entry"
                        ),
                    )
                    product.current_stock = float(product.current_stock) + float(
                        prod.length
                    )
                    product.save()
                elif product.unit == "pc":
                    for i in range(product_item["quantity"]):
                        prod = ProductItem.objects.create(
                            product=product,
                            uuid="{}{}".format(
                                supplier.label_series,
                                pad(supplier.next_label_value, 10),
                            ),
                            selling_price=product_item["selling_price"],
                            buying_price=product_item["buying_price"],
                            tax=product_item["tax"],
                        )
                        supplier.next_label_value += 1
                        products.append(prod.id)
                    ProductLedger.objects.create(
                        product=product,
                        date=timezone.now(),
                        amount=product_item["quantity"],
                        bal_before=product.current_stock,
                        bal_after=float(product.current_stock)
                        + float(product_item["quantity"]),
                        remarks=request.data.get(
                            "ref", "Added using initial stock entry"
                        ),
                    )
                    product.current_stock = (
                        float(product.current_stock) + product_item["quantity"]
                    )
                    product.save()
                else:
                    prod = ProductItem.objects.create(
                        product=product,
                        uuid="{}{}".format(
                            supplier.label_series, pad(supplier.next_label_value, 10)
                        ),
                        selling_price=product_item["selling_price"],
                        buying_price=product_item["buying_price"],
                        length=product_item["quantity"],
                        tax=product_item["tax"],
                    )
                    for _ in range(4):
                        products.append(prod.id)
                    products.append(prod.id)
                    supplier.next_label_value += 1
                    ProductLedger.objects.create(
                        product=product,
                        date=timezone.now(),
                        amount=prod.length,
                        bal_before=product.current_stock,
                        bal_after=float(product.current_stock) + float(prod.length),
                        remarks=request.data.get(
                            "ref", "Added using initial stock entry"
                        ),
                    )
                    product.current_stock = float(product.current_stock) + float(
                        prod.length
                    )
                    product.save()

            supplier.save()

            entry = InitialStockEntry.objects.create(
                date=date, ref=request.data.get("ref", "")
            )
            entry.products.set(products)
            entry.save()
            return Response({"success": True, "id": entry.id, "items": products})
        return Response(
            {"message": "Invalid data format", "errors": serializer.errors},
            status=HTTP_400_BAD_REQUEST,
        )


class SupplierBillViewSet(ModelViewSet):
    queryset = SupplierBill.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = SupplierBillSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SupplierBillSerializerDeep
        return SupplierBillSerializer

    @action(detail=False, methods=["GET"], url_path="by-supplier")
    def list_by_supplier(self, request):
        if request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            suppliers = self.queryset.filter(supplier_id=request.GET.get("q")).order_by(
                "-date"
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get supplier bills !"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(suppliers)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["POST"], url_name="generate")
    def generate(self, request):
        serializer = SupplierBillSerializerAtCreation(data=request.data)
        try:
            date = timezone.datetime.fromisoformat(request.data.get("date"))
        except:
            return Response(
                {"message": "Invalid date format"}, status=HTTP_400_BAD_REQUEST
            )

        if serializer.is_valid():
            supplier = Supplier.objects.get(id=serializer.initial_data["supplier"])
            products = []
            ledgers = []
            product_status = (
                "UNSOLD" if serializer.initial_data["received_status"] else "AWAITED"
            )
            subtotal = 0
            for product_item in serializer.initial_data["products"]:
                product = Product.objects.get(id=product_item["id"])
                subtotal += float(product_item["buying_price"]) * float(
                    product_item["quantity"]
                )
                prod = ProductItem.objects.create(
                    product=product,
                    # uuid="{}{}".format(
                    #     supplier.label_series, pad(supplier.next_label_value, 10)
                    # ),
                    uuid="INI0000001",
                    price=product_item["buying_price"],
                    size=product_item["quantity"],
                    original_size=product_item["quantity"],
                    tax=product_item["tax"],
                    status=product_status,
                )
                for _ in range(product_item["quantity"]):
                    products.append(prod.id)
                # supplier.next_label_value += 1

                ledgers.append(ProductLedger.objects.create(
                    product=product,
                    date=timezone.now(),
                    amount=prod.size,
                    bal_before=product.current_stock,
                    bal_after=float(product.current_stock) + float(prod.size),
                    remarks=request.data.get(
                        "ref",
                        f"Added using supplier bill number: {serializer.initial_data['number']}",
                    ),
                ).id)
                product.current_stock = float(product.current_stock) + float(
                    prod.size
                )
                product.save()
            extra_expenses = []
            total_expenses = 0
            for extra_expense in serializer.initial_data["extra_expenses"]:
                ser = SupplierBillExtraExpensesSerializer(data=extra_expense)
                if ser.is_valid():
                    extra_expenses.append(ser.save())
                    total_expenses += extra_expense["total_amount"]
            supplier.save()

            subtotal = round(subtotal, 2)
            payable = round(
                subtotal
                + serializer.initial_data["cgst"]
                + serializer.initial_data["sgst"]
                + serializer.initial_data["igst"],
                2,
            )
            if serializer.initial_data["cash_discount"] != 0:
                if serializer.initial_data["cash_discount_type"] == "percentage":
                    payable -= payable * serializer.initial_data["cash_discount"] * 0.01
                else:
                    payable -= serializer.initial_data["cash_discount"]
            payable += total_expenses
            payable = payable - (
                (payable % 1) if payable % 1 < 0.5 else ((payable % 1) - 1)
            )

            entry = SupplierBill.objects.create(
                supplier=supplier,
                date=date,
                number=serializer.initial_data["number"],
                received_status=serializer.initial_data["received_status"],
                cash_discount=serializer.initial_data["cash_discount"],
                cash_discount_type=serializer.initial_data["cash_discount_type"],
                cgst=serializer.initial_data["cgst"],
                sgst=serializer.initial_data["sgst"],
                igst=serializer.initial_data["igst"],
                payable=payable,
                subtotal=subtotal,
            )
            opening_balance = get_opening_balance(supplier, date)
            ledger = SupplierLedger.objects.create(
                supplier=supplier,
                remarks=f'Invoice Number: "{entry.number}" (ID: {entry.id})',
                date=date,
                amount=payable,
                balance_before=opening_balance,
                balance_after=opening_balance + payable,
                link="SUPPLIER_BILL/"+str(entry.id)
            )
            ProductLedger.objects.filter(id__in=ledgers).update(link="SUPPLIER_BILL/"+str(entry.id))
            supplier.balance = correct_all_ledgers_after(supplier, date)
            supplier.save()
            entry.ledger = ledger
            entry.save()
            entry.products.set(products)
            entry.extra_expenses.set(extra_expenses)
            return Response({"success": True, "id": entry.id, "items": products})
        return Response(
            {"message": "Invalid data format", "errors": serializer.errors},
            status=HTTP_400_BAD_REQUEST,
        )

    @action(detail=True, methods=["POST"], url_path="mark-received")
    def mark_received(self, request, pk):
        try:
            bill = SupplierBill.objects.get(pk=pk)
        except SupplierBill.DoesNotExist:
            return Response({"message": "Bill Not found"}, status=HTTP_404_NOT_FOUND)

        bill.received_status = True
        bill.products.update(status="UNSOLD")
        bill.save()
        return Response({"message": "Updated succesfully"})


class PurchaseReturnViewSet(ModelViewSet):
    queryset = PurchaseReturn.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = PurchaseReturnSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PurchaseReturnSerializerDeep
        return PurchaseReturnSerializer

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
            suppliers = PurchaseReturn.objects.filter(
                number__icontains=request.GET.get("q", "")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get returns!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(suppliers)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    def create(self, request):
        data = request.data
        print("called")
        try:
            supplier = Supplier.objects.get(pk=data.get("supplier"))
        except Supplier.DoesNotExist:
            return Response(
                {"message": "Supplier not found"}, status=HTTP_400_BAD_REQUEST
            )

        total = 0
        returned = []
        # Reset the status of all products
        now = timezone.now()
        number = BillNumber.objects.filter(name="PURCHASE_RETURN_NUMBER").first()
        for _prod in data.get("products"):
            prod = ProductItem.objects.get(id=_prod)
            prod.status = "RETURNED"
            prod.save()
            returned.append(prod.id)
            total += float(prod.buying_price) * (
                float(prod.length) if prod.length is not None else 1
            )
            amount = -(float(prod.length) if prod.length is not None else 1)
            ProductLedger.objects.create(
                product=prod.product,
                date=now,
                amount=amount,
                bal_before=prod.product.current_stock,
                bal_after=float(prod.product.current_stock) + float(amount),
                remarks=request.data.get(
                    "ref",
                    f"Returned on purchase return number: PR/{number.next_bill_number}",
                ),
            )
            prod.product.current_stock = float(prod.product.current_stock) + amount
            prod.product.save()
        total = round(total, 2)
        roundoff = round(total) - total
        total = round(total)

        opening_balance = get_opening_balance(supplier, now)
        ledger = SupplierLedger.objects.create(
            supplier=supplier,
            remarks=f'Purchase Return Number: "PR/{number.next_bill_number}"',
            date=now,
            amount=-total,
            balance_before=opening_balance,
            balance_after=opening_balance - total,
        )
        supplier.balance = correct_all_ledgers_after(supplier, now)
        supplier.save()
        ret = PurchaseReturn.objects.create(
            supplier=supplier,
            date=now,
            number=f"PR/{number.next_bill_number}",
            ledger=ledger,
            remarks=data.get("remarks", ""),
            total=total,
            roundoff=roundoff,
        )
        ret.products.set(returned)
        number.next_bill_number += 1
        number.save()

        return Response({"id": ret.id})
