from django.urls import path, include
# from . import views
from .views import download_data, list_sites, site_measurements

urlpatterns = \
[
    path('download/', download_data, name='download_data'),
    path('measurements/sites/', list_sites, name='list_sites'),
    path('measurements/', site_measurements, name='site_measurements'),
]
