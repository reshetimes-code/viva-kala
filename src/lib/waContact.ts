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

// Sent by a hall right after it opens a client's account through its own
// panel (see HallAddClientForm) - the hall picks the recipient from its own
// WhatsApp contacts (no phone number stored for the client anywhere in this
// app), so the link intentionally omits a number, same as HallClientCard's
// "send the invite link" button below.
const CLIENT_ACCOUNT_MESSAGE = {
  he: (username: string, password: string) =>
    `מזל טוב! 🎉 פתחנו לכם חשבון במערכת VIVA להזמנה הדיגיטלית שלכם.\n\n` +
    `כניסה למערכת: https://vivaa.co.il/login\n` +
    `שם משתמש: ${username}\n` +
    `סיסמה: ${password}\n\n` +
    `היכנסו ותתחילו ליצור את ההזמנה ולסדר את שולחנות האורחים 💍`,
  en: (username: string, password: string) =>
    `Congratulations! 🎉 We've opened your VIVA account for your digital invitation.\n\n` +
    `Log in here: https://vivaa.co.il/login\n` +
    `Username: ${username}\n` +
    `Password: ${password}\n\n` +
    `Log in to start creating your invitation and arranging your guest tables 💍`,
};

export function clientAccountWhatsappHref(username: string, password: string, locale: "he" | "en"): string {
  return `https://wa.me/?text=${encodeURIComponent(CLIENT_ACCOUNT_MESSAGE[locale](username, password))}`;
}
