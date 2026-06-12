import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión Docente",
  description: "Gestión de asignaturas, clases, alumnos y sesiones para profesores de Secundaria",
};

/**
 * Aplica el tema guardado (o el del sistema) antes del primer pintado para
 * evitar el parpadeo claro→oscuro al cargar.
 */
const themeInitScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
