# API Documentation

**Source URL:** https://developers.facebook.com/docs/graph-api/
**Scraped Date:** 2025-11-12 13:39:55

---



## Page: https://developers.facebook.com/docs/graph-api/

```markdown
Si eres usuario de Facebook y tienes problemas para iniciar sesión en tu cuenta, visita nuestro [servicio de ayuda](https://www.facebook.com/help/1573156092981768/).

# API Graph

| **La versión más reciente es**: |
|----------------------------------|
| `v24.0`                          |

La API Graph es la principal herramienta que permite a las apps leer y escribir en la gráfica social de Facebook. Todos nuestros SDK y productos interactúan de algún modo con la API Graph, y las demás API son extensiones de esta. Por esta razón, es fundamental entender cómo funciona.

Si no estás familiarizado con la API Graph, te recomendamos que empieces con esos documentos:

1. [Información general](https://developers.facebook.com/docs/graph-api/overview): obtén información sobre cómo está estructurada la API Graph y cómo funciona.
2. [Primeros pasos](https://developers.facebook.com/docs/graph-api/get-started): explora los puntos de conexión de la API Graph con la herramienta de exploración de la API Graph y realiza la primera solicitud.
3. [Solicitudes por lotes](https://developers.facebook.com/docs/graph-api/batch-requests): obtén información sobre cómo enviar solicitudes múltiples a la API en una sola llamada.
4. [Solicitudes de depuración](https://developers.facebook.com/docs/graph-api/guides/debugging): obtén información sobre cómo depurar las solicitudes a la API.
5. [Manejo de errores](https://developers.facebook.com/docs/graph-api/guides/error-handling): obtén información sobre cómo manejar errores comunes que se producen cuando se usa la API Graph.
6. [Expansión de campo](https://developers.facebook.com/docs/graph-api/guides/field-expansion): obtén información sobre cómo limitar el número de objetos que se devuelven en una solicitud y cómo realizar solicitudes anidadas.
7. [Solicitudes seguras](https://developers.facebook.com/docs/graph-api/guides/secure-requests): obtén información sobre cómo hacer solicitudes seguras a la API Graph.
8. [API de cargas reanudables](https://developers.facebook.com/docs/graph-api/guides/upload): obtén información sobre cómo subir archivos a la API Graph.

#### [Referencias](https://developers.facebook.com/docs/graph-api/reference)

Obtén información sobre cómo leer los documentos de referencia para que puedas encontrar fácilmente lo que buscas.

## ¿Dónde empezar?

Te recomendamos que comiences con la [información general de la API Graph](https://developers.facebook.com/docs/graph-api/overview) para que obtengas información sobre la estructura de la gráfica social de Facebook.
```



## Page: https://developers.facebook.com/docs/graph-api/reference

```markdown
# Graph API Reference

### Graph API Root Nodes

This is a full list of the Graph API root nodes. The main difference between a root node and a non-root node is that root nodes can be queried directly, while non-root nodes can be queried via root nodes or edges. If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/), and if you want to know which APIs can solve some frequent issues, try our [Common Scenarios guide](https://developers.facebook.com/docs/graph-api/common-scenarios/).

| Node | Description |
|------|-------------|
| [/video](https://developers.facebook.com/docs/graph-api/reference/video) | A video |
| [Application](https://developers.facebook.com/docs/graph-api/reference/application) | A Facebook app |
| [CPASAdvertiser Partnership Recommendation](https://developers.facebook.com/docs/graph-api/reference/cpas-advertiser-partnership-recommendation) | Returns a recommendation of a single retailer for a specific brand. This endpoint returns a retailer-brand pair and an advertiser who can advertise on behalf of the producer. This endpoint is mainly for Facebook’s Marketing Partners using [Collaborative Ads](https://developers.facebook.com/docs/marketing-api/collaborative-ads). |
| [Canvas](https://developers.facebook.com/docs/graph-api/reference/canvas) | A canvas document |
| [Canvas Button](https://developers.facebook.com/docs/graph-api/reference/canvas-button) | A button inside the canvas |
| [Canvas Carousel](https://developers.facebook.com/docs/graph-api/reference/canvas-carousel) | A carousel inside a canvas |
| [Canvas Footer](https://developers.facebook.com/docs/graph-api/reference/canvas-footer) | A footer of the canvas |
| [Canvas Header](https://developers.facebook.com/docs/graph-api/reference/canvas-header) | A header inside the canvas. |
| [Canvas Photo](https://developers.facebook.com/docs/graph-api/reference/canvas-photo) | A photo inside a canvas |
| [Canvas Product List](https://developers.facebook.com/docs/graph-api/reference/canvas-product-list) | A product list inside the canvas |
| [Canvas Product Set](https://developers.facebook.com/docs/graph-api/reference/canvas-product-set) | A product set inside the canvas |
| [Canvas Text](https://developers.facebook.com/docs/graph-api/reference/canvas-text) | Text element of the canvas |
| [Canvas Video](https://developers.facebook.com/docs/graph-api/reference/canvas-video) | A video inside canvas |
| [Collaborative Ads Directory](https://developers.facebook.com/docs/graph-api/reference/collaborative-ads-directory) | Directory of businesses that use collaborative ads |
| [Comentario](https://developers.facebook.com/docs/graph-api/reference/comment) | A comment can be made on various types of content on Facebook. Most Graph API nodes have a /comments edge that lists all the comments on that object. The /comment node returns a single comment. |
| [Comentarios de objetos](https://developers.facebook.com/docs/graph-api/reference/object/comments) | This reference describes the `/comments` edge that is common to multiple Graph API nodes. The structure and operations are the same for each node. |
| [Conversación](https://developers.facebook.com/docs/graph-api/reference/thread) | Graph API Reference Thread /thread |
| [Conversación](https://developers.facebook.com/docs/graph-api/reference/conversation) | Graph API Reference Conversation /conversation |
| [Documento de grupo](https://developers.facebook.com/docs/graph-api/reference/groupdoc) | Graph API Reference Group Doc /group-doc |
| [Enlace](https://developers.facebook.com/docs/graph-api/reference/link) | A link shared on a wall. |
| [Event](https://developers.facebook.com/docs/graph-api/reference/event) | Get fields and edges on an Event. |
| [Extended Credit Allocation Config](https://developers.facebook.com/docs/graph-api/reference/extended-credit-allocation-config) | Represents a relationship between two business portfolio for the purpose of sharing credit line between them. |
| [Games IAPProduct](https://developers.facebook.com/docs/graph-api/reference/games-iap-product) | An in-app-purchaseable product |
| [Group Message](https://developers.facebook.com/docs/graph-api/reference/group-message) | GroupMessage |
| [Hito](https://developers.facebook.com/docs/graph-api/reference/milestone) | Graph API Reference Milestone /milestone |
| [Host de App Links](https://developers.facebook.com/docs/graph-api/reference/app-link-host) | An individual app link host object created by an app |
| [Image Copyright](https://developers.facebook.com/docs/graph-api/reference/image-copyright) | Represents a copyright on an image asset. |
| [Instagram Business Asset](https://developers.facebook.com/docs/graph-api/reference/instagram-business-asset) | Get the Instagram Business Asset |
| [Instagram Oembed](https://developers.facebook.com/docs/graph-api/reference/instagram-oembed) | InstagramOembed |
| [Live Video Input Stream](https://developers.facebook.com/docs/graph-api/reference/live-video-input-stream) | An ingest stream for a live video |
| [Mailing Address](https://developers.facebook.com/docs/graph-api/reference/mailing-address) | A mailing address object |
| [Media Fingerprint](https://developers.facebook.com/docs/graph-api/reference/media-fingerprint) | Media fingerprint |
| [Mensaje](https://developers.facebook.com/docs/graph-api/reference/message) | An individual message in the Facebook messaging system. |
| [Object Private Replies](https://developers.facebook.com/docs/graph-api/reference/object/private_replies) | Private replies for an object |
| [Objeto "Me gusta"](https://developers.facebook.com/docs/graph-api/reference/object/likes) | This reference describes the `/likes` edge that is common to multiple Graph API nodes. The structure and operations are the same for each node. |
| [Objeto sharedposts](https://developers.facebook.com/docs/graph-api/reference/object/sharedposts) | Graph API Reference /object/sharedposts |
| [Oembed Page](https://developers.facebook.com/docs/graph-api/reference/oembed-page) | OembedPage |
| [Oembed Post](https://developers.facebook.com/docs/graph-api/reference/oembed-post) | OembedPost |
| [Oembed Video](https://developers.facebook.com/docs/graph-api/reference/oembed-video) | OembedVideo |
| [Offline Conversion Data Set Upload](https://developers.facebook.com/docs/graph-api/reference/offline-conversion-data-set-upload) | A subset of Offline Event Data Set |
| [Page](https://developers.facebook.com/docs/graph-api/reference/page) | Get groups a Page is a member of. |
| [Page Call To Action](https://developers.facebook.com/docs/graph-api/reference/page-call-to-action) | Page's call-to-action |
| [Page Post](https://developers.facebook.com/docs/graph-api/reference/page-post) | A Facebook Feed story |
| [Page Upcoming Change](https://developers.facebook.com/docs/graph-api/reference/page-upcoming-change) | Notification of page upcoming changes. |
| [Page/insights](https://developers.facebook.com/docs/graph-api/reference/insights) | This object represents a single Insights metric that is tied to another particular Graph API object (Page, App, Post, etc.). |
| [Pago](https://developers.facebook.com/docs/graph-api/reference/payment) | Graph API Reference Payment /payment |
| [Perfil](https://developers.facebook.com/docs/graph-api/reference/profile) | Graph API Reference Profile /profile |
| [Photo](https://developers.facebook.com/docs/graph-api/reference/photo) | This represents a Photo on Facebook. |
| [Place](https://developers.facebook.com/docs/graph-api/reference/place) | A place |
| [Place Topic](https://developers.facebook.com/docs/graph-api/reference/place-topic) | The category of a place Page |
| [Post](https://developers.facebook.com/docs/graph-api/reference/post) | A Facebook Feed story |
| [Reacciones de objetos](https://developers.facebook.com/docs/graph-api/reference/object/reactions) | First revision to publish |
| [Shadow IGUser](https://developers.facebook.com/docs/graph-api/reference/shadow-ig-user) | Instagram User object |
| [Solicitud](https://developers.facebook.com/docs/graph-api/reference/request) | Graph API Reference Request /request |
| [Threat Exchange Impact Report](https://developers.facebook.com/docs/graph-api/reference/threat-exchange-impact-report) | Represents a report of a partner of on-platform impact as a result of shared ThreatExchange data, which covers a specific time range on a single collaboration. |
| [User](https://developers.facebook.com/docs/graph-api/reference/user) | Get fields and edges on a User. |
| [Usuario de prueba](https://developers.facebook.com/docs/graph-api/reference/test-user) | Graph API Reference Test User /test-user |
| [Video Copyright](https://developers.facebook.com/docs/graph-api/reference/video-copyright) | A video copyright |
| [Video List](https://developers.facebook.com/docs/graph-api/reference/video-list) | A playlist for videos |
| [Video Poll](https://developers.facebook.com/docs/graph-api/reference/video-poll) | Embedded video poll |
| [Video Poll Option](https://developers.facebook.com/docs/graph-api/reference/video-poll-option) | Represents a single poll option that may be selected by the user |
| [Whats App Business Account](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account) | Returns the account information of a WhatsApp Business Account |
| [Whats App Business HSM](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-hsm) | Retrieves information about the message template |
| [Álbum](https://developers.facebook.com/docs/graph-api/reference/album) | A photo album |

### Graph API Root Edges

Root edges are edges that can be queried directly. They allow you to access collections of nodes that are not on a parent node.

| Node | Description |
|------|-------------|
| [Ads Archive](https://developers.facebook.com/docs/graph-api/reference/ads_archive/) | Returns archived ads based on your search. |
| [Binary Transparency Artifacts](https://developers.facebook.com/docs/graph-api/reference/binary_transparency_artifacts/) | BinaryTransparencyArtifacts |
| [Binary Transparency Proofs](https://developers.facebook.com/docs/graph-api/reference/binary_transparency_proofs/) | BinaryTransparencyProofs |
| [Branded Content Search](https://developers.facebook.com/docs/graph-api/reference/branded_content_search/) | Returns branded content based on your search. By default we only return content that is currently available on Facebook or Instagram, and content that was created on or after August 17, 2023. |
| [Debug Token](https://developers.facebook.com/docs/graph-api/reference/debug_token/) | Metadata about a particular access token |
| [Message Template Library](https://developers.facebook.com/docs/graph-api/reference/message_template_library/) | Get a list of message templates in your app user's template library. |
```



