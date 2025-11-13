# API Documentation

**Source URL:** https://developers.facebook.com/docs/app-events/
**Scraped Date:** 2025-11-12 13:52:50

---



## Page: https://developers.facebook.com/docs/app-events/

```markdown
# Seguimiento de los eventos de la app de Meta

Los eventos de la app de Meta permiten que tu app o página web hagan seguimiento de eventos, como cuando una persona instala la app o completa una compra.

Para obtener información sobre el seguimiento de eventos de la app de los mensajes comerciales, consulta la [**API de eventos de la app para mensajes comerciales**](https://developers.facebook.com/docs/messenger-platform/analytics/messaging-events-api) en nuestra [documentación de la plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform).

## Usos comunes

- [Hacer seguimiento de los eventos en las apps para Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android)
- [Hacer seguimiento de los eventos en las apps para iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios)
- [Hacer seguimiento de eventos mediante los eventos de la app sin código](https://developers.facebook.com/docs/app-events/codeless-app-events)

## Contenido de la documentación

| Información general | Guías | Prácticas recomendadas |
|---------------------|-------|-----------------------|
| [Explicaciones acerca de los requisitos y el uso.](https://developers.facebook.com/docs/app-events/overview) | [Obtén información sobre cómo hacer seguimiento de eventos de la app específicos, cómo configurar el seguimiento de eventos sin código y más.](https://developers.facebook.com/docs/app-events/guides) | [Recomendaciones sobre cómo usar este producto de manera efectiva.](https://developers.facebook.com/docs/app-events/best-practices) |
| Primeros pasos | Referencia | Soporte |
| Tutoriales breves sobre cómo hacer seguimiento de los eventos de la app en tu plataforma. [Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android) | [Especificaciones de productos y referencias de puntos de conexión.](https://developers.facebook.com/docs/app-events/reference) | [Preguntas frecuentes sobre eventos de la app.](https://developers.facebook.com/docs/app-events/faq) |

---

### Síguenos

- [Meta for Developers](https://developers.meta.com/ai/)
- [Meta Horizon OS](https://developers.meta.com/horizon/)
- [Tecnologías sociales](https://developers.meta.com/social-technologies/)
- [Wearables](https://developer.meta.com/wearables/)

### Noticias

- [Meta for Developers](https://developers.meta.com/blog/)
- [Blog](https://developers.facebook.com/blog/)
- [Historias de éxito](https://developers.facebook.com/success-stories/)

### Ayuda

- [Ayuda para desarrolladores](https://developers.facebook.com/support/)
- [Herramienta de errores](https://developers.facebook.com/support/bugs/)
- [Estado de la plataforma](https://metastatus.com/)
- [Foro de la comunidad de desarrolladores](https://www.facebook.com/groups/fbdevelopers/)
- [Reportar un incidente](https://www.facebook.com/incident/report/)

### Condiciones y políticas

- [Iniciativas de plataforma responsable](https://developers.facebook.com/products/responsible-platform-initiatives/)
- [Condiciones de la plataforma](https://www.facebook.com/terms/)
- [Políticas para desarrolladores](https://www.facebook.com/devpolicy/)

© 2025 Meta
```



## Page: https://developers.facebook.com/docs/app-events/getting-started-app-events-android

```markdown
# Primeros pasos con los eventos de la app (Android)

En esta guía, te mostramos cómo agregar eventos a tu app nueva o preexistente, para lo cual debes integrar el SDK de Facebook y, luego, registrar estos eventos.

## Antes de empezar

Necesitarás lo siguiente:

- Una [cuenta de desarrollador de Meta](https://developers.meta.com/development) 
- Un [identificador de la app de Meta](https://developers.meta.com/development/create-an-app) 
- Una [cuenta publicitaria](https://www.facebook.com/ads/manager/accounts/) vinculada a tu app
- [Implementar el SDK de Facebook para Android](https://developers.facebook.com/docs/android/getting-started)

## Agregar eventos de la app

Después de que integras el SDK de Facebook, se registran y recopilan automáticamente determinados eventos de la app en el [administrador de eventos](https://www.facebook.com/events_manager), a menos que desactives el registro automático de eventos. Puedes cambiar esta configuración en el código de tu app o mediante el botón de activación de eventos de la app, ubicado en el panel de apps o en el administrador de eventos. Ten en cuenta que, en el caso de que haya valores contradictorios entre la marca `AutoLogAppEventsEnabled` y el botón de activación, prevalecerá el valor del botón de activación del "registro automático de eventos del SDK de Facebook". Para obtener información sobre qué información se recopila y cómo desactivar el registro de eventos de la app de manera automática, consulta [Registro automático de eventos de la app](https://www.developers.facebook.com/docs/app-events/automatic-event-collection-detail).

Hay tres maneras de hacer seguimiento de los eventos en tu app:

- [Eventos registrados de forma automática](#auto-events): las instalaciones de la app, los inicios de la app y las compras en la app se registran de forma automática en el SDK de Facebook.
- [Herramienta de eventos de la app sin código](https://developers.facebook.com/docs/app-events/codeless-app-events#android-integration): utiliza esta herramienta para agregar eventos estándar sin agregar código a tu app.
- [Eventos registrados de forma manual](#log-manually): agrega código a tu app para hacer un seguimiento de los eventos estándares y personalizados.

### Eventos registrados de forma automática

Cuando usas el SDK de Facebook, determinados eventos en tu app se registran y recopilan automáticamente para Facebook, a menos que desactives el registro automático de eventos. Estos eventos son relevantes para todos los casos de uso: segmentación, medición y optimización. Hay tres eventos clave que se recopilan como parte del registro automático de estos eventos: descarga de la app, inicio de la app y compra. Cuando el registro automático está activado, los anunciantes pueden desactivar estos eventos y otros eventos internos de Facebook, como los eventos de impresión de inicio de sesión. Sin embargo, si desactivaste el registro automático, pero quieres registrar eventos específicos (por ejemplo, eventos de instalación o de compra), debes implementar manualmente el registro de estos eventos en tu app.

| Evento                                    | Detalles                                                                                                                                                                                                                         |
|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Instalación de la app                     | La primera vez que una persona nueva activa tu app o que tu app se inicia en un dispositivo particular.                                                                                                                        |
| Inicio de la app                          | Cuando una persona inicia tu app, el SDK de Facebook se inicializa y se registra el evento. Sin embargo, si ocurre un segundo inicio de la app dentro de los 60 segundos del primero, no se registrará el segundo evento. En el caso del SDK de Facebook para Android versión 4.18 (y anteriores), la inicialización es un proceso manual diferente del registro manual de eventos que se describe en este documento. [Actualiza a la versión más reciente del SDK](https://developers.facebook.com/docs/app-events/upgrade-guide) o desplázate hasta la sección [Inicialización del SDK anterior](#legacy) para agregar eventos de forma manual. |
| Compras en la app                         | Registra automáticamente cuando se completa una compra procesada por Google Play. Si usas otras plataformas de pago, agrega manualmente el código del evento de compra. Para verificar que los eventos de compra en la aplicación se registran automáticamente, navega a **Básico > Tarjeta de configuración para Android** en el [panel de apps](https://developers.facebook.com/apps). Por el momento, el SDK para Android admite la versión 2 a la 7 de la biblioteca de Google Play Billing. Nota: Si quieres usar compras en la app para medir las conversiones de [anuncios dinámicos](https://www.facebook.com/business/m/one-sheeters/dynamic-ads), configura el identificador del producto en Apple App Store o Google Play Store para que sea equivalente al identificador del producto usado en el anuncio dinámico asociado. |
| Suscripciones en la app e inicio de la prueba | Registra automáticamente cuando se haya comprado una suscripción (o se haya iniciado un evento de prueba) procesada por Google Play. Se admite el registro automático de suscripciones en la app/inicio de la prueba para la biblioteca de Google Play Billing, desde la versión 5 a la 7. Para activar esta función, debes activar las compras en la app (arriba) y seguir [estas instrucciones](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/verification). |
| Informe de bloqueo del SDK de Facebook    | (para uso exclusivo de Facebook) Si tu app se bloqueó a causa del SDK de Facebook, se generará un informe de bloqueo, que se enviará a Facebook cuando se reinicie tu app. Este informe no incluye datos del usuario y ayuda a Facebook a garantizar la calidad y estabilidad del SDK. Para excluir el registro de este evento, [desactiva los eventos registrados de forma automática](#disable-auto-events). |
| Informe de ANR del SDK de Facebook        | (para uso exclusivo de Facebook) Si tu app tiene un mensaje de ANR (la aplicación no responde) a causa del SDK de Facebook, se generará un informe de ANR, que se enviará a Facebook cuando se reinicie tu app. Este informe no incluye datos del usuario y ayuda a Facebook a garantizar la calidad y estabilidad del SDK. Para excluir el registro de este evento, [desactiva los eventos registrados de forma automática](#disable-auto-events). |

#### Desactivar eventos registrados de forma automática

Para desactivar los eventos registrados de forma automática, agrega lo siguiente al archivo `AndroidManifest.xml`:

```xml
<application>
  ...
  <meta-data android:name="com.facebook.sdk.AutoLogAppEventsEnabled"
           android:value="false"/>
  ...
</application>
```

Es posible que, en algunos casos, prefieras demorar la recopilación de eventos registrados automáticamente en lugar de desactivarla (por ejemplo, para obtener el consentimiento del usuario o para cumplir con obligaciones legales). En este caso, llama al método `setAutoLogAppEventsEnabled()` de la clase `FacebookSDK` y configúralo en `true` para volver a activar el registro de eventos después de que el usuario final proporcionó su consentimiento.

```java
setAutoLogAppEventsEnabled(true);
```

Para volver a desactivar el registro, independientemente del motivo, configura el método `setAutoLogAppEventsEnabled()` en `false`.

```java
setAutoLogAppEventsEnabled(false);
```

También puedes desactivar el registro automático de eventos de compra en la app utilizando el [panel de apps](https://developers.facebook.com/apps). Ve a la **tarjeta para Android** en **Básico > Configuración** y cambia a **No**.

#### Desactivar la inicialización automática del SDK

Para desactivar la inicialización del SDK de forma automática, agrega lo siguiente al archivo `AndroidManifest.xml`:

```xml
<application>
  ...
  <meta-data android:name="com.facebook.sdk.AutoInitEnabled"
           android:value="false"/>
  ...
</application>
```

Es posible que, en algunos casos, prefieras demorar la inicialización del SDK en lugar de desactivarla (por ejemplo, para obtener el consentimiento del usuario o para cumplir con obligaciones legales). En este caso, llama al método de clase `setAutoInitEnabled` y configúralo en `true` para inicializar manualmente el SDK después de que el usuario final proporcionó su consentimiento.

```java
FacebookSdk.setAutoInitEnabled(true);
FacebookSdk.fullyInitialize();
```

#### Desactivar la recopilación de identificadores de anunciantes

Para desactivar la recopilación de `advertiser-id`, agrega lo siguiente al archivo `AndroidManifest.xml`:

```xml
<application>
  ...
  <meta-data android:name="com.facebook.sdk.AdvertiserIDCollectionEnabled"
           android:value="false"/>
  ...
</application>
```

Es posible que, en algunos casos, prefieras demorar la recopilación de `advertiser_id` en lugar de desactivarla (por ejemplo, para obtener el consentimiento del usuario o para cumplir con obligaciones legales). En este caso, llama al método `setAdvertiserIDCollectionEnabled()` de la clase `FacebookSDK` y configúralo en `true` para volver a activar la recopilación de `advertiser_id` después de que el usuario final proporcionó su consentimiento.

```java
setAdvertiserIDCollectionEnabled(true);
```

Para desactivar la recopilación, independientemente del motivo, configura el método `setAdvertiserIDCollectionEnabled()` en `false`.

```java
setAdvertiserIDCollectionEnabled(false);
```

### Eventos registrados de forma manual

Crea un objeto `AppEventsLogger` mediante los métodos de asistente para registrar eventos, donde `this` es la `Activity` de la que forma parte tu método.

```java
AppEventsLogger logger = AppEventsLogger.newLogger(this);
```

Después puedes registrar tu evento en `logger`, donde `AppEventConstants.EVENT_NAME_X` es una de las constantes que se muestran en la [tabla de eventos estándar](https://developers.facebook.com/docs/app-events/reference), o bien desde el código del [generador de códigos](#code-generator).

```java
logger.logEvent(AppEventsConstants.EVENT_NAME_X);
```

También puedes especificar un conjunto de parámetros en un `Bundle` y una propiedad de `valueToSum`, que es un número arbitrario que puede representar cualquier valor (por ejemplo, un precio o una cantidad). A la hora de informarse, todas las propiedades de `valueToSum` se sumarán. Por ejemplo, si diez personas compraron un artículo y cada artículo costó 10 USD (y se pasó en `valueToSum`), entonces los valores se sumarán para reportar un total de 100 USD.

```java
Bundle params = new Bundle();
params.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, "USD");
params.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "product");
params.putString(AppEventsConstants.EVENT_PARAM_CONTENT, "[{\"id\": \"1234\", \"quantity\": 2}, {\"id\": \"5678\", \"quantity\": 1}]");

