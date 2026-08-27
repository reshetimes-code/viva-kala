import Link from "next/link";
import { TEMPLATES, TemplateCard, DEFAULT_TEMPLATE_FIELDS, PHOTO_STYLE_LABEL, EVENT_CATEGORIES, type EventCategory } from "@/lib/templates";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";

export default async function TemplateGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = EVENT_CATEGORIES.includes(category as EventCategory) ? (category as EventCategory) : null;

  const templates = activeCategory ? TEMPLATES.filter((t) => t.categories.includes(activeCategory)) : TEMPLATES;

  return (
    <DesktopPhoneWrapper title="גלריית עיצובים">
    <div className="tpl-gallery-page">
      <div className="tpl-gallery-header">
        <h1>בחרו את תבנית העיצוב האהובה עליכם</h1>
        <p>לכל תבנית אפשר גם להוסיף תמונה משלכם - כל אחת ממקמת אותה אחרת</p>
      </div>

      <div className="tpl-category-filters">
        <Link href="/create/templates" className={`tpl-category-pill${!activeCategory ? " is-active" : ""}`}>
          הכל
        </Link>
        {EVENT_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/create/templates?category=${encodeURIComponent(c)}`}
            className={`tpl-category-pill${activeCategory === c ? " is-active" : ""}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="tpl-gallery-grid">
        {templates.map((t) => (
          <div key={t.id} className="tpl-gallery-item">
            <div className="tpl-thumb-wrap">
              <TemplateCard templateId={t.id} fields={DEFAULT_TEMPLATE_FIELDS} useSampleImage />
            </div>
            <h3 className="tpl-gallery-item-title">{t.label}</h3>
            <p className="tpl-photo-style-tag">📷 {PHOTO_STYLE_LABEL[t.photoStyle]}</p>
            <Link href={`/create/templates/${t.id}`} className="tpl-choose-btn">
              בחירת תבנית עיצוב
            </Link>
          </div>
        ))}
      </div>

      {templates.length === 0 && <p className="tpl-gallery-empty">אין עדיין תבניות בקטגוריה הזו.</p>}
    </div>
    </DesktopPhoneWrapper>
  );
}
