"""Create views associated with API."""

import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


def index_view(request):
    """Render the home page.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    HttpResponse
        A rendered HTML response for the index page.
    """
    return render(request, "index.html", {})


@require_POST
def login_view(request):
    """Authenticate and log in a user.

    This view expects a JSON payload with 'username' and 'password'.
    On success, logs the user in and returns a success message.
    On failure, returns an error detail with appropriate status code.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object containing JSON body with credentials.

    Returns
    -------
    JsonResponse
        - On missing credentials:
            JSON with {"detail": "Please provide username and password."}, status 400.
        - On invalid credentials:
            JSON with {"detail": "Invalid credentials."}, status 400.
        - On successful login:
            JSON with {"detail": "Successfully logged in."}, status 200.
    """
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    if username is None or password is None:
        return JsonResponse({"detail": "Please provide username and password."}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        return JsonResponse({"detail": "Invalid credentials."}, status=400)

    login(request, user)
    return JsonResponse({"detail": "Successfully logged in."})


@require_POST
def logout_view(request):
    """Log out the current user.

    If the user is not authenticated, returns an error.
    Otherwise, logs out and returns a success message.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        - If user is not authenticated:
            JSON with {"detail": "You're not logged in."}, status 400.
        - On successful logout:
            JSON with {"detail": "Successfully logged out."}, status 200.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "You're not logged in."}, status=400)

    logout(request)
    return JsonResponse({"detail": "Successfully logged out."})


@ensure_csrf_cookie
def session_view(request):
    """Check whether the user is currently authenticated, setting CSRF cookie.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON with {"isAuthenticated": bool}, where the boolean reflects
        the user's authentication status.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"isAuthenticated": False})

    return JsonResponse({"isAuthenticated": True})


def whoami_view(request):
    """Retrieve the username of the authenticated user.

    If the user is not authenticated, returns isAuthenticated=False.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        - If user is not authenticated:
            JSON with {"isAuthenticated": False}, status 200.
        - If authenticated:
            JSON with {"username": <str>}, status 200.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"isAuthenticated": False})

    return JsonResponse({"username": request.user.username})


@require_GET
@login_required
def user_permissions_view(request):
    """Return the authenticated user's groups and permissions.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        - If user is authenticated:
            JSON with {
                "username": <str>,
                "groups": [<str>, ...],
                "permissions": [<str>, ...],
                "is_superuser": <bool>
            }
        - If not authenticated:
            Returns 403 automatically due to @login_required
    """
    user = request.user

    return JsonResponse(
        {
            "username": user.username,
            "groups": list(user.groups.values_list("name", flat=True)),
            "permissions": list(user.get_all_permissions()),
            "is_superuser": user.is_superuser,
        }
    )
