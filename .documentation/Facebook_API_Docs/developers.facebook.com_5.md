# API Documentation

**Source URL:** https://developers.facebook.com/docs/graph-api/webhooks/
**Scraped Date:** 2025-11-12 14:09:59

---



## Page: https://developers.facebook.com/docs/graph-api/webhooks/

```markdown
# Webhooks de Meta

Los webhooks te permiten recibir notificaciones HTTP en tiempo real sobre cambios en objetos específicos en la gráfica social de Meta. Por ejemplo, podríamos enviarte una notificación cuando cualquiera de los usuarios de tu app cambie su dirección de correo electrónico o comente en tu página de Facebook. De esta manera, no tendrás que realizar consultas a la API Graph para obtener información sobre los cambios que se pudieron producir realmente en los objetos o no. Además, podrás evitar alcanzar el [límite de frecuencia](/docs/graph-api/advanced/rate-limiting).

Los pasos que hay que seguir para configurar los [webhooks para pagos](/docs/games_payments/webhooks) y los [webhooks para Messenger](/docs/messenger-platform/webhook) son ligeramente diferentes. Si vas a configurar un webhook en cualquiera de estos productos, consulta las instrucciones de configuración en la respectiva documentación.

## Objetos, campos y valores

Hay muchos tipos de objetos en la gráfica social de Meta, como los de usuario o los de páginas, por lo que el primer paso que debes seguir a la hora de configurar un webhook es **elegir un tipo de objeto**. Dado que los distintos objetos cuentan con campos diferentes, el siguiente paso es **suscribirte a los campos específicos** de ese tipo de objeto. Te enviaremos un notificación cada vez que se produzca un **cambio en el valor** de cualquiera de los campos de objeto a los que te hayas suscrito.

Las notificaciones se envían como solicitudes HTTP POST e incluyen una carga JSON con la que se describe el cambio. Por ejemplo, supongamos que configuras un webhook `User` y te suscribes al campo `Photos`. Si uno de los usuarios de tu app subiera una foto, te enviaríamos una notificación parecida a esta:

#### Ejemplo de notificación

```json
{
  "entry": [
    {
      "time": 1520383571,
      "changes": [
        {
          "field": "photos",
          "value": {
            "verb": "update",
            "object_id": "10211885744794461"
          }
        }
      ],
      "id": "10210299214172187",
      "uid": "10210299214172187"
    }
  ],
  "object": "user"
}
```

## Servidor HTTPS

Los webhooks se envían por medio de HTTPS, por lo cual tu servidor debe ser capaz de recibir y procesar solicitudes HTTPS, y debe tener instalado un certificado TLS/SSL válido. No se admiten certificados autofirmados.

## Revisión de apps

Los webhooks no requieren la [revisión de apps](/docs/apps/review/). Sin embargo, para recibir notificaciones de los webhooks relativas a cambios en los objetos cuando tu app está en modo activo, es necesario que la app cuente con los permisos pertinentes otorgados para acceder a dichos objetos. Consulta los [permisos](#permisos) a continuación.

## Permisos

En general, para que una app pueda estar disponible públicamente, primero debe pasar por una revisión de apps. Durante la revisión, las apps pueden solicitar la aprobación de permisos específicos, que controlan los tipos de datos a los que una app puede acceder cuando se usa la API Graph.

Aunque el producto Webhooks no requiere la revisión de apps, sí se rige por permisos. Esto significa que, aunque configures un webhook y te suscribas a campos específicos de un tipo de objeto, no recibirás notificaciones de los cambios que se hagan en un objeto de ese tipo, excepto que se den las siguientes condiciones:

- Tu app debe tener aprobados los permisos que corresponden a ese tipo de datos.
- El objeto al que le corresponden los datos debe haber otorgado permiso a tu app para acceder a esos datos (p. ej., un usuario permite que la app acceda al feed).

## Modo de desarrollo

Las apps en [modo de desarrollo](/docs/apps#development-mode) solo pueden recibir notificaciones de prueba iniciadas a través del panel de apps o notificaciones iniciadas por personas que tienen un rol en la app.

Ten presente que, para los eventos de webhooks de Messenger, el comportamiento del modo de desarrollo es diferente. Para obtener más información, consulta el documento [Webhooks para Messenger](/docs/messenger-platform/webhook#development-mode).

## Configuración

A fin de usar webhooks, debes configurar un extremo en un servidor (HTTPS) seguro y, a continuación, agregar el producto Webhooks al panel de app y configurarlo. El resto de estos documentos explican cómo completar ambos pasos.

¿Todo listo? [¡Empecemos!](/docs/graph-api/webhooks/getting-started)

## Más información

- Infórmate sobre cómo recibir notificaciones cuando se pasa una conversación de una app a otra usando el [protocolo de traspaso de Messenger](https://developers.facebook.com/docs/messenger-platform/handover-protocol/#subscribe-to-webhook-events).
```



## Page: https://developers.facebook.com/docs/apps/review/

### [Content](/docs/resp-plat-initiatives/app-review/content)



## Page: https://developers.facebook.com/docs/graph-api/webhooks/sample-apps

```markdown
# Apps de ejemplo

Ofrecemos [apps de ejemplos en GitHub](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffbsamples%2Fgraph-api-webhooks-samples&amp;h=AT3K8W54klEBKbE71FZFbnDISX7DhEHAXgxZ4nHeR01Gq-GAd-GwTTl556SKqjasy83n21arvkHsvjNx-uTtkFhO0FVqm3YITwBTvPbSQmJJNGXIwFpGso9f4Qs_QQ8mDiWnPxNoyvsMTpzu9MEq6n6cGnA) que puedes configurar y reutilizar, o emplear en pruebas rápidas de tu configuración de webhooks.

## Configuración de la app de ejemplo

Veamos el proceso de configuración de una app de ejemplo en [Heroku](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.heroku.com%2F&amp;h=AT3euN0Prfr_1W9__cNFmYIP829g2h1z-TvL_l7BS0y69BvZPTqeyG6UCNxmZXcYNmLhefFcLpwLbY1jAUk33Pjw74Y7xPL3_asDat0SZ8wnmgX8GGgVG84HBJDhAmTvrd7VtK1I31kcV7rvYlkve1XwUIA):

1. Si no tienes ya una cuenta de Heroku, crea una gratis e inicia sesión.
2. Con la sesión iniciada, dirígete a [GitHub](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffbsamples%2Fgraph-api-webhooks-samples%2Ftree%2Fmaster%2Fheroku&amp;h=AT2pNlPGKEljY3TTOgoeRBm15MvfumCVaK7cQL9vYw39VsnN-16Zn3wt-Dz1J5DLBqfEgqlWEUjkNQbzc6YpmNTL6uNt6VXL3D1g3hmGEKkW0WjGPu1MTCLPR_glaZmP3f6W6SRNRrNBZ8s0JL_gLLtAOWw) e implementa la app en Heroku. El nombre de la app que elijas formará parte de tu URL de devolución de llamadas. Por ello, debes elegir algo que te sea fácil recordar. La implementación llevará unos segundos.
3. En una pestaña del navegador, dirígete a la configuración del [panel de apps](/apps) de tu app y copia su clave secreta.
4. En la configuración de la app de Heroku, establece dos variables de configuración: `APP_SECRET` y `TOKEN`. Asigna (pega) la clave secreta de la app a la variable de configuración `APP_SECRET` y asigna cualquier cadena a `TOKEN`. Incluiremos esta cadena en las solicitudes de verificación cuando configures el producto de webhooks en el panel de apps (la app validará la solicitud por su cuenta).

Con esto, la app debería estar lista. Antes de regresar al panel de apps para [configurar el producto de webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#configure-webhooks-product):

- Visualiza la app de Heroku en un navegador web. Podrás ver una matriz vacía (`[]`). En esta página se mostrará datos de notificaciones de actualización recibidas recientemente. Por ello, debes volver a cargarla durante la prueba.
- La URL de devolución de llamadas de tu app será la URL de la app de Heroku con `/facebook` agregado al final. Necesitarás esta URL de devolución de llamadas durante la configurador del producto.
- Copia el valor `TOKEN` que configuraste antes; también lo necesitarás durante la configuración del producto.

#### ¿Qué contiene la app de ejemplo de Heroku?

La app usa Node.js y estos paquetes:

- `body-parser` (para análisis de JSON)
- `express` (para rutas)
- `express-x-hub` (para compatibilidad con SHA1)

## Verificar la app de ejemplo

Puedes verificar fácilmente que la app de ejemplo pueda recibir eventos de webhooks.

1. En el producto de **webhooks** del panel de apps, haz clic en el botón **Test** para cualquiera de los campos del webhook.
2. Aparecerá un cuadro de diálogo emergente que mostrará un ejemplo de lo que se enviará. Haz clic en **Send to My Server**.
3. Ahora podrás ver la información de webhooks en la URL de la app de Heroku o usar `curl https://<your-subdomain>.herokuapp.com` en una ventana de terminal.
```



## Page: https://developers.facebook.com/docs/graph-api/webhooks/getting-started

```markdown
# Primeros pasos con webhooks

En este documento, se explica cómo configurar un webhook que te notificará cuando los usuarios de tu app publiquen un cambio en sus fotos de usuario. Cuando entiendas cómo configurar este webhook, sabrás cómo configurar los demás.

Para configurar cualquier webhook, debes hacer lo siguiente:

