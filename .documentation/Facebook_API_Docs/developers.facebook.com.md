# API Documentation

**Source URL:** https://developers.facebook.com/docs/development
**Scraped Date:** 2025-11-12 13:25:35

---



## Page: https://developers.facebook.com/docs/development

```markdown
# Desarrollo de apps con Meta

Para realizar la integración con los productos de Meta, es necesario usar los SDK de Meta o acceder a cualquiera de las API de Meta. Primero, debes registrarte como desarrollador de Meta. Después de registrarte, usa el panel de apps para proporcionar información sobre tu app. Esta documentación explica cómo registrarse como desarrollador, cómo usar el panel de apps para configurar tu app, y cómo compilarla, probarla y lanzarla.

## Contenido de la documentación

| Registro | Crea una app |
|----------|--------------|
| [Registro](https://developers.facebook.com/docs/development/register) | [Crea una app](https://developers.facebook.com/docs/development/create-an-app) |
| Regístrate como desarrollador para acceder a nuestras herramientas de desarrollo de apps. | Crea una app y una el panel de apps para acceder a la app y la configuración de la cuenta. |

| Compilación y prueba | Lanzamiento |
|----------------------|-------------|
| [Compilación y prueba](https://developers.facebook.com/docs/development/build-and-test) | [Lanzamiento](https://developers.facebook.com/docs/development/release) |
| Herramientas e información para ayudarte con el proceso de desarrollo de la app. | Cómo hacer que tu app esté disponible para los usuarios de Meta. |

| Conservación del acceso a los datos | Condiciones y políticas |
|--------------------------------------|------------------------|
| [Conservación del acceso a los datos](https://developers.facebook.com/docs/development/maintaining-data-access) | [Condiciones y políticas](https://developers.facebook.com/docs/development/terms-and-policies) |
| Cómo evitar perder el acceso a los productos, las API y los SDK que ofrecemos. | Términos y políticas que debes aceptar. |

| Ayuda | Centro de confianza |
|-------|--------------------|
| [Ayuda](https://developers.facebook.com/docs/development/support) | [Centro de confianza](https://developers.facebook.com/docs/development/trust-center) |
| Nuestros recursos de ayuda para desarrolladores y cómo acceder a ellos. | La tienda integral con todos los recursos para desarrolladores. |

## Más información

- [Documentación](https://developers.facebook.com/docs): documentos sobre todos los productos, las API y los SDK que ofrecemos.
- [Productos](https://developers.facebook.com/products/): productos disponibles para desarrolladores de Facebook.
- [Videos de Data Protocol](https://l.facebook.com/l.php?u=https%3A%2F%2Fapp.dataprotocol.com%2Fchannels%2Fmeta): videos adicionales para desarrolladores.

---
```



## Page: https://developers.facebook.com/docs/development/app-customization

```markdown
# Personalización de casos de uso

En este documento, se enumeran los casos de uso disponibles para tu app y las características y permisos disponibles para cada uno.

## Casos de uso disponibles

En la siguiente tabla, se muestran los casos de uso disponibles que puedes agregar a tu app.

| Use Case                                                                                      | Description                                                                                                                                                                                                                       |
|-----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Crear y administrar anuncios sobre apps con el administrador de anuncios de Meta             | Promociona tu app para celulares y aumenta las instalaciones. Crea y administra campañas que animen a los usuarios a descargar e instalar tu app. No incluye acceso a la API de marketing.                                      |
| Anúnciate en tu app con Meta Audience Network                                                | Únete a Meta Audience Network para monetizar tu app y aumentar tus ingresos con anuncios de los anunciantes de Meta. Obtén estadísticas con la API de informes.                                                                    |
| Administrar productos con la API de catálogos                                                | Administra los catálogos y los productos que quieres promocionar en las tecnologías de Meta.                                                                                                                                   |
| Permite a los usuarios transferir sus datos a otras apps                                     | Ofrece a los usuarios la posibilidad de transferir su información de las apps de Meta a otros servicios.                                                                                                                         |
| Autenticar y solicitar datos a usuarios con el inicio de sesión con Facebook                | Nuestro caso de uso más común. Una forma segura y rápida de que los usuarios inicien sesión en tu app o juego y que la app les solicite permisos para acceder a sus datos para personalizar su experiencia.                      |
| Comparte o crea recaudaciones de fondos en Facebook e Instagram                             | Recauda dinero y llega a más personas con la API de recaudación de fondos de Meta. Crea o comparte campañas de recaudación de fondos existentes en Facebook e Instagram.                                                            |
| Lanzar un juego en Facebook                                                                   | Lanza un juego que los jugadores puedan encontrar y jugar directamente en su feed o en conversaciones o mensajes, tanto en computadoras como en dispositivos móviles.                                                              |
| Administrar todos los aspectos de tu página                                                  | Publica contenido y videos, modera publicaciones y comentarios de seguidores en tu página y obtén estadísticas de interacción.                                                                                                   |
| Acceder a la API de Threads                                                                  | Usa la API de Threads y elige autenticar usuarios, recuperar información de usuarios, publicar hilos, responder hilos, administrar la configuración de respuesta o recopilar estadísticas para un perfil de Threads que poseas o administres en nombre de otros. |
| Unirte a ThreatExchange                                                                       | Únete a ThreatExchange para compartir con otros miembros indicios sobre amenazas online, como terrorismo, malware, material sobre abuso sexual infantil y otro contenido dañino, y ayudar a mantener la seguridad de las personas en internet. |
```



## Page: https://developers.facebook.com/docs/development/create-an-app/app-dashboard

