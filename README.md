# Gestión Docente

Aplicación web de gestión docente para profesores de Educación Secundaria.
Permite gestionar asignaturas, clases, alumnos, horario semanal, sesiones de
clase, anotaciones, evaluaciones y grupos de trabajo.

Estructura principal: **Asignatura → Clase → Alumnos**
(p. ej. Matemáticas → 1º ESO A → lista de alumnos).

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, Server Actions) + TypeScript
- [Prisma](https://www.prisma.io/) + SQLite (migrable a PostgreSQL)
- [Auth.js v5](https://authjs.dev/) con credenciales (email + contraseña)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Puesta en marcha

```bash
npm install
npx prisma db push      # crea la base de datos SQLite
npm run db:seed         # (opcional) datos de demostración
npm run dev             # http://localhost:3000
```

Usuario de demostración tras el seed: `demo@docente.es` / `demo123`.
También puedes crear tu propia cuenta desde la pantalla de login.

Variables de entorno (ya incluidas en `.env` para desarrollo):

| Variable       | Descripción                          |
| -------------- | ------------------------------------ |
| `DATABASE_URL` | Ruta del fichero SQLite              |
| `AUTH_SECRET`  | Secreto de sesión (cámbialo en prod) |

## Funcionalidades (MVP)

- **Login / registro de docentes** — cada docente ve solo sus datos.
- **Cursos académicos** — asignaturas y clases pertenecen a un curso; selector
  de curso activo en la barra lateral.
- **Asignaturas** con color identificativo y clases ilimitadas.
- **Alumnos** reutilizables entre clases mediante matrículas.
- **Horario semanal configurable** (franjas día + hora por clase).
- **Calendario semanal (pantalla inicial)** tipo timesheet: cada bloque muestra
  asignatura, clase y horas con el color de la asignatura. Al hacer clic se
  abre la ficha de la clase en la sesión de ese día y hora.
- **Ficha de clase** con pestañas:
  - **Sesión**: contenido previsto, contenido impartido, deberes, anotaciones
    generales y anotaciones privadas del docente. Navegación
    `[Sesión anterior] [Hoy] [Próxima sesión]` basada en el horario.
    Panel de anotaciones sobre alumnos concretos (positiva / negativa /
    incidencia / general), asociadas a alumno + clase + fecha + sesión.
  - **Alumnos**: matricular alumnos existentes o crear nuevos.
  - **Evaluaciones**: tareas, exámenes, trabajos, actividades… con tipo,
    fecha, descripción, puntuación máxima, peso y periodo opcionales, e
    indicador individual/grupal. Calificación individual con nota y
    observación. Calificación grupal: nota base del grupo aplicada a todos los
    miembros con ajuste individual opcional.
  - **Grupos**: grupos de trabajo con nombre, integrantes y anotaciones.
  - **Historial**: línea temporal de sesiones con contenidos y anotaciones.
  - **Mes**: calendario mensual con marcas en los días con sesiones,
    anotaciones, evaluaciones o incidencias.

## Modelo de datos

`User`, `AcademicYear`, `Subject`, `ClassGroup`, `Student`, `ClassEnrollment`,
`ScheduleEntry`, `ClassSession`, `StudentNote`, `AssessmentItem`, `Grade`,
`StudentGroup`, `GroupMembership`, `GroupGrade` — ver
[`prisma/schema.prisma`](prisma/schema.prisma).

## Scripts

| Script             | Descripción                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo                       |
| `npm run build`    | Build de producción                          |
| `npm start`        | Servidor de producción                       |
| `npm run db:push`  | Sincroniza el esquema con la base de datos   |
| `npm run db:seed`  | Datos de demostración                        |
| `npm run db:reset` | Reinicia la base de datos y vuelve a sembrar |

## Segunda fase (no incluido en el MVP)

Asistencia, importación CSV/Excel, exportación de notas, informes PDF, medias
ponderadas avanzadas, rúbricas, adjuntos, notificaciones e integración con
Google Calendar.
