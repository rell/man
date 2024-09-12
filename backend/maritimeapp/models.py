from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.contrib.postgres.fields import ArrayField
from django.db.models import Min, Max

class Site(models.Model):
    name = models.CharField(primary_key=True, max_length=255)
    aeronet_number = models.IntegerField(default=0)
    description = models.TextField()
    span_date = ArrayField(
        models.DateField(),
        size=2,
        blank=True,
        null=True,
        help_text="Array holding the span of dates [start_date, end_date]"
    )

    def update_span_date(self):
        # Calculate the span date using related SiteMeasurementsDaily15 entries
        dates = SiteMeasurementsDaily15.objects.filter(site=self).aggregate(
            start_date=Min('date'),
            end_date=Max('date')
        )
        Site.objects.filter(pk=self.pk).update(span_date=[dates['start_date'], dates['end_date']])

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update span_date after the initial save
        self.update_span_date()

class SiteMeasurementsDaily15(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, default=None)
    filename = models.CharField(max_length=255, default="")
    date = models.DateField(db_index=True)
    time = models.TimeField(db_index=False)
    air_mass = models.FloatField(default=-999.0)
    latlng = gis_models.PointField(default=Point(0, 0))
    aod_340nm = models.FloatField(default=-999.0)
    aod_380nm = models.FloatField(default=-999.0)
    aod_440nm = models.FloatField(default=-999.0)
    aod_500nm = models.FloatField(default=-999.0)
    aod_675nm = models.FloatField(default=-999.0)
    aod_870nm = models.FloatField(default=-999.0)
    aod_1020nm = models.FloatField(default=-999.0)
    aod_1640nm = models.FloatField(default=-999.0)
    water_vapor = models.FloatField(default=-999.0)
    angstrom_exponent_440_870 = models.FloatField(default=-999.0)
    std_340nm = models.FloatField(default=-999.0)
    std_380nm = models.FloatField(default=-999.0)
    std_440nm = models.FloatField(default=-999.0)
    std_500nm = models.FloatField(default=-999.0)
    std_675nm = models.FloatField(default=-999.0)
    std_870nm = models.FloatField(default=-999.0)
    std_1020nm = models.FloatField(default=-999.0)
    std_1640nm = models.FloatField(default=-999.0)
    std_water_vapor = models.FloatField(default=-999.0)
    std_angstrom_exponent_440_870 = models.FloatField(default=-999.0)
    num_observations = models.IntegerField(default=0)
    last_processing_date = models.DateField()
    aeronet_number = models.IntegerField(default=0)
    microtops_number = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the span_date in the related Site instance
        self.site.update_span_date()

    def delete(self, *args, **kwargs):
        site = self.site
        super().delete(*args, **kwargs)
        # Update the span_date in the related Site instance after deletion
        site.update_span_date()

class SiteMeasurementsDaily20(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255, default="")
    date = models.DateField(db_index=True)
    time = models.TimeField(db_index=False)
    air_mass = models.FloatField(default=-999.0)
    latlng = gis_models.PointField(default=Point(0, 0))
    aod_340nm = models.FloatField(default=-999.0)
    aod_380nm = models.FloatField(default=-999.0)
    aod_440nm = models.FloatField(default=-999.0)
    aod_500nm = models.FloatField(default=-999.0)
    aod_675nm = models.FloatField(default=-999.0)
    aod_870nm = models.FloatField(default=-999.0)
    aod_1020nm = models.FloatField(default=-999.0)
    aod_1640nm = models.FloatField(default=-999.0)
    water_vapor = models.FloatField(default=-999.0)
    angstrom_exponent_440_870 = models.FloatField(default=-999.0)
    std_340nm = models.FloatField(default=-999.0)
    std_380nm = models.FloatField(default=-999.0)
    std_440nm = models.FloatField(default=-999.0)
    std_500nm = models.FloatField(default=-999.0)
    std_675nm = models.FloatField(default=-999.0)
    std_870nm = models.FloatField(default=-999.0)
    std_1020nm = models.FloatField(default=-999.0)
    std_1640nm = models.FloatField(default=-999.0)
    std_water_vapor = models.FloatField(default=-999.0)
    std_angstrom_exponent_440_870 = models.FloatField(default=-999.0)
    num_observations = models.IntegerField(default=0)
    last_processing_date = models.DateField()
    aeronet_number = models.IntegerField(default=0)
    microtops_number = models.IntegerField(default=0)

