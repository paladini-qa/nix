/**
 * Serviço de Geração de PDF
 * Gera relatórios de despesas compartilhadas por amigo
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "../types";
import { NIX_PURPLE, NIX_TEAL, NIX_SEMANTIC, NIX_NEUTRAL } from "../brand";

// Extensão do tipo jsPDF para incluir lastAutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export interface FriendReportData {
  friendName: string;
  userName: string;
  generatedAt: Date;
  // Despesas que EU paguei (amigo me deve)
  theyOweMe: {
    transactions: Transaction[];
    total: number;
  };
  // Despesas que o AMIGO pagou (eu devo ao amigo)
  iOweThem: {
    transactions: Transaction[];
    total: number;
  };
  // Saldo líquido
  netBalance: number; // Positivo = amigo deve pra mim, Negativo = eu devo pro amigo
}

/**
 * Formata valor como moeda brasileira
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Formata data para exibição
 */
const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Converte cor hex para RGB
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

/**
 * Gera o relatório PDF de despesas compartilhadas para um amigo
 */
export const generateFriendReport = (data: FriendReportData): void => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Cores do brand
  const purpleRgb = hexToRgb(NIX_PURPLE.start);
  const tealRgb = hexToRgb(NIX_TEAL.main);
  const successRgb = hexToRgb(NIX_SEMANTIC.success);
  const errorRgb = hexToRgb(NIX_SEMANTIC.error);
  const darkRgb = hexToRgb(NIX_NEUTRAL.nixDark);

  // ========================================
  // CABEÇALHO
  // ========================================

  // Fundo gradiente simulado (barra superior)
  doc.setFillColor(...purpleRgb);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Logotipo / Nome da App
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("NIX", margin, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Finanças Inteligentes", margin, 33);

  // Título do Relatório (lado direito)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Despesas", pageWidth - margin, 22, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Compartilhadas", pageWidth - margin, 30, { align: "right" });

  yPos = 55;

  // ========================================
  // INFORMAÇÕES DO RELATÓRIO
  // ========================================

  doc.setTextColor(...darkRgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Relatório com: ${data.friendName}`, margin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado por: ${data.userName}`, margin, yPos);
  doc.text(
    `Data: ${data.generatedAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    pageWidth - margin,
    yPos,
    { align: "right" }
  );

  yPos += 15;

  // Linha divisória
  doc.setDrawColor(...purpleRgb);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 15;

  // ========================================
  // RESUMO FINANCEIRO (CARD PRINCIPAL)
  // ========================================

  // Box de resumo - altura aumentada para mais espaço
  const boxHeight = 60;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-300
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 5, 5, "FD");

  // Divide em 3 colunas com mais espaço
  const colWidth = contentWidth / 3;
  const col1Center = margin + colWidth * 0.5;
  const col2Center = margin + colWidth * 1.5;
  const col3Center = margin + colWidth * 2.5;

  // Linhas verticais divisórias (sutis)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin + colWidth, yPos + 8, margin + colWidth, yPos + boxHeight - 8);
  doc.line(margin + colWidth * 2, yPos + 8, margin + colWidth * 2, yPos + boxHeight - 8);

  // Coluna 1: Amigo deve ao usuário
  doc.setTextColor(...successRgb);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.friendName} deve a ${data.userName}:`, col1Center, yPos + 14, { align: "center" });
  doc.setFontSize(14);
  doc.text(formatCurrency(data.theyOweMe.total), col1Center, yPos + 30, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.theyOweMe.transactions.length} transação(ões)`, col1Center, yPos + 42, { align: "center" });

  // Coluna 2: Usuário deve ao amigo
  doc.setTextColor(...errorRgb);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.userName} deve a ${data.friendName}:`, col2Center, yPos + 14, { align: "center" });
  doc.setFontSize(14);
  doc.text(formatCurrency(data.iOweThem.total), col2Center, yPos + 30, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.iOweThem.transactions.length} transação(ões)`, col2Center, yPos + 42, { align: "center" });

  // Coluna 3: Saldo Líquido
  const netColor = data.netBalance >= 0 ? successRgb : errorRgb;
  doc.setTextColor(...netColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("SALDO LÍQUIDO:", col3Center, yPos + 14, { align: "center" });
  doc.setFontSize(16);
  doc.text(
    `${data.netBalance >= 0 ? "+" : ""}${formatCurrency(data.netBalance)}`,
    col3Center,
    yPos + 32,
    { align: "center" }
  );

  yPos += boxHeight + 15;

  // ========================================
  // CONCLUSÃO / AÇÃO NECESSÁRIA
  // ========================================

  const actionBoxHeight = 28;
  const actionColor = data.netBalance >= 0 ? successRgb : errorRgb;
  const actionBgColor = data.netBalance >= 0 ? [220, 252, 231] : [254, 226, 226]; // green-100 ou red-100
  const pageCenter = margin + contentWidth / 2;

  doc.setFillColor(actionBgColor[0], actionBgColor[1], actionBgColor[2]);
  doc.setDrawColor(...actionColor);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, yPos, contentWidth, actionBoxHeight, 5, 5, "FD");

  doc.setTextColor(...actionColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  let actionText = "";
  if (Math.abs(data.netBalance) < 0.01) {
    actionText = `${data.friendName} e ${data.userName} estão quites! Nenhuma transferência necessária.`;
  } else if (data.netBalance > 0) {
    actionText = `${data.friendName} precisa transferir ${formatCurrency(data.netBalance)} para ${data.userName}`;
  } else {
    actionText = `${data.userName} precisa transferir ${formatCurrency(Math.abs(data.netBalance))} para ${data.friendName}`;
  }

  doc.text(actionText, pageCenter, yPos + 18, { align: "center" });

  yPos += actionBoxHeight + 15;

  // ========================================
  // TABELA: DESPESAS QUE EU PAGUEI (AMIGO ME DEVE)
  // ========================================

  if (data.theyOweMe.transactions.length > 0) {
    doc.setTextColor(...darkRgb);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Despesas que ${data.userName} pagou (${data.friendName} deve)`, margin, yPos);

    yPos += 5;

    const theyOweMeData = data.theyOweMe.transactions.map((t) => {
      const amount = t.iOwe ? t.amount : t.amount / 2;
      return [
        formatDate(t.date),
        t.description,
        t.category,
        formatCurrency(amount),
        t.isPaid ? "Recebido" : "Pendente",
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Descrição", "Categoria", "Valor Devido", "Status"]],
      body: theyOweMeData,
      foot: [["", "", "TOTAL:", formatCurrency(data.theyOweMe.total), ""]],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [...successRgb] as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [240, 253, 244],
        textColor: [...successRgb] as [number, number, number],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        3: { halign: "right" },
        4: { halign: "center", cellWidth: 25 },
      },
    });

    yPos = (doc.lastAutoTable?.finalY || yPos) + 15;
  }

  // ========================================
  // TABELA: DESPESAS QUE O AMIGO PAGOU (EU DEVO)
  // ========================================

  if (data.iOweThem.transactions.length > 0) {
    // Verificar se precisa de nova página
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(...darkRgb);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Despesas que ${data.friendName} pagou (${data.userName} deve)`, margin, yPos);

    yPos += 5;

    const iOweThemData = data.iOweThem.transactions.map((t) => {
      const amount = t.iOwe ? t.amount : t.amount / 2;
      return [
        formatDate(t.date),
        t.description,
        t.category,
        formatCurrency(amount),
        t.isPaid ? "Pago" : "Pendente",
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Descrição", "Categoria", "Valor Devido", "Status"]],
      body: iOweThemData,
      foot: [["", "", "TOTAL:", formatCurrency(data.iOweThem.total), ""]],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [...errorRgb] as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [254, 242, 242],
        textColor: [...errorRgb] as [number, number, number],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        3: { halign: "right" },
        4: { halign: "center", cellWidth: 25 },
      },
    });

    yPos = (doc.lastAutoTable?.finalY || yPos) + 15;
  }

  // Se não há transações em nenhuma categoria
  if (data.theyOweMe.transactions.length === 0 && data.iOweThem.transactions.length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Nenhuma despesa compartilhada registrada com este amigo.",
      boxCenter,
      yPos + 20,
      { align: "center" }
    );
  }

  // ========================================
  // RODAPÉ
  // ========================================

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();

    // Linha do rodapé
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    // Texto do rodapé
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Gerado por Nix - Finanças Inteligentes", margin, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 12, {
      align: "right",
    });
  }

  // ========================================
  // SALVAR PDF
  // ========================================

  const fileName = `nix-relatorio-${data.friendName
    .toLowerCase()
    .replace(/\s+/g, "-")}-${data.generatedAt.toISOString().split("T")[0]}.pdf`;

  doc.save(fileName);
};

/**
 * Prepara os dados do relatório a partir do balanço do amigo
 */
export const prepareFriendReportData = (
  friendName: string,
  userName: string,
  transactions: Transaction[],
  allTransactions: Transaction[]
): FriendReportData => {
  // Filtra transações compartilhadas com esse amigo
  const friendTransactions = transactions.filter(
    (t) => t.isShared && t.sharedWith === friendName
  );

  // Despesas que EU paguei (tipo expense, sem iOwe) - amigo me deve 50%
  // Ou receitas relacionadas a despesas (tipo income, vinculadas ao amigo)
  const theyOweMeTransactions: Transaction[] = [];
  let theyOweMeTotal = 0;

  // Despesas que O AMIGO pagou (tipo expense, com iOwe = true) - eu devo 100%
  const iOweThemTransactions: Transaction[] = [];
  let iOweThemTotal = 0;

  friendTransactions.forEach((t) => {
    if (t.type === "expense") {
      if (t.iOwe) {
        // EXPENSE + iOwe: Amigo pagou, EU devo (valor integral)
        iOweThemTransactions.push(t);
        iOweThemTotal += t.amount;
      } else {
        // EXPENSE + conta dividida: EU paguei, amigo me deve 50%
        theyOweMeTransactions.push(t);
        theyOweMeTotal += t.amount / 2;
      }
    } else if (t.type === "income") {
      // INCOME vinculada a amigo: registro de pagamento/reembolso
      // Não inclui nas listas de despesas pendentes
    }
  });

  // Calcula saldo líquido considerando apenas o que está pendente
  let pendingTheyOweMe = 0;
  let pendingIOwe = 0;

  theyOweMeTransactions.forEach((t) => {
    const relatedIncome = allTransactions.find(
      (inc) => inc.id === t.relatedTransactionId
    );
    if (!relatedIncome?.isPaid) {
      pendingTheyOweMe += t.amount / 2;
    }
  });

  iOweThemTransactions.forEach((t) => {
    if (!t.isPaid) {
      pendingIOwe += t.amount;
    }
  });

  const netBalance = pendingTheyOweMe - pendingIOwe;

  return {
    friendName,
    userName,
    generatedAt: new Date(),
    theyOweMe: {
      transactions: theyOweMeTransactions,
      total: theyOweMeTotal,
    },
    iOweThem: {
      transactions: iOweThemTransactions,
      total: iOweThemTotal,
    },
    netBalance,
  };
};

export default {
  generateFriendReport,
  prepareFriendReportData,
};

