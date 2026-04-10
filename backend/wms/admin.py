from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    User,
    ClientProfile,
    Order,
    OrderItem,
    Receipt,
    Shipment,
    Inventory,
    Invoice,
    InvoiceItem,
    Payment,
    StorageCharge,
    TimesheetEntry,
    UploadedFile,
    ChatSession,
)
from django.contrib import admin



@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (("Role", {"fields": ("role",)}),)
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")


admin.site.register(ClientProfile)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Receipt)
admin.site.register(Shipment)
admin.site.register(Inventory)
admin.site.register(Invoice)
admin.site.register(InvoiceItem)
admin.site.register(Payment)
admin.site.register(StorageCharge)
admin.site.register(TimesheetEntry)
admin.site.register(UploadedFile)
admin.site.register(ChatSession)

# New models will be registered here by adding admin.site.register(Model)
