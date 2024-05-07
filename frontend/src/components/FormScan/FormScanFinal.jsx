import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./FormScan.css"; // Import CSS file for styling
import HistoryFinal from "../History/HistoryFinal";
import Navbar from "../Navbar/Navbar";
import { API_URL } from '../../lib/config';

function FormScanFinal() {
  const [barcode, setBarcode] = useState("");
  const [userId, setUserId] = useState(""); // State for user ID
  const [scanTime] = useState(formatScanTime(new Date())); // Scan time cannot be edited
  const barcodeInputRef = useRef(null);
  const userIdInputRef = useRef(null); // Reference for user ID input field
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [status_oil, setStatusOil] = useState("--");
  const [status_comp, setStatusComp] = useState("--");
  const [status_cool, setStatusCool] = useState("--");
  const [status_safe, setStatusSafe] = useState("--");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(barcode)
    if (barcode) {
      fetchDataFromStation(barcode);
    }
  }, [barcode]); 

  const fetchDataFromStation = async (barcodeValue) => {
    // console.log(barcodeValue)
    try {
      setLoading(true); // Set loading to true when fetching data
      const response = await axios.get(`${API_URL}/station`, {
        params: { barcode: barcodeValue },
      });
      const stationData = response.data.station78Data[0];
      // Extract data and set status variables
      setStatusOil(stationData.oil_status === "OK" ? "ChargeR600" : "");
      setStatusComp(stationData.comp_status !== "0" ? "Compressor" : "");
      setStatusCool(stationData.cooling_status === "OK" ? "CoolingTest" : "");
      setStatusSafe(stationData.safety_status !== "0" ? "SafetyTest" : "");
    } catch (error) {
      console.error("Error fetching data from station:", error);
    } finally {
      setLoading(false); // Set loading back to false when data fetching is complete
    }
  };

  const handleSubmit = async () => {

    if (!userId) {
      alert("Please input UserID.");
      userIdInputRef.current.focus();
      return;
    }


    try {
      const newScantime = formatScanTime(new Date());
      const data = {
        barcode: barcode,
        scantime: newScantime,
        station_scan: `${status_oil}${status_comp ? ', ' + status_comp : ''}${status_cool ? ', ' + status_cool : ''}${status_safe ? ', ' + status_safe : ''}`,
        userId: userId
      };
      console.log(data)
      // await axios.post(`${API_URL}/SavedFinal`, data);
      console.log("Data sent successfully!");
      setSuccessMessage('OK');
      // Clear input fields
      setBarcode("");
      // Return focus to the Material Barcode input box
      barcodeInputRef.current.focus();
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Error sending data.");
    }
  };
  

  const handleBarcodeKeyPress = (e) => {
    if (e.key === "Enter") {
      if (barcode.length === 0) {
        alert("Please input Barcode!");
        return; // Prevent submission
      } else if (barcode.length !== 20) {
        alert("Invalid Barcode!");
        setBarcode("");
        return; // Prevent submission
      }

      if (!selectedOption) {
        alert("Please select Production Line.");
        return;
      }

      if (barcode.charAt(12) !== selectedOption) {
        alert("Barcode does not correspond to the selected Production Line.");
        setBarcode("")
        barcodeInputRef.current.focus(); // Set focus back to Compressor Barcode input field
        return; // Exit the function early
      }
      handleSubmit();
      barcodeInputRef.current.focus();
    }
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
      // Move focus to the Material Barcode field
      barcodeInputRef.current.focus();
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
            <b>Final Scan</b>
          </h3>
          <input
            ref={barcodeInputRef} // Assign reference to the material barcode input field
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="large-textbox" // Apply custom CSS class for large text box
            autoFocus // Automatically focus on this field when the component mounts
            onKeyPress={handleBarcodeKeyPress} // Listen for Enter key press
            disabled={userId === null}
          />
          <br />
          <br />
        </div>
      </div>
      <HistoryFinal selectedOption={selectedOption} />
    </div>
  );
}

export default FormScanFinal;
