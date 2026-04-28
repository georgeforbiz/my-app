"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, resendConfirmation, requestPasswordReset, user } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const nextRoute = searchParams.get("next") || "/dashboard";
  const emailPrefill = searchParams.get("email") || "";
  const tx =
    language === "hy"
      ? {
          eyebrow: "Հաշիվ",
          title: "Մուտք",
          subtitle: "Ապահով մուտք տանտերերի և ծառայություն մատուցողների համար։",
          email: "Էլ. հասցե",
          password: "Գաղտնաբառ",
          forgot: "Մոռացե՞լ եք գաղտնաբառը",
          closeReset: "Փակել վերականգնումը",
          resetTitle: "Վերականգնել գաղտնաբառը",
          resetSubtitle: "Մուտքագրեք էլ. հասցեն, և մենք կուղարկենք վերականգնման հղումը։",
          resetEmail: "Վերականգնման էլ. հասցե",
          sendReset: "Ուղարկել վերականգնման հղում",
          sendingReset: "Ուղարկվում է...",
          resend: "Վերաուղարկել հաստատման նամակը",
          sendingConfirmation: "Հաստատումը ուղարկվում է...",
          signIn: "Մուտք",
          signingIn: "Մուտք է կատարվում...",
          noAccount: "Հաշիվ չունե՞ք",
          register: "Գրանցվել",
          resetEmailRequired: "Խնդրում ենք մուտքագրել էլ. հասցեն վերականգնման դաշտում։",
          confirmationSent: "Հաստատման նամակը ուղարկվեց։ Ստուգեք մուտքային և spam թղթապանակները։",
          resetSent: "Գաղտնաբառի վերականգնման նամակը ուղարկվեց։ Ստուգեք մուտքային և spam թղթապանակները։",
          resendNeedsEmail: "Նախ մուտքագրեք էլ. հասցեն, հետո վերաուղարկեք հաստատումը։"
        }
      : language === "ru"
        ? {
            eyebrow: "Аккаунт",
            title: "Вход",
            subtitle: "Безопасный вход для клиентов и исполнителей.",
            email: "Email",
            password: "Пароль",
            forgot: "Забыли пароль?",
            closeReset: "Закрыть восстановление",
            resetTitle: "Сброс пароля",
            resetSubtitle: "Введите email, и мы отправим ссылку для сброса пароля.",
            resetEmail: "Email для сброса",
            sendReset: "Отправить ссылку",
            sendingReset: "Отправка...",
            resend: "Повторно отправить подтверждение",
            sendingConfirmation: "Отправка подтверждения...",
            signIn: "Войти",
            signingIn: "Вход...",
            noAccount: "Нет аккаунта?",
            register: "Регистрация",
            resetEmailRequired: "Введите email в поле для сброса.",
            confirmationSent: "Письмо подтверждения отправлено. Проверьте входящие и спам.",
            resetSent: "Письмо для сброса пароля отправлено. Проверьте входящие и спам.",
            resendNeedsEmail: "Сначала введите email, затем отправьте подтверждение."
          }
        : {
            eyebrow: "Account",
            title: "Login",
            subtitle: "Secure access for homeowners and contractors.",
            email: "Email",
            password: "Password",
            forgot: "Forgot password?",
            closeReset: "Close reset",
            resetTitle: "Reset your password",
            resetSubtitle: "Enter your email and we will send you a reset link.",
            resetEmail: "Reset Email",
            sendReset: "Send reset link",
            sendingReset: "Sending reset link...",
            resend: "Resend confirmation email",
            sendingConfirmation: "Sending confirmation...",
            signIn: "Sign in",
            signingIn: "Signing in...",
            noAccount: "No account?",
            register: "Register",
            resetEmailRequired: "Please enter your email in the reset field.",
            confirmationSent: "Confirmation email sent. Please check your inbox and spam folder.",
            resetSent: "Password reset email sent. Please check your inbox and spam folder.",
            resendNeedsEmail: "Enter your email first, then resend confirmation."
          };

  useEffect(() => {
    if (user) router.replace(nextRoute);
  }, [user, router, nextRoute]);

  useEffect(() => {
    if (!emailPrefill) return;
    setEmail(emailPrefill);
    setResetEmail(emailPrefill);
  }, [emailPrefill]);

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const res = await signIn(email, password);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.replace(nextRoute);
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setError(tx.resendNeedsEmail);
      return;
    }
    setError(null);
    setInfo(null);
    setResendPending(true);
    const res = await resendConfirmation(email.trim());
    setResendPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setInfo(tx.confirmationSent);
  }

  async function handleForgotPasswordSend() {
    if (!resetEmail.trim()) {
      setError(tx.resetEmailRequired);
      return;
    }
    setError(null);
    setInfo(null);
    setResetPending(true);
    const res = await requestPasswordReset(resetEmail.trim());
    setResetPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setInfo(tx.resetSent);
  }

  const showResend = Boolean(error && error.toLowerCase().includes("confirm"));

  return (
    <VstahShell eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              {tx.password}
            </label>
            <button
              type="button"
              onClick={() => {
                setShowResetForm((prev) => !prev);
                if (!resetEmail.trim() && email.trim()) setResetEmail(email.trim());
                setError(null);
                setInfo(null);
              }}
              className="text-xs font-semibold text-[#0033A0] underline underline-offset-2 transition hover:text-[#002b86]"
            >
              {showResetForm ? tx.closeReset : tx.forgot}
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}
        {showResend ? (
          <button
            type="button"
            onClick={() => void handleResendConfirmation()}
            disabled={resendPending}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70"
          >
            {resendPending ? tx.sendingConfirmation : tx.resend}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          {pending ? tx.signingIn : tx.signIn}
        </button>
      </form>
      {showResetForm ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{tx.resetTitle}</p>
          <p className="mt-1 text-xs text-slate-600">{tx.resetSubtitle}</p>
          <label htmlFor="resetEmail" className="mt-3 block text-sm font-medium text-slate-700">
            {tx.resetEmail}
          </label>
          <input
            id="resetEmail"
            type="email"
            autoComplete="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
          <button
            type="button"
            onClick={() => void handleForgotPasswordSend()}
            disabled={resetPending}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-70"
          >
            {resetPending ? tx.sendingReset : tx.sendReset}
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.noAccount}{" "}
        <Link href={`/register?next=${encodeURIComponent(nextRoute)}`} className="font-semibold underline" style={{ color: NAVY }}>
          {tx.register}
        </Link>
      </p>
    </VstahShell>
  );
}
