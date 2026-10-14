/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import axios from "axios";
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";

import { Table, Typography, Tag, Spin, Alert, Button } from "antd";
import { ReloadOutlined, HistoryOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./History.css";

const { Text } = Typography;

const HistoryFinal = forwardRef(({ selectedOption }, ref) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const mountedRef = useRef(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (requestInProgressRef.current) return;

      requestInProgressRef.current = true;

      if (!silent) {
        setLoading(true);
        setRefreshing(true);
      }

      try {
        const res = await axios.get(`${API_URL}/HistoryFinal`);

        if (!mountedRef.current) return;

        const sourceData = Array.isArray(res.data) ? res.data : [];

        // กรองข้อมูลตาม Line ที่เลือก
        const filteredData = sourceData.filter(
          (item) =>
            String(item.barcode ?? "").charAt(12) ===
            String(selectedOption ?? "")
        );

        // เรียงจากเวลาล่าสุดไปเก่าสุด และแสดงเพียง 10 รายการ
        const latestRecords = [...filteredData]
          .sort((a, b) => {
            const timeA = new Date(a.scantime).getTime();
            const timeB = new Date(b.scantime).getTime();

            return timeB - timeA;
          })
          .slice(0, 10);

        setRecords(latestRecords);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("HistoryFinal fetch error:", err);

        if (!silent) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load history"
          );
        }
      } finally {
        requestInProgressRef.current = false;

        if (mountedRef.current && !silent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedOption]
  );

  useImperativeHandle(
    ref,
    () => ({
      fetchData: () => fetchData(false),
    }),
    [fetchData]
  );

  useEffect(() => {
    mountedRef.current = true;

    fetchData(false);

    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => {
      mountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  const columns = [
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      width: 200,
      ellipsis: true,
      render: (value) => (
        <Text className="history-barcode">{value || "-"}</Text>
      ),
    },
    {
      title: "Scan Time",
      dataIndex: "scantime",
      key: "scantime",
      width: 175,
      render: (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return String(value);
        }

        return (
          <span className="history-time">
            {format(date, "yyyy-MM-dd HH:mm:ss")}
          </span>
        );
      },
    },
    {
      title: "Station Scan",
      dataIndex: "station_scan",
      key: "station_scan",
      width: 260,
      render: (value) => (
        <div className="history-station">
          {value || "-"}
        </div>
      ),
    },
    {
      title: "Scan By",
      dataIndex: "user_id",
      key: "user_id",
      width: 100,
      align: "center",
      render: (value) => value || "-",
    },
  ];

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="history-heading">
          <HistoryOutlined className="history-heading-icon" />
          <span>Final Scan History</span>

          <Tag color={selectedOption === "A" ? "blue" : "green"}>
            Line {selectedOption || "-"}
          </Tag>
        </div>

        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => fetchData(false)}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

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

      <Spin spinning={loading} tip="Loading...">
        <div className="history-table-wrapper">
          <Table
            className="history-table"
            rowKey={(record, index) =>
              `${record.barcode ?? ""}-${record.scantime ?? ""}-${record.user_id ?? ""}-${index}`
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
            locale={{ emptyText: "No scan history found" }}
          />
        </div>
      </Spin>

      <div className="history-footer">
        <span>{records.length} records</span>
        <span>Auto refresh: 5 seconds</span>
      </div>
    </div>
  );
});

HistoryFinal.displayName = "HistoryFinal";

export default HistoryFinal;