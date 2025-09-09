from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Agency(models.Model):
    name = models.CharField("name of the agency", max_length=100)
    users = models.ManyToManyField(User, blank=True)
    def __str__(self) -> str:
        return self.name

class Branch(models.Model):
    name = models.CharField("Name of the branch", max_length = 100)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    users = models.ManyToManyField(User, blank=True)
    def __str__(self) -> str:
        return self.agency.name + " - " + self.name