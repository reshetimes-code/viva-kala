import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById } from "@/lib/store";
import { TEMPLATES, templateLabel, type TemplateFields } from "@/lib/templates";
import { getServerLocale } from "@/lib/i18n/server";
import TemplateFillForm from "@/app/create/templates/[id]/TemplateFillForm";
import CreateInvitePage, { type ImageInviteInitialData } from "@/app/create/image/page";

export default async function EditInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) notFound();

  if (invite.mode === "template" && invite.templateId) {
    const template = TEMPLATES.find((t) => t.id === invite.templateId);
    if (!template) notFound();

    const locale = await getServerLocale();

    return (
      <TemplateFillForm
        templateId={template.id}
        templateLabel={templateLabel(template, locale)}
        photoStyle={template.photoStyle}
        editInviteId={invite.id}
        initialFields={invite.templateFields as unknown as TemplateFields}
        initialAddress={invite.address}
        initialEventDate={invite.eventDate}
      />
    );
  }

  const initialData: ImageInviteInitialData = {
    invitedAs: invite.invitedAs,
    partyType: invite.partyType,
    celebrants: invite.celebrants,
    willBe: invite.willBe,
    eventDate: invite.eventDate,
    eventStart: invite.eventStart,
    meetAt: invite.meetAt,
    address: invite.address,
    showNavBtn: invite.showNavBtn,
    imgOrBe: invite.imgOrBe,
    gladSee: invite.gladSee,
    notes: invite.notes,
    imageUrl: invite.imageUrl,
    wantRsvp: invite.wantRsvp,
    eventCategory: invite.eventCategory,
    categoryFields: invite.categoryFields,
    textStyle: invite.textStyle,
  };

  return <CreateInvitePage editInviteId={invite.id} initialData={initialData} />;
}