```markdown
# Panel de apps

En este documento, se describe la interfaz del panel de apps y sus opciones de configuración.

[Abrir el panel](https://developers.facebook.com/apps)

**Si acabas de crear una app nueva, no es necesario que leas toda esta documentación y configures las opciones del panel ahora**; puedes comenzar la compilación y las pruebas de inmediato y volver a consultar estos documentos cuando lo necesites si deseas obtener información relevante sobre la configuración del panel.

## Información general

El panel de apps te permite configurar aspectos que podrían requerir los casos de usos, las API y los SDK que usará tu app. También proporciona herramientas para ayudar con el desarrollo de las apps, como medidores de uso de la API y la posibilidad de crear usuarios y páginas de prueba y de asignar roles a otras personas que podrían ayudarte con el desarrollo. El panel también se usa para iniciar los procesos de revisión de apps y verificación del negocio, si es necesario.

## Mis apps

**Mis apps** funciona como el punto de entrada del panel de apps cuando accedes a [developers.facebook.com/apps](https://developers.facebook.com/apps). Muestra información básica sobre todas las apps en las que tienes un rol. El panel te permite hacer lo siguiente:

| | |
|---|---|
| - Ver el nombre de la app y el identificador de Meta | - Ver y acceder a las acciones necesarias de una app |
| - Ver la empresa conectada a la app, si la hubiera | - Crear una app de prueba para una app existente |
| - Ver tu rol en la app | - Eliminarte de la app |
| - Ver el estado publicado de la app | - Archivar o eliminar apps propias |

## Panel de apps de casos de uso

En el **panel**, encontrarás los pasos para compilar tu app, enviarla a revisión y publicarla.

### Barra de herramientas

En la barra de herramientas que aparece en la parte superior del panel después de que seleccionas una app, se muestra el **identificador de la app**, y puedes alternar entre tus diferentes apps.

#### Identificador de la app

El identificador de la app se genera en el momento de creación de la app. Cada app tiene un identificador único que no se puede cambiar. Normalmente, no es necesario usar el identificador de la app, a menos que necesites hacer cambios en la configuración de la app de manera programática o que quieras enviar consultas a los puntos de conexión que lo requieran (son muy pocos los que lo requieren).

#### Menú desplegable de selección de apps

Te permite cambiar de una app a otra, crear nuevas apps y crear apps de prueba.

### Compilar la app

Te permite agregar más casos de uso a tu app, ajustar la configuración, asignar roles y realizar pruebas.

#### Casos de uso

En **Casos de uso**, puedes agregar y personalizar los casos de uso que necesitas en tu app.

#### Configuración

La sección **Configuración** de tu app se divide en dos secciones separadas: **Básica** y **Avanzada**.

La configuración **Básica** te permite proporcionar información más detallada sobre tu app, como su categoría, plataforma e ícono. Además, incluye configuraciones que habitualmente se necesitan para completar la revisión de apps, como las URL de tu política de privacidad y las condiciones del servicio.

La configuración **Avanzada** te permite configurar aspectos no comunes, como la configuración de seguridad y las restricciones de segmentación por edad y ubicación geográfica, y, además, te permite actualizar tu app con nuevas versiones de la API Graph y de la API de marketing.

#### Roles de la app

Los **roles de la app** se pueden usar para enviar invitaciones de roles de la app a otras personas que pueden ayudarte a desarrollar tu app. Además, los administradores pueden usarlos para eliminar a una persona de un rol.

Los roles en la app controlan quiénes tienen acceso a la configuración de la app y quiénes pueden usar tu app (otorgarle permiso para acceder a los datos) mientras se encuentra en el modo de desarrollo.

#### Pruebas

En **Pruebas**, puedes probar los casos de uso que agregaste a tu app para asegurarte de que funcionen y de que los permisos con requisitos de prueba estén listos para la revisión de apps.

### Enviar a revisión

Te permite verificar tu negocio, conectar la app con una cuenta comercial de Meta verificada, responder preguntas sobre el tratamiento de datos y enviar tu app a revisión.

#### Verificación

Te permite iniciar el proceso de verificación obligatorio de tu app.

#### Preguntas sobre el tratamiento de datos

Responde preguntas sobre tus prácticas de tratamiento de datos a fin de obtener acceso a permiso y preparar tu app para la revisión.

#### Revisión de apps

En **Revisión de apps**, puedes crear y enviar solicitudes de revisión de apps.

La revisión de apps es parte del proceso de publicación. Si tu app estará a disposición de personas que no tienen un rol en ella, deberás enviarla a revisión.

### Publicación

Te permite publicar tu app para que puedan acceder a ella aquellas personas que no tienen un rol asignado en la app.

#### Transmisión en vivo

Muestra una lista de requisitos que se deben cumplir para que la app se pueda activar.

### Alertas

Si haces clic en el ícono de la campana que está ubicado en la parte inferior izquierda del panel, puedes acceder a las notificaciones que te enviamos, como las actualizaciones de estado de envío a revisión de apps y las alertas sobre los próximos cambios en las API.

En la configuración para desarrolladores, puedes controlar qué notificaciones para desarrolladores recibes.

## Panel de tipos de apps

En **Panel**, puedes encontrar las métricas de uso de la API y notificaciones importantes sobre acciones obligatorias o cambios futuros que podrían afectar a tu app.

### Barra de herramientas

En la barra de herramientas que aparece en la parte superior del panel después de que seleccionas una app, se muestra el **identificador de la app**, y puedes alternar entre tus diferentes apps.

#### Identificador de la app

El identificador de la app se genera en el momento de creación de la app. Cada app tiene un identificador único que no se puede cambiar. Normalmente, no es necesario usar el identificador de la app, a menos que necesites hacer cambios en la configuración de la app de manera programática o que quieras enviar consultas a los puntos de conexión que lo requieran (son muy pocos los que lo requieren).

#### Menú desplegable de selección de apps

Te permite cambiar de una app a otra, crear nuevas apps y crear apps de prueba.

#### Botón "Modo de la app"

Este botón muestra el estado del modo de la app actual y te permite cambiar de un modo a otro.

Todas las apps que recién se crearon comienzan en el modo de desarrollo y **no se deben pasar al modo en vivo hasta que hayas completado el desarrollo de la app y tengas todo listo para publicarla**.

Si eliges "Negocio" como tipo de app, no aparecerá el indicador de modo, porque estas apps utilizan niveles de acceso en lugar de modos.

#### Indicador de tipo de app

Muestra el tipo de tu app. Los tipos de app determinan los productos, permisos y funciones que están disponibles para tu app.

### Acciones requeridas

Los mensajes importantes sobre tu app se mostrarán aquí. Normalmente, se trata de acciones relacionadas con mantener el acceso a los datos. También recibirás una notificación para desarrolladores sobre estos requisitos.

### Configuración

La sección **Configuración** de tu app se divide en dos secciones separadas: **Básica** y **Avanzada**.

La configuración **Básica** te permite proporcionar información más detallada sobre tu app, como su categoría, plataforma e ícono. Además, incluye configuraciones que habitualmente se necesitan para completar la revisión de apps, como las URL de tu política de privacidad y las condiciones del servicio.

La configuración **Avanzada** te permite configurar aspectos no comunes, como la configuración de seguridad y las restricciones de segmentación por edad y ubicación geográfica, y, además, te permite actualizar tu app con nuevas versiones de la API Graph y de la API de marketing.

### Roles de la app

Los **roles de la app** se pueden usar para enviar invitaciones de roles de la app a otras personas que pueden ayudarte a desarrollar tu app. Además, los administradores pueden usarlos para eliminar a una persona de un rol.

Los roles en la app controlan quiénes tienen acceso a la configuración de la app y quiénes pueden usar tu app (otorgarle permiso para acceder a los datos) mientras se encuentra en el modo de desarrollo.

### Alertas

En **Alertas**, puedes acceder a las notificaciones para desarrolladores que te enviamos, como actualizaciones de estado de envío a revisión de apps y alertas sobre próximos cambios en la API.

En la configuración para desarrolladores, puedes controlar qué notificaciones para desarrolladores recibes.

### Revisión de apps

En **Revisión de apps**, puedes crear y enviar solicitudes de revisión de apps.

La revisión de apps es parte del proceso de publicación. Si tu app estará a disposición de personas que no tienen un rol en ella, deberás enviarla a revisión.

Obtén más información sobre el proceso de revisión de apps.

### Productos

Si creaste una app con un tipo de app, es posible que debas agregar un producto para que tenga mayor funcionalidad. Si seleccionaste un caso de uso, no es necesario agregar un producto por separado.

Cuando agregas un producto a tu app, se activa la funcionalidad relevante y el acceso a la API. También se agrega un nuevo panel específico del producto y, en la mayoría de los casos, se proporciona una interfaz para que configures aspectos adicionales específicos del producto.

En la documentación para desarrolladores correspondiente a los productos indicados en [developers.facebook.com/products](https://developers.facebook.com/products) puedes consultar si es necesario usar el panel de apps para agregar un producto a tu app.

#### Certificación de uso de productos

En el caso de algunos productos, debes certificar que los usarás de acuerdo a nuestras Condiciones de la plataforma y Políticas para desarrolladores.

![Screenshot of Product Use Certification modal for the oEmbed product.](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/132080234_237548471214022_92325165582684367_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=OVQd438OoWIQ7kNvwHYDCai&_nc_oc=Adl8CXga1PXtO0E0_fS8YXiNnOqs7D5DNcN5JnHVoTmY6pneP0dSNqSBKKpL7RS-hTA&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&oh=00_AfhzYXqm72-eM9LUKZhbliDwLWd26T_TajoJFwXNi8jDBA&oe=692F1A08)

Para completar la certificación inicial, puedes marcar la casilla del cuadro de diálogo **Confirmar aceptación** cuando agregues estos productos a tu app. Además, cada año deberás volver a obtener la certificación como parte del proceso de comprobación de uso de datos.

### Registro de actividad

El **registro de actividad** es un registro histórico de los cambios hechos en tu app a través del Panel de apps. Este panel aparecerá únicamente si hubo actividad en tu app.

### Límite de frecuencia de la app

Muestra el uso de frecuencia de la app de API Graph de tu app.

### Límite de frecuencia en el nivel del usuario

Muestra la cantidad de usuarios de tu app que alcanzaron su límite de frecuencia de usuario de la API Graph.

### Estadísticas de la API

Muestra estadísticas básicas sobre las solicitudes de tu app a la API Graph.

### Estadísticas de la API de marketing

Muestra estadísticas básicas sobre las solicitudes de tu app a la API de marketing.

### Limitación de frecuencia en el nivel de la página

Muestra el uso de frecuencia de la página de la API Graph de tu app. Obtén más información sobre la limitación de frecuencia de la página.

### Actividad de inicio de sesión con Facebook

Muestra estadísticas básicas sobre la actividad de inicio de sesión con Facebook de tu app.

## Consulta también:

Para obtener más información sobre los conceptos que se mencionan en este documento, sigue los enlaces que se incluyen a continuación.

### Desarrollo de apps

- [Modos de las apps](https://developers.facebook.com/docs/development/build-and-test/app-modes)
- [Revisión de apps](https://developers.facebook.com/docs/resp-plat-initiatives/app-review)
- [Roles de las apps](https://developers.facebook.com/docs/development/build-and-test/app-roles)
- [Estados de las apps: archivar o eliminar apps](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-states)
- [Tipos de apps](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types)
- [Compilar y probar una app de Meta](https://developers.facebook.com/docs/development/build-and-test)
- [Crear una app](https://developers.facebook.com/docs/development/create-an-app)

### Panel de apps

- [Configuración avanzada](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/advanced-settings)
- [Configuración básica](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings)
- [Configuración para desarrolladores](https://developers.facebook.com/docs/development/create-an-app/developer-settings)

### Mantener el acceso

- [Comprobación de uso de datos](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup)
- [Condiciones de la plataforma](https://developers.facebook.com/terms)
- [Políticas para desarrolladores](https://developers.facebook.com/devpolicy)
- [Mantener el acceso a los datos](https://developers.facebook.com/docs/development/maintaining-data-access)
- [Limitación de frecuencia](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

### Niveles de acceso

- [Niveles de acceso](https://developers.facebook.com/docs/graph-api/overview/access-levels)
- [Inicio de sesión con Facebook](https://developers.facebook.com/docs/graph-api)
- [API Graph](https://developers.facebook.com/docs/graph-api)
- [API de marketing](https://developers.facebook.com/docs/marketing-apis)
- [Páginas de productos](https://developers.facebook.com/products)

### Síguenos

- [Meta for Developers](https://developers.meta.com/)
- [Blog](https://developers.meta.com/blog/)
- [Historias de éxito](https://developers.meta.com/success-stories/)
```



