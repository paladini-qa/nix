import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Transaction } from "../types";

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
];

const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const expenses = transactions.filter((t) => t.type === "expense");

  if (expenses.length === 0) return null;

  // Group by category
  const dataMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(dataMap).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  // Sort by value desc
  data.sort((a, b) => b.value - a.value);

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Expenses by Category
      </Typography>
      <Box sx={{ height: 280, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#fff",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default Charts;
