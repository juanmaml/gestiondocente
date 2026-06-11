"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Un momento…" : label}
    </button>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md py-1.5 text-sm font-medium transition ${
            mode === "login" ? "bg-white shadow-sm" : "text-gray-500"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-md py-1.5 text-sm font-medium transition ${
            mode === "register" ? "bg-white shadow-sm" : "text-gray-500"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              placeholder="Nombre y apellidos"
              required
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="docente@centro.es"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <SubmitButton label={mode === "login" ? "Entrar" : "Crear cuenta"} />
      </form>
    </div>
  );
}
