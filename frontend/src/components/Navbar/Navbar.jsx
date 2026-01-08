/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import "./Navbar.css";
import reactLogo from "../assets/Haier.png";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={reactLogo} alt="HaierLogo" className="logo-image" />
      </div>

      <ul className="navbar-links">
        <li>
          <a href="/"><b>Scan Compressor</b></a>
        </li>

        <li>
          <a href="/scan-final"><b>Scan Final</b></a>
        </li>

        <li>
          <a href="/scan-defect"><b>Scan Defect</b></a>
        </li>

        <li>
          <a href="/station"><b>Station Tracking</b></a>
        </li>

        <li className="reports-dropdown">
          <a><b>Reports</b><span className="arrow">↴</span></a>
          <div className="reports-dropdown-content">
            <a href="/charge-r600a-report">Charge R600a</a>
            <a href="/scan-compressor-report">Scan Compressor</a>
            <a href="/scan-defect-report">Scan Defect</a>
            <a href="/cooling-test-report">Cooling Test</a>
            <a href="/safety-test-report">Safety Test</a>
            <a href="/final-appearance-inspection-report">
              Final Appearance Inspection
            </a>
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
