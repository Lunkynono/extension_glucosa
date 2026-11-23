# Diapreneur · Glucosa

Extensión independiente para Google Chrome que muestra en el navegador las lecturas compartidas de una cuenta de **LibreLinkUp**.

Permite consultar el valor más reciente, la hora de la medición, la tendencia y una gráfica de las últimas tres horas. También puede mostrar el valor sobre el icono de Chrome y enviar un aviso cuando la dirección de la tendencia cambia.

> **Importante:** esta extensión es un complemento informativo y no es un dispositivo médico. No sustituye a FreeStyle Libre, LibreLinkUp ni a las indicaciones de un profesional sanitario. No tomes decisiones de tratamiento basándote únicamente en la extensión. Si hay una discrepancia, retraso o duda, utiliza la aplicación y el lector oficiales.

## Qué hace

- Conecta con una cuenta de LibreLinkUp que ya recibe lecturas.
- Muestra la lectura actual en `mg/dL` o `mmol/L`.
- Muestra la flecha de tendencia cuando LibreLinkUp la proporciona.
- Dibuja las lecturas disponibles de las últimas tres horas.
- Muestra el último valor reciente en el distintivo del icono de Chrome.
- Permite activar avisos de subida y bajada de tendencia.
- Incluye tema clásico y tema Cyberpunk (posiblemente más en el futuro).
- Incluye un modo de demostración con datos ficticios, sin iniciar sesión.

## Requisitos

- Google Chrome 120 o posterior.
- Un ordenador con conexión a Internet.
- Una cuenta de LibreLinkUp activa que ya reciba las lecturas.
- La carpeta completa del proyecto, o un ZIP de una versión publicada.

La extensión no lee directamente el sensor. La aplicación oficial que utilizas para escanear o gestionar el sensor debe compartir primero sus lecturas con LibreLinkUp.

## Antes de instalar: preparar LibreLinkUp

