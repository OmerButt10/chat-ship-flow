from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import ChatSession, Order
from .serializers import ChatMessageSerializer, ChatSessionSerializer
from .services.label_merge import merge_uploaded_pdfs
from .models import UploadedFile, Inventory
from .serializers import InventorySerializer
from rest_framework.decorators import action

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_inventory(request):
    """Create inventory with approval logic.

    - If client creates, status = PENDING and requested_by set.
    - If staff/admin creates, status = APPROVED and approved metadata set.
    """
    data = request.data
    sku = data.get("sku")
    location = data.get("location", "")
    qty = data.get("quantity_on_hand", 0)
    extra = data.get("extra_fields", {})

    if not sku:
        return Response({"detail": "sku is required"}, status=status.HTTP_400_BAD_REQUEST)

    # decide initial status
    user = request.user
    if user.is_authenticated and getattr(user, "role", None) == user.ROLE_CLIENT:
        status_val = Inventory.STATUS_PENDING
        requested_by = user
        approved_by = None
        approved_at = None
    else:
        status_val = Inventory.STATUS_APPROVED
        requested_by = None
        approved_by = user
        approved_at = timezone.now()

    inv = Inventory.objects.create(
        sku=sku,
        location=location,
        quantity_on_hand=qty,
        status=status_val,
        requested_by=requested_by,
        approved_by=approved_by,
        approved_at=approved_at,
        extra_fields=extra,
    )

    return Response({"id": str(inv.id), "status": inv.status}, status=status.HTTP_201_CREATED)


class MergeLabelsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        # expects file_ids as ordered list in body
        file_ids = request.data.get("file_ids", [])
        order = get_object_or_404(Order, id=order_id)
        files = UploadedFile.objects.filter(id__in=file_ids, order=order).order_by("created_at")
        merged = merge_uploaded_pdfs(order, files)
        return Response({"merged_id": str(merged.id), "url": merged.file.url})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def whoami(request):
    user = request.user
    return Response({
        "id": str(user.id) if getattr(user, 'id', None) else None,
        "username": getattr(user, 'username', ''),
        "email": getattr(user, 'email', ''),
        "role": getattr(user, 'role', None),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_list(request):
    qs = Inventory.objects.all().order_by("-last_updated")
    serializer = InventorySerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_files(request):
    """Handle multipart file uploads and create UploadedFile records.

    Expects form-data with fields:
      - order_id (optional): UUID of an order to associate
      - files: one or more file fields (use multiple 'files' entries)
    Returns created file ids and urls.
    """
    order = None
    order_id = request.data.get("order_id")
    if order_id:
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    uploaded = []
    files = request.FILES.getlist("files")
    if not files:
        return Response({"detail": "No files uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    for f in files:
        uf = UploadedFile.objects.create(
            uploaded_by=request.user if request.user.is_authenticated else None,
            order=order,
            file=f,
            file_type=getattr(f, "content_type", ""),
        )
        uploaded.append({"id": str(uf.id), "url": uf.file.url, "name": uf.file.name})

    return Response({"files": uploaded}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def inventory_approve(request, inventory_id):
    inv = get_object_or_404(Inventory, id=inventory_id)
    user = request.user
    if not (user.is_admin() or user.is_staff_role()):
        return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    inv.status = Inventory.STATUS_APPROVED
    inv.approved_by = user
    inv.approved_at = timezone.now()
    inv.approval_notes = request.data.get("notes", "")
    inv.save()
    return Response({"id": str(inv.id), "status": inv.status})


def _build_response(text: str, options: list | None = None, session: ChatSession | None = None):
    return {
        "text": text,
        "options": options or [],
        "session": ChatSessionSerializer(session).data if session else None,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def chat_message(request):
    """Handle chat messages for order intake FSM.

    Expected payload: { session_id?, message }
    """
    serializer = ChatMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    session = None
    if data.get("session_id"):
        session = get_object_or_404(ChatSession, id=data["session_id"])  # type: ignore

    # If no session, create one linked to authenticated user if present
    if session is None:
        session = ChatSession.objects.create(user=request.user if request.user.is_authenticated else None)

    # Append message to conversation
    conv = session.conversation or []
    conv.append({"from": "user", "message": data["message"]})
    session.conversation = conv

    # Simple FSM logic (minimal implementation)
    state = session.current_state
    msg = data["message"].strip().lower()

    if state == ChatSession.STATE_ASK_RECEIVED:
        # Expect yes/no
        if msg in ("yes", "y", "received"):
            session.current_state = ChatSession.STATE_ASK_DATE
            session.draft_data["boxes_received"] = True
            session.save()
            return Response(_build_response("When were the boxes received? (YYYY-MM-DD)", [], session))
        else:
            session.current_state = ChatSession.STATE_DONE
            session.closed = True
            session.save()
            return Response(_build_response("Okay, marked as not received.", [], session))

    if state == ChatSession.STATE_ASK_DATE:
        # Basic date capture
        session.draft_data["received_date"] = msg
        session.current_state = ChatSession.STATE_ADD_SKU
        session.save()
        return Response(_build_response("Please provide SKU (format: SKU,quantity). Type 'done' when finished.", [], session))

    if state in (ChatSession.STATE_ADD_SKU, ChatSession.STATE_SKU_LOOP):
        if msg == "done":
            session.current_state = ChatSession.STATE_PREP_INSTRUCTIONS
            session.save()
            return Response(_build_response("Any prep instructions? If none, type 'none'.", [], session))

        # parse simple sku,quantity
        try:
            sku, qty = [p.strip() for p in msg.split(",", 1)]
            items = session.draft_data.get("items", [])
            items.append({"sku": sku, "quantity": int(qty)})
            session.draft_data["items"] = items
            session.current_state = ChatSession.STATE_SKU_LOOP
            session.save()
            return Response(_build_response(f"Added {qty} x {sku}. Add another SKU or type 'done'.", [], session))
        except Exception:
            return Response(_build_response("Invalid format. Enter SKU and quantity separated by a comma, e.g. ABC123,2."), status=status.HTTP_400_BAD_REQUEST)

    if state == ChatSession.STATE_PREP_INSTRUCTIONS:
        session.draft_data["prep_instructions"] = msg if msg != "none" else ""
        session.current_state = ChatSession.STATE_CONFIRM
        session.save()
        # summarize
        items = session.draft_data.get("items", [])
        summary = "Order draft:\n"
        for it in items:
            summary += f"- {it['quantity']} x {it['sku']}\n"
        return Response(_build_response(summary + "Confirm and create order? (yes/no)", [], session))

    if state == ChatSession.STATE_CONFIRM:
        if msg in ("yes", "y"):
            # Create order (basic)
            client = request.user if request.user.is_authenticated and request.user.is_client() else None
            reference = f"CHAT-{session.id.hex[:8]}"
            order = Order.objects.create(client=client or None, reference=reference)
            # create order items
            for it in session.draft_data.get("items", []):
                OrderItem = None
                try:
                    from .models import OrderItem as _OrderItem

                    OrderItem = _OrderItem
                except Exception:
                    OrderItem = None

                if OrderItem:
                    OrderItem.objects.create(order=order, sku=it.get("sku", ""), quantity=it.get("quantity", 1))

            session.current_state = ChatSession.STATE_DONE
            session.closed = True
            session.order = order
            session.save()
            return Response(_build_response(f"Order {order.reference} created.", [], session))
        else:
            session.current_state = ChatSession.STATE_DONE
            session.closed = True
            session.save()
            return Response(_build_response("Order creation cancelled.", [], session))

    return Response(_build_response("Unhandled state."), status=status.HTTP_400_BAD_REQUEST)
