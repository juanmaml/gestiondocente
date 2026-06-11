import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Devuelve el usuario autenticado o redirige a /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}
