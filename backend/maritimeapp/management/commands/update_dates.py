from django.core.management.base import BaseCommand
from maritimeapp.models import Site

class Command(BaseCommand):
    help = 'Updates span_date field for all Site records'

    def handle(self, *args, **kwargs):
        sites = Site.objects.all()
        for site in sites:
            site.update_span_date()
            self.stdout.write(self.style.SUCCESS(f'Successfully updated span_date for site: {site.name}'))
