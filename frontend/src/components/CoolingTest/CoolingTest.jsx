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
  Card,
  Space,
  Typography,
  Divider,
  Statistic,
  Row,
  Col,
  Input,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
  FireOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";
import "./CoolingBarcode.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/* ================= Helpers ================= */

const normalizeStatus = (value) => {
  const status = String(value ?? "").trim().toUpperCase();

  if (["OK", "PASS", "QUALIFIED"].includes(status)) {
    return "Qualified";
  }

  if (["NG", "FAIL", "UNQUALIFIED"].includes(status)) {
    return "Unqualified";
  }

  return status || "Unknown";
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = dayjs(value);

  return date.isValid()
    ? date.format("YYYY-MM-DD HH:mm:ss")
    : String(value);
};

/* ================= Column Search ================= */

const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }) => (
    <div className="cooling-filter-dropdown">
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

      <Space className="cooling-filter-actions">
        <Button
          type="primary"
          size="small"
          icon={<SearchOutlined />}
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

function Cooling() {
  const [dateRange, setDateRange] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  /* ================= Fetch ================= */

  const fetchData = async () => {
    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) {
      message.warning("Please select a date range before searching.");
      return;
    }

    const [start, end] = dateRange;

    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/coolingtest`, {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });

      if (!Array.isArray(res.data)) {
        throw new Error("Invalid response format");
      }

      const mapped = res.data.map((record, index) => ({
        ...record,
        key: `${record.barcode ?? "no-barcode"}-${record.StartTime ?? "no-time"}-${record.TestNo ?? index}-${index}`,
        TestResult: normalizeStatus(record.TestResult),
        StartTime: formatDateTime(record.StartTime),
        TestedTime: formatDateTime(record.TestedTime),
      }));

      setData(mapped);
      setStatusFilter(null);

      if (mapped.length === 0) {
        message.info("No records found for the selected date range.");
      } else {
        message.success(`Found ${mapped.length} records.`);
      }
    } catch (error) {
      console.error("Cooling Test fetch error:", error);

      setData([]);
      setStatusFilter(null);

      message.error(
        error.response?.data?.message ||
          "Unable to load Cooling Test data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= Clear ================= */

  const handleClear = () => {
    setDateRange(null);
    setData([]);
    setStatusFilter(null);
    message.success("Date range and table data cleared.");
  };

  /* ================= Summary ================= */

  const summary = useMemo(() => {
    const qualified = data.filter(
      (record) => record.TestResult === "Qualified"
    ).length;

    const unqualified = data.filter(
      (record) => record.TestResult === "Unqualified"
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
        : data.filter((record) => record.TestResult === statusFilter),
    [data, statusFilter]
  );

  /* ================= Export ================= */

  const handleExport = () => {
    if (filteredData.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const exportData = filteredData.map((record) => ({
      Line: record.WorkUser_LineName ?? "",
      Model: record.model ?? "",
      "Order No": record.WorkUser_MOrderCode ?? "",
      Barcode: record.barcode ?? "",
      "Date / Time": record.StartTime ?? "",
      Status: record.TestResult ?? "",
      WorkStation: record.WorkStationNo ?? "",
      "Line No": record.LineNo ?? "",
      "Post No": record.PostNo ?? "",
      "Test No": record.TestNo ?? "",
      "Tested Time": record.TestedTime ?? "",
      Remark: record.Remark ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 26 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 22 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "CoolingTest");

    const startText = dateRange?.[0]?.format("YYYYMMDD") ?? "All";
    const endText = dateRange?.[1]?.format("YYYYMMDD") ?? "Data";
    const statusText = statusFilter
      ? `_${statusFilter.replace(/\s+/g, "")}`
      : "";

    XLSX.writeFile(
      workbook,
      `CoolingTest_Report_${startText}_${endText}${statusText}.xlsx`
    );

    message.success(`Exported ${exportData.length} records successfully.`);
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      width: 140,
      ...getColumnSearchProps("WorkUser_LineName"),
      render: (value) => value || "-",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 160,
      ...getColumnSearchProps("model"),
      render: (value) => value || "-",
    },
    {
      title: "Order No",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      width: 170,
      ...getColumnSearchProps("WorkUser_MOrderCode"),
      render: (value) => value || "-",
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      width: 210,
      ellipsis: true,
      ...getColumnSearchProps("barcode"),
      render: (value) => (
        <span className="cooling-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Date / Time",
      dataIndex: "StartTime",
      key: "StartTime",
      width: 195,
      sorter: (a, b) =>
        String(a.StartTime ?? "").localeCompare(String(b.StartTime ?? "")),
      render: (value) => (
        <span className="cooling-datetime">{value || "-"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "TestResult",
      key: "TestResult",
      width: 150,
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
            <Tag className="cooling-status-tag cooling-status-qualified">
              <CheckCircleOutlined />
              Qualified
            </Tag>
          );
        }

        if (value === "Unqualified") {
          return (
            <Tag className="cooling-status-tag cooling-status-unqualified">
              <CloseCircleOutlined />
              Unqualified
            </Tag>
          );
        }

        return (
          <Tag className="cooling-status-tag cooling-status-unknown">
            {value || "Unknown"}
          </Tag>
        );
      },
    },
    {
      title: "WorkStation",
      dataIndex: "WorkStationNo",
      key: "WorkStationNo",
      width: 150,
      ...getColumnSearchProps("WorkStationNo"),
      render: (value) => value || "-",
    },
    {
      title: "Line No",
      dataIndex: "LineNo",
      key: "LineNo",
      width: 100,
      ...getColumnSearchProps("LineNo"),
      render: (value) => value ?? "-",
    },
    {
      title: "Post No",
      dataIndex: "PostNo",
      key: "PostNo",
      width: 100,
      ...getColumnSearchProps("PostNo"),
      render: (value) => value ?? "-",
    },
    {
      title: "Test No",
      dataIndex: "TestNo",
      key: "TestNo",
      width: 100,
      ...getColumnSearchProps("TestNo"),
      render: (value) => value ?? "-",
    },
    {
      title: "Tested Time",
      dataIndex: "TestedTime",
      key: "TestedTime",
      width: 195,
      sorter: (a, b) =>
        String(a.TestedTime ?? "").localeCompare(String(b.TestedTime ?? "")),
      render: (value) => (
        <span className="cooling-datetime">{value || "-"}</span>
      ),
    },
    {
      title: "Remark",
      dataIndex: "Remark",
      key: "Remark",
      width: 250,
      ellipsis: true,
      ...getColumnSearchProps("Remark"),
      render: (value) => value || "-",
    },
  ];

  /* ================= Render ================= */

  return (
    <div className="cooling-page">
      <Navbar />

      <main className="cooling-main">
        {/* Page Header */}
        <div className="cooling-header">
          <div className="cooling-title-group">
            <div className="cooling-title-icon">
              <FireOutlined />
            </div>

            <div>
              <Title level={3} className="cooling-title">
                Cooling Test
              </Title>
              {/* <Text className="cooling-description">
                Cooling performance inspection and test result report
              </Text> */}
            </div>
          </div>

          {/* <div className="cooling-module-label">
            <DatabaseOutlined />
            <span>PRODUCTION REPORT</span>
          </div> */}
        </div>

        {/* Toolbar */}
        <Card className="cooling-toolbar-card" bordered={false}>
          <div className="cooling-toolbar">
            <div className="cooling-date-group">
              <div className="cooling-field-label">
                <CalendarOutlined />
                <span>Date Range</span>
              </div>

              <RangePicker
                className="cooling-date-picker"
                value={dateRange}
                onChange={(value) => setDateRange(value)}
                format="YYYY-MM-DD"
                placeholder={["Start date", "End date"]}
                allowClear
              />
            </div>

            <div className="cooling-actions">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchData}
                loading={loading}
                className="cooling-search-button"
              >
                Search
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                className="cooling-clear-button"
              >
                Clear
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={filteredData.length === 0}
                className="cooling-export-button"
              >
                Export Excel
              </Button>

              {statusFilter !== null && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setStatusFilter(null)}
                  className="cooling-show-all-button"
                >
                  Show All
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="cooling-summary-heading">
          <Text className="cooling-section-title">Overview</Text>

          <Text className="cooling-summary-note">
            {dateRange?.[0] && dateRange?.[1]
              ? `${dateRange[0].format("DD/MM/YYYY")} – ${dateRange[1].format(
                  "DD/MM/YYYY"
                )}`
              : "Summary of the currently loaded records"}
          </Text>
        </div>

        <Row gutter={[12, 12]} className="cooling-summary">
          <Col xs={12} sm={12} md={6}>
            <Card className="cooling-summary-card cooling-total-card" bordered={false}>
              <div className="cooling-stat-top">
                <span className="cooling-stat-label">Total Records</span>
                <span className="cooling-stat-icon cooling-total-icon">
                  <DatabaseOutlined />
                </span>
              </div>
              <Statistic value={summary.total} />
              <div className="cooling-stat-caption">All test records</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card
              className={`cooling-summary-card cooling-qualified-card ${
                statusFilter === "Qualified" ? "cooling-card-active" : ""
              }`}
              bordered={false}
              onClick={() =>
                setStatusFilter((current) =>
                  current === "Qualified" ? null : "Qualified"
                )
              }
            >
              <div className="cooling-stat-top">
                <span className="cooling-stat-label">Qualified</span>
                <span className="cooling-stat-icon cooling-qualified-icon">
                  <CheckCircleOutlined />
                </span>
              </div>
              <Statistic value={summary.qualified} />
              <div className="cooling-stat-caption">Passed test</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card
              className={`cooling-summary-card cooling-unqualified-card ${
                statusFilter === "Unqualified" ? "cooling-card-active" : ""
              }`}
              bordered={false}
              onClick={() =>
                setStatusFilter((current) =>
                  current === "Unqualified" ? null : "Unqualified"
                )
              }
            >
              <div className="cooling-stat-top">
                <span className="cooling-stat-label">Unqualified</span>
                <span className="cooling-stat-icon cooling-unqualified-icon">
                  <CloseCircleOutlined />
                </span>
              </div>
              <Statistic value={summary.unqualified} />
              <div className="cooling-stat-caption">Failed test</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="cooling-summary-card cooling-other-card" bordered={false}>
              <div className="cooling-stat-top">
                <span className="cooling-stat-label">Other Status</span>
                <span className="cooling-stat-icon cooling-other-icon">
                  <FireOutlined />
                </span>
              </div>
              <Statistic value={summary.other} />
              <div className="cooling-stat-caption">Other or unknown results</div>
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card className="cooling-table-card" bordered={false}>
          <div className="cooling-table-heading">
            <div>
              <Title level={5} className="cooling-table-title">
                Cooling Test Records
              </Title>
              <Text className="cooling-table-caption">
                Search, filter and export cooling test results
              </Text>
            </div>

            <div className="cooling-table-count">
              <DatabaseOutlined />
              <span>{filteredData.length.toLocaleString()} records</span>
            </div>
          </div>

          <Divider className="cooling-table-divider" />

          <Table
            className="cooling-table"
            rowKey="key"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            bordered={false}
            size="middle"
            scroll={{ x: 1900, y: 520 }}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              defaultPageSize: 20,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} records`,
            }}
            locale={{
              emptyText: (
                <div className="cooling-empty">
                  <DatabaseOutlined />
                  <div className="cooling-empty-title">
                    No Data Available
                  </div>
                  <div className="cooling-empty-description">
                    Select a date range and click Search to load records.
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        <div className="cooling-footer">
          <span>Cooling Test Report</span>
          <span>Production Monitoring System</span>
        </div>
      </main>
    </div>
  );
}

export default Cooling;