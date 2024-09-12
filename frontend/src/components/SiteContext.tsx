import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import L from "leaflet";
import API_BASE_URL from "../config";

interface Site {
  name: string;
  span_date: string;
}

interface SiteContextType {
  sites: Site[];
  refreshSites: () => void;
  setFilters: (startDate: string, endDate: string) => void;
  setBounds: (bounds: L.LatLngBounds | null) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

interface SiteProviderProps {
  children: ReactNode;
}

export const SiteProvider: React.FC<SiteProviderProps> = ({ children }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [bounds, setBoundsState] = useState<L.LatLngBounds | null>(null);

  const fetchSites = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (bounds) {
        params.append("bbox", bounds.toBBoxString());
      }

      const response = await fetch(
        `${API_BASE_URL}/maritimeapp/measurements/sites/?${params.toString()}`,
      );
      const data: Site[] = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  }, [startDate, endDate, bounds]);

  const refreshSites = useCallback(() => {
    fetchSites();
  }, [fetchSites]);

  const setFilters = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    refreshSites();
  };

  const setBounds = (newBounds: L.LatLngBounds | null) => {
    setBoundsState(newBounds);
    refreshSites();
  };

  return (
    <SiteContext.Provider
      value={{ sites, refreshSites, setFilters, setBounds }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteContext = (): SiteContextType => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error("useSiteContext must be used within a SiteProvider");
  }
  return context;
};