## Page: https://developers.facebook.com/docs/graph-api/support-and-tools

## Docs



## Page: https://developers.facebook.com/docs/graph-api/get-started

```markdown
# Primeros pasos

En esta guía se explica la forma de comenzar a recibir datos de la gráfica social de Facebook.

## Antes de empezar

Necesitarás lo siguiente:

- [Registrarte como desarrollador de Meta](https://developers.facebook.com/docs/development/register)
- Una [app de Meta](https://developers.facebook.com/docs/development/create-an-app): esta app se usará con fines de prueba, por lo que no será necesario que incluyas el código de la app de Meta cuando la crees.
- La [herramienta del explorador de la API Graph](https://developers.facebook.com/tools/explorer), abierta en una ventana aparte del navegador
- Información básica sobre la estructura de la gráfica social de Meta incluida en la guía de [información general de la API Graph](https://developers.facebook.com/docs/graph-api/overview#nodes)

## Tu primera solicitud

### Paso 1: Abrir la herramienta del explorador de la API Graph

[Abre la herramienta del explorador de la API Graph en una ventana aparte del navegador.](https://developers.facebook.com/tools/explorer) Esto te permite ejecutar los ejemplos a medida que lees el tutorial.

El explorador se carga con una consulta predeterminada con el método `GET`, la última versión de la API Graph, el nodo `/me` y los campos `id` y `name` en el [campo de la cadena de la consulta](https://developers.facebook.com/docs/graph-api/guides/explorer#query-string-field), además de tu app de Facebook.

![Explorador de la API Graph](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/232068365_563091814813799_6070357364579520404_n.png?_nc_cat=100&ccb=1-7&_nc_sid=e280be&_nc_ohc=s7l4wKJL3wAQ7kNvwHIltBi&_nc_oc=AdkTed5YKI6PcVtltqYeW50pHKPEr9C5826wBljHHDdT8Gf8dZHKlgsL4XWVPcZQ1Z4&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=IDDEJDI3qUamh7BExil95A&oh=00_Afh17zRj58-3VUiZDZ-XHLM6CGrvfNt8RWbdZpu45k5hgQ&oe=692F0064)

### Paso 2: Generar un token de acceso

Haz clic en el botón **Generar token de acceso**. Aparecerá una ventana emergente de **inicio de sesión con Facebook**. Esta ventana emergente de tu app te solicita permiso para obtener tu nombre y foto de perfil de Facebook.

Este flujo es nuestro producto de [inicio de sesión con Facebook](https://developers.facebook.com/docs/facebook-login) que permite a una persona iniciar sesión en una app usando sus credenciales de Facebook. El inicio de sesión con Facebook permite que una app solicite acceso a los datos de Facebook de una persona, y que esta acepte o rechace el acceso. Tu nombre y tu foto de perfil son públicos para que otras personas puedan encontrarte en Facebook, de modo que no hay requisitos adicionales para esta solicitud.

Haz clic en **Continuar como...**

Se crea el token de acceso de usuario. Este token contiene información como, por ejemplo, la app que realiza la solicitud, la persona que usa la app para realizar una solicitud, si el token de acceso aún es válido (caduca aproximadamente en una hora), la hora de caducidad y el alcance de los datos que la app puede solicitar. En esta solicitud, el alcance es `public_profile`, lo que incluye tu nombre y foto de perfil.

![Token de acceso](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/231956490_308313234407833_1605768375436620205_n.png?_nc_cat=106&ccb=1-7&_nc_sid=e280be&_nc_ohc=NfTEUMlpBNwQ7kNvwGVV1Qc&_nc_oc=AdmM18DM3HCqr_5CpiWymZHTYtnN3rvxuUO7ZfSorm4x8NEOjhIJ0BUFYbD4Hn3B7fI&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=IDDEJDI3qUamh7BExil95A&oh=00_Afi1egj2IXgiXFMNefy63juCWc6Qk4yhOW5Ugi26TgDlYA&oe=692F1D6E)

Haz clic en el círculo de información junto al token acceso para ver la información del token.

### Paso 3: Enviar la solicitud

Haz clic en el botón **Enviar** de la esquina superior derecha.

#### Lo que debes ver

En la [ventana de respuesta](https://developers.facebook.com/docs/graph-api/guides/explorer#response-window), verás una respuesta JSON con tu identificador de usuario de Facebook y tu nombre.

![Respuesta JSON](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/232902382_904467853476103_7217229934737479641_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=C1T9f8Hx6RcQ7kNvwGzMjq6&_nc_oc=Adm6fQoQtrZe16z8HHML_cH0miaALWRpycw_IIr5Qzf39vTWAAio_6saWsIzVF5g2DI&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=IDDEJDI3qUamh7BExil95A&oh=00_Afi9qzFIPWI83BJjuzEdHu0ybhzLIBZWt7dgqWOU24Mq6Q&oe=692F1523)

Si eliminas `?fields=id,name` del campo de cadena de consulta y haces clic en **Enviar**, verás el mismo resultado porque `name` y `id` son los campos de nodos de usuario que se devuelven de manera predeterminada.

## Tu segunda solicitud

### Paso 1: Agregar un campo

Hagamos un poco más compleja la primera solicitud agregando otro campo: `email`. Hay dos formas de agregar campos:

- Haz clic en el menú desplegable de búsqueda del [visor de campos de nodo](https://developers.facebook.com/docs/graph-api/guides/explorer#node-field-viewer), a la izquierda de la ventana de respuesta.
- Comienza a escribir en el campo de cadena de la consulta.

Agrega el campo `email` y haz clic en **Enviar**.

#### Lo que debes ver

Si bien la llamada no falló, solo se devolvieron los campos `name` y `id` junto con un mensaje de depuración. Haz clic en el enlace (Mostrar) para depurar la solicitud.

![Depuración de la solicitud](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/233410295_959323958245691_7180707304587023135_n.png?_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=QiTsi2ZopukQ7kNvwFY660T&_nc_oc=AdkOn8N500DJcTTycuyweDMGBM6PCVarIZ7cBEq88e3RetVrLoPlFOlrMCPsDq_OoK8&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=IDDEJDI3qUamh7BExil95A&oh=00_Afg4YY7TtFIGnJ2AEelAtAy45LG7tlKhVs61w6av5Xu_Lw&oe=692F1316)

Se necesita un permiso específico para acceder a casi todos los nodos y campos. El mensaje de depuración te indica que debes dar permiso a tu app para acceder a la dirección de correo electrónico que asociaste con tu cuenta de Facebook.

### Paso 2: Agregar un permiso

En el panel del lado derecho, dentro de **Permisos**, haz clic en el menú desplegable **Agregar un permiso**. Haz clic en **Permisos de datos de usuario** y selecciona **correo electrónico**.

#### Generar un nuevo token de acceso de usuario

Al cambiar el alcance del token de acceso, deberás crear uno nuevo. Haz clic en **Generar token de acceso**. Como en tu primera solicitud, en el cuadro de diálogo de inicio de sesión con Facebook, debes dar permiso a la app para que acceda a tu correo electrónico.

Una vez que se haya creado el nuevo token, haz clic en **Enviar**. Ahora, se devolverán todos los campos de tu solicitud.

Prueba a obtener tus publicaciones de Facebook.

Consulta los pasos.

#### Enlaces de la respuesta

Ten en cuenta que los valores `id` devueltos en la ventana de respuesta son enlaces. Estos enlaces pueden representar nodos, como los de usuario, página o publicación. Si haces clic en un enlace, el identificador reemplazará el contenido del campo de la cadena de la consulta. Ahora puedes ejecutar solicitudes en ese nodo. Debido a que este nodo se conecta con el nodo principal, una publicación de usuario, es posible que no necesites agregar permisos. Puedes hacer clic en un identificador de publicación, ya que lo usaremos en el siguiente ejemplo.

Aviso: Algunos identificadores son una combinación del identificador principal y una nueva cadena de identificador. Por ejemplo, la publicación de un usuario tendrá un identificador de publicación con el siguiente aspecto: `1028223264288_102224043055529` donde `1028223264288` es el identificador de usuario.

## Echemos un vistazo a un perímetro

El nodo de usuario no tiene muchos perímetros que puedan devolver datos. Solo el usuario propietario del objeto puede otorgar acceso a objetos de usuario. En la mayoría de los casos, un usuario es propietario de un objeto si lo ha creado.

Por ejemplo, si compartes una publicación podrás ver información sobre ella, como la fecha de creación, los textos, las fotos y los enlaces compartidos, además de la cantidad de reacciones que recibió. Si haces un comentario sobre tu publicación, podrás ver el comentario. Sin embargo, si otra persona publica un comentario sobre tu publicación, no podrás verlo ni saber quién lo publicó.

Intenta obtener el número de reacciones de una de tus publicaciones. Te convendrá consultar la [referencia de reacciones de objetos](https://developers.facebook.com/docs/graph-api/reference/v13.0/object/reactions).

Consulta los pasos.

## Obtener el código para tu solicitud

La herramienta de exploración te permite probar solicitudes y, una vez que obtienes una respuesta correcta, puedes obtener el código para insertarlo en el código de tu app. En la parte inferior de la ventana de respuesta, haz clic en **Obtener código**. El explorador ofrece código de Android, iOS, JavaScript, PHP y cURL. El código viene preseleccionado, así que puedes copiarlo y pegarlo.

![Obtener código](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/231948896_1065545040645743_5920314088559660186_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e280be&_nc_ohc=O3iCPs3lhpYQ7kNvwHIttky&_nc_oc=Adn9V3uynGuytfqQzj4y7tGa1b5to4CNBWrdsiYw0SQLk6Jm3-CY5z4q8s_oIkCufIw&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=IDDEJDI3qUamh7BExil95A&oh=00_AfhhfOTPeZemSkdX9qGAFb3f7YNuh2IGqROVUYz2Z7HiOA&oe=692F00EC)

Te recomendamos implementar el SDK de Facebook para tu app. Este SDK incluirá el inicio de sesión con Facebook, que permite a tu app solicitar permisos y obtener tokens de acceso.

## Más información

Puedes usar la herramienta del explorador de la API Graph para probar cualquier solicitud de usuarios, páginas y grupos, entre otros elementos. Consulta la [referencia](https://developers.facebook.com/docs/graph-api/reference) de cada nodo o perímetro para determinar el permiso y el tipo de token de acceso requeridos.

- [Token de acceso](https://developers.facebook.com/docs/facebook-login/access-tokens)
- [Inicio de sesión con Facebook](https://developers.facebook.com/docs/facebook-login)
- [SDK de Facebook](https://developers.facebook.com/docs#apis-and-sdks)
- [Referencias de la API Graph](https://developers.facebook.com/docs/graph-api/reference)
- [Guía del explorador de la API Graph](https://developers.facebook.com/docs/graph-api/guides/explorer)
- [Seguridad del inicio de sesión](https://developers.facebook.com/docs/facebook-login/security)
- [Referencia de permisos](https://developers.facebook.com/docs/permissions/reference)
```



