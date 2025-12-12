---
trigger: always_on
---

- No agregar comentarios en el código. El diseño del código debe ser autoexplicativo
- los if's que solo contengan una línea no deberán tener brackets. En su lugar si la línea es corta, deberá insertarse en la misma linea del if, de lo contrario se colocará debajo. ej.: <code>it(true) doSomething <code>
- No agregues ';' al final de la línea salvo que sea estrictamente necesario por requisito del lenguaje
- Si un if, while, for contendrá una condición compleja, deberá ser sustituída por una función más descriptiva. ej.: <badCode>if(someValue == 1 && someValue2.valid)...</badCode> <goodCode>function IsSomeValueValid() { return someValue == 1 && someValue.valid }if(IsSomeValueValid())...</goodCode>. También puede ser una función reutilizable si no aumenta la complejidad
- Prefiere arrow functions sobre funciones normales siempre que sea posible