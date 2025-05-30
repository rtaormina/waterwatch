"""Specify the URL patterns for the Anylisis (aggregated) views."""

from django.urls import path

from . import views

urlpatterns = [
    path("", views.analysed_measurements_view, name="analysed_measurements_view"),
]