## Page: https://developers.facebook.com/docs/graph-api/guides/upload

```markdown
# Subir un archivo

La API de subida reanudable te permite subir archivos grandes a la gráfica social de Meta y reanudar las sesiones de subida interrumpidas sin tener que empezar de nuevo. Una vez que hayas subido tu archivo, podrás publicarlo.

Las referencias a los puntos de conexión que admiten identificadores de archivos subidos indicarán si los puntos de conexión son compatibles con los identificadores que devuelve la API de subida reanudable.

### Antes de empezar

En esta guía se presupone que has leído las guías [Información general sobre la API Graph](/docs/graph-api/overview) y [Desarrollo en Meta](/docs/development), y que has realizado las acciones necesarias para el desarrollo con Meta.

Necesitarás lo siguiente:

- Un ID de la app de Meta
- Un archivo en uno de los siguientes formatos: 
  - `pdf`
  - `jpeg`
  - `jpg`
  - `png`
  - `mp4`
- Un token de acceso de usuario

## Paso 1: Iniciar una sesión de subida

Para comenzar una sesión de subida, envía una solicitud `POST` al punto de conexión `/<APP_ID>/uploads`, donde `<APP_ID>` es el identificador de Meta de tu app, con los siguientes parámetros obligatorios:

- `file_name`: el nombre de tu archivo
- `file-length`: el tamaño del archivo en bytes
- `file-type`: el tipo MIME del archivo. Los valores válidos son: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png` y `video/mp4`

#### Sintaxis de la solicitud

*El formato se modificó para facilitar la lectura.*

```http
curl -i -X POST "https://graph.facebook.com/v24.0/<APP_ID>/uploads?file_name=<FILE_NAME>&file_length=<FILE_LENGTH>&file_type=<FILE_TYPE>&access_token=<USER_ACCESS_TOKEN>"
```

Si la operación se realiza con éxito, tu app recibirá una respuesta JSON que contendrá el identificador de sesión de subida.

```json
{
  "id": "upload:<UPLOAD_SESSION_ID>"
}
```

## Paso 2: Comenzar la subida

Empieza a subir el archivo enviando una solicitud `POST` al punto de conexión `/upload:<UPLOAD_SESSION_ID>` con el siguiente `file_offset` configurado en `0`.

#### Sintaxis de la solicitud

```http
curl -i -X POST "https://graph.facebook.com/v24.0/upload:<UPLOAD_SESSION_ID>" --header "Authorization: OAuth <USER_ACCESS_TOKEN>" --header "file_offset: 0" --data-binary @<FILE_NAME>
```

Debes incluir el token de acceso en el encabezado; en caso contrario, se producirá un error en la llamada.

Si la operación se realiza con éxito, tu app recibirá el identificador de archivos que utilizarás en tus llamadas a la API para publicar el archivo en tu punto de conexión.

```json
{
  "h": "<UPLOADED_FILE_HANDLE>"
}
```

#### Ejemplo de respuesta

```json
{
  "h": "2:c2FtcGxl..."
}
```

### Reanudar una subida interrumpida

