from rest_framework import routers
from .views import CategoryViewSet, SubCategoryViewSet, ProductViewSet, ProductItemViewSet

router = routers.SimpleRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'subcategories', SubCategoryViewSet)
router.register(r'product-items', ProductItemViewSet)
router.register(r'', ProductViewSet)
urlpatterns = router.urls
