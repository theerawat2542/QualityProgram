/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";

import { Table, Typography, Tag, Spin, Alert } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./History.css";

const { Text } = Typography;

function HistoryDefect({ selectedOption }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestInProgressRef = useRef(false);
  const mountedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (requestInProgressRef.current) return;

    requestInProgressRef.current = true;

    try {
      const res = await axios.get(`${API_URL}/HistoryDefect`);

      if (!mountedRef.current) return;

      const sourceData = Array.isArray(res.data) ? res.data : [];

      // กรองข้อมูลตาม Line ที่เลือก
      const filteredData = sourceData.filter(
        (item) =>
          String(item.production_line ?? "") ===
          String(selectedOption ?? "")
      );

      // เรียงจากเวลาล่าสุดไปเก่าสุด และเลือก 10 รายการล่าสุด
      const latestRecords = [...filteredData]
        .sort((a, b) => {
          const timeA = new Date(a.scan_time).getTime();
          const timeB = new Date(b.scan_time).getTime();

          return timeB - timeA;
        })
        .slice(0, 10);

      setRecords(latestRecords);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;

      console.error("HistoryDefect fetch error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Load data failed"
      );
    } finally {
      requestInProgressRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedOption]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return format(date, "yyyy-MM-dd HH:mm:ss");
  };

  const columns = [
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      key: "material_barcode",
      width: 220,
      ellipsis: true,
      render: (value) => (
        <Text className="history-barcode">{value || "-"}</Text>
      ),
    },
    {
      title: "Reason - Location",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (value) => (
        <div className="history-station">{value || "-"}</div>
      ),
    },
    {
      title: "Scan Time",
      dataIndex: "scan_time",
      key: "scan_time",
      width: 180,
      render: (value) => (
        <span className="history-time">
          {formatDateTime(value)}
        </span>
      ),
    },
    {
      title: "Scan By",
      dataIndex: "user_id",
      key: "user_id",
      width: 120,
      align: "center",
      render: (value) => value || "-",
    },
  ];

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div className="history-heading">
          <HistoryOutlined className="history-heading-icon" />

          <span>Defect Scan History</span>

          <Tag color="red">
            Line {selectedOption || "-"}
          </Tag>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 10 }}
        />
      )}

      {/* Table */}
      <Spin spinning={loading} tip="Loading...">
        <div className="history-table-wrapper">
          <Table
            className="history-table"
            rowKey={(record, index) =>
              `${record.material_barcode ?? ""}-${record.scan_time ?? ""}-${record.user_id ?? ""}-${index}`
            }
            columns={columns}
            dataSource={records}
            size="small"
            bordered={false}
            pagination={false}
            scroll={{ x: 735, y: 280 }}
            sticky
            rowClassName={(_, index) =>
              index === 0 ? "history-row-latest" : ""
            }
            locale={{ emptyText: "No defect history found" }}
          />
        </div>
      </Spin>

      {/* Footer */}
      <div className="history-footer">
        <span>{records.length} records</span>
        <span>Auto refresh: 5 seconds</span>
      </div>
    </div>
  );
}

export default HistoryDefect;