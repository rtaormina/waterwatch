"""Signal handlers to clear the cache when certain models are saved or deleted."""

import logging

from campaigns.models import Campaign
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement

logger = logging.getLogger("WATERWATCH")
User = get_user_model()

# A list of all models that should trigger a cache clear
MODELS_TO_INVALIDATE_CACHE = [Measurement, Campaign, User]

# Add metric models to the list of models that invalidate the cache
MODELS_TO_INVALIDATE_CACHE.extend(METRIC_MODELS)


def clear_cache(sender, **_kwargs):
    """Signal handler to clear the entire cache.

    This function is connected to the post_save and post_delete signals of specified models.

    Parameters
    ----------
    sender : Model
        The model class that triggered the signal.
    **_kwargs : dict
        Additional keyword arguments provided by the signal.
    """
    logger.info("Cache invalidated due to a change in the %s model.", sender.__name__)
    cache.clear()


# Loop through the list of models and connect the signals
for model in MODELS_TO_INVALIDATE_CACHE:
    post_save.connect(clear_cache, sender=model)
    post_delete.connect(clear_cache, sender=model)
