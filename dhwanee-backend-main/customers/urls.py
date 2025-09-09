from rest_framework import routers
from .views import CustomerViewSet

router = routers.SimpleRouter()
router.register(r'', CustomerViewSet)
urlpatterns = router.urls
