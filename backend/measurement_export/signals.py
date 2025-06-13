"""Signal handlers to clear the cache when certain models are saved or deleted."""

import logging

from campaigns.models import Campaign
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement

from measurement_export.models import Location

logger = logging.getLogger("WATERWATCH")
User = get_user_model()

# Models that should trigger clearing the default cache
MODELS_TO_INVALIDATE_DEFAULT_CACHE = [Measurement, Campaign, User]

# Add metric models to the list of models that invalidate the default cache
MODELS_TO_INVALIDATE_DEFAULT_CACHE.extend(METRIC_MODELS)

# Models that should trigger clearing the location cache
MODELS_TO_INVALIDATE_LOCATION_CACHE = [Location]


def clear_default_cache(sender, **_kwargs):
    """Signal handler to clear the default cache.

    This function is connected to the post_save and post_delete signals of specified models.

    Parameters
    ----------
    sender : Model
        The model class that triggered the signal.
    **_kwargs : dict
        Additional keyword arguments provided by the signal.
    """
    logger.info("Default cache invalidated due to a change in the %s model.", sender.__name__)
    cache.clear()


def clear_location_cache_signal(sender, **_kwargs):
    """Signal handler to clear the location cache.

    This function is connected to the post_save and post_delete signals of Location model.

    Parameters
    ----------
    sender : Model
        The model class that triggered the signal.
    **_kwargs : dict
        Additional keyword arguments provided by the signal.
    """
    logger.info("Location cache invalidated due to a change in the %s model.", sender.__name__)

    # Import here to avoid circular imports
    from .utils import clear_location_cache

    clear_location_cache()


# Connect signals for default cache invalidation
for model in MODELS_TO_INVALIDATE_DEFAULT_CACHE:
    post_save.connect(clear_default_cache, sender=model)
    post_delete.connect(clear_default_cache, sender=model)

# Connect signals for location cache invalidation
for model in MODELS_TO_INVALIDATE_LOCATION_CACHE:
    post_save.connect(clear_location_cache_signal, sender=model)
    post_delete.connect(clear_location_cache_signal, sender=model)
