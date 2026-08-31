import type { LegalPageContent } from "@/lib/i18n/legal-static";

export function LegalDocumentBody({ content }: { content: LegalPageContent }) {
  return (
    <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 md:text-base">
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-lg font-bold text-slate-900">{section.heading}</h2>

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-2">
              {paragraph}
            </p>
          ))}

          {section.listIntro ? <p className="mt-2">{section.listIntro}</p> : null}

          {section.listItems?.length ? (
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {section.listItems.map((item) => (
                <li key={`${item.label ?? ""}-${item.text}`}>
                  {item.label ? (
                    <>
                      <span className="font-semibold text-slate-900">{item.label}: </span>
                      {item.text}
                    </>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
