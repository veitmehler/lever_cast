# API Documentation

**Source URL:** https://developers.facebook.com/docs/facebook-login/limited-login/
**Scraped Date:** 2025-11-12 14:46:45

---



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/

```markdown
# Inicio de sesión limitado

Hicimos un cambio en los puntos de conexión del inicio de sesión limitado: ahora es posible acceder desde [limited.facebook.com](https://limited.facebook.com).

El inicio de sesión con Facebook ofrece un modo de inicio de sesión limitado. El uso de la versión limitada del inicio de sesión con Facebook junto con la app no se utilizará para personalizar los anuncios ni para medir la efectividad de la publicidad.

## Cómo funciona

El inicio de sesión limitado devuelve un `AuthenticationToken` que incluye un token de [OpenID Connect](https://l.facebook.com/l.php?u=https%3A%2F%2Fopenid.net%2Fconnect%2F&amp;h=AT1Ece564dADQwl25DLjZ6XKa6a_DS73O8UPA8mypHjy406j9BE3i52HAS_Ok1XpbcRPdMmCj5DQBVZJnCD6Fwk7g-zXsYJw2lpDiiQsdBkJqhK1S82rAehVjbxlTCxOY9kZ4tcb6L7V0ZtnMASOAX5MR5Y). No se puede usar el token del identificador para solicitar datos adicionales mediante la API Graph, como amigos, fotos o páginas, ni para obtener otros tokens, como tokens de [página](https://developers.facebook.com/docs/facebook-login/access-tokens#pagetokens) o de [información de sesión](https://developers.facebook.com/docs/facebook-login/access-tokens/session-info-access-token/). Para hacerlo, es necesario usar el [inicio de sesión con Facebook](https://developers.facebook.com/docs/facebook-login/ios/) clásico (que no es compatible con las medidas de seguridad del inicio de sesión limitado).

El inicio de sesión correcto completa una instancia global del `AuthenticationToken`. Si intentas iniciar sesión, puedes proporcionar un elemento "nonce", un valor de cadena que elijas, que se incluirá en el token que se devuelve para su validación. A su vez, el inicio de sesión limitado completa una instancia de perfil compartido que contiene la información básica, incluidos el identificador específico de la app, el nombre y la foto del perfil. Si el usuario lo permite, también se puede incluir otro tipo de información. Consulta [Permisos en el inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/permissions/).

## Más información

- [Inicio de sesión con Facebook para iOS](https://developers.facebook.com/docs/facebook-login/ios/)
- [Inicio de sesión limitado para iOS](https://developers.facebook.com/docs/facebook-login/limited-login/ios/)
- [Inicio de sesión para Unity](https://developers.facebook.com/docs/facebook-login/limited-login/unity/)
- [Token de OIDC de inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/token/)
- [Validación del token de OIDC de inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating)
- [Permisos en el inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/permissions/)
- [Preguntas frecuentes sobre el inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/faq/)
```



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/ios

```markdown
# Limited Login for iOS

[Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/) allows developers to signal that a login is limited in terms of tracking users.

## What to Expect

A successful login attempt will populate a global `AuthenticationToken` instance that provides information about the login attempt that can be used to verify the authentication on the client’s servers. Additionally, we will populate a shared Profile instance that will contain basic information including an app-scoped ID for the user, the user's name, and profile picture.

### Permissions

The available [permissions](https://developers.facebook.com/docs/facebook-login/limited-login/ios/permissions) you can request are the following:

- `public_profile`
- `email`
- `gaming_profile`
- `gaming_user_picture`
- `user_age_range`
- `user_birthday`
- `user_friends`
- `user_gender`
- `user_hometown`
- `user_link`
- `user_location`
- `user_messenger_contact`

### Custom Nonces

Limited Login allows developers to pass a nonce for use in verifying an authentication attempt on their servers. For information on using the nonce to validate tokens, see [Validating the Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating).

### Limitations

App switch, in which the login dialog is presented to the user in the Facebook for iOS app when they are already logged in there, is not supported for limited login flows.

## New API Elements

The Facebook SDK for iOS provides a new `FBSDKLoginTracking` enumeration. The possible values are `enabled` and `limited`. For Limited Login, use `limited`.

```swift
enum LoginTracking {
    case enabled
    case limited
}
objective-c
typedef NS_ENUM(NSUInteger, FBSDKLoginTracking) {
  FBSDKLoginTrackingEnabled,
  FBSDKLoginTrackingLimited,
} NS_SWIFT_NAME(LoginTracking);
```

In addition, Limited Login uses `FBSDKLoginConfiguration` to modify the default behavior of a login attempt. This configuration can be created with default properties, explicit properties (Swift only), or with one of several initializers:

```swift
init?(permissions: Set<Permission> = [], tracking: LoginTracking = .enabled, nonce: String = UUID().uuidString)
objective-c
- (instancetype)initWithPermissions:(NSArray<NSString *> *)permissions
                           tracking:(FBSDKLoginTracking)tracking
                             nonce:(NSString *)nonce;
