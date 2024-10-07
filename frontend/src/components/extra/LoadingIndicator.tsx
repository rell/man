import React from "react";
import "./LoadingIndicator.css"; // Ensure you create and style this CSS file

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
