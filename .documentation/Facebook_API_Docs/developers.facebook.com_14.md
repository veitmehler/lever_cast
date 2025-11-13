# API Documentation

**Source URL:** https://developers.facebook.com/docs/business-sdk/
**Scraped Date:** 2025-11-12 16:08:17

---



## Page: https://developers.facebook.com/docs/business-sdk/

```markdown
# SDK de Meta para empresas

El SDK de Meta para empresas te brinda acceso a nuestro conjunto de API comerciales, lo que te permite crear soluciones únicas y personalizadas para tus empresas y clientes.

## Usos comunes

- [Compra de anuncios](https://developers.facebook.com/docs/business-sdk/common-scenarios/ads-buying): guía para crear campañas publicitarias de anuncios de clic a Messenger y promocionar tu página de Facebook.
- [Administración de Instagram](https://developers.facebook.com/docs/business-sdk/common-scenarios/instagram-management): guía para publicar fotos y responder a comentarios en Instagram.
- [Registro de clientes a gran escala](https://developers.facebook.com/docs/business-sdk/common-scenarios/onboard-at-scale): guía para administrar cientos o miles de pequeñas empresas y ofrecerles anuncios para comprar desde tu sitio web o plataforma.
- [Administración de la página](https://developers.facebook.com/docs/business-sdk/common-scenarios/page-management): guía para crear páginas, actualizar páginas y administrar contenido.
- [Administración de catálogo](https://developers.facebook.com/docs/marketing-api/catalog/get-started/integrate-via-meta-sdk): guía para administrar productos.

## Contenido de la documentación

| **Sección** | **Descripción** |
|-------------|-----------------|
| ### [Información general](https://developers.facebook.com/docs/business-sdk/overview) | Explicaciones de conceptos básicos y requisitos de uso. |
| ### [Primeros pasos](https://developers.facebook.com/docs/business-sdk/getting-started) | Un breve tutorial sobre cómo implementar el SDK de Meta para empresas. |
| [Java](https://developers.facebook.com/docs/business-sdk/getting-started#java) | [Node.js](https://developers.facebook.com/docs/business-sdk/getting-started#js) | [PHP](https://developers.facebook.com/docs/business-sdk/getting-started#php) | [Python](https://developers.facebook.com/docs/business-sdk/getting-started#python) | [Ruby](https://developers.facebook.com/docs/business-sdk/getting-started#Ruby) |
| ### [Guías](https://developers.facebook.com/docs/business-sdk/common-scenarios) | Guías basadas en casos de uso que te ayudan a realizar acciones específicas. |
| ### [Referencia](https://developers.facebook.com/docs/business-sdk/reference) | Especificaciones de productos y referencias de puntos de conexión. |
| ### [Ayuda](https://developers.facebook.com/docs/business-sdk/faq) | Soluciones a problemas comunes, consejos para solucionar problemas y preguntas frecuentes. |
```



## Page: https://developers.facebook.com/docs/business-sdk/common-scenarios/add-apis

# Using Other APIs with the Meta Business SDK

## Reply to a Message

In this code example, we are replying to a message a person sent to a Facebook Page. We use the Conversations API to get information about the message and to send a reply.

