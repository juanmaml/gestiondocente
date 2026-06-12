"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/Toaster";
import {
  createYearAction,
  logoutAction,
  setActiveYearAction,
} from "./actions";

type Year = { id: string; name: string; isActive: boolean };

const NAV = [
  { href: "/calendario", label: "Calendario", icon: "📅" },
  { href: "/asignaturas", label: "Asignaturas", icon: "📚" },
  { href: "/alumnos", label: "Alumnos", icon: "🧑‍🎓" },
  { href: "/horario", label: "Horario", icon: "🕒" },
];

export function Sidebar({
  userName,
  years,
  activeYearId,
}: {
  userName: string;
  years: Year[];
  activeYearId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [addingYear, setAddingYear] = useState(false);
  const [changingYear, startYearTransition] = useTransition();
  const toast = useToast();

  const activeYearName =
    years.find((y) => y.id === activeYearId)?.name ?? "";

  // Tras cambiar o crear un curso se vuelve al calendario: evita quedarse
  // mirando una clase o un alumno del curso anterior.
  function changeYear(yearId: string) {
    const name = years.find((y) => y.id === yearId)?.name ?? "";
    const formData = new FormData();
    formData.set("yearId", yearId);
    startYearTransition(async () => {
      try {
        await setActiveYearAction(formData);
        toast.success(`Ahora estás trabajando en el curso ${name}.`);
        router.push("/calendario");
      } catch {
        toast.error("No se pudo cambiar de curso.");
      }
    });
  }

  return (
    <>
      {/* Top bar móvil */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Gestión Docente</span>
          {activeYearName && (
            <span className="chip bg-indigo-50 font-semibold text-indigo-700">
              {activeYearName}
            </span>
          )}
        </div>
        <button
          className="btn-ghost"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } w-full shrink-0 border-r border-gray-200 bg-white md:block md:w-64 print:hidden`}
      >
        <div className="flex h-full flex-col p-4">
          <Link href="/calendario" className="mb-6 flex items-center gap-2 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              GD
            </span>
            <span className="font-semibold text-gray-900">Gestión Docente</span>
          </Link>

          {/* Curso académico activo */}
          <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <span>📅 Curso activo</span>
              {changingYear && <Spinner className="h-3.5 w-3.5" />}
            </p>
            {/* La key fuerza el remontado cuando el curso activo cambia en el
                servidor (p. ej. al crear uno nuevo), para que el select no se
                quede mostrando el curso anterior. */}
            <select
              key={activeYearId}
              name="yearId"
              defaultValue={activeYearId}
              disabled={changingYear}
              onChange={(e) => changeYear(e.currentTarget.value)}
              className="input border-indigo-200 py-1.5 text-sm font-semibold"
              aria-label="Curso académico activo"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
            {addingYear ? (
              <form
                action={async (formData) => {
                  const name = String(formData.get("name") ?? "").trim();
                  try {
                    await createYearAction(formData);
                    toast.success(`Curso ${name} creado y activado.`);
                    setAddingYear(false);
                    router.push("/calendario");
                  } catch {
                    toast.error("No se pudo crear el curso.");
                  }
                }}
                className="mt-2 flex gap-1"
              >
                <input
                  name="name"
                  placeholder="2026-2027"
                  className="input py-1 text-sm"
                  autoFocus
                  required
                />
                <button className="btn-primary px-2 py-1 text-xs" type="submit">
                  OK
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingYear(true)}
                className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
              >
                + Nuevo curso
              </button>
            )}
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-gray-200 pt-4">
            <p className="px-2 text-sm font-medium text-gray-700">{userName}</p>
            <ThemeToggle />
            <form action={logoutAction}>
              <button className="btn-ghost mt-1 w-full justify-start px-2 text-sm text-gray-500">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
