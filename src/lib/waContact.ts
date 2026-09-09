// Shared by the admin "leads" page and each user's own leads list in the
// main admin panel - both need the exact same wa.me link + opening message.

// Turns a stored phone number into the digit string wa.me expects (Israeli
// local numbers need the 0 swapped for the 972 country code).
export function toWaDigits(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "972" + digits.slice(1);
  return digits;
}

export function leadContactMessage(guestName: string, ownerUsername: string | null): string {
  const name = guestName || "שם";
  const owner = ownerUsername || "אחד האירועים במערכת";
  return `שלום ${name}, נעים מאוד! אנחנו חוזרים אליכם בעקבות הפרטים שהשארתם, במערכת אישורי ההגעה מהאירוע של ${owner}, לגבי אירוע שאתם חוגגים בקרוב. האם תרצו לקבל פרטים מלאים מאיתנו?`;
}

export function leadWhatsappHref(phone: string, guestName: string, ownerUsername: string | null): string {
  return `https://wa.me/${toWaDigits(phone)}?text=${encodeURIComponent(leadContactMessage(guestName, ownerUsername))}`;
}