## Page: https://developers.facebook.com/docs/development/build-and-test

```markdown
# Compilación y prueba

En este documento, se describe el proceso básico de desarrollo y prueba de las apps creadas en Meta for Developers. También se describen las herramientas y las opciones de configuración disponibles en el panel de apps que podrían resultarte útiles durante el desarrollo.

## Proceso general

El proceso de desarrollo variará en función de las necesidades de tu app, pero el flujo básico comienza con la lectura de la documentación de cada uno de los casos de uso. Puedes encontrar información sobre estos casos de uso en [developers.facebook.com/products](https://developers.facebook.com/products/).

Después de haber identificado y leído la documentación relevante, el siguiente paso es hacer cambios en el código base de tu app y configurar las opciones del panel de apps que puedan requerir los casos de uso, los SDK y las llamadas a la API que vas a implementar. Si otras personas te ayudan a desarrollar y probar tu app, puedes asignarles roles en la app para que puedan configurar ajustes de la app y probar integraciones de la API Graph.

Finalmente, para verificar que hayas implementado todo correctamente, puedes probar tu app con tu propia cuenta de desarrollador o mediante usuarios de prueba que simulan ser usuarios reales de tecnologías de Meta.

Como punto de partida, la mayoría de las apps de Facebook usan la API Graph para intercambiar datos con Facebook. Los puntos de conexión de la API Graph requieren permisos. Como recibir y enviar datos con la API Graph es una acción común, tenemos un conjunto de SDK para facilitar las llamadas a los puntos de conexión de la API Graph. Así, muchos desarrolladores comienzan con esos cuatro conjuntos de documentos.

## Casos de uso de las apps

Cuando creas una app por primera vez, debes elegir un caso de uso principal y, luego, casos de uso secundarios, siempre que sea necesario hacerlo para agregarle funcionalidad. Los casos de uso se componen de permisos y funciones que se agregan automáticamente a tu app de Meta. La mayoría de estos casos de uso requiere revisión de apps.

Por ejemplo, cuando seleccionas el inicio de sesión con Facebook como principal caso de uso al crear tu app, podrás agregar casos de uso secundarios con permisos y funciones asociados.

Los casos de uso tienen un conjunto de funciones, permisos y API propios para que elijas. Cuando agregues un caso de uso secundario, se te redirigirá a la página de configuración del panel de apps, donde podrás configurar las funciones, las API y los permisos asociados con tu caso de uso.

### Tipos de apps

Si vas a crear una app que no se ajusta a ninguno de los casos de uso incluidos en el panel de apps, deberás seleccionar **Otro** y, luego, elegir el tipo de app que vas a crear.

Los tipos de apps determinan los productos que se pueden agregar a una app en el panel de apps, y qué permisos y funciones se pueden solicitar y aprobar mediante el proceso de revisión de apps.

### Modos de las apps

Tu app tendrá alguno de estos dos modos: activo o de desarrollo. Los modos de las apps se aplican a apps no comerciales y determinan los permisos y las funciones que tu app puede usar, además de quiénes pueden utilizarla.

Las apps que se encuentran en el modo de desarrollo pueden recibir cualquier permiso, pero solo de usuarios que tengan un rol en ellas. Además, todas las funciones están activas, pero solo para usuarios de apps que tienen roles en estas.

Cualquier persona puede otorgar permisos a las apps en modo activo, pero solo permisos que se hayan aprobado mediante el proceso de revisión de apps. Asimismo, las funciones están activas para todos los usuarios de apps, pero solo aquellas funciones que se aprueban a través de la revisión de apps.

**Todas las apps no comerciales de reciente creación comienzan en el modo de desarrollo. Evita cambiar el modo hasta haber completado todo el trabajo de desarrollo y prueba.**

Ten en cuenta lo siguiente:

- Ten en cuenta que los tipos de app también afectan los tipos de permisos que están disponibles. Por ejemplo, los permisos relacionados con el usuario no están disponibles para las apps de negocios, y los permisos relacionados con empresas no están disponibles para las apps para consumidores. Las apps de tipo comercial no tienen modos de app, ya que utilizan en su lugar niveles de acceso que se comportan de manera similar.
- Las apps que soliciten acceso avanzado a permisos deberán estar conectadas a un negocio verificado.

### Roles de la app

Antes de publicar tu app, ten en cuenta que solo las personas que tienen un rol específico en ella, como desarrolladores o evaluadores, podrán acceder a la app. Por consiguiente, son quienes pueden brindar ayuda con el proceso de desarrollo y prueba.

### Pruebas

En la página "Pruebas", se incluyen todos los casos de uso de tu app y los permisos asociados a los que solicitaste acceso. También puedes buscar los requisitos de prueba referidos a la revisión de apps.

Deberás usar el explorador de la API Graph o crear cuentas de usuarios de prueba para realizar las llamadas de prueba obligatorias a la API antes de enviar la app a revisión. Algunos permisos no necesitan prueba antes de la revisión de apps, pero te recomendamos probarlos a todos para garantizar que la app funcione como corresponda.

Una vez que completes todas las llamadas de prueba obligatorias a la API, tendrás todo listo para la revisión de apps.

Ten en cuenta lo siguiente:

- Las llamadas de prueba a la API pueden tardar hasta 24 horas en aparecer en la página "Pruebas".
- Las llamadas de prueba a la API solo son válidas durante 30 días y se deben completar dentro de un plazo de 30 días antes de que envíes la app a revisión.

### Usuarios de prueba

Los usuarios de prueba son cuentas de prueba en las que puedes iniciar sesión para simular usuarios reales de Facebook cuando pruebes tu app. Los usuarios de prueba no pueden interactuar con usuarios reales de Facebook. Además, el contenido o las interacciones que generen estos usuarios son solo visibles para otros usuarios de prueba y para cualquier persona que tenga un rol en tu app.

### Páginas de prueba

Las páginas de prueba son páginas creadas por los usuarios de prueba que puedes usar para simular páginas reales de Facebook cuando pruebes tu app. Los usuarios reales de Facebook no pueden encontrar las páginas de prueba. Solo otros usuarios de prueba o las personas que tengan un rol en tu app pueden interactuar con las páginas de prueba.

### Devolución de llamada para eliminación de datos

Si implementaste un caso de uso, también debes implementar la devolución de llamada para eliminación de datos antes de poder publicarla. Haremos una llamada a la URL de devolución de llamada para eliminación de datos de tu app cada vez que alguno de los usuarios de tu app solicite que elimines sus datos.

### Consulta también:

Obtén más información sobre los diferentes conceptos que se mencionan en este documento.

| Desarrollo de apps: compilación y prueba | Revisión de apps |
|------------------------------------------|------------------|
| [Modos de las apps](https://developers.facebook.com/docs/development/build-and-test/app-modes) | [Revisión de apps](https://developers.meta.com/apps/review) |
| [Roles de las apps](https://developers.facebook.com/docs/development/build-and-test/app-roles) |  |
| [Tipos de apps](https://developers.facebook.com/docs/apps/app-types) |  |
| [Verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification) |  |
| [Devolución de llamada de eliminación de datos](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback) |  |
| [Tipos de productos](https://developers.facebook.com/docs/development/create-an-app/app-dashboard#products-2) |  |
| [Páginas de prueba](https://developers.facebook.com/docs/development/build-and-test/test-pages) |  |
| [Usuarios de prueba](https://developers.facebook.com/docs/development/build-and-test/test-users) |  |

## Próximos pasos

Una vez que hayas completado el desarrollo de la app y tengas todo listo para publicarla, puedes iniciar los procesos necesarios para [lanzarla](https://developers.facebook.com/docs/development/release) correctamente.
```



