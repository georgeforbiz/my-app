"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LockKeyhole, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { FormField } from "@/components/form-field";
import { VstahShell } from "@/components/vstah-shell";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { clearSigningOut, isSigningOut, markPasswordRecovery } from "@/lib/auth/constants";
import { ROUTES, authPath } from "@/lib/routes";
import { useLanguage } from "@/lib/i18n/language-context";
import { ensureSupabaseBrowser, getSupabaseBrowser } from "@/lib/supabase/browser-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, signOut, user, loading, passwordRecovery } = useAuth();
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [linkChecked, setLinkChecked] = useState(false);
  const [expectingRecovery, setExpectingRecovery] = useState(false);

  const tx =
    language === "hy"
      ? {
          eyebrow: "Հաշիվ",
          title: "Նոր գաղտնաբառ",
          subtitle: "Սահմանեք նոր գաղտնաբառ ձեր հաշվի համար",
          password: "Նոր գաղտնաբառ",
          confirmPassword: "Հաստատել գաղտնաբառը",
          save: "Պահպանել գաղտնաբառը",
          saving: "Պահպանում…",
          passwordsNoMatch: "Գաղտնաբառերը չեն համընկնում։",
          passwordTooShort: "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ։",
          verifying: "Ստուգում ենք վերականգնման հղումը…",
          invalidLink: "Այս վերականգնման հղումը անվավեր է կամ ժամկետանց է։",
          requestNew: "Պահանջել նոր հղում",
          backToLogin: "Վերադառնալ մուտք"
        }
      : language === "ru"
        ? {
            eyebrow: "Аккаунт",
            title: "Новый пароль",
            subtitle: "Задайте новый пароль для вашего аккаунта",
            password: "Новый пароль",
            confirmPassword: "Подтвердите пароль",
            save: "Сохранить пароль",
            saving: "Сохранение…",
            passwordsNoMatch: "Пароли не совпадают.",
            passwordTooShort: "Минимум 6 символов.",
            verifying: "Проверяем ссылку для сброса…",
            invalidLink: "Ссылка для сброса недействительна или устарела.",
            requestNew: "Запросить новую ссылку",
            backToLogin: "Вернуться ко входу"
          }
        : {
            eyebrow: "Account",
            title: "Set new password",
            subtitle: "Choose a new password for your account",
            password: "New password",
            confirmPassword: "Confirm password",
            save: "Save password",
            saving: "Saving…",
            passwordsNoMatch: "Passwords do not match.",
            passwordTooShort: "Password must be at least 6 characters.",
            verifying: "Verifying your reset link…",
            invalidLink: "This reset link is invalid or has expired.",
            requestNew: "Request a new link",
            backToLogin: "Back to login"
          };

  useEffect(() => {
    let cancelled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const search = typeof window !== "undefined" ? window.location.search : "";
      const fromLink = hash.includes("type=recovery") || search.includes("type=recovery");
      if (fromLink) {
        markPasswordRecovery();
        if (!cancelled) setExpectingRecovery(true);
      }

      const supabase = (await ensureSupabaseBrowser()) ?? getSupabaseBrowser();
      if (supabase) {
        try {
          await supabase.auth.getSession();
        } catch {
          // continue — auth context may still resolve the session
        }
      }

      // Give the recovery hash a moment to become a session before showing "invalid".
      settleTimer = setTimeout(() => {
        if (!cancelled) setLinkChecked(true);
      }, fromLink ? 1500 : 0);
    })();

    return () => {
      cancelled = true;
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

  useEffect(() => {
    if (user) setExpectingRecovery(false);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(tx.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(tx.passwordsNoMatch);
      return;
    }

    setPending(true);
    const res = await updatePassword(password);
    if (res.error) {
      setPending(false);
      setError(res.error);
      return;
    }

    clearSigningOut();
    await signOut();
    router.replace(`${ROUTES.login}?reset=1`);
  }

  const waiting = !linkChecked || loading || ((expectingRecovery || passwordRecovery) && !user);
  const canReset = Boolean(user) && !isSigningOut();
  const showForm = !waiting && canReset;
  const showInvalid = !waiting && !canReset;

  return (
    <VstahShell eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle} hideAuthControls hideHeader>
      {waiting ? <p className="text-sm font-medium text-slate-600">{tx.verifying}</p> : null}

      {showInvalid ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-red-600">{tx.invalidLink}</p>
          <Link
            href={`${ROUTES.login}?forgot=1`}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {tx.requestNew}
          </Link>
          <p className="text-center text-sm text-slate-600">
            <Link href={authPath(ROUTES.login)} className="font-semibold underline" style={{ color: NAVY }}>
              {tx.backToLogin}
            </Link>
          </p>
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <FormField
            id="new-password"
            label={tx.password}
            icon={Lock}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormField
            id="confirm-password"
            label={tx.confirmPassword}
            icon={LockKeyhole}
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
            style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
          >
            <KeyRound className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
            {pending ? tx.saving : tx.save}
          </button>
        </form>
      ) : null}
    </VstahShell>
  );
}
