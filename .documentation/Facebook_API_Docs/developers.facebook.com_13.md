# API Documentation

**Source URL:** https://developers.facebook.com/docs/javascript/
**Scraped Date:** 2025-11-12 15:59:19

---



## Page: https://developers.facebook.com/docs/javascript/

```markdown
# SDK de Facebook para JavaScript

Un amplio conjunto de funcionalidades para el cliente que permite agregar plugins sociales, el inicio de sesión con Facebook y llamadas a la API Graph.

| ![Inicio rápido](https://scontent.xx.fbcdn.net/v/t39.2178-6/851564_233808196785054_1852554575_n.png?_nc_cat=105&ccb=1-7&_nc_zt=14&_nc_ht=scontent.xx&_nc_gid&stp=dst-emg0_fr_q75_tt6&ur=34156e&_nc_sid=a284aa&oh=00_AfR41YRyWqzdUzZ5tSUTtXQKIkphnm95ilt4l4bOBfQoIw&oe=687F8BBA) | **[Inicio rápido](https://developers.facebook.com/docs/javascript/quickstart)**<br> Más información sobre cómo usar el SDK de JavaScript. |
| --- | --- |
| ![Referencia](https://scontent.xx.fbcdn.net/v/t39.2178-6/851582_532156920206214_2007427102_n.png?_nc_cat=102&ccb=1-7&_nc_zt=14&_nc_ht=scontent.xx&_nc_gid&stp=dst-emg0_fr_q75_tt6&ur=34156e&_nc_sid=a284aa&oh=00_AfSVXg0y29ZOEAoHJKqj0btrTRiYaMcdnCOrE3dNsSRzAQ&oe=687F87BA) | **[Referencia](https://developers.facebook.com/docs/javascript/reference)**<br> Una lista de todos los métodos del SDK. |

## Guías

| **[Ejemplos](https://developers.facebook.com/docs/javascript/examples)**<br> Prueba nuestros ejemplos para usar el SDK: activa un cuadro de diálogo y el inicio de sesión con Facebook y realiza llamadas a la API Graph. | **[Configuración avanzada](https://developers.facebook.com/docs/javascript/advanced-setup)**<br> Obtén información sobre cómo personalizar las opciones del SDK de Facebook para JavaScript. |
| --- | --- |

---

### Marcos

| **[AngularJS](https://developers.facebook.com/docs/javascript/howto/angularjs)**<br> Información de cómo integrar el SDK de Facebook para JavaScript en tu app de AngularJS. | **[jQuery](https://developers.facebook.com/docs/javascript/howto/jquery)**<br> Incorporar el SDK de Facebook para JavaScript en la app web basada en jQuery. |
| --- | --- |
| **[RequireJS](https://developers.facebook.com/docs/javascript/howto/requirejs)**<br> Incorporar el SDK de Facebook para JavaScript dentro de otros módulos de JavaScript mediante RequireJS. |  |

```html
<fb:like href="https://developers.facebook.com/docs/javascript/" layout="button_count" share="1"></fb:like>



## Page: https://developers.facebook.com/docs/javascript/howto/jquery

# SDK de Facebook para JavaScript con jQuery

En este tutorial aprenderás a incorporar el SDK de Facebook para JavaScript a una aplicación web basada en jQuery. Tanto jQuery como el SDK para JavaScript proporcionan soluciones propias para aplazar la ejecución del código hasta que se carguen las bibliotecas. Este tutorial te ayudará a combinarlos para asegurarte de que estén listos antes de invocar el SDK.