## Page: https://developers.facebook.com/docs/development/trust-center

```markdown
# Meta Developer Trust Center

Your One-Stop Shop for all Developer resources.

## Overview

Being a third party developer requires an understanding of principles and practices for app development, some of which may not be familiar to you. The Trust Center centralizes these resources into one location for you and includes best practices, key principles, and steps on how to find support if needed. This also includes information and resources related to the enforcement of Facebook Platform Terms and your access and use of Facebook User Data.

## Getting Started

This is the [standard guide](https://developers.facebook.com/docs/development) on how to build apps on our platforms.

## Your App Journey

The following outlines steps that may be helpful for developers applying for App Review:

- **[Understand and review developer responsibilities](https://developers.facebook.com/blog/post/2020/07/01/platform-terms-developer-policies)**
- **[Understand security and privacy requirements](https://developers.facebook.com/docs/development/data-security)**
- **[Understand what permissions you need](https://developers.facebook.com/docs/facebook-login/permissions/overview)**
- **[Submit to App Review](https://developers.facebook.com/docs/resp-plat-initiatives/app-review)**
- **[Complete the Data Use Check-up, if approved](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup)**
- **[For advanced permissions, complete the Data Protection Assessment](https://developers.facebook.com/blog/post/2021/07/22/introducing-data-protection-assessment/https://developers.facebook.com/blog/post/2021/07/22/introducing-data-protection-assessment/)**
- **[Review best data practices](https://developers.facebook.com/docs/development/data-security)**

## Permissions

There are three types of assessments you may need to complete around your app’s use of permissions for access to Meta data:

- **[Asking for permissions (App Review)](https://developers.facebook.com/docs/resp-plat-initiatives/app-review)**
- **[Certifying permissions used in accordance with Platform Terms (Data Use Checkup)](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup)**
- **[Describing data protection and security practices for Advanced Permissions (Data Protection Assessment)](https://developers.facebook.com/blog/post/2021/07/22/introducing-data-protection-assessment/https://developers.facebook.com/blog/post/2021/07/22/introducing-data-protection-assessment/)**

The following links are relevant best practices to follow as you request for permissions:

- **[Permissions Overview](https://developers.facebook.com/docs/facebook-login/permissions/overview)**
- **[How should I ask for permissions?](https://developers.facebook.com/docs/facebook-login/permissions/requesting-and-revoking)**
- **[What happens when people decline permissions?](https://developers.facebook.com/docs/facebook-login/handling-declined-permissions)**
- **[My permissions need app review. What should I know?](https://developers.facebook.com/docs/facebook-login/permissions/review)**
- **[How do I submit for permissions review for my app?](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/submission-guide)**

## Data Security

Developers must always have in effect and maintain administrative, physical, and technical safeguards that meet or exceed industry standards given the sensitivity of the Platform Data. Here are some guidelines about how to comply with our data security requirements:

- **[What are the Developer Data Security Best Practices?](https://developers.facebook.com/docs/datasecurity)**
- **[How do I ensure that my app does not lose Data Access?](https://developers.facebook.com/docs/development/maintaining-data-access)**
- **[What is the annual Data Use Checkup?](https://developers.facebook.com/docs/development/maintaining-data-access/data-use-checkup)**
- **[What is the Data Protection Assessment?](https://developers.facebook.com/docs/development/maintaining-data-access/data-protection-assessment/)**
- **[What are some of the Login security features?](https://developers.facebook.com/docs/facebook-login/security/)**
- **[How do I report a platform incident?](https://developers.facebook.com/incident/report/)**
- **[What is the App Security Checkup?](https://developers.facebook.com/tools/app-security-checkup/)**

## User Experience

We want to ensure that developers use our APIs in a way that does not negatively impact the experience of users on our apps. The following is a list of considerations when creating user experiences with your app:

- **[How do I create a great login user experience with Facebook Login?](https://developers.facebook.com/docs/facebook-login/userexperience)**
- **[What are the guidelines on notifying users about my app?](https://developers.facebook.com/docs/games/services/appnotifications/)**

## Terms and Policies

Developers must comply with our Platform Terms and Developer Policies to remain active on our platform. Here are things to note:

- **[Overview and Enforcement](https://developers.facebook.com/devpolicy)**
- **[What are our terms?](https://developers.facebook.com/terms)**
- **[What are our developer policies?](https://developers.facebook.com/devpolicy)**
- **[What tools can I use to verify compliance?](https://developers.facebook.com/platform-initiatives/)**
- **[Simplifying our Platform Terms and Developer Policies](https://developers.facebook.com/blog/post/2020/07/01/platform-terms-developer-policies)**

## Verification

We have a process to verify the identity of a business that owns apps that interact with our APIs. This is different from the verification badge for notable accounts on our Family of Apps. Advanced permissions that you request will require business verification. For more information, visit the [Business Verification documentation](https://developers.facebook.com/docs/development/release/business-verification).

- **[I have a business, how do I verify?](https://developers.facebook.com/docs/development/release/business-verification/)**
- **[How do I claim ownership of my domain in Business Manager by having domain verification?](https://developers.facebook.com/docs/sharing/domain-verification)**

## Enforcement

We have a process to enforce on apps that violate our Platform Terms or Developer Policies. Please review the following details on our enforcement procedures:

- **[Enforcement Overview](https://developers.facebook.com/docs/development/terms-and-policies/enforcement)**
- **[How do I appeal my app that has been enforced upon?](https://developers.facebook.com/appeal/)**
- **[How do I report a policy violation?](https://www.facebook.com/help/117257561692875)**

## Staying Updated and Blog Posts

We regularly post on our blogs and platforms to keep developers updated about our processes. Here is a list of resources to see:

- **[Developer Blog](https://developers.facebook.com/blog/)**
- **[Developer Tools](https://developers.facebook.com/tools/)**

## Support and Community

We have multiple support channels that developers can use to communicate with us depending on the activity of their apps on our platforms:

- **[Developer Support Home](https://developers.facebook.com/support)**
- **[Developer Community Forum](https://developers.facebook.com/community)**
- **[Developer Documentation](https://developers.facebook.com/docs/)**
- **[Developer Circles](https://developers.facebook.com/developercircles/)**
- **[Live chat - This is available if you are rejected for apps during our app review process](https://developers.facebook.com/docs/development/create-an-app/app-dashboard#dashboard)**
```



## Page: https://developers.facebook.com/docs/development/register

