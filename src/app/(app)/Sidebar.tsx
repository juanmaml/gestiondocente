"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [addingYear, setAddingYear] = useState(false);
  const toast = useToast();

  return (
    <>
      {/* Top bar móvil */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <span className="font-semibold">Gestión Docente</span>
        <button className="btn-ghost" onClick={() => setOpen((v) => !v)}>
          ☰
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } w-full shrink-0 border-r border-gray-200 bg-white md:block md:w-64`}
      >
        <div className="flex h-full flex-col p-4">
          <Link href="/calendario" className="mb-6 flex items-center gap-2 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              GD
            </span>
            <span className="font-semibold text-gray-900">Gestión Docente</span>
          </Link>

          {/* Curso académico */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
              Curso académico
            </p>
            <form
              action={async (formData) => {
                try {
                  await setActiveYearAction(formData);
                  toast.success("Curso académico cambiado.");
                } catch {
                  toast.error("No se pudo cambiar de curso.");
                }
              }}
            >
              <select
                name="yearId"
                defaultValue={activeYearId}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="input py-1.5 text-sm"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </form>
            {addingYear ? (
              <form
                action={async (formData) => {
                  try {
                    await createYearAction(formData);
                    toast.success("Curso académico creado.");
                    setAddingYear(false);
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
