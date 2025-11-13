# API Documentation

**Source URL:** https://developers.facebook.com/docs/applinks/
**Scraped Date:** 2025-11-12 13:32:24

---



## Page: https://developers.facebook.com/docs/applinks/

```markdown
# App Links

App Links is an open omni-channel solution for deep linking to content in your mobile app.

## Setting Up App Links

**[Adding App Links to Your Existing Content](https://developers.facebook.com/docs/applinks/add-to-content)**  
You can make your existing web content discoverable to mobile clients that support App Links. When people click on links to your existing content through supported clients, they can load the content in your app instead of a web view.

**[Implementations](https://developers.facebook.com/docs/applinks/implementations)**  
Some libraries to help you implement App Links quickly.

**[Samples Apps on GitHub](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FAppLinks%2FSamples&amp;h=AT3zXADIWB8JUeOKEr3MQClV0WUK25Oa8fQw5Xmwdbad7eyJTOGlTU6WD4MlmOpzBs-fjAZhuJNha2GyfrwkAH_RTgOEUCiss66TKhzdKoSE1ezYu7j-l74XQfs7V9EtJ_Bhf7b1hI7cCGYQbdziAKjdt7U)**  
We've provided a few sample apps that you can use as a basis to modify your app to support App Links.

**[Best Practices](https://developers.facebook.com/docs/applinks/best-practices)**  
Learn best practices for setting up App Links.

## Mobile Clients

**[Support Incoming Links for iOS](https://developers.facebook.com/docs/applinks/ios)**  
Learn how to support links to your iOS app. Also learn about the unique UX requirements for iOS and pre-defined widgets you can use to make cross-app navigation easier.

**[Support Incoming Links for Android](https://developers.facebook.com/docs/applinks/android)**  
Support incoming links to your Android app.

## Navigation Protocol

**[Support Outbound Links to Other Apps](https://developers.facebook.com/docs/applinks/navigation-protocol)**  
Learn how to link to other apps using the Meta App Links Index API and the App Links Navigation Protocol.

**[Meta App Links Index API](https://developers.facebook.com/docs/applinks/index-api)**  
Meta provides a Graph API endpoint to look up data for URLs that support the App Links standard.

**[Metadata Reference](https://developers.facebook.com/docs/applinks/metadata-reference)**  
A full reference for the types of metadata you can add to web pages to support App Links.

---

### En esta página

- [App Links](#app-links)
- [Setting Up App Links](#setting-up-app-links)
- [Mobile Clients](#mobile-clients)
- [Navigation Protocol](#navprotocol)
```



## Page: https://developers.facebook.com/docs/applinks/index-api

```markdown
# Finding App Link Data with the Index API

The AppLinks node was [deprecated on February 3, 2020](https://developers.facebook.com/docs/graph-api/changelog/2020-02-03-endpoint-deprecations#links). Visit the [Ads Manager](https://www.facebook.com/adsmanager/manage/ads/) to set links to your app.

If a URL supports App Links, data about the URL is available through Facebook's Index API. Calls to the Index API are made through Facebook's [Graph API](/docs/graph-api/using-graph-api).

Calls to the Index API endpoint must include a valid [access token](/docs/facebook-login/access-tokens). Although any token type will work, you will generally build your app to use client access tokens.

You can access the index api by making a call to `https://graph.facebook.com` an `ids` query along with the `fields=app_links` parameter to find the data associated with App Link URLs:

```
GET graph.facebook.com?ids=http://fb.me/729250327126474&fields=app_links&access_token=YOUR_ACCESS_TOKEN
```

The results use the following format:

```
{
  "http://fb.me/729250327126474": {
    "app_links": {
      "android": [
        {
          "app_name": "scrumptious",
          "package": "com.myapp",
          "url": "scrumptious://ios/23"
        },
        {
          "app_name": "scrumptious",
          "class": "com.myapp.main",
          "package": "com.myapp",
          "url": "scrumptious-test://ios/23"
        }
      ],
      "ios": [
        {
          "app_name": "scrumptious",
          "app_store_id": "123",
          "url": "fancy://"
        }
      ],
      "web": {
        "url": "http://facebooksampleapp.com/"
      }
    },
    "id": "http://fb.me/729250327126474"
  }
}
```

## Querying Multiple Items

You can also make calls to more than one URL at a time by listing the targets as a comma-separated list:

```
GET graph.facebook.com?ids=http://fb.me/729250327126474,http://fancy.com/things/590368473725534365/BBQ-Briefcase&fields=app_links&access_token=YOUR_ACCESS_TOKEN
```

This will return the data as a list of items:

```
{
  "http://fb.me/729250327126474": {
    "app_links": {
      "android": [
        {
          "app_name": "scrumptious",
          "package": "com.myapp",
          "url": "scrumptious://ios/23"
        },
        {
          "app_name": "scrumptious",
          "class": "com.myapp.main",
          "package": "com.myapp",
          "url": "scrumptious-test://ios/23"
        }
      ],
      "ios": [
        {
          "app_name": "scrumptious",
          "app_store_id": "123",
          "url": "fancy://"
        }
      ],
      "web": {
        "url": "http://facebooksampleapp.com/"
      }
    },
    "id": "http://fb.me/729250327126474"
  },
  "http://fancy.com/things/590368473725534365/BBQ-Briefcase": {
    "app_links": {
      "android": [
        {
          "app_name": "Fancy",
          "package": "com.thefancy.app",
          "url": "fancy://things/590368473725534365"
        }
      ],
      "ios": [
        {
          "app_name": "Fancy",
          "app_store_id": "407324335",
          "url": "fancy://things/590368473725534365"
        }
      ],
      "id": "http://fancy.com/things/590368473725534365/BBQ-Briefcase"
    }
  }
}
```

## Filtering Results

