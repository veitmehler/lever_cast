# API Documentation

**Source URL:** https://developers.facebook.com/docs/meta-pixel/
**Scraped Date:** 2025-11-12 14:02:03

---



## Page: https://developers.facebook.com/docs/meta-pixel/

```markdown
# Píxel de Meta

El píxel de Meta es un fragmento de código JavaScript que te permite realizar un seguimiento de la actividad de los visitantes de tu sitio web. Funciona cargando una pequeña biblioteca de funciones que puedes usar cuando un visitante del sitio realiza una acción (denominada **evento**) a la que quieres hacer un seguimiento (denominada **conversión**). Las [conversiones seguidas](/docs/facebook-pixel/implementation/conversion-tracking) aparecen en el [administrador de anuncios](https://www.facebook.com/adsmanager), donde se pueden utilizar con el objetivo de medir la efectividad de tus anuncios, definir [públicos personalizados](/docs/facebook-pixel/implementation/custom-audiences) para segmentar anuncios, realizar campañas de [anuncios del catálogo Advantage+](/docs/facebook-pixel/implementation/dynamic-ads) y analizar la efectividad de los embudos de conversión de tu sitio web.

El píxel de Meta puede recopilar los siguientes datos:

- **Encabezados HTTP**: todo lo que suele estar presente en encabezados HTTP, un protocolo web estándar que se envía entre cualquier solicitud del navegador y cualquier servidor en internet. Incluyen datos como direcciones IP, información sobre el navegador web, la ubicación de la página, el documento, el origen de referencia y la persona que está usando el sitio web.
- **Datos específicos del píxel**: incluyen el identificador del píxel y la cookie de Facebook.
- **Datos de clics en botones**: incluye los botones en los que los visitantes del sitio hacen clic, las etiquetas de esos botones y las páginas que se visitan como resultado de esos clics.
- **Valores opcionales**: los desarrolladores y los anunciantes tienen la opción de elegir enviar información adicional acerca de la visita mediante eventos de datos personalizados. Algunos ejemplos de eventos de datos personalizados son [valor de conversión, tipo de página y más](/docs/facebook-pixel/implementation/custom-audiences).
- **Nombres de campos de formularios**: incluye los nombres de los campos del sitio web, como `email`, `address`, `quantity`, etc. para los casos en los que compras un producto o servicio. No capturamos los valores de los campos, a menos que los incluyas como parte de las [coincidencias avanzadas](/docs/facebook-pixel/advanced/advanced-matching) o los valores opcionales.

## Contenido de la documentación

| Primeros pasos | Guías |
|----------------|-------|
| [Primeros pasos](https://developers.facebook.com/docs/facebook-pixel/get-started) | [Guías](https://developers.facebook.com/docs/facebook-pixel/guides) |
| Un breve tutorial sobre cómo agregar el código base del píxel a tus páginas web. | Guías basadas en casos de uso que te ayudan a realizar acciones específicas. |

| Referencias | Ayuda |
|-------------|-------|
| [Referencias](https://developers.facebook.com/docs/facebook-pixel/reference) | [Ayuda](https://developers.facebook.com/docs/facebook-pixel/support) |
| Especificaciones de productos y referencias de puntos de conexión. | Soluciones a problemas comunes, consejos para solucionar problemas y herramientas. |

## Más información

- Hacer seguimiento de la actividad del usuario en una app para celulares con [eventos de la app de Facebook](/docs/app-events/).
- [Requisitos de iOS 14 de Apple para Píxel de Meta](https://www.facebook.com/business/help/721422165168355).

[¡Me gusta!](https://developers.facebook.com/docs/meta-pixel/)
```



## Page: https://developers.facebook.com/docs/meta-pixel/guides

```markdown
# Guías del píxel de Meta

Una lista de guías referidas al uso del píxel de Meta.

- [Públicos personalizados](https://developers.facebook.com/docs/facebook-pixel/implementation/custom-audiences)
- [RGPD](https://developers.facebook.com/docs/facebook-pixel/implementation/gdpr)
- [Opciones de procesamiento de datos para Uusuarios de EE. UU.](https://developers.facebook.com/docs/meta-pixel/implementation/data-processing-options)
- [SPA de etiquetado](https://developers.facebook.com/docs/facebook-pixel/implementation/tag_spa)
- [Seguimiento preciso de eventos](https://developers.facebook.com/docs/facebook-pixel/implementation/accurate_event_tracking)
- [Uso compartido del píxel entre agencias](https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/business-pixel-sharing)

---

### En esta página

- [Guías del píxel de Meta](#gu-as-del-p-xel-de-meta)

---

© 2025 Meta

- [Información](https://l.facebook.com/l.php?u=https%3A%2F%2Fabout.fb.com%2F)
- [Empleos](https://www.facebook.com/careers)
- [Política de privacidad](https://www.facebook.com/about/privacy)
- [Cookies](https://www.facebook.com/help/cookies)
- [Condiciones](https://www.facebook.com/policies)

---

**Síguenos**

- [Facebook](https://www.facebook.com/MetaforDevelopers)
- [Instagram](https://www.instagram.com/metafordevelopers/)
- [Twitter](https://twitter.com/metafordevs)
- [LinkedIn](https://www.linkedin.com/showcase/meta-for-developers/)
- [YouTube](https://www.youtube.com/MetaDevelopers/)
```



## Page: https://developers.facebook.com/docs/facebook-pixel/advanced/advanced-matching

# Coincidencias avanzadas

En este documento, se explica cómo implementar manualmente las coincidencias avanzadas para los [eventos de conversión registrados](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking) con el píxel de Meta.

