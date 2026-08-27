import { getCurrentUser } from "@/lib/auth";
import LandingPage from "./LandingPage";

export default async function Home() {
  const user = await getCurrentUser();
  return <LandingPage isLoggedIn={!!user} />;
}
