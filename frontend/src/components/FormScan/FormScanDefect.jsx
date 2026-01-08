/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import axios from "axios";
import "./FormScan.css"; // Import CSS file for styling
import Navbar from "../Navbar/Navbar";
import { API_URL } from '../../lib/config';
import HistoryDefect from "../History/HistoryDefect";

function FormScan() {
  const [defectBarcode, setDefectBarcode] = useState("");
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [userId, setUserId] = useState(""); // State for user ID
  const [scanTime] = useState(formatScanTime(new Date())); // Scan time cannot be edited
  const defectInputRef = useRef(null); // Reference for defect barcode input field
  const materialInputRef = useRef(null);
  const userIdInputRef = useRef(null); // Reference for user ID input field
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [usedDefectBarcodes, setUsedDefectBarcodes] = useState(new Set()); // Track used defect barcodes
  const [errorMessage, setErrorMessage] = useState("");  // Add new state for error message
  const [usedCombinations, setUsedCombinations] = useState(new Set()); // เก็บแค่ combination

  const handleMaterialBarcodeKeyPress = (e) => {
    if (e.key === "Enter") {
      // Check if current defect barcode is actually a material barcode
      if (defectBarcode.length > 15 && defectBarcode.length === 28) {
        // Swap the values
        setMaterialBarcode(defectBarcode);
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      if (materialBarcode.length === 0) {
        alert("Please input Material Barcode!");
        return;
      }

      if (materialBarcode.length !== 28) {
        alert("Material Barcode must be 28 characters!");
        setMaterialBarcode("");
        materialInputRef.current.focus();
        return;
      }

      // Reset both used sets when material barcode changes
      setUsedDefectBarcodes(new Set());
      // Reset only combinations when material barcode changes
      setUsedCombinations(new Set());

      // Log scan data
      console.log('----------------------------------------');
      console.log('Production Line:', selectedOption === 'A' ? 'RA' : 'RB');
      console.log('Material Barcode:', materialBarcode);
      console.log('Date/Time:', formatScanTime(new Date()));
      console.log('Scan By:', userId);
      console.log('----------------------------------------');

      defectInputRef.current.focus();
    }
  };

  const handleDefectBarcodeKeyPress = async (e) => {
    if (e.key === "Enter") {
      setErrorMessage(""); // Reset error message on new scan

      if (defectBarcode.length === 28) {
        setMaterialBarcode(defectBarcode);
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      if (defectBarcode.length === 0) {
        setErrorMessage("Please input Defect Barcode!");
        return;
      }

      // Check if it's a full defect barcode (reason|location format)
      if (defectBarcode.length !== 15) {
        setErrorMessage("Invalid barcode length! Must be 15 digits (reason|location)");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      if (defectBarcode[7] !== '|') {
        setErrorMessage("Invalid Defect Barcode format! Must use '|' as separator!");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      const [reasonCode, locationCode] = defectBarcode.split('|');

      if (reasonCode.length !== 7 || locationCode.length !== 7) {
        setErrorMessage("Both Reason and Location codes must be 7 digits!");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      if (reasonCode[2] !== 'F') {
        setErrorMessage("Invalid Reason code format! Second character must be 'F'");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      const alphanumericRegex = /^[0-9A-Za-z]+$/;
      if (!alphanumericRegex.test(reasonCode) || !alphanumericRegex.test(locationCode)) {
        setErrorMessage("Both codes must contain only alphanumeric characters!");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      // สร้าง combination key สำหรับตรวจสอบ
      const combinationKey = `${reasonCode}|${locationCode}`;

      // ตรวจสอบแค่ combination ซ้ำเท่านั้น
      if (usedCombinations.has(combinationKey)) {
        setErrorMessage("This exact Reason-Location combination has already been used!");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      // Check for duplicate defect barcode
      if (usedDefectBarcodes.has(defectBarcode)) {
        setErrorMessage("This Defect Barcode has already been used for current Material Barcode!");
        setDefectBarcode("");
        defectInputRef.current.focus();
        return;
      }

      // Log scan data right after validation passes
      console.log('----------------------------------------');
      console.log('Production Line:', selectedOption === 'A' ? 'RA' : 'RB');
      console.log('Material Barcode:', materialBarcode);
      console.log('Defect Barcode:', defectBarcode);
      console.log('Date/Time:', formatScanTime(new Date()));
      console.log('Scan By:', userId);
      console.log('----------------------------------------');

      try {
        const newScantime = formatScanTime(new Date());
        const data = {
          materialBarcode: materialBarcode,
          defectBarcode: defectBarcode,
          scanTime: newScantime,
          userId: userId,
          productionLine: selectedOption // เพิ่ม production line
        };

        // Debug: log data and URL
        console.log('API URL:', API_URL);
        console.log('Sending data to server:', data);

        const response = await axios.post(`${API_URL}/SavedDefect`, data, {
          timeout: 5000, // 5 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log("Server response:", response.data);

        // Log scan data
        console.log('----------------------------------------');
        console.log('Production Line:', selectedOption === 'A' ? 'RA' : 'RB');
        console.log('Material Barcode:', materialBarcode);
        console.log('Defect Barcode:', defectBarcode);
        console.log('Date/Time:', newScantime);
        console.log('Scan By:', userId);
        console.log('----------------------------------------');

        setSuccessMessage('OK');
        // เก็บแค่ combination
        setUsedCombinations(prev => new Set([...prev, combinationKey]));
        setUsedDefectBarcodes(prev => new Set([...prev, defectBarcode]));
        defectInputRef.current.select();

        setTimeout(() => {
          setSuccessMessage(null);
        }, 2000);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          setErrorMessage("Connection timeout - Please try again");
        } else if (!error.response) {
          setErrorMessage("Network error - Please check server connection");
        } else {
          setErrorMessage(`Error: ${error.response?.data || error.message}`);
        }
        setDefectBarcode("");
        defectInputRef.current.focus();
      }
      setMaterialBarcode("");
      setDefectBarcode("");
      materialInputRef.current.focus();
    }
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
      // Move focus to the Material Barcode field
      materialInputRef.current.focus();
    }
  };

  // เปลี่ยนจากแสดง alert เป็นแค่ log
  const testConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/test-connection`);
      console.log('Backend connected:', response.data);
    } catch (error) {
      console.log('Backend not ready:', error.message);
    }
  };

  // Call test connection when component mounts
  React.useEffect(() => {
    testConnection();
  }, []);

  // Function to format scan time as 'YYYY-MM-DD HH:mm:ss'
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
    <div>
      <Navbar />
      <div className="select-box">
        <b>Production Line : </b>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
        >
          <option value="">--</option>
          <option value="RA">RA</option>
          <option value="RB">RB</option>
        </select><br /><br />
        <b>Work ID : </b>
        <input
          ref={userIdInputRef}
          type="text"
          placeholder="User ID"
          className="user-id-input"
          value={userId}
          onChange={(e) => setUserId(e.target.value)} // Handle changes in the user ID input field
          onKeyDown={handleUserIdKeyPress} // Listen for Enter key press
        />
      </div>
      <div className="user-id-box">
        {successMessage && (
          <div className="success-message">
            <h1><b>{successMessage}</b></h1>
          </div>
        )}
      </div>
      <div className="form-container">
        <div className="form-wrapper">
          <h3>
            <b>Material Barcode</b>
          </h3>
          <input
            ref={materialInputRef}
            type="text"
            value={materialBarcode}
            onChange={(e) => setMaterialBarcode(e.target.value)}
            className="large-textbox" // Added material-input class
            autoFocus
            onKeyDown={handleMaterialBarcodeKeyPress} // Listen for Enter key press
            disabled={!userId || !selectedOption}
            maxLength={28}
          />
          <h3>
            <b>Defect Barcode</b>
          </h3>
          <input
            ref={defectInputRef} // Assign reference to the defect barcode input field
            type="text"
            value={defectBarcode}
            onChange={(e) => setDefectBarcode(e.target.value)}
            className="large-textbox" // Added defect-input class
            onKeyDown={handleDefectBarcodeKeyPress} // Listen for Enter key press
            disabled={!userId || !selectedOption}
            maxLength={28} // Set maximum length to 15 characters
            // placeholder="Excample: 01F0288|01L0060"
          />
          {errorMessage && <div style={{ color: "red", marginTop: "5px" }}>{errorMessage}</div>}
          {!userId && <div style={{ color: "red" }}>Please Input Work ID.</div>}
          {!selectedOption && (
            <div style={{ color: "red" }}>Please Select Production Line.</div>
          )}
          {/* <input
            type="hidden"
            value={scanTime}
            disabled // Disable editing
          /> */}
          <br />
          <br />
        </div>
      </div>
      <HistoryDefect selectedOption={selectedOption} />
    </div>
  );
}

export default FormScan;
