"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Building2,
  Lock,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormField } from "@/components/form-field";
import { VstahShell } from "@/components/vstah-shell";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { clearSigningOut, isSigningOut } from "@/lib/auth/constants";
import { EMAIL_ALREADY_EXISTS_MESSAGE } from "@/lib/auth/humanize-auth-error";
import { ROUTES, authPath, sanitizeNextRoute } from "@/lib/routes";
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
  const { signUp, user, loading } = useAuth();
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
  const nextRoute = sanitizeNextRoute(searchParams.get("next"));
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
          login: "Մուտք",
          legalPrefix: "Շարունակելով՝ դուք համաձայնում եք մեր",
          termsOfService: "Ծառայության պայմաններին",
          legalAnd: "և",
          privacyPolicy: "Գաղտնիության քաղաքականությանը",
          showPassword: "Ցուցադրել գաղտնաբառը",
          hidePassword: "Թաքցնել գաղտնաբառը",
          emailAlreadyExists:
            "Այս էլ․ հասցեով հաշիվ արդեն գոյություն ունի։ Խնդրում ենք մուտք գործել։"
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
            login: "Войти",
            legalPrefix: "Продолжая, вы соглашаетесь с нашими",
            termsOfService: "Условиями использования",
            legalAnd: "и",
            privacyPolicy: "Политикой конфиденциальности",
            showPassword: "Показать пароль",
            hidePassword: "Скрыть пароль",
            emailAlreadyExists:
              "Аккаунт с этим email уже существует. Пожалуйста, войдите в систему."
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
            login: "Login",
            legalPrefix: "By continuing, you agree to our",
            termsOfService: "Terms of Service",
            legalAnd: "and",
            privacyPolicy: "Privacy Policy",
            showPassword: "Show password",
            hidePassword: "Hide password",
            emailAlreadyExists: EMAIL_ALREADY_EXISTS_MESSAGE
          };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      clearSigningOut();
      return;
    }
    if (isSigningOut()) return;
    clearSigningOut();
    router.replace(nextRoute);
  }, [user, loading, router, nextRoute]);

  useEffect(() => {
    router.prefetch(nextRoute);
  }, [router, nextRoute]);

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
        setError(res.error === EMAIL_ALREADY_EXISTS_MESSAGE ? tx.emailAlreadyExists : res.error);
        return;
      }
      if (res.needsEmailConfirmation) {
        setInfo(tx.confirmEmail);
        return;
      }
      clearSigningOut();
      router.replace(nextRoute);
    } finally {
      setPending(false);
      submitLock.current = false;
    }
  }

  return (
    <VstahShell
      eyebrow={tx.eyebrow}
      title={tx.title}
      subtitle={tx.subtitle}
      maxWidthClass="max-w-2xl"
      hideAuthControls
      hideHeader
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            id="fullName"
            label={tx.fullName}
            icon={User}
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <FormField
            id="businessName"
            label={tx.businessName}
            icon={Building2}
            type="text"
            autoComplete="organization"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <FormField
            id="phoneNumber"
            label={tx.phoneNumber}
            icon={Phone}
            type="tel"
            autoComplete="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <FormField
            id="serviceCategory"
            label={tx.serviceCategory}
            icon={Briefcase}
            type="text"
            readOnly
            value={serviceCategoryLabel[language]}
          />
          <FormField
            id="serviceArea"
            label={tx.serviceArea}
            icon={MapPin}
            type="text"
            required
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            wrapperClassName="md:col-span-2"
          />
        </div>

        <FormField
          id="email"
          label={tx.email}
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          id="password"
          label={tx.password}
          icon={Lock}
          type="password"
          passwordToggle
          showPasswordLabel={tx.showPassword}
          hidePasswordLabel={tx.hidePassword}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormField
          id="confirm"
          label={tx.confirmPassword}
          icon={LockKeyhole}
          type="password"
          passwordToggle
          showPasswordLabel={tx.showPassword}
          hidePasswordLabel={tx.hidePassword}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}
        <p className="text-center text-xs leading-relaxed text-slate-500">
          {tx.legalPrefix}{" "}
          <Link href="/terms" className="font-semibold text-slate-700 underline-offset-2 hover:underline" style={{ color: NAVY }}>
            {tx.termsOfService}
          </Link>{" "}
          {tx.legalAnd}{" "}
          <Link href="/privacy" className="font-semibold text-slate-700 underline-offset-2 hover:underline" style={{ color: NAVY }}>
            {tx.privacyPolicy}
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          {pending ? tx.creating : tx.create}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.alreadyRegistered}{" "}
        <Link href={authPath(ROUTES.login, nextRoute)} className="font-semibold underline" style={{ color: NAVY }}>
          {tx.login}
        </Link>
      </p>
    </VstahShell>
  );
}
