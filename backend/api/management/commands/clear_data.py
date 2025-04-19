from django.core.management.base import BaseCommand
from api.models import Track, Artist, Album

class Command(BaseCommand):
    help = 'Clears old data from api_track, api_artist, and api_album tables'

    def add_arguments(self, parser):
        parser.add_argument('--all', action='store_true', help='Clear all data')
        parser.add_argument('--artist', type=str, help='Clear data for specific artist name')

    def handle(self, *args, **options):
        if options['all']:
            Track.objects.all().delete()
            Artist.objects.all().delete()
            Album.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Successfully cleared all data from api_track, api_artist, and api_album'))
        elif options['artist']:
            artist_name = options['artist']
            Track.objects.filter(artist_name__icontains=artist_name).delete()
            Artist.objects.filter(name__icontains=artist_name).delete()
            Album.objects.filter(artist_name__icontains=artist_name).delete()
            self.stdout.write(self.style.SUCCESS(f'Successfully cleared data for artist: {artist_name}'))
        else:
            self.stdout.write(self.style.WARNING('Please specify --all or --artist <name>'))