```

### Properties

| Property | Description |
|----------|-------------|
| `requestedPermissions: Set<Permissions>` (Swift) | Requested permissions for the login attempt. Defaults to an empty set. |
| `requestedPermissions: Set<String>` (ObjC) | Requested permissions for the login attempt. Defaults to an empty set. |
| `tracking: LoginTracking` | Login tracking preference. Defaults to `.enabled`. |
| `nonce: String` | Nonce that the configuration was created with. A unique nonce will be used if none is provided to the factory method. |

Trying to create a configuration fails if the following conditions are not met:

- Nonce must be a non-empty string that does not include whitespace.
- You cannot request permissions that are out of the scope of the tracking. For example, requesting `user_likes` does not work if the tracking is `.limited`.
- For the permissions you can request, see the [Permissions](#permissions) section.

## Implement Limited Login

To implement Limited Login in your app using the login manager class directly, upgrade to the latest Facebook SDK for iOS and use the following code:

```swift
let loginManager = LoginManager()

// Ensure the configuration object is valid
guard let configuration = LoginConfiguration(
    permissions: ["email", "user_friends", "user_birthday", "user_age_range", "user_gender", "user_location", "user_hometown", "user_link"],
    tracking: .limited,
    nonce: "123") else {
    return
}

loginManager.logIn(configuration: configuration) { result in
    switch result {
    case .cancelled, .failed:
        // Handle error
        break
    case .success:
        // getting user ID
        let userID = Profile.current?.userID

        // getting pre-populated email
        let email = Profile.current?.email

        // getting pre-populated friends list
        let friendIDs = Profile.current?.friendIDs

        // getting pre-populated user birthday
        let birthday = Profile.current?.birthday

        // getting pre-populated age range
        let ageRange = Profile.current?.ageRange

        // getting user gender
        let gender = Profile.current?.gender

        // getting user location
        let location = Profile.current?.location

        // getting user hometown
        let hometown = Profile.current?.hometown

        // getting user profile URL
        let profileURL = Profile.current?.linkURL

        // getting id token string
        let tokenString = AuthenticationToken.current?.tokenString
    }
}
```

To implement Limited Login in your app using the login button, upgrade to the latest Facebook SDK for iOS and use the following code:

```swift
override func viewDidLoad() {
    super.viewDidLoad()
    setupLoginButton()
}

func setupLoginButton() {
    loginButton.delegate = self
    loginButton.permissions = ["email"]
    loginButton.loginTracking = .limited
    loginButton.nonce = "123" as NSString
}

func loginButton(_ loginButton: FBLoginButton, didCompleteWith potentialResult: LoginManagerLoginResult?, error potentialError: Error?) {
    if let error = potentialError {
        // Handle Error
    }

    guard let result = potentialResult else {
        // Handle missing result
        return
    }

    guard !result.isCancelled else {
        // Handle cancellation
        return
    }

    // Handle successful login
    let userID = Profile.current?.userID
    let email = Profile.current?.email
    let tokenString = AuthenticationToken.current?.tokenString
}
```

## See Also

- [Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/)
- [Limited Login for Unity](https://developers.facebook.com/docs/facebook-login/limited-login/unity/)
- [Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/)
- [Validating the Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating)
- [Permissions in Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/ios/permissions)
- [Limited Login FAQ](https://developers.facebook.com/docs/facebook-login/limited-login/faq/)
```



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/token/validating

