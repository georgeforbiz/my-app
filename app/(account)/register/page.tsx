"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

const DEFAULT_SERVICE_CATEGORY = "General Contractor" as const;
const serviceCategoryLabel = {
  en: "General Contractor",
  hy: "Գլխավոր կապալառու",
  ru: "Генеральный подрядчик"
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitLock = useRef(false);
  const nextRoute = searchParams.get("next") || "/dashboard";
  const tx =
    language === "hy"
      ? {
          eyebrow: "Հաշիվ",
          title: "Գրանցում",
          subtitle: "Հաշիվ՝ գործարքները կառավարելու համար։",
          passwordsNoMatch: "Գաղտնաբառերը չեն համընկնում։",
          passwordTooShort: "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ։",
          completeDetails: "Լրացրեք բոլոր պարտադիր դաշտերը։",
          confirmEmail: "Ստուգեք փոստը, հաստատեք էլ․ հասցեն, հետո մուտք գործեք։",
          fullName: "Ամբողջ անուն",
          businessName: "Բիզնեսի անվանում",
          phoneNumber: "Հեռախոսահամար",
          serviceCategory: "Ծառայության կատեգորիա",
          selectService: "Ընտրել ծառայությունը",
          serviceArea: "Տարածք",
          email: "Էլ․ փոստ",
          password: "Գաղտնաբառ",
          confirmPassword: "Հաստատել գաղտնաբառը",
          creating: "Ստեղծում…",
          create: "Ստեղծել հաշիվ",
          alreadyRegistered: "Արդեն գրանցվա՞ծ եք",
          login: "Մուտք"
        }
      : language === "ru"
        ? {
            eyebrow: "Аккаунт",
            title: "Регистрация",
            subtitle: "Аккаунт для соглашений с защитой платежей.",
            passwordsNoMatch: "Пароли не совпадают.",
            passwordTooShort: "Минимум 6 символов.",
            completeDetails: "Заполните все обязательные поля.",
            confirmEmail: "Проверьте почту, подтвердите email и войдите снова.",
            fullName: "ФИО",
            businessName: "Название компании",
            phoneNumber: "Телефон",
            serviceCategory: "Категория услуг",
            selectService: "Выберите категорию",
            serviceArea: "Регион работ",
            email: "Эл. почта",
            password: "Пароль",
            confirmPassword: "Пароль ещё раз",
            creating: "Создаём аккаунт…",
            create: "Создать аккаунт",
            alreadyRegistered: "Уже есть аккаунт?",
            login: "Войти"
          }
        : {
            eyebrow: "Account",
            title: "Register",
            subtitle: "Create an account to manage protected deals.",
            passwordsNoMatch: "Passwords do not match.",
            passwordTooShort: "Password must be at least 6 characters.",
            completeDetails: "Please fill in all required service provider details.",
            confirmEmail: "Check your inbox and confirm your email, then return here to log in.",
            fullName: "Full Name",
            businessName: "Business Name",
            phoneNumber: "Phone Number",
            serviceCategory: "Service Category",
            selectService: "Select service",
            serviceArea: "Service Area",
            email: "Email",
            password: "Password",
            confirmPassword: "Confirm password",
            creating: "Creating account...",
            create: "Create account",
            alreadyRegistered: "Already registered?",
            login: "Login"
          };

  useEffect(() => {
    if (user) router.replace(nextRoute);
  }, [user, router, nextRoute]);

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || submitLock.current) return;
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError(tx.passwordsNoMatch);
      return;
    }
    if (password.length < 6) {
      setError(tx.passwordTooShort);
      return;
    }
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setError(tx.completeDetails);
      return;
    }
    if (!fullName.trim() || !businessName.trim() || !phoneNumber.trim() || !serviceArea.trim()) {
      setError(tx.completeDetails);
      return;
    }
    submitLock.current = true;
    setPending(true);
    try {
      const res = await signUp(email, password, {
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        // Keep legacy metadata for backward compatibility in existing flows.
        full_name_or_business_name: `${businessName.trim()} (${fullName.trim()})`,
        phone_number: phoneNumber.trim(),
        service_category: DEFAULT_SERVICE_CATEGORY,
        service_area: serviceArea.trim()
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.needsEmailConfirmation) {
        setInfo(tx.confirmEmail);
        return;
      }
      router.replace(nextRoute);
      router.refresh();
    } finally {
      setPending(false);
      submitLock.current = false;
    }
  }

  return (
    <VstahShell eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
              {tx.fullName}
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-semibold text-slate-700">
              {tx.businessName}
            </label>
            <input
              id="businessName"
              type="text"
              autoComplete="organization"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700">
              {tx.phoneNumber}
            </label>
            <input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div>
            <label htmlFor="serviceCategory" className="block text-sm font-semibold text-slate-700">
              {tx.serviceCategory}
            </label>
            <input
              id="serviceCategory"
              type="text"
              readOnly
              value={serviceCategoryLabel[language]}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="serviceArea" className="block text-sm font-semibold text-slate-700">
              {tx.serviceArea}
            </label>
            <input
              id="serviceArea"
              type="text"
              required
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
            {tx.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
            {tx.password}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700">
            {tx.confirmPassword}
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          {pending ? tx.creating : tx.create}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.alreadyRegistered}{" "}
        <Link href={`/login?next=${encodeURIComponent(nextRoute)}`} className="font-semibold underline" style={{ color: NAVY }}>
          {tx.login}
        </Link>
      </p>
    </VstahShell>
  );
}
