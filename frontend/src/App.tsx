import React, { useEffect } from "react";
import MapComponent from "./components/MapComponent";
import SidePanel from "./components/SidePanel";
import { MapProvider } from "./components/MapContext";
import { SiteProvider } from "./components/SiteContext";
import "./App.css";

const App: React.FC = () => {
  const center: [number, number] = [0, 0];
  const zoom = 2;

  return (
    <SiteProvider>
      <MapProvider>
        <div className="App" style={{ display: "flex" }}>
          <MapComponent center={center} zoom={zoom} type={"aod_500nm"} />
          <SidePanel />
        </div>
      </MapProvider>
    </SiteProvider>
  );
};

export default App;
