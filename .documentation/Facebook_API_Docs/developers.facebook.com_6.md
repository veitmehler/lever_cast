# API Documentation

**Source URL:** https://developers.facebook.com/docs/facebook-login/
**Scraped Date:** 2025-11-12 14:21:48

---



## Page: https://developers.facebook.com/docs/facebook-login/

```markdown
# Inicio de sesión con Facebook

El inicio de sesión con Facebook es una forma cómoda, rápida y segura para que los usuarios inicien sesión en tu app y para que esta solicite permisos de acceso a datos.

## Si eres usuario de Facebook y tienes problemas para iniciar sesión en tu cuenta, visita nuestro [servicio de ayuda](https://www.facebook.com/help/1573156092981768/).

Después de que integras el inicio de sesión con Facebook, se registran y recopilan automáticamente determinados eventos de la app en el [administrador de eventos](https://www.facebook.com/events_manager), a menos que desactives el registro automático de eventos. Recomendamos a todos los desarrolladores de apps que usan el inicio de sesión con Facebook que comprendan cómo opera esta funcionalidad. En particular, al lanzar una app en Corea, ten en cuenta que el registro automático de eventos de la app puede desactivarse. Consulta [Registro automático de eventos de la app](https://developers.facebook.com/docs/app-events/automatic-event-collection-detail) para obtener más información.

## En esta página

- [Inicio de sesión con Facebook](#-inicio-de-sesi-n-con-facebook-)
- [Primeros pasos](#getting-started)
- [Planificar](#plan)
- [Revisión y prueba](#revisi-n-y-prueba)
- [Enviar tu app para su revisión y aprobación](#enviar-tu-app-para-su-revisi-n-y-aprobaci-n)
- [Avanzado](#avanzado)
- [Resultados comerciales](#resultados-comerciales)
- [Otros recursos](#furtherresources)

### Cambios en los plugins sociales en la región europea

Es posible que veas cambios en los plugins sociales debido a la actualización de la solicitud de consentimiento para cookies, que se mostrará a las personas que usen productos de Facebook en la región europea. Dejaremos de ofrecer compatibilidad con los plugins sociales “Me gusta” y “Comentar” para usuarios de la región europea, a menos que 1) las sesiones de sus cuentas de Facebook se hayan iniciado y 2) hayan aceptado el control de las “cookies de apps y sitios web”. Si se cumplen estos requisitos, el usuario podrá ver plugins como los botones “Me gusta” o “Comentar” e interactuar con ellos. Si alguno de los requisitos anteriores no se cumple, el usuario no podrá ver los plugins.

#### La región europea está compuesta por una lista específica de países, entre los que se incluyen los siguientes:

- **La Unión Europea (UE):** Alemania, Austria, Bélgica, Bulgaria, Croacia, Dinamarca, Eslovaquia, Eslovenia, España, Estonia, Finlandia, Francia, Grecia, Hungría, Irlanda, Italia, Letonia, Lituania, Luxemburgo, Malta, Países Bajos, Polonia, Portugal, República Checa, República de Chipre, Rumania y Suecia.
- **Países que no son miembros de la UE, pero pertenecen al Espacio Económico Europeo (EEE) exclusivamente, la Asociación Europea de Libre Comercio (AELC) u otra unión aduanera:** [EEE exclusivamente/AELC] Islandia, Liechtenstein y Noruega; Suiza; [Unión aduanera de la UE] todas las islas del Canal, isla de Man, Mónaco; Bases Soberanas Británicas en Chipre; [Unión aduanera de la UE] Andorra, San Marino, Ciudad del Vaticano.
- **Países que no son miembros de la UE, pero son parte de las regiones ultraperiféricas de la UE (RUP):** Martinica, Mayotte, Guadalupe, Guayana Francesa, Reunión, San Martín, Madeira, Las Azores, Islas Canarias.
- **Reino Unido** (todas las islas británicas).

## Primeros pasos
### [Información general](https://developers.facebook.com/docs/facebook-login/overview)

Casos de uso y funciones principales del inicio de sesión con Facebook.

### Planificar

Integración específica para cada sistema operativo
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

| ![Skyscanner](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/13311282_1007186976025896_1933768039_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=MucL0f1dtfcQ7kNvwGVE_kn&_nc_oc=Admtgma-J1V3ALGD-4SLAPOYE3W7R4ky_AT0sLAYQbbANecgXF3TJcP3qzISL0K0p08&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=vfTLhyx4oOl7UlOXv3jtrg&oh=00_AfggrU0NA46gSHUECUnlDgX-spxC2pjPp0NhHqQ7GKXYtKg&oe=692EFF31) | [Skyscanner](https://developers.facebook.com/success-stories/skyscanner): las conversiones de inicio de sesión con Facebook aumentaron un 100%. |

## Otros recursos

| ![Data Protocol](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/290685728_725708695301954_3657236838974303579_n.png?_nc_cat=102&ccb=1-7&_nc_sid=e280be&_nc_ohc=yAxc9Fb9wxkQ7kNvwGKtA-H&_nc_oc=Adm9PmHyMCQnHn0Sbh75tVTNUA3q6AEnGfFDVLRn8Z9mbA-MQuLNFu1EmAWKtxj9RFE&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=vfTLhyx4oOl7UlOXv3jtrg&oh=00_AfgG33yXRlk3Y2bQYJmBongCKXXn59Ocs72F-Rnxpbjv2g&oe=692F0C1C) | [Data Protocol](https://l.facebook.com/l.php?u=https%3A%2F%2Fdataprotocol.com%2Ffacebook-login&h=AT1R_K-kG0DX9aeLHnsIDbF0DFe3GrvXB3rNR0iFBwMdphvR-n75mgq-HbAqxlU5p8QnYN1ScRHOlTpPVy0riYgpC8HR6ocyDmMGVc5xumIX3R_sGWB_b3k4Omud591NNK56HrXCYgCXK0qoIEqaIDQ3E8M): tutoriales en video y capacitaciones breves. |
| ![GitHub Example](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/22880499_168732097044909_1891283213796507648_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=Vad0P6iH7AAQ7kNvwHYwsTD&_nc_oc=AdkWTU1z9n4dsQuSrHdpxTe7qs1fyUHvM7VnyqYTUWgkvCjUDHYiHSch_orF60Of9ws&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=vfTLhyx4oOl7UlOXv3jtrg&oh=00_Afhf59_mTefZg0JmC8rqgUwJls8jd7DPgkMDziGIgzJNfg&oe=692F1614) | [Ejemplo de GitHub](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffacebook%2Ffacebook-android-sdk%2Ftree%2Fmaster%2Fsamples%2FFBLoginSample&h=AT1nCs9jf_X3UMkEDNijTDxsIypaXI7EK68mRs5Y6GbPKIVvlRdgdr08lusqQCdHy3soVXkv3LZuIEeJLSju8iTSZC7N6dU9sWk7Y1WmzrB1pStog_kAqgRF7jiSHK7Vuye1H5xZqNRdqjUPf16_vYGqoF0): de una implementación en Android del inicio de sesión con Facebook. |

```



## Page: https://developers.facebook.com/docs/facebook-login/guides/map-users

```markdown
# Asignación de usuarios en apps y páginas

Si deseas compartir el mismo identificador de usuario específico en las versiones de prueba, desarrollo, preparación y control de calidad de una app, utiliza [apps de prueba](/docs/apps/test-apps).

Facebook pone identificadores de usuarios específicos de la app a disposición de las personas que inician sesión por primera vez en una instancia de la app y de las personas que inician sesión con el [inicio de sesión limitado](/docs/facebook-login/limited-login). Para aquellos que utilizan por primera vez un bot de Messenger, Facebook asigna identificadores de usuario específicos para la página. Por definición, esto implica que el identificador de una persona puede ser diferente en estas apps y en los bots.

Un negocio puede utilizar varios bots o apps de Facebook (por ejemplo, en los estudios de juegos) para admitir casos de uso como la promoción cruzada o la detección de fraude, o bots para comunicarse con los usuarios. En estos casos, es posible que sea necesario asignar el mismo identificador de persona entre las apps y los bots.

Existen tres métodos para asignar el mismo usuario a varias apps:

- [El campo `token_for_business` en el nodo User](#field)
- [La propiedad `token_for_business` en el objeto signed_request que se pasa a las apps que figuran dentro de un marco Canvas de Facebook](#canvas)
- [El perímetro `ids_for_business` en el nodo User](#api)

Para poder utilizar cualquiera de estos mecanismos, primero debes informar a Facebook que la misma entidad comercial es la propietaria y la operadora de las apps. Para ello, usa el administrador comercial de Facebook para:

- [crear un nuevo negocio](https://developers.facebook.com/docs/apps/business-manager#create-business), o
- [asociar las apps a un negocio existente](https://developers.facebook.com/docs/apps/business-manager#update-business).

## El campo `token_for_business` en el nodo User

Una vez que una app se asocia a un administrador comercial, puedes solicitar el campo `token_for_business` en el nodo [`User`](/docs/graph-api/reference/user/) utilizando el identificador específico de la app que se obtiene al utilizar el inicio de sesión limitado o la primera vez que se inicia sesión en la instancia de una app. Como resultado, esta llamada devuelve una cadena que es igual para esta persona en todas las apps administradas por el mismo administrador comercial.

```
GET /me?fields=token_for_business
```

generaría:

```
{
  "id": "1234567890",
  "token_for_business": "weg23ro87gfewblwjef"
}
```

Notas de uso:

- La persona que se consulta debe haber iniciado sesión en esta app.
- Se puede llamar a este campo con un token de acceso de app o un token de acceso de usuario. Si se utiliza un token de usuario, la persona que se consulta debe ser la misma para quien se generó el token.
- Si usas un identificador específico de la app obtenido de un [inicio de sesión limitado](/docs/facebook-login/limited-login), debes utilizar el identificador de tu app para hacer la llamada, porque no cuentas con un token de usuario que sea válido para las llamadas a la API Graph. Ten en cuenta que las medidas de seguridad del inicio de sesión limitado no se admiten para este fin.
- Si el negocio propietario cambia, el valor de `token_for_business` también cambia.
- Si se solicita el campo `token_for_business` y la app no está asociada a un administrador comercial, la llamada devolverá un error.
- El valor que devuelve `token_for_business` es un token, no un identificador; no se puede utilizar directamente en la API Graph para acceder a la información de una persona. El identificador se debe almacenar de todos modos en la base de datos y se debe utilizar para llamar a la API Graph y obtener la información de la persona en cuestión.

Por comodidad, el campo `token_for_business` se encuentra disponible en todas las versiones de la API.

## La propiedad `token_for_business` en el objeto `signed_request` de Canvas

Para que una app con presencia en Canvas pueda asignar fácilmente un usuario a varias apps, si la aplicación está asociada a un administrador comercial y el usuario inició sesión en la aplicación, se agrega un campo `token_for_business` que se pasa a la aplicación a través del objeto [`signed_request`](https://developers.facebook.com/docs/reference/login/signed-request) pasado a las apps de Canvas en el momento de la carga. Por ejemplo:

```
{
  "algorithm": "HMAC-SHA256",
  "expires": 1414263600,
  "issued_at": 1414257389,
  "oauth_token": "CAAGEkq9GMZAkBAFnvvQ3M6msZBKITLa1gVZBVdnLTdJue2QeV6fMKRXn4G6fcEZB5ZAJyg3z6HdaKOJCCMJ1l9YFWmN4hq6nNnx77f9O7SYhsnPcJ6iH79xjFwqhrALgieDp7GiziMy5Y3Mol6RzHvCM5ceqQe9ZAijvrWZB5hEIwphbMQKEwZA4ZBozXP3NJgEZA3nZCMTTtvleWpxfmqIqO5XwxneCZBsZC4",
  "token_for_business": "AbwoGqummPbF3zp_",
  "user_id": "10154418713995634"
}
```

El valor del campo `token_for_business` es igual al que se obtiene si se consulta directamente el nodo [`User`](/docs/graph-api/reference/user/), por ejemplo, mediante `/me?fields=token_for_business`. También sigue las mismas reglas; por ejemplo, si el negocio propietario cambia, el valor de `token_for_business` también cambia.

Si la app no está asociada a un administrador comercial, o si el usuario no inició sesión en la app, la propiedad `token_for_business` no estará presente en el objeto `signed_request`.

## El perímetro `ids_for_business` en el nodo User

Para obtener identificadores de negocio asignados, llama al perímetro `ids_for_business` en el nodo [`User`](/docs/graph-api/reference/user/). La respuesta es una matriz de objetos donde cada uno representa una app asociada al mismo negocio que la app desde la cual se realiza la llamada y en la que la persona inició sesión.

```
GET /me/ids_for_business
```

Ejemplo de respuesta:

```
{
  "data": [
    {
      "id": "10153949089790582",
      "app": {
        "name": "Business's App 1",
        "namespace": "business_app_1",
        "id": "647733625268125"
      }
    },
    {
      "id": "605665581",
      "app": {
        "name": "Business's App 2",
        "namespace": "business_app_2",
        "id": "370612223054807"
      }
    },
    {
      "id": "10154053730190582",
      "app": {
        "name": "Business's App 3",
        "namespace": "business_app_3",
        "id": "194890427204075"
      }
    }
  ]
}
```

Para que la API devuelva datos, el usuario debe haber iniciado sesión en una o varias apps asociadas al mismo negocio que la app desde la cual se realiza la llamada a la API. Ejemplo: si una persona inicia sesión en 3 de las 5 apps asociadas con el mismo negocio, la API devolverá 3 objetos.

## Preguntas frecuentes

### ¿Es necesario utilizar la API de asignación de negocios?

No. La API de asignación de negocios solo es útil para los negocios que manejan varias apps de Facebook y necesitan asignar el mismo identificador de usuario a cada una de ellas. Si tienes una sola app principal, es poco probable que necesites utilizar la API de asignación de negocios y, por consiguiente, no necesitas configurar un negocio ni asociar apps al negocio.

### ¿En qué consiste el administrador comercial?

El administrador comercial es una manera de ayudar a los negocios y las agencias a administrar sus páginas de Facebook, cuentas publicitarias, aplicaciones y métodos de pago en un solo lugar. [Obtén más información sobre el administrador comercial](https://www.facebook.com/help/113163272211510/).

### No creo que necesite utilizar la API de asignación de negocios. ¿Debo asociar mis apps a un negocio de todos modos?

Si no necesitas utilizar la API de asignación de negocios, no es recomendable que configures un negocio por el momento. Como un negocio debe estar vinculado a la página principal de Facebook para el negocio, la persona mejor posicionada para configurar el negocio en Facebook es quien administra normalmente las cuentas publicitarias y los permisos de página de Facebook para la empresa. Si esa persona ya configuró el negocio dentro del administrador comercial, entonces sí puedes asociar apps a ese negocio.

### ¿Es posible asociar una app a varios negocios?

No. Solo se puede asociar una aplicación a un negocio a la vez.

### ¿Es posible transferir una aplicación a otro negocio?

Sí. Primero, debes eliminar la app del negocio al que está asociada actualmente. Puedes hacerlo desde el administrador comercial. Simplemente ve a la pestaña Aplicaciones en la configuración del negocio, selecciona la aplicación y haz clic en "Eliminar". A continuación, puedes asociar la app a un nuevo negocio.
```



## Page: https://developers.facebook.com/docs/facebook-login/guides/test

```markdown
# Probar un proceso de inicio de sesión

Es importante probar y verificar que el proceso de inicio de sesión con Facebook funcione bien en varias situaciones. Para probar el proceso de inicio de sesión, primero debes crear una cuenta de usuario de Facebook separada:

1. Crear una nueva cuenta de usuario de prueba con Facebook
2. Iniciar sesión con Facebook con las credenciales del usuario de prueba

## Casos de prueba comunes

Antes de probar los casos de uso que se detallan a continuación, asegúrate de eliminar tu app de la cuenta de Facebook del usuario de prueba con [Configuración de la app](https://www.facebook.com/settings?tab=applications).

![Imagen de ejemplo](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/851556_135779183259320_298311523_n.png?_nc_cat=101&ccb=1-7&_nc_sid=34156e&_nc_ohc=w1dc5x4gktIQ7kNvwG8dD1M&_nc_oc=Adk1OY7qtd8LknigxUF-cXXL09HOATkqWe6t0dX2F8zbNK7RuCMOxL2oEb__hwFUWac&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=tqQysa4TatKeLohJV8jB-g&oh=00_AfgbC9TL8HVDwwxiE0n5I-vmVt_nQl50YhKrSXOqBL9lmw&oe=691AB4DB)

| ![Imagen 1](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/16179951_141359083037439_3885858252168101888_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=-2nJWtAZdJgQ7kNvwGf8bhJ&_nc_oc=Adm96Har8nnSwDbszZ7x9IJV_8IsQhlBTu_eR0ly-Nk5LY5OQbg4rGReWpprEv2HU7Q&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=tqQysa4TatKeLohJV8jB-g&oh=00_AfjVo1q3BMpXQP8TQTWtdN32sMLtwVGYUfJapQogLcV9IQ&oe=692F1303) | ![Imagen 2](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16344795_1855913284684189_271619779112992768_n.png?_nc_cat=111&ccb=1-7&_nc_sid=e280be&_nc_ohc=eJdeAwekD5QQ7kNvwFXapm6&_nc_oc=AdnkmeYs1rlysODpEPwfAr7hducm3djgT6yTN9UP4MEA8gcZmXF6LDRcVWYarK8vHf8&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=tqQysa4TatKeLohJV8jB-g&oh=00_Afg4ENiSTfkjsKd3qsSJjn4Jxq-hQIe1HPrvAmS7uJW_rg&oe=692F125C) |
|:--:|:--:|

### 1. Alguien nuevo en tu app inicia sesión con Facebook

1. Ve a tu app y toca el botón `Log in with Facebook`.
2. Toca "Aceptar" para aceptar los permisos de lectura.
3. Vuelve a hacer clic en "Aceptar" para aceptar los permisos de escritura, si corresponde.
4. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) y verifica que estén disponibles los permisos que se otorgaron.

### 2. Alguien inicia sesión con Facebook después de haber iniciado sesión previamente a través de un proceso distinto de Facebook con la misma dirección de correo electrónico

1. Ve a tu app e inicia sesión con tu dirección de correo electrónico.
2. Cierra la sesión de tu app y toca el botón "Iniciar sesión con Facebook".
3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y verifica que estén disponibles los permisos que se otorgaron.

### 3. Alguien que inició sesión en tu app con Facebook anteriormente intenta volver a iniciar sesión

1. Vuelve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
3. Desinstala y vuelve a instalar la app.
4. Abre tu app y toca el botón "Iniciar sesión con Facebook".
5. Verifica que puedes iniciar sesión sin que veas ningún cuadro de diálogo de permiso.

### 4. Alguien cancela el inicio de sesión con Facebook e intenta volver a iniciar sesión

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Verifica que se muestren los permisos de lectura y toca "Cancelar".
3. Abre tu app y toca el botón "Iniciar sesión con Facebook".
4. Verifica que se vuelvan a mostrar los permisos de lectura.

### 5. Alguien elimina tu app de Facebook mediante la configuración de la app y vuelve a usar tu app. Tu app debería detectar esta situación y solicitarle a la persona que vuelva a iniciar sesión.

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
3. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y elimina tu app.
4. Repite los pasos 1 y 2, y verifica que el inicio de sesión con Facebook funcione.

### 6. Alguien cambia la contraseña de Facebook después de iniciar sesión con Facebook en tu app

En este caso, tu token será inválido y deberías notificar a los usuarios que su sesión de Facebook caducó y solicitarles que vuelvan a iniciar sesión.

1. Cambia la contraseña de Facebook y selecciona "Cerrar la sesión de otros dispositivos".
2. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Ve a la configuración de la app en Facebook y verifica que estén disponibles los permisos que se otorgaron.

### 7. Alguien inhabilitó la plataforma de Facebook con la configuración de la app e inicia sesión en tu app

En este caso, deberías asegurarte de que tu app detecte el error para poder notificar a los usuarios y redirigirlos a una versión no integrada de iOS del inicio de sesión con Facebook.

1. En la [configuración de la app](https://www.facebook.com/settings?tab=applications), desactiva la plataforma para el usuario de prueba.
2. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Verifica que la plataforma esté ahora activada y se haya agregado la app a tu perfil de usuario de prueba con la privacidad correcta.

### 8. Alguien vuelve a utilizar tu app cuando el token de la app caducó

Consulta nuestra guía sobre [cómo manejar la caducidad del token](https://developers.facebook.com/docs/facebook-login/access-tokens/#extending).

### 9. Prueba el estado de sincronización de los juegos que sincronizan su estado en varios dispositivos.

1. Inicia sesión con Facebook en tu app y juega con tu app hasta que alcances un terminado nivel X.
2. Inicia sesión con Facebook en un dispositivo diferente con el mismo sistema operativo, o con uno distinto, y comprueba que se reanude el nivel X.

## Otros casos de uso que deben probarse en iOS

### 1. Alguien inicia sesión en tu app cuando está instalada la app de Facebook y está activada la integración con iOS de Facebook

Si alguien hace clic en "Cancelar" como respuesta a la solicitud de los permisos de lectura del inicio de sesión, será necesario que vaya a la configuración del sistema de iOS para volver a habilitar el inicio de sesión de tu app.

En los casos en los que las personas negaron con anterioridad los permisos de Facebook a través del inicio de sesión integrado en iOS, la app debería utilizar el inicio de sesión de cambio de app rápido convencional para las solicitudes de permisos futuras. En lo que respecta a las llamadas al SDK, no utilices, en este caso, `FBSessionLoginBehaviorUseSystemAccountIfPresent` como `FBSessionLoginBehavior`. Consulta [FBSession](https://developers.facebook.com/docs/reference/ios/3.24/class/FBSessionTokenCachingStrategy/) para las versiones 3.24 y posteriores del SDK y [FBSDKAccessToken currentAccessToken](https://developers.facebook.com/docs/reference/ios/current/class/FBSDKAccessToken/) y [FBSDKLoginManager](https://developers.facebook.com/docs/reference/ios/current/class/FBSDKLoginManager/) para las versiones más modernas.

### 2. Alguien inicia sesión en tu app cuando no está instalada la app de Facebook y no está activada la integración con iOS de Facebook

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Verifica que aparezca la pantalla de inicio sesión web móvil de Facebook e inicia sesión.

![Imagen de ejemplo](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16344918_169764566844281_1286387342747107328_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=OJfG-_N7Z9AQ7kNvwFbiWeA&_nc_oc=AdmXPZyeMnaLdMipM6qm4i8Tr28SCBIMsbdXlKZGQeI6XMM-JefkM46RswsmtINklmg&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=tqQysa4TatKeLohJV8jB-g&oh=00_AfgpzfS3nE6W4hw-a-MFRGLb5rDKImnWbombC8fpcvtong&oe=692F17F5)

3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y verifica que estén disponibles los permisos que se otorgaron.

### 3. Alguien inicia sesión en tu app cuando no está instalada la app de Facebook y está activada la integración con iOS de Facebook

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
3. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y verifica que estén disponibles los permisos que se otorgaron.

## Usuarios de prueba

En la configuración de la app (en "Roles", por ejemplo, `https://developers.facebook.com/apps/{YOUR_APP_ID}/roles/test-users/`), puedes crear [cuentas de usuario de prueba](https://developers.facebook.com/docs/apps/test-users) para verificar tu integración de Facebook sin tener que preocuparte por el envío de spam.

En el SDK de iOS, se puede usar la clase `FBSDKTestUsersManager` (en `FBSDKCoreKit`) a fin de obtener con facilidad los tokens de acceso para esas cuentas de usuario de prueba, por lo que podrás escribir pruebas de integración automatizadas. Ten en cuenta que esta clase requiere tu contraseña de la app y que deberías asegurarte de que no se haya incluido dicha contraseña en la app publicada.
```



## Page: https://developers.facebook.com/docs/facebook-login/userexperience

```markdown
# Diseño de la experiencia del usuario

La experiencia inicial con la app es una de las más importantes para el usuario. Una experiencia inicial de alta calidad se puede traducir en tasas de conversión superiores al 90% y anima a las personas a participar y generar ingresos.

El inicio de sesión con Facebook permite a las personas empezar a utilizar tu app de manera rápida y sencilla, y disfrutar de experiencias más personalizadas y significativas. En este documento, ofrecemos consejos y consideraciones para crear una gran experiencia de inicio de sesión con Facebook para el usuario.

