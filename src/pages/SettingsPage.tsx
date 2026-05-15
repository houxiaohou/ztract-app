import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation('common');

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('settings_title')}
      </h1>
      <p className="text-sm text-muted-foreground">{t('settings_subtitle')}</p>
    </section>
  );
}
