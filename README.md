# Oracle Cloud Tools

Este proyecto es una extensión de Chromium diseñada para mejorar la experiencia de usuario en el sitio de Oracle Cloud, específicamente agregando funcionalidades avanzadas para la gestión de timesheets (hojas de tiempo) en tablas construidas con Oracle JET.

La extensión permite agilizar la carga de horas integrándose directamente con **Azure DevOps**, permitiendo importar tareas, capturar estimados de horas y automatizar la creación de comentarios.

## Características Principales

### 🚀 Integración con Azure DevOps
- **Obtención de Tareas**: Consulta tareas asignadas directamente desde Azure DevOps mediante consultas WIQL.
- **Filtrado**: Permite buscar tareas por rango de fechas y usuario.
- **Visualización**: Muestra una tabla con ID, Título, Fecha, Estado y Estimado Original de las tareas.
- **Importación Automática**:
    - Agrega el **Estimado Original** de la tarea a la celda correspondiente del timesheet (buscando el día correcto).
    - Inserta automáticamente un comentario en la celda con el formato: `{taskId} : {TaskTitle}`.

### ⌨️ Atajos de Teclado (Shortcuts)
Agiliza el flujo de trabajo con comandos rápidos:
- **`Ctrl + D`**: Abre el diálogo de tareas de Azure DevOps (si la integración está habilitada).
- **`Ctrl + Alt + C`**: Abre el cuadro de diálogo para insertar/editar comentarios en la celda activa.
- **`Ctrl + S`**: Guarda los cambios en el timesheet.

### 🛠️ Herramientas Adicionales
- **Botón "Add from DevOps"**: Se inyecta en la barra de herramientas de Oracle Cloud para acceso rápido.
- **Portapapeles**: Permite copiar el formato `{ID}: {Título}` al portapapeles desde la tabla de tareas.

## Instalación

1. Clona o descarga este repositorio.
2. Abre tu navegador basado en Chromium (Chrome, Edge, Brave, etc.).
3. Ve a `chrome://extensions/`.
4. Activa el **Modo de desarrollador** (Developer mode).
5. Haz clic en **Cargar descomprimida** (Load unpacked) y selecciona la carpeta raíz de este proyecto.

## Configuración

### 1. Habilitar Funcionalidades
1. Haz clic en el icono de la extensión en la barra del navegador.
2. Activa la opción **"Enable Azure DevOps Integration"**.
3. La página se recargará para aplicar los cambios.

### 2. Configurar Azure DevOps
1. En la página de Oracle Cloud (Timesheets), presiona `Ctrl + D` o haz clic en el botón **"Add from DevOps"**.
2. Ve a la pestaña **Settings**.
3. Completa los campos requeridos:
    - **Org URL**: URL de tu organización (ej. `https://dev.azure.com/tu-organizacion`).
    - **Project**: Nombre del proyecto.
    - **API Version**: Versión del API (ej. `7.1`).
    - **Username**: Tu nombre de usuario/email en DevOps.
    - **DevOps Token (PAT)**: Tu Personal Access Token con permisos de lectura de Work Items.
4. Haz clic en **Save Settings**.

## Uso

1. **Buscar Tareas**:
    - Abre el diálogo de DevOps (`Ctrl + D`).
    - Selecciona un rango de fechas (Start Date / End Date).
    - Haz clic en **Search**.
2. **Agregar al Timesheet**:
    - En la tabla de resultados, haz clic en el icono del reloj (⏱️) en la columna "Action".
    - La extensión buscará la columna del día correspondiente a la tarea en el timesheet.
    - Si encuentra una celda vacía, ingresará las horas estimadas y agregará el comentario automáticamente.
3. **Agregar Todas**:
    - Usa el botón **"Add all to Time Sheet"** para procesar múltiples tareas (funcionalidad en desarrollo/beta).

## Estructura del Proyecto

- **`manifest.json`**: Configuración de la extensión (v3).
- **`loader.js`**: Script de contenido que inyecta los módulos ES6 en la página.
- **`config.js`**: Maneja la comunicación de configuración entre la extensión y la página inyectada.
- **`src/app.js`**: Lógica principal, manejo de atajos y coordinación de comandos.
- **`src/tasks/`**:
    - `azure-devops-api.js`: Manejo de llamadas a la API de Azure DevOps.
    - `azure-devops-dialog.js`: Lógica de la interfaz de usuario del diálogo de tareas.
- **`src/utils/`**:
    - `selectors.js`: Centraliza los selectores CSS para elementos del DOM de Oracle y la extensión.
    - `dom.js`: Utilidades de manipulación del DOM.
- **`popup.html` / `popup.js`**: Interfaz de la extensión para activar/desactivar features.