```markdown
# Validating the Limited Login OIDC Token

A successful login in Limited Login returns an `AuthenticationToken` instance. This is a JSON web token (JWT) containing your nonce, if you provided one, a signature, and other pieces of information. Your app should validate the token to make sure it is authentic.

In particular, your app should check the following:

1. [That the JWT is well formed](#jwt-well-formed)
2. [The signature](#signature)
3. [The standard claims](#standard-claims)

Your app should accept only tokens that have passed all three checks.

## Check That the JWT is Well Formed

1. Check that the JWT consists of three Base64Url-encoded parts separated by periods:
   1. Header
   2. Payload
   3. Signature
2. Parse the JWT to extract the three parts.
3. Decode the payload and verify that it is a valid JSON object.

## Check the Signature

The signature is created with the encoded header and payload of the JWT, a signing algorithm, and a secret or public key, depending on the chosen signing algorithm, which is specified in the header. You check the signature by generating a new Base64url-encoded signature using the public key (RS256) and checking that the signature you generate matches the signature in the JWT.

1. Retrieve the public key from the JSON web key set (JWKS) by calling the token's [JWKS endpoint](https://developers.facebook.com/docs/facebook-login/limited-login/token/#jwks).
2. Use the signing algorithm specified in the header on the concatenated original Base64url-encoded header and original Base64url-encoded payload of the JWT (`Base64url-encoded header + "." + Base64url-encoded payload`), and run them through the cryptographic algorithm specified in the header.
3. Base64url-encode the result and check that it matches the signature in the JWT.

## Check the Standard Claims

The standard claims are part of the JWT payload.

1. Retrieve the following standard claims from the decoded payload:
   1. Token expiration (`exp: Unix timestamp`)
   2. Token issuer (`iss: string`)
   3. Audience (`aud: string`)
   4. [Nonce](https://developers.facebook.com/docs/facebook-login/limited-login/#how-it-works)
2. Check that the expiration is later than the current date and time. Tokens are short-lived.
3. Check that your issuing authority matches the issuing authority (issuer).
4. Check that the audience matches your app ID.
5. Check that the nonce matches the nonce you provided.
```



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/permissions

```markdown
# Permissions in Limited Login

Developers offering Limited Login to log in to their apps can request the following permissions from users during login. Note that not all permissions are available between [Facebook App Types](/docs/development/create-an-app/app-dashboard/app-types/) and often require [App Review](/docs/app-review/) before they can be used outside of development mode.

See the following sections:

- [Available Permissions](#available-permissions)
- [Key Considerations for user_friends with Limited Login](#key-considerations-user-friends)

## Available Permissions

| Permission              | Description                                                                                          | iOS SDK Release Version | Unity SDK Release Version |
|------------------------|------------------------------------------------------------------------------------------------------|--------------------------|---------------------------|
| `public_profile`       | Requests basic details about the user, including their User ID, Name, and Profile Picture.         | 9.0.0                   | 9.0.0                    |
| `email`                | Requests the user’s email address indicated on their Facebook profile.                              | 9.0.0                   | 9.0.0                    |
| `gaming_profile`       | Requests basic Gaming Profile details for the user, including their User ID and Avatar Name. Note: This permission is used in place of the `public_profile` permission for Facebook Login for Gaming Apps. | 9.0.0                   | 9.0.0                    |
| `gaming_user_picture`  | User's first name and profile picture.                                                             | 9.0.0                   | 9.0.0                    |
| `user_age_range`      | Requests the user’s age range, indicated on their Facebook profile.                                 | 9.2.0                   | 9.1.0                    |
| `user_birthday`       | Requests the user’s birthday, indicated on their Facebook profile.                                  | 9.2.0                   | 9.1.0                    |
| `user_friends`        | Requests the user’s list of friends that have installed the app and granted access to the user_friends permission. | 9.2.0                   | 9.1.0                    |
| `user_gender`         | Allows your app to read a person's gender as listed in their Facebook profile.                      | 11.0.0                  | 11.0.0                   |
| `user_hometown`       | Allows your app to read a person's hometown location from their Facebook profile.                   | 11.0.0                  | 11.0.0                   |
| `user_link`           | Allows your app to access the Facebook profile URL of a person using your app.                     | 11.0.0                  | 11.0.0                   |
| `user_location`       | Allows your app to read the city name as listed in the location field of a person's Facebook profile. | 11.0.0                  | 11.0.0                   |
| `user_messenger_contact` | Allows a business to [contact a person via Messenger](https://developers.facebook.com/docs/facebook-login/login-connect) upon their approval or initiation of a chat thread with the business's Page. | 11.0.0                  | 11.0.0                   |

## Key Considerations for `user_friends` with Limited Login

### Limited Login ASIDs

When you use Limited Login to request `user_friends` from a user, we will provide you with a list of app scoped IDs (ASIDs) associated with the friends of the authorizing user, if the friends have also granted your app the `user_friends` permission. Depending on how you have implemented Limited Login, some of the ASIDs on this list may represent other users that have connected to your app using Limited Login. To ensure that Limited Login safeguards are maintained for such users, do not make Graph API calls using their ASIDs. Instead, continue to rely on Limited Login for these users.

### Visibility of `user_friends`

In both Classic and Limited Login, the `user_friends` permission provides access to a list of the user’s friends who have also installed the app and granted the `user_friends` permission. This means that when receiving the list of a user’s friends during authentication for the first time, it will include their friends who are existing users of your app. However those friends would not have had the authenticating user on their friends lists because that user had not yet installed your app and granted the `user_friends` permission.

An example of this is as follows:

1. User A and User B are Facebook Friends who do not use the developer’s app.
2. User A logs into and grants access to the `user_friends` permission to a developer’s application.
3. User B will not be on User A’s friend list returned by Facebook Login. This is because User B has not granted the application the `user_friends` permission.
4. User B logs into and grants access to the `user_friends` permission to the same application.
5. User A will be on User B’s friend list returned by Facebook Login because User A is an existing user of the app that had previously granted `user_friends` permission.
```



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/unity