logger.logEvent(AppEventsConstants.EVENT_NAME_PURCHASE, 54.23, params);
```

Para registrar un evento personalizado, pasa el nombre del evento como una cadena. Esta función supone que el registro del evento es una instancia de "AppEventsLogger" y que fue creada mediante la llamada "AppEventsLogger.newLogger()".

```java
public void logBattleTheMonsterEvent() {
    logger.logEvent("BattleTheMonster");
}
```

#### Parámetros de eventos

Cada evento puede registrarse con un `valueToSum` y un conjunto de hasta 25 parámetros. Los parámetros se pasan a través de un `Bundle`, donde la clave incluye el nombre del parámetro y el valor, que puede ser de tipo `String` o `int`. Si proporcionas otro tipo de valor que no es compatible, como `boolean`, el SDK registra una advertencia en `LogginBehavior.APP_EVENT`.

Consulta la [guía de referencia sobre los parámetros de los eventos estándar](https://developers.facebook.com/docs/app-events/reference#standard-event-parameters) para obtener más información sobre los parámetros que suelen utilizarse en los eventos estándar. La intención de estos parámetros es brindar orientación, aunque también puedes utilizar tus propios parámetros.

Si quieres usar eventos de la app para medir las conversiones de [anuncios dinámicos](https://www.facebook.com/business/m/one-sheeters/dynamic-ads), configura el parámetro `fb_content_id` para que sea el valor del identificador del producto usado en el anuncio dinámico asociado.

No uses "event" como nombre para un parámetro. No se registrarán los parámetros personalizados con el nombre "event". Usa otro nombre o agrégale un prefijo o sufijo, por ejemplo `my_custom_event`.

## Probar tu registro de eventos

Con el [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper/), puedes probar los eventos de la app a fin de asegurarte de que tu app envíe eventos a Facebook.

1. Abre el [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper/).
2. En **Seleccionar una app**, elige la app y haz clic en **Enviar**.
3. Ve a la parte inferior y selecciona **Probar eventos de la app**.
4. Inicia la app y envía un evento. El evento aparece en la página web.

### Activar registros de depuración

Activa los registros de depuración para verificar el uso de eventos de la app desde el lado del cliente. Los registros de depuración contienen respuestas en JSON y solicitudes detalladas. Para activar los registros de depuración, agrega el siguiente código después de inicializar el SDK de Facebook para Android:

```java
FacebookSdk.setIsDebugEnabled(true);
FacebookSdk.addLoggingBehavior(LoggingBehavior.APP_EVENTS);
```

Esta función tiene fines de depuración únicamente. Desactiva los registros de depuración antes de implementar la app públicamente.

## Más información

Para obtener más información y consejos útiles sobre los eventos de la app, consulta los siguientes recursos:

- [Documentación de referencia del SDK de Facebook para Android](https://developers.facebook.com/docs/reference/android/current/)
- [Guía de prácticas recomendadas](https://developers.facebook.com/docs/app-events/best-practices): descubre una amplia variedad de ejemplos de apps y cómo cada una administra los eventos.
- [Preguntas frecuentes](https://developers.facebook.com/docs/app-events/faq): consulta las preguntas frecuentes.
- [Administrador de anuncios](https://www.facebook.com/ads/manager): accede a información sobre tus anuncios.
- [Administrador de eventos](https://www.facebook.com/events_manager2): visualiza información sobre los eventos a los cuales les realizas un seguimiento.
- Curso de Meta Blueprint: [Configurar el SDK y eventos de la app para Android](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F253016%3Fcontent_id%3DSxoXN0m9KT8YHpA&h=AT1-pOBjapuS-KQ5vu7dIGTSzMceuEXQWlv84_aYGfabxeuxHxWcT4Qkc_Xcj_A6TxVceJl4EM5B3z6IEkkohI-WyTdAJnWEFpIxizwXyfujgwNp1dWke8Vo3_ayfvk8eKDXBbwAvl9osfS5F-Bm9GcP1I0)
- Curso de Meta Blueprint: [Usar eventos de la app para segmentar, optimizar y medir](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F253008%3Fcontent_id%3DFWxmTOIlbsCCDdg&h=AT05SHIhzFHgeOvegvE5Nt5Uwx_kfABYbl4agPtowq8TNw4BgGpHmnvK4LhrtBIe_WBvszLqk5lO5LdWRnDUllrVqCof58TT6uWp2DoZj4TdiVxgJuBq6WvlXBW7IPPOrcqsi8Ahjh8JgaNsJw1YwJ5IWLw)

### Ejemplos de apps

Creamos algunos ejemplos de distintos tipos de apps para mostrarte cómo puedes usar eventos de la app. Cada ejemplo de app ofrece un desglose por pantallas de distintos eventos con ejemplos de código. Es importante que tengas en cuenta que estos ejemplos son un punto de partida para tu app y que debes personalizarlos.

- [Comercio electrónico y comercio minorista](https://developers.facebook.com/docs/app-events/best-practices/ecom-and-retail)
- [Viajes (hoteles)](https://developers.facebook.com/docs/app-events/best-practices/travel-hotel)
- [Viajes (vuelos)](https://developers.facebook.com/docs/app-events/best-practices/travel-flight)
- [Juegos (casuales)](https://developers.facebook.com/docs/app-events/best-practices/gaming-casual)
- [Juegos (estrategia)](https://developers.facebook.com/docs/app-events/best-practices/gaming-strategy)
- [Juegos (casino)](https://developers.facebook.com/docs/app-events/best-practices/gaming-casino)
```



## Page: https://developers.facebook.com/docs/app-events/faq

