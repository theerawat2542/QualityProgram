import React, { useState, useRef } from "react";
import axios from "axios";
import "./FormScan.css"; // Import CSS file for styling
import History from "../History/History";
import Navbar from "../Navbar/Navbar";
import { API_URL } from '../../lib/config';

function FormScan() {
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [compressorBarcode, setCompressorBarcode] = useState("");
  const [userId, setUserId] = useState(""); // State for user ID
  const [scanTime] = useState(formatScanTime(new Date())); // Scan time cannot be edited
  const materialInputRef = useRef(null); // Reference for material barcode input field
  const compressorInputRef = useRef(null);
  const userIdInputRef = useRef(null); // Reference for user ID input field
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async () => {
    
    if (!materialBarcode) {
      alert("Please input Material Barcode.");
      materialInputRef.current.focus(); // Set focus back to Material Barcode input field
      return; // Exit the function early
    }

    if (!compressorBarcode) {
      alert("Please input Compressor Barcode.");
      compressorInputRef.current.focus(); // Set focus back to Compressor Barcode input field
      return; // Exit the function early
    }

    try {
      const newScantime = formatScanTime(new Date());
      const data = {
        materialBarcode: materialBarcode,
        compressorBarcode: compressorBarcode,
        scanTime: newScantime,
        userId: userId, // Include user ID in the data
      };
      await axios.post(`${API_URL}/Saved`, data);
      console.log("Data sent successfully!");
      // Show success message
      setSuccessMessage('OK');
      // Clear input fields
      setMaterialBarcode("");
      setCompressorBarcode("");
      // Return focus to the Material Barcode input box
      compressorInputRef.current.focus();
      // Remove success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Error sending data.");
    }
  };

  const handleMaterialBarcodeKeyPress = (e) => {
    if (e.key === "Enter") {
      if (materialBarcode.length === 0) {
        alert("Please input Material Barcode!");
        return; // Prevent submission
      } else if (materialBarcode.length !== 20) {
        alert("Invalid Barcode!");
        setMaterialBarcode("");
        return; // Prevent submission
      }

      if (materialBarcode.charAt(12) !== selectedOption) {
        alert("Barcode does not correspond to the selected Production Line.");
        setMaterialBarcode("")
        materialInputRef.current.focus(); // Set focus back to Compressor Barcode input field
        return; // Exit the function early
      }
      handleSubmit();
    }
  };

  const handleCompressorBarcodeKeyPress = (e) => {
    if (e.key === "Enter") {
      if (compressorBarcode.length === 0) {
        alert("Please input Compressor Barcode!");
        return; // Prevent submission
      }

      if (!selectedOption) {
        alert("Please select Production Line.");
        return;
      }

      materialInputRef.current.focus();
    }
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
      // Move focus to the Material Barcode field
      compressorInputRef.current.focus();
    }
  };

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
        <b>Production Line: </b>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
        >
          <option value="">--</option>
          <option value="A">RA</option>
          <option value="B">RB</option>
        </select>
      </div>
      <div className="user-id-box">
        <b>Work ID: </b>
        <input
          ref={userIdInputRef}
          type="text"
          placeholder="User ID"
          className="user-id-input"
          value={userId}
          onChange={(e) => setUserId(e.target.value)} // Handle changes in the user ID input field
          onKeyPress={handleUserIdKeyPress} // Listen for Enter key press
        /><br /><br />
        {successMessage && (
          <div className="success-message">
            <h1><b>{successMessage}</b></h1>
          </div>
        )}
      </div>
      <div className="form-container">
        <div className="form-wrapper">
          <h3>
            <b>Compressor Barcode</b>
          </h3>
          <input
            ref={compressorInputRef}
            type="text"
            value={compressorBarcode}
            onChange={(e) => setCompressorBarcode(e.target.value)}
            className="large-textbox" // Apply custom CSS class for large text box
            autoFocus
            onKeyPress={handleCompressorBarcodeKeyPress} // Listen for Enter key press
            disabled={!userId || !selectedOption}
          />
          <h3>
            <b>Material Barcode</b>
          </h3>
          <input
            ref={materialInputRef} // Assign reference to the material barcode input field
            type="text"
            value={materialBarcode}
            onChange={(e) => setMaterialBarcode(e.target.value)}
            className="large-textbox" // Apply custom CSS class for large text box
            onKeyPress={handleMaterialBarcodeKeyPress} // Listen for Enter key press
            disabled={!userId || !selectedOption}
          />
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
      <History selectedOption={selectedOption} />
    </div>
  );
}

export default FormScan;
