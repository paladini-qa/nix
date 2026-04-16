import { Transaction } from "../types";

export interface ParsedTransactionRow {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;
  type: "income" | "expense";
  rawLine?: string;
}

/**
 * Detecta e faz o parse de arquivos CSV ou OFX
 */
export function parseImportFile(content: string, fileName: string): ParsedTransactionRow[] {
  const ext = fileName.toLowerCase();
  if (ext.endsWith(".ofx") || ext.endsWith(".qfx")) {
    return parseOFX(content);
  }
  return parseCSV(content);
}

/**
 * Parser de CSV genérico.
 * Tenta detectar colunas: data, descrição, valor (podendo ter colunas separadas para débito/crédito).
 */
export function parseCSV(content: string): ParsedTransactionRow[] {
  const rows: ParsedTransactionRow[] = [];
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return rows;

  // Detectar separador (vírgula, ponto-e-vírgula, tab)
  const sample = lines[0];
  const separator = sample.includes(";") ? ";" : sample.includes("\t") ? "\t" : ",";

  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  // Mapear índices de colunas
  const dateIdx = findIdx(headers, ["data", "date", "dt", "data de lançamento", "transaction date"]);
  const descIdx = findIdx(headers, ["descrição", "descricao", "description", "historico", "memo", "histórico", "lançamento"]);
  const amountIdx = findIdx(headers, ["valor", "value", "amount", "vlr", "montante"]);
  const debitIdx = findIdx(headers, ["débito", "debito", "debit", "saída", "saida"]);
  const creditIdx = findIdx(headers, ["crédito", "credito", "credit", "entrada"]);

  if (dateIdx === -1 || descIdx === -1) return rows;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCSVLine(line, separator);

    const rawDate = cols[dateIdx]?.replace(/"/g, "").trim();
    const rawDesc = cols[descIdx]?.replace(/"/g, "").trim();

    if (!rawDate || !rawDesc) continue;

    const date = parseDate(rawDate);
    if (!date) continue;

    let amount = 0;
    let type: "income" | "expense" = "expense";

    if (amountIdx !== -1) {
      const raw = cols[amountIdx]?.replace(/"/g, "").trim();
      const parsed = parseAmount(raw);
      if (parsed === null) continue;
      amount = Math.abs(parsed);
      type = parsed >= 0 ? "income" : "expense";
    } else if (debitIdx !== -1 || creditIdx !== -1) {
      const debit = debitIdx !== -1 ? parseAmount(cols[debitIdx]?.replace(/"/g, "").trim()) : null;
      const credit = creditIdx !== -1 ? parseAmount(cols[creditIdx]?.replace(/"/g, "").trim()) : null;
      if (debit && debit > 0) { amount = debit; type = "expense"; }
      else if (credit && credit > 0) { amount = credit; type = "income"; }
      else continue;
    } else {
      continue;
    }

    if (amount === 0) continue;

    rows.push({ date, description: rawDesc, amount, type, rawLine: line });
  }

  return rows;
}

/**
 * Parser OFX (SGML subset).
 * Extrai campos DTPOSTED, TRNAMT, MEMO/NAME.
 */
export function parseOFX(content: string): ParsedTransactionRow[] {
  const rows: ParsedTransactionRow[] = [];
  const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = txRegex.exec(content)) !== null) {
    const block = match[1];
    const dateStr = extractOFXField(block, "DTPOSTED");
    const amountStr = extractOFXField(block, "TRNAMT");
    const memo = extractOFXField(block, "MEMO") || extractOFXField(block, "NAME") || "Transação importada";

    if (!dateStr || !amountStr) continue;

    const date = parseOFXDate(dateStr);
    if (!date) continue;

    const rawAmount = parseFloat(amountStr.replace(",", "."));
    if (isNaN(rawAmount)) continue;

    rows.push({
      date,
      description: memo,
      amount: Math.abs(rawAmount),
      type: rawAmount >= 0 ? "income" : "expense",
    });
  }

  return rows;
}

// ─── Helpers ──────────────────────────────────────────

function findIdx(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseDate(raw: string): string | null {
  // Tenta vários formatos: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
  const clean = raw.trim().replace(/\./g, "/");

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY
  const dmy = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  // MM/DD/YYYY
  const mdy = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdy) {
    const m = parseInt(mdy[1]);
    const d = parseInt(mdy[2]);
    if (m <= 12 && d > 12) return `${mdy[3]}-${mdy[1]}-${mdy[2]}`;
  }

  return null;
}

function parseOFXDate(raw: string): string | null {
  // OFX format: YYYYMMDD[HHMM[SS]]
  const clean = raw.replace(/\[.*\]/, "").trim();
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  // Remove espaços, R$, $ e letras
  const clean = raw.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

function extractOFXField(block: string, field: string): string | null {
  const re = new RegExp(`<${field}>([^<\\n]+)`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}