```markdown
# Preguntas frecuentes

Después de que integras el SDK de Facebook, se registran y recopilan automáticamente determinados eventos de la app en el [administrador de eventos](https://www.facebook.com/events_manager), a menos que desactives el registro automático de eventos. Puedes cambiar esta configuración en el código de tu app o mediante el botón de activación de eventos de la app, ubicado en el panel de apps o en el administrador de eventos. Ten en cuenta que, en el caso de que haya valores contradictorios entre la marca `AutoLogAppEventsEnabled` y el botón de activación, prevalecerá el valor del botón de activación del "registro automático de eventos del SDK de Facebook". Para obtener información sobre qué información se recopila y cómo desactivar el registro de eventos de la app de manera automática, consulta [Registro automático de eventos de la app](https://www.developers.facebook.com/docs/app-events/automatic-event-collection-detail).

## Limitaciones

### ¿Cuántos tipos de eventos puede registrar una app?

Una app puede crear hasta 1000 nombres de eventos únicos. Si excedes este límite, es posible que veas el error `100 Invalid parameter` cuando intentes registrar un nuevo evento.

Si necesitas eliminar eventos obsoletos, puedes desactivarlos siguiendo las instrucciones de nuestro [servicio de ayuda](https://www.facebook.com/help/analytics/817787101653736).

Un motivo típico por el que los desarrolladores sobrepasan los límites de eventos es que registran eventos diferentes en situaciones en las que podrían aprovechar los parámetros. Por ejemplo, en lugar de registrar un evento separado para cada ocasión en la que alguien complete un nivel (p. ej., "Nivel alcanzado 1", "Nivel alcanzado 2", etc.), el desarrollador debería registrar un único evento *Nivel alcanzado* con un parámetro `level` para indicar el número de nivel.

### ¿Cuántos parámetros puedo agregar a un evento?

An event can have up to 25 parameters. This doesn't just mean for each call, but for all invocations using that event name.

If you need to remove obsolete parameters - you can deactivate parameters by following the instructions in our [help center](https://www.facebook.com/help/analytics/817787101653736).

### ¿Existe una limitación en la cantidad de caracteres que se usan en nombres o parámetros de eventos?

Los nombres o parámetros de eventos deben tener entre 2 y 40 caracteres alfanuméricos.

El valor de cada parámetro no puede superar los 100 caracteres.

## Implementación

### ¿Qué plataformas admiten los eventos de la app?

Los eventos de la app proporcionan SDK para los siguientes canales: [iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios), [Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android), [juegos en Facebook](https://developers.facebook.com/docs/app-events/) y [Unity](https://developers.facebook.com/docs/unity/reference/current/fb.appevents.logevent). Además, los eventos de la app permiten pasar eventos de servidor a servidor a través de la [API Graph](https://developers.facebook.com/docs/marketing-api/mobile-conversions-endpoint/).

### ¿Debo implementar el inicio de sesión con Facebook en mi app para recopilar eventos de la app?

No se requiere implementar el [inicio de sesión con Facebook](https://developers.facebook.com/docs/facebook-login) ni otras funciones de canal para recopilar eventos de la app.

### ¿Los eventos de la app pueden capturar mis eventos específicos?

Puedes definir eventos personalizados que quieras capturar y podrás verlos en tu panel de [Facebook Analytics](https://www.facebook.com/analytics/?__aref_src=devsite&__aref_id=docs_app-events_faq). Permitimos el registro de hasta 1.000 nombres de eventos personalizados y no establecemos límites para el volumen de eventos. Sin embargo, en los informes publicitarios, solo mostraremos los eventos estándar de la app. Los eventos personalizados de la app que hayas creado se registrarán como "Acciones de otro tipo en la app para celulares".

### ¿Cómo puedo hacer un seguimiento de los eventos de la app en apps híbridas (implementación doble en iOS y Android)?

En el caso de los juegos de Unity, puedes usar el [SDK para Unity](https://developers.facebook.com/docs/unity/reference/current/fb.appevents.logevent) a fin de registrar eventos de la app. En otros canales en los que se utilice una vista web dentro de una app nativa, una opción sería utilizar la [API de eventos de la app](https://developers.facebook.com/docs/reference/ads-api/mobile-conversions-endpoint) para pasar eventos de tu servidor a los servidores de Facebook.

### ¿Debo usar el SDK o la API de Facebook (de servidor a servidor) para pasar eventos de la app?

Normalmente, para los desarrolladores resulta más sencillo usar el SDK de Facebook en la integración de eventos de la app. El SDK de Facebook reduce la cantidad de código que necesitas escribir y te brinda metadatos útiles sobre tu app, como la versión y el nombre de esta. Aplicar el SDK proporciona, de forma automática y con un mínimo desarrollo, métricas como el tiempo empleado, el número de sesiones y las interrupciones. El SDK también puede recopilar el identificador del anunciante de Android o el IDFA (si usas eventos de la app combinados con atribución de anuncios) y maneja la limitación de seguimiento de anuncios. Sin embargo, la limitación del SDK consiste en que debes enviar una nueva versión de tu app si decides agregar eventos. Para la mayoría de los desarrolladores, la opción del SDK es la mejor.

La solución de la API puede ser una mejor opción para desarrolladores que no quieran tener que enviar una versión actualizada de su app para integrar o agregar eventos de esta. Para los desarrolladores que crean apps web híbridas, la integración con la API también puede ser más sencilla. Sin embargo, en el caso de la solución de la API, debes manejar tú mismo la limitación de seguimiento de anuncios y la recopilación de IDFA e identificadores del anunciante de Android. A su vez, no proporciona las métricas de uso de apps que el SDK recopila de forma automática. Los desarrolladores que deseen hacer un seguimiento de métricas adicionales, como la versión o el nombre de la app, el tiempo empleado, el número de sesiones y las interrupciones, deberán determinar dichas métricas por su cuenta y pasarlas nuevamente como parámetros personalizados a través de la API.

### ¿Puedo implementar eventos de la app si uso un Mobile Measurement Partner (MMP)?

Si usas un [MMP](https://www.facebook.com/business/marketing-partners/) para hacer un seguimiento de las instalaciones u otras acciones en tu app, puedes solicitarle que pase esos eventos a Facebook.

### ¿Puedo contar con un MMP y el SDK de Facebook en mi app?

Puedes usar un SDK de MMP y un SDK de Facebook en tu app, pero debes asegurarte de no pasar el mismo evento dos veces para ambos porque esto podría generar un doble conteo.

### ¿Puedo enviar solo las instalaciones a través del SDK del MMP y los demás eventos a través del SDK de Facebook?

Sí, puedes hacerlo si lo deseas.

### ¿Cómo puedo verificar la integración de los eventos de mi app?

Con el [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper/), puedes probar los eventos de la app a fin de asegurarte de que envíe eventos a Facebook.
1. Abre el [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper/).
2. En "Selecciona una app", elige tu app y selecciona "Enviar".
3. Ve hasta la parte inferior y selecciona "Probar eventos de la app".
4. Inicia la app y envía un evento. El evento aparece en la página web.

### ¿De qué manera usa Facebook los datos que proporciono a través del SDK o de la API?

Facebook maneja tus datos conforme a su [política de datos](https://www.facebook.com/policy.php). Esta información podría usarse para mejorar nuestras funciones de segmentación y entrega de anuncios, además de otras experiencias en Facebook, como las que ofrecen el feed y las funciones de clasificación de contenido de búsqueda.

### ¿Cuáles son los problemas más comunes que experimentan los desarrolladores al integrar eventos de apps?

- Olvidar pasar la moneda o el valor de una compra o de un evento relacionado con una compra
- Colocar el separador decimal en el lugar equivocado
- Usar una coma en lugar de un punto como separador decimal en un valor numérico
- Codificar valores de conversión estimando el valor de pedido "promedio" en lugar de pasar el valor real

## Preguntas sobre anuncios

### ¿Por qué no puedo ver el desglose de los eventos de mi app en los informes publicitarios?

Si registras un evento personalizado en lugar de un evento estándar, se mostrará en el informe publicitario en "Acciones de otro tipo en la app para celulares" y no se desglosará.

### ¿Se pueden usar eventos de la app para generar públicos para segmentación de anuncios?

Sí, puedes crear públicos personalizados usando eventos de la app. Encontrarás instrucciones para hacerlo [aquí](https://developers.facebook.com/docs/ads-for-apps/mobile-app-custom-audiences/).

### ¿Puedo optimizar los anuncios con eventos de la app pujando por eventos específicos?

Sí, entregamos tus anuncios a las personas que tienen más probabilidades de realizar una acción específica al menos una vez, con el menor costo. Crea un conjunto de anuncios de instalación de aplicaciones para celulares para un evento de la app específico a través de la API. Esto es similar a un conjunto de anuncios de instalación de la aplicación para celulares o de interacción con la aplicación para celulares habitual, excepto por lo siguiente:
- `optimization_goal`: se establece en **OFFSITE_CONVERSIONS**.
- `billing_event`: se establece en **IMPRESSIONS**.
- `promoted_object`: establece `custom_event_type` en el evento de la app que quieras optimizar.

En el caso de los anuncios de interacción con aplicaciones para celulares, optimiza los eventos de la app estándar, a excepción del inicio de la aplicación. Estas opciones están disponibles en el administrador de anuncios y en la API. Consulta [API de marketing, Conjunto de anuncios](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign).

## Registro automático de compras en la app

### ¿Cómo activo el registro automático de eventos de compra en la app para Android?

Primero, asegúrate de tener instalada en tu app la versión 4.36 o posterior del SDK de Facebook Core para Android. Luego, ve a **Configuración > Básica** en el [panel de tu app](https://developers.facebook.com/apps). En la configuración de Android, mueve el botón de activación **Registrar automáticamente eventos de compra en la app** a **Sí**.

![Configuración de eventos de compra](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/20992275_471552213215053_8008997693500162048_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e280be&_nc_ohc=__jtvsgxKEcQ7kNvwEcirY5&_nc_oc=Adl4WV_9_SGA95KjDINIY2FG-j_zxbJdsgGgqYfQwyuNz8nxWD8kXXjp7qwcG6cJpVs&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=FAXV79SClmKKl1X-17UmWQ&oh=00_AfiqjeM9scF90fdRL5Vs3IJLVaSsNHnlAQFc7RnJ4jiEsA&oe=692F0962)

En las versiones 4.27 o 4.35, asegúrate de llamar a [`callbackManager.onActivityResult()`](https://developers.facebook.com/docs/app-events/android) durante la activación de la app y activar el botón **Compras en la app automáticas** en la sección de configuración de Android del [panel de tu app](https://developers.facebook.com/apps).

### ¿Cómo activo el registro automático de eventos de compra en la app para iOS?

First, ensure you have v3.22 (or higher) of the Facebook iOS SDK installed within your app. Second, ensure you are calling the [`ActivateApp` method](https://developers.facebook.com/docs/ios/app-events).

### ¿Dónde se encuentra la configuración para activar el registro automático de compras en la app de mi app para Android?

1. Ve a ["Mis apps"](https://developers.facebook.com/apps).
2. Selecciona tu app.
3. Haz clic en la pestaña de configuración, en el panel de navegación izquierdo.
4. Busca la sección correspondiente a Android.
5. Configura **Registrar automáticamente eventos de compra en la app para Android** en **Sí**.

### ¿Dónde se encuentra la configuración para activar el registro automático de compras en la app de mi app para iOS?

1. Ve a ["Mis apps"](https://developers.facebook.com/apps).
2. Selecciona tu app.
3. Haz clic en la pestaña de configuración, en el panel de navegación izquierdo.
4. Busca la sección correspondiente a iOS.
5. Activa el botón "Registrar automáticamente los eventos de compra en la app para iOS".

### ¿Qué eventos se registran a través del registro automático de eventos de compra en la app?

Al activar el cambio para el registro de compras en la app, se realizará un seguimiento de estos eventos de la app: inicio de finalización de compra, compra y cancelación de compra.

### ¿Por qué tiene sentido usar el registro automático como alternativa a registrar los eventos de forma explícita?

El registro automático reduce el tiempo necesario para registrar los eventos de apps con precisión. Evitas hacer manualmente el trabajo de recopilar los eventos y determinar los parámetros que se pasarán, ya que el sistema lo hará por ti. Por ejemplo, los siguientes parámetros se registran de forma automática: identificador de producto, cantidad, monto total, moneda, título de producto y descripción de producto. A su vez, si usas la versión 3.22 o una posterior, puedes activar esto de forma automática sin necesidad de enviar un cliente actualizado al App Store.

### ¿Qué sucede si ya registro las compras que se realizan en mi app?

Si ya registras las compras en la app, no es necesario activar esta función. No obstante, si quieres adoptar esta funcionalidad, te conviene dejar de registrar explícitamente los eventos de compras en la app. Si no lo haces, es posible que veas registros duplicados en tus informes.

### ¿Esto funciona en el caso de compras que no se consideren como compras en la app?

No, solo se aplica a compras en la app.

### Si activé el registro automático de compras en la app, ¿puedo seguir registrando eventos adicionales?

We recommend logging all events that are relevant to your app. You can use this [best practices guide](https://developers.facebook.com/docs/app-events/best-practices) as a starting point to determine what events would be relevant for your business.

### ¿Cómo desactivo el registro automático de compras en la app?

Para desactivar el registro automático de compras en la app, consulta nuestra [guía introductoria sobre eventos de la app para iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events) o nuestra [guía introductoria sobre eventos de la app para Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android#disable-auto-events).
```



## Page: https://developers.facebook.com/docs/app-events/reference

```markdown
# Facebook App Events Reference

## Android

### Standard Events

| Nombre del evento: Valor AppEventsConstants | Parámetros | Descripción |
|---------------------------------------------|------------|-------------|
| Alcanzar nivel: `EVENT_NAME_ACHIEVED_LEVEL` | `LEVEL` | Alcance de niveles específicos que defines en tu aplicación, empresa u organización. |
| Activar aplicación: `EVENT_NAME_ACTIVATED_APP` | | Inicio de la aplicación. |
| Clic en el anuncio en una aplicación: `EVENT_NAME_AD_CLICK` | `AD_TYPE` | Clic en un anuncio de una plataforma de terceros dentro de tu aplicación. |
| Impresión del anuncio en la aplicación: `EVENT_NAME_AD_IMPRESSION` | `AD_TYPE` | Anuncio de una plataforma de terceros que aparece en la pantalla dentro de tu aplicación. |
| Agregar información de pago: `EVENT_NAME_ADDED_PAYMENT_INFO` | `SUCCESS` | Información de pago del cliente que se agrega durante un proceso de pago. |
| Agregar al carrito: `EVENT_NAME_ADDED_TO_CART`<br><i>valueToSum: Precio del artículo agregado</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Artículo que se agrega a un carrito. Por ejemplo, hacer clic en el botón "Agregar al carrito" en un sitio web. |
| Agregar a la lista de deseos: `EVENT_NAME_ADDED_TO_WISHLIST`<br><i>valueToSum: Precio del artículo agregado</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Artículos que se agregan a una lista de deseos. Por ejemplo, hacer clic en el botón "Agregar a la lista de deseos" en un sitio web. |
| Completar registro: `EVENT_NAME_COMPLETED_REGISTRATION` | `REGISTRATION_METHOD` | Información que envía un cliente a cambio de un servicio que tu empresa brinda. Por ejemplo, registrarse para recibir correo electrónico. |
| Completar tutorial: `EVENT_NAME_COMPLETED_TUTORIAL` | `SUCCESS` y `CONTENT_ID` o `CONTENT` | Completar un tutorial en tu aplicación. |
| Contactar: `EVENT_NAME_CONTACT` | | Un teléfono o SMS, correo electrónico, chat u otro tipo de contacto entre un cliente y tu empresa. |
| Personalizar producto: `EVENT_NAME_CUSTOMIZE_PRODUCT` | | Personalizar productos mediante una herramienta de configuración u otra aplicación que sea propiedad de tu empresa. |
| Donar: `EVENT_NAME_DONATE` | | Donar fondos a tu organización o causa. |
| Encontrar ubicación: `EVENT_NAME_FIND_LOCATION` | | Una persona encuentra una de tus ubicaciones en la web o la aplicación con la intención de visitarla. Por ejemplo, buscar un producto y encontrarlo en una de tus tiendas locales. |
| Iniciar pago: `EVENT_NAME_INITIATED_CHECKOUT`<br><i>valueToSum: Precio total de los artículos en el carrito</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, `NUM_ITEMS`, `PAYMENT_INFO_AVAILABLE`, y `CURRENCY` | Iniciar un proceso de pago. |
| Comprar: `EVENT_NAME_PURCHASED`<br><i>valueToSum: Precio de compra</i> | `NUM_ITEMS`, `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Completar una compra, lo que suele indicarse al recibir la confirmación de un pedido o una compra, o un recibo de la transacción. |
| Calificar: `EVENT_NAME_RATED`<br><i>valueToSum: Calificación otorgada</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `MAX_RATING_VALUE` | Calificar algún elemento en tu aplicación, empresa u organización. Por ejemplo, calificar un restaurante en una aplicación para calificar restaurantes. |
| Programar: `EVENT_NAME_SCHEDULE` | | Concertar una cita para visitar una de tus ubicaciones. |
| Buscar: `EVENT_NAME_SEARCHED` | `CONTENT_TYPE`, `SEARCH_STRING` y `SUCCESS` | Realizar una búsqueda en tu sitio web, aplicación u otra herramienta que sea de tu propiedad (por ejemplo, buscar productos, viajes, etc.). |
| Créditos gastados: `EVENT_NAME_SPENT_CREDITS`<br><i>valueToSum: Valor total de los créditos gastados</i> | `CONTENT_TYPE` y `CONTENT_ID` o `CONTENT` | Completar una transacción en la que las personas gasten créditos específicos de tu empresa y aplicación, como la divisa obtenida en la aplicación. |
| Iniciar prueba: `EVENT_NAME_START_TRIAL`<br><i>valueToSum: Precio de la suscripción</i> | `ORDER_ID` y `CURRENCY` | Iniciar una prueba gratuita de un producto o servicio que ofreces, como una suscripción de prueba. |
| Enviar solicitud: `EVENT_NAME_SUBMIT_APPLICATION` | | Enviar una solicitud de un producto, servicio o programa que ofrezcas, como una tarjeta de crédito, un programa educativo o un trabajo. |
| Suscribirte: `EVENT_NAME_SUBSCRIBE`<br><i>valueToSum: Precio de la suscripción</i> | `ORDER_ID` y `CURRENCY` | Iniciar una suscripción paga a un producto o servicio que ofreces. |
| Desbloquear logro: `EVENT_NAME_UNLOCKED_ACHIEVEMENT` | `DESCRIPTION` | Completar actividades o acciones específicas que quieras recompensar en tu aplicación, empresa u organización. Por ejemplo, sugerir a un amigo, completar el perfil, etc. |
| Ver contenido: `EVENT_NAME_VIEWED_CONTENT`<br><i>Precio del artículo visualizado (si corresponde)</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Visitar una página de contenido que te interesa, como una página de producto o de destino, o un artículo. La información sobre la página visitada se puede transmitir a Facebook para usarla en anuncios dinámicos. |

