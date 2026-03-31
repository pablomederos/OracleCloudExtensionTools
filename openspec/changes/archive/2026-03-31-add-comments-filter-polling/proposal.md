## Why

El filtro actual del panel de comentarios de Oracle depende de monitorizar la existencia de un botón "View Comments" (`viewCommentsBtn`) en la página y suscribirse a su evento click. En Oracle (una SPA), este botón se destruye y vuelve a crear constantemente, perdiendo la referencia al evento y dejando el filtro de días sin inyectar aleatoriamente. 

## What Changes

Se modificará la lógica de inicialización en `src/tasks/comments-filter.js`. 
En lugar de hacer "polling" sobre la creación del botón `viewCommentsBtn` y atar un evento de click en él, el polling de 500ms apuntará directamente a observar si el *Drawer Header* (`commentsDrawerHeader`) está abierto. Si el panel está en el DOM, el componente de filtro se inyecta inmediatamente.

## Capabilities

### Modified Capabilities
- `comments-filter`: Se mejora drásticamente la resiliencia en aplicaciones Single Page ajustando el modelo de inyección a comprobaciones directas del DOM en vez de monitorizar eventos de UI.

## Impact

- Cambia la estrategia de inyección en `src/tasks/comments-filter.js`.
- Se eliminarán funciones dependientes de eventos de click.
