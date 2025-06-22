from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('measurement_export', '0005_alter_preset_filters'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS locations (
                  id SERIAL PRIMARY KEY,
                  country_name VARCHAR(44),
                  continent VARCHAR(23),
                  geom geometry(MultiPolygon,4326)
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS locations CASCADE;",
            # Mark this as a state operation so Django doesn't try to manage the model
            state_operations=[],
        ),
    ]
