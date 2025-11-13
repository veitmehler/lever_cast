# API Documentation

**Source URL:** https://developers.facebook.com/docs/threads/
**Scraped Date:** 2025-11-12 17:12:10

---



## Page: https://developers.facebook.com/docs/threads/

```markdown
# Threads API

The Threads API enables developers to build their own unique integrations, and helps creators and brands manage their Threads presence at scale and easily share inspiring content with their communities.

## Documentation Contents

### [Overview](https://developers.facebook.com/docs/threads/overview)

Brief overview of the Threads API limitations.

### [Get Started](https://developers.facebook.com/docs/threads/get-started)

Learn about the requirements for using the Threads API.

### [Threads Use Case](https://developers.facebook.com/docs/development/create-an-app/threads-use-case)

How to create and customize a Meta app with the Threads API use case in the App Dashboard.

### [Reference](https://developers.facebook.com/docs/threads/reference)

The Threads API endpoints and their parameters.

### Guides

Learn how to make posts, retrieve media, and troubleshoot issues.

- [Single Thread Posts](https://developers.facebook.com/docs/threads/posts#single-thread-posts)
- [Carousel Posts](https://developers.facebook.com/docs/threads/posts#carousel-posts)
- [Threads Media](https://developers.facebook.com/docs/threads/threads-media)
- [Threads Profiles](https://developers.facebook.com/docs/threads/threads-profiles)
- [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)
- [Reply Moderation](https://developers.facebook.com/docs/threads/reply-moderation)
- [Mentions](https://developers.facebook.com/docs/threads/threads-mentions)
- [Insights](https://developers.facebook.com/docs/threads/insights)
- [Webhooks](https://developers.facebook.com/docs/threads/webhooks)
- [oEmbed](https://developers.facebook.com/docs/threads/tools-and-resources/embed-a-threads-post)
- [Web Intents](https://developers.facebook.com/docs/threads/threads-web-intents)
- [Postman Collection](https://developers.facebook.com/docs/threads/tools-and-resources/postman-collection)
```



## Page: https://developers.facebook.com/docs/threads/posts/delete-posts

```markdown
# Delete Posts

You can use the Threads API to delete your own posts.

## Deleting

You can delete a Threads post that was created by the authenticated user by making a request to the `DELETE /{threads-media-id}` endpoint with the post's media object ID. Make sure to include the `access_token` parameter with your API request.

### Permissions

The Threads Delete API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

- `threads_basic` — Required for making any calls to all Threads API endpoints.
- `threads_delete` — Required for making any delete calls.

### Limitations

- The Delete endpoint has a rate limit of 100 deletes per day per account.

### Example Request

```bash
curl -i -X DELETE \
  "https://graph.threads.net/v1.0/<THREADS_MEDIA_ID>?access_token=<ACCESS_TOKEN>"
```

### Example Response

```json
{
  "success": true,
  "deleted_id": "1234567"
}
```

The request above deletes a Threads post and returns a response indicating whether the action was successful or not, along with the deleted post's ID.
```



## Page: https://developers.facebook.com/docs/threads/threads-profiles

# Threads Profiles

