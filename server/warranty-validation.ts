import { TRPCError } from "@trpc/server";
export const MAX_INVOICE_BYTES = 5 * 1024 * 1024;
export function validateInvoice(input: {
  filename: string;
  mimeType: string;
  data: string;
}) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data) || input.data.length % 4 !== 0)
    throw new TRPCError({ code: "BAD_REQUEST", message: "Archivo no válido." });
  const bytes = Buffer.from(input.data, "base64");
  if (!bytes.length || bytes.length > MAX_INVOICE_BYTES)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "La factura debe pesar hasta 5 MB.",
    });
  const type =
    bytes.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          ? "image/jpeg"
          : null;
  const ext =
    type === "application/pdf"
      ? /\.pdf$/i
      : type === "image/png"
        ? /\.png$/i
        : /\.jpe?g$/i;
  if (!type || type !== input.mimeType || !ext.test(input.filename))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use una factura PDF, JPG o PNG válida.",
    });
  return {
    ...input,
    filename: input.filename.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(-180),
  };
}
