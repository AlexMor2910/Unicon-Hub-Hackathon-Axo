# Axo --- Aprende con tu ajolote

Axo es una aplicación web educativa interactiva en español. Su mascota,
un ajolote llamado Axo, acompaña al estudiante mientras practica
**matemáticas, lectura y ortografía** mediante actividades, ejercicios
guiados y evaluaciones.

> **Estado del proyecto:** la versión entregada se considera completa y
> satisface la función requerida dentro de su alcance actual.

## Objetivo

Ofrecer un entorno de práctica autónoma que combine:

-   Prácticas libres para elegir una materia y comenzar una actividad.
-   Un diagnóstico inicial que orienta el punto de partida en lectura y
    matemáticas.
-   Una ruta de aprendizaje mediante un árbol de habilidades con
    ejercicios y progresión por niveles.
-   Retroalimentación, pistas y explicaciones durante las actividades.
-   Seguimiento del avance y recompensas para mantener la motivación.

## Funcionalidades

### Inicio y navegación

La aplicación organiza el contenido en tres secciones principales:

-   **Inicio:** presenta la ruta de aprendizaje de Axo y permite
    comenzar o continuar el diagnóstico y la ruta personalizada.
-   **Prácticas:** da acceso a las actividades libres de matemáticas,
    ortografía y lectura.
-   **Progreso:** muestra XP, nivel, monedas, actividad realizada,
    logros e historial de recompensas.

También incluye una sección para personalizar la apariencia de Axo.

### Diagnóstico y ruta de habilidades

El diagnóstico inicial contiene **17 preguntas**: nueve de matemáticas y
ocho de lectura. Sus resultados ofrecen una orientación del nivel
inicial en cada área.

Después del diagnóstico, el estudiante puede consultar un árbol de
habilidades con dos áreas:

-   **Matemáticas:** nueve nodos de aprendizaje organizados en tres
    niveles. Incluye suma, resta, comparación de cantidades,
    multiplicación, división, fracciones, decimales, cálculo de cambio y
    problemas de varios pasos.
-   **Lectura:** nueve nodos de aprendizaje organizados en tres niveles.
    Se trabajan información explícita, secuencia, inferencias, idea
    principal, hechos y opiniones, y vocabulario contextual.

Los nodos pueden aparecer como bloqueados, disponibles, ubicados por
diagnóstico o dominados. La disponibilidad considera los prerrequisitos
y el avance registrado. Las prácticas incluyen preguntas, intentos,
pistas y explicaciones.

### Prácticas libres

#### Matemáticas

  -----------------------------------------------------------------------
  Actividad                           Descripción
  ----------------------------------- -----------------------------------
  **Cálculo relámpago**               Rondas de diez operaciones de
                                      cálculo mental. Ofrece dificultades
                                      fácil, intermedia y difícil, y
                                      presenta aciertos, errores,
                                      precisión, tiempo y repaso de
                                      operaciones.

  **¿Qué número falta?**              Diez ejercicios para completar
                                      igualdades. Cada ejercicio permite
                                      dos intentos y ofrece una pista y,
                                      cuando corresponde, una explicación
                                      del procedimiento. También ofrece
                                      tres dificultades.
  -----------------------------------------------------------------------

#### Ortografía

  -----------------------------------------------------------------------
  Actividad                           Descripción
  ----------------------------------- -----------------------------------
  **Cazaerrores**                     El estudiante localiza una palabra
                                      mal escrita en cada oración y
                                      selecciona su forma correcta. Las
                                      rondas contienen diez oraciones y
                                      ofrecen tres dificultades. Incluye
                                      pistas, explicaciones y resultados
                                      por categoría ortográfica.

  **Completa la palabra**             El estudiante selecciona las letras
                                      que faltan para formar una palabra.
                                      La actividad ofrece intentos,
                                      pistas y explicación de la
                                      respuesta.
  -----------------------------------------------------------------------

Entre las categorías ortográficas incluidas se encuentran acentuación,
B/V, C/S/Z, G/J, H y palabras homófonas.

#### Lectura

