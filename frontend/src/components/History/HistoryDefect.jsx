/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Table, Tag, Spin, Alert } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";

function HistoryDefect({ selectedOption }) {
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
      const res = await axios.get(`${API_URL}/HistoryDefect`);

      const filtered = res.data.filter(
        (item) => item.production_line === selectedOption
      );

      setRecords(filtered);
      setError(null);
    } catch (err) {
      setError(err.message || "Load data failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      key: "material_barcode",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Reason - Location",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Scan Time",
      dataIndex: "scan_time",
      key: "scan_time",
      width: 180,
      render: (text) =>
        text ? format(new Date(text), "yyyy-MM-dd HH:mm:ss") : "-",
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
    <div>
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
          <Tag color="red">Defect - Line {selectedOption}</Tag>
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

export default HistoryDefect;
