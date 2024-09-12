from rest_framework import serializers
from .models import Site, SiteMeasurementsDaily15, SiteMeasurementsDaily20
import math


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ['name', 'description']


class CustomFloatField(serializers.FloatField):
    def to_representation(self, value):
        if math.isnan(value):
            return None
        return super().to_representation(value)


class SiteMeasurementsDaily15Serializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)

    class Meta:
        model = SiteMeasurementsDaily15
        fields = '__all__'

    def create(self, validated_data):
        site_data = validated_data.pop('site')
        site, _ = Site.objects.get_or_create(name=site_data['name'], defaults={'description': site_data['description']})
        return SiteMeasurementsDaily15.objects.create(site=site, **validated_data)


class SiteMeasurementsDaily20Serializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)

    class Meta:
        model = SiteMeasurementsDaily20
        fields = '__all__'

    def create(self, validated_data):
        site_data = validated_data.pop('site')
        site, _ = Site.objects.get_or_create(name=site_data['name'], defaults={'description': site_data['description']})
        return SiteMeasurementsDaily20.objects.create(site=site, **validated_data)


