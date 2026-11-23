import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  getDuePayouts,
  payoutCutoff,
  payoutDay,
  PAYOUT_MIN_BIRR,
} from "@/lib/commission/payouts";
import { isWalletMethod, payoutProvider } from "@/lib/payout-display";

export const runtime = "nodejs";

// The Friday payout list as an Excel file (admin downloads it from the
// dashboard — Telegram never sends it). Same live data as the Payouts
// page, so the sheet always matches what "Mark paid" will record.
export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const cutoff = payoutCutoff();
  const friday = payoutDay(cutoff);
  const due = await getDuePayouts(cutoff);
  const fridayLabel = friday.toLocaleDateString("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Binoregn";
  const sheet = workbook.addWorksheet(`Payout ${fridayLabel}`);

  sheet.columns = [
    { header: "#", key: "n", width: 5 },
    { header: "Creator", key: "name", width: 26 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Payout method", key: "method", width: 16 },
    { header: "Type", key: "bank", width: 16 },
    { header: "Account name", key: "accountName", width: 24 },
    { header: "Account / phone number", key: "accountNumber", width: 24 },
    { header: "Commissions", key: "count", width: 13 },
    { header: "Amount (Birr)", key: "amount", width: 15 },
  ];
  sheet.getRow(1).font = { bold: true };

  due.forEach((row, index) => {
    sheet.addRow({
      n: index + 1,
      name: row.creatorName,
      email: row.creatorEmail,
      phone: row.creatorPhone ?? "",
      method: payoutProvider(row) ?? "Not set",
      bank: row.payoutMethod ? (isWalletMethod(row.payoutMethod) ? "Mobile wallet" : "Bank account") : "",
      accountName: row.payoutAccountName ?? "",
      // Text, so Excel keeps leading zeros and long numbers intact.
      accountNumber: row.payoutAccountNumber ?? "",
      count: row.commissionCount,
      amount: row.amountBirr,
    });
  });
  sheet.getColumn("accountNumber").numFmt = "@";
  sheet.getColumn("amount").numFmt = "#,##0";

  const totalRow = sheet.addRow({
    name: "Total",
    count: due.reduce((sum, row) => sum + row.commissionCount, 0),
    amount: due.reduce((sum, row) => sum + row.amountBirr, 0),
  });
  totalRow.font = { bold: true };

  sheet.addRow({});
  sheet.addRow({
    name: `Covers commissions pending by Thursday 11:59 PM before ${fridayLabel} (Addis Ababa). Minimum ${PAYOUT_MIN_BIRR} Birr.`,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="binoregn-payout-${fridayLabel}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