```markdown
# Regístrate como desarrollador de Meta

En este documento, se explica cómo registrarse como desarrollador de Meta. Una vez que te hayas registrado, tendrás acceso al panel de apps y a todos los productos, los SDK, las API, las herramientas de desarrollo y los documentos para desarrolladores.

## Paso 1: Iniciar el proceso de registro

Una vez que hayas iniciado sesión en la cuenta de Facebook, ve a [https://developers.facebook.com/async/registration](https://developers.facebook.com/async/registration).

Como alternativa, puedes ir al sitio web del [Centro para desarrolladores de tecnología de redes sociales](https://developers.facebook.com/) y hacer clic en **Empezar**.

## Paso 2: Aceptar nuestras condiciones y políticas

Haz clic en **Siguiente** para aceptar nuestras [Condiciones de la plataforma](/terms) y [Políticas para desarrolladores](/devpolicy).

## Paso 3: Verificar tu cuenta

Enviaremos un código de confirmación al número de teléfono y la dirección de correo electrónico que nos proporciones para confirmar que tienes acceso a ellos. Usaremos tu número y correo electrónico para enviar notificaciones importantes para desarrolladores sobre cambios que puedan afectar tu app.

## Paso 4: Seleccionar tu ocupación

Selecciona la ocupación que mejor describa a lo que te dedicas.

## Próximos pasos

Ahora que ya finalizaste el proceso de registro, puedes usar el panel de apps para [crear tu primera app](/docs/development/create-an-app).

---

Se actualizó este documento.  
La traducción en español no está disponible todavía.  
Actualización del documento en inglés: **30 sep. 2024**
```



## Page: https://developers.facebook.com/docs/development/maintaining-data-access

```markdown
## Maintaining Data Access

This document lists policies and procedures that can affect your app's ability to access Facebook data. If your app is in danger of losing access to Facebook data (or has already lost access to it) you will receive an **urgent** developer notification in your [alerts inbox](/docs/development/create-an-app/app-dashboard#alerts). You may also receive a corresponding email notification, depending on how you have configured your [developer settings](/docs/development/create-an-app/developer-settings).

Find more video resources from [Data Protocol](https://l.facebook.com/l.php?u=https%3A%2F%2Fapp.dataprotocol.com%2Fchannels%2Fmeta&amp;h=AT3blXOa2Bly-wGcrgNqeVawsmT-CuLLbncnE-372N5_CLdRNEhsGY0OBTn0eV680joeqdhOtPcngBE65IhTx0Ne8R2ZOQ-nQBt0hr7xhwucbLFDWpeNWn4bEXmJDgSnraL_qkTyuDiADSfG_3jn1n3i31I).

### Inactive Apps

An app may be deemed inactive if it satisfies the following conditions:

- no app users have logged into the app in the last 90 days
- the app has made no calls to either the Graph API or Marketing API in the last 90 days
- the app has received no webhook notifications in the last 90 days

Once an app has been deemed inactive, all access tokens associated with the app will be invalidated and the app will be prevented from accessing the Graph API and Marketing API until access is restored.

### Restoring Access

Admins of an inactive app who load the app in the App Dashboard will be given the option to restore the app. Restoring an app will:

- automatically upgrade it to the latest version of the Graph API and Marketing API
- re-enable webhooks notifications and upgrade them to the latest version

Old access tokens will still be invalid so new ones must be generated. Also, any permissions that were removed from the app due to disuse while it was inactive must be re-approved through the App Review process.

### Data Protection Assessment

Data Protection Assessment is a requirement for apps accessing advanced permissions that is designed to assess how developers use, share and protect Platform Data as described in the [Facebook Platform Terms](https://developers.facebook.com/terms). When enrolled, an administrator of the app will need to complete a questionnaire based on their app’s access to Platform Data.

Learn more about [Data Protection Assessment](https://developers.facebook.com/docs/development/maintaining-data-access/data-protection-assessment).

### Data Use Checkup

Data Use Checkup is an annual requirement whereby you, or another app admin, must certify that your app still accesses our APIs and uses our products and data in compliance with our [Platform Terms](/terms) and [Developer Policies](/devpolicy).

Learn more about [Data Use Checkup](/docs/development/maintaining-data-access/data-use-checkup).

### Product Use Checkup

If you have added any [products](/docs/development/create-an-app/app-dashboard#products-2) that require Product Use Certification, you must annually recertify as part of the [Data Use Checkup](/docs/development/maintaining-data-access/data-use-checkup) process.

### Terms and Policies Violations

If you violate our [terms](/terms), [policies](/devpolicy), or allowed usages for individual [permissions](/docs/permissions/reference) and [features](/docs/apps/features-reference), your app will be [enforced](https://developers.facebook.com/docs/development/terms-and-policies/enforcement) upon. Enforcement actions can range from limiting your app's ability to access our APIs to revocation of individual permissions and features. You can find a list of our terms and policies in our [Terms and Policies](https://developers.facebook.com/docs/development/terms-and-policies) documentation, as well as more information about enforcement actions and the appeals process.
```



## Page: https://developers.facebook.com/docs/development/support

```markdown
# Asistencia

Puedes acceder a los recursos de asistencia haciendo clic en la pestaña **Soporte técnico**, que está ubicada en el menú de navegación en la parte superior derecha de cualquiera de las páginas de Meta for Developers. Conoce los errores más frecuentes, los documentos sugeridos para desarrolladores, los enlaces a los grupos de desarrolladores y las formas de contactarnos si encuentras errores. Es posible que debas iniciar sesión para ver todas las funciones de nuestros sistemas de asistencia.

## Comunidad de desarrolladores

Los grupos de la comunidad de desarrolladores de Facebook son el mejor recurso para que puedas hacer preguntas y compartir comentarios con otros desarrolladores de Facebook.

- [Comunidad de desarrolladores de Facebook](https://www.facebook.com/groups/fbdevelopers/)
- [Comunidad de desarrolladores de marketing de Facebook](https://www.facebook.com/groups/pmdcommunity/)
- [Comunidad de desarrolladores de la plataforma de Messenger](https://www.facebook.com/groups/messengerplatform/)
- [Comunidad de desarrolladores de la API de Instagram](https://www.facebook.com/groups/1778881492342136)
- [Comunidad de desarrolladores de juegos instantáneos](https://www.facebook.com/groups/instantgamedevelopers/)
- [Comunidad de desarrolladores de las API de WhatsApp Business](https://facebook.com/groups/272494620525992)

## Asistencia directa

La [asistencia para desarrolladores](https://developers.facebook.com/support) ahora está disponible para que puedan recibir ayuda durante la evaluación de la renovación del acceso a datos y durante su experiencia en Meta for Developers. Se ofrece asistencia sobre cuestiones de protección de datos, tratamiento de datos y revisión de aplicaciones.

### Qué sucederá

- Una función que permite enviar una pregunta a asistencia directa y recibir una respuesta en menos de 48 horas.
- Un repaso de la [renovación del acceso a datos](https://developers.intern.facebook.com/docs/resp-plat-initiatives/data-access-renewal) y [preguntas sobre el tratamiento de datos](https://developers.facebook.com/docs/resp-plat-initiatives/data-access-renewal/tutorial/data-handling-questions).
- Respuestas a las [preguntas frecuentes](https://developers.intern.facebook.com/docs/resp-plat-initiatives/data-access-renewal/faqs/) con una opción para cargar una pregunta con texto sin plantilla.

### Cómo acceder

Puedes acceder al soporte haciendo una pregunta mediante la función "Haz una pregunta" o seleccionando "Contactar a la asistencia directa".

Estos son los pasos para obtener ayuda desde el panel de desarrolladores. Ten en cuenta que hay dos maneras de acceder a la página de Ayuda, según dónde estés.

- **En developers.facebook.com/support:**
  
  Si estás en developers.facebook.com, puedes acceder al soporte con el botón "Obtén ayuda" en el sector inferior derecho.
  
  ![](https://lookaside.fbsbx.com/elementpath/media/?media_id=993628792735073&version=1743757920)

- **En la renovación del acceso a datos:**
  
  Si te encuentras en la renovación del acceso a datos, puedes acceder al soporte dentro de la página de evaluación de desarrolladores con el botón "Obtén ayuda" en la esquina inferior izquierda de la pantalla. Ten en cuenta que debes abrir alguna de tus acciones necesarias antes de ver esta característica.
  
  ![](https://lookaside.fbsbx.com/elementpath/media/?media_id=439940509180117&version=1743757920)

Una vez que hayas accedido a la sección de ayuda, haz clic en "Haz una pregunta" en el panel de la izquierda:

![](https://lookaside.fbsbx.com/elementpath/media/?media_id=1187552443022981&version=1743757920)

Verás un menú desplegable para seleccionar preguntas sobre el tema que deseas consultar. Si no ves tu pregunta en el menú desplegable o si tienes más preguntas, selecciona "Contactar a la asistencia directa".

![](https://lookaside.fbsbx.com/elementpath/media/?media_id=629767930052383&version=1743757920)

En cuanto envíes tu consulta, la asistencia para desarrolladores se pondrá en contacto contigo dentro de los siguientes 2 días hábiles. Puedes revisar cualquier pregunta enviada [aquí](https://business.facebook.com/direct-support/?business_id=17602302352575).

## Panel de estado de la plataforma

Usa el [panel de estado de la plataforma](https://developers.facebook.com/status/dashboard/) para obtener información sobre el estado de la plataforma, los errores y los cortes que podrían afectar tu app.

## Estado de Facebook para empresas

Usa el [estado de Facebook para empresas](https://l.facebook.com/l.php?u=http%3A%2F%2Fstatus.fb.com%2F&h=AT3dZdYaOOLyO1L2BQ6XhlRPAjng_GSwzNK9mHhazrpn_3n715EiqUrAzLGPpgVwXlFmG8FvzOcTXelcU6g3saLGRkZmnrK9hZfslgG08t4qP1lThWFhmfQq5fZELNs3RXmljEDN1Bw5Dj_nK5vMgFLSC7M) para obtener información sobre los problemas de la plataforma de Facebook y de los productos comerciales (anuncios, API de WhatsApp Business, plataforma para desarrolladores de Facebook, etc.).

## Contactarnos

- [Apelaciones del desarrollador](https://developers.facebook.com/appeal/): ver apelaciones para las apps, apelar una decisión, restaurar apps y obtener ayuda para encontrar apps que eran de tu propiedad, pero que no puedes encontrar.
- [Reportar un error](https://developers.facebook.com/support/bugs/): reportar un error de la plataforma, ver otros errores que ya se reportaron y consultar el estado de un reporte de errores.
- [Reportar un incidente en los datos de la plataforma](https://developers.facebook.com/incident/report/): reportar un incidente en la seguridad relacionado con datos de la plataforma o sistemas que procesan los datos de la plataforma, o bien con datos de la plataforma que se recibieron por error o se procesaron infringiendo las condiciones o políticas de Facebook.
- [Reportar una infracción de la Política de la plataforma](https://www.facebook.com/help/117257561692875): reportar al servicio de ayuda de Facebook una app o un juego que infringe las políticas.
- [Administrador comercial](https://business.facebook.com/direct-support/): visitar el administrador comercial para consultar preguntas sobre los problemas comerciales, por ejemplo, pagos.
```



