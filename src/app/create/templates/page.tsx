import Link from "next/link";
import {
  TEMPLATES,
  TemplateCard,
  DEFAULT_TEMPLATE_FIELDS,
  EVENT_CATEGORIES,
  templateLabel,
  photoStyleLabel,
  type EventCategory,
} from "@/lib/templates";
import { eventCategoryLabel } from "@/lib/eventCategories";
import { getServerLocale } from "@/lib/i18n/server";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";

const COPY = {
  he: {
    wrapperTitle: "גלריית עיצובים",
    heading: "בחרו את תבנית העיצוב האהובה עליכם",
    subheading: "לכל תבנית אפשר גם להוסיף תמונה משלכם - כל אחת ממקמת אותה אחרת",
    all: "הכל",
    choose: "בחירת תבנית עיצוב",
    empty: "אין עדיין תבניות בקטגוריה הזו.",
  },
  en: {
    wrapperTitle: "Design gallery",
    heading: "Choose your favorite design template",
    subheading: "You can add your own photo to any template - each one places it differently",
    all: "All",
    choose: "Choose this design",
    empty: "There are no templates in this category yet.",
  },
};

export default async function TemplateGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const locale = await getServerLocale();
  const t = COPY[locale];
  const { category } = await searchParams;
  const activeCategory = EVENT_CATEGORIES.includes(category as EventCategory) ? (category as EventCategory) : null;

  const templates = activeCategory ? TEMPLATES.filter((t) => t.categories.includes(activeCategory)) : TEMPLATES;

  return (
    <DesktopPhoneWrapper title={t.wrapperTitle}>
    <div className="tpl-gallery-page">
      <div className="tpl-gallery-header">
        <h1>{t.heading}</h1>
        <p>{t.subheading}</p>
      </div>

      <div className="tpl-category-filters">
        <Link href="/create/templates" className={`tpl-category-pill${!activeCategory ? " is-active" : ""}`}>
          {t.all}
        </Link>
        {EVENT_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/create/templates?category=${encodeURIComponent(c)}`}
            className={`tpl-category-pill${activeCategory === c ? " is-active" : ""}`}
          >
            {eventCategoryLabel(c, locale)}
          </Link>
        ))}
      </div>

      <div className="tpl-gallery-grid">
        {templates.map((tpl) => (
          <div key={tpl.id} className="tpl-gallery-item">
            <div className="tpl-thumb-wrap">
              <TemplateCard templateId={tpl.id} fields={DEFAULT_TEMPLATE_FIELDS} useSampleImage />
            </div>
            <h3 className="tpl-gallery-item-title">{templateLabel(tpl, locale)}</h3>
            <p className="tpl-photo-style-tag">📷 {photoStyleLabel(tpl.photoStyle, locale)}</p>
            <Link href={`/create/templates/${tpl.id}`} className="tpl-choose-btn">
              {t.choose}
            </Link>
          </div>
        ))}
      </div>

      {templates.length === 0 && <p className="tpl-gallery-empty">{t.empty}</p>}
    </div>
    </DesktopPhoneWrapper>
  );
}
