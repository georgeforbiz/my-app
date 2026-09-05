"use client";

import Link from "next/link";
import { Building2, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/lib/auth/auth-context";
import type { ProviderProfileSettingsInput } from "@/lib/auth/profile-fields";
import { ROUTES } from "@/lib/routes";
import { useLanguage } from "@/lib/i18n/language-context";

function profileFromUser(user: ReturnType<typeof useAuth>["user"]): ProviderProfileSettingsInput {
  return {
    full_name: user?.full_name?.trim() ?? "",
    business_name: user?.business_name?.trim() ?? "",
    phone_number: user?.phone_number?.trim() ?? ""
  };
}

export function ProviderProfileSettings({ backHref = ROUTES.dashboard }: { backHref?: string }) {
  const { user, loading, updateProfile } = useAuth();
  const { language } = useLanguage();
  const [form, setForm] = useState<ProviderProfileSettingsInput>(() => profileFromUser(null));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  const tx =
    language === "hy"
      ? {
          title: "Անձնական տվյալներ",
          subtitle: "Այս տվյալները ավտոմատ լրացվում են ձեր պայմանագրերի մատակարարի բաժնում։",
          fullName: "Ամբողջ անուն",
          businessName: "Բիզնեսի անվանում",
          phoneNumber: "Հեռախոսահամար",
          email: "Էլ․ փոստ",
          save: "Պահպանել",
          saving: "Պահպանում…",
          saved: "Պահպանված է",
          completeRequired: "Լրացրեք բոլոր պարտադիր դաշտերը։",
          back: "Վերադառնալ վահանակ",
          readOnlyEmail: "Էլ․ փոստը փոխել հնարավոր չէ այստեղից։"
        }
      : language === "ru"
        ? {
            title: "Личные данные",
            subtitle: "Эти данные автоматически подставляются в блок «Исполнитель» в договорах.",
            fullName: "ФИО",
            businessName: "Название компании",
            phoneNumber: "Телефон",
            email: "Эл. почта",
            save: "Сохранить",
            saving: "Сохранение…",
            saved: "Сохранено",
            completeRequired: "Заполните все обязательные поля.",
            back: "Назад в панель",
            readOnlyEmail: "Email здесь изменить нельзя."
          }
        : {
            title: "Personal details",
            subtitle: "These details auto-fill the provider section on every agreement you create.",
            fullName: "Full name",
            businessName: "Business name",
            phoneNumber: "Phone number",
            email: "Email",
            save: "Save changes",
            saving: "Saving…",
            saved: "Saved",
            completeRequired: "Please fill in all required fields.",
            back: "Back to dashboard",
            readOnlyEmail: "Email cannot be changed here."
          };

  useEffect(() => {
    if (!user) return;
    setForm(profileFromUser(user));
  }, [user]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.full_name.trim() || !form.business_name.trim() || !form.phone_number.trim()) {
      setError(tx.completeRequired);
      return;
    }
    setPending(true);
    const result = await updateProfile(form);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(tx.saved);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#0033A0]">{tx.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{tx.subtitle}</p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            id="settings-full-name"
            label={tx.fullName}
            icon={User}
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            autoComplete="name"
            required
          />
          <FormField
            id="settings-business-name"
            label={tx.businessName}
            icon={Building2}
            value={form.business_name}
            onChange={(e) => setForm((prev) => ({ ...prev, business_name: e.target.value }))}
            autoComplete="organization"
            required
          />
          <FormField
            id="settings-phone"
            label={tx.phoneNumber}
            icon={Phone}
            value={form.phone_number}
            onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
            autoComplete="tel"
            inputMode="tel"
            required
            wrapperClassName="md:col-span-2"
          />
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="settings-email">
              {tx.email}
            </label>
            <input
              id="settings-email"
              type="email"
              value={user.email}
              readOnly
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500">{tx.readOnlyEmail}</p>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 text-sm font-semibold text-emerald-700">{success}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0033A0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#002a7a] disabled:opacity-60"
          >
            {pending ? tx.saving : tx.save}
          </button>
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {tx.back}
          </Link>
        </div>
      </form>
    </div>
  );
}
