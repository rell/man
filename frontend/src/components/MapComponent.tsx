import React from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Container } from "react-bootstrap";
import styles from "./MapComponent.module.css";
import { useMapContext } from "./MapContext";
import * as d3 from "d3";

interface MapComponentProps {
  center: [number, number];
  zoom: number;
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

export function createColorLegend() {
  const colorScale = setMarkerColorScale();
  const colorLegend = L.control({ position: "bottomleft" });

  colorLegend.onAdd = function (map: L.Map) {
    const div = L.DomUtil.create("div", "legend");

    // TODO: Interface with sidebar to dynmanically change when Display Data modal is modified
    const readText = L.DomUtil.create("div", "", div);
    readText.innerHTML = `<strong>Data Preview:</strong> AOD 500nm`;
    readText.style.textAlign = "center";
    readText.style.marginBottom = "10px";
    readText.style.fontSize = "14px";

    // Create and append colorBar div
    const colorBar = L.DomUtil.create("div", "", div);
    colorBar.id = "colorBar";
    colorBar.style.backgroundImage = `linear-gradient(to right, ${colorScale(0)}, ${colorScale(1 / 6)}, ${colorScale((1 / 6) * 2)}, ${colorScale((1 / 6) * 3)}, ${colorScale((1 / 6) * 4)}, ${colorScale((1 / 6) * 5)}, ${colorScale(1)})`;
    colorBar.style.width = "${310-20}px";
    colorBar.style.height = "10px";
    colorBar.style.position = "relative";

    // Add triangles outside the colorBar
    const leftTriangle = L.DomUtil.create("div", "", div);
    leftTriangle.style.position = "absolute";
    leftTriangle.style.top = "46px";
    leftTriangle.style.left = `${10}px`;
    leftTriangle.style.width = "0";
    leftTriangle.style.height = "10px";
    leftTriangle.style.borderTop = "5px solid transparent";
    leftTriangle.style.borderBottom = "5px solid transparent";
    leftTriangle.style.borderRight = "5px solid grey";

    const rightTriangle = L.DomUtil.create("div", "", div);
    rightTriangle.style.position = "absolute";
    rightTriangle.style.top = "46px";
    rightTriangle.style.right = `${10}px`;
    rightTriangle.style.width = "0";
    rightTriangle.style.height = "0";
    rightTriangle.style.borderTop = "5px solid transparent";
    rightTriangle.style.borderBottom = "5px solid transparent";
    rightTriangle.style.borderLeft = "5px solid darkred";

    // Create and append legendMarker div
    const legendMarker = L.DomUtil.create("div", "", div);
    legendMarker.id = "legendMarker";
    legendMarker.style.width = "300px";
    legendMarker.style.textAlign = "center";
    legendMarker.style.fontSize = "10px";
    legendMarker.style.position = "relative";
    legendMarker.style.marginTop = "5px";
    legendMarker.style.padding = "0 20px";

    // Add labels for each tick mark
    for (let i = 0; i <= 6; i++) {
      const value = (i / 6).toFixed(1);
      const p = L.DomUtil.create("p", "", legendMarker);
      p.innerText = value;
      p.style.display = "inline-block";
      p.style.width = `${(i / 6) * 100}%`;
      p.style.textAlign = "center";
      p.style.position = "absolute";
      p.style.left = `${(i / 6) * 100}%`;
      p.style.transform = "translateX(-50%)";
      p.style.marginBottom = "10px";
      p.style.fontSize = "0.9em";
    }

    // Create line indicating the color scale from blue to red
    const gradientLine = L.DomUtil.create("div", "", div);
    gradientLine.style.backgroundImage = `linear-gradient(to right, rgb(0, 255, 0), rgb(255, 0, 0))`;
    gradientLine.style.width = "310px";
    gradientLine.style.height = "10px";
    gradientLine.style.marginTop = "25px";

    // Add labels for the start and end of the gradient line
    const labels = L.DomUtil.create("div", "", div);
    labels.style.display = "flex";
    labels.style.justifyContent = "space-between";
    labels.style.width = "310px";
    labels.style.marginTop = "5px";
    labels.innerHTML = `<span>Start</span><span>End</span>`;

    div.style.padding = "15px";
    div.style.backgroundColor = "rgba(255,255,255,0.7)";
    div.style.borderRadius = "5px";
    div.style.fontSize = "0.8em";
    div.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.5)";
    div.style.textAlign = "center";

    return div;
  };

  return colorLegend;
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
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
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
      "https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.{ext}",
      {
        noWrap: true,
        minZoom: 0,
        maxZoom: 20,
        ext: "png",
      },
    );

    map.addLayer(basemapLayer);
    // map.addLayer(references);

    createColorLegend().addTo(map);

    map.setMinZoom(1);
    map.setMaxZoom(19);
    map.setMaxBounds([
      [-400, -400],
      [400, 400],
    ]);

    // Project control
    const githubControl = L.control({ position: "bottomright" });
    githubControl.onAdd = () => {
      const div = L.DomUtil.create("div", "github-link");
      div.innerHTML = `
    <a href="https://github.com/rell/man" target="_blank" style="display: flex; align-items: center; background: rgba(255, 255, 255, 0.7); padding: 5px; border-radius: 0px;">
      <img src="https://github.githubassets.com/assets/GitHub-Logo-ee398b662d42.png" alt="GitHub" style="width: auto; height: 10px; margin-right: 8px;">
    
      <img src="https://camo.githubusercontent.com/e569686d6182fa7259dcb392e42e16d2e336b408f34362a3bea6d13c8fdc0337/68747470733a2f2f7a656e6f646f2e6f72672f7265636f72642f373734323939372f66696c65732f546f70735f42616467655f4e6173612e706e67" alt="TOPS" style="width: auto; height: 20px; margin-right: 8px;"/>
      <strong>MAN PROJECT</strong>
    </a>
  `;
      div.style.marginBottom = "5px";
      div.style.marginRight = "0px";
      return div;
    };

    const attributionControl = L.control
      .attribution({ position: "bottomright" })
      .addAttribution("© NASA GIBS EOSDIS")
      .setPrefix('<a href="https://leafletjs.com/">Leaflet</a>')
      .addTo(map);

    githubControl.addTo(map);
    setMap(map);

    return () => {
      map.removeLayer(basemapLayer);
      // map.removeLayer(references);
      removeAllControls();
    };
  }, [map, setMap]);

  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom }) => {
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