Si iniciaste una sesión de subida, pero toma más tiempo del que se espera o se interrumpió, envía una solicitud `GET` al punto de conexión `/upload:<UPLOAD_SESSION_ID>` del [Paso 1](#paso-1-iniciar-una-sesion-de-subida).

```http
curl -i -X GET "https://graph.facebook.com/v24.0/upload:<UPLOAD_SESSION_ID>" --header "Authorization: OAuth <USER_ACCESS_TOKEN>"
```

Si la operación se realiza correctamente, tu app recibirá una respuesta JSON con el valor `file_offset`, que puedes usar para reanudar el proceso de subida desde donde se interrumpió.

```json
{
  "id": "upload:<UPLOAD_SESSION_ID>",
  "file_offset": "<FILE_OFFSET>"
}
```

Envía otra solicitud `POST`, como la que enviaste en el [Paso 2](#paso-2-comenzar-la-subida), con `file_offset` configurado en el valor `file_offset` que acabas de recibir. Esto reanudará el proceso de subida desde el punto donde se interrumpió.

```http
curl -i -X POST "https://graph.facebook.com/v24.0/upload:<UPLOAD_SESSION_ID>" --header "Authorization: OAuth <USER_ACCESS_TOKEN>" --header "file_offset: <FILE_OFFSET>" --data-binary @<FILE_NAME>
```

## Próximos pasos

- Consulta la [documentación de la API de video](https://developers.facebook.com/docs/video-api/guides/publishing) para realizar una publicación con video en una página de Facebook.
```



## Page: https://developers.facebook.com/docs/permissions

```markdown
# Permissions Reference for Meta Technologies APIs

Permissions are a form of granular, app user-granted Graph API authorization. Before your app can use an API endpoint to access your app user's data, your app user must grant your app all permissions required by that endpoint.

**Only select permissions that your app needs to function as intended. Selecting unneeded permissions is a common reason for rejection during app review.**

You may also use any permission granted to your app to request analytics insights to improve your app and for marketing or advertising purposes, through the use of aggregated and de-identified or anonymized information (provided such data cannot be re-identified).

## Requirements

- [Meta App Review](https://developers.facebook.com/docs/app-review) – For apps that need access to data that you do not own or manage
- [Business Verification](https://developers.facebook.com/docs/development/release/business-verification) – is required for all apps making requests for [Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access)
- If your app requests permission to use an endpoint to access an app user’s data, you may need to complete [data handling questions](https://developers.facebook.com/docs/development/release/data-handling-questions/questions-preview).
- You may also be required to complete an annual [Data Use Checkup](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup).

## Ways to ask for a permission

When your app users log onto your app, they receive a request to grant the permissions your app has requested. Your app users can grant or deny the requested permissions or any subset of them.

- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business)
- [Instagram API with Facebook Login for Business](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login)
- [Instagram API with Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Meta Business Manager](https://developers.facebook.com/docs/business-manager-api)

If your app does not use a permission for 90 days, usually due to user inactivity, your app user must regrant your app that permission.

## Remove a permission

You can use the [Meta App Dashboard](https://developers.facebook.com/apps) to remove a permission your app no longer uses or to remove a permission that has been deprecated.

---

## A

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `ads_management` | El permiso **ads_management** permite que tu app lea y administre las cuentas publicitarias que le pertenecen o a las que el propietario le concedió acceso. El uso permitido de este permiso es crear campañas, administrar anuncios u obtener métricas de anuncios mediante programación para ayudar a sus negocios. También se puede usar para desarrollar herramientas de administración de anuncios que ofrezcan soluciones innovadoras y un valor agregado para los anunciantes. <ul><li>Crea campañas, administra anuncios y obtén métricas mediante programación.</li><li>Desarrolla herramientas de administración de anuncios que ofrezcan soluciones innovadoras y un valor agregado para los anunciantes.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere administrar anuncios en nombre de otras empresas. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |
| `ads_read` | El permiso **ads_read** permite que tu app acceda a la [API de estadísticas de anuncios](https://developers.facebook.com/docs/marketing-api/read-access-onboarding) para obtener informes de anuncios de cuentas publicitarias que te pertenecen o a las que los propietarios de otras cuentas publicitarias te concedieron acceso. También permite que acceda a la [API del servidor](https://developers.facebook.com/docs/marketing-api/facebook-pixel/server-side-api) para que los anunciantes puedan enviar eventos web directamente desde sus servidores a Facebook. <ul><li>Proporciona a la API acceso a los datos de rendimiento de tus anuncios para utilizarlos en paneles y análisis personalizados.</li><li>Envía eventos web directamente desde tu servidor a Facebook.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere acceder a anuncios y estadísticas relacionadas en nombre de otras empresas. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |
| `attribution_read` | El permiso **attribution_read** permite que tu app acceda a la API de atribución para obtener datos de informes de atribución de las líneas de negocio que te pertenecen o a las que los propietarios de otras líneas de negocio te concedieron acceso. <ul><li>Permite que tu app acceda a los datos de rendimiento de los anuncios de la atribución para utilizarlos en paneles y análisis personalizados.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

---

## B

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `business_management` | El permiso **business_management** permite que tu app lea y escriba con la API del administrador comercial. The allowed usage for this permission is to manage business assets such as an ad account and to claim ad accounts. <ul><li>Administra activos comerciales, como una cuenta publicitaria.</li><li>Reclama cuentas publicitarias.</li></ul> | <div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><span><p>Provide specific examples of why your app requires managing business assets on behalf of other businesses. If the permission is requested as a dependency of another main permission, including `pages_messaging` or `pages_show_list`, please specify the main permission in the use case description.</p></span><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |

---

## C

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `catalog_management` | El permiso **catalog_management** permite que tu app cree, lea, actualice y elimine catálogos de productos del negocio en los que el usuario sea el administrador. The allowed usage for this permission is to build commerce-related solutions for ecommerce platforms, travel platforms and dynamic ads. It can also be used to build inventory type management solutions like product inventory, hotel inventory or car inventory. <ul><li>Desarrolla soluciones comerciales, como plataformas de comercio electrónico y de viajes, y anuncios dinámicos.</li><li>Desarrolla soluciones de administración de inventarios, como inventarios de productos, hoteles o automóviles.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere administrar los catálogos de productos de empresas que te conceden acceso. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo el usuario de la app crea, actualiza y elimina un catálogo de productos en la plataforma de tu app.</li></ol></span></div> |

---

## E

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `email` | El permiso **email** permite que tu app lea la dirección de correo electrónico principal de una persona. <div style="color:green;padding-top:5px;padding-left:10px"><i><b>Allowed Usage</b></i></div><ul><li>Comunícate con las personas y permite que puedan iniciar sesión en tu app con la dirección de correo electrónico asociada a su perfil de Facebook.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

---

## F

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `facebook_creator_marketplace_discovery` | El permiso **facebook_creator_marketplace_discovery** permite a una app descubrir creadores de contenido en la plataforma de descubrimiento de creadores de Facebook. Este permiso se puede usar para que los negocios de Facebook recuperen datos de estadísticas de creadores de Facebook que cumplan los requisitos con el fin de descubrirlos y evaluarlos para campañas de marca, así como para otorgarles crédito y pagarles por su presencia en Facebook. <div class="_7aa"><div style="color:green;padding-top:5px;padding-left:10px"><i><b>Uso permitido</b></i></div></div><ul><li>Recuperar datos de estadísticas de creadores de Facebook que cumplan los requisitos para descubrirlos y evaluarlos para las campañas de marca</li><li>Darles crédito y pagarles a los creadores por su presencia en Facebook</li></ul> | <div class="_7aa"><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Proporciona ejemplos específicos de por qué tu app requiere la administración del descubrimiento de creadores de Facebook en nombre de otros negocios.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión con Facebook completo en la plataforma de tu app y muestra cómo el usuario le otorga este permiso a tu app.</li><li>Demuestra cómo buscar creadores en la plataforma de descubrimiento de creadores de Facebook y muestra cómo acceder a estadísticas sobre los creadores, como la presentación, el número de seguidores y el alcance de la cuenta.</li><li>Demuestra cómo planeas usar los datos de estadísticas que obtuviste para los fines permitidos y muestra tu cumplimiento de todas las políticas de privacidad y uso de datos aplicables.</li></ol></span></div> |

---

## G

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `gaming_user_locale` | El permiso **gaming_user_locale** permite que tu app conozca el idioma de preferencia de un usuario cuando juega en Facebook (por ejemplo, juegos instantáneos o Cloud Gaming). The allowed usage for this permission is to display a game interface in the user's preferred language. <ul><li>Muestra una interfaz de juego en el idioma de preferencia del usuario.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

---

## I

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `instagram_basic` | El permiso **instagram_basic** permite que tu app lea la información y el contenido multimedia del perfil de una cuenta de Instagram. The allowed usage for this permission is to get basic metadata of an Instagram Business account profile, for example username and ID. <ul><li>Obtén metadatos básicos del perfil de una cuenta de empresa de Instagram, por ejemplo, un nombre de usuario o un identificador.</li></ul> | Incluye la información específica del perfil de la cuenta profesional de Instagram que requerirá tu caso de uso. Describe dónde se puede encontrar esta información en tu solución. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra el proceso completo de inicio de sesión con Facebook en la plataforma de tu app, muestra cómo el usuario de la app otorga a tu app este permiso y selecciona su cuenta de Instagram.</li></ol></span></div> |

---

## P

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `pages_events` | El permiso **pages_events** permite que tu app registre eventos en nombre de las páginas de Facebook que administran las personas que usan tu app, y que envíe esos eventos a Facebook para fines de segmentación de anuncios, optimización e informes. The allowed usage for this permission is to send businesses related activities (for example purchase, add-to-cart, lead) on behalf of Pages owned by the people who use your app. <ul><li>Envía actividades relacionadas con los negocios (como las compras, los artículos agregados al carrito o los clientes potenciales) en nombre de las páginas que pertenecen a las personas que usan tu app.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

---

## R

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `read_insights` | El permiso **read_insights** permite que tu app lea los datos de estadísticas de páginas, apps y dominios web que son propiedad de una persona. <div style="color:green;padding-top:5px;padding-left:10px"><i><b>Allowed Usage</b></i></div><ul><li>Integra las estadísticas de apps, páginas o dominios de Facebook con tus propias herramientas de análisis.</li></ul> | <div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div> Proporciona ejemplos específicos de por qué tu app requiere acceder a las estadísticas de la página en nombre de los usuarios de tu app en las páginas que poseen. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo el usuario de la app recupera métricas de estadísticas de su página de Facebook en la plataforma de tu app.</li><li>Demuestra que las métricas de estadísticas se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |

---

## T

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `threads_basic` | The **threads_basic** permission allows an app to get a user's Threads profile information and the media and text content that they posted to Threads. The allowed usage for this permission is to display a user’s own Threads posts within a business app, and make these visible only to the user who created them. <ul><li>Display a user’s own Threads posts within an app, and make these visible only to the user who created them for the purpose of managing the user's presence on Threads.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere el permiso **threads_basic** para acceder a la información del perfil de un usuario en Threads. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Threads completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo el usuario de la app accede a su contenido en Threads a través de tu app.</li></ol></span></div> |
```



## Page: https://developers.facebook.com/docs/graph-api/guides/secure-requests

```markdown
# Secure Graph API Calls

Almost every Graph API call requires an [access token](/docs/facebook-login/access-tokens/). Malicious developers can steal access tokens and use them to send spam from your app. Meta has automated systems to detect this, but you can help us secure your app. This document covers some of the ways you can improve security in your app.

## Meta Crawler

A number of platform services such as Social Plugins and Open Graph require our systems to be able to reach your web pages. We recognize that there are situations where you might not want these pages on the public web, during testing or for other security reasons.

We've provided information on IP allow lists and User Agent strings for Meta's crawlers in our [Meta Crawler guide](/docs/sharing/webmasters/crawler).

## Login Security

There are a large number of settings you can change to improve the security of your app. Please see our [Login Security](/docs/facebook-login/security/) documentation for a checklist of things you can do.

It's also worth looking at our [access token](/docs/facebook-login/access-tokens/) documentation which covers various architectures and the security trade-offs that you should consider.

## Server Allow List

We also enable you to restrict some of your API calls to come from a list of servers that you have allowed to make calls. Learn more in our [login security](/docs/facebook-login/security#surfacearea) documentation.

## Social Plugin Confirmation Steps

In order to protect users from unintentionally liking content around the web, our systems will occasionally require them to confirm that they intended to interact with one of our Social Plugins via a "confirm" dialog. This is expected behavior and once the system has verified your site as a good actor, the step will be removed automatically.

## Encryption

When connecting to our servers your client must use TLS and be able to verify a certificate signed using [sha256WithRSAEncryption](https://l.facebook.com/l.php?u=http%3A%2F%2Fwww.alvestrand.no%2Fobjectid%2F1.2.840.113549.1.1.11.html&h=AT1TAlwlgHaIkhXAIOG3eQy054mJkNhF_ivqSEC9RPdx4O9b72ErQt6C8JdcnqAraBkz0h6G3iPaNqvaiOggMVdNrIZh1v_opgKceOdLWS6S33gV1ByfrcMXTyd7MyfQqI6aHWHtlfkdoP6FhRTHtjV4pU0).

Graph API supports TLS 1.2 and 1.3 and non-static RSA cipher suites. We are currently deprecating support for older TLS versions and static RSA cipher suites. Version 16.0 no longer supports TLS versions older than 1.1 or static RSA cipher suites. This change will apply to all API versions on May 3, 2023.

## Verify Graph API Calls with `appsecret_proof`

Access tokens are portable. It's possible to take an access token generated on a client by Meta's SDK, send it to a server and then make calls from that server on behalf of the client. An access token can also be stolen by malicious software on a person's computer or a man in the middle attack. Then that access token can be used from an entirely different system that's not the client and not your server, generating spam or stealing data.

Calls from a server can be better secured by adding a parameter called `appsecret_proof`. The app secret proof is a sha256 hash of your access token, using your app secret as the key. The app secret can be found in your app dashboard in **Settings > Basic**.

If you're using the official PHP SDK, the `appsecret_proof` parameter is automatically added.

### Generate the Proof

The following code example is what the call looks like in PHP:

```php
$appsecret_proof = hash_hmac('sha256', $access_token, $app_secret);
```

### Add the Proof

You add the result as an `appsecret_proof` parameter to each call you make:

```bash
curl \
  -F 'access_token=<access_token>' \
  -F 'appsecret_proof=<app secret proof>' \
  -F 'batch=[{"method":"GET", "relative_url":"me"},{"method":"GET", "relative_url":"me/friends?limit=50"}]' \
  https://graph.facebook.com
```

### Require the Proof

To enable **Require App Secret** for all your API calls, go to the Meta App Dashboard and click **App Settings > Advanced** in the left side menu. Scroll to the **Security** section, and click the **Require App Secret** toggle.

If this setting is enabled, all client-initiated calls must be proxied through your backend where the `appsecret_proof` parameter can be added to the request before sending it to the Graph API, or the call will fail.
```



## Page: https://developers.facebook.com/docs/graph-api/guides/error-handling

```markdown
# Administración de errores

Las solicitudes realizadas a nuestras API pueden obtener varias respuestas de error diferentes. El siguiente documento describe los métodos de recuperación y ofrece una lista de valores de error, junto con el método de recuperación más común para cada uno de ellos.

## Respuestas de error

Lo siguiente representa una respuesta de error común que se genera a partir de una solicitud de API errónea:

```json
{
  "error": {
    "message": "Message describing the error",
    "type": "OAuthException",
    "code": 190,
    "error_subcode": 460,
    "error_user_title": "A title",
    "error_user_msg": "A message",
    "fbtrace_id": "EJplcsCHuLu"
  }
}
```

- `message`: descripción en lenguaje natural del error.
- `code`: código de error. Los valores comunes se especifican más adelante, junto con los métodos de recuperación habituales.
- `error_subcode`: información adicional sobre el error. Los valores comunes se especifican más adelante.
- `error_user_msg`: mensaje para mostrar al usuario. El idioma del mensaje se basa en la configuración regional de la solicitud de la API.
- `error_user_title`: título del cuadro de diálogo, si aparece. El idioma del mensaje se basa en la configuración regional de la solicitud de la API.
- `fbtrace_id`: identificador de compatibilidad interno. Al [reportar un error](https://developers.facebook.com/bugs/) relacionado con una llamada a la API Graph, incluye `fbtrace_id` para ayudarnos a encontrar datos de registro para realizar la depuración. Sin embargo, este identificador caducará rápidamente. Con el fin de ayudar al equipo de soporte a reproducir tu error, adjunta una [sesión del explorador de la API Graph](https://developers.facebook.com/tools/explorer/) guardada.

### Códigos de error

| Código o tipo             | Nombre                               | Qué hacer                                                                                                                                                             |
|--------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| OAuthException           |                                     | Si no existe un subcódigo, el estado de inicio de sesión o el token de acceso caducó, se revocó o no es válido. [Obtén un nuevo token de acceso](https://docs.facebook.com/docs/facebook-login/access-tokens#errors). Si existe un subcódigo, consúltalo. |
| 102                      | Sesión de la API                   | Si no existe un subcódigo, el estado de inicio de sesión o el token de acceso caducó, se revocó o no es válido. [Obtén un nuevo token de acceso](https://docs.facebook.com/docs/facebook-login/access-tokens#errors). Si existe un subcódigo, consúltalo. |
| 1                        | API desconocida                     | Puede ser un problema temporal debido a que la API no está disponible. Espera y vuelve a intentar la operación. Si vuelve a ocurrir, comprueba que estés enviando la solicitud a una API preexistente. |
| 2                        | Servicio de API                     | Problema temporal debido a que la API no está disponible. Espera y vuelve a intentar la operación.                                                                  |
| 3                        | Método de la API                   | Problema de función o permisos. Asegúrate de que tu app tenga las funciones y los permisos necesarios para realizar esta llamada.                                  |
| 4                        | Demasiadas llamadas a la API       | Problema temporal ocasionado por una limitación. Espera y vuelve a intentar la operación; o bien, revisa la cantidad de solicitudes que enviaste a la API.         |
| 17                       | Demasiadas llamadas de usuario a la API | Problema temporal ocasionado por una limitación. Espera y vuelve a intentar la operación; o bien, revisa la cantidad de solicitudes que enviaste a la API.         |
| 10                       | Permiso de API denegado            | No se otorgó el permiso o se eliminó. [Administra los permisos faltantes](https://docs.facebook.com/docs/facebook-login/permissions#handling).                     |
| 190                      | El token de acceso caducó          | [Obtén un nuevo token de acceso](https://docs.facebook.com/docs/facebook-login/access-tokens#errors).                                                               |
| 200-299                  | Permiso de API (varios valores según el permiso) | No se otorgó el permiso o se eliminó. [Administra los permisos faltantes](https://docs.facebook.com/docs/facebook-login/permissions#handling).                     |
| 341                      | Límite de app alcanzado            | Problema temporal ocasionado por un tiempo de inactividad o una limitación. Espera y vuelve a intentar la operación; o bien, revisa la cantidad de solicitudes que enviaste a la API. |
| 368                      | Bloqueado temporalmente por infracción de las políticas | Espera y vuelve a intentar la operación.                                                                                                                            |
| 506                      | Publicación duplicada               | No se pueden hacer publicaciones duplicadas de manera consecutiva. Cambia el contenido de la publicación y vuelve a intentarlo.                                      |
| 1609005                  | Error en enlace de publicación      | Hubo un problema al extraer los datos del enlace proporcionado. Comprueba la URL y vuelve a intentarlo.                                                              |

### Subcódigos de error de autenticación

| Código | Nombre                   | Qué hacer                                                                                                                                               |
|--------|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| 458    | App no instalada         | El usuario no inició sesión en la app. Vuelve a autenticar al usuario.                                                                                |
| 459    | Usuario verificado       | El usuario necesita iniciar sesión en [facebook.com](https://www.facebook.com) o [m.facebook.com](https://m.facebook.com) para corregir un problema. |
| 460    | Contraseña modificada    | En iOS 6 y versiones posteriores, si la persona inició sesión con el proceso integrado en el sistema operativo, dirígela a la configuración del sistema operativo de Facebook en el dispositivo para actualizar su contraseña. De lo contrario, deberá volver a iniciar sesión en la app. |
| 463    | Caducado                | El estado de inicio de sesión o el token de acceso caducó, se revocó o no es válido. [Administra los tokens de acceso caducados](https://docs.facebook.com/docs/facebook-login/access-tokens#errors). |
| 464    | Usuario no confirmado    | El usuario necesita iniciar sesión en [facebook.com](https://www.facebook.com) o [m.facebook.com](https://m.facebook.com) para corregir un problema. |
| 467    | Token de acceso no válido | El token de acceso caducó, se revocó o no es válido. [Administra los tokens de acceso caducados](https://docs.facebook.com/docs/facebook-login/access-tokens#errors). |
| 492    | Sesión no válida         | El usuario asociado con el token de acceso a la página no tiene el rol apropiado en la página.                                                        |

### Códigos de error de limitación de frecuencia

Visita la [guía de límites de frecuencia de la API Graph](https://developers.facebook.com/docs/graph-api/overview/rate-limiting) para obtener más información sobre los códigos de error de los límites de frecuencia.
```



## Page: https://developers.facebook.com/docs/graph-api/guides/field-expansion

```markdown
# Field Expansion

If you test the `GET /me/feed` query in the Graph API Explorer, you will notice that the request returned many objects and paginated the results. This is common for most edges.

#### Example Response

```json
{
  "data": [
    {
      "created_time": "2021-04-30T01:37:07+0000",
      "message": "I'll never forget it has a head.",
      "id": "10211998223264288_10222340566616408"
    },
    ...
    {
      "created_time": "2021-04-25T22:29:26+0000",
      "message": "Things you hear at my house: \"I accidentally made a cake.\"",
      "id": "10211998223264288_10222314489524497"
    }
  ],
  "paging": {
    "previous": "https://graph.facebook.com/<API_VERSION>/<USER_ID>/feed?access_token=<ACCESS-TOKEN>&pretty=0&__previous=1&since=1627322627&until&__paging_token=enc_AdB2fX...",
    "next": "https://graph.facebook.com/<API_VERSION>/<USER_ID>/feed?access_token=<ACCESS-TOKEN>&pretty=0&until=1619389766&since&__paging_token=enc_AdAamX...&__previous"
  }
}
```

Field expansion allows you not only to limit the number of objects returned but also perform nested requests.

## Limiting Results

Limiting allows you to control the number of objects returned in each set of paginated results. To limit results, add a `.limit()` argument to any field or edge.

For example, performing a GET request on your `/feed` edge may return hundreds of Posts. You can limit the number of Posts returned for each page of results by doing this:

```bash
curl -i -X GET "https://graph.facebook.com/<API_VERSION>/<USER_ID>?fields=feed.limit(3)&access_token=<ACCESS-TOKEN>"
```

This returns all of the Posts on your User node, but limits the number of objects in each page of results to three. Notice that instead of specifying the Feed edge in the path URL (`/user/feed`), you specify it in the `fields` parameter (`?fields=feed`), which allows you to append the `.limit(3)` argument.

Here are the query results:

```json
{
  "feed": {
    "data": [
      {
        "created_time": "2021-12-12T01:24:21+0000",
        "message": "This picture of my grandson with Santa",
        "id": "<POST_ID>"
      },
      {
        "created_time": "2021-12-11T23:40:17+0000",
        "message": ":)",
        "id": "<POST_ID>"
      },
      {
        "created_time": "2021-12-11T23:31:38+0000",
        "message": "Thought you might enjoy this.",
        "id": "<POST_ID>"
      }
    ],
    "paging": {
      "previous": "https://graph.facebook.com/<API_VERSION>/<USER_ID>/feed?format=json&limit=3&since=1542820440&access_token=<ACCESS-TOKEN>&__paging_token=enc_AdC...&__previous=1",
      "next": "https://graph.facebook.com/<API_VERSION>/<USER_ID>/feed?format=json&limit=3&access_token=<ACCESS-TOKEN>&until=1542583212&__paging_token=enc_AdD..."
    },
    "id": "<USER_ID>"
  }
}
```

As you can see, only three objects appear in this page of paginated results. However, the response included a `next` field and URL which you can use to fetch the next page.

## Nested Requests

The field expansion feature of the Graph API allows you to effectively nest multiple graph queries into a single call. For example, in a single call, you can ask for the first N photos of the first K albums. The response maintains the data hierarchy so developers do not have to weave the data together on the client. This is different from the [batch requests](https://developers.facebook.com/docs/graph-api/making-multiple-requests/) feature which allows you to make multiple, potentially unrelated, Graph API calls in a single request.

Here is the general format that field expansion takes:

```plaintext
GET graph.facebook.com/<NODE_ID>?fields=<LEVEL_ONE>{<LEVEL_TWO>}
```

`<LEVEL_ONE>` in this case would be one or more (comma-separated) fields or edges from the parent node. `<LEVEL_TWO>` would be one or more (comma-separated) fields or edges from the first level node.

There is no limitation to the amount of nesting of levels that can occur here. You can also use a `.limit(n)` argument on each field or edge to restrict how many objects you want to get.

This is easier to understand by seeing it in action, so here's an example query that will retrieve up to five posts you published, with the text from each individual post.

```plaintext
GET graph.facebook.com/me?fields=posts.limit(5){message}
```

We can then extend this a bit more and for each post object, we get the text and privacy setting of each post. By default the `privacy` field returns an object that contains information about five key:value pairs, `allow`, `deny`, `description`, `friends`, and `value`. In this query we only want one returned, the `value` key:value pair.

```plaintext
GET graph.facebook.com/me?fields=posts.limit(5){message,privacy{value}}
```

Now we can extend it again by retrieving the name of each photo, the picture URL, and the people tagged:

```plaintext
GET graph.facebook.com/me?fields=albums.limit(5){name,photos.limit(2){name,picture,tags.limit(2)}},posts.limit(5)
```

Let's look at an example using cursor-based pagination:

```plaintext
GET graph.facebook.com/me?fields=albums.limit(5){name,photos.limit(2).after(MTAyMTE1OTQwNDc2MDAxNDkZD){name,picture,tags.limit(2)}},posts.limit(5)
```

You can see how field expansion can work across nodes, edges, and fields to return really complex data in a single request.

#### Limitations

- Certain resources, including most of Marketing API, are unable to utilize field expansion on some or all connections.

## Field Aliases

Many nodes and edges allow you to provide aliases for fields by using the `as` parameter. This will return data using fields that you already have in your application logic.

For example, you can retrieve an image in two sizes and alias the returned object fields as `picture_small` and `picture_larger`:

```plaintext
/me?fields=id,name,picture.width(100).height(100).as(picture_small),picture.width(720).height(720).as(picture_large)
```

On success, Graph API returns this result:

```json
{
  "id": "993363923726",
  "name": "Benjamin Golub",
  "picture_small": {
    "data": {
      "height": 100,
      "is_silhouette": false,
      "url": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xft1/v/t1.0-1/p100x100/11700890_10100330450676146_2622493406845121288_n.jpg?oh=82b9abe469c78486645783c9e70e8797&oe=561D10AE&__gda__=1444247939_661c0f48363f1d1a7d42b6f836687a04",
      "width": 100
    }
  },
  "picture_large": {
    "data": {
      "height": 720,
      "is_silhouette": false,
      "url": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xft1/v/t1.0-1/11700890_10100330450676146_2622493406845121288_n.jpg?oh=dd86551faa2de0cd6b359feb5665b0a5&oe=561E0B46&__gda__=1443979219_f1abbbdfb0fb7dac361d7ae02b460638",
      "width": 720
    }
  }
}
```

Please note that not all nodes and edges support field aliasing. Endpoints that do not support aliasing will return an error. For example, the `User` node does not support aliasing, so if you tried to alias the `name` field as `my_name` you would receive an error like this:

```json
{
  "error": {
    "message": "(#100) Unknown fields: my_name.",
    "type": "OAuthException",
    "code": 100
  }
}
```

## Next Steps

- Learn about [Paginated Results](https://developers.facebook.com/docs/graph-api/results).
```



## Page: https://developers.facebook.com/docs/graph-api/changelog

```markdown
# Registro de cambios

La versión más reciente de la API Graph es:

```
v24.0
```

En los registros de cambios de la API Graph y la API de marketing se documentan los [cambios con versión](#versioned) y [sin versión](#outofcycle) relacionados con la API.

### Registros de cambios relacionados

- [Registro de cambios de la plataforma de Instagram](https://developers.facebook.com/docs/instagram-platform/changelog)
- [Registro de cambios de la API de marketing](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog)
- [Registro de cambios de la plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform/changelog/) (incluye mensajes de Instagram)
- [Registro de cambios de la Plataforma de WhatsApp Business](https://developers.facebook.com/docs/whatsapp/business-platform/changelog)

### Cambios con versión

Los cambios con versión son cambios que se producen con el lanzamiento de una nueva [versión](https://developers.facebook.com/docs/apps/versions) de la API. Generalmente, los cambios con versión se aplican a la versión más reciente de inmediato y, a menudo, se aplican a otras versiones en una fecha futura. El registro de cambios que se incluye con cada lanzamiento indica qué cambios corresponden al lanzamiento actual y cuáles, a otras versiones.

Consulta nuestra [Guía de actualizaciones](https://developers.facebook.com/docs/apps/upgrading) para aprender a actualizar a una nueva versión de la API.

### Cambios sin versión

Los cambios sin versión son cambios que se producen fuera de nuestro cronograma normal de lanzamientos de versiones y, por lo general, no se aplican a una versión específica. Los cambios sin versión se suelen aplicar a todas las versiones de la API de inmediato. Por esta razón, es poco frecuente que se produzcan cambios sin versión.

## Versiones disponibles de la API Graph

| Versión | Fecha de introducción | Disponible hasta |
|---------|-----------------------|------------------|
| [v24.0](https://developers.facebook.com/docs/graph-api/changelog/version24.0) | 8 de octubre de 2025 | Por determinar |
| [v23.0](https://developers.facebook.com/docs/graph-api/changelog/version23.0) | 29 de mayo de 2025 | Por determinar |
| [22.0](https://developers.facebook.com/docs/graph-api/changelog/version22.0) | 21 de enero de 2025 | Por determinar |
| [21.0](https://developers.facebook.com/docs/graph-api/changelog/version21.0) | 2 de octubre de 2024 | Por determinar |
| [20.0](https://developers.facebook.com/docs/graph-api/changelog/version20.0#graph-api) | 21 de mayo de 2024 | 24 de septiembre de 2026 |
| [v19.0](https://developers.facebook.com/docs/graph-api/changelog/version19.0#graph-api) | 23 de enero de 2024 | 21 de mayo de 2026 |
| [18.0](https://developers.facebook.com/docs/graph-api/changelog/version18.0#graph-api) | 12 de septiembre de 2023 | 26 de enero de 2023 |
| [17.0](https://developers.facebook.com/docs/graph-api/changelog/version17.0#graph-api) | 23 de mayo de 2023 | 12 de septiembre de 2025 |
| [16.0](https://developers.facebook.com/docs/graph-api/changelog/version16.0#graph-api) | 2 de febrero de 2023 | 14 de mayo de 2025 |
| [15.0](https://developers.facebook.com/docs/graph-api/changelog/version15.0#graph-api) | 15 de septiembre de 2022 | 20 de noviembre de 2024 |
| [14.0](https://developers.facebook.com/docs/graph-api/changelog/version14.0#graph-api) | 25 de mayo de 2022 | 17 de septiembre de 2024 |
| [13.0](https://developers.facebook.com/docs/graph-api/changelog/version13.0#graph-api) | 8 de febrero de 2022 | 28 de mayo de 2024 |

## Versiones disponibles de la API de marketing

La función de [actualización automática de la versión](https://developers.facebook.com/docs/marketing-api/versions#version-auto-upgrade) de la API de marketing se lanzará el 14 de mayo de 2024.

| Version | Date Introduced | Available Until |
|---------|----------------|------------------|
| [v24.0](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/version24.0) | October 8, 2025 | TBD |
| [v23.0](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/version23.0) | May 29, 2025 | TBD |
| [v22.0](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/version22.0) | January 21, 2025 | TBD |
| [v21.0](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/version21.0) | October 2, 2024 | September 9, 2025 |

## Cambios sin versión

- [Cambios sin versión de 2023](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/nvc-2023)
```



## Page: https://developers.facebook.com/docs/features-reference

```markdown
## Features Reference

Features are authorization mechanisms that allow apps to access specific types of data through our various APIs. In this way they are similar to Permissions, however Features cannot be granted to an app by an app user. Instead, Features are active or inactive depending on the app user's relationship to the app and the app's mode when it is being used.

For apps in Development Mode, all Features except for Page Public Content Access and Page Public Metadata Access are active for any app user who has a Role on the app or a Role in a Business that has claimed the app.

For apps in Live Mode, only Features approved through App Review are active for app users. This also applies to app users who have a Role on the app or Business.

For Business app types (which have access levels instead of modes), Features are active for any app users who have a Role on the app or in a Business that has claimed the app, unless access has been removed. In order for a Feature to be active for app users without a Role on the app or Business, it must first be approved through App Review.

Access to any Feature that is granted by default or through App Review can be used to request analytics insights to improve your app and for marketing or advertising purposes, through the use of aggregated and de-identified or anonymized information (provided such data cannot be re-identified).

Unlike Permissions, Features do not expire, their approval will not be revoked, if they are unused.

| Feature | Description |
|---------|-------------|
| [Ad Targeting Data Access](https://developers.facebook.com/docs/features-reference/ad-targeting-data-access) | The **Ad Targeting Data Access** feature allows access to ad targeting data within the Facebook Open Research and Transparency tool for election, political, and social issue ads that are run on Facebook from Meta and Instagram from Meta. <br/><br/><strong>Allowed Usage</strong><ul><li>Para realizar investigaciones sobre el rol de Meta en la sociedad</li></ul> |
| [Ads Management Standard Access](https://developers.facebook.com/docs/features-reference/ads-management-standard-access) | La función de **acceso estándar a la administración de anuncios** permite que tu app acceda a la API de marketing. <br/><br/><strong>Allowed Usage</strong><ul><li>Permitir un número ilimitado de cuentas publicitarias y disminuir la limitación de frecuencia.</li><li>Para leer informes de cuentas publicitarias que te pertenecen o a las que el propietario te concedió acceso, solicita el **acceso estándar a la administración de anuncios**, junto con el permiso **ads_read**.</li><li>Para leer y administrar anuncios de cuentas publicitarias que te pertenecen o a las que el propietario te concedió acceso, solicita el **acceso estándar a la administración de anuncios**, junto con el permiso **ads_management**.</li><li>Para obtener informes publicitarios de un conjunto de clientes, así como para leer y administrar anuncios de otro conjunto de clientes, solicita **acceso estándar a la administración de anuncios**, junto con los permisos **ads_read** y **ads_management**.</li></ul> |
| [Business Asset User Profile Access](https://developers.facebook.com/docs/features-reference/business-asset-user-profile-access) | La función de **acceso al perfil del usuario del activo comercial** permite que tu app lea los [campos del usuario](https://developers.facebook.com/docs/graph-api/reference/user#fields) para aquellos usuarios que interactúan con tus activos comerciales, como "id", "ids_for_business", "name" y "picture". <br/><br/><strong>Allowed Usage</strong> Puedes usar esta función si tu app utiliza uno o más de los campos del usuario en esta experiencia de app comercial. |
| [Human Agent](https://developers.facebook.com/docs/features-reference/human-agent) | La función de **agente humano** permite que tu app disponga de un agente humano para responder mensajes mediante la etiqueta **human_agent** en un plazo de siete días desde que los usuarios los envían. <br/><br/><strong>Allowed Usage</strong><ul><li>Brinda asistencia con agentes humanos en casos en los que el problema de un usuario no se pueda resolver en el intervalo de mensaje estándar.</li></ul> |
| [Instagram Public Content Access](https://developers.facebook.com/docs/features-reference/instagram-public-content-access) | La función de **acceso a contenido público de Instagram** permite que tu app acceda a los puntos de conexión de la búsqueda de hashtags de la API Graph de Instagram. <br/><br/><strong>Allowed Usage</strong><ul><li>Descubre contenido asociado a la campaña actual.</li><li>Ofrece servicio de atención al cliente.</li><li>Identifica participantes de concursos, competencias o sorteos.</li><li>Conoce la percepción del público sobre la marca.</li><li>Entiende y administra al público, desarrolla la estrategia de contenido y obtén derechos digitales.</li></ul> |
| [Instant Games Zero Permission Access](https://developers.facebook.com/docs/features-reference/instant-games-zero-permission-access) | Permite que una app comparta datos de usuario, como el identificador de contexto de juegos instantáneos, el identificador de jugador, el perfil de usuario, la ubicación y los datos de juego. El uso permitido de esta función es integrar los perfiles de usuario en juegos instantáneos dentro de la red de Meta sin tener acceso directo a los datos del usuario. <br/><br/><strong>Allowed Usage</strong><div style="color:green;padding-top:5px;padding-left:10px"><i><b>Uso permitido</b></i></div><ul><li>Integrate user profiles in Instant Games on Meta’s network</li></ul> |
| [Live Video API](https://developers.facebook.com/docs/features-reference/live-video-api) | La función de la **API de video en vivo** permite a una app administrar videos en vivo en las páginas, los grupos y las biografías de los usuarios, siempre que se combine con los permisos adecuados. <br/><br/><strong>Allowed Usage</strong><ul><li>Los usuarios de la app pueden publicar contenido de video en vivo de tu app en Facebook.</li></ul> |
| [oEmbed Read](https://developers.facebook.com/docs/features-reference/oembed-read) | Full deprecation on October 1, 2025. La función **oEmbed Read** permite que en tu app se inserten HTML y metadatos básicos para páginas, publicaciones y videos públicos de Facebook e Instagram. <br/><br/><strong>Allowed Usage</strong><ul><li>Proporciona vistas front-end de páginas, publicaciones y videos de Facebook e Instagram.</li></ul> |
| [Meta oEmbed Read](https://developers.facebook.com/docs/features-reference/meta-oembed-read) | La función **oEmbed Read** de Meta permite que se inserten HTML y metadatos básicos en tu app para páginas, publicaciones y videos públicos de Facebook e Instagram. El uso permitido de esta función es proporcionar vistas front-end de páginas, publicaciones y videos públicos de Facebook e Instagram. <br/><br/><strong>Allowed Usage</strong><div style="color:green;padding-top:5px;padding-left:10px"><i><b>Uso permitido</b></i></div><ul><li>To provide front-end views of public Facebook and Instagram pages, posts, and videos</li></ul> |
| [Page Mentioning](https://developers.facebook.com/docs/features-reference/page-mentioning) | La función de **menciones de páginas** permite que tu app mencione cualquier página de Facebook al realizar publicaciones en las páginas que administra. <br/><br/><strong>Allowed Usage</strong><ul><li>Permite a las personas usar tu app para realizar publicaciones de la página en las que se mencionen otras páginas.</li><li>Menciona páginas relevantes para el contenido de tu publicación de la página.</li></ul> |
| [Page Public Content Access](https://developers.facebook.com/docs/features-reference/page-public-content-access) | La función de **acceso al contenido público de la página** permite a tu app acceder a la API de búsqueda en páginas y leer datos públicos en páginas para las que no tienes el permiso [pages_read_engagement](https://developers.facebook.com/docs/permissions/reference/pages_read_engagement) ni el permiso [pages_read_user_content](https://developers.facebook.com/docs/permissions/reference/pages_read_user_content). Los datos legibles incluyen metadatos comerciales, comentarios públicos y publicaciones.<br/><br/><strong>Allowed Usage</strong><ul><li>Analiza o muestra las publicaciones y la interacción en las páginas.</li></ul> |
| [Page Public Metadata Access](https://developers.facebook.com/docs/features-reference/page-public-metadata-access) | La función **Acceso a metadatos públicos de páginas** permite a tu app acceder a la API de búsqueda de páginas y leer los datos públicos de las páginas cuyos [campos públicos de página](https://developers.facebook.com/docs/graph-api/reference/page#public-page-data) no posees y de la [API de búsqueda de páginas](https://developers.facebook.com/docs/pages/searching). <br/><br/><strong>Allowed Usage</strong><ul><li>Analiza la interacción con páginas públicas a partir de los recuentos de seguidores y Me gusta.</li><li>Agrupa los datos que se muestran al público en la sección "Información" de diversas páginas.</li></ul> |
| [Threads oEmbed Read](https://developers.facebook.com/docs/features-reference/threads-oembed-read) | The **Threads oEmbed Read** feature allows an app to embed content of Threads posts, such as photos and videos, in other websites. <br/><br/><strong>Allowed Usage</strong><div style="color:green;padding-top:5px;padding-left:10px"><i><b>Uso permitido</b></i></div><ul><li>Provide front-end views of Threads posts</li></ul> |
| [Threat Exchange](https://developers.facebook.com/docs/features-reference/threat-exchange) | La función **ThreatExchange** permite que tu app comparta datos sobre amenazas entre un grupo específico de socios del sector autorizados. <br/><br/><strong>Allowed Usage</strong><ul><li>Comparte datos sobre amenazas con un grupo específico de socios a fin de alcanzar los objetivos de seguridad.</li></ul> |

## Learn More

Learn more about developing with Meta with the following guides:

|  |  |
|---|---|
| [Access Levels](https://developers.facebook.com/docs/graph-api/overview/access-levels/#development-mode-and-live-mode) | [App Review](https://developers.facebook.com/docs/app-review) |
| [App Roles](https://developers.facebook.com/docs/development/build-and-test/app-roles) | [App Types](https://developers.facebook.com/docs/development/create-an-app#app-type) |
| [Business Roles](https://www.facebook.com/business/help/442345745885606?id=180505742745347) | [Development Mode](https://developers.facebook.com/docs/development/build-and-test/app-modes) |
| [Live Mode](https://developers.facebook.com/docs/development/build-and-test/app-modes) | [Permissions Reference](https://developers.facebook.com/docs/permissions/reference) |
```



## Page: https://developers.facebook.com/docs/graph-api/overview

```markdown
# Información general

La API Graph es la principal forma de ingresar datos en la plataforma de Facebook y extraerlos de esta. Se trata de una API basada en HTTP que las apps pueden usar de manera programática para consultar datos, publicar nuevas historias, administrar anuncios, subir fotos y llevar a cabo una gran variedad de tareas.

El nombre de la Graph API proviene del concepto de "gráfica social", una representación de la información en Facebook. Se compone de nodos, perímetros y campos. Normalmente, los nodos se usan para obtener datos sobre un objeto específico; los perímetros, para obtener colecciones de objetos a partir de un objeto único; y los campos, para obtener datos sobre un objeto único o todos los objetos en una colección. Es posible que en este documento nos refiramos a los nodos y a los perímetros como "puntos de conexión". Por ejemplo, "enviar una solicitud `GET` al punto de conexión 'Usuario'".

## HTTP

Todas las transferencias de datos cumplen con el protocolo HTTP/1.1 y los puntos de conexión deben usar HTTPS. Dado que la API Graph se basa en HTTP, funciona con cualquier lenguaje que tenga una biblioteca HTTP, como cURL y urllib. Esto significa que la API Graph se puede usar directamente en el navegador. Por ejemplo, solicitar esta URL en el navegador…

[https://graph.facebook.com/facebook/picture?redirect=false](https://graph.facebook.com/facebook/picture?redirect=false)

... equivale a realizar esta solicitud cURL:

```bash
curl -i -X GET "https://graph.facebook.com/facebook/picture?redirect=false"
```

Además, activamos la directiva HSTS `includeSubdomains` en `facebook.com`, aunque esto no debería perjudicar las llamadas a la API Graph.

## URL del host

Casi todas las solicitudes se pasan a la URL del host `graph.facebook.com`. Salvo en el caso de las subidas de videos, que usan `graph-video.facebook.com`.

## Tokens de acceso

Los tokens de acceso permiten que la app acceda a la API Graph. Casi todos los puntos de conexión de la API Graph requieren algún tipo de token de acceso, por lo que todas las solicitudes de acceso pueden requerir uno. Normalmente, realizan dos funciones:

- Permiten que la app acceda a la información de un usuario sin necesidad de proporcionar su contraseña. Por ejemplo, la app requiere que el correo electrónico de un usuario realice una función. Si el usuario acepta que la app recupere su dirección de correo electrónico de Facebook, no tendrá que introducir su contraseña de Facebook para que lo haga.
- Nos permiten identificar la app, el usuario que la utiliza y los tipos de datos a los que este le permitió acceder.

Consulta nuestra [documentación del token de acceso](https://developers.facebook.com/docs/facebook-login/access-tokens) para obtener más información.

## Nodos

Un nodo es un objeto individual con un identificador único. Por ejemplo, existen muchos objetos de nodo Usuario, cada uno con un identificador único que representa a una persona en Facebook. Las páginas, los grupos, las publicaciones, las fotos y los comentarios son solo algunos de los nodos de la gráfica social de Facebook.

El siguiente ejemplo de cURL representa una llamada al nodo Usuario.

```bash
curl -i -X GET "https://graph.facebook.com/USER-ID?access_token=ACCESS-TOKEN"
```

Esta solicitud devolvería los siguientes datos de manera predeterminada, con un formato JSON:

```json
{
  "name": "Your Name",
  "id": "YOUR-USER-ID"
}
```

### Metadatos del nodo

Se puede obtener una lista de todos los campos, incluidos el nombre del campo, la descripción y el tipo de datos, de un objeto de nodo, como un Usuario, una Página o una Foto. Envía una solicitud `GET` a un identificador de objeto e incluye el parámetro `metadata=1`:

```bash
curl -i -X GET "https://graph.facebook.com/USER-ID?metadata=1&access_token=ACCESS-TOKEN"
```

La respuesta JSON resultante incluirá la propiedad `metadata` que enumera todos los campos admitidos para el nodo dado:

```json
{
  "name": "Jane Smith",
  "metadata": {
    "fields": [
      {
        "name": "id",
        "description": "The app user's App-Scoped User ID. This ID is unique to the app and cannot be used by other apps.",
        "type": "numeric string"
      },
      {
        "name": "age_range",
        "description": "The age segment for this person expressed as a minimum and maximum age. For example, more than 18, less than 21.",
        "type": "agerange"
      },
      {
        "name": "birthday",
        "description": "The person's birthday. This is a fixed format string, like `MM/DD/YYYY`. However, people can control who can see the year they were born separately from the month and day so this string can be only the year (YYYY) or the month + day (MM/DD)",
        "type": "string"
      }
    ]
  }
}
```

## /me

El nodo `/me` es un punto de conexión especial que se traduce en el identificador del objeto de la persona o la página cuyo token de acceso se está usando actualmente para realizar las llamadas a la API. Si tuvieras un token de acceso de usuario, podrías recuperar el nombre y el identificador de un usuario a mediante el uso de:

```bash
curl -i -X GET "https://graph.facebook.com/me?access_token=ACCESS-TOKEN"
```

## Perímetros

Un perímetro es una conexión entre dos nodos. Por ejemplo, un nodo de Usuario puede tener fotos conectadas a él, y un nodo de Foto puede tener comentarios conectados a él. El siguiente ejemplo de cURL devolverá una lista de fotos que una persona publicó en Facebook.

```bash
curl -i -X GET "https://graph.facebook.com/USER-ID/photos?access_token=ACCESS-TOKEN"
```

Cada identificador devuelto representa un nodo Foto y cuándo se subió a Facebook.

```json
{
  "data": [
    {
      "created_time": "2017-06-06T18:04:10+0000",
      "id": "1353272134728652"
    },
    {
      "created_time": "2017-06-06T18:01:13+0000",
      "id": "1353269908062208"
    }
  ]
}
```

## Campos

Los campos son propiedades de nodos. Al consultar un nodo, o un perímetro, este devuelve un conjunto de campos de manera predeterminada, como muestran los ejemplos anteriores. Sin embargo, puedes especificar los campos que quieres que se devuelvan usando el parámetro `fields` y enumerando cada uno. Esto anula los campos predeterminados y devuelve solo los que especifiques, así como el identificador del objeto, que se devuelve siempre.

La siguiente solicitud cURL incluye el parámetro `fields` y el nombre, el correo electrónico y la foto de perfil del Usuario.

```bash
curl -i -X GET "https://graph.facebook.com/USER-ID?fields=id,name,email,picture&access_token=ACCESS-TOKEN"
```

### Datos devueltos

```json
{
  "id": "USER-ID",
  "name": "EXAMPLE NAME",
  "email": "EXAMPLE@EMAIL.COM",
  "picture": {
    "data": {
      "height": 50,
      "is_silhouette": false,
      "url": "URL-FOR-USER-PROFILE-PICTURE",
      "width": 50
    }
  }
}
```

### Parámetros complejos

La mayoría de los tipos de parámetros son directamente primitivos como `bool`, `string` y `int`, pero también hay tipos `list` y `object` que se pueden especificar en la solicitud.

El tipo `list` se especifica en sintaxis JSON, por ejemplo: `["firstitem", "seconditem", "thirditem"]`

El tipo `object` también se especifica en sintaxis JSON, por ejemplo: `{"firstkey": "firstvalue", "secondKey": 123}`

## Publicación, actualización y eliminación

Visita nuestra [Guía para compartir en Facebook](https://developers.facebook.com/docs/sharing) si quieres saber cómo publicar en el Facebook de un usuario o nuestra [Documentación sobre la API de Páginas](https://developers.facebook.com/docs/pages) para publicar en el feed de Facebook de una página.

En algunos nodos, se pueden actualizar los campos con operaciones `POST`. Por ejemplo, podrías actualizar tu campo `email` de la siguiente manera:

```bash
curl -i -X POST "https://graph.facebook.com/USER-ID?email=YOURNEW@EMAILADDRESS.COM&access_token=ACCESS-TOKEN"
```

### Lectura después de escritura

Para crear y actualizar puntos de conexión, la API Graph puede leer de inmediato un objeto correctamente publicado o actualizado y devolver los campos compatibles con el correspondiente punto de conexión de lectura.

De manera predeterminada, se devolverá un identificador del objeto que se creó o se actualizó. Para incluir más información en la respuesta, incluye el parámetro `fields` en tu solicitud y enumera los campos que quieres que se devuelvan. Por ejemplo, para publicar el mensaje "Hola" en la sección de noticias de una página, se puede hacer la siguiente solicitud:

```bash
curl -i -X POST "https://graph.facebook.com/PAGE-ID/feed?message=Hello&fields=created_time,from,id,message&access_token=ACCESS-TOKEN"
```

*Se modificó el formato del ejemplo anterior de código para facilitar su lectura.*

Esto devolvería los campos especificados como una respuesta con formato JSON de la siguiente manera:

```json
{
  "created_time": "2017-04-06T22:04:21+0000",
  "from": {
    "name": "My Facebook Page",
    "id": "PAGE-ID"
  },
  "id": "POST_ID",
  "message": "Hello"
}
```

Consulta la [documentación de referencia](https://developers.facebook.com/docs/graph-api/reference) de cada punto de conexión para comprobar que sea compatible con la **lectura después de escritura** y cuáles campos están disponibles.

#### Errores

Si la lectura falla por algún motivo (por ejemplo, al solicitar un campo inexistente), la API Graph dará una respuesta de error estándar. Consulta nuestra [Guía de manejo de errores](https://developers.facebook.com/docs/graph-api/guides/error-handling) para obtener más información.

Generalmente, se puede eliminar un nodo, como un nodo de Publicación o de Foto, mediante una operación “DELETE” en el identificador del objeto:

```bash
curl -i -X DELETE "https://graph.facebook.com/PHOTO-ID?access_token=ACCESSS-TOKEN"
```

Por lo general, solo puedes eliminar los nodos que creaste, pero consulta la guía de referencia de cada uno para conocer los requisitos de las operaciones de eliminación.

## Webhooks

Puedes recibir notificaciones de los cambios en los nodos o en las interacciones con los nodos. Para ello, debes suscribirte a los webhooks. Consulta [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks).

## Versiones

La API Graph tiene múltiples versiones con actualizaciones trimestrales. Se puede especificar la versión en las llamadas si se agrega "v" y el número de la versión al principio de la ruta de la solicitud. Por ejemplo, esta es una llamada a la versión 4.0:

```bash
curl -i -X GET "https://graph.facebook.com/v4.0/USER-ID/photos?access_token=ACCESS-TOKEN"
```

Es mejor que incluyas el número de la versión en las solicitudes, ya que, de lo contrario, usaremos de manera predeterminada la versión más antigua que esté disponible.

Puedes obtener más información sobre las versiones en nuestra [Guía de versiones](https://developers.facebook.com/docs/graph-api/guides/versioning) e informarte sobre todas las versiones disponibles en el [registro de cambios de la API Graph](https://developers.facebook.com/docs/graph-api/changelog).

## API, SDK y plataformas de Facebook

Conecta interfaces y desarrolla en diferentes plataformas usando [API, SDK y plataformas](https://developers.facebook.com/docs#apis-and-sdks) de Facebook.

## Próximos pasos

[**Primeros pasos con la API Graph**](https://developers.facebook.com/docs/graph-api/get-started): exploremos la gráfica social de Facebook usando la herramienta de exploración de la API Graph y ejecutemos algunas solicitudes para obtener datos.
```



## Page: https://developers.facebook.com/docs/graph-api/guides/debugging

```markdown
# Solicitudes de depuración

## Modo de depuración de la API Graph

Cuando el modo de depuración está habilitado, la respuesta de la API Graph puede contener campos adicionales que expliquen posibles errores en la solicitud.

Para habilitar el modo de depuración, usa el parámetro de cadena de consulta `debug`. Por ejemplo:

### Ejemplo de cURL

```sh
curl -i -X GET \
  "https://graph.facebook.com/{user-id}
    ?fields=friends
    &debug=all
    &access_token={your-access-token}"
```

### Ejemplo en Java

```java
GraphRequest request = GraphRequest.newMeRequest(
  accessToken,
  new GraphRequest.GraphJSONObjectCallback() {
    @Override
    public void onCompleted(JSONObject object, GraphResponse response) {
      // Insert your code here
    }
  });

Bundle parameters = new Bundle();
parameters.putString("fields", "friends");
parameters.putString("debug", "all");
request.setParameters(parameters);
request.executeAsync();
```

### Ejemplo en Objective-C

```objective-c
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
    initWithGraphPath:@"/{user-id}"
    parameters:@{
      @"fields": @"friends",
      @"debug": @"all"
    }
    HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    // Insert your code here
}];
```

### Ejemplo en JavaScript

```javascript
FB.api(
  '/{user-id}',
  'GET',
  {
    "fields": "friends",
    "debug": "all"
  },
  function(response) {
      // Insert your code here
  }
);
```

### Ejemplo en PHP

```php
try {
  // Returns a `FacebookFacebookResponse` object
  $response = $fb->get(
    '/{user-id}',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
```

Si no se otorga el permiso `user_friends`, se genera la siguiente respuesta:
```json
{
  "data": [],
  "__debug__": {
    "messages": [
      {
        "message": "Field friends is only accessible on User object, if user_friends permission is granted by the user",
        "type": "warning"
      },
      {
        "link": "https://developers.facebook.com/docs/apps/changelog#v2_0",
        "message": "Only friends who have installed the app are returned in versions greater or equal to v2.0.",
        "type": "info"
      }
    ]
  }
}
```

El valor del parámetro `debug` se puede fijar en "all" o en un mínimo nivel de gravedad solicitado que se corresponda con `type` del mensaje:

| Valor del parámetro de depuración | Resultado |
|-----------------------------------|-----------|
| all                               | Todos los mensajes de depuración disponibles. |
| info                              | Mensajes de depuración con los tipos *info* y *warning*. |
| warning                           | Solo los mensajes de depuración con el tipo *warning*. |

La información de depuración, cuando está disponible, se devuelve como un objeto JSON con la clave `__debug__` en la matriz `messages`. Cada elemento de esta matriz es un objeto JSON que contiene los siguientes campos:

| Campo    | Tipo de datos | Descripción |
|----------|---------------|-------------|
| message  | Cadena        | El mensaje. |
| type     | Cadena        | La gravedad del mensaje. |
| link     | Cadena        | [Opcional] Una URL que apunta a información relacionada. |

También puedes usar el modo de depuración con el [explorador de la API Graph](https://developers.facebook.com/tools/explorer):

## Determinar la versión usada por solicitudes de API

Cuando compilas una app y creas solicitudes de la API Graph, es posible que te resulte útil determinar la versión de API de la que recibes una respuesta. Por ejemplo, si haces llamadas sin una versión especificada, es posible que la versión de API que responde no te resulte conocida.

La API Graph proporciona un encabezado de solicitud con cualquier respuesta llamada `facebook-api-version` que indique la versión exacta de la API que generó la respuesta. Por ejemplo, una llamada a la API Graph que genera una solicitud con la versión 2.0 produce el siguiente encabezado HTTP:
```
facebook-api-version: v2.0
```

Este encabezado `facebook-api-version` te permite determinar si las llamadas a la API se devuelven desde la versión que esperas.

## Información de depuración para reportar errores

Cuando se [reporta un error](https://developers.facebook.com/bugs/) en la API Graph, incluimos encabezados adicionales para enviarlos con tu informe de errores a fin de que nos ayudes a identificar y reproducir tu error. Estos encabezados de solicitudes son `X-FB-Debug`, `x-fb-rev` y `X-FB-Trace-ID`.
```



## Page: https://developers.facebook.com/docs/graph-api/batch-requests

```markdown
# Solicitudes por lotes

Envía una solicitud HTTP que contenga varias llamadas a la API Graph de Facebook. Las operaciones independientes se procesan en paralelo mientras tus operaciones dependientes se procesan consecutivamente. Una vez que todas las operaciones están completas, se te devuelve una respuesta consolidada y se cierra la conexión HTTP.

El orden de las respuestas se corresponde con el orden de las operaciones en la solicitud. Por ese motivo, deberías procesar las respuestas para determinar qué operaciones resultaron satisfactorias y cuáles deberían intentarse en las operaciones posteriores.

### Limitaciones

- Las solicitudes por lotes se limitan a 50 solicitudes por lote. Cada llamada dentro del lote se cuenta por separado con el fin de calcular los límites de recursos y de llamadas a la API. Por ejemplo, un lote de diez llamadas a la API contará como diez llamadas y cada llamada dentro del lote contribuirá a los límites de recursos de CPU de la misma manera. Consulta nuestra [Guía de limitación de frecuencia](https://developers.facebook.com/docs/graph-api/overview/rate-limiting) para obtener más información.
- Las solicitudes por lote no pueden incluir varios [conjuntos de anuncios](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign) en la misma [campaña](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group). Obtén más información sobre el [procesamiento por lotes de las solicitudes de la API de marketing](https://developers.facebook.com/docs/marketing-api/asyncrequests).

## Solicitudes por lotes

Una solicitud por lotes presenta un objeto JSON que consiste en una matriz de tus solicitudes. Devuelve una matriz de respuestas HTTP lógicas representadas como matrices JSON. Cada respuesta tiene un código de estado, una matriz de encabezados opcional y un cuerpo opcional (que es una cadena con codificación JSON).

Para realizar una solicitud por lotes, envía una solicitud `POST` a un punto de conexión en el que el parámetro `batch` sea tu objeto JSON.

```
POST /ENDPOINT?batch=[JSON-OBJECT]
```

**Ejemplo de solicitud por lotes**

En este ejemplo, obtenemos información de dos páginas que nuestra app administra.

*El formato se modificó para facilitar la lectura.*

```
curl -i -X POST 'https://graph.facebook.com/me?batch=  
  [
    {
      "method":"GET",
      "relative_url":"PAGE-A-ID"
    },  
    {
      "method":"GET",
      "relative_url":"PAGE-B-ID"
    }
  ]
  &include_headers=false             // Included to remove header information
  &access_token=ACCESS-TOKEN'
```

Una vez que todas las operaciones estén completas, se envía una respuesta con el resultado de cada operación. Dado que los encabezados devueltos a veces pueden ser más grandes que la respuesta de la API real, tal vez prefieras eliminarlos a fin de mejorar la eficacia. Para incluir información de encabezado, elimina el parámetro `include_headers` o configúralo como `true`.

**Ejemplo de respuesta**

El campo del cuerpo contiene un objeto JSON de cadena codificada:

```
[
  {
    "code": 200,
    "body": "{
      \"name\": \"Page A Name\",
      \"id\": \"PAGE-A-ID\"
    }"
  },
  {
    "code": 200,
    "body": "{
      \"name\": \"Page B Name\",
      \"id\": \"PAGE-B-ID\"
    }"
  }
]
```

## Solicitudes por lotes complejas

Es posible combinar operaciones que normalmente utilizarían distintos métodos HTTP en una sola solicitud por lotes. Mientras que las operaciones `GET` y `DELETE` solo pueden tener una dirección `relative_url` y un campo `method`, las operaciones `POST` y `PUT` pueden tener un campo `body` opcional. El cuerpo debe tener el formato de una cadena POST HTTP sin procesar, similar a una cadena de consulta URL.

**Ejemplo de solicitud**

En el siguiente ejemplo, se muestra una publicación en una página que administramos y en la que tenemos permisos de publicación, y después las noticias de la página en una sola operación:

```
curl "https://graph.facebook.com/PAGE-ID?batch=
  [
    { 
      "method":"POST",
      "relative_url":"PAGE-ID/feed",
      "body":"message=Test status update"
    },
    { 
      "method":"GET",
      "relative_url":"PAGE-ID/feed"
    }
  ]
  &access_token=ACCESS-TOKEN"
```

El resultado de esta llamada es:

```
[
  {
    "code": 200,
    "headers": [
      {
        "name": "Content-Type",
        "value": "text/javascript; charset=UTF-8"
      }
    ],
    "body": "{\"id\":\"…\"}"
  },
  {
    "code": 200,
    "headers": [
      {
        "name": "Content-Type",
        "value": "text/javascript; charset=UTF-8"
      },
      {
        "name": "ETag",
        "value": "…"
      }
    ],
    "body": "{\"data\": [{…}]}"
  }
]
```

En el siguiente ejemplo, se crea un nuevo anuncio para una campaña y después se obtienen detalles del objeto recién creado. Ten en cuenta la operación **URLEncoding** para el parámetro del cuerpo:

```
curl \
-F 'access_token=...' \
-F 'batch=[
  {
    "method":"POST",
    "name":"create-ad",
    "relative_url":"11077200629332/ads",
    "body":"ads=%5B%7B%22name%22%3A%22test_ad%22%2C%22billing_entity_id%22%3A111200774273%7D%5D"
  }, 
  {
    "method":"GET",
    "relative_url":"?ids={result=create-ad:$.data.*.id}"
  }
]' \
https://graph.facebook.com/v12.0
```

En el siguiente ejemplo, se agregan varias páginas a un administrador comercial:

```
curl \
-F 'access_token=<ACCESS_TOKEN>' \
-F 'batch=[
  {
    "method":"POST",
    "name":"test1",
    "relative_url":"<BUSINESS_ID>/owned_pages",
    "body":"page_id=<PAGE_ID_1>"
  }, 
  {
    "method":"POST",
    "name":"test2",
    "relative_url":"<BUSINESS_ID>/owned_pages",
    "body":"page_id=<PAGE_ID_2>"
  }, 
  {
    "method":"POST",
    "name":"test3",
    "relative_url":"<BUSINESS_ID>/owned_pages",
    "body":"page_id=<PAGE_ID_3>"
  }
]' \
https://graph.facebook.com/v12.0
```

Dónde:

- `<ACCESS_TOKEN>` es un token de acceso con el permiso `business_management`.
- `<BUSINESS_ID>` es el identificador del administrador comercial al cual deben solicitarse las páginas.
- `<PAGE_ID_n>` son los identificadores de la página que se debe solicitar.

## Errores

Es posible que una de tus operaciones solicitadas genere un error. Esto podría deberse a que, por ejemplo, no tienes permiso para realizar la operación solicitada. La respuesta es similar a la API Graph estándar, pero encapsulada en la sintaxis de respuesta por lotes:

```
[
  {
    "code": 403,
    "headers": [
      {
        "name": "WWW-Authenticate",
        "value": "OAuth…"
      },
      {
        "name": "Content-Type",
        "value": "text/javascript; charset=UTF-8"
      }
    ],
    "body": "{\"error\":{\"type\":\"OAuthException\", … }}"
  }
]
```

Las restantes solicitudes del lote deberían seguir correctamente de todas formas y se devolverán, como siempre, con un código de estado `200`.

## Tiempos de espera

El tiempo de espera de los lotes grandes o complejos se puede agotar si todas las solicitudes dentro del lote tardan mucho en completarse. En tal circunstancia, el resultado es un lote parcialmente completado. En un lote parcialmente completado, las solicitudes que se completan de forma satisfactoria devolverán el resultado normal con el código de estado `200`. Las respuestas a las solicitudes que no sean satisfactorias serán `null`. Puedes volver a intentar realizar cualquier solicitud que no haya sido satisfactoria.

## Llamadas por lotes con JSONP

La API por lotes admite JSONP, al igual que el resto de la API Graph (la función de devolución de llamada de JSONP se especifica con el parámetro de publicación de formulario o cadena de consulta `callback`).

## Uso de varios tokens de acceso

Las solicitudes individuales de una misma solicitud por lotes pueden especificar sus propios tokens de acceso como cadena de consulta o formar parámetros de publicación. En ese caso, el token de acceso de nivel superior se considera un token de reserva y se utiliza si una solicitud individual no especificó explícitamente un token de acceso.

Esto puede resultar útil cuando quieres consultar la API con distintos tokens de acceso de usuario o tokens de acceso a la página, o si es necesario realizar algunas de las llamadas con un token de acceso de app.

Debes incluir un token de acceso como parámetro de nivel superior, aun cuando todas las solicitudes individuales contengan sus propios tokens.

## Subir datos binarios

Puedes subir varios elementos binarios como parte de una llamada por lotes. Para ello, necesitas agregar todos los elementos binarios como archivos adjuntos MIME o de varias partes a tu solicitud y necesitas que cada operación haga referencia a sus elementos binarios con la propiedad `attached_files` en la operación. La propiedad `attached_files` admite una lista separada por comas de nombres de archivos adjuntos en su valor.

En el siguiente ejemplo, se muestra cómo subir dos fotos en una sola llamada por lotes:

```
curl \
-F 'access_token=…' \
-F 'batch=[{"method":"POST","relative_url":"me/photos","body":"message=My cat photo","attached_files":"file1"},{"method":"POST","relative_url":"me/photos","body":"message=My dog photo","attached_files":"file2"}]' \
-F 'file1=@cat.gif' \
-F 'file2=@dog.jpg' \
https://graph.facebook.com
``` 

[Like this page](https://developers.facebook.com/docs/graph-api/batch-requests/)
```