### Standard Event Parameters

| AppEventConstants::EVENT_PARAM_* | Possible Values | Description |
|------------------------------------|-----------------|-------------|
| Ad Type:<br>`EVENT_PARAM_AD_TYPE` | `string` | Type of ad: *banner*, *interstitial*, *rewarded_video*, *native* |
| Content ID:<br>`EVENT_PARAM_CONTENT_ID` | `string` | International Article Number (EAN) when applicable, or other product or content identifier |
| Content:<br>`EVENT_PARAM_CONTENT` | `string` | A list of JSON object that contains the International Article Number (EAN) when applicable, or other product or content identifier(s) as well as additional information about the products. `id` and `quantity` are the available fields. e.g. "[{\"id\": \"1234\", \"quantity\": 2}, {\"id\": \"5678\", \"quantity\": 1}]" |
| Content Type:<br>`EVENT_PARAM_CONTENT_TYPE` | `string` | 'product' or 'product_group' |
| Currency:<br>`EVENT_PARAM_CURRENCY` | `string` | ISO 4217 code, e.g., "EUR", "USD", "JPY" |
| Description:<br>`EVENT_PARAM_DESCRIPTION` | `string` | A string description |
| Level:<br>`EVENT_PARAM_LEVEL` | `string` | Level of a game |
| Max. Rating Value:<br>`EVENT_PARAM_MAX_RATING_VALUE` | `int` | Upper bounds of a rating scale, for example 5 on a 5 star scale |
| Number of Items:<br>`EVENT_PARAM_NUM_ITEMS` | `int` | Number of items |
| Order ID:<br>`EVENT_PARAM_ORDER_ID` | `string` | The unique ID for all events within a subscription |
| Payment Info Available:<br>`EVENT_PARAM_PAYMENT_INFO_AVAILABLE` | `1` or `0` | `1` for yes, `0` for no |
| Registration Method:<br>`EVENT_PARAM_REGISTRATION_METHOD` | `string` | Facebook, Email, Twitter, etc. |
| Search String:<br>`EVENT_PARAM_SEARCH_STRING` | `string` | The text string that was searched for |
| Success:<br>`EVENT_PARAM_SUCCESS` | `1` or `0` | `1` for yes, `0` for no |

## iOS

### Conexión de App Store para iOS 14

