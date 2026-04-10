"""
WMS models - refactored for DRY, maintainability and clarity.

Key changes:
- Introduced BaseModel and TimeStampedModel to remove repeated id/timestamp fields.
- Kept behavior and constraints intact while simplifying repeated patterns.
"""

import uuid
from decimal import Decimal
from typing import Optional

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class UUIDModel(models.Model):
    """Abstract base that provides a UUID primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """Abstract base that provides created/updated timestamps."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDTimeStampedModel(UUIDModel, TimeStampedModel):
    class Meta:
        abstract = True


class User(AbstractUser, UUIDModel):
    """Custom user with role support (admin, staff, client)."""
    ROLE_ADMIN = "admin"
    ROLE_STAFF = "staff"
    ROLE_CLIENT = "client"

    ROLE_CHOICES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_STAFF, "Staff"),
        (ROLE_CLIENT, "Client"),
    ]

    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default=ROLE_CLIENT, db_index=True)

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        indexes = [models.Index(fields=["role"])]

    def is_admin(self) -> bool:
        return self.role == self.ROLE_ADMIN or self.is_superuser

    def is_staff_role(self) -> bool:
        return self.role == self.ROLE_STAFF

    def is_client(self) -> bool:
        return self.role == self.ROLE_CLIENT

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.username} ({self.role})"


class ClientProfile(UUIDTimeStampedModel):
    """Extended client settings and billing configuration."""
    BILLING_PER_ORDER = "per_order"
    BILLING_MONTHLY = "monthly"
    BILLING_TEN_DAYS = "every_10_days"

    BILLING_CHOICES = [
        (BILLING_PER_ORDER, "Per Order"),
        (BILLING_MONTHLY, "Monthly"),
        (BILLING_TEN_DAYS, "Every 10 Days"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="client_profile")
    billing_type = models.CharField(max_length=32, choices=BILLING_CHOICES, default=BILLING_PER_ORDER, db_index=True)
    storage_rate_per_cuft = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal("0.00"))
    pricing_rules = models.JSONField(default=dict, blank=True)
    # flexible extra fields for custom client attributes
    extra_fields = models.JSONField(default=dict, blank=True)
    billing_contact = models.CharField(max_length=255, blank=True)
    billing_email = models.EmailField(blank=True)
    billing_address = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["billing_type"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"ClientProfile: {self.user.username}"


class Order(UUIDTimeStampedModel):
    """Warehouse order and lifecycle tracking."""
    STATUS_RECEIVED = "RECEIVED"
    STATUS_PROCESSING = "PROCESSING"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_SHIPPED = "SHIPPED"

    STATUS_CHOICES = [
        (STATUS_RECEIVED, "Received"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_SHIPPED, "Shipped"),
    ]

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders", db_index=True)
    reference = models.CharField(max_length=128, db_index=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_RECEIVED, db_index=True)

    received_at = models.DateTimeField(null=True, blank=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True, db_index=True)

    notes = models.TextField(blank=True)
    in_storage = models.BooleanField(default=False, db_index=True)

    total_items = models.PositiveIntegerField(default=0)
    total_volume_cuft = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.0000"))
    total_weight = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.0000"))

    archived = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_orders")

    class Meta:
        indexes = [models.Index(fields=["client", "status"]), models.Index(fields=["reference"])]
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["client", "reference"], name="uq_client_reference")]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Order {self.reference} ({self.status})"

    # Flexible extension
    extra_fields = models.JSONField(default=dict, blank=True)


