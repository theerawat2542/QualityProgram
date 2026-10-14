/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useRef } from "react";
import axios from "axios";
import "./FormScanMaterial.css";
import History from "../History/History";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";

function FormScan() {
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [compressorBarcode, setCompressorBarcode] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  const materialInputRef = useRef(null);
  const compressorInputRef = useRef(null);
  const userIdInputRef = useRef(null);

  const handleSubmit = async () => {
    if (!materialBarcode) {
      alert("Please input Material Barcode.");
      materialInputRef.current?.focus();
      return;
    }

    if (!compressorBarcode) {
      alert("Please input Compressor Barcode.");
      compressorInputRef.current?.focus();
      return;
    }

    try {
      const newScantime = formatScanTime(new Date());

      const data = {
        materialBarcode: materialBarcode,
        compressorBarcode: compressorBarcode,
        scanTime: newScantime,
        userId: userId,
      };

      await axios.post(`${API_URL}/Saved`, data);

      console.log("Data sent successfully!");

      setSuccessMessage("OK");
      setMaterialBarcode("");
      setCompressorBarcode("");

      // คงพฤติกรรมเดิม: โฟกัสกลับไปที่ Compressor Barcode
      compressorInputRef.current?.focus();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Error sending data.");
    }
  };

  const handleMaterialBarcodeKeyPress = (e) => {
    if (e.key !== "Enter") return;

    if (materialBarcode.length === 0) {
      alert("Please input Material Barcode!");
      return;
    }

    if (materialBarcode.length !== 20) {
      alert("Invalid Barcode!");
      setMaterialBarcode("");
      return;
    }

    if (materialBarcode.charAt(12) !== selectedOption) {
      alert(
        "Barcode does not correspond to the selected Production Line."
      );
      setMaterialBarcode("");
      materialInputRef.current?.focus();
      return;
    }

    handleSubmit();
  };

  const handleCompressorBarcodeKeyPress = (e) => {
    if (e.key !== "Enter") return;

    if (compressorBarcode.length === 0) {
      alert("Please input Compressor Barcode!");
      return;
    }

    if (!selectedOption) {
      alert("Please select Production Line.");
      return;
    }

    // เมื่อกด Enter ให้ไปช่อง Material Barcode
    materialInputRef.current?.focus();
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
      compressorInputRef.current?.focus();
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

  const isReady = Boolean(userId && selectedOption);

  return (
    <div className="material-scan-app">
      <Navbar />

      <main className="material-scan-page">
        <div className="material-scan-content">
          <section className="material-scan-card">
            {/* Header */}
            <div className="material-scan-card-header">
              <div>
                <h2 className="material-scan-page-title">
                  Material & Compressor Scan
                </h2>
              </div>

              <div
                className={`material-scan-header-status ${
                  isReady ? "is-ready" : "is-warning"
                }`}
              >
                <span className="material-scan-status-dot" />
                {isReady ? "Ready to Scan" : "Setup Required"}
              </div>
            </div>

            {/* Production Line and Work ID */}
            <div className="material-scan-settings">
              <div className="material-scan-field">
                <label htmlFor="material-production-line">
                  Production Line
                </label>

                <select
                  id="material-production-line"
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                >
                  <option value="">Select Production Line</option>
                  <option value="A">RA</option>
                  <option value="B">RB</option>
                </select>
              </div>

              <div className="material-scan-field">
                <label htmlFor="material-work-id">Work ID</label>

                <input
                  id="material-work-id"
                  ref={userIdInputRef}
                  type="text"
                  placeholder="Enter Work ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={handleUserIdKeyPress}
                />
              </div>
            </div>

            {/* Setup warnings */}
            {/* {!isReady && (
              <div className="material-scan-warning">
                {!userId && (
                  <span>Please Input Work ID.</span>
                )}

                {!selectedOption && (
                  <span>Please Select Production Line.</span>
                )}
              </div>
            )} */}

            {/* Barcode inputs */}
            <div className="material-scan-barcode-grid">
              <div className="material-scan-field">
                <div className="material-scan-label-row">
                  <label htmlFor="compressor-barcode">
                    Compressor Barcode
                  </label>
                  <span className="material-scan-step">STEP 1</span>
                </div>

                <input
                  id="compressor-barcode"
                  ref={compressorInputRef}
                  type="text"
                  value={compressorBarcode}
                  onChange={(e) => setCompressorBarcode(e.target.value)}
                  onKeyDown={handleCompressorBarcodeKeyPress}
                  disabled={!userId || !selectedOption}
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                  placeholder="Scan Compressor Barcode"
                  className="material-scan-barcode-input"
                />

                {/* <div className="material-scan-input-hint">
                  Scan the compressor barcode, then press Enter.
                </div> */}
              </div>

              <div className="material-scan-field">
                <div className="material-scan-label-row">
                  <label htmlFor="material-barcode">
                    Material Barcode
                  </label>
                  <span className="material-scan-step">STEP 2</span>
                </div>

                <input
                  id="material-barcode"
                  ref={materialInputRef}
                  type="text"
                  value={materialBarcode}
                  onChange={(e) => setMaterialBarcode(e.target.value)}
                  onKeyDown={handleMaterialBarcodeKeyPress}
                  disabled={!userId || !selectedOption}
                  maxLength={20}
                  autoComplete="off"
                  placeholder="Scan Material Barcode"
                  className="material-scan-barcode-input"
                />

                {/* <div className="material-scan-input-hint">
                  Scan the material barcode, then press Enter to save.
                </div> */}
              </div>
            </div>
          </section>

          {/* Scan success message */}
          {successMessage && (
            <div
              className="material-scan-success-toast"
              role="status"
              aria-live="polite"
            >
              <span className="material-scan-success-icon">✓</span>
              <div>
                <strong>Scan Successful</strong>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* History */}
          <section className="material-scan-history">
            <History selectedOption={selectedOption} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default FormScan;