1. [Muestra primero el valor](#showvaluefirst)
2. [Evita pasos innecesarios](#avoidunnecessarysteps)
3. [Diseño de botones](#buttondesign)
4. [Permisos](#permissions)
5. [Proporciona un modo de cerrar sesión](#loggingout)
6. [Prueba y mide](#testing)

## 1. Muestra el valor antes de solicitar a las personas que inicien sesión

Cuando decidas en qué parte de la experiencia del usuario solicitarás el inicio de sesión, debes preguntarte en qué momento las personas apreciarán lo suficiente lo que la app ofrece como para confiarle su información.

Lo que el usuario experimenta incluso antes de descargar la app puede tener un efecto aquí. Sin embargo, el diseño dentro de la app te ayudará a tener una influencia mayor en esta decisión.

Las siguientes son algunas propuestas de diseño para animar a las personas a iniciar sesión:

- Incluye una declaración clara y breve de lo que ofrece la app
- Muestra parte del contenido que se verá al iniciar sesión
- Proporciona una nueva experiencia del usuario
- Permite que las personas usen la app sin una cuenta

### Incluye una declaración clara y breve de lo que ofrece la app

Incluye una declaración clara, breve y convincente de lo que ofrece la app. Tal vez ya pasó un tiempo considerable desde que la persona la descargó o leyó sobre ella en la tienda de apps.

![Imagen](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/18853685_793461504169530_595604250470383616_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=zJBwmC6eFg4Q7kNvwEALueC&_nc_oc=AdlVtLszkEtEC5Kcu80Nl7oXQA3Bd2zJY_8EDEq4y81eB1XeIDwkvO5AZK4yiMGPYEU&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=YG5aLIQno9wN2Fg33wkujA&oh=00_AfiAgwNjyXKhdcc-TaQFkpUCqTdMVbCqyn0qQEZgurWnPA&oe=692F0594)

### Muestra parte del contenido que se obtendrá al iniciar sesión

Ofrece un vistazo del contenido disponible antes de que las personas inicien sesión, como la foto de fondo de este ejemplo. No tiene por qué ser contenido detallado: incluso unas imágenes borrosas pueden animar a las personas a iniciar sesión en Pinterest.

![Imagen](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/19085411_1932698890278599_609064407393107968_n.png?_nc_cat=107&ccb=1-7&_nc_sid=e280be&_nc_ohc=jPlkmKdo3ScQ7kNvwF8roHb&_nc_oc=AdlmXUY6D4VELvrmc7lg_RwbOrupJGFoagh0G5rQk-b9xguJZvwa6yLJdeSksYN2_Dk&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=YG5aLIQno9wN2Fg33wkujA&oh=00_Afjvnvc_oQUGY_-lYyhwq9BpyxPdTc_8PWh7lh_050kqWA&oe=692F077A)

### Proporciona una nueva experiencia del usuario

Si tu app requiere formación adicional para lograr la mejor experiencia, puedes agregar una demostración de varios pasos en la parte superior del botón "Iniciar sesión". De este modo, ofreces la opción de obtener más información o iniciar sesión directamente, si la persona está lista para hacerlo.

![Imagen](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/18853645_1838914009762991_5958627649814265856_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=bgCmggh72CUQ7kNvwH1VdRr&_nc_oc=Adk7oFz0ImR1cZAI9HY6J8gOEFLS-W2dD6CF5QPnEmJrmgSfldOITFzisplL4tAac-w&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=YG5aLIQno9wN2Fg33wkujA&oh=00_AfhBYZJ43QyG8fvYKPaG2Ei_l6Fkdei9iZbUQN2zFAv6Tw&oe=692F2859)

### Permite que las personas usen la app antes de iniciar sesión

Si es posible, permite que las personas experimenten con tu app antes de pedirles que inicien sesión en ella. Por ejemplo, muchas apps de comercio electrónico, como Zulily, no solicitan el inicio de sesión hasta el momento de completar el proceso de compra.

## 2. Evita pasos innecesarios

Una de las maneras más eficaces de mejorar el porcentaje de conversiones es reducir la cantidad de pasos innecesarios.

No pidas a los usuarios que toquen "Iniciar sesión" o "Registrarte" para llegar al botón de inicio de sesión con Facebook. Con el inicio de sesión con Facebook, es un paso innecesario. Las personas ni siquiera necesitan detenerse a pensar si tienen una cuenta o no.

![Imagen](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/18853685_793461504169530_595604250470383616_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=zJBwmC6eFg4Q7kNvwEALueC&_nc_oc=AdlVtLszkEtEC5Kcu80Nl7oXQA3Bd2zJY_8EDEq4y81eB1XeIDwkvO5AZK4yiMGPYEU&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=YG5aLIQno9wN2Fg33wkujA&oh=00_AfiAgwNjyXKhdcc-TaQFkpUCqTdMVbCqyn0qQEZgurWnPA&oe=692F0594)

Tampoco les pidas que creen un nombre de usuario o una contraseña una vez que hayan iniciado sesión con Facebook. Uno de los motivos más populares por el que las personas inician sesión con Facebook es que "es fácil y rápido, y no se necesita ingresar una contraseña". Después de iniciar sesión con Facebook, si hay algo que las personas no quieren hacer, es crear un nombre de usuario o una contraseña.

### Logotipo

A fin de generar reconocimiento y confianza, usa siempre el [logotipo "f" aprobado](https://l.facebook.com/l.php?u=https%3A%2F%2Fen.facebookbrand.com%2Fassets%2Ff-logo%2F%3Faudience%3Dadvertisers&h=AT0LafLgAKplSbGWGK8345px9FAy9-4qWYcCmTh5joNc-Tpn26Pw-B6vQsD1wetoyf0n0g4hRE265DsoBl8s90fDigu2HISZ8znMFtzaiSVklxIsdF951GM1SUTsy-Wxl2AjBW3puL3NehqgqD_wD20crek) disponible en el [Centro de recursos de marcas de Facebook](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookbrand.com%2F&h=AT03iZS0O7iFVqZqYdOYT1w8-a2miKtXfyZjKgJYmepqBFQqT9hK1T_WAzC3jjS9O8K9eN35zu7eCMfw6a0soFnJfa2HAL13tZ0qz8S6simhOuCcTtUN-LhoDraORfoWJ1mAzIj9AWsvitU0ksRTH6eGSV4).

Cuando uses el logotipo "f" en el diseño del botón de inicio de sesión, debe aparecer antes de la llamada a la acción. No lo uses como parte de la llamada a la acción: no debe decir "Iniciar sesión con [logotipo 'f']".

### Color

Una de las mejores maneras para lograr que las personas reconozcan algo rápidamente es utilizar un color. Desde el punto de vista de la facilidad de uso, cuanto más rápido reconozcan las personas qué es y qué hace el botón, más rápido lo tocarán y más fluida será su experiencia.

Los colores del botón son el blanco y el azul oficial de Facebook: 5890FF. En todo el mundo, cuando las personas hablan sobre el inicio de sesión con Facebook, a menudo lo llaman "el botón azul". Si no puedes usar el azul oficial de Facebook, usa blanco y negro.

**VALORES DE COLOR DEL AZUL OFICIAL DE FACEBOOK**

- CYMK estucado: 83 / 52 / 00 / 00
- CYMK no estucado: 77 / 36 / 00 / 00
- PMS 2727C
- PMS 2382U
- Hex #1877F2
- R = 24 V = 119 A = 242

![Imagen](https://lookaside.fbsbx.com/elementpath/media/?media_id=360450771326011&version=1740130911)

### Texto

Las etiquetas recomendadas son "Continuar con Facebook" o "Iniciar sesión con Facebook", según el contexto. Si usas el [logotipo “f”](https://l.facebook.com/l.php?u=https%3A%2F%2Fen.facebookbrand.com%2Fassets%2Ff-logo%2F%3Faudience%3Dadvertisers&h=AT1MAGEOfyHVzCEcIVaqHhtzHuRSdo0LZ4Ll4WtjhJF-HIN2gR1o1YOMAtOSYFk23Jj6ynhagtxsR39qpcixwOdpTwevev89almoA-k3raI4J6itc2WJZpeDzXZEtcWQOG7GSkELg8YE5Y4IxOb-1rgEmZI) con una llamada a la acción, utiliza la versión oficial disponible, que puede descargarse del [Centro de recursos de marcas de Facebook](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookbrand.com%2F&h=AT0XUKvLBQxuizLjRhPDGOMlDvlm2xg-x4MJNLlwlYPPDKUIpGPptIRghecXgW8Koq5ebKFckNQ_YJrttsdKNDZXHAtTF38KRO3bDr5KXGmun7GWvqy4stWqyzqjRN4hEIMMVJzxtEgARCYEZJj7uoWs738).

Ubica el texto de la llamada a la acción dentro del botón de inicio de sesión; no debe aparecer fuera de este.

Elige la fuente, el grosor de fuente y el interletraje que se vean mejor en tu app, pero concéntrate en que el texto se pueda leer fácilmente.

![Imagen](https://lookaside.fbsbx.com/elementpath/media/?media_id=386671105305290&version=1740130911)

### Ubicación

El botón de inicio de sesión debe ser tan fácil y rápido de reconocer y tocar como sea posible. En un dispositivo móvil, por ejemplo, debe estar cerca del pulgar y ser lo bastante grande como para tocarlo sin dificultad. Es simple, pero cierto: los botones grandes logran más inicios de sesión que los pequeños.

El logotipo "f" se ofrece en varios tamaños para facilitar su redimensionamiento, pero las proporciones y la tipografía deben ser coherentes.

### Qué se debe hacer y qué no se debe hacer

- **DEBES** usar el [logotipo “f”](https://l.facebook.com/l.php?u=https%3A%2F%2Fen.facebookbrand.com%2Fassets%2Ff-logo%2F%3Faudience%3Dadvertisers&h=AT2P5J2qhTf5RULxwjyO-eLH93zeM3cZhhw6fdOMZbw0KB98qY1dNqThKlf6W4F6jQDrtzDZlTkYlXDT_4XZFgKVtO0sCu6wYaHH_y51nFro6y7NmcZNgSmCYqImfgg6xeSG1m6VSahJD4kvK3VzFZwLPb0) aprobado disponible en el [Centro de recursos de marca de Facebook](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookbrand.com%2F&h=AT2EAo69Xhm-F3zGB_WkmK2p6mcTeHO5qeAOWqusHYmdvBCk7fteNJg0cRoHS7P28oDrojO7yGWT_Y-zFYKBZI6ocPIx-oZp0eUSvUs1MWrxJtIK2fnCVgLxssutAACvxD8xjnB2zNt6dJY4oNMAc2bEL3A) y respetar las normas de uso.
- **DEBES** usar las etiquetas recomendadas "Continuar con Facebook" o "Iniciar sesión con Facebook" en el botón de inicio de sesión, según el contexto, y asegurarte de que el texto quede dentro del diseño del botón.
- **NO DEBES** modificar el logotipo "f" de ningún modo, por ejemplo, cambiando el diseño, las dimensiones, el color o cualquier otra característica personalizada. Si por razones técnicas no puedes usar el color adecuado, usa blanco y negro.
- **NO DEBES** usar el logotipo "f" en un botón sin una llamada a la acción adecuada (preferiblemente, "Continuar con Facebook" o "Iniciar sesión con Facebook").
- **NO DEBES** colocar el texto de la llamada a la acción (por ejemplo, "Continuar con Facebook") fuera del botón de inicio de sesión.

## 4. Permisos

### Pide solo los permisos que necesitas

Cuantos menos permisos pidas, más cómodas se sentirán las personas al concederlos. Sabemos que pedir menos permisos da como resultado un mayor porcentaje de conversión.

Puedes pedir permisos adicionales más adelante, cuando las personas ya hayan probado la app.

Otra ventaja de hacerlo así es que tal vez no necesites solicitar la [revisión del inicio de sesión](https://developers.facebook.com/docs/facebook-login/review). Solo tienes que solicitar esta revisión si pides otros permisos además de `public_profile` y `email`.

### Pide los permisos en contexto y explica el motivo

Es más probable que alguien acepte solicitudes de permisos cuando entiende por qué la app necesita la información para ofrecer una mejor experiencia. Activa las solicitudes de permisos cuando las personas intenten realizar una acción en la app que requiera ese permiso específico.

Por ejemplo, la app de Facebook solamente solicita los servicios de ubicación cuando alguien toca explícitamente el botón de ubicación al actualizar su estado.

## 5. Proporciona un modo de cerrar sesión

Una vez que las personas inicien sesión, proporciónales un modo de cerrarla y de desconectar, o incluso eliminar, su cuenta. Además de ser una cuestión de cortesía, se trata de un requisito de nuestras [Políticas de inicio de sesión para desarrolladores](https://developers.facebook.com/devpolicy/#login).

La app de citas Tinder, por ejemplo, te da la opción de ocultar tu foto del perfil para impedir que te encuentren, así como de cerrar sesión o de eliminar la cuenta.

![Imagen](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/18853684_1972355499664306_464661615422210048_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e280be&_nc_ohc=4SdSGbKPq50Q7kNvwGS6YYt&_nc_oc=AdlfBcxygy4M72LeZMoImXnfMB0W5Xdh9K5Hi1PsyYEHbG9wqAgXPCYMFJdPKvELSeY&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=YG5aLIQno9wN2Fg33wkujA&oh=00_Afj5WoyRE0T2IX2N41fcOUUXJFQrq5N3Qty1XOoQiacrWA&oe=692F0096)

## 6. Prueba y mide

Ni siquiera los mejores diseñadores logran crear una experiencia inicial perfecta al primer intento. Este resultado suele ser fruto de un meticuloso proceso de diseño, prueba y repetición.

Antes de lanzar tu app, realiza pruebas de uso cualitativas para comprender cómo reaccionan las personas ante lo que ven. No necesita ser formal para ser útil, pero asegúrate de ver a las personas mientras prueban la experiencia.

Además de estas pruebas, realiza análisis para determinar si las personas completan el proceso y cuál es el porcentaje de conversión global. Las apps que siguen las prácticas recomendadas tienen porcentajes de conversión que superan el 90%.
```



## Page: https://developers.facebook.com/docs/facebook-login/overview

```markdown
Si quieres iniciar sesión en Facebook, ve a [http://www.facebook.com](http://www.facebook.com). Si tienes problemas para iniciar sesión en Facebook, visita nuestro [Centro de ayuda](https://www.facebook.com/help/1573156092981768/).

# Información general sobre el inicio de sesión con Facebook

El inicio de sesión con Facebook es un modo rápido y cómodo de crear cuentas e iniciar sesión en tu app en diversas plataformas. Está disponible en [iOS](/docs/ios/login/), [Android](/docs/android/login-with-facebook), [Web](/docs/facebook-login/web), [apps para computadoras](/docs/facebook-login/manually-build-a-login-flow) y [dispositivos como Smart TV y objetos de Internet de las cosas](/docs/facebook-login/for-devices). El inicio de sesión con Facebook contempla dos escenarios posibles: la [autenticación](/docs/facebook-login/auth-vs-data/#authentication) y la solicitud de [permisos](/docs/facebook-login/permissions/overview) para [acceder a los datos de los usuarios](/docs/facebook-login/auth-vs-data/#data-access). Puedes usar el inicio de sesión con Facebook solo para autenticación o para autenticación y acceso a datos.

![Imagen](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16180612_1841281782762374_3974639628517900288_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=P-3WygPncVsQ7kNvwEw-e2G&_nc_oc=Admi6vOX5r07geOez5FQNrrH3_6g6lnuUHHsaCdhrGoVH1jKFRIBerbvExBRDKIg0ss&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=KR0VFXSkuZ1Dq-jL3h7OHg&oh=00_Afgez8bpDFwzN4wqDZ-n2QYLijR_NCxhh1FM6mlaYaAkIQ&oe=692EF97B)

## Casos de uso

El inicio de sesión con Facebook se utiliza para las siguientes experiencias:

- **Creación de cuentas**  
  El inicio de sesión con Facebook permite a las personas crear, de forma rápida y sencilla, una cuenta en tu aplicación sin tener que establecer (y posiblemente olvidar más tarde) una contraseña. La sencillez y comodidad de la experiencia se traducen en una mayor conversión. Una vez que alguien crea una cuenta en una plataforma, puede iniciar sesión en la aplicación, a menudo con un solo clic, en el resto de las plataformas que utilices. Una dirección de correo electrónico validada significa que puedes llegar a esa persona para volver a interactuar con ella más adelante.

- **Personalización**  
  Las experiencias personalizadas son más atractivas y aumentan la retención. El inicio de sesión con Facebook te permite acceder a información que sería complicado o difícil obtener mediante tu propio formulario de registro. El simple hecho de que se importe la foto del perfil de Facebook del usuario ya le da una sensación de conexión más profunda con la app.

## Historias de éxito

Los desarrolladores que implementaron el inicio de sesión con Facebook en sus apps observaron aumentos espectaculares en el número de inicios de sesión, niveles de interacción más altos y un crecimiento continuo del número de personas que usan el inicio de sesión con Facebook. Para conocer más detalles, consulta la sección [Historias de éxito](/success-stories).

Por ejemplo, [Skyscanner](/success-stories/skyscanner), una app para buscar vuelos, hoteles y alquileres de autos, experimentó un aumento del 100 % en la cantidad de personas que usaban el inicio de sesión con Facebook para acceder a la app.

## Características

- **Identidad real**  
  Cuando las personas deciden iniciar sesión con Facebook, pueden compartir su identidad real mediante el perfil público. El perfil público incluye el nombre verdadero de una persona, así como su foto del perfil. Las aplicaciones que se basan en la identidad real suelen tener menos spam y promover conversaciones de mayor calidad.

- **Inicio de sesión en distintas plataformas**  
  El inicio de sesión con Facebook está disponible en la mayoría de las plataformas de aplicaciones para celulares y computadoras. Tras crear una cuenta con Facebook en una plataforma, las personas pueden iniciar sesión, de forma rápida y sencilla, en la versión de la aplicación para otras plataformas. El identificador de usuario no varía, de modo que el usuario puede retomar la experiencia con la aplicación allí donde la dejó. El inicio de sesión con Facebook está disponible en [iOS](/docs/ios/login/), [Android](/docs/android/login-with-facebook), [Web](/docs/facebook-login/web), [aplicaciones para computadoras](/docs/facebook-login/manually-build-a-login-flow) y [dispositivos, como Smart TV y objetos de Internet de las cosas](/docs/facebook-login/for-devices).

- **Funcionamiento con el sistema de cuentas existente**  
  El inicio de sesión con Facebook complementa tu sistema de cuentas existente. Brinda a las personas la opción de iniciar sesión con Facebook y mediante correo electrónico, SMS u otras opciones de inicio de sesión social. Cuando una dirección de correo electrónico obtenida del inicio de sesión con Facebook coincide con otra que ya está en tu sistema, puedes iniciar sesión en la cuenta existente de esa persona sin contraseñas adicionales.

- **Permisos detallados**  
  El inicio de sesión con Facebook admite [muchos tipos de permisos](/docs/facebook-login/permissions) que determinan qué información van a compartir las personas con tu aplicación. Esto significa que tienes un control preciso de lo que solicitas y las personas tienen un control preciso de lo que deciden aprobar.

- **Control de la información compartida**  
  El primer paso para una experiencia excelente es dar el control a las personas. Con el inicio de sesión con Facebook, las personas pueden elegir qué información comparten con tu aplicación. Seguirán obteniendo las ventajas de iniciar sesión con Facebook aunque prefieran no conceder acceso a determinada información. Más adelante, después de informar a las personas cómo mejoraría su experiencia, la aplicación puede volver a solicitar la información.

- **Autorización gradual**  
  El inicio de sesión con Facebook admite la autorización gradual: no tienes por qué solicitar desde el principio toda la información que quieres, sino que puedes hacerlo a lo largo del tiempo. Esto significa que las personas podrán crear rápidamente una cuenta en tu aplicación y, a medida que la utilicen y disfruten, podrás ir solicitando información adicional que mejore su experiencia.

- **Inicio de sesión rápido**  
  El inicio de sesión rápido permite que los usuarios inicien sesión con su cuenta de Facebook en diferentes dispositivos y plataformas. Si una persona inició sesión anteriormente en tu aplicación en una plataforma, puedes usar el inicio de sesión rápido para que acceda con su cuenta de Facebook en Android, en vez de solicitarle que seleccione un método de inicio de sesión. En algunos casos, esto provocaba que se crearan cuentas duplicadas o incluso que no se pudiera iniciar sesión. 

![Imagen](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/17633027_206987396465278_7196971247870148608_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=czdq7_bF7LEQ7kNvwFce8HB&_nc_oc=AdkJVoDUBGNQe_bcN4CEoFS5WlycVmjpmmwoVpIv1zFeO9xkwnEWXz2889S-8CRzC14&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=KR0VFXSkuZ1Dq-jL3h7OHg&oh=00_Afh6o6XwPcIKayCt_es0CcNjUAEbqELjUSlOvWaot7DBhQ&oe=692F10EB)

- **Integración de Facebook Lite para las aplicaciones para Android**  
  Cuando desarrollas la aplicación con la versión 4.14.0 del SDK de Facebook para Android, el inicio de sesión con Facebook tiene integración automática con Facebook Lite. Si las personas no tienen instalada la aplicación de Facebook para Android, el inicio de sesión con Facebook usa Facebook Lite para mostrar la pantalla de inicio de sesión y obtener las credenciales. Los SDK anteriores requerían que las personas instalaran la aplicación de Facebook.

## Revisión de apps

Queremos asegurarnos de que las decenas de millones de personas que utilizan todos los días el inicio de sesión con Facebook tengan una experiencia segura, confiable y coherente. La revisión de aplicaciones ayuda a determinar si las aplicaciones que solicitan acceso a información detallada de la cuenta ofrecen una experiencia óptima.

Nuestro proceso de revisión de apps se diseñó para ser rápido y sencillo. Nuestro equipo de revisión utiliza realmente tu app y te brinda orientación y comentarios para que tengas la seguridad de cumplir con las [Condiciones de la plataforma de Facebook](/terms) y las [Políticas para desarrolladores](/devpolicy).

Una app puede solicitar a las personas los dos permisos siguientes **sin** que Facebook tenga que revisarla:

- [`public profile`](/docs/facebook-login/permissions#reference-public-profile)
- [`email`](/docs/facebook-login/permissions#reference-email)

Si la app solicita otro permiso, deberá someterse a la [revisión de Facebook](/docs/facebook-login/review) para que dicho permiso aparezca en el cuadro de diálogo de inicio de sesión con Facebook de tu app.

Sin embargo, para ayudarte a desarrollar la experiencia de inicio de sesión con Facebook, cualquier usuario que aparezca en la sección “Roles” del panel de tu app podrá conceder cualquier [permiso](/docs/facebook-login/permissions) válido sin necesidad de aprobación de Facebook. Consulta los [niveles de acceso](/docs/graph-api/overview/access-levels/) para obtener información sobre los roles y los permisos.

Más información sobre la [revisión de apps](/docs/facebook-login/review).

## Eliminación de datos

Como parte del cumplimiento del Reglamento General de Protección de Datos (RGPD), Facebook da a las personas el control de sus datos ofreciéndoles la posibilidad de solicitar a su aplicación que elimine los datos procedentes de Facebook que la aplicación tiene sobre ellas. Para responder a una solicitud de este tipo, implementa una [devolución de llamada para eliminación de datos](/docs/apps/delete-data).

Para cumplir con las [normas del RGPD](https://l.facebook.com/l.php?u=https%3A%2F%2Fico.org.uk%2Ffor-organisations%2Fguide-to-data-protection%2Fguide-to-the-general-data-protection-regulation-gdpr%2Findividual-rights%2Fright-to-erasure%2F&h=AT2WZClsPllu_3vpsb6z5sXd3MwO-xtLv2ESv59hpcJRGSn-eAJJb0Tc56Hut3y-tWJ_PIPaFitalXEnVkbGsphFyX-78lKT3yJ6a_UqTiXB4NyCNk88FOnHv-4vs4lvns1QsCjagiOvyusI7eOLv8O04oE), debes proporcionar lo siguiente:

- Un procedimiento disponible en la app para que los usuarios soliciten la eliminación de sus datos.
- Una dirección de correo electrónico de contacto que las personas puedan utilizar para comunicarse y solicitar que se eliminen sus datos.
- Una implementación de la [devolución de llamada para eliminación](/docs/apps/delete-data) de datos.

Después de eliminar una app de la página de configuración de **Apps y sitios web**, el usuario debería ver la opción que le permitirá solicitar a la app que elimine sus datos, ya sea mediante un enlace a las instrucciones para pedir la eliminación o mediante una solicitud de eliminación. Esto sustituye a la experiencia actual que se vincula con la política de privacidad de la aplicación.

Los desarrolladores pueden proporcionar tanto la devolución de llamada para la eliminación de datos como un enlace a las instrucciones para que los usuarios puedan eliminar sus datos.

## Comienza a desarrollar

- [Apps para iOS](/docs/facebook-login/ios)
- [Apps para Android](/docs/facebook-login/android)
- [Apps para web y para web móvil](/docs/facebook-login/web)
- [Apps para computadoras](/docs/facebook-login/manually-build-a-login-flow)
- [Dispositivos inteligentes](/docs/facebook-login/for-devices) (Smart TV y objetos de Internet de las cosas)

## Más información

- [Permisos](/docs/facebook-login/permissions)
- [Tokens de acceso](/docs/facebook-login/access-tokens)
- [Revisión de apps para inicio de sesión](/docs/facebook-login/review)
- [Seguridad](/docs/facebook-login/security)
- [API y SDK](https://developers.facebook.com/docs#apis-and-sdks)
```



## Page: https://developers.facebook.com/docs/facebook-login/ios

```markdown
# Inicio de sesión con Facebook para iOS: inicio rápido

Hicimos un cambio en los puntos de conexión del inicio de sesión limitado: ahora es posible acceder desde limited.facebook.com.

Cuando las personas inician sesión en tu app con Facebook, conceden a la aplicación permisos para obtener información o realizar acciones en Facebook en su nombre.

Debes aplicar los siguientes pasos para agregar el inicio de sesión con Facebook a tu proyecto de iOS.

## 1. Iniciar sesión

Inicia sesión en Facebook para crear apps o regístrate como desarrollador.

[Iniciar sesión en Facebook](https://www.facebook.com/login/?privacy_mutation_token=eyJ0eXBlIjowLCJjcmVhdGlvbl90aW1lIjoxNzYyOTcxOTg2LCJjYWxsc2l0ZV9pZCI6MjM5NDQ2MTI0MDg0ODgxN30%3D&next=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Ffacebook-login%2Fios)

## 2. Configurar el entorno de desarrollo

Configura el entorno de desarrollo antes de usar el inicio de sesión con Facebook para iOS.

**Uso del administrador de paquetes de Swift (SPM)**

> Disponible únicamente para Xcode 11.2 y posteriores.

1. En Xcode, haz clic en **File > Swift Packages > Add Package Dependency** (Archivo > Paquetes de Swift > Agregar dependencia de paquetes).
2. En el cuadro de diálogo que aparece, ingresa la URL del repositorio: [https://github.com/facebook/facebook-ios-sdk](https://github.com/facebook/facebook-ios-sdk).
3. En **Version** (Versión), selecciona **Up to Next Major** (Hasta la siguiente superior) y deja la opción predeterminada.
4. Completa las solicitudes para seleccionar las bibliotecas que deseas usar en el proyecto.

## 3. Registrar y configurar tu app en Facebook

Registra y configura tu app para usar el inicio de sesión con Facebook agregando el identificador de paquete.

Debes [iniciar sesión](https://www.facebook.com/login/?next=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Ffacebook-login%2Fios) para completar este paso.

## 4. Configurar el proyecto

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

3. En `<array><string>` de la clave `[CFBundleURLSchemes]`, reemplaza `[APP-ID]` con el identificador de la app.
4. En `<string>` de la clave `FacebookAppID`, reemplaza `[APP-ID]` con el identificador de la app.
5. En `<string>` de la clave `FacebookClientToken`, reemplaza `CLIENT-TOKEN` con el valor encontrado en **Configuración > Avanzado > Token del cliente** del panel de apps.
6. En `<string>` de la clave `FacebookDisplayName`, reemplaza `[APP-NAME]` por el nombre de la app.

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

## 5. Conectar el delegado de la app

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

## 6. Agregar el inicio de sesión con Facebook al código

Usa el botón de inicio de sesión con Facebook en tu app para iOS.

### 6a. Agregar el inicio de sesión con Facebook al código

Para añadir el botón "Iniciar sesión" con la marca de Facebook a la app, agrega el siguiente fragmento de código a un controlador de vista.

```swift
// Add this to the header of your file, e.g. in ViewController.swift 
import FacebookLogin

// Add this to the body
class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
	
        let loginButton = FBLoginButton()
        loginButton.center = view.center
        view.addSubview(loginButton)
    }
}
```

En este punto, debes poder ejecutar la app e iniciar sesión usando el botón "Iniciar sesión con Facebook".

### 6b. Comprobar el estado actual de inicio de sesión

La app solo puede iniciar la sesión de una persona a la vez. Representamos mediante `AccessToken.current` a las personas que inician sesión en la app.

`LoginManager` establece este token por ti y, cuando establece `AccessToken.current`, también lo escribe de forma automática en el almacenamiento de llavero.

`AccessToken` contiene el identificador `userID`, con el que puedes identificar al usuario.

Debes actualizar el controlador de vista para comprobar durante la carga si hay tokens anteriores. Esto evita que se vuelva a mostrar de manera innecesaria el flujo de inicio de sesión si una persona ya le otorgó los permisos a tu app:

```swift
override func viewDidLoad() {
    super.viewDidLoad()

    if let token = AccessToken.current,
        !token.isExpired {
        // User is logged in, do work such as go to next view controller.
    }
}
```

### 6c. Solicitar permisos

Al usar el inicio de sesión con Facebook, la app puede pedir permisos para acceder a un subconjunto de datos de una persona. El inicio de sesión con Facebook requiere el permiso `public_profile` avanzado, que utilizarán los usuarios externos.

**Permisos de lectura del botón "Iniciar sesión con Facebook"**

Para solicitar permisos de lectura adicionales, configura la propiedad `permissions` en el objeto `FBLoginButton`.

```swift
// Extend the code sample from 6a. Add Facebook Login to Your Code
// Add to your viewDidLoad method:
loginButton.permissions = ["public_profile", "email"]
```

Se le pedirá al usuario que le conceda a tu app los permisos solicitados. Ten en cuenta que algunos permisos necesitarán una [revisión del inicio de sesión](https://developers.facebook.com/docs/facebook-login/review/what-is-login-review). Para obtener información sobre los permisos, consulta [Administrar permisos](https://developers.facebook.com/docs/facebook-login/ios/permissions).

## 7. Próximos pasos

¡Felicitaciones, agregaste el inicio de sesión con Facebook a tu app para iOS! No olvides de consultar el resto de las páginas de documentación para acceder a guías más avanzadas.

- [Implementar una devolución de llamada para eliminación de datos](https://developers.facebook.com/docs/apps/delete-data) Implementa una devolución de llamada para eliminación de datos a fin de responder a las solicitudes que hacen las personas para que se eliminen sus datos de Facebook.
- [Agregar eventos de la app](https://developers.facebook.com/docs/ios/getting-started#app-events) Agrega eventos a tu app para ver estadísticas, medir el rendimiento de los anuncios y crear públicos para segmentar anuncios.
- [Configuración y temas avanzados](https://developers.facebook.com/docs/facebook-login/ios/advanced) Consulta nuestra guía de configuración avanzada para obtener información sobre el inicio de sesión con Facebook en apps para iOS.
- [Permisos](https://developers.facebook.com/docs/facebook-login/ios/permissions) Administra los datos a los que tiene acceso tu app a través del inicio de sesión con Facebook.
- [Administración de errores](https://developers.facebook.com/docs/ios/errors) Descubre cómo responder a los errores que devuelve el SDK de Facebook.
- [Prueba del proceso de inicio de sesión](https://developers.facebook.com/docs/facebook-login/testing-your-login-flow/) Prueba y verifica el correcto funcionamiento del inicio de sesión con Facebook.
- [Revisión de apps](https://developers.facebook.com/docs/facebook-login/review) Según los datos de Facebook que solicites a las personas que usan el inicio de sesión con Facebook, es posible que necesites enviar tu app a revisión antes de lanzarla.
- [Crea tu propio proceso de inicio de sesión](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow) Para crear tu propio proceso de inicio de sesión, consulta [Crear un proceso de inicio de sesión de forma manual](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow).
```



## Page: https://developers.facebook.com/docs/facebook-login/access-tokens

```markdown
# Tokens de acceso para tecnologías de Meta

Un token de acceso es una cadena opaca que identifica un usuario, una app o una página, y que la app puede utilizar para realizar llamadas a la API Graph. El token incluye información acerca de su caducidad y de la app que lo generó. Con el fin de comprobar la privacidad, la mayoría de las llamadas a la API en las apps de Meta deben incluir un token de acceso. Existen diferentes tipos de tokens de acceso que admiten diferentes casos de uso y una serie de métodos para obtener un token de acceso.

| Tipo de token de acceso | Descripción |
|-------------------------|-------------|
| [Token de acceso a la app](#apptokens) | Un token de acceso a la app se usa para leer y modificar configuraciones de la app. Se genera mediante una [clave secreta de la app de Meta](https://developers.facebook.com/docs/facebook-login/security#appsecret) y se utiliza durante las llamadas con las que se cambia la configuración en toda la app. El token de acceso a la app se obtiene mediante una llamada de servidor a servidor. |
| [Token de cliente](#clienttokens) | Se utiliza un token de cliente para acceder a las API de nivel de la app que puedes insertar en tus apps nativas o de escritorio para que puedas identificar tu app. No está diseñado para ser un identificador secreto, porque se inserta en las apps. El token de cliente se encuentra en el panel de apps de Meta. |
| [Token de acceso a la página](#pagetokens) | Se usa un token de acceso a la página para leer, escribir y modificar los datos que pertenecen a una página de Facebook. Para obtener un token de acceso a la página, primero debes obtener un token de acceso del usuario y, luego, usar este token para obtener uno de acceso a la página mediante la API Graph. |
| [Token de acceso de usuario del sistema](#usertokens) | Se utiliza un token de acceso de usuario del sistema si tu app realiza acciones automáticas programáticas en las páginas o en los objetos de anuncio de los clientes de negocios, sin la necesidad de basarse en una entrada de un usuario de la app ni de solicitar la reautenticación en una fecha futura. |
| [Token de acceso del usuario](#usertokens) | Se utiliza un token de acceso del usuario si tu app realiza acciones en tiempo real, en función de las entradas del usuario. Se necesita cada vez que la app llama a una API para leer, modificar o escribir los datos de Facebook de una persona en particular en nombre de esta. Los tokens de acceso del usuario se suelen obtener mediante un cuadro de diálogo de inicio de sesión, y es necesario que la persona conceda permiso a la app para obtener uno de estos tokens. |

## Tokens de acceso del usuario

Aunque cada plataforma genera tokens de acceso mediante API distintas, todas siguen una estrategia básica para obtener un token de usuario:

![Tokens de acceso del usuario](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/851559_193529037483274_772207648_n.png?_nc_cat=104&ccb=1-7&_nc_sid=34156e&_nc_ohc=JFc5cvuxxyQQ7kNvwG1kzaS&_nc_oc=AdlFme_JKL5Sfu2m90DaIKx5eYLI4xi3EIIN5oOl4P_jhw2Wv3L88gr5CmlFQUGb3R4&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=e-pYCrbQwYYNFkh5jPI_wA&oh=00_AfgPfTjmBiwCZUjEi8lPAKV-wtCzlqdGB6N5HtK53tml1w&oe=691AA408)

### Tokens de corta y larga duración

Existen dos modalidades de tokens de acceso del usuario: de corta y de larga duración. Los tokens de corta duración suelen tener una validez de una o dos horas, mientras que los de larga duración pueden alcanzar los 60 días. Sin embargo, no debes confiar en que estas duraciones serán siempre las mismas; debes tener en cuenta que la validez de un token puede cambiar sin previo aviso y caducar antes de lo esperado. Tienes más información en la documentación sobre [administración de errores](https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling).

Los tokens de acceso generados mediante el inicio de sesión web son de corta duración, pero puedes [convertirlos en tokens de larga duración](https://developers.facebook.com/docs/facebook-login/access-tokens/expiration-and-extension) realizando una llamada a la API desde el servidor junto con la clave secreta de la app.

Las apps para celulares que utilizan los SDK de Facebook para iOS y Android obtienen tokens de larga duración de forma predeterminada.

Las apps que disponen de [acceso estándar](https://developers.facebook.com/docs/marketing-api/access) a la API de marketing de Facebook, al utilizar tokens de larga duración, reciben tokens de larga duración sin fecha de caducidad. Estos tokens pueden quedar sin validez por otros motivos, pero no caducan en función del tiempo. Lo mismo sucede con los tokens de acceso para [usuarios del sistema en el administrador comercial](https://developers.facebook.com/docs/marketing-api/businessmanager/systemuser).

### Tokens portátiles

Un aspecto importante acerca de los tokens de acceso es que la mayoría son portátiles. Sin embargo, Apple no permite trasladar tokens entre servidores. En cambio, una vez que tienes un token de acceso, puedes utilizarlo para realizar llamadas a los servidores de Facebook desde un cliente de telefonía celular, un navegador web o tu servidor. Si obtienes un token en un cliente, puedes enviarlo a tu servidor y utilizarlo para realizar llamadas de servidor a servidor. Si lo obtienes mediante una llamada de servidor, también puedes enviarlo a un cliente y realizar llamadas desde él.

La transferencia de tokens entre cliente y servidor se debe realizar de manera segura a través de HTTPS, para garantizar la seguridad de las cuentas de las personas. [Aquí tienes más información sobre las implicaciones de mover tokens entre tus clientes y tu servidor](https://developers.facebook.com/docs/facebook-login/access-tokens/portability).

Cada plataforma tiene sus métodos para iniciar este proceso, y cada una incluye funciones para administrar los tokens de acceso en nombre del desarrollador y la persona que concede los permisos:

### Android

Los SDK de Facebook para Android administran automáticamente los tokens de acceso de usuario mediante la clase [`com.facebook.AccessToken`](https://developers.facebook.com/docs/reference/android/current/class/AccessToken/). Descubre cómo obtener un token de acceso del usuario implementando el [inicio de sesión con Facebook para Android](https://developers.facebook.com/docs/facebook-login/android). Para recuperar este token de acceso de usuario, inspecciona [`Session.getCurrentAccessToken`](https://developers.facebook.com/docs/reference/android/current/class/AccessToken/#getCurrentAccessToken).

#### Código de ejemplo

```java
@Override
public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    accessToken = AccessToken.getCurrentAccessToken();
}
```

### iOS

Los SDK de Facebook para iOS administran automáticamente los tokens de acceso de usuario mediante la clase [`FBSDKAccessToken`](https://developers.facebook.com/docs/reference/ios/current/class/FBSDKAccessToken/). Descubre cómo obtener un token de acceso del usuario implementando el [inicio de sesión con Facebook para iOS](https://developers.facebook.com/docs/facebook-login/ios). Para recuperar este token de acceso, inspecciona [`FBSDKAccessToken.currentAccessToken`](https://developers.facebook.com/docs/reference/ios/current/class/FBSDKAccessToken/#currentAccessToken).

#### Código de ejemplo

```objective-c
- (void)viewDidLoad {
  [super viewDidLoad];
  NSString *accessToken = [FBSDKAccessToken currentAccessToken];
}
```

### Javascript

El [SDK de Facebook para JavaScript](https://developers.facebook.com/docs/javascript) obtiene y conserva los tokens de acceso del usuario automáticamente en cookies del navegador. Puedes obtener el token de acceso del usuario realizando una llamada a [`FB.getAuthResponse`](https://developers.facebook.com/docs/reference/javascript/FB.getAuthResponse/), que incluirá una propiedad `accessToken` en la respuesta.

#### Código de ejemplo

```javascript
FB.getLoginStatus(function(response) {
  if (response.status === 'connected') {
    var accessToken = response.authResponse.accessToken;
  }
});
```

Consulta la [documentación sobre los SDK web de Facebook](https://developers.facebook.com/docs/web) para obtener un [código completo de ejemplo](https://developers.facebook.com/docs/reference/php/examples#get-a-user-access-token).

#### Web (sin JavaScript)

Al crear una app web [sin el SDK de Facebook para JavaScript](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow), deberás generar un token de acceso durante los pasos descritos en ese documento.

## Tokens de acceso a la app

Los tokens de acceso a la app se usan para realizar solicitudes a las API de Facebook en nombre de una app, no de un usuario. Se pueden utilizar para modificar los parámetros de la app, crear y administrar usuarios de prueba, o leer las estadísticas de la app.

### Limitaciones

Algunos datos de usuario que normalmente serían visibles para una app que realiza una solicitud con un token de acceso del usuario no siempre lo son con un token de acceso a la app. Si lees datos de usuario y los utilizas en tu app, debes utilizar un token de acceso del usuario, no un token de acceso a la app.

Los tokens de acceso de app se consideran poco seguros si la app está configurada en `Native/Desktop` en la configuración avanzada del [panel de apps](https://developers.facebook.com/apps), por lo que no funcionan con llamadas a la API. Esto se debe a que suponemos que las apps nativas o para computadoras tendrán la clave secreta de la app insertada en alguna parte (por lo que el token de acceso a la app generado con dicha clave secreta no es seguro).

### Generar un token de acceso a la app

Para generar un token de acceso a la app, necesitas los siguientes elementos:

- El [identificador de la app](https://developers.facebook.com/docs/apps/#app-id)
- La [clave secreta de la app](https://developers.facebook.com/docs/facebook-login/security/#appsecret)

#### Código de ejemplo

```bash
curl -X GET "https://graph.facebook.com/oauth/access_token?client_id={your-app-id}&client_secret={your-app-secret}&grant_type=client_credentials"
```

Esta llamada devuelve un token de acceso a la app que se puede utilizar en lugar de un token de acceso del usuario para realizar llamadas a la API, como ya se señaló. De nuevo, por motivos de seguridad, **nunca** se debe incluir el token de acceso a la app en el código del cliente, pues esto le daría a cualquiera que cargara tu página web o descompilara la app acceso completo a la clave secreta de la app y la posibilidad de modificarla. De lo anterior se desprende que, la mayor parte del tiempo, utilizarás los tokens de acceso a la app solo en llamadas de servidor a servidor.

**Ten en cuenta** que, como esta solicitud utiliza la clave secreta de tu app, nunca se debe incluir en el código del cliente o en un binario de app que se pueda descompilar. **Es importante que nunca compartas con nadie la clave secreta de la app**. Por tanto, esta llamada a la API solo se debe realizar con código de servidor.

Existe otro método para realizar llamadas a la API Graph que no requiere el uso de un token de acceso a la app generado. Puedes limitarte a pasar el identificador y la clave secreta de la app como el parámetro `access_token` al realizar una llamada:

```bash
curl -i -X GET "https://graph.facebook.com/{api-endpoint}&access_token={your-app_id}|{your-app_secret}"
```

La elección entre un token de acceso generado o este método depende de dónde ocultes la clave secreta de la app.

## Tokens de acceso a la página

Los tokens de acceso a la página se utilizan en llamadas a la API Graph para administrar páginas de Facebook. A fin de generar un token de acceso a la página, un administrador de la página debe concederle a tu app el permiso o los permisos necesarios de dicha página. Una vez obtenido el permiso, puedes recuperar el token de acceso a la página usando un token de acceso de usuario con los permisos necesarios.

#### Código de ejemplo

```bash
curl -i -X GET "https://graph.facebook.com/{your-user-id}/accounts?access_token={user-access-token}"
```

Esto devuelve una lista de las páginas [en las que tienes un rol](https://developers.facebook.com/docs/pages/access-tokens#roles), con información sobre cada página, como su categoría, los permisos específicos que tienes en cada una y el token de acceso a la página.

```json
{
  "data": [
    {
      "access_token": "EAACEdE...",
      "category": "Brand",
      "category_list": [
        {
          "id": "1605186416478696",
          "name": "Brand"
        }
      ],
      "name": "Ash Cat Page",
      "id": "1353269864728879",
      "tasks": [
        "ANALYZE",
        "ADVERTISE",
        "MODERATE",
        "CREATE_CONTENT",
        "MANAGE"
      ]
    },
    {
      "access_token": "EAACEdE...",
      "category": "Pet Groomer",
      "category_list": [
        {
          "id": "163003840417682",
          "name": "Pet Groomer"
        }
      ],
      "name": "Unofficial: Tigger the Cat",
      "id": "1755847768034402",
      "tasks": [
        "ANALYZE",
        "ADVERTISE",
        "MODERATE",
        "CREATE_CONTENT"
      ]
    }
  ]
}
```

Con un token de acceso a la página, puedes hacer [llamadas a la API en nombre de la página](https://developers.facebook.com/docs/pages). Por ejemplo, podrías publicar una actualización de estado en una página (en vez de hacerlo en la biografía del usuario) o leer los datos de estadísticas de la página.

Estos tokens de acceso son únicos para cada página, administrador y app.

## Tokens de acceso del cliente

Al igual que los tokens de la app, los tokens de cliente hacen solicitudes a la API Graph en nombre de las apps en lugar del de los usuarios.

A diferencia de lo que sucede con otros tokens, los tokens de acceso del cliente no se pueden usar en solicitudes por sí mismos, sino que deben estar combinados con el identificador de la app. Para eso, agrega el token al final del identificador de la app, separado por una barra vertical (`|`):

```
{app-id}|{client-token}
```

Por ejemplo:

```
access_token=1234|5678
```

Para obtener el token de acceso del cliente para una app, haz lo siguiente:

1. Inicia sesión en tu [cuenta de desarrollador](https://developers.facebook.com/).
2. En la [página de apps](https://developers.facebook.com/apps), selecciona una app para abrir el panel correspondiente.
3. En el **panel**, ve a **Configuración** > **Avanzado** > **Seguridad** > **Token de cliente**.

## Longitud de los tokens de acceso

Es de esperar que la duración de todos los tipos de token de acceso cambie a medida que Facebook haga cambios en lo que allí almacena y en cómo están codificados. Es normal que aumenten o disminuyan con el transcurso del tiempo. Utiliza un tipo de datos de duración variable sin un tamaño máximo específico para almacenar tokens de acceso.

## Más información

- Utiliza la [herramienta de tokens de acceso](https://developers.facebook.com/tools/accesstoken) para ver una lista de los tokens de acceso y la información sobre depuración correspondiente.
- [Caducidad y ampliación](https://developers.facebook.com/docs/facebook-login/access-tokens/expiration-and-extension)
- [Depurar y administrar errores](https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling)
- [Usar tokens con diferentes tipos de apps](https://developers.facebook.com/docs/facebook-login/access-tokens/portability)
```



## Page: https://developers.facebook.com/docs/facebook-login/review

### [Content](https://example.com/docs/resp-plat-initiatives/app-review/content)



## Page: https://developers.facebook.com/docs/managed-accounts

```markdown
# Managed Meta Accounts & Third-party Integrations

## Overview

Managed Meta accounts are an account type for business tools across Meta. Organizations are able to manage these accounts with administrative features including single sign-on (SSO) support, automated account provisioning and more. With these accounts, individuals can access business tools across Meta, such as Meta Business Suite, with their work credentials, without needing to use their personal Facebook account.

Since managed Meta accounts are meant to be used for work only, the following are constraints within the managed Meta accounts type:
- Does not have a social timeline or Facebook News Feed 
- Cannot access consumer-facing products or surfaces on facebook.com, except for access to post as the Facebook Page
- Cannot have personal asset permissions (must be through a business account)
- Can only grant business [app type](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types/) permissions and cannot grant `user_*` related permissions, such as `user_friends` or `user_posts`. Note that managed Meta accounts can still complete login flows requests, but will ignore `user_*` related permissions.

## Third-party app integration

Businesses undergoing migration to managed Meta accounts will transition users from using their Facebook accounts to using their work credentials to access business tools across Meta. Users must complete the migration process before the deadline, which is determined at the business level, to maintain access to Meta's first-party and third-party tools. It is important to note that the deadline is specifically set by the organization for individual users within particular business units. Upon successfully completing the migration, users will be able to log into business tools across Meta using their managed Meta accounts instead of their Facebook accounts, ensuring continued access to necessary tools and resources.

If your app is accessing clients’ business assets using [System user access tokens](https://developers.facebook.com/docs/marketing-api/system-users) or [partner sharing](https://www.facebook.com/business/help/1717412048538897), your third-party integration should not be impacted. If your app is using User access tokens (or Page access token generated from User access tokens), your app’s permissions and access to business assets granted by Facebook accounts will not automatically transition to the new managed Meta accounts. Users will be required to regrant permissions to those business assets using their new managed Meta accounts to preserve your apps' access to those assets.

---

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=1134260767872736&version=1762201689)

---

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=1204337370483805&version=1762201689)

---

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=1878838449209090&version=1762201689)

## Guidelines for Tech Providers 

To **proactively** minimize potential disruptions to your API calls, it is recommended your app provides the following: 
- Ability to proactively reauthorize an asset (e.g. page, ad account) before token invalidation. This can be done by periodically checking the [user_access_expire_time](https://developers.facebook.com/docs/work-accounts/tech-provider-integrations#migration-apis-and-troubleshooting) field of each asset and prompting the user to reauthorize if a timestamp is returned.
- Ability for users to bulk reauthorize assets for disconnected or soon-to-be disconnected assets. This can be done by providing a "Reconnect" or "Replace Expired Tokens" button in your application that allows users to reconnect all their business assets at once instead of one by one. The button should trigger an API call to your server with a list of business asset IDs and a new access token as parameters. Your server can then use the new access token for each of the business assets in the list and store them securely in your application's database or storage.

## Getting started with testing 

Sandbox to validate that managed Meta accounts are supported by your integrations.

### Test managed Meta accounts

In the Test Users section of your app dashboard, we provide a way to create and manage simulated managed Meta accounts to test your app's implementation of Facebook Login and any permissions or features your app uses. By leveraging the Test User Tool's capabilities for creating and managing Meta account test users, you can ensure a smoother experience for users logged into managed Meta accounts while integrating Facebook Login functionality into your app.

These test accounts cannot interact with real users, and any data you generate with a test user will only be visible to other test users on your app, or to real users who have an Administrator, Developer, or Tester role on your app. You can create, edit, delete, and login as a test user only through your App Dashboard (not via Graph API).

#### Limitations

Please refer to the primary [documentation](https://developers.facebook.com/docs/development/build-and-test/test-users) for additional details on test user limitations. The same limitations for test Facebook users apply to test managed Meta accounts, except that apps are limited to 1 test managed Meta account.

#### Creating test managed Meta accounts

You can create test users in the [App Dashboard](https://developers.facebook.com/apps) by going to the **Test Users** section in the **Roles > Test Users** panel, choosing the **managed Meta accounts** tab, and clicking the **Create test users** button. This will open a dialog that allows you a test account.

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=1959540427726879&version=1762201689)

The **Create Test Accounts** dialog allows you to:
- Create a single test account.
- Select whether the created test account will have the app installed by default.
- Select the [Graph API version](https://developers.facebook.com/docs/apps/versions) to use in calls.
- Grant [permissions](https://developers.facebook.com/docs/development/build-and-test/test-users) for the app for each test user.

Once created, test users will appear in the managed Meta accounts table.

#### Testing with managed Meta accounts

You can test your app with a test account by using the test managed Meta account's credentials in Facebook Login and granting your app any permissions it needs. You can also grant your app permissions on behalf of a test user by clicking the ellipsis icon (•••) in the Options column within a given test user's row in the managed Meta accounts table. Clicking the ellipsis icon will give you the option to edit the permissions the test user has granted your app, generate User access tokens for the test user, and log into the test user's account.

After you log into the test account, it is recommended that you assign the business assets needed to go through your app integrations successfully. You can do so by navigating to [Business settings](https://business.facebook.com/settings) to manage your test user’s business portfolio and assets assigned to your test user such as pages, ad accounts, and product catalogs.

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=769132748037814&version=1762201689)

### Simulate migration with test users

You can simulate the changes in business permissions that occur when a Facebook user transitions to a managed Meta account, allowing you to test the impact of user migrations on your app. To use this feature, visit the Facebook test user, click the ellipsis icon (•••) in the Options column, click **Transfer business permissions to a managed Meta account**, and follow the instructions. 

The following prerequisites must be met to use this feature:
- Create a Facebook test user 
- Ensure the Facebook test user has access to a business portfolio with assets (like pages or catalogs) 
- Ensure the Facebook test user has granted permissions to the business data
- Create a test user to transfer business permissions to

After you have completed a transfer, you will be able to:
- Login with the account to preview the [user onboarding experience](https://developers.facebook.com/docs/work-accounts/tech-provider-integrations#user_onboarding_experience)
- Fetch [user_access_expire_time](https://developers.facebook.com/docs/work-accounts/tech-provider-integrations#migration-apis-and-troubleshooting) fields with Facebook test user’s User Access Token

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=867199854997706&version=1762201689)

### Webhooks

Webhooks are a tool for applications to receive automatic notifications about changes to a user's access to specific data assets. The Webhooks tool enhances your development application by providing timely automatic updates. Upon subscription, the webhook sends a notification to your development application. This notification includes a payload with the user's app-scoped ID and the expiration time.

#### Key Features:

- **30-Day Notification**: The tool alerts you 30 days in advance when a user initiates the managed Meta accounts migration or extends their migration period.
- **Access Expiry Alert**: It informs you precisely when access will be lost due to the migration.

Note: The webhook notifications are triggered at the start of the 30-day window upon migration commencement. This ensures that your application is promptly informed about any crucial changes in user data access, allowing for a seamless transition and management of data assets.

### Subscribe

To receive notifications, you need to subscribe to a user’s managed Meta accounts migration information. We will build a new Webhook for you to subscribe to.

If you are new to the Webhook product, please follow our [Webhooks Get Started guide](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) to set up your webhook configuration, and test the webhooks topics you subscribe to.

To set up the managed Meta accounts Webhooks, in the App Dashboard, go to **Products > Webhooks**, select **Managed Meta Account** from the dropdown menu, then click **Subscribe** to this object.

![Image](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/465011738_1093864075671785_5549209495664110741_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=ayGLIVXSZYEQ7kNvwF81oXf&_nc_oc=AdkDNrQ0Iz46S6Bb8CRwXwY1s-J5lWKLR-bFZXZdy-rPNKI6z5px3nzcYCWv_vJvGIk&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=qtnGkq3unuLG1TQoOIuduQ&oh=00_AfjuX87-XfgyFymFfqyKj-Oi81EY3HEFF47G2ohRWMM4fw&oe=692F28EE)

### Notification

We will send Webhook event notifications whenever the migration expiration date for managed Meta accounts is updated, either during creation when the initial expiration date it set or when a user requests an extension on their hybrid mode and gets approved for a longer hybrid mode time.

#### Example of managed Meta account event notification:

```json
{
  "field": "migration_expire_time",
  "value": {
    "user_id": "4444444444",
    "migration_expire_time": "2024-05-04T10:00:00Z"
  }
}
```

## Permissions and Errors

To access `user_access_expire_time` and make API calls to it, developers should ensure that the required permissions are granted to load these objects. In the provided examples, if `object-id` is referring to a business object id, then the user must have been granted at least the `business_management` permission to load the object. Please refer [here](https://developers.facebook.com/docs/permissions/reference/) for more details.

When attempting to access an asset after the expiration time, the API response should return a generic error with `100` and the type `OAuthException.` This indicates the object is no longer accessible via API, since the user no longer has access to the asset.

### Example Graph API Calls

#### 1. Retrieving `is_work_account` status 

**Request**
```
GET /<API_VERSION>/<USER_ID>?fields=is_work_account
```
**Response**
```json
{
  "id": "<USER_ID>",
  "name": "Romane Richter",
  "is_work_account": true
}
```

#### 2. Retrieving `user_access_expire_time` during a 30 day window

**Request**
```
GET /<API_VERSION>/<OBJECT_ID>?fields=user_access_expire_time&access_token=<ACCESS_TOKEN>
```
**Response**
```json
{
  "user_access_expire_time": "2023-06-23T12:00:00+00:00"
}
```

#### 3. Request to field before migration will return empty data

**Request**
```
GET /<API_VERSION>/<OBJECT_ID>?fields=user_access_expire_time&access_token=<ACCESS_TOKEN>
```
**Response**
```json
{}
```

#### 4. Requests 30 days after migration (after `user_access_expire_time`) will likely throw errors

**Request**
```
GET /<API_VERSION>/<OBJECT_ID>?fields=user_access_expire_time&access_token=<ACCESS_TOKEN>
```
**Response**
```json
{
  "error": {
    "message": "(#100) Object does not exist, cannot be loaded due to missing permission or reviewable feature, or does not support this operation. This endpoint requires the 'pages_read_engagement' permission or the 'Page Public Content Access' feature or the 'Page Public Metadata Access' feature. Refer to https://developers.facebook.com/docs/apps/review/login-permissions#manage-pages, https://developers.facebook.com/docs/apps/review/feature#reference-PAGES_ACCESS and https://developers.facebook.com/docs/apps/review/feature#page-public-metadata-access for details.",
    "type": "OAuthException",
    "code": 100,
    "fbtrace_id": "AZdHiJUBflrZnE-RNKrHAah"
  }
}
```

### See Also

Visit the [Tech Provider Integrations FAQs](https://developers.facebook.com/docs/work-accounts/tech-provider-integrations/faqs).

#### What could be the potential reasons why my apps API calls to clients' assets are failing?

API call disruptions related to managed Meta account migrations might be caused by:
1. Users failing to migrate before the deadline set by their business/organization
2. Users failing to re-authenticate with your apps using the managed Meta accounts
```



## Page: https://developers.facebook.com/docs/facebook-login/android

```markdown
# Inicio de sesión con Facebook para Android: inicio rápido

El SDK de Facebook para Android permite a las personas iniciar sesión en tu aplicación mediante el inicio de sesión con Facebook. Al hacerlo así, las personas pueden conceder permiso a la app para obtener información o realizar acciones en Facebook en su nombre.

Para ver un proyecto de ejemplo que ilustra la manera en que se integra el inicio de sesión con Facebook en una aplicación de Android, consulta [FBLoginSample](https://github.com/facebook/facebook-android-sdk/tree/master/samples/FBLoginSample) en [GitHub](https://github.com/).

Sigue los pasos que se describen a continuación para agregar el inicio de sesión con Facebook a tu app.

## 1. Iniciar sesión

Inicia sesión en Facebook para crear apps o regístrate como desarrollador.

[Iniciar sesión en Facebook](https://www.facebook.com/login/?privacy_mutation_token=eyJ0eXBlIjowLCJjcmVhdGlvbl90aW1lIjoxNzYyOTcyMTk2LCJjYWxsc2l0ZV9pZCI6MjM5NDQ2MTI0MDg0ODgxN30%3D&next=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Ffacebook-login%2Fandroid)

## 2. Descargar la app de Facebook

Descarga la aplicación de Facebook haciendo clic en el botón a continuación.

[Descargar Facebook para Android](https://play.google.com/store/apps/details?id=com.facebook.katana)

## 3. Integrar el SDK de Facebook

El SDK de inicio de sesión con Facebook para Android es un componente del [SDK de Facebook para Android](/docs/android/componentsdks). Para usar el SDK del inicio de sesión con Facebook en tu proyecto, puedes descargarlo o establecerlo como dependencia en Maven. Para admitir los cambios realizados en Android 11, usa la versión 8.1 del SDK o una posterior.

### Con Maven

1. En tu proyecto, abre **tu_aplicación** > **Gradle Scripts** > **build.gradle (Project)** y asegúrate de que el repositorio siguiente figure en `buildscript { repositories {}}`:

   ```groovy
   mavenCentral()
   ```

2. En tu proyecto, abre **tu_aplicación** > **Gradle Scripts** > **build.gradle (Module: app)** y agrega la siguiente instrucción de implementación a la sección `dependencies{}` para depender de la versión más reciente del SDK de inicio de sesión con Facebook:

   ```groovy
   implementation 'com.facebook.android:facebook-login:latest.release'
   ```

3. Crea tu proyecto.

## 4. Editar tus recursos y tu manifiesto

Si usas la versión 5.15 o posterior del SDK de Facebook para Android, no necesitas agregar un filtro de intent ni de actividad para las pestañas personalizadas de Chrome. Esta funcionalidad está incluida en el SDK.

Después de que integras el inicio de sesión con Facebook, se registran y recopilan automáticamente determinados eventos de la app en el [administrador de eventos](https://www.facebook.com/events_manager), a menos que desactives el registro automático de eventos. Para obtener información sobre qué información se recopila y cómo desactivar el registro de eventos de la app de manera automática, consulta [Registro automático de eventos de la app](https://developers.facebook.com/docs/app-events/automatic-event-collection-detail).

Crea cadenas para el identificador de tu app de Facebook y las necesarias para activar las pestañas personalizadas de Chrome. También, agrega `FacebookActivity` a tu manifiesto de Android.

1. Abre el archivo `/app/res/values/strings.xml`.
2. Agrega los elementos `string` con los nombres `facebook_app_id`, `fb_login_protocol_scheme` y `facebook_client_token`, y establece los valores de tu [identificador de la app](https://developers.facebook.com/docs/android/getting-started#app-id) y [token de cliente](https://developers.facebook.com/docs/android/getting-started#client-token). Por ejemplo, si tu identificador es `1234` y tu token de cliente es `56789`, tu código se verá de la siguiente manera:

   ```xml
   <string name="facebook_app_id">1234</string>
   <string name="fb_login_protocol_scheme">fb1234</string>
   <string name="facebook_client_token">56789</string>
   ```

3. Abre el archivo `/app/manifest/AndroidManifest.xml`.
4. Agrega los elementos `meta-data` al elemento `application` del identificador de la app y del token de cliente:

   ```xml
   <application android:label="@string/app_name" ...>
       ...
       <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
       <meta-data android:name="com.facebook.sdk.ClientToken" android:value="@string/facebook_client_token"/>
       ...
   </application>
   ```

5. Agrega una actividad para Facebook y una actividad y un filtro de intent para las pestañas personalizadas de Chrome dentro del elemento `application`:

   ```xml
       <activity android:name="com.facebook.FacebookActivity"
           android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
           android:label="@string/app_name" />
       <activity android:name="com.facebook.CustomTabActivity"
           android:exported="true">
           <intent-filter>
               <action android:name="android.intent.action.VIEW" />
               <category android:name="android.intent.category.DEFAULT" />
               <category android:name="android.intent.category.BROWSABLE" />
               <data android:scheme="@string/fb_login_protocol_scheme" />
           </intent-filter>
       </activity>
   ```

6. Agrega el elemento `uses-permission` al manifiesto después del elemento `application`:

   ```xml
   <uses-permission android:name="android.permission.INTERNET"/>
   ```

7. (Opcional) Para dar de baja el [permiso de identificador del anunciante](https://developers.facebook.com/docs/android/getting-started#ad-id-permissions), agrega un elemento `uses-permission` al manifiesto después del elemento `application`:

   ```xml
   <uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/>
   ```

Es posible configurar directamente la recopilación automática de eventos de la app en "verdadero" o "falso" si se establece la marca `AutoLogAppEventsEnabled` en el archivo `AndroidManifest.xml`.

Crea tu proyecto.

## 5. Asociar el nombre de tu paquete y la clase predeterminada con tu app

Debes [iniciar sesión](https://www.facebook.com/login/?next=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Ffacebook-login%2Fandroid) para completar este paso.

## 6. Proporcionar los hashes de clave de desarrollo y activación para la app

Debes [iniciar sesión](https://www.facebook.com/login/?next=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Ffacebook-login%2Fandroid) para completar este paso.

## 7. Activar el inicio de sesión único en tu app

Debes [iniciar sesión](https://www.facebook.com/login/?next=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Ffacebook-login%2Fandroid) para completar este paso.

## 8. Agregar el botón de inicio de sesión con Facebook

El modo más sencillo de agregar el inicio de sesión con Facebook a tu app es agregar `LoginButton` desde el SDK. El permiso `LoginButton` es un elemento que incluye la funcionalidad disponible en `LoginManager`. Cuando alguien hace clic en el botón, el inicio de sesión se inicia con los permisos configurados en `LoginManager`. El inicio de sesión con Facebook requiere el permiso public_profile avanzado, que utilizarán los usuarios externos. El botón sigue el estado del inicio de sesión y muestra el texto correcto según el estado de autenticación de una persona.

Para agregar el botón de inicio de sesión con Facebook, primero agrégalo a tu archivo XML:

```xml
<com.facebook.login.widget.LoginButton
    android:id="@+id/login_button"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_gravity="center_horizontal"
    android:layout_marginTop="30dp"
    android:layout_marginBottom="30dp" />
```

## 9. Registrar una devolución de llamada

Crea un administrador de devolución de llamadas que se encargue de las respuestas del inicio de sesión llamando a `CallbackManager.Factory.create`.

```java
callbackManager = CallbackManager.Factory.create();
```

Si agregas el botón a un fragmento, también debes actualizar tu actividad para usar el fragmento. Puedes personalizar las propiedades de `Login button` y registrar una devolución de llamada en tu método `onCreate()` u `onCreateView()`. Entre las propiedades que puedes personalizar están `LoginBehavior`, `DefaultAudience`, `ToolTipPopup.Style` y los permisos de `LoginButton`. Por ejemplo:

```java
private static final String EMAIL = "email";

loginButton = (LoginButton) findViewById(R.id.login_button);
loginButton.setReadPermissions(Arrays.asList(EMAIL));
// If you are using in a fragment, call loginButton.setFragment(this);

// Callback registration
loginButton.registerCallback(callbackManager, new FacebookCallback<LoginResult>() {
    @Override
    public void onSuccess(LoginResult loginResult) {
        // App code
    }

    @Override
    public void onCancel() {
        // App code
    }

    @Override
    public void onError(FacebookException exception) {
        // App code
    }
});
```

Para responder a un resultado de inicio de sesión, debes registrar una devolución de llamada con `LoginManager` o `LoginButton`. Si registras la devolución de llamada con `LoginButton`, no necesitas hacerlo también en el administrador de inicio de sesión.

La devolución de llamada del administrador de inicio de sesión se agregará a tu actividad o al método `onCreate()` del fragmento:

```java
callbackManager = CallbackManager.Factory.create();

LoginManager.getInstance().registerCallback(callbackManager,
        new FacebookCallback<LoginResult>() {
            @Override
            public void onSuccess(LoginResult loginResult) {
                // App code
            }

            @Override
            public void onCancel() {
                // App code
            }

            @Override
            public void onError(FacebookException exception) {
                // App code
            }
        });
```

Si el inicio de sesión se realiza correctamente, el parámetro `LoginResult` tendrá el nuevo objeto `AccessToken` y los permisos concedidos o rechazados más recientemente.

No necesitas un método `registerCallback` para que el inicio de sesión sea correcto. Puedes optar por seguir los cambios del token de acceso actual con la clase `AccessTokenTracker` que se describe más adelante.

Por último, en tu método `onActivityResult`, llama a `callbackManager.onActivityResult` para pasar el resultado del inicio de sesión a `LoginManager` mediante `callbackManager`. 

Si usas actividades o fragmentos de AndroidX, no es necesario que anules "onActivityResult".

```java
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    callbackManager.onActivityResult(requestCode, resultCode, data);
    super.onActivityResult(requestCode, resultCode, data);
}
```

Cualquier actividad y fragmento que integres con el inicio de sesión con el objeto FacebookSDK o con el uso compartido de este debe dirigir a `onActivityResult` a `callbackManager`.

## 10. Comprobar el estado del inicio de sesión

Tu aplicación solo puede iniciar la sesión de una persona a la vez, y `LoginManager` establece el `AccessToken` y el `Profile` actuales para esa persona. El SDK de Facebook guarda estos datos en las preferencias de uso compartido y los configura al principio de la sesión. Puedes comprobar si una persona ya tiene sesión iniciada mediante `AccessToken.getCurrentAccessToken()` y `Profile.getCurrentProfile()`.

Puedes cargar `AccessToken.getCurrentAccessToken` con el SDK desde la caché o desde un marcador de aplicación cuando la aplicación se inicia por primera vez. Debes comprobar su validez en `Activity`, con el método `onCreate`:

```java
AccessToken accessToken = AccessToken.getCurrentAccessToken();
boolean isLoggedIn = accessToken != null && !accessToken.isExpired();
```

Más adelante puedes realizar el inicio de sesión en sí, como en el método `OnClickListener` de un botón personalizado:

```java
LoginManager.getInstance().logInWithReadPermissions(this, Arrays.asList("public_profile"));
```

## 11. Activar el inicio de sesión rápido

El inicio de sesión rápido inicia la sesión en la cuenta de Facebook de una persona en diferentes dispositivos y plataformas. Si una persona inicia sesión en tu app en Android y, luego, cambia de dispositivo, el inicio de sesión rápido inicia la sesión en su cuenta de Facebook, en lugar de solicitarle la selección de un método de inicio de sesión. De esta manera, se evita la creación de cuentas duplicadas o, incluso, no poder iniciar sesión. Para admitir los cambios realizados en Android 11, primero, agrega el siguiente código al elemento `queries` de tu archivo `/app/manifest/AndroidManifest.xml`.

```xml
<queries>
  <package android:name="com.facebook.katana" />
</queries>
```

En el siguiente código, se muestra cómo activar el inicio de sesión rápido.

```java
LoginManager.getInstance().retrieveLoginStatus(this, new LoginStatusCallback() {
    @Override
    public void onCompleted(AccessToken accessToken) {
        // User was previously logged in, can log them in directly here.
        // If this callback is called, a popup notification appears that says
        // "Logged in as <User Name>"
    }

    @Override
    public void onFailure() {
        // No access token could be retrieved for the user
    }

    @Override
    public void onError(Exception exception) {
        // An error occurred
    }
});
```

## Próximos pasos

¡Felicitaciones, agregaste el inicio de sesión con Facebook a tu app para Android! No te olvides de consultar el resto de las páginas de documentación para acceder a guías más avanzadas.

- [Implementar una devolución de llamada para eliminación de datos](https://developers.facebook.com/docs/apps/delete-data) Implementa una devolución de llamada para eliminación de datos a fin de responder a las solicitudes que hacen las personas para que se eliminen sus datos de Facebook.
- [Tokens de acceso y perfiles](https://developers.facebook.com/docs/facebook-login/android/accesstokens) Haz un seguimiento de los tokens de acceso y de los perfiles de tus usuarios.
- [Permisos](https://developers.facebook.com/docs/facebook-login/android/permissions) Administra los datos a los que tiene acceso tu app a través del inicio de sesión con Facebook.
- [Solución de problemas](https://developers.facebook.com/docs/facebook-login/android/advanced) ¿Tienes problemas para integrar el inicio de sesión con Facebook? Revisa una lista de los problemas más habituales y sus soluciones.
- [Revisión de apps](https://developers.facebook.com/docs/facebook-login/review) Según los datos de Facebook que solicites a las personas que usan el inicio de sesión con Facebook, es posible que necesites enviar tu app a revisión antes de lanzarla.
- [Crea tu propio proceso de inicio de sesión](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow) Para crear tu propio proceso de inicio de sesión, consulta Crear un proceso de inicio de sesión de forma manual.
```



## Page: https://developers.facebook.com/docs/facebook-login/guides/advanced/re-authentication

```markdown
# Reautenticación

La reautenticación permite que tu app confirme la identidad de una persona aunque se haya verificado previamente. El inicio de sesión de Facebook permite que tu app le pueda pedir a un usuario que vuelva a introducir su contraseña de Facebook en cualquier momento. Se puede utilizar para evitar aquellos casos en los que un usuario deja un dispositivo conectado o en los que un tercero se apropia de la sesión de alguien con tu app.

Las app deberían incorporar sus propios mecanismos para cambiar entre diferentes cuentas de usuario de Facebook utilizando funciones de cierre de sesión y no depender de la reautenticación para este fin.

### Nota

Actualmente, los SDK de Android y iOS no son compatibles con la reautenticación.

## Activación de la reautenticación

Durante el [proceso de inicio de sesión](https://developers.facebook.com/docs/facebook-login/#loginflow) te mostramos cómo usar el diálogo de inicio de sesión y OAuth para autenticar a un usuario y solicitarle permisos. Puedes forzar la reautenticación empleando los mismos pasos con parámetros adicionales:

- `auth_type`: este parámetro especifica las funciones de autenticación solicitadas (como una lista separada por comas). Las opciones válidas son:
  - `reauthenticate`: le solicita al usuario que vuelva a autentificarse incondicionalmente
  - `auth_nonce`: incluye un [valor de seguridad alfanumérico](https://en.wikipedia.org/wiki/Cryptographic_nonce) generado por la app, que se puede utilizar para proporcionar [protección contra ataques de repeticiones](https://en.wikipedia.org/wiki/Replay_attack). Consulta cómo [comprobar un elemento `auth_nonce` para obtener más información.](#nonce)

Este es un ejemplo con el SDK para JavaScript que activa la reautenticación utilizando la opción `auth_type` del parámetro `reauthenticate`:

```javascript
FB.login(function(response) {
  // Original FB.login code
}, {
  auth_type: 'reauthenticate'
});
```

## El parámetro `auth_nonce`

El parámetro `auth_nonce` está diseñado para ser un código alfanumérico totalmente arbitrario que tu aplicación genera. El proceso de generación y el formato del código dependen totalmente de ti. Por ejemplo, una versión con hash de una marca de tiempo y una cadena secreta puede ser suficiente, siempre y cuando sea completamente única para cada intento de acceso. Este valor permite que tu aplicación determine si se volvió a autenticar a un usuario.

Tendrá que volver a modificar tu flujo de inicio de sesión para especificar el parámetro `auth_nonce`, por ejemplo:

```javascript
FB.login(function(response) {
  // Original FB.login code
}, {
  auth_type: 'reauthenticate',
  auth_nonce: '{random-nonce}'
});
```

Para comprobar que este nonce no se utilizó antes, debes crear una función que se comunique con el código que comprueba la base de datos de tu aplicación para ver si ya se utilizó ese nonce en particular.

A continuación, se ofrece un ejemplo con JavaScript (con el marco jQuery) y PHP que puedes adaptar a tu configuración específica. Para nuestro ejemplo, utilizaremos como nonce una cadena predefinida en el código. Deberías reemplazar esto con una llamada dinámica a un nonce generado.

```javascript
function checkNonce(access_token) {
  $.post('checkNonce.php', { access_token: access_token }, function(data) {
    if (data == 1) {
      console.log('The user has been successfully re-authenticated.');
      FB.api('/me', function(response) {
        console.log('Good to see you, ' + response.name + '.');
      });
    } else {
      console.log('The nonce has been used before. Re-authentication failed.');
    }
  });
}
```

**Nota:** Este archivo PHP solo implica, y no incluye, el fragmento de código que compararía el nonce suministrado con la base de datos de la aplicación. Deberías realizar los ajustes apropiados para tu base de datos y tu entorno de codificación:

```php
<?php

$access_token = $_REQUEST['access_token'];
$graph_url = 'https://graph.facebook.com/oauth/access_token_info?' . 'client_id=YOUR_APP_ID&access_token=' . $access_token;
$access_token_info = json_decode(file_get_contents($graph_url));

function nonceHasBeenUsed($auth_nonce) {
    // Here you would check your database to see if the nonce
    // has been used before. For the sake of this example, we'll
    // just assume the answer is "no".
    return false;
}

if (nonceHasBeenUsed($access_token_info->auth_nonce) != true) {
    echo '1';
} else {
    echo '0';
}
?>
```

En este ejemplo, se llamaría la función JavaScript `checkNonce()` después de recibir la respuesta del identificador de acceso del cuadro de diálogo de inicio de sesión reautenticado. Uso del SDK para JavaScript como ejemplo:

```javascript
FB.login(function(response) {
  if (response.authResponse) {
     // Login success, check auth_nonce...
     checkNonce(response.authResponse.access_token);
  } else {
    // User cancelled
  }
}, {
  auth_type: 'reauthenticate',
  auth_nonce: '{random-nonce}'
});
```

Ten en cuenta que `auth_nonce` es una parte opcional de la reautenticación. Se recomienda encarecidamente que las aplicaciones lo utilicen, especialmente cuando solicitan la opción `reauthenticate` en el parámetro `auth_type`.
```



## Page: https://developers.facebook.com/docs/facebook-login/web

```markdown
# Inicio de sesión con Facebook para web con el SDK para JavaScript

En este documento, se muestran los pasos para implementar el inicio de sesión con Facebook con el [Facebook SDK for Javascript](/docs/javascript) en tu página web.

## Antes de empezar

Necesitarás lo siguiente:

- Una [cuenta de desarrollador de Facebook](https://developers.facebook.com/apps/) 
- Un [identificador de la app de Facebook](https://developers.facebook.com/docs/apps#register) para un sitio web

## Ejemplo de inicio de sesión automático básico

El siguiente ejemplo de código te muestra cómo agregar el SDK de Facebook para JavaScript y, si iniciaste sesión en Facebook, mostrará tu nombre y correo electrónico. Si no iniciaste sesión en Facebook, se mostrará automáticamente la ventana emergente del cuadro de diálogo de inicio de sesión.

El permiso [public_profile](https://developers.facebook.com/docs/permissions/reference/public_profile), que te permite obtener información que está disponible públicamente, como el nombre y la foto de perfil, y el [permiso email](https://developers.facebook.com/docs/permissions/reference/email) no requieren la revisión de apps y se otorgan automáticamente a todas aquellas apps que usan el inicio de sesión con Facebook.

```html
<!DOCTYPE html>
<html lang="en">
  <head></head>
  <body>
    <h2>Add Facebook Login to your webpage</h2>
    <!-- Set the element id for the JSON response -->
    <p id="profile"></p>
    <script>
      // Add the Facebook SDK for Javascript
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));

      window.fbAsyncInit = function() {
        // Initialize the SDK with your app and the Graph API version for your app
        FB.init({
          appId      : '{your-facebook-app-id}',
          xfbml      : true,
          version    : '{the-graph-api-version-for-your-app}'
        });

        // If you are logged in, automatically get your name and email address
        FB.login(function(response) {
          if (response.authResponse) {
            console.log('Welcome!  Fetching your information.... ');
            FB.api('/me', {fields: 'name, email'}, function(response) {
              document.getElementById("profile").innerHTML = "Good to see you, " + response.name + ". I see your email address is " + response.email;
            });
          } else {
            console.log('User cancelled login or did not fully authorize.');
          }
        });
      };
    </script>
  </body>
</html>
```

## 1. Activar el SDK para JavaScript para el inicio de sesión con Facebook

En el [panel de apps](https://developers.facebook.com/apps), selecciona la app, desplázate hasta **Agregar un producto** y haz clic en **Configurar**, en la tarjeta **Inicio de sesión con Facebook**. Selecciona **Configuración** en el panel de navegación de la izquierda y, en **Configuración del cliente de OAuth**, escribe la URL de redireccionamiento en el campo **URI de redireccionamiento de OAuth válidos** para obtener la autorización correcta.

A fin de indicar que utilizarás el SDK de JavaScript para iniciar sesión, configura la opción de **inicio de sesión con el SDK de JavaScript** en "yes" e ingresa el dominio de la página que hospeda el SDK en la lista **Dominios permitidos para el SDK para JavaScript**. Esto permite que solo se devuelvan los token de acceso cuando se realizan devoluciones de llamadas en dominios autorizados. Solo se admiten páginas HTTPS en el caso de las acciones de autenticación con el SDK de Facebook para JavaScript.

## 2. Verificar el estado del inicio de sesión de una persona

Cuando se carga tu página web, lo primero que debes hacer es determinar si la persona ya inició sesión en tu página mediante el inicio de sesión con Facebook. Una llamada a [FB.getLoginStatus](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus) inicia una llamada a Facebook con el objetivo de obtener el estado de inicio de sesión. Facebook luego llama a tu función de devolución de llamada con los resultados.

### Ejemplo de llamada

```javascript
FB.getLoginStatus(function(response) {
  statusChangeCallback(response);
});
```

### Ejemplo de respuesta JSON

```json
{
  status: 'connected',
  authResponse: {
    accessToken: '{access-token}',
    expiresIn: '{unix-timestamp}',
    reauthorize_required_in: '{seconds-until-token-expires}',
    signedRequest: '{signed-parameter}',
    userID: '{user-id}'
  }
}
```

`status` especifica el estado de inicio de sesión de la persona que usa la página web. El valor de `status` puede ser uno de los siguientes:

| Tipo de `Status`      | Descripción                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `connected`           | La persona inició sesión en Facebook y en tu página web.                   |
| `not_authorized`      | La persona inició sesión en Facebook, pero no en tu página web.            |
| `unknown`             | La persona no inició sesión en Facebook, de modo que no sabes si inició sesión en tu página web. O bien, se llamó a [FB.logout()](#logout) con anterioridad y no se pudo conectar con Facebook. |

Si el estado es `connected`, se incluyen los siguientes parámetros `authResponse` en la respuesta:

| Parámetros de `authResponse` | Valor                                                                 |
|-------------------------------|-----------------------------------------------------------------------|
| `accessToken`                 | Token de acceso para la persona que usa la página web.               |
| `expiresIn`                   | Marca de tiempo UNIX que indica cuándo caduca el token.              |
| `reauthorize_required_in`     | El tiempo, en segundos, que transcurre antes de que el inicio de sesión caduque y la persona tenga que iniciar sesión de nuevo. |
| `signedRequest`               | Parámetro firmado que contiene información acerca de la persona que usa la página web. |
| `userID`                      | El identificador de la persona que usa la página web.                |

El SDK para JavaScript detecta el estado de inicio de sesión automáticamente, de modo que no tienes que hacer nada para activar este comportamiento.

## 3. Solicitar a una persona que inicie sesión

Si una persona abre tu página web pero no inició sesión en la página o en Facebook, puedes usar el [cuadro de diálogo de inicio de sesión](https://developers.facebook.com/docs/facebook-login/overview/#logindialog) para indicarle que inicie sesión en tu página y en Facebook. Si la persona no inició sesión en Facebook, primero se le pedirá que lo haga y, después, que inicie sesión en tu página web.

Una persona puede iniciar sesión de alguna de estas dos maneras:

- El [botón de inicio de sesión con Facebook](#loginbutton).
- El [cuadro de diálogo de inicio de sesión](#logindialog) del SDK para JavaScript.

### A. Inicia sesión con el botón "Iniciar sesión"

Para usar el botón de inicio de sesión con Facebook, usa nuestro [configurador del plugin](https://developers.facebook.com/docs/facebook-login/web/login-button) para [personalizar el botón "Iniciar sesión"](https://developers.facebook.com/docs/facebook-login/web/login-button) y obtener el código.

### Configurador del plugin

```html
<fb:login-button scope="public_profile,email" onlogin="checkLoginState();"></fb:login-button>
```

### B. Iniciar sesión con el cuadro de diálogo de inicio de sesión del SDK para JavaScript

Para usar tu propio botón de inicio de sesión, puedes invocar el cuadro de diálogo de inicio de sesión con una llamada a [FB.login()](https://developers.facebook.com/docs/reference/javascript/FB.login).

```javascript
FB.login(function(response) {
  // handle the response
});
```

## Solicitar permisos adicionales

Cuando una persona hace clic en tu botón HTML, se muestra una ventana emergente con el cuadro de diálogo de inicio de sesión. El cuadro de diálogo te permite [solicitar permiso](https://developers.facebook.com/docs/facebook-login/web/permissions) para acceder a los datos de una persona. Es posible pasar el parámetro `scope` junto con la llamada a la función `FB.login()`. Este parámetro opcional es una lista de [permisos](https://developers.facebook.com/docs/facebook-login/permissions), separados por comas, que debe confirmar una persona para que tu página web tenga acceso a sus datos. Para el inicio de sesión con Facebook, se requiere el permiso public_profile avanzado, que utilizarán usuarios externos.

### Ejemplo de llamada

En este ejemplo, se pregunta a la persona que inicia sesión si tu página web puede tener acceso a su perfil público y a su correo electrónico.

```javascript
FB.login(function(response) {
  // handle the response
}, {scope: 'public_profile,email'});
```

## Administrar la respuesta del cuadro de diálogo de inicio de sesión

La respuesta, ya sea para conectar o cancelar, devuelve un objeto `authResponse` a la devolución de llamada especificada cuando llamaste a `FB.login()`. Esta respuesta se puede detectar y administrar dentro de la llamada a `FB.login()`.

### Ejemplo de llamada

```javascript
FB.login(function(response) {
  if (response.status === 'connected') {
    // Logged into your webpage and Facebook.
  } else {
    // The person is not logged into your webpage or we are unable to tell.
  }
});
```

## 4. Cerrar la sesión de una persona

Para cerrar la sesión de una persona en tu página web, asocia la función `FB.logout()` del SDK de JavaScript a un botón o un enlace.

### Ejemplo de llamada

```javascript
FB.logout(function(response) {
  // Person is now logged out
});
```

**Nota: Esta llamada de función puede también cerrar la sesión de Facebook de la persona.**

### Situaciones que se deben tener en cuenta

1. Una persona inicia sesión en Facebook y, luego, inicia sesión en tu página web. Cuando una persona cierra la sesión de tu app, continúa conectada a Facebook.
2. Una persona inicia sesión en tu página web y en Facebook como parte del proceso de inicio de sesión de tu app. Al cerrar sesión en tu app, el usuario también cierra su sesión de Facebook.
3. Una persona inicia sesión en otra página web y en Facebook como parte del proceso de inicio de sesión de la otra página web y, luego, inicia sesión en tu página web. Al cerrar sesión en alguna de las dos páginas web, el usuario también cierra su sesión de Facebook.

Además, cerrar sesión en tu página web no revoca los permisos que la persona otorgó a tu página web durante el inicio de sesión. La [revocación de permisos](https://developers.facebook.com/docs/facebook-login/permissions#revokelogin) debe hacerse por separado. Desarrolla la página web de forma tal que una persona que haya cerrado sesión no vea el cuadro de diálogo de inicio de sesión cuando vuelva a iniciar sesión.

## Ejemplo de código completo

Este código carga e inicializa el SDK para JavaScript en tu página HTML. Reemplaza `{app-id}` por el [identificador de la app](https://developers.facebook.com/docs/apps) y `{api-version}` por la versión de la API Graph que se usará. A menos que tengas un motivo específico para usar una versión anterior, especifica la versión más reciente: `v24.0`.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Facebook Login JavaScript Example</title>
  <meta charset="UTF-8">
</head>
<body>
  <script>
    function statusChangeCallback(response) {
      // Called with the results from FB.getLoginStatus().
      console.log('statusChangeCallback');
      console.log(response);                   // The current login status of the person.
      if (response.status === 'connected') {
        // Logged into your webpage and Facebook.
        testAPI();
      } else {
        // Not logged into your webpage or we are unable to tell.
        document.getElementById('status').innerHTML = 'Please log into this webpage.';
      }
    }

    function checkLoginState() {
      // Called when a person is finished with the Login Button.
      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });
    }

    window.fbAsyncInit = function() {
      FB.init({
        appId      : '{app-id}',
        cookie     : true,                     // Enable cookies to allow the server to access the session.
        xfbml      : true,                     // Parse social plugins on this webpage.
        version    : '{api-version}'           // Use this Graph API version for this call.
      });

      FB.getLoginStatus(function(response) {
        // Called after the JS SDK has been initialized.
        statusChangeCallback(response);        // Returns the login status.
      });
    };

    function testAPI() {
      // Testing Graph API after login.  See statusChangeCallback() for when this call is made.
      console.log('Welcome!  Fetching your information.... ');
      FB.api('/me', function(response) {
        console.log('Successful login for: ' + response.name);
        document.getElementById('status').innerHTML = 'Thanks for logging in, ' + response.name + '!';
      });
    }
  </script>

  <!-- The JS SDK Login Button -->
  <fb:login-button scope="public_profile,email" onlogin="checkLoginState();"></fb:login-button>

  <div id="status"></div>

  <!-- Load the JS SDK asynchronously -->
  <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
</body>
</html>
```

## Otros recursos

- Documentación del [botón "Iniciar sesión"](https://developers.facebook.com/docs/plugins/login-button)
- Referencia de [FB.login()](https://developers.facebook.com/docs/reference/javascript/FB.login)
- Referencia de [FB.getLoginStatus()](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus)
- Referencia del SDK para JavaScript [aquí](https://developers.facebook.com/docs/reference/javascript)
```



## Page: https://developers.facebook.com/docs/facebook-login/create-an-app

```markdown
El siguiente contenido proviene de la documentación para desarrollo de la app de Meta. Consulta la documentación de desarrollo para obtener más información sobre el [proceso de desarrollo de la app de Meta](https://developers.facebook.com/docs/development).

# Caso de uso de inicio de sesión con Facebook

En este documento, se explica cómo crear y personalizar una app con el caso de uso de inicio de sesión con Facebook en el Panel de apps.

En esta guía, se asume que leíste e implementaste los requisitos para [crear una app con Meta](https://developers.facebook.com/docs/development/create-an-app).

## 1. Iniciar el proceso de creación de apps

Puedes crear una app de varias maneras.

- Si acabas de completar el proceso de registro, haz clic en el botón **Crear primera app**.
- Si estás en el [panel de apps](https://developers.facebook.com/apps), haz clic en **Crear app**, en la parte superior derecha.
- Si estás en el panel de una app preexistente y quieres crear una app nueva, selecciona el menú desplegable que se encuentra en la parte superior derecha y haz clic en el botón **Crear nueva app**.

## Paso 2: Selecciona el caso de uso

Selecciona el caso de uso **Autenticar y solicitar datos de los usuarios con inicio de sesión con Facebook**.

Puedes hacer clic en el icono de comilla angular que se encuentra a la derecha de la descripción para ver qué más puedes hacer con este caso de uso y qué requisitos tiene.

Haz clic en el botón **Siguiente**.

Más adelante, podrás personalizar tu caso de uso en el panel de la app.

## Paso 3. Detalles de la app

En este paso agregarás lo siguiente:

- Un **nombre** para tu app
- La dirección de **correo electrónico** que usarás para estar en contacto por todo lo relacionado con esta app

De manera opcional, puedes vincular esta app a una **cuenta comercial** preexistente mediante el menú desplegable, o puedes agregarla más adelante.

Haz clic en **Crear app** para guardar los detalles de tu app.

## Paso 4. Personaliza tu app

En la sección **Autenticación y creación de la cuenta**, verás que el **inicio de sesión con Facebook** y el permiso **`public_profile`** se agregaron automáticamente a tu app. Esto permite que tu app use el inicio de sesión con Facebook y pida a los usuarios permiso para acceder a la información del perfil público predeterminado.

Haz clic en el botón **Personalizar**.

### Personalizar el inicio de sesión con Facebook y solicitar datos al usuario

#### Configuración

El inicio de sesión con Facebook te permite controlar la configuración de OAuth y agregar una URL de devolución de llamada de autorización cancelada y un validador de URI de redireccionamiento.

#### Inicio rápido

El inicio de sesión con Facebook rápido te permite obtener al instante el código para implementar el inicio de sesión con Facebook en tu app.

### Permisos

Verás una lista de permisos disponibles en el caso de uso de inicio de sesión con Facebook, con la descripción y los requisitos completos de cada uno.

- `email`: se puede agregar si tu app necesita la dirección de correo electrónico de una persona
- `public_profile`: se agrega automáticamente y no se puede eliminar

Tras agregar un permiso a tu app, podrás ver su estado:

- Listo para modo activo: este permiso se aprobó en el proceso de revisión de apps, y ya puedes publicar tu app
- Listo para probarse: puedes probar llamadas a puntos de conexión de la API que requieren este permiso y completar los requisitos de prueba para el proceso de revisión de aplicaciones
- Verificación requerida: este permiso requiere que se agregue una cuenta comercial verificada de Meta a la aplicación

También puedes ver la cantidad de llamadas a la API exitosas que realizaste a los puntos de conexión que solicitan cada permiso.

## Paso 5. Agrega más casos de uso

Haz clic en el botón **Volver**, en la parte superior derecha, o en **Casos de uso**, en el menú del lado izquierdo, para agregar más casos de uso a tu app.

Estos son los casos de uso más comunes que acompañan al caso de uso principal que elegiste al crear esta app.

| Caso de uso | Permisos disponibles para agregar y código para implementar |
|-------------|-----------------------------------------------------------|
| **Usar datos del usuario adicionales con fines de personalización**: elige los permisos de datos para personalizar la experiencia en la app de los usuarios que inicien sesión con sus cuentas de Facebook. <br> **Solo agrega los permisos que tu app utilizará.** <br> Todos estos permisos deben pasar por el proceso de revisión de apps antes de que puedas publicar tu app en modo activo. | `user_age_range` <br> `user_birthday` <br> `user_friends` <br> `user_gender` <br> `user_hometown` <br> `user_likes` <br> `user_link` <br> `user_location` <br> `user_photos` <br> `user_posts` <br> `user_videos` |
| **Realizar un seguimiento con Eventos de la app**: los eventos de la app de Meta te permiten comprender cómo las personas interactúan con tu empresa en varios dispositivos, plataformas y sitios web. | [Eventos de la app de Meta](https://developers.facebook.com/docs/app-events/overview/) |
| **Obtener notificaciones en tiempo real con Webhooks**: recibe notificaciones HTML automáticas cuando los usuarios de la app hagan cambios relacionados con los permisos que agregaste a tu app. | [Webhooks de Meta](https://developers.facebook.com/docs/graph-api/webhooks/) |

## Próximos pasos

Ahora que personalizaste correctamente tu caso de uso de inicio de sesión con Facebook, [actualicemos la configuración de tu app](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings) en el panel de la app.

## Consulta también:

Para obtener más información sobre los conceptos, puntos de conexión y permisos mencionados en este documento, consulta las siguientes guías:

- [Información general sobre el inicio de sesión con Facebook](https://developers.facebook.com/docs/facebook-login)
- [Información general de los eventos de la app de Meta](https://developers.facebook.com/docs/app-events/overview/)
- [Información general de webhooks de Meta](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Referencia sobre permisos](https://developers.facebook.com/docs/permissions)
```



## Page: https://developers.facebook.com/docs/facebook-login/permissions/overview

```markdown
# Permisos en el inicio de sesión con Facebook

Cuando una persona inicia sesión en tu app mediante el inicio de sesión con Facebook, puedes acceder a un subconjunto de los datos que esa persona tiene almacenados en Facebook. Solicitas *permisos* cuando le pides a la persona si puedes acceder a los datos. La configuración de privacidad de la persona, combinada con la petición que realices, determinará a qué datos puedes acceder.

[Solicitud y revocación](/docs/facebook-login/permissions/requesting-and-revoking)  
[Revisión](/docs/facebook-login/permissions/review)  
[Referencia de permisos](/docs/facebook-login/permissions)

## Ejemplo de inicio de sesión con Facebook

Los permisos son cadenas que se pasan junto con una solicitud de inicio de sesión o una llamada a la API. Por ejemplo, si agregas el [botón de inicio de sesión](/docs/plugins/login-button) a una app web y solicitas `pages_show_list` mediante el parámetro `scope`, la persona se encontrará con este cuadro de diálogo al iniciar sesión por primera vez: Proporcionamos mecanismos similares para iOS y Android. [Continúa leyendo](#adding) para ver enlaces de cada plataforma.

## ¿Cuándo se deben solicitar permisos?

Una app puede solicitar permisos adicionales en cualquier momento, incluso después de que una persona inició sesión por primera vez. Por ejemplo, con el permiso `user_photos`, la app puede acceder a las fotos que publicó una persona. Se recomienda que solicites este permiso solo cuando la app necesita mostrarle a la persona las fotos publicadas. Cuando solicitas nuevos permisos, a la persona que usa tu app se le pedirán esos permisos y tendrá la opción de rechazarlos. Para obtener más información, consulta [Optimizar solicitudes de permisos](/docs/facebook-login/permissions/requesting-and-revoking/#optimizing).

Los permisos se deben otorgar solo una vez por app. Es decir, los permisos que se conceden en una plataforma se otorgan de manera efectiva en todas las plataformas compatibles con tu app.

## Control del usuario

El inicio de sesión con Facebook permite que **una persona conceda únicamente un subconjunto de los permisos** que solicitas para tu app, excepto el perfil público, que se requiere siempre. Cuando se solicitan permisos, esta opción se muestra como una pantalla separada en el cuadro de diálogo de inicio de sesión. La app debe contemplar el caso en el que una persona rechace conceder a la app alguno de los permisos solicitados.

### Permisos revocados

Después de iniciar sesión, las personas también pueden revocar en cualquier momento los permisos concedidos a tu app desde la interfaz de Facebook. Es importante que la app verifique con frecuencia cuáles permisos se otorgaron, especialmente, cuando se lance en una nueva plataforma. Proporcionamos métodos para que [verifiques qué permisos se otorgaron a tu app](/docs/facebook-login/permissions/requesting-and-revoking/#checking).

## Permisos detallados

Las personas pueden conceder a tu app permisos para páginas y activos comerciales que administren de manera individual. Por ejemplo, si una persona administra varias páginas, puede conceder a tu app permiso solo para una página determinada o para una parte de esta.

Durante un proceso de solicitud de permisos, las personas pueden elegir qué permisos otorgar. Por ejemplo, si una app solicita permisos de página, las personas reciben una solicitud para otorgar esos permisos en el cuadro de diálogo de inicio de sesión. Si no otorgan todos los permisos solicitados, pueden administrar qué tipos de permisos otorgan y los activos, como permiso a una página específica, si es que administran muchos, a los que puede acceder la app con esos permisos.

Si en un principio una persona solo otorga algunos de los permisos solicitados, más adelante puede modificar los permisos que concede, desde la página de configuración de la app. Sin embargo, si actualiza los permisos para concederlos todos, ya no podrá usar la página de configuración de la app para cambiar los permisos concedidos.

Las personas pueden administrar los siguientes permisos de forma individual:

- [Permisos para todas las páginas](/docs/pages/overview#permissions)
- Permiso [`business_management`](/docs/facebook-login/permissions/#reference-business_management)

## Caducidad de los permisos

Si tu app no utiliza un permiso durante 90 días, ese permiso caducará. Esto sucederá incluso si el permiso se aprobó por medio de la revisión de apps.
```



## Page: https://developers.facebook.com/docs/facebook-login/auth-vs-data

```markdown
# Autenticación y acceso de datos

El inicio de sesión con Facebook proporciona dos beneficios principales: autenticación y acceso de datos. No son mutuamente excluyentes. Puedes usar el inicio de sesión con Facebook para autenticar a las personas sin planear acceder a sus datos. En ese caso, no necesitas solicitar [permisos](/docs/facebook-login/permissions/overview) ni someter tu app al proceso de [revisión de apps](/docs/facebook-login/review).

La autenticación y el acceso a los datos duran un período determinado. Sin embargo, los períodos de vencimiento de la autenticación y el acceso de datos varían y dependen de diferentes factores.

## Autenticación

La autenticación permite a las personas iniciar sesión en tu app para celulares o en tu app web y crear una cuenta con sus credenciales de Facebook. No necesitan crear ni recordar otra contraseña diferente.

### Vencimiento de la autenticación

Cuando tu app usa el inicio de sesión con Facebook para autenticar a un usuario, recibe un [token de acceso](/docs/facebook-login/access-tokens) de usuario. Si tu app usa uno de los SDK de Facebook, este token dura aproximadamente 60 días. Sin embargo, los SDK actualizan el token de forma automática cada vez que la persona usa tu app, de modo que los tokens se vencen 60 días después del último uso. Si tu app no usa los SDK de Facebook, debes incluir un código que actualice el token de usuario manualmente. Si el token de usuario se vence, tu app debe forzar de nuevo el proceso de inicio de sesión del usuario.

<div data-click-area="to_top_nav">
<a class="_2k32" href="#"><i alt="" class="img sp_bUKixoMJa07_2x sx_2f8dba" data-visualcompletion="css-img"></i></a>
</div>

### Acceso de datos

El inicio de sesión con Facebook te permite solicitar [permisos](/docs/facebook-login/permissions/overview) cuando las personas inician sesión en tu app. Estos permisos, si el usuario los concedió, brindan a tu app acceso a los elementos de los datos del usuario. Por ejemplo, tu app puede acceder al nombre y la foto de perfil de un usuario.

Si una app solicita permisos, a menudo es necesario colocar la app en el proceso de [revisión de apps](/docs/facebook-login/review) para que Facebook pueda asegurarse de que los datos no se usen de forma indebida. Tu app puede solicitar el nombre y la foto de las personas (los [campos del perfil predeterminados](/docs/facebook-login/permissions/#reference-default)) y el [correo electrónico](/docs/facebook-login/permissions/#reference-email) sin pasar por el proceso de revisión de apps. Sin embargo, este proceso es necesario para el resto de los permisos. Para conocer las listas de permisos y cuáles requieren el proceso de revisión de apps, consulta la [referencia sobre permisos](/docs/facebook-login/permissions/).

### Vencimiento del acceso de datos

El período de vencimiento del acceso de datos es de 90 días a partir de la última vez que el usuario estuvo activo. Cuando se vence este período de 90 días, el usuario aún puede acceder a tu app, es decir, todavía está autenticado, pero tu app no puede acceder a sus datos. Para recuperar el acceso a los datos, tu app debe solicitarle al usuario que vuelva a autorizar los permisos de tu app.

![Imagen de ejemplo](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/44623790_1973617839604423_3733339934807818240_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=OwTw50Iy0isQ7kNvwGkaTgR&_nc_oc=AdnLu5evGJ6uRtsQ9rcqplmN6BT6fGCdV-rQb9vYe0mlvFDWZ1YatYH5xaqaY01i7nI&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=0AF7ZbRiVBwCMWCmJWVASQ&oh=00_Afgwgr35FDukwrC5D6I0SJL3UaEYm9YbSVtuO_6C7RYzWQ&oe=692EFCD2)

Para volver a solicitar la autorización con el SDK de Facebook para Android o el SDK de Facebook para iOS, llama a `reauthorizeDataAccess()` en `LoginManager`.

Con el SDK de Facebook para JavaScript, usa `auth_type: 'reauthorize'`.

```javascript
FB.login(function(response) {
  // Original FB.login code
}, {
  auth_type: 'reauthorize'
});
```

En la web, haz una llamada con `auth_type=reauthorize`.

Los siguientes permisos no se vencen:

- `ads_read`
- `ads_management`
- `business_management`
- `configure_page_transactions`
- `pages_manage_ads`
- `pages_manage_cta`
- `pages_manage_instant_articles`
- `pages_manage_engagement`
- `pages_manage_metadata`
- `pages_manage_posts`
- `pages_messaging`
- `pages_read_engagement`
- `pages_read_user_content`
- `pages_show_list`
- `read_audience_network_insights`
- `read_insights`

### Pruebas de vencimiento de acceso a los datos el usuario

Con los SDK de iOS y Android, cuando el acceso de tu app a los datos del usuario se vence, puedes recuperarlos llamando a `dataAccessExpirationTime` en el objeto del token de acceso. Este método devuelve una fecha que especifica cuándo se vencerá el acceso a los datos.

También puedes hacer una prueba para saber si el acceso a los datos del usuario se venció llamando a `isDataAccessExpired`, que devuelve un valor booleano.

En el servidor, puedes recuperar esta información desde el [punto de conexión `debug_token`](https://developers.facebook.com/docs/graph-api/reference/debug_token/).

En la web, puedes ver la hora de vencimiento en `payload: data_access_expiration_time`.

```javascript
{
  status: 'connected',
  authResponse: {
    accessToken: '...',
    expiresIn: '...',
    reauthorize_required_in: '...',
    data_access_expiration_time: '...',
    signedRequest: '...',
    userID: '...'
  }
}
```

### Vencimiento del permiso

Independientemente de la última vez que el usuario estuvo activo, si tu app no usa un permiso durante 90 días, es posible que dicho permiso venza. Esto sucede incluso si el permiso se aprobó por medio de la revisión de apps.

<div data-click-area="to_top_nav">
<a class="_2k32" href="#"><i alt="" class="img sp_bUKixoMJa07_2x sx_2f8dba" data-visualcompletion="css-img"></i></a>
</div>
```



## Page: https://developers.facebook.com/docs/facebook-login/facebook-login-for-business

```markdown
# Inicio de sesión con Facebook para empresas

El inicio de sesión con Facebook para empresas es la solución de autenticación y autorización ideal para los proveedores de tecnología que crean integraciones con las herramientas empresariales de Meta con el fin de ofrecer soluciones de marketing, mensajería y ventas.

El inicio de sesión con Facebook para empresas te permite crear una experiencia de inicio de sesión en el panel de apps de Meta en función de las necesidades de tu app. Puedes especificar el tipo de token de acceso, los activos y los permisos que necesita tu app, y guardarlos en la **configuración**. Durante el inicio de sesión, a los usuarios de tu app se les muestra esta configuración, que les permite otorgar a tu app acceso a sus activos comerciales.

## Requisitos

- Tu app de Meta debe ser una [**app de tipo de negocios**](https://developers.facebook.com/docs/development/create-an-app/other-app-types#step-3--select-an-app-type).
- El usuario de tu app debe conceder todos los permisos que tu app solicita durante el inicio de sesión. De lo contrario, no se le concederá ningún permiso.
- Los permisos `email` y `public_profile` se conceden automáticamente a todas las apps, pero al menos uno de los otros permisos admitidos se debe incluir en cada instalación de app.
- Para prestar servicio a empresas que no son de tu propiedad ni administras, tu app debe obtener aprobación de [**acceso avanzado**](#) a través de la [**revisión de apps de Meta**](https://developers.facebook.com/docs/app-review).
- Las apps con acceso avanzado deben pasar por un proceso de [**revisión continua**](https://developers.facebook.com/docs/resp-plat-initiatives/ongoing-reviews) para conservar el acceso. No obstante, las apps que utilizan el inicio de sesión con Facebook para empresas tienen menos requisitos en relación con determinadas revisiones de cumplimiento continuas, porque se limitan a acceder a permisos y funciones comerciales.

## Permisos admitidos

En la siguiente tabla, se muestran los permisos disponibles para el inicio de sesión con Facebook para empresas.

| Available Permissions | User access tokens | Business Integration System User access tokens (WhatsApp) |
|-----------------------|---------------------|-----------------------------------------------------------|
| [`ads_management`](https://developers.facebook.com/docs/permissions/#ads_management) | ✓ | ✓ |
| [`ads_read`](https://developers.facebook.com/docs/permissions/#ads_read) | ✓ | ✓ |
| [`business_management`](https://developers.facebook.com/docs/permissions/#business_management) | ✓ | ✓ |
| [`catalog_management`](https://developers.facebook.com/docs/permissions/#catalog_management) | ✓ | ✓ |
| `commerce_account_manage_orders` | ✓ | ✓ |
| `commerce_account_read_orders` | ✓ | ✓ |
| `commerce_account_read_reports` | ✓ | ✓ |
| `commerce_account_read_settings` | ✓ | ✓ |
| `commerce_manage_accounts` | ✓ | ✓ |
| [`email`](https://developers.facebook.com/docs/permissions/#email) | ✓ | N/A |
| [`instagram_basic`](https://developers.facebook.com/docs/permissions/#instagram_basic) | ✓ | ✓ |
| [`instagram_content_publish`](https://developers.facebook.com/docs/permissions/#instagram_content_publish) | ✓ | ✓ |
| [`instagram_manage_comments`](https://developers.facebook.com/docs/permissions/#instagram_manage_comments) | ✓ | ✓ |
| [`instagram_manage_insights`](https://developers.facebook.com/docs/permissions/#instagram_manage_insights) | ✓ | ✓ |
| [`instagram_manage_messages`](https://developers.facebook.com/docs/permissions/#instagram_manage_messages) | ✓ | ✓ |
| [`instagram_shopping_tag_products`](https://developers.facebook.com/docs/permissions/#instagram_shopping_tag_products) | ✓ | ✓ |
| [`leads_retrieval`](https://developers.facebook.com/docs/permissions/#leads_retrieval) | ✓ | ✓ |
| [`manage_app_solutions`](https://developers.facebook.com/docs/permissions/#manage_app_solution) | ✓ | ✓ |
| [`manage_fundraisers`](https://developers.facebook.com/docs/permissions/#manage_fundraisers) | ✓ | ✓ |
| [`pages_manage_cta`](https://developers.facebook.com/docs/permissions/#pages_manage_cta) | ✓ | ✓ |
| [`page_events`](https://developers.facebook.com/docs/permissions/#page_events) | ✓ | ✓ |
| [`pages_manage_ads`](https://developers.facebook.com/docs/permissions/#pages_manage_ads) | ✓ | ✓ |
| [`pages_manage_engagement`](https://developers.facebook.com/docs/permissions/#pages_manage_engagement) | ✓ | ✓ |
| [`pages_manage_instant_articles`](https://developers.facebook.com/docs/permissions/#pages_manage_instant_articles) | ✓ | ✓ |
| [`pages_manage_metadata`](https://developers.facebook.com/docs/permissions/#pages_manage_metadata) | ✓ | ✓ |
| [`pages_manage_posts`](https://developers.facebook.com/docs/permissions/#pages_manage_posts) | ✓ | ✓ |
| [`pages_messaging`](https://developers.facebook.com/docs/permissions/#pages_messaging) | ✓ | ✓ |
| [`pages_read_engagement`](https://developers.facebook.com/docs/permissions/#pages_read_engagement) | ✓ | ✓ |
| [`pages_read_user_content`](https://developers.facebook.com/docs/permissions/#pages_read_user_content) | ✓ | ✓ |
| [`pages_show_list`](https://developers.facebook.com/docs/permissions/#pages_show_list) | ✓ | ✓ |
| [`private_computation_access`](https://developers.facebook.com/docs/permissions/#private_computation_access) | ✓ | ✓ |
| [`public_profile`](https://developers.facebook.com/docs/permissions/#public_profile) | ✓ | N/A |
| [`publish_video`](https://developers.facebook.com/docs/permissions/#publish_video) | ✓ | ✓ |
| [`read_insights`](https://developers.facebook.com/docs/permissions/#read_insights) | ✓ | ✓ |
| [`read_audience_network_insights`](https://developers.facebook.com/docs/permissions/#read_audience_network_insights) | ✓ | ✓ |
| [`whatsapp_business_management`](https://developers.facebook.com/docs/permissions/#whatsapp_business_management) | ✓ | ✓ |
| [`whatsapp_business_messaging`](https://developers.facebook.com/docs/permissions/#whatsapp_business_messaging) | ✓ | ✓ |

## Funciones admitidas

[Funciones admitidas](https://developers.facebook.com/docs/features-reference)

| | |
|---|---|
| Acceso estándar a la administración de anuncios | Acceso al perfil del usuario del activo comercial |
| Agente humano | Acceso al contenido público de Instagram |
| API de video en vivo | Menciones de la página |
| Acceso al contenido público de páginas | Acceso a metadatos públicos de páginas |

## Productos admitidos

| | |
|---|---|
| [App Ads](https://developers.facebook.com/docs/app-ads) | [App Events](https://developers.facebook.com/docs/app-events) |
| [App Links](https://developers.facebook.com/docs/applinks) | [Audience Network](https://developers.facebook.com/docs/audience-network) |
| [Commerce Platform](https://developers.facebook.com/docs/commerce-platform) | [Fundraiser API](https://developers.facebook.com/docs/fundraiser-api) |
| [Instagram Platform](https://developers.facebook.com/docs/instagram-platform) | [Jobs](https://developers.facebook.com/docs/pages/jobs-xml) |
| [Marketing API](https://developers.facebook.com/docs/marketing-apis) | [Messenger Platform](https://developers.facebook.com/docs/messenger-platform) |
| [Meta Business Extension](https://developers.facebook.com/docs/meta-business-extension) | [Meta Pixel](https://developers.facebook.com/docs/meta-pixel) |
| [Pages API](https://developers.facebook.com/docs/pages-api) | [Sharing](https://developers.facebook.com/docs/sharing) |
| [ThreatExchange](https://developers.facebook.com/docs/threat-exchange) | [Web Payments](https://developers.facebook.com/docs/games_payments) |
| [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks) | [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp) |

## Tokens de acceso compatibles

Puedes usar el inicio de sesión con Facebook para empresas para obtener tokens de acceso del usuario del sistema de integración comercial o tokens de acceso de usuario.

### Token de acceso de usuario

Debes usar tokens de acceso de usuario si tu app realiza acciones en tiempo real, en función de las entradas del usuario. Por ejemplo, usa un token de acceso del usuario si tu app solicita a un usuario que ingrese texto y haga clic en un botón para publicar contenido en su página. También debes usar tokens de acceso del usuario si necesitas una API que solicite permisos de administrador en un portfolio comercial.

### Tokens de acceso del usuario del sistema de integración comercial

Los tokens de acceso del usuario del sistema de integración comercial deberán usarse si tu app realiza acciones automáticas programáticas en los activos de los clientes de negocios, sin la necesidad de basarse en una entrada de un usuario de la app ni de solicitar la reautenticación en una fecha futura. Por ejemplo:

- Llamadas a la API de conversión de servidor a servidor, automáticas y por hora.
- Envío de respuestas automáticas como página de Facebook o como portfolio comercial de WhatsApp.
- Actualizaciones automáticas continuas de los inventarios del catálogo de productos.
- Recuperación automática de estadísticas de anuncios.

#### Requisitos

Para obtener tokens de acceso del usuario de integración comercial a partir de tus clientes de negocios, ten en cuenta lo siguiente:

- Tu app solo puede solicitar inicios de sesión de plataformas web.
- Los negocios que se registran en tu app deben tener un [portfolio comercial](https://www.facebook.com/business/help/2199735813629697), o bien estar dispuestos a crear uno.
- Tu app debe estar asociada a un [portfolio comercial](https://www.facebook.com/business/help/2199735813629697), del cual tienes control total. Debe ser independiente del portfolio comercial que pertenece a tu cliente comercial.

Para probar el proceso del token de acceso del usuario del sistema de integración comercial, el evaluador debe tener un rol en la app y el control total del negocio del cliente.

#### Tokens de acceso del usuario del sistema de integración comercial detallados

Si necesitas diferentes configuraciones de acceso para diferentes propósitos o departamentos, puedes usar varios tokens de acceso del usuario del sistema de integración comercial detallados por negocio del cliente, con el fin de mejorar la escalabilidad y la seguridad de tus integraciones.

Los tokens de acceso detallados siguen siendo específicos del portfolio comercial del cliente. No se pueden compartir ni es posible acceder a ellos desde diferentes empresas cliente. Su alcance y lista de activos son un subconjunto del token de acceso del usuario del sistema de integración comercial original.

Con el fin de aislar potenciales incidentes relativos a la seguridad, en caso de que haya un token comprometido, solo ese negocio del cliente se verá afectado y no todos los portfolios comerciales de todos los negocios del cliente.

![Image](https://lookaside.fbsbx.com/elementpath/media/?media_id=3497241840528666&version=1759804881&transcode_extension=webp)

### Comparación

| | Business Integration System User access tokens | User access tokens |
|---|---|---|
| Access Designations | Access is **explicitly delegated** at the time of authorization. Your app can only access the assets that were designated by your business client when they completed the Facebook Login for Business flow. Tech Providers only. | Access is **inherited** from your app user's current account access; your app can access the same business assets that the app user currently has access to. |
| Account association | Associated with your business client's business portfolio rather than a specific user. Any admin in your business client's admin group can grant your app a system user access token. | Associated with your app user's personal Facebook account. |
| Expiration and refresh | Defaults to **never expire** for the common offline server-to-server communication. | A **short-lived** token for online activities such as web browsers. |
| OAuth grant type | **Authorization Code** grant only. | **Implicit** grant by default, and can support authorization code grant for improved security. Mainly used for user-agent based clients such as web browsers and mobile apps. |
| Representation | Part of the Tech Provider integration's infrastructure, initialized by a client business through Tech Provider’s app installation. | Represents servers or software making API calls to assets owned or managed by a [Business Manager](https://developers.facebook.com/docs/business-manager-api). |
| Token Invalidation | Your business clients can invalidate business integration system User access tokens by going to **[Business Manager](https://business.facebook.com/) > Settings > Business Settings > Integrations > Connected apps** and removing your app. | Your business clients can invalidate User access tokens by going to Facebook and navigating to **Settings & privacy > Settings > Security and login > Business Integrations** and removing your app. |

## API de administración del token de acceso del usuario del sistema de integración comercial

Cuando un negocio del cliente instala una app mediante el inicio de sesión con Facebook para empresas y genera un token de acceso del usuario del sistema de integración comercial, el token incluye un identificador del negocio del cliente. Este identificador representa el negocio del cliente, que tu app usa para hacer llamadas a la API.

### Obtener el identificador del negocio del cliente

Para obtener el identificador del negocio del cliente a partir del token de acceso del usuario del sistema de integración comercial, envía una solicitud `GET` al punto de conexión `/me` con el parámetro `fields` configurado en `client_business_id` y el parámetro `access_token` al token de acceso del usuario del sistema de integración comercial del usuario de tu app.

```bash
curl -i -X GET \
  "https://graph.facebook.com/<API_VERSION>/me?fields=client_business_id&access_token=<BUSINESS_INTEGRATION_SYSTEM_USER_ACCESS_TOKEN>"
```

Si la operación se procesa correctamente, la app recibirá una respuesta JSON con el identificador del negocio del cliente de ese usuario.

```json
{
  "client_business_id": "<CLIENT_BUSINESS_ID>",
  "id": "<APP_SCOPED_ID>"
}
```

### Obtener tokens

El punto de conexión `/<CLIENT_BUSINESS_ID>/system_user_access_tokens` te permite administrar tus tokens de acceso del usuario del sistema de integración comercial preexistentes. Las acciones incluyen lo siguiente:

- Generación de más tokens de acceso del usuario del sistema de integración comercial detallados a partir de los tokens de acceso del usuario del sistema de integración comercial preexistentes.
- Recuperación de tokens de acceso del usuario del sistema de integración comercial.

#### Parámetros

| Objeto | Descripción |
|---|---|
| `access_token` *Cadena* | **Obligatorio.** El token de acceso requiere el permiso `business_management`. |
| `appsecret_proof` *Cadena* | **Obligatorio.** El [appsecret_proof](https://developers.facebook.com/docs/graph-api/guides/secure-requests/#generate-the-proof) es un hash `sha256` del token de acceso que garantiza que las llamadas a la API se hagan desde un servidor más seguro. |
| `asset` *Número entero* | Opcional. Si quieres generar un token más detallado, puedes configurar una lista de identificadores de `asset`, separada por comas. La lista de recursos tendrá que ser un subconjunto de recursos del token de acceso original. |
| `fetch_only` *Booleano* | Opcional. La marca que debes usar para obtener el token actual e indicar que la operación es de solo lectura. |
| `scope` *Booleano* | Opcional. Cuando quieres generar un token más detallado, puedes configurar una lista de identificadores de `scope`, separada por comas. La lista de recursos tendrá que ser un subconjunto de los alcances del token de acceso original. |
| `set_token_expires_in_60_days` *Booleano* | Opcional. Cuando generes un nuevo token, configúralo en `true` para que el token caduque en 60 días. |
| `system_user_id` *Número entero* | Opcional. El identificador del usuario del sistema que se incluye en el token de acceso. |

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura.*

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/<CLIENT_BUSINESS_ID>/system_user_access_tokens?appsecret_proof=<APPSECRET_PROOF_HASH>&access_token=<ACCESS_TOKEN>&system_user_id=<SYSTEM_USER_ID>&fetch_only=true"
```

Si la operación se realiza correctamente, la app recibirá una respuesta JSON con un nuevo token de acceso que podrás usar en las posteriores llamadas a la API.

```json
{
  "access_token": "<NEW_ACCESS_TOKEN>"
}
```

## Experiencia del proceso de inicio de sesión

| Proceso de inicio de sesión con el token de acceso de usuario | Proceso de inicio de sesión con el token de acceso de usuario de integración comercial |
|---|---|
| ![Video](https://static.xx.fbcdn.net/rsrc.php/v4/y4/r/-PAXP-deijE.gif) | ![Video](https://static.xx.fbcdn.net/rsrc.php/v4/y4/r/-PAXP-deijE.gif) |

## Primeros pasos

A continuación, te mostramos los pasos que debes seguir para configurar el inicio de sesión con Facebook para empresas si todavía no tienes una app.

### Crear una app

1. En el panel de apps de Meta, crea una [**app de tipo de negocios**](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types#business).
2. Agrega el producto **Inicio de sesión con Facebook para empresas**.
3. En el menú de la izquierda, selecciona **Configuraciones**.
4. Puedes usar **+ Crear una configuración** para crear una configuración o **Crear desde una plantilla** para seleccionar una de las configuraciones predeterminadas de Meta. Puedes crear varias configuraciones y mostrarlas a diferentes grupos de usuarios.
5. Ponle un nombre a tu configuración.
6. Elige el tipo de token de acceso que deseas solicitar a tus clientes de negocios, un token de acceso de usuario o un token de acceso de usuario del sistema y la fecha de caducidad del token. Si seleccionas "Token de usuario del sistema", los usuarios de tu app iniciarán sesión con su cuenta personal de Facebook. Si seleccionas "Token de acceso del usuario del sistema", los usuarios de tu app deberán iniciar sesión con un portfolio comercial. Esto se exige únicamente si la configuración necesita acceso continuo a los activos comerciales, como páginas de Facebook, cuentas publicitarias o cuentas de Instagram.
7. Selecciona todos los activos a los que es necesario que acceda tu app.
8. Selecciona los permisos que necesita tu app y haz clic en **Crear**.

Recibirás un **identificador de configuración** que deberás usar en tu código para invocar el cuadro de diálogo de inicio de sesión.

#### Crear una configuración de registro insertado en la Plataforma de WhatsApp Business

Para crear una configuración de registro insertado en WhatsApp, visita nuestra [guía de registro insertado para WhatsApp](https://developers.facebook.com/docs/whatsapp/embedded-signup/).

#### Crear una configuración de la API de conversiones para mensajes comerciales

Para crear una configuración de la API de conversiones para mensajes comerciales, visita nuestra [guía de la API de marketing sobre la API de conversiones para mensajes comerciales](https://developers.facebook.com/docs/marketing-api/conversions-api/business-messaging).

#### Crear una configuración de la API Graph de Instagram

Para crear una configuración de la API Graph de Instagram, visita nuestra [documentación sobre la API Graph de Instagram](https://developers.facebook.com/docs/instagram-api).

### Invocar el cuadro de diálogo de inicio de sesión

Invoca un cuadro de diálogo de inicio de sesión usando uno de nuestros SDK (recomendado) o crea manualmente tu proceso de inicio de sesión.

#### Invocación con nuestros SDK

Puedes usar cualquiera de nuestros SDK para invocar el cuadro de diálogo si reemplazas la lista de alcances (permisos) que requiere tu app con tu identificador de configuración y el tipo de permiso de OAuth necesario del token de acceso.

Si no tienes experiencia con nuestros SDK, te recomendamos que primero instales el SDK para JavaScript y que, antes de continuar, lo hagas funcionar con el producto de inicio de sesión con Facebook para consumidores, como se muestra en los siguientes ejemplos que hacen referencia al SDK.

##### Configuración del token de acceso del usuario del sistema de integración comercial

Aquí te mostramos un ejemplo del método `FB.login()` del SDK para JavaScript, que se modificó para configurar un token de acceso del usuario del sistema. Ten en cuenta que `config_id` reemplazó a `scope` (que no se debe usar), se configuró el `response_type` en `code`, dado que los SUAT requieren el tipo de permiso del código de autorización, y el `override_default_response_type` se debe configurar en `true`. Si es verdadero, cualquier tipo de respuesta que se pase en el `response_type` tendrá prioridad sobre los tipos predeterminados.

```javascript
FB.login(function(response) {
    console.log(response);
}, {
    config_id: '<CONFIG_ID>',
    response_type: 'code',
    override_default_response_type: true
});
```

Cuando el usuario complete el proceso del cuadro de diálogo de inicio de sesión, lo redirigiremos automáticamente a tu URL de redireccionamiento e incluiremos un código. Luego, deberás intercambiar este código por un token de acceso, para lo que es necesario realizar una llamada de servidor a servidor a nuestros servidores.

```http
GET https://graph.facebook.com/v24.0/oauth/access_token?
  client_id=<APP_ID>
  &client_secret=<APP_SECRET>
  &code=<CODE>
```

Consulta [Intercambiar código por un token de acceso](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#exchangecode) para obtener más información sobre este paso.

##### Configuración de tokens de acceso del usuario

Aquí te mostramos un ejemplo del método `FB.login()` del SDK para JavaScript, que se modificó para configurar el token de acceso de usuario. Ten en cuenta que `config_id` reemplazó a `scope` (aunque se puede seguir usando `scope`, te recomendamos no hacerlo).

```javascript
FB.login(function(response) {
    console.log(response);
}, {
    config_id: '<CONFIG_ID>' // configuration ID goes here
});
```

Aquí te mostramos un ejemplo del botón de **inicio de sesión** del SDK para JavaScript, que se modificó para configurar el token de acceso de usuario:

```html
<fb:login-button config_id="<CONFIG_ID>" onlogin="checkLoginState();"></fb:login-button>
```

#### Creación manual de un proceso de inicio de sesión

Consulta [Crear un proceso de inicio de sesión de forma manual](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow) para obtener información sobre cómo invocar el cuadro de diálogo de inicio de sesión de manera manual. Al [invocar el cuadro de diálogo de inicio de sesión y configurar la URL de redireccionamiento](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#logindialog), incluye el identificador de tu configuración como parámetro opcional (aunque aún se puede incluir el alcance, te recomendamos no hacerlo).

```javascript
config_id=<CONFIG_ID>
```

## Cambiar al inicio de sesión con Facebook para empresas

Te recomendamos realizar [pruebas](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/#getting-started) e informarte sobre los problemas que puedan surgir antes de cambiar al inicio de sesión con Facebook para empresas.

El inicio de sesión con Facebook para empresas está disponible en las [**apps de tipo de negocios**](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types#business).

Si tu app cumple los requisitos para cambiar al inicio de sesión con Facebook para empresas, deberías poder ver un banner de opción al seguir los pasos que se indican a continuación:

1. Selecciona tu app en el panel de apps.
2. Ve al producto Inicio de sesión con Facebook o agrégalo.
3. Haz clic en **Configuración** o **Inicio rápido**, en el menú del lado izquierdo.
4. Haz clic en el botón "Primeros pasos para el inicio de sesión con Facebook para empresas" en la parte superior de la página.

Ten en cuenta que tus tokens de acceso actuales no se verán afectados al cambiar al inicio de sesión con Facebook para empresas. Además, toda app de prueba vinculada a esta app también cambiará al inicio de sesión con Facebook para empresas.

Después de realizar el cambio, tu app se encontrará dentro del **tipo "Negocios"**. Si tu app no funciona como estaba previsto, podrá volver al inicio de sesión con Facebook dentro de los **30 días** posteriores al cambio.

## Solución de problemas

Es posible que los clientes comerciales vean mensajes de error por los siguientes motivos:

- El identificador de configuración no es válido.
- El token de acceso del usuario del sistema del administrador comercial no es compatible actualmente con los dispositivos móviles.
- El token de acceso del usuario del sistema del administrador comercial está configurado con el "response_type" incorrecto.

### Posibles cambios radicales:

- Si actualmente el tipo de tu app es **Ninguno**, cuando cambies al inicio de sesión con Facebook para empresas, se cambiará el tipo a **Negocios** y la app solo conservará el acceso a los [permisos](#supported-permissions), [funciones](#available-features) y [productos](#available-products) que se enumeran arriba.
- Si solicitas permisos o funciones de clientes comerciales no compatibles con el inicio de sesión con Facebook para empresas, dichos permisos o funciones serán **revocados de inmediato** una vez que cambies la app al inicio de sesión con Facebook para empresas.
- Si solicitas únicamente `email` o `public_profile` a tus clientes comerciales, cambiar la app al inicio de sesión con Facebook para empresas provocará que caduque la validez de todos los tokens instalados previamente para estos clientes.
- Si tu app tiene el inicio de sesión con Facebook para empresas y la extensión de Meta para empresas, la experiencia de la extensión de Meta para empresas estará limitada a los permisos que sean compatibles con el inicio de sesión con Facebook para empresas.
- Es posible que el acceso al perfil del usuario del activo comercial afecte la forma en que se accede a los datos del perfil del usuario y se administran a través de nuestras API.
- Ten en cuenta lo siguiente: Si el cuadro de diálogo de inicio de sesión del inicio de sesión con Facebook para empresas se invoca desde el identificador de configuración y tú decides volver al inicio de sesión con Facebook, es posible que el cuadro de diálogo de inicio de sesión no se pueda cargar, ya que el inicio de sesión con Facebook no admite el parámetro `config_id`. En ese caso, reemplaza el parámetro `config_id` por el parámetro `scope`.

Obtén más información sobre la [extensión de Meta para empresas](https://developers.facebook.com/docs/facebook-business-extension/fbe/get-started/business-login).

## Volver al inicio de sesión con Facebook

Esta función solo está disponible si una app preexistente cambió al inicio de sesión con Facebook para empresas. Las apps de tipo de negocios que se crearon recientemente no pueden volver al inicio de sesión con Facebook.

Después de volver al inicio de sesión con Facebook para empresas, si tu app no funciona según lo esperado, puedes volver al inicio de sesión con Facebook. Para ello, ve al **panel de apps** > **Inicio de sesión con Facebook para empresas** > **Configuración** y haz clic en el enlace **Cambiar al inicio de sesión con Facebook**. Se te mostrará una encuesta, que nos ayudará a mejorar la experiencia a la hora de configurar el inicio de sesión con Facebook para empresas. Las apps pueden volver al inicio de sesión con Facebook dentro de los **30 días** posteriores al cambio.

## Preguntas frecuentes

### Facebook Login for Business isn’t available for my app - what should I do?

The easiest way to add Facebook Login for Business is to create a new Business Type app, where Facebook Login for Business is automatically available, and request supported business permissions through Meta App Review. If you want to use it for an existing None type app, your app must have advanced access to at least one supported business permission.

### What should I use for authentication if my app is not intended for businesses or if I am not a Tech Provider building an app for other businesses to use?

If you are not a Tech Provider building solutions using Meta’s business APIs, Facebook Login is recommended for consumer authentication.

### What permissions do I need to request when implementing Facebook Login for Business?

Only request the minimum permissions necessary for your app's functionality. Be transparent with users about why you need each permissions and features. Note that the `email` and `public_profile` permissions must be requested with at least one other supported [business permission](#supported-permissions).

### Is advanced access to the public_profile permission required before a Facebook Login for Business app goes live?

Yes, advanced access to the `public_profile` permission is required for Facebook Login for Business apps before they go live. This requirement is crucial to ensure that the app can support authorization from users who do not have an app role, commonly referred to as external users.
```



## Page: https://developers.facebook.com/docs/facebook-login/best-practices

```markdown
# Prácticas recomendadas del inicio de sesión con Facebook

El inicio de sesión con Facebook mejora la experiencia del usuario en la app, ya que permite a los clientes iniciar sesión fácilmente en ella sin crear un nombre de usuario ni una contraseña. Además, maximiza la cantidad de personas que la utilizan.

Si hay más personas que usan tu app, verás una mejora del rendimiento con nuestras otras herramientas comerciales diseñadas para proporcionar estadísticas de tu público. Cuantos más clientes utilicen el inicio de sesión con Facebook, estas herramientas serán más eficaces para ayudarte a conocer mejor y desarrollar tu negocio. Te sugerimos usar las siguientes prácticas recomendadas para maximizar la cantidad de visitantes que se registran mediante el inicio de sesión con Facebook. Una primera experiencia de alta calidad puede traducirse en tasas de conversión superiores al 80%.

## Video

<div class="_1c_u" id="u_0_3_bU">
<video class="_ox1 _21y0" data-video-height="337" data-video-width="600" height="337" id="u_0_5_Lu" preload="none" style="width: 600px;"></video>
</div>

## Listas de comprobación

**Prácticas recomendadas para la experiencia del usuario**
1. [Ofrece las oportunidades de creación de cuenta e inicio de sesión con Facebook de forma inmediata.](#accountcreation)
2. [Usa un botón rectangular grande con un estilo coherente con el resto de tu app.](#button)
3. [Mantén visible la opción de inicio de sesión con Facebook durante los procesos alternativos de creación de cuenta.](#visible)
4. [Ofrece a los clientes una bonificación por iniciar sesión.](#bonus)
5. [Minimiza las opciones ofrecidas.](#minimizechoices)
6. [Ayuda a las personas a evitar las cuentas duplicadas de varios canales.](#duplicate)
7. [Evita la visualización web en la app.](#webviews)
8. [Proporciona un modo de cerrar sesión.](#logout)

**Prácticas recomendadas sobre el uso de datos**
1. [Pide solo los permisos que necesitas.](#onlyask)
2. [Pide los permisos en contexto y explica el motivo.](#context)
3. [Comprende el registro automático de eventos de la app y cambia la configuración según sea necesario.](#checktokenvalidity)
4. [Si el acceso a datos de un usuario caducó, colócalo en el flujo de reautorización.](#reauthflow)

**Prácticas técnicas**
1. [Prueba y mide.](#testing)
2. [Respeta la Política para desarrolladores de Facebook.](#policies)
3. [Implementa una devolución de llamada para eliminación de datos.](#datadeletion)
4. [Envía tu app a la revisión de apps.](#loginreview)

**Otras prácticas recomendadas**
1. [Solicita a las personas que inicien sesión nuevamente en tu app o sitio web.](#promptrelogin)
2. [Comprueba que un token de acceso del usuario siga siendo válido.](#checktoken)
3. [Comprueba si hay permisos revocados.](#revokedpermissions)
4. [Brinda el control de los datos a las personas.](#datacontrol)

## Prácticas recomendadas para la experiencia del usuario

### 1. Ofrece las oportunidades de creación de cuenta e inicio de sesión de forma inmediata

La mayoría de los usuarios que inician sesión con Facebook en las apps lo hacen durante los primeros cinco minutos que utilizan la app y más del 90% lo hace durante el primer día. Promociona el inicio de sesión lo antes posible durante la primera experiencia de uso y ofrece incentivos en los que se describa el valor comercial que puedes proporcionarles a los usuarios si sabes quiénes son. Cuando ofreces el inicio de sesión con Facebook de inmediato en la pantalla de bienvenida, permites a los visitantes interesados comenzar a usar la app rápidamente.

Si, según tus análisis, los usuarios llegan listos para realizar una tarea inmediatamente, usa un banner para recordarles que creen una cuenta u ofréceles la creación de una cuenta para acelerar un proceso de pago.

### 2. Diseño: usa un botón rectangular grande

Usa botones rectangulares grandes para el inicio de sesión con Facebook junto a otras opciones para iniciar sesión. El inicio de sesión con Facebook tendrá un mejor rendimiento si se muestra antes que otras opciones. Además, es recomendable que los botones sean coherentes con el resto del diseño de la app, ya que los botones que tienen un aspecto muy diferente (por ejemplo, pequeños y redondos) no tienen el mismo rendimiento.

El botón "Iniciar sesión con Facebook" que se incluye con nuestros [SDK](https://developers.facebook.com/docs#apis-and-sdks) es fácil de integrar e incluye información que garantiza un diseño y una experiencia coherentes. No obstante, si decides crear un botón propio, sigue las [Políticas de inicio de sesión para desarrolladores](https://developers.facebook.com/devpolicy#login) y las recomendaciones del [diseño de la experiencia de usuario](https://developers.facebook.com/docs/facebook-login/userexperience) para obtener los mejores resultados.

![Botón de inicio de sesión con Facebook](https://lookaside.fbsbx.com/elementpath/media/?media_id=342511876627461&version=1740403869)

### 3. Mantén visible la opción de inicio de sesión con Facebook durante los procesos alternativos de creación de cuenta

Es posible que los clientes comiencen otro proceso de creación de cuenta y luego decidan que no desean realizarlo si se les solicita que creen una nueva contraseña, que suban una foto de perfil o que ingresen manualmente otros datos que podrían proporcionar mediante el inicio de sesión con Facebook. Mantén visible la opción de inicio de sesión con Facebook en estas pantallas para atraer a los visitantes que, de otro modo, quizá abandonarían la creación de la cuenta en este momento.

![Opción de inicio de sesión visible](https://lookaside.fbsbx.com/elementpath/media/?media_id=511893132891784&version=1740403869)

### 4. Ofrece a los clientes una bonificación por iniciar sesión

Ofrece a los clientes una bonificación por usar el inicio de sesión con Facebook y deja claro que la oferta se aplica también al registro con correo electrónico y contraseña. También puedes ofrecer beneficios adicionales por usar específicamente el inicio de sesión con Facebook.

![Bonificación por iniciar sesión](https://lookaside.fbsbx.com/elementpath/media/?media_id=1237779826383892&version=1740403869)

### 5. Minimiza las opciones ofrecidas

Si la app tiene demasiadas opciones de inicio de sesión, el uso del inicio de sesión con Facebook disminuirá. Si tu app admite varias opciones de inicio de sesión, usa señales, como el idioma y el código de país, para ocultar opciones específicas de ciertas regiones o bajar su prioridad.

![Minimiza opciones](https://lookaside.fbsbx.com/elementpath/media/?media_id=493796628078269&version=1740403869)

### 6. Ayuda a las personas a evitar las cuentas duplicadas de varios canales

A veces, los usuarios olvidan el método que usaron para registrarse en tu servicio. Si un usuario intenta registrarse o iniciar sesión con su dirección de correo electrónico, pero había usado el inicio de sesión con Facebook en el pasado, recuérdaselo y dale la oportunidad de continuar con la cuenta que ya tiene. Solicita el mismo conjunto de permisos de referencia en todas las plataformas. De lo contrario, los usuarios que regresen podrían pensar que otorgar un permiso nuevo significa que están creando una conexión nueva con Facebook, en lugar de poder iniciar sesión fácilmente con los permisos que ya tienen.

![Evitar cuentas duplicadas](https://lookaside.fbsbx.com/elementpath/media/?media_id=913040079068286&version=1740403869)

### 7. Evita la visualización web en la app

En las versiones modernas de iOS y Android, las visualizaciones web en la app no pueden compartir cookies con el navegador del sistema. Como Facebook interpreta que el navegador es nuevo cada vez, los usuarios ven una pantalla "Iniciar sesión en Facebook" con un banner en el que se les pide que acepten las cookies y un cuadro para ingresar su nombre de usuario y su contraseña.

En Android, usa la app nativa de Facebook para que los usuarios inicien sesión (si está instalada) o, en su lugar, una pestaña personalizada de Chrome. Esto garantiza que las personas que usaron Facebook en sus dispositivos en el pasado solo deban hacer clic para aprobar tu app. Nuestros SDK más recientes para iOS siempre prefieren las visualizaciones web `ASWebAuthenticationSession` o `SFAuthenticationSession` que puedan acceder a las cookies del sistema.

En general, usar los SDK de Facebook más recientes permite lograr automáticamente el mejor comportamiento. Si tienes un proceso de inicio de sesión personalizado o usas una plataforma de integrador que ofrece el inicio de sesión con Facebook como uno de varios métodos, asegúrate de que tu app cuente con una experiencia de inicio de sesión con Facebook en pantalla completa y de que veas el mensaje de sistema "usar Facebook.com para iniciar sesión" en iOS. Si ves banners de aceptación de cookies o experiencias que no sean de pantalla completa, ponte en contacto con tu integrador y pídele que use los métodos correspondientes a cada plataforma para que los usuarios tengan la mejor experiencia.

![Visualización web en la app](https://lookaside.fbsbx.com/elementpath/media/?media_id=533805277361896&version=1740403869)

### 8. Proporciona un modo de cerrar sesión

Una vez que las personas iniciaron sesión, también debes proporcionarles un modo de cerrar sesión y de desconectar su cuenta o incluso eliminarla. Además de ser una cuestión de cortesía, se trata de un requisito de nuestras [Políticas de inicio de sesión para desarrolladores](https://developers.facebook.com/devpolicy#login).

Por ejemplo, Tinder, la app de citas, te da la opción de cerrar sesión o de eliminar tu cuenta por completo.

![Cerrar sesión](https://lookaside.fbsbx.com/elementpath/media/?media_id=365695430779976&version=1740403869)

## Prácticas recomendadas sobre el uso de datos

### 1. Pide solo los permisos que necesitas

Pide solo los [permisos](https://developers.facebook.com/docs/facebook-login/permissions/overview) que necesitas. Cuantos menos permisos pidas, más cómodas se sentirán las personas al concederlos. Sabemos que pedir menos permisos da como resultado un mayor porcentaje de conversión.

Puedes pedir permisos adicionales más adelante, cuando las personas hayan podido probar la app.

Otra ventaja de hacerlo así es que es posible que no necesites enviar tu app a [revisión de apps](https://developers.facebook.com/docs/facebook-login/review). Debes enviar tu app a revisión de apps si solicitas permisos que no sean el correo electrónico o los campos predeterminados.

### 2. Pide los permisos en contexto y explica el motivo

Activa las solicitudes de permisos cuando las personas intenten realizar una acción en la app que requiera ese permiso específico.

Por ejemplo, la app de Facebook solamente solicita los servicios de ubicación cuando alguien toca explícitamente el botón de ubicación al actualizar su estado.

Además, es más probable que alguien conceda un permiso cuando entiende claramente por qué la app necesita la información para ofrecer una mejor experiencia.

### 3. Si no utilizas los SDK de Facebook, verifica regularmente que el token de acceso sea válido.

Si bien los tokens de acceso tienen una caducidad programada, es posible hacer que caduquen de manera anticipada por motivos relacionados con la seguridad. Si no utilizas los SDK de Facebook en tu app, es muy importante que implementes manualmente controles frecuentes (como mínimo, diarios) de la validez del token para asegurarte de que tu app no esté utilizando un token que haya caducado por motivos relacionados con la seguridad.

### 4. Si el acceso a datos de un usuario caducó, colócalo en el flujo de reautorización

## Prácticas técnicas

### 1. Prueba y mide

Es muy importante probar el proceso de inicio de sesión con Facebook en distintas condiciones. Para ello, creamos un [sólido plan de prueba](https://developers.facebook.com/docs/facebook-login/testing-your-login-flow/) que puedes seguir. También es buena idea realizar pruebas de uso cualitativas para comprender cómo reaccionan las personas ante lo que ven.

Te sugerimos que, una vez que hayas probado el proceso de inicio de sesión con Facebook y estés listo para el lanzamiento, uses un programa de análisis para comprobar si las personas completan el proceso y cuál es el porcentaje de conversiones total. Las apps que cumplen con las prácticas recomendadas tienen tasas de conversión superiores al 80%.

### 2. Respeta la Política para desarrolladores de Facebook

A fin de evitar problemas potenciales más adelante, realiza una comprobación rápida para asegurarte de que la integración del inicio de sesión con Facebook cumpla con lo establecido en las [políticas de inicio de sesión para desarrolladores](https://developers.facebook.com/devpolicy#login).

### 3. Implementa una devolución de llamada para eliminación de datos

A fin de que las personas tengan control de sus datos, implementa una [devolución de llamada para eliminación de datos](https://developers.facebook.com/docs/apps/delete-data) para responder en caso de que las personas soliciten que se eliminen los datos de Facebook que tus apps tienen sobre ellas.

### 4. Envía tu app a la revisión de apps

Solo tienes que solicitar esta revisión si pides otros permisos además de los campos predeterminados y de `email`. Recomendamos solicitar la revisión lo antes posible durante la fase de desarrollo, después de integrar el inicio de sesión con Facebook. Recibirás comentarios claros durante el proceso de revisión de apps, incluidos comentarios pertinentes sobre cambios que podrías realizar para lograr la aprobación de un permiso rechazado (si corresponde). Las apps existentes no se ven afectadas por la revisión del inicio de sesión.

Puedes obtener más información sobre la revisión de apps en [Revisión de apps para el inicio de sesión con Facebook](https://developers.facebook.com/docs/apps/review/login).

## Otras prácticas recomendadas

Estamos [implementando una función](https://l.facebook.com/l.php?u=http%3A%2F%2Fnewsroom.fb.com%2Fnews%2F2019%2F08%2Foff-facebook-activity%2F&h=AT06MyRX_AONDLiQBlQOfrPhh9E24Tt4aLXn7xwak2Uu668GRBuy9oDSRCqzNBoTXeEFxmLMFKtlHgeQ1ipinDi3iiLgDuZPOV0JMJctbIZ5agi1KFuf2jmPnj6h6y4gfOfbWKCuXvIcghP0zzmq2_B2mFg) que brinde a las personas más transparencia y control en relación con los datos que otras apps y sitios web comparten con nosotros. A medida que la implementemos, es posible que el [inicio de sesión con Facebook](https://developers.facebook.com/blog/post/2019/08/20/developer-best-practices-facebook-login/) se vea afectado.

Para ayudar a los desarrolladores a estar preparados para el lanzamiento de esta función, le ofrecemos a nuestra comunidad de desarrolladores estas prácticas recomendadas y pautas adicionales.

### 1. Solicita a las personas que inicien sesión nuevamente en tu app o sitio web

Cuando alguien ejerza el control mediante la función y quiera volver a iniciar sesión en la app o el sitio web, se le debe pedir que lo haga cuando abra la app o el sitio web. Si decide volver a iniciar sesión con Facebook, deberá volver a autorizar los permisos correspondientes de la app o el sitio web.

### 2. Comprueba que un token de acceso del usuario siga siendo válido

Además, cuando una persona que haya iniciado sesión con Facebook esté usando activamente una app o un sitio web, los desarrolladores deberían realizar una llamada a la API o verificar los permisos para comprobar si el token de acceso del usuario sigue siendo válido. Asegúrate de que la sesión de un usuario se cierre si su token de acceso deja de ser válido.

### 3. Comprueba si hay permisos revocados

Después de iniciar sesión, las personas pueden revocar, en cualquier momento, los permisos concedidos a tu app desde la interfaz de Facebook. Es importante [comprobar qué permisos conceden los usuarios activos a las apps y los sitios web](https://developers.facebook.com/docs/facebook-login/permissions/requesting-and-revoking/#checking).

### 4. Brinda el control de los datos a las personas

Para que las personas tengan control de sus datos, deberías [implementar una devolución de llamada para eliminación de datos](https://developers.facebook.com/docs/apps/delete-data) a fin de responder en caso de que las personas soliciten que se eliminen los datos de Facebook que una app o un sitio web tiene sobre ellas.
```



## Page: https://developers.facebook.com/docs/facebook-login/for-devices

```markdown
# Inicio de sesión con Facebook para dispositivos

Si buscas ayuda en relación con tu **portal** de Facebook, visita el [servicio de ayuda del portal](https://portal.facebook.com/help/).

Para ingresar el **código** de Facebook para dispositivos e iniciar sesión en tu televisor inteligente, cámara, impresora y otros dispositivos, visita la página [Facebook para dispositivos](https://www.facebook.com/device).

Implementa el inicio de sesión con Facebook para dispositivos y permite que las personas inicien sesión en tu app o servicio con su cuenta de Facebook. Esta característica permite a las personas iniciar sesión en dispositivos con funcionalidades limitadas de entrada o visualización, como televisores inteligentes, marcos de fotos digitales o dispositivos de Internet de las cosas.

Con el inicio de sesión para dispositivos, tu dispositivo muestra un código alfanumérico y le indica a la gente que lo ingrese en una página web en su computadora de escritorio o smartphone. Las personas que usan tu app o servicio pueden otorgar permisos. Después de que la app obtiene los permisos, el dispositivo recibe un token de acceso que tu app utiliza para hacer solicitudes de API Graph a fin de identificar a la persona y obtener información para personalizar su experiencia con el dispositivo.

Si desarrollas una app de televisor para Apple TV, Android TV o Fire TV, debes usar el [SDK de Facebook para tvOS](/docs/tvos) o el [SDK de Facebook para Android](/docs/android/devices).

En esta guía, se describe la integración manual del inicio de sesión para dispositivos sin usar los SDK anteriores.

- [Experiencia del usuario](#design)
- [Implementar el inicio de sesión para dispositivos](#tech)
- [Solución de problemas](#troubleshooting)

## Experiencia del usuario

Estas normas describen cómo diseñar una experiencia de inicio de sesión clara, segura y constante en dispositivos y servicios.

### 1. Llamada a la acción

Primero, piensa en qué fase de la experiencia del usuario deseas solicitar a las personas que inicien sesión o se conecten con Facebook. En algunos dispositivos, lo harán de inmediato, mientras que, en otros, podrían hacerlo en un paso posterior de la experiencia.

![Llamada a la acción](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2178-6/11414367_1594307454183711_70142918_n.png?_nc_cat=108&ccb=1-7&_nc_sid=34156e&_nc_ohc=8IBqhteJ6_kQ7kNvwEd150M&_nc_oc=AdkbzBtMx_7UC7NNs7sa4ayhmyuuupNJ9eK9Q4o8vae0Wsde5EX21PchF7m4SnCzJ80&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_AfjEFxFr7ZAVLNzIZejb45WSJy3ek5BHE85kVUuz-Ak79w&oe=691AAB56)

Para garantizar la experiencia de usuario más útil, constante y confiable, diseña un botón lo más parecido posible al botón oficial "Iniciar sesión" de Facebook.

![Botón de inicio de sesión](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/11405239_920140564714397_256329502_n.png?_nc_cat=106&ccb=1-7&_nc_sid=34156e&_nc_ohc=cr6I53WmnUoQ7kNvwGhHVaC&_nc_oc=Adm0DTyS5sdBgmi-oNXcA5IXqZKEPCfnU0LDa9f6M235MtXKgz9RigHrLB4f40Y2fw8&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_AfhQehJdU6DbG-AZtRLPFh1ONEoah30AGhKz2sNev5ByWA&oe=691A91A4)

Desde la perspectiva del diseño visual, esto significa que deberías hacer lo siguiente:

1. Etiquetar el botón con "Iniciar sesión con Facebook" o "Conectar con Facebook".
2. Utilizar el blanco y el azul oficial de la marca de Facebook: `#1877F2`.
3. Si el dispositivo permite la visualización gráfica, también puedes incorporar el logotipo "f" oficial. Según las [normas de marca de Facebook](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.facebookbrand.com%2F&h=AT3GizgwSmB0X1qmxIKZ7YPIlk-9qBcaD1gWZZbpy0AJBhr7cbP8tJBGC3KLJN_0ZQv7rsTMa0Lx9lmMVCSdmTYKKS5PR98tdbdVi_Uz19wJyOpeLQU5iMSrdh_dHbljO1fXY8xFrG1kR2PhGRCVBXyOVlU), el logotipo siempre debe ser de color blanco o azul de Facebook (`#1877F2`).
4. Cuando proceda, describe el beneficio de iniciar sesión. Por ejemplo, "descubre lo que tus amigos están viendo" o "mira fotos de tus álbumes de Facebook".

### 2. Presentar el código

Cuando alguien hace clic en la llamada a la acción, el dispositivo realiza una llamada a la API de Facebook que devuelve un código.

En tu interfaz, usa el siguiente mensaje para indicarles a las personas que necesitan visitar un sitio web e ingresar el código: "A continuación, ve a facebook.com/device (http://facebook.com/device) desde tu computadora o smartphone e ingresa este código". Muestra el código completo que recibiste de la API de inicio de sesión para dispositivos de Facebook. El código tiene entre 6 y 12 caracteres de longitud.

![Código](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/11409221_1625633794342850_743079200_n.png?_nc_cat=105&ccb=1-7&_nc_sid=34156e&_nc_ohc=Wj_SFOHBP7sQ7kNvwE-Go9U&_nc_oc=AdlTzLvApOgQb80bpsj4udF8GxaYoHfeXjfEFQ053stV2WC2P-Gb-UreomcHlla5xHo&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_Afh-xCf22nuruT798sjIDW1WKDV3rs21NVNSAQ9cwc1XRg&oe=691AB98A)

Puedes incluir un botón `Close` o `Cancel` para que las personas puedan cancelar el proceso de inicio de sesión para dispositivos. Esto debería devolverlos a la pantalla de inicio de sesión inicial.

Cuando el código se muestra en pantalla, el dispositivo consulta la API de inicio de sesión para dispositivos a fin de comprobar si alguien autorizó la app. Después de unos minutos, si no ingresaron su código, la API de inicio de sesión para dispositivos genera un error `code_expired`. Cuando tu dispositivo recibe este error, debes cancelar el flujo de inicio de sesión y la interfaz debe mostrar la llamada a la acción.

Como alternativa, se pueden generar códigos QR con el código de usuario incrustado en la URL. Para hacerlo, se debe agregar el parámetro `user_code` a la URL:

```
https://www.facebook.com/device?user_code=<USER_CODE>
```

### 3. Autorización

Este es el proceso que las personas ven cuando visitan la página [facebook.com/device](https://www.facebook.com/device) con el navegador de su computadora o smartphone. Primero aparece un campo de texto donde pueden ingresar el código:

![Autorización](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/12726952_1719580581631916_54510551_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=P3bYhSCGiqsQ7kNvwEokgLG&_nc_oc=AdkbSv8TJISA_WpjTjSHTEPaMHdoLehlFzmChupTOXdhLEc7eq6TiXsFEel33YLIzNo&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_Afgw5YziG4DKinPbSRny7ZP6Au6ha_YVYBFaeDLMU91YnQ&oe=692F2770)

Luego de ingresar el código y hacer clic en `Continue`, podrán elegir los permisos que quieren conceder:

![Permisos](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/12532984_2005190589707063_502375531_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e280be&_nc_ohc=xuqy-E5dEPcQ7kNvwHyxbh_&_nc_oc=AdmnNniyyb-qDeDcshA5qcw2YKvbgfFCiQrl2vcBxzYSDhT1rrq7TZR7k_KDUUb0Ppo&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_AfiMR2z5Cs-Ah0eYaUtqN1SOdi1LologmIHkSTf4agxohw&oe=692F0A64)

De este modo, las personas sabrán que el proceso de inicio de sesión se realizó correctamente y verán un mensaje de confirmación:

![Confirmación](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/12481745_1039669936108081_632995601_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=C4rbTPQbWPkQ7kNvwEJchJL&_nc_oc=AdnceD6vbi-3eH7M1zd4BwvJlBRJJ1QmdcYhkGH8TPhnkWL6D0fQMs6rWMJtciY6PRw&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_AfhWzRp8uJ8w36Miiv2mf6w6yPj5DbBLjfLug6RXESJhWg&oe=692F0667)

### 4. Confirmar el inicio de sesión correcto

En la interfaz de tu dispositivo, también se debería mostrar un mensaje de confirmación. Idealmente, el mensaje debería incluir el nombre de la persona y, si es posible, su foto de perfil de Facebook.

Muestra esta confirmación en tu dispositivo hasta que la persona haga clic en un botón `Continue`. Alguien puede tener que ingresar el código en una computadora en otra ubicación, por lo que puede que necesite tiempo para volver a su dispositivo y ver la confirmación antes de continuar.

Después de que la persona haga clic en `Continue`, tu dispositivo puede mostrar una gran experiencia personalizada.

![Experiencia personalizada](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/11405161_1645627722318032_971990148_n.png?_nc_cat=105&ccb=1-7&_nc_sid=34156e&_nc_ohc=C4Sj2pHxnWAQ7kNvwEd23vi&_nc_oc=Adnq_V196pPpJzKDtQdExYdCm6UkRn5pa1UZy1eWJxtwSMff0dNoAgTwqcjhcVZV0_0&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_AfiXO7iPPEBx1KcZe1eoUk8yGh4gbtvz2C3w0oMN4I3vpA&oe=691A8FAC)

### 5. Cerrar sesión o desconectar

Las personas deberían poder cerrar sesión en tu dispositivo y este no debería almacenar su conexión con Facebook. Para ello, proporciona una opción `Log out from Facebook` o `Disconnect from Facebook` en el menú de tu dispositivo.

Cuando alguien selecciona esta opción, tu dispositivo debe borrar el token de acceso almacenado de su memoria. Si almacenas el token de acceso en una base de datos o almacenamiento en la nube, también deberías eliminarlo allí. No es necesario hacer una llamada a la API para invalidar el token de acceso.

Cuando una persona cierre sesión, tu dispositivo debe mostrar la llamada a la acción inicial del [paso 1](#design-step1).

## Implementar el inicio de sesión para dispositivos

El inicio de sesión con Facebook para dispositivos es para dispositivos desde los que se pueden realizar llamadas HTTP a través de internet. A continuación encontrarás una lista con las llamadas a la API que el dispositivo puede realizar y las respuestas correspondientes.

### 1. Activar el inicio de sesión para dispositivos

Carga el [panel de tu app](https://developers.facebook.com/apps/) y cambia Producto > Inicio de sesión en Facebook > Configuración > Inicio de sesión desde dispositivos a "Sí".

![Activar inicio de sesión](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2178-6/11409208_816880041714793_1415717646_n.png?_nc_cat=111&ccb=1-7&_nc_sid=34156e&_nc_ohc=wrf6BUN0uzcQ7kNvwE3NQ12&_nc_oc=AdkTJ7tLDZSNuqJhg5j_iqv1Rt_RC0GnZj2976oSkX52FChQHZyqg9cqziSj7kKusME&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=-oZTo1webXE4eCFo-EiIyw&oh=00_AfjexYsR4SinEbxHUmKyCvPNHIl_PFrmTZVhkNurraXrCA&oe=691A96E4)

### 2. Generar un código

Cuando la persona hace clic en la llamada a la acción `Connect to Facebook` o `Log in with Facebook`, tu dispositivo debe realizar una acción HTTP POST en:

```
POST https://graph.facebook.com/<API_VERSION>/device/login access_token=<YOUR_APP_ID|CLIENT_TOKEN> scope=<COMMA_SEPARATED_PERMISSION_NAMES> // Por ejemplo, public_profile,user_likes redirect_uri=<VALID_OAUTH_REDIRECT_URL>
```

El parámetro `scope` es opcional y debe contener una lista separada por comas de [permisos de inicio de sesión](/docs/facebook-login/permissions) que están aprobados para su uso en [revisión del inicio de sesión](/docs/facebook-login/review).

El parámetro `CLIENT_TOKEN` se encuentra en Configuración > Avanzada y se debe combinar con el identificador de la app (separado por una barra vertical, `|`) para formar el `access_token` completo.

`redirect_uri` es un parámetro opcional. Cuando proporcionas una URL, la persona es redirigida a la URL después de completar el inicio de sesión correctamente. Esto le permite a la persona iniciar sesión en el sitio web de tu app para acceder a más opciones de administración de la cuenta. Esta URL debe ser una URL de redirección OAuth válida de acuerdo con la configuración en Configuración de la app -> Avanzado. La respuesta tiene esta forma:

```
{
  "code": "92a2b2e351f2b0b3503b2de251132f47",
  "user_code": "A1NWZ9",
  "verification_uri": "https://www.facebook.com/device",
  "expires_in": 420,
  "interval": 5
}
```

Esta respuesta significa lo siguiente:

1. Muestra la cadena **A1NWZ9** en tu dispositivo.
2. Indica a la persona que vaya a "facebook.com/device" e ingrese el código.
3. El código caduca en 420 segundos. Debes cancelar el flujo de inicio de sesión después de ese tiempo si no recibes un token de acceso.
4. El dispositivo debe consultar la API de inicio de sesión para dispositivos cada 5 segundos para comprobar si la autorización se realizó correctamente.

### 3. Presentar el código

El dispositivo debe mostrar el `user_code` e indicar a la persona que debe visitar la `verification_uri`, por ejemplo, facebook.com/device, con su computadora o smartphone. Consulta [Experiencia del usuario](#design).

### 4. Realizar una consulta de autorización

El dispositivo debe consultar la API de inicio de sesión para dispositivos a fin de comprobar si la persona autorizó correctamente tu app. Esto se debe hacer con el valor de `interval` indicado en la respuesta a tu llamada del [paso 2](#tech-step2), que es cada cinco segundos. Tu dispositivo debería hacer una consulta a:

```
POST https://graph.facebook.com/<API_VERSION>/device/login_status access_token=<YOUR_APP_ID|CLIENT_TOKEN> code=<LONG_CODE_FROM_STEP_1> // Por ejemplo, "92a2b2e351f2b0b3503b2de251132f47"
```

La respuesta a esta llamada de API depende del paso del flujo de autorización en el que se encuentre el usuario. Recibirás un token de acceso o un objeto de error con un subcódigo específico para analizar:

| Subcódigo de error | Ejemplo de respuesta | Significado |
|--------------------|---------------------|-------------|
| `N/A`              | `{"access_token": "ABCD...", "expires_in" : 5183996 }` | El usuario autorizó el dispositivo correctamente. El dispositivo ahora puede usar el valor `access_token` para hacer llamadas autorizadas a la API. |
| `1349174`         | `{"error":{"message":"This request requires the user to take a pending action","code":31,"error_subcode":1349174,"error_user_title":"Device Login Authorization Pending","error_user_msg":"User has not yet authorized your application. Continue polling."}}` | El usuario aún no autorizó tu app. Continúa realizando consultas al ritmo que se especifica en la respuesta en el [paso 1](#tech-step1). |
| `1349172`         | `{"error":{"message":"User request limit reached","code":17,"error_subcode":1349172,"error_user_title":"OAuth Device Excessive Polling","error_user_msg":"Your device is polling too frequently. Space your requests with a minium interval of 5 seconds."}}` | Tu dispositivo está realizando consultas con demasiada frecuencia. Reduce la velocidad de las consultas hasta el intervalo especificado en la primera llamada a la API. |
| `1349152`         | `{"error":{"message":"The session has expired","code":463,"error_subcode":1349152, "error_user_title":"Activation Code Expired","error_user_msg":"The code you entered has expired. Please go back to your device for a new code and try again."}}` | El código del dispositivo caducó. Cancela el flujo de inicio de sesión del dispositivo y envía al usuario de vuelta a la pantalla inicial. |

### 5. Confirmar el inicio de sesión correcto

Cuando recibes un token de acceso, la persona autorizó tu solicitud correctamente. Debes conservar este token de acceso en el dispositivo.

Para que la persona sepa que el proceso de inicio de sesión se realizó correctamente, tu dispositivo debería mostrar su nombre y, si está disponible, una foto de perfil hasta que haga clic en `Continue`. Para obtener el nombre y la foto de perfil de la persona, tu dispositivo debería realizar una llamada estándar a la API Graph:

```
GET https://graph.facebook.com/me? fields=name,picture&access_token=<USER_ACCESS_TOKEN>
```

Obtienes una respuesta con el siguiente formato:

```
{
  "name": "John Doe",
  "picture": {
    "data": {
      "is_silhouette": false,
      "url": "https://fbcdn.akamaihd.net/hmac...ile.jpg"
    }
  },
  "id": "2023462875238472"
}
```

Muestra el nombre y la foto del perfil de la persona hasta que haga clic en `Continue` en tu dispositivo.

### 6. Almacenar tokens de acceso

Tu dispositivo debe conservar el token de acceso para realizar otras solicitudes a la API Graph.

Los tokens de acceso de inicio de sesión para dispositivos pueden ser válidos hasta 60 días, pero se invalidan en varios escenarios. Por ejemplo, cuando una persona cambia su contraseña de Facebook, su token de acceso queda invalidado.

Si el token no es válido, tu dispositivo debe borrar el token de su memoria. La persona que usa tu dispositivo debe realizar el flujo de inicio de sesión para dispositivos de nuevo desde el [paso 1](#tech-step1) para recuperar un token nuevo y válido.

## Solución de problemas

**¿Puedo realizar solicitudes del flujo de inicio de sesión para dispositivos a través de HTTP?**  
OAuth 2 requiere TLS/HTTPS.

**¿Puedo realizar solicitudes del flujo de inicio de sesión para dispositivos con el método GET?**  
Todas las solicitudes del flujo de inicio de sesión para dispositivos deben ser `POST`.

**¿Cómo puedo actualizar mi token de acceso de inicio de sesión para dispositivos?**  
Los tokens de acceso de inicio de sesión para dispositivos pueden ser válidos hasta 60 días.

Si el token no es válido, tu dispositivo debe borrar el token de su memoria. La persona que usa tu dispositivo debe realizar el flujo de inicio de sesión para dispositivos de nuevo desde el [paso 1](#tech-step1) para recuperar un token nuevo y válido.

Para obtener más información sobre la actualización de los tokens, consulta [Tokens de acceso](/docs/facebook-login/access-tokens).

**Recibo un error `Invalid API method` cuando envío una solicitud POST, ¿qué sucede?**  
Si realizas una solicitud POST y recibes un error como este:

```
{
  "error":{
    "message":"Invalid API method",
    "type":"OAuthException",
    "code":3
  }
}
```

Es posible que debas activar el inicio de sesión desde dispositivos en tu app.

Carga el [panel de tu app](https://developers.facebook.com/apps/) y configura Producto > Inicio de sesión en Facebook > Configuración > Inicio de sesión desde dispositivos en "Sí".

**El token de acceso de mi dispositivo no es válido. ¿Qué hago?**  
Si el token de acceso no es válido, el dispositivo debe borrarlo de su memoria y obtener un nuevo token. La persona que usa tu dispositivo debe realizar el flujo de inicio de sesión para dispositivos de nuevo desde el [paso 1](#tech-step1) para recuperar un token nuevo y válido.
```



## Page: https://developers.facebook.com/docs/facebook-login/testing-your-login-flow

```markdown
# Probar un proceso de inicio de sesión

Es importante probar y verificar que el proceso de inicio de sesión con Facebook funcione bien en varias situaciones. Para probar el proceso de inicio de sesión, primero debes crear una cuenta de usuario de Facebook separada:

1. Crear una nueva cuenta de usuario de prueba con Facebook
2. Iniciar sesión con Facebook con las credenciales del usuario de prueba

## Casos de prueba comunes

Antes de probar los casos de uso que se detallan a continuación, asegúrate de eliminar tu app de la cuenta de Facebook del usuario de prueba con [Configuración de la app](https://www.facebook.com/settings?tab=applications).

![Imagen de ejemplo](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/851556_135779183259320_298311523_n.png?_nc_cat=101&ccb=1-7&_nc_sid=34156e&_nc_ohc=w1dc5x4gktIQ7kNvwG8dD1M&_nc_oc=Adk1OY7qtd8LknigxUF-cXXL09HOATkqWe6t0dX2F8zbNK7RuCMOxL2oEb__hwFUWac&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=aIma6HsUePQI1PZTrdDF_g&oh=00_AfjkD43c9t8id1qvuJS5y_xSWWodQNh7YdnL8Jiqcxo3yQ&oe=691AB4DB)

|  |  |
|---|---|
| ![Imagen 1](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/16179951_141359083037439_3885858252168101888_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=-2nJWtAZdJgQ7kNvwGf8bhJ&_nc_oc=Adm96Har8nnSwDbszZ7x9IJV_8IsQhlBTu_eR0ly-Nk5LY5OQbg4rGReWpprEv2HU7Q&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=aIma6HsUePQI1PZTrdDF_g&oh=00_AfiNubtEnrNiUCFtsZOu8rbRe-e5sPepqI5Wtv9mlLn18A&oe=692F1303) | ![Imagen 2](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16344795_1855913284684189_271619779112992768_n.png?_nc_cat=111&ccb=1-7&_nc_sid=e280be&_nc_ohc=eJdeAwekD5QQ7kNvwFXapm6&_nc_oc=AdnkmeYs1rlysODpEPwfAr7hducm3djgT6yTN9UP4MEA8gcZmXF6LDRcVWYarK8vHf8&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=aIma6HsUePQI1PZTrdDF_g&oh=00_AfgqMuQVlCYseDoZC9BG594WeT3uyIOF2W1D3siyFU1V4w&oe=692F125C) |

#### 1. Alguien nuevo en tu app inicia sesión con Facebook

1. Ve a tu app y toca el botón `Log in with Facebook`.
2. Toca "Aceptar" para aceptar los permisos de lectura.
3. Vuelve a hacer clic en "Aceptar" para aceptar los permisos de escritura, si corresponde.
4. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) y verifica que estén disponibles los permisos que se otorgaron.

#### 2. Alguien inicia sesión con Facebook después de haber iniciado sesión previamente a través de un proceso distinto de Facebook con la misma dirección de correo electrónico

1. Ve a tu app e inicia sesión con tu dirección de correo electrónico.
2. Cierra la sesión de tu app y toca el botón "Iniciar sesión con Facebook".
3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y verifica que estén disponibles los permisos que se otorgaron.

#### 3. Alguien que inició sesión en tu app con Facebook anteriormente intenta volver a iniciar sesión

1. Vuelve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
3. Desinstala y vuelve a instalar la app.
4. Abre tu app y toca el botón "Iniciar sesión con Facebook".
5. Verifica que puedes iniciar sesión sin que veas ningún cuadro de diálogo de permiso.

#### 4. Alguien cancela el inicio de sesión con Facebook e intenta volver a iniciar sesión

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Verifica que se muestren los permisos de lectura y toca "Cancelar".
3. Abre tu app y toca el botón "Iniciar sesión con Facebook".
4. Verifica que se vuelvan a mostrar los permisos de lectura.

#### 5. Alguien elimina tu app de Facebook mediante la configuración de la app y vuelve a usar tu app. Tu app debería detectar esta situación y solicitarle a la persona que vuelva a iniciar sesión.

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
3. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y elimina tu app.
4. Repite los pasos 1 y 2, y verifica que el inicio de sesión con Facebook funcione.

#### 6. Alguien cambia la contraseña de Facebook después de iniciar sesión con Facebook en tu app

En este caso, tu token será inválido y deberías notificar a los usuarios que su sesión de Facebook caducó y solicitarles que vuelvan a iniciar sesión.
1. Cambia la contraseña de Facebook y selecciona "Cerrar la sesión de otros dispositivos".
2. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Ve a la configuración de la app en Facebook y verifica que estén disponibles los permisos que se otorgaron.

#### 7. Alguien inhabilitó la plataforma de Facebook con la configuración de la app e inicia sesión en tu app

En este caso, deberías asegurarte de que tu app detecte el error para poder notificar a los usuarios y redirigirlos a una versión no integrada de iOS del inicio de sesión con Facebook.
1. En la [configuración de la app](https://www.facebook.com/settings?tab=applications), desactiva la plataforma para el usuario de prueba.
2. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Verifica que la plataforma esté ahora activada y se haya agregado la app a tu perfil de usuario de prueba con la privacidad correcta.

#### 8. Alguien vuelve a utilizar tu app cuando el token de la app caducó

Consulta nuestra guía sobre [cómo manejar la caducidad del token](https://developers.facebook.com/docs/facebook-login/access-tokens/#extending).

#### 9. Prueba el estado de sincronización de los juegos que sincronizan su estado en varios dispositivos.

1. Inicia sesión con Facebook en tu app y juega con tu app hasta que alcances un terminado nivel X.
2. Inicia sesión con Facebook en un dispositivo diferente con el mismo sistema operativo, o con uno distinto, y comprueba que se reanude el nivel X.

## Otros casos de uso que deben probarse en iOS

### 1. Alguien inicia sesión en tu app cuando está instalada la app de Facebook y está activada la integración con iOS de Facebook

Si alguien hace clic en "Cancelar" como respuesta a la solicitud de los permisos de lectura del inicio de sesión, será necesario que vaya a la configuración del sistema de iOS para volver a habilitar el inicio de sesión de tu app.

En los casos en los que las personas negaron con anterioridad los permisos de Facebook a través del inicio de sesión integrado en iOS, la app debería utilizar el inicio de sesión de cambio de app rápido convencional para las solicitudes de permisos futuras. En lo que respecta a las llamadas al SDK, no utilices, en este caso, FBSessionLoginBehaviorUseSystemAccountIfPresent como FBSessionLoginBehavior. Consulta [FBSession](https://developers.facebook.com/docs/reference/ios/3.24/class/FBSessionTokenCachingStrategy/) para las versiones 3.24 y posteriores del SDK y [FBSDKAccessToken currentAccessToken](https://developers.facebook.com/docs/reference/ios/current/class/FBSDKAccessToken/) y [FBSDKLoginManager](https://developers.facebook.com/docs/reference/ios/current/class/FBSDKLoginManager/) para las versiones más modernas.

### 2. Alguien inicia sesión en tu app cuando no está instalada la app de Facebook y no está activada la integración con iOS de Facebook

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Verifica que aparezca la pantalla de inicio sesión web móvil de Facebook e inicia sesión.

![Imagen de ejemplo](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16344918_169764566844281_1286387342747107328_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=OJfG-_N7Z9AQ7kNvwFbiWeA&_nc_oc=AdmXPZyeMnaLdMipM6qm4i8Tr28SCBIMsbdXlKZGQeI6XMM-JefkM46RswsmtINklmg&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=aIma6HsUePQI1PZTrdDF_g&oh=00_AfhoftyrPCGxPsTrDlOJPJ569z7QjumMca7iPL7FzhvjPg&oe=692F17F5)

3. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
4. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y verifica que estén disponibles los permisos que se otorgaron.

### 3. Alguien inicia sesión en tu app cuando no está instalada la app de Facebook y está activada la integración con iOS de Facebook

1. Ve a tu app y toca el botón "Iniciar sesión con Facebook".
2. Toca "Aceptar" para aceptar los permisos de lectura (y toca una vez más "Aceptar" para aceptar los permisos de escritura, si corresponde).
3. Ve a [Configuración de la app](https://www.facebook.com/settings?tab=applications) en Facebook y verifica que estén disponibles los permisos que se otorgaron.

## Usuarios de prueba

En la configuración de la app (en "Roles", por ejemplo, `https://developers.facebook.com/apps/{YOUR_APP_ID}/roles/test-users/`), puedes crear [cuentas de usuario de prueba](https://developers.facebook.com/docs/apps/test-users) para verificar tu integración de Facebook sin tener que preocuparte por el envío de spam.

En el SDK de iOS, se puede usar la clase `FBSDKTestUsersManager` (en `FBSDKCoreKit`) a fin de obtener con facilidad los tokens de acceso para esas cuentas de usuario de prueba, por lo que podrás escribir pruebas de integración automatizadas. Ten en cuenta que esta clase requiere tu contraseña de la app y que deberías asegurarte de que no se haya incluido dicha contraseña en la app publicada.
```



## Page: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow

```markdown
# Crear un proceso de inicio de sesión de forma manual

Si quieres implementar un inicio de sesión basado en un navegador para una app web o para computadoras sin usar nuestros SDK, como en una vista web de una app nativa para computadoras (por ejemplo, Windows 8) o un proceso de inicio de sesión que utiliza completamente códigos del servidor, puedes compilar un proceso de inicio de sesión por tu cuenta usando redireccionamientos de navegador. En esta guía se explica cada paso del proceso de inicio de sesión y se muestra cómo implementarlos sin usar nuestros SDK:

- [Comprobar el estado del inicio de sesión](#checklogin)
- [Iniciar la sesión](#login)
- [Confirmar la identidad](#confirm)
- [Almacenar los tokens de acceso y el estado del inicio de sesión](#token)
- [Cerrar la sesión](#logout)
- [Detectar cuando las personas desinstalan apps](#deauth-callback)
- [Responder solicitudes para eliminar los datos de usuario](#data-deletion)

A fin de usar el inicio de sesión con Facebook en una app para computadoras, es necesario que puedas insertar un navegador web (algunas veces, llamado "vista web") dentro de la app para realizar el proceso de inicio de sesión.

## Comprobar el estado del inicio de sesión

Las apps que usan nuestros SDK pueden verificar si alguien ya inició sesión mediante las funciones integradas. Todas las demás apps deben [crear su propia forma de almacenamiento cuando una persona inicia sesión](#token) y, cuando dicho indicador no se encuentra allí, se procede a asumir que cerraron la sesión. Si alguien cierra la sesión, la app deberá volver a dirigir a esa persona al cuadro de diálogo de inicio de sesión en el momento apropiado, por ejemplo, cuando haga clic en el botón "Iniciar sesión".

## Iniciar la sesión

Si una persona no inició sesión en la app o en Facebook, puedes usar el [cuadro de diálogo de inicio de sesión](https://developers.facebook.com/docs/facebook-login/overview/#logindialog) para indicarle que inicie sesión en tu página y en Facebook. Si la persona no inició sesión en Facebook, se le pedirá que lo haga y, después, que inicie sesión en la app. Se detectará de manera automática, por lo que no es necesario hacer nada extra para activar este comportamiento.

| ![Imagen 1](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16327997_444594122597117_4349793051749646336_n.png?_nc_cat=100&ccb=1-7&_nc_sid=e280be&_nc_ohc=AYlVbIIMrOwQ7kNvwHGbEgH&_nc_oc=AdlaXh4kELQ-oyozAnUsFzU5SsciS_VhXc4HPq-bpioAdMTpgeN_T1Vmq-HGJV_d43o&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=KekMijefH1PJ_iPtgzRTdA&oh=00_AfgppaW62SS8zzuKlhYNk2_MxdCESM8668rDk5CYnBGazQ&oe=692F1F15) | ![Imagen 2](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16327433_1870075749894022_1432932236771983360_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=rPmEPVqVACcQ7kNvwGIecYA&_nc_oc=Adle2f-Hl-nZ4zU864oq39K2hx4sAXTSun_3ghZc1r-q4kVNStRkxFSzCj2zX93oORM&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=KekMijefH1PJ_iPtgzRTdA&oh=00_Afh0MLCQkDQKkBrbS1w1hS6kwEp43shaWewbTjmcchoaUQ&oe=692F3317) |
|:---:|:---:|

### Invocar el cuadro de diálogo de inicio de sesión y la configuración de la URL de redireccionamiento

La app debe iniciar un redireccionamiento a un punto de conexión, que mostrará el cuadro de diálogo de inicio de sesión:

```
https://www.facebook.com/v24.0/dialog/oauth?
  client_id={app-id}
  &redirect_uri={redirect-uri}
  &state={state-param}
```

Este punto de conexión requiere los siguientes parámetros:

- `client_id`. Es el identificador de la app que se encuentra en el panel de la app.
- `redirect_uri`. La URL a la que deseas redirigir a la persona que inicia sesión. Esta URL capturará la respuesta del cuadro de diálogo de inicio de sesión. Si se utiliza esto en una vista web dentro de una app para computadoras, debe establecerse en `https://www.facebook.com/connect/login_success.html`. Puedes confirmar si esta URL está configurada para la app en el panel de apps. En **Productos**, en el menú de navegación del lado izquierdo del panel de apps, haz clic en **Inicio de sesión con Facebook** y, a continuación, en **Configuración**. Verifica los **URI de redireccionamiento de OAuth válidos** en la sección **Configuración de OAuth de cliente**.
- `state`. Un valor de cadena creado por la app para mantener el estado entre la solicitud y la devolución de llamada. Este parámetro se debe usar para prevenir la [falsificación de solicitudes entre sitios](https://en.wikipedia.org/wiki/Cross-site_request_forgery) y se te devolverá sin cambios en el URI de redireccionamiento.

Por ejemplo, si la solicitud de inicio de sesión se ve así:

```
https://www.facebook.com/v24.0/dialog/oauth?
  client_id={app-id}
  &redirect_uri={"https://www.domain.com/login"}
  &state={"st=state123abc,ds=123456789"}
```

el URI de redireccionamiento se llamaría así:

```
https://www.domain.com/login?state="{st=state123abc,ds=123456789}"
```

También presenta los siguientes parámetros opcionales:

- `response_type`. Determina si los datos de la respuesta incluida al producirse el redireccionamiento a la app están en forma de fragmentos o parámetros de URL. Consulta la sección [Confirmación de identidad](#confirm) para seleccionar qué tipo debería usar tu app. Puede ser alguna de estas opciones:

  - `code`. Los datos de la respuesta se incluyen como parámetros URL y contienen el parámetro `code` (un elemento único en cadena cifrado para cada solicitud de inicio de sesión). Este es el comportamiento predeterminado si no se especificó este parámetro. Es más útil si el servidor administra el token.
  - `token`. Los datos de la respuesta se incluyen como fragmento de URL y contienen un token de acceso. La app para computadoras debe usar esta configuración para `response_type`. Es más útil si el cliente administra el token.
  - `code%20token`. Los datos de la respuesta se incluyen como fragmento de la URL y contienen un token de acceso y el parámetro `code`.
  - `granted_scopes`. Devuelve una lista separada por comas de los [permisos](https://developers.facebook.com/docs/facebook-login/permissions/) que el usuario le otorgó a la app al momento de iniciar la sesión. Puede combinarse con otros valores `response_type`. Cuando se combina con `token`, los datos de respuesta se incluyen como fragmento de la URL; caso contrario, se incluyen como parámetro de URL.

- `scope`. Una lista separada por comas o espacios de los [permisos](https://developers.facebook.com/docs/facebook-login/permissions/) que se le solicitarán a la persona que usa la app.

#### Para apps de Windows 8

Si compilas un inicio de sesión para una app de Windows, puedes usar el [identificador del paquete de seguridad](https://msdn.microsoft.com/en-us/library/windows/apps/hh465407.aspx) como tu `redirect_uri`. Activa el cuadro de diálogo de inicio de sesión llamando a [WebAuthenticationBroker.AuthenticateAsync](https://msdn.microsoft.com/en-us/library/windows/apps/br212068.aspx) y usa el punto de conexión del cuadro de diálogo de inicio de sesión como requestUri. Aquí se muestra un ejemplo en JavaScript:

```javascript
var requestUri = new Windows.Foundation.Uri(
  "https://www.facebook.com/v24.0/dialog/oauth?
    client_id={app-id}
    &display=popup
    &response_type=token
    &redirect_uri=ms-app://{package-security-identifier}"
);

Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
  options,
  requestUri
).done(function (result) {
  // Handle the response from the Login Dialog
});
```

Se devolverá un proceso de control a la app con un token de acceso en caso de ser satisfactorio, o un error en caso de que falle.

### Administrar la respuesta del cuadro de diálogo de inicio de sesión

En este punto del proceso de inicio de sesión, la persona verá el cuadro de diálogo de inicio de sesión y tendrá la posibilidad de cancelar o permitir que la app acceda a sus datos.

Si la persona que usa la app elige Aceptar en el cuadro de diálogo de inicio de sesión, otorga acceso a su perfil público, lista de amigos y a los [permisos](https://developers.facebook.com/docs/facebook-login/permissions/) adicionales que solicitó la app.

En todos los casos, el navegador devuelve una respuesta a la app, y se incluyen los datos de la respuesta que indican si alguna persona se conectó o canceló la solicitud. Si la app usa el método de redireccionamiento según se describió anteriormente, el `redirect_uri` que devuelve la app se agregará a los parámetros o fragmentos de URL (según el `response_type` elegido), lo que debe capturarse.

Dado que las apps web podrían usar muchas combinaciones distintas de lenguajes de programación, nuestra guía no muestra ejemplos específicos. Sin embargo, los lenguajes más modernos podrán analizar la URL de la siguiente manera:

JavaScript del lado del cliente puede capturar fragmentos de URL (por ejemplo [jQuery BBQ](https://github.com/cowboy/jquery-bbq)), mientras que el código del lado del cliente y del servidor puede capturar los parámetros de URL (por ejemplo [$_GET en PHP](https://php.net/manual/en/reserved.variables.get.php), [jQuery.deparam en jQuery BBQ](https://github.com/cowboy/jquery-bbq), [querystring.parse en Node.js](https://nodejs.org/api/querystring.html) o [urlparse en Python](https://docs.python.org/2/library/urlparse.html)). Microsoft proporciona [una guía y un ejemplo de código para las apps de Windows 8](http://msdn.microsoft.com/en-us/library/windows/apps/jj856915.aspx) que se conectan a un "proveedor en línea", en este caso, Facebook.

Cuando se usa una app para computadoras y se inicia sesión, Facebook redirige a las personas al `redirect_uri` que se indicó anteriormente y proporciona un token de acceso junto con otros metadatos (como la fecha de caducidad del token) en el fragmento de URI:

```
https://www.facebook.com/connect/login_success.html#
    access_token=ACCESS_TOKEN...
```

La app debe detectar este redireccionamiento y luego leer el token de acceso desde el URI usando los mecanismos proporcionados por el sistema operativo y el marco de desarrollo que se está utilizando. Luego, puedes ir directo al paso [inspeccionar tokens de acceso](#checktoken).

### Inicio de sesión cancelado

Si las personas que usan la app no aceptan el cuadro de diálogo de inicio de sesión y hacen clic en Cancelar, serán redirigidas a:

```
YOUR_REDIRECT_URI?
 error_reason=user_denied
 &error=access_denied
 &error_description=Permissions+error.
```

Consulta [Administra los permisos faltantes](https://developers.facebook.com/docs/facebook-login/permissions/#missingperms) para obtener más información sobre qué deberían hacer las apps cuando las personas deciden no iniciar sesión.

## Confirmar la identidad

Dado que este proceso de redireccionamiento implica que se redireccionen los navegadores a las URL de la app desde el cuadro de diálogo de inicio de sesión, el tráfico podría acceder directamente esta URL con los parámetros o fragmentos inventados. Si la app asumió que estos parámetros eran válidos, la app podría usar los datos inventados con fines potencialmente maliciosos. Como consecuencia, la app debería confirmar que la persona que usa la app es la misma de quien tienes datos de respuesta antes de generarle un token de acceso. Se puede lograr confirmar la identidad de diferentes maneras según el `response_type` recibido más arriba:

- Cuando se recibe un `code`, debe [intercambiarse por un token de acceso mediante un punto de conexión.](#exchangecode) Es necesario que la llamada sea de servidor a servidor, dado que implica indicar la clave secreta de la app (la clave secreta de la app no debería aparecer nunca en código del cliente).
- Cuando se recibe el `token`, debe ser verificado. Deberías [realizar una llamada a la API de un punto de conexión de inspección](#checktoken) que indicará para quién se generó el token y qué app lo hizo. Dado que esta llamada a la API requiere que se use un token de acceso a la app, nunca hagas esta llamada desde un cliente. En cambio, haz esta llamada desde un servidor en el que puedas almacenar de manera segura la clave secreta de la app.
- Cuando se reciben `code` y `token`, se deben realizar ambos pasos.

Ten en cuenta que también puedes generar tu propio [parámetro `state`](#logindialog) y usarlo con la solicitud de inicio de sesión para proporcionar protección contra CSFR.

### Intercambiar código por un token de acceso

Para obtener un token de acceso, realiza una solicitud GET HTTP al siguiente punto de conexión de OAuth:

```
GET https://graph.facebook.com/v24.0/oauth/access_token?
   client_id={app-id}
   &redirect_uri={redirect-uri}
   &client_secret={app-secret}
   &code={code-parameter}
```

Este punto de conexión tiene algunos parámetros obligatorios:

- `client_id`. Los identificadores de la app.
- `redirect_uri`. Este argumento es obligatorio y debe ser idéntico al del `request_uri` original que utilizas cuando comienzas el proceso de inicio de sesión de OAuth.
- `client_secret`. La clave secreta de la app que se muestra en el [panel de apps](https://developers.facebook.com/apps). No incluyas nunca la clave secreta de tu app en el código del cliente ni en binarios que puedan descompilarse. Es imperioso que continúe siendo totalmente secreta, porque es el punto central de la seguridad de la app y de todas las personas que la usan.
- `code`. El parámetro recibido del cuadro de diálogo de inicio de sesión que se redirigió anteriormente.

**Respuesta**

La respuesta recibida de este extremo tiene el formato JSON y, si no hay problemas, tendrá el siguiente aspecto:

```json
{
  "access_token": {access-token},
  "token_type": {type},
  "expires_in": {seconds-til-expiration}
}
```

De no ser satisfactoria, recibirás un mensaje de error con una explicación.

## Inspeccionar los tokens de acceso

Independientemente de que la app use o no los valores `code` o `token` como `response_type` del cuadro de diálogo de inicio de sesión, ya debería haber recibido un token de acceso. Puedes realizar verificaciones automáticas de estos tokens con el punto de conexión de la API Graph:

```
GET graph.facebook.com/debug_token?
     input_token={token-to-inspect}
     &access_token={app-token-or-admin-token}
```

Este punto de conexión admite los siguientes parámetros:

- `input_token`: el token que necesitas inspeccionar.
- `access_token`: un [token de acceso a la aplicación](https://developers.facebook.com/docs/facebook-login/access-tokens/); o bien, un token de acceso para un desarrollador de la app.

La respuesta de la llamada a la API es una matriz JSON que contiene datos acerca del token inspeccionado. Por ejemplo:

```json
{
  "data": {
    "app_id": 138483919580948,
    "type": "USER",
    "application": "Social Cafe",
    "expires_at": 1352419328,
    "is_valid": true,
    "issued_at": 1347235328,
    "metadata": {
      "sso": "iphone-safari"
    },
    "scopes": [
      "email",
      "publish_actions"
    ],
    "user_id": "1207059"
  }
}
```

Los campos `app_id` y `user_id` ayudan a la app a verificar que el token de acceso sea válido para la persona y la app. Para obtener una descripción completa de los otros campos, consulta la [guía sobre tokens de acceso](https://developers.facebook.com/docs/facebook-login/access-tokens).

### Verificar permisos

Es posible llamar al [perímetro `/me/permissions`](https://developers.facebook.com/docs/graph-api/reference/user/permissions) con el fin de recuperar una lista de permisos que otorgó o rechazó un usuario en particular. La app puede usarlo para verificar cuál de los permisos solicitados no puede usarse para algún usuario en particular.

## Volver a solicitar permisos rechazados

El inicio de sesión con Facebook permite a las personas no conceder algunos permisos a la app. El cuadro de diálogo de inicio de sesión contiene una pantalla con este aspecto:

![Pantalla de permisos](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/16179985_1206438769441612_8903745733237145600_n.png?_nc_cat=100&ccb=1-7&_nc_sid=e280be&_nc_ohc=lSKUVCS5OAUQ7kNvwF5KZSU&_nc_oc=AdmSMebe1Ry33Mi7gnDbwf6l-DahuspW4vghc-OFIJYatKfownPC9cXRqlREh8PeQnc&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=KekMijefH1PJ_iPtgzRTdA&oh=00_AfghKZ1owMvCbyry2GMh0XEwS3m8uP6TAzdVdqfvNRxy8w&oe=692F041D)

El permiso `public_profile` siempre es necesario y aparece atenuado, ya que no se puede desactivar.

Sin embargo, si alguien desmarca `user_likes` (Me gusta) en este ejemplo, al marcar [/me/permissions](https://developers.facebook.com/docs/graph-api/reference/user/permissions) para determinar qué permisos se concedieron se obtendrá el siguiente resultado:

```json
{
  "data": [
    {
      "permission": "public_profile",
      "status": "granted"
    },
    {
      "permission": "user_likes",
      "status": "declined"
    }
  ]
}
```

Ten en cuenta que `user_likes` se rechazó en lugar de concederse.

Es aceptable pedir a una persona que conceda a la app permisos que ya rechazó. Muéstrale una pantalla informativa que explique por qué es importante que conceda el permiso y, después, vuelve a solicitarlo. Sin embargo, si invocas el cuadro de diálogo de inicio de sesión [del mismo modo que antes](#logindialog), no solicitará ese permiso.

**El motivo es que, una vez que se rechaza un permiso, el cuadro de diálogo de inicio de sesión no lo vuelve a solicitar a menos que se lo indiques explícitamente.**

Para ello, puedes agregar el parámetro `auth_type=rerequest` a la URL del cuadro de diálogo de inicio de sesión:

```
https://www.facebook.com/v24.0/dialog/oauth?
    client_id={app-id}
    &redirect_uri={redirect-uri}
    &auth_type=rerequest
    &scope=email
```

Al usarlo, el cuadro de diálogo de inicio de sesión volverá a solicitar el permiso rechazado.

## Almacenar los tokens de acceso y el estado del inicio de sesión

A esta altura del proceso, cuentas con una persona autenticada que inició sesión. La app está lista para realizar llamadas a la API en su nombre. Antes de hacerlo, debería almacenar el token de acceso y el estado de inicio de sesión de la persona que usa la app.

### Almacenar tokens de acceso

Una vez que la app recibe el token de acceso del paso anterior, este se debe almacenar de modo que esté disponible para todas las partes de la aplicación al realizar llamadas a la API. No hay ningún proceso específico aquí. Sin embargo, por lo general, si creas una app web, es mejor agregar el token como variable de la sesión para identificar a una persona en particular con dicha sesión del navegador; si creas una app para computadoras o para celulares, deberías usar la base de datos disponible de la app. Asimismo, la app debería almacenar el token en una base de datos junto con el `user_id` para identificarla.

Consulta la nota sobre el [tamaño de los tokens de acceso en el documento sobre estos tokens](https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling/#sizes).

### Hacer seguimiento del estado del inicio de sesión

Nuevamente, tu app debe almacenar el estado de inicio de sesión de una persona, pues esto ayuda a evitar tener que realizar llamadas adicionales al cuadro de diálogo de inicio de sesión. Sin importar el procedimiento que elijas, modifica [la comprobación del estado de inicio de sesión](#checklogin) para que se adapte a la selección.

## Cerrar la sesión

Puedes cerrar la sesión de las personas de la app eliminando [cualquier indicador de estado de inicio de sesión que hayas agregado](#token), por ejemplo, eliminar la sesión que indica que una persona inició sesión. También deberías eliminar el token de acceso almacenado.

Cerrar la sesión de una persona no es lo mismo que revocar el permiso de inicio de sesión (eliminar una autenticación que se concedió con anterioridad), [lo que puede hacerse de manera separada.](https://developers.facebook.com/docs/facebook-login/permissions/requesting-and-revoking#revokelogin) En consecuencia, crea la app de forma tal que no fuerce de manera automática a las personas que cerraron sesión a volver al cuadro de diálogo de inicio de sesión.

## Detectar cuando las personas desinstalan apps

Las personas pueden desinstalar las apps a través de Facebook.com sin necesidad de interactuar con la propia app. Para ayudar a que las apps detecten cuándo sucedió esto, les permitimos proporcionar una URL de devolución de llamada para autorizaciones canceladas, que enviará una notificación en el momento en que esto suceda.

Puedes activar una devolución de llamada a través del [panel de apps](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback).

## Responder solicitudes para eliminar los datos de usuario

Las personas pueden solicitar que una app elimine de Facebook toda la información que existe sobre ellas. Para responder a estas solicitudes, consulta [devolución de llamada de solicitud de eliminación de datos](https://developers.facebook.com/docs/apps/delete-data/).
```



## Page: https://developers.facebook.com/docs/facebook-login/changelog

```markdown
# Registro de cambios del inicio de sesión con Facebook

## 2 de julio de 2018

### Cambios recientes en el inicio de sesión con Facebook

El inicio de sesión con Facebook cambió mucho en los últimos meses como parte de nuestro esfuerzo por proteger la privacidad de las personas y brindarles mayor control sobre su información. Comprendemos lo desafiante que puede ser estar al día con todas las actualizaciones. Como ayuda para esto, compilamos un resumen de los cambios recientes, junto con las recomendaciones para incorporarlos.

#### Fechas clave

Ten en mente las siguientes fechas límite para garantizar el funcionamiento fluido de tu aplicación o sitio web.

- **1 de agosto de 2018:** Volver a solicitar el acceso a los permisos de inicio de sesión con Facebook, si es necesario, a través de Revisión de aplicaciones.
- **6 de octubre de 2018:** Aceptar "Aplica HTTPS" (se habilitará automáticamente después de esta fecha).
- **1 de noviembre de 2018:** Migrar de ASID a PSID para aplicaciones donde se usan los permisos de administración de páginas y mensajes de bot.
- **8 de enero de 2019:** Actualizar a API Graph 3.0.

#### Se requiere una revisión adicional para ciertos permisos

Para proteger los datos de las personas, ahora se requiere que más permisos se sometan al proceso Revisión de aplicaciones. Para ciertos permisos, también se requiere una verificación de la empresa, y un contrato entre la empresa y Facebook. Para la verificación, las empresas pueden presentar formularios de documentación, como facturas de servicios públicos, licencias empresariales, certificados de formación, artículos de incorporación, números de identificación fiscal, etc. Para el contrato, se deben cumplir requisitos de seguridad adicionales y otras disposiciones sobre datos. Puedes obtener más información sobre el proceso de revisión de aplicaciones optimizado en el tema [Revisión de aplicaciones](https://developers.facebook.com/docs/apps/review).

En la siguiente tabla, se resumen los niveles de revisión necesarios para los permisos de inicio de sesión con Facebook. Vuelve a consultar esta tabla con frecuencia para ver las actualizaciones.

| NO se requiere revisión de aplicaciones | Se requiere revisión de aplicaciones | Se requieren revisión de aplicaciones, verificación de la empresa y contrato |
|-----------------------------------------|-------------------------------------|-----------------------------------------------------------------------------|
| `name`                                  | `user_gender`*                     | `user_friends`                                                             |
| `email`                                 | `user_age_range`*                  | `user_likes`                                                               |
| `profile_picture`                       | `user_link`* (enlaces a la página del perfil de Facebook) | `user_photos`                                                             |
|                                         | `user_birthday`                    | `user_tagged_places`                                                       |
|                                         | `user_location` (ciudad actual)    | `user_videos`                                                              |
|                                         | `user_hometown`                    | `user_events`                                                              |
|                                         |                                     | `user_managed_groups`                                                      |
|                                         |                                     | `user_posts`                                                               |

* Si todavía no se realizó la actualización a la API Graph, se recomienda volver a solicitar estos permisos antes del 1 de agosto. Si ya se aprobaron para el acceso, los permisos continuarán disponibles después de la actualización a la API Graph 3.0. Los cambios en la API Graph 3.0 se detallan en la [entrada de blog](https://developers.facebook.com/blog/post/2018/05/01/enhanced-developer-app-review-and-graph-api-3.0-now-live/) del 1 de mayo de 2018. Las aplicaciones se pueden actualizar a la API Graph 3.0 hasta el 8 de enero de 2019.

Si la aplicación o el sitio web ya utilizaban los permisos que se muestran en la tabla anterior antes del 1 de mayo de 2018 cuando se lanzó la revisión optimizada, es posible volver a solicitar el acceso **hasta el 1 de agosto de 2018** y garantizar la continuación de su uso.

##### Proveedores de tecnología de terceros

Las empresas que se basan en la plataforma de Facebook para brindar servicios a otras empresas como proveedores de tecnología de terceros también deben firmar otro contrato. El contrato de proveedor de tecnología limita el uso de los datos al único propósito de atender al cliente en nombre del cual se recopilan los datos. Los clientes importantes que utilizan proveedores de tecnología de terceros pueden estar sujetos a la revisión de aplicaciones y tener la obligación de firmar las condiciones complementarias. Los proveedores de tecnología deben identificar su uso comercial como la prestación de servicios a otras empresas en la configuración del [Panel de aplicaciones](https://developers.facebook.com/apps).

#### API y permisos de inicio de sesión con Facebook obsoletos

Ciertos permisos y funciones, que se muestran en la siguiente tabla, se volvieron obsoletos. Ya no se devolverán los campos anteriormente accesibles a través de estos permisos y las API devolverán valores vacíos.

| Permisos de perfil ampliados           | Permisos de acciones de usuario      | API                               |
|----------------------------------------|-------------------------------------|-----------------------------------|
| `user_religion_politics`              | `user_actions.books`                | Etiquetado de amigos              |
| `user_relationships`                   | `user_actions.fitness`              | Todos los amigos en común         |
| `user_relationship_details`            | `user_actions.music`                |                                   |
| `user_custom_friendlists`             | `user_actions.video`                |                                   |
| `user_about_me`                        | `user_actions.new`                  |                                   |
| `user_education_history`               | `user_games_activity`               |                                   |
| `user_work_history`                    |                                     |                                   |
| `user_website`                         |                                     |                                   |

Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/04/04/facebook-api-platform-product-changes/) del 4 de abril de 2018 para obtener más información.

El permiso `publish_actions` quedó obsoleto el 24 de abril de 2018. Las aplicaciones creadas antes de esta fecha con aprobación previa para solicitar `publish_actions` pueden enviar solicitudes de ese tipo hasta el 1 de agosto de 2018. Si se utilizaba `publish_actions`, se recomienda pasar a usar los [cuadros de diálogo de contenido compartido para web](https://developers.facebook.com/docs/sharing/reference/share-dialog), [iOS](https://developers.facebook.com/docs/sharing/ios) y [Android](https://developers.facebook.com/docs/sharing/android). (Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/05/01/facebook-login-updates-further-protect-privacy/) del 1 de mayo de 2018.)

Desde el 1 de mayo de 2018, ya no se pueden solicitar los siguientes permisos, los cuales se volverán obsoletos desde el **8 de enero de 2019** para aplicaciones y sitios web con aprobación obtenida antes del 1 de mayo de 2018:

- `timezone`
- `locale`
- `cover`
- `is_verified`
- `updated_time`
- `verified`
- `currency`
- `devices`
- `third_party_id`

Consulta la [entrada de blog](https://developers.facebook.com/blog/post/2018/05/01/facebook-login-updates-further-protect-privacy/) del 1 de mayo de 2018.

La [referencia de permisos](https://developers.facebook.com/docs/facebook-login/permissions/) muestra la lista completa de los permisos disponibles.

#### Enlaces de perfiles

Los enlaces a perfiles de usuario creados con ASID ya no funcionan. Es necesario recuperar un enlace de perfil desde el campo `user_link`. Estos enlaces no funcionarán si la persona no ha usado la aplicación o el sitio web en 90 días, o si ha rechazado conceder el permiso `user_link` a la aplicación. Después de la migración a la API Graph 3.0, este campo solo estará disponible si la aplicación solicita y el usuario aprueba el permiso.

El elemento `user_link` solo se resolverá en el perfil de Facebook real del usuario para individuos con sesión iniciada en la red extendida de ese usuario (actualmente se definen como amigos de amigos, pero esto se encuentra sujeto a cambios). Es posible que otros individuos solo puedan enviar una solicitud de amistad o mensaje.

Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/04/19/facebook-login-changes-address-abuse/) del 19 de abril de 2018 donde se anuncian estos cambios.

#### Tokens de acceso

##### Renovación de tokens de acceso

El acceso de la aplicación a los datos del usuario ahora caduca después de 90 días si Facebook no puede verificar la actividad en la aplicación. En algunas plataformas, como los juegos web de Facebook, se puede verificar toda la actividad del usuario. En otras plataformas, como iOS, es posible que los usuarios deban aceptar los permisos en un cuadro de diálogo de inicio de sesión cada 90 días para volver a autorizar el acceso a datos de la aplicación. Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/04/09/user-access-token-changes/) del 9 de abril de 2018.

Se recomienda comprobar que la aplicación o el sitio web proporcionen un proceso de reautorización fluido para las personas con tokens de acceso caducados. Obtén más información sobre la actualización de tokens de acceso en [Actualización de tokens de acceso del usuario](https://developers.facebook.com/docs/facebook-login/access-tokens/refreshing).

##### Caducidad de tokens

Se aclaró la diferencia entre los visitantes que nunca iniciaron sesión y los usuarios con tokens de acceso caducados a fin de que los desarrolladores puedan mostrar la interfaz de usuario correcta para cada situación. Si las aplicaciones utilizan el SDK para JavaScript, `FB.getLoginStatus()` permite determinar el estado actual de un usuario y obtener un nuevo estado, `authorization_expired`, para indicar que el token del usuario caducó. Este nuevo estado es distinto del estado `not_authorized` que se obtiene cuando los usuarios no forman una conexión con la aplicación a través del inicio de sesión con Facebook. Con este nuevo estado `expired`, se puede recordar al individuo que inició sesión anteriormente con Facebook y solicitarle que vuelva a pasar por el proceso de inicio de sesión para actualizar su cuenta con la información más reciente.

También existe una nueva forma en que los desarrolladores pueden comprobar la caducidad de los tokens en sus aplicaciones y sitios web. En cada usuario de prueba creado para la aplicación, es posible elegir la cantidad de tiempo antes de que caduquen los tokens de acceso. Si se decide usar una fecha de caducidad personalizada, se puede establecer un intervalo de un minuto o mucho más si es necesario para los fines de prueba exclusivos de la aplicación. Esta opción de configuración se encuentra en el menú Editar de cada usuario de prueba y se aplica a todas las aplicaciones o los sitios web que utiliza el usuario de prueba.

Para el SDK para JavaScript, se agregó un nuevo campo al objeto `authResponse` llamado `reauthorize_required_in`. Gracias a esto, los desarrolladores que trabajan con tokens de corta duración pueden saber la fecha de caducidad de la autorización de 90 días de una persona. Si deseas ampliar proactivamente la sesión de la persona otros 90 días, puedes llamar a `login()` con el parámetro `auth_type=reauthorize` a fin de solicitar a esa persona que acepte nuevamente los permisos actuales concedidos a la aplicación para poder continuar.

Estas actualizaciones se anunciaron en una [entrada de blog](https://developers.facebook.com/blog/post/2018/05/01/facebook-login-updates-further-protect-privacy/) del 1 de mayo de 2018.

#### Se requiere HTTPS

Existe una nueva opción de configuración **[Aplica HTTPS](https://developers.facebook.com/docs/facebook-login/security#https)** para el inicio de sesión con Facebook disponible en el panel de aplicaciones. Cuando se activa esta opción, se requiere el uso de HTTPS en todos los redireccionamientos de inicio de sesión con Facebook, y todas las llamadas al SDK de Facebook para JavaScript que devuelvan o requieran un token de acceso deben realizarse únicamente desde páginas HTTPS. Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/06/08/enforce-https-facebook-login/) del 8 de junio de 2018.

El uso de esta configuración ya es un requisito para todas las nuevas aplicaciones creadas desde marzo de 2018. Las aplicaciones y los sitios web existentes tienen hasta el 6 de octubre de 2018 para aceptar esta opción antes de que se habilite automáticamente. Todas las páginas o los URI de redireccionamiento no seguros que realicen llamadas a la API o inicios de sesión con el SDK para JavaScript desde páginas HTTP dejarán de funcionar después de esa fecha.

#### Integraciones empresariales

"Integraciones empresariales" se muestra como una lista de servicios separada de las aplicaciones en la configuración de la cuenta de una persona. Estos son servicios a los que las personas conectaron su cuenta de Facebook y otorgaron permisos especiales para administrar páginas, eventos, anuncios o mensajes de página. El acceso a las API para empresas continuará funcionando como antes de este cambio, sin caducidad, hasta que un usuario de Facebook elimine la integración con la página, la cuenta publicitaria, el evento, etc. Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/05/01/facebook-login-updates-further-protect-privacy/) del 1 de mayo de 2018 donde se anuncia este cambio.

#### Eliminación de datos personales

Si las personas eliminan la aplicación o el sitio web de la [configuración de aplicaciones y sitios web](https://www.facebook.com/settings?tab=applications&ref=settings) de Facebook, podemos brindarles la opción de solicitar que la aplicación o el sitio web eliminen de Facebook toda la información recibida sobre ellos. La experiencia en Facebook les informará cuándo enviaron una solicitud y cuándo la reconoció el servicio. También les proporcionará un número de confirmación y una forma de comprobar el estado de su solicitud. Al ofrecer esta opción a las personas, es posible automatizar las solicitudes de servicio al cliente, demostrar que su información se maneja con responsabilidad y satisfacer los requisitos de cumplimiento, como los del reglamento [RGPD](https://www.facebook.com/business/gdpr).

Para habilitar esta opción, debes proporcionarnos una URL de devolución de llamada a donde podamos enviar la solicitud. Puedes agregar la URL de devolución de llamada a la página Configuración de inicio de sesión con Facebook en el [panel de aplicaciones](https://developers.facebook.com/apps/). La devolución de llamada debe utilizar HTTPS. Consulta la [documentación](https://developers.facebook.com/docs/apps/delete-data/) para obtener detalles. Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/05/25/developer-business-tools-protect-privacy/) del 25 de mayo de 2018.

#### Información de contacto del responsable de protección de datos

Ahora existe una manera de proporcionar la información de contacto del responsable de protección de datos (DPO) a los usuarios europeos. Ve a la página Configuración de inicio de sesión con Facebook en el [panel de aplicaciones](https://developers.facebook.com/apps/) para agregar el nombre (opcional), la dirección postal y la dirección de correo electrónico del DPO. Esta información estará disponible en la configuración de las aplicaciones y los sitios web de las personas para que puedan ponerse en contacto con el DPO si tienen preguntas sobre cómo se procesan y se utilizan sus datos. Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/05/25/developer-business-tools-protect-privacy/) del 25 de mayo de 2018.

#### Modo de desarrollo

Para las aplicaciones en modo de desarrollo, las llamadas a la API devolverán datos de usuario solo si la persona tiene un rol en la aplicación (por ejemplo, administrador, desarrollador o evaluador). Esto se aplica a API de perfil de Facebook, de páginas y de otro tipo. Lee la [entrada de blog](https://developers.facebook.com/blog/post/2018/04/24/new-facebook-platform-product-changes-policy-updates/) del 24 de abril de 2018.

Las aplicaciones en modo de desarrollo ahora se limitan en frecuencia a 200 llamadas por hora, por par página-aplicación, y solo los usuarios con un rol en la aplicación (administrador, desarrollador o evaluador) pueden obtener acceso. Consulta los gráficos sobre la actividad de limitación de frecuencia de tu aplicación en el [panel de aplicaciones](https://developers.facebook.com/apps/). Los desarrolladores y los administradores de aplicaciones en el modo público solo pueden acceder a los permisos que se aprobaron para la aplicación.

Es conveniente que los desarrolladores tengan estas limitaciones en cuenta al desarrollar nuevas funciones para sus aplicaciones.

### Herramientas y referencias importantes

- Si los cambios recientes afectaron la aplicación o el sitio web y deseas que Facebook revise una remisión, utiliza este formulario: [https://go.fb.com/2018-FB4D-platform-review-form.html](https://go.fb.com/2018-FB4D-platform-review-form.html).
- Para obtener más información sobre el proceso de revisión de aplicaciones, así como las API y los permisos para los que se requiere una revisión, visita: [https://developers.facebook.com/docs/apps/review](https://developers.facebook.com/docs/apps/review).
- La [herramienta de actualización de API](https://developers.facebook.com/docs/graph-api/advanced/api-upgrade-tool/) permite evaluar el impacto de la migración al nivel de API Graph más alto o reciente. Para ver las llamadas a la API de la aplicación que se verán afectadas por los cambios en las versiones más recientes de la API, ve a [https://developers.facebook.com/tools/api_versioning/](https://developers.facebook.com/tools/api_versioning/).
- Para comprobar el estado operativo del inicio de sesión con Facebook y ver ejemplos de códigos que el inicio de sesión con Facebook puede devolver según los permisos, ve a la aplicación de ejemplo en [fbrell.com](http://fbrell.com).
- Para seguir los cambios más recientes en la API Graph:
  - Registro de cambios: [https://developers.facebook.com/docs/graph-api/changelog](https://developers.facebook.com/docs/graph-api/changelog)
  - Cambios radicales: [https://developers.facebook.com/docs/graph-api/changelog/breaking-changes](https://developers.facebook.com/docs/graph-api/changelog/breaking-changes)
```