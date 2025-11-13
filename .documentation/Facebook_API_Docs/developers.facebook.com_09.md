# API Documentation

**Source URL:** https://developers.facebook.com/docs/facebook-login/login-connect/
**Scraped Date:** 2025-11-12 15:01:49

---



## Page: https://developers.facebook.com/docs/facebook-login/login-connect/

```markdown
# Conectar inicio de sesión con Messenger

Mediante Conectar inicio de sesión con Messenger, los usuarios pueden activar ahora la comunicación con tu empresa a través de la plataforma de Messenger directamente desde el proceso de inicio de sesión con Facebook en la app para celulares o el sitio web. De esta manera, puedes profundizar la interacción con el usuario y proporcionar una atención al cliente más sólida y eficiente, ya que permite que te comuniques con más clientes por el canal de tu preferencia. La plataforma de Messenger permite que tu página automatice la experiencia con los mensajes. Así, puedes reducir el tiempo que invierte tu equipo en responder solicitudes básicas y brindar un servicio de atención al cliente de primera calidad. Para obtener más información sobre la plataforma de Messenger, consulta la [documentación sobre la plataforma de Messenger](/docs/messenger-platform).

## Cómo funciona

Cuando un usuario llega al sitio de terceros o a un app para celulares e inicia sesión con Facebook después de seguir el proceso de inicio de sesión estándar, verá una pantalla que le solicitará que autorice a la empresa a contactarlo a través de Messenger para poder brindarle ofertas, asistencia, etc.

Si el usuario acepta recibir comunicaciones de la empresa en Messenger, dicha empresa cuenta con 24 horas desde que el usuario indicó su aceptación para enviar el mensaje inicial al usuario a través de la plataforma de Messenger. Es necesario que esta experiencia de mensajería, incluso los mensajes de seguimiento de la empresa, cumpla con nuestras [Políticas para desarrolladores](https://developers.facebook.com/devpolicy), que abarca nuestra [documentación para desarrolladores sobre la plataforma de Messenger](/docs/messenger-platform/introduction), y debe revisarse de acuerdo con la revisión de apps que se menciona más adelante antes de poder publicarse.

## Antes de empezar

La experiencia con Conectar inicio de sesión con Messenger requiere que se [someta a revisión de apps](https://developers.facebook.com/docs/app-review/submission-guide) solicitando el permiso [`user_messenger_contact`](https://developers.facebook.com/docs/permissions/reference/user_messenger_contact) y [`pages_messaging`](https://developers.facebook.com/docs/permissions/reference/pages_messaging) si la app de mensajería no contara ya con dichos permisos. Antes de enviar la experiencia de la app a la revisión de apps, es necesario contar con lo siguiente:

- [Verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification).
- Una app del [tipo](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types/) consumidor o comercial con el inicio de sesión con Facebook configurado que solicite acceso al permiso [`user_messenger_contact`](https://developers.facebook.com/docs/permissions/reference/user_messenger_contact) a través de la [revisión de apps](https://developers.facebook.com/docs/app-review).
- Una página de Facebook pública que representa el sitio web o la entidad que utiliza el inicio de sesión con Facebook para que le solicite al usuario que acepte recibir mensajes.
- Asegurarse de que la página haya otorgado el permiso `pages_messaging` a una app y que esta app tenga configurado el producto Messenger. Puede ser la misma app con el inicio de sesión con Facebook o una app distinta. Si se utiliza la misma app para el inicio de sesión y los mensajes, y dicha app no cuenta ya con el permiso `pages_messaging`, puedes solicitar "pages_messaging" en la misma revisión.
- Verificar que la app cumpla con los requisitos de la revisión de apps y los que se establecen a continuación.

Para probar la revisión de apps, la experiencia de Conectar inicio de sesión con Messenger debe enviar un mensaje al usuario dentro de los 30 segundos desde que el usuario aceptó recibir mensajes, a fin de que podamos probar a tiempo la integración. Si se aprueba la experiencia de Conectar inicio de sesión con Messenger y se transmite en vivo, bastará con que envíes un mensaje al usuario dentro de las 24 horas desde el momento en el que el usuario aceptó que la empresa lo contacte en Messenger, tal y como se describe en "Requisitos para usar Conectar inicio de sesión con Messenger".

Cuando envíes la app a [revisión de apps](https://developers.facebook.com/docs/app-review), proporciona una descripción detallada de las secciones, para lo que debes ser tan específico como sea posible. Puedes consultar alguna [guía para el envío de solicitudes](https://developers.facebook.com/docs/app-review/submission-guide) de revisión de apps y un [ejemplo de envío de solicitud](https://developers.facebook.com/docs/app-review/resources/sample-submissions/messenger-platform) de un permiso `pages_messaging`. Antes de enviar tu solicitud de [revisión de apps](https://developers.facebook.com/docs/app-review), tómate un momento para repasar algunos de los [errores más comunes](https://developers.facebook.com/docs/app-review/submission-guide/common-mistakes) que pueden ocasionar que se solicite información adicional o se rechace la solicitud.

## Requisitos para usar Conectar inicio de sesión con Messenger

Antes de enviar la experiencia de Conectar inicio de sesión con Messenger a la revisión de apps, o bien si la experiencia ya está publicada, debe cumplir con lo siguiente:

- La integración del inicio de sesión con Facebook de tu sitio web debe funcionar correctamente.
- Después de que el usuario inicia sesión en tu sitio web mediante el inicio de sesión con Facebook, debe existir una solicitud clara para que usuario acepte que tu empresa lo contacte a través de Messenger.
- Debes enviar un mensaje al usuario dentro las 24 horas a partir del momento en que este acepta que tu empresa lo contacte en Messenger. No puedes usar etiquetas de mensajes para enviar el mensaje inicial al usuario.
- La experiencia de mensajería debe cumplir con todas las [políticas para desarrolladores](https://developers.facebook.com/devpolicy) y con la [documentación técnica para desarrolladores](https://developers.facebook.com/docs/messenger-platform) referida a la plataforma de Messenger (incluso los [requisitos mencionados en esta página](https://developers.facebook.com/docs/messenger-platform/app-review)), lo que incluye las restricciones que se aplican al momento en que puedes enviarles mensajes a los usuarios pasadas las 24 horas desde el último contacto iniciado por el cliente.
- Debes dar rápida respuesta a todas las solicitudes (dentro y fuera de Messenger) que realicen las personas para bloquear, discontinuar o cancelar de alguna otra forma la función de mensajería.
- Eres responsable de garantizar que el uso que haces de Conectar inicio de sesión con Messenger cumple con las leyes aplicables, incluso las referidas a la privacidad de los usuarios y su información.

## Primeros pasos

Explora Conectar inicio de sesión con Messenger con este ejemplo de prueba.

### Consulta el ejemplo de implementación para Conectar inicio de sesión con Messenger

![Ejemplo de implementación](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/22879576_1762036650768869_8159633346305982464_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=mrDh9IqyHkQQ7kNvwFORnXu&_nc_oc=Adk2aHrR6oJSYckq3QvbKrgfCGq29CAPzv4f14mg4AqbQz6S0TX6sQIyVugegoBybKYETkOZJ99T0XrGZEvnbSBs&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=tyO9tOZJwQYRFkimjskF0w&oh=00_AfiCwAemIT-sn4NWe0EsIAALRUtqDbj2XK5-sodchs-LWg&oe=692F2683)

Los primeros pasos con Conectar inicio de sesión con Messenger son simples. En apenas 30 minutos, puedes implementar una experiencia completamente funcional. Al finalizar, la integración podrá permitir que los usuarios de prueba acepten mediante la experiencia de Conectar inicio de sesión con Facebook que la empresa los contacte a través de Messenger. Después de haber aceptado, recibirás un mensaje automático de la página.

[Probar ahora](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffbsamples%2Ffblogin-sample&h=AT3QIkJ0DM2QislOpwWsLxH2QDDW9aJtvlJcyiXbci9LAnYViYyR696ffTtZbCvIviI1mB9EE2X1nrwS2004GprTr6WwDuR3X8Fk3YM8T3ZQIXdD1aJc8FBWJt8W6USUdQ0dVfH4fPeY3rA7WdoIKk559j2Mny8HyK-azkyfPwo)

Si quieres obtener instrucciones detalladas y ejemplos de código para implementar Conectar inicio de sesión, consulta [Implementar Conectar inicio de sesión con Messenger](/docs/facebook-login/login-connect/implementing).

También puedes ver [las presentaciones técnicas sobre cómo configurar la conexión de inicio de sesión con Messenger](https://developers.facebook.com/videos/2021/login-connect-with-messenger-technical-deep-dive/).

## Más información

- [Implementar Conectar inicio de sesión con Messenger](/docs/facebook-login/login-connect/implementing)
- [Preguntas frecuentes de Conectar inicio de sesión](/docs/facebook-login/login-connect/faq)
- [Inicio de sesión con Facebook](/docs/facebook-login)
- [Primeros pasos en Messenger](/docs/messenger-platform/getting-started)
```



## Page: https://developers.facebook.com/docs/messenger-platform

```markdown
# Plataforma de Messenger

Con la plataforma de Messenger, puedes crear soluciones de mensajes que te permitan conectarte con tus clientes, clientes potenciales y seguidores.

## Soluciones de mensajes

En esta sección, se ofrece un breve resumen de las soluciones disponibles y se muestra cómo funciona cada una.

El 23 de julio de 2024 lanzamos la nueva API de Instagram con el inicio de sesión de Instagram. Una cuenta profesional de Instagram (cuenta de negocios o creador) ya no necesitará estar vinculada a una página de Facebook para tener conversaciones con clientes, seguidores o usuarios de Instagram interesados en tu negocio o cuenta de Instagram, administrar comentarios o publicar medios. Obtén más información sobre la nueva versión en nuestra [publicación de blog](https://developers.facebook.com/blog/).

[Ve nuestra API de Instagram con inicio de sesión de Instagram para obtener más información](https://developers.facebook.com/docs/instagram/platform/instagram-api).

### Messenger para empresas

Conversaciones entre tu página comercial de Facebook y los usuarios de Facebook.

#### Cómo funciona

La plataforma de Messenger permite a tu app enviar y recibir mensajes entre tu página comercial de Facebook y tus clientes, clientes potenciales y seguidores. Estas conversaciones son compatibles con la infraestructura de Messenger from Meta y aparecen como conversaciones de Messenger. Las conversaciones se pueden iniciar a través de la página de Facebook de tu empresa, las publicaciones en Facebook de tu página, entre otras opciones.

### Mensajes de Instagram

Conversaciones entre tu cuenta profesional de Instagram y los usuarios de Instagram.

#### Cómo funciona

La plataforma de Messenger permite a tu app enviar y recibir mensajes entre tu cuenta profesional de Instagram y tus clientes, clientes potenciales y seguidores. Estas conversaciones son compatibles con la infraestructura de Messenger from Meta y la página de Facebook vinculada con tu cuenta profesional de Instagram, y aparecen como conversaciones de Instagram. Las conversaciones se pueden iniciar a través del feed de Instagram, tus publicaciones de Instagram y menciones en historias, entre otras opciones.

## Próximos pasos

### [Información general de la plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform/overview)

Independientemente de la solución que quieras implementar, antes de comenzar, debes aprender los conceptos de la plataforma de Messenger e implementar varios componentes.

## Funciones de la plataforma

Herramientas increíbles para crear experiencias asombrosas

| Función | Descripción |
|---------|-------------|
| [Mensajes](https://developers.facebook.com/docs/messenger-platform/send-messages/) | Envía y recibe texto, contenido multimedia, plantillas estructuradas y mucho más |
| [Vista web](https://developers.facebook.com/docs/messenger-platform/webview) | Crea experiencias basadas en web con las herramientas para desarrolladores y los marcos que te gustan |
| [Descubrimiento](https://developers.facebook.com/docs/messenger-platform/discovery) | Llega nuevas personas y vuelve a interactuar con aquellas que ya conoces en Messenger, Facebook y la web |
| [Identificadores y perfil](https://developers.facebook.com/docs/messenger-platform/identity/) | Personaliza las conversaciones y los enlaces con autenticación preexistente y crea experiencias unificadas |
| [NLP](https://developers.facebook.com/docs/messenger-platform/built-in-nlp) | Usa un tono de conversación natural y auténtico y crea contexto con el procesamiento de lenguajes naturales integrado |
| [Estadísticas](https://developers.facebook.com/docs/messenger-platform/analytics) | Obtén estadísticas, supervisa el rendimiento y haz seguimiento del éxito |
```



