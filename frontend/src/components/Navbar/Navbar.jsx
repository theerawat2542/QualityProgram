/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Navbar.css";
import reactLogo from "../assets/Haier.png";

function Navbar() {
  const location = useLocation();

  const reportPaths = [
    "/charge-r600a-report",
    "/scan-compressor-report",
    "/scan-defect-report",
    "/cooling-test-report",
    "/safety-test-report",
    "/final-appearance-inspection-report",
  ];

  const isReportActive = reportPaths.includes(location.pathname);

  const navItems = [
    { label: "Scan Compressor", path: "/" },
    { label: "Scan Final", path: "/scan-final" },
    { label: "Scan Defect", path: "/scan-defect" },
    { label: "Station Tracking", path: "/station" },
  ];

  return (
    <nav className="navbar">
      {/* Haier Logo */}
      <NavLink to="/" className="navbar-logo" aria-label="Home">
        <img
          src={reactLogo}
          alt="Haier Logo"
          className="logo-image"
        />
      </NavLink>

      {/* Main Menu */}
      <ul className="navbar-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `navbar-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}

        {/* Reports Dropdown */}
        <li
          className={`reports-dropdown ${
            isReportActive ? "report-active" : ""
          }`}
        >
          <button
            type="button"
            className="navbar-link reports-trigger"
            aria-haspopup="true"
          >
            Reports
            <span className="arrow" aria-hidden="true">
              ▾
            </span>
          </button>

          <div className="reports-dropdown-content">
            <NavLink to="/charge-r600a-report">
              Charge R600a
            </NavLink>

            <NavLink to="/scan-compressor-report">
              Scan Compressor
            </NavLink>

            <NavLink to="/scan-defect-report">
              Scan Defect
            </NavLink>

            <NavLink to="/cooling-test-report">
              Cooling Test
            </NavLink>

            <NavLink to="/safety-test-report">
              Safety Test
            </NavLink>

            <NavLink to="/final-appearance-inspection-report">
              Final Appearance Inspection
            </NavLink>
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;