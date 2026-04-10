from rest_framework import serializers

from .models import ChatSession, Order, OrderItem, Inventory, ClientProfile


class ChatMessageSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=False)
    message = serializers.CharField()


class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ("id", "user", "current_state", "draft_data", "conversation", "last_activity", "closed")


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "sku", "quantity", "unit_price", "extra_fields")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ("id", "client", "reference", "status", "created_at", "items", "extra_fields")


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ("id", "sku", "location", "quantity_on_hand", "status", "extra_fields")


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ("id", "user", "billing_type", "storage_rate_per_cuft", "pricing_rules", "extra_fields")


class UploadedFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = __import__(".models", fromlist=["UploadedFile"]).UploadedFile
        fields = ("id", "uploaded_by", "order", "invoice", "shipment", "file_type", "notes", "created_at", "url")
        read_only_fields = ("id", "uploaded_by", "created_at", "url")

    def get_url(self, obj):
        request = self.context.get("request")
        try:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        except Exception:
            return obj.file.url