## Page: https://developers.facebook.com/docs/development/create-an-app/transfer-an-app

```markdown
# Transfer Ownership of an App

You can transfer ownership of an app, either individual to individual, business to individual, or business to business, using the App Dashboard and the Business Manager. Some transfers require our [prior written consent](Some transfers require our prior written consent, which can be obtained by submitting this form. Please see below to determine if you need to complete the asset transfer request form.), which can be obtained by submitting [this form](https://developers.facebook.com/forms/asset-transfer-form/). Please see below to determine if you need to complete the asset transfer request form.

These scenarios do **not** require consent form submission:

- Changing or adding an app admin from within the same company*;
- Transferring control or operation of the app from one subsidiary to another subsidiary.

* “Within the same company” for this purpose means that both the current and new admin are employed or contracted by, or acting as an agent of, the same company.

If either of the above apply to you, please use the steps in the sections below to complete your transfer, and do not submit the consent form.

For all other scenarios not outlined above, [please submit this form](https://developers.facebook.com/forms/asset-transfer-form/), and we will respond to your request. If you are unsure whether to submit the form, please submit it, and we will respond accordingly.

## Assign a New Owner

### Step 1. Add the New Owner

Add the new owner as an [Administrator](https://developers.facebook.com/docs/development/build-and-test/app-roles#administrator) of the app in the **App Dashboard > App roles > Roles**.

### Step 2. Accept the App Administrator Invitation

The new owner must accept the Administrator role invitation for the app in their app dashboard.

### Step 3. Remove the Previous Owner

Once the new owner has accepted the invitation, the new owner or the original owner can [remove the original owner](https://developers.facebook.com/docs/development/create-an-app/app-dashboard#roles) from the admin role of the app.

From here the new owner can add the app to their business, either in the [App Dashboard](https://developers.facebook.com/docs/development/release/business-verification) or [Business Manager](https://www.facebook.com/business/help/2199735813629697).

## Assign a New Business

### Step 1. Remove the App from the Original Business

- For apps with an App Type, in **App Dashboard > Settings > Basic**, go to the **Verification** section and click **Remove**.
- For apps with a Use Case which requires verification, in the **Verification** page, which is often found in **App Dashboard > Review > Verification**, click **Remove**.
- This will bring you to the **Business Manager > Business Settings > Apps**.
- Then, click **Remove** in the upper right corner of the App's section.

Note that you must have both an app [administrator role](https://developers.facebook.com/docs/development/build-and-test/app-roles#administrator) on the app itself and have an [admin role](https://www.facebook.com/business/help/442345745885606) on the business that has claimed/created the app in order to be able to remove the app from the original business.

### Step 2. Add the App to a New Business

#### In the App Dashboard

Follow the [Business Verification guide](https://developers.facebook.com/docs/development/release/business-verification) to add the app to a new business.

#### In the Business Manager

Follow the [Business Manager Help Center article](https://www.facebook.com/business/help/2199735813629697) to add the app to a new business.

Note: When using the business manager to add and remove app admins, the app admin performing the task must be an admin of the business.

## Notify Meta of a Transfer in App Ownership

Are you seeking to transfer ownership of your Meta app, business, or assets to another party? If so, please fill out the form below and your initial submission will be reviewed. Please be aware that Meta may require additional information after the submission of this form prior to approving the transfer. Until your request is approved, your transfer will not be recognized by Meta and any use or access of Platform Data by the new owner may be in violation of Meta’s Platform Terms and Terms of Service. For more information about what may be required after the initial submission, please review the bottom of this page.

## Submission Requirements

1. Apps, Business IDs, or Assets being transferred.
2. Identity of and contact email for current owners of items to be transferred.
3. Identity of and contact email for new owners of items to be transferred.
4. Briefly describe the nature and scope of the ownership transfer. Please include any information about the affiliation between the transferring party and acquiring party, and any anticipated changes in purpose or usage of any Apps, Business IDs, Assets, Platform Data, or other items.
5. What type of proposed transfer is this (e.g., stock sale, merger, asset sale, etc.)?
6. What is the timeline for the proposed transfer?
7. Please provide any other information you think may be relevant.

**Submit requests [using this form](https://developers.facebook.com/forms/asset-transfer-form/).**

## After Your Submission

After we receive your request, someone will be in touch with any additional questions or information necessary to successfully process your transfer under Platform Term 11.a. Depending on the details of the initial submission, additional questions may include, and you should be prepared to provide:

1. Further information about the rationale or purpose of the transfer.
2. Further information about how the transfer may impact access to, collection of, or use of Platform Data.
3. Further information about other Apps, Business IDs, or Assets held by the transferring or acquiring companies.
4. Any additional information required by Meta to approve the transfer.

## Learn More

[Business Help Center – Transfer an app to another business portfolio](https://www.facebook.com/business/help/236817717885919)
```



## Page: https://developers.facebook.com/docs/development/create-an-app

