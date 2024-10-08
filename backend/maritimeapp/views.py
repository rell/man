
## FILE DOWNLOAD ##

# TODO: Display implemention within github repo
'''
How file download works:

Source file contains all data files in a directory structure.

The user selects sites, start date, end date, retrievals, frequency, quality, and bounding box coordinates. 

The backend filters the files based on the user's selection - a list of files names are generated based on parameters
and  this list is used to processes the files to filter by date and bounds.

The processed files are then zipped and sent to the user as a stream to be downloaded.
'''

import os
from re import sub
import shutil
import time
import tarfile 
import pandas as pd
from concurrent.futures import ProcessPoolExecutor
from django.http import HttpResponse
from django.views.decorators.http import require_GET
import subprocess
from datetime import date, datetime
# from tqdm import tqdm

def process_file(file_path, start_date, end_date, bounds):
    try:
        # First four lines contain disclaimers and metadata
        with open(file_path, 'r', encoding="latin-1") as f:
            header_lines = [next(f) for _ in range(4)]
        
        f.close()
        # Row 5 is the header and the data starts from row 6
        df = pd.read_csv(file_path, skiprows=4, encoding='latin-1')  # Skip first 4 lines
        
        date_format = '%d:%m:%Y'  # Key Date(dd:mm:yyyy)

        # Convert 'Date(dd:mm:yyyy)' column to datetime format from front end
        df['Date(dd:mm:yyyy)'] = pd.to_datetime(df['Date(dd:mm:yyyy)'], format=date_format, errors='coerce')
        
        # Date rows that could not be parsed - TODO: Include in log file.
        if df['Date(dd:mm:yyyy)'].isna().any():
            print(f"Warning: Some dates in {file_path} could not be parsed")

        # Convert to front end format for  filtering
        start_date = pd.to_datetime(start_date, format='%Y-%m-%d', errors='coerce') if start_date else None
        end_date = pd.to_datetime(end_date, format='%Y-%m-%d', errors='coerce') if end_date else None

        # Filter by set date
        if start_date:
            df = df[df['Date(dd:mm:yyyy)'] >= start_date]
        if end_date:
            df = df[df['Date(dd:mm:yyyy)'] <= end_date]

        # Filter by set boundaries
        if bounds['min_lat']:
            df = df[df['Latitude'] >= float(bounds['min_lat'])]
        if bounds['max_lat']:
            df = df[df['Latitude'] <= float(bounds['max_lat'])]
        if bounds['min_lng']:
            df = df[df['Longitude'] >= float(bounds['min_lng'])]
        if bounds['max_lng']:
            df = df[df['Longitude'] <= float(bounds['max_lng'])]

        if df.empty:
            return
        
        # Convert dates back to original format from file
        df['Date(dd:mm:yyyy)'] = df['Date(dd:mm:yyyy)'].dt.strftime(date_format)
        

        # Overwrite the file with new filtered data
        with open(file_path, 'w') as f:
            f.writelines(header_lines)
            # new filtered data 
            df.to_csv(f, index=False, header=True)
        f.close()

    # TODO: Log exceptions to log file
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")


