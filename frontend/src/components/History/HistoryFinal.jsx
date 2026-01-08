/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Table, Typography, Tag, Spin, Alert } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";

const { Title } = Typography;

function HistoryFinal({ selectedOption }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedOption]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/HistoryFinal`);

      const filteredData = res.data.filter(
        (item) => item.barcode?.charAt(12) === selectedOption
      );

      setRecords(filteredData);
      setError(null);
    } catch (err) {
      setError(err.message || "Load data failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Scan Time",
      dataIndex: "scantime",
      key: "scantime",
      width: 180,
      render: (text) =>
        format(new Date(text), "yyyy-MM-dd HH:mm:ss"),
    },
    {
      title: "Station Scan",
      dataIndex: "station_scan",
      key: "station_scan",
      render: (text) => (
        <span style={{ whiteSpace: "normal" }}>{text}</span>
      ),
    },
    {
      title: "Scan By",
      dataIndex: "user_id",
      key: "user_id",
      width: 120,
      align: "center",
    },
  ];

  return (
    <div style={{ marginTop: 15 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >

          <Tag color={selectedOption === "A" ? "blue" : "green"}>
            Line {selectedOption}
          </Tag>
        </div>

        {/* Error */}
        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Table */}
        <Spin spinning={loading}>
          <Table
            rowKey={(record, index) => index}
            columns={columns}
            dataSource={records}
            size="small"
            bordered
            pagination={false}
            scroll={{ y: 260 }}
            sticky
            rowClassName={(_, index) =>
              index === 0 ? "latest-row" : ""
            }
          />
        </Spin>
      </div>
    </div>
  );
}

export default HistoryFinal;
