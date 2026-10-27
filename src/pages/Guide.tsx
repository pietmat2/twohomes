import { GUIDE_TOPICS } from '../lib/guide'
import { useI18n } from '../lib/i18n'

export default function Guide() {
  const { t } = useI18n()

  return (
    <div className="space-y-12">
      <section>
        <h1 className="wide text-2xl font-semibold">{t('guide.title')}</h1>
        <p className="mt-3 max-w-[48ch] text-base text-muted">{t('guide.intro')}</p>
      </section>

      {GUIDE_TOPICS.map((topic) => (
        <section key={topic} className="border-t border-line pt-6">
          <h2 className="wide max-w-[28ch] text-xl font-semibold">
            {t(`guide.${topic}.title`)}
          </h2>
          <p className="mt-3 max-w-[60ch] text-base text-muted">{t(`guide.${topic}.body`)}</p>

          <p className="mt-6 text-sm text-faint">{t('guide.tipsLabel')}</p>
          <ul className="mt-2 space-y-2">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="flex gap-3 text-base">
                <span className="mt-2.5 size-1 shrink-0 bg-ink" aria-hidden />
                <span className="max-w-[56ch]">{t(`guide.${topic}.tip${n}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-3 border-t border-line pt-6">
        <p className="max-w-[60ch] text-base text-danger">{t('guide.safety')}</p>
        <p className="max-w-[60ch] text-sm text-faint">{t('guide.disclaimer')}</p>
      </section>
    </div>
  )
}
