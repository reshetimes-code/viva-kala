import { notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
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

  return (
    <TemplateFillForm
      templateId={template.id}
      templateLabel={template.label}
      photoStyle={template.photoStyle}
    />
  );
}
