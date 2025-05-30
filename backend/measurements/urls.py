"""Specify the URL patterns for the Measurement views."""

from django.urls import include, path

from . import views

app_name = "measurements"

urlpatterns = [
    path("search/", views.measurement_search, name="measurement_search"),
    path("", views.measurement_view, name="measurement_view"),
    path("aggregated/", include("measurement_analysis.urls")),
]
