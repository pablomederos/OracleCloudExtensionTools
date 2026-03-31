## 1. Refactor Polling Logic

- [x] 1.1 Eliminar la lógica y función de `handleViewCommentsClick` en `src/tasks/comments-filter.js`.
- [x] 1.2 Modificar `initCommentsFilter` para inicializar un `setInterval` de 500ms apuntando directamente a `querySelectors.commentsDrawerHeader`.
- [x] 1.3 Llamar a `injectFilterUI()` si el Drawer existe.
- [x] 1.4 Eliminar todas las referencias directas a atar eventos de click al botón `querySelectors.viewCommentsBtn`.
