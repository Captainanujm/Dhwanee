from rest_framework.routers import SimpleRouter
from .views import ReportViewSet

r = SimpleRouter()
r.register(r"reports", ReportViewSet, basename='reports')
urlpatterns = r.urls
