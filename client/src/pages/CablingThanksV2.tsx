import { validCablingReceipt } from "@shared/cabling-campaign";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";
import {
  CablingWhatsappV2,
  cablingReceiptKey,
} from "@/components/v2/CablingCampaignV2";
import { useServiceMetadata } from "@/components/v2/ServiceConversionV2";

export default function CablingThanksV2() {
  useServiceMetadata(
    "Seguimiento de su cotización",
    "Seguimiento a su solicitud de cableado estructurado Panduit."
  );
  let confirmed = false;
  try {
    confirmed = validCablingReceipt(sessionStorage.getItem(cablingReceiptKey));
  } catch {
    /* No conversion is inferred from visiting this page. */
  }
  return (
    <div className="iamet-reference-home min-h-[80vh] px-5 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-blue-300/20 bg-[#102438] p-7 sm:p-12">
        <CheckCircle2 className="text-blue-400" size={40} />
        <h1 className="mt-5 text-3xl font-bold">
          {confirmed
            ? "Gracias. Recibimos su solicitud."
            : "¿Necesita cotizar su proyecto?"}
        </h1>
        <p className="mt-5 leading-7 text-slate-300">
          {confirmed
            ? "Su solicitud quedó registrada. Un especialista de IAMET revisará el requerimiento y le contactará con los datos que proporcionó para definir el siguiente paso."
            : "Complete el formulario de cableado estructurado para que podamos revisar su necesidad. Esta página, por sí sola, no registra una cotización."}
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Si tiene planos o información adicional, puede compartirlos con
          nuestro equipo al continuar la conversación.
        </p>
        <div className="mt-7 flex flex-col items-start gap-5">
          <CablingWhatsappV2 />
          <Link
            href="/soluciones/cableado-estructurado#solicitar"
            className="text-blue-300 underline underline-offset-4"
          >
            Volver a cableado estructurado
          </Link>
        </div>
      </div>
    </div>
  );
}
