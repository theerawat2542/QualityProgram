
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Tag } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./CoolingTracking.css";

const CoolingBarcode = ({ barcode }) => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;

    const fetchData = async () => {
      if (!barcode || requestInProgress) return;

      requestInProgress = true;
      setLoading(true);

      try {
        const response = await axios.get(
          `${API_URL}/barcode_coolingtest`,
          {
            params: { barcode },
          }
        );

        if (!cancelled) {
          setRecords(
            Array.isArray(response.data) ? response.data : []
          );
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to fetch Cooling Test data"
          );
        }
      } finally {
        requestInProgress = false;

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [barcode]);

  const columns = [
    {
      title: "Barcode",
      dataIndex: "Barcode",
      key: "Barcode",
      fixed: "left",
      ellipsis: true,
    },
    {
      title: "Line",
      dataIndex: "LineCode",
      key: "LineCode",
      align: "center",
    },
    {
      title: "Order No.",
      dataIndex: "Order",
      key: "Order",
      align: "center",
    },
    {
      title: "Date / Time",
      dataIndex: "TestTime",
      key: "TestTime",
      align: "center",
      render: (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return String(value);
        }

        return format(date, "yyyy-MM-dd HH:mm:ss");
      },
    },
    {
      title: "Status",
      dataIndex: "TestResult",
      key: "TestResult",
      align: "center",
      render: (result) => {
        const normalizedResult = String(result ?? "")
          .trim()
          .toUpperCase();

        if (
          normalizedResult === "PASS" ||
          normalizedResult === "QUALIFIED"
        ) {
          return <Tag color="green">{normalizedResult}</Tag>;
        }

        if (
          normalizedResult === "FAIL" ||
          normalizedResult === "UNQUALIFIED"
        ) {
          return <Tag color="red">{normalizedResult}</Tag>;
        }

        return <Tag color="default">{result || "-"}</Tag>;
      },
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
          loading={loading}
          pagination={false}
          size="middle"
          rowKey={(record, index) =>
            record.id ?? record.TestNo ?? index
          }
          scroll={{ y: 420, x: 1200 }}
          locale={{
            emptyText: error
              ? "Unable to load Cooling Test data"
              : "No Cooling Test data",
          }}
        />

        {error && (
          <div className="error-text">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoolingBarcode;
