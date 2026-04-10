from django.db import models
from django.conf import settings


class Page(models.Model):
    """Represents a frontend page or feature that can be permissioned."""
    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Permission mapping for roles -> pages."""
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("staff", "Staff"),
        ("client", "Client"),
    ]
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="role_permissions")
    enabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ("role", "page")

    def __str__(self):
        return f"{self.role} -> {self.page.slug} = {self.enabled}"


class UserPermission(models.Model):
    """Optional per-user override for page access."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_permissions")
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="user_permissions")
    enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "page")

    def __str__(self):
        return f"{self.user.username} -> {self.page.slug} = {self.enabled}"
