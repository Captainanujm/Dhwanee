from rest_framework import routers
from .views import SupplierViewSet, InitialStockViewSet, SupplierBillViewSet, PurchaseReturnViewSet

router = routers.SimpleRouter()
router.register(r'purchase-return', PurchaseReturnViewSet, basename="purchase-return")
router.register(r'initial-stock', InitialStockViewSet, basename="initial-stock")
router.register(r'invoice', SupplierBillViewSet, basename="initial-stock")
router.register(r'', SupplierViewSet)
urlpatterns = router.urls
