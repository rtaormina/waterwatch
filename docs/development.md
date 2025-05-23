# Development

This section outlines the development steps that need to be taken to extend certain WATERWATCH functionalities.


### Table of Contents

[Adding Additional Metrics](#adding-additional-metrics)
  * [Backend](#backend)
    * [Models](#models)
    * [Serializers](#serializers)
    * [Final Steps](#final-steps)
  * [Frontend](#frontend)

[Adding Water Sources](#adding-water-sources)
  * [Backend](#backend-1)
  * [Frontend](#frontend-1)

## Adding Additional Metrics
This section outlines how an additional metric can be integrated into WATERWATCH.

### Backend
#### Models
Metric models are defined in `backend/measurements/models.py`. To add a metric model to the database, create a class for the metric with the following structure, replacing `Metric` with the name of the metric being added:
```python
class Metric(models.Model):
    """Model for recording metric measurements in the database.

    Attributes
    ----------
    measurement : Measurement
        Associated Measurement for metric
    """

    measurement = models.OneToOneField(Measurement, on_delete=models.CASCADE, null=False, default=None)
```
Any additionally desired fields can be added after the measurement field.


#### Serializers
Metrics require a serializer to be properly added and exported.

In `backend/measurement_collection/serializers.py`, add a serializer for the new metric in the following format, replacing `Metric` and `metric field` with the appropriate metric name and fields defined in the model:
```python
class MetricSerializer(serializers.ModelSerializer):
    """Serializer for Metric model.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer
    """

    class Meta:
        """Meta class for MetricSerializer."""

        model = Metric
        fields = ["metric field 1", "metric field 2"]
```

#### Final Steps
In `backend/measurements/metrics.py` add the name of the metric to `METRIC_MODELS`.

Once changes to the model have been finalized, run the following commands:
```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```
### Frontend


## Adding Water Sources
This section outlines how additional water sources can be integrated into WATERWATCH.

### Backend
In `backend/measurements/models.py`, add the desired water sources to `water_source_choices`.

### Frontend
