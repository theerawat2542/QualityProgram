import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./FormScan.css"; // Import CSS file for styling
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";
import HistoryFinal from "../History/็HistoryFinal";

function FormScanFinal() {
  const [barcode, setBarcode] = useState("");
  // const [station, setStation] = useState("");
  const [scantime] = useState(formatScanTime(new Date())); // Scan time cannot be edited
  const [status_oil, setStatusOil] = useState("--");
  const [status_comp, setStatusComp] = useState("--");
  const [status_cool, setStatusCool] = useState("--");
  const barcodeInputRef = useRef(null); // Reference for material barcode input field

  useEffect(() => {
    fetchDataFromStation();
  }, []); // Empty dependency array ensures the effect runs only once, similar to componentDidMount

  const fetchDataFromStation = async (barcodeValue) => {
    try {
      const response = await axios.get(`${API_URL}/station`, {
        params: { barcode: barcodeValue },
      });
      const stationData = response.data.station78Data[0];
      // Extract data and set status variables
      setStatusOil(stationData.OilChargerStatus === "OK" ? "OK" : "NG");
      // console.log("Status Oil:", stationData.OilChargerStatus === "OK" ? "OK" : "NG");
      setStatusComp(stationData.ScanCompressorStatus !== "0" ? "OK" : "NG");
      // console.log("Status Compressor:", stationData.ScanCompressorStatus !== "0" ? "OK" : "NG");
      setStatusCool(stationData.CoolingStatus === "OK" ? "OK" : "NG");
      // console.log("Status Cooling:", stationData.CoolingStatus === "OK" ? "OK" : "NG");
    } catch (error) {
      console.error("Error fetching data from station:", error);
    }
  };

  useEffect(() => {
    if (barcode) {
      fetchDataFromStation(barcode);
    }
  }, [barcode]); // Run the effect whenever barcode changes

  const handleSubmit = async () => {
    if (!barcode) {
      alert("Please input Barcode.");
      barcodeInputRef.current.focus(); // Set focus back to Compressor Barcode input field
      return; // Exit the function early
    }

    try {
      const data = {
        barcode: barcode,
        scantime: scantime,
        station_scan: `OilCharger: ${status_oil}, Compressor: ${status_comp}, Cooling Test: ${status_cool}`
      };
      await axios.post(`${API_URL}/SavedFinal`, data);
      console.log("Data sent successfully!");
      // Clear input fields
      setBarcode("");
      // Return focus to the Material Barcode input box
      barcodeInputRef.current.focus();
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Error sending data.");
    }
  };

  const handleBarcodeKeyPress = (e) => {
    if (e.key === "Enter") {
      if (barcode.length !== 20) {
        alert("Please input Barcode.");
        return; // Prevent submission
      }
      // Automatically submit the form
      handleSubmit();
      barcodeInputRef.current.focus();
    }
  };

  useEffect(() => {
    if (barcode.length !== 20) {
      setStatusOil("--");
      setStatusComp("--");
      setStatusCool("--");
    } else {
      fetchDataFromStation(barcode);
    }
  }, [barcode]); // Run the effect whenever barcode changes

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
          />
          {/* <input
            type="hidden"
            value={scantime}
            disabled // Disable editing
          /> */}
          {/* <input
            type="hidden"
            value={`OilCharger: ${status_oil}, Compressor: ${status_comp}, Cooling Test: ${status_cool}`}
            disabled // Disable editing
          /> */}

          <br />
          <br />
          {/* Display status */}
          <div>
            <b>Status OilCharger:</b> {status_oil}
          </div>
          <div>
            <b>Status Compressor:</b> {status_comp}
          </div>
          <div>
            <b>Status Cooling Test:</b> {status_cool}
          </div>
          {/* <button className="btn btn-success" onClick={handleSubmit}>
            Submit
          </button> */}
          {/* {message && <div className="message">{message}</div>} */}
        </div>
      </div>
      <br />
      <HistoryFinal />
    </div>
  );
}

export default FormScanFinal;
