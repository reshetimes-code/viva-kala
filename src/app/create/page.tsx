import Link from "next/link";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";

export default function ChooseCreateMethodPage() {
  return (
    <DesktopPhoneWrapper title="יצירת הזמנה">
      <div className="choose-page">
        <h1 className="choose-title">איך תרצו ליצור את ההזמנה?</h1>

        <div className="choose-grid">
          <Link href="/create/templates" className="choose-card">
            <span className="choose-icon">🎨</span>
            <h3>בחירת עיצוב מוכן</h3>
            <p>גלריית תבניות מעוצבות - ממלאים פרטים והעיצוב נבנה אוטומטית</p>
          </Link>

          <Link href="/create/image" className="choose-card">
            <span className="choose-icon">🖼️</span>
            <h3>העלאת תמונה משלכם</h3>
            <p>עיצבתם הזמנה בעצמכם? העלו אותה כתמונה אחת</p>
          </Link>
        </div>
      </div>
    </DesktopPhoneWrapper>
  );
}
