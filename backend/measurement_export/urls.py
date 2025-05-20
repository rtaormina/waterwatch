"""Specifies the URL patterns for the measurement_export app."""

from django.urls import path

from . import views

urlpatterns = [
    path("", views.location_list, name="location-list"),
]
