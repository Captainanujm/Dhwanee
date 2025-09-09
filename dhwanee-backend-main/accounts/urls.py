from rest_framework import routers
from .views import AccountViewSet, PaymentLabelViewSet, PaymentMethodViewSet

router = routers.SimpleRouter()
router.register(r'methods', PaymentMethodViewSet)
router.register(r'labels', PaymentLabelViewSet)
router.register(r'accounts', AccountViewSet)
urlpatterns = router.urls