@require_GET
def download_data(request):
    # Variables for file generation
    src_dir = r"./src"  # Path to the source directory
    temp_base_dir = r"./temp"  # Path to the temporary directory
    unique_temp_folder = str(int(time.time())) + "_MAN_DATA"
    keep_files = ["data_usage_policy.pdf", "data_usage_policy.txt"]

    
    # Variables from request
    sites = request.GET.getlist('sites[]')
    start_date = request.GET.get('start_date', None)
    end_date = request.GET.get('end_date', None)
    retrievals = request.GET.getlist('retrievals[]')
    frequency = request.GET.getlist('frequency[]')
    quality = request.GET.getlist('quality[]')
    bounds = {
        "min_lat": request.GET.get('min_lat', None),
        "min_lng": request.GET.get('min_lng', None),
        "max_lat": request.GET.get('max_lat', None),
        "max_lng": request.GET.get('max_lng', None)
    }



    print(f"{datetime(2004,10,16).strftime('%Y-%m-%d')}\n")
    print(f"{start_date}\n")

    if (start_date is not None) or (end_date is not None):
        # Define the specific date to compare with
        init_start_date = datetime(2004,10,16).strftime('%Y-%m-%d')
        today_date = datetime.now().date().strftime('%Y-%m-%d') 

        if start_date is not None:
            if start_date == init_start_date:
                start_date = None
        if end_date is not None:
            if end_date == today_date:
                end_date = None

    # DEBUG
    # print("Sites:", sites)
    # print("Start Date:", start_date)
    # print("End Date:", end_date)
    # print("Retrievals:", retrievals)
    # print("Frequency:", frequency)
    # print("Quality:", quality)

    # Create the unique temp directory
    full_temp_path = os.path.join(temp_base_dir, unique_temp_folder)
    os.makedirs(full_temp_path, exist_ok=True)

    # Define file endings and options
    file_endings = [
        "all_points.lev10",
        "all_points.lev15",
        "all_points.lev20",
        "series.lev15",
        "series.lev20",
        "daily.lev15",
        "daily.lev20",
        "all_points.ONEILL_10",
        "all_points.ONEILL_15",
        "all_points.ONEILL_20",
        "series.ONEILL_15",
        "series.ONEILL_20",
        "daily.ONEILL_15",
        "daily.ONEILL_20",
    ]

    def get_files_to_copy(sites, retrievals, frequency, quality, file_endings):
        quality_map = {
            'AOD': {
                'Level 1.0': 'lev10',
                'Level 1.5': 'lev15',
                'Level 2.0': 'lev20',
            },
            'SDA': {
                'Level 1.0': 'ONEILL_10',
                'Level 1.5': 'ONEILL_15',
                'Level 2.0': 'ONEILL_20',
            },
        }

        files_to_copy = []
        for retrieval in retrievals:
            # TODO: Log to log file
            if retrieval not in quality_map:
                print(f"Warning: Retrieval '{retrieval}' not in quality map")
                continue

            for site in sites:
                for freq in frequency:
                    for q in quality:
                        if freq == 'Series':
                            prefix = 'series'
                        elif freq == 'Point':
                            prefix = 'all_points'
                        elif freq == 'Daily':
                            prefix = 'daily'
                        else:
                            continue

                        # Generate files to download based on the quality map
                        file_ending = quality_map[retrieval].get(q)
                        if file_ending:
                            file_name = f"{site}_{prefix}.{file_ending}"
                            file_ending_only = f"{prefix}.{file_ending}"
                            
                            if file_ending_only in file_endings:
                                files_to_copy.append(file_name)
                            else:
                                pass

        return files_to_copy

    def copy_files(src_dir, temp_dir, retrievals, files_to_copy):
        complete_files = []
        for retrieval in retrievals:
            retrieval_dir = os.path.join(temp_dir, retrieval)
            os.makedirs(retrieval_dir, exist_ok=True)

            for file_name in files_to_copy:
                src_file = os.path.join(src_dir, retrieval, file_name)
                temp_file = os.path.join(retrieval_dir, file_name)

                if os.path.isfile(src_file):
                    complete_files.append(src_file)
                    # shutil.copy(src_file, temp_file)
                    # # TODO: Log to log file
                    # print(f"Copied {src_file} to {temp_file}")
                else:
                    #TODO: Log to log file
                    pass    
                # print(f"Source file {src_file} does not exist")

        print(f"copying files {complete_files}")
        
        # -Bulk copy all files to directory.
        subprocess.run(["cp"] + ["-r"] + complete_files + [temp_dir])
        if 'AOD' in retrievals:
            subprocess.run(f'mv {temp_dir}/*.lev* {os.path.join(temp_dir, 'AOD')}', check=True, shell=True)
        if 'SDA' in retrievals:
            subprocess.run(f'mv {temp_dir}/*.ONEILL* {os.path.join(temp_dir, 'SDA')}', check=True, shell=True)
        
        for policy_file in keep_files:
            src_policy_file = os.path.join(src_dir, policy_file)
            temp_policy_file = os.path.join(temp_dir, policy_file)

            os.makedirs(os.path.dirname(temp_policy_file), exist_ok=True)

            if os.path.isfile(src_policy_file):
                shutil.copy(src_policy_file, temp_policy_file)

                #TODO: Log to log file
                print(f"Copied {src_policy_file} to {temp_policy_file}")
            else:
                #TODO: Log to log file
                print(f"Source policy file {src_policy_file} does not exist")

    def process_files(temp_dir, start_date, end_date, bounds, retrievals):
        skip_files = {'data_usage_policy.pdf', 'data_usage_policy.txt'}

        files = []
        for retrieval in retrievals:
            subdir_path = os.path.join(temp_dir, retrieval)
            print(f"Subdirectory path: {subdir_path}")

            if os.path.isdir(subdir_path):
                for file_name in os.listdir(subdir_path):
                    if file_name not in skip_files:
                        files.append(os.path.join(subdir_path, file_name))
            else:
                # TODO: Log to log file
                print(f"Subdirectory {subdir_path} does not exist or is not a directory")

        # Multiprocessing implementation
        with ProcessPoolExecutor(max_workers=4) as executor:
            futures = []
            for file_path in files:
                futures.append(executor.submit(process_file, file_path, start_date, end_date, bounds))

            for future in futures:
                future.result()

    # def add_with_progress(tarf, folder):
    #     items = [item for item in os.listdir(folder) if os.path.exists(os.path.join(folder, item))]
    #     
    #     print(items)
    #     with tqdm(total=len(items), unit='file') as pbar:
    #         for file in items:
    #             tarf.add(os.path.join(folder, file), arcname=file)
    #             pbar.update(1)  # Update progress bar for each file added

    files_to_copy = get_files_to_copy(sites, retrievals, frequency, quality, file_endings)
    copy_files(src_dir, full_temp_path, retrievals, files_to_copy)
    
    if start_date is not None or end_date is not None or bounds['min_lat'] is not None:
        process_files(full_temp_path, start_date, end_date, bounds, retrievals)

    tar_filename = f"{unique_temp_folder}.tar.gz"
    tar_path = os.path.join(temp_base_dir, tar_filename)
    directory_to_archive = os.path.join(temp_base_dir, unique_temp_folder)

    # Create a tar.gz file
    try:
        subprocess.run(['tar', '-czvf', tar_path, directory_to_archive], check=True)
        print(f"Successfully created {tar_filename} from {directory_to_archive}")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while creating the tar file: {e}")
        # for root, dirs, files in os.walk(full_temp_path):
        #     for file in files:
        #         file_path = os.path.join(root, file)
        #         arcname = os.path.relpath(file_path, full_temp_path)
        #         tarf.add(file_path, arcname=arcname)
        #
    response = HttpResponse(content_type='application/gzip')
    response['Content-Disposition'] = f'attachment; filename={tar_filename}'

    with open(tar_path, 'rb') as f:
        response.write(f.read())

    # Clean up temporary files
    try:
        if os.path.exists(full_temp_path):
            shutil.rmtree(full_temp_path)
            print(f"Deleted temporary directory {full_temp_path}")
        if os.path.exists(tar_path):
            os.remove(tar_path)
            print(f"Deleted temporary files {full_temp_path} and {tar_path}")
    except Exception as e:
        print(f"Error cleaning up temporary files: {e}")

    return response
  
