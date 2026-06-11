import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión Docente",
  description: "Gestión de asignaturas, clases, alumnos y sesiones para profesores de Secundaria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