```markdown
# Create an App with Meta

Creating an app with Meta is a crucial first step for any developer looking to integrate with Meta’s products, SDKs, or APIs. This process ensures your app is properly identified, configured, and authorized to interact with Meta’s platform and services.

## Before you start

To create an app with Meta, you must first [**register as a developer**](/docs/development/register) and be [logged into your developer account](https://facebook.com/).

## Overview

You need to create an app to be able to:

- **Enable Integration:** Gain access to Meta’s SDKs and APIs, allowing your app to interact with Facebook, Instagram, and other Meta products.
- **Manage Permissions and Data Access:** Review and comply with requirements for accessing user data, ensuring your app meets Meta’s privacy and security standards.
- **Obtain Credentials:** Receive a unique App ID and App Secret, which are required for authentication and generating access tokens for testing and production use.

### What are use cases?

**Use cases define the main ways your app will interact with Meta’s platform, such as authenticating users, accessing social features, or managing business assets.**

When you add a use case to your app, permissions, features, and products are automatically added to your app that provide the use case's functionality to your app. For example, if you select the **Manage everything on your Page** use case, the `business_management`, `pages_show_list`, and `public_profile` are added. These permissions that are required for this use case to work properly, and can't be removed. Additionally, the `pages_manage_engagement` permission is added by default but it can be removed if your app doesn't need it to function as you want it to. You can also add optional permissions, such as `pages_read_engagement`, and the Business Asset User Profile Access feature if your app needs it to function the way you want it to.

You can add multiple use cases to a single app, provided they are compatible with each other. For example, you can add the **Access Threads API** use case to an app with the **Manage everything on your Page** use case, but you can't add the **Authenticate and request data from users with Facebook Login** use case since it is incompatible. During initial app creation, after you select a use case, **_incompatible use cases are greyed out._**

**Note:** [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/) and [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-ad-accounts) might automatically be added to your app.

Additionally, you can **Create an app without a use case** to obtain an app ID, but this app will not have any permissions, features, or products associated with it.

Once your app has been created, you can customize each use case, and add compatible use cases. If you choose to add additional use cases later, **_only compatible use cases are displayed._**

**Los casos de uso no pueden eliminarse** una vez que hayas creado la app. Puedes agregar casos de uso compatibles a una app preexistente, pero no puedes eliminar casos de uso una vez agregados.

### Available use cases

| Use Case | Description |
|----------|-------------|
| Crear y administrar anuncios sobre apps con el administrador de anuncios de Meta | Promociona tu app para celulares y aumenta las instalaciones. Crea y administra campañas que animen a los usuarios a descargar e instalar tu app. No incluye acceso a la API de marketing. |
| Anúnciate en tu app con Meta Audience Network | Únete a Meta Audience Network para monetizar tu app y aumentar tus ingresos con anuncios de los anunciantes de Meta. Obtén estadísticas con la API de informes. |
| Administrar productos con la API de catálogos | Administra los catálogos y los productos que quieres promocionar en las tecnologías de Meta. |
| Permite a los usuarios transferir sus datos a otras apps | Ofrece a los usuarios la posibilidad de transferir su información de las apps de Meta a otros servicios. |
| Autenticar y solicitar datos a usuarios con el inicio de sesión con Facebook | Nuestro caso de uso más común. Una forma segura y rápida de que los usuarios inicien sesión en tu app o juego y que la app les solicite permisos para acceder a sus datos para personalizar su experiencia. |
| Comparte o crea recaudaciones de fondos en Facebook e Instagram | Recauda dinero y llega a más personas con la API de recaudación de fondos de Meta. Crea o comparte campañas de recaudación de fondos existentes en Facebook e Instagram. |
| Lanzar un juego en Facebook | Lanza un juego que los jugadores puedan encontrar y jugar directamente en su feed o en conversaciones o mensajes, tanto en computadoras como en dispositivos móviles. |
| Administrar todos los aspectos de tu página | Publica contenido y videos, modera publicaciones y comentarios de seguidores en tu página y obtén estadísticas de interacción. |
| Acceder a la API de Threads | Usa la API de Threads y elige autenticar usuarios, recuperar información de usuarios, publicar hilos, responder hilos, administrar la configuración de respuesta o recopilar estadísticas para un perfil de Threads que poseas o administres en nombre de otros. |
| Unirte a ThreatExchange | Únete a ThreatExchange para compartir con otros miembros indicios sobre amenazas online, como terrorismo, malware, material sobre abuso sexual infantil y otro contenido dañino, y ayudar a mantener la seguridad de las personas en internet. |

### What are permissions and features?

**Permissions** are how your app asks someone if it can access their data stored on Meta's servers. [Learn more.](https://developers.facebook.com/docs/facebook-login/guides/permissions/)

**Features** are authorization mechanisms that allow your app to access specific endpoints that don’t require explicit consent from your app users in order to access the user’s data for a specific purpose. [Learn more.](https://developers.facebook.com/docs/features-reference/)

When customizing a use case, you will see a list of permissions and features that are available for the use case. A use case has permissions that are required for the use case to work properly. These required permissions can't be removed. A use case might also have optional permissions that you can add that provide additional functionality. Optional permissions can be added or removed at any time during development. **Only add optional permissions that your app needs in order to work the way you want it to.**

#### Use Case Permission Mapping

The following table shows you the permissions and features that are both required for a particular use case and additional, optional permissions and features that are available for that use case.

| Use Case | Required Permissions/Features | Optional Permissions/Features |
|----------|-------------------------------|-------------------------------|
| Acceder a la API de Threads | threads_basic | threads_read_replies, threads_manage_replies, threads_content_publish, threads_manage_insights, threads_keyword_search, threads_profile_discovery, threads_manage_mentions, threads_delete, threads_location_tagging |
| Administrar productos con la API de catálogos | public_profile, catalog_management | email |
| Administrar todos los aspectos de tu página | business_management, pages_show_list, public_profile | email, pages_read_engagement, pages_read_user_content, pages_manage_engagement, pages_manage_posts, pages_manage_metadata, read_insights, Business Asset User Profile Access, facebook_creator_marketplace_discovery, Live Video API |
| Anúnciate en tu app con Meta Audience Network | public_profile |  |
| Autenticar y solicitar datos a usuarios con el inicio de sesión con Facebook | public_profile | email, user_hometown, user_birthday, user_age_range, user_gender, user_link, user_friends, user_location, user_likes, user_photos, user_videos, user_posts |
| Comparte o crea recaudaciones de fondos en Facebook e Instagram | public_profile, manage_fundraisers | email |
| Lanzar un juego en Facebook | gaming_profile, gaming_user_picture | gaming_user_locale, email, Instant Games Zero Permission Access |
| Unirte a ThreatExchange |  | ThreatExchange |

### What is a business portfolio?

**A business portfolio allows organizations to bring their Facebook Pages, Instagram accounts, ad accounts, catalogs and other business assets together so you can manage them, and the people who access them, from one place using business tools such as Meta Business Suite and Business Manager.** [Learn more about business portfolios.](https://www.facebook.com/business/help/486932075688253)

If your app will access data that you don't own or manage, you must connect your app to a business portfolio. You can connect a business portfolio at any time during development.

#### What is a verified business?

To access certain products and features, Meta may ask you to verify your business. This process helps us confirm that your business portfolio belongs to a legitimate business or organization. Not all businesses need to or may have the option to complete verification. [Learn more about business verification.](https://www.facebook.com/business/help/1095661473946872)

### What is App Review?

App Review is the process that enables Meta to ensure that apps use Meta APIs, SDKs, and products appropriately. It is required if your app will be used by people without a role on your app or a role on the business that is connected to your app. [Learn more about App Review.](https://developers.facebook.com/docs/resp-plat-initiatives)

### App creation video

<div>
    <video class="_ox1 _21y0" data-video-height="300" data-video-width="533" height="300" width="533"></video>
    <div>
        <div>Se produjo un error</div>
        <div>Tenemos problemas para reproducir este video.</div>
        <div><a href="https://www.facebook.com/help/396404120401278/list">Más información</a></div>
    </div>
</div>

### App creation steps

#### Start

1. Navigate to **[https://developers.facebook.com/apps/creation/](https://developers.facebook.com/apps/creation/)** to begin the app creation process.

#### App details

1. Enter your **app’s name** and a **contact email address**.
2. Click **Next**.

#### Use cases

1. Select one or more use cases for your app. You can add additional, compatible use cases now or at any time during development.

   - **Incompatible use cases are greyed out.**
   - If you choose to add additional use cases later, only compatible use cases are displayed.
   - Some products, such as [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/) or [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-ad-accounts), might be automatically included in your use case.
   - If you need a use case not listed, select **Other** and follow the instructions in [our Other App Types guide](https://developers.facebook.com/docs/development/create-an-app/other-app-types).

2. Click **Next**.

#### Business

1. Select an option:

   - A verified business portfolio
   - An unverified business portfolio
   - **I don't want to connect a business portfolio yet.**
   - **Create a business portfolio**
     - Add your information in the pop-up.
     - You can submit your business portfolio for verification now, Meta's Business Manager will open in a new browser window, or later.
     - When complete, return to the dashboard and select your new business portfolio.

2. Click **Next**.

#### Requirements

Your app might need to complete certain requirements, such as [App Review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review/), to get and maintain data access for your app's use cases.

1. Click **Next**.

#### Overview

1. **Review** your app's details, use cases, connected business, and requirements.

   - If you need to make any changes, you can click **App details**, **Use cases**, **Business**, or **Requirements** at the top of the page or the **Previous** button in the lower-right.
   - You can also review the [Meta Platform Terms](https://developers.facebook.com/terms/) and [Developer Policies](https://developers.facebook.com/devpolicy/) by following the links at the bottom of the page.

2. Click **Go to dashboard** to finalize the app creation process.

You are redirected to the dashboard and can now customize each use case you've selected for your app.

### Troubleshooting

If you are unable to create an app, you might have reached the app limit. You are permitted to have a **developer or administrator role on a maximum of 15 apps** that are not already connected to a [Meta Verified Business Account](https://www.facebook.com/business/help/308979828303560). If you have reached the app limit and are unable to create an application or accept a new pending role, take the following steps in the dashboard:

- Connect a [verified business portfolio](https://developers.facebook.com/docs/development/release/business-verification) to any apps that are not already connected to one.
- Remove any old or unused apps – Archived apps count towards the app limit; if you no longer require these apps, we suggest removing them.
- Remove yourself as an administrator or developer from an app.

### Next Steps

**Customize your use cases:** Now that you have created your app, you can [customize your use cases](https://developers.facebook.com/docs/development/app-customization/).
```



