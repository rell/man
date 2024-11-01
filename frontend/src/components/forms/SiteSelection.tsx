import React, { useState, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import "./SiteSelection.css";

export interface SiteSelect {
  name: string;
  span_date: [string, string] | null;
}

interface SiteSelectionFormProps {
  sites: SiteSelect[];
  selectedSites: Set<string>;
  onSelectionChange: (selectedSites: Set<string>, type: string) => void;
  onDateChange: (startDate: string, endDate: string) => void;
  bounds?: [number, number, number, number];
}

const SiteSelectionForm: React.FC<SiteSelectionFormProps> = ({
  sites,
  selectedSites: parentSelectedSites,
  onSelectionChange,
  onDateChange,
  bounds,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());

  const minStartDate = "2004-10-16";
  const today = new Date().toISOString().split("T")[0];
  // storing state with default values to localStorage
  useEffect(() => {
    const savedStartDate = localStorage.getItem("startDate") || minStartDate;
    const savedEndDate = localStorage.getItem("endDate") || today;
    setStartDate(savedStartDate);
    setEndDate(savedEndDate);
  }, [minStartDate, today]);

  // Sync selectedSites with props
  useEffect(() => {
    setSelectedSites(new Set(parentSelectedSites));
  }, [parentSelectedSites]);

  useEffect(() => {
    if (sites.length === 0) return;
    // convert the sites array to a Set of site names
    const sitesSet = new Set(sites.map((site) => site.name));

    // Set of selected sites that are in the sitesSet
    const updatedSelectedSites = new Set<string>(
      [...selectedSites].filter((siteName) => sitesSet.has(siteName)),
    );

    // Updates the state with the filtered set
    setSelectedSites(updatedSelectedSites);
  }, [bounds, startDate, endDate]);

  // store start and end date to localStorage
  useEffect(() => {
    onDateChange(startDate, endDate);
    localStorage.setItem("startDate", startDate);
    localStorage.setItem("endDate", endDate);
  }, [startDate, endDate]);

  // remove the dates from localStorage
  const clearDates = () => {
    setStartDate(minStartDate);
    setEndDate(today);
    localStorage.removeItem("startDate");
    localStorage.removeItem("endDate");
    onDateChange(minStartDate, today);
  };

  // store selected sites to localStorage
  const saveData = () => {
    localStorage.setItem("Data", JSON.stringify(Array.from(selectedSites)));
  };

  // load selected sites from localStorage
  const loadData = () => {
    const data = localStorage.getItem("Data");
    if (data) {
      const parsedData = JSON.parse(data);
      onSelectionChange(new Set(parsedData), "load");
    }
  };

  // Handle site queries
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle date changes

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    if (newStartDate >= minStartDate) {
      setStartDate(newStartDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (newEndDate >= startDate && newEndDate <= today) {
      setEndDate(newEndDate);
    }
  };

  // -----------

  // Filter sites based on search query
  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle site selection
  const selectSite = (siteName: string) => {
    const updatedSelection = new Set(selectedSites);
    const type = updatedSelection.has(siteName) ? "remove" : "add";

    if (updatedSelection.has(siteName)) {
      updatedSelection.delete(siteName);
    } else {
      updatedSelection.add(siteName);
    }

    setSelectedSites(updatedSelection);
    onSelectionChange(updatedSelection, type);
    saveData();
  };

  // Handle select all given a filtered or non filtered set of sites
  const selectAllFilteredSites = () => {
    const updatedSelection = new Set(selectedSites);
    filteredSites.forEach((site) => updatedSelection.add(site.name));
    setSelectedSites(updatedSelection);
    onSelectionChange(updatedSelection, "add");
  };

  // Handle deselect all given a filtered or non filtered set of sites
  const deselectAllFilteredSites = () => {
    const updatedSelection = new Set(selectedSites);
    filteredSites.forEach((site) => updatedSelection.delete(site.name));
    setSelectedSites(updatedSelection);
    onSelectionChange(updatedSelection, "remove");
  };

  // Build rows for cruise selection
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const site = filteredSites[index];
    return (
      <div
        key={site.name}
        className={`site-list-item row ${
          selectedSites.has(site.name) ? "selected" : ""
        }`}
        onClick={() => selectSite(site.name)}
        style={style}
      >
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>{site.name}</div>
          {site.span_date && (
            <div className="fw-bold small text-end">
              {`${site.span_date[0]} - ${site.span_date[1]}`}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="site-selection-container">
      <input
        type="text"
        placeholder="Search for cruises..."
        value={searchQuery}
        onChange={handleSearchChange}
      />
      <div className="date-range-container">
        <input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={handleStartDateChange}
          min={minStartDate}
          max={today}
        />
        <input
          type="date"
          placeholder="End Date"
          value={endDate}
          onChange={handleEndDateChange}
          min={startDate}
          max={today}
        />
      </div>
      <button onClick={clearDates} className="btn btn-secondary clear-date-btn">
        Clear Date
      </button>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="w-50">
          <button
            onClick={selectAllFilteredSites}
            className="btn btn-primary w-100"
          >
            Select All
          </button>
        </div>
        {/* Dynamic gap between boundry buttons */}
        <div style={{ width: "2%" }}></div>
        <div className="w-50">
          <button
            onClick={deselectAllFilteredSites}
            className="btn btn-danger w-100"
          >
            Unselect All
          </button>
        </div>
      </div>
      {filteredSites.length > 0 ? (
        <List
          height={400}
          itemCount={filteredSites.length}
          itemSize={35}
          width="100%"
        >
          {Row}
        </List>
      ) : (
        <div>No Results Found, try a different input.</div>
      )}
    </div>
  );
};

export default SiteSelectionForm;
