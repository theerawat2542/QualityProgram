/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./FinalBarcode.css";

const FinalBarcode = ({ barcode }) => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/barcode_final?barcode=${barcode}`
        );
        setRecords(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [barcode]);

  const columns = [
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      fixed: "left",
      ellipsis: true,
    },
    {
      title: "Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      align: "center",
    },
    {
      title: "Date / Time",
      dataIndex: "scantime",
      key: "scantime",
      align: "center",
      render: (text) =>
        text ? format(new Date(text), "yyyy-MM-dd HH:mm:ss") : "-",
    },
    {
      title: "Model",
      dataIndex: "WorkUser_RightMostItemName",
      key: "WorkUser_RightMostItemName",
      align: "center",
      ellipsis: true,
    },
    {
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      align: "center",
    },
  ];

  return (
    <div className="final-container">
      <div className="final-card">
        <div className="final-header">
          <span>✅ Final Scan</span>
          <small>Barcode : {barcode}</small>
        </div>

        <Table
          dataSource={records}
          columns={columns}
          pagination={false}
          size="middle"
          rowKey={(record, index) => index}
          scroll={{ y: 420, x: 900 }}
        />

        {error && <div className="error-text">Error : {error}</div>}
      </div>
    </div>
  );
};

export default FinalBarcode;
