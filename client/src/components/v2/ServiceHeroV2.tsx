import { Link } from "wouter";
import { ArrowDown, ArrowRight } from "lucide-react";
import BannerMediaV2 from "./BannerMediaV2";
import { useReducedMotion } from "framer-motion";

type Props = {
  eyebrow: string;
  brandLabel?: string;
  title: string;
  description: string;
  image: string;
  contactHref: string;
  contactLabel: string;
  portfolioLabel: string;
  portfolioHref?: string;
  breadcrumbLabel: string;
  homeLabel: string;
  partner?: { image: string; label: string };
};

/** Shared service-page hero: message, project action, partner and portfolio anchor. */
export default function ServiceHeroV2(props: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative isolate overflow-hidden bg-[#031426] text-white">
      <BannerMediaV2
        image={props.image}
        paused={false}
        reduceMotion={Boolean(reduceMotion)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#031426] via-[#031426]/90 to-[#031426]/25 lg:via-[#031426]/65" />
      <div className="relative mx-auto flex min-h-[660px] max-w-[1440px] flex-col px-5 py-8 sm:px-8 lg:min-h-[740px] lg:px-12">
        <nav
          aria-label={props.breadcrumbLabel}
          className="flex items-center gap-3 text-xs text-blue-100/70"
        >
          <Link href="/" className="hover:text-white">
            {props.homeLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{props.eyebrow}</span>
        </nav>
        <div className="my-auto max-w-[640px] py-12 lg:py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.24em] text-blue-300">
            {props.eyebrow}
            {props.brandLabel ? ` · ${props.brandLabel}` : ""}
          </p>
          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            {props.title}
          </h1>
          <p className="mt-6 max-w-[510px] text-base leading-8 text-slate-200 sm:text-lg">
            {props.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href={props.contactHref}
              className="inline-flex items-center gap-3 rounded-full bg-blue-600 px-6 py-4 text-sm font-semibold transition hover:bg-blue-500"
            >
              {props.contactLabel}
              <ArrowRight size={17} />
            </a>
            <a
              href={props.portfolioHref ?? "#portafolio"}
              className="inline-flex items-center gap-2 py-3 text-sm text-white underline-offset-4 hover:underline"
            >
              {props.portfolioLabel}
              <ArrowDown size={16} />
            </a>
          </div>
          {props.partner && (
            <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/15 pt-6">
              <img
                src={props.partner.image}
                alt="Panduit ONE Silver Partner 2025"
                className="w-[160px] rounded p-3"
                style={{ background: "#fff" }}
              />
              <p className="max-w-[200px] text-xs leading-5 text-slate-300">
                {props.partner.label}
              </p>
            </div>
          )}
        </div>
        <p className="border-t border-white/15 pt-5 text-xs uppercase tracking-[.18em] text-blue-100/80">
          {props.portfolioLabel} <span className="mx-2 text-blue-400">↓</span>
        </p>
      </div>
    </section>
  );
}