Si ya puedes ver tus lecturas en la aplicación oficial **LibreLinkUp**, pasa directamente a [Instalar la extensión](#instalar-la-extensión).

Si todavía no tienes una conexión configurada:

1. Abre en el móvil la aplicación oficial que utilizas con tu sensor, por ejemplo **FreeStyle LibreLink**.
2. Entra en **Aplicaciones conectadas** y busca **LibreLinkUp**.
3. Añade una conexión e invita a la cuenta de correo que recibirá las lecturas.
4. Instala LibreLinkUp en el móvil y crea o utiliza la cuenta asociada a ese correo.
5. Acepta la invitación en LibreLinkUp.
6. Comprueba que LibreLinkUp muestra una lectura y su hora.

La cuenta que introducirás en la extensión es la cuenta de **LibreLinkUp que recibe las lecturas**, no necesariamente la cuenta con la que se inició sesión en la aplicación del sensor. Puede ser la cuenta de un familiar o cuidador.

> Los nombres de los menús pueden cambiar según el país y la versión de las aplicaciones. Consulta la ayuda oficial de Abbott si alguna opción no aparece.

## Instalar la extensión en Chrome

Esta guía utiliza la instalación local de una extensión descomprimida. Es la opción adecuada para probar el proyecto desde GitHub; Chrome puede mostrar un aviso porque no procede de Chrome Web Store.

### Opción A: descargar una versión publicada

1. Abre la sección **Releases** del repositorio.
2. Descarga el archivo ZIP de la versión más reciente, por ejemplo `Diapreneur-Glucosa.zip`.
3. Extrae el ZIP en una carpeta permanente. No borres ni muevas esa carpeta mientras uses la extensión.

### Opción B: descargar el código del repositorio

En GitHub, abre **Code → Download ZIP** y extrae el archivo. Si trabajas con Git, también puedes clonar el repositorio.

### Cargar la carpeta en Chrome

1. Abre Google Chrome.
2. Escribe `chrome://extensions` en la barra de direcciones.
3. Activa **Modo desarrollador**.
4. Pulsa **Cargar descomprimida**.
5. Selecciona la carpeta que contiene directamente `manifest.json`, `popup.html` y `background.js`.
6. Comprueba que aparece la tarjeta **Diapreneur · Glucosa**.

Si Chrome indica que falta el manifiesto, has seleccionado la carpeta equivocada. Entra en las carpetas internas hasta localizar la que contiene `manifest.json`.

### Fijar el icono

Pulsa el botón de extensiones —la pieza de puzle— y fija **Diapreneur · Glucosa** con la chincheta. Así podrás abrirla desde la barra de herramientas.

## Primera configuración

1. Pulsa el icono de la extensión.
2. Introduce el correo y la contraseña de tu cuenta de LibreLinkUp.
3. Pulsa **Conectar cuenta**.
4. Si la cuenta tiene varias conexiones, selecciona la persona cuyas lecturas quieres consultar.
5. Espera a que aparezca la lectura y la hora.

La extensión identifica automáticamente el servidor regional de la cuenta. Las peticiones se realizan por HTTPS a los servidores regionales de LibreView definidos en el manifiesto.

Para probar el diseño sin utilizar credenciales, pulsa **Ver con datos de ejemplo**. La etiqueta **Simulación** indica que esos datos son ficticios.

## Uso diario

- Abre la extensión para consultar el valor, la hora, la flecha de tendencia y la gráfica.
- Pulsa el botón de actualizar para solicitar una lectura nueva.
- El panel se actualiza aproximadamente cada 30 segundos mientras está abierto.
- El proceso en segundo plano intenta actualizar el distintivo y los avisos aproximadamente cada 30 segundos.
- Chrome o LibreLinkUp pueden retrasar una consulta o una lectura.
- La gráfica muestra las lecturas disponibles de las últimas tres horas. Los huecos indican que no hay datos para ese intervalo.
- Una lectura de 15 minutos o más se considera atrasada: se muestra como **Lectura atrasada**, se oculta la flecha y se retira el valor del distintivo.

Con Chrome completamente cerrado o con el ordenador apagado no se realizan consultas. Al volver a abrir Chrome, la extensión intenta reanudar la sesión.

### Ajustes

En la pestaña **Ajustes** puedes elegir:

| Ajuste | Opciones |
| --- | --- |
| Unidad | `mg/dL` o `mmol/L` |
| Tema | Clásico o Cyberpunk |
| Avisos | Activados o desactivados |

El primer dato establece el punto de partida; no genera un aviso. Los cambios de intensidad dentro de la misma dirección —por ejemplo, de subida lenta a subida rápida— tampoco generan un aviso nuevo.

## Privacidad y seguridad

La extensión trata información de salud y credenciales. Revisa [Privacidad y permisos](PRIVACIDAD.html) antes de usarla.

- El correo y la contraseña se envían directamente a los servidores de Abbott/LibreView para iniciar sesión.
- La contraseña se borra del formulario después del intento y no se guarda en el almacenamiento de la extensión.
- Se guarda localmente en el perfil de Chrome un token de sesión, la conexión elegida, la última lectura usada por el icono y las preferencias.
- El almacenamiento local no tiene cifrado propio. Una persona o programa con acceso al perfil del ordenador podría recuperar el token.
- No hay servidor del desarrollador, publicidad, analítica ni acceso al historial, a todas las páginas o al contenido de las pestañas.
- Los datos no se envían a otros servicios distintos de los endpoints regionales declarados en `manifest.json`.
- En un ordenador compartido, pulsa **Cerrar sesión** al terminar.

Cerrar sesión elimina el token, la conexión seleccionada y el estado de las lecturas de esta instalación. No revoca sesiones de Abbott iniciadas en otros dispositivos.

## Verificar el ZIP y revisar el código

Antes de instalar una versión descargada, puedes pasar el archivo ZIP por [VirusTotal](https://www.virustotal.com/) para obtener una segunda comprobación con varios motores de seguridad:

1. Descarga el ZIP desde la sección **Releases** de este repositorio.
2. Abre VirusTotal y selecciona el archivo ZIP.
3. Espera a que termine el análisis y revisa si algún motor detecta algo.
4. Si aparece una detección, no instales la extensión: abre una incidencia en GitHub indicando la versión y el resultado.

El proyecto es código abierto. Cualquier persona puede entrar en GitHub y revisar archivo por archivo qué hace la extensión, incluidos `manifest.json`, `popup.js`, `background.js`, `librelinkup.js` y `storage.js`. También puedes descargar el código fuente y compararlo con los archivos incluidos en el ZIP.

> No subas a VirusTotal capturas, archivos de configuración, tokens ni ningún ZIP que contenga datos personales o lecturas identificables. Utiliza únicamente el ZIP público de la versión que quieras comprobar y revisa las condiciones de privacidad del servicio antes de cargarlo.

## Permisos solicitados

| Permiso | Para qué se usa |
| --- | --- |
| `storage` | Guardar localmente la sesión y las preferencias. |
| `alarms` | Programar consultas periódicas en segundo plano. |
| `notifications` | Mostrar avisos de cambio de tendencia. |
| Acceso a `api-*.libreview.io` | Iniciar sesión y consultar conexiones y lecturas de LibreLinkUp. |

La extensión no utiliza scripts de contenido y no solicita acceso a todas las páginas web.

## Limitaciones conocidas

- La integración con LibreLinkUp no es una API oficial publicada por este proyecto y puede dejar de funcionar si Abbott cambia el servicio.
- La extensión no sustituye las alarmas ni las funciones clínicas de las aplicaciones oficiales.
- La disponibilidad, el retraso y el historial dependen de LibreLinkUp y de la conexión del móvil con el sensor.
- Chrome puede retrasar alarmas, tareas en segundo plano o notificaciones.
- La sesión puede caducar y requerir un nuevo inicio de sesión.
- La extensión necesita consultar una cuenta seguidora que tenga una conexión aceptada y con lecturas disponibles.

## Solución de problemas

| Problema | Solución |
| --- | --- |
| No aparece **Cargar descomprimida** | Activa **Modo desarrollador** en `chrome://extensions`. Un equipo administrado puede impedirlo. |
| Chrome dice que falta `manifest.json` | Selecciona la carpeta que contiene directamente ese archivo. |
| No encuentras el icono | Abre el menú de extensiones y fija la extensión. |
| No puedes iniciar sesión | Prueba las mismas credenciales en LibreLinkUp y completa allí cualquier verificación pendiente. |
| La cuenta no tiene lecturas | Acepta la invitación y comprueba en LibreLinkUp que la conexión muestra datos. |
| La gráfica está vacía | Puede haberse recibido solo la lectura actual. Vuelve a actualizar más tarde. |
| Desaparece el número del icono | Comprueba la sesión, la conexión elegida y si la lectura tiene menos de 15 minutos. |
| No aparecen avisos | Actívalos en Ajustes, revisa las notificaciones de Chrome y desactiva temporalmente No molestar. |
| Se pide esperar antes de actualizar | LibreLinkUp ha limitado temporalmente las consultas. Espera unos minutos. |
| Se necesita una versión más reciente del cliente | El servicio de Abbott puede haber cambiado. Comprueba si existe una actualización del proyecto. |

Al abrir una incidencia en GitHub, incluye la versión de Chrome, la versión de la extensión, el mensaje exacto y los pasos para reproducirlo. Nunca publiques tu contraseña, token, correo completo ni capturas con datos identificables.

## Actualizar

1. Descarga y extrae la nueva versión en una carpeta.
2. En `chrome://extensions`, reemplaza los archivos de la instalación por los de la nueva versión.
3. Pulsa **Recargar** en la tarjeta de la extensión.
4. Abre la extensión y vuelve a iniciar sesión si la sesión ha caducado.

Las preferencias se conservan al recargar la misma instalación.

## Desinstalar

1. Abre `chrome://extensions`.
2. Busca **Diapreneur · Glucosa**.
3. Pulsa **Quitar** y confirma.
4. Borra la carpeta extraída si ya no la necesitas.

## Para grabar una demo

Una demostración breve puede seguir este orden:

1. Mostrar `chrome://extensions` y cargar la carpeta.
2. Fijar el icono en Chrome.
3. Enseñar primero **Ver con datos de ejemplo** para explicar la interfaz sin exponer datos reales.
4. Mostrar la configuración de unidad, tema y avisos.
5. Explicar que, para usar datos reales, hay que configurar LibreLinkUp desde la aplicación oficial y usar la cuenta seguidora.
6. Conectar la cuenta y mostrar el valor, la tendencia y la gráfica.
7. Terminar enseñando la página de privacidad y recordando que la extensión no sustituye la aplicación oficial.

Para un vídeo vertical, encuadra la ventana de la extensión en el centro, aumenta el zoom del navegador y no muestres nunca contraseñas, correos completos, nombres de pacientes ni valores de terceros sin consentimiento.

## Desarrollo local

El proyecto no necesita un proceso de compilación ni dependencias externas. Los archivos JavaScript, HTML, CSS, iconos y fuentes se cargan directamente como una extensión Manifest V3.

Archivos principales:

| Archivo | Función |
| --- | --- |
| `manifest.json` | Metadatos, permisos, iconos y puntos de entrada. |
| `popup.html` / `popup.js` | Interfaz que aparece al pulsar el icono. |
| `background.js` | Consultas periódicas, distintivo y notificaciones. |
| `librelinkup.js` | Inicio de sesión y consultas a LibreLinkUp. |
| `glucose.js` | Normalización de lecturas, tendencias y datos de demo. |
| `storage.js` / `settings.js` | Almacenamiento local y preferencias. |
| `PRIVACIDAD.html` | Detalle de datos tratados y permisos. |

Para probar cambios, carga la carpeta en `chrome://extensions` y pulsa **Recargar** después de modificar los archivos.

## Licencia y atribuciones

El cliente de LibreLinkUp está adaptado de [DiaKEM LibreLinkUp API Client v0.7.2](https://github.com/DiaKEM/libre-link-up-api-client), bajo licencia MIT incluida en [`LICENSE-DiaKEM.txt`](LICENSE-DiaKEM.txt). Las fuentes incluidas tienen sus licencias en [`fonts/`](fonts/). El tema Cyberpunk toma referencias de los conceptos de interfaz de [Michael Rigley](https://www.michaelrigley.com/work/cyberpunk-2077/).

Este es un proyecto independiente y no está afiliado, patrocinado ni aprobado por Abbott, FreeStyle Libre, LibreLinkUp o Google.

## Enlaces útiles

- [Configurar una conexión de LibreLinkUp — Abbott España](https://www.freestyle.abbott/es-es/productos/conectividad/librelinkup.html)
- [Cargar una extensión descomprimida — Chrome for Developers](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Cliente de LibreLinkUp de DiaKEM](https://github.com/DiaKEM/libre-link-up-api-client)