Learn more about the [Conversation API](https://developers.facebook.com/docs/graph-api/reference/conversation) and the [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/).



## Page: https://developers.facebook.com/docs/business-sdk/common-scenarios/onboard-at-scale

# Onboard Clients at Scale

## Overview

Use this guide if you manage hundreds or thousands of small businesses and want to offer ads buying within your website or platform.

We have built a set of APIs that allow you to onboard your clients to Meta advertising with great ease. Using this solution, you can:

- Create ad accounts for your clients
- Manage their ad campaigns
- Pay for any ads created on their behalf directly to Meta 

This solution allows our partners to build new ads buying experiences within their website or platform.

### How it Works

The solution allows you to manage ads and other assets programmatically via the API on behalf of your clients. You have access to the ads and assets you create and get to maintain a billing relationship with your client for any Meta Ads created on their behalf. This enables you to offer fully managed ads services or simplified self-serve ads buying experiences thereby improving return and reducing churn. A typical user flow involves your clients going to your website or platform, selecting the ads product they are interested in, some customization to support their use case and finally establishing a billing payment with you.

When using the [2-tier Business Manager solution](https://developers.facebook.com/docs/marketing-api/business-manager-api/2tier-bm-solution/), you can create a child Business Manager on behalf of your client using their user access token and a Facebook Page owned by your client.

Your client **does not have access** to:

- The client Business manager, by default, but you have complete access to the child Business Manager, and can choose to give your clients read-only permission.
- The new child Business Manager and its ad account, unless you explicitly grant access.

### About the Setup

- This client Business Manager has an Admin system user attached to it with **advertiser access** to the page provided by your client during the Business Manager creation.
- Using the access token of the Admin system user for the client Business Manager, an ad account can be created for the client Business Manager and any other assets, such as pixel, custom audience, product catalog, and so on, can be associated with it.
- You can also share the line of credit (LOC) attached to your parent Business Manager with its client Business Manager, and assign a spend limit to it to prevent accidental overspend.

Below is a diagram that summarizes the model.

![Business Model Diagram](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/31428455_2399241646768538_1725391738371047424_n.png?stp=dst-webp&_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=DxbR6YDnF0gQ7kNvwEN_81c&_nc_oc=Adk3gyLocKzTmkbxPn-FrXMf9dcviAf2JkyLdHdGOsBaY_ZDUcOIzpRzPqs7KN80qiUBMGseLDLxGPj7zdgxNRAi&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=SAc3-jNUYXwb6n9AREUhew&oh=00_Afh3crYe1oryR1bdZitzxXL2V0BAFAkE15nhtbtYUxvkKQ&oe=692F2440)

- BM: Business Manager
- C: Client
- SAU: System Admin User

### Why use this solution?

- **Lowers the friction** for your client signing up for Meta advertising and improves your clients' stickiness to your platform.
- **Allows more revenue models** for you and settles the balance with Meta after setting aside service fees. You can share your line of credit with the child Business Managers on behalf of your clients.
- **Scales well**. It doesn't require any manual intervention from Meta every time your Business Manager reaches the limit of maximum number of Ad Accounts.
- **Organizes all the assets for clients more cleanly**. Instead of you managing all the assets (Pages/Custom Audiences/pixels, and so on) within one Business Manager, it organizes all the assets for a client within their own Business Manager.
- **Provides you with actionable notifications** for critical errors when an ad Account has been blocked due to policy violation.
- Allows you to get **consolidated invoices** for all your ad accounts, which helps with bookkeeping.

### Learn More

[2-Tier Business Manager Solution](https://developers.facebook.com/docs/marketing-api/business-manager-api/2tier-bm-solution/)



## Page: https://developers.facebook.com/docs/business-sdk/overview

```markdown
# Overview

This guide gives an overview of the Meta Business SDK and its major components.

Many businesses use multiple Meta APIs to serve their needs. Adopting all these APIs and keeping them up to date across the various platforms can be time-consuming and inefficient. For this reason, Meta has developed the Business SDK that bundles business-focused APIs into one SDK to ease implementation and upkeep.

## Components

### Business Manager API

The [Business Manager API](https://developers.facebook.com/docs/marketing-api/business-manager-api) allows you to manage Meta assets, permission controls, and ad campaigns for pages and ad accounts.

### Pages API

The [Pages API](https://developers.facebook.com/docs/pages/) allows management of a business' official presence and community on Facebook.

### Marketing API

The [Marketing API](https://developers.facebook.com/docs/marketing-apis) allows management of ad products, including ads creation, editing, insights, and performance.

### Instagram Graph API

The [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) allows management of a business’ organic presence on Instagram.

## Versioning

The Meta Business SDK follows the same release cycle as the Graph API. New versions will be generated with a new release of the APIs. The SDK will have only one active version meaning we will not support bug fixes for older versions. Subversions of the active version are supported. For example, the active version is 3.0 but a bug was found; we will release the fix in the 3.0.1 subversion. Please refer to the [Graph API Changelog](https://developers.facebook.com/docs/graph-api/changelog) for version release dates.

## Next Steps

- [Getting Started with the Meta Business SDK](https://developers.facebook.com/docs/business-sdk/getting-started)
- [Onboarding at Scale](https://developers.facebook.com/docs/business-sdk/common-scenarios/onboard-at-scale)
- [Meta Business SDK Reference](https://developers.facebook.com/docs/business-sdk/reference)
- [Meta Business SDK Support](https://developers.facebook.com/docs/business-sdk/support)
```



## Page: https://developers.facebook.com/docs/business-sdk/getting-started

```markdown
# Primeros pasos con el SDK de Meta para empresas

En este documento, se explica cómo instalar el SDK de Meta para empresas y cómo probar la instalación. Hay SDK disponibles para [Java](#java), [JavaScript](#js), [PHP](#php), [Python](#python) y [Ruby](#ruby). Si ya tienes la API de marketing instalada, descubre cómo puedes [actualizarte con el SDK de Meta para empresas](#for-current-marketing-api-users).

## Antes de empezar

Necesitarás acceso a lo siguiente:

- Una [cuenta de desarrollador de Meta](https://developers.facebook.com/docs/apps#register)
- Una app de Meta [registrada](https://developers.facebook.com/docs/apps#app-id) con la configuración básica lista
- La [clave secreta de la app](https://developers.facebook.com/docs/facebook-login/security/#appsecret)
- Una [cuenta publicitaria](https://www.facebook.com/ads/manager/accounts/)
- Un [token de acceso a la página](https://developers.facebook.com/docs/facebook-login/access-tokens/)

## Java

En las apps de Java, puedes usar cualquier entorno de desarrollo, pero debe admitir las compilaciones de Maven.

### Instalar el SDK

En tu proyecto de Maven, agrega el siguiente código XML en la sección `<dependency>` del archivo `pom.xml`:

```xml
<!-- https://mvnrepository.com/artifact/com.facebook.business.sdk/facebook-java-business-sdk -->
<dependency>
    <groupId>com.facebook.business.sdk</groupId>
    <artifactId>facebook-java-business-sdk</artifactId>
    <version>[8.0.3,)</version>
</dependency>
```

### Crear una clase de Java

En `src/main/java`, crea una clase de Java llamada `TestFBJavaSDK` y, luego, agrega el siguiente código. Asegúrate de reemplazar `{access-token}`, `{appsecret}` y `{adaccount-id}` con tus propios valores.

```java
import com.facebook.ads.sdk.APIContext;
import com.facebook.ads.sdk.APINodeList;
import com.facebook.ads.sdk.AdAccount;
import com.facebook.ads.sdk.Campaign;

public class TestFBJavaSDK {
    public static final APIContext context = new APIContext("{access-token}", "{appsecret}");
    
    public static void main(String[] args) {
        AdAccount account = new AdAccount("act_{{adaccount-id}}", context);
        try {
            APINodeList<Campaign> campaigns = account.getCampaigns().requestAllFields().execute();
            for (Campaign campaign : campaigns) {
                System.out.println(campaign.getFieldName());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Probar la instalación

Desarrolla y ejecuta tu app. Deberías ver el resultado en la ventana de registro de la consola. Si aparece un mensaje relacionado con un token vencido, solicita un nuevo token de acceso a la página y vuelve a intentarlo.

## JavaScript (Node.js)

En el caso de las apps de JavaScript, el SDK se distribuye como [paquete de Node.js](https://l.facebook.com/l.php?u=https%3A%2F%2Fdocs.npmjs.com%2Fgetting-started%2Finstalling-node).

Abre una ventana de terminal de comandos y crea una nueva carpeta de proyecto. Crea, configura e instala el proyecto con el siguiente comando:

```sh
npm init
```

Puedes actualizar la configuración más adelante editando directamente el archivo `package.json`.

### Instalar el SDK

Instala el paquete del SDK con el siguiente comando:

```sh
npm install --save facebook-nodejs-business-sdk
```

### Modificar el archivo del proyecto

Abre el archivo `index.js` y agrega el siguiente código. Reemplaza `{access-token}` y `{adaccount-id}` por tus propios valores.

```javascript
const bizSdk = require('facebook-nodejs-business-sdk');

const accessToken = '{access-token}';
const accountId = 'act_{{adaccount-id}}';

const FacebookAdsApi = bizSdk.FacebookAdsApi.init(accessToken);
const AdAccount = bizSdk.AdAccount;
const Campaign = bizSdk.Campaign;

const account = new AdAccount(accountId);
var campaigns;

account.read([AdAccount.Fields.name])
  .then((account) => {
    return account.getCampaigns([Campaign.Fields.name], { limit: 10 }); // fields array and params
  })
  .then((result) => {
    campaigns = result;
    campaigns.forEach((campaign) => console.log(campaign.name));
  })
  .catch(console.error);
```

### Probar la instalación

Prueba la instalación con el siguiente comando:

```sh
node index.js
```

Deberías ver el resultado en la ventana de terminal. Si aparece un mensaje relacionado con un token vencido, solicita un nuevo token de acceso a la página y vuelve a intentarlo.

## PHP

En las apps de PHP, usa [Composer](https://l.facebook.com/l.php?u=https%3A%2F%2Fgetcomposer.org%2Fdownload%2F) para instalar el SDK.

### Instalar el SDK

En una nueva carpeta de proyecto, crea `composer.json` con el siguiente contenido. Reemplaza `{project-name}`, `{Your Name}` y `{your@email.com}` por tus propios valores.

```json
{
    "name": "name/{project-name}",
    "type": "project",
    "require": {
        "facebook/php-business-sdk": "^8.0.3"
    },
    "authors": [
        {
            "name": "{Your Name}",
            "email": "{your@email.com}"
        }
    ]
}
```

En la ventana de terminal, ejecuta el siguiente comando para instalar el SDK:

```sh
composer install
```

### Crear un archivo de proyecto

Crea un archivo `src/test.php` con el siguiente contenido. Reemplaza `{app-id}`, `{access-token}`, `{appsecret}` y `{adaccount-id}` por tus propios valores.

```php
<?php
require_once __DIR__ . '/../vendor/autoload.php';

use FacebookAds\Api;
use FacebookAds\Logger\CurlLogger;
use FacebookAds\Object\AdAccount;
use FacebookAds\Object\Campaign;

$app_id = "{app-id}";
$app_secret = "{appsecret}";
$access_token = "{access-token}";
$account_id = "act_{{adaccount-id}}";

Api::init($app_id, $app_secret, $access_token);

$account = new AdAccount($account_id);
$cursor = $account->getCampaigns();

// Loop over objects
foreach ($cursor as $campaign) {
    echo $campaign->{CampaignFields::NAME} . PHP_EOL;
}
```

### Probar la instalación

Prueba la instalación con el siguiente comando:

```sh
php src/test.php
```

Deberías ver el resultado en la ventana de terminal. Si aparece un mensaje relacionado con un token vencido, solicita un nuevo token de acceso a la página y vuelve a intentarlo.

## Python

En el caso de las apps de Python, el SDK se distribuye como [módulo de pypi](https://l.facebook.com/l.php?u=https%3A%2F%2Fpip.pypa.io%2Fen%2Fstable%2Finstalling) por lo que debes asegurarte de tener pip instalado. Según el sistema que uses, es posible que debas configurar `virtualenv`, `pyenv` o `conda`.

### Instalar el SDK

Instala el SDK con el siguiente comando.

```sh
pip install facebook_business
```

### Crear un archivo de proyecto

Crea el archivo `test.py` con el siguiente contenido. Reemplaza `{app-id}`, `{access-token}`, `{appsecret}` y `{adaccount-id}` por tus propios valores.

```python
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount

my_app_id = '{app-id}'
my_app_secret = '{appsecret}'
my_access_token = '{access-token}'
FacebookAdsApi.init(my_app_id, my_app_secret, my_access_token)

my_account = AdAccount('act_{{adaccount-id}}')
campaigns = my_account.get_campaigns()
print(campaigns)
```

### Probar la instalación

Prueba la instalación con el siguiente comando:

```sh
python test.py
```

Deberías ver el resultado en la ventana de terminal. Si aparece un mensaje relacionado con un token vencido, solicita un nuevo token de acceso a la página y vuelve a intentarlo.

## Ruby

En Ruby, el SDK se distribuye como [paquete de RubyGem](https://l.facebook.com/l.php?u=https%3A%2F%2Frubygems.org%2Fpages%2Fdownload).

### Instalar el SDK

En una ventana de terminal, ejecuta el siguiente comando desde la carpeta del proyecto para instalar el SDK de Meta para empresas para Ruby. Según el entorno en el que trabajes, es posible que debas configurar rbenv o rvm, o bien usar `sudo` antes del comando.

```sh
gem install facebookbusiness
```

### Crear un archivo de proyecto

Crea un archivo `test.rb` con el siguiente contenido. Reemplaza `{access-token}`, `{appsecret}` y `{adaccount-id}` por tus propios valores.

```ruby
require 'facebookbusiness'

FacebookAds.configure do |config|
  config.access_token = '{access-token}'
  config.app_secret = '{appsecret}'
end

ad_account = FacebookAds::AdAccount.get('act_{{adaccount-id}}', 'name')
ad_account.campaigns(fields: 'name').each do |campaign|
  puts campaign.name
end
```

### Probar la instalación

Prueba la instalación con el siguiente comando:

```sh
ruby test.rb
```

Deberías ver el resultado en la ventana de terminal. Si aparece un mensaje relacionado con un token vencido, solicita un nuevo token de acceso a la página y vuelve a intentarlo.

## Información para los usuarios actuales de la API de marketing

Para actualizar el SDK de Meta para empresas desde la API de marketing, sigue estos pasos.

### Java

En el archivo `pom.xml`:

- Actualiza `groupId` de `com.facebook.ads.sdk` a `com.facebook.business.sdk`
- Actualiza `artifactId` de `facebook-java-ads-sdk` a `facebook-java-business-sdk`
- Actualiza `version` a `v8.0.3`

### Nodejs

En el archivo `package.json`:

- Actualiza `facebook-nodejs-ads-sdk` a `facebook-nodejs-business-sdk:v8.0.2`
- Actualiza todas las referencias del nombre del paquete `facebook-nodejs-ads-sdk`, como `require('facebook-nodejs-ads-sdk')`, a `facebook-nodejs-business-sdk`
- Ejecuta `npm install`

### PHP

En el archivo `composer.json`:

- Actualiza `facebook-ads-sdk` a `facebook-business-sdk` con la versión 8.0.3

### Python

- Ejecuta `pip install facebook_business`
- Actualiza todas las referencias al espacio de nombres `facebookads` a `facebook_business`
- Si tienes un archivo `.egg-info`, actualízalo de `facebookads-*.egg-info` al archivo `egg-info` que se acaba de instalar, como `facebook_business-*.egg-info`

### Ruby

- Ejecuta `gem install facebookbusiness`
- Actualiza todas las referencias de `require('facebook_ads')` a `require('facebookbusiness')`

## Más información

Consulta el código fuente del SDK de Meta para empresas en Github.

| SDK de Meta para empresas para Java | SDK de Meta para empresas para JavaScript | SDK de Meta para empresas para PHP |
|--------------------------------------|------------------------------------------|-------------------------------------|
| [Java](https://github.com/facebook/facebook-java-business-sdk) | [JavaScript](https://github.com/facebook/facebook-nodejs-business-sdk) | [PHP](https://github.com/facebook/facebook-php-business-sdk) |
| SDK de Meta para empresas para Python | SDK de Meta para empresas para Ruby |
| [Python](https://github.com/facebook/facebook-python-business-sdk) | [Ruby](https://github.com/facebook/facebook-ruby-business-sdk) |
```



## Page: https://developers.facebook.com/docs/business-sdk/guides/crash-reports

# Meta Business SDK Crash Reports

If your app crashes due to the Meta Business SDK, a crash report will be generated by your app and sent to Meta when your app is restarted. This crash report helps Meta monitor our SDK quality and stability. The crash report contains only the cause of the crash and SDK information, but does not contain any user data. Crash reports are sent by default for all apps. To disable crash reports, add the following code to your app.

## Java

The following is the default code that enables crash reporting to Meta.

```java
APIContext context = new APIContext(ACCESS_TOKEN, APP_SECRET);
```

To disable crash reporting, add the following line below the initial `APIContext` call.

```java
APIContext context = new APIContext(ACCESS_TOKEN, APP_SECRET);
APIContext.disableCrashReport();
```

or

```java
APIContext context = new APIContext(ACCESS_TOKEN, APP_SECRET, APP_ID, false);
```

## JavaScript (Node.JS)

The following is the default code that enables crash reporting to Meta.

```javascript
FacebookAdsApi.init(accessToken);
```

To disable crash reporting, add `crash_log=false` to the `FacebookAdsApi.init` function.

```javascript
FacebookAdsApi.init(accessToken, crash_log=false);
```

## PHP

The following is the default code that enables crash reporting to Meta.

```php
Api::init($app_id, $app_secret, $access_token);
```

To disable crash reporting, add `false` to the `Api::init` function.

```php
Api::init($app_id, $app_secret, $access_token, false);
```

## Python

The following is the default code that enables crash reporting to Meta.

```python
FacebookAdsApi.init(access_token=access_token, debug=True);
```

To disable crash reporting, add `crash_log=False` to the `FacebookAdsApi` function.

```python
FacebookAdsApi.init(access_token=access_token, debug=True, crash_log=False);
```

## Ruby

The following is the default code that enables crash reporting to Meta.

```ruby
FacebookAds.configure do |config|
    config.access_token = ''
    config.app_secret = ''
end
```

To disable crash reporting, add `config.crash_logging_enabled = false` to the `FacebookAds.configure` function.

```ruby
FacebookAds.configure do |config|
    config.access_token = ''
    config.app_secret = ''
    config.crash_logging_enabled = false
end
```



## Page: https://developers.facebook.com/docs/business-sdk/common-scenarios/token-switch

# Get a Page Access Token

This document explains how to get a list of Page access tokens for Facebook Pages a person using your app manages.

## Requirements

- A valid User access token
- The person requesting the token must be able to [perform a task](https://developers.facebook.com/docs/pages/overview#tasks) on the Page
- At least one [Page permission](https://developers.facebook.com/docs/pages/overview#permissions) applicable to the request being made

The following code example exchanges a User access token for a Page access token. Using the User access token, a list of all Pages the User manages is returned. This list includes Page access tokens for each Page. You can then use the Page access token to get information about the Page, such as `page_fan_adds` insights.

These Page access tokens are valid for 1 hour.

## Learn More

- [Access Token Guide](https://developers.facebook.com/docs/facebook-login/access-tokens/) – Learn more about access tokens.
- [Long-lived Access Tokens Guide](https://developers.facebook.com/docs/facebook-login/access-tokens/refreshing) – Learn how to extend the expiry of your access tokens.



## Page: https://developers.facebook.com/docs/business-sdk/faq

# Support

## FAQ

### What's the difference between the Business SDK and Marketing API SDK?

The Meta Business SDK is a toolkit that simplifies how you interact with a suite of Facebook's business-focused APIs. It is an upgraded version of the Marketing API SDK that includes Marketing API as well as many Meta APIs from different platforms such as Pages, Business Manager, Instagram, etc.

The Marketing API SDK is specifically for ads, which helps you to integrate with Marketing API and manage your Meta ads much easier.

### What do I need before implementing the SDK?

Before implementing the SDK you will need:
- A Meta Developer Account
- An Meta App ID
- An Meta App Secret
- A Facebook Page Access Token
- An Meta Ad Account

Learn more about these prerequisites in the [Getting Started Guide](https://developers.facebook.com/docs/business-sdk/getting-started#prerequisites-for-using-the-sdk) for the Meta Business SDK.

### How can I download the Meta Business SDK?

You can download the SDK from Github, or one of the package management systems your language uses. We provide a composer for PHP, Mavin for Java, pypi for Python, gem for Ruby, and npm for Nodejs, as following:
- [Facebook PHP Ads SDK](https://github.com/facebook/facebook-php-ads-sdk)
- [Facebook Node.js Ads SDK](https://github.com/facebook/facebook-nodejs-ads-sdk)
- [Facebook Python Ads SDK](https://github.com/facebook/facebook-python-ads-sdk)
- [Facebook Java Ads SDK](https://github.com/facebook/facebook-java-ads-sdk)
- [Facebook Ruby Ads SDK](https://github.com/facebook/facebook-ruby-ads-sdk)

### What if an endpoint I need is not included in Meta Business SDK?

If the endpoint is supported in latest API version but not supported in SDK, you could report it on Github. We will have bump up versions, such as v3.0.1, to enable some high demand requests.

### I'd like to create a Facebook Page right now. Where can I start?

Visit the [Page Creation UI](https://www.facebook.com/pages/create).

### Do I need to connect my Facebook Page to my app on the Meta Developer site?

Yes, you need to connect your Page to your app so your app has the ability to access certain Pages API endpoints.

### How can I enable logger to debug if the SDK function doesn't work for my request?

You can add `CurlLogger` at the beginning of your class to allow the terminal to print the `curl` request when you run an SDK function call. If the `curl` request is incorrect, for example, you see a totally different `curl` request for the exact same parameters on the same endpoint from Graph API Explorer tool, then please help file a bug in Github. Different languages might have different syntax to add the logger so please refer to the Github Readme file or sample code to see how to implement the logger.

### Can I get an older version (before v3.0) of the Meta Business SDK?

You cannot. The Meta Business SDK started with v3.0.

### Do I need to register my app to use some beta version endpoints (e.g. Instagram, Solutions to Onboarding Clients at Scale, etc.)?

The Meta Business SDK includes some endpoints that are still in beta, such as the Instagram Content Publishing APIs and Solution to Onboarding Clients at Scale APIs. You need to get your app approved for those beta version endpoints before you can use the related SDK functions successfully. Learn more about available endpoints in the [Graph API Reference docs](https://developers.facebook.com/docs/graph-api/reference).

## Troubleshooting

To begin troubleshooting, please enable debugging in the `APIContext` file. 

There are many possible causes for a failed request:
- **Incorrect parameters in the API Request**  
  If it's caused by incorrect parameters, you'll see error descriptions in the exception message. Check [Graph API Docs](https://developers.facebook.com/docs/graph-api/using-graph-api/error-handling) to get more information about error codes and error handling.

- **Permission Issue**  
  If it's caused by permission issue, you'll see error messages like "permission denied" or "unknown path". Check your access token or app secret to make sure the needed permissions are included.

- **SDK Bug**  
  If in stacktrace you see that the failed request is caused by exceptions such as `NullPointerException` or `MalformedResponseException`, it is likely an SDK bug (or your own bug, depending on the stacktrace). If you see in the debug message that the params sent to the server don't match what you specified, it is possible that you didn't specify the param correctly, or the SDK didn't assemble the request properly. If it is an SDK bug, please help report it on [Facebook Platform Bugs](https://developers.facebook.com/bugs/). Thanks!

- **Temporary Network Issue**  
  Check your network and retry.

- **Temporary Server Issue**  
  For a temporary server issue, typically retry should work after a few seconds. You could retry, or report the issue at [Facebook Platform Bugs](https://developers.facebook.com/bugs/) if it happens too often.

- **Server bug**  
  If the server persistently responds with "Unknown error," then it is potentially a server bug. Please help report it on [Meta Platform Bugs](https://developers.facebook.com/bugs). Thanks!



## Page: https://developers.facebook.com/docs/business-sdk/common-scenarios/ads-buying

```markdown
# Ads Buying

The following guide shows how to create ad campaigns for [Click to Messenger Ads](#messenger) and Facebook Page [promotions](#page-promo).

## Click to Messenger Ads

Click-to-Messenger Ads allow people to directly start a thread with your Facebook Page when they click on your ad.

### Requirements

- An Ad Account ID

### Sample Code

The following code example shows you how to create an ad that will run during a designated time period.

## Page Promotion

Create an ad to increase traffic to your Facebook Page.

### Requirements

- An Ad Account ID
- A Facebook Page ID

### Sample Code

The following code example shows you how to create an ad campaign to promote your Page to get more Page Likes. The ad will run in the US with a daily budget of $1000 USD where ad impressions is the goal of the campaign.

## Learn More

- [Messenger Ads docs](https://developers.facebook.com/docs/messenger-platform/discovery/ads) – Learn more about Messenger Ads
- [Ad Set Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign) – Learn more about Ad Sets
```



## Page: https://developers.facebook.com/docs/business-sdk/reference

# Reference

The Meta Business SDK consists of the follow APIs which consist of nodes (objects), edges (collections) on those nodes, and fields (object properties). These APIs are listed below. Refer to each API's individual reference document to learn more about its nodes, edges, and fields.

The Meta Business SDK bundles the following APIs:

- [Business Manager API](https://developers.facebook.com/docs/marketing-api/business-manager-api)
- [Instagram API](https://developers.facebook.com/docs/instagram-api/)
- [Marketing API](https://developers.facebook.com/docs/marketing-api)
- [Pages API](https://developers.facebook.com/docs/pages)
- [Catalog API](https://developers.facebook.com/docs/marketing-api/catalog/get-started/integrate-via-meta-sdk)