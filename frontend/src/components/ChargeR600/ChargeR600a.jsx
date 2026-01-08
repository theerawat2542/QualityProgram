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
  Statistic,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_URL } from "../../lib/config";
import Navbar from "../Navbar/Navbar";

const { RangePicker } = DatePicker;
const { Title } = Typography;

/* ================= Column Search Helper ================= */

const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8 }}
      />
      <Space>
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

function Charge() {
  const [dateRange, setDateRange] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= Fetch ================= */

  const fetchChargeData = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning("Please select date range");
      return;
    }

    try {
      setLoading(true);
      const [start, end] = dateRange;

      const res = await axios.get(`${API_URL}/oilcharger`, {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });

      const mapped = (res.data || []).map((r, idx) => ({
        ...r,
        key: idx,
        datetime: r.datetime
          ? dayjs(r.datetime).format("YYYY-MM-DD HH:mm:ss")
          : "-",
      }));

      setData(mapped);
    } catch (err) {
      message.info("No data in selected date range");
    } finally {
      setLoading(false);
    }
  };

  /* ================= Dashboard Summary ================= */

  const summary = useMemo(() => {
    const total = data.length;
    const ok = data.filter((d) => d.status === "OK").length;
    const ng = total - ok;
    const alarm = data.filter((d) => d.alarm && d.alarm !== "").length;

    return { total, ok, ng, alarm };
  }, [data]);

  /* ================= Clear ================= */

  const handleClear = () => {
    setDateRange([]);
    setData([]);
    message.success("Cleared date and table data");
  };

  /* ================= Export ================= */

  const handleExport = () => {
    if (data.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = data.map((d) => ({
      Line: d.WorkUser_LineName,
      Model: d.model,
      "Order No": d.WorkUser_MOrderCode,
      Barcode: d.barcode,
      "Date/Time": d.datetime,
      Program: d.program,
      "R600 Setpoint": d.r600_setpoint,
      "R600 Actum": d.r600_actum,
      Status: d.status,
      Alarm: d.alarm,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ChargeR600a");
    XLSX.writeFile(wb, "ChargeR600a_report.xlsx");
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Line",
      dataIndex: "WorkUser_LineName",
      width: 150,
      ...getColumnSearchProps("WorkUser_LineName"),
    },
    {
      title: "Model",
      dataIndex: "model",
      width: 120,
      ...getColumnSearchProps("model"),
    },
    {
      title: "Order No",
      dataIndex: "WorkUser_MOrderCode",
      width: 160,
      ...getColumnSearchProps("WorkUser_MOrderCode"),
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      width: 200,
      ellipsis: true,
      ...getColumnSearchProps("barcode"),
    },
    {
      title: "Date / Time",
      dataIndex: "datetime",
      width: 180,
    },
    {
      title: "Program",
      dataIndex: "program",
      width: 120,
    },
    {
      title: "R600 Setpoint",
      dataIndex: "r600_setpoint",
      width: 130,
    },
    {
      title: "R600 Actum",
      dataIndex: "r600_actum",
      width: 130,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (v) =>
        v === "OK" ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">{v}</Tag>
        ),
    },
    {
      title: "Alarm",
      dataIndex: "alarm",
      width: 200,
      ellipsis: true,
    },
  ];

  /* ================= Render ================= */

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Navbar />

      <Card style={{ margin: 16 }} bordered={false} styles={{ body: { padding: 24 } }}>
        {/* ===== Header ===== */}
        <Space align="center">
          <ThunderboltOutlined style={{ fontSize: 28, color: "#fa8c16" }} />
          <Title level={3} style={{ margin: 0 }}>
            Charge R600a
          </Title>
        </Space>

        <Divider />

        {/* ===== Toolbar ===== */}
        <Space wrap style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            format="YYYY-MM-DD"
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={fetchChargeData}>
            Search
          </Button>

          <Button icon={<ClearOutlined />} onClick={handleClear}>
            Clear
          </Button>

          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        </Space>

        {/* ===== Dashboard ===== */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Records"
                value={summary.total}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="OK"
                value={summary.ok}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="NG"
                value={summary.ng}
                valueStyle={{ color: "#cf1322" }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Alarm"
                value={summary.alarm}
                valueStyle={{ color: "#fa8c16" }}
                prefix={<AlertOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* ===== Table ===== */}
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          size="middle"
          scroll={{ x: 1500, y: 520 }}
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

export default Charge;
