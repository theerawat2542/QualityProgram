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

  const handleSubmit = async () => {
    if (!selectedOption) {
      alert("Please select Production Line.");
      return;
    }

    if (!userId) {
      alert("Please input UserID.");
      userIdInputRef.current.focus();
      return;
    }
    
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
      const data = {
        materialBarcode: materialBarcode,
        compressorBarcode: compressorBarcode,
        scanTime: scanTime,
        userId: userId, // Include user ID in the data
      };
      await axios.post(`${API_URL}/Saved`, data);
      console.log("Data sent successfully!");
      // Clear input fields
      setMaterialBarcode("");
      setCompressorBarcode("");
      // Return focus to the Material Barcode input box
      materialInputRef.current.focus();
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
      }else 
      if (materialBarcode.length !== 20) {
        alert("Invalid Barcode!");
        setMaterialBarcode("");
        return; // Prevent submission
      }
      // Move focus to the compressor barcode field
      compressorInputRef.current.focus();
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

      if (materialBarcode.charAt(12) !== selectedOption) {
        alert("Barcode does not correspond to the selected Production Line.");
        setMaterialBarcode("")
        materialInputRef.current.focus(); // Set focus back to Compressor Barcode input field
        return; // Exit the function early
      }
      // Automatically submit the form
      handleSubmit();
    }
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
      // Move focus to the Material Barcode field
      materialInputRef.current.focus();
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
        />
      </div>
      <div className="form-container">
        <div className="form-wrapper">
          <h3>
            <b>Material Barcode</b>
          </h3>
          <input
            ref={materialInputRef} // Assign reference to the material barcode input field
            type="text"
            value={materialBarcode}
            onChange={(e) => setMaterialBarcode(e.target.value)}
            className="large-textbox" // Apply custom CSS class for large text box
            autoFocus // Automatically focus on this field when the component mounts
            onKeyPress={handleMaterialBarcodeKeyPress} // Listen for Enter key press
            disabled={() => (userId === null ? true : false)}
          />
          <h3>
            <b>Compressor Barcode</b>
          </h3>
          <input
            ref={compressorInputRef}
            type="text"
            value={compressorBarcode}
            onChange={(e) => setCompressorBarcode(e.target.value)}
            className="large-textbox" // Apply custom CSS class for large text box
            onKeyPress={handleCompressorBarcodeKeyPress} // Listen for Enter key press
          />
          <input
            type="hidden"
            value={scanTime}
            disabled // Disable editing
          />
          <br />
          <br />
          {/* <button className="btn btn-success" onClick={handleSubmit}>
            Submit
          </button> */}
          {/* {message && <div className="message">{message}</div>} */}
        </div>
      </div>
      <br />
      <History />
    </div>
  );
}

export default FormScan;
