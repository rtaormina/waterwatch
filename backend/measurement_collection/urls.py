"""Specify the URL patterns for the measurement collection views."""

from django.urls import path

from . import views

app_name = "measurement_collection"

urlpatterns = [
    path("", views.measurement_view, name="record-measurement"),
]
