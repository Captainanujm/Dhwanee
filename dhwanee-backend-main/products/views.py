from django.http import FileResponse
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_500_INTERNAL_SERVER_ERROR,
    HTTP_404_NOT_FOUND,
    HTTP_201_CREATED,
)

from math import floor

from django.utils import timezone
from django.db.models import Q

from .models import Category, ProductLedger, SubCategory, Product, ProductItem
from .serializers import (
    CategorySerializer,
    ProductLedgerSerializer,
    RecipeIngredientMinimalSerializer,
    SubCategorySerializer,
    ProductSerializer,
    ProductItemSerializerDeep,
    ProductItemSerializer,
    ProductSerializerDeep,
)


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            super().get_queryset().filter(branch__in=self.request.user.branch_set.all())
        )

    def create(self, request):
        data = dict(request.data)
        data["agency"] = request.user.agency_set.values("pk").first().get("pk")
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

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
            categories = Category.objects.filter(
                name__icontains=request.GET.get("q", "")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get categories!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(categories)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"], url_path="get-products")
    def get_products(self, request):
        if request.GET.get("id") is None:
            return Response(
                {
                    "message": "Category ID not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            subcategories = SubCategory.objects.filter(
                category_id=request.GET.get("id", "")
            )
        except Category.DoesNotExist:
            return Response(
                {"success": False, "message": "Category not found!"},
                status=HTTP_404_NOT_FOUND,
            )

        result = Product.objects.filter(subcategory__in=subcategories).values_list(
            "name", "id", "current_stock", named=True
        )
        res = [i._asdict() for i in result]
        return Response(res)


class SubCategoryViewSet(ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            super().get_queryset().filter(branch__in=self.request.user.branch_set.all())
        )

    def create(self, request):
        data = dict(request.data)
        data["agency"] = request.user.agency_set.values("pk").first().get("pk")
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    @action(detail=False, methods=["GET"], url_path="by-category")
    def by_category(self, request):
        if request.GET.get("id") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            subcategories = SubCategory.objects.filter(category=request.GET.get("id"))
        except:
            return Response(
                {"success": False, "message": "Unable to get subcategories!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(subcategories)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"], url_path="by-category-with-products")
    def by_category_with_products(self, request):
        if request.GET.get("id") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            subcategories = SubCategory.objects.filter(category=request.GET.get("id"))
        except:
            return Response(
                {"success": False, "message": "Unable to get subcategories!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(subcategories)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

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
            categories = SubCategory.objects.filter(
                name__icontains=request.GET.get("q", "")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get subcategories!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(categories)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"], url_path="search-by-category")
    def search_by_category(self, request):
        if request.GET.get("id") is None or request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            subcategories = SubCategory.objects.filter(
                category=request.GET.get("id"), name__icontains=request.GET.get("q")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get subcategories!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(subcategories)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductSerializerDeep
        return ProductSerializer

    def get_queryset(self):
        return (
            super().get_queryset().filter(branch__in=self.request.user.branch_set.all())
        )

    def create(self, request):
        data = dict(request.data)
        data["agency"] = request.user.agency_set.values("pk").first().get("pk")
        if data.get("recipe") is not None and len(data.get("recipe")) > 0:
            for r in range(len(data.get("recipe"))):
                serializer = RecipeIngredientMinimalSerializer(
                    data={
                        "percentage": data["recipe"][r]["percentage"],
                        "product": data["recipe"][r]["product"]["id"],
                    }
                )
                serializer.is_valid(raise_exception=True)
                data["recipe"][r] = serializer.save().id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    @action(detail=True, methods=["POST"], url_path="rate-edit")
    def rate_edit(self, request, pk):
        if request.data.get("rate") is None:
            return Response({"error": "Rate is required"}, status=HTTP_400_BAD_REQUEST)
        try:
            prod = self.get_queryset().get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=HTTP_400_BAD_REQUEST)

        prod.default_selling_price = request.data.get("rate")
        prod.save()
        ProductItem.objects.filter(product=prod, parent=None).exclude(
            status="SOLD"
        ).update(price=request.data.get("rate"))
        return Response({"success": True})

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
            products = self.get_queryset().filter(
                name__icontains=request.GET.get("q", "")
            )
            if request.GET.get("finished") is not None:
                products = products.filter(
                    finished=request.GET.get("finished") == "true"
                )
        except:
            return Response(
                {"success": False, "message": "Unable to get products!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(products)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"], url_path="search-by-uuid")
    def search_by_uuid(self, request):
        if request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            _products = Product.objects.filter(branch__in=self.request.user.branch_set.all(), name__icontains=request.GET.get("q", ""))
            products = (
                ProductItem.objects.prefetch_related("product")
                .filter(
                    Q(uuid__icontains=request.GET.get("q", ""))
                    | Q(product__in=_products)
                )
                .filter(
                    status="UNSOLD",
                    parent=None,
                    product__in=self.get_queryset(),
                )
            )
            if request.GET.get("finished") is not None:
                if request.GET.get("finished") == "true":
                    products = products.filter(product__finished=True)
                else:
                    products = products.filter(product__finished=False)
        except:
            raise
            return Response(
                {"success": False, "message": "Unable to get products!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(products)
        serialized = ProductItemSerializerDeep(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    def mm2px(self, mm: int, dpi: int) -> int:
        return floor(dpi * mm * 0.1 / 2.54)

    @action(detail=True, methods=["GET"], url_path="ledger")
    def ledger(self, request, pk):
        try:
            ledger = ProductLedger.objects.filter(product=pk)
        except:
            return Response(
                {"success": False, "message": "Unable to get ledger!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(ledger)
        serialized = ProductLedgerSerializer(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(methods=["GET"], detail=False)
    def filter(self, request):
        filters = {}
        subcategories = []
        if request.GET.get("category") is not None:
            subcategories += list(
                SubCategory.objects.filter(
                    category__in=request.GET.get("category").split(",")
                ).values_list("id", flat=True)
            )
        if request.GET.get("subcategory") is not None:
            subcategories += request.GET.get("subcategory").split(",")
        if request.GET.get("min_price") is not None:
            filters["default_selling_price__gte"] = request.GET.get("min_price")
        if request.GET.get("max_price") is not None:
            filters["default_selling_price__lte"] = request.GET.get("max_price")
        if request.GET.get("name") is not None:
            filters["name__icontains"] = request.GET.get("name")

        queryset = self.get_queryset().filter(**filters)
        if len(subcategories) > 0:
            queryset = queryset.filter(subcategory__in=subcategories)

        if request.GET.get("all"):
            return Response(
                {"results": ProductSerializerDeep(queryset, many=True).data}
            )

        page = self.paginate_queryset(queryset)
        serialized = ProductSerializerDeep(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(methods=["POST"], detail=True, url_path="add-to-stock")
    def add_to_stock(self, request, pk):
        try:
            product = self.get_queryset().get(pk=pk)
            assert product.finished == True
        except:
            return Response("product not found", status=HTTP_404_NOT_FOUND)
        price = request.data.get("price")
        num_packets = request.data.get("num_packets")
        packet_size = request.data.get("packet_size")

        if (
            price == None
            or num_packets == None
            or (product.is_pieces and num_packets is None)
        ):
            return Response("invalid data format", status=HTTP_400_BAD_REQUEST)
        if product.is_pieces:
            total_weight = num_packets * packet_size
        else:
            total_weight = num_packets
        for ingredient in product.recipe.all():
            reduce = float(ingredient.percentage) / 100 * total_weight
            if reduce > float(ingredient.product.current_stock):
                return Response({
                    'detail': ['Not enough stock of raw material to generate this quantity']
                }, status=HTTP_400_BAD_REQUEST)
        total_price = 0
        for ingredient in product.recipe.all():
            reduce = float(ingredient.percentage) / 100 * total_weight
            ProductLedger.objects.create(
                product=ingredient.product,
                date=timezone.now(),
                amount=-reduce,
                bal_before=ingredient.product.current_stock,
                bal_after=float(ingredient.product.current_stock) - reduce,
                remarks=request.data.get(
                    "ref",
                    f"Reduced due to conversion to final product {product.name}",
                ),
            )
            ingredient.product.current_stock = (
                float(ingredient.product.current_stock) - reduce
            )
            for pi in ProductItem.objects.filter(product=ingredient.product, status="UNSOLD", parent=None):
                if reduce <= 0:
                    break
                if reduce >= float(pi.size):
                    reduce -= float(pi.size)
                    total_price += (float(pi.size) * float(pi.price))
                    pi.size = 0
                    pi.status = "SOLD"
                else:
                    pi.size = float(pi.size) - reduce
                    total_price += (reduce * float(pi.price))
                    reduce = 0
                pi.save()
            ingredient.product.save()
        if product.is_pieces:
            if product.bulk:
                ProductItem.objects.create(
                    product=product,
                    uuid="INI0000001",
                    price=price,
                    cost=total_price/num_packets,
                    size=num_packets,
                    original_size=packet_size,
                    tax=product.default_tax,
                    status="UNSOLD",
                )
            else:
                for i in range(num_packets):
                    ProductItem.objects.create(
                        product=product,
                        uuid="INI0000001",
                        price=price,
                        cost=total_price/num_packets,
                        size=None,
                        original_size=packet_size,
                        tax=product.default_tax,
                        status="UNSOLD",
                    )
        else:
            ProductItem.objects.create(
                product=product,
                uuid="INI0000001",
                price=price,
                size=num_packets,
                cost=total_price/num_packets,
                original_size=num_packets,
                tax=product.default_tax,
                status="UNSOLD",
            )
        ProductLedger.objects.create(
            product=product,
            date=timezone.now(),
            amount=num_packets,
            bal_before=product.current_stock,
            bal_after=float(product.current_stock) + num_packets,
            remarks=request.data.get(
                "ref",
                f"Added from product page {num_packets}kg",
            ),
        )
        product.current_stock = float(product.current_stock) + num_packets
        product.save()
        
        return Response({"success": True}, status=HTTP_201_CREATED)


class ProductItemViewSet(ModelViewSet):
    queryset = ProductItem.objects.all()
    serializer_class = ProductItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(product__in=Product.objects.filter(branch__in=self.request.user.branch_set.all()))

    @action(detail=False, methods=["GET"], url_path="by-product")
    def by_product(self, request):
        if request.GET.get("id") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            productitems = self.get_queryset().filter(
                product=request.GET.get("id"), parent=None
            )
            if request.GET.get("unsold") == "true":
                productitems = productitems.filter(status="UNSOLD")
        except:
            return Response(
                {"success": False, "message": "Unable to get productitems!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if request.GET.get("all") == "true":
            return Response(
                {
                    "count": len(productitems),
                    "results": self.serializer_class(
                        productitems, context={"request": request}, many=True
                    ).data,
                }
            )

        page = self.paginate_queryset(productitems)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)

    @action(detail=False, methods=["GET"], url_path="search-by-product")
    def search_by_product(self, request):
        if request.GET.get("id") is None or request.GET.get("q") is None:
            return Response(
                {
                    "message": "Search Parameter not provided",
                    "success": False,
                },
                status=HTTP_400_BAD_REQUEST,
            )
        try:
            productitems = self.get_queryset().filter(
                product=request.GET.get("id"), name__icontains=request.GET.get("q")
            )
        except:
            return Response(
                {"success": False, "message": "Unable to get productitems!"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        page = self.paginate_queryset(productitems)
        serialized = self.serializer_class(
            page, context={"request": request}, many=True
        )
        return self.get_paginated_response(serialized.data)
