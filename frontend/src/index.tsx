import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet/dist/leaflet.css";
<<<<<<< HEAD
import React from "react";
import ReactDOM from "react-dom/client"; 
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
=======
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
>>>>>>> ee75fc9 (init)
