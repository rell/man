import React from "react";
import "./LoadingIndicator.css"; 

const LoadingIndicator: React.FC = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">
        Processing your custom maritime aerosol dataset request.
        <br />
        Please Wait...
      </div>
    </div>
  );
};

export default LoadingIndicator;