You can [filter the response](/docs/graph-api/using-graph-api#fields) to any of `ios`, `iphone`, `ipad`, `android`, `windows`, `windows_phone`, `windows_universal` and `web`.

This call will return only the `ios` data with the `fields` parameter:

```
GET graph.facebook.com?fields=app_links{ios}&ids=http://fb.me/729250327126474
```

Results:

```
{
  "http://fb.me/729250327126474": {
    "ios": [
      {
        "app_name": "scrumptious",
        "app_store_id": "123",
        "url": "fancy://"
      }
    ],
    "id": "http://fb.me/729250327126474"
  }
}



## Page: https://developers.facebook.com/docs/applinks/overview

```markdown
# App Links Overview

App Links is an open standard to deep link to content in your app. When someone using your app shares content to Facebook or another App Links-enabled app you can create a link that makes it possible to jump back into your app from that piece of content. App Links work by adding metadata to existing URLs on the web so that they can be consumed by your app.

The Facebook's app for iOS and Android support App Links today. When the Facebook app comes across a link that supports App Links it will launch your app with the right information so someone can see the content immediately and quickly.

App Links for Web are not supported for Catalog ads. Instead, see [Product Deep Links](/docs/marketing-api/catalog/guides/product-deep-links).

## How App Links Work

**1. A person clicks on a story on Facebook**

If someone shares a story on Facebook with content from your app, people can click on the story to view the content in your app. The URL shared to Facebook contains [App Link metadata](/docs/applinks/add-to-content).

**2. Facebook app looks up the URL to see if it supports App Links**

Once someone clicks on a story, the Facebook App does a lookup to see if the content supports App Links. If it does, the Facebook App takes people to your content, either in a web view or by launching your app and linking to the content, depending on the following criteria:

- Whether people have your app installed
- Whether the device is an Android or iOS device
- Whether your app is mobile only

App Links has the following requirements:

- If the content is a web page, your web page must include [markup](/docs/applinks/add-to-content) to let the app know what app should be launched.
- If the content is mobile only, you must still supply a valid http(s) URL that hosts the App Link metadata.
- In order to accept incoming App Links, your app will need to be set up to support them. We cover how to do that for both [iOS](/docs/applinks/ios) and [Android](/docs/applinks/android).

## Launching Outbound Apps

It's possible for any app to do what the Facebook app does and add support to launch other apps based on App Links. If you've got an app where people want to click through to links instead of just going to inbound links, we've also provided a document that covers how to add support for [the outbound navigation protocol](/docs/applinks/navigation-protocol) to your app.
```



## Page: https://developers.facebook.com/docs/applinks/android

```markdown
# App Links on Android

Your app can post stories to Feed. When people click on those stories, Facebook can send people to either your app or your app's App Store page. This drives traffic and app installs. You can implement this behavior using App Links.

When you set up App Links, you can control what happens when someone taps on one of the links shared through your app or on the story attribution (name of your app) in one of the Open Graph stories shared through your app. The person may be redirected to the web version of your content or they may be directed to your app. If the person doesn't have your app installed, they will be redirected to your app's Google Play listing. The image below shows this flow.

![App Links Flow](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2178-6/10333099_1408666882743423_2079696723_n.png?_nc_cat=108&ccb=1-7&_nc_sid=34156e&_nc_ohc=0bl_ZDuSDNgQ7kNvwGRyNJz&_nc_oc=AdmqL1GKUS7BuD4bvd6Owg3x358W1g8H60HB_BsnkQePhCCBnwfRGZepBCJfFDkaFZU&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=ABuMWwRWvuj42eYwhhOdkQ&oh=00_AfjUgDuU4D48IX81STBpRSj6nENnsFb80oVhyYyOrG6Kag&oe=691A94E8)

In either case, once the person reaches your app (directly or after the app install), information will be passed in the `Intent` that can be used by your app to decide what to show the person to provide continuity in the user experience. For example, if I see a story on my Facebook Feed about one of my friends completing this share tutorial and I tap on it, I will expect to be redirected to a view in your app that features this tutorial and not to your app's main activity.

In the following sections we will explain how to handle incoming links once you've [set up your App Links](/docs/applinks/add-to-content).

## Handling incoming links

First you need to prepare your development environment by linking to or downloading the Facebook App Links SDK for Android.

The App Links SDK for Android is a component of the [Facebook SDK for Android](/docs/android/componentsdks). To use the Facebook Places SDK in your project, make it a dependency in Maven, or download it. Choose the method you prefer with the following button.

### SDK: MAVEN

1. In your project, open **your_app | Gradle Scripts | build.gradle (Project)** and add the following repository to the `buildscript { repositories {}}` section to download the SDK from the Maven Central Repository:
   ```gradle
   mavenCentral()
   ```
2. In your project, open **your_app | Gradle Scripts | build.gradle (Module: app)** and add the following compile statement to the `dependencies{}` section to compile the latest version of the SDK:
   ```gradle
   compile 'com.facebook.android:facebook-applinks:[4,5)'
   ```
3. Build your project.

### Download the SDK

To download the SDK, click the following button.

[Download SDK](https://lookaside.facebook.com/developers/resources/?id=facebook-android-sdk-current.zip)

When you use the Facebook App Links SDK, events in your app are automatically logged and collected for Facebook Analytics unless you disable automatic event logging. For details about what information is collected and how to disable automatic event logging, see [Automatic App Event Logging](/docs/app-events/getting-started-app-events-android#auto-events).

When someone taps a link posted from your app or the app attribution in an Open Graph story posted from your app in Facebook for Android, they'll either be directed to your app or a web version of your content. The redirect behavior depends on how you've configured your App Links and on whether or not you have a mobile-only setup. If your app is mobile only, set `should_fallback=false` so an app redirect takes the person to your app's Google Play listing if it isn't installed. When your app is launched, intent information corresponding to the App Link is sent to your app.

To ensure an engaging user experience, you should process the incoming intent information when your app is activated and direct the person to the object featured in the story they're coming from. For example, if I see a story on my Facebook Feed about one of my friends completing this share tutorial and I tap on it, I will expect to be redirected to a view in your app that features this tutorial and not to your app's main activity.

The information in the `Intent` will look like this:
```plaintext
data: "sharesample://story/1234?target_url=https%3A%2F%2Fdevelopers.facebook.com%2Fandroid"
extras:
  al_applink_data: <Bundle containing App Link data>
```
The intent's `data` field contains the `Uri` for your App Link's Android URL as well as the target URL. If you marked up your metadata on a web page and didn't specify an Android URL, this field will simply be the target URL, or https://developers.facebook.com/android in our example.

The intent's `extras` contains a `Bundle` with information that looks like this:
```plaintext
target_url: "https://developers.facebook.com/android"
extras:
  fb_app_id: [YOUR_FACEBOOK_APP_ID]
  fb_access_token: "[ACCESS_TOKEN]"
  fb_expires_in: 3600
```
It includes the target URL, and another `Bundle` that includes your Facebook app ID and an `access_token` if the person had authenticated with your app.

You can modify your activity's `onCreate` method to handle the incoming link.

The [Bolts library](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FBoltsFramework%2FBolts-Android&h=AT08p2BsHSAecixi1sgTXi5bdqSZNPlDg_PrHJlr6lOeXhGcnIURb7qioLRXU5W6lfj3iIJv0HzFRizxsivES-CLNmCu-ICXq4JCfr9RIUYq8-2BwKsQoH-9xteOrN2Ib8Did5MZsKx9mDmEPdUZq1mD4yg), which is packaged in Facebook SDK, provides easy to use APIs that can help you to parse the incoming URL.

In the code sample below, we're simply logging the target URL, but you should direct people through the appropriated flow for your app:
```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    FacebookSdk.sdkInitialize(this); 
    ...
    Uri targetUrl = AppLinks.getTargetUrlFromInboundIntent(this, getIntent());
    if (targetUrl != null) {
        Log.i("Activity", "App Link Target URL: " + targetUrl.toString());
    }
}



## Page: https://developers.facebook.com/docs/applinks/metadata-reference

```markdown
# Content Metadata Reference

Publishing App Link metadata is as simple as adding a few lines to the `<head>` tag in the HTML for your content. Apps that link to your content can then use this metadata to deep-link into your app, take users to an app store to download the app, or take them directly to the web to view the content. This allows developers to provide the best possible experience for their users when linking to their content.

App Links are specified using the tags defined in the registry below. Each target platform requires a different set of metadata in order to provide enough context for one app to deep-link into another.

A simple web page that provides App Link metadata might look like this, in a file called `documentation.html`:

```html
<html>
<head>
<meta property="al:ios:url" content="applinks://docs" />
<meta property="al:ios:app_store_id" content="12345" />
<meta property="al:ios:app_name" content="App Links" />
<meta property="al:android:url" content="applinks://docs" />
<meta property="al:android:app_name" content="App Links" />
<meta property="al:android:package" content="org.applinks" />
<meta property="al:web:url" content="http://applinks.org/documentation" />
</head>
<body>
Hello, world!
</body>
</html>
```

---

## Platform Metadata Schema

The following tags can be used to define App Link metadata for your site. Each device type can be specified multiple times to accommodate multiple values, allowing you to provide a fallback list of apps to search for when navigating (e.g. if both a free and paid version of an app is available, or if multiple versions of the app exist that handle different deep-links).

Your app may also define a single fallback URL to be loaded in a web browser if your app is not installed. If your app has no equivalent web content, you may specify `al:web:should_fallback` as `false` to indicate that other apps should not attempt to fall back to displaying your content in a web browser.

| **Device Type: iOS** |
|-----------------------|
| **Property**          | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|-----------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:ios:url            | applinks://docs     | A custom scheme for the iOS app. The scheme part of the URI may not contain underscores. (In this example, applinks: would be valid, app_links: would not.) | Y                   |
| al:ios:app_store_id   | 12345               | The app ID for the App Store                                                                          | N                   |
| al:ios:app_name       | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Device Type: iPhone** |
|--------------------------|
| **Property**             | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|--------------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:iphone:url            | applinks://docs     | A custom scheme for the iPhone app                                                                    | Y                   |
| al:iphone:app_store_id   | 12345               | The app ID for the App Store                                                                          | N                   |
| al:iphone:app_name       | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Device Type: iPad** |
|------------------------|
| **Property**           | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|------------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:ipad:url            | applinks://docs     | A custom scheme for the iPad app                                                                      | Y                   |
| al:ipad:app_store_id   | 12345               | The app ID for the App Store                                                                          | N                   |
| al:ipad:app_name       | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Device Type: Android** |
|--------------------------|
| **Property**             | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|--------------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:android:url           | applinks://docs     | A custom scheme for the Android app                                                                    | N                   |
| al:android:package       | org.applinks        | A fully-qualified package name for intent generation                                                  | Y                   |
| al:android:class         | org.applinks.DocsActivity | A fully-qualified Activity class name for intent generation                                          | N                   |
| al:android:app_name      | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Device Type: Windows Phone** |
|--------------------------------|
| **Property**                   | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|--------------------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:windows_phone:url           | applinks://docs     | A custom scheme for the Windows Phone app                                                             | Y                   |
| al:windows_phone:app_id        | a14e93aa-27c7-df11-a844-00237de2db9f | The app ID (a GUID) for app store                                                                    | N                   |
| al:windows_phone:app_name      | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Device Type: Windows** |
|--------------------------|
| **Property**             | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|--------------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:windows:url           | applinks://docs     | A custom scheme for the Windows app                                                                    | Y                   |
| al:windows:app_id        | a14e93aa-27c7-df11-a844-00237de2db9f | The app ID (a GUID) for app store                                                                    | N                   |
| al:windows:app_name      | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Device Type: Universal Windows** |
|------------------------------------|
| **Property**                       | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|------------------------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:windows_universal:url           | applinks://docs     | A custom scheme for the Windows Universal app                                                         | Y                   |
| al:windows_universal:app_id        | a14e93aa-27c7-df11-a844-00237de2db9f | The app ID (a GUID) for app store                                                                    | N                   |
| al:windows_universal:app_name      | App Links           | The name of the app (suitable for display)                                                            | N                   |

| **Web Fallback** |
|------------------|
| **Property**     | **Example Content** | **Description**                                                                                       | **Required (Y/N)** |
|------------------|---------------------|-------------------------------------------------------------------------------------------------------|---------------------|
| al:web:url       | http://applinks.org/documentation | The web URL; defaults to the URL for the content that contains this tag                             | N                   |
| al:web:should_fallback | false         | Indicates if the web URL should be used as a fallback; defaults to true                              | N                   |

When crawling URLs for App Link metadata, developers should send a request with `al` as one of the prefix values for the `Prefer-Html-Meta-Tags` header. Your server may choose to limit its response to only include HTML containing the tags above, and can use this as a signal to return these tags even when the response type for the given location would otherwise be something other than `text/html`:

```http
Prefer-Html-Meta-Tags: al
```

---

## Examples

A few examples of common cases when specifying App Link metadata follows.

An app that is only available on iOS and on the web:

```html
<html>
<head>
<meta property="al:ios:url" content="applinks://docs" />
<meta property="al:ios:app_store_id" content="12345" />
<meta property="al:ios:app_name" content="App Links" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

An app that has multiple versions on iOS, where apps following a link should attempt to use the latest version available on the device:

```html
<html>
<head>
<meta property="al:ios" />
<meta property="al:ios:url" content="applinks_v2://docs" />
<meta property="al:ios:app_store_id" content="12345" />
<meta property="al:ios:app_name" content="App Links" />
<meta property="al:ios" />
<meta property="al:ios:url" content="applinks_v1://browse" />
<meta property="al:ios:app_name" content="App Links" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

An app with an iPad and iPhone version:

```html
<html>
<head>
<meta property="al:iphone:url" content="applinks://docs" />
<meta property="al:iphone:app_store_id" content="12345" />
<meta property="al:iphone:app_name" content="App Links" />
<meta property="al:ipad:url" content="applinks://docs" />
<meta property="al:ipad:app_store_id" content="67890" />
<meta property="al:ipad:app_name" content="App Links" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

An app that has no web content, but has apps on iOS and Android:

```html
<html>
<head>
<meta property="al:android:package" content="org.applinks" />
<meta property="al:android:url" content="applinks://docs" />
<meta property="al:android:app_name" content="App Links" />
<meta property="al:ios:url" content="applinks://docs" />
<meta property="al:ios:app_store_id" content="12345" />
<meta property="al:ios:app_name" content="App Links" />
<meta property="al:web:should_fallback" content="false" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

A shared link for an app whose web content may be found at another URL:

```html
<html>
<head>
<meta property="al:android:package" content="org.applinks" />
<meta property="al:android:url" content="applinks://docs" />
<meta property="al:android:app_name" content="App Links" />
<meta property="al:ios:url" content="applinks://docs" />
<meta property="al:ios:app_store_id" content="12345" />
<meta property="al:ios:app_name" content="App Links" />
<meta property="al:web:url" content="http://www.example.com/applinks_docs" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>



## Page: https://developers.facebook.com/docs/applinks/implementations

```markdown
# Implementations

Developers may choose to implement the App Links protocol for each platform themselves based upon the description above. Alternatively, developers may choose to use a library that helps them properly execute an App Link navigation, handle incoming navigations, and publish App Link metadata.

You may use the following implementations for navigating to and handling incoming App Link navigations:

- [Bolts for iOS](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FBoltsFramework%2FBolts-iOS&amp;h=AT1DoEUUZGqAMw05eiVaCwW6_Tw-FGBIO4GFMCSj3GbVJToxxPQMOReIQNf2CT-sE6MBfaQ_qZmRuktDhwPw-wUDsbB6Bv1AX4bfRa6cDAqk-lPJAiNDtJw4H-9QwV0PhP4sC1lF_Sj448arFuFI6DK2k0I) - Open-source reference implementation for iOS apps
- [Bolts for Android](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FBoltsFramework%2FBolts-Android&amp;h=AT24tgdx5MBlpLmJ5cH6o9-bTwIA-TZN9QrQ4plvHoHtm0JYuLW_U9mBRpJGh0Rbs4vj2ULO36AMafONVa1dfV70atBaTUr8_8mTLeMooe6n7Os_Fj-6dS46gjc-W2kXwWrGbHKJZWpzoyRlldIieswz190) - Open-source reference implementation for Android apps
- [Rivets for C#](https://l.facebook.com/l.php?u=http%3A%2F%2Fcomponents.xamarin.com%2Fview%2Frivets&amp;h=AT29CLQt9vh8YkL30guW-wZD343BCE9WsQd-lbRU0xp8HHPOvGiVXRNB3eeS_g9wah844c7gUEI9MT9GolhuA7bOqAcOVmXhU8yGofRfPf4J3rdw5zHXn-bmE07WQo0xxW9MCs4oEf7AgY-afDIgWO6EwaA) - Rivets is a Xamarin component that lets you handle incoming and outgoing App Link navigation. It will work with the Xamarin runtime on iOS, Android or Windows Phone.

The following tool may helpful for publishers of content with App Link metadata: [Parse App Links Cloud Code Module](https://l.facebook.com/l.php?u=https%3A%2F%2Fparse.com%2Fdocs%2Fcloud_modules_guide%23applinks&amp;h=AT3lYW5o7DsMYEpnk8GPqhxthA81mZT7VfRR0yhN5Yz-HbJGnHqDXS_LpjIrY8rB8FaWSVEYpc-KuwBPZhKYIyjPh-noRxHLZP06iQT-5f1dtu7y4o5Y_LHa6ANewOLsqTyo-Lw7Ynmaa7r0FdPf-Zj5wrg) - Provides a simple way to publish web content with App Link metadata.

Some providers may also provide access to a high-performance index of App Link metadata that you may choose to use in your own apps:

* [Facebook App Link index](/docs/applinks/index-api) - Provides access to Facebook's index of App Link metadata for arbitrary URLs.
```



## Page: https://developers.facebook.com/docs/applinks/ios

```markdown
# App Links on iOS

Your app can post stories to Feed. When people click on those stories, Facebook can send people to either your app or your app's App Store page. This drives traffic and app installs. You can implement this behavior using App Links.

When someone taps on one of the links shared through your app or on the story attribution (name of your app) in one of the Open Graph stories shared through your app, the link content appears in a webview with a menu item **Open in {app name}**. Clicking on that menu item will either open your app or, if your app is not installed on the device, open your app's App Store page. If your app is mobile-only and has no web content, when someone clicks the shared link they either open your app, if it's installed, or go to your app's App Store page (if your app isn't installed). The image below shows this flow:

![App Links Flow](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2178-6/10173505_677692745645482_1352044398_n.png?_nc_cat=106&ccb=1-7&_nc_sid=34156e&_nc_ohc=dc-CCfpCY_QQ7kNvwHYekWS&_nc_oc=AdlDhToXYWFAvCnJjH9U64uMW-oIhFfMRbWRXSCn4fjG786QXg58wXf8CRCNpkQ17mM&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=aouH8D9avyuoEmR_cSIUTQ&oh=00_AfjSjSFqEw0N_Li_UGRm3yjD06symLEKrJqzKh75tNaTlg&oe=691A88C7)

Beginning with iOS v10, deferred deep linking is not supported on devices where the *limit ad tracking* setting is enabled. On those devices your app can only open the start screen for your app after someone installed your app.

In the following sections we will explain how to handle incoming links once you've [set up your App Links](/docs/applinks/add-to-content).

## Handling Incoming Links

When someone taps a link posted from your app or taps the app attribution in an Open Graph story posted from your app in Facebook for iOS, they may be presented with the option to open your content in your iOS app. Alternatively, they may be immediately directed to your app. If your app is mobile only, set `should_fallback=false` so that if people don't have your app installed, they will be taken to the App Store to download your app. The iOS app link for your content will be sent to your app. To ensure an engaging user experience, you should process the incoming link when your app is activated and direct the person to the object featured in the story they're coming from.

### Receiving App Links

Your app will receive a link where `{url}` is the incoming URL based on a custom scheme that you have defined for your app. You'll also receive an `al_applink_data` query parameter with JSON encoded content.

```
{url}?al_applink_data={
  "target_url": "{the-target-url}",
  "extras": {
    "fb_app_id": {your-fb-app-id},
    "fb_access_token": "{your-access-token}",
    "fb_expires_in": "3600"
  },
  "referer_app_link": {
    "url": "{your-fb-app-back-link}",
    "app_name": "Facebook"
  }
}
```

Where `fb_access_token` and `fb_expires_in` are only available if the person has authenticated with Facebook in your app.

### Handling App Links

Use [Bolts](https://docs/facebook.com/docs/ios/#-facebook-sdk-for-ios-) to make it easier to handle an inbound App Link (as well as general inbound deep-links) by providing utilities for processing an incoming URL.

For example, you can use the `BFURL` utility class to parse an incoming URL in your `AppDelegate`:

```objc
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation {
    BFURL *parsedUrl = [BFURL URLWithInboundURL:url sourceApplication:sourceApplication];

    // Use the target URL from the App Link to locate content.
    if ([parsedUrl.targetURL.pathComponents[1] isEqualToString:@"profiles"]) {
        // Open a profile viewer.
    }

    // You can also check the query string easily.
    NSString *query = parsedUrl.targetQueryParameters[@"query"];

    // Apps that have existing deep-linking support and map their App Links to existing
    // deep-linking functionality may instead want to perform these operations on the input URL.
    // Use the target URL from the App Link to locate content.
    if ([parsedUrl.inputURL.pathComponents[1] isEqualToString:@"profiles"]) {
        // Open a profile viewer.
    }

    // You can also check the query string easily.
    NSString *query = parsedUrl.inputQueryParameters[@"query"];

    // Apps can easily check the Extras and App Link data from the App Link as well.
    NSString *fbAccessToken = parsedUrl.appLinkExtras[@"fb_access_token"];
    NSDictionary *refererData = parsedUrl.appLinkExtras[@"referer"];
}
```

### Navigate to a URL

Following an App Link allows your app to provide the best user experience (as defined by the receiving app) when a user navigates to a link. Bolts makes this process simple, automating the steps required to follow a link:

1. Resolve the App Link by getting the App Link metadata from the HTML at the URL specified.
2. Step through App Link targets relevant to the device being used, checking whether the app that can handle the target is present on the device.
3. If an app is present, build a URL with the appropriate `al_applink_data` specified and navigate to that URL.
4. Otherwise, open the browser with the original URL specified.

In the simplest case, it takes just one line of code to navigate to a URL that may have an App Link:

```objc
[BFAppLinkNavigation navigateToURLInBackground:url];
```

### Adding App and Navigation Data

Under most circumstances, the data that will need to be passed along to an app during a navigation will be contained in the URL itself, so that whether or not the app is actually installed on the device, users are taken to the correct content. Occasionally, however, apps will want to pass along data that is relevant for app-to-app navigation, or will want to augment the App Link protocol with information that might be used by the app to adjust how the app should behave (e.g. showing a link back to the referring app).

If you want to take advantage of these features, you can break apart the navigation process. First, you must have an App Link to which you wish to navigate:

```objc
[[BFAppLinkNavigation resolveAppLinkInBackground:url] continueWithSuccessBlock:^id(BFTask *task) {
    BFAppLink *link = task.result;
}];
```

Then, you can build an App Link request with any additional data you would like and navigate:

```objc
BFAppLinkNavigation *navigation = [BFAppLinkNavigation navigationWithAppLink:link
                                                                    extras:@{
                                                                        @"access_token": @"t0kEn"
                                                                    }
                                                                appLinkData:@{
                                                                        @"ref": @"12345"
                                                                    }];
NSError *error = nil;
[navigation navigate:&error];
```

### Resolving App Link Metadata

Bolts allows for custom App Link resolution, which may be used as a performance optimization (e.g. caching the metadata) or as a mechanism to allow developers to use a centralized index for obtaining App Link metadata. A custom App Link resolver just needs to be able to take a URL and return a `BFAppLink` containing the ordered list of `BFAppLinkTargets` that are applicable for this device. Bolts provides one of these out of the box that performs this resolution on the device using a hidden WKWebview.

You can use any resolver that implements the `BFAppLinkResolving` protocol by using one of the overloads on `BFAppLinkNavigation`:

```objc
[BFAppLinkNavigation navigateToURLInBackground:url resolver:resolver];
```

Alternatively, you can swap out the default resolver to be used by the built-in APIs:

```objc
[BFAppLinkNavigation setDefaultResolver:resolver];
[BFAppLinkNavigation navigateToURLInBackground:url];
```

### App Link Return-to-Referer View

When an application is opened via an App Link, a banner allowing the user to "Touch to return to " should be displayed. The `BFAppLinkReturnToRefererView` provides this functionality. It will take an incoming App Link and parse the referer information to display the appropriate calling app name.

```objc
- (void)viewDidLoad {
    [super viewDidLoad];

    // Perform other view initialization.

    self.returnToRefererController = [[BFAppLinkReturnToRefererController alloc] init];

    // self.returnToRefererView is a BFAppLinkReturnToRefererView.
    // You may initialize the view either by loading it from a NIB or programmatically.
    self.returnToRefererController.view = self.returnToRefererView;

    // If you have a UINavigationController in the view, then the bar must be shown above it.
    [self.returnToRefererController];
}
```

The following code assumes that the view controller has an `openedAppLinkURL NSURL` property that has already been populated with the URL used to open the app. You can then do something like this to show the view:

```objc
- (void)viewWillAppear {
    [super viewWillAppear];

    // Show only if you have a back AppLink.
    [self.returnToRefererController showViewForRefererURL:self.openedAppLinkURL];
}
```

In a navigation-controller view hierarchy, the banner should be displayed above the navigation bar, and `BFAppLinkReturnToRefererController` provides an `initForDisplayAboveNavController` method to assist with this.

### Analytics

Bolts introduces Measurement Event. App Links posts three different Measurement Event notifications to the application, which can be caught and integrated with existing analytics components in your application.

- `al_nav_out` — Raised when your app switches out to an App Links URL.
- `al_nav_in` — Raised when your app opens an incoming App Links URL.
- `al_ref_back_out` — Raised when your app returns back the referrer app using the built-in top navigation back bar view.

#### Listen for App Links Measurement Events

There are other analytics tools that are integrated with Bolts' App Links events, but you can also listen for these events yourself:

```objc
[[NSNotificationCenter defaultCenter] addObserverForName:BFMeasurementEventNotificationName
                                                  object:nil
                                                   queue:nil
                                              usingBlock:^(NSNotification *note) {
    NSDictionary *event = note.userInfo;
    NSDictionary *eventData = event[BFMeasurementEventArgsKey];
    // Integrate to your logging/analytics component.
}];
```

#### App Links Event Fields

App Links Measurement Events sends additional information from App Links Intents in flattened string key value pairs. Here are some of the useful fields for the three events.

| `al_nav_in` Event          | Description                                                                                   |
|----------------------------|-----------------------------------------------------------------------------------------------|
| `inputURL`                 | The URL that opens the app.                                                                   |
| `inputURLScheme`           | The scheme of `inputURL`.                                                                     |
| `refererURL`               | The URL that the referrer app added into `al_applink_data: referer_app_link`.                |
| `refererAppName`           | The app name that the referrer app added to `al_applink_data: referer_app_link.`             |
| `sourceApplication`         | The bundle of referrer application.                                                           |
| `targetURL`                | The `target_url` field in `al_applink_data`.                                                |
| `version`                  | The App Links API version.                                                                    |

| `al_nav_out` or `al_ref_back_out` Event | Description                                                                                   |
|------------------------------------------|-----------------------------------------------------------------------------------------------|
| `outputURL`                             | The URL used to open the other app (or browser). If there is an eligible app to open, this will be the custom scheme url/intent in `al_applink_data`. |
| `outputURLScheme`                       | The scheme of `outputURL`.                                                                    |
| `sourceURL`                             | The URL of the page hosting App Links meta tags.                                             |
| `sourceURLHost`                         | The hostname of `sourceURL`.                                                                  |
| `success`                               | “1” to indicate success in opening the App Link in another app or browser; “0” to indicate failure to open the App Link. |
| `type`                                  | The “app” for open in app, “web” for open in browser; “fail” when the success field is “0”. |
| `version`                               | The App Links API version.                                                                    |

### Installation

You can download the latest framework files from our Releases page.

Bolts is also available through CocoaPods. To install it simply add the following line to your Podfile:

```
pod 'Bolts'



## Page: https://developers.facebook.com/docs/applinks/navigation-protocol

```markdown
# Support Outbound App Links to Other Apps

Navigating to a target URL that contains App Link metadata follows a common protocol that has two key components:

1. Platform-specific deep-linking (e.g. a URL on iOS, the Web and Windows Phone, or an intent on Android).
2. An `al_applink_data` object that contains context for the navigation.

`al_applink_data` is meant to be a metadata container that can hold any kind of information that could be held in a `JSON` object. Top-level properties of `al_applink_data` are meant to contain routing information relevant to the act of navigating to a URL using this protocol.

## iOS and Windows Phone

Deep-linking on iOS and Windows Phone is URL-based, wherein each app can register and define URL schemes (e.g. myapp:// or example:// – note that we strongly recommend that apps choose unique URL schemes to avoid collisions with other apps) that the operating system will route to that app. Performing an App Link navigation on iOS or Windows Phone involves constructing a URL that combines a prefix defined by the app with `al_applink_data`.

For iOS, the [Bolts SDK for iOS](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FBoltsFramework%2FBolts-iOS&amp;h=AT2UtfWUmwlhUbItK1WraOHd1NkcxEigNrfnHfde9u-zIZ50mm9otshLlhcz35rJoCGf9bi-BFS1RSHS5PY1uxEhcFtMfZd72WtJTW2rkz2-kTJvaeTn-cfNzytwbrqqsbzblg6SQSAfQcyGsyRJXT5OmoJjQyN1bc7TpA2B) is available to help you with the discovery and construction of outbound links.

[iOS](#navigatingonios) and [Windows Phone](#navigatingonwindowsphone) are covered later in this document.

## Android

Deep-linking on Android is Intent-based, wherein each app can register and define Activities and Intent filters that the operating system will route to that app. Performing an App Link navigation on Android involves constructing an Intent that contains `al_applink_data` in its Intent extras.

The [Bolts SDK for Android](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FBoltsFramework%2FBolts-Android&amp;h=AT33chw4l7GQnU-gGytEJdaPD_VyD4kKn988sdENohgFO-i4SiT3qte9xS9oqGdZrvfARh3JpayrMU7u3El7yAVITLO9f0oW3WqrK_avB1BO3_5xB8pxhjn52OcUbgb9qGqNoXmzxAi50PVU7qO6KtL9zuE) is available to help you with the discovery and construction of outbound links.

[Android](#navigatingonandroid) is covered later in this document.

## `al_applink_data` Contents

The first step to supporting outbound links is to construct an `al_applink_data` object that will be used on each platform.

`al_applink_data` is meant to be a metadata container that can hold any kind of information that could be held in a JSON object. Top-level properties of `al_applink_data` are meant to contain routing information relevant to the act of navigating to a URL using this protocol.

The following table lists the properties of `al_applink_data` defined by this protocol, but additional properties may be defined by others to extend the protocol:

| **Property**              | **Example Content**                                                                 | **Description**                                                                                                                                                                                                                          | **Required (Y/N)** |
|---------------------------|-------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------|
| `target_url`              | https://example.com                                                                | A string containing the web URL being navigated to. This is an http or https URL representing some content.                                                                                                                         | Y                   |
| `referer_app_link`       | ```{ “target_url”: “http://ex.com/docs”, “url”: “example://docs”, “app_name”: “Example App” }``` | An object containing a target url as well as app link metadata (as defined in the metadata registry) that can be used to identify the Referer for this navigation. This enables the receiving app to provide a link back to the navigating app, which is especially important on platforms without a built-in back button. | N                   |
| `campaign_ids`           | ABcDEfghI7GUC4gMdFoX1y                                                             | An encrypted string and non-user metadata appended to the outbound URL (for example, ad_destination_url) or deep link (for App Aggregated Event Manager) when a user clicked on a link from Facebook.<br/><br/>Graph API definition: Parameter passed via the deep link for Mobile App Engagement campaigns | N                   |
| `extras`                 | ```{“myapp_token”: “t0kEn”}```                                                    | An object containing information from the navigating app.                                                                                                                                                                             | N                   |
| `version`                | 1.0                                                                                | A string containing the version of the protocol – currently “1.0″; defaults to “1.0″.                                                                                                                                                 | N                   |
| `user_agent`             | Bolts Android 1.0                                                                  | A string containing an identifier for the library that the navigating code is using to navigate.                                                                                                                                       | N                   |

For example, `al_applink_data` for a navigation to http://example.com/docs might look like:

```json
{
  "target_url": "http://example.com/docs",
  "extras": {
    "myapp_token": "t0kEn"
  },
  "user_agent": "Bolts iOS 1.1",
  "version": "1.0"
}
```

## Navigating on iOS

Deep-linking on iOS is URL-based, wherein each app can [register and define URL schemes](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Flibrary%2Fios%2Fdocumentation%2FiPhone%2FConceptual%2FiPhoneOSProgrammingGuide%2FAdvancedAppTricks%2FAdvancedAppTricks.html%23%2F%2Fapple_ref%2Fdoc%2Fuid%2FTP40007072-CH7-SW50) (e.g. myapp:// or example:// – note that we strongly recommend that apps choose unique URL schemes to avoid collisions with other apps) that the operating system will route to that app. Performing an App Link navigation on iOS involves constructing a URL that combines a prefix defined by the app with `al_applink_data` as defined above.

**To navigate to a target URL on iOS:**

1. Collect the App Link metadata for the target URL
2. Search for the first App Link target defined in the metadata for your device (i.e. `iphone` on an iPhone or iPod touch, or `ipad` on an iPad) that [can open](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Flibrary%2Fios%2Fdocumentation%2Fuikit%2Freference%2FUIApplication_Class%2FReference%2FReference.html%23%2F%2Fapple_ref%2Focc%2Finstm%2FUIApplication%2FcanOpenURL%3A) the `url` in the metadata.
3. If no target was found, search for the first App Link target defined in the metadata for `ios` that [can open](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Flibrary%2Fios%2Fdocumentation%2Fuikit%2Freference%2FUIApplication_Class%2FReference%2FReference.html%23%2F%2Fapple_ref%2Focc%2Finstm%2FUIApplication%2FcanOpenURL%3A) the `url` in the metadata.
4. If no target was found that can be opened on this device and `al:web:should_fallback` is `false`, the navigation fails. Otherwise, select the value of `al:web:url` (or the original target URL if none is specified) as your target.
5. Construct `al_applink_data` for the navigation, encode it as a JSON string, and URL-encode that string. Add it to the `url` as a query parameter named `al_applink_data`.
6. [Open the URL](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.apple.com%2Flibrary%2Fios%2Fdocumentation%2Fuikit%2Freference%2FUIApplication_Class%2FReference%2FReference.html%23%2F%2Fapple_ref%2Focc%2Finstm%2FUIApplication%2FopenURL%3A) you’ve constructed.

For example, if http://example.com/applinks contained the following markup:

```html
<html>
<head>
<meta property="al:ios:url" content="example://applinks" />
<meta property="al:ios:app_store_id" content="12345" />
<meta property="al:ios:app_name" content="Example App" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

An navigating app might open the following URL if the app is installed:

```plaintext
example://applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20iOS%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D
```

Or to the following URL if the app is not installed:

```plaintext
http://example.com/applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20iOS%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D
```

## Navigating on Android

Deep-linking on Android is Intent-based, wherein each app can register and define [Activities and Intent filters](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Fguide%2Fcomponents%2Fintents-filters.html&amp;h=AT3JdjqQaYnyl8IahJLAfWgCxd4HDYvepsC-W6uaEUYK26bS2sseDfzuyeiGR1E2HBW8mqOU3lJhV1o_tJVyogJM4QAn1ojt9q_Mi2N3d4a9zcUu_SyDZFg9a_n2gdYacJBBJu8kDdUCY_EQhuedvZf_VFA) that the operating system will route to that app. Performing an App Link navigation on Android involves constructing an Intent that contains `al_applink_data` in its [Intent extras](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fcontent%2FIntent.html%23getExtras%28%29&amp;h=AT263YQ1zwNw2zj0NecNLLioRSN2wEG0LVv_v30ujtFn0akBwak5wBRRXx1ND9PxDOJlSX-weVZWKVcBPjnbpKOOQ0spLtR15bYOn01ooejft_Gl41ms6QgOCIb856__5CMr2mnBMRkP0bjdR_-NDBMP36o).

To navigate to a target URL on Android:

- Collect the App Link metadata for the target URL
- Search for the first App Link target defined in the metadata for Android that can be opened. To determine this, construct a [VIEW Intent](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fcontent%2FIntent.html%23ACTION_VIEW&amp;h=AT0dPutHTnF2a6CvHN-ZA6qZFVsg4iKHDeM24hDSGlbo2IWJcK4l51u3LK8JFMCrHeaVXSBd25jTxulTJ8_avaEeZWiVM_BnQXkR5xaiuB3dWASZSt0ryC_L9JGMTpG9H8tF6RzbRYsiwKyXYiYK_n6p6eE) with the specified `class` and `package`. If a `url` is specified, [set this as the data](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fcontent%2FIntent.html%23setData%28android.net.Uri%29&amp;h=AT2HVBGhOUyEuj22ZqF5z8hZx5q3MC7xyg0sxefgiCFHpzv6R3G5wtMRDRPxM0VYuXtWojw9QjMXprw5GA4846PM0K71bTekgbwvUMy0cLYkDFgIMyNgFs4RT2MjcfmyHlEqz8CSBmhXZtZzNfAzkQd4zrIPq2lkNA2G7WMv) for the Intent. Otherwise, set the target URL as the data for the intent. Finally, check whether the Intent can be opened by calling [PackageManager.resolveActivity()](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fcontent%2Fpm%2FPackageManager.html%23resolveActivity%28android.content.Intent%252C%2520int%29&amp;h=AT3CNFZXHK-dRTWOu61liWm-n9pyZGORq9eM8yxeueu1Lx0owQTLoOSuSa64pVRZo_3BcIgWmdiqS-Zp8yLY3BAXB2oiBk--mp5boe_TB-Jsi0MjGkc9NvgLTWpbdfhMzVmgdjZWPgaSmRzzAz4bKtsqg5U) and checking whether any `ResolveInfo` is returned.
- If no target was found that can be opened on this device and `al:web:should_fallback` is `false`, the navigation fails. Otherwise, use the value of `al:web:url` (or the original target URL if none is specified) to construct an Intent that will launch the default web browser on the device. To this URL, you should add a query parameter named `al_applink_data` whose value is `al_applink_data` encoded as a JSON string and then URL-encoded.
- If a suitable target and corresponding Intent was found, construct `al_applink_data` for the navigation as a [Bundle](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fos%2FBundle.html&amp;h=AT1YgaOZs6ekonKD8Lm_ZV6BldBcFQcitZEhv4vTHULmUwb4fU5MqJHDwEOFMK0CSpQwEEDrdXn0rkRiawB9vrw6H2O9fhl0Q_uRG3ip9T8UHGdUcQEQNBmZ8oyB8aITxVYJBileOX5O4lwtymwGBqIdZ_U) (using nested Bundles, Strings, arrays and numbers as values) and [add it to the Intent as an extra](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fcontent%2FIntent.html%23putExtra%28java.lang.String%252C%2520android.os.Bundle%29&amp;h=AT3W15SIrXP42WHnqYhZ3clRt_Vmwd2Ai1i_Y7bklnb_SDhUSQx4mk-INvzcUDhoYX3b2ndEEaCdcTgQFQt1dNvM3AMyWT9JOGoOKTVF5LkqU6RxZQz_qeRZPLLsRmiO8RS6Us3BEZn5r15mbeb6rV66vUc) named `al_applink_data`.
- [Start an activity](https://l.facebook.com/l.php?u=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fcontent%2FContext.html%23startActivity%28android.content.Intent%29&amp;h=AT01Y5L0evN5hN8TWZ-z_l8UpKinF2aWhwMz9gXTZRcaJAMXJ_Kx_CyG-wyiHVOOCPZ_MGRADUTbcPzk22Nra0Aetur3XHevTpsyfzq3FLVKpTlOZcj3Fx4n9wvs9Fr86igToANG7gQtZX2ZNVss8AzD4_Y) for the Intent you've constructed.

For example, if http://example.com/applinks contained the following markup:

```html
<html>
<head>
<meta property="al:android:url" content="example://applinks" />
<meta property="al:android:package" content="com.example" />
<meta property="al:android:app_name" content="Example App" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

A navigating app might start the following Intent if the app is installed:

```plaintext
action: android.intent.action.VIEW
data: example://applinks
package: com.example
extras:
  al_applink_data:
    target_url: "http://example.com/applinks"
    user_agent: "Bolts Android 1.0"
    version: "1.0"
    extras:
      myapp_token: "t0kEn"
```

Or it may start the following Intent if the app is not installed:

```plaintext
action: android.intent.action.VIEW
data: http://example.com/applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20Android%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D
```

## Navigating on Windows Phone

Deep-linking on Windows Phone is URL-based, wherein each app can [register and define URL schemes](https://l.facebook.com/l.php?u=http%3A%2F%2Fmsdn.microsoft.com%2Fen-us%2Flibrary%2Fwindowsphone%2Fdevelop%2Fjj206987%28v%3Dvs.105%29.aspx%23BKMK_URIassociations&amp;h=AT2qAyBz4ZJrHgWzCNFcO4m8n9uU_u40LuSQVaO0HDI58pOHY6O3OqYLKrfcjyA0biZYcX6jdxUpPHLzqh40r_BH9Glg0wKoGjm8mD0Xp4h69FKQQdg-EkR1e5zDnBUz8qxTtUWQvrXX37JWOEYsVRBDCV85yVm40NfzMVn1) (e.g. myapp:// or example:// – note that we strongly recommend that apps choose unique URL schemes to avoid collisions with other apps) that the operating system will route to that app. Performing an App Link navigation on Windows Phone involves constructing a URL that combines a prefix defined by the app with `al_applink_data` as defined above.

To navigate to a target URL on Windows Phone:

- Collect the App Link metadata for the target URL
- Taking each App Link target defined in the metadata for `windows_phone` in order, construct a URL from the `url` and adding a query parameter named `al_applink_data` containing the `al_applink_data` for this navigation encoded as a JSON string and then URL-encoded. Until a launch succeeds, [attempt to launch the URL](https://l.facebook.com/l.php?u=http%3A%2F%2Fmsdn.microsoft.com%2Fen-us%2Flibrary%2Fwindowsphone%2Fdevelop%2Fhh701484.aspx&amp;h=AT2z-SGYywH6p8ooFd_EdXe_FearK2m4gBYY2994LhyasncWb-ZDOmckRGPRUaQJSxvfa07r8ZBotjUZFvCei1CFozBgU38WwVxYgB8pYd_rdz30fr_NmLe7F2rg5cp86x4x2bnFRI0WneBWlknAPfJqIGw).
- If no launch attempt succeeded on this device and `al:web:should_fallback` is `false`, the navigation fails. Otherwise, use the value of `al:web:url` (or the original target URL if none is specified), adding `al_applink_data` as above, and attempt to launch this URL.

For example, if http://example.com/applinks contained the following markup:

```html
<html>
<head>
<meta property="al:windows_phone:url" content="example://applinks" />
<meta property="al:windows_phone:app_name" content="Example App" />
<!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

An navigating app might open the following URL if the app is installed:

```plaintext
example://applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20Windows%20Phone%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D
```

Or to the following URL if the app is not installed:

```plaintext
http://example.com/applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20Windows%20Phone%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D



## Page: https://developers.facebook.com/docs/applinks/best-practices

Es posible que el enlace que seleccionaste esté dañado o que se haya eliminado la página.

[Buscar **applinks best practices** en developers.facebook.com](https://developers.facebook.com/search/?q=applinks+best+practices&notfound=1)



## Page: https://developers.facebook.com/docs/applinks/add-to-content

```markdown
# Adding App Links to Your Existing Web Content

You can add support for App Links to existing web content by defining metadata that details how apps link to your content. You need to add the following information to your URLs:

1. A custom URL that will be used to launch your app.
2. The app store ID / package that will handle the content.
3. The app name that will handle the content.

The metadata is added to your web page's `<head>` tag. The full list of options is documented at [applinks.org](https://l.facebook.com/l.php?u=http%3A%2F%2Fapplinks.org%2F&amp;h=AT01sPbb_-m8pS9WOXRvYL4R2T0ZfnA7BOoRtnr5jJL_zIPf_c5_NLH8GdcAA85uCfWtlqINUb-7fpxTnc_WKq1Y44KPVF1s4prtk0Dqyeg1y4P5bA9UUbw_-N0hQ64GY-7EAKDvRXV-x-zRzJnZQ3IJSOM).

App Links for Web are not supported for Catalog ads. Instead, see [Product Deep Links](/docs/marketing-api/catalog/guides/product-deep-links).

## iOS

As an example, let's say you've got a page located at:

```
http://example.com/applinks
```

In that page you need to add some metadata to describe what app will handle it:

```html
<html>
<head>
    <meta property="al:ios:url" content="example://applinks" />
    <meta property="al:ios:app_store_id" content="12345" />
    <meta property="al:ios:app_name" content="Example App" />
    <meta property="og:title" content="example page title" />
    <meta property="og:type" content="website" />
    <!-- Other headers -->
</head>
<!-- Other HTML content -->
</html>
```

If the person has your app installed, the content at this URL appears in your app, as documented in our [iOS documentation](/docs/applinks/ios):

```
example://applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20iOS%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D
```

The `url` property must match a custom scheme that you've defined in your app's `.plist` file.

If the person doesn't have your app installed, App Links opens the App Store page for your app instead:

```
http://example.com/applinks?al_applink_data=%7B%22user_agent%22%3A%22Bolts%20iOS%201.0.0%22%2C%22target_url%22%3A%22http%3A%5C%2F%5C%2Fexample.com%5C%2Fapplinks%22%2C%22extras%22%3A%7B%22myapp_token%22%3A%22t0kEn%22%7D%7D
```

The `url` property is a URL that your app will receive when it's launched along with the other data JSON-encoded. Please see more about how to handle the incoming links in our [iOS documentation](/docs/applinks/ios) or on the [applinks.org](https://l.facebook.com/l.php?u=http%3A%2F%2Fapplinks.org%2Fdocumentation%2F%23publishingapplinks&amp;h=AT3ghH-1RsxcBZ40zrmTa1Rfmmclaz_cWa9zCB--3T8SrSOidvQDCBVddnCTiyTyqjGIiQ__ZlWHObgMDJ_2_zdXDOnfUA2yxgu4XPS2a0wmKQwYaKCGRm_JjnA6JxWPZIzydzgUk1dRRg43AwGNMrQbIwE) site.

## Android

As an example for Android, let's add support to

```
https://example.com/android
```

so it will be handled by your app. Just like with iOS we need to add Android-specific data that describes what app will handle the page:

```html
<head>
    ...
    <meta property="al:android:url" content="sharesample://story/1234">
    <meta property="al:android:package" content="com.facebook.samples.sharesample">
    <meta property="al:android:app_name" content="ShareSample">
    <meta property="og:title" content="example page title" />
    <meta property="og:type" content="website" />
    ...
</head>
```

When someone clicks on the story, your Android app will be loaded with the target URI, as documented on the [android documentation](/docs/applinks/android). In this example, the URI will be `sharesample://story/1234`.

The `sharesample` URI scheme represents your unique custom scheme. To set up your app to respond to this `URI`, you need to add an intent filter in your app's manifest file. The filter should respond to your custom scheme, handle implicit intents, and accept the `ACTION_VIEW` action. The example below adds a filter to the activity that handles the `sharesample` custom URL scheme:

```xml
<activity android:name=".MainActivity"
    android:label="@string/app_name">
    ...
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:scheme="sharesample" />
    </intent-filter>
</activity>
```

Please see more about how to handle the incoming links in our [Android documentation](/docs/applinks/android) or on the [applinks.org](https://l.facebook.com/l.php?u=http%3A%2F%2Fapplinks.org%2Fdocumentation%2F%23publishingapplinks&amp;h=AT1V1qrDjqlYfD7r1f1yqj6S4mhxwIgKT_y_iJ9SM9ybJWqeeiATvSStJ3Af2VW0G8b69ZyfQ0O2hLf7yYBQu76wQL-VVvaBQKRNTPIpRT6FATXAd5U5mzlZCPuoM8Ebq5vjYCCNMmRnyQD4LQrSf7w5QD-WSBiOflQpweTv) site.
```