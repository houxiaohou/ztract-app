import { useTranslation } from 'react-i18next';

export function Testimonial() {
  const { t } = useTranslation('auth');

  return (
    <figure className="relative flex max-w-xl flex-col gap-6">
      <blockquote className="text-2xl font-medium leading-relaxed tracking-tight text-foreground">
        {t('testimonial_quote')}
      </blockquote>
      <span
        className="absolute -left-[42px] -top-[42px] font-serif text-[160px] leading-none text-primary/20 select-none"
        aria-hidden
      >
        &ldquo;
      </span>
      <figcaption className="flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-full bg-muted"
          aria-hidden
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">
            {t('testimonial_author')}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('testimonial_role')}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
