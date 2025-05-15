"""Tests for Campaign class."""

from datetime import UTC, datetime

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.test import TestCase

from campaigns.models import Campaign


class CampaignsTest(TestCase):
    """Test cases for Campaign class."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        cls.campaign = Campaign.objects.create(
            name="Test",
            description="Test description",
            start_time=datetime(2025, 5, 14, 10, 30, tzinfo=UTC),
            end_time=datetime(2025, 5, 14, 12, 30, tzinfo=UTC),
            region=MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))),
        )

    def test_campaign_persistance(self):
        """Test persistance of campaign."""
        retrieved_camp = Campaign.objects.get(id=self.campaign.id)

        assert retrieved_camp.name == "Test"
        assert retrieved_camp.description == "Test description"
        assert retrieved_camp.start_time == datetime(2025, 5, 14, 10, 30, tzinfo=UTC)
        assert retrieved_camp.end_time == datetime(2025, 5, 14, 12, 30, tzinfo=UTC)
        assert retrieved_camp.region == "SRID=4326;MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)))"
