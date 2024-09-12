// For react to recognize leaflet as a module
declare module "leaflet" {
  import * as L from "leaflet";
  export = L;
}
