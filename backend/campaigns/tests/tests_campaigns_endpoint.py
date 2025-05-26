"""Tests for Campaign Endpoints."""

import logging
from datetime import UTC, datetime

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.test import TestCase

from campaigns.models import Campaign

logger = logging.getLogger(__name__)


class CampaignsEndpointTest(TestCase):
    """Test cases for Campaign Endpoints."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        cls.active_campaign = Campaign.objects.create(
            name="World Water Day 2025",
            description="Campaign is active",
            start_time=datetime(2025, 5, 14, 10, 30, tzinfo=UTC),
            end_time=datetime(2025, 5, 15, 10, 30, tzinfo=UTC),
            region=MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))),
        )
        cls.past_campagin = Campaign.objects.create(
            name="World Water Week 2023",
            description="Campaign is over",
            start_time=datetime(2023, 5, 14, 10, 30, tzinfo=UTC),
            end_time=datetime(2023, 5, 21, 10, 30, tzinfo=UTC),
            region=MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))),
        )
        cls.future_campaign = Campaign.objects.create(
            name="World Water Week 2026",
            description="Campaign is in the future",
            start_time=datetime(2026, 5, 14, 10, 30, tzinfo=UTC),
            end_time=datetime(2026, 5, 21, 10, 30, tzinfo=UTC),
            region=MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))),
        )
        cls.region = MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0))))
        cls.far_away_campaign = Campaign.objects.create(
            name="Far Away Campaign",
            description="Campaign is far away",
            start_time=datetime(2025, 5, 14, 10, 30, tzinfo=UTC),
            end_time=datetime(2025, 5, 15, 10, 30, tzinfo=UTC),
            region=MultiPolygon(Polygon(((2, 2), (3, 2), (3, 3), (2, 3), (2, 2)))),
        )
        cls.far_region = MultiPolygon(Polygon(((2, 2), (3, 2), (3, 3), (2, 3), (2, 2))))

    def test_get_active_campaigns_no_loc(self):
        dt = datetime(2025, 5, 14, 11, 30, tzinfo=UTC)
        response = self.client.get("/api/campaigns/active/", {"datetime": dt.isoformat()})
        assert response.status_code == 200
        data = response.json()
        assert len(data["campaigns"]) == 2
        retrieved_names = [c["name"] for c in data["campaigns"]]
        assert "Far Away Campaign" in retrieved_names
        assert "World Water Day 2025" in retrieved_names
        assert "World Water Week 2023" not in retrieved_names
        assert "World Water Week 2026" not in retrieved_names

    def test_get_active_campaigns_with_loc(self):
        dt = datetime(2025, 5, 14, 11, 30, tzinfo=UTC)
        response = self.client.get("/api/campaigns/active/", {"datetime": dt.isoformat(), "lat": 0.5, "lng": 0.5})
        assert response.status_code == 200
        data = response.json()
        assert len(data["campaigns"]) == 1
        retrieved_names = [c["name"] for c in data["campaigns"]]
        assert "Far Away Campaign" not in retrieved_names
        assert "World Water Day 2025" in retrieved_names
        assert "World Water Week 2023" not in retrieved_names
        assert "World Water Week 2026" not in retrieved_names
