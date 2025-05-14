"""Specify the URL patterns for the Measurement Export views."""

from django.urls import path

from . import views

app_name = "export"

urlpatterns = [
    path("export/", views.export_all_view, name="index"),
]
