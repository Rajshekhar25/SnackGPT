import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RegisterForm from "@/app/components/RegisterForm";

export const metadata = { title: "Sign up — SnackGPT" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/");
  return <RegisterForm />;
}
