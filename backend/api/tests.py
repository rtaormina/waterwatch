"""Tests for API."""
# Create your tests here.

from django.test import TestCase


class APITests(TestCase):
    """Test cases for API base Endpoints."""

    def test_health_check(self):
        """Test the HealthCheck returning 200 Ok response."""
        response = self.client.get("/api/health/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
