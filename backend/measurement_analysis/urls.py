"""Specify the URL patterns for the Analysis (aggregated) views."""

from django.urls import path

from . import views

urlpatterns = [
    path("", views.analyzed_measurements_view, name="analyzed_measurements_view"),
]