##### INTERFACING FRONT-END ####
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.utils.dateparse import parse_date
from django.contrib.gis.geos import Point, Polygon
from django.db.models import Q, F
from django.utils.timezone import now
from .models import Site, SiteMeasurementsDaily15

@require_GET
def list_sites(request):
    min_lat = request.GET.get('min_lat')
    min_lng = request.GET.get('min_lng')
    max_lat = request.GET.get('max_lat')
    max_lng = request.GET.get('max_lng')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    queryset = Site.objects.all()
    
   
    if min_lat and min_lng and max_lat and max_lng:
        try:
            min_point = Point(float(min_lng), float(min_lat))
            max_point = Point(float(max_lng), float(max_lat))
            bbox_polygon = Polygon.from_bbox((min_point.x, min_point.y, max_point.x, max_point.y))

            # Get all Site IDs that have measurements within the bounding box
            filtered_sites_ids = SiteMeasurementsDaily15.objects.filter(
                latlng__within=bbox_polygon
            ).values_list('site_id', flat=True).distinct()

            # Debug
            # print(f"list sites: {list(filtered_sites_ids)}")

            if filtered_sites_ids:
                queryset = queryset.filter(name__in=filtered_sites_ids)
            else:
                return JsonResponse([], safe=False)
       
        except (ValueError, TypeError) as e:
            # invalid coordinates provided
            print(f"Error with bounding box coordinates: {e}")
            return JsonResponse([], safe=False)

    today = now().date()
   
    if start_date_str:
        start_date = parse_date(start_date_str)
        if start_date:
            if end_date_str:
                end_date = parse_date(end_date_str)
                if end_date:
                    # Filter for sites with span_date that intersects with [start_date, end_date]
                    queryset = queryset.filter(
                        Q(span_date__0__lte=end_date, span_date__1__gte=start_date) |
                        Q(span_date__0__lte=start_date, span_date__1__gte=end_date)
                    ).distinct()
            else:
                # span_date [0, 1] 0 = start_date, 1 = end_date
                # Filter for sites with span_date that intersects with [today, start_date]
                queryset = queryset.filter(
                    Q(span_date__0__lte=today, span_date__1__gte=start_date) |
                    Q(span_date__0__lte=start_date, span_date__1__gte=today)
                ).distinct()
    elif end_date_str:
        end_date = parse_date(end_date_str)
        if end_date:
            queryset = queryset.filter(
                Q(span_date__0__lte=end_date, span_date__1__gte=end_date)
            ).distinct()

    # Sorting based on start_date within span_date
    queryset = queryset.annotate(
        start_date=F('span_date__0')
    ).order_by('start_date')

    sites = queryset.values('name', 'span_date')
    return JsonResponse(list(sites), safe=False)