```markdown
# Limited Login for Unity

Along with v9.0 of the iOS SDK, the Unity SDK has been updated to enable iOS developers to offer [Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/) to their users. In summary, this update adds an Authentication Token for use to verify a user’s identity on login, with other Graph API features available using the classic Facebook Login product.

### Permissions

Limited Login offers a limited set of [permissions](https://developers.facebook.com/docs/facebook-login/limited-login/ios/permissions) you can request:

- `public_profile`
- `email`
- `gaming_profile`
- `gaming_user_picture`
- `user_age_range`
- `user_birthday`
- `user_friends`
- `user_gender`
- `user_hometown`
- `user_link`
- `user_location`
- `user_messenger_contact`

## Implementing Limited Login

To use Limited Login with the Unity SDK, use the `LoginWithTrackingPreference` function to specify that the `LoginTracking` preference is `LIMITED` for a given login request. Additionally, developers can include an optional `nonce` meant to verify the response from the Unity SDK. For more information on validating the OIDC token, see [Validating the Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating).

```csharp
FB.Mobile.LoginWithTrackingPreference(LoginTracking.LIMITED, scopes, "nonce123", this.HandleResult);
```

## Retrieving Profile Data

After completing the Login Flow for Limited Login or classic Facebook Login, developers can now retrieve an `AuthenticationToken` from the Unity SDK. To retrieve the user’s basic profile information, developers can request the `Profile` object using the `CurrentProfile` function - which reads the associated `AuthenticationToken`.

```csharp
private void GetProfileInfo()
{
    var profile = FB.Mobile.CurrentProfile();
    if (profile != null)
    {
        this.userName = profile.Name;
        this.userId = profile.UserID;
        this.userEmail = profile.Email;
        this.profileImageUrl = profile.ImageURL;
        this.userBirthday = profile.Birthday;
        this.userAgeRange = profile.AgeRange;
        this.userFriendIDs = profile.FriendIDs;
        this.userGender = profile.Gender;
        this.userLink = profile.LinkURL;
        this.userHometown = profile.Hometown;
        this.userLocation = profile.Location;
    }
}
```

Be aware that Limited Login and the “Profile” class are currently only available for the iOS SDK and aren’t available for other platforms at this time.

## Reference

### Core

| Name                       | Description                                                                                                           |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `LoginTracking`            | Enum value indicating if the Login request should have tracking enabled. The values available are `ENABLED` and `LIMITED`. |
| `AuthenticationToken`      | Helper class containing the authentication token string granted to your application by the current user. This token includes data for the user’s ID, name, profile picture, and email (if granted by the user). |
| `Profile`                  | Helper class used to retrieve the basic profile information from the current user’s `AuthenticationToken`.            |

### Methods

| Name                                       | Description                                                                                                           |
|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `FB.Mobile.LoginWithTrackingPreference`    | Prompt a user to authorize your app with requested permissions based on their selected tracking preference.           |
| `FB.Mobile.CurrentAuthenticationToken`     | Returns the AuthenticationToken granted to your application by the current user.                                     |
| `FB.Mobile.CurrentProfile`                 | Returns the basic profile information granted to your application by the current user.                               |

`FB.Mobile.LoginWithTrackingPreference`

**Parameters**:

1. `LoginTracking` - Enum selecting between `ENABLED` and `LIMITED`
2. `Scopes` - `Permissions` for this request
3. `Nonce` - Optional string used to verify response
4. Result Handler (`IResult`) - Callback function that will process the login response

**Result**: Handles User Login requests and handles user session

`FB.Mobile.CurrentAuthenticationToken`

**Parameters**: None

**Result**: Returns an “AuthenticationToken” containing the user’s basic profile information, including User ID, User Name, User Profile Picture, and User Email (if permission granted by the user).

`FB.Mobile.CurrentProfile`

**Parameters**: None

**Result**: Returns a Profile object containing the user’s basic profile information. This is automatically retrieved from the user’s Authentication Token.

## Validate the OIDC Token

Before you use the OIDC token serverside, [validate the token](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating) against Facebook's public keys and make sure that the [nonce](#nonce) matches the `nonce` you provided.

## See Also

- [Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/)
- [Limited Login for iOS](https://developers.facebook.com/docs/facebook-login/limited-login/ios/)
- [Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/)
- [Validating the Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating)
- [Permissions in Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/permissions)
- [Limited Login FAQ](https://developers.facebook.com/docs/facebook-login/limited-login/faq/)
```



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/token

