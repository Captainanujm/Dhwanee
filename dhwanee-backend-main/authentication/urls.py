from rest_framework.routers import SimpleRouter
from .views import AuthenticationViewset

router = SimpleRouter()
router.register('', AuthenticationViewset, basename="auth")

urlpatterns = router.urls
