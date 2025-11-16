# AI Database Chat System

Un sistema de chat con IA que permite consultar bases de datos SQLite usando lenguaje natural. Utiliza OpenRouter para acceso a modelos de IA de última generación y un enfoque agéntico con function calling para generar queries SQL dinámicamente.

## Características

- **Chat con IA en lenguaje natural**: Pregunta sobre tus datos como si hablaras con un analista
- **Modo agéntico**: La IA usa herramientas para explorar el esquema, previsualizar datos y ejecutar queries
- **Function Calling**: Integración completa con OpenRouter API usando herramientas
- **Visualizaciones ricas**:
  - Markdown con tablas
  - LaTeX para fórmulas matemáticas
  - Diagramas Mermaid (ERD, flowcharts, etc.)
  - Soporte para futuros gráficos interactivos
- **Base de datos de ejemplo**: Chinook (tienda de música digital)
- **Solo frontend**: Todo corre en el navegador con SQLite via sql.js
- **Múltiples modelos**: Soporta Claude, GPT-4, Gemini, Llama, y más

## Tecnologías utilizadas

- **Frontend**: Vite + React + TypeScript
- **Database**: sql.js (SQLite en el navegador)
- **AI API**: OpenRouter (acceso a múltiples modelos)
- **Visualización**:
  - react-markdown (Markdown + GFM)
  - KaTeX (LaTeX)
  - Mermaid (Diagramas)
- **Estilos**: TailwindCSS

## Arquitectura

### Sistema de herramientas (Tools)

La IA tiene acceso a 4 herramientas principales:

1. **get_database_schema**: Obtiene el esquema completo de la base de datos
2. **get_table_info**: Información detallada de una tabla específica
3. **preview_table**: Previsualiza las primeras filas de una tabla
4. **execute_sql_query**: Ejecuta queries SQL (solo SELECT, modo lectura)

### Flujo agéntico

1. Usuario hace una pregunta en lenguaje natural
2. La IA llama a herramientas para entender el contexto:
   - Obtiene el esquema de la base de datos
   - Previsualiza tablas para ver la estructura de datos
3. La IA genera y ejecuta la query SQL apropiada
4. La IA presenta los resultados con análisis y visualizaciones

### Seguridad

- Solo queries SELECT permitidas
- Validación de queries antes de ejecución
- Límites en número de filas retornadas
- API key almacenada localmente (localStorage)

## Instalación y uso

### Requisitos previos

- Node.js 18+
- npm o pnpm
- API key de OpenRouter ([obtenerla aquí](https://openrouter.ai/keys))

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd ai-chat-sql

# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Configuración

1. Abre la aplicación en tu navegador (por defecto: http://localhost:5173)
2. Se abrirá automáticamente el modal de configuración
3. Ingresa tu API key de OpenRouter
4. Selecciona el modelo que deseas usar (recomendado: Claude 3.5 Sonnet)
5. Haz clic en "Save Settings"

### Ejemplos de preguntas

Una vez configurado, puedes hacer preguntas como:

- "¿Qué tablas hay en la base de datos?"
- "Muéstrame los 10 tracks más vendidos"
- "¿Qué artista tiene más álbumes?"
- "¿Cuáles son las ventas totales por país?"
- "Crea una tabla con los empleados y sus ventas totales"
- "Muéstrame un diagrama de las relaciones entre tablas"

## Base de datos Chinook

El proyecto incluye la base de datos de ejemplo Chinook, que representa una tienda de música digital con las siguientes tablas:

- **Artist**: Artistas
- **Album**: Álbumes
- **Track**: Canciones/pistas
- **MediaType**: Tipos de medios
- **Genre**: Géneros musicales
- **Playlist** / **PlaylistTrack**: Playlists
- **Customer**: Clientes
- **Employee**: Empleados
- **Invoice** / **InvoiceLine**: Facturas y líneas de factura

## Estructura del proyecto

```
frontend/
├── public/
│   └── chinook.db          # Base de datos SQLite
├── src/
│   ├── components/
│   │   ├── Chat.tsx        # Componente principal del chat
│   │   ├── Message.tsx     # Componente de mensaje individual
│   │   ├── MessageRenderer.tsx  # Renderizador con Markdown/LaTeX/Mermaid
│   │   └── Settings.tsx    # Modal de configuración
│   ├── lib/
│   │   ├── database.ts     # Integración con sql.js
│   │   ├── openrouter.ts   # Cliente de OpenRouter API
│   │   └── tools.ts        # Definición y ejecución de herramientas
│   ├── types/
│   │   └── index.ts        # Tipos TypeScript
│   ├── App.tsx             # Componente raíz
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globales
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Desarrollo futuro

Posibles mejoras:

- [ ] Agregar gráficos interactivos (Recharts/Chart.js)
- [ ] Soporte para cargar bases de datos personalizadas
- [ ] Exportar resultados (CSV, JSON, Excel)
- [ ] Historial de conversaciones
- [ ] Modo oscuro automático
- [ ] Caché de queries frecuentes
- [ ] Sugerencias de queries basadas en el contexto
- [ ] Integración con MCP (Model Context Protocol) para bases de datos remotas

## Consideraciones de rendimiento

- La base de datos se carga completamente en memoria
- Se recomienda usar bases de datos menores a 100MB para mejor rendimiento
- Las queries están limitadas a 1000 filas por defecto
- El modo agéntico está limitado a 10 iteraciones para evitar loops infinitos

## Licencia

MIT

## Créditos

- Base de datos Chinook: [lerocha/chinook-database](https://github.com/lerocha/chinook-database)
- Inspirado en proyectos como Vanna AI y otros sistemas text-to-SQL

## Soporte

Si encuentras problemas o tienes sugerencias, por favor abre un issue en el repositorio.