class OrderItem(UUIDTimeStampedModel):
    """SKU-level line item. CUFT calculation moved to helper and saved when dimensions set."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items", db_index=True)
    sku = models.CharField(max_length=128, db_index=True)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)

    length_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    width_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    height_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    weight_lbs = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal("0.0000"))

    cuft_per_unit = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    prep_instructions = models.JSONField(default=dict, blank=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.0000"))
    external_ref = models.CharField(max_length=128, blank=True)
    extra_fields = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [models.Index(fields=["sku"]), models.Index(fields=["order", "sku"])]
        constraints = [models.UniqueConstraint(fields=["order", "sku"], name="uq_order_sku")]

    def save(self, *args, **kwargs):
        # compute cuft if dimensions present
        if (not self.cuft_per_unit) and self.length_in and self.width_in and self.height_in:
            try:
                self.cuft_per_unit = (Decimal(self.length_in) * Decimal(self.width_in) * Decimal(self.height_in)) / Decimal(1728)
            except Exception:
                self.cuft_per_unit = None
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.sku} x {self.quantity} ({self.order.reference})"


class Receipt(UUIDTimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="receipts", db_index=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="receipts")
    received_date = models.DateField(db_index=True)
    boxes_received = models.PositiveIntegerField(default=0)
    quantity_received = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["received_date"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Receipt for {self.order.reference} on {self.received_date}"


class Shipment(UUIDTimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="shipments", db_index=True)
    shipped_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="shipments")
    shipped_date = models.DateField(db_index=True)
    carrier = models.CharField(max_length=128, blank=True)
    tracking_number = models.CharField(max_length=255, blank=True, db_index=True)
    boxes_shipped = models.PositiveIntegerField(default=0)
    weight = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.0000"))
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["shipped_date"]), models.Index(fields=["tracking_number"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Shipment {self.tracking_number or self.id} ({self.order.reference})"


class Inventory(UUIDTimeStampedModel):
    sku = models.CharField(max_length=128, db_index=True)
    location = models.CharField(max_length=128, db_index=True)
    quantity_on_hand = models.IntegerField(default=0)
    lot_number = models.CharField(max_length=128, blank=True, db_index=True)
    last_receipt = models.ForeignKey(Receipt, null=True, blank=True, on_delete=models.SET_NULL, related_name="inventory_refs")
    last_updated = models.DateTimeField(auto_now=True)
    # Approval workflow and flexible fields
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Approval"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_APPROVED, db_index=True)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="inventory_requests")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="inventory_approvals")
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)
    extra_fields = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [models.Index(fields=["sku", "location"])]
        constraints = [models.UniqueConstraint(fields=["sku", "location"], name="uq_sku_location")]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.sku} @ {self.location}: {self.quantity_on_hand}"


class Invoice(UUIDTimeStampedModel):
    STATUS_DRAFT = "DRAFT"
    STATUS_ISSUED = "ISSUED"
    STATUS_PAID = "PAID"
    STATUS_PARTIAL = "PARTIAL"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ISSUED, "Issued"),
        (STATUS_PARTIAL, "Partial"),
        (STATUS_PAID, "Paid"),
    ]

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invoices", db_index=True)
    reference = models.CharField(max_length=128, db_index=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))
    balance_due = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))

    notes = models.TextField(blank=True)
    orders = models.ManyToManyField(Order, blank=True, related_name="invoices")

    class Meta:
        indexes = [models.Index(fields=["client", "status"])]
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Invoice {self.reference} ({self.status}) for {self.client.username}"

    extra_fields = models.JSONField(default=dict, blank=True)


class InvoiceItem(UUIDTimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items", db_index=True)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("1.0"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))
    amount = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoice_items")

    class Meta:
        indexes = [models.Index(fields=["invoice"])]

    def save(self, *args, **kwargs):
        self.amount = (self.quantity * self.unit_price).quantize(Decimal("0.0001"))
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"InvoiceItem {self.description} ({self.amount})"


class Payment(UUIDTimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.00"))
    paid_at = models.DateTimeField(default=timezone.now)
    method = models.CharField(max_length=64, blank=True)
    reference = models.CharField(max_length=128, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")

    class Meta:
        indexes = [models.Index(fields=["invoice", "paid_at"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Payment {self.amount} for {self.invoice.reference}"


class StorageCharge(UUIDTimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="storage_charges", db_index=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    cuft = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.0000"))
    rate_per_cuft = models.DecimalField(max_digits=12, decimal_places=6, default=Decimal("0.000000"))
    amount = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal("0.00"))
    billed = models.BooleanField(default=False, db_index=True)

    class Meta:
        indexes = [models.Index(fields=["start_date"]), models.Index(fields=["billed"])]

    def calculate_amount(self) -> Decimal:
        if self.end_date:
            days = (self.end_date - self.start_date).days or 1
        else:
            days = (timezone.now().date() - self.start_date).days or 1
        self.amount = (self.cuft * self.rate_per_cuft * Decimal(days)).quantize(Decimal("0.0001"))
        return self.amount

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"StorageCharge {self.order.reference} {self.amount}"


class TimesheetEntry(UUIDTimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="timesheet_entries")
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL, related_name="timesheet_entries")
    date = models.DateField(db_index=True)
    hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["user", "date"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Timesheet {self.user.username} {self.date} ({self.hours}h)"


class UploadedFile(UUIDTimeStampedModel):
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="uploads")
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.CASCADE, related_name="uploads")
    invoice = models.ForeignKey(Invoice, null=True, blank=True, on_delete=models.CASCADE, related_name="uploads")
    shipment = models.ForeignKey(Shipment, null=True, blank=True, on_delete=models.CASCADE, related_name="uploads")
    file = models.FileField(upload_to="uploads/%Y/%m/%d")
    file_type = models.CharField(max_length=64, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["uploaded_by", "created_at"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"UploadedFile {self.file.name}"


class ChatSession(UUIDTimeStampedModel):
    STATE_ASK_RECEIVED = "ASK_RECEIVED"
    STATE_ASK_DATE = "ASK_DATE"
    STATE_ADD_SKU = "ADD_SKU"
    STATE_SKU_LOOP = "SKU_LOOP"
    STATE_PREP_INSTRUCTIONS = "PREP_INSTRUCTIONS"
    STATE_CONFIRM = "CONFIRM"
    STATE_DONE = "DONE"

    STATE_CHOICES = [
        (STATE_ASK_RECEIVED, "Ask if boxes received"),
        (STATE_ASK_DATE, "Ask received date"),
        (STATE_ADD_SKU, "Add SKU"),
        (STATE_SKU_LOOP, "Add additional SKUs"),
        (STATE_PREP_INSTRUCTIONS, "Prep instructions"),
        (STATE_CONFIRM, "Confirm order details"),
        (STATE_DONE, "Complete"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="chat_sessions")
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL, related_name="chat_sessions")
    current_state = models.CharField(max_length=64, choices=STATE_CHOICES, default=STATE_ASK_RECEIVED, db_index=True)
    draft_data = models.JSONField(default=dict, blank=True)
    conversation = models.JSONField(default=list, blank=True)
    last_activity = models.DateTimeField(auto_now=True, db_index=True)
    closed = models.BooleanField(default=False, db_index=True)

    class Meta:
        indexes = [models.Index(fields=["user", "current_state"]), models.Index(fields=["last_activity"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"ChatSession {self.id} for {self.user.username if self.user else 'anon'} - {self.current_state}"
