
/* eslint-disable react/prop-types */

// eslint-disable-next-line no-unused-vars
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./FormScan.css";
import HistoryFinal from "../History/HistoryFinal";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";

function FormScanFinal() {
  const [barcode, setBarcode] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  const barcodeInputRef = useRef(null);
  const userIdInputRef = useRef(null);
  const historyFinalRef = useRef(null);
  const successTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const fetchDataFromStation = async (barcodeValue) => {
    const response = await axios.get(`${API_URL}/station`, {
      params: { barcode: barcodeValue },
    });

    return response.data.station78Data[0];
  };

  const handleBarcodeChange = (e) => {
    setBarcode(e.target.value);
    setSuccessMessage(false);
  };

  const handleBarcodeKeyPress = async (e) => {
    if (e.key !== "Enter" || loading) return;

    if (!barcode) {
      alert("Please input Barcode!");
      barcodeInputRef.current?.focus();
      return;
    }

    if (barcode.length !== 20) {
      alert("Invalid Barcode!");
      setBarcode("");
      barcodeInputRef.current?.focus();
      return;
    }

    if (!selectedOption) {
      alert("Please select Production Line.");
      return;
    }

    if (!userId) {
      alert("Please enter Work ID.");
      userIdInputRef.current?.focus();
      return;
    }

    if (barcode.charAt(12) !== selectedOption) {
      alert(
        "Barcode does not correspond to the selected Production Line."
      );
      setBarcode("");
      barcodeInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setSuccessMessage(false);

    try {
      const stationData = await fetchDataFromStation(barcode);

      const stationScanParts = [];

      if (stationData.oil_status === "OK") {
        stationScanParts.push("ChargeR600");
      }

      if (stationData.comp_status !== "0") {
        stationScanParts.push("Compressor");
      }

      if (stationData.cooling_status === "Qualified") {
        stationScanParts.push("CoolingTest");
      }

      if (stationData.safety_status !== "0") {
        stationScanParts.push("SafetyTest");
      }

      const data = {
        barcode,
        scantime: formatScanTime(new Date()),
        station_scan: stationScanParts.join(", "),
        userId,
      };

      await axios.post(`${API_URL}/SavedFinal`, data);

      // Refresh History after successful save
      historyFinalRef.current?.fetchData();

      setBarcode("");
      setSuccessMessage(true);

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(false);
      }, 2000);
    } catch (error) {
      console.error("Error processing barcode:", error);
      alert("Error saving data.");
    } finally {
      setLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
      barcodeInputRef.current?.focus();
    }
  };

  function formatScanTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  return (
    <div className="final-scan-page">
      <Navbar />

      {/* Floating success notification */}
      {successMessage && (
        <div
          className="scan-success-toast"
          role="status"
          aria-live="polite"
        >
          <span className="scan-success-icon">✓</span>
          <div>
            <strong>Scan Successful</strong>
            <p>Barcode saved successfully.</p>
          </div>
        </div>
      )}

      <main className="final-scan-content">
        <section className="scan-card">
          <div className="scan-card-header">
            <h1 className="scan-page-title">Final Barcode Scan</h1>

            <div className="scan-header-status" role="status" aria-live="polite">
              {loading ? (
                <span className="scan-loading">
                  <span className="scan-spinner" />
                  Processing...
                </span>
              ) : !selectedOption ? (
                <span className="scan-warning">
                  Select Production Line
                </span>
              ) : !userId ? (
                <span className="scan-warning">
                  Enter Work ID
                </span>
              ) : (
                <span className="scan-ready">
                  <span className="scan-status-dot" />
                  Ready to scan
                </span>
              )}
            </div>
          </div>

          <div className="scan-settings">
            <div className="scan-field">
              <label htmlFor="production-line">
                Production Line
              </label>

              <select
                id="production-line"
                value={selectedOption}
                onChange={(e) => {
                  setSelectedOption(e.target.value);
                  setBarcode("");
                  setSuccessMessage(false);
                }}
              >
                <option value="">Select line</option>
                <option value="A">RA</option>
                <option value="B">RB</option>
              </select>
            </div>

            <div className="scan-field">
              <label htmlFor="work-id">Work ID</label>

              <input
                id="work-id"
                ref={userIdInputRef}
                type="text"
                placeholder="Enter Work ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={handleUserIdKeyPress}
                autoComplete="off"
              />
            </div>

            <div className="barcode-section">
              <div className="barcode-label-row">
                <label htmlFor="final-barcode">Final Barcode</label>

                <span className="barcode-counter">
                  {barcode.length}/20
                </span>
              </div>

              <input
                id="final-barcode"
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={handleBarcodeChange}
                onKeyDown={handleBarcodeKeyPress}
                className="final-barcode-input"
                placeholder="Scan barcode and press Enter"
                autoFocus
                autoComplete="off"
                disabled={!userId || !selectedOption || loading}
                maxLength={20}
              />
            </div>
          </div>
        </section>

        <section className="scan-history-section">
          <HistoryFinal
            ref={historyFinalRef}
            selectedOption={selectedOption}
          />
        </section>
      </main>
    </div>
  );
}

export default FormScanFinal;