from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import Site, SiteMeasurementsDaily15
from django.contrib.gis.geos import Polygon
from django.contrib.gis.geos.point import Point
from django.utils.dateparse import parse_date


@require_GET
def site_measurements(request):
    aod_key = request.GET.get('reading', 'aod_500nm')
    min_lat = request.GET.get('min_lat')
    min_lng = request.GET.get('min_lng')
    max_lat = request.GET.get('max_lat')
    max_lng = request.GET.get('max_lng')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    selected_sites = request.GET.get('sites', '')  
    site_names = selected_sites.split(',') if selected_sites else []

    if len(site_names) == 0:
        return JsonResponse({'error': 'No sites selected'}, status=400)

    sites = Site.objects.filter(name__in=site_names) if site_names else Site.objects.all()

    # TODO: Dynmaic model selection based on provided key - to be implemented later
    queryset = SiteMeasurementsDaily15.objects.filter(site__in=sites)

    if min_lat and min_lng and max_lat and max_lng:
        polygon = Polygon.from_bbox((float(min_lng), float(min_lat), float(max_lng), float(max_lat)))
        queryset = queryset.filter(latlng__within=polygon).distinct()

    if start_date_str and end_date_str:
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)
        queryset = queryset.filter(date__range=(start_date, end_date))
    elif start_date_str:
        start_date = parse_date(start_date_str)
        queryset = queryset.filter(date__gte=start_date)
    elif end_date_str:
        end_date = parse_date(end_date_str)
        queryset = queryset.filter(date__lte=end_date)

    # Convert queryset to a list of dictionaries and handle latlng serialization
    measurements = list(queryset.values('site', 'filename', 'date', 'time', 'latlng', 'aeronet_number', aod_key))

    # Convert latlng (Point) to a serializable format
    for measurement in measurements:
        latlng = measurement.get('latlng')
        if isinstance(latlng, Point):
            measurement['latlng'] = {'lng': latlng.x, 'lat': latlng.y}
        else:
            measurement['latlng'] = None  # Handle cases where latlng is None or not a Point

        # Rename the dynamic key to "value"
        measurement["value"] = measurement.pop(aod_key)

    return JsonResponse(measurements, safe=False)