```markdown
# Token de OIDC para inicio de sesión limitado

Cuando se realiza correctamente un inicio de sesión limitado, se completa una instancia global del `AuthenticationToken`. Para intentar iniciar sesión, puedes proporcionar un elemento "nonce" que se reflejará en el token de retorno y que tu app pueda usar para [validar el token](/docs/facebook-login/limited-login/token/validating). A su vez, el inicio de sesión completa una instancia de perfil compartido que contiene la información básica, incluidos el identificador, el nombre, la imagen de perfil y el correo electrónico (si el usuario lo permite).

`AuthenticationToken` ofrece un conjunto de puntos de conexión para obtener información sobre la implementación y desinstalar el usuario de la app.

## Puntos de conexión de OIDC

### Punto de conexión de descubrimiento

**Punto de conexión**: https://limited.facebook.com/.well-known/openid-configuration/

**Tipo de solicitud**: `GET`

**Descripción**: devuelve metadatos para la implementación de OIDC de Facebook.

### Punto de conexión de JWKS

**Punto de conexión**: https://limited.facebook.com/.well-known/oauth/openid/jwks/

**Tipo de solicitud**: `GET`

**Descripción**: devuelve las claves públicas para la implementación del OIDC de Facebook en formato JWK.

### Punto de conexión de desinstalación

**Punto de conexión**: https://www.limited.facebook.com/platform/uninstall/

**Tipo de solicitud**: `POST`

**Parámetros**:
- `id_token`
- `app_id`

**Descripción**: reemplaza el punto de conexión `/me/permissions` por solicitudes de inicio de sesión limitado para desinstalar el usuario de la app de Facebook especificada. Este punto de conexión no elimina los permisos del usuario para la aplicación.

## Consulta también

- [Inicio de sesión limitado](/docs/facebook-login/limited-login/)
- [Inicio de sesión limitado para iOS](/docs/facebook-login/limited-login/ios/)
- [Inicio de sesión limitado para Unity](/docs/facebook-login/limited-login/unity/)
- [Validación del token de OIDC de inicio de sesión limitado](/docs/facebook-login/limited-login/token/validating)
- [Preguntas frecuentes sobre el inicio de sesión limitado](/docs/facebook-login/limited-login/faq/)
```



## Page: https://developers.facebook.com/docs/facebook-login/limited-login/faq

