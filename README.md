# MarketsMaps - Monorepo del Ecosistema de Comercio Humano

MarketsMaps es un ecosistema descentralizado y moderno de comercio en tiempo real donde la ubicación geoespacial es la herramienta principal de interacción. A diferencia de los marketplaces tradicionales, MarketsMaps funciona como un **"Google Maps del comercio humano"**, conectando a compradores con vendedores locales, artesanos independientes, creadores digitales y negocios comerciales en un mapa interactivo.

---

## 🚀 Arquitectura y Stack Tecnológico

El proyecto está organizado como un **Monorepo** administrado por **Turborepo** y estructurado con **pnpm workspaces**:

```
├── apps
│   ├── web/          # Frontend Next.js + React (MapLibre GL JS para renderizado)
│   └── api/          # Backend NestJS (TypeScript, API REST y WebSockets)
├── packages
│   └── database/     # Capa de base de datos compartida (Drizzle ORM + PostgreSQL/PostGIS)
├── package.json      # Configuración de workspaces y Turborepo
└── docker-compose.yml# Configuración de servicios locales (PostgreSQL, PostGIS, Redis)
```

### Tecnologías Clave:
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Lucide Icons, MapLibre GL.
- **Backend:** NestJS 10, Socket.io (WebSockets para chat en tiempo real y geo-tracking).
- **Base de Datos:** PostgreSQL 15 con la extensión espacial **PostGIS** para consultas de distancia y proximidad de alta velocidad.
- **ORM:** Drizzle ORM (escogido por su soporte nativo superior de tipos geométricos espaciales).
- **Cache/WebSockets Scale:** Redis 7.

---

## ⚙️ Configuración del Entorno de Desarrollo

### Requisitos Previos:
- Node.js >= v20.0.0
- pnpm >= v9.0.0
- Docker y Docker Compose (opcional, para base de datos local completa)

### 1. Variables de Entorno:
Copia la plantilla de variables de entorno en la raíz del proyecto y configura tus credenciales:
```bash
cp .env.example .env
```

### 2. Instalación de Dependencias:
Instala las dependencias de todos los proyectos de forma recursiva:
```bash
pnpm install
```

### 3. Levantar la Infraestructura Local (Opcional):
Si tienes Docker instalado, puedes iniciar PostgreSQL/PostGIS y Redis en segundo plano:
```bash
docker-compose up -d
```

### 4. Generar y Poblar la Base de Datos:
```bash
# Sincroniza el esquema Drizzle con la base de datos de Postgres
pnpm db:push

# Si deseas poblar la base de datos con usuarios y productos geo-localizados de prueba
pnpm db:seed
```

### 5. Iniciar Servidores de Desarrollo:
Inicia tanto el backend NestJS (puerto `3001`) como el frontend Next.js (puerto `3000`) simultáneamente:
```bash
pnpm dev
```

---

## 🗺️ Mapa Interactivo y Privacidad Geoespacial

El frontend utiliza **MapLibre GL JS** y carga un tema oscuro de CartoDB.
Para garantizar la seguridad de los usuarios, el sistema implementa una **lógica de privacidad geoespacial de 4 niveles**:

| Nivel de Privacidad | Comportamiento en la API (NestJS + PostGIS) | Representación Visual en Mapa |
| :--- | :--- | :--- |
| **Exacta (`exact`)** | Devuelve las coordenadas reales de la ubicación física en vivo. | Avatar con pulso suave de brillo (glow). |
| **Zona Aproximada (`approximate`)** | Aplica un desfase matemático aleatorio (de entre 200 y 500 metros) mediante proyección espacial. | Círculo animado translúcido con borde discontinuo que delimita la zona. |
| **Ciudad / Región (`city`)** | Devuelve exclusivamente el centroide de la comuna o ciudad. | Círculo difuminado gigante que cubre la región metropolitana. |
| **Invisible (`invisible`)** | Excluye al usuario del indexador espacial; no se envían coordenadas. | Oculto por completo del mapa. |

---

## 📦 Pestaña de Publicaciones y Reporte de Fallas

- **Mis Publicaciones (CRUD):** El usuario puede ver, agregar y eliminar sus productos (físicos o digitales) directamente desde el header de la aplicación.
- **Canal de Soporte / Reporte de Fallas:** Integrado dentro del panel de **Configuración** ⚙️, permite a los usuarios enviar fallas clasificadas por categorías (Mapa, Buscador, Carrito, Chat) y pasos detallados directamente al equipo de soporte con retroalimentación visual inmediata.
- **Chat Automatizado de Pedido:** Al realizar una compra, el carrito divide automáticamente el pedido por vendedor, abriendo salas de mensajería separadas y enviando una tarjeta resumen con el detalle de la compra para agilizar la entrega.

---

## 🚢 Guía de Despliegue en Producción (Al Público)

Para llevar esta aplicación al público general, se recomienda el siguiente stack de despliegue en la nube:

### 1. Frontend (Next.js)
- **Plataforma recomendada:** **Vercel** o **Netlify**.
- **Comando de compilación:** `pnpm --filter @marketsmaps/web build`
- **Carpeta de salida:** Estándar de Next.js (`.next`).
- **Variables de entorno necesarias:**
  - `NEXT_PUBLIC_API_URL` (URL pública de tu API de NestJS).
  - `NEXT_PUBLIC_WS_URL` (URL pública del servidor WebSocket).

### 2. Backend (NestJS)
- **Plataforma recomendada:** **Render**, **Railway**, **AWS App Runner** o **Heroku**.
- **Comando de compilación:** `pnpm --filter @marketsmaps/api build`
- **Comando de inicio:** `pnpm --filter @marketsmaps/api start:prod`
- **Variables de entorno necesarias:**
  - `DATABASE_URL` (URL de conexión a tu base de datos de producción).
  - `JWT_SECRET` (Llave criptográfica para firmas de sesión segura).
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (Para escalar WebSockets horizontalmente).

### 3. Base de Datos (PostgreSQL + PostGIS)
- **Plataforma recomendada:** **Supabase**, **Neon Database**, o **Tembo** (todos soportan la extensión `postgis` nativamente).
- **Configuración:** Una vez creado el clúster en la nube, asegúrate de activar la extensión corriendo:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```
  Luego corre `pnpm db:push` apuntando a la nueva `DATABASE_URL` de producción para crear la estructura de tablas e índices espaciales.
