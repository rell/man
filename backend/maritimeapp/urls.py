from django.urls import path, include
# from . import views
from .views import download_data, list_sites, site_measurements, get_display_info

urlpatterns = \
[
    path('download/', download_data, name='download_data'),
    path('measurements/sites/', list_sites, name='list_sites'),
    path('measurements/', site_measurements, name='site_measurements'),
    path('display_info/', get_display_info, name='display_info')
]
