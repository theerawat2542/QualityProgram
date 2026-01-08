/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./CompBarcode.css";

const CompBarcode = ({ barcode }) => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/barcode_compressor?barcode=${barcode}`
        );
        setRecords(response.data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [barcode]);

  const columns = [
    {
      title: "Compressor Barcode",
      dataIndex: "compressor_barcode",
      key: "compressor_barcode",
      ellipsis: true,
    },
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      key: "material_barcode",
      ellipsis: true,
    },
    {
      title: "Production Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      align: "center",
    },
    {
      title: "Scan Time",
      dataIndex: "scan_time",
      key: "scan_time",
      render: (text) => format(new Date(text), "yyyy-MM-dd HH:mm:ss"),
      align: "center",
    },
    {
      title: "Model",
      dataIndex: "WorkUser_RightMostItemName",
      key: "WorkUser_RightMostItemName",
    },
    {
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      align: "center",
    },
  ];

  return (
    <div className="comp-container">
      <div className="comp-card">
        <div className="comp-header">
          <span>📦 Scan Compressor</span>
          <small>Barcode : {barcode}</small>
        </div>

        <Table
          dataSource={records}
          columns={columns}
          pagination={false}
          size="middle"
          rowKey={(record, index) => index}
          scroll={{ y: 420, x: true }}
        />

        {error && <div className="error-text">Error : {error}</div>}
      </div>
    </div>
  );
};

export default CompBarcode;
