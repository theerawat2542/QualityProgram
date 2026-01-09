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
  Badge,
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_URL } from "../../lib/config";
import Navbar from "../Navbar/Navbar";

const { RangePicker } = DatePicker;
const { Title } = Typography;

/* ================= Column Search ================= */

const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={confirm}
        style={{ marginBottom: 8 }}
      />
      <Space>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          size="small"
          onClick={confirm}
        >
          Search
        </Button>
        <Button
          size="small"
          onClick={() => {
            clearFilters();
            confirm();
          }}
        >
          Reset
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered) => (
    <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
  ),
  onFilter: (value, record) =>
    record[dataIndex]
      ?.toString()
      .toLowerCase()
      .includes(value.toLowerCase()),
});

/* ================= Component ================= */

function Safety() {
  const [dateRange, setDateRange] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= Summary ================= */

  const summary = useMemo(() => {
    const total = data.length;
    const qualified = data.filter(
      (i) => i.TestResult === "Qualified"
    ).length;
    const unqualified = total - qualified;

    return { total, qualified, unqualified };
  }, [data]);

  /* ================= Fetch ================= */

  const fetchSafetyData = async () => {
    if (dateRange.length !== 2) {
      message.warning("Please select date range");
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
      setData(res.data || []);
    } catch {
      message.error("Failed to load safety data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= Export ================= */

  const handleExport = () => {
    if (!data.length) {
      message.warning("No data to export");
      return;
    }

    const exportData = data.map((i) => ({
      Line: i.LineCode,
      Order: i.Order,
      Barcode: i.Barcode,
      "Mat Code": i.MatCode,
      "Mat Desc": i.MatDesc,
      Station: i.StationCode,
      "Test Time": i.TestTime
        ? dayjs(i.TestTime).format("YYYY-MM-DD HH:mm:ss")
        : "",
      Result: i.TestResult,
      "Create By": i.CreateBy,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SafetyTest");
    XLSX.writeFile(wb, "SafetyTest_report.xlsx");
  };

  /* ================= Columns ================= */

  const columns = [
    { title: "Line", dataIndex: "LineCode", width: 80, ...getColumnSearchProps("LineCode") },
    { title: "Order", dataIndex: "Order", width: 140, ellipsis: true, ...getColumnSearchProps("Order") },
    { title: "Barcode", dataIndex: "Barcode", width: 200, ellipsis: true, ...getColumnSearchProps("Barcode") },
    { title: "Mat Code", dataIndex: "MatCode", width: 140, ellipsis: true, ...getColumnSearchProps("MatCode") },
    { title: "Mat Desc", dataIndex: "MatDesc", width: 220, ellipsis: true, ...getColumnSearchProps("MatDesc") },
    { title: "Station", dataIndex: "StationCode", width: 120 },
    {
      title: "Test Time",
      dataIndex: "TestTime",
      width: 170,
      render: (v) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-"),
    },
    {
      title: "Result",
      dataIndex: "TestResult",
      width: 130,
      render: (v) =>
        v === "Qualified" ? (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Qualified
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="red">
            Unqualified
          </Tag>
        ),
    },
    { title: "Create By", dataIndex: "CreateBy", width: 120, ellipsis: true },
  ];

  /* ================= Render ================= */

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Navbar />

      <Card style={{ margin: 16 }} bordered={false}>
        {/* Header */}
        <Space>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Safety Test
          </Title>
        </Space>

        <Divider />

        {/* Summary */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="Total Records"
              value={summary.total}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Qualified"
              value={summary.qualified}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Unqualified"
              value={summary.unqualified}
              valueStyle={{ color: "#cf1322" }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
        </Row>

        {/* Toolbar */}
        <Space wrap style={{ marginBottom: 16 }}>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchSafetyData}>
            Search
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => {
            setData([]);
            setDateRange([]);
            message.success("Cleared date and table data");
          }}>
            Clear
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        </Space>

        {/* Table */}
        <Table
          rowKey={(r) => r.Key}
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          sticky
          size="middle"
          scroll={{ x: 1300, y: 520 }}
          rowClassName={(r, i) =>
            r.TestResult === "Unqualified"
              ? "row-error"
              : i % 2 === 0
              ? "row-even"
              : "row-odd"
          }
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100", "200"],
            defaultPageSize: 20,
          }}
        />
      </Card>
    </div>
  );
}

export default Safety;
