import React, { useEffect, useState, useCallback, ReactElement } from "react";
import { useMapContext } from "../MapContext";
import L from "leaflet";
import * as d3 from "d3";
import "leaflet-svg-shape-markers"; // shape markers
import API_BASE_URL from "../../config";

export interface SiteSelect {
  name: string;
}

export interface Marker {
  site: string;
  filename: string;
  date: Date;
  time: Date;
  latlng: {
    lat: number;
    lng: number;
  };
  aeronet_number: number;
  value: number;
}

interface SiteManagerProps {
  startDate: string;
  endDate: string;
  minLat?: number;
  minLng?: number;
  maxLat?: number;
  maxLng?: number;
  type: string;
  selectedSites?: Set<string>;
  children: ReactElement<SiteManagerChildProps>;
}

interface SiteManagerChildProps {
  sites: SiteSelect[];
  selectedSites: Set<string>;
  selectSite: (siteName: string) => void;
  selectAllSites: () => void;
  deselectAllSites: () => void;
  setSites: (sites: SiteSelect[]) => void;
}
  


const SiteManager: React.FC<SiteManagerProps> = ({
  startDate,
  endDate,
  minLat,
  minLng,
  maxLat,
  maxLng,
  type,
  selectedSites,
  children,
}) => {
  const { map } = useMapContext();
  const [sites, setSites] = useState<SiteSelect[]>([]);
  const [value, setValue] = useState<string>(type);
  const [colors, setColors] = useState<string[]>([]); 
  const [colorDomain, setColorDomain] = useState<number[]>([]);
  
  useEffect(() => {
    const colors = ["blue", "teal", "green", "chartreuse", "yellow", "orange", "red"];
    let domain: number[];

    if (type.includes("std_") || type.includes("aod_")) {
      domain = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
    } else if (type.includes("water_vapor") || type.includes("air_mass")) {
      domain = [0, 1, 2, 3, 4, 5];
    } else {
      domain = [0, 1 / 6, (1 / 6) * 2, (1 / 6) * 3, (1 / 6) * 4, (1 / 6) * 5, 1];
    }

    setColors(colors);
    setColorDomain(domain);
  }, [type]); 

  // Previous issue: setColorDomain would run inconsistently so setColor would happen without updated domain
  // Fixed through adding an effect for when Domain is fully changed
  useEffect(() =>{
    fetchSites();
    fetchMarkers();
  }, [colorDomain]);


  // FIXED:(IN LISTENER CALLING ALL minLat...maxLng was doing a segmented call just calling the last object to be set (MaxLng fixed auto loading prevention)) 
  useEffect(() => {
    fetchSites();
    fetchMarkers();

    //console.log(`LOGGING: ${selectedSites} \n ${startDate} \n ${endDate} \n ${minLat} \n ${minLng} \n ${maxLat} \n ${maxLng}`)
  }, [selectedSites, startDate, endDate,  maxLng]);

  function setColor(value: number) {
    const colorScale = d3.scaleLinear<string>().domain(colorDomain).range(colors);
    const max_val = colorDomain[colorDomain.length - 1];
    if (value <= max_val){
      return colorScale(value); // sets weight of color based on scale
    }
    else if(value > max_val)
      {
        return d3.color("darkred");
      }
    
      return d3.color("grey");
      
}

  const fetchSites = async () => {
    try {
      const params = new URLSearchParams();
      // Append the necessary parameters
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (
        minLat !== undefined &&
        minLng !== undefined &&
        maxLat !== undefined &&
        maxLng !== undefined
      ) {
        params.append("min_lat", minLat.toString());
        params.append("min_lng", minLng.toString());
        params.append("max_lat", maxLat.toString());
        params.append("max_lng", maxLng.toString());
      }

      const response = await fetch(
        `${API_BASE_URL}/maritimeapp/measurements/sites/?${params.toString()}`,
      );
      console.log(
        `${API_BASE_URL}/maritimeapp/measurements/sites/?${params.toString()}`,
      );
      const data: SiteSelect[] = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchMarkers = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (selectedSites)
        params.append(
          "sites",
          Array.from(selectedSites)
          .map((site) => site)
          .join(","),
        );
        if (
          minLat !== undefined &&
          minLng !== undefined &&
        maxLat !== undefined &&
      maxLng !== undefined
        ) {
          params.append("min_lat", minLat.toString());
          params.append("min_lng", minLng.toString());
          params.append("max_lat", maxLat.toString());
          params.append("max_lng", maxLng.toString());
        }
        if(type) params.append("reading", type);
        
        const response = await fetch(
          `${API_BASE_URL}/maritimeapp/measurements/?${params.toString()}`,
        );

        const clearMarkers = () => {
          map.eachLayer((layer: L.Layer) => {
            if (
              layer instanceof L.CircleMarker ||
              layer instanceof L.FeatureGroup
            ) {
              map.removeLayer(layer);
            }
          });
        };

        if (!response.ok) {
          clearMarkers();
          throw new Error("Network response was not ok");
        }

        const data: Marker[] = await response.json();

        // Clear exsting markers
        clearMarkers();

        // Create a group for each site
        const siteGroups: { [key: string]: L.FeatureGroup } = {};
        const sitePolylineGroups: { [key: string]: L.FeatureGroup } = {}; // To store polyline groups
        let lastClickTime: number | null = null;
        let lastClickedSite: string | null = null;

        // Add new markers
        data.forEach((markerData) => {
          const { latlng, value, date, site } = markerData;

          // Create or get the group for the site
          if (!siteGroups[site]) {
            siteGroups[site] = L.featureGroup().addTo(map);
            sitePolylineGroups[site] = L.featureGroup(); // Create a polyline group for the site
          }

          // Create the circle marker
          const cruiseMarker = L.circleMarker([latlng.lat, latlng.lng], {
            color: setColor(value),
            radius: 4,
            fillOpacity: 0.9,
            stroke: false,
            interactive: true,
            value: value,
            site: site,
            date: date,
            originalColor: setColor(value),
          }).addTo(siteGroups[site]);

          //  L.shapeMarker([latlng.lat, latlng.lng], {
          //  color: setColor(value),
          //  radius: 4,
          //  shape: "square",
          //  fillOpacity: 0.9,
          //  stroke: false,
          //  interactive: true,
          //  value: value,
          //  site: site,
          //  date: date,
          //  originalColor: setColor(value),
          //}).addTo(siteGroups[site]);

          // Bind click event to change opacity of markers in the same group
          cruiseMarker.on("click", () => {
            const currentTime = Date.now();
            // updateMarkerOpacity(siteGroups[site]);

            if (
              lastClickTime &&
              lastClickedSite === site &&
            currentTime - lastClickTime < 1000 // Time window to doule click to reset site view 
            ) {
              // Handle double-click
              clearMap();
              resetMarkerOpacity();
              lastClickTime = null;
              lastClickedSite = null;
            } else {
              // Handle single click
              updateMarkerOpacity(site);
              drawPolyline(site, data);
              lastClickTime = currentTime;
              lastClickedSite = site;
            }
          });
          cruiseMarker.on("mouseover", () => {
            cruiseMarker
            .bindPopup(
              `<b>Site:</b> ${cruiseMarker.options.site}<br>
              <b>${type}:</b> ${cruiseMarker.options.value.toFixed(3)}<br>
              <b>Date:</b> ${cruiseMarker.options.date}`,
            )
            .openPopup();
          });
          cruiseMarker.on("mouseout", () => {
            cruiseMarker.closePopup();
          });

          // Function to clear all polylines from the map
          const clearMap = () => {
            // Iterate over all layers in the map
            for (const i in map._layers) {
              // Check if the layer is a polyline
              if (
                map._layers[i] instanceof L.Polyline &&
                !(map._layers[i] instanceof L.Rectangle)
              ) {
                try {
                  // Remove the polyline layer from the map
                  map.removeLayer(map._layers[i]);
                } catch (e) {
                  console.log("Problem with " + e + map._layers[i]);
                }
              }
            }
          }; // Function to draw polyline from newest to oldest
          const resetMarkerOpacity = () => {
            map.eachLayer((layer: L.Layer) => {
              if (layer instanceof L.CircleMarker) {
                layer.setStyle({
                  color: layer.options.originalColor,
                  fillOpacity: 0.9,
                  radius: 4,
                  weight: 2,
                  opacity: 1,
                  interactive: true,
                });

                layer.on("mouseover", () => {
                  layer
                  .bindPopup(
                    `<b>Site:</b> ${layer.options.site}<br>
                    <b>${type}:</b> ${layer.options.value.toFixed(3)}<br>
                    <b>Date:</b> ${layer.options.date}`,
                  )
                  .openPopup();
                });

                layer.on("mouseout", () => {
                  layer.closePopup();
                });
              }
            });
          };
          const updateMarkerOpacity = (site: string) => {
            map.eachLayer((layer: L.Layer) => {
              if (layer.options.site !== undefined) {
                if (layer.options.site === site) {
                  // Restore the original color for markers in the clicked group
                  layer.setStyle({
                    shape: "square",
                    fillOpacity: 1,
                    color: layer.options.originalColor,
                    weight: 2,
                    radius: 8,
                    opacity: 1,
                    interactive: true,
                  });

                  layer.on("mouseover", () => {
                    layer
                    .bindPopup(
                      `<b>Site:</b> ${layer.options.site}<br>
                      <b>${type}:</b> ${layer.options.value.toFixed(3)}<br>
                      <b>Date:</b> ${layer.options.date}`,
                    )
                    .openPopup();
                  });
                  layer.on("mouseout", () => {
                    layer.closePopup();
                  });
                } else {
                  // Set color to grey for markers not in the clicked group
                  layer.setStyle({
                    shape: "square",
                    fillOpacity: 0.3,
                    color: "grey",
                    weight: 2,
                    radius: 4,
                    opacity: 0.3,
                    interactive: false,
                  });
                  layer.off("mouseover");
                  layer.off("mouseout");
                }
              }
            });
          };
          const drawPolyline = (site: string, markers: Marker[]) => {
            // Remove previous polyline if exists

            clearMap();
            const oldPolylineGroup = sitePolylineGroups[site];
            if (oldPolylineGroup) {
              oldPolylineGroup.eachLayer((layer: L.Layer) => {
                if (layer instanceof L.Polyline) {
                  oldPolylineGroup.removeLayer(layer);
                }
              });
              map.removeLayer(oldPolylineGroup);
              delete sitePolylineGroups[site]; // makes sure reference is also deleted
            }

            // Get markers for the selected site and sort them by date (newest to oldest)
            const siteMarkers = markers
            .filter((marker) => marker.site === site)
            .sort(
              (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
            );

            const latlngs = siteMarkers.map((marker) => [
              marker.latlng.lat,
              marker.latlng.lng,
            ]);

            // Define color scale
            const colorScale = d3
            .scaleLinear<string>()
            .domain([0, 1])
            .range(["rgb(255, 0, 0)", "rgb(0, 255, 0)"]);

            // Create a new polyline group
            const polylineGroup = L.featureGroup().addTo(map);

            // Draw polyline segments with color gradient
            latlngs.forEach((latlng, index) => {
              const nextLatLng = latlngs[index + 1];
              if (nextLatLng) {
                const fraction = index / latlngs.length;
                const color = colorScale(fraction);

                L.polyline([latlng, nextLatLng], {
                  weight: 3,
                  color: color,
                  opacity: 1,
                  interactive: false,
                }).addTo(polylineGroup);
              }
            });

            // Store the new polyline group
            sitePolylineGroups[site] = polylineGroup;
          };
        });
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };
  return React.cloneElement(children, {
    sites,
    selectedSites,
  });
};

export default SiteManager;