```markdown
# Preguntas frecuentes sobre el inicio de sesión limitado

## My login access token is Invalid and/or I can’t check the expiration date of my access token after upgrading the iOS SDK to v17.0.0.0.

In response to [the upcoming changes to ATT enforcement](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Fnews%2F%3Fid%3D3d8a9yyh&amp;h=AT2nQk_S7_dS8kV-slem79PIsXrcZPo3tFzr1aclnDlZrA8Tg6-vroeIEa-uDKiQmWLh8gPdDrJWHN8Ci5DG0g54i8I7wv_1AhXOxIVbFJfAzuCi1-Fmfs8s31YkSU4MlKBuyGlW4GqKEfFMe53jOmuiPDg), we made changes to the iOS SDK and the SDK no longer provides valid user access tokens in scenarios where the user opts out of ATT. The access token validation or Graph API requests may throw errors like OAuthException - “Invalid OAuth access token - Cannot parse access token”. Our recommendation is that users integrate Limited Login following the official documentation:
- [Limited Login for iOS](https://developers.facebook.com/docs/facebook-login/limited-login/ios)
- [Limited Login for Unity](https://developers.facebook.com/docs/facebook-login/limited-login/unity/)

## I am using FB Login for Business, and login is not working after upgrading the iOS SDK to v17.0.0.0.

When users opt out of ATT, all Facebook Login traffic will be performed on the Limited Login domain. Limited Login **does not** support business permissions. Our recommendation is that developers integrate Limited Login following [the official documentation](https://developers.facebook.com/docs/facebook-login/limited-login/ios). See limited login supported permissions in [this document](https://developers.facebook.com/docs/facebook-login/limited-login/permissions).

## I don’t get redirected to the FB app to log into Facebook when logging into my application; a browser is shown instead asking me to log in.

When users opt out of ATT, all Facebook Login traffic will be performed on the limited login domain via the in-app browser. Limited Login **does not** support fast app switch (that is, redirecting to fb app to login). See limitations section of the [Limited Login for iOS](https://developers.facebook.com/docs/facebook-login/limited-login/ios) document.

## How can I validate a Limited Login authentication token after integrating Limited Login?

Please see the official documentation, [Validating the Limited Login OIDC Token](https://developers.facebook.com/docs/facebook-login/limited-login/token/validating).

## Friends information is not returned with the user_friends permission approved while using Limited Login.

Please see key considerations for user_friends with Limited Login in the [Permissions in Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/permissions/#key-considerations-user-friends) document.

## Is there a possibility that Meta would release the privacy manifest with a minor update instead of a major one?

We made changes both to the iOS SDK and our core login systems to support the privacy manifest requirements based on the upcoming [App Transparency Tracking enforcement](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Fnews%2F%3Fid%3D3d8a9yyh&amp;h=AT3Qc7Jc8ENm7qPUaSkOZnvTMbDk717z7jn24FEqvr-RZACJsrpoOxqUFkDAKU6hbqekqEj3tv9W3PaMbhQX34bgZB8qJKSX7DWZE6HXAjwJaaLCoexSIv3RgG3q0nM1IObXzs7qruUqBz4gykAyboMidHE). As a result, we do not plan to release the privacy manifest as part of a minor update.

## ¿Qué sucede cuando se efectúa un inicio de sesión limitado?

Esto autenticará al usuario y rellenará una instancia compartida de un token de autenticación. La información adicional de la llamada de autenticación se utilizará para rellenar la instancia compartida Perfil de usuario con campos básicos.

## ¿Qué sucede cuando se realiza una solicitud graph después de un inicio de sesión limitado?

Una solicitud graph fallará porque no hay un token de acceso. Para obtener un token de acceso, reutiliza el método de inicio de sesión clásico (el seguimiento está activado de forma predeterminada), o llama a `FBSDKLoginManager` `logInFromViewController:configuration:completion:` con una configuración que especifique que el seguimiento está habilitado. Ten en cuenta que al hacer esto, se hace un seguimiento a los usuarios.

## ¿Qué sucede si quieres hacer solicitudes graph después de un inicio de sesión limitado?

Necesitas un token de acceso. Reutiliza el método de inicio de sesión clásico (el seguimiento está activado de forma predeterminada), o llama a `FBSDKLoginManager` `logInFromViewController:configuration:completion:` con una configuración que especifique que el seguimiento está activado. Esto te permitirá obtener un token de acceso que puede utilizarse para las llamadas a la API Graph. Ten en cuenta que al hacer esto, se hace un seguimiento a los usuarios.

## If I use Limited Login to request user_friends, how can I ensure that Limited Login safeguards are maintained for the data that I receive?

When you use Limited Login to request `user_friends` from a user, we provide you with a list of app scoped IDs (ASIDs) associated with the friends of the authorizing user, if the friends have also granted your app the `user_friends` permission. Depending on how you have implemented Limited Login, some of the ASIDs on this list may represent other users that have connected to your app using Limited Login. To ensure that Limited Login safeguards are maintained for such users, do not make Graph API calls using their ASIDs. Instead, continue to rely on Limited Login for these users.

## ¿Hay algún cambio en el uso del botón de inicio de sesión?

Sí. Se agregan dos propiedades públicas:
- `loginTracking`, que se puede utilizar para obtener o establecer la preferencia de seguimiento deseada que usará en los intentos de inicio de sesión. De manera predeterminada, está `.enabled`.
- `nonce`, que se puede utilizar para obtener o establecer un nonce opcional que se usará en los intentos de inicio de sesión. Un nonce válido debe ser una cadena no vacía sin espacios en blanco. Nota: No se establecerá un nonce no válido. En su lugar, se utilizarán nonces únicos predeterminados para los intentos de inicio de sesión.

## ¿Hay algún cambio en el cierre de sesión?

No hay cambios desde la perspectiva del usuario. A bajo nivel, fijará el `AuthenticationToken`, `AccessToken` actual y `Profile` a nulo.

## ¿Está el inicio de sesión limitado disponible para el SDK para tvOS?

En estos momentos, el inicio de sesión limitado no está disponible para tvOS.

## ¿Qué sucederá con los usuarios ya existentes que iniciaron sesión?

Los usuarios existentes que hayan iniciado sesión seguirán asignados al modo de inicio de sesión clásico de forma predeterminada. Únicamente los usuarios nuevos o que hayan cerrado la sesión pueden inicializarse para el modo de inicio de sesión limitado.

## ¿El modo Inicio de sesión limitado se puede configurar para múltiples dispositivos?

No. La marca de Inicio de sesión limitado es específica de dispositivo.

## ¿Cómo puedo conciliar o desduplicar usuarios con diferentes tipos de token en distintos dispositivos?

Puedes conciliar los usuarios por correo electrónico o por [ASID](https://developers.facebook.com/docs/pages/support).

## ¿Perderé el acceso a fb_login_id (es decir, ASID) en el modo de inicio de sesión limitado?

No. `fb_login_id` sigue presente en el modo de inicio de sesión limitado. Es el token de acceso de usuario (entidad independiente) que se cambia por un token de OIDC en el modo de inicio de sesión limitado.

## ¿Está disponible el modo de inicio de sesión limitado para los permisos del negocio?

El modo de inicio de sesión limitado solo admite el perfil básico (nombre y foto) y los permisos de correo electrónico. Si tu aplicación requiere [permisos del negocio](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types#business), no puedes utilizar el inicio de sesión limitado para solicitarlos. Sin embargo, tus usuarios pueden conceder permisos del negocio en el inicio de sesión clásico de las siguientes maneras:
- Cuando inician sesión en tu aplicación a través de la web.
- Cuando inician sesión en tu aplicación a través de iOS en el modo de inicio de sesión clásico.
- Cuando inician sesión en tu aplicación a través Android.

## Can I map users in Limited Login mode across different apps belonging to my business?

Yes, but this will require the use of an app access token to request the `token_for_business` field on the User node. Limited Login safeguards are not supported in this context. For apps that are associated with your business by means of Business Manager, you can use the app-scoped ID (ASID) included in the OIDC token returned after a successful login to get a unique string for a user. Using your app's app access token, request the `token_for_business` field on the [`User`](https://developers.facebook.com/docs/graph-api/reference/user/) node and pass in the user's app-scoped ID. This call returns a string which is the same for this user across all the apps managed by the same Business Manager.

```
GET /ASID?fields=token_for_business
```
This returns the values.
```
{
  "id": "1234567890",
  "token_for_business": "weg23ro87gfewblwjef"
}
```
Usage notes:
- The person being queried must have logged into this app.
- If the owning business changes, the value of `token_for_business` will also change.
- If you request the `token_for_business` field and the app is not associated with a Business Manager, the call returns an error.
- The value returned by `token_for_business` is a token, not an ID - it cannot be used directly against the Graph API to access a person's information. You should still store the ID in your database.

## Consulta también:

- [Inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/)
- [Inicio de sesión limitado para iOS](https://developers.facebook.com/docs/facebook-login/limited-login/ios/)
- [Inicio de sesión para Unity](https://developers.facebook.com/docs/facebook-login/limited-login/unity/)
- [Token OIDC de inicio de sesión limitado](https://developers.facebook.com/docs/facebook-login/limited-login/token/)
```