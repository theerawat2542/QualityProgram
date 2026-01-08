/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import "./Station.css";
import Navbar from "../Navbar/Navbar";
import ButtonStatus from "../Station/Station_Barcode";

const Station = () => {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Barcode submitted:", barcode);
  };

  return (
    <>
      <Navbar />
      <div className="station-wrapper">
        <div className="station-card">
          <h2 className="station-title">🏭 Station Tracking</h2>
          <p className="station-subtitle">
            Scan or enter barcode to track production process
          </p>

          <form onSubmit={handleSubmit} className="station-form">
            <label className="station-label">Barcode</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan barcode here..."
              className="station-input"
              autoFocus
            />
          </form>
        </div>

        <div className="station-content">
          <ButtonStatus barcode={barcode} />
        </div>
      </div>
    </>
  );
};

export default Station;
