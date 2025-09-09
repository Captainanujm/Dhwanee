from rest_framework import routers
from .views import BillViewSet, SalesReturnViewSet, DeliveryChallanViewSet

router = routers.SimpleRouter()
router.register(r'returns', SalesReturnViewSet)
router.register(r'challan', DeliveryChallanViewSet)
router.register(r'', BillViewSet)
urlpatterns = router.urls