Es posible que los eventos que tu app recopila y envía a Facebook requieran que divulgues esos tipos de datos en el cuestionario de App Store Connect. Es tu responsabilidad asegurarte de que esto se vea reflejado en la Política de privacidad de tu app. Visita el [artículo Detalles de privacidad de la App Store de Apple](https://developer.apple.com/app-store/app-privacy-details/) para obtener información sobre los tipos de datos que tendrás que divulgar.

### Standard Events

| Event Name: FBSDKAppEventName | Parameters | Description |
|-------------------------------|------------|-------------|
| Achieve Level: `FBSDKAppEventNameAchievedLevel` | `Level` | The achievement of specific levels you define within your application, business or organization. |
| Activate App: `FBSDKAppEventNameActivatedApp` | | The launch of your app. |
| In-App Ad Click: `FBSDKAppEventNameAdClick` | `AdType` | An ad from a third-party platform is clicked within your app. |
| In-App Ad Impression: `FBSDKAppEventNameAdImpression` | `AdType` | An ad from a third-party platform appears on-screen within your app. |
| Add Payment Info: `FBSDKAppEventNameAddedPaymentInfo` | `Success` | The addition of customer payment information during a checkout process. |
| Add to Cart: `FBSDKAppEventNameAddedToCart`<br><i>valueToSum: Price of item added</i> | `ContentType`, `ContentID` or `Content`, and `Currency` | The addition of an item to a shopping cart or basket. For example, clicking an Add to Cart button on a website. |
| Add to Wishlist: `FBSDKAppEventNameAddedToWishlist`<br><i>valueToSum: Price of item added</i> | `ContentType`, `ContentID` or `Content`, and `Currency` | The addition of items to a wishlist. For example, clicking an Add to Wishlist button on a website. |
| Complete Registration: `FBSDKAppEventNameCompletedRegistration` | `RegistrationMethod` | A submission of information by a customer in exchange for a service provided by your business. For example, sign up for an email subscription. |
| Complete Tutorial: `FBSDKAppEventNameCompletedTutorial` | `Success`, and `ContentID` or `Content` | A completion of a tutorial on your app. |
| Contact: `FBSDKAppEventNameContact` | | A telephone or SMS, email, chat or other type of contact between a customer and your business. |
| Customize Product: `FBSDKAppEventNameCustomizeProduct` | | The customization of products through a configuration tool or other application your business owns. |
| Donate: `FBSDKAppEventNameDonate` | | The donation of funds to your organization or cause. |
| Find Location: `FBSDKAppEventNameFindLocation` | | When a person finds one of your locations via web or app, with an intention to visit. For example, searching for a product and finding it at one of your local stores. |
| Initiate Checkout: `FBSDKAppEventNameInitiatedCheckout`<br><i>valueToSum: Total price of items in cart</i> | `ContentType`, `ContentID` or `Content`, `NumItems`, `PaymentInfoAvailable`, and `Currency` | The start of a checkout process. |
| Purchase: `FBSDKAppEventNamePurchased`<br><i>valueToSum: Purchase price</i> | `NumItems`, `ContentType`, `ContentID` or `Content`, and `Currency` | The completion of a purchase, usually signified by receiving order or purchase confirmation or a transaction receipt. |
| Rate: `FBSDKAppEventNameRated`<br><i>valueToSum: Rating given</i> | `ContentType`, `ContentID` or `Content`, and `MaxRatingValue` | A rating of something within your app, business or organization. For example, rates a restaurant within a restaurant review app. |
| Schedule: `FBventNameSchedule` | | The booking of an appointment to visit one of your locations. |
| Search: `FBSDKAppEventNameSearched` | `ContentType`, `SearchString`, and `Success` | A search performed on your website, app or other property, such as product searches, travel searches, etc. |
| Spent Credits: `FBSDKAppEventNameSpentCredits`<br><i>valueToSum: Total value of credits spent</i> | `ContentType`, and `ContentID` or `Content` | The completion of a transaction where people spend credits specific to your business or application, such as in-app currency. |
| Start Trial: `FBSDKAppEventNameStartTrial`<br><i>valueToSum: Total value of credits spent</i> | `OrderID` and `Currency` | The start of a free trial of a product or service you offer, such as a trial subscription. |
| Submit Application: `FBSDKAppEventNameSubmitApplication` | | The submission of an application for a product, service or program you offer, such as a credit card, educational program or job. |
| Subscribe: `FBSDKAppEventNameSubscription` | | The start of a paid subscription for a product or service you offer. |
| Unlock Achievement: `FBSDKAppEventNameUnlockedAchievement` | `Description` | The completion of specific activities or actions you want to reward within your application, business or organization. For example, refer a friend, complete your profile, etc. |
| View Content: `FBSDKAppEventNameViewedContent`<br><i>valueToSum: Price of item viewed (if applicable)</i> | `ContentType`, `ContentID` or `Content`, and `Currency` | A visit to a content page you care about, such as a product page, landing page or article. Information about the page viewed can be passed to Facebook for use in Advantage+ catalog ads. |

### Standard Event Parameters

| Parameter: FBSDKAppEventParameterName | Possible Values | Description |
|----------------------------------------|-----------------|-------------|
| Ad Type: `FBSDKAppEventParameterNameAdType` | `string` | Type of ad: *banner*, *interstitial*, *reward_video*, *native* |
| Content: `FBSDKAppEventParameterNameContent` | `string` | A list of JSON object that contains the International Article Number (EAN) when applicable, or other product or content identifiers and additional information about the products. `id` and `quantity` are the available fields. e.g. "[{\"id\": \"1234\", \"quantity\": 2}, {\"id\": \"5678\", \"quantity\": 1}]" |
| Content ID: `FBSDKAppEventParameterNameContentID` | `string` | International Article Number (EAN) when applicable, or other product or content identifier |
| Content Type: `FBSDKAppEventParameterNameContentType` | `string` | `product` or `product_group` |
| Currency: `FBSDKAppEventParameterNameCurrency` | `string` | ISO 4217 code, for example, `EUR`, `USD`, `JPY` |
| Description: `FBSDKAppEventParameterNameDescription` | `string` | A string description |
| Level: `FBSDKAppEventParameterNameLevel` | `string` | Level of a player |
| Max. Rating Value: `FBSDKAppEventParameterNameMaxRatingValue` | `int` | Upper bounds of a rating scale, for example `5` on a `5` star scale |
| Number of Items: `FBSDKAppEventParameterNameNumItems` | `int` | Number of items |
| Order ID: `FBSDKAppEventParameterNameOrderID` | `string` | The unique ID for all events within a subscription |
| Payment Info Available: `FBSDKAppEventParameterNamePaymentInfoAvailable` | `1` or `0` | `1` for yes, `0` for no |
| Registration Method: `FBSDKAppEventParameterNameRegistrationMethod` | `string` | Facebook, Email, Twitter, etc. |
| Search String: `FBSDKAppEventParameterNameSearchString` | `string` | The string that was searched for |
| Success: `FBSDKAppEventParameterNameSuccess` | `1` or `0` | `1` for yes, `0` for no |

## Web

### Standard Events

| Nombre del evento: Valor AppEventsConstants | Parámetros | Descripción |
|---------------------------------------------|------------|-------------|
| Alcanzar nivel: `EVENT_NAME_ACHIEVED_LEVEL` | `LEVEL` | Alcance de niveles específicos que defines en tu aplicación, empresa u organización. |
| Activar aplicación: `EVENT_NAME_ACTIVATED_APP` | | Inicio de la aplicación. |
| Clic en el anuncio en una aplicación: `EVENT_NAME_AD_CLICK` | `AD_TYPE` | Clic en un anuncio de una plataforma de terceros dentro de tu aplicación. |
| Impresión del anuncio en la aplicación: `EVENT_NAME_AD_IMPRESSION` | `AD_TYPE` | Anuncio de una plataforma de terceros que aparece en la pantalla dentro de tu aplicación. |
| Agregar información de pago: `EVENT_NAME_ADDED_PAYMENT_INFO` | `SUCCESS` | Información de pago del cliente que se agrega durante un proceso de pago. |
| Agregar al carrito: `EVENT_NAME_ADDED_TO_CART`<br><i>valueToSum: Precio del artículo agregado</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Artículo que se agrega a un carrito. Por ejemplo, hacer clic en el botón "Agregar al carrito" en un sitio web. |
| Agregar a la lista de deseos: `EVENT_NAME_ADDED_TO_WISHLIST`<br><i>valueToSum: Precio del artículo agregado</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Artículos que se agregan a una lista de deseos. Por ejemplo, hacer clic en el botón "Agregar a la lista de deseos" en un sitio web. |
| Completar registro: `EVENT_NAME_COMPLETED_REGISTRATION` | `REGISTRATION_METHOD` | Información que envía un cliente a cambio de un servicio que tu empresa brinda. Por ejemplo, registrarse para recibir correo electrónico. |
| Completar tutorial: `EVENT_NAME_COMPLETED_TUTORIAL` | `SUCCESS` y `CONTENT_ID` o `CONTENT` | Completar un tutorial en tu aplicación. |
| Contactar: `EVENT_NAME_CONTACT` | | Un teléfono o SMS, correo electrónico, chat u otro tipo de contacto entre un cliente y tu empresa. |
| Personalizar producto: `EVENT_NAME_CUSTOMIZE_PRODUCT` | | Personalizar productos mediante una herramienta de configuración u otra aplicación que sea propiedad de tu empresa. |
| Donar: `EVENT_NAME_DONATE` | | Donar fondos a tu organización o causa. |
| Encontrar ubicación: `EVENT_NAME_FIND_LOCATION` | | Una persona encuentra una de tus ubicaciones en la web o la aplicación con la intención de visitarla. Por ejemplo, buscar un producto y encontrarlo en una de tus tiendas locales. |
| Iniciar pago: `EVENT_NAME_INITIATED_CHECKOUT`<br><i>valueToSum: Precio total de los artículos en el carrito</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, `NUM_ITEMS`, `PAYMENT_INFO_AVAILABLE`, y `CURRENCY` | Iniciar un proceso de pago. |
| Comprar: `EVENT_NAME_PURCHASED`<br><i>valueToSum: Precio de compra</i> | `NUM_ITEMS`, `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Completar una compra, lo que suele indicarse al recibir la confirmación de un pedido o una compra, o un recibo de la transacción. |
| Calificar: `EVENT_NAME_RATED`<br><i>valueToSum: Calificación otorgada</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `MAX_RATING_VALUE` | Calificar algún elemento en tu aplicación, empresa u organización. Por ejemplo, calificar un restaurante en una aplicación para calificar restaurantes. |
| Programar: `EVENT_NAME_SCHEDULE` | | Concertar una cita para visitar una de tus ubicaciones. |
| Buscar: `EVENT_NAME_SEARCHED` | `CONTENT_TYPE`, `SEARCH_STRING` y `SUCCESS` | Realizar una búsqueda en tu sitio web, aplicación u otra herramienta que sea de tu propiedad (por ejemplo, buscar productos, viajes, etc.). |
| Créditos gastados: `EVENT_NAME_SPENT_CREDITS`<br><i>valueToSum: Valor total de los créditos gastados</i> | `CONTENT_TYPE` y `CONTENT_ID` o `CONTENT` | Completar una transacción en la que las personas gasten créditos específicos de tu empresa y aplicación, como la divisa obtenida en la aplicación. |
| Iniciar prueba: `EVENT_NAME_START_TRIAL`<br><i>valueToSum: Precio de la suscripción</i> | `ORDER_ID` y `CURRENCY` | Iniciar una prueba gratuita de un producto o servicio que ofreces, como una suscripción de prueba. |
| Enviar solicitud: `EVENT_NAME_SUBMIT_APPLICATION` | | Enviar una solicitud de un producto, servicio o programa que ofrezcas, como una tarjeta de crédito, un programa educativo o un trabajo. |
| Suscribirte: `EVENT_NAME_SUBSCRIBE`<br><i>valueToSum: Precio de la suscripción</i> | `ORDER_ID` y `CURRENCY` | Iniciar una suscripción paga a un producto o servicio que ofreces. |
| Desbloquear logro: `EVENT_NAME_UNLOCKED_ACHIEVEMENT` | `DESCRIPTION` | Completar actividades o acciones específicas que quieras recompensar en tu aplicación, empresa u organización. Por ejemplo, sugerir a un amigo, completar el perfil, etc. |
| Ver contenido: `EVENT_NAME_VIEWED_CONTENT`<br><i>Precio del artículo visualizado (si corresponde)</i> | `CONTENT_TYPE`, `CONTENT_ID` o `CONTENT`, y `CURRENCY` | Visitar una página de contenido que te interesa, como una página de producto o de destino, o un artículo. La información sobre la página visitada se puede transmitir a Facebook para usarla en anuncios dinámicos. |

### Standard Event Parameters

| AppEventConstants::EVENT_PARAM_* | Possible Values | Description |
|------------------------------------|-----------------|-------------|
| Ad Type:<br>`EVENT_PARAM_AD_TYPE` | `string` | Type of ad: *banner*, *interstitial*, *rewarded_video*, *native* |
| Content ID:<br>`EVENT_PARAM_CONTENT_ID` | `string` | International Article Number (EAN) when applicable, or other product or content identifier |
| Content:<br>`EVENT_PARAM_CONTENT` | `string` | A list of JSON object that contains the International Article Number (EAN) when applicable, or other product or content identifier(s) as well as additional information about the products. `id` and `quantity` are the available fields. e.g. "[{\"id\": \"1234\", \"quantity\": 2}, {\"id\": \"5678\", \"quantity\": 1}]" |
| Content Type:<br>`EVENT_PARAM_CONTENT_TYPE` | `string` | 'product' or 'product_group' |
| Currency:<br>`EVENT_PARAM_CURRENCY` | `string` | ISO 4217 code, e.g., "EUR", "USD", "JPY" |
| Description:<br>`EVENT_PARAM_DESCRIPTION` | `string` | A string description |
| Level:<br>`EVENT_PARAM_LEVEL` | `string` | Level of a game |
| Max. Rating Value:<br>`EVENT_PARAM_MAX_RATING_VALUE` | `int` | Upper bounds of a rating scale, for example 5 on a 5 star scale |
| Number of Items:<br>`EVENT_PARAM_NUM_ITEMS` | `int` | Number of items |
| Order ID:<br>`EVENT_PARAM_ORDER_ID` | `string` | The unique ID for all events within a subscription |
| Payment Info Available:<br>`EVENT_PARAM_PAYMENT_INFO_AVAILABLE` | `1` or `0` | `1` for yes, `0` for no |
| Registration Method:<br>`EVENT_PARAM_REGISTRATION_METHOD` | `string` | Facebook, Email, Twitter, etc. |
| Search String:<br>`EVENT_PARAM_SEARCH_STRING` | `string` | The text string that was searched for |
| Success:<br>`EVENT_PARAM_SUCCESS` | `1` or `0` | `1` for yes, `0` for no |
```



## Page: https://developers.facebook.com/docs/app-events/getting-started

```markdown
# Get Started

This guide explains how to track app events in your mobile apps and web pages.

## Android

The [Get Started for Android guide](https://developers.facebook.com/docs/app-events/getting-started-app-events-android) explains how to implement the Facebook SDK into your app and track actions taken by your users in your app.

## iOS

The [Get Started for iOS guide](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios) explains how to implement the Facebook SDK into your app and track actions taken by your users in your app.

## Unity

The [Get Started for Unity guide](https://developers.facebook.com/docs/app-events/unity) explains how to implement the Facebook SDK into your app and track actions taken by your users in your app.
```



## Page: https://developers.facebook.com/docs/app-events/codeless-app-events

```markdown
# Eventos de la app sin código

Los eventos de la app sin código, una función introducida en la versión 4.34, permiten usar el [administrador de eventos](https://www.facebook.com/events_manager2) para agregar o eliminar eventos de la app sin implementar código ni lanzar una nueva versión.

## Android

### Requisitos

Debes contar con alguno de los siguientes:

- [SDK de Facebook para SDK, versión 4.34 completa o posterior](https://developers.facebook.com/docs/android)
- [SDK de Facebook para Android, versión 4.38 principal o posterior](https://developers.facebook.com/docs/android/componentsdks)
- [SDK de Facebook para Android, versión principal 4.34 a v4.37](https://developers.facebook.com/docs/android/componentsdks) y el kit de marketing

Consulta la [Guía de primeros pasos de los eventos de la app para Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android#1--integrate-the-facebook-sdk-in-your-android-app) a fin de instalar la versión más reciente del SDK de Facebook para Android, la [Guía de actualización](https://developers.facebook.com/docs/app-events/upgrade-guide) para actualizar el SDK a la versión más reciente o, si ya instalaste la versión 4.34 a 4.37, abre `<your_app> | Gradle Scripts | build.gradle (Module: app)` y agrega lo siguiente a la sección `dependencies{}` para agregar el kit de marketing.

```javascript
implementation 'com.facebook.android:facebook-marketing:[4,5)'
```

No olvides volver a compilar tu proyecto.

### Implementar la función de eventos de la app sin código

Para activar el evento de depuración sin código, agrega las siguientes líneas en `AndroidManifest.xml`:

```xml
<meta-data
    android:name="com.facebook.sdk.CodelessDebugLogEnabled"
    android:value="true" />
```

### Agregar eventos de la app

Ve al [administrador de eventos](https://www.facebook.com/events_manager2) para agregar sin código los eventos de la app que quieras someter a seguimiento.

1. En el administrador de eventos, haz clic en **Agregar nuevo origen de datos** y selecciona **Eventos de la app** en el menú desplegable.
2. Haz clic en **Usar nuestra herramienta de configuración de eventos sin código** y selecciona la aplicación a la cual quieres agregar eventos.
3. Elige una plataforma. Para ello, haz clic en **Iniciar configuración**.
4. Si esta es la primera vez que visitas el proceso sin código, encontrarás un tutorial breve. Después del tutorial, abre una nueva sesión de la app en tu dispositivo móvil.
5. Agita el teléfono hasta que aparezca una versión de la app.
6. Haz clic en cualquier elemento para agregar un evento de la app. Ve a diferentes páginas de la app para seleccionar elementos.
7. Haz clic en **Guardar** en el menú emergente. Si no quieres agregar el evento, haz clic en "Cancelar".
8. Cuando hayas agregado todos los eventos, haz clic en **Revisar y finalizar**.
9. Haz clic en **Eventos de prueba** o en "Guardar y salir".

**Nota:** Es posible que los eventos demoren hasta 30 minutos en aparecer en el administrador.

### Verificar la integración

Ve al [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper).

- **Selecciona una app** y haz clic en **Enviar**.
- Desplázate hasta la sección **Herramientas para desarrolladores** y haz clic en **Probar eventos de la app**.
- Si tu app envía eventos `fb_codeless_debug`, los eventos de prueba seleccionados aparecerán en la tabla.

![Verificación de integración](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/39915454_998417577007233_305777237406253056_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=twQKPh90PiwQ7kNvwEc1HQn&_nc_oc=AdlpHub4qW8Mx9y6CPB1IhWc3_pRUss7-s5BWn7iKSQ5YGy79Lns16cIxF_9g0YWSwY&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=y1Nr1oQk4dq0Gr9pbFulvQ&oh=00_AfiiwiIuNWDVZyh5ZYdZ7pUWwLeTdjB4rwa4zPr9Rr8WtA&oe=692F04E1)

**Nota:** Funciona únicamente con la [versión 4.35 del SDK de Facebook](https://developers.facebook.com/docs/android) y versiones posteriores.

## iOS

### Requisitos

- SDK de Facebook para iOS versión 4.34 a 7.1.1
- SDK principal de Facebook para iOS versión 4.38 a 7.1.1
- SDK principal de Facebook para iOS versión 4.34-4.37 a 7.1.1 y el kit de marketing

### Limitaciones

- La función no está disponible para la versión 8.0.0 o posteriores. [Más información.](https://www.facebook.com/business/help/224499601682892?id=1716638325041491)

Consulta la [Guía de primeros pasos de los eventos de la app para iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#dev-env-setup) a fin de instalar la versión más reciente del SDK para iOS, la [Guía de actualización](https://developers.facebook.com/docs/app-events/upgrade-guide) para actualizar el SDK a la versión más reciente o, si instalaste únicamente la versión 4.34 a 4.37 del SDK, agrega lo siguiente a tu Podfile para incluir el kit de marketing.

```ruby
pod 'FBSDKMarketingKit'
```

No olvides ejecutar `pod update` y, después, `pod install --repo-update`.

### Implementar la función de eventos de la app sin código

Activa el registro de eventos de depuración sin código. Para ello, abre el `.plist` de la app como código en Xcode y agrega el siguiente XML al diccionario de propiedades:

```xml
<key>FacebookCodelessDebugLogEnabled</key>
<true/>
```

### Agregar eventos de la app

#### Conexión de App Store para iOS 14

Es posible que los eventos que tu app recopila y envía a Facebook requieran que divulgues esos tipos de datos en el cuestionario de App Store Connect. Es tu responsabilidad asegurarte de que esto se vea reflejado en la Política de privacidad de tu app. Visita el [artículo Detalles de privacidad de la App Store de Apple](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Fapp-store%2Fapp-privacy-details%2F&h=AT2h-4h0ruYbrS75UjQ6Z-drfToJBjjOIIAh1ejdG17Mf8QRXpVXbWLFGiZUfpwHZCmfiNCEhBqwxvKniTpmpMp8-ovND-k8quk-gtNvUUJu6HdfUcjasFO35IwFg4L0IXUgn1nvYeyVMVe-wN3HyMvEplw) para obtener información sobre los tipos de datos que tendrás que divulgar.

Ve al [administrador de eventos](https://www.facebook.com/events_manager2) para agregar sin código los eventos de la app que quieras someter a seguimiento.

1. En el administrador de eventos, haz clic en **Agregar origen de datos** y selecciona **Eventos de la app** en el menú desplegable.
2. Haz clic en **Usar nuestra herramienta de configuración de eventos sin código** y selecciona la app a la cual quieres agregar eventos.
3. Elige una plataforma. Para ello, haz clic en **Iniciar configuración**.
4. Si esta es la primera vez que visitas el proceso sin código, encontrarás un tutorial breve. Después del tutorial, abre una nueva sesión de la app en tu dispositivo móvil.
5. Agita el teléfono hasta que aparezca una versión de la app.
6. Haz clic en cualquier elemento para agregar un evento de la app. Ve a diferentes páginas de la app para seleccionar elementos.
7. Haz clic en **Guardar** en el menú emergente. Si no quieres agregar el evento, haz clic en "Cancelar".
8. Cuando hayas agregado todos los eventos, haz clic en **Revisar y finalizar**.
9. Haz clic en **Eventos de prueba** o en "Guardar y salir".

**Nota:** Es posible que los eventos demoren hasta 30 minutos en aparecer en el administrador.

### Verificar la integración

Ve al [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper).

- **Selecciona una app** y haz clic en **Enviar**.
- Ve a la parte inferior y elige **Prueba de eventos de la app**.
- Si tu app envía eventos `fb_codeless_debug`, se enumeran en la tabla.

![Verificación de integración](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/39981837_1107156549442280_6458955240598142976_n.png?_nc_cat=107&ccb=1-7&_nc_sid=e280be&_nc_ohc=rraRRMNbEqsQ7kNvwH33Txf&_nc_oc=AdmG8HdNlGpTTKGXTsi8CTlUWX9hXtFeQrCoVLhuSk0jxDlfrK7dMWrvLm2cd-buICI&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=y1Nr1oQk4dq0Gr9pbFulvQ&oh=00_Afjs7uwrtT5dmGAJL-CIndjyUWcTEXCz1MM0rDNK5i7bEA&oe=692F16B1)

## Unity

Solicitamos el [SDK de Facebook para](https://developers.facebook.com/docs/unity) versión 4.34 o posterior.

Consulta la [Guía de primeros pasos del SDK de Facebook para Unity](https://developers.facebook.com/docs/unity/gettingstarted) a fin de instalar la versión más reciente de este SDK y sigue la configuración específica de la plataforma para [Unity iOS](https://developers.facebook.com/docs/unity/getting-started/ios) o [Unity Android](https://developers.facebook.com/docs/unity/getting-started/android).

### Activar eventos de la app sin código

Para activar esta opción, en `Unity Editor`, selecciona `Facebook | Edit Settings`, y, luego, `Auto Logging App Events`:

![Activar eventos](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.8562-6/60722857_2181689982143873_8543837927782744064_n.png?_nc_cat=103&ccb=1-7&_nc_sid=f537c7&_nc_ohc=fF0EvoXGVtwQ7kNvwEdaf43&_nc_oc=AdnUUNU8dWz2ZU3P4uIbmMzTBIAkQ34na5GHRQfpu0zsLGN75KTK92WtEa2SKZNxyA8&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=y1Nr1oQk4dq0Gr9pbFulvQ&oh=00_Afh4zoRhQGHJucEgjgQwy1OKkw8TSHC_A7GkIhEobq0cwA&oe=691A89FB)

### Agregar eventos de la app

Ya puedes agregar eventos de la app con el [administrador de eventos](https://www.facebook.com/events_manager2):

1. En `Add Data Source`, selecciona `App Events`.
2. Haz clic en `User our codeless event setup tool`.
3. Selecciona la app a la que quieras agregar eventos.
4. Haz clic en `Start Setup` para seleccionar tu plataforma. Si esta es la primera vez que visitas el proceso sin código, encontrarás un tutorial breve.
5. Después del tutorial, abre una nueva sesión de la app en tu dispositivo móvil.
6. Agita el dispositivo móvil hasta que aparezca una versión de tu app.
7. Haz clic en algún elemento de la app para agregar un evento. Ve a diferentes páginas de la app para seleccionar elementos.
8. En `Unity Editor`, haz clic en `Save` para agregar el evento.
9. Después de agregar todos los eventos, haz clic en `Review and Finish`.
10. Haz clic en `Test Events` o `Save and Exit`.

**Es posible que los eventos demoren hasta 30 minutos en aparecer en el administrador de eventos.** Repite estos pasos en cada plataforma, como iOS o Android, que tu juego admita.

### Verificar la integración

Ve al [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper).

- En `Select an App`, haz clic en `Submit`.
- Elige `App Events Tester`.
- Si tu app envía eventos `fb_codeless_debug`, estos aparecen en la tabla.

![Verificación de integración](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/39981837_1107156549442280_6458955240598142976_n.png?_nc_cat=107&ccb=1-7&_nc_sid=e280be&_nc_ohc=rraRRMNbEqsQ7kNvwH33Txf&_nc_oc=AdmG8HdNlGpTTKGXTsi8CTlUWX9hXtFeQrCoVLhuSk0jxDlfrK7dMWrvLm2cd-buICI&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=y1Nr1oQk4dq0Gr9pbFulvQ&oh=00_Afjs7uwrtT5dmGAJL-CIndjyUWcTEXCz1MM0rDNK5i7bEA&oe=692F16B1)

## Preguntas frecuentes

### GENERAL

**1. ¿Cómo puedo comprobar si la función sin código está correctamente integrada?**

Unos minutos después de lanzar tu app en el dispositivo de prueba, verás eventos con el nombre `fb_codeless_debug` en el [administrador de eventos](#).

**2. ¿Cómo desactivo la función de eventos de la app sin código?**

Para desactivar los eventos de la app sin código, usa la herramienta de configuración de eventos sin código y elimina todos los eventos.

---

### Android

**1. ¿Qué hago si veo el siguiente error de desarrollo?**

```plaintext
Android SDK build Error: Execution failed for task ':app:processDebugManifest'.
Manifest merger failed : 
Attribute activity#com.facebook.FacebookActivity@theme value=(@android:style/Theme.Translucent.NoTitleBar) 
from AndroidManifest.xml:69:13-72 is also present at [com.facebook.android:facebook-android-sdk:4.16.0] 
AndroidManifest.xml:32:13-63 value=(@style/com_facebook_activity_theme).
Suggestion: add 'tools:replace="android:theme"' to <activity> element at AndroidManifest.xml:66:9-70:47 to override.
```

Agrega lo siguiente al elemento `manifest` en tu archivo `AndroidManifest.xml`:

```xml
<manifest xmlns:tools="http://schemas.android.com/tools">
  ...
</manifest>
```

Y agrega lo siguiente al elemento `activity`:

```xml
<activity
  tools:replace="android:theme">
  ...
</activity>
```

---

### iOS

**1. ¿Qué hago si veo la siguiente advertencia?**

```plaintext
[!] Unable to find a specification for FBSDKMarketingKit
```

Ejecuta `pod update` y, luego, `pod install --repo-update`.
```



## Page: https://developers.facebook.com/docs/app-events/best-practices

```markdown
# Guía de prácticas recomendadas para eventos de la app

Los eventos de la app te permiten [medir las conversiones relacionadas con los anuncios de Facebook](https://developers.facebook.com/docs/ads-for-apps/measurement) y [crear públicos](https://developers.facebook.com/docs/ads-for-apps/mobile-app-custom-audiences/) para captar nuevos usuarios y volver a interactuar con los usuarios anteriores.

## Cómo usar esta guía

Antes de escribir el código para integrar los eventos de la app, te recomendamos que te tomes unos minutos para pensar qué eventos clave quieres registrar en la app y qué parámetros relacionados con esos eventos quieres recopilar. Este documento servirá de punto de partida para ayudar a los desarrolladores y especialistas en marketing a determinar qué eventos y parámetros deben registrarse con los eventos de la app.

1. Obtén información sobre las [diferencias entre eventos y parámetros](#EventsParameters).
2. Busca la [app de ejemplo](#category) más similar a tu app y úsala como guía para determinar qué eventos y parámetros registrar, pero no dudes en agregar eventos y parámetros personalizados que sean relevantes para tu app.
3. Crea una lista finalizada de eventos y parámetros relevantes para tu app.
4. Integra eventos de la app basados en tu lista con la siguiente documentación de cada canal:
   - [iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios)
   - [Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android)
   - [Juegos en Facebook](https://developers.facebook.com/docs/app-events/gamesonfacebook)
   - [Unity](https://developers.facebook.com/docs/unity/reference/current/fb.appevents.logevent)
   - [API](https://developers.facebook.com/docs/reference/ads-api/mobile-conversions-endpoint/)
5. **Por último, no olvides verificar tus eventos y parámetros antes de enviar una actualización a Google Play o App Store de iOS. Para ello, sigue los pasos de verificación que se detallan en los documentos específicos de cada una de las plataformas anteriores.**

## Diferencias entre eventos y parámetros

Un área típica de confusión de los desarrolladores que utilizan eventos de la app por primera vez es la diferencia entre eventos y parámetros.

- Un **evento** es una acción que realiza una persona en tu app, como *nivel alcanzado*, *artículo agregado al carrito* o *compra realizada*.
- Un **parámetro** es un dato específico de un evento, como *nivel 3* o *3,72 USD*.

Por ejemplo, *nivel alcanzado* es un evento, y *nivel 3* y *puntuación* son dos parámetros que pueden asociarse a ese evento.

Se admiten hasta 1.000 nombres de eventos diferentes. Nota: Los eventos no pueden eliminarse y no se registrarán tipos nuevos de eventos una vez alcanzado este límite. Obtén más información sobre los límites de eventos en las [preguntas frecuentes](https://developers.facebook.com/docs/app-events/faq#limits).

## Cumplimiento del RGPD

Cuando usas el SDK de FB para eventos de la app, nuestras condiciones comerciales establecen que debes contar con bases jurídicas apropiadas para recopilar y procesar la información de los usuarios. Según el RGPD y otras regulaciones sobre protección de datos de la UE, es necesario que obtengas el consentimiento del usuario final antes de enviar los datos mediante nuestro SDK. Por este motivo, debes asegurarte de que la implementación del SDK cumpla con estos requisitos relacionados con el consentimiento.

Consulta nuestra [guía sobre cumplimiento del RGPD](https://developers.facebook.com/docs/app-events/best-practices/gdpr-compliance) para obtener más información.

## Apps de ejemplo de eventos de la app por categoría

Creamos algunas guías para diferentes tipos de app con el objetivo de que te resulte más fácil ver cómo puedes utilizar los eventos en tu app.

- [Comercio electrónico y comercio minorista](https://developers.facebook.com/docs/app-events/best-practices/ecom-and-retail)
- [Viajes (hoteles)](https://developers.facebook.com/docs/app-events/best-practices/travel-hotel)
- [Viajes (vuelos)](https://developers.facebook.com/docs/app-events/best-practices/travel-flight)
- [Juegos (casuales)](https://developers.facebook.com/docs/app-events/best-practices/gaming-casual)
- [Juegos (estrategia)](https://developers.facebook.com/docs/app-events/best-practices/gaming-strategy)
- [Juegos (casino)](https://developers.facebook.com/docs/app-events/best-practices/gaming-casino)

Es importante que tengas en cuenta que estas guías deben usarse como punto de partida para tu app y deben personalizarse. Cada una de las apps de ejemplo ofrece un desglose por pantallas de diferentes eventos y parámetros que pueden recopilarse. Al final de cada sección, hay una tabla en la que se enumeran los eventos y parámetros recomendados por cada app. Además, de ser necesario, puedes crear tus propios eventos y parámetros.
```



## Page: https://developers.facebook.com/docs/app-events/getting-started-app-events-ios

```markdown
# Primeros pasos con los eventos de la app en iOS

En esta guía, te mostramos cómo agregar eventos a tu app nueva o preexistente, para lo cual debes integrar el SDK de Facebook y, luego, registrar estos eventos.

Se han realizado cambios en el SDK de Facebook para iOS. Te recomendamos actualizar el SDK de Facebook para iOS a la nueva versión. Consulta la [sección "Consentimiento del dispositivo"](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#consent) para obtener más información acerca de este cambio.

## Antes de empezar

Necesitarás lo siguiente:

- Una [cuenta de desarrollador de Facebook](https://developers.facebook.com/apps) 
- Una [cuenta publicitaria de Facebook](https://adsmanager.facebook.com/)
- Un [portfolio comercial de Facebook](https://business.facebook.com/) (si no tienes uno, crea uno nuevo)
- Una [app de Facebook](https://developers.facebook.com/docs/apps)

## Paso 1: Configurar tu app de Facebook

Ve al [panel de apps](https://developers.facebook.com/apps), haz clic en **Mis apps** y crea una nueva app si todavía no tienes una. Ve a **Configuración** > **Aspectos básicos** para visualizar el panel de **detalles de la app** con tu **identificador de la app**, tu **clave secreta de la app** y otra información acerca de tu app.

Desplázate hasta la parte inferior de la página y haz clic en **Agregar plataforma**. Elige **iOS**, agrega los detalles de tu app y guarda los cambios.

Configura la app para que admita publicidad incorporando la siguiente información:

- **Dominios de la app**: proporciona la URL de la App Store de Apple de la app.
- **URL de la política de privacidad**: proporciona una URL de la [Política de privacidad](https://en.wikipedia.org/wiki/Privacy_policy). *Obligatorio para que la app sea pública.*
- **URL de las condiciones del servicio**: proporciona una URL de las [Condiciones del servicio](https://en.wikipedia.org/wiki/Terms_of_service).
- **Plataforma**: desplázate hasta la parte inferior del panel de configuración para agregar la plataforma de iOS.

![Configuración de la app](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/72141044_475195150002972_921159971188506624_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=d6h9ISiWZS8Q7kNvwHub2c2&_nc_oc=AdkwHscsn_ONlW5p1mglnEk-sFHVlEP10pyiMsMzq8zYNzWgUG8FMY7dq4uujtrlGu0&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=tL-qlP_uGo2C66p2ZEGhXw&oh=00_Afj19p9xoI6gk0TagaZYlbTQ5n5BUzB9xH4R1gVr3UrQzw&oe=692F035A)

Para obtener más información sobre cómo agregar información a tu app (por ejemplo, un ícono o una categoría), visita la [documentación sobre el desarrollo de apps](https://developers.facebook.com/docs/apps/register#app-settings).

## Paso 2: Vincular tus portfolios publicitarios y comerciales

Para poner anuncios en circulación y medir las instalaciones en el [administrador de anuncios](https://www.facebook.com/ads/manager), asocia al menos una [cuenta publicitaria](https://www.facebook.com/ads/manager/accounts/) y un [portfolio comercial](https://business.facebook.com/) a tu app.

1. En el [panel de apps](https://developers.facebook.com/apps/), haz clic en **Configuración > Opciones avanzadas**.
2. En **Identificadores de cuentas publicitarias autorizadas**, agrega los identificadores de tus cuentas. Puedes obtener estos identificadores en el [administrador de anuncios](https://www.facebook.com/ads/manager/accounts/).
3. En el panel **Cuentas publicitarias**, haz clic en **Empezar** y sigue las instrucciones para conectar la app a un negocio.

## Paso 3: Configurar el entorno de desarrollo

El siguiente procedimiento utiliza el administrador de paquetes de Swift para configurar el entorno de desarrollo en Xcode.

1. En Xcode, haz clic en **File > Add Packages...**.
2. En el campo de búsqueda que aparece, ingresa la URL del repositorio: [https://github.com/facebook/facebook-ios-sdk](https://github.com/facebook/facebook-ios-sdk).
3. En **Dependency Rule**, selecciona **Up to Next Major Version** e ingresa una versión reciente. La versión más reciente figura en [https://github.com/facebook/facebook-ios-sdk/releases/](https://github.com/facebook/facebook-ios-sdk/releases/).
4. Selecciona las bibliotecas que utilizarás y los destinos adonde quieres agregar dichas bibliotecas.
5. Haz clic en **Add Package** para completar la configuración.

## Paso 4: Registrar y configurar tu app en Facebook

Agrega tu identificador del paquete y activa el inicio de sesión único de tu app.

El identificador del paquete debe aparecer en el siguiente cuadro. Si no es así, busca el identificador del paquete en "iOS Application Target" del proyecto Xcode y pégalo en el cuadro siguiente.

**Identificador del paquete**: Si lo deseas, puedes cambiar este identificador más adelante en la sección "iOS" de la página de configuración.

Activar el inicio de sesión único: Para activar el inicio de sesión único en tu app, configura la opción "Inicio de sesión único" en "Sí".

## Paso 5: Configurar el proyecto

Configura el archivo `Info.plist` con un fragmento de XML que contiene datos sobre tu app.

Después de que integras el inicio de sesión con Facebook, se registran y recopilan automáticamente determinados eventos de la app en el [administrador de eventos](https://www.facebook.com/events_manager), a menos que desactives el registro automático de eventos. Para obtener información sobre qué información se recopila y cómo desactivar el registro de eventos de la app de manera automática, consulta [Registro automático de eventos de la app](https://developers.facebook.com/docs/app-events/automatic-event-collection-detail).

1. Haz clic con el botón derecho en `info.plist` y elige **Open As ▸ Source Code**.
2. Copia y pega el siguiente fragmento de código XML en el cuerpo de tu archivo (`<dict>...</dict>`).

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fbAPP-ID</string>
    </array>
  </dict>
</array>
<key>FacebookAppID</key>
<string>APP-ID</string>
<key>FacebookClientToken</key>
<string>CLIENT-TOKEN</string>
<key>FacebookDisplayName</key>
<string>APP-NAME</string>
```

En `<array><string>` de la clave `[CFBundleURLSchemes]`, reemplaza `[APP-ID]` con el identificador de la app. En `<string>` de la clave `FacebookAppID`, reemplaza `[APP-ID]` con el identificador de la app. En `<string>` de la clave `FacebookClientToken`, reemplaza `CLIENT-TOKEN` con el valor encontrado en **Configuración** > **Avanzado** > **Token del cliente** del panel de apps. En `<string>` de la clave `FacebookDisplayName`, reemplaza `[APP-NAME]` por el nombre de la app.

Para usar los cuadros de diálogo de Facebook (por ejemplo, inicio de sesión, contenido compartido, invitaciones a la app, etc.) con los que se puede cambiar de una app a las apps de Facebook, el archivo `Info.plist` de tu solicitud también debe incluir la siguiente información:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
</array>
```

Es posible configurar directamente la recopilación automática de eventos de la app en "verdadero" o "falso" si se agrega `FacebookAutoLogAppEventsEnabled` como clave en `Info.plist`.

El proyecto deberá incluir la función "Keychain Sharing" para que el inicio de sesión funcione en las apps de Mac Catalyst.

1. Selecciona el botón **+ Capability** en la pestaña **Signing & Capabilities** cuando configures el objetivo de la app.
2. Busca y selecciona la función **Keychain Sharing**.
3. Asegúrate de que la función **Keychain Sharing** esté disponible para el objetivo.

## Paso 6: Conectar el delegado de la app y el delegado de escena

Reemplaza el código en el método `AppDelegate.swift` con el siguiente código. Este código inicializa el SDK cuando se inicia tu app y permite al SDK administrar inicios de sesión y compartir contenido desde la app nativa de Facebook cuando inicias sesión o compartes algo. De lo contrario, el usuario debe iniciar sesión en Facebook a fin de usar el navegador de la app para iniciar sesión.

```swift
// AppDelegate.swift
import UIKit
import FacebookCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        ApplicationDelegate.shared.application(
            application,
            didFinishLaunchingWithOptions: launchOptions
        )

        return true
    }

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
        ApplicationDelegate.shared.application(
            app,
            open: url,
            sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
            annotation: options[UIApplication.OpenURLOptionsKey.annotation]
        )
    }
}
```

iOS 13 movió la funcionalidad de la URL de apertura a `SceneDelegate`. Si usas iOS 13, agrega el siguiente método a `SceneDelegate` para que las operaciones como el inicio de sesión o el uso compartido funcionen según lo previsto:

```swift
// SceneDelegate.swift
import FacebookCore
...
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else {
        return
    }

    ApplicationDelegate.shared.application(
        UIApplication.shared,
        open: url,
        sourceApplication: nil,
        annotation: [UIApplication.OpenURLOptionsKey.annotation]
    )
}
```

## Paso 7: Agregar eventos de la app

Hay tres maneras de hacer seguimiento de los eventos en tu app:

- [Eventos registrados de forma automática](#auto-events): las instalaciones de la app, los inicios de la app y las compras en la app se registran de forma automática en el SDK de Facebook.
- [Herramienta de eventos de la app sin código](https://developers.facebook.com/docs/app-events/codeless-app-events#ios): utiliza esta herramienta para agregar eventos estándar sin agregar código a tu app.
- [Eventos registrados de forma manual](#eventos-registrados-de-forma-manual): agrega código a tu app para hacer un seguimiento de los eventos estándares y personalizados.

### Conexión de App Store para iOS 14

Es posible que los eventos que tu app recopila y envía a Facebook requieran que divulgues esos tipos de datos en el cuestionario de App Store Connect. Es tu responsabilidad asegurarte de que esto se vea reflejado en la Política de privacidad de tu app. Visita el [artículo Detalles de privacidad de la App Store de Apple](https://developer.apple.com/app-store/app-privacy-details/) para obtener información sobre los tipos de datos que tendrás que divulgar.

### Eventos registrados de forma automática

Cuando usas el SDK de Facebook, determinados eventos de tu app se registran y recopilan automáticamente en el administrador de eventos de Facebook, a menos que desactives el registro automático de eventos. Estos eventos son relevantes en todos los casos de uso: segmentación, medición y optimización.

Hay tres eventos clave que se recopilan como parte del registro automático de estos eventos: descarga de la app, inicio de la app y compra. Cuando el registro automático está activado, los anunciantes pueden desactivar estos eventos y otros eventos internos de Facebook, como los eventos de impresión de inicio de sesión. Sin embargo, si desactivaste el registro automático, pero quieres registrar eventos concretos (por ejemplo, eventos de instalación o de compra), debes implementar manualmente el registro de estos eventos en tu app.

| Evento                       | Detalles                                                                 |
|------------------------------|--------------------------------------------------------------------------|
| Instalación de la app        | La primera vez que un usuario nuevo activa una app o que inicia una app en un dispositivo particular. |
| Inicio de la app             | Cuando una persona inicia tu app, el SDK de Facebook se inicializa y se registra el evento. Sin embargo, si ocurre un segundo inicio de la app dentro de los 60 segundos del primero, no se registrará el segundo evento. |
| Compras en la app            | Cuando se completó una compra procesada por Google Play o la App Store de Apple. Si usas otras plataformas de pago, tendrás que agregar manualmente el código del evento de compra. |
| Informe de bloqueo del SDK de Facebook *(para uso exclusivo de Facebook)* | Si tu app se bloqueó a causa del SDK de Facebook, se generará un informe de bloqueo, el cual se enviará a Facebook al reiniciar la app. Este informe no incluye datos del usuario y ayuda a Facebook a garantizar la calidad y estabilidad del SDK. Para excluir el registro de este evento, [desactiva los eventos registrados de forma automática](#disable-auto-events). |

### Eventos de compra en la app registrados automáticamente

Apple proporciona cuatro tipos diferentes de compras en la app: consumibles, no consumibles, suscripción con renovación automática y suscripción sin renovación automática. Si implementas las compras en la app con StoreKit 1, registraremos automáticamente cada uno de esos tipos de compras en la app. Si implementas las compras en la app con StoreKit 2, registraremos automáticamente los no consumibles, las suscripciones con renovación automática y las suscripciones sin renovación automática. Si quieres registrar automáticamente también los consumibles, deberás agregar la clave [SKIncludeConsumableInAppPurchaseHistory](https://developer.apple.com/documentation/bundleresources/information_property_list/skincludeconsumableinapppurchasehistory) a tu `Info.plist`:

```xml
<key>SKIncludeConsumableInAppPurchaseHistory</key>
<true/>
```

En StoreKit 1, registraremos automáticamente un evento cuando el usuario compre correctamente un producto, devuelva un producto o intente comprar un producto pero falle el proceso de compra. En StoreKit 2, registraremos automáticamente un evento cuando el usuario compre un producto o devuelva un producto. Si quieres registrar también los casos en que una compra falla en StoreKit 2, proporcionamos una API manual a la que debes llamar. Puedes llamar a esta API durante el proceso de compra en StoreKit 2 de la siguiente manera:

```swift
do {
   let result = try await product.purchase()
   switch result {
   case .success(let verificationResult):
       // Handle success case
   case .pending:
       // Handle pending case
   default:
       AppEvents.shared.logFailedStoreKit2Purchase(product.id)
   }
} catch {
   AppEvents.shared.logFailedStoreKit2Purchase(product.id)
}
```

### Obtener consentimiento del dispositivo

A partir de iOS 14.5, tendrás que configurar `AdvertiserTrackingEnabled` y registrar cada vez que le des permiso a un dispositivo para compartir datos con Facebook.

Si el dispositivo proporciona consentimiento, configura `Settings.shared.isAdvertiserTrackingEnabled = true`.

Si el dispositivo no permite seguimiento, configura `Settings.shared.isAdvertiserTrackingEnabled = false`.

#### Desactivar eventos registrados de forma automática

Para desactivar el registro automático de eventos, abre el `.plist` de la app como código en Xcode y agrega el siguiente XML al diccionario de propiedades:

```xml
<key>FacebookAutoLogAppEventsEnabled</key>
<false/>
```

Es posible que, en algunos casos, prefieras demorar la recopilación de eventos registrados automáticamente en lugar de desactivarla (por ejemplo, para obtener el consentimiento del usuario o para cumplir con obligaciones legales). En este caso, configura `Settings.shared.isAutoLogAppEventsEnabled = true` para volver a activar el registro automático después de que el usuario final proporcionó su consentimiento.

Para volver a desactivar la recopilación, independientemente del motivo, configura `Settings.shared.isAutoLogAppEventsEnabled = false`.

También puedes desactivar el registro automático de eventos de compra en la app utilizando el [panel de apps](https://developers.facebook.com/apps). Ve a la **tarjeta para iOS** en **Básico > Configuración** y cambia el interruptor a **No**.

#### Desactivar la recopilación de identificadores de anunciantes

Para desactivar la recopilación de [advertiser-id](https://developers.facebook.com/docs/marketing-api/app-event-api#installs), abre el `.plist` de la app como código en Xcode y agrega el siguiente XML al diccionario de propiedades:

```xml
<key>FacebookAdvertiserIDCollectionEnabled</key>
<false/>
```

Es posible que, en algunos casos, prefieras demorar la recopilación de `advertiser_id` en lugar de desactivarla (por ejemplo, para obtener el consentimiento del usuario o para cumplir con obligaciones legales). En este caso, configura `Settings.shared.isAutoLogAppEventsEnabled = true` después de que el usuario final haya proporcionado su consentimiento.

Para desactivar la recopilación, independientemente del motivo, configura `Settings.shared.isAdvertiserIDCollectionEnabled = false`.

### Eventos registrados de forma manual

Para registrar un evento personalizado, pasa el nombre del evento como `AppEvents.Name`.

```swift
AppEvents.shared.logEvent(AppEvents.Name("battledAnOrc"))
```

#### Parámetros de eventos

Meta creó un conjunto de [parámetros de eventos útiles](https://developers.facebook.com/docs/app-events/reference#standard-event-parameters-2) para incluirlos con eventos estándar o con tus eventos personalizados. Asimismo, puedes usar tus propios parámetros.

Si quieres usar eventos de la app para medir las conversiones de [anuncios dinámicos](https://www.facebook.com/business/m/one-sheeters/dynamic-ads), configura el parámetro `fb_content_id` para que sea el valor del identificador del producto usado en el anuncio dinámico asociado.

Estos [parámetros predefinidos](https://developers.facebook.com/docs/app-events/reference#standard-event-parameters-2) ofrecen información orientativa acerca de los patrones de registro comunes y pueden tener un formato más legible en los informes y otras interfaces de usuario. Registra el conjunto de parámetros cuyos desgloses quieras ver. La descripción recomendada es únicamente orientativa. Puedes usar los parámetros para cualquier aspecto que sea relevante en tu app.

Los parámetros pasan por un diccionario en el que la clave mantiene el nombre del parámetro como `AppEvents.ParameterName` y el valor debe ser `String` o un número (`Int`, `Double`, etc.).

## Paso 8: Probar tus eventos

Con el [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper/), puedes probar los eventos de la app a fin de asegurarte de que tu app envíe eventos a Facebook.

1. Abre el [asistente para anuncios sobre apps](https://developers.facebook.com/tools/app-ads-helper/).
2. En **Seleccionar una app**, elige la app y haz clic en **Enviar**.
3. Desplázate hasta la parte inferior y selecciona **Probar evento**.
4. Inicia la app y envía un evento. El evento debería aparecer en la página.

Si tienes planeado realizar un seguimiento de los eventos en las campañas de SKAdNetwork u optimizarlos, también deberás configurar adecuadamente la prioridad del evento (también conocida como valor de conversión) para que Facebook reciba de manera correcta las conversiones. Para obtener información más detallada, [consulta aquí](https://www.facebook.com/business/help/670955636925518).

## Más información

- [Guía de prácticas recomendadas](https://developers.facebook.com/docs/app-events/best-practices): descubre una amplia variedad de ejemplos de apps y cómo cada una administra los eventos.
- [Preguntas frecuentes](https://developers.facebook.com/docs/app-events/faq): consulta las preguntas frecuentes.
- Curso de Meta Blueprint: [Configurar el SDK y eventos de la app para iOS](https://www.facebookblueprint.com/student/path/253018?content_id=WVtozducrYVuJ9p)
- Curso de Meta Blueprint: [Usar eventos de la app para segmentar, optimizar y medir](https://www.facebookblueprint.com/student/path/253008?content_id=FWxmTOIlbsCCDdg)

### Ejemplos de apps

Creamos algunos ejemplos de distintos tipos de apps para que te resulte más fácil ver cómo puedes usar eventos de la app. Las apps de ejemplo ofrecen un desglose por pantallas de los diferentes eventos y parámetros que se pueden recopilar. Al final de cada sección hay una tabla en la que se enumeran los eventos y los parámetros recomendados para cada app. Además, si es necesario, puedes crear tus propios eventos y parámetros.

| Comercio electrónico y comercio minorista | Viajes (hoteles) | Viajes (vuelos) |
|-------------------------------------------|------------------|------------------|
| [Comercio electrónico y comercio minorista](https://developers.facebook.com/docs/app-events/best-practices/ecom-and-retail) | [Viajes (hoteles)](https://developers.facebook.com/docs/app-events/best-practices/travel-hotel) | [Viajes (vuelos)](https://developers.facebook.com/docs/app-events/best-practices/travel-flight) |

| Juegos (casuales) | Juegos (estrategia) | Juegos (casino) |
|-------------------|---------------------|------------------|
| [Juegos (casuales)](https://developers.facebook.com/docs/app-events/best-practices/gaming-casual) | [Juegos (estrategia)](https://developers.facebook.com/docs/app-events/best-practices/gaming-strategy) | [Juegos (casino)](https://developers.facebook.com/docs/app-events/best-practices/gaming-casino) |
```



