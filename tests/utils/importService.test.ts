import { describe, expect, it } from "vitest";
import { parseImportFile } from "@/infrastructure/export/importService";

describe("transaction statement amounts", () => {
  it("preserves the same cents across Brazilian and US CSV formats", () => {
    const rows = parseImportFile([
      "Data;Descrição;Valor",
      "04/12/2026;BRL;-R$ 1.234,56",
      "04/12/2026;USD;-$1,234.56",
      "04/12/2026;Decimal;12.34",
      "04/12/2026;Inválido;12.34x",
    ].join("\n"), "extrato.csv");
    expect(rows.map(({ amount, type }) => [amount, type])).toEqual([
      [1234.56, "expense"], [1234.56, "expense"], [12.34, "income"],
    ]);
  });

  it("honors a signed value in a separate debit column", () => {
    const rows = parseImportFile("Date,Description,Debit,Credit\n2026-12-04,Test,-12.34,", "statement.csv");
    expect(rows).toMatchObject([{ amount: 12.34, type: "expense" }]);
  });

  it("rejects malformed and zero OFX amounts", () => {
    const rows = parseImportFile([
      "<STMTTRN><DTPOSTED>20261204<TRNAMT>-12.34<MEMO>Valid</STMTTRN>",
      "<STMTTRN><DTPOSTED>20261204<TRNAMT>-12.34x</STMTTRN>",
      "<STMTTRN><DTPOSTED>20261204<TRNAMT>0</STMTTRN>",
    ].join("\n"), "statement.ofx");
    expect(rows).toEqual([{ date: "2026-12-04", amount: 12.34, type: "expense", description: "Valid" }]);
  });
});
