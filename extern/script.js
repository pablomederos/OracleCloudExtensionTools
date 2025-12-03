/**
 * Busca la primera celda vacía en la columna correspondiente a una fecha dada en un Oracle JET Data Grid.
 * @param {string} isoDateString - La fecha en formato ISO (ej: "2025-12-03T18:16:38757Z")
 * @returns {HTMLElement|null} - El elemento div de la celda vacía o null si no se encuentra.
 */
function findFirstEmptyCellByDate(isoDateString) {
    // 1. FORMATEAR LA FECHA (Ej: De ISO a "Wed,Dec 03")
    const dateObj = new Date(isoDateString);

    if (isNaN(dateObj.getTime())) {
        console.error("Fecha inválida proporcionada:", isoDateString);
        return null;
    }

    // Arrays para mapear nombres en Inglés (como aparece en tu HTML)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayName = dayNames[dateObj.getUTCDay()];
    const monthName = monthNames[dateObj.getUTCMonth()];
    // Asegurar que el día tenga dos dígitos (ej: 01, 03, 15)
    const dayNumber = String(dateObj.getUTCDate()).padStart(2, '0');

    // Construir el string objetivo: "Wed,Dec 03"
    const targetHeaderValidString = `${dayName},${monthName} ${dayNumber}`;
    console.log(`Buscando columna para la fecha: "${targetHeaderValidString}"`);

    // 2. ENCONTRAR LA COLUMNA (El Header)
    // Buscamos dentro del contenedor de headers específicos de columnas
    const headerContainer = document.getElementById('timecard-datagrid:columnHeader');
    if (!headerContainer) {
        console.error("No se encontró el contenedor de encabezados 'timecard-datagrid:columnHeader'");
        return null;
    }

    const headerCells = Array.from(headerContainer.querySelectorAll('.oj-datagrid-header-cell'));
    
    let targetLeftPos = null;

    // Buscamos qué celda del header contiene nuestro texto de fecha
    const matchingHeader = headerCells.find(cell => {
        // Usamos innerText para obtener el texto visible (ignorando etiquetas ocultas)
        return cell.innerText.trim() === targetHeaderValidString;
    });

    if (!matchingHeader) {
        console.warn(`No se encontró ninguna columna con la fecha ${targetHeaderValidString}`);
        return null;
    }

    // Obtenemos la posición 'left' exacta (ej: "200px")
    targetLeftPos = matchingHeader.style.left;
    console.log(`Columna encontrada en posición left: ${targetLeftPos}`);

    // 3. BUSCAR EN EL CUERPO DE DATOS (Data Body)
    const dataBody = document.getElementById('timecard-datagrid:databody');
    if (!dataBody) return null;

    // Seleccionamos todas las celdas posibles
    const allCells = Array.from(dataBody.querySelectorAll('.oj-datagrid-cell'));

    // Filtramos solo las que están en la misma columna (mismo style.left)
    const columnCells = allCells.filter(cell => cell.style.left === targetLeftPos);

    // 4. ORDENAR POR FILA (style.top)
    // Es crucial ordenar porque los divs pueden no estar en orden secuencial en el DOM
    columnCells.sort((a, b) => {
        const topA = parseFloat(a.style.top || 0);
        const topB = parseFloat(b.style.top || 0);
        return topA - topB;
    });

    // 5. ENCONTRAR EL PRIMERO VACÍO
    for (let cell of columnCells) {
        // Estrategia para determinar si está "vacío":
        // 1. Ver si tiene texto directo visible (ej: "0,5").
        // 2. Ver si tiene un input dentro con valor.
        
        const textContent = cell.innerText.trim();
        const inputElement = cell.querySelector('input');
        const inputValue = inputElement ? inputElement.value : "";

        // Si no hay texto visible Y (no hay input o el input está vacío)
        const isEmpty = (textContent === "" && inputValue === "");

        if (isEmpty) {
            console.log("Celda vacía encontrada:", cell);
            
            // Opcional: Si quieres hacer scroll hasta la celda o resaltarla para probar
            // cell.style.backgroundColor = "yellow"; 
            // cell.scrollIntoView();
            
            return cell; // Retornamos el DIV encontrado
        }
    }

    console.log("No se encontraron celdas vacías para este día (la columna está llena).");
    return null;
}

// --- EJEMPLO DE USO ---
// Puedes probar con la fecha que mencionaste (ajusté el punto por guión para standarizar)
// const celda = findFirstEmptyCellByDate("2025-12-03T18:16:38.757Z");