## Page: https://developers.facebook.com/docs/app-events/overview

```markdown
# Overview

App Events allows you to track actions that occur in your mobile app or web page such as app installs and purchase events. By tracking these events you can [measure ad performance](https://developers.facebook.com/docs/marketing-api/insights) and [build audiences](https://developers.facebook.com/docs/marketing-api/audiences-api) for ad targeting.

## How It Works

There are three types of App Events:

- **Automatically Logged Events** - The Facebook SDK can automatically log app installs, app sessions, and in-app purchases.
- **Standard Events** - Popular events that Facebook has created for you.
- **Custom Events** - Events you create that are specific to your app.

An app event has three parts:

1. `name` - A required string that describes the event. The name appears in the Event log when the app event is sent to [Facebook Events Manager](https://www.facebook.com/events_manager).
2. `valueToSum` - An optional value that Analytics adds to other Value To Sum values from app events with the same name.
3. `parameters` - Optional values included with your app event.

The maximum number of different event names is 1,000. Note: No new event types will be logged once this cap is hit and if you exceed this limit you may see a `100 Invalid parameter` error when logging. However it is possible to [deactivate obsolete events](https://www.facebook.com/help/analytics/966883707418907). Read more about event limits in the [FAQ](/docs/app-events/faq#limits).

## Requirements

### Register Your App

[Register as a Facebook developer](https://developers.facebook.com/docs/development/register) and create an app with basic settings and platform information.

## Next Steps

To add app events to your Android or iOS mobile app or web page, you integrate the Facebook SDK. After installation, you can add app events with the [codeless setup tool](https://www.facebook.com/business/help/1634426896605026) or install event code manually. Use the following guides to integrate the SDK and set up app events for your app or web page:

- [Getting Started with App Events for Android](/docs/app-events/getting-started-app-events-android)
- [Getting Started with App Events for iOS](/docs/app-events/getting-started-app-events-ios)
- [Codeless App Events](/docs/app-events/codeless-app-events)

## Resources

- Meta Blueprint course: [Configure the SDK and App Events for Android](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F253016%3Fcontent_id%3DSxoXN0m9KT8YHpA)
- Meta Blueprint course: [Configure the SDK and App Events for iOS](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F253018%3Fcontent_id%3DWVtozducrYVuJ9p)
- Meta Blueprint course: [Debug App Events for Android and iOS](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F253020%3Fcontent_id%3DoUaIMb2xOvNGSI7)
```



