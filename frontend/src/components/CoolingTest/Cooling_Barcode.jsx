/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Tag } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./CoolingBarcode.css";

const CoolingBarcode = ({ barcode }) => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/barcode_coolingtest?barcode=${barcode}`
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
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      align: "center",
    },
    {
      title: "Date / Time",
      dataIndex: "StartTime",
      key: "StartTime",
      align: "center",
      render: (text) =>
        text ? format(new Date(text), "yyyy-MM-dd HH:mm:ss") : "-",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Status",
      dataIndex: "TestResult",
      key: "TestResult",
      align: "center",
      render: (result) =>
        result === "PASS" ? (
          <Tag color="green">PASS</Tag>
        ) : (
          <Tag color="red">FAIL</Tag>
        ),
    },
    {
      title: "Remark",
      dataIndex: "Remark",
      key: "Remark",
      ellipsis: true,
    },
  ];

  return (
    <div className="cooling-container">
      <div className="cooling-card">
        <div className="cooling-header">
          <span>❄️ Cooling Test</span>
          <small>Barcode : {barcode}</small>
        </div>

        <Table
          dataSource={records}
          columns={columns}
          pagination={false}
          size="middle"
          rowKey={(record, index) => index}
          scroll={{ y: 420, x: 1200 }}
        />

        {error && <div className="error-text">Error : {error}</div>}
      </div>
    </div>
  );
};

export default CoolingBarcode;
