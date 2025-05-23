"""Contains the metric models for the measurements app."""

from measurement_collection.tests.test_extra_metric_table import TestMetric

from .models import Temperature

METRIC_MODELS = [Temperature, TestMetric]
