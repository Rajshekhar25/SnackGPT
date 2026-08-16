import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/app/components/LoginForm";

export const metadata = { title: "Log in — SnackGPT" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return <LoginForm />;
}
