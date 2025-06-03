"""Specify the URL patterns for the API views."""

from django.urls import include, path

from . import views

app_name = "api"

urlpatterns = [
    path("login/", views.login_view, name="api-login"),
    path("logout/", views.logout_view, name="api-logout"),
    path("session/", views.session_view, name="api-session"),
    path("whoami/", views.whoami_view, name="api-whoami"),
    path("home/", views.index_view, name="index"),
    path("health/", views.health_check_view, name="health"),
    path("user-permissions/", views.user_permissions_view, name="user-permissions"),
    path("measurements/", include("measurements.urls")),
    path("", include("measurement_export.urls")),
    path("campaigns/", include("campaigns.urls")),
]
