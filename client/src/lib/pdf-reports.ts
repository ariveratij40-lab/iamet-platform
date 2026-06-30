/**
 * PDF Report Generator — Sprint 7
 * Generates executive reports and lead cards using jsPDF.
 * Runs entirely in the browser — no server dependency.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// IAMET brand colors
const COLORS = {
  primary: [0, 51, 102] as [number, number, number],       // Dark blue
  accent: [0, 188, 212] as [number, number, number],        // Cyan
  success: [34, 197, 94] as [number, number, number],       // Green
  warning: [234, 179, 8] as [number, number, number],       // Yellow
  danger: [239, 68, 68] as [number, number, number],        // Red
  gray: [107, 114, 128] as [number, number, number],        // Gray
  lightGray: [243, 244, 246] as [number, number, number],   // Light gray
  white: [255, 255, 255] as [number, number, number],
  black: [17, 24, 39] as [number, number, number],
};

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 35, "F");

  // IAMET title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("IAMET", 15, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Evolución Tecnológica", 15, 22);

  // Accent line
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 35, 210, 2, "F");

  // Report title
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 15, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(subtitle, 15, 58);

  // Date
  const now = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  doc.setFontSize(9);
  doc.text(`Generado: ${now}`, 195, 50, { align: "right" });
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(0, pageHeight - 12, 210, 12, "F");

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("IAMET Evolución Tecnológica — Confidencial", 15, pageHeight - 4);
  doc.text(`Página ${pageNum} de ${totalPages}`, 195, pageHeight - 4, { align: "right" });
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, y, 3, 7, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 21, y + 5.5);
  return y + 14;
}

function addKPIRow(doc: jsPDF, kpis: Array<{ label: string; value: string; color?: [number, number, number] }>, y: number): number {
  const colWidth = (210 - 30) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = 15 + i * colWidth;
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(x, y, colWidth - 4, 20, 2, 2, "F");

    doc.setTextColor(...(kpi.color ?? COLORS.primary));
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + (colWidth - 4) / 2, y + 11, { align: "center" });

    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + (colWidth - 4) / 2, y + 17, { align: "center" });
  });
  return y + 26;
}

export interface ExecutiveReportData {
  period: string;
  metrics: {
    totalLeads: number;
    hotLeads: number;
    meetings: number;
    proposals: number;
    wonDeals: number;
    lostDeals: number;
    pipelineValue: number;
    conversionRate: number;
  };
  topLeads: Array<{ name: string; company: string; score: number; status: string; value: string }>;
  topVerticals: Array<{ name: string; leads: number; conversion: string; avgTicket: string }>;
  channelROI: Array<{ channel: string; leads: number; conversions: number; revenue: string }>;
  recommendations: string[];
  forecast: { next30: string; next90: string; probability: string };
}

/**
 * Generate an executive PDF report.
 */
