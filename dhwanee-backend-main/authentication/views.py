from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_403_FORBIDDEN
from rest_framework.permissions import AllowAny

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError

from django.contrib.auth import authenticate

# from django.contrib.auth.models import User

from store.serializers import AgencySerializer, BranchSerializer


class AuthenticationViewset(ViewSet):

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        access["user_name"] = user.first_name + " " + user.last_name
        access["agency"] = AgencySerializer(user.agency_set, many=True).data
        if len(access["agency"]) > 0:
            access["agency"] = access["agency"][0]
        access["branch"] = BranchSerializer(user.branch_set, many=True).data
        return {
            "access": str(access),
            "refresh": str(refresh),
        }

    @action(methods=["POST"], detail=False, permission_classes=[AllowAny])
    def login(self, request):
        if request.data.get("username") is None or request.data.get("password") is None:
            return Response(
                {"error": "Username and password are requried"},
                status=HTTP_400_BAD_REQUEST,
            )
        user = authenticate(
            username=request.data.get("username"), password=request.data.get("password")
        )
        if user is not None:
            return Response(self.get_tokens(user))
        return Response({"error": "Invalid credentials"}, status=HTTP_403_FORBIDDEN)

    @action(methods=["POST"], detail=False, permission_classes=[AllowAny])
    def refresh(self, request):
        serializer = TokenRefreshSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({"error": "Invalid Token"}, status=HTTP_400_BAD_REQUEST)

        return Response(serializer.validated_data)