## Page: https://developers.facebook.com/docs/app-review

# App Review

App Review is an important part of the [app development](https://developers.facebook.com/docs/apps) process. It enables Meta to verify that your app uses our products and APIs in an approved manner.

If your app will be used by anyone without a [Role on the app](https://developers.facebook.com/docs/development/build-and-test/app-roles/) or a [role in a Business](https://www.facebook.com/business/help/442345745885606?id=180505742745347) that has claimed the app, it must first undergo App Review. If your app will only be used by app users who have a role on the app itself, App Review is not required.

Permissions that have been approved through App Review can be requested from any app user, but unapproved permissions can only be requested from app users who have a [role](https://developers.facebook.com/docs/development/build-and-test/app-roles) on the requesting app. Similarly, approved features are active for all app users, but unapproved features are only active for users with a role on the app.

As part of the review process we will test your app to verify that it actually uses the permissions and features you are requesting. If we are unable to access your app to test it, your entire submission will be rejected. If we are able to test your app but cannot test functionality that requires a specific permission or feature that you are requesting, you will not be approved for that permission or feature.

The following video provides a brief overview of the App Review process:

<video height="360" width="640" controls>
    <source src="video-url.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

## Documentation Contents

### [Content](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/content)

An in-depth explanation of the App Review process.

### [Best Practices](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/before-you-submit)

Guidelines to help you create a successful App Review submission.

### [App Review Tutorial](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/submission-guide)

Tips to help improve the quality of your App Review submission.

### [App Review FAQs](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/faqs)

Help in case your submission contains rejections.

## See Also

These are processes separate from App Review that you may need to complete depending on the nature of your app.

- [Business Verification](https://developers.facebook.com/docs/apps/business-verification)



## Page: https://developers.facebook.com/docs/permissions/reference/user_messenger_contact

```markdown
# Permissions Reference for Meta Technologies APIs

Permissions are a form of granular, app user-granted Graph API authorization. Before your app can use an API endpoint to access your app user's data, your app user must grant your app all permissions required by that endpoint.

**Only select permissions that your app needs to function as intended. Selecting unneeded permissions is a common reason for rejection during app review.**

You may also use any permission granted to your app to request analytics insights to improve your app and for marketing or advertising purposes, through the use of aggregated and de-identified or anonymized information (provided such data cannot be re-identified).

### Requirements

- [Meta App Review](https://developers.facebook.com/docs/app-review) – For apps that need access to data that you do not own or manage
- [Business Verification](https://developers.facebook.com/docs/development/release/business-verification) – is required for all apps making requests for [Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access)
- If your app requests permission to use an endpoint to access an app user’s data, you may need to complete [data handling questions](https://developers.facebook.com/docs/development/release/data-handling-questions/questions-preview).
- You may also be required to complete an annual [Data Use Checkup](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup).

### Ways to ask for a permission

When your app users log onto your app, they receive a request to grant the permissions your app has requested. Your app users can grant or deny the requested permissions or any subset of them.

- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business)
- [Instagram API with Facebook Login for Business](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login)
- [Instagram API with Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Meta Business Manager](https://developers.facebook.com/docs/business-manager-api)

If your app does not use a permission for 90 days, usually due to user inactivity, your app user must regrant your app that permission.

### Remove a permission

You can use the [Meta App Dashboard](https://developers.facebook.com/apps) to remove a permission your app no longer uses or to remove a permission that has been deprecated.

## A

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `ads_management` | El permiso **ads_management** permite que tu app lea y administre las cuentas publicitarias que le pertenecen o a las que el propietario le concedió acceso. El uso permitido de este permiso es crear campañas, administrar anuncios u obtener métricas de anuncios mediante programación para ayudar a sus negocios. También se puede usar para desarrollar herramientas de administración de anuncios que ofrezcan soluciones innovadoras y un valor agregado para los anunciantes. <ul><li>Crea campañas, administra anuncios y obtén métricas mediante programación.</li><li>Desarrolla herramientas de administración de anuncios que ofrezcan soluciones innovadoras y un valor agregado para los anunciantes.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere administrar anuncios en nombre de otras empresas. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div></td>
| `ads_read` | El permiso **ads_read** permite que tu app acceda a la [API de estadísticas de anuncios](https://developers.facebook.com/docs/marketing-api/read-access-onboarding) para obtener informes de anuncios de cuentas publicitarias que te pertenecen o a las que los propietarios de otras cuentas publicitarias te concedieron acceso. También permite que acceda a la [API del servidor](https://developers.facebook.com/docs/marketing-api/facebook-pixel/server-side-api) para que los anunciantes puedan enviar eventos web directamente desde sus servidores a Facebook. <ul><li>Proporciona a la API acceso a los datos de rendimiento de tus anuncios para utilizarlos en paneles y análisis personalizados.</li><li>Envía eventos web directamente desde tu servidor a Facebook.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere acceder a anuncios y estadísticas relacionadas en nombre de otras empresas. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div></td>
| `attribution_read` | El permiso **attribution_read** permite que tu app acceda a la API de atribución para obtener datos de informes de atribución de las líneas de negocio que te pertenecen o a las que los propietarios de otras líneas de negocio te concedieron acceso. <ul><li>Permite que tu app acceda a los datos de rendimiento de los anuncios de la atribución para utilizarlos en paneles y análisis personalizados.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div></td>

## B

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `business_management` | El permiso **business_management** permite que tu app lea y escriba con la API del administrador comercial. The allowed usage for this permission is to manage business assets such as an ad account and to claim ad accounts. <ul><li>Administra activos comerciales, como una cuenta publicitaria.</li><li>Reclama cuentas publicitarias.</li></ul> | <div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><span><p>Provide specific examples of why your app requires managing business assets on behalf of other businesses. If the permission is requested as a dependency of another main permission, including `pages_messaging` or `pages_show_list`, please specify the main permission in the use case description.</p></span><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div></td>

## C

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `catalog_management` | El permiso **catalog_management** permite que tu app cree, lea, actualice y elimine catálogos de productos del negocio en los que el usuario sea el administrador. The allowed usage for this permission is to build commerce-related solutions for ecommerce platforms, travel platforms and dynamic ads. It can also be used to build inventory type management solutions like product inventory, hotel inventory or car inventory. <ul><li>Desarrolla soluciones comerciales, como plataformas de comercio electrónico y de viajes, y anuncios dinámicos.</li><li>Desarrolla soluciones de administración de inventarios, como inventarios de productos, hoteles o automóviles.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere administrar los catálogos de productos de empresas que te conceden acceso. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo el usuario de la app crea, actualiza y elimina un catálogo de productos en la plataforma de tu app.</li></ol></span></div></td>
```



## Page: https://developers.facebook.com/docs/app-review/submission-guide

```markdown
# Tutorial de revisión de apps

## Aspectos importantes que debes saber

Realizaremos una verificación de tu app, por lo que debes asegurarte de que podamos acceder a ella. Haremos un seguimiento de las grabaciones de pantalla cuando evaluemos la app. Es necesario que esas grabaciones muestren las acciones que requieren los permisos y las funciones que solicitas. No se aprobará ningún permiso ni ninguna función que no se muestre en la grabación de pantalla.

## Antes de empezar

Antes de que comiences con el proceso de solicitud de revisión de apps, asegúrate de seguir los pasos que se indican a continuación. De esta manera, mejorará la calidad de la solicitud y se reducirán las posibilidades de que se la rechace.

### Aspectos generales

- Asegúrate de haber completado el desarrollo de la app y de que esté lista para que realicemos la prueba. Puede ser necesaria una [segunda revisión](https://developers.facebook.com/docs/app-review/after-you-submit#re-review) si hiciste cambios en la configuración [básica](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings) o [avanzada](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/advanced-settings) de la app después de haber enviado la solicitud.
- Asegúrate de que podamos acceder a la app o al sitio web. Es necesario que la app sea de acceso público o que nos indiques cómo acceder a ella.
- Sube una imagen de 1.024 x 1.024 del [ícono de la app](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings#app-icon) que cumpla con los requisitos a **Configuración** > **Básica** > **Ícono de la app**.
- Realiza al menos una llamada a la API sin errores por cada permiso al cual solicites acceso avanzado. Deberás hacer las llamadas no más de 30 días después de enviar la app para su revisión. Puedes hacerlas a través de tu app o mediante el [explorador de la API Graph](https://developers.facebook.com/tools/explorer/).
- Consulta nuestras [Condiciones de la plataforma](https://developers.facebook.com/terms) y [Políticas para desarrolladores](https://developers.facebook.com/devpolicy) para asegurarte de que tu app cumpla con nuestras condiciones y políticas.
- Lee la sección **Uso permitido** en la referencia de los permisos y las funciones que incluirás en tu solicitud. Si la app no cumple con el uso permitido de un permiso o de una función, no se aprobará ni el permiso ni la función de dicha app.

## Grabaciones de pantallas

Para asegurarte de que tu captura de video esté disponible para todos nuestros revisores, sigue estos pasos:

- **Selecciona inglés como el idioma de la UI de la app**: si es posible, configura el idioma de la UI de la app en inglés antes de grabar la captura de video. De esta manera, será más fácil para el equipo de revisión entender el contenido de tu app.
- **Proporciona subtítulos y consejos de herramientas**: si tu app no está disponible en inglés, o si alguna parte no es fácil de entender, proporciona subtítulos y consejos de herramientas para explicar lo que está pasando en la pantalla. Esto ayudará al equipo de revisión a entender lo que estás mostrando y cómo funciona la app.
- **Explica el significado de los botones y otros elementos de la UI**: tómate el tiempo para explicar el significado de los botones u otros elementos de la UI que no resulten obvios. De esta manera, el equipo de revisión podrá entender cómo usar la app y lo que hace cada botón.

Lee nuestra guía de [grabaciones de pantalla](https://developers.facebook.com/docs/app-review/submission-guide/screen-recordings). Asegúrate de grabar en una resolución alta, p. ej., de 1.080 o más, y de que las grabaciones de pantalla muestren cómo un usuario otorga a tu app cada [permiso](https://developers.facebook.com/docs/permissions/reference) necesario y cómo la app usa cada uno de esos permisos y [funciones](https://developers.facebook.com/docs/apps/features-reference) que vas a solicitar.

Asegúrate de que el nombre y el ícono de la app cumplan nuestros requisitos de [logotipos y marcas comerciales](https://developers.facebook.com/docs/app-review/resources/logos).

Consulta nuestras [preguntas frecuentes](https://developers.facebook.com/docs/app-review/support/faqs) relacionadas con las infracciones de las políticas y con el proceso de revisión de apps.

Consulta nuestra guía [Errores comunes](https://developers.facebook.com/docs/app-review/submission-guide/common-mistakes) para evitar cometer los errores comunes que encontramos la primera vez que se envían las solicitudes.

Si tienes acceso a un software exclusivo de grabación de pantalla, como Camtasia o Snagit, te recomendamos que lo uses. La mayoría de los software que se utilizan para grabación de pantalla proporcionan versiones de prueba gratuita y herramientas para que puedas perfeccionar la grabación.

Si no tienes acceso a un software exclusivo de grabación de pantalla, puedes usar alternativas gratuitas, como Quicktime u OBS. Estas apps no ofrecen ninguna forma de hacer anotaciones o editar el video, pero puedes agregar el video que grabaste a un editor de video gratuito, como iMovie, y efectuar esas acciones desde allí.

Graba solo lo que necesitamos ver. Abre tu app en pantalla completa o graba solo la ventana.

Reduce la resolución del monitor a un ancho de 1.440 o menos.

Cuando sea posible, usa el mouse, en lugar del teclado, para interactuar con tu app. ¡Si no podemos ver lo que haces, no podemos verificarlo!

Aumenta el tamaño del cursor del mouse. La mayoría de los software exclusivos de grabación de pantalla te permitirán hacerlo, incluso luego de realizar la grabación. Como alternativa, puedes aumentar el tamaño del cursor en la configuración de tu computadora.

Omite el audio; nuestros revisores no lo escucharán.

Usaremos las grabaciones como guía cuando evaluemos la app para verificar si realmente hace uso de los permisos y las funciones que solicitas. Las grabaciones no tienen que explicar por qué tu app las necesita. Esa información se incluye en el formulario de solicitud de revisión de apps.

## Enviar a revisión

Usa esta guía para ayudarte a crear una solicitud de revisión de apps **una vez que hayas completado todo el desarrollo de la app** y debas solicitar la aprobación de [permisos](https://developers.facebook.com/docs/permissions/reference) y [funciones](https://developers.facebook.com/docs/apps/features-reference) específicos. Luego de recibir los resultados de la revisión de apps, todos los usuarios podrán concederle a la app los permisos que se aprobaron.

![Video de revisión](https://static.xx.fbcdn.net/rsrc.php/v4/y4/r/-PAXP-deijE.gif)

Encuentra más recursos de video de [Data Protocol](https://l.facebook.com/l.php?u=https%3A%2F%2Fapp.dataprotocol.com%2Fchannels%2Fmeta&h=AT2HNkUrQ2PqmW9UDDWa6GJi1A1f2CoBxEqeC556aFOONmuy1GpimDBbyuCbFWB4D8z_VQANKtBhRe-2UT9a69QGhrlvADWX7AkDaMK7si9YbmYz2Gq3MzC8oN_9QM-wXfrcvXTj-Ui9defJ_Litw2OL57iih_OWsm4JDr76hdU).

### Paso 1: Seleccionar los permisos y las funciones

Haz clic en la pestaña **Revisión de apps** > **Permisos y funciones**.

![Seleccionar permisos](https://lookaside.fbsbx.com/elementpath/media/?media_id=398710626123457&version=1757259817)

Para solicitar cada permiso y función que tu app necesite, búscalos de forma individual y haz clic en el botón **Solicitar acceso avanzado** para agregarlos a la solicitud. **Solo debes solicitar los permisos y las funciones que tu app necesita**.

Ten en cuenta que el botón **Solicitar acceso avanzado** permanecerá en gris hasta que nuestro sistema registre una llamada a la API sin errores. Debe realizarse una llamada sin errores dentro de los 30 días a partir de la solicitud de revisión de apps. Debes realizar al menos una llamada a la API sin errores por cada permiso al cual solicites acceso avanzado. Los datos de la llamada a la API se ingresarán en un plazo de dos días a partir de la llamada a la API sin errores. Puedes realizar llamadas con tu app o el explorador de la API Graph.

Algunos permisos también requerirán verificación de acceso para que puedas solicitarlos.

[Obtén más información sobre la verificación de acceso](https://developers.facebook.com/docs/development/release/access-verification/).

Una vez que estés listo, haz clic en el botón **Continuar con la solicitud**.

### Paso 1.5: Completar la verificación del negocio

Después de seleccionar los permisos y las funciones, es posible que se te solicite completar la verificación del negocio si es que todavía no lo hiciste. Dependiendo del estado de tu negocio, es posible que se te solicite iniciar la verificación, proporcionar más información o completar el proceso.

### Paso 2: Responder preguntas de manejo de datos

Si el estado de verificación del negocio es aprobado, es posible que se te solicite responder preguntas de manejo de datos. Las respuestas a estas preguntas se evaluarán de inmediato, lo cual podría tardar hasta 30 segundos.

### Paso 3: Completar la configuración de la app

Desplázate hacia abajo hasta la sección **Completar verificación de la app** y haz clic en cualquier lugar de la fila. En la ventana que aparece, verás las configuraciones necesarias que se pueden encontrar en la pestaña **Configuración** > **Básica**, por lo que es posible que ya estén completas. Si lo están, solo confirma que la información es correcta o realiza las modificaciones que necesites. Si hay alguna incompleta, configúrala aquí.

#### Ícono de la app

Asegúrate de que el ícono de la app no incluya [marcas comerciales o logotipos](https://developers.facebook.com/docs/app-review/resources/logos).

#### URL de la Política de privacidad

Esta es la URL que presentamos a los usuarios de la app en todas las interfaces de soluciones de autenticación de Meta, para que ellos puedan decidir si le conceden o no los permisos que solicita.

#### Propósito de la app

Define esta opción como **Tú o tu negocio** si tu app está disponible solo para las personas que tienen un [rol](https://developers.facebook.com/docs/development/build-and-test/app-roles) en ella o un [rol en una empresa](https://www.facebook.com/business/help/442345745885606?id=180505742745347) que solicitó la app. De lo contrario, defínela como **Clientes**.

#### Categoría de la app

Selecciona una categoría que describa tu app con precisión.

#### Contacto principal

Asegúrate de tener acceso a la cuenta de correo electrónico que se muestra aquí. Las notificaciones por correo electrónico relacionadas con la solicitud de revisión de apps se enviarán a esa dirección.

### Paso 4: Completar la verificación de la app

Desplázate hacia abajo hasta la sección **Completar verificación de la app** y haz clic en cualquier lugar de la fila. Se mostrará la ventana **Detalles de verificación de la app**. Si los usuarios de la app pueden iniciar sesión usando cualquiera de las soluciones de autenticación de Meta, configura el botón de opción en **Sí**. Esto nos informa que podemos acceder a la app con una cuenta de tecnologías sociales de Meta.

![Detalles de verificación](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/103213358_278286103367681_6609865072468417834_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=qJNwmdeRiiMQ7kNvwHNUi-V&_nc_oc=AdlNevLWfuxJ0ixejYF_KdlvIvjSrfmw6GQHv--isUF-1yPbLluuqPIPMOl7oarn58-o9f9UVKz2o-CuxOxS59CU&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=aeUtF8mxYelVYfEsHhgB8Q&oh=00_AfjeSfJbRguoWm9eTlZ6gYX4TcEwcIbu4M6_wAbY0VvtjA&oe=692F1DF4)

En la sección **Configuración de la plataforma**, confirma que la información que se muestra es correcta y, en el espacio que se proporciona, describe cómo podemos acceder a tu app para probarla.

![Configuración de la plataforma](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/82965369_564367377604582_6171808142334026845_n.png?_nc_cat=111&ccb=1-7&_nc_sid=e280be&_nc_ohc=u_t5VECdRxQQ7kNvwH2oFkW&_nc_oc=AdmvzVsz5L99xpx-hjQN_HgsF7b0_uVUtsAGZg2acOtSEiwWeW6P8zv_EvNUgNPSig_8dUwHyG6a5Z8WlYifTjPU&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=aeUtF8mxYelVYfEsHhgB8Q&oh=00_AfjmgG79f8AmZk3paQw4Y1ssj3GPsq5Kk4ocQLqbP0Ba9w&oe=692F2B81)

Verificaremos la app con nuestras propias cuentas de prueba. **No incluyas las credenciales de tu cuenta *personal* de tecnologías de Meta.**

### Paso 5: Completar las descripciones de uso

Desplázate hacia abajo hasta la sección **Permisos y funciones solicitados** y haz clic en el permiso o la función que aparezca primero en la fila. En la ventana que aparece, describe por qué tu app necesita ese permiso o esa función.

![Descripción de uso](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/103227030_868200813673888_2222221641771523537_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e280be&_nc_ohc=aVY7dktxsqgQ7kNvwFOERB0&_nc_oc=AdkuKDDuCeajvtWwkH4KratoBoDswUf1bD8-uAlOVAUxAT56eB_mKq1FR4bpXHVCOMyWkXzZbfn5cxSIOE0cFJor&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=aeUtF8mxYelVYfEsHhgB8Q&oh=00_AfiMnbePDqgFLIhfFW5iO_GrDiElyzp0ODBl_AyB6NGeOQ&oe=692F3355)

La descripción debe ser lo más específica posible. Si tienes dificultades para describir el motivo por el cual tu app necesita el permiso o la función, intenta responder las siguientes preguntas:

- ¿En qué ayuda este permiso o esta función a los usuarios de la app?
- ¿Por qué la app necesita este permiso o esta función?
- ¿Cómo usa la app los datos a los que accede a través de este permiso o esta función?
- ¿Por qué la app sería menos útil sin este permiso o esta función?

A continuación, sube la grabación de pantalla en la que se muestre cómo la app usa este permiso o esta función para que podamos evaluarla.

Repite el paso 3 para cada permiso y función que hayas solicitado.

Cada uno de los permisos y cada una de las funciones debe tener su propia descripción. **No uses la función "copiar" y "pegar".**

### Paso 6: Enviar para revisión

Haz clic en **Enviar para revisión** y acepta nuestras **Condiciones de incorporación a la Plataforma** en la ventana que se muestra. Luego de aceptar las condiciones y enviar la solicitud, esta quedará en cola y se te debería [informar la decisión](https://developers.facebook.com/docs/app-review/introduction#submission-status) en el plazo de una semana.

Si tu app tiene [modos](https://developers.facebook.com/docs/development/build-and-test/app-modes), solo debes cambiarla al modo [activo](https://developers.facebook.com/docs/development/build-and-test/app-modes#live-mode) después de haber completado el proceso de revisión de apps. Las apps en el modo activo solo pueden solicitar permisos aprobados a los usuarios de la app, y solo las funciones aprobadas estarán activas para sus usuarios. Esta restricción es aplicable a todos, incluso a los usuarios que tienen un [rol](https://developers.facebook.com/docs/development/build-and-test/app-roles) en la app, de modo que si cambias al modo activo prematuramente, la app podría volverse inutilizable para los usuarios que tienen un rol en ella. Además, los datos generados en el modo de [desarrollo](https://developers.facebook.com/docs/development/build-and-test/app-modes#development-mode), como las publicaciones de prueba, quedarán visibles para todos los usuarios de la app cuando hagas el cambio.
```



## Page: https://developers.facebook.com/docs/development/release/business-verification

# Verificación del negocio

Para obtener **[acceso avanzado](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access)**, ahora es necesario verificar el negocio.

A partir del 1 de febrero de 2023, si tu app requiere acceso de nivel avanzado a los permisos, es posible que debas completar la **[verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification)**. [Consulta esta publicación de blog para obtener más información.](https://developers.facebook.com/blog/post/2023/02/01/developer-platform-requiring-business-verification-for-advanced-access/)

La verificación del negocio es un proceso que nos permite recopilar información sobre ti y tu empresa. Se usa para verificar tu identidad como entidad comercial.

Las apps que solicitan **[acceso avanzado](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access)** a permisos y las apps que permiten a otros **[negocios](https://business.facebook.com/)** acceder a sus propios datos deben estar conectadas a un negocio que haya completado la verificación del negocio. Hasta entonces, los usuarios de la app de otras empresas no podrán otorgar **[permisos](https://developers.facebook.com/docs/permissions/reference)** a estas apps, y todas las **[funciones](https://developers.facebook.com/docs/apps/features-reference)** estarán inactivas.

Si solo los usuarios que tienen un **[rol](https://developers.facebook.com/docs/development/build-and-test/app-roles)** en la propia app son quienes la usan, no es necesario que completes la verificación. Estos usuarios pueden otorgar a tu app cualquier permiso en cualquier momento, y todas las funciones siempre están activas.

Puedes usar el Panel de apps para conectar tu app a una empresa de la que seas administrador, independientemente de si la empresa está verificada o no, pero el proceso de verificación en sí se debe completar en el administrador comercial de Facebook. Si no tienes una empresa, se te dará la opción de crear una.

Ten en cuenta que cualquier persona que tenga rol de administrador en tu app puede conectarla a una empresa, pero solo alguien con rol de administrador en la empresa podrá completar el proceso de verificación.

## Paso 1: Conecta tu app a una empresa

Carga tu app en el Panel de apps, ve a **Configuración** > **Básica** > **Verificación** y haz clic en el botón "Iniciar verificación" o en el enlace **+ Verificación del negocio** si anteriormente completaste la verificación individual.

![Verification section in the Basic Settings panel.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/143865101_957211231353134_6810255425904105080_n.png?stp=dst-webp&_nc_cat=102&ccb=1-7&_nc_sid=e280be&_nc_ohc=aHR46rkr5HIQ7kNvwESs0wN&_nc_oc=Adntv-PXoNdlwT6eEx3KbeMNuI0oR9xc_NoT33-xUbqBJRLqcE1oLMTb5-sWybUq-5uvNpziZctbTyftpxuRxIDl&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=7tWMtgqUejT-hl28XOp2ow&oh=00_AfjWpGMg_aganlitfjtn8faTn0wE0h0W8WAt6m5sGWa74w&oe=692F18A7)

Si tu cuenta de desarrollador de Facebook ya está asociada a una cuenta comercial de Facebook, tendrás la opción de seleccionar una empresa en ella:

![Business selection modal with a verified Business selected.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/144081810_241994877493212_2655917975499900173_n.png?stp=dst-webp&_nc_cat=102&ccb=1-7&_nc_sid=e280be&_nc_ohc=Uy1L2vpThKUQ7kNvwEDaXhB&_nc_oc=AdkJFSLCxP4IAG-t3aqB6Po4EK2RqGNoflJOgtO-CBXXPIkQelrT3D2RTxIOnFtDrPLPO3LhNL_KGDYOUm7J8ZWx&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=7tWMtgqUejT-hl28XOp2ow&oh=00_AfjZtm3Eq3fi9Vs511-w79NWiWLHBzLnNFylRznIw6cSiQ&oe=692F346E)

Si no tienes una cuenta comercial de Facebook, o si tu cuenta no contiene ninguna empresa, se te pedirá que crees una.

Si conectas tu app a una empresa verificada, se completa el proceso de conexión y no necesitas hacer nada más. La sección **Verificación** debería mostrar que tu app ahora está conectada a una empresa verificada:

![Verification section showing 'Verified' alongside the name of the Business that has been connected to the app.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/142987006_267806678357731_3713867277959890685_n.png?stp=dst-webp&_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=q6vYyf-YwAsQ7kNvwG_OqH2&_nc_oc=Adll0VTSMT-Uz7FzdSzp1Jh9OWuLKKQVg0t5bLOiF15_vpdlbvBz1jj2s3Y_y6N6YTGWd8Q1SNl7BbyjvT2HT5_K&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=7tWMtgqUejT-hl28XOp2ow&oh=00_AfjsyY9_j9i7Qo78jOuC6VMVZDwlZGN-55WmirjPbGkDCQ&oe=692F2531)

Sin embargo, si conectas tu app a una empresa no verificada, debes completar el proceso de verificación en el administrador comercial.

## Paso 2: Verifica tu negocio

Si conectas tu app a una empresa no verificada, tú o el administrador de la empresa deben completar el proceso de verificación en el administrador comercial.

![Business selection modal with an unverified Business selected.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/143769130_241837180871082_6770952626487554480_n.png?stp=dst-webp&_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=smrSNRa11X0Q7kNvwEPkNkx&_nc_oc=AdnGAPdbW8WfXcwziz_0XjkaK-yn97Bb5GpCyXaMq_iPK0zLYasEjNBDIu655Y7qdHKy0i-Y4QY8QsJlzYgkNd9a&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=7tWMtgqUejT-hl28XOp2ow&oh=00_Afimw6kwneOyB0eer-Z_ppH9dlaA0TCzFok4OZf9bcExCw&oe=692F18C5)

Haz clic en "Iniciar verificación del negocio" para cargar la empresa no verificada en el administrador comercial y completar el proceso de verificación.

En el tema **[Información sobre la verificación del negocio](https://www.facebook.com/business/help/1095661473946872)** del servicio de ayuda del administrador comercial puedes consultar la explicación del proceso y una lista de los documentos que necesitarás.

Cuando hayas completado la verificación, regresa al panel de configuración básica. Debería aparecer que tu app ahora está conectada a una empresa verificada:

![Verification section showing 'Verified' alongside the name of the Business that has been connected to the app.](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/144376827_121772393150711_6581279437038461255_n.png?stp=dst-webp&_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=yKhczJmqOZAQ7kNvwGjOHdm&_nc_oc=AdnYTpLmHajnRPttL8j5ufqA8QJmGyekBaDS_Sks-eWAdE33sn4ierFuclEh1IwFmxjMN-mdO-312fWKeIq4DGmB&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=7tWMtgqUejT-hl28XOp2ow&oh=00_AfhzUOnsGj1VhqSJw79khfmbn4ECxHrxMAixqCAkWCh8Ng&oe=692F1138)



## Page: https://developers.facebook.com/docs/permissions/reference/pages_messaging

```markdown
# Permissions Reference for Meta Technologies APIs

Permissions are a form of granular, app user-granted Graph API authorization. Before your app can use an API endpoint to access your app user's data, your app user must grant your app all permissions required by that endpoint.

**Only select permissions that your app needs to function as intended. Selecting unneeded permissions is a common reason for rejection during app review.**

You may also use any permission granted to your app to request analytics insights to improve your app and for marketing or advertising purposes, through the use of aggregated and de-identified or anonymized information (provided such data cannot be re-identified).

### Requirements

- [Meta App Review](https://developers.facebook.com/docs/app-review) – For apps that need access to data that you do not own or manage
- [Business Verification](https://developers.facebook.com/docs/development/release/business-verification) – is required for all apps making requests for [Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access)
- If your app requests permission to use an endpoint to access an app user’s data, you may need to complete [data handling questions](https://developers.facebook.com/docs/development/release/data-handling-questions/questions-preview).
- You may also be required to complete an annual [Data Use Checkup](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup).

### Ways to ask for a permission

When your app users log onto your app, they receive a request to grant the permissions your app has requested. Your app users can grant or deny the requested permissions or any subset of them.

- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business)
- [Instagram API with Facebook Login for Business](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login)
- [Instagram API with Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Meta Business Manager](https://developers.facebook.com/docs/business-manager-api)

If your app does not use a permission for 90 days, usually due to user inactivity, your app user must regrant your app that permission.

### Remove a permission

You can use the [Meta App Dashboard](https://developers.facebook.com/apps) to remove a permission your app no longer uses or to remove a permission that has been deprecated.

## A

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `ads_management` | El permiso **ads_management** permite que tu app lea y administre las cuentas publicitarias que le pertenecen o a las que el propietario le concedió acceso. El uso permitido de este permiso es crear campañas, administrar anuncios u obtener métricas de anuncios mediante programación para ayudar a sus negocios. También se puede usar para desarrollar herramientas de administración de anuncios que ofrezcan soluciones innovadoras y un valor agregado para los anunciantes. <ul><li>Crea campañas, administra anuncios y obtén métricas mediante programación.</li><li>Desarrolla herramientas de administración de anuncios que ofrezcan soluciones innovadoras y un valor agregado para los anunciantes.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere administrar anuncios en nombre de otras empresas. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |
| `ads_read` | El permiso **ads_read** permite que tu app acceda a la [API de estadísticas de anuncios](https://developers.facebook.com/docs/marketing-api/read-access-onboarding) para obtener informes de anuncios de cuentas publicitarias que te pertenecen o a las que los propietarios de otras cuentas publicitarias te concedieron acceso. También permite que acceda a la [API del servidor](https://developers.facebook.com/docs/marketing-api/facebook-pixel/server-side-api) para que los anunciantes puedan enviar eventos web directamente desde sus servidores a Facebook. <ul><li>Proporciona a la API acceso a los datos de rendimiento de tus anuncios para utilizarlos en paneles y análisis personalizados.</li><li>Envía eventos web directamente desde tu servidor a Facebook.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere acceder a anuncios y estadísticas relacionadas en nombre de otras empresas. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |
| `attribution_read` | El permiso **attribution_read** permite que tu app acceda a la API de atribución para obtener datos de informes de atribución de las líneas de negocio que te pertenecen o a las que los propietarios de otras líneas de negocio te concedieron acceso. <ul><li>Permite que tu app acceda a los datos de rendimiento de los anuncios de la atribución para utilizarlos en paneles y análisis personalizados.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

## B

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `business_management` | El permiso **business_management** permite que tu app lea y escriba con la API del administrador comercial. The allowed usage for this permission is to manage business assets such as an ad account and to claim ad accounts. <ul><li>Administra activos comerciales, como una cuenta publicitaria.</li><li>Reclama cuentas publicitarias.</li></ul> | <div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><span><p>Provide specific examples of why your app requires managing business assets on behalf of other businesses. If the permission is requested as a dependency of another main permission, including `pages_messaging` or `pages_show_list`, please specify the main permission in the use case description.</p></span><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo un negocio puede acceder a los datos de rendimiento de anuncios en la plataforma de tu app luego de otorgarle permiso.</li><li>Demuestra que los datos de rendimiento de anuncios, como las impresiones, conversiones, los clics y el alcance, se muestran correctamente en la plataforma de tu app.</li></ol></span></div> |

## C

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `catalog_management` | El permiso **catalog_management** permite que tu app cree, lea, actualice y elimine catálogos de productos del negocio en los que el usuario sea el administrador. The allowed usage for this permission is to build commerce-related solutions for ecommerce platforms, travel platforms and dynamic ads. It can also be used to build inventory type management solutions like product inventory, hotel inventory or car inventory. <ul><li>Desarrolla soluciones comerciales, como plataformas de comercio electrónico y de viajes, y anuncios dinámicos.</li><li>Desarrolla soluciones de administración de inventarios, como inventarios de productos, hoteles o automóviles.</li></ul> | Proporciona ejemplos específicos de por qué tu app requiere administrar los catálogos de productos de empresas que te conceden acceso. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra cómo el usuario de la app crea, actualiza y elimina un catálogo de productos en la plataforma de tu app.</li></ol></span></div> |

## E

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `email` | El permiso **email** permite que tu app lea la dirección de correo electrónico principal de una persona. <div style="color:green;padding-top:5px;padding-left:10px"><i><b>Allowed Usage</b></i></div><ul class="uiList _4of _4kg"><li><div class="fcb">Comunícate con las personas y permite que puedan iniciar sesión en tu app con la dirección de correo electrónico asociada a su perfil de Facebook.</div></li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

## F

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `facebook_creator_marketplace_discovery` | El permiso **facebook_creator_marketplace_discovery** permite a una app descubrir creadores de contenido en la plataforma de descubrimiento de creadores de Facebook. Este permiso se puede usar para que los negocios de Facebook recuperen datos de estadísticas de creadores de Facebook que cumplan los requisitos con el fin de descubrirlos y evaluarlos para campañas de marca, así como para otorgarles crédito y pagarles por su presencia en Facebook. <div class="_7aa"><div style="color:green;padding-top:5px;padding-left:10px"><i><b>Uso permitido</b></i></div></div><ul class="uiList _4of _4kg"><li><div class="fcb">Recuperar datos de estadísticas de creadores de Facebook que cumplan los requisitos para descubrirlos y evaluarlos para las campañas de marca.</div></li><li><div class="fcb">Darles crédito y pagarles a los creadores por su presencia en Facebook.</div></li></ul> | <div class="_7aa"><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Proporciona ejemplos específicos de por qué tu app requiere la administración del descubrimiento de creadores de Facebook en nombre de otros negocios.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión con Facebook completo en la plataforma de tu app y muestra cómo el usuario le otorga este permiso a tu app.</li><li>Demuestra cómo buscar creadores en la plataforma de descubrimiento de creadores de Facebook y muestra cómo acceder a estadísticas sobre los creadores, como la presentación, el número de seguidores y el alcance de la cuenta.</li><li>Demuestra cómo planeas usar los datos de estadísticas que obtuviste para los fines permitidos y muestra tu cumplimiento de todas las políticas de privacidad y uso de datos aplicables.</li></ol></span></div> |

## G

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `gaming_user_locale` | El permiso **gaming_user_locale** permite que tu app conozca el idioma de preferencia de un usuario cuando juega en Facebook (por ejemplo, juegos instantáneos o Cloud Gaming). The allowed usage for this permission is to display a game interface in the user's preferred language. <ul><li>Muestra una interfaz de juego en el idioma de preferencia del usuario.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

## I

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `instagram_basic` | El permiso **instagram_basic** permite que tu app lea la información y el contenido multimedia del perfil de una cuenta de Instagram. The allowed usage for this permission is to get basic metadata of an Instagram Business account profile, for example username and ID. <ul><li>Obtén metadatos básicos del perfil de una cuenta de empresa de Instagram, por ejemplo, un nombre de usuario o un identificador.</li></ul> | Incluye la información específica del perfil de la cuenta profesional de Instagram que requerirá tu caso de uso. Describe dónde se puede encontrar esta información en tu solución. <div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><ol><li>Demuestra el proceso de inicio de sesión en Instagram completo en la plataforma de tu app y muestra cómo el usuario de la app le otorga este permiso a tu app.</li><li>Demuestra el proceso completo de inicio de sesión con Facebook en la plataforma de tu app, muestra cómo el usuario de la app otorga a tu app este permiso y selecciona su cuenta de Instagram.</li></ol></span></div> |

## P

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `pages_events` | El permiso **pages_events** permite que tu app registre eventos en nombre de las páginas de Facebook que administran las personas que usan tu app, y que envíe esos eventos a Facebook para fines de segmentación de anuncios, optimización e informes. The allowed usage for this permission is to send businesses related activities (for example purchase, add-to-cart, lead) on behalf of Pages owned by the people who use your app. <ul><li>Envía actividades relacionadas con los negocios (como las compras, los artículos agregados al carrito o los clientes potenciales) en nombre de las páginas que pertenecen a las personas que usan tu app.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

## R

| Permission | Description and allowed usage | What to include in App Review submission |
|------------|-------------------------------|-----------------------------------------|
| `read_audience_network_insights` | The **read_audience_network_insights** permission allows an app to access the Audience Network insights data and pull performance report information for properties you own. The allowed usage for this permission is to integrate Audience Network properties performance data into app owner’s data analytics and dashboards. <ul><li>Integrate Audience Network properties performance data into app owner’s data analytics and dashboards.</li></ul> | <div><span><div class="_7aa"><div style="padding-top:5px;color:green;"><i><b>Descripción de casos de uso</b></i></div></div><p>Visit the [App Review documentation](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) for guidance.</p></span></div><div class="_7aa"><span><div><div style="padding-top:5px;color:green;"><i><b>Screencast Requirements</b></i></div></div><p>Visita la [Documentación sobre revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review) para recibir orientación.</p></span></div> |

```



## Page: https://developers.facebook.com/docs/facebook-login/login-connect/implementing

# Documentos

## Conectar inicio de sesión con Messenger

### Implementing

```javascript
// Código de ejemplo para implementar el inicio de sesión con Messenger
function loginWithMessenger() {
    // Lógica para iniciar sesión
}
```

### Preguntas frecuentes

- **¿Cómo inicio sesión con Messenger?**
  - Para iniciar sesión, utiliza el método `loginWithMessenger()`.

- **¿Qué permisos necesito?**
  - Necesitas permisos de usuario para acceder a la información de Messenger.

## Crear con Meta

### [Inteligencia artificial](https://developers.meta.com/ai/)

### [Meta Horizon OS](https://developers.meta.com/horizon/)

### [Tecnologías sociales](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.meta.com%2Fsocial-technologies%2F)

### [Wearables](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.meta.com%2Fwearables%2F)

## Noticias

### [Meta for Developers](https://developers.meta.com/blog/)

### [Blog](https://developers.meta.com/blog/)

### [Historias de éxito](https://developers.meta.com/success-stories/)

## Ayuda

### [Ayuda para desarrolladores](https://developers.meta.com/support/)

### [Herramienta de errores](https://developers.meta.com/support/bugs/)

### [Estado de la plataforma](https://l.facebook.com/l.php?u=https%3A%2F%2Fmetastatus.com%2F)

### [Foro de la comunidad de desarrolladores](https://www.facebook.com/groups/fbdevelopers/)

### [Reportar un incidente](https://developers.meta.com/incident/report/)

## Condiciones y políticas

### [Iniciativas de plataforma responsable](https://developers.meta.com/products/responsible-platform-initiatives/)

### [Condiciones de la plataforma](https://developers.meta.com/terms/)

### [Políticas para desarrolladores](https://developers.meta.com/devpolicy/)



## Page: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types/

# Tipos de apps

Los tipos de apps determinan qué [productos](https://developers.facebook.com/docs/development/create-an-app/app-dashboard#products-2) se pueden agregar a una app en el panel de apps y qué [permisos](https://developers.facebook.com/docs/permissions) y [funciones](https://developers.facebook.com/docs/feature-reference) se pueden solicitar para su aprobación mediante el proceso de revisión de apps.

Cuando crees una app, se te preguntará cómo se va a usar. Tus elecciones determinarán su tipo. Una vez que elijas un tipo de app, solo verás los productos, permisos y funciones que están disponibles para ese tipo.

No se puede cambiar el tipo de app. Si la app requiere productos, permisos o funciones que no están disponibles para ese tipo en particular, debes crear una nueva app con un tipo diferente.

## Consumidor

El tipo de app **Consumidor** es para apps que incorporan los productos para consumidores con el fin de ofrecer a los usuarios de la app una experiencia más personalizada. Los ejemplos incluyen apps de videojuegos que se juegan fuera de la plataforma de Facebook.

## Negocios

El tipo de app de **negocios** es para aquellas que ayudan a empresas, creadores y organizaciones a administrar su presencia y anunciarse en las apps de tecnología social de Meta.

### Niveles de acceso

Las apps de negocios están sujetas a una capa adicional de autorización denominada [niveles de acceso](https://developers.facebook.com/docs/graph-api/overview/access-levels/).

### Modos de las apps

Las apps de negocios no tienen ningún modo de app, sino que usan exclusivamente niveles de acceso para determinar quiénes pueden otorgarles permisos y quiénes se verán afectados por las funciones.

Obtén más información sobre los [modos de las apps](https://developers.facebook.com/docs/development/build-and-test/app-modes).



## Page: https://developers.facebook.com/docs/app-review/submission-guide/common-mistakes

# Errores comunes

Antes de enviar tu solicitud de [revisión de apps](https://developers.facebook.com/docs/apps/review), tómate un momento para repasar algunos de los errores más comunes que pueden ocasionar que se solicite información adicional o se rechace la solicitud.

## No se puede acceder a la app

Evaluamos todas las apps enviadas para verificar que cumplan con nuestras condiciones y políticas y que usan las funciones y los permisos que se solicitaron de una manera que resulta compatible con los usos autorizados.

Si por alguna razón no podemos acceder a tu app, se rechazará toda la solicitud. Por este motivo, asegúrate de que la app funcione y que sea de acceso público antes de enviar la solicitud.

## Falta una grabación de pantalla de un permiso o de una función

La solicitud debe incluir grabaciones de pantalla que muestren cómo un usuario de la app utiliza la funcionalidad que requiere los permisos y las funciones que se solicitan. Si la solicitud no incluye una grabación que muestre cómo se usa la función o el permiso específicos, no se aprobará la app para ese permiso o esa función.

## Todavía estás desarrollando la app

Envía la app a revisión solo cuando se haya terminado de desarrollar y esté lista para que la usen los usuarios finales. Si la app todavía no está completa o si sigues haciéndole cambios, se rechazará tu solicitud.

## Solicitas un permiso o una función que es posible que necesites después

Solicita solo permisos o funciones que la app necesita en estos momentos. Si planeas lanzar una nueva versión de la app en el futuro, que requiera de nuevos permisos y funciones, no los incluyas en la solicitud actual. Si este es el caso, hazlo en una nueva solicitud después de que hayas finalizado el desarrollo de la nueva versión de la app.

## El inicio de sesión con Facebook no funciona o no se puede encontrar

Si los usuarios de la app no pueden iniciar sesión en la app con el inicio de sesión con Facebook, intentaremos encontrarlo e iniciar sesión en la app. Sin embargo, si no podemos encontrar el inicio de sesión con Facebook o iniciar sesión en la app con el inicio de sesión con Facebook, se rechazará toda la solicitud.

## Utilizas una cuenta falsa

Las cuentas falsas infringen nuestras condiciones y políticas. Por este motivo, si creas una cuenta falsa e incluyes la información de inicio de sesión al enviar la solicitud, se rechazará toda la solicitud.



## Page: https://developers.facebook.com/docs/messenger-platform/getting-started

```markdown
# Try It – Send a Message with Messenger Platform

Learn how your business can send a message to a customer using the Messenger Platform.

You can use this tutorial to send a message from **your app** or, if you don't have a fully functional app or just want to explore, you can use our **Graph API Explorer**.

## Before You Start

En esta guía, se da por sentado que leíste el artículo [Información general de la plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform/overview) y que implementaste los componentes necesarios para enviar y recibir mensajes y notificaciones.

### Requirements

To make a successful call to the Meta social graph to send a message, your app will need:

- The **`pages_show_list`** permission and a **User access token**, requested by you. This allows your app, or the Graph API Explorer, to get your **Page ID**.
- The **`pages_messaging`** permission and a **Page access token**, requested by a person who can perform the `MESSAGING` task on your Page, allows your app to get the **conversation ID** and your **Page-scoped ID (PSID)**.

You can get access tokens 3 different ways:

- [Facebook Login](https://developers.facebook.com/docs/facebook-login/overview) in your app
- The [App Dashboard](https://developers.facebook.com/apps) in **Messenger > Settings**
- The Graph API Explorer, *(shown below)*

### Start a Conversation

Log in to your Facebook account and send a message to your test Page to create a **PSID** for the customer (you) that is specific for the Page and a **conversation ID** representing the conversation between the customer (you) and the Page.

## Use Your App

If you have already subscribed to the messaging Webhooks, you can get the PSID, the conversation ID, and the message text from the Webhook notification, and move to [Step 3](#step-3--send-the-customer-a-message).

### Step 1. Get the IDs

You will need the ID for your Page, the PSID for the person who sent the message (you) and the conversation ID.

#### Get the Page ID & Page Access Token

To obtain your Page ID, send a `GET` request to the `/USER-ID/accounts` endpoint, replacing USER-ID with your actual your ID. You can also use `me` in place of your User ID.

The `me` endpoint is a special endpoint that represents the ID for the User, Page, or App that is requesting the access token. In the following example, you will use a User access token in the request so `me` will represent your User ID.

#### Sample Request

```bash
curl -i -X GET "https://graph.facebook.com/LATEST-API-VERSION/me/accounts&access_token=USER-ACCESS-TOKEN"
```

#### Example Response

On success, your app will receive a JSON object with the Page ID as well as a Page access token that you can use in subsequent requests.

```json
{
  "data": [
    {
      "access_token": "EAABkWcj...",
      // PAGE-ACCESS-TOKEN
      "category": "Pet Service",
      "category_list": [
        {
          "id": "144982405562750",
          "name": "Pet Service"
        }
      ],
      "name": "Cisco Dog Page",
      "id": "4225...", // PAGE-ID
      "tasks": [
        "ADVERTISE",
        "ANALYZE",
        "CREATE_CONTENT",
        "MESSAGING",
        "MODERATE",
        "MANAGE"
      ]
    }
  ]
}
```

#### Get the PSID & Message ID

To obtain the PSID and message ID, send a `GET` request to the `/PAGE-ID/conversations` endpoint with the `participants` and `messages{id,message}` fields.

##### Sample Request

```bash
curl -i -X GET "https://graph.facebook.com/LATEST-API-VERSION/PAGE-ID/conversations?fields=participants,messages{id,message}&access_token=PAGE-ACCESS-TOKEN"
```

##### Example Response

On success, your app will receive the following JSON response:

```json
{
  "data": [
    {
      "participants": {
        "data": [
          {
            "name": "CUSTOMER-NAME",
            "email": "PSID@facebook.com",
            "id": "PSID"
          },
          {
            "name": "PAGE-NAME",
            "email": "PAGE-ID@facebook.com",
            "id": "PAGE-ID"
          }
        ]
      },
      "id": "t_10224..." // Conversation ID
    }
  ],
  "messages": {
    "data": [
      {
        "id": "m_MeS2...", // Message ID
        "message": "hello"
      },
      {
        "id": "m_Nl1...", // Message ID
        "message": "CUSTOMER-NAME"
      }
    ]
  },
  "id": "t_10224..."
}
```

### Step 3. Send the Customer a Message

To respond to the message a customer sent to your Page, send a `POST` request to `/PAGE-ID/messages` endpoint with the `recipient` parameter set to the customer's PSID, `messaging_type` parameter set to `RESPONSE`, and the `message` parameter set to your response. **Note** that this must be sent within 24 hours of your Page receiving the customer's message.

#### Sample Request

```bash
curl -i -X POST "https://graph.facebook.com/LATEST-API-VERSION/PAGE-ID/messages?recipient={id:PSID}&message={text:'You did it!'}&messaging_type=RESPONSE&access_token=PAGE-ACCESS-TOKEN"
```

On success, your app will receive the following JSON response:

```json
{
  "recipient_id": "1008...", // The customer's PSID
  "message_id": "m_AG5Hz2..." // The message ID
}
```

## Use the Graph API Explorer Tool

If you have already subscribed to the messaging Webhooks, you can get the PSID, the conversation ID, and the message text from the Webhook notification, and move to [Step 3](#step-3--send-the-customer-a-message-2).

### Step 1. Get the IDs

You will need the ID for your Page, the Page-scoped ID (PSID) for the person who sent the message (you) and the message ID.

[Open the Graph API Explorer](https://developers.facebook.com/tools/explorer/) in a new browser tab or window.

The explorer loads with a default query with the `GET` method, the latest version of the Graph API, the `/me` node and the `id` and `name` fields in the Query String Field, and your Facebook App. If you would like to run this default query, you can click **Generate Access Token** then **Submit**. This query will create a User access token and return your name and User ID.

The `me` endpoint is a special endpoint that represents the ID for the User, Page, or App that is requesting the access token. In the following example, you will use a User access token in the request so `me` will represent your User ID. In Step 4, `me` will represent your Page since you are using a Page access token.

To get the Page ID for your Page:

1. Replace the Query String Field string with either `me/accounts` or `/USER-ID/accounts`. If you ran the default query, you can click the ID in the response and it will automatically be moved to the Query String Field.
2. Go to the **Add a permission** dropdown menu in the right side panel and select the `pages_show_list` permission then click **Generate Access Token**.
3. The popup window allows you to agree that the app can access the list of your Pages.
4. Click **Submit** to run the query.

To get the Message ID and the PSID:

1. Click the Page ID in the response to move it to the Query String Field and add **`/conversations?fields=participants,messages{id,message}`** to the query.
2. Go to the **Add a Permission** dropdown menu and select the **`pages_messaging`** permission then click **Generate Access Token**.
3. Another popup window will ask you to agree that the app can access the conversations of your Pages.
4. Click **Submit** to run the query.
5. Copy the Page ID and PSID for Step 3.

### Step 2. Send the Customer a Message

To respond to the message the customer sent to your Page:

1. In the Response Window, click the message ID for the message you want to reply to.
2. In the upper left, switch the method from `GET` to `POST`.
3. In the Node Field Viewer to the left of the Response Window, click the **+ Add parameter** under the **Params** tab. Add the following:
   - `recipient` set to `{id:PSID}`
   - `messaging_type` set to `RESPONSE`
   - `message` set to `{text:'Hello, new customer!'}`

4. Click **Submit**.

**Note** that when using the `RESPONSE` message type, the message must be sent within 24 hours of your Page receiving the customer's message or an error will occur.

## Next Steps

- [Attach Media Assets to your Message](https://developers.facebook.com/docs/messenger-platform/send-messages/saving-assets)
- [Send a customer a message after the 24-hour messaging window](https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags)
- [Create a Message Template](https://developers.facebook.com/docs/messenger-platform/send-messages/templates)

## Learn More

- [Graph API](https://developers.facebook.com/docs/graph-api)
- [Graph API Explorer Tool](https://developers.facebook.com/docs/graph-api/guides/explorer)
- [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)
- [Page Permissions and Tasks](https://developers.facebook.com/docs/pages/overview/permissions-features)
- [Page/Messages Reference](https://developers.facebook.com/docs/graph-api/reference/page/messages)

### Ayuda para desarrolladores

- Usa la [herramienta Meta Status](https://metastatus.com/) para revisar el estado y las interrupciones de los productos empresariales de Meta.
- Usa la [herramienta de ayuda para desarrolladores de Meta](https://developers.facebook.com/support/) a fin de reportar errores y ver los errores reportados, obtener ayuda relacionada con anuncios o el administrador comercial, y más.
- Visita los [recursos de ayuda de la plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform/support-resources) si quieres ver más recursos de ayuda de la plataforma.
```



## Page: https://developers.facebook.com/docs/facebook-login/login-connect/faq

# Preguntas frecuentes sobre Conectar inicio de sesión con Messenger

## ¿Cuándo puedo usar etiquetas de mensajes?

Debes enviar un mensaje al usuario dentro de un periodo de 24 horas a partir del momento en que este acepta que tu empresa lo contacte en Messenger. No puedes usar etiquetas de mensajes para enviar el mensaje inicial al usuario. Una vez que inicies la conversación en Messenger, podrás usar etiquetas de mensajes para enviar mensajes después de 24 horas de que un usuario haya enviado el último mensaje (o iniciado el contacto) solo si tu mensaje cumple con uno de los casos de uso de etiquetas de mensajes aprobados. Para obtener más información, consulta [Etiquetas de mensajes](https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags) en la documentación de la [plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform).

## ¿Necesito guardar login_id en mi base de datos?

Si intentas usar `login_id` para mensajes relacionados con `message_tags` después del período inicial de 24 horas, considera guardar `login_id`.

## ¿Cuántas veces puedo usar login_id para enviar mensajes?

Debes enviar un mensaje al usuario dentro de un periodo de 24 horas a partir del momento en que este acepta que tu empresa lo contacte en Messenger.

## ¿La experiencia del producto solo se muestra a las personas que pueden ver el diálogo de inicio de sesión de FB o también para usuarios actuales que hayan iniciado sesión?

La experiencia del producto se puede mostrar como parte del inicio de sesión o a los usuarios actuales que hayan iniciado sesión, independientemente del inicio de sesión o el registro. Para obtener más información sobre los permisos, consulta la [documentación](https://developers.facebook.com/docs/facebook-login/web/permissions/).

## Después de la activación, ¿los usuarios pueden optar por dejar de recibir mensajes o cambiar sus preferencias?

Para que los usuarios dejen de recibir mensajes en el nivel de cada hilo por separado, deben seleccionar “Desactivar mensajes”. También pueden [silenciar](https://www.facebook.com/help/messenger-app/963733803657199/?helpref=related) o [bloquear](https://www.facebook.com/help/messenger-app/3115643275145823/?helpref=related) los mensajes de tu empresa. Debes acatar de inmediato cualquier solicitud de bloqueo, suspensión o de cualquier otro tipo de desactivación de los mensajes relacionados con tu empresa. Para obtener más información, consulta [¿Cómo activo o desactivo los mensajes de una empresa en Messenger?](https://www.facebook.com/help/messenger-app/755835711227533) en la documentación del Centro de ayuda.

## ¿En qué caso puedo enviar mensajes promocionales o de otro tipo después de 24 horas desde el último contacto del usuario?

Debes enviar un mensaje al usuario dentro de un periodo de 24 horas a partir del momento en que este acepta que tu empresa lo contacte en Messenger. No puedes usar etiquetas de mensajes para enviar el mensaje inicial al usuario. Una vez que se inicie la conversación con el usuario, puedes enviar mensajes promocionales dentro de las 24 horas posteriores al último mensaje del usuario. De otro modo, si quieres enviar actualizaciones promocionales al usuario fuera del período de mensajes de 24 horas, considera usar mensajes publicitarios o una notificación única.

## ¿Puedo enviar mensajes publicitarios con login_id?

El `login_id` no se puede usar para enviar [mensajes publicitarios](https://developers.facebook.com/docs/messenger-platform/discovery/sponsored-messages/). Si los usuarios responden al primer mensaje enviado con `login_id`, recibirás un PSID y podrás usarlo para enviar mensajes publicitarios.

## ¿Qué plantilla se recomienda para ayudar a los usuarios a responder a mi mensaje?

El primer mensaje que se envía a los usuarios debe familiarizarlos con la experiencia que ofreces en la plataforma de Messenger. Por lo general, usar respuestas rápidas en el primer mensaje impulsa la interacción. También debes considerar usar plantillas genéricas, plantillas multimedia o cualquier otra [plantilla](https://developers.facebook.com/docs/messenger-platform/reference/templates) que ayude a los usuarios a comprender la experiencia que se ofrece.

## ¿Qué sucede si tengo varias apps conectadas a una página?

Todas las apps recibirán el evento messaging_optin con un `login_id` válido, independientemente de la configuración HOP. Todas las apps pueden usar este identificador para enviar mensajes.

## ¿Qué sucede si envío un mensaje usando el login_id antes de recibir el evento de activación de Webhooks?

El login_id se genera antes de que finalice el flujo de autenticación. Por ello, no bien una app recibe la devolución de llamada de inicio de sesión correcto, puede enviar un mensaje usando el `login_id`, aun cuando el evento de Webhooks no haya llegado.

## ¿Recibiré un evento messaging_optin por cada inicio de sesión de usuario correcto?

No, el evento solo se activará una vez para los usuarios que acepten el permiso.

## ¿Qué puedo hacer para recibir el evento messaging_optins varias veces durante el desarrollo?

Asegúrate de incluir `reset_messenger_state=1` en el flujo de inicio de sesión. Esto activará el evento de nuevo para usuarios que tengan un rol únicamente en la app que se pruebe. Esto solo es posible usando el método `FB.login()` o una URL de inicio de sesión manual.

## Los SDK móviles no admiten el parámetro reset_messenger_state, ¿cómo puedo restablecer el estado en dispositivos móviles?

Puedes usar una URL de inicio de sesión manual que active el flujo de inicio de sesión en cualquier navegador. Cuando se abre la ventana emergente de inicio de sesión con Facebook, el estado se restablece. Puedes cerrar la ventana antes de iniciar sesión y la próxima vez que el flujo móvil se active, se deberá enviar el evento `messaging_optin`.

## ¿Qué significa el error “Page ID is not valid”?

Para que los usuarios puedan probar esta integración antes del envío para la revisión de apps, deben tener un rol en la app.

## ¿Qué significa el mensaje de error “(#100) Param recipient[id] must be a valid ID string (p. ej., ‘123’)”?

Para que las apps puedan enviar mensajes usando el login_id, deben contar con permiso pages_messaging. Ten en cuenta que al usar `login_id`, el campo del objeto destinatario se denomina “login_id” en lugar de “id”.

## Consulta también:

- [Conectar inicio de sesión con Messenger](https://developers.facebook.com/docs/facebook-login/login-connect/)



## Page: https://developers.facebook.com/docs/facebook-login

```markdown
# Inicio de sesión con Facebook

El inicio de sesión con Facebook es una forma cómoda, rápida y segura para que los usuarios inicien sesión en tu app y para que esta solicite permisos de acceso a datos.

| Plataforma | Enlace |
|------------|--------|
| ![iOS](https://scontent.xx.fbcdn.net/v/t39.2178-6/851583_490814651009691_1462191575_n.png?_nc_cat=106&ccb=1-7&_nc_ohc=7MzZMNhyqCUAb7eJxDh&_nc_ht=scontent.xx&stp=dst-emg0_q75&ur=34156e&_nc_sid=a284aa&oh=00_AfBEXWdWbvWAKw-i67wHhpFJIz1B85TKkTTODW0lDMfxRg&oe=662BD1BB) | **[iOS](https://developers.facebook.com/docs/facebook-login/ios)** |
| ![Android](https://scontent.xx.fbcdn.net/v/t39.2178-6/851582_597188873667456_1591625940_n.png?_nc_cat=101&ccb=1-7&_nc_ohc=C6vz7XMUzOMAb4uXYs9&_nc_ht=scontent.xx&stp=dst-emg0_q75&ur=34156e&_nc_sid=a284aa&oh=00_AfB5J6jrWkYAhDSrdF8OHcg4xB963IpMIqx_1ZHNOfLHjw&oe=662BE00A) | **[Android](https://developers.facebook.com/docs/facebook-login/android)** |
| ![Web](https://scontent.xx.fbcdn.net/v/t39.2178-6/851585_357548701045193_310234287_n.png?_nc_cat=105&ccb=1-7&_nc_ohc=AwpieQM5nKgAb7eiMRE&_nc_ht=scontent.xx&stp=dst-emg0_q75&ur=34156e&_nc_sid=a284aa&oh=00_AfBCvXAmk7ZQCFj1F2ww_peDCaIRd2AvklEXfH0hllS3Bw&oe=662BD7B1) | **[Sitios web para computadoras o sitios web para dispositivos móviles](https://developers.facebook.com/docs/facebook-login/web)** |
| ![Dispositivos](https://scontent.xx.fbcdn.net/v/t39.2178-6/851564_233808196785054_1852554575_n.png?_nc_cat=105&ccb=1-7&_nc_ohc=MESQtbdqsc0Ab4rC5TX&_nc_ht=scontent.xx&stp=dst-emg0_q75&ur=34156e&_nc_sid=a284aa&oh=00_AfDpR4dUt14q5wOHFxvp6nzxsu7Iq7Msb5_PBVMJisGUHw&oe=662BDDFA) | **[Dispositivos](https://developers.facebook.com/docs/facebook-login/for-devices)** |

## Cambios en los plugins sociales en la región europea

Es posible que veas cambios en los plugins sociales debido a la actualización de la solicitud de consentimiento para cookies, que se mostrará a las personas que usen productos de Facebook en la región europea. Dejaremos de ofrecer compatibilidad con los plugins sociales “Me gusta” y “Comentar” para usuarios de la región europea, a menos que 1) las sesiones de sus cuentas de Facebook se hayan iniciado y 2) hayan aceptado el control de las “cookies de apps y sitios web”. Si se cumplen estos requisitos, el usuario podrá ver plugins como los botones “Me gusta” o “Comentar” e interactuar con ellos. Si alguno de los requisitos anteriores no se cumple, el usuario no podrá ver los plugins.

### La región europea está compuesta por una lista específica de países, entre los que se incluyen los siguientes:

- **La Unión Europea (UE):** Alemania, Austria, Bélgica, Bulgaria, Croacia, Dinamarca, Eslovaquia, Eslovenia, España, Estonia, Finlandia, Francia, Grecia, Hungría, Irlanda, Italia, Letonia, Lituania, Luxemburgo, Malta, Países Bajos, Polonia, Portugal, República Checa, República de Chipre, Rumania y Suecia.
- **Países que no son miembros de la UE, pero pertenecen al Espacio Económico Europeo (EEE) exclusivamente, la Asociación Europea de Libre Comercio (AELC) u otra unión aduanera:** [EEE exclusivamente/AELC] Islandia, Liechtenstein y Noruega; Suiza; [Unión aduanera de la UE] todas las islas del Canal, isla de Man, Mónaco; Bases Soberanas Británicas en Chipre; [Unión aduanera de la UE] Andorra, San Marino, Ciudad del Vaticano.
- **Países que no son miembros de la UE, pero son parte de las regiones ultraperiféricas de la UE (RUP):** Martinica, Mayotte, Guadalupe, Guayana Francesa, Reunión, San Martín, Madeira, Las Azores, Islas Canarias.
- **Reino Unido** (todas las islas británicas).

## Primeros pasos

### [Información general](https://developers.facebook.com/docs/facebook-login/overview)

Casos de uso y funciones principales del inicio de sesión con Facebook.

## Planificar

### Integración específica para cada sistema operativo

Cómo integrar el inicio de sesión con Facebook en tu app en distintas plataformas:

- [iOS](https://developers.facebook.com/docs/facebook-login/ios)
- [Android](https://developers.facebook.com/docs/facebook-login/android)
- [Web](https://developers.facebook.com/docs/facebook-login/web)
- [Para dispositivos](https://developers.facebook.com/docs/facebook-login/for-devices)

### [Prácticas recomendadas](https://developers.facebook.com/docs/facebook-login/best-practices), [diseño de la experiencia del usuario](https://developers.facebook.com/docs/facebook-login/userexperience), [seguridad del inicio de sesión](https://developers.facebook.com/docs/facebook-login/security)

Información fundamental para crear una app exitosa con inicio de sesión con Facebook.

### [Permisos](https://developers.facebook.com/docs/facebook-login/permissions/overview)

Solicitar datos del usuario.

### [Tokens de acceso](https://developers.facebook.com/docs/facebook-login/access-tokens), [autenticación en comparación con el acceso a datos](https://developers.facebook.com/docs/facebook-login/auth-vs-data)

Tokens de acceso, sus períodos de vencimiento y su relación con el acceso a datos.

## Revisión y prueba

### [Pruebas](https://developers.facebook.com/docs/facebook-login/testing-your-login-flow)

Asegúrate de que tu integración funcione correctamente.

## Enviar tu app para su revisión y aprobación

### [Revisión de apps](https://developers.facebook.com/docs/facebook-login/review)

Envía tu app para que se revisen los permisos que solicita.

## Avanzado

### [Registro de cambios](https://developers.facebook.com/docs/facebook-login/changelog)

Conoce qué cambió en los diferentes lanzamientos de inicio de sesión con Facebook.

## Resultados comerciales

### [Historias de éxito](https://developers.facebook.com/success-stories)

Obtén información sobre cómo la implementación del inicio de sesión con Facebook en las apps mejoró las tasas de sesiones iniciadas y la experiencia del cliente. En particular, consulta el siguiente caso de éxito:

| Skyscanner | ![Skyscanner](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/13311282_1007186976025896_1933768039_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=MucL0f1dtfcQ7kNvwG90dAN&_nc_oc=AdmvFBcnMOCFKlg8wVCP6HlDgkwDMdVPH5xk7lR_bgPkl42ASy0DbW0lC64sMLxfIiiCzMznT7wfO5NL7wFxIRJX&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=dncU7dx3-HjUnvobtsK0Vg&oh=00_AfhZ7qTeHvzVN908C1arJTDU-nFqcWMg-F0zJEqjJ2LdvA&oe=692F3771) |
|------------|--------|
| Las conversiones de inicio de sesión con Facebook aumentaron un 100%. |

## Otros recursos

| ![Data Protocol](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/290685728_725708695301954_3657236838974303579_n.png?_nc_cat=102&ccb=1-7&_nc_sid=e280be&_nc_ohc=yAxc9Fb9wxkQ7kNvwH2iELF&_nc_oc=Adlw1UjWF4aaHY7Tee39ZwoL7uVvIEIoJUUPl__vlEx9zbJ-5dFCHWxopq6p3dVrzeaIPZQOSlePYUVDnu2BpyUp&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=dncU7dx3-HjUnvobtsK0Vg&oh=00_AfgoyN6HhaWXZGHMdBIl5btZIkO9IQPfeg7cFgqAsgebSg&oe=692F0C1C) | **[Data Protocol](https://dataprotocol.com/facebook-login)**: tutoriales en video y capacitaciones breves. |
|------------|--------|
| ![GitHub Example](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/22880499_168732097044909_1891283213796507648_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=Vad0P6iH7AAQ7kNvwGI7_Wd&_nc_oc=Admj3gifibbW0tByRQumnKwTOKY7UIvmRAvEUH9rAw0KDRjcli2cAN6pC1frIrMyCjuqNs3VSwP-QJBHYv6hezWv&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=dncU7dx3-HjUnvobtsK0Vg&oh=00_Afh3g97zGEtYoVItd0-pZV686OGom-0hwh3bhV2RHT-kFA&oe=692F11FF) | **[Ejemplo de GitHub](https://github.com/facebook/facebook-android-sdk/tree/master/samples/FBLoginSample)** de una implementación en Android del inicio de sesión con Facebook. |
```



## Page: https://developers.facebook.com/docs/facebook-login/login-connect

# Conectar inicio de sesión con Messenger

Mediante Conectar inicio de sesión con Messenger, los usuarios pueden activar ahora la comunicación con tu empresa a través de la plataforma de Messenger directamente desde el proceso de inicio de sesión con Facebook en la app para celulares o el sitio web. De esta manera, puedes profundizar la interacción con el usuario y proporcionar una atención al cliente más sólida y eficiente, ya que permite que te comuniques con más clientes por el canal de tu preferencia. La plataforma de Messenger permite que tu página automatice la experiencia con los mensajes. Así, puedes reducir el tiempo que invierte tu equipo en responder solicitudes básicas y brindar un servicio de atención al cliente de primera calidad. Para obtener más información sobre la plataforma de Messenger, consulta la [documentación sobre la plataforma de Messenger](/docs/messenger-platform).

## Cómo funciona

Cuando un usuario llega al sitio de terceros o a un app para celulares e inicia sesión con Facebook después de seguir el proceso de inicio de sesión estándar, verá una pantalla que le solicitará que autorice a la empresa a contactarlo a través de Messenger para poder brindarle ofertas, asistencia, etc.

Si el usuario acepta recibir comunicaciones de la empresa en Messenger, dicha empresa cuenta con 24 horas desde que el usuario indicó su aceptación para enviar el mensaje inicial al usuario a través de la plataforma de Messenger. Es necesario que esta experiencia de mensajería, incluso los mensajes de seguimiento de la empresa, cumpla con nuestras [Políticas para desarrolladores](https://developers.facebook.com/devpolicy), que abarca nuestra [documentación para desarrolladores sobre la plataforma de Messenger](/docs/messenger-platform/introduction), y debe revisarse de acuerdo con la revisión de apps que se menciona más adelante antes de poder publicarse.

## Antes de empezar

La experiencia con Conectar inicio de sesión con Messenger requiere que se [someta a revisión de apps](https://developers.facebook.com/docs/app-review/submission-guide) solicitando el permiso [`user_messenger_contact`](https://developers.facebook.com/docs/permissions/reference/user_messenger_contact) y [`pages_messaging`](https://developers.facebook.com/docs/permissions/reference/pages_messaging) si la app de mensajería no contara ya con dichos permisos. Antes de enviar la experiencia de la app a la revisión de apps, es necesario contar con lo siguiente:

- [Verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification).
- Una app del [tipo](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types/) consumidor o comercial con el inicio de sesión con Facebook configurado que solicite acceso al permiso [`user_messenger_contact`](https://developers.facebook.com/docs/permissions/reference/user_messenger_contact) a través de la [revisión de apps](https://developers.facebook.com/docs/app-review).
- Una página de Facebook pública que representa el sitio web o la entidad que utiliza el inicio de sesión con Facebook para que le solicite al usuario que acepte recibir mensajes.
- Asegurarse de que la página haya otorgado el permiso `pages_messaging` a una app y que esta app tenga configurado el producto Messenger. Puede ser la misma app con el inicio de sesión con Facebook o una app distinta. Si se utiliza la misma app para el inicio de sesión y los mensajes, y dicha app no cuenta ya con el permiso `pages_messaging`, puedes solicitar "pages_messaging" en la misma revisión.
- Verificar que la app cumpla con los requisitos de la revisión de apps y los que se establecen a continuación.

Para probar la revisión de apps, la experiencia de Conectar inicio de sesión con Messenger debe enviar un mensaje al usuario dentro de los 30 segundos desde que el usuario acepto recibir mensajes, a fin de que podamos probar a tiempo la integración. Si se aprueba la experiencia de Conectar inicio de sesión con Messenger y se transmite en vivo, bastará con que envíes un mensaje al usuario dentro de las 24 horas desde el momento en el que el usuario aceptó que la empresa lo contacte en Messenger, tal y como se describe en "Requisitos para usar Conectar inicio de sesión con Messenger".

Cuando envíes la app a [revisión de apps](https://developers.facebook.com/docs/app-review), proporciona una descripción detallada de las secciones, para lo que debes ser tan específico como sea posible. Puedes consultar alguna [guía para el envío de solicitudes](https://developers.facebook.com/docs/app-review/submission-guide) de revisión de apps y un [ejemplo de envío de solicitud](https://developers.facebook.com/docs/app-review/resources/sample-submissions/messenger-platform) de un permiso `pages_messaging`. Antes de enviar tu solicitud de [revisión de apps](https://developers.facebook.com/docs/app-review), tómate un momento para repasar algunos de los [errores más comunes](https://developers.facebook.com/docs/app-review/submission-guide/common-mistakes) que pueden ocasionar que se solicite información adicional o se rechace la solicitud.

## Requisitos para usar Conectar inicio de sesión con Messenger

Antes de enviar la experiencia de Conectar inicio de sesión con Messenger a la revisión de apps, o bien si la experiencia ya está publicada, debe cumplir con lo siguiente:

- La integración del inicio de sesión con Facebook de tu sitio web debe funcionar correctamente.
- Después de que el usuario inicia sesión en tu sitio web mediante el inicio de sesión con Facebook, debe existir una solicitud clara para que usuario acepte que tu empresa lo contacte a través de Messenger.
- Debes enviar un mensaje al usuario dentro las 24 horas a partir del momento en que este acepta que tu empresa lo contacte en Messenger. No puedes usar etiquetas de mensajes para enviar el mensaje inicial al usuario.
- La experiencia de mensajería debe cumplir con todas las [políticas para desarrolladores](https://developers.facebook.com/devpolicy) y con la [documentación técnica para desarrolladores](https://developers.facebook.com/docs/messenger-platform) referida a la plataforma de Messenger (incluso los [requisitos mencionados en esta página](https://developers.facebook.com/docs/messenger-platform/app-review)), lo que incluye las restricciones que se aplican al momento en que puedes enviarles mensajes a los usuarios pasadas las 24 horas desde el último contacto iniciado por el cliente.
- Debes dar rápida respuesta a todas las solicitudes (dentro y fuera de Messenger) que realicen las personas para bloquear, discontinuar o cancelar de alguna otra forma la función de mensajería.
- Eres responsable de garantizar que el uso que haces de Conectar inicio de sesión con Messenger cumple con las leyes aplicables, incluso las referidas a la privacidad de los usuarios y su información.

## Primeros pasos

Explora Conectar inicio de sesión con Messenger con este ejemplo de prueba.

Consulta el ejemplo de implementación para Conectar inicio de sesión con Messenger

![Ejemplo de implementación](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/22879576_1762036650768869_8159633346305982464_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=mrDh9IqyHkQQ7kNvwFORnXu&_nc_oc=Adk2aHrR6oJSYckq3QvbKrgfCGq29CAPzv4f14mg4AqbQz6S0TX6sQIyVugegoBybKYETkOZJ99T0XrGZEvnbSBs&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=HaJpv9HovZOyWYzxXNkZ3A&oh=00_AfgzN8Q1PbIbMEXguZUGGuXkBR2ZsnPpJc0VPmdue3cdrg&oe=692F2683)

Los primeros pasos con Conectar inicio de sesión con Messenger son simples. En apenas 30 minutos, puedes implementar una experiencia completamente funcional. Al finalizar, la integración podrá permitir que los usuarios de prueba acepten mediante la experiencia de Conectar inicio de sesión con Facebook que la empresa los contacte a través de Messenger. Después de haber aceptado, recibirás un mensaje automático de la página.

[Probar ahora](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffbsamples%2Ffblogin-sample&h=AT1ZHZgNAncOg08FQ9cwiG3zSqNOWJ-C7riQkOz6g_PcrgriBwMZH4rqMlxnBgLE2zoJObtD8UOYvWFaPLd29rUJsKxFXXPxMiLrjOpYMN1Dpk970d6nLydOZBtfik_Luxsnt8i1H8CINQEWmtnFj0j7rOBEgOaGqh02nIAdW98)

Si quieres obtener instrucciones detalladas y ejemplos de código para implementar Conectar inicio de sesión, consulta [Implementar Conectar inicio de sesión con Messenger](/docs/facebook-login/login-connect/implementing).

También puedes ver [las presentaciones técnicas sobre cómo configurar la conexión de inicio de sesión con Messenger](/videos/2021/login-connect-with-messenger-technical-deep-dive/).

## Más información

- [Implementar Conectar inicio de sesión con Messenger](/docs/facebook-login/login-connect/implementing)
- [Preguntas frecuentes de Conectar inicio de sesión](/docs/facebook-login/login-connect/faq)
- [Inicio de sesión con Facebook](/docs/facebook-login)
- [Primeros pasos en Messenger](/docs/messenger-platform/getting-started)



## Page: https://developers.facebook.com/docs/app-review/resources/sample-submissions/messenger-platform

# Messenger Platform

## Documentación

### Introducción

La plataforma Messenger permite a los desarrolladores crear experiencias de mensajería ricas para sus usuarios. Esta documentación proporciona ejemplos, guías y recursos para ayudar a los desarrolladores a comenzar con Messenger.

### Recursos

- [Documentos](https://developers.facebook.com/docs/)
- [Herramientas](https://developers.facebook.com/tools/)
- [Ayuda](https://developers.facebook.com/support/)

### Ejemplos de Código

```javascript
// Ejemplo de envío de un mensaje
const messageData = {
  recipient: { id: "<PSID>" },
  message: { text: "Hola, mundo!" }
};

callSendAPI(messageData);
```

### API de Mensajería

#### Enviar Mensaje

Para enviar un mensaje a un usuario, se debe realizar una solicitud POST a la siguiente URL:

```
POST https://graph.facebook.com/v12.0/me/messages?access_token=<PAGE_ACCESS_TOKEN>
```

##### Parámetros

- `recipient`: El ID del destinatario.
- `message`: El contenido del mensaje.

### Ejemplo de Solicitud

```bash
curl -X POST "https://graph.facebook.com/v12.0/me/messages?access_token=<PAGE_ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "recipient": {
    "id": "<PSID>"
  },
  "message": {
    "text": "Hola, mundo!"
  }
}'
```

### Respuestas de la API

La API de Messenger devuelve respuestas en formato JSON. Un ejemplo de respuesta exitosa es:

```json
{
  "recipient_id": "<PSID>",
  "message_id": "<MESSAGE_ID>"
}
```

### Errores Comunes

- **Error de autenticación**: Asegúrate de que el token de acceso es válido.
- **ID de destinatario no válido**: Verifica que el PSID es correcto.

### Conclusión

Para más información y recursos, visita la [documentación oficial de Messenger](https://developers.facebook.com/docs/messenger-platform).