## Page: https://developers.facebook.com/docs/development/release

```markdown
# Publicar

Después de completar [el desarrollo y las pruebas](https://developers.facebook.com/docs/development/build-and-test) de tu app, puedes publicarla. Es decir, hacer que la app esté disponible para las cuentas que no tienen un [rol](https://developers.facebook.com/docs/development/build-and-test/app-roles) en ella. En este documento, se enumeran los procesos y las opciones de configuración de la app que probablemente se necesiten para poder publicar una app en forma correcta.

Si los usuarios de tu app serán solo personas que tienen un rol en ella, no es necesario completar ninguno de estos procesos, porque la app ya está disponible para ellos.

Si ya publicaste una versión de tu app y quieres agregar alguna funcionalidad nueva que requiere completar el proceso de revisión de apps, sigue los pasos que se detallan en nuestras instrucciones de [revisión de apps para apps publicadas](https://developers.facebook.com/docs/app-review/introduction#app-review-for-live-apps).

## Revisión de apps

Si las personas que usarán tu app no tienen un rol en ella, la app debe completar el proceso de [revisión de apps](https://developers.facebook.com/docs/app-review).

Este proceso te permite solicitar la aprobación de [permisos](https://developers.facebook.com/docs/permissions/reference) y [funciones](https://developers.facebook.com/docs/apps/features-reference) específicos de la API que tu app necesita para funcionar correctamente. Los usuarios de la app que no tienen un rol en ella pueden otorgar a tu app solo los permisos aprobados mediante el proceso de revisión de apps, y solo las funciones aprobadas estarán activas para esos usuarios.

El proceso de revisión de apps requiere que identifiques cada uno de los permisos y las funciones que tu app necesita, describas el motivo por el que los necesita y nos muestres cómo tu app usa los datos devueltos o aceptados por nuestras API.

Obtén más información sobre el proceso de [revisión de apps](https://developers.facebook.com/docs/app-review).

## Verificación del negocio

La verificación del negocio es un proceso que nos permite verificar tu identidad como entidad comercial. Las apps que solicitan acceso avanzado de permisos y las que permiten a otras empresas acceder a sus propios datos deben estar conectadas a una empresa que haya completado el proceso de [verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification). Hasta entonces, los usuarios de la app de otras empresas no podrán otorgar permisos a estas apps y todas las funciones estarán inactivas.

Obtén más información sobre la [verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification).

## Transmite en vivo

Para que las personas que no tienen un rol en tu app la puedan usar, debes publicarla. Si es necesario que tu app pase la revisión de apps, debes completar el proceso correctamente antes de que las personas puedan usarla.

### Apps de casos de uso

Para publicar tu app de caso de uso, ve al panel de apps **Publicar > Activar** y haz clic en el botón **Activar**, que está en la esquina inferior izquierda.

### Tipos de apps

Debes cambiar tu app al modo [activo](https://developers.facebook.com/docs/development/build-and-test/app-modes) para poder solicitar permisos aprobados mediante el proceso de [revisión de apps](https://developers.facebook.com/docs/app-review) a los usuarios de la app que no tienen un rol en ella y a fin de que las funciones aprobadas estén activas para esos usuarios. Sin embargo, no debes cambiar al modo activo hasta que se hayan aprobado todos los permisos y las funciones que tu app requiere. Además, también debes completar la [verificación del negocio](https://developers.facebook.com/docs/development/release/business-verification) antes de hacerlo, si es necesario. Si cambias tu app al modo activo antes de tiempo, esta no podrá solicitar permisos no aprobados a sus usuarios y los permisos no aprobados estarán inactivos.

Las apps [para consumidores](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types#consumer) se comportan de manera algo diferente porque también utilizan [niveles de acceso](https://developers.facebook.com/docs/graph-api/overview/access-levels). Las apps para consumidores que están en el modo activo no pueden solicitar permisos con acceso estándar a los usuarios de la app que no tengan un [rol](https://developers.facebook.com/docs/development/build-and-test/app-roles) en ellas, y las funciones con acceso estándar estarán inactivas para estos usuarios.

Las apps de negocios no tienen modos de app y utilizan exclusivamente niveles de acceso.

### Publicación de nuevas versiones de apps activas

Si tu app ya está publicada y quieres agregar alguna funcionalidad nueva que requiere completar el proceso de revisión de apps, sigue los pasos que se detallan en nuestras instrucciones de [revisión de apps para apps publicadas](https://developers.facebook.com/docs/app-review/introduction#app-review-for-live-apps).

## Publicación limitada mediante restricción geográfica

Si quieres publicar tu app para un conjunto pequeño de usuarios antes de que esté disponible para todos, puedes configurar restricciones en la app de modo que solo esté disponible para los usuarios de ciertos grupos de edad y ubicaciones geográficas.

Obtén más información sobre las [restricciones en la app](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/advanced-settings#app-restrictions-settings).

## Más información

- [Roles de la app](https://developers.facebook.com/docs/development/build-and-test/app-roles)
- [Reclamar una app para tu empresa](https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/apps)
- [Productos de Facebook](https://developers.facebook.com/products)
- [Empresas en Facebook](https://business.facebook.com/business/)
```



## Page: https://developers.facebook.com/docs/development/terms-and-policies

```markdown
# Condiciones y políticas

Debes cumplir con nuestras [Condiciones de la plataforma](/terms) y [Políticas para desarrolladores](/devpolicy) a fin de poder seguir activo en nuestra plataforma. Por ese motivo, tómate el tiempo necesario para leerlas con detenimiento.

## Cumplimiento de normas

Si infringes alguna de nuestras condiciones o políticas, se aplicarán las políticas a tu app y, posiblemente, también a tu cuenta. Consulta nuestro documento sobre [cumplimiento de normas](/docs/development/terms-and-policies/enforcement) para obtener información sobre los protocolos de cumplimiento y para asegurarte de que podamos ponernos en contacto contigo si detectamos una infracción por parte de alguna de tus apps.
```