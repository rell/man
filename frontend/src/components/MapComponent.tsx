import React from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Container } from "react-bootstrap";
import styles from "./MapComponent.module.css";
import { useMapContext } from "./MapContext";
import * as d3 from "d3";
import ColorLegend from './colorScale';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  type: string;
}

function setMarkerColorScale() {
  const colors = [
    "blue",
    "teal",
    "green",
    "chartreuse",
    "yellow",
    "orange",
    "red",
  ];

  const scale = d3
    .scaleLinear<string>()
    .domain([0, 1 / 6, (1 / 6) * 2, (1 / 6) * 3, (1 / 6) * 4, (1 / 6) * 5, 1])
    .range(colors);

  return scale;
}

function setPolylineColorScale() {
  const colors = ["green", "red"];
  const scale = d3.scaleLinear<string>().domain([0, 1]).range(colors);
  return scale;
}

function setColor(value: number, type: string) {
  if (type === "marker") {
    const markerScale = setMarkerColorScale();
    if (value <= 1) {
      return markerScale(value);
    } else {
      return "darkred";
    }
  } else if (type === "polyline") {
    const polylineScale = setPolylineColorScale();
    if (value <= 1) {
      return polylineScale(value);
    } else {
      return "red";
    }
  } else {
    return "grey";
  }
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

    // Project control
    const githubControl = L.control({ position: "bottomright" });
    githubControl.onAdd = () => {
      const div = L.DomUtil.create("div", "github-link");
      div.innerHTML = `
    <a href="https://github.com/rell/man" target="_blank" style="display: flex; align-items: center; background: rgba(255, 255, 255, 0.7); padding: 5px; border-radius: 0px;">
      <img src="https://www.openmoji.org/data/color/svg/1F6DF.svg" alt="GitHub" style="width: auto; height: 20px; margin-right: 8px;">
    
      <!-- <img src="https://camo.githubusercontent.com/e569686d6182fa7259dcb392e42e16d2e336b408f34362a3bea6d13c8fdc0337/68747470733a2f2f7a656e6f646f2e6f72672f7265636f72642f373734323939372f66696c65732f546f70735f42616467655f4e6173612e706e67" alt="TOPS" style="width: auto; height: 25px; margin-right: 8px;"/> -->
      <strong>Open Source</strong>
    </a>
  `;
      div.style.marginBottom = "5px";
      div.style.marginRight = "0px";
      return div;
    };

    const attributionControl = L.control
      .attribution({position: "bottomright"})
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>')
      .setPrefix('<a href="https://leafletjs.com/">Leaflet</a>')
      .addTo(map);

    githubControl.addTo(map);
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
        <CustomMapLayer />
      </MapContainer>
    </Container>
  );
};

export default MapComponent;
