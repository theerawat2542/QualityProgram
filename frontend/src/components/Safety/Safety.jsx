/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  DatePicker,
  Button,
  message,
  Tag,
  Input,
  Space,
  Card,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_URL } from "../../lib/config";
import Navbar from "../Navbar/Navbar";
import "./SafetyBarcode.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/* ================= Helpers ================= */

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = dayjs(value);

  return date.isValid()
    ? date.format("YYYY-MM-DD HH:mm:ss")
    : String(value);
};

const normalizeResult = (value) => {
  const result = String(value ?? "").trim().toUpperCase();

  if (["QUALIFIED", "OK", "PASS"].includes(result)) {
    return "Qualified";
  }

  if (["UNQUALIFIED", "NG", "FAIL"].includes(result)) {
    return "Unqualified";
  }

  return result || "Unknown";
};

/* ================= Column Search ================= */

const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }) => (
    <div className="safety-filter-dropdown">
      <Input
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0] || ""}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        allowClear
        autoFocus
      />

      <Space className="safety-filter-actions">
        <Button
          type="primary"
          icon={<SearchOutlined />}
          size="small"
          onClick={() => confirm()}
        >
          Search
        </Button>

        <Button
          size="small"
          onClick={() => {
            clearFilters?.();
            setSelectedKeys([]);
            confirm();
          }}
        >
          Reset
        </Button>
      </Space>
    </div>
  ),

  filterIcon: (filtered) => (
    <SearchOutlined
      style={{ color: filtered ? "#1677ff" : undefined }}
    />
  ),

  onFilter: (value, record) =>
    String(record[dataIndex] ?? "")
      .toLowerCase()
      .includes(String(value ?? "").toLowerCase()),
});

/* ================= Component ================= */

