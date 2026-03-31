## Context

El panel de comentarios de Oracle se inyecta dinámicamente. La extensión necesita agregar un filtro de días a dicho panel, pero el botón que lo abre ("View Comments") se destruye y vuelve a montar constantemente en esta SPA, provocando la pérdida de event listeners y haciendo el filtrado irregular.

## Goals / Non-Goals

**Goals:**
- Hacer que la inyección del componente de filtro de comentarios sea 100% predecible y resistente al recargado del DOM.
- Simplificar el código de inicialización, eliminando dependencias de eventos de click.

**Non-Goals:**
- Refactorizar el funcionamiento interno del filtrado u otras partes de la extensión.
- Usar un `MutationObserver` general que degrade el rendimiento.

## Decisions

- **Uso de Polling Continuo (Drawer Header):** Se implementará un `setInterval(..., 500)` que consulta la existencia del `querySelectors.commentsDrawerHeader`. Si lo encuentra y el filtro no está inyectado, se procede con la inyección.
- *Rationale:* Evita la necesidad de gestionar la reactividad de los botones (que aparecen y desaparecen). Un chequeo liviano de `querySelector` cada 500ms es muy estable frente a las mutaciones pesadas del DOM de Oracle Cloud.

## Risks / Trade-offs

- **Risk:** Polling continuo a perpetuidad mientras la pestaña sigue abierta.
  - **Mitigation:** Un `querySelector` aislado por id/clase cada medio segundo no tiene impacto perceptible en CPU.
