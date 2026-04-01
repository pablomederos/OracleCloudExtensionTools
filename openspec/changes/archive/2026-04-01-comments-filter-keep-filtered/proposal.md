## Why

Cuando el usuario cierra y reabre el panel de comentarios en la SPA de Oracle Cloud, o carga nuevos comentarios con paginación, la aplicación reconstruye el DOM inyectando los comentarios sin las clases `.hidden` de nuestra extensión. Sin embargo, nuestro menú (`#commentsDayFilter`) mantiene la selección anterior en la UI, generando una desincronización funcional que confunde al usuario (la UI indica que hay un filtro activo, pero los comentarios se muestran todos).

## What Changes

Aplicaremos un mecanismo de sincronización continua ("Opción A"). Se utilizará el `setInterval` de `initCommentsFilter` que ya se está ejecutando en backgound (cada 500ms). En caso de que el panel esté abierto y el menú de filtro ya exista, simplemente invocaremos el filtrado con el valor guardado de la última vez, aplicando nuevamente el ocultamiento a cualquier nuevo contenido cargado por la SPA.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. Esto corrige un bug visual frente a un comportamiento imprevisto de la SPA, no altera la intención funcional original.

## Impact

- **Affected code**: `src/tasks/comments-filter.js` se actualizará para almacenar el valor del filtro en una variable y reaplicarlo desde el _polling loop_.
