"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

const inputBaseClass =
  "box-border h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 text-base leading-normal text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15 read-only:bg-slate-50 read-only:text-slate-700";

type FormFieldProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  labelExtra?: ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
  passwordToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  id,
  label,
  icon: Icon,
  labelExtra,
  wrapperClassName,
  inputClassName = "",
  className,
  passwordToggle = false,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  type,
  ...inputProps
}: FormFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = type === "password" && passwordToggle;
  const inputType = isPasswordField && passwordVisible ? "text" : type;

  return (
    <div className={wrapperClassName}>
      {labelExtra ? (
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <label htmlFor={id} className="block min-w-0 shrink text-sm font-semibold text-slate-700">
            {label}
          </label>
          {labelExtra}
        </div>
      ) : (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative mt-1">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#0033A0]/70"
          strokeWidth={2.25}
          aria-hidden
        />
        <input
          id={id}
          type={inputType}
          className={`${inputBaseClass} ${isPasswordField ? "pr-12" : "pr-4"} ${inputClassName} ${className ?? ""}`.trim()}
          {...inputProps}
        />
        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
          >
            {passwordVisible ? <EyeOff className="h-5 w-5" strokeWidth={2.25} /> : <Eye className="h-5 w-5" strokeWidth={2.25} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
