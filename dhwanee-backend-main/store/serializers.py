from rest_framework.serializers import ModelSerializer
from .models import Agency, Branch

class AgencySerializer(ModelSerializer):
    class Meta:
        model = Agency
        exclude = ["users"]


class BranchSerializer(ModelSerializer):
    class Meta:
        model = Branch
        exclude = ["users"]
