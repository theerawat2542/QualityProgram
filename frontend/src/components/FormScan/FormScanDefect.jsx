/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./FormScanDefect.css";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";
import HistoryDefect from "../History/HistoryDefect";

function FormScan() {
  const [defectBarcode, setDefectBarcode] = useState("");
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const defectInputRef = useRef(null);
  const materialInputRef = useRef(null);
  const userIdInputRef = useRef(null);

  const [usedDefectBarcodes, setUsedDefectBarcodes] = useState(new Set());
  const [usedCombinations, setUsedCombinations] = useState(new Set());

  const isReady = Boolean(userId.trim() && selectedOption);

  // Format วันที่และเวลา
  function formatScanTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // ตรวจสอบการเชื่อมต่อ Backend
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get(`${API_URL}/test-connection`);
        console.log("Backend connected:", response.data);
      } catch (error) {
        console.error("Backend not ready:", error.message);
      }
    };

    testConnection();
  }, []);

  // เปลี่ยน Production Line
  const handleProductionLineChange = (e) => {
    setSelectedOption(e.target.value);
    setMaterialBarcode("");
    setDefectBarcode("");
    setErrorMessage("");
    setSuccessMessage(null);
    setUsedDefectBarcodes(new Set());
    setUsedCombinations(new Set());
  };

  // กด Enter ในช่อง Work ID
  const handleUserIdKeyPress = (e) => {
    if (e.key !== "Enter") return;

    if (!userId.trim()) {
      alert("Please input Work ID.");
      userIdInputRef.current?.focus();
      return;
    }

    if (!selectedOption) {
      alert("Please select Production Line.");
      return;
    }

    materialInputRef.current?.focus();
  };

  // กด Enter ในช่อง Material Barcode
  const handleMaterialBarcodeKeyPress = (e) => {
    if (e.key !== "Enter") return;

    // รองรับกรณีสแกน Material Barcode ลงช่อง Defect
    if (defectBarcode.length === 28) {
      setMaterialBarcode(defectBarcode);
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    if (!userId.trim()) {
      alert("Please input Work ID.");
      userIdInputRef.current?.focus();
      return;
    }

    if (!selectedOption) {
      alert("Please select Production Line.");
      return;
    }

    if (!materialBarcode) {
      alert("Please input Material Barcode!");
      materialInputRef.current?.focus();
      return;
    }

    if (materialBarcode.length !== 28) {
      alert("Material Barcode must be 28 characters!");
      setMaterialBarcode("");
      materialInputRef.current?.focus();
      return;
    }

    // เริ่มชุดการสแกนใหม่
    setUsedDefectBarcodes(new Set());
    setUsedCombinations(new Set());
    setErrorMessage("");

    console.log("----------------------------------------");
    console.log("Production Line:", selectedOption);
    console.log("Material Barcode:", materialBarcode);
    console.log("Date/Time:", formatScanTime(new Date()));
    console.log("Scan By:", userId);
    console.log("----------------------------------------");

    defectInputRef.current?.focus();
  };

  // กด Enter ในช่อง Defect Barcode
  const handleDefectBarcodeKeyPress = async (e) => {
    if (e.key !== "Enter") return;

    setErrorMessage("");

    if (!userId.trim()) {
      setErrorMessage("Please input Work ID.");
      userIdInputRef.current?.focus();
      return;
    }

    if (!selectedOption) {
      setErrorMessage("Please select Production Line.");
      return;
    }

    if (!materialBarcode) {
      setErrorMessage("Please scan Material Barcode first.");
      materialInputRef.current?.focus();
      return;
    }

    // รองรับกรณีสแกน Material Barcode ลงช่อง Defect
    if (defectBarcode.length === 28) {
      setMaterialBarcode(defectBarcode);
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    if (!defectBarcode) {
      setErrorMessage("Please input Defect Barcode.");
      defectInputRef.current?.focus();
      return;
    }

    // ตรวจสอบความยาว Barcode
    if (defectBarcode.length !== 15) {
      setErrorMessage(
        "Invalid barcode length! Must be 15 characters (reason|location)."
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    // ตรวจสอบเครื่องหมาย | ที่ตำแหน่งที่ 8
    if (defectBarcode[7] !== "|") {
      setErrorMessage(
        'Invalid Defect Barcode format! Character 8 must be "|".'
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    const [reasonCode, locationCode] = defectBarcode.split("|");

    // ตรวจสอบความยาว Reason และ Location
    if (
      !reasonCode ||
      !locationCode ||
      reasonCode.length !== 7 ||
      locationCode.length !== 7
    ) {
      setErrorMessage(
        "Both Reason and Location codes must be 7 characters."
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    // ตรวจสอบตัวอักษรตำแหน่งที่ 3 ของ Reason Code
    if (reasonCode[2] !== "F") {
      setErrorMessage(
        "Invalid Reason Code! The third character must be 'F'."
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    // ตรวจสอบว่าเป็นตัวอักษรและตัวเลขเท่านั้น
    const alphanumericRegex = /^[0-9A-Za-z]+$/;

    if (
      !alphanumericRegex.test(reasonCode) ||
      !alphanumericRegex.test(locationCode)
    ) {
      setErrorMessage(
        "Both codes must contain only letters and numbers."
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    const combinationKey = `${reasonCode}|${locationCode}`;

    // ป้องกัน Reason + Location ซ้ำ
    if (usedCombinations.has(combinationKey)) {
      setErrorMessage(
        "This exact Reason-Location combination has already been used!"
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    // ป้องกัน Defect Barcode ซ้ำ
    if (usedDefectBarcodes.has(defectBarcode)) {
      setErrorMessage(
        "This Defect Barcode has already been used for the current Material Barcode!"
      );
      setDefectBarcode("");
      defectInputRef.current?.focus();
      return;
    }

    const currentDefectBarcode = defectBarcode;
    const newScantime = formatScanTime(new Date());

    const data = {
      materialBarcode,
      defectBarcode: currentDefectBarcode,
      scanTime: newScantime,
      userId,
      productionLine: selectedOption,
    };

    try {
      console.log("API URL:", API_URL);
      console.log("Sending data to server:", data);

      const response = await axios.post(
        `${API_URL}/SavedDefect`,
        data,
        {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Server response:", response.data);

      // แสดง Toast เมื่อสแกนสำเร็จ
      setSuccessMessage("OK");

      setUsedCombinations(
        (prev) => new Set([...prev, combinationKey])
      );

      setUsedDefectBarcodes(
        (prev) => new Set([...prev, currentDefectBarcode])
      );

      // ซ่อน Toast หลัง 2 วินาที
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Error sending defect data:", error);

      if (error.code === "ECONNABORTED") {
        setErrorMessage("Connection timeout - Please try again.");
      } else if (!error.response) {
        setErrorMessage(
          "Network error - Please check server connection."
        );
      } else {
        const serverMessage =
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message || error.message;

        setErrorMessage(`Error: ${serverMessage}`);
      }
    }

    // ล้างช่องหลังประมวลผลตามพฤติกรรมเดิม
    setMaterialBarcode("");
    setDefectBarcode("");
    materialInputRef.current?.focus();
  };

  return (
    <div className="defect-scan-app">
      <Navbar />

      {/* Toast แจ้งเตือนเมื่อสแกนสำเร็จ */}
      {successMessage && (
        <div
          className="defect-scan-toast"
          role="status"
          aria-live="polite"
        >
          <span className="defect-scan-toast-icon">✓</span>

          <div>
            <div className="defect-scan-toast-title">
              Scan Successful
            </div>

            <div className="defect-scan-toast-message">
              {successMessage}
            </div>
          </div>
        </div>
      )}

      <main className="defect-scan-page">
        <div className="defect-scan-content">
          <section className="defect-scan-card">
            {/* Header */}
            <div className="defect-scan-card-header">
              <h2>Defect Barcode Scan</h2>

              <span
                className={`defect-scan-header-status ${
                  isReady ? "is-ready" : "is-warning"
                }`}
              >
                <span className="defect-scan-status-dot" />
                {isReady ? "Ready to Scan" : "Setup Required"}
              </span>
            </div>

            {/* Production Line และ Work ID */}
            <div className="defect-scan-settings">
              <div className="defect-scan-field">
                <label htmlFor="defect-production-line">
                  Production Line
                </label>

                <select
                  id="defect-production-line"
                  value={selectedOption}
                  onChange={handleProductionLineChange}
                >
                  <option value="">Select Line</option>
                  <option value="RA">RA</option>
                  <option value="RB">RB</option>
                </select>
              </div>

              <div className="defect-scan-field">
                <label htmlFor="defect-work-id">Work ID</label>

                <input
                  id="defect-work-id"
                  ref={userIdInputRef}
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={handleUserIdKeyPress}
                  placeholder="Enter Work ID"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Barcode Inputs */}
            <div className="defect-scan-barcode-grid">
              <div className="defect-scan-field">
                <label htmlFor="defect-material-barcode">
                  Material Barcode
                  <span>STEP 1</span>
                </label>

                <input
                  id="defect-material-barcode"
                  ref={materialInputRef}
                  type="text"
                  value={materialBarcode}
                  onChange={(e) => setMaterialBarcode(e.target.value)}
                  onKeyDown={handleMaterialBarcodeKeyPress}
                  disabled={!isReady}
                  maxLength={28}
                  autoComplete="off"
                  placeholder="Scan Material Barcode"
                />
              </div>

              <div className="defect-scan-field">
                <label htmlFor="defect-barcode">
                  Defect Barcode
                  <span>STEP 2</span>
                </label>

                <input
                  id="defect-barcode"
                  ref={defectInputRef}
                  type="text"
                  value={defectBarcode}
                  onChange={(e) => setDefectBarcode(e.target.value)}
                  onKeyDown={handleDefectBarcodeKeyPress}
                  disabled={!isReady || !materialBarcode}
                  maxLength={28}
                  autoComplete="off"
                  placeholder="Scan Defect Barcode"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="defect-scan-error" role="alert">
                {errorMessage}
              </div>
            )}
          </section>

          {/* History */}
          <section className="defect-scan-history">
            <HistoryDefect selectedOption={selectedOption} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default FormScan;