import React from 'react';
import './Navbar.css'; // Import CSS file for Navbar styling
import reactLogo from '../assets/Haier.png'


function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={reactLogo} alt="HaierLogo" className="logo-image" />
      </div>
      <ul className="navbar-links">
        <li><a href="/"><b>Scan Compressor </b></a><label style={{ color: 'white', fontSize: '20px' }}> |</label></li>
        <li><a href="/scan-final"><b>Scan Final </b></a><label style={{ color: 'white', fontSize: '20px' }}> |</label></li>
        <li><a href="/station"><b>Station Scan </b></a><label style={{ color: 'white', fontSize: '20px' }}> |</label></li>
        <li className="reports-dropdown">
          <a><b>Reports </b></a><label style={{ color: 'white', fontSize: '20px' }}> ↴</label>
          <div className="reports-dropdown-content">
            <a href="/charge-r600a-report">Charge R600a</a>
            <a href="/scan-compressor-report">Scan Compressor</a>
            <a href="/cooling-test-report">Cooling Test</a>
            {/* <a href="/safety-test-report">Safety Test</a> */}
            <a href="/final-appearance-inspection-report">Final Appearance Inspection</a>
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
