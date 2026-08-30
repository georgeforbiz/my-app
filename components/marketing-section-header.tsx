import { NAVY } from "@/lib/brand";

export function MarketingSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  light = false
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : "max-w-2xl text-left";
  return (
    <header className={`${alignClass}`}>
      {eyebrow ? (
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs ${
            light ? "text-white/55" : "text-slate-500"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`${eyebrow ? "mt-3" : ""} text-2xl font-black tracking-tight sm:text-3xl md:text-[2.15rem] ${
          light ? "text-white" : ""
        }`}
        style={light ? undefined : { color: NAVY }}
      >
        {title.includes("\n")
          ? title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))
          : title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 text-sm leading-relaxed sm:text-[15px] ${light ? "text-white/70" : "text-slate-600"}`}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