En este ejemplo se usa jQuery 2.0.0, obtenido de la CDN de Google Hosted Libraries. Para obtener más información sobre jQuery, consulta la [documentación de jQuery](https://l.facebook.com/l.php?u=http%3A%2F%2Fapi.jquery.com%2F&amp;h=AT0bcZZINyjRFups5BEGCJi2scXpyCKgkzKQAewRElRJ3tmEyivoylo1EJgiqBMo2FODieBky0j4m-JrSuIihxtWEFHimLxsWYDrQCF5CJbw9GmcaLu1lp-nwCuMLMd_vXTJBC2Ym01JPULUZtyH7oRuhjGRmAHg_qRV44a4qD0).

## Implementación

Agrega jQuery al encabezado del documento e implementa el método `$(document).ready()`, que se ejecutará cuando el DOM se complete y en el código aparezca una instancia de jQuery. La página tendrá el siguiente aspecto:

```html
<html>
<head>
  <script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
  <link rel="stylesheet" href="style.css" />
  <title>jQuery Example</title>
  <script>
    $(document).ready(function() {
      // Execute some code here
    });
  </script>
</head>
```

En lugar de importar el SDK de Facebook para JavaScript con el script asincrónico predeterminado, usa el método `getScript()` de jQuery para importar el SDK de la URL correspondiente a la configuración regional del usuario. Si no incluyes el protocolo que aparece al inicio de la URL, se aplicará un protocolo coincidente con la URL actual.

De forma predeterminada, jQuery realiza marcas temporales en las solicitudes asincrónicas para evitar que el navegador las almacene en caché. Puedes desactivar esta función usando el método `ajaxSetup()` para que el SDK se almacene en caché de forma local entre las páginas.

El método `getScript()` es asincrónico, de manera que tendrás que enviar una función de devolución de llamada anónima en la que puedes incluir el código de inicialización del SDK de la forma habitual. Agrega el identificador de la aplicación desde el [panel de aplicaciones](/apps).

```javascript
$(document).ready(function() {
  $.ajaxSetup({ cache: true });
  $.getScript('https://connect.facebook.net/en_US/sdk.js', function() {
    FB.init({
      appId: '{your-app-id}',
      version: 'v2.7' // or v2.1, v2.2, v2.3, ...
    });
    $('#loginbutton,#feedbutton').removeAttr('disabled');
    FB.getLoginStatus(updateStatusCallback);
  });
});
```

## Desacoplamiento de dependencias

Si incluyes toda la lógica de invocación del SDK en la función de devolución de llamada `getScript`, podrás garantizar que existe el objeto FB, pero no es el diseño más apropiado para una aplicación compleja. Como el objeto `FB` es global, puedes colocar la lógica del SDK fuera de la función de devolución de llamada `getScript` siempre y cuando compruebes que existe antes de llamarla. También puedes usar una infraestructura que administre las dependencias entre módulos, como [RequireJS](/docs/howto/javascript/requirejs), para asegurarte de que el objeto FB se carga como parte de la configuración de la aplicación.

## Más información

- [Referencias del SDK para JavaScript](/docs/reference/javascript)
- [Uso del SDK para JavaScript con RequireJS](/docs/howto/javascript/requirejs)



## Page: https://developers.facebook.com/docs/javascript/examples

```markdown
# JavaScript SDK - Examples

Read our **[quickstart](https://developers.facebook.com/docs/javascript/quickstart)** guide to learn how to load and initialize the Facebook SDK for JavaScript and our **[advanced setup](https://developers.facebook.com/docs/javascript/advanced-setup)** guide to customize your implementation. Next try our examples for using the SDK:

- **[Trigger a Share dialog](#dialogs)**
- **[Facebook Login](#login)**

**Navegadores compatibles**  
El SDK de Facebook para JavaScript admite las últimas dos versiones de los navegadores más populares: Chrome, Firefox, Edge, Safari (incluido iOS) e Internet Explorer (solo versión 11).

## Trigger a Share dialog

The [Share Dialog](https://developers.facebook.com/docs/sharing/reference/share-dialog) allows someone using a page to post a link to their timeline, or create an Open Graph story. Dialogs displayed using the JavaScript SDK are automatically formatted for the context in which they are loaded - mobile web, or desktop web.

Here we'll show you how the [`FB.ui()`](https://developers.facebook.com/docs/reference/javascript/FB.ui) method of the SDK can be used to invoke a really basic Share dialog. Add this snippet after the `FB.init()` call in the basic setup code:

```javascript
FB.ui({
  method: 'share',
  href: 'https://developers.facebook.com/docs/'
}, function(response){});
```

Now when you reload your page, you'll see a Share dialog appear over the top of the page. Once the dialog has been closed, either by posting the story or by cancelling, the response function will be triggered.

Read the [`FB.ui` reference doc](https://developers.facebook.com/docs/reference/javascript/FB.ui/) to see a full list of parameters that can be used, and the structure of the response object.  
[Read `FB.ui` Reference Documentation](https://developers.facebook.com/docs/reference/javascript/FB.ui/)

## Facebook Login

[Facebook Login](https://developers.facebook.com/docs/facebook-login/) allows users to register or sign in to your app with their Facebook identity.

We have a full guide on how to [use the JS SDK to implement Facebook Login](https://developers.facebook.com/docs/facebook-login/login-flow-for-web). But for now, let's just use some basic sample code, so you can see how it works. Insert the following after your original `FB.init` call:

```javascript
FB.login(function(response) {
    if (response.authResponse) {
        console.log('Welcome!  Fetching your information.... ');
        FB.api('/me', function(response) {
            console.log('Good to see you, ' + response.name + '.');
        });
    } else {
        console.log('User cancelled login or did not fully authorize.');
    }
});
```

Read the [Login guide](https://developers.facebook.com/docs/facebook-login/login-flow-for-web) to learn exactly what is happening here, but when you reload your page you should be prompted with the Login dialog for your app, if you haven't already granted it permission.  
[Learn more about Facebook Login](https://developers.facebook.com/docs/facebook-login)
```



## Page: https://developers.facebook.com/docs/javascript/frameworks

# Guías de marcos del SDK para JavaScript

## [AngularJS](https://developers.facebook.com/docs/javascript/howto/angularjs)

Conoce cómo integrar el SDK de Facebook para JavaScript en tu aplicación de AngularJS.

## [jQuery](https://developers.facebook.com/docs/javascript/howto/jquery)

Incorpora el SDK de Facebook para JavaScript a una aplicación web basada en jQuery.

## [RequireJS](https://developers.facebook.com/docs/javascript/howto/requirejs)

Usa RequireJS para incorporar el SDK de Facebook para JavaScript a otros módulos de JavaScript.



## Page: https://developers.facebook.com/docs/javascript/howto/angularjs

# SDK de Facebook para JavaScript con AngularJS

![Facebook SDK](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/10574685_826118484138756_1746708142_n.png?_nc_cat=106&ccb=1-7&_nc_sid=34156e&_nc_ohc=_eEVo3-KPdUQ7kNvwFC9p7O&_nc_oc=Adm84LvFWAqDgHBMj-d2XB88EC4Uo8V-kNIB-EqvFQD9brzCzmDpXHf1rf53pGCgOoOqLCW_ujOYXME2OEsfaYYN&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=E81p9qkh5mAkgdlSjFnTAg&oh=00_Afh08ds_Z4SkJE49Vkf8YbRGK_esHFyP42oCL6uq8XYuNQ&oe=691AB0E9)

Puedes integrar el SDK de Facebook para JavaScript con **[AngularJS](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.angularjs.org%2F&h=AT1HMVD1bJmOtGv8j8rat4o7pW52GWCWJL0gMuPVoH8XmSGBeD3pLodFXHUOjMSG6xoIk6NYINk9A0RGoYp39SEzM1RewBdrAzYmmzepkubCoyyPViNGE6aab1_zkTNRoame0ywqTLwGJr5l8zxGsoRqUjlcC_gcVW6rvQ7Lm18)**. Sin embargo, como nuestro SDK debe funcionar en *la web* y no en un marco concreto, no proporcionamos un módulo de AngularJS.

## Cargar el SDK de Facebook para JavaScript

Para agregar el SDK de Facebook para JavaScript a tu aplicación, recomendamos que sigas los pasos descritos en el documento *[Facebook authentication in your AngularJS web app](https://l.facebook.com/l.php?u=http%3A%2F%2Fblog.brunoscopelliti.com%2Ffacebook-authentication-in-your-angularjs-web-app%2F&h=AT2c2BIpLtsbIE6WeLmZaMn221hSCTosjQQFBdrkxyEh1eDA5quWfRTJxOj-NkmZssbr1yReiVq7MBqJy158qCgKHpbeqd_oaxc_VwORE3Gf8e1vR5NperETWTSCfVSUqDxDkfDxQX8NYtd9CeQ2Ga7M8EZT28-KJKpwxjApig4)* o consultes otras guías publicadas en https://docs.angularjs.org/guide.

### Usar la versión más reciente del SDK

Cuando consultes una guía, recuerda **cargar el archivo `sdk.js` del SDK más reciente**:

```javascript
// Old SDK (deprecated)
js.src = "https://connect.facebook.net/en_US/all.js";

// New SDK (v2.x)
js.src = "https://connect.facebook.net/en_US/sdk.js";
```

Y de **proporcionar una versión de la API Graph** (actualmente `v2.4`) en la llamada a `FB.init()`:

```javascript
$window.fbAsyncInit = function() {
    FB.init({
      appId: '{your-app-id}',
      status: true,
      cookie: true,
      xfbml: true,
      version: 'v2.4'
    });
};
```

## Administrar las devoluciones de llamada

El SDK de Facebook para JavaScript no admite el concepto de los objetos "promise". Como alternativa, puedes agrupar, por ejemplo, las llamadas del SDK de Facebook para JavaScript en un [servicio](https://l.facebook.com/l.php?u=https%3A%2F%2Fdocs.angularjs.org%2Fguide%2Fproviders&h=AT3PeJDt6sbjnPBRZIYKw9iJgAqR5jh6F4BdZsgBtXbv38P_sC3IeJjYlZXpLi1t6nxZmLKQqSDT9NKV48d8n9EBeFi4fqWLqYRlYwD8N11_KPGmnwx5DDLqmVkOJneuFTO_uhd-FJ2AnRV2oHoAHobo8JpsMiQdke0D10ooXpU):

```javascript
// ...
.factory('facebookService', function($q) {
    return {
        getMyLastName: function() {
            var deferred = $q.defer();
            FB.api('/me', {
                fields: 'last_name'
            }, function(response) {
                if (!response || response.error) {
                    deferred.reject('Error occured');
                } else {
                    deferred.resolve(response);
                }
            });
            return deferred.promise;
        }
    };
});
```

Por ejemplo, puedes usar el servicio del siguiente modo:

```javascript
$scope.getMyLastName = function() {
   facebookService.getMyLastName()
     .then(function(response) {
       $scope.last_name = response.last_name;
     });
};
```

### Bibliotecas de terceros

En la página de la [guía de AngularJS](https://l.facebook.com/l.php?u=https%3A%2F%2Fdocs.angularjs.org%2Fguide&h=AT1KIANcsqAVd4TUikavlLcNgWTCHatI5onVVhv3I77HWlr1YAi1ZojsC69PFGwbJfTh-fmp2q00F-YFahTae8sKpgXHkeoc4Bqq4jw_FOcqTSf3NBTonkgA2WsrQzE3I4DXBjGcEvns8PFnLnDqunSF0WjUDbN9NcuU_F-jDDE), encontrarás varias bibliotecas de terceros que simplifican el uso del SDK de Facebook para JavaScript.



## Page: https://developers.facebook.com/docs/javascript/reference

# Facebook SDK for JavaScript - Reference

Reference docs for each of the full list of methods and functions available in the SDK.

## Core Methods

| Method | Description |
|--------|-------------|
| [.init()](https://developers.facebook.com/docs/javascript/reference/FB.init/) | Used to initialize and setup the SDK. All other SDK methods must be called after this one. |
| [.api()](https://developers.facebook.com/docs/javascript/reference/FB.api/) | Make an API call to the [Graph API](https://developers.facebook.com/docs/api/). |
| [.ui()](https://developers.facebook.com/docs/javascript/reference/FB.ui/) | Used to trigger different forms of Facebook created UI dialogs, such as the Feed dialog, or the Requests dialog. |

## Facebook Login Methods

| Method | Description |
|--------|-------------|
| [.getLoginStatus()](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/) | Returns the Facebook Login status of a user, with an `authResponse` object if they are logged in. |
| [.login()](https://developers.facebook.com/docs/reference/javascript/FB.login/) | Prompts a user to login to your app using the Login dialog in a popup. This method can also be used with an already logged-in user to request additional permissions from them. |
| [.logout()](https://developers.facebook.com/docs/reference/javascript/FB.logout/) | Used to logout the current user both from your site or app **and** from Facebook.com. |
| [.getAuthResponse()](https://developers.facebook.com/docs/reference/javascript/FB.getAuthResponse/) | When your app is able to assume that a user is definitely logged-in via Facebook, this synchronous method can return the `authResponse` object without the overhead of an asynchronous call. |

## Event Handling Methods

| Method | Description |
|--------|-------------|
| [.Event.subscribe()](https://developers.facebook.com/docs/reference/javascript/FB.Event.subscribe/) | Subscribe to a JavaScript event, which will fire on various different types of actions, such as someone clicking a Like button, or adding to a Comments Box. |
| [.Event.unsubscribe()](https://developers.facebook.com/docs/reference/javascript/FB.Event.unsubscribe/) | Remove any event subscriptions that were previously created. |

## App Events

This Facebook SDK (JS) App Events API has been deprecated and is no longer supported starting July 1, 2022. There are no plans to add new features to this product.

Instead of using `FB.AppEvents.LogEvent`, we recommend that you send these events through the [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel).

| Method | Description |
|--------|-------------|
| [.AppEvents.LogEvent()](https://developers.facebook.com/docs/reference/javascript/FB.AppEvents.LogEvent) | Log an application event, for example when someone completes your tutorial. |
| [.AppEvents.logPurchase()](https://developers.facebook.com/docs/reference/javascript/FB.AppEvents.LogEvent) | When someone makes a purchase in your app, log the event. |
| [.AppEvents.activateApp()](https://developers.facebook.com/docs/reference/javascript/FB.AppEvents.LogEvent) | Log when app launches. |

## XFBML Methods

XFBML is a markup language like HTML, with special tags that are used to insert social plugins into HTML pages.

| Method | Description |
|--------|-------------|
| [.XFBML.parse()](https://developers.facebook.com/docs/reference/javascript/FB.XFBML.parse/) | Parses and renders any XFBML on a page. This can be useful if you insert any social plugins into the DOM after the initial page load, or you set `xfbml` as `false` in `FB.init()`. |

## Canvas Methods

These methods can only be used by Apps on Facebook.com that run in a [Canvas page](https://developers.facebook.com/docs/games/canvas).

| Method | Description |
|--------|-------------|
| [.Canvas.Prefetcher.addStaticResource()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.Prefetcher.addStaticResource/) | Controls which static resources are flushed to the browser early. |
| [.Canvas.Prefetcher.setCollectionMode()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.Prefetcher.setCollectionMode/) | Controls how statistics are collected on resources used by your application, with the intent to influence whether those resources will be fetched to the browser early, or to turn off Prefetching completely. |
| [.Canvas.scrollTo()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.scrollTo/) | Tells Facebook to scroll to a specific location in the iframe of your canvas page. |
| [.Canvas.setAutoGrow()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.setAutoGrow/) | Starts or stops a timer which resizes your iframe every few milliseconds. |
| [.Canvas.setSize()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.setSize/) | Tells Facebook to resize your iframe. |
| [.Canvas.setUrlHandler()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.setUrlHandler/) | Registers the callback for inline processing (i.e. without page reload) of user actions, such as clicks on Live Ticker game stories. |
| [.Canvas.setDoneLoading()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.setDoneLoading/) | Reports that the page is now usable by the user, for collecting performance metrics. |
| [.Canvas.startTimer()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.startTimer/) | When using [.setDoneLoading()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.setDoneLoading/), controls the page load timer. |
| [.Canvas.stopTimer()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.stopTimer/) | When using [.setDoneLoading()](https://developers.facebook.com/docs/reference/javascript/FB.Canvas.setDoneLoading/), controls the page load timer. |

[Like this page](https://developers.facebook.com/docs/javascript/reference/)



## Page: https://developers.facebook.com/docs/javascript

```markdown
# SDK de Facebook para JavaScript

Un amplio conjunto de funcionalidades para el cliente que permite agregar plugins sociales, el inicio de sesión con Facebook y llamadas a la API Graph.

| ![Inicio rápido](https://scontent.xx.fbcdn.net/v/t39.2178-6/851564_233808196785054_1852554575_n.png?_nc_cat=105&ccb=1-7&_nc_zt=14&_nc_ht=scontent.xx&_nc_gid&stp=dst-emg0_fr_q75_tt6&ur=34156e&_nc_sid=a284aa&oh=00_AfR41YRyWqzdUzZ5tSUTtXQKIkphnm95ilt4l4bOBfQoIw&oe=687F8BBA) | **[Inicio rápido](https://developers.facebook.com/docs/javascript/quickstart)**<br> Más información sobre cómo usar el SDK de JavaScript. |
|---|---|
| ![Referencia](https://scontent.xx.fbcdn.net/v/t39.2178-6/851582_532156920206214_2007427102_n.png?_nc_cat=102&ccb=1-7&_nc_zt=14&_nc_ht=scontent.xx&_nc_gid&stp=dst-emg0_fr_q75_tt6&ur=34156e&_nc_sid=a284aa&oh=00_AfSVXg0y29ZOEAoHJKqj0btrTRiYaMcdnCOrE3dNsSRzAQ&oe=687F87BA) | **[Referencia](https://developers.facebook.com/docs/javascript/reference)**<br> Una lista de todos los métodos del SDK. |

## Guías

| **[Ejemplos](https://developers.facebook.com/docs/javascript/examples)** | Prueba nuestros ejemplos para usar el SDK: activa un cuadro de diálogo y el inicio de sesión con Facebook y realiza llamadas a la API Graph. |
|---|---|
| **[Configuración avanzada](https://developers.facebook.com/docs/javascript/advanced-setup)** | Obtén información sobre cómo personalizar las opciones del SDK de Facebook para JavaScript. |

---

### Marcos

| **[AngularJS](https://developers.facebook.com/docs/javascript/howto/angularjs)** | Información de cómo integrar el SDK de Facebook para JavaScript en tu app de AngularJS. |
|---|---|
| **[jQuery](https://developers.facebook.com/docs/javascript/howto/jquery)** | Incorporar el SDK de Facebook para JavaScript en la app web basada en jQuery. |
| **[RequireJS](https://developers.facebook.com/docs/javascript/howto/requirejs)** | Incorporar el SDK de Facebook para JavaScript dentro de otros módulos de JavaScript mediante RequireJS. |
```



## Page: https://developers.facebook.com/docs/javascript/advanced-setup

```markdown
# SDK de JavaScript - Configuración avanzada

Lee nuestra guía de **[inicio rápido](https://developers.facebook.com/docs/javascript/quickstart)** para obtener información sobre cómo cargar e inicializar el SDK de Facebook para JavaScript. Al iniciar el SDK, el inicio rápido utilizará valores predeterminados comunes de las opciones disponibles. Puedes personalizar algunas de estas opciones.

**Navegadores compatibles**

El SDK de Facebook para JavaScript admite las últimas dos versiones de los navegadores más populares: Chrome, Firefox, Edge, Safari (incluido iOS) e Internet Explorer (solo versión 11).

## Cambiar el idioma

Se inicializa la versión `en_US` del SDK en el fragmento de configuración básica, lo que implica que todos los botones y plugins generados por Facebook que se usan en tu sitio estén en inglés estadounidense. (Sin embargo, los cuadros de diálogo emergentes que genera Facebook, como el cuadro de diálogo de inicio de sesión, se mostrarán en el idioma que haya elegido la persona en Facebook, incluso si difiere del que seleccionaste). Puedes cambiar este idioma si modificas el valor `src` en el fragmento. Revisa [Localización](https://developers.facebook.com/docs/internationalization) para ver los diferentes idiomas que puedes usar. Por ejemplo, si tu app está en español y utilizas el siguiente código para cargar el SDK, todos los plugins sociales se mostrarán en español.

```html
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/es_LA/sdk.js"></script>
```

## Verificación de estado de inicio de sesión

Si configuras `status` en `true` en la llamada `FB.init()`, el SDK intentará obtener información sobre el usuario actual inmediatamente después de iniciarlo. Este proceso puede reducir el tiempo que insume verificar el estado de un usuario que inició sesión si utilizas el inicio de sesión con Facebook, pero no resulta útil en el caso de las páginas que solo cuentan con plugins sociales.

Puedes usar [FB.getLoginStatus](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus) para obtener el estado de inicio de sesión de una persona. Sigue leyendo para obtener más información sobre cómo [usar el inicio de sesión con Facebook con el SDK para JavaScript](https://developers.facebook.com/docs/facebook-login/web).

## Desactivar el análisis XFBML

Si `xfbml` está configurado en `true`, el SDK analizará el DOM de la página en busca de plugins sociales que se agregaron mediante XFBML y los inicializará. Si no utilizas este tipo de plugins en la página, configura `xfbml` en `false` para mejorar el tiempo de carga de la página. Puedes encontrar más información al respecto en [Plugins sociales](#plugins).

## Activar código cuando se carga el SDK

La función asignada a `window.fbAsyncInit` se ejecuta cuando finaliza la carga del SDK. Después de que se carga el SDK, se deben reemplazar dentro de esta función y después de realizar la llamada a `FB.init` los códigos que quieras ejecutar. Se puede usar aquí cualquier tipo de JavaScript, pero **es necesario** llamar a cualquier función del SDK después de `FB.init`.

## Depuración

El SDK para JavaScript se carga [reducido](https://en.wikipedia.org/wiki/Minification_(programming)) para mejorar el rendimiento. También puedes cargar una versión de depuración del SDK para JavaScript que incluya una verificación mayor de registros y de argumentos estrictos y que no se reduzca. Para hacerlo, cambia el valor `src` en el código de carga de la siguiente manera:

```javascript
src="https://connect.facebook.net/en_US/sdk/debug.js"
```

La versión de depuración no deberá usarse en el entorno de producción, porque la carga es mayor y resulta peor para el rendimiento de la página.

## Más opciones de inicio

El [documento de referencia sobre la función `FB.init`](https://developers.facebook.com/docs/reference/javascript/FB.init) proporciona una lista completa de opciones de inicialización disponibles.
```



## Page: https://developers.facebook.com/docs/

# Documentación para desarrolladores de Meta

*Obtén información básica sobre cómo enviar y recibir datos de la gráfica social de Meta y cómo implementar las API, las plataformas, los productos y los SDK para que se adapten a las necesidades de tu app.*

## Desarrollo de la app de Meta

Regístrate como desarrollador, ajusta la configuración de tu app en el panel de apps y compila, prueba y lanza tu app. [Documentos](/docs/development)

## API Graph

El método principal de las apps para leer y escribir en la gráfica social de Meta. [Documentos](/docs/graph-api)

## Iniciativas de plataforma responsable

Verifica si tu app cuenta con aprobación para usar nuestros productos y API. [Documentos](/docs/resp-plat-initiatives)

## Integraciones de apps
### [App Links](https://developers.facebook.com/docs/applinks/)
### [Graph API](https://developers.facebook.com/docs/graph-api/)
### [Meta App Events](https://developers.facebook.com/docs/app-events/)
### [Meta Pixel](https://developers.facebook.com/docs/meta-pixel/)
### [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)

## Autenticación
### [Facebook Login](https://developers.facebook.com/docs/facebook-login/)
### [Limited Facebook Login](https://developers.facebook.com/docs/facebook-login/limited-login/)
### [Login Connect with Messenger](https://developers.facebook.com/docs/facebook-login/login-connect/)

## Guías para desarrolladores
### [Meta App Development](https://developers.facebook.com/docs/development/)
### [Políticas para desarrolladores](https://developers.facebook.com/devpolicy)
### [Condiciones de la plataforma de Meta](https://developers.facebook.com/terms)
### [Privacidad y consentimiento](https://developers.facebook.com/docs/privacy)

## SDK
### [Facebook SDK for Android](https://developers.facebook.com/docs/android/)
### [Facebook SDK for iOS](https://developers.facebook.com/docs/ios/)
### [Facebook SDK for JavaScript](https://developers.facebook.com/docs/javascript/)
### [SDK de Facebook para PHP](https://github.com/facebookarchive/php-graph-sdk/tree/master/docs)
### [Unity SDK](https://developers.facebook.com/docs/unity/)
### [Meta Business SDK](https://developers.facebook.com/docs/business-sdk/)

## Videojuegos
### [Facebook Games](https://developers.facebook.com/docs/games/)
### [Game Payments](https://developers.facebook.com/docs/games_payments/)

## Integraciones sociales
### [Facebook Pages API](https://developers.facebook.com/docs/pages-api/)
### [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/)
### [Threads API](https://developers.facebook.com/docs/threads/)
### [Sharing](https://developers.facebook.com/docs/sharing/)
### [Social Plugins](https://developers.facebook.com/docs/plugins/)

## Videos
### [Live Video API](https://developers.facebook.com/docs/live-video-api/)
### [Stories](https://developers.facebook.com/docs/page-stories-api/)
### [Videos](https://developers.facebook.com/docs/videos/)

## Mensajes comerciales
### [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/)
### [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)

## Marketing y comercio
### [Facebook Creator Discovery API](https://developers.facebook.com/docs/fb-creator-discovery/)
### [Facebook App Ads](https://developers.facebook.com/docs/app-ads/)
### [Automotive Ads](https://developers.facebook.com/docs/marketing-api/auto-ads/)
### [Catalog](https://developers.facebook.com/docs/marketing-api/catalog/)
### [Commerce Platform](https://developers.facebook.com/docs/commerce-platform/)
### [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/)
### [Conversions API Gateway](https://developers.facebook.com/docs/marketing-api/gateway-products/conversions-api-gateway/)
### [Signals Gateway](https://developers.facebook.com/docs/marketing-api/gateway-products/signals-gateway/)
### [Cross-Channel Conversion Optimization](https://developers.facebook.com/docs/ccco/)
### [Meta Audience Network](https://developers.facebook.com/docs/audience-network/)
### [Meta Business SDK](https://developers.facebook.com/docs/business-sdk/)
### [Meta Pay Integration](https://developers.facebook.com/docs/meta-pay/)
### [Marketing API](https://developers.facebook.com/docs/marketing-api/)

## Empleo y formación
### [Meta Admin Center](https://developers.facebook.com/docs/admin-center/)
### [Workplace](https://developers.facebook.com/docs/workplace/)

## Inteligencia artificial
### [Wit.ai](https://www.wit.ai/)

## Rights Manager

## Portabilidad de datos
### [Data Portability](https://developers.facebook.com/docs/data-portability/)



## Page: https://developers.facebook.com/docs/javascript/quickstart

# Inicio rápido: SDK de Facebook para JavaScript

El SDK de Facebook para JavaScript ofrece un amplio conjunto de funcionalidades para el cliente con las siguientes características:

- Te permiten usar el [botón "Me gusta"](https://developers.facebook.com/docs/reference/plugins/like) y otros [plugins sociales](https://developers.facebook.com/docs/plugins) en tu sitio.
- Te permiten usar el [inicio de sesión con Facebook](https://developers.facebook.com/docs/concepts/login) con el que las personas pueden registrarse en tu sitio fácilmente.
- Facilita la llamada a la [API Graph](https://developers.facebook.com/docs/reference/api) de Facebook.
- Lanza cuadros de diálogo que permiten a las personas realizar varias acciones, como compartir en historias.
- Facilita la comunicación cuando estás creando un [juego](https://developers.facebook.com/docs/guides/canvas) o una [pestaña de una app](https://developers.facebook.com/docs/appsonfacebook/pagetabs) en Facebook.

En este inicio rápido, verás cómo configurar el SDK y lograr que haga algunas llamadas básicas a la API Graph. Si todavía no quieres configurarlo, puedes usar nuestra [consola de pruebas de JavaScript](https://developers.facebook.com/tools/console/) para usar todos los métodos del SDK y explorar algunos ejemplos (puedes omitir los pasos de configuración, pero el resto del inicio rápido se debe probar en la consola).

**Navegadores compatibles**

El SDK de Facebook para JavaScript admite las últimas dos versiones de los navegadores más populares: Chrome, Firefox, Edge, Safari (incluido iOS) e Internet Explorer (solo versión 11).

## Configuración básica

Si quieres utilizar el SDK de Facebook para JavaScript no es necesario descargar ni instalar ningún archivo independiente. Solo necesitas incluir un breve fragmento de código JavaScript en tu HTML que cargará asincrónicamente el SDK en tus páginas. La carga asincrónica del SDK no bloqueará la de otros elementos de la página.

El siguiente fragmento de código te mostrará la versión básica del SDK con las opciones configuradas en sus valores predeterminados más comunes. Debes insertarlo directamente después de la etiqueta `<body>` de apertura en cada página que quieres que lo cargue:

```html
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId            : 'your-app-id',
      xfbml            : true,
      version          : 'v24.0'
    });
  };
</script>
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
```

Este código cargará **e** inicializará el SDK. Debes reemplazar el valor de `your-app-id` con el identificador de tu propia app de Facebook. Encontrarás este identificador con el [panel de apps](https://developers.facebook.com/apps).

## Próximos pasos

- [Configuración avanzada](https://developers.facebook.com/docs/javascript/advanced-setup)
- [Ejemplos de uso](https://developers.facebook.com/docs/javascript/examples)

[Me gusta](https://developers.facebook.com/docs/javascript/quickstart/)



## Page: https://developers.facebook.com/docs/javascript/howto/requirejs

```markdown
# SDK de Facebook para JavaScript con RequireJS

En este tutorial aprenderás a usar RequireJS para incorporar el [SDK de Facebook para JavaScript](https://developers.facebook.com/docs/javascript/quickstart/) a otros módulos de JavaScript. Como el SDK para JavaScript normalmente no es compatible con el patrón de diseño de [definición de módulos asincrónicos](https://l.facebook.com/l.php?u=http%3A%2F%2Frequirejs.org%2Fdocs%2Fwhyamd.html&h=AT0JMGQ3QUdoKGgRGEm7lZg9MwuTQLhvG2e3QHQujVIv98aOc7Y3sLY_qAPZ5wx_6tqhU0Zrf2bGtcpdAxsl206fSYAcuW-_-uoXLrQsIXLawPqCX62Qo7EpL4LfaEhKiftK1aKL0XR4ETPcuTzzsxPaCRcPJ55pwX9tN3bTkZ8), en este tutorial se explica cómo crear una corrección de compatibilidad para proporcionar el objeto de Facebook creado por el SDK.

Para realizar este tutorial se recomienda estar familiarizado con los módulos de RequireJS y JavaScript. [Obtén más información sobre RequireJS](https://l.facebook.com/l.php?u=http%3A%2F%2Frequirejs.org%2F&h=AT1sbbhDSUVETby9Dc9Mmjb0Id8Z3l6xrW3WVMOQCrgjy87mnrljpsdzuU5oR2BPkOnLdfMm4SCj1gaK0jPe8cJAN1YqckXOK1kfSa_OkMSCo2FIWt_6grXDL393NfjtGMyCaTh5sTF-ykh5QPg4kjVrtsD7khwpUoEDylaOM9w).

## Configuración

Configura el resto de scripts de RequireJS de la forma habitual y agrega un nuevo archivo .js para establecer la interacción con el SDK de Facebook. Este proyecto usará una estructura de directorios como la siguiente:

```
- project/
  - index.html
  - scripts/
    - main.js
    - require.js
```

Agrega un nuevo archivo para configurar e interactuar con el SDK, como se muestra a continuación:

```
- project/
  - index.html
  - scripts/
    - main.js
    - require.js
    - fb.js
```

Importa el script `requirejs` y declara `main.js` como el atributo "data-main" tal como se indica:

```html
<script data-main="scripts/main" src="scripts/require.js"></script>
```

## Agregar una corrección de compatibilidad al SDK de Facebook

En el script principal del proyecto, agrega una declaración de corrección de compatibilidad a `require.config` según se muestra a continuación:

```javascript
require.config({
  shim: {
    'facebook': {
      exports: 'FB'
    }
  },
  paths: {
    'facebook': 'https://connect.facebook.net/en_US/sdk.js'
  }
});

require(['fb']);
```

De este modo, se crea un módulo `facebook`, con la URL del SDK para JavaScript, y se marca el objeto `FB` como exportado para ese módulo.

En el archivo `fb.js` que acabas de crear puedes crear una instancia del objeto de Facebook y usarlo como lo harías normalmente. Agrega el identificador de la aplicación desde el [panel de aplicaciones](https://developers.facebook.com/apps).

Solo necesitas incluir el código en un bloque "define", en el cual se comunica el módulo de corrección de compatibilidad `facebook` como una dependencia necesaria.

```javascript
define(['facebook'], function() {
  FB.init({
    appId: '{your-app-id}',
    version: 'v24.0'
  });
  FB.getLoginStatus(function(response) {
    console.log(response);
  });
});
```

## Más información

- [Introducción al SDK de Facebook para JavaScript](https://developers.facebook.com/docs/javascript/quickstart/)
- [Referencias del SDK para JavaScript](https://developers.facebook.com/docs/reference/javascript)
```