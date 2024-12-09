import React, { useRef, useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const CustomControls: React.FC = () => {
  const map = useMap();

  const attributionControlRef = useRef<L.Control | null>(null);
  const githubControlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!attributionControlRef.current) {
      const attributionControl = L.control
        .attribution({ position: "bottomright" })
        .addAttribution(
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        )
        .setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
      attributionControl.addTo(map);
      attributionControlRef.current = attributionControl; 
    }    
    if (!githubControlRef.current) {
      const githubControl = L.control({ position: "bottomright" });
      githubControl.onAdd = () => {
        const div = L.DomUtil.create("div", "github-link");
        div.innerHTML = `
          <a href="https://github.com/rell/man" target="_blank" style="display: flex; align-items: center; background: rgba(255, 255, 255, 0.7); padding: 5px; border-radius: 0px;">
            <img src="https://www.openmoji.org/data/color/svg/1F6DF.svg" alt="GitHub" style="width: auto; height: 20px; margin-right: 8px;">
            <strong>Github Repository</strong>
          </a>
        `;
        div.style.marginBottom = "5px";
        div.style.marginRight = "0px";
        return div;
      };
      githubControl.addTo(map);
      githubControlRef.current = githubControl;
    }
    return () => {
      if (githubControlRef.current) {
        map.removeControl(githubControlRef.current);
      }
      if (attributionControlRef.current) {
        map.removeControl(attributionControlRef.current);
      }
    };
  }, [map]);

  return null;
};

export default CustomControls;