function Safety() {
  const [dateRange, setDateRange] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  /* ================= Summary ================= */

  const summary = useMemo(() => {
    const qualified = data.filter(
      (item) => item.TestResult === "Qualified"
    ).length;

    const unqualified = data.filter(
      (item) => item.TestResult === "Unqualified"
    ).length;

    return {
      total: data.length,
      qualified,
      unqualified,
      other: data.length - qualified - unqualified,
    };
  }, [data]);

  const filteredData = useMemo(
    () =>
      statusFilter === null
        ? data
        : data.filter((item) => item.TestResult === statusFilter),
    [data, statusFilter]
  );

  /* ================= Fetch ================= */

  const fetchSafetyData = async () => {
    if (
      !dateRange ||
      dateRange.length !== 2 ||
      !dateRange[0] ||
      !dateRange[1]
    ) {
      message.warning("Please select a date range before searching.");
      return;
    }

    try {
      setLoading(true);

      const [start, end] = dateRange;

      const res = await axios.get(`${API_URL}/safety`, {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });

      const result = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : null;

      if (!result) {
        throw new Error("Invalid response format");
      }

      const mapped = result.map((item, index) => ({
        ...item,
        key: item.Key ?? item.key ?? item.Id ?? item.id ?? `${item.Barcode ?? "safety"}-${item.TestTime ?? "no-time"}-${index}`,
        TestResult: normalizeResult(item.TestResult),
      }));

      setData(mapped);
      setStatusFilter(null);

      if (mapped.length === 0) {
        message.info("No records found for the selected date range.");
      } else {
        message.success(`Found ${mapped.length} records.`);
      }
    } catch (error) {
      console.error("Safety Test fetch error:", error);
      setData([]);
      setStatusFilter(null);

      message.error(
        error.response?.data?.message ||
          "Failed to load Safety Test data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= Clear ================= */

  const handleClear = () => {
    setData([]);
    setDateRange([]);
    setStatusFilter(null);
    message.success("Date range and table data cleared.");
  };

  /* ================= Export ================= */

  const handleExport = () => {
    if (filteredData.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const exportData = filteredData.map((item) => ({
      Line: item.LineCode ?? "",
      Order: item.Order ?? "",
      Barcode: item.Barcode ?? "",
      "Mat Code": item.MatCode ?? "",
      "Mat Desc": item.MatDesc ?? "",
      Station: item.StationCode ?? "",
      "Test Time": item.TestTime
        ? formatDateTime(item.TestTime)
        : "",
      Result: item.TestResult ?? "",
      "Create By": item.CreateBy ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 28 },
      { wch: 20 },
      { wch: 32 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "SafetyTest");

    const startText = dateRange?.[0]?.format("YYYYMMDD") ?? "All";
    const endText = dateRange?.[1]?.format("YYYYMMDD") ?? "Data";
    const statusText = statusFilter
      ? `_${statusFilter.replace(/\s+/g, "")}`
      : "";

    XLSX.writeFile(
      workbook,
      `SafetyTest_Report_${startText}_${endText}${statusText}.xlsx`
    );

    message.success(`Exported ${exportData.length} records successfully.`);
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Line",
      dataIndex: "LineCode",
      key: "LineCode",
      width: 110,
      ...getColumnSearchProps("LineCode"),
      render: (value) => value || "-",
    },
    {
      title: "Order",
      dataIndex: "Order",
      key: "Order",
      width: 160,
      ellipsis: true,
      ...getColumnSearchProps("Order"),
      render: (value) => value || "-",
    },
    {
      title: "Barcode",
      dataIndex: "Barcode",
      key: "Barcode",
      width: 210,
      ellipsis: true,
      ...getColumnSearchProps("Barcode"),
      render: (value) => (
        <span className="safety-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Mat Code",
      dataIndex: "MatCode",
      key: "MatCode",
      width: 150,
      ellipsis: true,
      ...getColumnSearchProps("MatCode"),
      render: (value) => value || "-",
    },
    {
      title: "Mat Desc",
      dataIndex: "MatDesc",
      key: "MatDesc",
      width: 240,
      ellipsis: true,
      ...getColumnSearchProps("MatDesc"),
      render: (value) => value || "-",
    },
    {
      title: "Station",
      dataIndex: "StationCode",
      key: "StationCode",
      width: 130,
      ...getColumnSearchProps("StationCode"),
      render: (value) => value || "-",
    },
    {
      title: "Test Time",
      dataIndex: "TestTime",
      key: "TestTime",
      width: 195,
      sorter: (a, b) =>
        String(a.TestTime ?? "").localeCompare(String(b.TestTime ?? "")),
      render: (value) => (
        <span className="safety-datetime">
          {value ? formatDateTime(value) : "-"}
        </span>
      ),
    },
    {
      title: "Result",
      dataIndex: "TestResult",
      key: "TestResult",
      width: 155,
      align: "center",
      filters: [
        { text: "Qualified", value: "Qualified" },
        { text: "Unqualified", value: "Unqualified" },
        { text: "Unknown", value: "Unknown" },
      ],
      onFilter: (value, record) => record.TestResult === value,
      render: (value) => {
        if (value === "Qualified") {
          return (
            <Tag className="safety-status-tag safety-status-qualified">
              <CheckCircleOutlined />
              Qualified
            </Tag>
          );
        }

        if (value === "Unqualified") {
          return (
            <Tag className="safety-status-tag safety-status-unqualified">
              <CloseCircleOutlined />
              Unqualified
            </Tag>
          );
        }

        return (
          <Tag className="safety-status-tag safety-status-unknown">
            {value || "Unknown"}
          </Tag>
        );
      },
    },
    {
      title: "Create By",
      dataIndex: "CreateBy",
      key: "CreateBy",
      width: 150,
      ellipsis: true,
      ...getColumnSearchProps("CreateBy"),
      render: (value) => value || "-",
    },
  ];

  /* ================= Render ================= */

  return (
    <div className="safety-page">
      <Navbar />

      <main className="safety-main">
        {/* Header */}
        <div className="safety-header">
          <div className="safety-title-group">
            <div className="safety-title-icon">
              <SafetyCertificateOutlined />
            </div>

            <div>
              <Title level={3} className="safety-title">
                Safety Test
              </Title>
              {/* <Text className="safety-description">
                Safety inspection results and barcode tracking report
              </Text> */}
            </div>
          </div>

          {/* <div className="safety-module-label">
            <DatabaseOutlined />
            <span>PRODUCTION REPORT</span>
          </div> */}
        </div>

        {/* Toolbar */}
        <Card className="safety-toolbar-card" bordered={false}>
          <div className="safety-toolbar">
            <div className="safety-date-group">
              <div className="safety-field-label">
                <CalendarOutlined />
                <span>Date Range</span>
              </div>

              <RangePicker
                className="safety-date-picker"
                value={dateRange}
                onChange={(value) => setDateRange(value || [])}
                format="YYYY-MM-DD"
                placeholder={["Start date", "End date"]}
                allowClear
              />
            </div>

            <div className="safety-actions">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchSafetyData}
                loading={loading}
                className="safety-search-button"
              >
                Search
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                className="safety-clear-button"
              >
                Clear
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={filteredData.length === 0}
                className="safety-export-button"
              >
                Export Excel
              </Button>

              {statusFilter !== null && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setStatusFilter(null)}
                  className="safety-show-all-button"
                >
                  Show All
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Summary heading */}
        <div className="safety-summary-heading">
          <Text className="safety-section-title">Overview</Text>

          <Text className="safety-summary-note">
            {dateRange?.[0] && dateRange?.[1]
              ? `${dateRange[0].format("DD/MM/YYYY")} – ${dateRange[1].format(
                  "DD/MM/YYYY"
                )}`
              : "Summary of the currently loaded records"}
          </Text>
        </div>

        {/* Summary cards */}
        <Row gutter={[12, 12]} className="safety-summary">
          <Col xs={12} sm={12} md={6}>
            <Card className="safety-summary-card safety-total-card" bordered={false}>
              <div className="safety-stat-top">
                <span className="safety-stat-label">Total Records</span>
                <span className="safety-stat-icon safety-total-icon">
                  <DatabaseOutlined />
                </span>
              </div>
              <Statistic value={summary.total} />
              <div className="safety-stat-caption">All test records</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card
              className={`safety-summary-card safety-qualified-card ${
                statusFilter === "Qualified" ? "safety-card-active" : ""
              }`}
              bordered={false}
              onClick={() =>
                setStatusFilter((current) =>
                  current === "Qualified" ? null : "Qualified"
                )
              }
            >
              <div className="safety-stat-top">
                <span className="safety-stat-label">Qualified</span>
                <span className="safety-stat-icon safety-qualified-icon">
                  <CheckCircleOutlined />
                </span>
              </div>
              <Statistic value={summary.qualified} />
              <div className="safety-stat-caption">Passed test</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card
              className={`safety-summary-card safety-unqualified-card ${
                statusFilter === "Unqualified" ? "safety-card-active" : ""
              }`}
              bordered={false}
              onClick={() =>
                setStatusFilter((current) =>
                  current === "Unqualified" ? null : "Unqualified"
                )
              }
            >
              <div className="safety-stat-top">
                <span className="safety-stat-label">Unqualified</span>
                <span className="safety-stat-icon safety-unqualified-icon">
                  <CloseCircleOutlined />
                </span>
              </div>
              <Statistic value={summary.unqualified} />
              <div className="safety-stat-caption">Failed test</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="safety-summary-card safety-other-card" bordered={false}>
              <div className="safety-stat-top">
                <span className="safety-stat-label">Other Status</span>
                <span className="safety-stat-icon safety-other-icon">
                  <SafetyCertificateOutlined />
                </span>
              </div>
              <Statistic value={summary.other} />
              <div className="safety-stat-caption">Other or unknown results</div>
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card className="safety-table-card" bordered={false}>
          <div className="safety-table-heading">
            <div>
              <Title level={5} className="safety-table-title">
                Safety Test Records
              </Title>
              <Text className="safety-table-caption">
                Search, filter and export safety test results
              </Text>
            </div>

            <div className="safety-table-count">
              <DatabaseOutlined />
              <span>{filteredData.length.toLocaleString()} records</span>
            </div>
          </div>

          <Divider className="safety-table-divider" />

          <Table
            className="safety-table"
            rowKey="key"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            bordered={false}
            sticky
            size="middle"
            scroll={{ x: 1450, y: 520 }}
            rowClassName={(record) =>
              record.TestResult === "Unqualified"
                ? "safety-row-error"
                : ""
            }
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              defaultPageSize: 20,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} records`,
            }}
            locale={{
              emptyText: (
                <div className="safety-empty">
                  <DatabaseOutlined />
                  <div className="safety-empty-title">No Data Available</div>
                  <div className="safety-empty-description">
                    Select a date range and click Search to load records.
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        <div className="safety-footer">
          <span>Safety Test Report</span>
          <span>Production Monitoring System</span>
        </div>
      </main>
    </div>
  );
}

export default Safety;