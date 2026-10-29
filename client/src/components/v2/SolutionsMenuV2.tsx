import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { solutions, solutionDestinations } from "./solutionsData";

export default function SolutionsMenuV2({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { language } = useLanguage();
  const es = language === "es";
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = mobile ? "mobile-solutions-links" : "desktop-solutions-links";
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  const navigate = () => {
    setOpen(false);
    onNavigate?.();
  };
  return (
    <div
      ref={root}
      onMouseEnter={() => {
        if (!mobile) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!mobile) setOpen(false);
      }}
      className={
        mobile
          ? "border-b border-slate-100"
          : "relative flex h-full items-center"
      }
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
      onKeyDown={event => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
        if (event.key === "ArrowDown" && event.target === trigger.current) {
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() =>
            root.current?.querySelector("a")?.focus()
          );
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(value => !value)}
        className={
          mobile
            ? "flex min-h-12 w-full items-center justify-between px-3 text-sm font-medium text-slate-700"
            : `inline-flex h-full items-center gap-1 whitespace-nowrap border-b-2 pt-0.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${open || location.startsWith("/soluciones") ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-blue-600"}`
        }
      >
        {es ? "Soluciones" : "Solutions"}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={id}
          className={
            mobile
              ? "pb-3 pl-3"
              : "absolute left-0 top-full w-80 rounded-b-xl border border-slate-200 bg-white p-2 shadow-xl"
          }
        >
          {solutions.map(solution => {
            const Icon = solution.icon;
            return (
              <Link
                key={solution.id}
                href={solutionDestinations[solution.id]}
                onClick={navigate}
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                {es ? solution.es : solution.en}
              </Link>
            );
          })}
          <Link
            href="/soluciones"
            onClick={navigate}
            className="mt-2 block border-t border-slate-100 px-3 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            {es ? "Ver todas las soluciones" : "View all solutions"}
          </Link>
        </div>
      )}
    </div>
  );
}
