import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./FormScan.css"; // Import CSS file for styling
import HistoryFinal from "../History/HistoryFinal";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";

function FormScanFinal() {
  const [barcode, setBarcode] = useState("");
  const [userId, setUserId] = useState(""); // State for user ID
  const [scanTime] = useState(formatScanTime(new Date())); // Scan time cannot be edited
  const barcodeInputRef = useRef(null);
  const userIdInputRef = useRef(null); // Reference for user ID input field
  const [selectedOption, setSelectedOption] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [status_oil, setStatusOil] = useState("");
  const [status_comp, setStatusComp] = useState("");
  const [status_cool, setStatusCool] = useState("");
  const [status_safe, setStatusSafe] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (barcode.length === 20) {
      updateStationScan();
    }
  }, [status_oil, status_comp, status_cool, status_safe]);

  const fetchDataFromStation = async (barcode) => {
    try {
      setLoading(true); // Set loading to true when fetching data
      const response = await axios.get(`${API_URL}/station`, {
        params: { barcode },
      });
      const stationData = response.data.station78Data[0];
      setStatusOil(stationData.oil_status === "OK" ? "ChargeR600" : "");
      setStatusComp(stationData.comp_status !== "0" ? "Compressor" : "");
      setStatusCool(stationData.cooling_status === "OK" ? "CoolingTest" : "");
      setStatusSafe(stationData.safety_status !== "0" ? "SafetyTest" : "");
      await updateStationScan();
    } catch (error) {
      console.error("Error fetching data from station:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStationScan = async () => {
    try {
      // Check if barcode is empty, if so, exit early
      if (!barcode) return;

      // Construct station_scan based on the status variables
      const stationScanParts = [];
      if (status_oil) stationScanParts.push(status_oil);
      if (status_comp) stationScanParts.push(status_comp);
      if (status_cool) stationScanParts.push(status_cool);
      if (status_safe) stationScanParts.push(status_safe);
      const updatedStationScan = stationScanParts.join(", ");
      // setStationScan(updatedStationScan); // Update station_scan state
      // console.log(updatedStationScan);
      const newScantime = formatScanTime(new Date());
      const data = {
        barcode: barcode,
        scantime: newScantime,
        station_scan: updatedStationScan,
        userId: userId,
      };
      await axios.post(`${API_URL}/SavedFinal`, data);
      console.log(data);
    } catch (error) {
      console.error("Error updating station_scan:", error);
    }
  };

  const handleBarcodeChange = async (e) => {
    const newBarcode = e.target.value;
    setBarcode(newBarcode);
    if (newBarcode.length === 20) {
      await fetchDataFromStation(newBarcode);
      // await updateStationScan();
    }
  };

  const handleSubmit = async () => {
    try {
      // await updateStationScan();
      console.log("Data sent successfully!");
      setSuccessMessage("OK");
      setBarcode("");
      barcodeInputRef.current.focus();
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Error sending data.");
    }
  };

  const handleBarcodeKeyPress = async (e) => {
    if (e.key === "Enter") {
      if (barcode.length === 0) {
        alert("Please input Barcode!");
        return;
      } else if (barcode.length !== 20) {
        alert("Invalid Barcode!");
        setBarcode("");
        return;
      }

      if (barcode.charAt(12) !== selectedOption) {
        alert("Barcode does not correspond to the selected Production Line.");
        setBarcode("");
        barcodeInputRef.current.focus();
        return;
      }
      setTimeout(() => {
        handleSubmit();
      }, 1000);

      barcodeInputRef.current.focus();
    }
  };

  const handleUserIdKeyPress = (e) => {
    if (e.key === "Enter") {
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
          onChange={(e) => setUserId(e.target.value)} 
          onKeyPress={handleUserIdKeyPress} 
        />
        <br />
        <br />
        {successMessage && (
          <div className="success-message">
            <h1>
              <b>{successMessage}</b>
            </h1>
          </div>
        )}
      </div>
      <div className="form-container">
        <div className="form-wrapper">
          <h3>
            <b>Final Scan</b>
          </h3>
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcode}
            onChange={handleBarcodeChange}
            className="large-textbox"
            autoFocus
            onKeyPress={handleBarcodeKeyPress}
            disabled={!userId || !selectedOption}
          />
          {!userId && <div style={{ color: "red" }}>Please Input Work ID.</div>}
          {!selectedOption && (
            <div style={{ color: "red" }}>Please Select Production Line.</div>
          )}
          <br />
          <br />
        </div>
      </div>
      <div>{/* <center><b>Station Scan: </b> {station_scan}</center> */}</div>
      <HistoryFinal selectedOption={selectedOption} />
    </div>
  );
}

export default FormScanFinal;