export function generateExecutiveReport(data: ExecutiveReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page 1
  addHeader(doc, "Reporte Ejecutivo Comercial", `Período: ${data.period}`);

  let y = 68;

  // KPIs
  y = addSectionTitle(doc, "Métricas Clave", y);
  y = addKPIRow(doc, [
    { label: "Leads Totales", value: String(data.metrics.totalLeads) },
    { label: "Leads Hot", value: String(data.metrics.hotLeads), color: COLORS.danger },
    { label: "Reuniones", value: String(data.metrics.meetings), color: COLORS.accent },
    { label: "Propuestas", value: String(data.metrics.proposals) },
  ], y);

  y = addKPIRow(doc, [
    { label: "Proyectos Ganados", value: String(data.metrics.wonDeals), color: COLORS.success },
    { label: "Proyectos Perdidos", value: String(data.metrics.lostDeals), color: COLORS.danger },
    { label: "Pipeline Total", value: data.metrics.pipelineValue > 0 ? `$${(data.metrics.pipelineValue / 1000000).toFixed(1)}M` : "$0", color: COLORS.primary },
    { label: "Tasa de Conversión", value: `${data.metrics.conversionRate}%`, color: COLORS.success },
  ], y);

  y += 4;

  // Forecast
  y = addSectionTitle(doc, "Forecast", y);
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 18, 2, 2, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Próximos 30 días: ${data.forecast.next30}`, 20, y + 7);
  doc.text(`Próximos 90 días: ${data.forecast.next90}`, 20, y + 13);
  doc.setTextColor(...COLORS.success);
  doc.text(`Probabilidad de meta: ${data.forecast.probability}`, 120, y + 10);
  y += 24;

  // Top Leads
  y = addSectionTitle(doc, "Top Oportunidades", y);
  autoTable(doc, {
    startY: y,
    head: [["Nombre", "Empresa", "Score", "Estado", "Valor Est."]],
    body: data.topLeads.map(l => [l.name, l.company, `${l.score}/100`, l.status, l.value]),
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Add page 2 if needed
  if (y > 220) {
    doc.addPage();
    addHeader(doc, "Reporte Ejecutivo Comercial", `Período: ${data.period} — Continuación`);
    y = 68;
  }

  // Verticals
  y = addSectionTitle(doc, "Rendimiento por Vertical", y);
  autoTable(doc, {
    startY: y,
    head: [["Vertical", "Leads", "Conversión", "Ticket Promedio"]],
    body: data.topVerticals.map(v => [v.name, String(v.leads), v.conversion, v.avgTicket]),
    theme: "striped",
    headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Channel ROI
  y = addSectionTitle(doc, "ROI por Canal", y);
  autoTable(doc, {
    startY: y,
    head: [["Canal", "Leads", "Conversiones", "Revenue"]],
    body: data.channelROI.map(c => [c.channel, String(c.leads), String(c.conversions), c.revenue]),
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Recommendations
  if (data.recommendations.length > 0) {
    if (y > 230) {
      doc.addPage();
      addHeader(doc, "Reporte Ejecutivo Comercial", `Período: ${data.period} — Recomendaciones`);
      y = 68;
    }
    y = addSectionTitle(doc, "Recomendaciones IA", y);
    data.recommendations.forEach((rec, i) => {
      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(15, y, 180, 10, 2, 2, "F");
      doc.setFillColor(...COLORS.accent);
      doc.circle(20, y + 5, 2, "F");
      doc.setTextColor(...COLORS.black);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(rec, 165);
      doc.text(lines[0] || rec, 25, y + 6);
      y += 13;
    });
  }

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  const filename = `IAMET-Reporte-Ejecutivo-${data.period.replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}

export interface LeadReportData {
  lead: {
    name: string;
    email: string;
    phone?: string;
    company: string;
    industry?: string;
    employees?: string;
    problem?: string;
    budget?: string;
    urgency?: string;
    score: number;
    status: string;
    source?: string;
    createdAt: number;
  };
  timeline: Array<{ type: string; description: string; createdAt: number }>;
  conversations: number;
  proposals: Array<{ title: string; amount: string; createdAt: number }>;
}

/**
 * Generate a lead detail PDF card.
 */
export function generateLeadReport(data: LeadReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "Ficha de Lead Comercial", `${data.lead.company} — ${data.lead.name}`);

  let y = 68;

  // Lead info
  y = addSectionTitle(doc, "Información del Prospecto", y);

  const infoRows = [
    ["Nombre", data.lead.name, "Empresa", data.lead.company],
    ["Email", data.lead.email, "Teléfono", data.lead.phone ?? "—"],
    ["Industria", data.lead.industry ?? "—", "Empleados", data.lead.employees ?? "—"],
    ["Presupuesto", data.lead.budget ? `$${data.lead.budget}` : "—", "Urgencia", data.lead.urgency ?? "—"],
    ["Estado", data.lead.status, "Fuente", data.lead.source ?? "—"],
  ];

  autoTable(doc, {
    startY: y,
    body: infoRows.map(row => [
      { content: row[0], styles: { fontStyle: "bold", fillColor: COLORS.lightGray } },
      row[1],
      { content: row[2], styles: { fontStyle: "bold", fillColor: COLORS.lightGray } },
      row[3],
    ]),
    theme: "plain",
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { cellWidth: 35 }, 3: { cellWidth: 55 } },
    bodyStyles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Score
  y = addSectionTitle(doc, "Lead Score", y);
  const scoreColor = data.lead.score >= 80 ? COLORS.danger : data.lead.score >= 60 ? COLORS.warning : COLORS.gray;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 16, 2, 2, "F");
  doc.setFillColor(...scoreColor);
  doc.roundedRect(15, y, (180 * data.lead.score) / 100, 16, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.lead.score}/100`, 105, y + 10, { align: "center" });
  y += 22;

  // Problem description
  if (data.lead.problem) {
    y = addSectionTitle(doc, "Problema / Necesidad", y);
    doc.setFillColor(...COLORS.lightGray);
    const problemLines = doc.splitTextToSize(data.lead.problem, 170);
    doc.roundedRect(15, y, 180, problemLines.length * 5 + 6, 2, 2, "F");
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(problemLines, 20, y + 5);
    y += problemLines.length * 5 + 12;
  }

  // Timeline
  if (data.timeline.length > 0) {
    y = addSectionTitle(doc, "Timeline Comercial", y);
    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Evento", "Descripción"]],
      body: data.timeline.slice(0, 10).map(t => [
        new Date(t.createdAt).toLocaleDateString("es-MX"),
        t.type.replace(/_/g, " "),
        t.description.substring(0, 60),
      ]),
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Proposals
  if (data.proposals.length > 0) {
    y = addSectionTitle(doc, "Propuestas Generadas", y);
    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Descripción", "Monto Estimado"]],
      body: data.proposals.map(p => [
        new Date(p.createdAt).toLocaleDateString("es-MX"),
        p.title,
        p.amount,
      ]),
      theme: "striped",
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  const filename = `IAMET-Lead-${data.lead.company.replace(/\s+/g, "-")}-${data.lead.name.split(" ")[0]}.pdf`;
  doc.save(filename);
}