La biblioteca incluye tres libros, cada uno con tres capítulos:

  -----------------------------------------------------------------------
  Libro                   Género                  Descripción
  ----------------------- ----------------------- -----------------------
  **El misterio del       Misterio y aventura     Dos amigos siguen una
  canal**                                         pista en los canales de
                                                  Xochimilco y descubren
                                                  cómo cuidar una toma de
                                                  agua junto con sus
                                                  vecinos.

  **El laboratorio de     Ciencia y aventura      Luna y Gael ponen a
  Luna**                                          prueba sus ideas para
                                                  ayudar al huerto
                                                  escolar durante una
                                                  semana de calor.

  **La ciudad de las      Fantasía                Mara y su primo cruzan
  palabras**                                      una puerta que obedece
                                                  las palabras de sus
                                                  habitantes y descubren
                                                  lo que ocurre cuando
                                                  una instrucción admite
                                                  dos lecturas.
  -----------------------------------------------------------------------

Cada capítulo incluye texto y una evaluación de comprensión lectora. Las
preguntas se clasifican como **literales, inferenciales y críticas**. La
evaluación incorpora dos intentos, pistas progresivas, explicaciones y
referencias a los párrafos que contienen evidencia.

### Progreso y recompensas

El sistema de gamificación incluye:

-   Puntos de experiencia (**XP**) y niveles.
-   Monedas.
-   Siete logros desbloqueables.
-   Registro de actividades y recompensas.
-   Estadísticas de partidas de matemáticas, partidas de ortografía y
    evaluaciones de lectura.
-   Recompensas sujetas a un límite diario por actividad.
-   Tienda e inventario para personalizar a Axo.

La personalización está organizada en tres categorías: **colores,
branquias y accesorios**. Los artículos se pueden previsualizar, comprar
con monedas y equipar o retirar desde el inventario.

## Uso

### Ejecutar la aplicación

1.  Guarda `Axo.html` en tu equipo.
2.  Abre el archivo directamente en un navegador web moderno.
3.  Utiliza la navegación principal para entrar a **Inicio**,
    **Prácticas** o **Progreso**.

La aplicación está empaquetada en un único archivo HTML. El JavaScript,
los estilos y los recursos tipográficos utilizados por la interfaz están
incluidos en ese archivo. No se requiere instalar dependencias ni
ejecutar un proceso de compilación para utilizar la versión entregada.

### Guardado del avance

El progreso se guarda en el almacenamiento local (`localStorage`) del
navegador. Se utilizan estas claves:

  -----------------------------------------------------------------------
  Clave                               Información
  ----------------------------------- -----------------------------------
  `axo.progress.v1`                   XP, monedas, estadísticas, logros,
                                      finalizaciones, recompensas
                                      diarias, historial e inventario.

  `axo.learning.v1`                   Respuestas del diagnóstico y avance
                                      de las prácticas del árbol de
                                      habilidades.
  -----------------------------------------------------------------------

El avance queda asociado al navegador y perfil donde se utiliza la
aplicación. No se implementa sincronización entre dispositivos ni
almacenamiento en una cuenta o servidor. Si el navegador no permite
utilizar el almacenamiento local, la aplicación muestra un aviso y los
cambios pueden perderse al recargar o cerrar la pestaña.

## Tecnologías e implementación

-   **React 19.2.8** para la interfaz y el estado de los componentes.
-   **React Router 7.18.3** para la navegación interna.
-   **HTML5, CSS y JavaScript**.
-   **Inter** y **Space Grotesk** como tipografías de la interfaz.
-   **LocalStorage** para persistir el progreso en el navegador.
-   Ilustración vectorial de Axo integrada en la aplicación.

La versión entregada es un artefacto autocontenido: no incluye un
backend, base de datos remota, sistema de cuentas ni integración con
servicios externos.

## Accesibilidad y diseño

La interfaz incorpora diseño adaptable a distintos tamaños de pantalla,
estructura semántica, etiquetas accesibles, estados de foco para la
navegación y compatibilidad con la preferencia del sistema para reducir
movimiento.

## Alcance de la versión entregada

Axo se entrega como una aplicación educativa funcional y completa para
el propósito definido: practicar matemáticas, lectura y ortografía,
orientar el aprendizaje mediante un diagnóstico y una ruta de
habilidades, y registrar el avance local del estudiante.

------------------------------------------------------------------------

**Archivo principal:** `Axo.html`\
**Nombre de la aplicación:** Axo --- Aprende con tu ajolote\
**Idioma de la interfaz:** Español (México)