The [Threads Profile API](https://developers.facebook.com/docs/threads/reference/user#get---threads-user-id--fields-id-username----) and [Threads Profile Discovery API](https://developers.facebook.com/docs/threads/reference/user#get--profile-lookup-username----) provide 2 ways of retrieving Threads profile information depending on scope.

## Retrieve a Threads App-Scoped User's Profile Information

Use the `GET /{threads-user-id}?fields=id,username,...` endpoint to return profile information about a Threads user.

### Permissions

The Threads Profile API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

- `threads_basic` — Required for making any calls to all Threads API endpoints.

### Limitations

- You may only fetch the profile of the app-scoped user.

### Fields

| Name                          | Description                                           |
|-------------------------------|-------------------------------------------------------|
| `id`                          | Threads user ID. This is returned by default.       |
| `username`                   | Handle or unique username on Threads.                |
| `name`                       | Display name of the user on Threads.                 |
| `threads_profile_picture_url` | URL of the user's profile picture on Threads.        |
| `threads_biography`          | Biography text on Threads profile.                   |
| `is_verified`                | Returns `true` if the user is verified on Threads.  |

### Example Request

```bash
curl -s -X GET \
"https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography,is_verified&access_token=<ACCESS_TOKEN>"
```

### Example Response

```json
{
  "id": "1234567",
  "username": "threadsapitestuser",
  "name": "Threads API Test User",
  "threads_profile_picture_url": "https://scontent-sjc3-1.cdninstagram.com/link/to/profile/picture/on/threads/",
  "threads_biography": "This is my Threads bio.",
  "is_verified": false
}
```

## Retrieve a Threads User's Public Profile Information

Use the `GET /profile_lookup?username=...` endpoint to look up a public profile and retrieve their basic profile information.

### Permissions

The Threads Profile Discovery API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

- `threads_basic` — Required for making any calls to all Threads API endpoints.
- `threads_profile_discovery` — Required for making any calls to all Threads Profile Discovery API endpoints.

With [standard access](https://developers.facebook.com/docs/graph-api/overview/access-levels), only some of the official Meta accounts can be looked up. These include @meta, @threads, @instagram, and @facebook.

### Limitations

- Only returns public profiles with a minimum age of 18 years and at least 1,000 followers.
- A user can send a maximum of 1,000 requests within a rolling 24-hour period. Once a query is sent, it will count against this limit for 24 hours.

### Parameters

| Name           | Description                                           |
|----------------|-------------------------------------------------------|
| `access_token` | **Required.**<br>Threads Graph API user access token. |
| `username`     | **Required.**<br>Handle or unique username on Threads. Must be an exact match. |

### Fields

| Name                | Description                                           |
|---------------------|-------------------------------------------------------|
| `username`         | Handle or unique username on Threads.                |
| `name`             | Display name of the user on Threads.                 |
| `profile_picture_url` | URL of the user's profile picture on Threads.      |
| `biography`        | Biography text on Threads profile.                   |
| `follower_count`   | Total follower count of the user.                    |
| `likes_count`      | Likes count of the user's posts in the past 7 days. |
| `quotes_count`     | Quotes count of the user's posts in the past 7 days.|
| `reposts_count`    | Reposts count of the user's posts in the past 7 days.|
| `views_count`      | Views count of the user's posts in the past 7 days. |
| `is_verified`      | Returns `true` if the user is verified on Threads.  |

### Example Request

```bash
curl -i -X GET \ 
  "https://graph.threads.net/v1.0/profile_lookup?access_token=<ACCESS_TOKEN>&username=<THREADS_USERNAME>"
```

### Example Response

```json
{
  "username": "meta",
  "name": "Meta",
  "profile_picture_url": "https://scontent-sjc3-1.cdninstagram.com/link/to/profile/picture/on/threads/",
  "biography": "Connect with what you love to make things happen. It’s Your World.",
  "is_verified": true,
  "follower_count": 1234567,
  "likes_count": 1234567,
  "quotes_count": 1234567,
  "replies_count": 1234567,
  "reposts_count": 1234567,
  "views_count": 1234567
}
```



## Page: https://developers.facebook.com/docs/threads/tools-and-resources/embed-a-threads-post

```markdown
# Embed a Threads Post

You can query the Threads oEmbed endpoint to get a public Threads post's embed HTML and basic metadata in order to display the post in another website or app. Text, image, video, and carousel posts are supported.

### Common Uses

- Embed a post in a blog.
- Embed a post in a website.
- Render a post in a content management system.

### Requirements

This guide assumes you are a [registered Meta developer](https://developers.facebook.com/docs/development/register) and have created a [Meta app with the Threads use case](https://developers.facebook.com/docs/development/create-an-app/threads-use-case).

You will need the following:

- **Access Levels** — [Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels) for the Threads oEmbed Read feature. **Requires [Meta App Review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review).**
- [**Access Token**](https://developers.facebook.com/docs/threads/get-started/app-access-tokens) — An app access token if your app accesses the oEmbed endpoint from a backend server.
- Features — [Threads oEmbed Read Feature](https://developers.facebook.com/docs/features-reference/threads-oembed-read).

### Limitations

- The Threads oEmbed endpoint is only intended to be used for embedding Threads content in websites and apps. It is not to be used for any other purpose. Using metadata and post content (or their derivations) from the endpoint for any purpose other than providing a front-end view of the post is strictly prohibited. This prohibition encompasses consuming, manipulating, extracting, or persisting the metadata and content, including but not limited to, deriving information about posts from the metadata for analytics purposes.
- Posts on private, inactive, and age-restricted accounts as well as geo-gated posts are not supported.
- With [standard access](https://developers.facebook.com/docs/graph-api/overview/access-levels), only posts from official Meta accounts can be embedded. These include [@meta](https://www.threads.net/@meta), [@threads](https://www.threads.net/@threads), [@instagram](https://www.threads.net/@instagram), and [@facebook](https://www.threads.net/@facebook).

### Rate Limits

Rate limits are dependent on the type of access token your app includes in each request.

#### App Token Rate Limits

Apps that rely on app access tokens can make up to 5 million requests per 24 hours.

## Get the Embed HTML

You can get the embed HTML programmatically via the API or from [threads.net](https://threads.net/) by clicking on a post's share icon and selecting the **Get embed code** button.

To get a Threads post's embed HTML using the API, send a request to the `/oembed` endpoint:

```
GET /oembed?url=<URL_OF_THE_POST>&access_token=<ACCESS_TOKEN>
```

- `URL_OF_THE_POST` — The permalink of the Threads post that you want to query.
- `ACCESS_TOKEN` — Your app access token. You can also pass it in an Authorization HTTP header, e.g., `Authorization: Bearer <ACCESS_TOKEN>`.

Upon success, the API will respond with a JSON object containing the post's embed HTML and additional data. The embed HTML will be in the returned `html` property.

Refer to the [Threads oEmbed reference](https://developers.facebook.com/docs/threads/reference/oembed) for a list of query string parameters you can include to augment the request.

### Example Requests

With an access token:

```
curl -X GET "https://graph.threads.net/v1.0/oembed?url=<URL_OF_THE_POST>&access_token=<ACCESS_TOKEN>"
```

With an Authorization HTTP header:

```
curl -i -X GET \
  --header "Authorization: Bearer 96481..." \
  "https://graph.threads.net/v1.0/oembed?url=<URL_OF_THE_POST>"
```

### Example Response

Default fields that are returned:

```
{
  "version": "1.0",
  "provider_name": "Threads",
  "provider_url": "https://www.threads.net/",
  "type": "rich",
  "width": 658,
  "html": "<blockquote class=\"text-post-media\" data-text-post-perma..."
}
```

### URL Formats

The `url` query string parameter accepts the following URL format:

```
https://www.threads.net/@{username}/post/{media-shortcode}/
```

### Embed JS

The embed HTML contains a reference to the Threads embed.js JavaScript library. When the library loads, it scans the page for the post HTML and generates the fully rendered post.

### Post Size

The embedded post is responsive and will adapt to the size of its container. This means that the height will vary depending on the container width and the length of the post content. You can set the maximum width by including the `maxwidth` query string parameter in your request.

## App Review Submission

When you submit your app for review, in the **Please provide a URL where we can test Oembed Read** form field, use the Threads oEmbed endpoint to get the embed HTML for any public post on our official [Threads profile](https://www.threads.net/@threads). Then, add the returned embed HTML to where you will be displaying oEmbed content and enter that page's URL in the form field.

![App Review Submission](https://lookaside.fbsbx.com/elementpath/media/?media_id=1251217786110270&version=1749289789)

Once you have been approved for the [Threads oEmbed Read feature](https://developers.facebook.com/docs/features-reference/threads-oembed-read), you may embed your own posts using their respective URLs.
```



## Page: https://developers.facebook.com/docs/threads/threads-web-intents

# Web Intents

Web intents offer a simple way for people to interact with Threads directly from your website, starting with the ability to quickly create posts and follow profiles.

When clicking on a Web intent URL, a new window opens and users are directed to Threads to complete the intended action. On mobile (iOS and Android), web intents will open the Threads app whenever it is installed. If they are not already logged-in, they will have the opportunity to sign in or create a Threads account.

When linking intents to an image, we recommend using the Threads logo available in our [Threads Brand Resources](https://about.meta.com/brand/resources/instagram/threads/).

## Post Intent

Post intents allow people to easily share their favorite content from your website directly to Threads, in order to increase your reach, spark conversations and drive traffic.

### URL Format

The URL format is [https://www.threads.net/intent/post](https://www.threads.net/intent/post).

### Supported Parameters

The post intent flow supports the following query string parameters.

| Name   | Description                                                                 |
|--------|-----------------------------------------------------------------------------|
| `text` | **Optional.**<br>The text that the post dialog should be prefilled with.   |
| `url`  | **Optional.**<br>The URL for an optional link attachment.                  |

All parameter values should be encoded using [percent-encoding](https://l.facebook.com/l.php?u=https%3A%2F%2Fdatatracker.ietf.org%2Fdoc%2Fhtml%2Frfc3986%23section-2.1&h=AT0xUawSAN46uaZnxFqfS3QxQ4bY8GScJWedm4xIxqTx_FtkGdkmDrqws1GSJ4exLq4NEbulXWXQpWA9AzAXuElI7FhAG51V02hJhqVwjKjhg-khwQUVgwkhbUCAM-4klmor_WHGX2tlkC0oNUi9se4Q-IA) ("URL encoding") so that the values can safely be passed via the URL.

### Examples

| Example                       | URL                                                                                                                                                                                                                         |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Only text                     | [https://www.threads.net/intent/post?text=Say+more+with+Threads+%E2%80%94+Instagram%27s+new+text+app](https://www.threads.net/intent/post?text=Say+more+with+Threads+%E2%80%94+Instagram%27s+new+text+app)               |
| Only link attachment          | [https://www.threads.net/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F](https://www.threads.net/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F) |
| Text and link attachment      | [https://www.threads.net/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F&amp;text=Introducing+Threads%3A+A+New+Way+to+Share+With+Text](https://www.threads.net/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F&amp;text=Introducing+Threads%3A+A+New+Way+to+Share+With+Text) |

## Follow Intent

Follow intents allow people to easily follow a Threads account directly from your website.

### URL Format

The URL format is [https://www.threads.net/intent/follow](https://www.threads.net/intent/follow).

### Supported Parameters

| Name       | Description                                                      |
|------------|------------------------------------------------------------------|
| `username` | **Required.**<br>The username of the user to follow.            |

### Examples

| Example                       | URL                                                                                   |
|-------------------------------|---------------------------------------------------------------------------------------|
| The official @threads account  | [https://www.threads.net/intent/follow?username=threads](https://www.threads.net/intent/follow?username=threads) |



## Page: https://developers.facebook.com/docs/threads/troubleshooting

# Threads API Troubleshooting

## Publishing Does Not Return a Media ID

If you are able to create a container for a video but the `POST /{threads-user-id}/threads_publish` endpoint does not return the published media ID, then you can get the container's publishing status by querying the `GET /{threads-container-id}` endpoint. This endpoint will return one of the following:

- `EXPIRED` — The container was not published within 24 hours and has expired.
- `ERROR` — The container failed to complete the publishing process.
- `FINISHED` — The container and its media object are ready to be published.
- `IN_PROGRESS` — The container is still in the publishing process.
- `PUBLISHED` — The container's media object has been published.

In case of error, the endpoint will return one of the following error messages:

- `FAILED_DOWNLOADING_VIDEO`
- `FAILED_PROCESSING_AUDIO`
- `FAILED_PROCESSING_VIDEO`
- `INVALID_ASPEC_RATIO`
- `INVALID_BIT_RATE`
- `INVALID_DURATION`
- `INVALID_FRAME_RATE`
- `INVALID_AUDIO_CHANNELS`
- `INVALID_AUDIO_CHANNEL_LAYOUT`
- `UNKNOWN`

We recommend querying a container's status once per minute, for no more than 5 minutes.

#### Example Request

```bash
curl -s -X GET \
"https://graph.threads.net/v1.0/<MEDIA_CONTAINER_ID>?fields=status,error_message&access_token=<THREADS_ACCESS_TOKEN>"
```

#### Example Response

```json
{
  "status": "FINISHED",
  "id": "17889615691921648"
}
```

#### Example Response (in case of error)

```json
{
  "status": "ERROR",
  "id": "17889615691921648",
  "error_message": "FAILED_DOWNLOADING_VIDEO"
}
```

## Retrieve Quota Limits

To validate that a user has not exhausted their API quota limits for publishing, reply publishing, deleting, and location search, they can make a call to the `GET {threads-user-id}/threads_publishing_limit` endpoint. This will return a user's current Threads API usage total.

#### Example Request

```bash
curl -s -X GET \
"https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=quota_usage,config,reply_quota_usage,reply_config,delete_quota_usage,delete_config,location_search_quota_usage,location_search_config&access_token=<THREADS_ACCESS_TOKEN>"
```

#### Example Response

```json
{
  "data": [
    {
      "quota_usage": 0,
      "config": {
        "quota_total": 250,
        "quota_duration": 86400
      },
      "reply_quota_usage": 0,
      "reply_config": {
        "quota_total": 1000,
        "quota_duration": 86400
      },
      "delete_quota_usage": 0,
      "delete_config": {
        "quota_total": 100,
        "quota_duration": 86400
      },
      "location_search_quota_usage": 0,
      "location_search_config": {
        "quota_total": 500,
        "quota_duration": 86400
      }
    }
  ]
}
```



## Page: https://developers.facebook.com/docs/threads/webhooks

# Webhooks for Threads

Webhooks for Threads allow you to receive real-time notifications for the subscribed topics and fields.

## Receive Live Webhook Notifications

To receive live webhook notifications, the following conditions must be satisfied:

- Your app must have Threads webhooks added as a sub-use case and appropriate fields subscribed to in the App Dashboard.
- For non-tech providers, the apps must be in [Live Mode](https://developers.facebook.com/docs/development/build-and-test/app-modes).
- For tech providers, the apps must have permissions with an [Advanced Access level](https://developers.facebook.com/docs/graph-api/overview/access-levels). You can request Advanced Access for permissions as shown here:

  ![Advanced Access](https://lookaside.fbsbx.com/elementpath/media/?media_id=1741127813088276&version=1755277458)

  If the app permissions don't have an access level of Advanced Access, the app won't receive webhook notifications.

- The app user must have granted your app appropriate permissions (i.e., `threads_basic`, `threads_read_replies` for reply webhooks).
- The business connected to the app must be verified.
- To receive real-time [reply](#real-time-reply-notifications) and [mention](#real-time-mention-notifications) notifications, the owner of the media object upon which the webhook event occurs must not have set their account to private.
- To receive real-time [delete](#real-time-delete-notifications) and [publish](#real-time-publish-notifications) notifications, the owner of the media object upon which the webhook event occurs must be a public account or private account that authenticated to the app.

### Limitations

- Apps don't receive webhook notifications if the media where the reply or mention appears was created by a private account.
- Your app must have successfully completed App Review ([Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels)) to receive webhooks notifications for all of the fields.

### Step 0: [Optional] Use the sample app to test your integration

Download the [webhooks sample app](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffbsamples%2Fgraph-api-webhooks-samples%2F&h=AT1-bxsimqRQAwqeke6xf5MG73AkUTXp9A7IZNylaLV_hDpUzuGF4bA8AIo1gA7gp_Oj2erO67PsQzzXpFfPAThJKh3eD5I8NTdR3YFBETfMh2AEwYqHM55LeV3QXnWznm7gLkiTzv_pqaPIrnSdeSdYZnM) to test your integration.

### Step 1: Add the webhooks sub-use case to the main Threads API use case

Under **Use Cases** > **Customize** > **Settings**, add the **Get real-time notifications with Threads Webhooks** sub-use case.

![Add Webhooks](https://lookaside.fbsbx.com/elementpath/media/?media_id=537570765271468&version=1755277458)

### Step 2: Create an endpoint and configure Threads webhooks

[Create an endpoint](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) that accepts and processes webhooks. To add the configuration:

1. Select the desired topic, and click **Subscribe to this object**.
2. Set the callback URL and token.

The token here is passed to your server defined in the callback URL to allow verification that the call originates from Meta servers.

![Configure Webhooks](https://lookaside.fbsbx.com/elementpath/media/?media_id=1033258184862601&version=1755277458)

#### Webhook Topics

##### Moderate topic fields

| Name      | Description |
|-----------|-------------|
| `replies` | [Replies](https://developers.facebook.com/docs/threads/reply-management#reply-retrieval) on a [Threads Media](https://developers.facebook.com/docs/threads/threads-media) owned by the Threads install user.<br>**Required permission(s):** [threads_basic](https://developers.facebook.com/docs/permissions#threads_basic), [threads_read_replies](https://developers.facebook.com/docs/permissions#threads_read_replies) |
| `delete`  | Threads posts that were [deleted](https://developers.facebook.com/docs/threads/posts/delete-posts) by the authenticated user.<br>**Required permissions:** [threads_basic](https://developers.facebook.com/docs/permissions#threads_basic), [threads_delete](https://developers.facebook.com/docs/permissions#threads_delete) |

##### Interaction topic fields

| Name      | Description |
|-----------|-------------|
| `mentions` | [Mentions](https://developers.facebook.com/docs/threads/threads-mentions) on a public [Threads Media](https://developers.facebook.com/docs/threads/threads-media) tagging the Threads install user.<br>**Required permission(s):** [threads_basic](https://developers.facebook.com/docs/permissions#threads_basic), [threads_manage_mentions](https://developers.facebook.com/docs/permissions#threads_manage_mentions)<br>**Optional permission(s):** [threads_read_replies](https://developers.facebook.com/docs/permissions#threads_read_replies) — required for the `has_replies`, `is_reply`, `replied_to`, and `root_post` fields. Without this permission, these fields will be removed from the webhook response. |
| `publish`  | Threads posts that were [published](https://developers.facebook.com/docs/threads/posts) by the authenticated user (including replies to user's or other's posts).<br>**Required permissions:** `threads_basic` |

### Notification Formats

#### Fields

| Name                | Description |
|---------------------|-------------|
| `app_id`            | The Threads App ID displayed in **App Dashboard** > **App settings** > **Basic** > **Threads App ID**. |
| `topic`             | Name of the Webhook topic.<br>We support moderate and interaction topics. |
| `target_id`         | The media’s ID for a `reply` or `delete` webhook, or the mentioned Threads user app-scoped user ID for a `mentions` webhook. |
| `time`              | Time when the real-time notification is sent. |
| `subscription_id`   | The subscription ID for the user in the webhook. |
| `id`                | The media's ID. |
| `deleted_at`        | Time when the post was deleted in ISO 8601 format. |
| `timestamp`         | Time when the post was published in ISO 8601 format. |

#### Real-time reply notifications

If you subscribe to the `replies` field, we send your endpoint a webhook notification containing the reply object.

##### Sample replies payload

```json
{
    "app_id": "123456",
    "topic": "moderate",
    "target_id": "78901",
    "time": 1723226877,
    "subscription_id": "234567",
    "has_uid_field": false,
    "values": {
        "value": {
            "id": "8901234",
            "username": "test_username",
            "text": "Reply",
            "media_type": "TEXT_POST",
            "permalink": "https://www.threads.net/@test_username/post/Pp",
            "replied_to": {
                "id": "567890"
            },
            "root_post": {
                "id": "123456",
                "owner_id": "123456",
                "username": "test_username_2"
            },
            "shortcode": "Pp",
            "timestamp": "2024-08-07T10:33:16+0000"
        },
        "field": "replies"
    }
}
```

#### Real-time mention notifications

If you subscribe to the `mentions` field, we send your endpoint a webhook notification containing the media object in which the user is mentioned.

##### Sample mentions payload

```json
{
    "app_id": "123456",
    "topic": "interaction",
    "target_id": "78901",
    "time": 1723226877,
    "subscription_id": "234567",
    "has_uid_field": false,
    "values": {
        "value": {
            "id": "8901234",
            "alt_text": "test alt text",
            "gif_url": "https://media2.giphy.com/media/v1.Y2lkPTA1NzQyMTNjd2R0MXcybjZ6bDNyam9qaXJsN3RicnVncnFsanJ2dGk3eDJiejRmbyZlcD12MV9naWZzX2dpZklkJmN0PWc/3o85xEFRBYvAnamJnG/200.gif",
            "has_replies": true,
            "is_quote_post": false,
            "is_reply": false,
            "media_product_type": "THREADS",
            "media_type": "TEXT_POST",
            "permalink": "https://www.threads.net/@test_username/post/Pp",
            "shortcode": "Pp",
            "text": "Reply",
            "timestamp": "2024-08-07T10:33:16+0000",
            "username": "test_username"
        },
        "field": "mentions"
    }
}
```

**Note:** Additional fields not listed in this sample response that are returned when applicable include: `media_url`, `poll_attachment`, `quoted_post`, `replied_to`, `reposted_post`, `root_post`, and `thumbnail_url`.

#### Real-time delete notifications

If you subscribe to the `delete` field, we send your endpoint a webhook notification containing the media object when it's deleted.

##### Sample delete payload

```json
{
    "app_id": "123456",
    "topic": "moderate",
    "target_id": "78901",
    "time": 1723226877,
    "subscription_id": "234567",
    "has_uid_field": false,
    "values": {
        "value": {
            "id": "8901234",
            "owner": {
                "owner_id": "78901"
            },
            "deleted_at": "2024-08-07T10:33:16+0000",
            "timestamp": "2024-08-07T10:33:16+0000",
            "username": "test_username"
        },
        "field": "delete"
    }
}
```

#### Real-time publish notifications

If you subscribe to the `publish` field, we send your endpoint a webhook notification containing the media object when it's published (including replies to user's or other's posts).

##### Sample publish payload

```json
{
    "app_id": "123456",
    "topic": "interaction",
    "target_id": "78901",
    "time": 1723226877,
    "subscription_id": "234567",
    "has_uid_field": false,
    "values": {
        "value": {
            "id": "8901234",
            "media_type": "TEXT_POST",
            "permalink": "https://www.threads.net/@test_username/post/Pp",
            "timestamp": "2024-08-07T10:33:16+0000",
            "username": "test_username"
        },
        "field": "publish"
    }
}
```



## Page: https://developers.facebook.com/docs/threads/get-started

```markdown
# Get Started

To access the Threads API, create an app and pick the [Threads Use Case](/docs/development/create-an-app/threads-use-case).

This guide provides information on what you need to get started using the Threads API.

## Before You Start

You need the following:

### Meta App

A [Meta app](https://developers.facebook.com/apps) created with the [Threads use case](/docs/development/create-an-app/threads-use-case).

**Note:** When creating your app there will be 2 app IDs and app secrets. For Threads API implementation purposes, use the Threads app ID and its corresponding app secret.

### Public Server

We download media used in publishing attempts so the media must be hosted on a publicly accessible server at the time of the attempt.

### Authorization

Data access authorization is controlled by your app users through the use of the permissions listed below. Users must grant your app these permissions through the [Authorization Window](#authorization-window) before your app can access their data. For more details, refer to our [Permissions guide](/docs/permissions#t).

- `threads_basic` — Required for all Threads endpoints.
- `threads_content_publish` — Required for Threads publishing endpoints only.
- `threads_manage_replies` — Required for making `POST` calls to reply endpoints.
- `threads_read_replies` — Required for making `GET` calls to reply endpoints.
- `threads_manage_insights` — Required for making `GET` calls to insights endpoints.

[Threads testers](#threads-testers) can grant your app these permissions at any time. In order for app users without a role on your app to be able to grant your app these permissions, each permission must first be approved through the [App Review](/docs/resp-plat-initiatives/app-review) process, and your app must be published.

Permission grants made by app users with public profiles are valid for 90 days. [Refreshing](#refresh-a-long-lived-token) an app user's long-lived access token will extend the permission grant for another 90 days if the app user who granted the token has a public profile. If the app user's profile is [private](https://l.facebook.com/l.php?u=https%3A%2F%2Fhelp.instagram.com%2F225222310104065&h=AT2OIkXarRf1eAi-5JYBEs7rPzRV7y-BbLxFcGQ2jmthMkhQWdfjlTvgM_l7tN9y1xWY2ENWi05freSqIcV1lNkBaRBoh3Tbcbz7FnejgWuGTDss3JWqzTPiGQ-dIrs3av6DJCMXplwzuySTNz9DRtisgE0), however, the permission grant cannot be extended and the app user must grant the expired permission to your app again.

### Threads User Access Tokens

API authentication is handled by Threads user access tokens that conform to the OAuth 2.0 protocol. Access tokens are app-scoped (unique to the app and user pair) and can be short-lived or long-lived. API requests that query Threads users or publish Threads media must include a Threads user access token. Use the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to debug your Threads User Access Token.

#### Short-Lived Access Tokens

Short-lived access tokens are valid for 1 hour, but can be exchanged for [long-lived tokens](/docs/threads/get-started/long-lived-tokens). To get a short-lived access token, implement the [Authorization Window](#authorization-window) into your app. After the app user authenticates their identity through the window, we will redirect the user back to your app and include an [authorization code](#authorization-codes), which you can then [exchange for a short-lived access token](/docs/threads/get-started/get-access-tokens-and-permissions).

#### Long-Lived Access Tokens

Short-lived tokens that have not expired can be [exchanged for long-lived access tokens](/docs/threads/get-started/long-lived-tokens), which are valid for 60 days. Long-lived tokens can be [refreshed](#refresh-a-long-lived-token) before they expire by querying the `GET /refresh_access_token` endpoint.

### Authorization Window

The Authorization Window allows your app to get [authorization codes](#authorization-codes) and [permissions](#permissions) from app users. Authorization codes can be exchanged for [Threads user access tokens](#threads-user-access-tokens), which must be included when fetching an app user's profile, retrieving Threads media, publishing posts, reading replies, managing replies, or viewing insights.

![Authorization Window](https://lookaside.fbsbx.com/elementpath/media/?media_id=1192671261765235&version=1762738863)

To implement the Authorization Window, refer to the [Getting Access Tokens](/docs/threads/get-started/get-access-tokens-and-permissions) guide.

### Authorization Codes

Authorization codes can be exchanged for short-lived [Threads user access tokens](#threads-user-access-tokens). To get an authorization code, implement the [Authorization Window](#authorization-window) into your app. After an app user authenticates their identity through the window and grants your app any permissions it needs, we will redirect the user to your app and include an authorization code. You can then use the API to exchange the code for the app user's short-lived Threads user access token.

**Note:** Authorization codes are short-lived and are only valid for 1 hour.

### Threads Testers

In order to test your app with a Threads user, you must first send an invitation to the Threads user's profile and accept the invitation. Invitations can be sent by clicking on the **Add People** button and selecting **Threads Tester** in the **App Dashboard** > **App roles** > **Roles** tab.

![Threads Tester Invitation](https://lookaside.fbsbx.com/elementpath/media/?media_id=497641556053806&version=1762738863)

Invitations can be accepted by the Threads user in the **Website permissions** section under [**Account Settings**](https://www.threads.net/settings/account) of the Threads website or mobile app after signing into their account.

![Accepting Invitation](https://lookaside.fbsbx.com/elementpath/media/?media_id=856199969685140&version=1762738863)

## Sample App

Our open-source [Threads API sample app](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffbsamples%2Fthreads_api&h=AT2PHnPR7xbeGhcKZSlta14_cP4gnTvuG_F8GNMJ9nC4KBuc4RESVkOWhj9h_QvrTHqnVa0aMwkWckT8Rkj0KPhEITN8u5aN06vRn04t_7WDFjwSdpUMMMcEb6FnFn7OfNAht3J78lUUCw3h0N_ByWnULPw) serves as a practical guide, enabling you to better understand the API and troubleshoot any issues by referencing a working implementation. This can simplify the integration process, accelerate development time, and ensure a smoother implementation experience.

## Next Steps

- Make [Single Thread Posts](/docs/threads/posts#single-thread-posts)
- Make [Carousel Posts](/docs/threads/posts#carousel-posts)
- [Retrieve Threads Media](/docs/threads/threads-media)
```



## Page: https://developers.facebook.com/docs/threads/tools-and-resources

# Tools and Resources

## [Postman Collection](https://developers.facebook.com/docs/threads/tools-and-resources/postman-collection)

To make it more convenient for developers integrating with Threads API, we've created a Postman collection that contains a full set of API calls.



## Page: https://developers.facebook.com/docs/threads/create-posts

# Create Posts

You can use the Threads API to publish image, video, text, or carousel posts as well as quote and repost other posts.

## Permissions

Posting to Threads requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

- `threads_basic` — Required for making any calls to all Threads API endpoints.
- `threads_content_publish` — Required for Threads publishing endpoints only.

If your app has not been approved for advanced access for the `threads_content_publish` permission, you can only post to Threads for your account and your app's tester accounts. After approval, you can post to Threads on behalf of other public users.

## Fediverse

For Threads users who have [enabled sharing to the fediverse](https://l.facebook.com/l.php?u=https%3A%2F%2Fhelp.instagram.com%2F760878905943039&h=AT10lTh74-mqIVAZtxHTZsW4R4Nk8ne_Neadufx24I7kqnI1jgKwVlWn6XJMKoMnLJuF2oGBmzzAhGaSCCT36zCw9umP7iI5YgIK7DWlygcAe3O_wiol-1LiFTMFXA8-G9LuKRNv-RKvPEhFhIaHjiwyd-Y), eligible posts made to Threads via the Threads API will also be shared to the fediverse starting August 28, 2024.

## Next Steps

- [Threads Posts](https://developers.facebook.com/docs/threads/posts)
- [Reposts](https://developers.facebook.com/docs/threads/posts/reposts)
- [Quote Posts](https://developers.facebook.com/docs/threads/posts/quote-posts)
- [Spoilers](https://developers.facebook.com/docs/threads/create-posts/spoilers)
- [Text Attachments](https://developers.facebook.com/docs/threads/create-posts/text-attachments)
- [Geo-Gated Content](https://developers.facebook.com/docs/threads/posts/geo-gating)
- [Accessibility](https://developers.facebook.com/docs/threads/posts/accessibility)



## Page: https://developers.facebook.com/docs/threads/retrieve-and-manage-replies

# Retrieve and Manage Replies

The Threads Reply Management API allows you to read and manage replies to users' own Threads.

## Permissions

The Threads Reply Management API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

- `threads_basic` — Required for making any calls to all Threads API endpoints.
- `threads_manage_replies` — Required for making `POST` calls to reply endpoints.
- `threads_read_replies` — Required for making `GET` calls to reply endpoints.

## Rate Limits

Threads profiles are limited to 1,000 API-published replies within a 24-hour moving period. You can retrieve a profile's current Threads replies rate limit usage with the `GET /{threads-user-id}/threads_publishing_limit` endpoint.

**Note:** This endpoint requires the `threads_basic`, `threads_content_publish`, and `threads_manage_replies` permissions.

### Fields

| Name                     | Description                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| `reply_quota_usage`     | Threads reply publishing count over the last 24 hours.                     |
| `reply_config`          | Threads reply publishing rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

### Example Request

```bash
curl -s -X GET \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=reply_quota_usage,reply_config&access_token=<ACCESS_TOKEN>"
```

### Example Response

```json
{
  "data": [
    {
      "reply_quota_usage": 1,
      "reply_config": {
        "quota_total": 1000,
        "quota_duration": 86400
      }
    }
  ]
}
```

## Next Steps

- [Create Replies](https://developers.facebook.com/docs/threads/retrieve-and-manage-replies/create-replies)
- [Retrieve Replies and Conversations](https://developers.facebook.com/docs/threads/retrieve-and-manage-replies/replies-and-conversations)
- [Reply Management](https://developers.facebook.com/docs/threads/reply-management)



## Page: https://developers.facebook.com/docs/threads/changelog

# Threads Changelog

## October 28, 2025

### Threads Ads

- Advantage+ catalog ads are now available for Threads ads. Only images and image carousels are currently supported. Slideshow, video and entry cards are not supported at this time. See [Threads Advantage+ Catalog Ads](https://developers.facebook.com/docs/marketing-api/ad-creative/threads-ads/creation/advantage-catalog-ads) for more information.

## October 17, 2025

- Support for adding GIFs to posts is now available. See [GIFs](https://developers.facebook.com/docs/threads/posts#gifs) for more information.

## October 6, 2025

### Threads Ads

- Image carousel can now be used for Threads ads. Placement customization and dynamic media are not supported. See [Threads Carousel Ads](https://developers.facebook.com/docs/marketing-api/ad-creative/threads-ads/creation/carousel-ads) for more information.

## October 3, 2025

- Support for adding spoilers to single or carousel posts containing `TEXT`, `IMAGE`, or `VIDEO` media types is now available. See [Spoilers](https://developers.facebook.com/docs/threads/create-posts/spoilers) for more information.
- Support for adding a text attachment to a post has been added. See [Text Attachments](https://developers.facebook.com/docs/threads/create-posts/text-attachments) for more details.

## September 23, 2025

- The Threads API is now available to Threads profiles without a linked Instagram account. These users can use all Threads API functionalities except for the [followers_count](https://developers.facebook.com/docs/threads/insights/) and `follower_demographics` user metrics.

## September 9, 2025

- Support for searching for public posts by media type has been added. See [Keyword Search](https://developers.facebook.com/docs/threads/keyword-search#search-by-media-type) for more details.

## August 15, 2025

### Threads Ads

- Threads ads now supports video ads. See [Threads ads creatives: Media requirements](https://developers.facebook.com/docs/marketing-api/ad-creative/threads-ads/creation#media-requirements) for more information.
- Threads has been added as a `publisher_platform` in the `customization_spec` for Placement Asset Customization. See [Supported Fields in `customization_spec`](https://developers.facebook.com/docs/marketing-api/dynamic-creative/placement-asset-customization/#supported-fields) for more information.

### Webhooks

- Support for publish webhooks has been added. See [Webhooks](https://developers.facebook.com/docs/threads/webhooks/) for more details.

## August 12, 2025

- The `total_votes` field was added to poll attachments. See [Polls](https://developers.facebook.com/docs/threads/create-posts/polls) for more details.

## August 1, 2025

- Support for delete webhooks has been added. See [Webhooks](https://developers.facebook.com/docs/threads/webhooks/) for more details.

## July 21, 2025

- The `topic_tag` field was added to the [Media retrieval endpoints](https://developers.facebook.com/docs/threads/threads-media).

## July 15, 2025

- Support for mentions webhooks has been added. See [Webhooks for Threads](https://developers.facebook.com/docs/threads/webhooks) for more details.

## July 14, 2025

- Support for Threads profile discovery has been added. See [Retrieve a Threads User's Public Profile Information](https://developers.facebook.com/docs/threads/threads-profiles#retrieve-a-threads-user-s-public-profile-information) and [Retrieve a List of a Public Profile's Threads](https://developers.facebook.com/docs/threads/retrieve-and-discover-posts/retrieve-posts#retrieve-a-list-of-a-public-profile-s-threads) for more details.
- Support for creating posts with topic tags via a `topic_tag` parameter has been added. See [Threads Posts](https://developers.facebook.com/docs/threads/posts#topic-tags) for more details.
- Support for [Topic Tag Search](https://developers.facebook.com/docs/threads/keyword-search#topic-tag-search) has been added. The `GET /keyword_search` endpoint also now supports timestamp filtering using the `since` and `until` parameters. See [Keyword Search](https://developers.facebook.com/docs/threads/keyword-search#keyword-search) for more details.
- Deletion and location search quotas have been added to the `GET me/threads_publishing_limit` endpoint. See [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting#retrieve-quota-limits) for more details.

## July 7, 2025

- The `is_verified` field was added to the [User Profile endpoint](https://developers.facebook.com/docs/threads/threads-profiles).
- Two new reply audience options, `parent_post_author_only` and `followers_only`, have been added to the [Threads Reply Management API](https://developers.facebook.com/docs/threads/reply-management#control-who-can-reply).

## July 2, 2025

- The [clicks](https://developers.facebook.com/docs/threads/insights#user-metrics) metric indicating the number of times a URL was clicked on your Threads posts has been added to the [Threads Insights API](https://developers.facebook.com/docs/threads/insights).

## June 25, 2025

- The query limit for keyword search has been changed. See [Keyword Search](https://developers.facebook.com/docs/threads/keyword-search) for more details.

## June 6, 2025

- The Threads API can be accessed by either `graph.threads.com` or `graph.threads.net`.

## June 4, 2025

- Support for programmatically debugging access tokens has been added. See [Debug Access Tokens](https://developers.facebook.com/docs/threads/troubleshooting/debug-access-token) for more details.
- Support for automatically publishing text posts has been added. See [Publishing](https://developers.facebook.com/docs/threads/reference/publishing) for more details.

## May 27, 2025

- Support for [retrieving Threads location objects by individual ID](https://developers.facebook.com/docs/threads/reference/locations) has been added.
- Support for [searching for locations to tag in Threads post](https://developers.facebook.com/docs/threads/reference/location-search) has been added.

See [Location Tagging](https://developers.facebook.com/docs/threads/create-posts/location-tagging) for more information.

## April 14, 2025

- Support for creating posts with polls has been added. See [Polls](https://developers.facebook.com/docs/threads/create-posts/polls) for more details.

## March 6, 2025

- Support for deleting posts has been added. See [Delete Posts](https://developers.facebook.com/docs/threads/posts/delete-posts) for more details.

## February 13, 2025

- The `gif_url` field was added to the [Media retrieval endpoints](https://developers.facebook.com/docs/threads/threads-media).

## December 9, 2024

- Support for [Keyword Search](https://developers.facebook.com/docs/threads/keyword-search) has been added.
- Return a list of Threads media objects in which a Threads profile has been tagged by another Threads profile. See [Mentions](https://developers.facebook.com/docs/threads/threads-mentions) for more information.
- Embed the content of Threads posts, such as photos and videos, in other websites. See [Embed a Threads Post](https://developers.facebook.com/docs/threads/tools-and-resources/embed-a-threads-post) for more information.
- Use the [Threads API Postman Collection](https://developers.facebook.com/docs/threads/tools-and-resources/postman-collection) to make API calls.

## October 28, 2024

- The [shares](https://developers.facebook.com/docs/threads/insights#available-metrics) metric indicating the number of shares of your Threads posts has been added to the [Threads Insights API](https://developers.facebook.com/docs/threads/insights).

## October 11, 2024

- A hash sign followed by a whole number (i.e. #1) will not be converted into a tag.
- The list of unsupported special characters in tags has been updated.
- See [Tags](https://developers.facebook.com/docs/threads/posts#tags) for more details.

## October 9, 2024

- Support for quote posts has been added. See [Quote Posts](https://developers.facebook.com/docs/threads/posts/quote-posts) for more details.
- Support for reposts has been added. See [Reposts](https://developers.facebook.com/docs/threads/posts/reposts) for more details.

## October 8, 2024

- Additional fields have been added to the Webhook response. See [Webhooks](https://developers.facebook.com/docs/threads/webhooks) for more details.

## September 19, 2024

- [Carousel posts](https://developers.facebook.com/docs/threads/posts#carousel-posts) are now allowed up to 20 images, videos, or a mix of the two.

## September 12, 2024

- We made it easier to attach links with Threads API. See [Links](https://developers.facebook.com/docs/threads/posts#tags-and-links-in-posts) for more details.

## August 21, 2024

- Support for alt text has been added. See [Accessibility](https://developers.facebook.com/docs/threads/posts/accessibility) for more details.

## August 15, 2024

- For Threads users who have [enabled sharing to the fediverse](https://l.facebook.com/l.php?u=https%3A%2F%2Fhelp.instagram.com%2F760878905943039&h=AT0ljyMfFkPS2zbuxt2LVkGAtEbgHVpR2D738rJWFTT3MWbfGIayArdYN52TuGXbB4oG-Tl-tbIaiqEyWrAx1T8i6WB0_ni_L0R1MmJ_0iZwEFQytjH8SgFx_iSuSPDdh2dJuu_y98da9XL6kIFxR6iT0uI), eligible posts made to Threads via the Threads API will also be shared to the fediverse starting August 28, 2024.

## August 13, 2024

- [Webhooks for Threads](https://developers.facebook.com/docs/threads/webhooks) allow you to receive real-time notifications for the subscribed topics and fields.

## August 5, 2024

- The `name` field was added to the [User Profile endpoint](https://developers.facebook.com/docs/threads/reference/user#get---threads-user-id--fields-id-username----).
- Use `graph.threads.net/me/replies` to fetch all replies for your user. See [Retrieve a List of All a User's Replies](https://developers.facebook.com/docs/threads/reply-management#retrieve-a-list-of-all-a-user-s-replies) for more information.

## July 23, 2024

- Posts made via the Threads API can be [geo-gated](https://developers.facebook.com/docs/threads/geo-gating) to one or more specific countries.

## July 12, 2024

- Threads [Web Intents](https://developers.facebook.com/docs/threads/threads-web-intents) for posts and follows are now available.

## June 25, 2024

- When fetching media insights on reposts, an empty array is returned.

## June 18, 2024

- Threads API is open to all developers, see [blog post](https://developers.meta.com/blog/post/2024/06/18/the-threads-api-is-finally-here/) for more details.
- Docs have been updated to clarify that the `since` and `until` parameters are not supported when fetching the `followers_count` metric on the `/{threads-user-id}/threads_insights` endpoint.

## June 17, 2024

- Authorization, Permissions, and Threads User Access Tokens sections updated for `threads.net` domain and Threads Tester section added to [Get Started](https://developers.facebook.com/docs/threads/get-started).
- [Get Access Tokens and Permissions](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions) and [Long-Lived Tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens) docs added.
- To access the Threads API, create an app and pick the [Threads Use Case](https://developers.facebook.com/docs/development/create-an-app/threads-use-case).

## June 12, 2024

- With the `threads_basic` and `threads_read_replies` permissions, users can query the `reply_audience` field to see who can reply to their previously published posts.

## June 7, 2024

- The domain for API calls is now `graph.threads.net`. All API calls to `graph.threads.net` should use `v1.0`. In order to use `graph.threads.net`, you will need to obtain a Threads access token.
- Reply Management and Insights have been added to the [Reference](https://developers.facebook.com/docs/threads/reference) page.

## May 21, 2024

- The `since` and `until` parameters on the user insights endpoint do not work for dates before April 13, 2024 (Unix timestamp 1712991600).
- A Threads profile must have at least 100 followers in order to fetch values for the `follower_demographics` metric.
- When requesting follower demographics, the `breakdown` parameter must be provided and must be set equal to one of the following values: `country`, `city`, `age`, or `gender`.
- Updated the possible values of the `hide_status` field on replies: `NOT_HUSHED`, `UNHUSHED`, `HIDDEN`, `COVERED`, `BLOCKED`, `RESTRICTED`.

## May 15, 2024

- Removed `REPOST_FACADE` as one of the possible values for the `media_type` field on replies.

## May 2, 2024

- Deprecated status code on media builder endpoint.

## May 1, 2024

- Users can query the `is_reply_owned_by_me` field to determine which replies are owned by their user and which replies are owned by other users.

## April 26, 2024

- Launch of User Level Insights.

## April 18, 2024

- The `permalink` and `username` fields can now be fetched on replies made by public users and your own user.

## April 8, 2024

- Threads API documentation was made publicly available. See the [blog post](https://developers.facebook.com/blog/post/2024/04/08/the-threads-api-is-coming-soon) for more details.



## Page: https://developers.facebook.com/docs/threads

# Threads API

The Threads API enables developers to build their own unique integrations, and helps creators and brands manage their Threads presence at scale and easily share inspiring content with their communities.

## Documentation Contents

### [Overview](https://developers.facebook.com/docs/threads/overview)

Brief overview of the Threads API limitations.

### [Get Started](https://developers.facebook.com/docs/threads/get-started)

Learn about the requirements for using the Threads API.

### [Threads Use Case](https://developers.facebook.com/docs/development/create-an-app/threads-use-case)

How to create and customize a Meta app with the Threads API use case in the App Dashboard.

### [Reference](https://developers.facebook.com/docs/threads/reference)

The Threads API endpoints and their parameters.

### Guides

Learn how to make posts, retrieve media, and troubleshoot issues.

- [Single Thread Posts](https://developers.facebook.com/docs/threads/posts#single-thread-posts)
- [Carousel Posts](https://developers.facebook.com/docs/threads/posts#carousel-posts)
- [Threads Media](https://developers.facebook.com/docs/threads/threads-media)
- [Threads Profiles](https://developers.facebook.com/docs/threads/threads-profiles)
- [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)
- [Reply Moderation](https://developers.facebook.com/docs/threads/reply-moderation)
- [Mentions](https://developers.facebook.com/docs/threads/threads-mentions)
- [Insights](https://developers.facebook.com/docs/threads/insights)
- [Webhooks](https://developers.facebook.com/docs/threads/webhooks)
- [oEmbed](https://developers.facebook.com/docs/threads/tools-and-resources/embed-a-threads-post)
- [Web Intents](https://developers.facebook.com/docs/threads/threads-web-intents)
- [Postman Collection](https://developers.facebook.com/docs/threads/tools-and-resources/postman-collection)

---

**Follow Us**

- [Meta for Developers](https://www.facebook.com/MetaforDevelopers)
- [Instagram](https://www.instagram.com/metafordevelopers/)
- [Twitter](https://twitter.com/metafordevs)
- [LinkedIn](https://www.linkedin.com/showcase/meta-for-developers/)
- [YouTube](https://www.youtube.com/MetaDevelopers/)



## Page: https://developers.facebook.com/docs/

# Meta Developer Documentation

*Learn the basics of how to send and receive data from the Meta social graph* and how to implement the APIs, Platforms, Products, and SDKs to fit your application needs.

## Meta App Development

Register as a developer, configure your app's settings in the App Dashboard, and build, test, and release your app.  
[Docs](/docs/development)

## Graph API

The primary way for apps to read and write to the Meta social graph.  
[Docs](/docs/graph-api)

## Responsible Platform Initiatives

Verify that your app uses our products and APIs in an approved manner.  
[Docs](/docs/resp-plat-initiatives)

## App Integrations
### [App Links](https://developers.facebook.com/docs/applinks/)
### [Graph API](https://developers.facebook.com/docs/graph-api/)
### [Meta App Events](https://developers.facebook.com/docs/app-events/)
### [Meta Pixel](https://developers.facebook.com/docs/meta-pixel/)
### [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)

## Authentication
### [Facebook Login](https://developers.facebook.com/docs/facebook-login/)
### [Limited Facebook Login](https://developers.facebook.com/docs/facebook-login/limited-login/)
### [Login Connect with Messenger](https://developers.facebook.com/docs/facebook-login/login-connect/)

## Developer Guides
### [Meta App Development](https://developers.facebook.com/docs/development/)
### [Developer Policies](https://developers.facebook.com/devpolicy)
### [Meta Platform Terms](https://developers.facebook.com/terms)
### [Privacy & Consent](https://developers.facebook.com/docs/privacy)

## SDKs
### [Facebook SDK for Android](https://developers.facebook.com/docs/android/)
### [Facebook SDK for iOS](https://developers.facebook.com/docs/ios/)
### [Facebook SDK for JavaScript](https://developers.facebook.com/docs/javascript/)
### [Facebook SDK for PHP](https://developers.facebook.com/docs/php-graph-sdk/)
### [Unity SDK](https://developers.facebook.com/docs/unity/)
### [Meta Business SDK](https://developers.facebook.com/docs/business-sdk/)

## Gaming
### [Facebook Games](https://developers.facebook.com/docs/games/)
### [Game Payments](https://developers.facebook.com/docs/games_payments/)

## Social Integrations
### [Facebook Pages API](https://developers.facebook.com/docs/pages-api/)
### [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/)
### [Threads API](https://developers.facebook.com/docs/threads/)
### [Sharing](https://developers.facebook.com/docs/sharing/)
### [Social Plugins](https://developers.facebook.com/docs/plugins/)

## Videos
### [Live Video API](https://developers.facebook.com/docs/live-video-api/)
### [Stories](https://developers.facebook.com/docs/page-stories-api/)
### [Videos](https://developers.facebook.com/docs/videos/)

## Business Messaging
### [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/)
### [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)

## Marketing and Commerce
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

## Work and Education
### [Meta Admin Center](https://developers.facebook.com/docs/admin-center/)
### [Workplace](https://developers.facebook.com/docs/workplace/)

## Artificial Intelligence
### [Wit.ai](https://www.wit.ai/)

## Rights Manager

## Data Portability
### [Data Portability](https://developers.facebook.com/docs/data-portability/)



## Page: https://developers.facebook.com/docs/threads/retrieve-and-discover-posts

# Retrieve and Discover Posts

You can search for posts using the keyword search or retrieve posts and mentions related to a specific user.

## Pagination

Retrieving a user's posts and mentions supports cursor-based pagination so the response will include `before` and `after` cursors if the response contains multiple pages of data. Unlike standard cursor-based pagination, however, the response will not include previous or next fields, so you will have to use the `before` and `after` cursors to construct previous and next query strings manually in order to page through the returned data set.

### Example Request

```bash
curl -s -X GET \
  https://graph.threads.net/17841405822304914/mentions?fields=id,username&access_token=EAADd...
```

### Example Response

```json
{
  "data": [
    {
      "id": "18038...",
      "username": "keldo..."
    },
    {
      "id": "17930...",
      "username": "ashla..."
    },
    {
      "id": "17931...",
      "username": "jaypo..."
    }
  ]
}
```

## Next Steps

- [Retrieve Posts](/docs/threads/retrieve-and-discover-posts/retrieve-posts)
- [Mentions](/docs/threads/threads-mentions)
- [Keyword Search](/docs/threads/keyword-search)



## Page: https://developers.facebook.com/docs/threads/overview

```markdown
# Overview

You may use the Threads API to enable people to create and publish content on a person’s behalf on Threads, and to display those posts within your app solely to the person who created it.

The Threads API can be accessed by either `graph.threads.com` or `graph.threads.net`.

## Rate Limiting

Calls to the Threads API are counted against the calling app's call count. An app's call count is unique for each app and app user pair and is the number of calls the app has made in a rolling 24-hour window. It is calculated as follows:

```
Calls within 24 hours = 4800 * Number of Impressions
```

The Number of Impressions is the number of times any content from the app user's Threads account has entered a person's screen within the last 24 hours.

Rate limiting may also be subject to total CPU time per day:

```
720000 * number_of_impressions for total_cputime 
2880000 * Number of Impressions for total_time
```

**Note:** The minimum value for impressions is 10 (so if the impressions is less than 10 we default to 10).

### Posts

Threads profiles are limited to 250 API-published posts within a 24-hour moving period. Carousels count as a single post. This limit is enforced on the `POST /{threads-user-id}/threads_publish` endpoint when attempting to publish a media container. We recommend that your app also enforces the publishing rate limit, especially if your app allows app users to schedule posts to be published in the future.

To check a profile's current Threads API rate limit usage, query the [GET /{threads-user-id}/threads_publishing_limit](https://developers.facebook.com/docs/threads/reference/user#get---threads-user-id--threads-publishing-limit) endpoint.

**Note:** This endpoint requires the `threads_basic` and `threads_content_publish` permissions.

#### Fields

| Name            | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `quota_usage`   | Threads publishing count over the last 24 hours.                           |
| `config`        | Threads publishing rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```bash
curl -s -X GET "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=quota_usage,config&access_token=<ACCESS_TOKEN>"
```

#### Example Response

```json
{
  "data": [
    {
      "quota_usage": 4,
      "config": {
        "quota_total": 250,
        "quota_duration": 86400
      }
    }
  ]
}
```

### Replies

Threads profiles are limited to 1,000 replies within a 24-hour moving period.

To check a profile's current Threads replies rate limit usage, query the [GET /{threads-user-id}/threads_publishing_limit](https://developers.facebook.com/docs/threads/reference/user#get---threads-user-id--threads-publishing-limit) endpoint. See the [Reply Management](https://developers.facebook.com/docs/threads/reply-management) documentation for more information.

**Note:** This endpoint requires the `threads_basic`, `threads_content_publish`, and `threads_manage_replies` permissions.

#### Fields

| Name                  | Description                                                                  |
|-----------------------|------------------------------------------------------------------------------|
| `reply_quota_usage`   | Threads reply publishing count over the last 24 hours.                      |
| `reply_config`        | Threads reply publishing rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```bash
curl -s -X GET "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=reply_quota_usage,reply_config&access_token=<ACCESS_TOKEN>"
```

#### Example Response

```json
{
  "data": [
    {
      "reply_quota_usage": 1,
      "reply_config": {
        "quota_total": 1000,
        "quota_duration": 86400
      }
    }
  ]
}
```

### Deletion

Threads profiles are limited to 100 deletions within a 24-hour moving period.

To check a profile's current Threads deletion rate limit usage, query the [GET /{threads-user-id}/threads_publishing_limit](https://developers.facebook.com/docs/threads/reference/user#get---threads-user-id--threads-publishing-limit) endpoint. See the [Delete Posts](https://developers.facebook.com/docs/threads/posts/delete-posts) documentation for more information.

**Note:** This endpoint requires the `threads_basic` and `threads_delete` permissions.

#### Fields

| Name                  | Description                                                                  |
|-----------------------|------------------------------------------------------------------------------|
| `delete_quota_usage`  | Threads deletion count over the last 24 hours.                             |
| `delete_config`       | Threads deletion rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```bash
curl -s -X GET "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=delete_quota_usage,delete_config&access_token=<ACCESS_TOKEN>"
```

#### Example Response

```json
{
  "data": [
    {
      "delete_quota_usage": 1,
      "delete_config": {
        "quota_total": 100,
        "quota_duration": 86400
      }
    }
  ]
}
```

### Location Search

Threads profiles are limited to 500 location searches within a 24-hour moving period.

To check a profile's current Threads location search rate limit usage, query the [GET /{threads-user-id}/threads_publishing_limit](https://developers.facebook.com/docs/threads/reference/user#get---threads-user-id--threads-publishing-limit) endpoint. See the [Location Search](https://developers.facebook.com/docs/threads/create-posts/location-tagging#search) documentation for more information.

**Note:** This endpoint requires the `threads_basic` and `threads_location_tagging` permissions.

#### Fields

| Name                       | Description                                                                  |
|----------------------------|------------------------------------------------------------------------------|
| `location_search_quota_usage` | Threads location search count over the last 24 hours.                     |
| `location_search_config`   | Threads location search rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```bash
curl -s -X GET "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=location_search_quota_usage,location_search_config&access_token=<ACCESS_TOKEN>"
```

#### Example Response

```json
{
  "data": [
    {
      "location_search_quota_usage": 1,
      "location_search_config": {
        "quota_total": 500,
        "quota_duration": 86400
      }
    }
  ]
}
```

## Limitations and Specifications

### Image Specifications

- **Format:** JPEG and PNG image types are the officially supported formats for image posts.
- **File Size:** 8 MB maximum.
- **Aspect Ratio Limit:** 10:1
- **Minimum Width:** 320 (will be scaled up to the minimum if necessary)
- **Maximum Width:** 1440 (will be scaled down to the maximum if necessary)
- **Height:** Varies (depending on width and aspect ratio)
- **Color Space:** sRGB. Images using other color spaces will have their color spaces converted to sRGB.

### Video Specifications

- **Container:** MOV or MP4 (MPEG-4 Part 14), no edit lists, moov atom at the front of the file.
- **Audio Codec:** AAC, 48khz sample rate maximum, 1 or 2 channels (mono or stereo).
- **Video Codec:** HEVC or H264, progressive scan, closed GOP, 4:2:0 chroma subsampling.
- **Frame Rate:** 23-60 FPS
- **Picture Size:**
  - Maximum Columns (horizontal pixels): 1920
  - Required aspect ratio is between 0.01:1 and 10:1 but we recommend 9:16 to avoid cropping or blank space.
- **Video Bitrate:** VBR, 100 Mbps maximum.
- **Audio Bitrate:** 128 kbps.
- **Duration:** 300 seconds (5 minutes) maximum, minimum longer than 0 seconds.
- **File Size:** 1 GB maximum.

### Other Limitations

- Text posts are limited to 500 characters.
- Carousel posts must have a maximum of 20 children and a minimum of 2 children.
- For additional limitations, refer to each endpoint's reference.

## Next Steps

- [Get Started with the Threads API](https://developers.facebook.com/docs/threads/get-started)
```



## Page: https://developers.facebook.com/docs/threads/insights

# Threads Insights API

The Threads Insights API allows you to read the insights from users' own Threads.

### Permissions

The Threads Insights API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

- `threads_basic` — Required for making any calls to all Threads API endpoints.
- `threads_manage_insights` — Required for making `GET` calls to insights endpoints.

### Limitations

- The user insights `since` and `until` parameters do not work for dates before April 13, 2024 (Unix timestamp `1712991600`).

## Media Insights

To retrieve the available insights metrics, send a `GET` request to the `/{threads-media-id}/insights` endpoint with the `metric` parameter containing a comma-separated list of metrics to be returned.

**Note:**

- Returned metrics do not capture nested replies' metrics.
- An empty array will be returned for `REPOST_FACADE` posts because they are posts made by other users.

### Available Metrics

| Name    | Description                                                                 |
|---------|-----------------------------------------------------------------------------|
| `views` | The number of times your post was played or displayed. **Note:** This metric is [in development](https://www.facebook.com/business/help/metrics-labeling). |
| `likes` | The number of likes on the post.                                           |
| `replies` | The number of replies on the post. **Note:** When the requested media is a root post, this number includes total replies. If the media is itself a reply, this number includes only **direct** replies. |
| `reposts` | The number of times the post was reposted.                                |
| `quotes` | The number of times the post was quoted.                                   |
| `shares` | The number of shares of your Threads posts. **Note:** This metric is [in development](https://www.facebook.com/business/help/metrics-labeling). |

### Example Request

```bash
curl -s -X GET \
  -F "metric=likes,replies" \
  -F "access_token=<THREADS_ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_MEDIA_ID>/insights"
```

### Example Response

```json
{
  "data": [
    {
      "name": "likes",
      "period": "lifetime",
      "values": [
        {
          "value": 100
        }
      ],
      "title": "Likes",
      "description": "The number of likes on your post.",
      "id": "<media_id>/insights/likes/lifetime"
    },
    {
      "name": "replies",
      "period": "lifetime",
      "values": [
        {
          "value": 10
        }
      ],
      "title": "Replies",
      "description": "The number of replies on your post.",
      "id": "<media_id>/insights/replies/lifetime"
    }
  ]
}
```

## User Insights

To retrieve the available user insights metrics, send a `GET` request to the `/{threads-user-id}/threads_insights` endpoint with the `metric` parameter, and optionally, the `since` and `until` parameters.

User insights are not guaranteed to work before June 1, 2024.

### Parameters

| Name     | Description                                                                 |
|----------|-----------------------------------------------------------------------------|
| `since`  | **Optional.** Used in conjunction with the `until` parameter to define a range. If you omit `since` and `until`, it defaults to a 2-day range: yesterday through today. **Note:** The earliest Unix timestamp that can be used is `1712991600`, any timestamp before that will be rejected. **Format:** Unix Timestamp |
| `until`  | **Optional.** Used in conjunction with the `since` parameter to define a range. If you omit `since` and `until`, it defaults to a 2-day range: yesterday through today. **Note:** The earliest Unix timestamp that can be used is `1712991600`, any timestamp before that will be rejected. **Format:** Unix Timestamp |
| `metric` | **Required.** A comma-separated list of the metrics to be returned. Must be at least one of the user metrics values. |

### User Metrics

| Name                   | Response Type     | Description                                                                 |
|------------------------|-------------------|-----------------------------------------------------------------------------|
| `views`                | Time Series       | The number of times your profile was viewed.                               |
| `likes`                | Total Value       | The number of likes on your posts.                                         |
| `replies`              | Total Value       | The number of replies on your posts. **Note:** This number includes only top-level replies. |
| `reposts`              | Total Value       | The number of times your posts were reposted.                              |
| `quotes`               | Total Value       | The number of times your posts were quoted.                                |
| `clicks`               | Link Total Values  | The number of times people clicked on URLs you shared.                     |
| `followers_count`      | Total Value       | Your total number of followers on Threads. **Note:** This metric does not support the `since` and `until` parameters. This metric is not available to Threads profiles that do not have a linked Instagram account. |
| `follower_demographics` | Total Value       | The demographic characteristics of followers, including countries, cities, and gender distribution. **Note:** This metric does not support the `since` and `until` parameters. A Threads profile must have at least 100 followers to fetch this metric. Can only have one `breakdown` parameter, which must be equal to one of the following values: `country`, `city`, `age`, or `gender`. |

### Example Request

```bash
curl -s -X GET \
  -F "metric=views" \
  -F "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_insights"
```

### Example Time Series Metric Response

```json
{
  "data": [
    {
      "name": "views",
      "period": "day",
      "values": [
        {
          "value": 10,
          "end_time": "2024-07-12T08:00:00+0000"
        },
        {
          "value": 20,
          "end_time": "2024-07-15T08:00:00+0000"
        },
        {
          "value": 30,
          "end_time": "2024-07-16T08:00:00+0000"
        }
      ],
      "title": "views",
      "description": "The number of times your profile was viewed.",
      "id": "37602215421583/insights/views/day"
    }
  ]
}
```

### Example Total Value Metric Response

```json
{
  "data": [
    {
      "name": "views",
      "period": "day",
      "total_value": {
        "value": 1
      },
      "title": "views",
      "description": "The number of times your profile was viewed.",
      "id": "37602215421583/insights/views/day"
    }
  ]
}
```

### Example Link Total Value Response

```json
{
  "data": [
    {
      "name": "clicks",
      "period": "day",
      "link_total_values": [
        {
          "value": 11,
          "link_url": "https://ai.meta.com/blog/"
        }
      ],
      "title": "clicks",
      "description": "The number of times users clicked on a link.",
      "id": "37602215421583/insights/clicks/day"
    }
  ]
}
```

## Error Codes

| Error                                             | Description                                                                 |
|---------------------------------------------------|-----------------------------------------------------------------------------|
| `ErrorCode::THREADS_API__FEATURE_NOT_AVAILABLE` | This user does not have access to this Threads API feature. Applicable for Threads profiles that do not have a linked Instagram account that attempt to access the `followers_count` or `follower_demographics` metrics. |



## Page: https://developers.facebook.com/docs/threads/reference

# Threads API Reference

The Threads API consists of the following endpoints. Refer to each endpoint's reference document for usage requirements.

The Threads API can be accessed by either `graph.threads.com` or `graph.threads.net`.

| Endpoint | Description |
|----------|-------------|
| [Publishing](https://developers.facebook.com/docs/threads/reference/publishing) | Upload and publish Threads media objects and check their status. |
| [Media Retrieval](https://developers.facebook.com/docs/threads/reference/media-retrieval) | Retrieve Threads media objects by ID or keyword. |
| [Reply Management](https://developers.facebook.com/docs/threads/reference/reply-management) | Retrieve replies and conversations and hide/unhide replies. |
| [User](https://developers.facebook.com/docs/threads/reference/user) | Retrieve a Threads user's posts, publishing limit, and profile. |
| [Locations](https://developers.facebook.com/docs/threads/reference/locations) | Retrieve Threads location objects by individual ID. |
| [Location Search](https://developers.facebook.com/docs/threads/reference/location-search) | Search for locations to tag in Threads posts. |
| [Insights](https://developers.facebook.com/docs/threads/reference/insights) | Retrieve insights for Threads media objects and users. |
| [oEmbed](https://developers.facebook.com/docs/threads/reference/oembed) | Embed the content of Threads posts, such as photos and videos, in other websites. |
| [Debug](https://developers.facebook.com/docs/threads/reference/debug) | Retrieve various data about an access token. |