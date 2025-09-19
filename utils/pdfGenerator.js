import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fontPathRegular = path.resolve(
  __dirname,
  "./Noto_Sans_Bengali/static/NotoSansBengali-Regular.ttf"
);
const fontPathBold = path.resolve(
  __dirname,
  "./Noto_Sans_Bengali/static/NotoSansBengali-Bold.ttf"
);

// Load both Noto Sans Bengali regular and bold fonts
const regularFont = fs.readFileSync(fontPathRegular, { encoding: "base64" });
const boldFont = fs.readFileSync(fontPathBold, { encoding: "base64" });

// This function generates a clean and professional dashboard report as a PDF.
export const generateDashboardPdf = (data) => {
  const doc = new jsPDF();

  // Add fonts to jsPDF's Virtual File System (VFS)
  doc.addFileToVFS("NotoSansBengali-Regular.ttf", regularFont);
  doc.addFileToVFS("NotoSansBengali-Bold.ttf", boldFont);

  // Register both fonts
  doc.addFont("NotoSansBengali-Regular.ttf", "NotoSansBengali", "normal");
  doc.addFont("NotoSansBengali-Bold.ttf", "NotoSansBengali", "bold");

  // Set the font to regular
  doc.setFont("NotoSansBengali");

  const { totalExpenses, totalDeposits, balance, deposits, expenses, meta } =
    data;

  let yPos = 15;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - 2 * margin;

  // Set up document-wide font and styles
  doc.setTextColor(51, 51, 51); // Dark grey for general text

  // --- Header Section ---
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204); // Vibrant blue for the main title
  doc.text("Dashboard Report", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150); // Lighter grey for subtitle
  doc.text("A summary of your financial activity.", margin, yPos);
  yPos += 10;

  doc.setTextColor(51, 51, 51); // Back to dark grey
  doc.text(
    `Report generated on: ${new Date().toLocaleDateString()}`,
    margin,
    yPos
  );
  yPos += 8;

  if (meta.startDate && meta.endDate) {
    doc.text(
      `Date Range: ${new Date(
        meta.startDate
      ).toLocaleDateString()} - ${new Date(meta.endDate).toLocaleDateString()}`,
      margin,
      yPos
    );
    yPos += 10;
  }
  yPos += 10;

  // --- Financial Summary Section ---
  doc.setFontSize(14);
  doc.setFont("NotoSansBengali", "bold");
  doc.setTextColor(0, 0, 0); // Black for summary labels
  doc.text("Financial Summary", margin, yPos);
  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  const summaryItemY = yPos;
  const itemHeight = 15;
  const itemSpacing = 5;

  // Total Deposits (light green background and green text)
  doc.setFillColor(240, 255, 240); // Light green background
  doc.roundedRect(
    margin,
    summaryItemY,
    tableWidth / 3 - itemSpacing,
    itemHeight,
    3,
    3,
    "F"
  );
  doc.setTextColor(0, 150, 0); // Green text for deposits
  doc.setFontSize(16);
  doc.text(`+ ৳${totalDeposits.toFixed(2)}`, margin + 5, summaryItemY + 9);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Total Deposits", margin + 5, summaryItemY + 13);

  // Total Expenses (light red background and red text)
  doc.setFillColor(255, 240, 240); // Light red background
  doc.roundedRect(
    margin + tableWidth / 3,
    summaryItemY,
    tableWidth / 3 - itemSpacing,
    itemHeight,
    3,
    3,
    "F"
  );
  doc.setTextColor(200, 0, 0); // Red text for expenses
  doc.setFontSize(16);
  doc.text(
    `- ৳${totalExpenses.toFixed(2)}`,
    margin + tableWidth / 3 + 5,
    summaryItemY + 9
  );
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Total Expenses", margin + tableWidth / 3 + 5, summaryItemY + 13);

  // Current Balance (light blue background)
  doc.setFillColor(240, 240, 255); // Light blue background
  doc.roundedRect(
    margin + 2 * (tableWidth / 3),
    summaryItemY,
    tableWidth / 3,
    itemHeight,
    3,
    3,
    "F"
  );
  doc.setTextColor(0, 0, 200); // Blue text for balance
  doc.setFontSize(16);
  doc.text(
    `৳${balance.toFixed(2)}`,
    margin + 2 * (tableWidth / 3) + 5,
    summaryItemY + 9
  );
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Current Balance",
    margin + 2 * (tableWidth / 3) + 5,
    summaryItemY + 13
  );

  yPos = summaryItemY + itemHeight + 10;

  // --- Detailed Transactions Table ---
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("NotoSansBengali", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Detailed Transactions", margin, yPos);
  yPos += 8;

  // Grouping deposits and expenses by day
  const groupedDeposits = {};
  deposits.forEach((deposit) => {
    const depositDate = new Date(deposit.date).toLocaleDateString();
    if (!groupedDeposits[depositDate]) {
      groupedDeposits[depositDate] = [];
    }
    groupedDeposits[depositDate].push(deposit);
  });

  const groupedExpenses = {};
  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.date).toLocaleDateString();
    if (!groupedExpenses[expenseDate]) {
      groupedExpenses[expenseDate] = [];
    }
    groupedExpenses[expenseDate].push(expense);
  });

  // Get all unique dates and sort them
  const allDates = Array.from(
    new Set([...Object.keys(groupedDeposits), ...Object.keys(groupedExpenses)])
  );
  allDates.sort((a, b) => new Date(a) - new Date(b));

  // Define column properties
  const leftTableX = margin;
  const rightTableX = pageWidth / 2;
  const tableColWidth = pageWidth / 2 - margin - 5;

  const drawTableHeader = () => {
    // Draw table headers for the two columns (Ensure consistency across all pages)
    doc.setFont("NotoSansBengali", "bold");
    doc.setFontSize(12);
    doc.setFillColor(230, 230, 230); // Light grey for table headers
    doc.rect(leftTableX, yPos, tableColWidth, 7, "F");
    doc.rect(rightTableX, yPos, tableColWidth, 7, "F");
    doc.setTextColor(51, 51, 51);
    doc.text("Deposits", leftTableX + 5, yPos + 5);
    doc.text("Expenses", rightTableX + 5, yPos + 5);
    yPos += 7;
  };

  drawTableHeader();

  doc.setFont("NotoSansBengali", "normal");
  doc.setFontSize(10);
  let isGreyRow = false;

  allDates.forEach((date) => {
    // Check for page break and add new page if necessary
    if (yPos > 280) {
      doc.addPage();
      yPos = 15;
      drawTableHeader();
      isGreyRow = false;
    }

    const depositsForDate = groupedDeposits[date] || [];
    const expensesForDate = groupedExpenses[date] || [];

    // Format deposit and expense text
    const depositText = depositsForDate
      .map((d) => `${d.description}: ৳${d.amount.toFixed(2)}`)
      .join("\n");
    const expenseText = expensesForDate
      .map((e) => `${e.description} (৳${e.amount.toFixed(2)})`)
      .join("\n");

    // Split text to fit columns and calculate height
    const splitDepositText = doc.splitTextToSize(
      depositText,
      tableColWidth - 10
    );
    const splitExpenseText = doc.splitTextToSize(
      expenseText,
      tableColWidth - 10
    );
    const depositHeight = splitDepositText.length * 5;
    const expenseHeight = splitExpenseText.length * 5;
    const currentHeight = Math.max(depositHeight, expenseHeight, 10);

    // Draw alternating row background (light grey for alternating rows)
    if (isGreyRow) {
      doc.setFillColor(245, 245, 245); // Light grey for alternating rows
      doc.rect(leftTableX, yPos, tableColWidth, currentHeight + 5, "F");
      doc.rect(rightTableX, yPos, tableColWidth, currentHeight + 5, "F");
    }

    // Draw date and transaction lists
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("NotoSansBengali", "bold");
    doc.text(date, leftTableX + 5, yPos + 5);
    doc.text(date, rightTableX + 5, yPos + 5);
    doc.setFont("NotoSansBengali", "normal");

    // Draw deposit text in light green color
    doc.setTextColor(0, 150, 0); // Green text for deposits
    doc.text(splitDepositText, leftTableX + 5, yPos + 10);

    // Draw expense text in red color
    doc.setTextColor(200, 0, 0); // Red text for expenses
    doc.text(splitExpenseText, rightTableX + 5, yPos + 10);

    yPos += currentHeight + 10;
    isGreyRow = !isGreyRow;
  });

  return doc.output();
};
