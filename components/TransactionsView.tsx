import React, { useState, useMemo, useRef } from "react";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Download,
  Plus,
  Repeat,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Pencil,
  Trash2,
  CreditCard,
} from "lucide-react";

interface TransactionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onNewTransaction,
  onEdit,
  onDelete,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Close export menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic specific to this view
  const filteredData = useMemo(() => {
    return transactions
      .filter((t) => {
        const [y, m] = t.date.split("-");
        const matchesDate =
          parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, selectedYear, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };

  const getFileName = () => {
    return `nix-transactions-${MONTHS[selectedMonth]}-${selectedYear}`;
  };

  // Helper to escape CSV fields properly
  const escapeCSVField = (field: string | number): string => {
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = [
      "Date",
      "Description",
      "Category",
      "Payment Method",
      "Type",
      "Amount",
    ];
    const rows = filteredData.map((t) => [
      escapeCSVField(t.date),
      escapeCSVField(t.description),
      escapeCSVField(t.category),
      escapeCSVField(t.paymentMethod),
      escapeCSVField(t.type === "income" ? "Income" : "Expense"),
      escapeCSVField(t.type === "expense" ? -t.amount : t.amount),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${getFileName()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export to XLSX
  const exportToXLSX = async () => {
    if (filteredData.length === 0) {
      alert("No transactions to export.");
      return;
    }

    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");

      const data = filteredData.map((t) => ({
        Date: t.date,
        Description: t.description,
        Category: t.category,
        "Payment Method": t.paymentMethod,
        Type: t.type === "income" ? "Income" : "Expense",
        Amount: t.type === "expense" ? -t.amount : t.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 40 }, // Description
        { wch: 15 }, // Category
        { wch: 18 }, // Payment Method
        { wch: 10 }, // Type
        { wch: 15 }, // Amount
      ];
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, `${getFileName()}.xlsx`);
    } catch (error) {
      console.error("Error exporting to XLSX:", error);
      alert("Error exporting to XLSX. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (filteredData.length === 0) {
      alert("No transactions to export.");
      return;
    }

    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("Nix - Financial Report", 14, 22);

      // Period info
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Period: ${MONTHS[selectedMonth]} ${selectedYear}`, 14, 32);

      // Calculate totals
      const totalIncome = filteredData
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = filteredData
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;

      // Summary
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(`Income: ${formatCurrency(totalIncome)}`, 14, 42);
      doc.setTextColor(236, 72, 153); // Pink
      doc.text(`Expenses: ${formatCurrency(totalExpense)}`, 70, 42);
      doc.setTextColor(
        balance >= 0 ? 16 : 239,
        balance >= 0 ? 185 : 68,
        balance >= 0 ? 129 : 68
      );
      doc.text(`Balance: ${formatCurrency(balance)}`, 140, 42);

      // Table data
      const tableData = filteredData.map((t) => [
        formatDate(t.date),
        t.description.substring(0, 35) +
          (t.description.length > 35 ? "..." : ""),
        t.category,
        t.paymentMethod,
        t.type === "income" ? "Income" : "Expense",
        (t.type === "expense" ? "- " : "+ ") + formatCurrency(t.amount),
      ]);

      // Add table
      (doc as any).autoTable({
        startY: 50,
        head: [["Date", "Description", "Category", "Method", "Type", "Amount"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 50 },
          2: { cellWidth: 28 },
          3: { cellWidth: 30 },
          4: { cellWidth: 18 },
          5: { cellWidth: 28, halign: "right" },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated by Nix - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      doc.save(`${getFileName()}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Error exporting to PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            All Transactions
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Detailed spreadsheet view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* New Transaction Button */}
          <button
            onClick={onNewTransaction}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3 sm:px-4 py-2 rounded-lg transition-all shadow-sm font-medium whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Transaction</span>
          </button>

          {/* Search - Full width on mobile */}
          <div className="relative flex-1 sm:flex-initial order-last sm:order-none w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white w-full sm:w-40 lg:w-48"
            />
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-gray-400"
            />
          </div>

          {/* Filters - Compact on mobile */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-2 sm:px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>
                {m.substring(0, 3)}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-2 sm:px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || filteredData.length === 0}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export"
            >
              {isExporting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Download size={18} />
              )}
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-white/10 py-1 z-50 animate-fade-in">
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <FileText size={16} className="text-green-600" />
                  Export as CSV
                </button>
                <button
                  onClick={exportToXLSX}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-emerald-600" />
                  Export as XLSX
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <FileText size={16} className="text-red-600" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spreadsheet Style Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 shadow-sm overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold border-b-2 border-gray-300 dark:border-slate-600">
              <tr>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700 w-28">
                  Date
                </th>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700">
                  Description
                </th>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700 w-36">
                  Category
                </th>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700 w-36">
                  Method
                </th>
                <th className="p-2 text-center border-r border-gray-300 dark:border-slate-700 w-20">
                  Type
                </th>
                <th className="p-2 text-right border-r border-gray-300 dark:border-slate-700 w-32">
                  Amount
                </th>
                <th className="p-2 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredData.length > 0 ? (
                filteredData.map((t, index) => (
                  <tr
                    key={t.id}
                    className={`${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-gray-50 dark:bg-slate-800/50"
                    } hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition-colors`}
                  >
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-mono text-xs">
                      {formatDate(t.date)}
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center truncate max-w-xs">
                          {t.description}
                          {t.isRecurring && (
                            <span
                              title={`Recurring: ${
                                t.frequency === "monthly" ? "Monthly" : "Yearly"
                              }`}
                              className="ml-2 text-indigo-500"
                            >
                              <Repeat size={14} />
                            </span>
                          )}
                        </div>
                        {t.installments && t.installments > 1 && (
                          <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide mt-0.5">
                            <CreditCard size={10} className="mr-1" />
                            {t.currentInstallment || 1}/{t.installments}x
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 text-xs">
                      {t.paymentMethod}
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-center">
                      {t.type === "income" ? (
                        <span className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <ArrowUpCircle size={16} />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center text-red-600 dark:text-fuchsia-400">
                          <ArrowDownCircle size={16} />
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-2 text-right font-mono font-medium border-r border-gray-200 dark:border-slate-700 ${
                        t.type === "income"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-fuchsia-400"
                      }`}
                    >
                      {t.type === "expense" && "- "}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(t)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-gray-500 dark:text-slate-400 italic"
                  >
                    No transactions found with the current filters.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 dark:bg-slate-800 font-semibold border-t-2 border-gray-300 dark:border-slate-600">
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 text-right border-r border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300"
                  >
                    Filtered Total:
                  </td>
                  <td className="p-2 text-right border-r border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-mono">
                    {formatCurrency(
                      filteredData.reduce(
                        (acc, curr) =>
                          curr.type === "income"
                            ? acc + curr.amount
                            : acc - curr.amount,
                        0
                      )
                    )}
                  </td>
                  <td className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
