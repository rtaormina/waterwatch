"""Specify the URL patterns for the Measurement views."""

from django.urls import path

from . import views

app_name = "measurements"

urlpatterns = [
    path("", views.measurement_view, name="measurements"),
]