Visita la [Guía para el uso de los datos y la privacidad](https://www.facebook.com/business/m/privacy-and-data?Data-Use-&amp;-Ads) a fin de conocer qué datos se envían cuando se usa el píxel de Meta.

Para [implementar automáticamente las coincidencias avanzadas](https://www.facebook.com/business/help/1993001664341800), usa el [administrador de eventos](https://business.facebook.com/events_manager/).

## Implementación

Para usar las coincidencias avanzadas, formatea los datos del visitante como un objeto JSON e inclúyelos en la [llamada a la función `fbq('init')` del código base de tu píxel](https://developers.facebook.com/docs/facebook-pixel/implementation#base-code) como tercer parámetro.

Asegúrate de incluir los parámetros de las coincidencias avanzadas en el código base del píxel. Caso contrario, no se tratarán los valores como valores de coincidencias avanzadas manuales.

Por ejemplo, si el identificador del píxel es `283859598862258`, puedes hacer lo siguiente:

```javascript
fbq('init', '283859598862258', {
  em: 'email@email.com',         //Values will be hashed automatically by the pixel using SHA-256
  fn: 'first_name',
  ln: 'last_name'
  ...
});
```

**Nota:** Aceptamos en tus llamadas a la función direcciones de correo electrónico en minúscula sin formato hash, o bien normalizadas y convertidas a formato hash SHA-256.

#### Enviar más valores en formato hash

Puedes usar la etiqueta `<img>` para pasar tus propios datos de visitante si les das formato y los conviertes a formato hash SHA-256.

El siguiente es un ejemplo de cómo pasar el correo electrónico, el nombre y el apellido del usuario en formato hash:

```html
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr/?id=PIXEL_ID&amp;ev=Purchase
  &amp;ud[em]=f1904cf1a9d73a55fa5de0ac823c4403ded71afd4c3248d00bdcd0866552bb79
  &amp;ud[fn]=4ca6f6d5a544bf57c323657ad33aae1a019c775518cf4414beedb86962aea7c1
  &amp;ud[ln]=41f3e15ff8a4e4117da46465954304497ef29bdf35afaa9e36d527864d24c266
  &amp;cd[value]=0.00
  &amp;cd[currency]=USD"/>
```

## Referencias

| Datos del usuario          | Parámetro     | Formato                                                                 | Ejemplo                                                                                      |
|----------------------------|---------------|-------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| Correo electrónico          | `em`         | Sin formato hash en minúscula, o bien en formato hash SHA-256          | `jsmith@example.com` o `6e3913852f512d76acff15d1e402c7502a5bbe6101745a7120a2a4833ebd2350` |
| Nombre                      | `fn`         | Letras en minúscula                                                    | `john`                                                                                       |
| Apellido                    | `ln`         | Letras en minúscula                                                    | `smith`                                                                                      |
| Teléfono                   | `ph`         | Dígitos que solo incluyen el código de país y el código de área       | `16505554444`                                                                                |
| Identificador externo       | `external_id`| Cualquier identificador único del anunciante                           | `a@example.com`                                                                              |
| Sexo                        | `ge`         | Una sola letra minúscula, `f` o `m`, si no se sabe, dejar en blanco   | `f`                                                                                          |
| Fecha de nacimiento         | `db`         | Solo dígitos que indiquen el año, el mes y el día de nacimiento       | `19910526` para el 26 de mayo de 1991.                                                     |
| Ciudad                      | `ct`         | Minúscula sin espacios                                                 | `menlopark`                                                                                  |
| Estado o provincia          | `st`         | Código de provincia o estado de dos letras minúsculas                  | `ca`                                                                                         |
| Código postal               | `zp`         | Cadena                                                                 | `94025`                                                                                      |
| País                        | `country`    | Código de país de dos letras minúsculas                                | `us`                                                                                         |

## Más información

- Curso de Meta Blueprint: [Coincidencias avanzadas en sitios web](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F211540-advanced-matching-for-websites%3Fcontent_id%3DXmPXIuAmW8z20zl&amp;h=AT1H1ntrZtpt2LxLsHQbbJWTR5nOiKbqZKZDPDYa450coyKLN7fOj64XvmbXIErTfPLP7_7jlc04R0xwz7W44xYh-SZ4sgHthCS3N4dEJ7daxOkjf4wjhm5KZa0bp5l2CU3greMl3i5_AqfXmCiVdHsQh64)

[Like us on Facebook](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching/)



## Page: https://developers.facebook.com/docs/meta-pixel/reference

```markdown
# Referencia

## Eventos estándar

Puedes usar la función `fbq('track')` del píxel de Meta para realizar un seguimiento de los siguientes [eventos estándar](/docs/facebook-pixel/implementation/conversion-tracking#standard-events). Los eventos estándar también admiten objetos de [parámetros](#object-properties) con propiedades de objeto específicas, que te permiten incluir información detallada acerca de un evento.

Si implementas el píxel de Meta junto con la [API de conversiones](/docs/marketing-api/conversions-api), te recomendamos que incluyas el parámetro `eventID` como un cuarto parámetro de la función `fbq(‘track’)`. Consulta la documentación [Deduplicar los eventos del píxel y del servidor](/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events) para obtener más información.

| Nombre del evento         | Descripción del evento                                                                 | Propiedades del objeto                                                                 | Valor custom_event_type del objeto promocionado |
|---------------------------|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------|
| `AddPaymentInfo`          | Cuando se agrega la información de pago al proceso de pago.                         | `content_ids`, `contents`, `currency`, `value` <br/><i>Opcional.</i>                | ADD_PAYMENT_INFO                                  |
| `AddToCart`               | Cuando se agrega un producto al carrito de compras.                                  | `content_ids`, `content_type`, `contents`, `currency`, `value` <br/><i>Opcional.</i> <br/><i style="color:grey">Obligatorio en el caso de los anuncios del catálogo Advantage+: `contents`</i> | ADD_TO_CART                                       |
| `AddToWishlist`           | Cuando se agrega un producto a la lista de deseos.                                   | `content_ids`, `contents`, `currency`, `value` <br/><i>Opcional.</i>                | ADD_TO_WISHLIST                                   |
| `CompleteRegistration`    | Cuando se completa un formulario de registro.                                        | `currency`, `value` <br/><i>Opcional.</i>                                          | COMPLETE_REGISTRATION                              |
| `Contact`                 | Cuando una persona inicia un contacto con tu empresa por teléfono, SMS, correo electrónico, chat, etc. | <i>Opcional.</i>                                                                      | CONTACT                                           |
| `CustomizeProduct`        | Cuando una persona personaliza un producto.                                          | <i>Opcional.</i>                                                                      | CUSTOMIZE_PRODUCT                                 |
| `Donate`                  | Cuando una persona dona fondos a tu organización o causa.                            | <i>Opcional.</i>                                                                      |                                                  |
| `FindLocation`            | Cuando una persona busca dónde está ubicada tu tienda en un sitio web o app, con la intención de visitar el lugar. | <i>Opcional.</i>                                                                      | FIND_LOCATION                                     |
| `InitiateCheckout`        | Cuando una persona ingresa al proceso de pago antes de completarlo.                  | `content_ids`, `contents`, `currency`, `num_items`, `value` <br/><i>Opcional.</i>   | INITIATE_CHECKOUT                                 |
| `Lead`                    | Cuando se completa un registro.                                                       | `currency`, `value` <br/><i>Opcional.</i>                                          | LEAD                                             |
| `Purchase`                | Cuando se realiza una compra o se completa el proceso de pago.                       | `content_ids`, `content_type`, `contents`, `currency`, `num_items`, `value` <br/><i><b>Obligatorios: </b>`currency` y `value`</i> <br/><i style="color:grey">Obligatorio en el caso de los anuncios del catálogo de Advantage+: `contents` o `content_ids`</i> | PURCHASE                                         |
| `Schedule`                | Cuando una persona concierta una cita para visitar alguna de tus ubicaciones.       | <i>Opcional.</i>                                                                      | SCHEDULE                                         |
| `Search`                  | Cuando se realiza una búsqueda.                                                       | `content_ids`, `content_type`, `contents`, `currency`, `search_string`, `value` <br/><i>Opcional.</i> <br/><i style="color:grey">Obligatorio en el caso de los anuncios del catálogo de Advantage+: `contents` o `content_ids`</i> | SEARCH                                           |
| `StartTrial`              | Cuando una persona inicia una prueba gratuita de un producto o servicio que ofreces. | `currency`, `predicted_ltv`, `value` <br/><i>Opcional.</i>                          | START_TRIAL                                      |
| `SubmitApplication`       | Cuando una persona solicita un producto, un servicio o un programa que ofreces.     | <i>Opcional.</i>                                                                      | SUBMIT_APPLICATION                                |
| `Subscribe`               | Cuando una persona solicita iniciar una suscripción pagada a un producto o servicio que ofreces. | `currency`, `predicted_ltv`, `value` <br/><i>Opcional.</i>                          | SUBSCRIBE                                        |
| `ViewContent`             | Visitar una página de contenido que te interesa, como una página de producto o de destino. `ViewContent` indica si alguien visita la URL de una página web, pero no lo que mira o hace en esa página. | `content_ids`, `content_type`, `contents`, `currency`, `value` <br/><i>Opcional.</i> <br/><i style="color:grey">Obligatorio en el caso de los anuncios del catálogo de Advantage+: `contents` o `content_ids`</i> | VIEW_CONTENT                                      |

## Propiedades de los objetos

Puedes incluir las siguientes propiedades de objeto predefinidas con cualquier evento personalizado y con cualquier evento estándar que las admita. Da formato a tus datos de objeto de parámetro usando JSON. Obtén más información sobre los parámetros del evento con [Blueprint](https://www.facebookblueprint.com/student/collection/240330/path/210140?content_id=9yCDpJgXbYOg8OK).

| Clave de propiedad         | Tipo de valor                          | Descripción del parámetro                                                                 |
|----------------------------|----------------------------------------|-------------------------------------------------------------------------------------------|
| `content_category`         | Cadena                                 | Categoría de la página o el producto. <i>Opcional.</i>                                   |
| `content_ids`              | Matriz de enteros o cadenas            | Identificadores de producto asociados con el evento, como SKU (p. ej., `['ABC123', 'XYZ789']`). |
| `content_name`             | Cadena                                 | Nombre de la página o del producto. <i>Opcional.</i>                                     |
| `content_type`             | Cadena                                 | Puede ser `product` o `product_group` según qué `content_ids` o `contents` se pasen. Si los identificadores que se pasan en el parámetro `content_ids` o `contents` son identificadores de productos, el valor debe ser `product`. Si se pasan identificadores de grupos de productos, el valor debe ser `product_group`. <br/><br/> Si no se proporciona ningún `content_type`, Meta hará que el evento coincida con todos los elementos que tengan el mismo identificador, independientemente del tipo. |
| `contents`                 | Matriz de objetos                      | Una matriz de objetos JSON que contiene la cantidad y el número de artículo internacional (EAN), cuando corresponde, u otros identificadores de productos o contenidos. `id` y `quantity` son los campos obligatorios, por ej., `[{'id': 'ABC123', 'quantity': 2}, {'id': 'XYZ789', 'quantity': 2}]`. |
| `currency`                 | Cadena                                 | La divisa para el `value` especificado.                                                  |
| `num_items`                | Entero                                 | Se utiliza con el evento `InitiateCheckout`. El número de artículos cuando se inició el pago. |
| `predicted_ltv`           | Entero, float                         | Valor previsto de un suscriptor a largo plazo de acuerdo con la definición del anunciante, que se expresa como un valor exacto. |
| `search_string`            | Cadena                                 | Se utiliza con el evento `Search`. La cadena que ingresa el usuario para la búsqueda.    |
| `status`                   | Booleano                               | Se utiliza con el evento `CompleteRegistration` para mostrar el estado del registro. <i>Opcional.</i> |
| `value`                    | Entero o float                        | El valor de un usuario que realiza este evento para el negocio.                          |

[Like us on Facebook](https://developers.facebook.com/docs/meta-pixel/reference/)
```



## Page: https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking

```markdown
# Seguimiento de conversiones

Puedes usar el píxel de Meta para hacer seguimiento de las acciones de los visitantes de tu sitio web, lo que se conoce como "seguimiento de las conversiones". Las conversiones registradas aparecen en el [administrador de anuncios de Facebook](https://www.facebook.com/adsmanager) y en el [administrador de eventos de Facebook](https://www.facebook.com/events_manager2), donde se pueden usar para analizar la eficacia de tu embudo de conversión y medir el retorno de tu inversión en publicidad. También puedes usar las conversiones de las que se hace un seguimiento para definir [públicos personalizados](https://developers.facebook.com/docs/facebook-pixel/implementation/custom-audiences) y así optimizar los anuncios y las campañas de [anuncios del catálogo de Advantage+](https://developers.facebook.com/docs/facebook-pixel/implementation/dynamic-ads). Una vez que defines públicos personalizados, podemos usarlos para identificar a otros usuarios de Facebook con probabilidades de realizar una conversión y dirigirles tus anuncios.

Existen tres métodos para realizar un seguimiento de conversiones con el píxel:

- [Eventos estándar](#standard-events), que son acciones de visitantes que nosotros definimos y que tú informas llamando a una función del píxel
- [Eventos personalizados](#custom-events), que son acciones de visitantes que tú definiste y que informas llamando a una función del píxel
- [Conversiones personalizadas](#custom-conversions), que son acciones de visitantes de las que se realiza un seguimiento automático mediante el análisis de las URL de referencia de tu sitio web

A partir del 2 de septiembre de 2025, comenzaremos a implementar restricciones más proactivas en las conversiones personalizadas que pueden sugerir información que no está permitida según las disposiciones de [nuestras condiciones](https://www.facebook.com/legal/terms/businesstools?_rdr). Por ejemplo, toda conversión personalizada que sugiera condiciones de salud concretas (por ejemplo, "artritis", "diabetes") o estado financiero (por ejemplo "puntuación crediticia", "altos ingresos") se marcará y se evitará que se utilice para poner en circulación campañas publicitarias.

**Cómo se ven afectadas tus campañas por estas restricciones:**

- No podrás usar conversiones personalizadas marcadas al crear nuevas campañas.
- Si tienes una campaña activa en la que se usan conversiones personalizadas marcadas, deberías crear una nueva campaña o duplicar esa campaña y usar una conversión personalizada no afectada para evitar problemas de rendimiento y optimización.

**Para desarrolladores de API:**

- A partir del 2 de septiembre de 2025, el campo `is_unavailable` devolverá `true` para señalar si sus conversiones personalizadas se marcaron.

Podrás ver más información sobre esta actualización y cómo resolver las conversiones personalizadas marcadas [aquí](https://www.facebook.com/business/help/2455915321411996).

## Requisitos

El [código base](https://developers.facebook.com/docs/facebook-pixel/implementation#base-code) del píxel ya debe estar instalado en todas las páginas en las que quieras realizar un seguimiento de las conversiones.

## Eventos estándar

Los [eventos estándar](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events) son acciones predefinidas de los visitantes que corresponden a actividades comunes y relacionadas con la conversión, como buscar, ver o comprar un producto. Los eventos estándar admiten [parámetros](#parameters), que te permiten incluir un objeto con información adicional acerca de un evento, como identificadores de productos, categorías y el número de productos comprados.

Para obtener una lista de todos los [eventos estándar](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events), consulta la [referencia de eventos estándar del píxel](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events). Obtén más información sobre el seguimiento de las conversiones y los eventos estándar con [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219710-technical-implementation-meta-pixel%3Fcontent_id%3Den4RqCL2PfBZrUU&h=AT02BZ0haJDxkLbBpfBdgi-o6sRxs3X1MbYM2rDcFvM8X_Mkp_FcsoENDVQ3U6oxEcsZdjv-JIgVl_REZ_d7zob2IBOLHxMG-iUFrf2UoPvOxLcg_ihxYysvizwWcKXQ0_l2vE6VBK34JISrqKc0adzAppgI5tr3KSiWAlLq).

### Seguimiento de eventos estándar

Para hacer el seguimiento de todos los eventos estándar, se llama a la función `fbq('track')` del píxel, con el nombre del evento y, opcionalmente, un objeto JSON como parámetro. Por ejemplo, esta es una llamada de función para registrar que un visitante completó un evento de compra, que incluye como parámetro la divisa y el valor:

```javascript
fbq('track', 'Purchase', {
  currency: "USD",
  value: 30.00
});
```

Si llamas a esa función, se registra como un evento de compra en el administrador de eventos:

![Evento de compra](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/39949625_1790839247617931_4027789432194072576_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=Z1h9IIvD4nwQ7kNvwEzOGc9&_nc_oc=AdnaRSF_7RNW5JLqT88Nry4TEeADna8B9CE05x8BBqy9TZHtzXoAansvnA4xyncq0yo&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=2258zPOYhaPsiBKwklrucQ&oh=00_Afho0jGkBeqipYkax4LlJuA5TdCJP7nx4nStUyznppgPHw&oe=692EF35C)

Puedes colocar la llamada de función `fbq('track')` en cualquier lugar entre las etiquetas `<body>` de apertura y cierre de tu página web, ya sea cuando se carga la página o cuando un visitante completa una acción, como hacer clic en un botón.

Por ejemplo, si quieres realizar un seguimiento de un evento de compra estándar *después de que un visitante completa la compra*, puedes colocar la llamada a la función `fbq('track')` en tu *página de confirmación de compra*, de esta forma:

```html
<body>
  ...
  <script>
    fbq('track', 'Purchase', {
      currency: "USD",
      value: 30.00
    });
  </script>
  ...
</body>
```

Si, por el contrario, quieres realizar un seguimiento de un evento de compra estándar *cuando el visitante hace clic en el botón Comprar*, puedes vincular la llamada de la función `fbq('track')` al botón Comprar *en tu página de pago*, de la siguiente manera:

```html
<button id="addToCartButton">Purchase</button>
<script type="text/javascript">
  $('#addToCartButton').click(function() {
    fbq('track', 'Purchase', {
      currency: "USD",
      value: 30.00
    });
  });
</script>
```

Ten en cuenta que, en el ejemplo anterior, se usa jQuery para activar la llamada a la función, pero puedes activarla usando el método que desees.

## Eventos personalizados

Si nuestros eventos estándar predefinidos no satisfacen tus necesidades, puedes realizar un seguimiento de tus propios eventos personalizados, que, además, se pueden usar para definir [públicos personalizados](https://developers.facebook.com/docs/facebook-pixel/implementation/custom-audiences) con el objetivo de optimizar los anuncios. Los eventos personalizados también admiten [parámetros](#parameters), que puedes incluir para brindar información adicional acerca de cada evento personalizado.

Obtén más información sobre el seguimiento de las conversiones y los eventos personalizados con [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219710-technical-implementation-meta-pixel%3Fcontent_id%3Den4RqCL2PfBZrUU&h=AT3Z2JiZ5t4R_2hUwyy7vY9PKarHLcQDP_CPw4utsyHvxDjddw62tz-ZE0k2-IUoeAWAj6AHDso2oiv-h4orwl6KHBwvSdooeCpbbwirEh6ZsKAA3j-7oXtPtmEnDAaKxaJ8wRoBiSfH0CjtWzA0z_6-Dno).

### Seguimiento de eventos personalizados

Puedes realizar un seguimiento de los eventos personalizados llamando a la función `fbq('trackCustom')` del píxel, con el nombre de tu evento personalizado y, opcionalmente, un objeto JSON como parámetros. Al igual que en el caso de los eventos estándar, puedes colocar una llamada a la función `fbq('trackCustom')` en cualquier lugar entre las etiquetas `<body>` de apertura y cierre de tu sitio web, ya sea cuando se carga la página o cuando un visitante realiza una acción, como hacer clic en un botón.

Por ejemplo, imagina que quieres realizar un seguimiento de los visitantes que comparten una promoción para obtener un descuento. Puedes registrarlos mediante un evento personalizado, de la siguiente manera:

```javascript
fbq('trackCustom', 'ShareDiscount', {
  promotion: 'share_discount_10%'
});
```

Los nombres de los eventos personalizados deben ser cadenas y no pueden tener más de 50 caracteres.

## Conversiones personalizadas

Cada vez que se carga el píxel, este llama automáticamente a `fbq('track', 'PageView')` para rastrear un evento estándar PageView. Los eventos estándar PageView registran la URL de referencia de la página que activó la llamada a la función. Puedes utilizar estas URL registradas en el administrador de eventos para definir las acciones de los visitantes de las que deseas realizar un seguimiento.

Por ejemplo, imagina que diriges a los visitantes que se suscriben a tu lista de correo hacia una página de agradecimiento. Puedes configurar una conversión personalizada que realice un seguimiento de los visitantes del sitio web que hayan visto cualquier página que tenga `/thank-you` en su URL. Si tu página de agradecimiento es la única que tiene `/thank-you` en su URL e instalaste el píxel en esa página, se realizará un seguimiento de todas las personas que la vean, mediante la conversión personalizada.

Una vez que se ha realizado un seguimiento de las conversiones personalizadas, estas se pueden usar para optimizar tus campañas publicitarias, definir [públicos personalizados](https://developers.facebook.com/docs/facebook-pixel/implementation/custom-audiences) y precisar aún más los públicos personalizados que dependen de eventos estándar o personalizados. Obtén más información sobre las conversiones personalizadas con [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219710-technical-implementation-meta-pixel%3Fcontent_id%3Den4RqCL2PfBZrUU&h=AT1NYjYZxrQEFMw4wQGj-k-KFaRaR44s5S7YBXnMuIvdBzfh-BgegTWWEG9ccAtje5RBHYw4XRCQpTPnCS00sDVmOckJF3wivFU_KdBwPmQcZth-lFn27NAHRY8I-2nS_mvkXaeKwwct186Z8DGsSFt_1lI).

Dado que las conversiones personalizadas dependen de URL completas o parciales, tienes que asegurarte de poder definir las acciones de los visitantes exclusivamente en función de cadenas únicas de las URL de tu sitio web.

### Creación de conversiones personalizadas

Las conversiones personalizadas se crean en su totalidad dentro del administrador de eventos. Para obtener información sobre cómo hacerlo, consulta nuestro [documento de ayuda para anunciantes](https://www.facebook.com/business/help/434245993430255).

### Conversiones personalizadas basadas en reglas

Crea optimizaciones para acciones y regístralas sin agregar nada al código base del píxel de Meta. Puedes hacerlo de forma adicional a los 17 eventos estándares.

1. Crea una conversión personalizada en `/{AD_ACCOUNT_ID}/customconversions`.
2. Especifica una URL o una URL parcial que represente un evento en `pixel_rule`. Por ejemplo, `thankyou.html` es una página que aparece después de la compra.

De la siguiente manera, puedes registrar una conversión de `PURCHASE` cuando se muestra `'thankyou.html'`:

Luego, puedes crear tu campaña con el objetivo `CONVERSIONS`.

En el nivel del conjunto de anuncios, especifica la misma conversión personalizada (`pixel_id`, `pixel_rule`, `custom_event_type`) en `promoted_object`.

### Estadísticas de conversiones personalizadas

[Estadísticas de anuncios](https://developers.facebook.com/docs/marketing-api/insights-api) muestra información sobre las conversiones personalizadas:

```bash
curl -i -G \
-d 'fields=actions,action_values' \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v2.7/<AD_ID>/insights
```

Muestra conversiones estándar y personalizadas:

```json
{
  "data": [
    {
      "actions": [
        {
          "action_type": "offsite_conversion.custom.17067367629523",
          "value": 1225
        },
        {
          "action_type": "offsite_conversion.fb_pixel_purchase",
          "value": 205
        }
      ],
      "action_values": [
        {
          "action_type": "offsite_conversion.custom.1706736762929507",
          "value": 29390.89
        },
        {
          "action_type": "offsite_conversion.fb_pixel_purchase",
          "value": 29390.89
        }
      ],
      "date_start": "2016-07-28",
      "date_stop": "2016-08-26"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MjQZD"
    },
    "next": "https://graph.facebook.com/v2.7/<AD_ID>/insights?access_token=<ACCESS_TOKEN>&pretty=0&fields=actions%2Caction_values&date_preset=last_30_days&level=adset&limit=25&after=MjQZD"
  }
}
```

Las conversiones personalizadas tienen identificadores únicos; efectúa una consulta al respecto para realizar una conversión específica, p. ej., una basada en reglas:

```bash
curl -i -G \
-d 'fields=name,pixel,pixel_aggregation_rule' \
-d 'access_token=ACCESS-TOKEN' \
https://graph.facebook.com/v2.7/<CUSTOM_CONVERSION_ID>
```

### Limitaciones de las conversiones personalizadas

El número máximo de conversiones personalizadas por cuenta publicitaria es 100. Si utilizas la API de estadísticas de anuncios para obtener métricas sobre las conversiones personalizadas:

- No se admite la obtención de desgloses del identificador del producto.
- No se admite la obtención de recuentos de acciones únicas.

### Conversiones personalizadas marcadas

Si se marca una conversión personalizada, el campo `is_unavailable` se configurará en `true`.

```json
{ "is_unavailable": true, "id": "30141209892193360" }
```

#### Cómo solucionar problemas de conversiones personalizadas marcadas

Si alguna de tus conversiones personalizadas queda marcada por sugerir información que no está permitida según las disposiciones de nuestras condiciones, puedes considerar las siguientes opciones:

Para solucionar el problema de una conversión personalizada marcada al crear una nueva campaña:

- **Crea una nueva conversión personalizada**: usa una conversión personalizada nueva y asegúrate de que no incluya información que no esté permitida según las disposiciones de nuestras condiciones.
- **Elige una conversión personalizada diferente**: selecciona una conversión personalizada diferente y asegúrate de que no incluya información que no esté permitida según las disposiciones de nuestras condiciones.

Para solucionar problemas de conversión personalizada marcada en una campaña actual:

- **Duplica la campaña y selecciona una conversión personalizada existente**: si tienes una campaña en circulación y queda marcada debido a una conversión personalizada, considera duplicar la campaña y seleccionar una conversión personalizada diferente que no esté marcada antes de publicar la nueva campaña duplicada. **Nota:** Cuando se publique la campaña, no podrás eliminar ni seleccionar una conversión personalizada diferente.

#### Solicitar una revisión

Si crees que tu conversión personalizada se marcó por error y no incluye información no permitida, puedes solicitar una revisión en el administrador de anuncios (debajo de la tabla de campañas) o en el administrador de eventos (en de la página de conversiones personalizadas).

## Seguimiento de las conversiones fuera del sitio

Haz un seguimiento de las conversiones con tus píxeles agregando el campo `fb_pixel` al parámetro `tracking_spec` del anuncio. [Más información.](https://developers.facebook.com/docs/marketing-api/tracking-specs)

## Parámetros

Los parámetros son objetos opcionales con formato JSON que puedes incluir al hacer un seguimiento de eventos estándar y personalizados. Te permiten brindar información adicional sobre las acciones de los visitantes de tu sitio web. Una vez rastreados, los parámetros se pueden utilizar para definir mejor los públicos personalizados que creas. Obtén más información sobre los parámetros con [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219710-technical-implementation-meta-pixel%3Fcontent_id%3Den4RqCL2PfBZrUU&h=AT21uWIjv4AMFJToNvkk4vUxUep5c1kZbv8O6_9lqBWIEp-OJefa18bvu1JGN4SMYwMeDJwOiYPM2MZEgslgLV8bXaSUYucjzRhV9s8MBA910ymnsDs_J8QXmCwMgQJNPag9pw18UpnGPTGpd18uNVfoHWQ).

Para incluir un objeto de parámetro con un evento estándar o personalizado, otorga a tus datos de parámetro un formato de objeto JSON y luego inclúyelo como el tercer parámetro de función al llamar a la función `fbq('track')` o `fbq('trackCustom')`.

Por ejemplo, imagina que deseas realizar un seguimiento de un visitante que compró varios productos como resultado de tu promoción. Puedes hacer lo siguiente:

```javascript
fbq('track', 'Purchase', {
  value: 115.00,
  currency: 'USD',
  contents: [
    { id: '301', quantity: 1 },
    { id: '401', quantity: 2 }
  ],
  content_type: 'product'
});
```

Ten en cuenta que, si quieres utilizar datos incluidos en los parámetros del evento al definir los públicos personalizados, **los valores clave no deben contener espacios**.

### Propiedades del objeto

Puedes incluir las siguientes propiedades de objeto predefinidas con cualquier evento personalizado y con cualquier [evento estándar que las admita](#pixel-standard-events). Da formato a tus datos de objeto de parámetro usando JSON.

| Clave de propiedad     | Tipo de valor                      | Descripción del parámetro                                                                 |
|------------------------|------------------------------------|-------------------------------------------------------------------------------------------|
| `content_category`     | Cadena                            | Categoría de la página o del producto.                                                  |
| `content_ids`          | matriz de enteros o cadenas       | Identificadores de producto asociados al evento, como SKU. Ejemplo: `['ABC123', 'XYZ789']`. |
| `content_name`         | Cadena                            | Nombre de la página o del producto.                                                      |
| `content_type`         | Cadena                            | Puede ser `product` o `product_group` según qué `content_ids` o `contents` se pasen.   |
| `contents`             | matriz de objetos                 | Una matriz de objetos JSON que contiene el número de artículo internacional (EAN), cuando corresponde, u otros identificadores de productos o contenidos asociados con el evento, además de las cantidades y los precios de los productos. **Obligatorios**: `id` y `quantity`. Ejemplo: `[{'id': 'ABC123', 'quantity': 2}, {'id': 'XYZ789', 'quantity': 2}]` |
| `currency`             | Cadena                            | Divisa para el `value` especificado.                                                    |
| `delivery_category`    | Cadena                            | Categoría de la entrega. Valores admitidos: `in_store`, `curbside`, `home_delivery`.    |
| `num_items`            | Número entero                     | Cantidad de artículos cuando se inició el pago. Se utiliza con el evento `InitiateCheckout`. |
| `predicted_ltv`       | entero, float                     | Valor previsto a largo plazo de un suscriptor de acuerdo con la definición del anunciante y expresado como un valor exacto. |
| `search_string`        | Cadena                            | Cadena que ingresa el usuario para la búsqueda. Se utiliza con el evento `Search`.       |
| `status`               | Booleano                         | Se utiliza con el evento `CompleteRegistration` para mostrar el estado del registro.    |
| `value`                | número entero o valor flotante    | Obligatorio para eventos de compras o cualquier evento que utiliza la optimización de valores. Un valor numérico asociado con el evento. Debe representar un importe monetario. |

### Propiedades personalizadas

Si nuestras propiedades de objeto predefinidas no satisfacen tus necesidades, puedes incluir tus propias propiedades personalizadas. Las propiedades personalizadas se pueden utilizar con eventos estándar y personalizados, y te pueden ayudar a definir mejor los públicos personalizados.

Por ejemplo, imagina que deseas realizar un seguimiento de un visitante que compró varios productos después de compararlos con otros. Puedes hacer lo siguiente:

```javascript
fbq('track', 'Purchase', {
  value: 115.00,
  currency: 'USD',
  contents: [
    { id: '301', quantity: 1 },
    { id: '401', quantity: 2 }
  ],
  content_type: 'product',
  compared_product: 'recommended-banner-shoes', // custom property
  delivery_category: 'in_store'
});
```

## Próximos pasos

Ahora que realizas un seguimiento de conversiones, te recomendamos que las uses para definir [públicos personalizados](https://developers.facebook.com/docs/facebook-pixel/implementation/custom-audiences) a fin de optimizar tus anuncios para las conversiones del sitio web.

## Más información

- Obtén más información sobre el seguimiento de las conversiones con [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219710-technical-implementation-meta-pixel%3Fcontent_id%3Den4RqCL2PfBZrUU&h=AT2MXEScotUOyTN0Bmq9uHwWavmCWWdoKhnAtfpKt56-phgziWTNRvdDFrPajiMRhlMVsy_pvR4gJRFVsrHwEfGktfMcVKGJ9pIraB48ESwLOrQRAT4MGMImaplcI1bSrirnz9nJCV868_YD4iWgN6v40E4).
```



## Page: https://developers.facebook.com/docs/meta-pixel/get-started

```markdown
# Get Started

The Meta Pixel is a snippet of JavaScript code that loads a small library of functions you can use to track Facebook ad-driven visitor activity on your website. It relies on [Facebook cookies](https://www.facebook.com/policies/cookies/), which enable us to match your website visitors to their respective Facebook User accounts. Once matched, we can tally their actions in the Facebook Ads Manager so you can use the data to analyze your website's conversion flows and optimize your ad campaigns.

By default, the Pixel will track URLs visited, domains visited, and the devices your visitors use. In addition, you can use the Pixel's library of functions to:

- [track conversions](https://docs.facebook.com/docs/facebook-pixel/implementation/conversion-tracking), so you can measure ad effectiveness
- define [custom audiences](https://docs.facebook.com/docs/facebook-pixel/implementation/custom-audiences), so you can target visitors who are more likely to convert
- set up [Advantage+ catalog ads](https://docs.facebook.com/docs/facebook-pixel/implementation/dynamic-ads) campaigns

### Requirements

In order to implement the Pixel, you will need:

- access to your website's code base
- your Pixel's [base code](https://docs.facebook.com/docs/facebook-pixel/implementation) or its ID
- access to the [Facebook Ads Manager](https://www.facebook.com/adsmanager)

In addition, depending on where you conduct business, you may have to comply with [General Data Protection Regulation](https://docs.facebook.com/docs/facebook-pixel/implementation/gdpr).

Ready? [Let's get started](https://docs.facebook.com/docs/facebook-pixel/implementation).

## Base Code

Before you can install the Pixel, you will need your Pixel's base code, which you can find in the [Ads Manager > Events Manager](https://business.facebook.com/events_manager). If you have not created a Pixel, [follow these instructions](https://www.facebook.com/business/help/952192354843755) to create one — all you will need is the Pixel's base code (step 1).

The base Pixel code contains your Pixel's ID in two places and looks like this:

```javascript
<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '{your-pixel-id-goes-here}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id={your-pixel-id-goes-here}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->
```

When run, this code will download a library of functions which you can then use for [conversion tracking](https://docs.facebook.com/docs/facebook-pixel/implementation/conversion-tracking). It also automatically tracks a single `PageView` conversion by calling the `fbq()` function each time it loads. *We recommend that you leave this function call intact*.

## Installing The Pixel

To install the Pixel, we highly recommend that you add its base code between the opening and closing `<head>` tags on every page where you will be tracking website visitor actions. Most developers add it to their website's persistent header, so it can be used on all pages.

Placing the code within your `<head>` tags reduces the chances of browsers or third-party code blocking the Pixel's execution. It also executes the code sooner, increasing the chance that your visitors are tracked before they leave your page.

Once you have added it to your website, load a page that has the Pixel. This should call `fbq('track', 'PageView')`, which will be tracked as a `PageView` event in the Events Manager.

<div style="text-align:center;margin-bottom:20px"><img alt="" class="_254 img" src="https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/40918111_2211034969153925_7326281962849566720_n.png?_nc_cat=102&ccb=1-7&_nc_sid=e280be&_nc_ohc=_XPklDb18SgQ7kNvwEtMbOn&_nc_oc=AdlZCEBkoYnPZ5bSC4_-lK2lgH7aSKf-pom2Ygj9PtShtd8gUoiuLRzHF6WdoTt-Uqk&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=AwXl8UBJzdhyk3wiM4RjQg&oh=00_Afjl0QZbgFTNyiT0FqjAwohnLvfQh7U9NMs6OLN-Kp-oLQ&oe=692F1BA5" width="650"/></div>

Verify that this event was tracked by going to your Events Manager. Locate your Pixel and click its details — if you see a new `PageView` event, you have successfully installed the Pixel. If you do not see it, wait a few minutes and refresh the page. If your Pixel is still not working, use the [Pixel Helper](#pixel-helper) to track down the problem.

### Installing Using a Tag Manager

Although we recommend adding the Pixel directly to your website's `<head>` tags, the Pixel will work in most tag management and tag container solutions. For specific advice on implementing the Pixel using your tag manager, please refer to your tag manager's documentation.

### Installing Using an IMG Tag

Although not recommended, you can alternately [install the Pixel using an `<img>` tag](https://docs.facebook.com/docs/facebook-pixel/advanced#installing-the-pixel-using-an-img-tag).

### Mobile Websites

If your mobile website is separate from your desktop website, we recommend that you add the Pixel to both. This will allow you to easily remarket to your mobile visitors, exclude them, or create lookalikes audiences.

## Pixel Helper

We highly recommend that you install our [Pixel Helper](https://docs.facebook.com/docs/facebook-pixel/support/pixel-helper) Chrome extension. The Pixel Helper provides extremely valuable feedback that can help you verify that your Pixel is working correctly, especially when you start tracking conversions, where you can easily encounter formatting errors.

## Next Steps

Once you have verified that the Pixel is installed and tracking the `PageView` event correctly, you can use the Pixel to:

- [track conversions](https://docs.facebook.com/docs/facebook-pixel/implementation/conversion-tracking)
- create [custom audiences](https://docs.facebook.com/docs/facebook-pixel/implementation/custom-audiences)
- set up [Advantage+ catalog ads](https://docs.facebook.com/docs/facebook-pixel/implementation/dynamic-ads)

Learn more about implementing the Pixel with [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fcollection%2F240330%2Fpath%2F210139%3Fcontent_id%3DyyTGMzFI48JBDxv&h=AT1gT3hHq4NUSbRKtCa7ISDDbMo2z3UOziqodyU6RHavdIbuc0CzTmconjEbI6MI3KR0duXu3-2l-QiIyEACT3mxa7FQc6Pdu9CUj4lXgTfexWYf8GSLbhBF8dvWll5fs35P7pkVsB19EvUONCYhKcJVq4M).

## Resources

- Meta Blueprint: [Learn more about implementing the pixel](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219710-technical-implementation-meta-pixel%3Fcontent_id%3Den4RqCL2PfBZrUU&h=AT1xbNsQg-toNqRV_fn3rI7u6O61ESP2JY2SZ_haofMlEbakWU9vjSfBIFsNokg4sEjp8xjnYSN0Dz44ZXhsFfvP3E7mAvrCTIwd22m3lAGzVNYCqKjryrdfMwv8wmbr4vnqmntMttQi0lh2Fzq6tvFFHAU).

```



## Page: https://developers.facebook.com/docs/meta-pixel/support

```markdown
# Support

## Pixel Helper

If you are new to the Meta Pixel, or are having trouble tracking conversions, use our [Pixel Helper chrome extension](https://developers.facebook.com/docs/facebook-pixel/support/pixel-helper) to help you with debugging.

## FAQs

### Why does my URL show a 404 browser error instead of redirecting to the correct webpage when the ClickID is added?

- When using URL Shortener Services and vanity URL's, the click ID is added to the URL, however, the "&" is changed to a "?", `&fbclid={facebook-click-id}` to `?fbclid={facebook-click-id}`, or vice versa causing the URL to break.

### Why are my query string parameters, such as Click ID, missing in the URL?

- The webpage does not accept URL parameters.
- The webpage does not accept unexpected URL parameters that have been appended to the URL.

Because these issues are happening on the webpage outside of Facebook, please work with the appropriate website management resources to handle missing query parameters or to ignore the `fbclid` to get the redirect to work as expected.

### Does the Meta Pixel impact website performance?

The Meta Pixel is loaded asynchronously and does not block the display of the web page. Because all advertisers use the same Pixel script, the Pixel code will be already be in the browser’s cache if a user has visited any website with the Pixel installed.

## Learn More

- Meta Blueprint course: [Optimize and Troubleshoot the Meta Pixel](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fpath%2F219716-optimize-troubleshoot-meta-pixel%3Fcontent_id%3DCoMTkdSbJeiPXE1&amp;h=AT3jLfZTrji6eOUpeozkdk83PVRElI66OZMU9uoo5N2cGxxVqabVtWRzdIk0ObUc_xE9gr4cnUVKOf3ddwudf9dzBS0SFyaGmHSEQbQNuVPjotA5cPaY-2T9RAjn_XW2SAuBWUTPi9gXbRaVvbjkbZeIXhWa1_7SbzxRIwXa)

--- 

© 2025 Meta

### Síguenos

- [Meta for Developers Facebook](https://www.facebook.com/MetaforDevelopers)
- [Meta for Developers Instagram](https://www.instagram.com/metafordevelopers/)
- [Meta for Developers Twitter](https://twitter.com/metafordevs)
- [Meta for Developers LinkedIn](https://www.linkedin.com/showcase/meta-for-developers/)
- [Meta for Developers YouTube](https://www.youtube.com/MetaDevelopers/)
```



## Page: https://developers.facebook.com/docs/facebook-pixel/implementation/dynamic-ads

```markdown
# Meta Pixel for Advantage+ Catalog Ads

Advantage+ catalog ads are dynamically created by populating an ad template with product information found in a data feed. This allows you to create thousands of ads without having to configure each of them individually. You can also use Advantage+ catalog ads to target visitors based on how they have interacted with your website in the past.

The general steps for creating Advantage+ catalog ads are:

1. Set up conversion tracking for the specific [standard events](#standard-events) and their parameter [object properties](#object-properties) listed below, then
2. Use the Commerce Manager to [set up a Advantage+ catalog ad set](https://www.facebook.com/business/help/1132465490107046?helpref=page_content) that targets those events

### Requirements

- You must have a Facebook Page for the business that your Advantage+ catalog ads will apply to.
- The Pixel [base code](https://developers.facebook.com/docs/facebook-pixel/implementation#base-code) must already be installed.
- You must have access to the [Facebook Ads Manager](https://www.facebook.com/adsmanager).

Learn more about connecting your Pixel to a commerce catalog with [Blueprint](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookblueprint.com%2Fstudent%2Fcollection%2F240330%2Fpath%2F210141%3Fcontent_id%3DE0G2EVplyh1dDB1&amp;h=AT2FlNzC4fBg7epEye1igj6n4ehXJ7-YWQgfOkxRbMWfzGrMqA-_K5oAvVRYUooi-APSVoILFNwBHvwl8tgkEwraHIgeiuBcKewZgO6vTml9jDDEemen2f5eK8PGEwIgIB5P0mwD1W5CPyc7NVhtNQrUKe8).

## Standard Events

Before you can set up Advantage+ catalog ads, you must first be tracking the following [standard events](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events). You must also include a parameter object with specific object properties with each tracked event.

| Required Event | Required Object Properties |
|----------------|----------------------------|
| `AddToCart`    | Either `content_ids` or `contents` |
| `Purchase`     | Either `content_ids` or `contents` |
| `ViewContent`  | Either `content_ids` or `contents` |

Refer to the [Object Properties](#object-properties) section below to learn what values to assign to the required object properties.

## Object Properties

### `content_ids`

If you are using the `content_ids` property in your parameter object, its value should correspond to the product ID or product IDs associated with the action. **IDs must match the IDs found in your product catalog**. Values can be either single IDs, or an array of IDs.

For example, here's how to track a visitor who has added products with the IDs `201` and `301` to a shopping cart. The IDs match the IDs for those products in the product catalog.

```javascript
fbq('track', 'AddToCart', {
  value: 5,
  currency: 'USD',
  content_ids: ['201', '301'] // required property, if not using 'contents' property
});
```

### `contents`

If you are using the `contents` property in your parameter object, in a sub-object, you must include the `id` property, with the product ID or product IDs as its value, and include the `quantity` property with a number of product items being added to cart or purchased. **IDs must match the IDs found in your product catalog**. The `contents` property value must be an array of objects.

For example, here's how to track a visitor who has added a product with the ID `301`, and two products with the ID `401`, to a shopping cart. The IDs match the IDs for those products in the product catalog.

```javascript
fbq('track', 'AddToCart', {
  value: 5,
  currency: 'USD',
  contents: [
    {
      id: '301',
      quantity: 1
    },
    {
      id: '401',
      quantity: 2
    }
  ],
});
```

## Commerce Manager

Once you have confirmed that the Events Manager is tracking your standard events correctly, use the [Commerce Manager](https://business.facebook.com/products) to set up your product catalog and Advantage+ catalog ad template, and target the standard events. Follow our [Create an Advantage+ Catalog Ad](https://www.facebook.com/business/help/1132465490107046) help document to do this.

After you complete all of the steps outlined in the document, be sure to use the Commerce Manager to verify that your catalog [recognizes your Pixel's events as a data source](https://www.facebook.com/business/help/946671458738854).

Note that it can take up to 24 hours for the Commerce Manager's **Events Data Sources** tab to recognize your tracked events.
```



## Page: https://developers.facebook.com/docs/facebook-pixel/implementation/custom-audiences

```markdown
# Públicos personalizados

Si estás realizando un [seguimiento de las conversiones](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking), puedes segmentar a los visitantes de tu sitio web en grupos según las acciones que realizaron en el sitio. Estos grupos se denominan **públicos personalizados**. Una vez que hayas definido un público personalizado, puedes [optimizar tus conjuntos de anuncios](https://www.facebook.com/business/help/1082085278508457) para dirigirte a otros usuarios de Facebook que coinciden con los criterios de ese público.

### Requisitos

- Es necesario que el [código base](https://developers.facebook.com/docs/facebook-pixel/implementation#base-code) esté instalado y haciendo un seguimiento de [eventos estándar](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events), [eventos personalizados](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-events) o [conversiones personalizadas](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-conversions).
- Debes tener acceso al [administrador de anuncios de Facebook](https://www.facebook.com/adsmanager).

## Definir públicos personalizados

Antes de poder definir un público personalizado, asegúrate de que el administrador de eventos está realizando un seguimiento correcto de tus eventos o conversiones personalizadas; de lo contrario, no podrás seleccionarlos en el administrador de eventos al configurar un público personalizado.

### Eventos estándar y personalizados

Para definir un público personalizado a partir de un evento estándar o personalizado, sigue las instrucciones de nuestro documento de ayuda del administrador comercial [Información sobre los públicos personalizados a partir del sitio web](https://www.facebook.com/business/help/1474662202748341).

### Conversiones personalizadas

Para crear un público a partir de una [conversión personalizada](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-conversions), sigue las instrucciones de nuestro documento de ayuda del administrador comercial [Información sobre los públicos personalizados a partir del sitio web](https://www.facebook.com/business/help/1474662202748341), pero selecciona **Personas que visitaron páginas web específicas** en el paso 4. Usa los mismos criterios de URL que utilizaste para definir la conversión personalizada.
```