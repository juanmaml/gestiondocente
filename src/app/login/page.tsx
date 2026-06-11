import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/calendario");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            GD
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión Docente</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tu aula, organizada en un solo lugar
          </p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Educación Secundaria · Cada docente gestiona sus propios datos
        </p>
      </div>
    </main>
  );
}
