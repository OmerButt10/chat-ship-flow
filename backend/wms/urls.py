from django.urls import path

from . import views

app_name = "wms"

urlpatterns = [
    path("chat/message/", views.chat_message, name="chat_message"),
    path("inventory/create/", views.create_inventory, name="create_inventory"),
    path("orders/<uuid:order_id>/merge-labels/", views.MergeLabelsView.as_view(), name="merge_labels"),
    path("uploads/", views.upload_files, name="upload_files"),
    path("whoami/", views.whoami, name="whoami"),
    path("inventory/", views.inventory_list, name="inventory_list"),
    path("inventory/<uuid:inventory_id>/approve/", views.inventory_approve, name="inventory_approve"),
]