## Page: https://developers.facebook.com/docs/app-events/guides

```markdown
# Facebook App Event Tracking Guides

Guides to help you perform common actions to track events that users make in your app or web page.

## Documentation Contents

| Cookie Consent Resource | Advanced Matching Guide |
|-------------------------|-------------------------|
| [Cookie Consent Resource](https://developers.facebook.com/docs/app-events/cookies) <br> Outlines general context and resources to help our partners meet cookie consent requirements. | [Advanced Matching Guide](https://developers.facebook.com/docs/app-events/advanced-matching) <br> Explains how to send customer data to Facebook to match with Facebook user data. |

| Collaborative Ads Event Tracking for Android | Collaborative Ads Event Tracking for iOS |
|----------------------------------------------|------------------------------------------|
| [Collaborative Ads Event Tracking for Android](https://developers.facebook.com/docs/app-events/collaborative-ads-android) <br> Explains how to track App Events for [Android](https://developers.facebook.com/docs/app-events/collaborative-ads-android) collaborative ads. | [Collaborative Ads Event Tracking for iOS](https://developers.facebook.com/docs/app-events/collaborative-ads-ios) <br> Explains how to track App Events for [iOS](https://developers.facebook.com/docs/app-events/collaborative-ads-ios) collaborative ads. |

| GDPR Compliance Guide | Codeless App Event Tracking Guide |
|-----------------------|-----------------------------------|
| [GDPR Compliance Guide](https://developers.facebook.com/docs/app-events/gdpr-compliance) <br> Explains how to implement consent mechanisms to meet the legal obligations under EU data protection law and our Business Tools Terms. | [Codeless App Event Tracking Guide](https://developers.facebook.com/docs/app-events/codeless-app-events) <br> Explains how to use the Events Manager to add or remove app events without implementing code or releasing a new version of your app. |

| Tracking Events from Hybrid Mobile Apps Guide | SDK Upgrade Guide |
|------------------------------------------------|--------------------|
| [Tracking Events from Hybrid Mobile Apps Guide](https://developers.facebook.com/docs/app-events/hybrid-app-events) <br> Explains how to use App Events for a native Android or iOS web app by converting Facebook pixel events into app events. | [SDK Upgrade Guide](https://developers.facebook.com/docs/app-events/upgrade-guide) <br> Explains how to upgrade your mobile app to the latest version of the Facebook SDK. |

---
```