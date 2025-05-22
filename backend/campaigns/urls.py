"""Specify the URL patterns for the Campaign views."""

from django.urls import path

from . import views

app_name = "api"

urlpatterns = [
    path("active/", views.get_active_campaigns, name="active-campaigns"),
]
