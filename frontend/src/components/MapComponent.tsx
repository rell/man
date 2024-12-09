import React from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Container } from "react-bootstrap";
import styles from "./MapComponent.module.css";
import { useMapContext } from "./MapContext";
import * as d3 from "d3";
import ColorLegend from './colorScale';
import CustomControls from "./CustomControls";

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  type: string;
}


const CustomMapLayer: React.FC = () => {
  const map = useMap();
  const { setMap } = useMapContext();

  React.useEffect(() => {
    if (!map) return;

    // Function to remove all controls from the map
    const removeAllControls = () => {
      map.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Control) {
          map.removeControl(layer);
        }
      });
    };

    const basemapUrl =
      //"https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
      "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png";
    const basemapLayer = L.tileLayer.wms(basemapUrl, {
      layers: "BlueMarble_NextGeneration",
      format: "image/png",
      crs: L.CRS.EPSG4326,
      opacity: 1.0,
      backgroundColor: "transparent",
      noWrap: true,
      tileSize: 256,
      errorTileUrl: "",
      errorTileTimeout: 5000,
      maxZoom: 20,
      // attribution: "© OpenStreetMap",
    });

    var references = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      {
        noWrap: true,
        minZoom: 0,
        maxZoom: 20,
        subdomains: "abcd",
      },
    );

    map.addLayer(basemapLayer);
    map.addLayer(references);
    //createColorLegend().addTo(map);

    map.setMinZoom(1);
    map.setMaxZoom(19);
    map.setMaxBounds([
      [-90, -180], 
      [90, 180]    
    ]);

    setMap(map);

    return () => {
      map.removeLayer(basemapLayer);
       map.removeLayer(references);
      removeAllControls();
    };
  }, [map, setMap]);

  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom, type }) => {
  return (
    <Container fluid style={{ padding: "0" }} className={styles.mapContainer}>
      <MapContainer
        // @ts-ignore
        center={center}
        zoom={zoom}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >

        <CustomControls /> 
        <CustomMapLayer />
      </MapContainer>
    </Container>
  );
};
export default MapComponent;
