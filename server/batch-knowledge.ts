/**
 * Batch Knowledge Importer — Sprint 7
 * Handles bulk document uploads to the RAG knowledge base.
 * Supports ZIP archives, progress tracking, and predefined categories.
 */

import { ingestDocument, KnowledgeDocInput } from "./knowledge";

export type BatchStatus = "pending" | "processing" | "done" | "error";

export interface BatchFileResult {
  filename: string;
  status: BatchStatus;
  docId?: number;
  error?: string;
  chunksCreated?: number;
}

export interface BatchJob {
  batchId: string;
  totalFiles: number;
  processedFiles: number;
  results: BatchFileResult[];
  startedAt: number;
  completedAt?: number;
}

// In-memory store for batch jobs (cleared on server restart — acceptable for short-lived jobs)
const batchJobs = new Map<string, BatchJob>();

export function getBatchJob(batchId: string): BatchJob | undefined {
  return batchJobs.get(batchId);
}

export function createBatchJob(batchId: string, totalFiles: number): BatchJob {
  const job: BatchJob = {
    batchId,
    totalFiles,
    processedFiles: 0,
    results: [],
    startedAt: Date.now(),
  };
  batchJobs.set(batchId, job);
  return job;
}

export interface BatchFileInput {
  filename: string;
  mimeType: string;
  base64Content: string;
  metadata: {
    title?: string;
    category?: string;
    manufacturer?: string;
    product?: string;
    version?: string;
    author?: string;
    tags?: string[];
  };
}

/**
 * Process a single file in the batch.
 * Updates the job progress in-memory.
 */
async function processBatchFile(
  job: BatchJob,
  file: BatchFileInput
): Promise<void> {
  const result: BatchFileResult = {
    filename: file.filename,
    status: "processing",
  };
  job.results.push(result);

  try {
    // Decode base64 to Buffer
    const buffer = Buffer.from(file.base64Content, "base64");

    const docInput: KnowledgeDocInput = {
      fileName: file.filename,
      fileType: file.mimeType,
      fileBuffer: buffer,
      title: file.metadata.title || file.filename,
      category: file.metadata.category || "general",
      manufacturer: file.metadata.manufacturer,
      product: file.metadata.product,
      version: file.metadata.version,
      author: file.metadata.author,
      tags: file.metadata.tags || [],
    };
    const docResult = await ingestDocument(docInput);

    result.status = "done";
    result.docId = docResult.docId;
    result.chunksCreated = docResult.chunkCount;
  } catch (err: any) {
    result.status = "error";
    result.error = err?.message || "Unknown error";
  } finally {
    job.processedFiles++;
    if (job.processedFiles >= job.totalFiles) {
      job.completedAt = Date.now();
    }
  }
}

/**
 * Extract files from a ZIP archive (base64-encoded).
 * Returns array of BatchFileInput.
 */
async function extractZip(
  zipBase64: string,
  defaultCategory: string
): Promise<BatchFileInput[]> {
  const JSZip = (await import("jszip")).default;
  const buffer = Buffer.from(zipBase64, "base64");
  const zip = await JSZip.loadAsync(buffer);
  const files: BatchFileInput[] = [];

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    // Skip hidden files and macOS metadata
    if (filename.startsWith("__MACOSX") || filename.startsWith(".")) continue;

    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const supportedExts = ["pdf", "docx", "doc", "xlsx", "xls", "txt", "md", "csv", "pptx"];
    if (!supportedExts.includes(ext)) continue;

    const content = await zipEntry.async("base64");
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      txt: "text/plain",
      md: "text/markdown",
      csv: "text/csv",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    // Extract just the base filename (ignore directory structure inside zip)
    const baseName = filename.split("/").pop() || filename;

    files.push({
      filename: baseName,
      mimeType: mimeMap[ext] || "application/octet-stream",
      base64Content: content,
      metadata: {
        title: baseName.replace(/\.[^.]+$/, ""),
        category: defaultCategory,
        tags: [defaultCategory],
      },
    });
  }

  return files;
}

/**
 * Run a batch import job asynchronously.
 * Returns the batchId immediately; caller polls getBatchJob() for progress.
 */
export async function runBatchImport(
  batchId: string,
  files: BatchFileInput[]
): Promise<void> {
  const job = batchJobs.get(batchId);
  if (!job) return;

  // Process files sequentially to avoid overwhelming the LLM API
  for (const file of files) {
    await processBatchFile(job, file);
  }
}

/**
 * Handle ZIP upload: extract files and run batch import.
 */
export async function runZipBatchImport(
  batchId: string,
  zipBase64: string,
  defaultCategory: string
): Promise<void> {
  const files = await extractZip(zipBase64, defaultCategory);
  const job = batchJobs.get(batchId);
  if (!job) return;

  // Update total count now that we know how many files are in the ZIP
  job.totalFiles = files.length;
  if (files.length === 0) {
    job.completedAt = Date.now();
    return;
  }

  for (const file of files) {
    await processBatchFile(job, file);
  }
}

export const PREDEFINED_CATEGORIES = [
  { value: "panduit", label: "Panduit — Infraestructura Física" },
  { value: "hid", label: "HID — Control de Acceso" },
  { value: "genetec", label: "Genetec — Video y Seguridad" },
  { value: "apc", label: "APC — Energía y UPS" },
  { value: "cisco", label: "Cisco — Redes y Switching" },
  { value: "zebra", label: "Zebra — RFID y Movilidad" },
  { value: "hikvision", label: "Hikvision — CCTV y Video" },
  { value: "avigilon", label: "Avigilon — Video Analytics" },
  { value: "casos-exito", label: "Casos de Éxito IAMET" },
  { value: "propuestas", label: "Propuestas Anteriores" },
  { value: "general", label: "General" },
];
