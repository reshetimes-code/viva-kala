import { notFound } from "next/navigation";
import { TEMPLATES, templateLabel } from "@/lib/templates";
import { getServerLocale } from "@/lib/i18n/server";
import TemplateFillForm from "./TemplateFillForm";

export default async function TemplateFillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) {
    notFound();
  }

  const locale = await getServerLocale();

  return (
    <TemplateFillForm
      templateId={template.id}
      templateLabel={templateLabel(template, locale)}
      photoStyle={template.photoStyle}
    />
  );
}
