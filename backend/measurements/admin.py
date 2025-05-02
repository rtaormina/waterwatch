"""Add Measurements to Admin view."""

from django.contrib import admin

from .models import Measurement, Temperature

# Register your models here.
admin.site.register(Measurement)
admin.site.register(Temperature)