1. [Crear un punto de conexión](#create-endpoint) en un servidor seguro que pueda procesar solicitudes HTTPS.
2. [Configurar el producto Webhooks](#configure-webhooks-product) en el panel de apps de tu app.

Estos pasos se explican de manera detallada a continuación.

## Crear un punto de conexión

This step must be completed before you can subscribe to any webhook fields in the App Dashboard.

Your endpoint must be able to process two types of HTTPS requests: [Verification Requests](#verification-requests) and [Event Notifications](#event-notifications). Since both requests use HTTPs, your server must have a valid TLS or SSL certificate correctly configured and installed. Self-signed certificates are not supported.

The sections below explain what will be in each type of request and how to respond to them. Alternatively, you can use our [sample app](https://developers.facebook.com/docs/graph-api/webhooks/sample-apps) which is already configured to process these requests.

### Solicitudes de verificación

Anytime you configure the Webhooks product in your App Dashboard, we'll send a `GET` request to your endpoint URL. Verification requests include the following query string parameters, appended to the end of your endpoint URL. They will look something like this:

#### Sample Verification Request

```
GET https://www.your-clever-domain-name.com/webhooks?
  hub.mode=subscribe&
  hub.challenge=1158201444&
  hub.verify_token=meatyhamhock
```

| Parameter               | Sample Value       | Description                                                                                     |
|-------------------------|--------------------|-------------------------------------------------------------------------------------------------|
| `hub.mode`              | `subscribe`        | This value will always be set to `subscribe`.                                                  |
| `hub.challenge`         | `1158201444`       | An `int` you must pass back to us.                                                             |
| `hub.verify_token`      | `meatyhamhock`     | A string that we grab from the **Verify Token** field in your app's App Dashboard. You will set this string when you complete the [Webhooks configuration settings](#configure-webhooks-product) steps. |

**Note:** [PHP converts periods (.) to underscores (_) in parameter names](https://l.facebook.com/l.php?u=http%3A%2F%2Fwww.php.net%2Fmanual%2Fen%2Flanguage.variables.external.php&h=AT38VuLtsABBctCuqQLIAmJeRJ1v2U7MRMDAeDJ3VbT_5UfmoZisHK9bRDBhLOKY9vTaMw-28WwiJN114KQK4DkH53ifjXgYn9otaMiL7Reol3EISr7buarHm9n7g6mJUlOaQ8C6OPL27FCO65lohEv3zwM).

#### Validating Verification Requests

Whenever your endpoint receives a verification request, it must:

- Verify that the `hub.verify_token` value matches the string you set in the **Verify Token** field when you [configure the Webhooks product](#configure-webhooks-product) in your App Dashboard (you haven't set up this token string yet).
- Respond with the `hub.challenge` value.

If you are in your App Dashboard and configuring your Webhooks product (and thus, triggering a Verification Request), the dashboard will indicate if your endpoint validated the request correctly. If you are using the Graph API's [/app/subscriptions endpoint](https://developers.facebook.com/docs/graph-api/reference/app/subscriptions) to configure the Webhooks product, the API will indicate success or failure with a response.

### Notificaciones de eventos

When you configure your Webhooks product, you will subscribe to specific `fields` on an `object` type (e.g., the `photos` field on the `user` object). Whenever there's a change to one of these fields, we will send your endpoint a `POST` request with a JSON payload describing the change.

For example, if you subscribed to the `user` object's `photos` field and one of your app's Users posted a Photo, we would send you a `POST` request that would look something like this:

```
POST / HTTPS/1.1
Host: your-clever-domain-name.com/webhooks
Content-Type: application/json
X-Hub-Signature-256: sha256={super-long-SHA256-signature}
Content-Length: 311

{
  "entry": [
    {
      "time": 1520383571,
      "changes": [
        {
          "field": "photos",
          "value":
            {
              "verb": "update",
              "object_id": "10211885744794461"
            }
        }
      ],
      "id": "10210299214172187",
      "uid": "10210299214172187"
    }
  ],
  "object": "user"
}
```

#### Payload Contents

Payloads will contain an object describing the change. When you [configure the webhooks product](#configure-webhooks-product), you can indicate if payloads should only contain the names of changed fields, or if payloads should include the new values as well.

We format all payloads with JSON, so you can parse the payload using common JSON parsing methods or packages.

You will not be able to query historical webhook event notification data, so be sure to capture and store any webhook payload content that you want to keep.

Most payloads will contain the following common properties, but the contents and structure of each payload varies depending on the object fields you are subscribed to. Refer to each object's [reference](https://developers.facebook.com/docs/graph-api/webhooks/reference) document to see which fields will be included.

| Property               | Description                                                                                     | Type    |
|------------------------|-------------------------------------------------------------------------------------------------|---------|
| `object`               | The object's type (e.g., `user`, `page`, etc.)                                                | `string`|
| `entry`                | An array containing an object describing the changes. Multiple changes from different objects that are of the same type may be batched together. | `array` |
| `id`                   | The object's ID                                                                                | `string`|
| `changed_fields`       | An array of strings indicating the names of the fields that have been changed. Only included if you *disable* the **Include Values** setting when configuring the Webhooks product in your app's App Dashboard. | `array` |
| `changes`              | An array containing an object describing the changed fields and their new values. Only included if you *enable* the **Include Values** setting when configuring the Webhooks product in your app's App Dashboard. | `array` |
| `time`                 | A UNIX timestamp indicating when the Event Notification was sent (not when the change that triggered the notification occurred). | `int`   |

#### Validating Payloads

We sign all Event Notification payloads with a **SHA256** signature and include the signature in the request's `X-Hub-Signature-256` header, preceded with `sha256=`. You don't have to validate the payload, but you should.

To validate the payload:

1. Generate a **SHA256** signature using the payload and your app's **App Secret**.
2. Compare your signature to the signature in the `X-Hub-Signature-256` header (everything after `sha256=`). If the signatures match, the payload is genuine.

#### Responding to Event Notifications

Your endpoint should respond to all Event Notifications with `200 OK HTTPS`.

#### Frequency

Event Notifications are aggregated and sent in a batch with a **maximum** of 1000 updates. However batching cannot be guaranteed so be sure to adjust your servers to handle each Webhook individually.

If any update sent to your server fails, we will retry immediately, then try a few more times with decreasing frequency over the next 36 hours. Your server should handle deduplication in these cases. Unacknowledged responses will be dropped after 36 hours.

Note: The frequency with which Messenger event notifications are sent is different. Please refer to the [Messenger Platform Webhooks documentation](https://developers.facebook.com/docs/messenger-platform/webhook/) for more information.

## Configuración del producto Webhooks

Una vez que el punto de conexión o la app de ejemplo estén listos, usa el [panel de apps](https://developers.facebook.com/apps/) de tu app para agregar y configurar el producto Webhooks. También puedes hacer esto de manera programática mediante el [punto de conexión `/{app-id}/subscriptions`](https://developers.facebook.com/docs/graph-api/reference/application/subscriptions) para todos los webhooks, a excepción de [Instagram](https://developers.facebook.com/docs/instagram-api/guides/webhooks).

En este ejemplo, utilizaremos el panel para configurar un webhook que se suscribe a cualquier cambio en las fotos de cualquiera de los usuarios de tu app.

1. En el panel de apps, ve a **Productos** > **Webhooks**, selecciona **Usuario** en el menú desplegable y, a continuación, haz clic en **Suscribirse a este objeto**.  
   ![Selección del objeto del usuario.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/28578042_231932047352922_7562214390548660224_n.png?_nc_cat=106&ccb=1-7&_nc_sid=e280be&_nc_ohc=XiT4JFrVQRYQ7kNvwEuiEu4&_nc_oc=AdnPLxygsk5jTAN-J47IfSWJGJ9dRnoNv0I-tfCe_PtPzSmxRVk8aEf0p7Qc34_BNSU&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=gBmnwdodv3epXniGLTvNOA&oh=00_AfgvbUHud3js47HuXAIKkHtAHFQIZb90tSgN7Y-ct1AQGw&oe=692F04FA)

2. Ingresa la URL del punto de conexión en el campo **URL de devolución de llamada** y una cadena en el campo **Token de verificación**. Incluiremos esta cadena en todas las [solicitudes de verificación](#verification-requests). Si usas una de nuestras apps de ejemplo, debe ser la misma cadena que usaste para la variable de configuración `TOKEN`.

   Si quieres que las cargas de notificación del evento incluyan los nombres de los campos que cambiaron además de los nuevos valores, define la opción **Incluir valores** en **Sí**.

   ![Ingreso de una URL de punto de conexión y una cadena de token de verificación.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/462471860_448197304391133_813294172064657596_n.png?_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=UfK4n_dHuD8Q7kNvwEAmrLE&_nc_oc=AdmSg2A547yNgY_2sPh8unt-pm7bPW2w7GgrOkpSkf9Y3nbUCZy1Wzhc3lmackiUXwE&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=gBmnwdodv3epXniGLTvNOA&oh=00_AfhKDxw4BbiO1Lwc8c7KKrajEN6ZEy53GRrsm93jkD1E-g&oe=692F15AF)

3. Luego de hacer clic en **Verificar y guardar**, enviaremos al punto de conexión una solicitud de verificación que debes [validar](#validate-requests). Si el punto de conexión valida exitosamente la solicitud, deberías ver esto:

   ![Validación exitosa.](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/28578201_353858248459965_4983102755687104512_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=SHz0VOa4R0YQ7kNvwHGJOIb&_nc_oc=Adkh3wKcCquVJUBSWE3OXI8NseweBwhhJHXsnLNsr_7EaabX3jxLuWMALMSEXHwPlqM&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=gBmnwdodv3epXniGLTvNOA&oh=00_Afi5ZAlyXAEiD1gK--cftH13gXU5Qbot3Ldwq8vAKq7zLA&oe=692F09D1)

4. El último paso consiste en suscribirse a campos individuales. Suscríbete al campo `photos` y envía una notificación de evento de prueba.

   ![Suscripción al campo "Fotos" en el objeto "Usuario".](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/28578275_637235979960743_9002663837995892736_n.png?_nc_cat=109&ccb=1-7&_nc_sid=e280be&_nc_ohc=uqsJ_UWGiSQQ7kNvwG6uYlN&_nc_oc=AdnWzuNH20nFooBQtbSuaX7EXWEa8qm3lhSSVfRUOeLBoNn5KcSAQwE9x2FR0oC8UoY&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=gBmnwdodv3epXniGLTvNOA&oh=00_AfibZNXGY0WE0IapxKLyD2dfF47XiYWM-A119SqdAICBzA&oe=692EF9D4)

   Si el punto de conexión está configurado correctamente, debería [validar la carga](#validate-payloads) y ejecutar el código que hayas configurado para que se ejecute después de una validación exitosa. Si usas nuestra [app de ejemplo](https://developers.facebook.com/docs/graph-api/webhooks/sample-apps), carga la URL de la app en el navegador web. Debería mostrar el contenido de la carga:

   ![App de ejemplo que muestra la carga de notificación de prueba.](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/28967070_176977706438684_6537686724187783168_n.png?_nc_cat=109&ccb=1-7&_nc_sid=e280be&_nc_ohc=IvhEuCy2k0oQ7kNvwHhk1y5&_nc_oc=Adn1EJOqmSORzc0UOy69jd3udU7_D-ESsKSvqoltVdayUNQEnR9zBlteJ_SQG5qiJto&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=gBmnwdodv3epXniGLTvNOA&oh=00_Afhe4qoDEG0I1TzRKRJDK_x2eus8ztfMiKnWhlsr40RAPw&oe=692F1E70)

## mTLS for Webhooks

Mutual TLS (mTLS) is a method for mutual authentication.

mTLS ensures that the parties at each end of a network connection are who they claim to be by verifying that they both have the correct private key. The information within their respective TLS certificates provides additional verification.

### How to configure mTLS

Once you enable mTLS on your subscription to WhatsApp Business Account, Meta will present a client certificate together with its signing intermediate certificate. Both certificates are used to create a TLS handshake of Webhook requests to your server. Your server then can verify the sender’s identity of these requests by the trust chain and the common name (CN).

The client certificate is signed by an intermediate CA certificate, DigiCert SHA2 High Assurance Server CA, and then by a root CA certificate, DigiCert High Assurance EV Root CA. Note that the intermediate certificate also signs the certificate for graph.facebook.com:

### Client Certificate Verification

After setting up HTTPS for receiving Webhook requests, complete the following steps to verify the client certificate and its common name `client.webhooks.fbclientcerts.com`:

1. Install the root certificate
2. Verify the client certificate against the root certificate
3. Verify the common name (`client.webhooks.fbclientcerts.com`) of the client certificate

Note: Servers receiving Webhooks must be using HTTPS; and we are always verifying the certificate from your HTTPS server for security.

#### Example

Depending on your server’s setup, the above steps vary in details. We illustrate by two examples, one for Nginx and one for AWS Application Load Balancer (ALB).

#### Nginx

1. Download the root certificate (DigiCert High Assurance EV Root CA) from DigiCert to your server, e.g. `/etc/ssl/certs/DigiCert_High_Assurance_EV_Root_CA.pem`
2. Turn on mTLS by Nginx directives ([example screenshot](https://l.facebook.com/l.php?u=https%3A%2F%2Fpxl.cl%2F5tpBv&h=AT05BgOl0hZdaJC6rqgFcCbxialjCDo1aqK36X0xbuWPw56pCQU2ppTXVlKu0ZH01evpsk44BfFTqp560OHGiFeOv6wpDBMfHZTLkMSKBxnL3ccz2e9OGkybTriLswFdhFssKGAiSeHXFyu23EeW6rZpi4HEsehwVAi3T4J3))

   ```
   ssl_verify_client       on;
   ssl_client_certificate  /etc/ssl/certs/DigiCert_High_Assurance_EV_Root_CA.pem;
   ssl_verify_depth        3;
   ```

3. Verify the CN from Nginx embedded variable `$ssl_client_s_dn` equals `"client.webhooks.fbclientcerts.com"` ([example screenshot](https://l.facebook.com/l.php?u=https%3A%2F%2Fpxl.cl%2F5tqMx&h=AT1VPrs8XsEGDVkhYU6bNxBoN-gdU-hSR67CDLH11i5ztoxh9akjfTDfG5Kxp9P-0DZ8UB8tAL3cI15yWcSwjcbqUcMhZRMr6ESKPBFE4K9lPnqkZCOxVRgxJzGDFcxMw65eKC6Wz4eHv2ER79i1WJkT5UpaXkCKvGUwd7FE))

   ```
   if ($ssl_client_s_dn ~ "CN=client.webhooks.fbclientcerts.com") {
       return 200 "$ssl_client_s_dn";
   }
   ```

#### AWS Application Load Balancer (ALB)

1. Download the intermediate certificate (DigiCert SHA2 High Assurance Server CA) from [DigiCert](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.digicert.com%2Fkb%2Fdigicert-root-certificates.htm&h=AT0Vibys8rl0pAeVxSU2U0n7H4z5gKxpEUZ9zIZmVWfpe8cjHwOp6uMr6P6Hmc_Ar1E3WN9n0Hmtlf_uM6BN9gmyofeXSKrF3c7m2s-P412AgyAG7kPOozZV66I9iv1TjboRBx-kMWmt-kZfUW62cLNaGQ8) to a S3 bucket. The root certificate is [not accepted by AWS](https://l.facebook.com/l.php?u=https%3A%2F%2Faws.amazon.com%2Fsecurity%2Fsecurity-bulletins%2Faws-to-switch-to-sha256-hash-algorithm-for-ssl-certificates%2F&h=AT2yJ8kC2L6A4Db68LqoKkBxN5pcvIvTEx3VYHpl3uU1XE3DC435mCLUW_0T3b7NmKLPxB1mGDkaFLfjWIKa-byKlx6fbrEMG_LOccoGR-KqM5r-L_RzkP3oI46RYg8ob-xc2clj1itsUMbENSj93zPjPVM) because it is signed using algorithm SHA1withRSA; while the intermediate certificate is signed using SHA256withRSA thereby accepted.
2. Configure the HTTPS listener on the ALB to enable mTLS with the trust store containing the certificate in the S3 bucket ([example screenshot](https://l.facebook.com/l.php?u=https%3A%2F%2Fpxl.cl%2F5tqzs&h=AT1rQllk7P8_pIm8xovP-fZr0RcGdcdDybMMCVwFkTbrIyx62A1KIZu6BEojJ_ltij2DbThHBjNVnrBHFYtZBIeR7w7PpAgGt3Oa5viJ4b2gW1i5kxjSc1-jBIY3zC7bUG-Bui7dalQNzKJBKFYABZRTsx0)).
3. In your application code, extract the CN from the HTTP header [“X-Amzn-Mtls-Clientcert-Subject”](https://l.facebook.com/l.php?u=https%3A%2F%2Fdocs.aws.amazon.com%2Felasticloadbalancing%2Flatest%2Fapplication%2Fmutual-authentication.html&h=AT0g8pTYcQnnsh1zDht1oKGrqrFXQ7J129XTjQ0_PwJg2gReoTFICHIhcgBana1KiuUFiE5N_Nm_v_ZozPamdXiJXo9eu56JTjKlwSFGer5wSwRAw7ZW2l1NHdXx9P9GJppcZzzNCdRH1BpRV-diWh6j1aw), and verify it equals “client.webhooks.fbclientcerts.com”.

## Próximos pasos

Ahora que sabes cómo configurar webhooks, quizás te resulte conveniente consultar nuestros documentos complementarios, donde se describen los pasos adicionales necesarios para configurar webhooks para productos específicos:

- [Webhooks para cuentas publicitarias](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-ad-accounts)
- [Webhooks para transparencia de certificados](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-certificate-transparency)
- [Webhooks para Instagram](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-instagram)
- [Webhooks para clientes potenciales](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen)
- [Webhooks para Messenger](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-messenger)
- [Webhooks para páginas](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages)
- [Webhooks para pagos](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-payments)
- [Webhooks para WhatsApp](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-whatsapp)
```



## Page: https://developers.facebook.com/docs/graph-api/advanced/rate-limiting

```markdown
# Límites de frecuencia

Un límite de frecuencia es el número de llamadas a la API que puede realizar una app o un usuario en un período determinado. Si se supera este límite o los límites de CPU o de tiempo total, es posible que se aplique una restricción a la app o al usuario. Las solicitudes a la API hechas por un usuario o una app a los que se aplicó una limitación no funcionarán.

Todas las llamadas a la API están sujetas a límites de frecuencia. Las solicitudes a la API Graph están sujetas a los [límites de frecuencia de la plataforma](#platform-rate-limits), mientras que las solicitudes a la API de marketing y a la plataforma de Instagram están sujetas a los [límites de frecuencia de caso de uso comercial (BUC)](#buc-rate-limits).

Las solicitudes a la API de páginas están sujetas a los límites de frecuencia de la plataforma o de BUC en función del token utilizado en la solicitud: las solicitudes realizadas con tokens de acceso de la [aplicación](https://developers.facebook.com/docs/facebook-login/access-tokens#apptokens) o de [usuario](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) están sujetas a los límites de frecuencia de la plataforma, mientras que las solicitudes realizadas con tokens de [usuario de sistema](https://developers.facebook.com/docs/marketing-api/businessmanager/systemuser#generate-token) o de [acceso a la página](https://developers.facebook.com/docs/facebook-login/access-tokens#pagetokens) están sujetas a los límites de frecuencia de BUC.

Las estadísticas de uso de límites de frecuencia en tiempo real se describen en los encabezados incluidos en la mayoría de las respuestas de la API una vez que se realizó un número de llamadas suficiente a un extremo. Las estadísticas de uso de límites de frecuencia de la plataforma también se muestran en el [panel de apps](https://developers.facebook.com/apps/). Una vez alcanzado el límite de frecuencia, todas las solicitudes posteriores realizadas por la app producen un error, y la API devuelve un código de error hasta que haya pasado el tiempo necesario para que el recuento de llamadas se ubique por debajo del límite.

En los casos en los que es posible aplicar límites de frecuencia de la plataforma y de BUC a una solicitud, se aplican los límites de frecuencia de BUC.

## Límites de frecuencia de la plataforma

Los límites de frecuencia de la plataforma se someten a seguimiento en el nivel de cada app o usuario, en función del tipo de token utilizado en la solicitud.

### Aplicaciones

Las solicitudes de la API Graph realizadas con [token de acceso de la aplicación](https://developers.facebook.com/docs/facebook-login/access-tokens#apptokens) se tienen en cuenta para el límite de frecuencia de esa app. Este recuento de llamadas es el número de llamadas que una app puede realizar durante un intervalo móvil de una hora y se calcula de la siguiente manera:

```
Calls within one hour = 200 * Number of Users
```

El número de usuarios se basa en el número de usuarios activos por día únicos que tiene la app. En los casos en los que hay períodos con un uso diario menor (por ejemplo, si una app tiene mucha actividad los fines de semana y menos actividad los demás días), se utilizan los usuarios activos por semana y por mes para calcular la cantidad de usuarios de la app. Las apps con un nivel de interacción diario alto tienen límites de frecuencia superiores a los de aquellas con menos interacción, independientemente de la cantidad efectiva de instalaciones de la app.

Ten presente que no se trata de un límite por usuario, sino de un límite a las llamadas realizadas por tu app. Cada usuario puede hacer más de 200 llamadas por hora con tu app, siempre y cuando el total de llamadas de la app no supere el máximo permitido para la app. Por ejemplo, si tu app tiene 100 usuarios, puede hacer 20.000 llamadas por hora. Sin embargo, es posible que 19.000 de esas llamadas correspondan a tus 10 usuarios más activos.

### Usuarios

Las solicitudes a la API Graph realizadas con un [token de acceso de usuario](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) se tienen en cuenta para el recuento de llamadas de ese usuario. Ese recuento de llamadas es el número de llamadas que puede realizar el usuario durante un intervalo continuo de una hora. Por motivos relacionados con la privacidad, no revelamos los valores reales del recuento de llamadas de los usuarios.

Ten presente que el recuento de llamadas de un usuario puede distribuirse en varias apps. Por ejemplo, un usuario puede hacer X llamadas mediante App1 e Y llamadas mediante App2. Si X+Y supera el recuento de llamadas máximo, se aplica un límite de frecuencia al usuario. Eso no significa necesariamente que haya un problema en la app. Es posible que el usuario esté utilizando varias apps o que esté utilizando la API incorrectamente.

### Encabezados

Los puntos de conexión que reciban una cantidad suficiente de llamadas de la app incluyen un encabezado HTTP `X-App-Usage` o `X-Ad-Account-Usage` (en el caso de las llamadas a la versión 3.3 o versiones anteriores de la API de anuncios) en sus respuestas. El encabezado contiene una cadena con formato JSON que describe el uso del límite de frecuencia de la app actual.

#### Contenido del encabezado

| Clave                | Descripción del valor                                                                 |
|----------------------|--------------------------------------------------------------------------------------|
| `call_count`         | Un número entero que expresa el porcentaje de llamadas que hizo tu app en un período continuo de una hora. |
| `total_cputime`      | Un número entero que expresa el porcentaje de tiempo de CPU asignado al procesamiento de consultas. |
| `total_time`         | Un número entero que expresa el porcentaje de tiempo total asignado al procesamiento de consultas. |

#### Contenido de encabezado X-Ad-Account-Usage

| Clave                        | Descripción del valor                                                                 |
|------------------------------|--------------------------------------------------------------------------------------|
| `acc_id_util_pct`           | El porcentaje de llamadas realizadas de esta cuenta publicitaria antes de alcanzar la limitación de frecuencia. |
| `reset_time_duration`       | La duración (en segundos) que se tarda en restablecer la limitación de frecuencia actual a 0. |
| `ads_api_access_tier`      | Los niveles permiten que la app acceda a la API de marketing. De modo predeterminado, las apps se ubican en el nivel `development_access`, mientras que el `Standard_access` permite lograr una limitación de frecuencia menor. Para obtener una limitación de frecuencia más alta y llegar al nivel estándar, puedes solicitar el "Acceso Avanzado" a la característica [Acceso estándar de gestión de anuncios](https://developers.facebook.com/docs/marketing-api/overview/authorization#layer-2--access-levels--permissions--and-features). |

#### Tiempo de CPU total

La cantidad de tiempo de CPU total necesaria para procesar la solicitud. Cuando `total_cputime` llega a 100, es posible que se aplique un límite a las llamadas.

#### Tiempo total

El tiempo total necesario para procesar la solicitud. Cuando `total_time` llega a 100, es posible que se aplique un límite a las llamadas.

#### Valor de ejemplo de encabezado X-App-Usage

```json
x-app-usage: {
    "call_count": 28,         // Percentage of calls made 
    "total_time": 25,         // Percentage of total time
    "total_cputime": 25       // Percentage of total CPU time
}
```

#### Valor de ejemplo de encabezado X-Ad-Account-Usage

```json
x-ad-account-usage: {
    "acc_id_util_pct": 9.67,   // Percentage of calls made for this ad account.
    "reset_time_duration": 100, // Time duration (in seconds) it takes to reset the current rate limit score.
    "ads_api_access_tier": 'standard_access' // Tiers allows your app to access the Marketing API. standard_access enables lower rate limiting.
}
```

### Panel

El [panel de apps](https://developers.facebook.com/apps/) muestra el número de usuarios de la app a los que se aplicó un límite de frecuencia, el porcentaje actual de uso de los límites de frecuencia de la app. Además, muestra la actividad promedio de los últimos siete días. En la tarjeta **Límite de frecuencia de la aplicación**, haz clic en **Ver detalles** y pasa el mouse por cualquier punto del gráfico para ver más detalles sobre el uso en ese momento. Como el uso depende del volumen de llamadas, es posible que el gráfico no muestre siete días. Las apps con un volumen de llamadas mayor muestran más días.

### Códigos de error

Si una app o un usuario alcanza su límite de frecuencia, las solicitudes realizadas por esa app o ese usuario se completan, y la API responde con un código de error.

#### Códigos de error de limitación

| Código de error             | Descripción                                                                 |
|-----------------------------|-----------------------------------------------------------------------------|
| `4`                         | Indica que la app cuyo token se utiliza en la solicitud alcanzó su límite de frecuencia. |
| `17`                        | Indica que el usuario cuyo token se utiliza en la solicitud alcanzó su límite de frecuencia. |
| `17 with subcode 2446079`  | Indica que el token que se utiliza en la solicitud a la versión 3.3 o versiones anteriores de la API de anuncios alcanzó su límite de frecuencia. |
| `32`                        | Indica que el usuario o la app cuyo token se utiliza en la solicitud a la API de páginas alcanzó su límite de frecuencia. |
| `613`                       | Indica que se alcanzó un límite de frecuencia personalizado. Para resolver este problema, consulta la documentación de la API específica a la que realizas las llamadas, donde se presentan los límites de frecuencia personalizados que podrían aplicarse. |
| `613 with subcode 1996`    | Indica que detectamos un comportamiento incoherente en el volumen de solicitudes a la API de tu app. Si hiciste cambios recientemente que afecten la cantidad de solicitudes a la API, es posible que veas este error. |

#### Ejemplo de respuesta

```json
{
  "error": {
    "message": "(#32) Page request limit reached",
    "type": "OAuthException",
    "code": 32,
    "fbtrace_id": "Fz54k3GZrio"
  }
}
```

### Códigos de limitaciones de estabilidad de Facebook

| Código de error             | Descripción                                                                 |
|-----------------------------|-----------------------------------------------------------------------------|
| `throttled`                 | Si la consulta tiene limitación o no. Valores: `True`, `False`            |
| `backend_qps`               | Primer factor de limitación `backend_qps`. Valores admitidos:              |
|                             | - `actual_score`: `backend_qps` real de esta app. Valor: `8`              |
|                             | - `limit`: límite `backend_qps` de esta app. Valor: `5`                   |
|                             | - `more_info`: las consultas deben manejar un número grande de solicitudes de backend. Sugerimos enviar menos consultas o simplificar las consultas con rangos de tiempo menores, menos identificadores de objetos u otras alternativas. |
| `complexity_score`          | Segundo factor de limitación `complexity_score`. Valores admitidos:        |
|                             | - `actual_score`: `complexity_score` real de esta app. Valor: `0.1`       |
|                             | - `limit`: límite `complexity_score` de esta app. Valor: `0.01`           |
|                             | - `more_info`: un límite `complexity_score` elevado implica que tus solicitudes son muy complejas y solicitan grandes volúmenes de datos. Sugerimos simplificar las consultas con rangos de tiempo más cortos, menos identificadores de objetos, métricas o desgloses, y otras alternativas. Divide consultas grandes y complejas en varias más pequeñas y haz que estén espaciadas. |

### Prácticas recomendadas

- Si se alcanza el límite, deja de hacer llamadas a la API. Si sigues haciendo llamadas, el recuento de llamadas no dejará de aumentar, lo que incrementará la cantidad de tiempo que debe pasar antes de que las llamadas vuelvan a realizarse correctamente.
- Distribuye las consultas de forma pareja para evitar los picos de tráfico.
- Utiliza filtros a fin de limitar el tamaño de la respuesta de datos y evitar llamadas que requieren la superposición de datos.
- Consulta el encabezado HTTP `X-App-Usage` para determinar a qué distancia está la app del límite y cuándo puedes volver a hacer llamadas cuando se alcance el límite.
- Si se aplican limitaciones a los usuarios, asegúrate de que tu app no sea la causa. Reduce las llamadas del usuario o distribúyelas de forma más pareja a lo largo del tiempo.

## Límites de frecuencia de caso de uso comercial

Todas las solicitudes a la API de marketing y a la API de páginas realizadas con un token de usuario de sistema o de acceso a la página están sujetas a los límites de frecuencia de caso de uso comercial (BUC) y dependen de los extremos que consultes.

En el caso de la API de marketing, el límite de frecuencia se aplica a la cuenta publicitaria en el mismo caso de uso comercial. Por ejemplo, todos los puntos de conexión con el caso de uso comercial de la administración de anuncios compartirán la cuota total dentro de la misma cuenta publicitaria. Si un determinado punto de conexión realiza muchas solicitudes a la API y causa limitaciones, otros puntos de conexión configurados con el mismo caso de uso comercial también recibirán errores de limitación. La cuota depende del nivel de acceso de la API de marketing de la app. El nivel de acceso estándar de la API de marketing tendrá más cuotas que el nivel de acceso de desarrollo de la API de marketing. De manera predeterminada, una nueva app debería estar en el nivel de desarrollo. Si necesitas obtener más cuota de limitación de frecuencia, actualiza a acceso avanzado en [Acceso estándar de administración de anuncios](https://developers.facebook.com/docs/features-reference/ads-management-standard-access/) en la revisión de apps.

### Estadísticas de anuncios

Las solicitudes realizadas por tu app a la API de estadísticas de anuncios se toman en cuenta en las métricas de limitación de frecuencia de la app, como el recuento de llamadas, el tiempo total de CPU y el tiempo total. Este recuento de llamadas es el número de llamadas que una app puede realizar durante un intervalo continuo de una hora, y se calcula de la siguiente manera:

En el caso de apps con [acceso estándar](https://developers.facebook.com/docs/graph-api/overview/access-levels/#standard-access) a la función de acceso estándar de administración de anuncios:

```
Calls within one hour = 600 + 400 * Number of Active ads - 0.001 * User Errors
```

En el caso de las apps con [acceso avanzado](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access) a la función de acceso estándar de administración de anuncios:

```
Calls within one hour = 190000 + 400 * Number of Active ads - 0.001 * User Errors
```

El número de anuncios activos es el número de anuncios en circulación en cada cuenta publicitaria. Los errores de usuarios se refieren al número de errores recibidos al realizar llamadas a la API. A fin de obtener un límite de frecuencia más alto, puedes enviar una solicitud para usar la función de [acceso estándar a la administración de anuncios](https://developers.facebook.com/docs/marketing-api/overview/authorization#layer-2--access-levels--permissions--and-features).

La limitación de frecuencia también puede estar sujeta al tiempo total de CPU y al tiempo real transcurrido durante un intervalo continuo de una hora. Para obtener más detalles, consulta el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) HTTP `total_cputime` y `total_time`.

Si recibes errores de límite de frecuencia, también puedes consultar `estimated_time_to_regain_access` en el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) para conocer el tiempo estimado de bloqueo.

### Administración de anuncios

Las solicitudes realizadas por tu app a la API de administración de anuncios se toman en cuenta en las métricas limitación de frecuencia de esta, como el recuento de llamadas, el tiempo total de CPU y el tiempo total. Este recuento de llamadas es el número de llamadas que una app puede realizar durante un intervalo continuo de una hora, y se calcula de la siguiente manera:

En el caso de las apps con [acceso estándar](https://developers.facebook.com/docs/graph-api/overview/access-levels/#standard-access) a la función de acceso estándar de administración de anuncios:

```
Calls within one hour = 300 + 40 * Number of Active ads
```

En el caso de las apps con [acceso avanzado](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access) a la función de acceso estándar de administración de anuncios:

```
Calls within one hour = 100000 + 40 * Number of Active ads
```

El número de anuncios activos es el número de anuncios de cada cuenta publicitaria.

El límite de frecuencia también puede estar sujeto al tiempo total de CPU y al tiempo real transcurrido durante un intervalo continuo de una hora. Para obtener más detalles, consulta el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) HTTP `total_cputime` y `total_time`.

Si recibes errores de límite de frecuencia, también puedes consultar `estimated_time_to_regain_access` en el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) para conocer el tiempo estimado de bloqueo.

### Catálogo

#### Lote de catálogos

Las solicitudes que realiza tu app se descuentan de las métricas de limitación de frecuencia, como el recuento de llamadas, el tiempo total de CPU y el tiempo total que tu app puede hacer en un período continuo de un minuto por cada identificador del catálogo y se calcula de la siguiente manera:

```
Calls within one minute = 8 + 8 * log2(DA impressions + PDP visits)
```

"DA impressions" y "PDP visits" son el número de impresiones de anuncios dinámicos y visitas a la página de detalles del producto del catálogo individual con intención en los últimos 28 días. Cuantos más usuarios vean los productos de tu catálogo, mayor será la cuota de llamadas que se asigna.

| Tipo de llamada | Punto de conexión               |
|-----------------|---------------------------------|
| POST            | /{catalog_id}/items_batch       |
| POST            | /{catalog_id}/localized_items_batch |
| POST            | /{catalog_id}/batch             |

#### Administración de catálogos

Las solicitudes que realiza tu app se descuentan de la cantidad de llamadas que esta puede hacer en un período continuo de una hora por cada identificador del catálogo y se calculan de la siguiente manera:

```
Calls within one hour = 20,000 + 20,000 * log2(DA impressions + PDP visits)
```

"DA impressions" y "PDP visits" son el número de impresiones de anuncios dinámicos y visitas a la página de detalles del producto del negocio (en todos los catálogos) con intención en los últimos 28 días. Cuantos más usuarios vean los productos de tu catálogo, mayor será la cuota de llamadas que se asigna.

Esta fórmula se aplica en varios puntos de conexión de catálogos.

Para obtener más información sobre cómo obtener el uso de frecuencia actual, consulta [Encabezados](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers).

La limitación de frecuencia también puede estar sujeta al tiempo total de CPU y al tiempo real transcurrido durante un intervalo continuo de una hora. Para obtener más detalles, consulta el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) HTTP `total_cputime` y `total_time`.

Si recibes errores de límite de frecuencia, también puedes consultar `estimated_time_to_regain_access` en el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) para conocer el tiempo estimado de bloqueo.

### Público personalizado

Las solicitudes hechas por tu app a la API de público personalizado se cuentan con las métricas de limitación de frecuencia de esta, como el recuento de llamadas, el tiempo total de CPU y el tiempo total. El recuento de llamadas de una app es el número de llamadas que puede hacer durante un intervalo continuo de una hora y se calcula de la siguiente manera, pero nunca superará las 700.000:

En el caso de apps con [acceso estándar](https://developers.facebook.com/docs/graph-api/overview/access-levels/#standard-access) a la función de acceso estándar de administración de anuncios:

```
Calls within one hour = 5000 + 40 * Number of Active Custom Audiences
```

En el caso de las apps con [acceso avanzado](https://developers.facebook.com/docs/graph-api/overview/access-levels/#advanced-access) a la función de acceso estándar de administración de anuncios:

```
Calls within one hour = 190000 + 40 * Number of Active Custom Audiences
```

El número de públicos personalizados activos es el número de [públicos personalizados](https://developers.facebook.com/docs/marketing-api/audiences-api) activos de cada cuenta publicitaria.

La limitación de frecuencia también puede estar sujeta al tiempo total de CPU y al tiempo real transcurrido durante un intervalo continuo de una hora. Para obtener más detalles, consulta el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) HTTP `total_cputime` y `total_time`.

Si recibes errores de límite de frecuencia, también puedes consultar `estimated_time_to_regain_access` en el encabezado [X-Business-Use-Case](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/#headers-2) para conocer el tiempo estimado de bloqueo.

### Plataforma de Instagram

Las llamadas a los puntos de conexión de la Plataforma de Instagram, excluyendo mensajería, se cuentan contra el recuento de llamadas de la app que las realiza. El recuento de llamadas de una app es único para cada app y cada par app-usuario, y es el número de llamadas que la app ha hecho en un intervalo móvil de 24 horas. Se calcula de la siguiente manera:

```
Calls within 24 hours = 4800 * Number of Impressions
```

El número de impresiones es el número de veces que cualquier contenido de la cuenta profesional de Instagram del usuario de la app ha ingresado a la pantalla de una persona en las últimas 24 horas.

#### Notas

- Business Discovery y Hashtag Search API están sujetas a [Platform Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#platform-rate-limits).

### Messaging Rate Limits

Las llamadas a los puntos de conexión de mensajería de Instagram se cuentan contra el número de llamadas que tu app puede hacer por cuenta profesional de Instagram y la API utilizada.

#### Conversations API

- Tu app puede hacer 2 llamadas por segundo por cuenta profesional de Instagram.

#### Private Replies API

- Tu app puede hacer 100 llamadas por segundo por cuenta profesional de Instagram para respuestas privadas a comentarios de Instagram Live.
- Tu app puede hacer 750 llamadas por hora por cuenta profesional de Instagram para respuestas privadas a comentarios en publicaciones y reels de Instagram.

#### Send API

- Tu app puede hacer 100 llamadas por segundo por cuenta profesional de Instagram para mensajes que contienen texto, enlaces, reacciones y stickers.
- Tu app puede hacer 10 llamadas por segundo por cuenta profesional de Instagram para mensajes que contienen audio o video.

### Generación de clientes potenciales

Las solicitudes realizadas por tu app a la API de generación de clientes potenciales se tienen en cuenta en el recuento de llamadas de la app. Ese recuento de llamadas es el número de llamadas que puede realizar durante un intervalo continuo de 24 horas y se calcula de la siguiente manera:

```
Calls within 24 hours = 4800 * Leads Generated
```

El número de clientes potenciales generados es el número de clientes potenciales generados por página en la cuenta publicitaria en los últimos 90 días.

### Plataforma de Messenger

Los límites de frecuencia de la plataforma de Messenger dependen de la API utilizada y, en algunos casos, del contenido del mensaje.

#### API de Messenger

Las solicitudes que realiza tu app se descuentan de la cantidad de llamadas que esta puede hacer en un plazo de 24 horas seguidas y se calculan de la siguiente manera:

```
Calls within 24 hours = 200 * Number of Engaged Users
```

El número de usuarios que interactúan es la cantidad de personas a las que la empresa puede enviar mensajes mediante Messenger.

#### API de Messenger para Instagram

Las solicitudes que realiza tu app se descuentan de la cantidad de llamadas que esta puede hacer por cuenta de Instagram profesional y la API utilizada.

##### API de conversaciones

- Tu app puede hacer 2 llamadas por segundo, por cuenta de Instagram profesional.

##### API de envío

- Tu app puede hacer 100 llamadas por segundo, por cuenta de Instagram profesional, en el caso de los mensajes que contienen texto, enlaces, reacciones y stickers.
- Tu app puede hacer 10 llamadas por segundo, por cuenta de Instagram profesional, en el caso de los mensajes que contienen audio o video.

### Páginas

Los límites de frecuencia de la página pueden usar la lógica de límites de frecuencia de la plataforma o de BUC, según el tipo de token utilizado. Toda llamada a la API de páginas realizada con un [token de acceso a la página](https://developers.facebook.com/docs/facebook-login/access-tokens#pagetokens) o un [token de acceso de usuario de sistema](https://developers.facebook.com/docs/marketing-api/businessmanager/systemuser#systemusertoken) utiliza el cálculo de límite de frecuencia que se describe a continuación. Toda llamada hecha con un [token de acceso de la aplicación](https://developers.facebook.com/docs/facebook-login/access-tokens#apptokens) o un [token de acceso de usuario](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) está sujeta a los límites de frecuencia de la aplicación o de usuario.

Las solicitudes realizadas por tu app a la API de páginas con un token de acceso a la página o un token de acceso de usuario de sistema se tienen en cuenta para el recuento de llamadas de la app. Ese recuento de llamadas es el número de llamadas que puede realizar durante un intervalo continuo de 24 horas y se calcula de la siguiente manera:

```
Calls within 24 hours = 4800 * Number of Engaged Users
```

El número de usuarios que interactúan es el número de usuarios que interactuaron con la página en 24 horas.

Las solicitudes que realiza tu app a la API de páginas mediante un token de acceso de usuario o un token de acceso a la app están sujetas a la [lógica de límites de frecuencia de la plataforma](#platform-rate-limits).

Para evitar problemas de [limitación de frecuencia](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#pages) al usar la [función de contenido de acceso público a páginas](https://developers.facebook.com/docs/pages/overview/permissions-features#features), se recomienda usar un [token de acceso de usuario del sistema](https://www.facebook.com/business/help/503306463479099).

### Administrador de efectos de comercio de Spark AR

Las solicitudes realizadas por tu app a los puntos de conexión de comercio se tienen en cuenta para el recuento de llamadas de la app. Este recuento de llamadas es el número de llamadas que una app puede realizar durante un intervalo continuo de una hora, y se calcula de la siguiente manera:

```
Calls within one hour = 200 + 40 * Number of Catalogs
```

La cantidad de catálogos es la cantidad total de catálogos en todas las cuentas de comercio que administra tu app.

### Threads

Las llamadas a la API de Threads se incluirán en el conteo de llamadas de la app que las realiza. El conteo de llamadas de una app es exclusivo de cada app y cada par app-usuario, y es el número de llamadas que hizo la app en un intervalo móvil de 24 horas. Se calcula de la siguiente manera:

```
Llamadas en 24 horas = 4.800 * número de impresiones
```

El número de impresiones es el número de veces que el contenido de la cuenta de Threads del usuario de la app apareció en la pantalla de una persona en las últimas 24 horas. La limitación de frecuencia también puede estar sujeta al tiempo de CPU total por día:

```
720.000 * número de impresiones en el tiempo de CPU total 
2.880.000 * número de impresiones en el tiempo total
```

**Nota:** El valor mínimo para las impresiones es 10 (si el valor es inferior a 10, se asigna un valor predeterminado de 10).

### API de administración de WhatsApp Business

Las solicitudes realizadas por tu app a la [API de administración de WhatsApp Business](https://developers.facebook.com/docs/whatsapp/business-management-api) se tienen en cuenta en el recuento de llamadas de la app. El recuento de llamadas es el número de llamadas que se puede realizar durante un período continuo de una hora. En el caso de la siguiente API de administración de WhatsApp Business, de manera predeterminada, tu app puede realizar 200 llamadas por hora, por app, por cuenta de WhatsApp Business (WABA). Con las WABA activas, que tienen al menos un número de teléfono registrado, tu app puede hacer 5.000 llamadas por hora, por app, por WABA activa.

| Tipo de llamada | Punto de conexión                                   |
|-----------------|-----------------------------------------------------|
| `GET`           | `/{whatsapp-business-account-id}`                  |
| `GET`, `POST` y `DELETE` | `/{whatsapp-business-account-id}/assigned_users` |
| `GET`           | `/{whatsapp-business-account-id}/phone_numbers`    |
| `GET`, `POST` y `DELETE` | `/{whatsapp-business-account-id}/message_templates` |
| `GET`, `POST` y `DELETE` | `/{whatsapp-business-account-id}/subscribed_apps` |
| `GET`           | `/{whatsapp-business-account-to-number-current-status-id}` |

En las siguientes [API de línea de crédito](https://developers.facebook.com/docs/whatsapp/embedded-signup/manage-accounts/share-and-revoke-credit-lines), tu app puede hacer 5.000 llamadas por hora, por app.

| Tipo de llamada | Punto de conexión                                   |
|-----------------|-----------------------------------------------------|
| `GET`           | `/{business-id}/extendedcredits`                    |
| `POST`          | `/{extended-credit-id}/whatsapp_credit_sharing_and_attach` |
| `GET` y `DELETE`| `/{allocation-config-id}`                           |
| `GET`           | `/{extended-credit-id}/owning_credit_allocation_configs` |

Para evitar alcanzar los límites de frecuencia, recomendamos usar [webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-whatsapp#setup), con el objetivo de hacer un seguimiento de las actualizaciones de estado de las plantillas de mensajes, los números de teléfono y las WABA.

### Encabezados

Todas las respuestas a la API realizadas por tu app a las que se haya aplicado un límite de frecuencia con la lógica de BUC incluyen un encabezado HTTP `X-Business-Use-Case-Usage` (en el caso de las llamadas a la versión 3.3 de la API de anuncios y versiones anteriores) con una cadena en formato JSON que describe el uso actual del límite de frecuencia de la aplicación. Ese encabezado puede devolver hasta 32 objetos por llamada.

#### Contenido del encabezado de uso X-Business-Use-Case

| Código de error                  | Descripción del valor                                                                 |
|----------------------------------|--------------------------------------------------------------------------------------|
| `business-id`                    | El identificador del negocio asociado con el token que realiza las llamadas a la API. |
| `call_count`                     | Un número entero que expresa el porcentaje de llamadas permitidas que hizo tu app en un período continuo de una hora. |
| `estimated_time_to_regain_access`| El tiempo, expresado en minutos, que debe pasar hasta que las llamadas dejen de limitarse. |
| `total_cputime`                 | Un número entero que expresa el porcentaje de tiempo de CPU asignado al procesamiento de consultas. |
| `total_time`                     | Un número entero que expresa el porcentaje de tiempo total asignado al procesamiento de consultas. |
| `type`                           | Tipo de límite de frecuencia aplicado. El valor puede ser uno de los siguientes: `ads_insights`, `ads_management`, `custom_audience`, `instagram`, `leadgen`, `messenger` o `pages`. |
| `ads_api_access_tier`           | Solo se aplica a los tipos `ads_insights` y `ads_management`. Los niveles permiten que la app acceda a la API de marketing. De modo predeterminado, las apps se ubican en el nivel `development_access`, mientras que el `Standard_access` permite lograr una limitación de frecuencia menor. Para obtener una limitación de frecuencia más alta y llegar al nivel estándar, puedes solicitar el "Acceso Avanzado" a la característica [Acceso estándar de gestión de anuncios](https://developers.facebook.com/docs/marketing-api/overview/authorization#layer-2--access-levels--permissions--and-features). |

#### Tiempo de CPU total

El tiempo de CPU total necesario para procesar la solicitud. Cuando `total_cputime` llega a 100, es posible que se aplique un límite a las llamadas.

#### Tiempo total

La cantidad de tiempo total necesaria para procesar la solicitud. Cuando `total_time` llega a 100, es posible que se aplique un límite a las llamadas.

#### Valor de ejemplo del encabezado X-Business-Use-Case-Usage

```json
{
    "business-object-id": [
        {
            "type": "{rate-limit-type}",           // Type of BUC rate limit logic being applied.
            "call_count": 100,                     // Percentage of calls made.
            "total_cputime": 25,                   // Percentage of the total CPU time that has been used.
            "total_time": 25,                      // Percentage of the total time that has been used.
            "estimated_time_to_regain_access": 19, // Time in minutes to regain access.
            "ads_api_access_tier": "standard_access" // Tiers allows your app to access the Marketing API. standard_access enables lower rate limiting.
        }
    ],
    "66782684": [
        {
            "type": "ads_management",
            "call_count": 95,
            "total_cputime": 20,
            "total_time": 20,
            "estimated_time_to_regain_access": 0,
            "ads_api_access_tier": "development_access"
        }
    ],
    "10153848260347724": [
        {
            "type": "ads_insights",
            "call_count": 97,
            "total_cputime": 23,
            "total_time": 23,
            "estimated_time_to_regain_access": 0,
            "ads_api_access_tier": "development_access"
        }
    ],
    "10153848260347724": [
        {
            "type": "pages",
            "call_count": 97,
            "total_cputime": 23,
            "total_time": 23,
            "estimated_time_to_regain_access": 0
        }
    ]
}
```

### Códigos de error

Una vez que tu app alcanza el límite de frecuencia de BUC, las solicitudes posteriores realizadas por la app producen un error, y la API responde con un código de error.

| Código de error                             | Tipo de límite de frecuencia de BUC |
|---------------------------------------------|-------------------------------------|
| `error code 80000, error subcode 2446079` | Estadísticas de anuncios            |
| `error code 80004, error subcode 2446079` | Administración de anuncios           |
| `error code 80003, error subcode 2446079` | Público personalizado                |
| `error code 80002`                         | Instagram                           |
| `error code 80005`                         | Generación de clientes potenciales   |
| `error code 80006`                         | Messenger                           |
| `error code 32`                            | Llamadas a la página realizadas con un token de acceso de usuario |
| `error code 80001`                         | Llamadas a la página realizadas con un token de acceso a la página o de usuario del sistema |
| `error code 17, error subcode 2446079`    | Versión 3.3 y anteriores de la API de anuncios, que excluyen las estadísticas de anuncios |
| `error code 80008`                         | API de administración de WhatsApp Business |
| `error code 80014`                         | Lote de catálogos                   |
| `error code 80009`                         | Administración de



## Page: https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge

# Perímetro de suscripciones

Puedes usar el perímetro `/app/subscriptions` de la API Graph para configurar y administrar el producto Webhooks de tu app. Consulta la [documentación sobre /app/subscriptions](https://developers.facebook.com/docs/graph-api/reference/app/subscriptions) para conocer las acciones que puedes realizar con este perímetro y los permisos requeridos. Este documento solo contempla las acciones más comunes.

## Crear suscripciones

Para suscribirse a un objeto y sus campos, envía una solicitud `POST` al [perímetro /app/subscriptions](https://developers.facebook.com/docs/graph-api/reference/app/subscriptions) e incluye los siguientes parámetros:

- `object`: el tipo de objeto para el que quieres establecer el campo de suscripciones (p. ej., `user`).
- `callback_url`: la URL de tu punto de conexión.
- `verify_token`: una `string` que incluiremos cada vez que te enviemos una [solicitud de verificación](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests).
- `fields`: los campos a los que deseas suscribirte (p. ej., `photos`).

Supongamos que el identificador de tu app es `188559381496048` y quieres recibir una notificación si los usuarios de tu app publican una foto nueva; puedes hacer lo siguiente:

#### Ejemplo de solicitud

```bash
curl -F "object=user" \
     -F "callback_url=https://your-clever-domain-name.com/webhooks" \
     -F "fields=photos" \
     -F "verify_token=your-verify-token" \
     -F "access_token=your-app-access-token" \
     "https://graph.facebook.com/188559381496048/subscriptions"
```

#### Ejemplo de respuesta

Si la operación se realiza correctamente:

```json
{
  "success": "true"
}
```

## Obtener información de suscripciones

Para ver el objeto y el campo de suscripciones que configuraste en la app, envía una solicitud `GET` para el perímetro `/app/subscriptions`. Por ejemplo, si el identificador de la app es `188559381496048`, puedes hacer lo siguiente:

#### Ejemplo de solicitud

```bash
GET graph.facebook.com/188559381496048/subscriptions
```

#### Ejemplo de respuesta

```json
{
  "data": [
    {
      "object": "user",
      "callback_url": "https://your-clever-domain-name.com/webhooks",
      "active": true,
      "fields": [
        {
          "name": "photos",
          "version": "v2.10"
        },
        {
          "name": "feed",
          "version": "v2.10"
        }
      ]
    }
  ]
}
```



## Page: https://developers.facebook.com/docs/games_payments/webhooks

```markdown
# Webhooks para pagos

Actualizaciones en tiempo real sobre tus transacciones.

Webhooks para pagos (anteriormente conocido como "Actualizaciones en tiempo real") es un método imprescindible con el que te puedes mantener al corriente de los cambios que se realizan en los pedidos, a través de los pagos de Facebook, en la app.

## Información general

Los webhooks son un sistema basado en suscripciones que funciona entre Facebook y tu servidor. Tu app se suscribe para recibir actualizaciones de Facebook a través de un punto de conexión HTTPS específico. Cuando se actualice un pedido hecho con la app, enviaremos una solicitud `POST` HTTPS al punto de conexión, con la que informaremos al servidor del cambio.

Existen tres casos principales en los que se envían actualizaciones al servidor del desarrollador:

- [Procesamiento de pagos](https://developers.facebook.com/docs/games_payments/fulfillment)
- [Reembolsos, contracargos, anulaciones de contracargos y rechazos](https://developers.facebook.com/docs/games_payments/fulfillment/updates)
- [Reclamaciones](https://developers.facebook.com/docs/games_payments/fulfillment/disputes)

## Suscribirse a Webhooks

Para suscribirte a Webhooks para pagos, crea primero una URL de punto de conexión pública que reciba las solicitudes `GET` HTTPS para la verificación de la suscripción y `POST` para las solicitudes de datos del cambio. A continuación, se describe la estructura de estos tipos de solicitud. Luego, configura las suscripciones al objeto `payment` de la app. Hay dos formas de hacerlo:

- [Suscribirse a través del panel de apps](#dashboard)
- [Suscribirse a través de la API Graph](#graph_api)

En cualquier caso, el punto de conexión recibirá los mismos datos de la misma manera. Consulta [El servidor de devolución de llamada](#callbackserver) para obtener más información sobre lo que recibirá el servidor.

### Suscribirse a través del panel de apps

La forma más fácil de configurar la app para recibir actualizaciones de Webhooks es a través de la pestaña de pagos ubicada en el [panel de apps](https://developers.facebook.com/apps). Busca la app en el panel y haz clic en la pestaña `Payments`. La sección "Webhooks" se encuentra justo debajo de la sección "Configuración" de la empresa.

![Webhooks para pagos](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/12679464_1709074255999278_1813043975_n.png?_nc_cat=102&ccb=1-7&_nc_sid=34156e&_nc_ohc=xY-u-yytI4QQ7kNvwEEARVf&_nc_oc=Adnu_FqM6CIygVKK-s5W1727lVhLu1-yRh3O5L_h4f4NssajlzyaFM-oJZ0tkXtiCXA&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=kp91wyUZGpcG7K4henApnA&oh=00_AfiYv9bJJjWzwW2lwXRnzn27PUABihd2QI50yn1V2Rvh9A&oe=691ABCD7)

En esta pantalla, luego aparecerá el estado de la suscripción de la app, ya sea que se haya agregado mediante el panel o la API. Aquí es posible cambiar la URL de devolución de llamada de la suscripción y probarla.

En el campo "Devolución de llamada", debes proporcionar un punto de conexión válido del servidor de acceso público. Esta es la dirección que usaremos para verificar la suscripción y enviar las actualizaciones, por lo que debe responder según lo descrito en la sección [El servidor de devolución de llamada](#callbackserver).

Por último, suministra un "Token de verificación". Este token solo se enviará durante la fase de inscripción para verificar que la suscripción se origine en una ubicación segura. El token no se enviará en las actualizaciones normales de Webhooks.

### Probar la configuración

Es necesario que pruebes la configuración de devolución de llamada antes de guardar la suscripción. Se enviará una solicitud "GET" de verificación al punto de conexión, que contiene los parámetros `hub.mode`, `hub.challenge` y `hub.verify_token`, y se asegurará de que los administres correctamente. Por ejemplo, debes asegurarte de que el punto de conexión responda repitiendo el valor `hub.challenge` en Facebook:

![Probar la configuración](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2178-6/12385813_224525211235230_333457367_n.png?_nc_cat=100&ccb=1-7&_nc_sid=34156e&_nc_ohc=bnpTOHs-HUsQ7kNvwE2YUPM&_nc_oc=AdkcLgktVZQkgsqQ1dggNVxgC_jWvgxFeh4YfBmV0kFhGYCIdmsyF5piWL-_gvbZIwQ&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=kp91wyUZGpcG7K4henApnA&oh=00_AfimSTSGC66IUqhhLGZI4XnL2sjjncJjM6-yMuQzJWpbEA&oe=691A957B)

Una vez que hayas ingresado los detalles de la suscripción, asegúrate de hacer clic en el botón "Guardar cambios", en la parte inferior de la página. Editar una suscripción implica simplemente modificar el contenido de los campos, volver a realizar la prueba y, luego, guardar de nuevo el formulario.

### Suscribirse a través de la API Graph

También es posible configurar y visualizar las suscripciones de manera programática mediante la API Graph. Necesitarás el `access token` de la app, que está disponible en la [herramienta de tokens de acceso](https://developers.facebook.com/tools/access_token/) o usando el punto de conexión `/oauth` de la API Graph.

La API de suscripción está disponible en el punto de conexión `https://graph.facebook.com/[APP_ID]/subscriptions`.

Con ella, puedes realizar estas tres tareas:

- Agregar o modificar una suscripción (enviando una solicitud `POST` HTTPS)
- Visualizar cada una de las suscripciones actuales (enviando una solicitud `GET` HTTPS)

### Agregar y modificar suscripciones

Para configurar una suscripción, envía una solicitud `POST` con los siguientes parámetros. Ten en cuenta que estos parámetros corresponden a los campos del formulario descrito anteriormente:

- `object`: según lo anterior, el tipo del objeto sobre el que quieres recibir actualizaciones. Especifica `payments`.
- `fields`: una lista separada por comas de las propiedades del tipo de objeto sobre cuyos cambios quieres recibir actualizaciones. Especifica "actions" y "disputes".
- `callback_url`: un punto de conexión del servidor válido y de acceso público.
- `verify_token`: una cadena arbitraria que se envía al punto de conexión cuando se verifica la suscripción.

Cuando recibamos esta solicitud, al igual que la configuración del formulario anterior, enviaremos una solicitud `GET` a tu devolución de llamada para asegurarnos de que sea válida y esté lista para recibir actualizaciones. En particular, debes asegurarte de que el punto de conexión responda repitiendo el valor `hub.challenge` en Facebook.

Ten en cuenta que, como una app solo puede tener una suscripción para cada tipo de objeto, si hay una suscripción para este tipo en particular, los nuevos datos publicados reemplazan los datos anteriores.

### Visualizar las suscripciones

Si emitimos una solicitud `GET` HTTP a la API de suscripción, se devuelve contenido con codificación JSON que muestra las suscripciones. Por ejemplo:

```json
[
  {
    "object": "payments",
    "callback_url": "https://www.friendsmash.com/rtu.php",
    "fields": ["actions", "disputes"],
    "active": true
  }
]
```

Puedes usar el [explorador de la API Graph](https://developers.facebook.com/tools/explorer) para experimentar directamente con esta API, pero no te olvides de usar el [token de acceso](https://developers.facebook.com/tools/access_token/) de la app.

## El servidor de devolución de llamada

El servidor de devolución de llamada debe administrar dos tipos de solicitud. Asegúrate de que esté en una URL pública para que podamos hacer correctamente estas solicitudes.

### Verificación de la suscripción

En primer lugar, los servidores de Facebook harán una sola solicitud `GET` HTTPS a la URL de devolución de llamada cuando trates de agregar o modificar una suscripción. Se agregará una cadena de consulta a la URL de devolución de llamada con los siguientes parámetros:

| Parámetro              | Descripción                                                                                   |
|------------------------|-----------------------------------------------------------------------------------------------|
| `hub.mode`             | Se pasa la cadena "subscribe" en este parámetro.                                            |
| `hub.challenge`        | Una cadena aleatoria.                                                                        |
| `hub.verify_token`     | El valor `verify_token` que especificaste cuando creaste la suscripción.                   |

El punto de conexión debe verificar primero el `hub.verify_token`. Así, se garantiza que el servidor sepa que Facebook está haciendo la solicitud y la relacione con la suscripción que acabas de configurar.

Luego, deberá responder repitiendo solo el valor `hub.challenge`, que le confirma a Facebook que este servidor está configurado para aceptar devoluciones de llamada y evita vulnerabilidades por denegación de servicio (DDoS).

> **Nota para los desarrolladores de PHP:** En PHP, los puntos y espacios en los nombres de los parámetros de consulta se convierten automáticamente en guiones bajos. Por lo tanto, deberás acceder a estos parámetros usando `$_GET['hub_mode']`, `$_GET['hub_challenge']` y `$_GET['hub_verify_token']` si escribes el punto de conexión de devolución de llamada en PHP. Consulta [esta nota](https://php.net/manual/en/language.variables.external.php) en el manual de lenguaje PHP para obtener más información.

### Recibir actualizaciones

Si la suscripción es correcta, procederemos a enviar una solicitud `POST` HTTPS al punto de conexión del servidor cada vez que se produzcan cambios (en las conexiones o en los campos seleccionados). Es necesario que respondas a esta solicitud con el código HTTP `200`.

> **Nota:** Consideramos que cualquier otra respuesta distinta de `200` es un error. En este caso, seguiremos intentando enviar la actualización de webhooks. Por esta razón, si no envías la respuesta correcta, es posible que recibas varias veces la misma actualización.

La solicitud tendrá el tipo de contenido `application/json` y el cuerpo incluirá una cadena con codificación JSON que contendrá uno o varios cambios.

**Nota para los desarrolladores de PHP:** En PHP, para obtener los datos cifrados, se debería usar el siguiente código:

```php
$data = file_get_contents("php://input");
$json = json_decode($data);
```

Ten en cuenta que los parámetros `hub.mode`, `hub.challenge` y `hub.verify_token` no se vuelven a enviar una vez que se confirma la suscripción.

Este es un ejemplo típico de una devolución de llamada realizada para la suscripción de un objeto `payments`:

```json
{
  "object": "payments",
  "entry": [
    {
      "id": "296989303750203",
      "time": 1347996346,
      "changed_fields": ["actions"]
    }
  ]
}
```

Debes tener presente que las actualizaciones de Webhooks solo te informan que se cambió un pago determinado, [identificado por el campo `id`](https://developers.facebook.com/docs/reference/api/payment/). Después de recibir la actualización, se te solicitará que [consultes la API Graph](https://developers.facebook.com/docs/games_payments/fulfillment/#orderfulfillment) para obtener detalles de la transacción, con el fin de administrar el cambio adecuadamente.

> **Nota:** Las actualizaciones de pagos **nunca se procesan por lotes**, a diferencia de los webhooks de otros tipos de objeto.

Recibirás una nueva actualización cada vez que se actualice una transacción, ya sea por la acción de un usuario o de un desarrollador.

Si falla una actualización enviada al servidor, volveremos a intentar realizar la operación inmediatamente y, luego, unas cuantas veces más, con una disminución de la frecuencia, durante las siguientes 24 horas.

Con cada solicitud, enviamos un encabezado HTTP `sha256=` que contiene la firma SHA256 de la carga de solicitud con la clave secreta de la app como clave y el prefijo `X-Hub-Signature-256`. El punto de conexión de devolución de llamada puede verificar esta firma para validar la integridad y el origen de la carga.

## Responder a las actualizaciones

Después de que el servidor recibe una actualización, deberás [consultar la API Graph](https://developers.facebook.com/docs/reference/api/payment/) usando el campo `id` para obtener información sobre el nuevo estado de la transacción. A continuación, deberás actuar en función de este estado.

En las siguientes secciones, se enumeran todos los posibles cambios de estado que activan el envío de una actualización. En general, se dividen en:

- Cambios a la matriz de [acciones](https://developers.facebook.com/docs/games_payments/fulfillment/updates), que ocurren cuando se realiza un pago de manera asincrónica, se emite un reembolso (de tu parte o de parte de Facebook) o se produce un contracargo.
- Cambios a la matriz de [disputas](https://developers.facebook.com/docs/games_payments/fulfillment/disputes), que ocurren cuando el consumidor inicia una disputa por un pedido.

### Acciones

Los objetos `payment` incluyen una matriz titulada `actions`, que contienen la colección de cambios de estado que experimentó la transacción. Las entradas en la matriz `actions` tienen una propiedad llamada `type`, que describe el tipo de acción que se llevó a cabo. `type` puede tener los siguientes valores: `charge`, `refund`, `chargeback`, `chargeback_reversal` y `decline`, que [se explican aquí en detalle](https://developers.facebook.com/docs/reference/api/payment/#type_explanation).

Este es un ejemplo de respuesta de la API Graph de un objeto de pago con acciones asociadas:

```json
{
  "id": "3603105474213890",
  "user": {
    "name": "Marco Alvarez",
    "id": "500535225"
  },
  "application": {
    "name": "Friend Smash",
    "namespace": "friendsmashsample",
    "id": "241431489326925"
  },
  "actions": [
    {
      "type": "charge",
      "status": "completed",
      "currency": "USD",
      "amount": "0.99",
      "time_created": "2013-03-22T21:18:54+0000",
      "time_updated": "2013-03-22T21:18:55+0000"
    },
    {
      "type": "refund",
      "status": "completed",
      "currency": "USD",
      "amount": "0.99",
      "time_created": "2013-03-23T21:18:54+0000",
      "time_updated": "2013-03-23T21:18:55+0000"
    }
  ],
  "refundable_amount": {
    "currency": "USD",
    "amount": "0.00"
  },
  "items": [
    {
      "type": "IN_APP_PURCHASE",
      "product": "https://www.friendsmash.com/og/friend_smash_bomb.html",
      "quantity": 1
    }
  ],
  "country": "US",
  "created_time": "2013-03-22T21:18:54+0000",
  "payout_foreign_exchange_rate": 1
}
```

Como te suscribiste al campo de acciones al registrarte en Webhooks, emitiremos una actualización cuando se produzcan los siguientes cambios en la matriz:

### Cargo

En un principio, todos los pedidos contienen una entrada de cargo con `"status": "initiated"`. Un pago iniciado es aquel que solo se inició y todavía no se completó. No enviaremos actualizaciones para los pagos en estado iniciado.

Cuando se realice correctamente un pago, se cambiará `"status": "initiated"` a `"status": "completed"` y emitiremos una actualización. Al ver este cambio, deberás comprobar los registros de pago para verificar si es una transacción nueva o preexistente y responder de la siguiente manera:

- Si ya conoces el pedido y la devolución de llamada de JavaScript lo procesó (preferiblemente como primera opción), es seguro ignorar la actualización, o bien puedes usarla como confirmación adicional.
- Si conoces el pedido, pero se encuentra en estado `initiated`, puedes procesarlo emitiendo al consumidor el artículo virtual o la divisa asociados. Este pago se puede marcar como completo de manera segura.
- Si el pedido es desconocido, el cliente no completó el proceso, lo que muy probablemente se deba a un problema de conectividad o a que el consumidor cerró el navegador mientras hacía el pago. De todas maneras, puedes procesar y completar este pedido, ya que Facebook sigue siendo la fuente más confiable en lo que respecta a facturación del usuario.

También recibirás actualizaciones para los pagos con `"status": "failed"`, que no se deberán procesar.

### Reembolso

Cada vez que [emitas un reembolso mediante la API Graph](https://developers.facebook.com/docs/games_payments/fulfillment/disputes), recibirás una actualización. Al igual que con `"type": "charge"`, un reembolso también puede tener un estado variable que debes conocer. En particular, es posible que un reembolso presente un error, lo que suele deberse a un problema de procesamiento o conectividad. En tal caso, deberás volver a emitir el reembolso.

### Contracargo, anulación de contracargo y rechazos

Al igual que con los reembolsos, también se te notificará cuando se emita un contracargo, una anulación de contracargo o un rechazo. Un objeto de contracargo, anulación de contracargo o rechazo se agregará a la matriz de acciones de los datos de retorno de la API Graph para el pago.

### Disputas

Cuando se inicie una disputa, te lo notificaremos emitiendo una actualización. En este caso, verás una nueva matriz `"disputes"` como parte del objeto `payment`. La matriz contendrá la hora en que se inició la disputa, la razón por la que el cliente inició la respuesta y la dirección de correo electrónico de este, que puedes usar para contactarlo directamente a fin de resolver la disputa.

Este es un ejemplo de respuesta completa de la API Graph para una transacción en disputa:

```json
{
  "id": "990361254213890",
  "user": {
    "name": "Marco Alvarez",
    "id": "500535225"
  },
  "application": {
    "name": "Friend Smash",
    "namespace": "friendsmashsample",
    "id": "241431489326925"
  },
  "actions": [
    {
      "type": "charge",
      "status": "completed",
      "currency": "USD",
      "amount": "0.99",
      "time_created": "2013-03-22T21:18:54+0000",
      "time_updated": "2013-03-22T21:18:55+0000"
    }
  ],
  "refundable_amount": {
    "currency": "USD",
    "amount": "0.99"
  },
  "items": [
    {
      "type": "IN_APP_PURCHASE",
      "product": "https://www.friendsmash.com/og/friend_smash_bomb.html",
      "quantity": 1
    }
  ],
  "country": "US",
  "created_time": "2013-03-22T21:18:54+0000",
  "payout_foreign_exchange_rate": 1,
  "disputes": [
    {
      "user_comment": "I didn't receive my item! I want a refund, please!",
      "time_created": "2013-03-24T18:21:02+0000",
      "user_email": "email@domain.com",
      "status": "resolved",
      "reason": "refunded_in_cash"
    }
  ]
}
```

Para obtener más información sobre cómo responder a las disputas y emitir reembolsos, consulta la sección [Procedimientos de pago: manejo de disputas y reembolsos](https://developers.facebook.com/docs/games_payments/fulfillment/updates).
```



## Page: https://developers.facebook.com/docs/messenger-platform/webhook

```markdown
# Webhooks de Meta para la plataforma de Messenger

Los webhooks de Meta te permiten recibir en tiempo real notificaciones HTTP sobre cambios en objetos específicos en la gráfica social de Meta. Por ejemplo, podemos enviarte una notificación cuando una persona envía un mensaje a tu página de Facebook o a tu cuenta profesional de Instagram. Las notificaciones de webhooks te permiten **hacer seguimiento de los mensajes de entrada y de las actualizaciones de estado del mensaje**. Además, te permiten **evitar los límites de frecuencia** que podrían producirse si enviaras consultas a los puntos de conexión de la plataforma de Messenger para hacer seguimiento de estos cambios.

A fin de implementar con éxito webhooks en las conversaciones en Messenger o Instagram, deberás hacer lo siguiente:

1. Crear un punto de conexión en tu servidor para recibir y procesar tus notificaciones de webhooks y objetos JSON.
2. Configurar el producto Webhooks de Meta en el panel de tu app.
3. Suscribirte a las notificaciones de webhooks de Meta que deseas recibir.
4. Instalar la app de mensajes en la página de Facebook vinculada a tu cuenta comercial o tu cuenta profesional de Instagram.

## Antes de empezar

Suponemos que, antes de empezar, hiciste lo siguiente:

- Leíste e implementaste los componentes necesarios para el desarrollo con Meta en [Información general de la plataforma de Messenger](https://developers.facebook.com/docs/messenger-platform/overview).

## Configurar el servidor Node.js.

El servidor de conexión debe tener la capacidad de procesar dos tipos de solicitudes HTTPS: [solicitudes de verificación](#solicitudes-de-verificaci-n) y [notificaciones de eventos](#notificaciones-de-eventos). Como ambas solicitudes utilizan HTTP, el servidor debe contar con un certificado TLS o SSL válido, correctamente configurado e instalado. No se admiten certificados autofirmados.

En las secciones que figuran a continuación, se explica qué incluye cada tipo de solicitud y cómo responder a cada una de ellas.

Los ejemplos de código que se muestran aquí se extrajeron de nuestra [app de ejemplo ubicada en GitHub](https://github.com/fbsamples/original-coast-clothing/blob/main/app.js). Visita GitHub para ver el ejemplo completo y obtener más información sobre cómo configurar tu servidor de webhooks.

### Crear un punto de conexión

Cuando creas un punto de conexión para recibir notificaciones de webhooks desde la plataforma de Messenger, es posible que el archivo `app.js` tenga el siguiente aspecto:

```javascript
// Create the endpoint for your webhook
app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(`Received webhook:`);
  console.dir(body, { depth: null });
  
  ...
});
```

Este código crea un punto de conexión `/webhook` que acepta solicitudes `POST` y verifica que estas sean notificaciones de webhooks.

### Devolución de una respuesta `200 OK`

El punto de conexión debe devolver una respuesta `200 OK`, que le indica a la plataforma de Messenger que el evento se recibió y no se debe volver a enviar. Normalmente, no enviarás esta respuesta hasta que hayas completado el procesamiento de la notificación.

#### Responder a notificaciones de eventos

Tu punto de conexión debe responder a todas las notificaciones:

- con una respuesta `200 OK HTTPS`;
- dentro de un plazo de cinco o menos segundos.

El siguiente código estará en la `app.post` del archivo `app.js` y es probable que tenga el siguiente aspecto:

```javascript
...
  // Send a 200 OK response if this is a page webhook
  if (body.object === "page") {
    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});
```

### Solicitudes de verificación

Siempre que configures el producto Webhooks en el panel de apps, enviaremos una solicitud `GET` a la URL del punto de conexión. Las solicitudes de verificación incluyen los siguientes parámetros de cadenas de consulta, como anexos al final de la URL del punto de conexión. Se verán similares a lo siguiente:

#### Ejemplo de solicitud de verificación

```
GET https://www.your-clever-domain-name.com/webhooks?hub.mode=subscribe&hub.verify_token=mytoken&hub.challenge=1158201444
```

#### Validación de solicitudes de verificación

Cada vez que el punto de conexión recibe una solicitud de verificación, debe hacer lo siguiente:

- Verificar que el valor de `hub.verify_token` coincida con la cadena configurada en el campo **Token de verificación** al [configurar el producto Webhooks](#suscribirse-a-webhooks-de-meta) en el panel de tu app (aún no configuraste esta cadena de token).
- Responder con el valor `hub.challenge`.

El archivo `app.js` puede tener el siguiente aspecto:

```javascript
// Add support for GET requests to our webhook
app.get("/messaging-webhook", (req, res) => {
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === "subscribe" && token === config.verifyToken) {
      // Respond with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
```

| Parámetro               | Valor de ejemplo        | Descripción                                                                                       |
|-------------------------|-------------------------|---------------------------------------------------------------------------------------------------|
| `hub.mode`              | `subscribe`             | Este valor siempre estará configurado en `subscribe`.                                            |
| `hub.challenge`         | `1158201444`            | Un `int` que debes volver a transmitirnos.                                                       |
| `hub.verify_token`      | `mytoken`               | Una cadena que tomamos del campo **Token de verificación** en el panel de apps de tu app. Configurarás esta cadena cuando completes los pasos de los parámetros de configuración de Webhooks. |

**Nota:** [PHP convierte los puntos (.) en guiones bajos (_) en los nombres de parámetros](https://www.php.net/manual/en/language.variables.external.php).

Si estás en tu panel de apps y configuras el producto Webhooks (y, por lo tanto, activas una solicitud de verificación), el panel indicará si el punto de conexión validó correctamente la solicitud. Si utilizas el punto de conexión `/app/subscriptions` de la API Graph para configurar el producto Webhooks, la API indicará si la operación se realizó correctamente o no.

### Notificaciones de eventos

Cuando configures tu producto Webhooks, te suscribirás a campos (`fields`) específicos en un tipo de objeto (`object`) (p. ej., el campo `messages` en el objeto `page`). Siempre que haya un cambio en uno de esos campos, enviaremos a tu punto de conexión una solicitud `POST` con una carga JSON que describe el cambio.

Por ejemplo, si te suscribiste al campo `page` del objeto `message_reactions` y uno de los usuarios reaccionó a un mensaje enviado por tu app, te enviaríamos una solicitud `POST` que se vería así:

```json
{
  "object": "page",
  "entry": [
    {
      "id": "<PAGE_ID>",
      "time": 1458692752478,
      "messaging": [
        {
          "sender": {
            "id": "<PSID>"
          },
          "recipient": {
            "id": "<PAGE_ID>"
          },
          ...
        }
      ]
    }
  ]
}
```

#### Contenido de la carga útil

Las cargas incluirán un objeto que describirá el cambio. Al [configurar el producto Webhooks](#suscribirse-a-webhooks-de-meta), puedes indicar si las cargas útiles solo deben incluir los nombres de los campos modificados o si deben incluir también los nuevos valores.

Damos formato JSON a todas las cargas útiles para que puedas analizarlas con paquetes o métodos de análisis JSON comunes.

**Nota**: No podrás consultar datos históricos de notificaciones de eventos de webhook, por lo que asegúrate de capturar y almacenar cualquier contenido que quieras conservar de la carga útil de los webhooks.

### Validar cargas útiles

Firmamos todas las cargas de la notificación de eventos con una firma **SHA256** e incluimos la firma en el encabezado "X-Hub-Signature-256" de la solicitud, precedido por "sha256=". No es necesario que valides la carga útil, pero te lo recomendamos encarecidamente.

Para validar la carga útil:

1. Genera una firma **SHA256** con la carga y con la **clave secreta** de la app.
2. Compara tu firma con la del encabezado `X-Hub-Signature-256` (todo lo que aparece después de `sha256=`). Si las firmas coinciden, la carga es genuina.

El archivo `app.js` puede tener el siguiente aspecto:

```javascript
// Import dependencies and set up http server
const express = require("express"),
  bodyParser = require("body-parser"),
  { urlencoded, json } = require("body-parser"),
  app = express().use(bodyParser.json());

...

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    console.warn(`Couldn't find "x-hub-signature-256" in headers.`);
  } else {
    var elements = signature.split("=");
    var signatureHash = elements[1];
    var expectedHash = crypto
      .createHmac("sha256", config.appSecret)
      .update(buf)
      .digest("hex");
    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}
```

#### Reintento de entrega de webhooks

Si se produce un error al enviar una notificación a tu servidor, volveremos a intentar enviarla varias veces más. Tu servidor deberá manejar la deduplicación en esos casos. Si 15 minutos después seguimos sin poder entregar las notificaciones, se enviará una alerta a tu cuenta de desarrollador.

Si el error en la entrega de la notificación persiste durante una hora, recibirás una alerta de **webhooks inhabilitados** y tu app se dará de baja del webhook de la página o de la cuenta profesional de Instagram. Una vez que hayas solucionado los problemas, deberás volver a realizar la suscripción a los webhooks.

Si el usuario envía varios mensajes cuando la app falla, es posible que no se entreguen en el orden en el que se enviaron. Para garantizar que los mensajes se entreguen en orden cronológico, las apps deberían incluir siempre el campo webhook **timestamp** en el webhook.

### Prueba tus webhooks

Para probar tu verificación de webhooks, ejecuta la siguiente solicitud cURL con tu token de verificación:

```bash
curl -X GET "localhost:1337/webhook?hub.verify_token=YOUR-VERIFY-TOKEN&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
```

Si la verificación del webhook funciona según lo previsto, este es el aspecto que debe tener:

- `WEBHOOK_VERIFIED` registrado en la línea de comandos en la que se ejecuta el proceso del nodo.
- `CHALLENGE_ACCEPTED` registrado en la línea de comandos a la que enviaste la solicitud cURL.

Para probar tu webhook, envía esta solicitud cURL:

```bash
curl -H "Content-Type: application/json" -X POST "localhost:1337/webhook" -d '{"object": "page", "entry": [{"messaging": [{"message": "TEST_MESSAGE"}]}]}'
```

Si el webhook funciona según lo previsto, este es el aspecto que debe tener:

- `TEST_MESSAGE` registrado en la línea de comandos en la que se ejecuta el proceso del nodo.
- `EVENT RECEIVED` registrado en la línea de comandos a la que enviaste la solicitud cURL.

## Suscribirse a Webhooks de Meta

Una vez que el punto de conexión del servidor de webhook o la app de ejemplo estén listos, ve al [panel de apps](https://developers.facebook.com/apps) de tu app y suscríbete a Webhooks de Meta.

En este ejemplo, usaremos el panel para configurar un webhook y hacer la suscripción al campo `messages`. Cada vez que un cliente envíe un mensaje a tu app, se enviará una notificación a tu punto de conexión de webhook.

1. En el panel de apps, ve a **Productos > Messenger > Configuración**.

   - Algunos webhooks de la plataforma de Messenger no están disponibles para los mensajes de Instagram. Si solo implementas webhooks para Instagram y conoces los que están disponibles para los mensajes de Instagram, puedes suscribirte aquí a los webhooks. Para ver y suscribirte solamente a webhooks para mensajes de Instagram, puedes ir a **Configuración de Instagram**.

2. Ingresa la URL del punto de conexión en el campo **URL de devolución de llamada** y agrega el token de verificación en el campo **Verificar token**. Incluiremos esta cadena en todas las [solicitudes de verificación](#solicitudes-de-verificaci-n). Si usas alguna de nuestras apps de ejemplo, debe ser la misma cadena que usaste para la variable de configuración `TOKEN`.

3. Suscríbete a los campos cuyas notificaciones quieras recibir y haz clic en **Guardar**.

4. El último paso consiste en suscribirse a campos individuales. Suscríbete al campo `messages` y envía una notificación de evento de prueba.

   - Si el punto de conexión está configurado correctamente, debería [validar la carga útil](#validar-cargas--tiles) y ejecutar el código que hayas configurado para que se ejecute después de una validación exitosa. Si usas nuestra [app de ejemplo](https://developers.facebook.com/docs/graph-api/webhooks/sample-apps), carga la URL de la app en el navegador web. Debería mostrar el contenido de la carga.

Puedes cambiar tus suscripciones a webhooks, el token de verificación o la versión de la API en cualquier momento desde el panel de apps.

**Nota:** Te recomendamos usar la versión más reciente de la API para recibir toda la información disponible de los webhooks.

También puedes hacerlo mediante programación con el [punto de conexión `/app/subscriptions`](https://developers.facebook.com/docs/graph-api/reference/application/subscriptions).

### Campos disponibles en la plataforma de Messenger

| Evento de webhook                     | Descripción                                                             |
|---------------------------------------|-------------------------------------------------------------------------|
| `messages`                            | Suscribe a los [eventos de mensaje recibido](https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received). |
| `messaging_account_linking`          | Suscribe a los [eventos de vinculación de cuentas](https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking). |
| `messaging_checkout_updates` (beta)  | Suscribe a los [eventos de pago actualizado](https://developers.facebook.com/docs/messenger-platform/webhook-reference/checkout-update). |
| `message_deliveries`                 | Suscribe a los [eventos de mensaje entregado](https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered). |
| `message_echoes`                     | Suscribe a los [eventos de mensaje eco](https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo). |
| `messaging_game_plays`               | Suscribe a los [eventos de juego instantáneo](https://developers.facebook.com/messenger-platform/reference/webhook-events/messaging_game_plays/). |
| `messaging_handovers` (beta)         | Suscribe a los [eventos de protocolo "Handover"](https://developers.facebook.com/messenger-platform/reference/webhook-events/messaging_handovers). |
| `messaging_optins`                   | Suscribe a los [eventos de aceptación del plugin](https://developers.facebook.com/messenger-platform/reference/webhook-events/messaging_optins). |
| `messaging_payments` (beta)          | Suscribe a los [eventos de pago](https://developers.facebook.com/docs/messenger-platform/webhook-reference/payment). |
| `messaging_policy_enforcement`       | Suscribe a los [eventos de aplicación de políticas](https://developers.facebook.com/messenger-platform/webhook-reference/policy-enforcement). |
| `messaging_postbacks`                 | Suscribe a los [eventos recibidos de postback](https://developers.facebook.com/messenger-platform/webhook-reference/postback-received). |
| `messaging_pre_checkouts` (beta)     | Suscribe a los [eventos previos al pago](https://developers.facebook.com/messenger-platform/reference/webhook-events/messaging_pre_checkouts). |
| `message_reads`                       | Suscribe a los [eventos de mensaje leído](https://developers.facebook.com/messenger-platform/webhook-reference/message-read). |
| `messaging_referrals`                 | Suscribe a los [eventos de referencia](https://developers.facebook.com/messenger-platform/webhook-reference/referral). |
| `standby` (beta)                     | Suscribe a los [eventos del canal en espera del protocolo "Handover"](https://developers.facebook.com/messenger-platform/reference/webhook-events/standby). |

## Conexión de tu app

Deberás conectar tu app de Webhooks a tu página y suscribir esta última a las notificaciones de webhooks que desees recibir.

### Agregar la app

Puedes conectar una app a una página en [Meta Business Suite > Todas las herramientas > Apps de negocios](https://business.facebook.com/).

**Nota**: Deberás suscribir todas las apps de mensajes de tu empresa a los webhooks de mensajes.

### Suscribir tu página

Deberás suscribir tu página a las notificaciones de webhooks que desees recibir.

#### Requisitos

- Un token de acceso a la página solicitado por una persona que puede realizar la [tarea `MODERATE`](https://developers.facebook.com/docs/pages/overview#tasks) en la página que se está consultando.
- Los permisos [`pages_messaging` y `pages_manage_metadata`](https://developers.facebook.com/docs/pages/overview/permissions-features#permission-dependencies).

Para suscribirte a un campo de webhooks, envía una solicitud `POST` al perímetro [`subscribed_apps`](https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps) de la página usando el token de acceso a esta.

```bash
curl -i -X POST "https://graph.facebook.com/PAGE-ID/subscribed_apps?subscribed_fields=messages&access_token=PAGE-ACCESS-TOKEN"
```

#### Ejemplo de respuesta

```json
{
  "success": "true"
}
```

Para ver las apps instaladas en tu página, envía una solicitud `GET`:

#### Ejemplo de solicitud

```bash
curl -i -X GET "https://graph.facebook.com/PAGE-ID/subscribed_apps&access_token=PAGE-ACCESS-TOKEN"
```

#### Ejemplo de respuesta

```json
{
  "data": [
    {
      "category": "Business",
      "link": "https://my-clever-domain-name.com/app",
      "name": "My Sample App",
      "id": "APP-ID",
      "subscribed_fields": [
        "messages"
      ]
    }
  ]
}
```

Si no hay apps instaladas en tu página, la API devolverá un conjunto de datos vacío.

### Explorador de la API Graph

También puedes usar el [explorador de la API Graph](https://developers.facebook.com/tools/explorer) para enviar la solicitud de suscripción a tu página a un campo de Webhooks.

1. Selecciona tu app en el menú desplegable **App**.
2. Haz clic en el menú desplegable **Obtener token** y selecciona **Obtener token de acceso de usuario**, y luego elige el permiso `pages_manage_metadata`. Esto cambiará el token de tu app por un token de acceso de usuario con el permiso `pages_manage_metadata` otorgado.
3. Vuelve a hacer clic en **Obtener token** y selecciona tu página. Esto cambiará tu token de acceso de usuario por un token de acceso a la página.
4. Cambia el modo de operación haciendo clic en el menú desplegable `GET` y seleccionando `POST`.
5. Reemplaza la consulta predeterminada `me?fields=id,name` por el **identificador** de la página seguido por `/subscribed_apps` y, luego, envía la consulta.

## Requisitos de acceso

La app solo necesita **acceso estándar** para recibir notificaciones de personas que tienen un rol en tu app como administradores, desarrolladores o evaluadores. En cambio, para recibir notificaciones de clientes o personas que no tienen un rol en tu app, esta necesita **acceso avanzado**.

Obtén más información sobre el [acceso estándar y el acceso avanzado](https://developers.facebook.com/docs/graph-api/overview/access-levels), los datos a los que puedes acceder con cada uno y los requisitos de implementación.

## Próximos pasos

- [Envía un mensaje de prueba](https://developers.facebook.com/docs/messenger-platform/get-started/): obtén información sobre cómo usar la plataforma para enviar un mensaje.
- [Conoce nuestra app de ejemplo](https://developers.facebook.com/docs/messenger-platform/getting-started/sample-experience): descarga el código de nuestra app de ejemplo para obtener más información sobre las funciones que ofrece la plataforma de Messenger.

## Más información

- Obtén información sobre cómo recibir notificaciones cuando una conversación se pasa de una app a otra usando el [protocolo de traspaso de Messenger](https://developers.facebook.com/docs/messenger-platform/handover-protocol/#subscribe-to-webhook-events).
- Obtén más información sobre los [webhooks de Meta para la API Graph](https://developers.facebook.com/docs/graph-api/webhooks).
```



## Page: https://developers.facebook.com/docs/graph-api/webhooks/reference

```markdown
# Referencia de webhooks

Es una lista completa de temas de webhooks.

### Temas de webhooks

| Tema | Descripción |
|------|-------------|
| [`Ad Account`](https://developers.facebook.com/docs/graph-api/webhooks/reference/ad-account/) | List of Ad account fields you can subscribe to. |
| [`Application`](https://developers.facebook.com/docs/graph-api/webhooks/reference/application/) | Category of updates that are sent to a specific app. |
| [`Catalog`](https://developers.facebook.com/docs/graph-api/webhooks/reference/catalog/) | Category of updates relating to product catalog changes and events. |
| [`Instagram`](https://developers.facebook.com/docs/graph-api/webhooks/reference/instagram/) | Category of updates relating to activity on Instagram user. |
| [`Managed Meta Account`](https://developers.facebook.com/docs/graph-api/webhooks/reference/managed-meta-account/) | Category of updates relating to managed meta account migration (EntMWABusinessUserMigration). |
| [`Page`](https://developers.facebook.com/docs/graph-api/webhooks/reference/page/) | Page profile webhook fields you can subscribe to. In order for these webhooks to be sent to an app's webhook callback URL, a page admin with MODERATE privileges must grant the app the pages_manage_metadata permission. |
| [`Permissions`](https://developers.facebook.com/docs/graph-api/webhooks/reference/permissions/) | Category of updates relating to a user's granting or revoking a permission to your app. |
| [`User`](https://developers.facebook.com/docs/graph-api/webhooks/reference/user/) | Full list of user profile fields that you can subscribe to. |
| [`Whatsapp Business Account`](https://developers.facebook.com/docs/graph-api/webhooks/reference/whatsapp-business-account/) | Category of updates relating to a WhatsApp business account. |

[Volver arriba](#referencia-de-webhooks)
```