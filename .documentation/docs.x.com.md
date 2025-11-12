# API Documentation

**Source URL:** https://docs.x.com/overview
**Scraped Date:** 2025-11-11 16:21:57

---



## Page: https://docs.x.com/overview

Build, analyze, and innovate with X’s real-time, global data and APIs. Whether you’re creating new apps, integrating with X, or analyzing trends, our platform gives you the tools to get started quickly.

---

## Python and TypeScript XDKs: Now Available

Streamline your development workflow with the official SDKs of the X API!

[Learn more](/xdks/overview)

---

## Jump right in

Get started quickly with these popular resources and guides.

<div class="mint-grid md:mint-grid-cols-3 mint-gap-6 mint-my-8">

### [Quickstart](/x-api/getting-started/make-your-first-request)

Create an API key and make your first request to the X API in minutes.

[Get started](/x-api/getting-started/make-your-first-request)

### [Tutorials](/tutorials)

Step-by-step guides for common use cases and integrations.

[Browse tutorials](/tutorials)

### [Tools & SDKs](/tools-and-libraries)

Official and community libraries to speed up your development.

[See tools](/tools-and-libraries)

</div>

---

## Products

Explore the main products of the X Developer Platform. Each product is designed to help you build, analyze, and integrate with X in different ways.

<div class="card-group not-prose grid gap-x-4 sm:grid-cols-3">

### [X API](/x-api/introduction)

Programmatic access to X’s core data: posts, users, spaces, DMs, lists, trends, media, and more.

### [X Ads API](/x-ads-api/introduction)

Automate and manage ad campaigns, targeting, creatives, and analytics on the X Ads platform.

### [X for Websites](https://developer.x.com/en/docs/twitter-for-websites.html)

Embed X content, timelines, and engagement tools directly into your website or app.

</div>

---

## Support & Community

- [Support hub](https://developer.x.com/en/support) — Troubleshooting, FAQs, and contact info
- [Developer forum](https://devcommunity.x.com) — Join the conversation
- [Newsletter](https://docs.x.com/resources/newsletter) - Get monthly updates

---

## Stay informed

- [API status](https://docs.x.com/status)
- [Changelog](https://docs.x.com/changelog)



## Page: https://docs.x.com/x-api/lists/unpin-a-list

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*In:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* `required`  

The ID of the authenticated source User for whom to return results.

**Example:**  
```json
"2244994945"
```

**list_id**  
*Type:* `string`  
*Required:* `required`  

The ID of the List to unpin.

**Example:**  
```json
"1146654567674912769"
```

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

**Response Data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**Response Errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping

The following chart illustrates which v2 endpoints map to what authentication methods.

| Endpoint | OAuth 1.0a User Context | OAuth 2.0 App Only | OAuth 2.0 Authorization Code with PKCE |
|----------|--------------------------|--------------------|----------------------------------------|
| [Tweet lookup](https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/introduction)  <br/>Retrieve multiple Tweets with a list of IDs  <br/>[GET /2/tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/introduction)  <br/>Retrieve a single Tweet with an ID  <br/>[GET /2/tweets/:id](https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/introduction) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read |
| [Manage Tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/introduction) <br/>Post a Tweet <br/>[POST /2/tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/introduction) <br/>Delete a Tweet <br/>[DELETE /2/tweets/:id](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>tweet.write <br/>users.read |
| [Timelines](https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/introduction) <br/>User Tweet timeline <br/>[GET /2/users/:id/tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/introduction) <br/>User mention timeline <br/>[GET /2/users/:id/mentions](https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/introduction) <br/>Reverse chronological home timeline <br/>[GET /2/users/:id/timelines/reverse_cronological](https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/introduction) | ✅ <br/>✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>✅ <br/>Scopes: <br/>tweet.read <br/>users.read |
| [Recent search](https://developer.twitter.com/en/docs/twitter-api/tweets/search/introduction#recent-search) <br/>Search for Tweets published in the last 7 days <br/>[GET /2/tweets/search/recent](https://developer.twitter.com/en/docs/twitter-api/tweets/search/introduction#recent-search) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read |
| [Full-archive search](https://developer.twitter.com/en/docs/twitter-api/tweets/search/introduction#full-archive-search) <br/>Only available to those with Academic Research access <br/>Search the full archive of Tweets <br/>[GET /2/tweets/search/all](https://developer.twitter.com/en/docs/twitter-api/tweets/search/introduction#full-archive-search) |  | ✅ |  |
| [Filtered stream](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction) <br/>Add or delete rules from your stream <br/>[POST /2/tweets/search/stream/rules](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction) <br/>Retrieve your stream’s rules <br/>[GET /2/tweets/search/stream/rules](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction) <br/>Connect to the stream <br/>[GET /2/tweets/search/stream](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction) |  | ✅ |  |
| [Volume streams](https://developer.twitter.com/en/docs/twitter-api/tweets/volume-streams/introduction) <br/>Streams about 1% of all Tweets in real-time. <br/>[GET /2/tweets/sample/stream](https://developer.twitter.com/en/docs/twitter-api/tweets/volume-streams/introduction) |  | ✅ |  |
| [Manage Retweets](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction#manage-retweets) <br/>Retweet a Tweet <br/>[POST /2/users/:id/retweets](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction#manage-retweets) <br/>Delete a Retweet <br/>[DELETE /2/users/:id/retweets/:source_tweet_id](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction#manage-retweets) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>tweet.write <br/>users.read |
| [Retweets lookup](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction#retweets-lookup) <br/>Users who have Retweeted a Tweet <br/>[GET /2/tweets/:id/retweeted_by](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction#retweets-lookup) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read |
| Bookmarks [lookup](https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/introduction#bookmarks-lookup) <br/>Get bookmarked Tweets <br/>[GET /2/tweets/:id/bookmarks](https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/introduction#bookmarks-lookup) |  |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>bookmark.read |
| [Manage Bookmarks](https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/introduction#manage-bookmarks) <br/>Bookmark a Tweet <br/>[POST /2/tweets/:id/bookmarks](https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/introduction#manage-bookmarks) <br/>Remove a Bookmark of a Tweet <br/>[DELETE /2/users/:id/bookmarks:tweet_id](https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/introduction#manage-bookmarks) |  |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>bookmark.write |
| [Manage Likes](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction#manage-likes) <br/>Like a Tweet <br/>[POST /2/users/:id/likes](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction#manage-likes) <br/>Undo a Like of a Tweet <br/>[DELETE /2/users/:id/likes/:tweet_id](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction#manage-likes) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>like.write |
| [Likes lookup](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction#likes-lookup) <br/>Users who have liked a Tweet <br/>[GET /2/tweets/:id/liking_users](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction#likes-lookup) <br/>Tweets liked by a user <br/>[GET /2/users/:id/liked_tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction#likes-lookup) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>like.read |
| [Hide replies](https://developer.twitter.com/en/docs/twitter-api/tweets/hide-replies/introduction) <br/>Hides or unhides a reply to a Tweet. <br/>[PUT /2/tweets/:id/hidden](https://developer.twitter.com/en/docs/twitter-api/tweets/hide-replies/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>tweet.moderate.write |
| [Users lookup](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction) <br/>Retrieve multiple users with IDs <br/>[GET /2/users](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction) <br/>Retrieve a single user with an ID <br/>[GET /2/users/:id](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction) <br/>Retrieve multiple users with usernames <br/>[GET /2/users/by](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction) <br/>Retrieve a single user with a usernames <br/>[GET /2/users/by/username/:username](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction) <br/>Get information about an authenticated user <br/>[GET /2/users/me](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read |
| [Manage follows](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction#manage-follows) <br/>Allows a user ID to follow another user <br/>[POST /2/users/:id/following](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction#manage-follows) <br/>Allows a user ID to unfollow another user <br/>[DELETE /2/users/:source_user_id/following/:target_user_id](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction#manage-follows) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>follows.write |
| [Follows lookup](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction#follows-lookup) <br/>Lookup following of a user by ID <br/>[GET /2/users/:id/following](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction#follows-lookup) <br/>Lookup followers of a user by ID <br/>[GET /2/users/:id/followers](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction#follows-lookup) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>follows.read |
| [Blocks lookup](https://developer.twitter.com/en/docs/twitter-api/users/blocks/introduction#blocks-lookup) <br/>Returns a list of users who are blocked by the specified user ID <br/>[GET /2/users/:id/blocking](https://developer.twitter.com/en/docs/twitter-api/users/blocks/introduction#blocks-lookup) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>block.read |
| [Manage Mutes](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction#manage-mutes) <br/>Allows a user ID to mute another user <br/>[POST /2/users/:id/muting](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction#manage-mutes) <br/>Allows a user ID to unmute another user <br/>[DELETE /2/users/:source_user_id/muting/:target_user_id](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction#manage-mutes) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>mute.write |
| [Mutes lookup](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction#mutes-lookup) <br/>Returns a list of users who are muted by the specified user ID <br/>[GET /2/users/:id/muting](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction#mutes-lookup) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>mute.read |
| [Spaces lookup](https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/introduction) <br/>Lookup Space by ID <br/>[GET /2/spaces/:id](https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/introduction) <br/>Lookup multiple Spaces <br/>[GET /2/spaces](https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/introduction) <br/>Discover Spaces created by user ID <br/>[GET /2/spaces/by/creator_ids](https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/introduction) |  | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>space.read |
| [Spaces lookup](https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/introduction) <br/>Get users who purchased a ticket to a Space <br/>[GET /2/spaces/:id/buyers](https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/introduction) |  |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>space.read |
| [Spaces search](https://developer.twitter.com/en/docs/twitter-api/spaces/search/introduction) <br/>Returns live or scheduled Spaces matching your specified search terms. <br/>[GET /2/spaces/search](https://developer.twitter.com/en/docs/twitter-api/spaces/search/introduction) |  | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>space.read |
| [List lookup](https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/introduction) <br/>Lookup a specific list by ID <br/>[GET /2/lists/:id](https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/introduction) <br/>Lookup a user’s owned List <br/>[GET /2/users/:id/owned_lists](https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/introduction) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.read |
| [Manage Lists](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) <br/>Creates a new List on behalf of an authenticated user <br/>[POST /2/lists](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.read <br/>list.write |
| [Manage Lists](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) <br/>Deletes a List the authenticated user owns <br/>[DELETE /2/lists/:id](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) <br/>Updates the metadata for a List the authenticated user owns <br/>[PUT /2/lists/:id](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.write |
| [List Tweets lookup](https://developer.twitter.com/en/docs/twitter-api/lists/list-tweets/introduction) <br/>Lookup Tweets from a specified List <br/>[GET /2/lists/:id/tweets](https://developer.twitter.com/en/docs/twitter-api/lists/list-tweets/introduction) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.read |
| [List members lookup](https://developer.twitter.com/en/docs/twitter-api/lists/list-members/introduction#list-members-lookup) <br/>Returns a list of members from a specified List <br/>[GET /2/lists/:id/members](https://developer.twitter.com/en/docs/twitter-api/lists/list-members/introduction#list-members-lookup) <br/>Returns all Lists a specified user is a member of <br/>[GET /2/users/:id/list_memberships](https://developer.twitter.com/en/docs/twitter-api/lists/list-members/introduction#list-members-lookup) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.read |
| [Manage List members](https://developer.twitter.com/en/docs/twitter-api/lists/list-members/introduction#manage-list-members) <br/>Add a member to a List that the authenticated user owns <br/>[POST /2/lists/:id/members](https://developer.twitter.com/en/docs/twitter-api/lists/list-members/introduction#manage-list-members) <br/>Removes a member from a List the authenticated user owns <br/>[DELETE /2/lists/:id/members/:user_id](https://developer.twitter.com/en/docs/twitter-api/lists/list-members/introduction#manage-list-members) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.write |
| [List follows lookup](https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/introduction) <br/>Returns all followers of a specified List <br/>[GET /2/lists/:id/followers](https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/introduction) <br/>Returns all Lists a specified user follows <br/>[GET /2/users/:id/followed_lists](https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/introduction) | ✅ | ✅ | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.read |
| [Manage List follows](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) <br/>Follows a List on behalf of an authenticated user <br/>[POST /2/users/:id/followed_lists](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) <br/>Unfollows a List on behalf of an authenticated user <br/>[DELETE /2/users/:id/followed_lists/:list_id](https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.write |
| [Pinned List lookup](https://developer.twitter.com/en/docs/twitter-api/lists/pinned-lists/introduction) <br/>Returns the pinned Lists of the authenticated user <br/>[GET /2/users/:id/pinned_lists](https://developer.twitter.com/en/docs/twitter-api/lists/pinned-lists/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.read |
| [Manage pinned List](https://developer.twitter.com/en/docs/twitter-api/lists/pinned-lists/introduction) <br/>Pins a List on behalf of an authenticated user <br/>[POST /2/users/:id/pinned_lists](https://developer.twitter.com/en/docs/twitter-api/lists/pinned-lists/introduction) <br/>Unpins a List on behalf of an authenticated user <br/>[DELETE /2/users/:id/pinned_lists/:list_id](https://developer.twitter.com/en/docs/twitter-api/lists/pinned-lists/introduction) | ✅ |  | ✅ <br/>Scopes: <br/>tweet.read <br/>users.read <br/>list.write |
| [Batch compliance](https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/introduction) <br/>Creates a new compliance job <br/>[POST /2/compliance/jobs](https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/introduction) <br/>Returns status and download information about a specified compliance job <br/>[GET /2/compliance/jobs/:job_id](https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/introduction) <br/>Returns a list of recent compliance jobs <br/>[GET /2/compliance/jobs](https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/introduction) |  | ✅ |  |



## Page: https://docs.x.com/x-api/trends/trends

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: `required`

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

### woeid

- **Type**: `integer`
- **Required**: `required`

The WOEID of the place to lookup a trend for.

## Query Parameters

### max_trends

- **Type**: `integer`
- **Default**: `20`

The maximum number of results.

Required range: `1 <= x <= 50`

### trend.fields

- **Type**: `enum<string>[]`

A comma separated list of Trend fields to display.

Minimum length: `1`

**Example**:
```json
[
    "trend_name",
    "tweet_count"
]
```

## Response

### 200

The request has succeeded.

#### Response Data

- **Type**: `object[]`

Minimum length: `1`

#### Errors

- **Type**: `object[]`

Minimum length: `1`
```



## Page: https://docs.x.com/x-api/posts/korean-language-firehose-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream Korean Posts](/x-api/stream/stream-korean-posts#)
- [Streaming](/xdks/python/streaming#streaming)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
```



## Page: https://docs.x.com/x-api/posts/english-language-firehose-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Streaming](/xdks/python/streaming#streaming)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
- [X API v2](/x-api/introduction#x-api-v2)
```



## Page: https://docs.x.com/forms/billing-support

Get billing support for Basic, Pro, and Enterprise API subscriptions.

<div class="flex justify-center w-full" data-as="iframe">
<iframe class="object-contain form" frameborder="0" src="https://developer.x.com/en/billing-support" style="aspect-ratio: 500 / 1000; height: 1000px; width: 500px;"></iframe>
</div>



## Page: https://docs.x.com/x-api/posts/returns-post-objects-liked-by-the-provided-user-id

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* `required`  

The ID of the User to lookup.

**Example:**  
```json
"2244994945"
```

## Query Parameters

**max_results**  
*Type:* `integer`  

The maximum number of results.  
*Required range:* `5 <= x <= 100`

**pagination_token**  
*Type:* `string`  

This parameter is used to get the next 'page' of results.  
*Minimum length:* `1`

**tweet.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Tweet fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

**expansions**  
*Type:* `enum<string>[]`  

A comma separated list of fields to expand.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

**media.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Media fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

**poll.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Poll fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

**user.fields**  
*Type:* `enum<string>[]`  

A comma separated list of User fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**place.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Place fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

## Response

**Response Code:** `200`  
**Content Type:** `application/json`  
The request has succeeded.

**data**  
*Type:* `object[]`  
*Minimum length:* `1`  

**errors**  
*Type:* `object[]`  
*Minimum length:* `1`  

**includes**  
*Type:* `object`  

**meta**  
*Type:* `object`  
```



## Page: https://docs.x.com/enterprise/customer-directory

```markdown
## Discover companies that use X data to help power innovation.

Our enterprise data customers receive commercial-level access to APIs and dedicated account and developer support. Apply for enterprise API access to get the highest level of access and reliability.

[Apply for enterprise access →](/resources/enterprise/forms/enterprise-api-interest)

## X Official Partners

Work with a trusted X Official Partner to expand what’s possible for your business. Each Official Partner has been selected for the program after an extensive evaluation, and represents excellence, value, and trust.

[Check our partners →](https://partners.x.com/en)

## Enterprise customers listing

- **A-E**
- **F-K**
- **L-O**
- **P-Z**

<div class="card-group not-prose grid gap-x-4 sm:grid-cols-3">
  <a class="link card" href="https://www.agilitypr.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Agility PR Solutions logo" src="https://mintcdn.com/x-preview/8rsahbMrO_K63Hf3/images/customer-directory/agpr.png?fit=max&amp;auto=format&amp;n=8rsahbMrO_K63Hf3&amp;q=85&amp;s=01cc016b438b9d62b95f1b39aea50579"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Agility PR Solutions</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.agorapulse.com/?utm_source=data_website&amp;utm_medium=twitter%20enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Agorapulse logo" src="https://mintcdn.com/x-preview/s_D1jGy1nLdDmXkd/images/customer-directory/agora-pulse.png?fit=max&amp;auto=format&amp;n=s_D1jGy1nLdDmXkd&amp;q=85&amp;s=019c73b08ef8727c067dba543d9ece2c"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Agorapulse</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.alethea.com/?utm_source=data_website&amp;utm_medium=twitter%20enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Alethea logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/althea.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=1d31b0ece5e79c47632a6a96503248c6"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Alethea</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.aainc.co.jp/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Allied Architects, Inc. logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/alliedarchitects.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=53fd9c1488f128673b1b7947e7b14838"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Allied Architects, Inc.</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="http://altmetric.com" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Altmetric logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/altmetric.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=4f52779c6c11bd71e883ac5c0e068d80"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Altmetric</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://audiense.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Audiense logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/audiense.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=ce1b1f208e6374be88602839c6cbf797"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Audiense</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.avaya.com" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Avaya LLC logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/avaya.jpg?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=1e555977f5bffa4bcdc139daecf31463"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Avaya LLC</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.ayrshare.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Ayrshare logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/ayrshare.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=2da412b83879310060b0a75593ec9735"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Ayrshare</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.blinkfire.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Blinkfire Analytics logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/blinkfire.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=beb99eabd845ec4c478cd5acae096951"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Blinkfire Analytics</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.bluerobot.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Blue Robot logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/bluerobot.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=cfa77624f5feada3a68ecf8d9748b418"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Blue Robot</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.boomsonar.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="BoomSonar logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/boomsonar.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=b1ff669207ff694b94962dbcf19646b6"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">BoomSonar</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://partners.x.com/en/partners/brandwatch" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Brandwatch logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/brandwatch.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=2aa9642bca3a2a8bee78e1a3b8052bc5"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Brandwatch</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://brand24.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Brand24 logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/brand24.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=083015b3a7369d2aa62180dda989678f"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Brand24</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://buffer.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Buffer logo" src="https://mintcdn.com/x-preview/s_D1jGy1nLdDmXkd/images/customer-directory/Buffer.png?fit=max&amp;auto=format&amp;n=s_D1jGy1nLdDmXkd&amp;q=85&amp;s=d4ecd7d6e3ebae3288ab666efe086cae"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Buffer</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://canvs.ai/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Canvs AI logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/canvs.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=bca8b07a95cc1209a9ef801568a041e1"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Canvs AI</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://circleboom.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Circleboom logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/circleboom.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=5724ecba1a43f474a20c3e6b98438d4e"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Circleboom</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.cision.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Cision logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/cision.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=139d96731743545077d5d6503f900ef4"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Cision</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.civicplus.com/social-media-archiving/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Civic Plus logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/civicplus.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=d0ece6d1687d5505ec1dae216b3c3b52"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Civic Plus</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.comscore.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="comScore, Inc. logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/comscore.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=0b20a3dda167e5ee8a7a783746bba2c3"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">comScore, Inc.</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.contextanalytics-ai.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Context Analytics, Inc. logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/contextanalytics.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=cd342dd2e0679284c44588a196e9ae0b"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Context Analytics, Inc.</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="http://www.coosto.com?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Coosto logo" src="https://mintcdn.com/x-preview/s_D1jGy1nLdDmXkd/images/customer-directory/Coosto.png?fit=max&amp;auto=format&amp;n=s_D1jGy1nLdDmXkd&amp;q=85&amp;s=1c23b0420861b5735ddef4b7d1cf60c8"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Coosto</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.crispthinking.com/?utm_source=data_website&amp;utm_medium=twitter%20enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Crisp logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/crisp.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=f6cb68c7359af9ec02534de8b0d82a13"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Crisp</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.dashhudson.com/" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Dash Hudson logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/dashhudson.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=4f8b6c10e2f847fc35354fec9194da91"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Dash Hudson</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://dataeq.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="DataEQ logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/dataeq.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=cefb5b6001ad109754ab31b43ac31587"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">DataEQ</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://partners.x.com/en/partners/dataminr" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Dataminr logo" src="https://mintcdn.com/x-preview/s_D1jGy1nLdDmXkd/images/customer-directory/Dataminr.png?fit=max&amp;auto=format&amp;n=s_D1jGy1nLdDmXkd&amp;q=85&amp;s=7c2a6d3b84ce7d4c3878402d6d33be70"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Dataminr</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.determ.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Determ logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/determ.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=017d781750a3b77a3deb36b591a68e29"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Determ</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.digitalshadows.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Digital Shadows logo" src="https://mintcdn.com/x-preview/s_D1jGy1nLdDmXkd/images/customer-directory/Digital-shadows.png?fit=max&amp;auto=format&amp;n=s_D1jGy1nLdDmXkd&amp;q=85&amp;s=91f710cee21c3b35b1b27017712db8dd"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Digital Shadows</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.emplifi.io/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Emplifi logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/emplifi.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=1b2e7c11001fcda648a12602cccffe1f"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Emplifi</h3>
      </div>
    </div>
  </a>
  <a class="link card" href="https://www.eyesover.com/?utm_source=twitter_data_website&amp;utm_medium=enterprise%20customer%20directory" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="integration-logo" style="background-color: white;">
        <img alt="Eyesover Technologies logo" src="https://mintcdn.com/x-preview/jRuJY4hdoMRLbnts/images/customer-directory/eyesover.png?fit=max&amp;auto=format&amp;n=jRuJY4hdoMRLbnts&amp;q=85&amp;s=f62f86446ce4779742e007e8b2689915"/>
      </div>
      <div class="mint-p-4 mint-flex-grow">
        <h3 class="mint-text-lg mint-font-semibold mint-mb-2 mint-text-gray-900 dark:mint-text-white">Eyesover Technologies</h3>
      </div>
    </div>
  </a>
</div>
```



## Page: https://docs.x.com/x-api/bookmarks/add-post-to-bookmarks

```markdown
## Authorizations

**Authorization**  
- **Type:** string  
- **Location:** header  
- **Required:** required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
- **Type:** string  
- **Required:** required  

The ID of the authenticated source User for whom to add bookmarks.

**Example:**
```json
"2244994945"
```

## Body

**Content-Type:** application/json

**tweet_id**  
- **Type:** string  
- **Required:** required  

Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

**Example:**
```json
"1346889436626259968"
```

## Response

**Status Code:** 200  
**Content-Type:** application/json  

The request has succeeded.

**data**  
- **Type:** object  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
- **Type:** object[]  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/user-lookup-by-ids

```markdown
## Authorizations

Select schema type: 
- **BearerToken**
- **OAuth2UserToken**

### Authorization

**Type:** string  
**Location:** header  
**Status:** required  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### ids

**Type:** string[]  
**Status:** required  

A list of User IDs, comma-separated. You can specify up to 100 IDs.  
Required array length: `1 - 100` elements.  
Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

### user.fields

**Type:** enum<string>[]  

A comma separated list of User fields to display.  
Minimum length: `1`.

**Example:**
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### expansions

**Type:** enum<string>[]  

A comma separated list of fields to expand.  
Minimum length: `1`.

**Example:**
```json
[
  "affiliation.user_id",
  "most_recent_tweet_id",
  "pinned_tweet_id"
]
```

### tweet.fields

**Type:** enum<string>[]  

A comma separated list of Tweet fields to display.  
Minimum length: `1`.

**Example:**
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

The request has succeeded.

### Response Data

**Type:** object[]  
Minimum length: `1`.

### Response Errors

**Type:** object[]  
Minimum length: `1`.

### Response Includes

**Type:** object  
```json
{
  // Include relevant fields here
}



## Page: https://docs.x.com/x-api/media/subtitle-create

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Body

*Content-Type:* application/json

### id

**id**  
*Type:* `string`  

The unique identifier of this Media.

**Example:**  
```json
"1146654567674912769"
```

### media_category

**media_category**  
*Type:* enum<string>  

The media category of uploaded media to which subtitles should be added/deleted.

**Available options:**  
`AmplifyVideo`, `TweetVideo`  

**Example:**  
```json
"TweetVideo"
```

### subtitles

**subtitles**  
*Type:* object  

<details>
<summary>Show child attributes</summary>
</details>

## Response

The request has succeeded.

### data

**data**  
*Type:* object  

<details>
<summary>Show child attributes</summary>
</details>

### errors

**errors**  
*Type:* object[]  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/communities/communities-lookup-by-community-id

```markdown
## Authorizations

- **Authorization** (string, header, required)
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id** (string, required)

  The ID of the Community.

  Example:
  ```json
  "1146654567674912769"
  ```

## Query Parameters

- **community.fields** (enum<string>[])

  A comma separated list of Community fields to display.

  Minimum length: `1`

  Available options: `access`, `created_at`, `description`, `id`, `join_policy`, `member_count`, `name`

  Example:
  ```json
  [
    "access",
    "created_at",
    "description",
    "id",
    "join_policy",
    "member_count",
    "name"
  ]
  ```

## Response

The request has succeeded.

- **data** (object)

  A X Community is a curated group of Posts.

- **errors** (object[])

  Minimum length: `1`
```



## Page: https://docs.x.com/x-api/users/user-lookup-me

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: **required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

**user.fields**  
*Type*: `enum<string>[]`  

A comma separated list of User fields to display.  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>

Available options: 
- `affiliation`
- `confirmed_email`
- `connection_status`
- `created_at`
- `description`
- `entities`
- `id`
- `is_identity_verified`
- `location`
- `most_recent_tweet_id`
- `name`
- `parody`
- `pinned_tweet_id`
- `profile_banner_url`
- `profile_image_url`
- `protected`
- `public_metrics`
- `receives_your_dm`
- `subscription`
- `subscription_type`
- `url`
- `username`
- `verified`
- `verified_followers_count`
- `verified_type`
- `withheld`

</details>

**Example**:
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**expansions**  
*Type*: `enum<string>[]`  

A comma separated list of fields to expand.  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>

**Example**:
```json
[
  "affiliation.user_id",
  "most_recent_tweet_id",
  "pinned_tweet_id"
]
```

</details>

**tweet.fields**  
*Type*: `enum<string>[]`  

A comma separated list of Tweet fields to display.  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>

**Example**:
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

</details>

## Response

**200**  
*Content-Type*: `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type*: `object`  

The X User object.

<details>
<summary>Show child attributes</summary>

**Example**:
```json
{
  "created_at": "2013-12-14T04:35:55Z",
  "id": "2244994945",
  "name": "X Dev",
  "protected": false,
  "username": "TwitterDev"
}
```

</details>

### Response Errors

**errors**  
*Type*: `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>

</details>

### Response Includes

**includes**  
*Type*: `object`  

<details>
<summary>Show child attributes</summary>

</details>
```



## Page: https://docs.x.com/x-api/lists/get-a-users-pinned-lists

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: **required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type*: `string`  
*Required*: **required**  

The ID of the authenticated source User for whom to return results.

**Example**:  
```json
"2244994945"
```

## Query Parameters

**list.fields**  
*Type*: `enum<string>[]`  

A comma separated list of List fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "created_at",
  "description",
  "follower_count",
  "id",
  "member_count",
  "name",
  "owner_id",
  "private"
]
```

**expansions**  
*Type*: `enum<string>[]`  

A comma separated list of fields to expand.  
Minimum length: `1`  

**Example**:  
```json
["owner_id"]
```

**user.fields**  
*Type*: `enum<string>[]`  

A comma separated list of User fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

## Response

**200**  
*Content-Type*: `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type*: `object[]`  
Minimum length: `1`  

### Response Errors

**errors**  
*Type*: `object[]`  
Minimum length: `1`  

### Response Includes

**includes**  
*Type*: `object`  

### Response Meta

**meta**  
*Type*: `object`  
```



## Page: https://docs.x.com/x-api/posts/post-delete-by-post-id

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: **required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type*: `string`  
*Required*: **required**  

The ID of the Post to be deleted.

**Example**:  
```json
"1346889436626259968"
```

## Response

The request has succeeded.

### Response Data

**data**  
*Type*: `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type*: `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/resources/newsletter

Sign up for emails about the latest news, product updates, and events from the X Developer team.

<div class="flex justify-center w-full" data-as="iframe">
<iframe class="object-contain form" frameborder="0" src="https://developer.x.com/en/embedded-xdev-news-subscription" style="aspect-ratio: 500 / 1000; height: 1000px; width: 500px;"></iframe>
</div>



## Page: https://docs.x.com/fundamentals/authentication/faq

## General

<details>
<summary>What is OAuth?</summary>
OAuth is an authentication protocol that allows users to approve an application to act on their behalf without sharing their password. More information can be found at [oauth.net](http://oauth.net/).
</details>

<details>
<summary>How do I generate access tokens?</summary>
You must have a [X app](/resources/fundamentals/developer-apps) to generate access tokens. Learn more about access tokens [here](/resources/fundamentals/authentication#oauth-1-0a-2).
</details>

<details>
<summary>How do I create a X app?</summary>
You must have a [developer account](/resources/fundamentals/developer-portal) to create a [X app](/resources/fundamentals/developer-apps). You can sign up for one [here](https://developer.x.com/en/portal/petition/essential/basic-info).
</details>

<details>
<summary>If I already have a X app, how do I view and edit that app?</summary>
You can view and edit your app from the [X app dashboard](https://developer.x.com/content/developer-twitter/en/apps) if you are logged into your X account on developer.x.com.
</details>

## Technical

<details>
<summary>How long does an access token last?</summary>
Access tokens are not explicitly expired. An access token will be invalidated if a user explicitly revokes an application in their X account settings, or if X suspends an application. If an application is suspended, there will be a note in the [X app](/resources/fundamentals/developer-apps) dashboard stating that it has been suspended.
</details>

<details>
<summary>What if an access token becomes invalid?</summary>
Assume a user’s access token *may* become invalid at any time. If this happens, prompt the user to re-authorize the application. Ensuring that this situation is handled gracefully is important for a good user experience.
</details>

<details>
<summary>The application registration page asks about read/write access. What constitutes a write?</summary>
Many users trust an application to read their information, but not necessarily change their user profile information or post new statuses. Updating information via the X API - be it name, location or adding a new status - requires an HTTP POST. Any API method that requires an HTTP POST is considered a write method and requires read & write access.
</details>



## Page: https://docs.x.com/tutorials

```markdown
## Tutorials

### Usage monitoring and management

Programmatically monitor and manage your API usage.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/usage-monitoring-and-management)

### Explore a user's Tweets

Learn how to explore a user’s Tweets and mentions using the user Tweet timeline and user mention timeline endpoints from the last 7 days.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/explore-a-users-tweets)

### Getting started with Postman

Learn how to start using Postman to make requests to the X API and X Ads API  
[**View tutorial**](/tutorials/postman-getting-started)

### Getting started with R and v2 of the X API

Learn about using R to connect to the user lookup endpoint and how to work with JSON returned from X API v2.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/getting-started-with-r-and-v2-of-the-twitter-api)

### Getting historical Tweets using the full-archive search endpoint

Learn to use the full-archive search endpoint to search the complete history of public X data, build a dataset by retrieving geo-tagged Tweets, and how to page through the available Tweets for a query.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/getting-historical-tweets-using-the-full-archive-search-endpoint)

### Post-processing X data with the Google Cloud Platform

This guide gives a high-level overview on how to ingest Tweets at scale, and “slice and dice” those Tweets via metadata to narrow them down to a specific category, or sub-categories.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud1)

### Build a simple customer engagement application

Learn how to build a basic chatbot using webhooks and REST API endpoints  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/customer-engagement-application-playbook)

### Developer Guide: X API Toolkit for Google Cloud: Filtered Stream

Learn the basics about the X API and Tweet annotations in addition to gaining experience in Google Cloud, Analytics, and data science foundations.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud1)

### Creating a X bot with Python, OAuth 2.0, and v2 of the X API

Learn more about creating a X bot with Python and OAuth 2.0 using X API v2.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/creating-a-twitter-bot-with-python--oauth-2-0--and-v2-of-the-twi)

### How to build an autoresponder with Autohook and the Account Activity API

Use the Account Activity API to configure a webhook, set up OAuth, and send a message for replying in real time.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/how-to-build-a-complete-twitter-autoresponder-autohook)

### Get customized Tweet notifications where you want them

Learn how to build an app in Java that publishes links to Tweets based on user defined interests.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/get-customized-tweet-notifications-where-you-want-them)

### Translating plain language to filtering queries

Learn about taking rules articulated in English and transform them into filtering rules using the appropriate X premium operators and syntax.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/translating-plain-language-to-pt-rules)

### Step-by-step guide to making your first request to the X API v2

This is a detailed walkthrough of all the basic steps for getting started with X API v2 from sign up to endpoint request.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/step-by-step-guide-to-making-your-first-request-to-the-twitter-api-v2)

### Getting started with the Account Activity API

Learn about X’s webhook-based Account Activity API to get started with securing webhooks, authentication, and receiving events.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/getting-started-with-the-account-activity-api)

### Kickstart your X bot with our Glitch example written in Python

Use Python to get started with the X API and engage with the public conversation by creating a X Bot.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/kickstart-your-twitter-bot-with-our-glitch-example-written-in-py)

### Developer Guide: X API Toolkit for Google Cloud: Enterprise API

Use the X API Toolkit for Google Cloud: Enterprise API to install a trend detection framework in under an hour.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud11)

### Developer Guide: X API toolkit for Google Cloud: Recent Search

Learn the basics about X API as well as Google Cloud, Analytics, and the foundations of data science.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud)

### How to build a live scoreboard using X

How to build a chatbot that privately receives scores and Tweets out leaderboard updates.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/building-a-live-leaderboard-on-twitter)

### Measure Tweet performance

Build a simple tool to understand how users’ Tweets are performing in the world.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/measure-tweet-performance)

### One-time Historical PowerTrack jobs

Learn more about the steps that you will go through when accessing our one-time Historical PowerTrack offering.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/one-time-historical-powertrack-jobs)

### Choosing a historical API

Learn how to create moments of delight informed by customer context.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/choosing-historical-api)

### Retrieve a list of user mentions from a thread of Tweet replies

Learn how to quickly and easily retrieve all usernames mentioned in a thread of replies on X  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/retrieve-user-mentions-from-thread)

### Determining Tweet Types

Learn about the four different types of Tweets and how to programmatically detect them.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/determining-tweet-types)

### How to analyze the sentiment of your own Tweets

Learn how to analyze the sentiment of your Tweet timeline.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/how-to-analyze-the-sentiment-of-your-own-tweets)

### Filtering Tweets by location

Learn how to filter Tweets by location.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/filtering-tweets-by-location)

### Building an app to stream Tweets in real-time

Build a real-time Tweet streaming app to listen for and display Tweets based on your own topics of interest.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/building-an-app-to-stream-tweets)

### Authenticating with the X API for Enterprise

Learn about the different authentication methods necessary to access the X enterprise APIs.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/authenticating-with-twitter-api-for-enterprise)

### Analyze past conversations using search Tweets

Search for topics or keywords and analyze the related conversation using the v2 recent search endpoint  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/analyze-past-conversations)

### Uploading video and creating a draft Tweet

Learn how to use twurl to upload a video and use this to create a video app card and Draft Tweet  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/uploading-video-and-creating-draft-tweet)

### Listen for important events

Listen for events that matter to you so that you can trigger appropriate actions or notifications.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/listen-for-important-events)

### How to store streaming Tweets in a Google Sheet

Learn to consume X API filtered stream endpoint data and store it into a Google Sheets  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/how-to-store-streaming-tweets-in-a-google-sheet)

### Learning path: How to detect signal from noise and build powerful filtering rules

Learn how to build robust rulesets to effectively filter large volumes of X data and identify meaningful insights with PowerTrack  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/building-powerful-enterprise-filters)

### Consuming streaming data

Tips for consuming streaming data.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/consuming-streaming-data)

### Using Twurl

Learn how to use twurl to make requests to the X Ads API  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/using-twurl)

### Using Search Tweets and Twilio to solve a problem

Learn how I used the Search X API along with Twilio to build a text message alert whenever the @NYCASP account Tweets about alternate side of the street parking information.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/nyc-parking)

### Getting started with converting JSON objects to CSV

Search for topics, and then output the returned data into CSV format.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/five-ways-to-convert-a-json-object-to-csv)

### Advanced filtering for geo data

Learn more about the available geo data, operators, and how to build effective filters to target both Tweet level and account level geo in Tweets  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/advanced-filtering-for-geo-data)

### Uploading Media

Learn how to use twurl to upload media to an account  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/uploading-media)

### Stream Tweets in real-time

Surface and stream Tweets and conversations as they happen.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/stream-tweets-in-real-time)
```



## Page: https://docs.x.com/x-api/posts/full-archive-search-counts

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### query

*Type:* `string`  
*Required:* `required`  

One query/rule/filter for matching Posts. Refer to [https://t.co/rulelength](https://t.co/rulelength) to identify the max query length.  
Required string length: `1 - 4096`

**Example:**  
```json
"(from:TwitterDev OR from:TwitterAPI) has:media -is:retweet"
```

### start_time

*Type:* `string<date-time>`  

YYYY-MM-DDTHH:mm:ssZ. The oldest UTC timestamp (from most recent 7 days) from which the Posts will be provided. Timestamp is in second granularity and is inclusive (i.e. 12:00:01 includes the first second of the minute).

### end_time

*Type:* `string<date-time>`  

YYYY-MM-DDTHH:mm:ssZ. The newest, most recent UTC timestamp to which the Posts will be provided. Timestamp is in second granularity and is exclusive (i.e. 12:00:01 excludes the first second of the minute).

### since_id

*Type:* `string`  

Returns results with a Post ID greater than (that is, more recent than) the specified ID.  

**Example:**  
```json
"1346889436626259968"
```

### until_id

*Type:* `string`  

Returns results with a Post ID less than (that is, older than) the specified ID.  

**Example:**  
```json
"1346889436626259968"
```

### next_token

*Type:* `string`  

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
Minimum length: `1`

### pagination_token

*Type:* `string`  

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
Minimum length: `1`

### granularity

*Type:* `enum<string>`  
*Default:* `hour`  

The granularity for the search counts results.  
Available options: `minute`, `hour`, `day`

### search_count.fields

*Type:* `enum<string>[]`  

A comma separated list of SearchCount fields to display.  
Minimum length: `1`

**Example:**  
```json
["end", "start", "tweet_count"]
```

## Response

The request has succeeded.

### data

*Type:* `object[]`  
Minimum length: `1`

### errors

*Type:* `object[]`  
Minimum length: `1`

### meta

*Type:* `object`  
```



## Page: https://docs.x.com/x-api/webhooks/create-webhook-config

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Body

*Content-Type:* `application/json`

**url**  
*Type:* `string`  
*Required:* `required`  

Required string length: `1 - 200`

## Response

### 200

*Content-Type:* `application/json`  

The request has succeeded.

A Webhook Configuration

**created_at**  
*Type:* `string<date-time>`  
*Required:* `required`  

**id**  
*Type:* `string`  
*Required:* `required`  

The unique identifier of this webhook config.  
**Example:**  
```json
"1146654567674912769"
```

**url**  
*Type:* `string`  
*Required:* `required`  

The callback URL of the webhook.

**valid**  
*Type:* `boolean`  
*Required:* `required`  
```



## Page: https://docs.x.com/fundamentals/rate-limits

Everyday many thousands of developers make requests to the X developer platform. To help manage the sheer volume of these requests, limits are placed on the number of requests that can be made. These limits help us provide the reliable and scalable API that our developer community relies on.

Each of our APIs use rate limits in different ways. To learn more about these differences between platforms, please review the specific rate limit pages within our specific API sections:

- [X API v2](/x-api/fundamentals/rate-limits)
- [X API: Enterprise](/x-api/enterprise-gnip-2.0/fundamentals/rate-limits)
- [X Ads API](/x-ads-api/fundamentals/rate-limiting)



## Page: https://docs.x.com/x-api/bookmarks/bookmark-folder-posts-by-user-and-folder-id

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Status*: **required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

### id

**id**  
*Type*: `string`  
*Status*: **required**  

The ID of the authenticated source User for whom to return results.

**Example**:  
```json
"2244994945"
```

### folder_id

**folder_id**  
*Type*: `string`  
*Status*: **required**  

The ID of the Bookmark Folder that the authenticated User is trying to fetch Posts for.

**Example**:  
```json
"1146654567674912769"
```

## Response

**200**  
*Content-Type*: `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type*: `object[]`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type*: `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>

### Response Meta

**meta**  
*Type*: `object`  

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/media/media-lookup-by-media-key-1

```markdown
## Authorizations

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

### media_key

A single Media Key.

## Query Parameters

### media.fields

A comma separated list of Media fields to display.

Minimum length: `1`

Available options: `alt_text`, `duration_ms`, `height`, `media_key`, `non_public_metrics`, `organic_metrics`, `preview_image_url`, `promoted_metrics`, `public_metrics`, `type`, `url`, `variants`, `width`

#### Example:

```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

## Response

The request has succeeded.

### Response Data

#### data

- Type: `object`

### Response Errors

Minimum length: `1`
```



## Page: https://docs.x.com/x-api/media/media-upload-initialize

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* Yes  

The access token received from the authorization server in the OAuth 2.0 flow.

## Body

*Content-Type:* `application/json`

### additional_owners

**additional_owners**  
*Type:* `string[]`  

Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

### media_category

**media_category**  
*Type:* `enum<string>`  

A string enum value which identifies a media use-case. This identifier is used to enforce use-case specific constraints (e.g. file size, video duration) and enable advanced features.

Available options: `amplify_video`, `tweet_gif`, `tweet_image`, `tweet_video`, `dm_gif`, `dm_image`, `dm_video`, `subtitles`  

**Example:**  
```json
"tweet_video"
```

### media_type

**media_type**  
*Type:* `enum<string>`  

The type of media.

Available options: `video/mp4`, `video/webm`, `video/mp2t`, `video/quicktime`, `text/srt`, `text/vtt`, `image/jpeg`, `image/gif`, `image/bmp`, `image/png`, `image/webp`, `image/pjpeg`, `image/tiff`, `model/gltf-binary`, `model/vnd.usdz+zip`  

**Example:**  
```json
"video/mp4"
```

### shared

**shared**  
*Type:* `boolean`  

Whether this media is shared or not.

### total_bytes

**total_bytes**  
*Type:* `integer`  

The total size of the media upload in bytes.  
Required range: `0 <= x <= 17179869184`

## Response

*Status Code:* `200`  
*Content-Type:* `application/json`  

The request has succeeded.

A response from getting a media upload request status.

### data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/lists/list-lookup-by-list-id

```markdown
## Authorizations

- **Authorization**: 
  - Type: `string`
  - Location: `header`
  - Required: `required`
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**: 
  - Type: `string`
  - Required: `required`
  
  The ID of the List.
  
  **Example**: 
  ```json
  "1146654567674912769"
  ```

## Query Parameters

- **list.fields**: 
  - Type: `enum<string>[]`
  
  A comma separated list of List fields to display.
  
  Minimum length: `1`
  
  **Available options**: 
  - `created_at`
  - `description`
  - `follower_count`
  - `id`
  - `member_count`
  - `name`
  - `owner_id`
  - `private`
  
  **Example**: 
  ```json
  [
    "created_at",
    "description",
    "follower_count",
    "id",
    "member_count",
    "name",
    "owner_id",
    "private"
  ]
  ```

- **expansions**: 
  - Type: `enum<string>[]`
  
  A comma separated list of fields to expand.
  
  Minimum length: `1`
  
  **Example**: 
  ```json
  ["owner_id"]
  ```

- **user.fields**: 
  - Type: `enum<string>[]`
  
  A comma separated list of User fields to display.
  
  Minimum length: `1`
  
  **Example**: 
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

## Response

- **200**: The request has succeeded.
  
### Response Data

- **data**: 
  - Type: `object`
  
  A X List is a curated group of accounts.

### Response Errors

- **errors**: 
  - Type: `object[]`
  
  Minimum length: `1`

### Response Includes

- **includes**: 
  - Type: `object`
```



## Page: https://docs.x.com/x-api/users/returns-user-objects-that-have-liked-the-provided-post-id

```markdown
## Authorizations

**Authorization**  
*Type*: string  
*Location*: header  
*Required*: required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type*: string  
*Required*: required  

A single Post ID.  
**Example**:  
```json
"1346889436626259968"
```

## Query Parameters

**max_results**  
*Type*: integer  
*Default*: 100  

The maximum number of results.  
Required range: `1 <= x <= 100`

**pagination_token**  
*Type*: string  

This parameter is used to get the next 'page' of results.  
Minimum length: `1`

**user.fields**  
*Type*: enum<string>[]  

A comma separated list of User fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**expansions**  
*Type*: enum<string>[]  

A comma separated list of fields to expand.  
Minimum length: `1`  

**Example**:  
```json
[
  "affiliation.user_id",
  "most_recent_tweet_id",
  "pinned_tweet_id"
]
```

**tweet.fields**  
*Type*: enum<string>[]  

A comma separated list of Tweet fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

**200**  
*Content-Type*: application/json  

The request has succeeded.

### Response Data

*Type*: object[]  
Minimum length: `1`  

### Response Errors

*Type*: object[]  
Minimum length: `1`  

### Response Includes

*Type*: object  

### Response Meta

*Type*: object  
```



## Page: https://docs.x.com/x-api/account-activity/deactivates-a-subscription-for-the-specified-webhook-and-user-id

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

### webhook_id

**webhook_id**  
*Type:* `string`  
*Required:* `required`  

The webhook ID to check subscription against.

**Example:**  
`"1146654567674912769"`

### user_id

**user_id**  
*Type:* `string`  
*Required:* `required`  

User ID to unsubscribe from.

**Example:**  
`"2244994945"`

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/guides/tls

TLS connections are required in order to access X API endpoints. Communicating over TLS preserves user privacy and security by protecting information between the user and the X API as it travels across the public Internet. Connections to the X API require TLS version 1.2.

## Verification

### Use an up-to-date root store

It’s important that your application or library use a trustworthy and up-to-date root store when verifying the X certificate. Where possible, using the root store provided by your operating system may be the simplest approach here. Alternatively, the [Mozilla (NSS) root store](https://www.mozilla.org/en-US/about/governance/policies/security-group/certs/) is well maintained in a public and transparent manner. Curl also provides [a version of this store in PEM format](https://curl.haxx.se/docs/caextract.html).

X currently issues the bulk of our certs from the [DigiCert High Assurance EV Root CA](https://www.digicert.com/digicert-root-certificates.htm), but this is not true for 100% of X-related certificates and may not hold true forever, so trusting only the currently-used Digicert roots may lead to issues with your app in the future.

### Check CRLs and the OCSP status

Many applications do not check the Certificate Revocation List for returned certificates or rely on the operating system to do so. Ensure that your application or TLS library is configured to force CRL and OCSP (Online Certificate Status Protocol) verification before accepting X’s certificate.

### CDNs

When showing Tweets that contain media, use the `media_url_https` attribute for the HTTPS URLs to use when showing images. In the future, all URLs served from API endpoints will provide HTTPS paths.

## Provide an indication of security status

If possible, you should show an indication of the current status between your application and X. Some web browsers indicate this by offering a Lock Icon, while others indicate the current connection state with descriptive messaging.



## Page: https://docs.x.com/x-api/compliance/likes-compliance-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream Likes compliance data](/x-api/stream/stream-likes-compliance-data#)
- [Compliance Firehose API](/x-api/enterprise-gnip-2.0/fundamentals/firehouse#compliance-firehose-api)
- [About the X API](/x-api/getting-started/about-x-api#about-the-x-api)
```



## Page: https://docs.x.com/fundamentals/security

We believe privacy is a right, not a privilege, and it is built into the foundations of our company. By using the X developer platform and abiding by our developer policy, you play a critical role in making sure the platform serves the public conversation on X and safeguards our commitment to privacy.

We want to remind you of the importance of building securely in order to protect both your own and your apps’ users’ data. It is your responsibility to protect against the threat of security breaches, and we have a shared responsibility to protect the people who use X. This page describes expectations around building secure applications and keeping data and access as safe as possible.

> **Note:** Please be aware of the security technologies available for the X Developer Platform including [authentication](/resources/fundamentals/authentication), TLS, and [app permissions](/resources/fundamentals/developer-apps#app-permissions), as well as from the X user perspective for [using third party applications and sessions](https://help.x.com/en/managing-your-account/connect-or-revoke-access-to-third-party-apps).

## Reporting security issues

X Developer Platform users must notify X no more than 48 hours after initial suspicion a security incident has occurred, through the [X’s vulnerability reporting program](https://hackerone.com/twitter).

## Security best practices

Please keep them in mind as you build on the X developer platform, and elsewhere across the internet.

### Security by design

Consider hiring security professionals to do a threat model audit and/or penetration test. A good security firm will dig deep to uncover issues. Read more about how X has adopted this mindset [here in our blog post](https://blog.x.com/en_us/topics/company/2019/privacy_data_protection.html).

Additionally, X holds all partners accountable for the following:

- Maintain code within a secure repository.
- Perform risk analysis throughout the Systems development life cycle (SDLC) process.
- Ensure security issues are identified and mitigated throughout SDLC.
- Ensure there exists segregation of environments throughout the SDLC process.
- Ensure all test defects are fixed, re-tested and closed out.

### Monitor and get alerted

If you think there’s an issue with your web app, how do you find out for sure? Be sure to keep good logs, and that you are notified of critical exceptions and errors. You may want to put together a dashboard of critical statistics so that you can see at a glance if something is going wrong.

### Create a reporting channel

Make it easy for your users to contact you about potential security issues that they’ve experienced with your app. If an issue is discovered which affects X users and data, it’s your responsibility to [report this issue to X](#report) as well. Have an action plan/process ready for notifying affected users, should a security incident occur.

### Adequate testing

Ensure that your end-to-end tests are thorough and updated to include expected failures for security scenarios such as unauthorized access. Put yourself in an attacker’s mindset and set up system tests that are expected to block an attacker gaining unauthorized access to X data or authorized functionality.

### Securing API keys and tokens

As a developer on the X platform, you have programmatic access to both your data and your users data stored by X, assuming they’ve authorized your developer App. All API requests must be [authenticated](/resources/fundamentals/authentication) using OAuth with your developer App’s key and secret and in some cases an authorizing user’s [access tokens](/resources/fundamentals/authentication). It is your responsibility to keep your credentials safe.

Some suggested best practices include the following:

- Create a password/token refresh rotation.
- Always encrypt sensitive data as needed and to not decrypt data too far upstream.
- Store your users’ access tokens in an encrypted store.
- [Regenerate](https://developer.x.com/en/docs/authentication/regenerate-api-keys-and-tokens) or [invalidate](https://developer.x.com/en/docs/authentication/post-oauth2-invalidate-token) keys and tokens if you believe they have been compromised.

For more discussion on debugging and building with OAuth for X please visit the community forum’s [security category](https://devcommunity.x.com/c/oauth/12).

### Input validation

Don’t assume that your users will provide you with valid, trustworthy data. Sanitize all data coming from your users that can end up in X API requests. Allowlist the types of input that are acceptable to your application and discard everything that isn’t on the allowlist.

### Encrypted communication

X requires all API requests to be made over TLS. Communication made to your own servers should also be encrypted wherever possible.

### Exposed debugging information

Be sure that you’re not exposing sensitive X data or credentials through debugging screens/logs. Some web frameworks make it easy to access debugging information if your application is not properly configured. For desktop and mobile developers, it’s easy to accidentally ship a build with debugging flags or symbols enabled. Build checks for these configurations into your deployment/build process. Additionally, if sharing stack traces or crash dumps for reporting, ensure that private X users’ data are redacted.

### Unfiltered input, unescaped output

One easy-to-remember approach to input validation is FIEO: Filter Input, Escape Output.

Filter anything from outside your application, including X API data, cookie data, user-supplied form input, URL parameters, data from databases, etc. Escape all output being sent by your application, including SQL sent to your database server, HTML to you send to users’ browsers, JSON output sent to other systems, and commands sent to shell programs.

### Cross-site scripting (XSS)

[XSS](https://owasp.org/) attacks are, by most measures, the most common form of security problem on the web. If an attacker can get their own JavaScript code into your application, they can do bad things. Anywhere you store and display untrusted, user-supplied data needs to be checked, sanitized, and HTML escaped. Getting this right is hard, because hackers have [many different ways to land XSS attacks](https://www.owasp.org/index.php/Types_of_Cross-Site_Scripting). Your language or web development framework probably has a popular, well-tested mechanism for defending against cross-site scripting; please make use of it.

### SQL injection

If your application makes use of a database, you need to be aware of [SQL injection](http://en.wikipedia.org/wiki/SQL_injection). Anywhere you accept input is a potential target for an attacker to break out of their input field and into your database. Use database libraries that protect against SQL injection in a systematic way. If you break out of that approach and write custom SQL, write aggressive tests to be sure you aren’t exposing yourself to this form of attack. The two main approaches to defending against SQL injection are escaping before constructing your SQL statement, and using parameterized input to create statements. The latter is recommended, as it’s less prone to programmer error.

### Cross-site request forgery (CSRF)

Are you sure that requests to your application are coming from your application? [CSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery) attacks exploit this lack of knowledge by forcing logged-in users of your site to silently open URLs that perform actions. In the case of a developer App, this could mean that attackers are using your app to force users to post unwanted Tweets or follow spam accounts.

The most thorough way to deal with CSRF is to include a random token in every form that’s stored someplace trusted; if a form doesn’t have the right token, throw an error. Modern web frameworks have systematic ways of handling this, and might even be doing it by default if you’re lucky. A simple preventative step (but by no means the only step you should take) is to make any actions that create, modify, or destroy data require a POST request.

### Lack of rate limiting

Use CAPTCHAs where appropriate to slow down potential spammers and attackers.

---

> **Info:** If you’ve discovered a security issue that directly affects X itself, we have a [bug bounty program for vulnerabilities](https://hackerone.com/twitter).



## Page: https://docs.x.com/x-api/account-activity/subscribes-the-provided-application-to-all-events-for-the-provided-user-context-for-all-message-types

```markdown
## Authorizations

**Authorization**  
The access token received from the authorization server in the OAuth 2.0 flow.  
- Type: `string`  
- Location: `header`  
- Required: **required**  

## Path Parameters

**webhook_id**  
The webhook ID to check subscription against.  
- Type: `string`  
- Required: **required**  

**Example:**  
```json
"1146654567674912769"
```

## Body

`application/json · object`

## Response

The request has succeeded.

### Response Data

**data**  
- Type: `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
- Type: `object[]`  
- Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

### OAuth 2.0 Authorization Code Flow with PKCE

#### Introduction

OAuth 2.0 is an industry-standard authorization protocol that allows for greater control over an application’s scope, and authorization flows across multiple devices. OAuth 2.0 allows you to pick specific fine-grained scopes which give you specific permissions on behalf of a user. 

To enable OAuth 2.0 in your App, you must enable it in your’s App’s authentication settings found in the App settings section of the developer portal.

#### How long will my credentials stay valid? 

By default, the access token you create through the Authorization Code Flow with PKCE will only stay valid for two hours unless you’ve used the `offline.access` scope.

#### Refresh tokens

Refresh tokens allow an application to obtain a new access token without prompting the user via the refresh token flow.

If the scope `offline.access` is applied an OAuth 2.0 refresh token will be issued. With this refresh token, you obtain an access token. If this scope is not passed, we will not generate a refresh token.

An example of the request you would make to use a refresh token to obtain a new access token is as follows:

```shell
POST 'https://api.x.com/2/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'refresh_token=bWRWa3gzdnk3WHRGU1o0bmRRcTJ5VUxWX1lZTDdJSUtmaWcxbTVxdEFXcW5tOjE2MjIxNDc3NDM5MTQ6MToxOnJ0OjE' \
--data-urlencode 'grant_type=refresh_token' \
--data-urlencode 'client_id=rG9n6402A3dbUJKzXTNX4oWHJ
```

#### App settings

You can select your App’s authentication settings to be OAuth 1.0a or OAuth 2.0. You can also enable an App to access both OAuth 1.0a and OAuth 2.0.

OAuth 2.0 can be used with the X API v2 only. If you have selected OAuth 2.0 you will be able to see a Client ID in your App’s Keys and Tokens section. 

#### Confidential Clients

[Confidential clients](https://datatracker.ietf.org/doc/html/rfc6749#section-2.1) can hold credentials in a secure way without exposing them to unauthorized parties and securely authenticate with the authorization server they keep your client secret safe. Public clients as they’re usually running in a browser or on a mobile device and are unable to use your client secrets. If you select a type of App that is a confidential client, you will be provided with a client secret. 

If you selected a type of client that is a confidential client in the developer portal, you will also be able to see a Client Secret. Your options are Native App, Single page App, Web App, Automated App, or bot. Native App and Single page Apps are public clients and Web App and Automated App or bots are confidential clients.

You don’t need client id for confidential clients with a valid Authorization Header. You still are required to include Client Id in the body for the requests with a public client. 

#### Scopes

Scopes allow you to set granular access for your App so that your App only has the permissions that it needs. To learn more about what scopes map to what endpoints, view our [authentication mapping guide](/resources/fundamentals/authentication/guides/v2-authentication-mapping).

| Scope                      | Description                                                                                   |
|----------------------------|-----------------------------------------------------------------------------------------------|
| **tweet.read**             | All the Tweets you can view, including Tweets from protected accounts.                       |
| **tweet.write**            | Tweet and Retweet for you.                                                                   |
| **tweet.moderate.write**   | Hide and unhide replies to your Tweets.                                                      |
| **users.email**            | Email from an authenticated user.                                                            |
| **users.read**             | Any account you can view, including protected accounts.                                       |
| **follows.read**           | People who follow you and people who you follow.                                             |
| **follows.write**          | Follow and unfollow people for you.                                                          |
| **offline.access**         | Stay connected to your account until you revoke access.                                      |
| **space.read**             | All the Spaces you can view.                                                                 |
| **mute.read**              | Accounts you’ve muted.                                                                        |
| **mute.write**             | Mute and unmute accounts for you.                                                            |
| **like.read**              | Tweets you’ve liked and likes you can view.                                                 |
| **like.write**             | Like and un-like Tweets for you.                                                              |
| **list.read**              | Lists, list members, and list followers of lists you’ve created or are a member of, including private lists. |
| **list.write**             | Create and manage Lists for you.                                                             |
| **block.read**             | Accounts you’ve blocked.                                                                      |
| **block.write**            | Block and unblock accounts for you.                                                           |
| **bookmark.read**          | Get Bookmarked Tweets from an authenticated user.                                            |
| **bookmark.write**         | Bookmark and remove Bookmarks from Tweets.                                                   |
| **media.write**            | Upload media.                                                                                 |

#### Rate limits

For the most part, the rate limits are the same as they are authenticating with OAuth 1.0a, with the exception of Tweets lookup and Users lookup. We are increasing the per-App limit from 300 to 900 requests per 15 minutes while using OAuth 2.0 for Tweet lookup and user lookup. To learn more be sure to check out our [documentation on rate limits](/resources/fundamentals/rate-limits).

#### Grant types

We only provide [authorization code](https://oauth.net/2/grant-types/authorization-code/) with [PKCE](https://oauth.net/2/pkce/) and [refresh token](https://oauth.net/2/grant-types/refresh-token/) as the supported [grant types](https://oauth.net/2/grant-types/) for this initial launch. We may provide more grant types in the future.

#### OAuth 2.0 Flow

OAuth 2.0 uses a similar flow to what we are currently using for OAuth 1.0a. You can check out a diagram and detailed explanation in our [documentation on this subject](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens). 

#### Glossary

| Term                     | Description                                                                                   |
|--------------------------|-----------------------------------------------------------------------------------------------|
| **Grant types**          | The OAuth framework specifies several grant types for different use cases and a framework for creating new grant types. Examples include authorization code, client credentials, device code, and refresh token. |
| **Confidential client**  | Clients are applications that can securely authenticate with the authorization server, for example, keeping their registered client secret safe. |
| **Public client**        | Clients cannot use registered client secrets, such as applications running in a browser or mobile device. |
| **Authorization code flow** | Used by both confidential and public clients to exchange an authorization code for an access token. |
| **PKCE**                 | An extension to the authorization code flow to prevent several attacks and to be able to perform the OAuth exchange from public clients securely. |
| **Client ID**            | Can be found in the keys and tokens section of the developer portal under the header “Client ID.” If you don’t see this, please get in touch with our team directly. The Client ID will be needed to generate the authorize URL. |
| **Redirect URI**         | Your callback URL. You will need to have [exact match validation](https://datatracker.ietf.org/doc/html/rfc6749#section-10.6). |
| **Authorization code**   | This allows an application to hit APIs on behalf of users. Known as the auth_code. The auth_code has a time limit of 30 seconds once the App owner receives an approved auth_code from the user. You will have to exchange it with an access token within 30 seconds, or the auth_code will expire. |
| **Access token**         | Access tokens are the token that applications use to make API requests on behalf of a user. |
| **Refresh token**        | Allows an application to obtain a new access token without prompting the user via the refresh token flow. |
| **Client Secret**        | If you have selected an App type that is a confidential client you will be provided with a “Client Secret” under “Client ID” in your App’s keys and tokens section. |

#### Parameters

To construct an OAuth 2.0 authorize URL, you will need to ensure you have the following parameters in the authorization URL. 

| Parameter                | Description                                                                                   |
|--------------------------|-----------------------------------------------------------------------------------------------|
| **response_type**        | You will need to specify that this is a code with the word “code”.                          |
| **client_id**            | Can be found in the developer portal under the header “Client ID”.                          |
| **redirect_uri**         | Your callback URL. This value must correspond to one of the Callback URLs defined in your App’s settings. For OAuth 2.0, you will need to have [exact match validation](https://datatracker.ietf.org/doc/html/rfc6749#section-10.6) for your callback URL. |
| **state**                | A random string you provide to verify against [CSRF attacks](https://auth0.com/docs/protocols/state-parameters). The length of this string can be up to 500 characters. |
| **code_challenge**       | A [PKCE](https://www.oauth.com/oauth2-servers/pkce/authorization-request/) parameter, a random secret for each request you make. |
| **code_challenge_method** | Specifies the method you are using to make a request (S256 OR plain).                       |

#### Authorize URL 

With OAuth 2.0, you create an authorize URL, which you can use to allow a user to authenticate via an authentication flow, similar to “Sign In” with X. 

An example of the URL you are creating is as follows: 

```text
https://x.com/i/oauth2/authorize?response_type=code&client_id=M1M5R3BMVy13QmpScXkzTUt5OE46MTpjaQ&redirect_uri=https://www.example.com&scope=tweet.read%20users.read%20account.follows.read%20account.follows.write&state=state&code_challenge=challenge&code_challenge_method=plain
```

You will need to have the proper encoding for this URL to work, be sure to check out our documentation on the [percent encoding](https://www.example.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters).



## Page: https://docs.x.com/x-api/media/metadata-create

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Body

*Content-Type:* `application/json`

### id

**id**  
*Type:* `string`  
*Required:* `required`  

The unique identifier of this Media.

**Example:**  
```json
"1146654567674912769"
```

### metadata

**metadata**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>

#### allow_download_status

**metadata.allow_download_status**  
*Type:* `object`  

#### alt_text

**metadata.alt_text**  
*Type:* `object`  

#### audience_policy

**metadata.audience_policy**  
*Type:* `object`  

#### content_expiration

**metadata.content_expiration**  
*Type:* `object`  

#### domain_restrictions

**metadata.domain_restrictions**  
*Type:* `object`  

#### found_media_origin

**metadata.found_media_origin**  
*Type:* `object`  

#### geo_restrictions

**metadata.geo_restrictions**  
*Type:* `object`  

#### management_info

**metadata.management_info**  
*Type:* `object`  

#### preview_image

**metadata.preview_image**  
*Type:* `object`  

#### sensitive_media_warning

**metadata.sensitive_media_warning**  
*Type:* `object`  

#### shared_info

**metadata.shared_info**  
*Type:* `object`  

#### sticker_info

**metadata.sticker_info**  
*Type:* `object`  

#### upload_source

**metadata.upload_source**  
*Type:* `object`  

</details>

## Response

*Status Code:* `200`  
*Content-Type:* `application/json`  

The request has succeeded.

### data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>

### errors

**errors**  
*Type:* `object[]`  
*Minimum length:* `1`  

</details>
```



## Page: https://docs.x.com/x-api/posts/retrieve-posts-that-repost-a-post

```markdown
## Authorizations

- **Authorization**
  - **Type**: `string`
  - **Location**: `header`
  - **Required**: `required`
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: `string`
  - **Required**: `required`
  
  A single Post ID.

  **Example**: 
  ```json
  "1346889436626259968"
  ```

## Query Parameters

- **max_results**
  - **Type**: `integer`
  - **Default**: `100`
  
  The maximum number of results. Required range: `1 <= x <= 100`.

- **pagination_token**
  - **Type**: `string`
  
  This parameter is used to get the next 'page' of results. Minimum length: `1`.

- **tweet.fields**
  - **Type**: `enum<string>[]`
  
  A comma separated list of Tweet fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "article",
    "attachments",
    "author_id",
    "card_uri",
    "community_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "display_text_range",
    "edit_controls",
    "edit_history_tweet_ids",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "media_metadata",
    "non_public_metrics",
    "note_tweet",
    "organic_metrics",
    "possibly_sensitive",
    "promoted_metrics",
    "public_metrics",
    "referenced_tweets",
    "reply_settings",
    "scopes",
    "source",
    "suggested_source_links",
    "text",
    "withheld"
  ]
  ```

- **expansions**
  - **Type**: `enum<string>[]`
  
  A comma separated list of fields to expand. Minimum length: `1`.

  **Example**:
  ```json
  [
    "article.cover_media",
    "article.media_entities",
    "attachments.media_keys",
    "attachments.media_source_tweet",
    "attachments.poll_ids",
    "author_id",
    "edit_history_tweet_ids",
    "entities.mentions.username",
    "geo.place_id",
    "in_reply_to_user_id",
    "entities.note.mentions.username",
    "referenced_tweets.id",
    "referenced_tweets.id.attachments.media_keys",
    "referenced_tweets.id.author_id"
  ]
  ```

- **media.fields**
  - **Type**: `enum<string>[]`
  
  A comma separated list of Media fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "alt_text",
    "duration_ms",
    "height",
    "media_key",
    "non_public_metrics",
    "organic_metrics",
    "preview_image_url",
    "promoted_metrics",
    "public_metrics",
    "type",
    "url",
    "variants",
    "width"
  ]
  ```

- **poll.fields**
  - **Type**: `enum<string>[]`
  
  A comma separated list of Poll fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "duration_minutes",
    "end_datetime",
    "id",
    "options",
    "voting_status"
  ]
  ```

- **user.fields**
  - **Type**: `enum<string>[]`
  
  A comma separated list of User fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **place.fields**
  - **Type**: `enum<string>[]`
  
  A comma separated list of Place fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "contained_within",
    "country",
    "country_code",
    "full_name",
    "geo",
    "id",
    "name",
    "place_type"
  ]
  ```

## Response

### 200

The request has succeeded.

- **data**
  - **Type**: `object[]`
  
  Minimum length: `1`.

- **errors**
  - **Type**: `object[]`
  
  Minimum length: `1`.

- **includes**
  - **Type**: `object`

- **meta**
  - **Type**: `object`
```



## Page: https://docs.x.com/x-api/posts/sample-10-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream 10% sampled Posts](/x-api/stream/stream-10-sampled-posts#)
- [Stream sampled Posts](/x-api/stream/stream-sampled-posts#)
- [X API endpoint map](/x-api/migrate/x-api-endpoint-map#)
```



## Page: https://docs.x.com/x-api/users/user-lookup-by-username

```markdown
## Authorizations

- **Authorization**
  - **Type:** string
  - **Location:** header
  - **Required:** required
  - **Description:** Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **username**
  - **Type:** string
  - **Required:** required
  - **Description:** A username.

## Query Parameters

- **user.fields**
  - **Type:** enum<string>[]
  - **Description:** A comma separated list of User fields to display.
  - **Minimum length:** `1`
  - **Available options:** 
    - `affiliation`
    - `confirmed_email`
    - `connection_status`
    - `created_at`
    - `description`
    - `entities`
    - `id`
    - `is_identity_verified`
    - `location`
    - `most_recent_tweet_id`
    - `name`
    - `parody`
    - `pinned_tweet_id`
    - `profile_banner_url`
    - `profile_image_url`
    - `protected`
    - `public_metrics`
    - `receives_your_dm`
    - `subscription`
    - `subscription_type`
    - `url`
    - `username`
    - `verified`
    - `verified_followers_count`
    - `verified_type`
    - `withheld`

### Example:

```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

- **expansions**
  - **Type:** enum<string>[]
  - **Description:** A comma separated list of fields to expand.
  - **Minimum length:** `1`

### Example:

```json
[
  "affiliation.user_id",
  "most_recent_tweet_id",
  "pinned_tweet_id"
]
```

- **tweet.fields**
  - **Type:** enum<string>[]
  - **Description:** A comma separated list of Tweet fields to display.
  - **Minimum length:** `1`

### Example:

```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

- **Status Code:** 200
- **Content Type:** application/json
- **Description:** The request has succeeded.

### Response Data

- **data**
  - **Type:** object
  - **Description:** The X User object.

### Example:

```json
{
  "created_at": "2013-12-14T04:35:55Z",
  "id": "2244994945",
  "name": "X Dev",
  "protected": false,
  "username": "TwitterDev"
}
```

### Response Errors

- **errors**
  - **Type:** object[]
  - **Minimum length:** `1`

### Response Includes

- **includes**
  - **Type:** object
```



## Page: https://docs.x.com/x-api/posts/user-home-timeline-by-user-id

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: Yes  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type*: `string`  
*Required*: Yes  

The ID of the authenticated source User to list Reverse Chronological Timeline Posts of.

**Example**:  
```json
"2244994945"
```

## Query Parameters

**since_id**  
*Type*: `string`  

The minimum Post ID to be included in the result set. This parameter takes precedence over `start_time` if both are specified.

**Example**:  
```json
"1346889436626259968"
```

**until_id**  
*Type*: `string`  

The maximum Post ID to be included in the result set. This parameter takes precedence over `end_time` if both are specified.

**Example**:  
```json
"1346889436626259968"
```

**max_results**  
*Type*: `integer`  

The maximum number of results.  
*Required range*: `1 <= x <= 100`

**pagination_token**  
*Type*: `string`  

This parameter is used to get the next 'page' of results.  
*Minimum length*: `1`

**exclude**  
*Type*: `enum<string>[]`  

The set of entities to exclude (e.g. 'replies' or 'retweets').  

**Example**:  
```json
["replies", "retweets"]
```

**start_time**  
*Type*: `string<date-time>`  

YYYY-MM-DDTHH:mm:ssZ. The earliest UTC timestamp from which the Posts will be provided. The `since_id` parameter takes precedence if it is also specified.

**end_time**  
*Type*: `string<date-time>`  

YYYY-MM-DDTHH:mm:ssZ. The latest UTC timestamp to which the Posts will be provided. The `until_id` parameter takes precedence if it is also specified.

**tweet.fields**  
*Type*: `enum<string>[]`  

A comma separated list of Tweet fields to display.  
*Minimum length*: `1`

**Example**:  
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

**expansions**  
*Type*: `enum<string>[]`  

A comma separated list of fields to expand.  
*Minimum length*: `1`

**Example**:  
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

## Response

**200**  
*Content-Type*: `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type*: `object[]`  
*Minimum length*: `1`

### Response Errors

**errors**  
*Type*: `object[]`  
*Minimum length*: `1`

### Response Includes

**includes**  
*Type*: `object`  

### Response Meta

**meta**  
*Type*: `object`  
```



## Page: https://docs.x.com/livestreams

View recordings and replays of previous broadcasts about the X Developer Platform, designed to help the developer community learn and build with our tools.  
These include deep dives, getting started guides, and more.

## Past Broadcasts

<div class="mint-grid mint-grid-cols-1 md:mint-grid-cols-2 lg:mint-grid-cols-3 mint-gap-6 mint-py-5">

- [Community Notes AI Note Writer API](https://x.com/i/broadcasts/1dRKZayWLvwxB)  
  September 25, 2025

- [Real-time data streaming with the X API v2](https://x.com/i/broadcasts/1vOxwdbkgMdKB)  
  August 21, 2025

- [Account Activity API v2](https://x.com/i/broadcasts/1jMJgkmOONyJL)  
  July 24, 2025

- [Exploring the new X API v2 analytics endpoints](https://x.com/i/broadcasts/1BdGYqOwPXyGX)  
  June 12, 2025

- [Exploring the X API Developer Experience](https://x.com/i/broadcasts/1yoJMoLQqdRKQ)  
  April 9, 2025

- [Getting started with the new Media Upload endpoint in X API v2](https://x.com/i/broadcasts/1yoKMoQbjlXJQ)  
  March 5, 2025

- [Migrating developer apps to the X API 2](https://x.com/i/broadcasts/1BRJjPqnBqaKw)  
  May 14, 2024

</div>



## Page: https://docs.x.com/fundamentals/authentication/oauth-2-0/bearer-tokens

### Using and generating an app-only Bearer Token

A bearer token allows developers to have a more secure point of entry for using the X APIs, and are one of the core features of OAuth 2.0. 

Authentication, which uses a Bearer Token, is also known as application-only authentication. A Bearer Token is a byte array of unspecified format that you generate using a script like a curl command. You can also obtain a Bearer Token from the developer portal inside the keys and tokens section of your App’s settings. More information about this feature can be found on [OAuth’s official documentation](https://oauth.net/2/bearer-tokens/).

#### When are they used?

The products that require the use of a Bearer Token are as follows:

- [Engagement API](/x-api/enterprise-gnip-2.0/fundamentals/engagement-api)
- [Account Activity API](/x-api/enterprise-gnip-2.0/fundamentals/account-activity)
- Other APIs that utilize OAuth 2.0 Bearer Token authentication such as v2 and Labs endpoints.

#### Prerequisites

You will need to [sign up for a developer account](https://developer.x.com/en/portal/petition/essential/basic-info) and to have created a [X App](/resources/fundamentals/developer-apps). Once you have those, you’ll also need to obtain the API keys found in the [developer portal](/resources/fundamentals/developer-portal). Follow the steps below:

1. Login to your X account on developer.x.com.
2. Navigate to the [X App dashboard](https://developer.x.com/content/developer-twitter/en/apps) and open the X App for which you would like to generate access tokens.
3. Navigate to the “keys and tokens” page.
4. You’ll find the API keys, user Access Tokens, and Bearer Token on this page.

### How to generate a Bearer Token

You can find the Bearer Token for your App with the rest of your “Keys and Tokens”.

Copy the following cURL request into your command line after making changes to the following consumer API keys previously obtained from your [X App](/resources/fundamentals/developer-apps). Note that the consumer API keys used on this page have been decommissioned and will not work for real requests.

- **API key** `<API key>` e.g. `xvz1evFS4wEEPTGEFPHBog`
- **API secret key** `<API secret key>` e.g. `L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg`

```shell
curl -u "$API_KEY:$API_SECRET_KEY" \
--data 'grant_type=client_credentials' \
'https://api.x.com/oauth2/token'
```

Here’s an example of how the curl request should look with your API keys entered:

```shell
curl -u 'xvz1evFS4wEEPTGEFPHBog:L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg' \
--data 'grant_type=client_credentials' \
'https://api.x.com/oauth2/token'
```

Here is what the response would look like. Note that this is a decommissioned Bearer Token:

```json
{"token_type":"bearer","access_token":"AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjRfl76ZC9Ub0wnz4XsNiRVBChTYbJcE3F"}
```

Our Bearer Token used to authenticate to resources with OAuth 2.0 would be:

```
AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjRfl76ZC9Ub0wnz4XsNiRVBChTYbJcE3F
```



## Page: https://docs.x.com/x-api/likes/likes-sample-10-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream sampled Likes](/x-api/stream/stream-sampled-likes#)
- [X API endpoint map](/x-api/migrate/x-api-endpoint-map#)
- [About the X API](/x-api/getting-started/about-x-api#about-the-x-api)
```



## Page: https://docs.x.com/x-api/posts/rules-count

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Get stream rule counts](/x-api/stream/get-stream-rule-counts#)
- [Filtered Stream Webhooks API](/x-api/webhooks/stream/introduction#)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
```



## Page: https://docs.x.com/x-api/webhooks/get-a-list-of-webhook-configs-associated-with-a-client-app

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

**webhook_config.fields**  
*Type:* `enum<string>[]`  

A comma separated list of WebhookConfig fields to display.  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>

**Available options:** `created_at`, `id`, `url`, `valid`

</details>

**Example:**
```json
[
    "created_at",
    "id",
    "url",
    "valid"
]
```

## Response

The request has succeeded.

### Response Data

**data**  
*Type:* `object[]`  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>

</details>

### Response Errors

**errors**  
*Type:* `object[]`  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>

</details>

### Response Meta

**meta**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>

</details>
```



## Page: https://docs.x.com/x-api/spaces/search-for-spaces

```markdown
## Authorizations

- **Authorization**
  - Type: `string`
  - Location: `header`
  - Required: `required`
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

- **query**
  - Type: `string`
  - Required: `required`
  
  The search query.
  
  Required string length: `1 - 2048`

  Example: 
  ```json
  "crypto"
  ```

- **state**
  - Type: `enum<string>`
  - Default: `all`
  
  The state of Spaces to search for.
  
  Available options: `live`, `scheduled`, `all`

- **max_results**
  - Type: `integer`
  - Default: `100`
  
  The number of results to return.
  
  Required range: `1 <= x <= 100`

- **space.fields**
  - Type: `enum<string>[]`
  
  A comma separated list of Space fields to display.
  
  Minimum length: `1`

  Example:
  ```json
  [
    "created_at",
    "creator_id",
    "ended_at",
    "host_ids",
    "id",
    "invited_user_ids",
    "is_ticketed",
    "lang",
    "participant_count",
    "scheduled_start",
    "speaker_ids",
    "started_at",
    "state",
    "subscriber_count",
    "title",
    "topic_ids",
    "updated_at"
  ]
  ```

- **expansions**
  - Type: `enum<string>[]`
  
  A comma separated list of fields to expand.
  
  Minimum length: `1`

  Example:
  ```json
  [
    "creator_id",
    "host_ids",
    "invited_user_ids",
    "speaker_ids",
    "topic_ids"
  ]
  ```

- **user.fields**
  - Type: `enum<string>[]`
  
  A comma separated list of User fields to display.
  
  Minimum length: `1`

  Example:
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **topic.fields**
  - Type: `enum<string>[]`
  
  A comma separated list of Topic fields to display.
  
  Minimum length: `1`

  Example:
  ```json
  [
    "description",
    "id",
    "name"
  ]
  ```

## Response

### 200

The request has succeeded.

#### Response Data

- **data**
  - Type: `object[]`
  
  Minimum length: `1`

#### Response Errors

- **errors**
  - Type: `object[]`
  
  Minimum length: `1`

#### Response Includes

- **includes**
  - Type: `object`
  
#### Response Meta

- **meta**
  - Type: `object`
```



## Page: https://docs.x.com/x-api/users/returns-user-objects-that-are-members-of-a-list-by-the-provided-list-id

```markdown
## Authorizations

- **Authorization**
  - **Type**: string
  - **Location**: header
  - **Required**: required
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: string
  - **Required**: required
  - **Description**: The ID of the List.
  - **Example**: `"1146654567674912769"`

## Query Parameters

- **max_results**
  - **Type**: integer
  - **Default**: 100
  - **Description**: The maximum number of results.
  - **Required range**: `1 <= x <= 100`

- **pagination_token**
  - **Type**: string
  - **Description**: This parameter is used to get a specified 'page' of results.
  - **Required string length**: `1 - 19`

- **user.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **expansions**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation.user_id",
      "most_recent_tweet_id",
      "pinned_tweet_id"
    ]
    ```

- **tweet.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Tweet fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

## Response

- **Status Code**: 200
- **Content Type**: application/json
- **Description**: The request has succeeded.

### Response Data

- **data**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Errors

- **errors**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Includes

- **includes**
  - **Type**: object

### Response Meta

- **meta**
  - **Type**: object
```



## Page: https://docs.x.com/x-api/media/media-upload-append

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* Yes  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* Yes  

The media identifier for the media to perform the append operation.

**Example:**  
```json
"1146654567674912769"
```

## Body

**Select schema type:**  
- application/json (selected)
- multipart/form-data

### Option 1

**media**  
*Type:* `file`  
*Required:* Yes  

The file to upload.

**segment_index**  
*Type:* `integer`  
*Required:* Yes  

An integer value representing the media upload segment.  
Required range: `0 <= x <= 999`

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.  
A response from getting a media upload request status.

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
*Type:* `object[]`  

Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/mute-user-by-user-id

```markdown
## Authorizations

**Authorization**  
Type: `string`  
Location: `header`  
**Required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
Type: `string`  
**Required**  

The ID of the authenticated source User that is requesting to mute the target User.

**Example:**
```json
"2244994945"
```

## Body

**Content-Type:** `application/json`

**target_user_id**  
Type: `string`  
**Required**  

Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

**Example:**
```json
"2244994945"
```

## Response

**200**  
**Content-Type:** `application/json`  

The request has succeeded.

**Response Data**  
Type: `object`  

<details>
<summary>Show child attributes</summary>
</details>

**Response Errors**  
Type: `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/creating-a-signature

### Creating a signature

This page explains how to generate an OAuth 1.0a HMAC-SHA1 signature for an HTTP request. This signature will be suitable for passing to the X API as part of an authorized request, as described in [authorizing a request](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/authorizing-a-request).

The request used to demonstrate signing is a POST to [https://api.x.com/1.1/statuses/update.json](https://api.x.com/1.1/statuses/update.json). The raw request looks like this:

```
POST /1.1/statuses/update.json?include_entities=true HTTP/1.1
Accept: */*
Connection: close
User-Agent: OAuth gem v0.4.4
Content-Type: application/x-www-form-urlencoded
Content-Length: 76
Host: api.x.com

status=Hello%20Ladies%20%2b%20Gentlemen%2c%20a%20signed%20OAuth%20request%21
```

**Collecting the request method and URL**

To produce a signature, start by determining the HTTP method and URL of the request. These two are known when creating the request, so they are easy to obtain.

The request method will almost always be GET or POST for X API requests.

| HTTP Method | POST |
|-------------|------|

The base URL is the URL to which the request is directed, minus any query string or hash parameters. It is important to use the correct protocol here, so make sure that the “https://” portion of the URL matches the actual request sent to the API.

| Base URL | [https://api.x.com/1.1/statuses/update.json](https://api.x.com/1.1/statuses/update.json) |
|----------|------------------------------------------------------------------------------------------|

#### Collecting parameters

Next, gather all of the parameters included in the request. There are two such locations for these additional parameters - the URL (as part of the query string) and the request body. The sample request includes a single parameter in both locations:

```
POST /1.1/statuses/update.json?include_entities=true HTTP/1.1
Accept: */*
Connection: close
User-Agent: OAuth gem v0.4.4
Content-Type: application/x-www-form-urlencoded
Content-Length: 76
Host: api.x.com

status=Hello%20Ladies%20%2b%20Gentlemen%2c%20a%20signed%20OAuth%20request%21
```

An HTTP request has parameters that are URL encoded, but you should collect the raw values. In addition to the request parameters, every oauth_* parameter needs to be included in the signature, so collect those too. Here are the parameters from [authorizing a request](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/authorizing-a-request):

| Parameter                | Value                                                                                     |
|--------------------------|-------------------------------------------------------------------------------------------|
| status                   | Hello Ladies + Gentlemen, a signed OAuth request!                                       |
| include_entities         | true                                                                                      |
| oauth_consumer_key       | xvz1evFS4wEEPTGEFPHBog                                                                   |
| oauth_nonce              | kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg                                             |
| oauth_signature_method    | HMAC-SHA1                                                                                |
| oauth_timestamp          | 1318622958                                                                                |
| oauth_token              | 370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb                                      |
| oauth_version            | 1.0                                                                                       |

These values need to be encoded into a single string, which will be used later on. The process to build the string is very specific:

1. [Percent encode](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters) every key and value that will be signed.
2. Sort the list of parameters alphabetically [1] by encoded key [2].
3. For each key/value pair:
   - Append the encoded key to the output string.
   - Append the ‘=’ character to the output string.
   - Append the encoded value to the output string.
   - If there are more key/value pairs remaining, append a ‘&’ character to the output string.

[1] The OAuth spec says to sort lexicographically, which is the default alphabetical sort for many libraries.  
[2] In the case of two parameters with the same encoded key, the OAuth spec says to continue sorting based on value. However, X does not accept duplicate keys in API requests.

**Parameter string**

The following *parameter string* will be produced by repeating these steps with the parameters collected above:

| Parameter                | Value                                                                                     |
|--------------------------|-------------------------------------------------------------------------------------------|
| status                   | Hello Ladies + Gentlemen, a signed OAuth request!                                       |
| include_entities         | true                                                                                      |
| oauth_consumer_key       | xvz1evFS4wEEPTGEFPHBog                                                                   |
| oauth_nonce              | kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg                                             |
| oauth_signature_method    | HMAC-SHA1                                                                                |
| oauth_timestamp          | 1318622958                                                                                |
| oauth_token              | 370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb                                      |
| oauth_version            | 1.0                                                                                       |

#### Creating the signature base string

The three values collected so far must be joined to make a single string, from which the signature will be generated. This is called the **signature base string** by the OAuth specification.

To encode the HTTP method, base URL, and parameter string into a single string:

1. Convert the HTTP Method to uppercase and set the output string equal to this value.
2. Append the ‘&’ character to the output string.
3. [Percent encode](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters) the URL and append it to the output string.
4. Append the ‘&’ character to the output string.
5. [Percent encode](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters) the parameter string and append it to the output string.

This will produce the following *signature base string*:

```
POST&https%3A%2F%2Fapi.x.com%2F1.1%2Fstatuses%2Fupdate.json&include_entities%3Dtrue%26oauth_consumer_key%3Dxvz1evFS4wEEPTGEFPHBog%26oauth_nonce%3DkYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1318622958%26oauth_token%3D370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb%26oauth_version%3D1.0%26status%3DHello%2520Ladies%2520%252B%2520Gentlemen%252C%2520a%2520signed%2520OAuth%2520request%2521
```

Make sure to percent encode the parameter string. The signature base string should contain exactly 2 ampersand ‘&’ characters. The percent ‘%’ characters in the parameter string should be encoded as %25 in the signature base string.

#### Getting a signing key

The last pieces of data to collect are secrets which identify the [X app](https://api.x.com/resources/fundamentals/developer-apps) making the request, and the user the request is on behalf of. It is very important to note that these values are incredibly sensitive and should never be shared with anyone.

The value which identifies your app to X is called the **consumer secret** and can be found in the [developer portal](https://api.x.com/resources/fundamentals/developer-portal) by viewing the [app details page](https://api.x.com/resources/fundamentals/developer-apps). This will be the same for every request your X app sends.

| Consumer secret | kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw |
|-----------------|--------------------------------------------------|

The value which identifies the account your application is acting on behalf of is called the **OAuth token secret**. This value can be obtained in several ways, all of which are described in [obtaining access tokens](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens).

| OAuth token secret | LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE |
|--------------------|----------------------------------------------|

Once again, it is very important to keep these values private to your application. If you feel that your values have been compromised, regenerate your tokens (the tokens on this page have been marked as invalid for real requests).

Both of these values need to be combined to form a **signing key** which will be used to generate the signature. The signing key is simply the [percent encoded](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters) token secret:

Note that there are some flows, such as when obtaining a [request token](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens), where the token secret is not yet known. In this case, the signing key should consist of the [percent encoded](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters) **consumer secret** followed by an ampersand character ‘&’.

| Signing key | kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw&LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE |
|-------------|------------------------------------------------------------------------------------------------|

#### Calculating the signature

Finally, the signature is calculated by passing the signature base string and signing key to the HMAC-SHA1 hashing algorithm. The details of the algorithm are explained as hash_hmac function.

The output of the HMAC signing function is a binary string. This needs to be base64 encoded to produce the signature string. For example, the output given the base string and signing key given on this page is 2E CF 77 84 98 99 6D 0D DA 90 5D C7 17 7C 75 07 3F 3F CD 4E. That value, when converted to base64, is the OAuth signature for this request:

| OAuth signature | Ls93hJiZbQ3akF3HF3x1Bz8/zU4= |
|-----------------|-------------------------------|



## Page: https://docs.x.com/x-api/users/returns-repost-of-user

```markdown
## Authorizations

**Authorization**  
Type: `string`  
Location: `header`  
**Required**: Yes  

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

**max_results**  
Type: `integer`  
Default: `100`  

The maximum number of results.  
Required range: `1 <= x <= 100`

**pagination_token**  
Type: `string`  

This parameter is used to get the next 'page' of results.  
Minimum length: `1`

**tweet.fields**  
Type: `enum<string>[]`  

A comma separated list of Tweet fields to display.  
Minimum length: `1`  

**Example**:
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

**expansions**  
Type: `enum<string>[]`  

A comma separated list of fields to expand.  
Minimum length: `1`  

**Example**:
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

**media.fields**  
Type: `enum<string>[]`  

A comma separated list of Media fields to display.  
Minimum length: `1`  

**Example**:
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

**poll.fields**  
Type: `enum<string>[]`  

A comma separated list of Poll fields to display.  
Minimum length: `1`  

**Example**:
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

**user.fields**  
Type: `enum<string>[]`  

A comma separated list of User fields to display.  
Minimum length: `1`  

**Example**:
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**place.fields**  
Type: `enum<string>[]`  

A comma separated list of Place fields to display.  
Minimum length: `1`  

**Example**:
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

## Response

### 200

**Content-Type**: `application/json`  

The request has succeeded.

**data**  
Type: `object[]`  
Minimum length: `1`  

**errors**  
Type: `object[]`  
Minimum length: `1`  

**includes**  
Type: `object`  

**meta**  
Type: `object`  
```



## Page: https://docs.x.com/x-api/account-activity/request-activity-replay

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* **required**

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

---

## Path Parameters

**webhook_id**  
*Type:* `string`  
*Status:* **required**  

The unique identifier for the webhook configuration.  
**Example:**  
`"1146654567674912769"`

---

## Query Parameters

**from_date**  
*Type:* `string`  
*Status:* **required**  

The oldest (starting) UTC timestamp (inclusive) from which events will be provided, in `yyyymmddhhmm` format.  
**Example:**  
`"202504242000"`

**to_date**  
*Type:* `string`  
*Status:* **required**  

The latest (ending) UTC timestamp (exclusive) up to which events will be provided, in `yyyymmddhhmm` format.  
**Example:**  
`"202504242200"`

---

## Response

**Status:** 200  
**Content-Type:** application/json  

The request has succeeded.  
Confirmation that the replay job request was accepted.

### created_at  

*Type:* `string<date-time>`  
*Status:* **required**  

The UTC timestamp indicating when the replay job was created.  
**Example:**  
`"2025-04-24T20:57:15.242Z"`

### job_id  

*Type:* `string`  
*Status:* **required**  

The unique identifier for the initiated replay job.  
**Example:**  
`"1915510368169844736"`
```



## Page: https://docs.x.com/fundamentals/projects

## Introduction

Projects allow you to organize your work based on how you intend to use the X API so you can effectively manage your access to the API and monitor your usage. Each Project can contain one or multiple [Apps](/resources/fundamentals/developer-apps) depending on your access level (described later on this page). You will use these Apps to generate [authentication](/resources/fundamentals/authentication) credentials such as [API Keys and Secrets](/resources/fundamentals/authentication#api-key-and-secret), user [Access Tokens](/resources/fundamentals/authentication#obtaining-access-tokens-using-3-legged-oauth-flow), and [App Access Token](/resources/fundamentals/authentication#bearer-token-also-known-as-app-only).

While you can use these keys and tokens from any App to access the X API or X Ads API (you must [apply for additional access](/x-ads-api/getting-started/step-by-step-guide) to use the Ads API), you must use keys and tokens from an App associated with a Project to be able to use the [X API v2](/x-api/introduction) endpoints.

If you have a developer account, you can view and manage your Projects on the [Projects & Apps](https://developer.x.com/en/portal/projects-and-apps) page within the developer portal. [Sign up](https://developer.x.com/en/portal/petition/essential/basic-info) for an account if you don’t have one already.

### Projects and X API access levels

At this time, there are 4 different tiers of access that are applied at the Project-level:

- Free
- Basic
- Pro
- Enterprise

To learn more about what each of these access levels provides, please visit the [about X API](/x-api/getting-started/about-x-api) page.

You can only have one Project with either Free, Basic, or Pro.

We will describe a few Project-specific differences here for you:

#### Free

This access tier is provided to anyone who has [signed up](https://developer.twitter.com/en/portal/petition/essential/basic-info) for a developer account.

Number of Apps within that Project: 1  
[Tweet consumption cap](/x-api/fundamentals/post-cap): 1,500 Tweets per month

Authentication methods:

- [OAuth 2.0 with PKCE](/resources/fundamentals/authentication#oauth-2-0-authorization-code-flow-with-pkce-2)
- App only

#### Basic

This access tier is provided to anyone who has subscribed for Basic access via the developer portal.

Number of Apps within that Project: 2  
[Tweet consumption cap](/x-api/fundamentals/post-cap): 10,000 Tweets per month  
Authentication methods:

- [OAuth 2.0 with PKCE](/resources/fundamentals/authentication#oauth-2-0-authorization-code-flow-with-pkce-2)
- [OAuth 1.0a](/resources/fundamentals/authentication#oauth-1-0a-2)
- App only

#### Pro

This access tier is provided to anyone who has subscribed for Pro access via the developer portal.

Number of Apps within that Project: 3  
[Tweet consumption cap](/x-api/fundamentals/post-cap): 1 million Tweets per month

Authentication methods:

- [OAuth 2.0 with PKCE](/resources/fundamentals/authentication#oauth-2-0-authorization-code-flow-with-pkce-2)
- [OAuth 1.0a](/resources/fundamentals/authentication#oauth-1-0a-2)
- App only

#### Enterprise

This access tier is provided to anyone who has applied for Enterprise, been approved by our team, and signed a monthly auto renew contract via X account manager. [Apply here](https://docs.google.com/forms/d/e/1FAIpQLScO3bczKWO2jFHyVZJUSEGfdyfFaqt2MvmOfl_aJp0KxMqtDA/viewform).

Number of Apps within that Project: 3+  
[Tweet consumption cap](/x-api/fundamentals/post-cap): 50 million+ Tweets per month

Authentication methods:

- [OAuth 2.0 with PKCE](/resources/fundamentals/authentication#oauth-2-0-authorization-code-flow-with-pkce-2)
- [OAuth 1.0a](/resources/fundamentals/authentication#oauth-1-0a-2)
- App only

### Tweet caps and Projects

Tweet consumption caps apply at the Project-level, effectively limiting the volume of Tweets you can retrieve from certain X API v2 endpoints within a given month.

Learn more about [Tweet caps](/x-api/fundamentals/post-cap).

### Configuring Projects

#### Creating a Project

To create a Project, click on “New Project” in your [dashboard](https://developer.twitter.com/en/portal/dashboard) or the [Projects & Apps](https://developer.twitter.com/en/portal/projects-and-apps) page within the developer portal. You’ll only be able to see this option if you haven’t already created a Project. You will be prompted to create a Project name, description, and use case. You will also be asked to create a new App or connect an existing standalone App.

#### Creating or Connecting an App for your Project

If your Project doesn’t include an App, you can add one by clicking on the Project name in the dashboard. From there, you can either create a new App or select an existing standalone App to connect to your Project. The App is where you can generate the authentication keys and tokens listed at the beginning of this guide.

#### Editing a Project

To edit a Project, click on the name of your Project from the dashboard or Projects & Apps page within the developer portal. From there you will see the details of your Project and can select “edit” to make changes.

### Standalone Apps

Standalone Apps are Apps that exist outside of the Project structure. The authentication credentials associated with these standalone Apps can make successful requests to X’s API’s standard v1.1, premium v1.1, enterprise, or to the X Ads API. Standalone Apps will fail when trying to make requests to the X API v2 endpoints unless you connect them to a Project.

If you created an App before August 2020, they will be visible in the “Standalone Apps” section of the developer portal under [Projects & Apps](https://developer.twitter.com/en/portal/projects-and-apps). You will be limited to ten Apps in total, including those that are connected to your Project.

If you’re part of a team account, you will see the Apps that you own under Standalone Apps. If a teammate owns an App that’s part of a Project, you will be able to see the App’s name and owner’s info, but you will not be able to change its settings, access its keys and tokens, or regenerate its keys and tokens. You should contact the App owner to make any changes to their App.



## Page: https://docs.x.com/x-api/media/media-lookup-by-media-key

```markdown
## Authorizations

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### media_keys

- **Type**: `string[]`
- **Required**: Yes

A comma separated list of Media Keys. Up to 100 are allowed in a single request.

Required array length: `1 - 100` elements.

The Media Key identifier for this attachment.

### media.fields

- **Type**: `enum<string>[]`

A comma separated list of Media fields to display.

Minimum length: `1`

#### Available options:

`alt_text`, `duration_ms`, `height`, `media_key`, `non_public_metrics`, `organic_metrics`, `preview_image_url`, `promoted_metrics`, `public_metrics`, `type`, `url`, `variants`, `width`

**Example**:

```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

## Response

The request has succeeded.

### Response Data

- **Type**: `object[]`

Minimum length: `1`

### Response Errors

- **Type**: `object[]`

Minimum length: `1`
```



## Page: https://docs.x.com/x-api/lists/get-a-users-list-memberships

```markdown
## Authorizations

- **Authorization**  
  **Type:** string  
  **Location:** header  
  **Required:** required  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**  
  **Type:** string  
  **Required:** required  
  The ID of the User to lookup.  
  **Example:**  
  `"2244994945"`

## Query Parameters

- **max_results**  
  **Type:** integer  
  **Default:** 100  
  The maximum number of results.  
  **Required range:** `1 <= x <= 100`

- **pagination_token**  
  **Type:** string  
  This parameter is used to get a specified 'page' of results.  
  **Required string length:** `1 - 19`

- **list.fields**  
  **Type:** enum<string>[]  
  A comma separated list of List fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "created_at",
    "description",
    "follower_count",
    "id",
    "member_count",
    "name",
    "owner_id",
    "private"
  ]
  ```

- **expansions**  
  **Type:** enum<string>[]  
  A comma separated list of fields to expand.  
  **Minimum length:** `1`  
  **Example:**  
  `["owner_id"]`

- **user.fields**  
  **Type:** enum<string>[]  
  A comma separated list of User fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

## Response

### 200

The request has succeeded.

- **data**  
  **Type:** object[]  
  **Minimum length:** `1`

- **errors**  
  **Type:** object[]  
  **Minimum length:** `1`

- **includes**  
  **Type:** object

- **meta**  
  **Type:** object
```



## Page: https://docs.x.com/x-api/compliance/posts-compliance-stream

```markdown
<div class="mdx-content relative" data-page-title="Page Not Found" id="content">

## 404

### Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Compliance Firehose API](/x-api/enterprise-gnip-2.0/fundamentals/firehouse#)
- [Stream Posts compliance data](/x-api/stream/stream-posts-compliance-data#)
- [Streaming](/xdks/python/streaming#streaming)

</div>
```



## Page: https://docs.x.com/forms/enterprise-api-interest

```markdown
<div class="flex justify-center w-full" data-as="iframe">
<iframe class="object-contain form" frameborder="0" src="https://developer.x.com/en/products/x-api/enterprise/embedded-enterprise-api-interest" style="aspect-ratio: 500 / 1000; height: 1000px; width: 500px;"></iframe>
</div>
```



## Page: https://docs.x.com/x-api/media/media-upload-status

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: required

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

### media_id

- **Type**: `string`
- **Required**: required

Media id for the requested media upload status.

**Example**:
```json
"1146654567674912769"
```

### command

- **Type**: `enum<string>`

The command for the media upload request.

Available options: `STATUS`

## Response

### 200

**Content-Type**: `application/json`

The request has succeeded.

A response from getting a media upload request status.

#### data

- **Type**: `object`

<details>
<summary>Show child attributes</summary>
</details>

#### errors

- **Type**: `object[]`

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/resources/fundamentals/:slug*

```markdown
<div class="mdx-content relative" data-page-title="Page Not Found" id="content">

404
# Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Pagination](/x-api/fundamentals/pagination#fundamentals-of-pagination)
- [Data dictionary: Enterprise](/x-api/enterprise-gnip-2.0/fundamentals/data-dictionary#from-user-conventions-to-x-first-class-objects)
- [Decahose API](/x-api/enterprise-gnip-2.0/fundamentals/decahose-api#request-specifications)

</div>
```



## Page: https://docs.x.com/x-api/media/subtitle-delete

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Body

*Content-Type:* `application/json`

### id

**id**  
*Type:* `string`  

The unique identifier of this Media.

**Example:**  
```json
"1146654567674912769"
```

### language_code

**language_code**  
*Type:* `string`  

The language code should be a BCP47 code (e.g. 'EN", "SP")

**Example:**  
```json
"EN"
```

### media_category

**media_category**  
*Type:* `enum<string>`  

The media category of uploaded media to which subtitles should be added/deleted.  
Available options: `AmplifyVideo`, `TweetVideo`

**Example:**  
```json
"TweetVideo"
```

## Response

**Response Code:** `200`  
**Content-Type:** `application/json`  

The request has succeeded.

### data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/following-by-user-id

```markdown
## Authorizations

- **Authorization**
  - **Type**: string
  - **Location**: header
  - **Required**: required
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: string
  - **Required**: required
  - **Description**: The ID of the User to lookup.
  - **Example**: `"2244994945"`

## Query Parameters

- **max_results**
  - **Type**: integer
  - **Description**: The maximum number of results.
  - **Required range**: `1 <= x <= 1000`

- **pagination_token**
  - **Type**: string
  - **Description**: This parameter is used to get a specified 'page' of results.
  - **Minimum length**: `16`

- **user.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **expansions**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation.user_id",
      "most_recent_tweet_id",
      "pinned_tweet_id"
    ]
    ```

- **tweet.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Tweet fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

## Response

- **Status**: 200
- **Content-Type**: application/json
- **Description**: The request has succeeded.

### Response Data

- **data**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Errors

- **errors**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Includes

- **includes**
  - **Type**: object

### Response Meta

- **meta**
  - **Type**: object
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/authorizing-a-request

### Authorizing a request

The purpose of this document is to show you how to modify HTTP requests for the purpose of sending authorized requests to the X API.

All of X’s APIs are based on the HTTP protocol. This means that any software you write which uses X’s APIs sends a series of structured messages to X’s servers. For example, a request to post the text “**Hello Ladies + Gentlemen, a signed OAuth request!**” as a Tweet will look something like this:

```plaintext
POST /1.1/statuses/update.json?include_entities=true HTTP/1.1
Accept: */*
Connection: close
User-Agent: OAuth gem v0.4.4
Content-Type: application/x-www-form-urlencoded
Content-Length: 76
Host: api.x.com

status=Hello%20Ladies%20%2b%20Gentlemen%2c%20a%20signed%20OAuth%20request%21
```

Any HTTP library should be able to generate and issue the above request with a minimum of difficulty. However, the above request is considered invalid, since there is no way of knowing:

1. Which application is making the request
2. Which user the request is posting on behalf of
3. Whether the user has granted the application authorization to post on the user’s behalf
4. Whether the request has been tampered by a third party while in transit

To allow applications to provide this information, X’s API relies on the [OAuth 1.0a protocol](http://tools.ietf.org/html/rfc5849). At a very simplified level, X’s implementation requires that requests needing authorization contain an additional HTTP Authorization header with enough information to answer the questions listed above. A version of the HTTP request shown above, modified to include this header, looks like this (normally the Authorization header would need to be on one line, but has been wrapped for legibility here):

```plaintext
POST /1.1/statuses/update.json?include_entities=true HTTP/1.1
Accept: */*
Connection: close
User-Agent: OAuth gem v0.4.4
Content-Type: application/x-www-form-urlencoded
Authorization: OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog",
oauth_nonce="kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg",
oauth_signature="tnnArxj06cWHq44gCs1OSKk%2FjLY%3D",
oauth_signature_method="HMAC-SHA1",
oauth_timestamp="1318622958",
oauth_token="370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb",
oauth_version="1.0"
Content-Length: 76
Host: api.x.com

status=Hello%20Ladies%20%2b%20Gentlemen%2c%20a%20signed%20OAuth%20request%21
```

When this request was created, it would have been accepted by the X API as valid.

If this signing process sounds like it is beyond the scope of your integration, consider using [Web Intents](https://dev.x.com/web/intents), which do not need to use OAuth to interact with the X API.

**Collecting parameters**

You should be able to see that the header contains 7 key/value pairs, where the keys all begin with the string “oauth_”. For any given X API request, collecting these 7 values and creating a similar header will allow you to specify authorization for the request. How each value was generated is described below:

**Consumer key**

The `oauth_consumer_key` identifies which application is making the request. Obtain this value from the settings page for your [X app](/resources/fundamentals/developer-apps) in the [developer portal](/resources/fundamentals/developer-portal).

| oauth_consumer_key | xvz1evFS4wEEPTGEFPHBog |
|---------------------|-------------------------|

**Nonce**

The `oauth_nonce` parameter is a unique token your application should generate for each unique request. X will use this value to determine whether a request has been submitted multiple times. The value for this request was generated by base64 encoding 32 bytes of random data, and stripping out all non-word characters, but any approach which produces a relatively random alphanumeric string should be OK here.

| oauth_nonce | kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg |
|--------------|-----------------------------------------------|

**Signature**

The `oauth_signature` parameter contains a value which is generated by running all of the other request parameters and two secret values through a signing algorithm. The purpose of the signature is so that X can verify that the request has not been modified in transit, verify the application sending the request, and verify that the application has authorization to interact with the user’s account.

The process for calculating the `oauth_signature` for this request is described in [Creating a signature](/resources/fundamentals/authentication/oauth-1-0a/creating-a-signature).

| oauth_signature | tnnArxj06cWHq44gCs1OSKk/jLY= |
|-----------------|-------------------------------|

**Signature method**

The `oauth_signature_method` used by X is HMAC-SHA1. This value should be used for any authorized request sent to X’s API.

| oauth_signature_method | HMAC-SHA1 |
|------------------------|-----------|

**Timestamp**

The `oauth_timestamp` parameter indicates when the request was created. This value should be the number of seconds since the Unix epoch at the point the request is generated, and should be easily generated in most programming languages. X will reject requests which were created too far in the past, so it is important to keep the clock of the computer generating requests in sync with NTP.

| oauth_timestamp | 1318622958 |
|------------------|------------|

**Token**

The `oauth_token` parameter typically represents a user’s permission to share access to their account with your application. There are a few authentication requests where this value is not passed or is a different form of token, but those are covered in detail in [Obtaining access tokens](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens). For most general-purpose requests, you will use what is referred to as an **access token**.

You can generate a valid [access token](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) for your account on the settings page for your [X app](/resources/fundamentals/developer-apps) on the [developer portal](/resources/fundamentals/developer-portal).

| oauth_token | 370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb |
|-------------|-----------------------------------------------------|

**Version**

The `oauth_version` parameter should always be 1.0 for any request sent to the X API.

| oauth_version | 1.0 |
|---------------|-----|

#### Building the header string

To build the header string, imagine writing to a string named DST.

1. Append the string “OAuth ” (including the space at the end) to DST.
2. For each key/value pair of the 7 parameters listed above:
   1. [Percent encode](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) the key and append it to DST.
   2. Append the equals character ‘=’ to DST.
   3. Append a double quote ‘”’ to DST.
   4. [Percent encode](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) the value and append it to DST.
   5. Append a double quote ‘”’ to DST.
   6. If there are key/value pairs remaining, append a comma ‘,’ and a space ‘ ‘ to DST.

Pay particular attention to the percent encoding of the values when building this string. For example, the `oauth_signature` value of `tnnArxj06cWHq44gCs1OSKk/jLY=` must be encoded as `tnnArxj06cWHq44gCs1OSKk%2FjLY%3D`.

Performing these steps on the parameters collected above results in the following string:

```plaintext
OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog", oauth_nonce="kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", oauth_signature="tnnArxj06cWHq44gCs1OSKk%2FjLY%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1318622958", oauth_token="370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", oauth_version="1.0"
```

This value should be set as the Authorization header for the request.



## Page: https://docs.x.com/x-api/spaces/space-lookup-by-space-id

```markdown
## Authorizations

- **Authorization**
  - **Type**: `string`
  - **Location**: `header`
  - **Required**: Yes
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: The ID of the Space to be retrieved.
  - **Example**: `"1SLjjRYNejbKM"`

## Query Parameters

- **space.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Space fields to display.
  - **Minimum length**: `1`
  - **Available options**: 
    - `created_at`
    - `creator_id`
    - `ended_at`
    - `host_ids`
    - `id`
    - `invited_user_ids`
    - `is_ticketed`
    - `lang`
    - `participant_count`
    - `scheduled_start`
    - `speaker_ids`
    - `started_at`
    - `state`
    - `subscriber_count`
    - `title`
    - `topic_ids`
    - `updated_at`
  - **Example**:
    ```json
    [
      "created_at",
      "creator_id",
      "ended_at",
      "host_ids",
      "id",
      "invited_user_ids",
      "is_ticketed",
      "lang",
      "participant_count",
      "scheduled_start",
      "speaker_ids",
      "started_at",
      "state",
      "subscriber_count",
      "title",
      "topic_ids",
      "updated_at"
    ]
    ```

- **expansions**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "creator_id",
      "host_ids",
      "invited_user_ids",
      "speaker_ids",
      "topic_ids"
    ]
    ```

- **user.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **topic.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Topic fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "description",
      "id",
      "name"
    ]
    ```

## Response

- **Status Code**: `200`
- **Content Type**: `application/json`
- **Description**: The request has succeeded.

### Response Data

- **data**
  - **Type**: `object`
  - **Description**: The main response data.
  
### Response Errors

- **errors**
  - **Type**: `object[]`
  - **Description**: Minimum length: `1`

### Response Includes

- **includes**
  - **Type**: `object`
```



## Page: https://docs.x.com/x-api/users/unmute-user-by-user-id

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**source_user_id**  
*Type:* `string`  
*Required:* required  

The ID of the authenticated source User that is requesting to unmute the target User.

**Example:**
```json
"2244994945"
```

**target_user_id**  
*Type:* `string`  
*Required:* required  

The ID of the User that the source User is requesting to unmute.

**Example:**
```json
"2244994945"
```

## Response

The request has succeeded.

**Response Data**  
*Type:* `object`  

### Errors

*Type:* `object[]`  
Minimum length: `1`
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-2-0/overview

### Bearer Token (also known as app-only)

OAuth 2.0 Bearer Token authenticates requests on behalf of your [developer App](/resources/fundamentals/developer-apps). As this method is specific to the App, it does not involve any users. This method is typically for developers that need read-only access to public information.

This authentication method requires you to pass a Bearer Token with your request, which you can generate within the Keys and tokens section of your developer Apps. Here is an example of what a request looks like with a fake Bearer Token:

```json
curl "https://api.x.com/2/tweets?ids=1261326399320715264,1278347468690915330" \
-H "Authorization: Bearer AAAAAAAAAAAAAAAAAAAAAFnz2wAAAAAAxTmQbp%2BIHDtAhTBbyNJon%2BA72K4%3DeIaigY0QBrv6Rp8KZQQLOTpo9ubw5Jt?WRE8avbi"
```

API calls using app-only authentication are [rate limited](/resources/fundamentals/rate-limits) per endpoint at the App level.

To use this method, you’ll need a Bearer Token, which you can generate by passing your API Key and Secret through the [POST oauth2/token](https://api.x.com/resources/fundamentals/authentication/api-reference#post-oauth2-token) endpoint, or by generating it in the “keys and token” section of your App settings in the [developer portal](/resources/fundamentals/developer-portal).

If you’d like to revoke a Bearer Token, you can use the [POST oauth2/invalidate_token](https://api.x.com/resources/fundamentals/authentication/api-reference#post-oauth2-invalidate-token) endpoint, or click where it says “revoke” next to the Bearer Token in the “keys and tokens” section of your App settings.

### OAuth 2.0 Authorization Code Flow with PKCE

OAuth 2.0 Authorization Code Flow with PKCE allows you to authenticate on behalf of another user with more control over an application’s scopes and improves authorization flows across multiple devices. In other words, developers building applications for people on X will have more control over the information their App requests from its users, so that you only have to ask your end-users for the data and information you need.

This modern authorization protocol will allow you to present your end-users with a more streamlined consent flow for authorizing your app, which only displays the specific scopes you have requested from them. Not only does this reduce your data burden, but it may also lead to increased trust from end-users.



## Page: https://docs.x.com/x-api/bookmarks/bookmark-folders-by-user

```markdown
## Authorizations

**Authorization**  
`string` (header) **required**  
The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
`string` **required**  
The ID of the authenticated source User for whom to return results.  
**Example:**  
`"2244994945"`

## Query Parameters

**max_results**  
`integer`  
The maximum number of results.  
Required range: `1 <= x <= 100`

**pagination_token**  
`string`  
This parameter is used to get the next 'page' of results.  
Minimum length: `1`

## Response

**200**  
`application/json`  
The request has succeeded.

**data**  
`object[]`  
Show child attributes

**errors**  
`object[]`  
Minimum length: `1`

**meta**  
`object`  
Show child attributes
```



## Page: https://docs.x.com/x-api/spaces/space-lookup-by-their-creators

```markdown
## Authorizations

- **Authorization**
  - Type: `string`
  - Location: `header`
  - Required: `required`
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

- **user_ids**
  - Type: `string[]`
  - Required: `required`
  
  The IDs of Users to search through.
  
  Required array length: `1 - 100` elements.

  Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

- **space.fields**
  - Type: `enum<string>[]`
  
  A comma separated list of Space fields to display.
  
  Minimum length: `1`
  
  **Example:**
  ```json
  [
    "created_at",
    "creator_id",
    "ended_at",
    "host_ids",
    "id",
    "invited_user_ids",
    "is_ticketed",
    "lang",
    "participant_count",
    "scheduled_start",
    "speaker_ids",
    "started_at",
    "state",
    "subscriber_count",
    "title",
    "topic_ids",
    "updated_at"
  ]
  ```

- **expansions**
  - Type: `enum<string>[]`
  
  A comma separated list of fields to expand.
  
  Minimum length: `1`
  
  **Example:**
  ```json
  [
    "creator_id",
    "host_ids",
    "invited_user_ids",
    "speaker_ids",
    "topic_ids"
  ]
  ```

- **user.fields**
  - Type: `enum<string>[]`
  
  A comma separated list of User fields to display.
  
  Minimum length: `1`
  
  **Example:**
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **topic.fields**
  - Type: `enum<string>[]`
  
  A comma separated list of Topic fields to display.
  
  Minimum length: `1`
  
  **Example:**
  ```json
  [
    "description",
    "id",
    "name"
  ]
  ```

## Response

- **Response Code:** `200`
- **Content Type:** `application/json`
  
  The request has succeeded.

### Response Data

- **data**
  - Type: `object[]`
  
  Minimum length: `1`

### Response Errors

- **errors**
  - Type: `object[]`
  
  Minimum length: `1`

### Response Includes

- **includes**
  - Type: `object`
  
### Response Meta

- **meta**
  - Type: `object`
```



## Page: https://docs.x.com/x-api/direct-messages/send-a-new-message-to-a-user

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**participant_id**  
*Type:* `string`  
*Required:* required  

The ID of the recipient user that will receive the DM.

**Example:**  
```json
"2244994945"
```

## Body

*Content-Type:* `application/json`

### Option 1

**text**  
*Type:* `string`  
*Required:* required  

Text of the message.  
Minimum length: `1`

**attachments**  
*Type:* `object[]`  

Attachments to a DM Event.

<details>
<summary>Show child attributes</summary>
</details>

## Response

*Status Code:* `201`  
*Content-Type:* `application/json`  

The request has succeeded.

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
*Type:* `object[]`  

Minimum length: `1`
```



## Page: https://docs.x.com/x-api/direct-messages/get-recent-dm-events

```markdown
## Authorizations

**Authorization**  
Type: `string`  
Location: `header`  
**Required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

### max_results

**max_results**  
Type: `integer`  
Default: `100`  

The maximum number of results.  
Required range: `1 <= x <= 100`

### pagination_token

**pagination_token**  
Type: `string`  

This parameter is used to get a specified 'page' of results.  
Minimum length: `16`

### event_types

**event_types**  
Type: `enum<string>[]`  

The set of event_types to include in the results.  
Minimum length: `1`  

**Example**:  
```json
[
  "MessageCreate",
  "ParticipantsLeave"
]
```

### dm_event.fields

**dm_event.fields**  
Type: `enum<string>[]`  

A comma separated list of DmEvent fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "attachments",
  "created_at",
  "dm_conversation_id",
  "entities",
  "event_type",
  "id",
  "participant_ids",
  "referenced_tweets",
  "sender_id",
  "text"
]
```

### expansions

**expansions**  
Type: `enum<string>[]`  

A comma separated list of fields to expand.  
Minimum length: `1`  

**Example**:  
```json
[
  "attachments.media_keys",
  "participant_ids",
  "referenced_tweets.id",
  "sender_id"
]
```

### media.fields

**media.fields**  
Type: `enum<string>[]`  

A comma separated list of Media fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

### user.fields

**user.fields**  
Type: `enum<string>[]`  

A comma separated list of User fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### tweet.fields

**tweet.fields**  
Type: `enum<string>[]`  

A comma separated list of Tweet fields to display.  
Minimum length: `1`  

**Example**:  
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

### Response Status

**200**  
**Content-Type**: `application/json`  

The request has succeeded.

### Response Data

**data**  
Type: `object[]`  
Minimum length: `1`  

### Response Errors

**errors**  
Type: `object[]`  
Minimum length: `1`  

### Response Includes

**includes**  
Type: `object`  

### Response Meta

**meta**  
Type: `object`  
```



## Page: https://docs.x.com/x-api/posts/recent-search-counts

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### query

*Type:* `string`  
*Required:* `required`  

One query/rule/filter for matching Posts. Refer to [https://t.co/rulelength](https://t.co/rulelength) to identify the max query length.  
Required string length: `1 - 4096`  

**Example:**  
```json
"(from:TwitterDev OR from:TwitterAPI) has:media -is:retweet"
```

### start_time

*Type:* `string<date-time>`  

YYYY-MM-DDTHH:mm:ssZ. The oldest UTC timestamp (from most recent 7 days) from which the Posts will be provided. Timestamp is in second granularity and is inclusive (i.e. 12:00:01 includes the first second of the minute).

### end_time

*Type:* `string<date-time>`  

YYYY-MM-DDTHH:mm:ssZ. The newest, most recent UTC timestamp to which the Posts will be provided. Timestamp is in second granularity and is exclusive (i.e. 12:00:01 excludes the first second of the minute).

### since_id

*Type:* `string`  

Returns results with a Post ID greater than (that is, more recent than) the specified ID.  

**Example:**  
```json
"1346889436626259968"
```

### until_id

*Type:* `string`  

Returns results with a Post ID less than (that is, older than) the specified ID.  

**Example:**  
```json
"1346889436626259968"
```

### next_token

*Type:* `string`  

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
Minimum length: `1`

### pagination_token

*Type:* `string`  

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
Minimum length: `1`

### granularity

*Type:* `enum<string>`  
*Default:* `hour`  

The granularity for the search counts results.  
Available options: `minute`, `hour`, `day`

### search_count.fields

*Type:* `enum<string>[]`  

A comma separated list of SearchCount fields to display.  
Minimum length: `1`  

**Example:**  
```json
["end", "start", "tweet_count"]
```

## Response

### 200

The request has succeeded.

#### data

*Type:* `object[]`  
Minimum length: `1`

#### errors

*Type:* `object[]`  
Minimum length: `1`

#### meta

*Type:* `object`
```



## Page: https://docs.x.com/x-api/openapi/returns-the-openapi-specification-document

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [How to get access to the X API](/x-api/getting-started/getting-access#)
- [About the X API](/x-api/getting-started/about-x-api#about-the-x-api)
- [X API v2](/x-api/introduction#x-api-v2)
```



## Page: https://docs.x.com/developer-terms

## Overview

Developer use of X materials and content is subject to and governed by our Developer Policy and agreements.

<div class="developer-cards-grid mint-grid md:mint-grid-cols-3 mint-gap-6 mint-my-8 mint-auto-rows-fr">
- [Developer Agreement](/developer-terms/agreement)
- [Developer Policy](/developer-terms/policy)
- [Ads API Agreement](/developer-terms/ads-api-agreement)
- [X Developer PPU Pilot Agreement](/developer-terms/ppu-pilot-agreement)
- [Restricted use cases](/developer-terms/restricted-use-cases)
- [Geo guidelines](/developer-terms/geo-guidelines)
</div>



## Page: https://docs.x.com/x-api/users/user-lookup-by-usernames

```markdown
## Authorizations

- **Authorization**  
  **Type:** `string`  
  **Location:** `header`  
  **Required:** required  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

- **usernames**  
  **Type:** `string[]`  
  **Required:** required  
  A list of usernames, comma-separated.  
  Required array length: `1 - 100` elements  
  The X handle (screen name) of this User.  
  **Example:**  
  ```json
  "TwitterDev,TwitterAPI"
  ```

- **user.fields**  
  **Type:** `enum<string>[]`  
  A comma separated list of User fields to display.  
  Minimum length: `1`  
  **Example:**  
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **expansions**  
  **Type:** `enum<string>[]`  
  A comma separated list of fields to expand.  
  Minimum length: `1`  
  **Example:**  
  ```json
  [
    "affiliation.user_id",
    "most_recent_tweet_id",
    "pinned_tweet_id"
  ]
  ```

- **tweet.fields**  
  **Type:** `enum<string>[]`  
  A comma separated list of Tweet fields to display.  
  Minimum length: `1`  
  **Example:**  
  ```json
  [
    "article",
    "attachments",
    "author_id",
    "card_uri",
    "community_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "display_text_range",
    "edit_controls",
    "edit_history_tweet_ids",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "media_metadata",
    "non_public_metrics",
    "note_tweet",
    "organic_metrics",
    "possibly_sensitive",
    "promoted_metrics",
    "public_metrics",
    "referenced_tweets",
    "reply_settings",
    "scopes",
    "source",
    "suggested_source_links",
    "text",
    "withheld"
  ]
  ```

## Response

### 200

The request has succeeded.

- **data**  
  **Type:** `object[]`  
  Minimum length: `1`  

- **errors**  
  **Type:** `object[]`  
  Minimum length: `1`  

- **includes**  
  **Type:** `object`  
```



## Page: https://docs.x.com/x-api/lists/follow-a-list

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Status:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

---

## Path Parameters

**id**  
*Type:* `string`  
*Status:* required  

The ID of the authenticated source User that will follow the List.

**Example:**  
```json
"2244994945"
```

---

## Body

*Content-Type:* `application/json`

**list_id**  
*Type:* `string`  
*Status:* required  

The unique identifier of this List.

**Example:**  
```json
"1146654567674912769"
```

---

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/posts/filtered-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Filtered Stream Webhooks API](/x-api/webhooks/stream/introduction#)
- [Streaming](/xdks/python/streaming#streaming)
- [Stream filtered Posts](/x-api/stream/stream-filtered-posts#)
```



## Page: https://docs.x.com/x-api/posts/retrieve-posts-that-quote-a-post

```markdown
## Authorizations

- **Authorization**
  - **Type:** string
  - **Location:** header
  - **Required:** required
  - **Description:** Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type:** string
  - **Required:** required
  - **Description:** A single Post ID.
  - **Example:** `"1346889436626259968"`

## Query Parameters

- **max_results**
  - **Type:** integer
  - **Default:** 10
  - **Description:** The maximum number of results to be returned.
  - **Required range:** `10 <= x <= 100`

- **pagination_token**
  - **Type:** string
  - **Description:** This parameter is used to get a specified 'page' of results.
  - **Minimum length:** `1`

- **exclude**
  - **Type:** enum<string>[]
  - **Description:** The set of entities to exclude (e.g. 'replies' or 'retweets').
  - **Minimum length:** `1`
  - **Example:** `["replies", "retweets"]`

- **tweet.fields**
  - **Type:** enum<string>[]
  - **Description:** A comma separated list of Tweet fields to display.
  - **Minimum length:** `1`
  - **Example:**
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

- **expansions**
  - **Type:** enum<string>[]
  - **Description:** A comma separated list of fields to expand.
  - **Minimum length:** `1`
  - **Example:**
    ```json
    [
      "article.cover_media",
      "article.media_entities",
      "attachments.media_keys",
      "attachments.media_source_tweet",
      "attachments.poll_ids",
      "author_id",
      "edit_history_tweet_ids",
      "entities.mentions.username",
      "geo.place_id",
      "in_reply_to_user_id",
      "entities.note.mentions.username",
      "referenced_tweets.id",
      "referenced_tweets.id.attachments.media_keys",
      "referenced_tweets.id.author_id"
    ]
    ```

## Response

### 200

The request has succeeded.

- **data**
  - **Type:** object[]
  - **Minimum length:** `1`

- **errors**
  - **Type:** object[]
  - **Minimum length:** `1`

- **includes**
  - **Type:** object

- **meta**
  - **Type:** object
```



## Page: https://docs.x.com/x-api/posts/post-lookup-by-post-id

```markdown
## Authorizations

- **Authorization**  
  **Type:** string  
  **Location:** header  
  **Required:** required  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**  
  **Type:** string  
  **Required:** required  
  A single Post ID.  
  **Example:**  
  ```json
  "1346889436626259968"
  ```

## Query Parameters

- **tweet.fields**  
  **Type:** enum<string>[]  
  A comma separated list of Tweet fields to display.  
  **Minimum length:** `1`  
  **Available options:** 
  - `article`
  - `attachments`
  - `author_id`
  - `card_uri`
  - `community_id`
  - `context_annotations`
  - `conversation_id`
  - `created_at`
  - `display_text_range`
  - `edit_controls`
  - `edit_history_tweet_ids`
  - `entities`
  - `geo`
  - `id`
  - `in_reply_to_user_id`
  - `lang`
  - `media_metadata`
  - `non_public_metrics`
  - `note_tweet`
  - `organic_metrics`
  - `possibly_sensitive`
  - `promoted_metrics`
  - `public_metrics`
  - `referenced_tweets`
  - `reply_settings`
  - `scopes`
  - `source`
  - `suggested_source_links`
  - `text`
  - `withheld`  
  **Example:**  
  ```json
  [
    "article",
    "attachments",
    "author_id",
    "card_uri",
    "community_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "display_text_range",
    "edit_controls",
    "edit_history_tweet_ids",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "media_metadata",
    "non_public_metrics",
    "note_tweet",
    "organic_metrics",
    "possibly_sensitive",
    "promoted_metrics",
    "public_metrics",
    "referenced_tweets",
    "reply_settings",
    "scopes",
    "source",
    "suggested_source_links",
    "text",
    "withheld"
  ]
  ```

- **expansions**  
  **Type:** enum<string>[]  
  A comma separated list of fields to expand.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "article.cover_media",
    "article.media_entities",
    "attachments.media_keys",
    "attachments.media_source_tweet",
    "attachments.poll_ids",
    "author_id",
    "edit_history_tweet_ids",
    "entities.mentions.username",
    "geo.place_id",
    "in_reply_to_user_id",
    "entities.note.mentions.username",
    "referenced_tweets.id",
    "referenced_tweets.id.attachments.media_keys",
    "referenced_tweets.id.author_id"
  ]
  ```

- **media.fields**  
  **Type:** enum<string>[]  
  A comma separated list of Media fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "alt_text",
    "duration_ms",
    "height",
    "media_key",
    "non_public_metrics",
    "organic_metrics",
    "preview_image_url",
    "promoted_metrics",
    "public_metrics",
    "type",
    "url",
    "variants",
    "width"
  ]
  ```

- **poll.fields**  
  **Type:** enum<string>[]  
  A comma separated list of Poll fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "duration_minutes",
    "end_datetime",
    "id",
    "options",
    "voting_status"
  ]
  ```

- **user.fields**  
  **Type:** enum<string>[]  
  A comma separated list of User fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **place.fields**  
  **Type:** enum<string>[]  
  A comma separated list of Place fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "contained_within",
    "country",
    "country_code",
    "full_name",
    "geo",
    "id",
    "name",
    "place_type"
  ]
  ```

## Response

### 200

The request has succeeded.

- **data**  
  **Type:** object  
  **Example:**  
  ```json
  {
    "author_id": "2244994945",
    "created_at": "Wed Jan 06 18:40:40 +0000 2021",
    "id": "1346889436626259968",
    "text": "Learn how to use the user Tweet timeline and user mention timeline endpoints in the X API v2 to explore Tweet… https://t.co/56a0vZUx7i",
    "username": "XDevelopers"
  }
  ```

- **errors**  
  **Type:** object[]  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    {
      "code": 123,
      "message": "Error message"
    }
  ]
  ```

- **includes**  
  **Type:** object  
  **Example:**  
  ```json
  {
    "media": [],
    "polls": [],
    "places": [],
    "users": []
  }



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters

### Percent encoding parameters

Parts of the X API, particularly those dealing with OAuth signatures, require strings to be encoded according to [RFC 3986, Section 2.1](http://tools.ietf.org/html/rfc3986#section-2.1). Since many implementations of URL encoding algorithms are not fully compatible with RFC 3986, bad encodings are a cause of many OAuth signature errors. For this reason, the exact signing algorithm to use is covered on this page.

This page covers the URL encoding process described in [RFC 3986, Section 2.1](http://tools.ietf.org/html/rfc3986#section-2.1). We encourage you to reference that specification in case of any ambiguity or conflict with this document.

#### Encoding a string

The following algorithm assumes you are encoding a string SRC by copying its values byte-by-byte to a string DST.

**Step 1:** While SRC contains unread bytes, read the next byte (8 bits) from SRC. Typically, this is considered a character, but in the case of encodings where a character may be more than one byte (such as UTF-8), just read the first byte.

**Step 2:** Check whether the read byte matches any of the following ASCII equivalents. The following table has been broken down into rows for legibility, but you only need to determine whether the read byte exists in the table at all, not the specific row.

| Name                  | ASCII characters                                                                                   | Equivalent byte values                                                                                       |
|-----------------------|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Digits                | ‘0’, ‘1’, ‘2’, ‘3’, ‘4’, ‘5’, ‘6’, ‘7’, ‘8’, ‘9’                                                 | 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39                                                 |
| Uppercase letters     | ‘A’, ‘B’, ‘C’, ‘D’, ‘E’, ‘F’, ‘G’, ‘H’, ‘I’, ‘J’, ‘K’, ‘L’, ‘M’, ‘N’, ‘O’, ‘P’, ‘Q’, ‘R’, ‘S’, ‘T’, ‘U’, ‘V’, ‘W’, ‘X’, ‘Y’, ‘Z’ | 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x4F, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A |
| Lowercase letters     | ‘a’, ‘b’, ‘c’, ‘d’, ‘e’, ‘f’, ‘g’, ‘h’, ‘i’, ‘j’, ‘k’, ‘l’, ‘m’, ‘n’, ‘o’, ‘p’, ‘q’, ‘r’, ‘s’, ‘t’, ‘u’, ‘v’, ‘w’, ‘x’, ‘y’, ‘z’ | 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C, 0x6D, 0x6E, 0x6F, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A |
| Reserved characters    | ‘-‘, ‘.’, ‘_’, ‘~’                                                                                | 0x2D, 0x2E, 0x5F, 0x7E                                                                                      |

**Step 2b:** If the byte is not listed in the above table, continue. Any other value must be encoded. **Step 2a:** If the byte is listed in the above table, copy it into DST and go back to Step 1. Characters listed in the above table do not need to be escaped, so you will just copy the byte directly.

**Step 3:** Write the character ‘%’ to DST. The percent character ‘%’ (or 0x25 in hex and 00100101 in binary) indicates that the next two bytes will represent an encoded byte.

**Step 4:** Write two characters representing the uppercase ASCII-encoded hex value of the current byte to DST. This is a bit confusing, so here is an example. Pretend the current byte is 0xE6 (11100110 in binary). This corresponds with the UTF-8 encoded value of ‘æ’. To encode this value, write the character ‘E’ (0x45, from the table above) and then the character ‘6’ (0x36) to DST. The last three characters are written should have been “%E6”. Note that if you write a letter such as A,B,C,D,E or F, you must use the uppercase character.

**Step 5:** Return to Step 1. Keep going until the entirety of SRC is copied to DST.

#### Examples

The following examples may be helpful to compare with the output of your own code. You should consider any differences an error. Spaces encoded as “+” characters are an example of incorrect encoding.

| Original string       | Encoded string                             |
|-----------------------|-------------------------------------------|
| Ladies + Gentlemen    | Ladies%20%2B%20Gentlemen                 |
| An encoded string!    | An%20encoded%20string%21                  |
| Dogs, Cats & Mice     | Dogs%2C%20Cats%20%26%20Mice               |
| ☃                     | %E2%98%83                                  |



## Page: https://docs.x.com/x-api/account-activity/get-a-list-of-the-current-all-activity-type-subscriptions-for-the-specified-webhook

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: **required**

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

**webhook_id**  
*Type*: `string`  
*Required*: **required**

The webhook ID to pull subscriptions for.

**Example**:  
`"1146654567674912769"`

## Response

The request has succeeded.

### Response Data

**data**  
*Type*: `object`  

The list of active subscriptions for a specified webhook.

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type*: `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/resources/tutorials

```markdown
## Tutorials

### Usage monitoring and management

Programmatically monitor and manage your API usage.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/usage-monitoring-and-management)

### Explore a user's Tweets

Learn how to explore a user’s Tweets and mentions using the user Tweet timeline and user mention timeline endpoints from the last 7 days.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/explore-a-users-tweets)

### Getting started with Postman

Learn how to start using Postman to make requests to the X API and X Ads API  
[**View tutorial**](/tutorials/postman-getting-started)

### Getting started with R and v2 of the X API

Learn about using R to connect to the user lookup endpoint and how to work with JSON returned from X API v2.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/getting-started-with-r-and-v2-of-the-twitter-api)

### Getting historical Tweets using the full-archive search endpoint

Learn to use the full-archive search endpoint to search the complete history of public X data, build a dataset by retrieving geo-tagged Tweets, and how to page through the available Tweets for a query.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/getting-historical-tweets-using-the-full-archive-search-endpoint)

### Post-processing X data with the Google Cloud Platform

This guide gives a high-level overview on how to ingest Tweets at scale, and “slice and dice” those Tweets via metadata to narrow them down to a specific category, or sub-categories.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud1)

### Build a simple customer engagement application

Learn how to build a basic chatbot using webhooks and REST API endpoints  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/customer-engagement-application-playbook)

### Developer Guide: X API Toolkit for Google Cloud: Filtered Stream

Learn the basics about the X API and Tweet annotations in addition to gaining experience in Google Cloud, Analytics, and data science foundations.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud1)

### Creating a X bot with Python, OAuth 2.0, and v2 of the X API

Learn more about creating a X bot with Python and OAuth 2.0 using X API v2.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/creating-a-twitter-bot-with-python--oauth-2-0--and-v2-of-the-twi)

### How to build an autoresponder with Autohook and the Account Activity API

Use the Account Activity API to configure a webhook, set up OAuth, and send a message for replying in real time.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/how-to-build-a-complete-twitter-autoresponder-autohook)

### Get customized Tweet notifications where you want them

Learn how to build an app in Java that publishes links to Tweets based on user defined interests.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/get-customized-tweet-notifications-where-you-want-them)

### Translating plain language to filtering queries

Learn about taking rules articulated in English and transform them into filtering rules using the appropriate X premium operators and syntax.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/translating-plain-language-to-pt-rules)

### Step-by-step guide to making your first request to the X API v2

This is a detailed walkthrough of all the basic steps for getting started with X API v2 from sign up to endpoint request.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/step-by-step-guide-to-making-your-first-request-to-the-twitter-api-v2)

### Getting started with the Account Activity API

Learn about X’s webhook-based Account Activity API to get started with securing webhooks, authentication, and receiving events.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/getting-started-with-the-account-activity-api)

### Kickstart your X bot with our Glitch example written in Python

Use Python to get started with the X API and engage with the public conversation by creating a X Bot.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/kickstart-your-twitter-bot-with-our-glitch-example-written-in-py)

### Developer Guide: X API Toolkit for Google Cloud: Enterprise API

Use the X API Toolkit for Google Cloud: Enterprise API to install a trend detection framework in under an hour.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud11)

### Developer Guide: X API toolkit for Google Cloud: Recent Search

Learn the basics about X API as well as Google Cloud, Analytics, and the foundations of data science.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud)

### How to build a live scoreboard using X

How to build a chatbot that privately receives scores and Tweets out leaderboard updates.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/building-a-live-leaderboard-on-twitter)

### Measure Tweet performance

Build a simple tool to understand how users’ Tweets are performing in the world.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/measure-tweet-performance)

### One-time Historical PowerTrack jobs

Learn more about the steps that you will go through when accessing our one-time Historical PowerTrack offering.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/one-time-historical-powertrack-jobs)

### Choosing a historical API

Learn how to create moments of delight informed by customer context.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/choosing-historical-api)

### Retrieve a list of user mentions from a thread of Tweet replies

Learn how to quickly and easily retrieve all usernames mentioned in a thread of replies on X  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/retrieve-user-mentions-from-thread)

### Determining Tweet Types

Learn about the four different types of Tweets and how to programmatically detect them.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/determining-tweet-types)

### How to analyze the sentiment of your own Tweets

Learn how to analyze the sentiment of your Tweet timeline.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/how-to-analyze-the-sentiment-of-your-own-tweets)

### Filtering Tweets by location

Learn how to filter Tweets by location.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/filtering-tweets-by-location)

### Building an app to stream Tweets in real-time

Build a real-time Tweet streaming app to listen for and display Tweets based on your own topics of interest.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/building-an-app-to-stream-tweets)

### Authenticating with the X API for Enterprise

Learn about the different authentication methods necessary to access the X enterprise APIs.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/authenticating-with-twitter-api-for-enterprise)

### Analyze past conversations using search Tweets

Search for topics or keywords and analyze the related conversation using the v2 recent search endpoint  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/analyze-past-conversations)

### How to store streaming Tweets in a Google Sheet

Learn to consume X API filtered stream endpoint data and store it into a Google Sheets  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/how-to-store-streaming-tweets-in-a-google-sheet)

### Learning path: How to detect signal from noise and build powerful filtering rules

Learn how to build robust rulesets to effectively filter large volumes of X data and identify meaningful insights with PowerTrack  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/building-powerful-enterprise-filters)

### Consuming streaming data

Tips for consuming streaming data.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/consuming-streaming-data)

### Using Twurl

Learn how to use twurl to make requests to the X Ads API  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/using-twurl)

### Using Search Tweets and Twilio to solve a problem

Learn how I used the Search X API along with Twilio to build a text message alert whenever the @NYCASP account Tweets about alternate side of the street parking information.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/nyc-parking)

### Getting started with converting JSON objects to CSV

Search for topics, and then output the returned data into CSV format.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/five-ways-to-convert-a-json-object-to-csv)

### Advanced filtering for geo data

Learn more about the available geo data, operators, and how to build effective filters to target both Tweet level and account level geo in Tweets  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/advanced-filtering-for-geo-data)

### Uploading Media

Learn how to use twurl to upload media to an account  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/uploading-media)

### Stream Tweets in real-time

Surface and stream Tweets and conversations as they happen.  
[**View tutorial**](https://developer.x.com/en/docs/tutorials/stream-tweets-in-real-time)
```



## Page: https://docs.x.com/x-api/posts/portuguese-language-firehose-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream Portuguese Posts](/x-api/stream/stream-portuguese-posts#)
- [Streaming](/xdks/python/streaming#streaming)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
```



## Page: https://docs.x.com/x-api/posts/get-last-28hr-metrics-for-posts

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

### tweet_ids

**tweet_ids**  
*Type:* `string[]`  
*Required:* required  

List of PostIds for 28hr metrics.  
Required array length: `1 - 25` elements  
Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

**Example:**
```json
["20"]
```

### granularity

**granularity**  
*Type:* `enum<string>`  
*Required:* required  

Granularity of metrics response.  
Available options: `Daily`, `Hourly`, `Weekly`, `Total`  

**Example:**
```json
"Total"
```

### requested_metrics

**requested_metrics**  
*Type:* `enum<string>[]`  
*Required:* required  

Request metrics for historical request.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

### engagement.fields

**engagement.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Engagement fields to display.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

## Response

The request has succeeded.

### data

**data**  
*Type:* `object[]`  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

### errors

**errors**  
*Type:* `object[]`  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/returns-user-objects-that-follow-a-list-by-the-provided-list-id

```markdown
## Authorizations

- **Authorization**  
  **Type:** string  
  **Location:** header  
  **Required:** required  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**  
  **Type:** string  
  **Required:** required  
  The ID of the List.  
  **Example:**  
  ```json
  "1146654567674912769"
  ```

## Query Parameters

- **max_results**  
  **Type:** integer  
  **Default:** 100  
  The maximum number of results.  
  **Required range:** `1 <= x <= 100`

- **pagination_token**  
  **Type:** string  
  This parameter is used to get a specified 'page' of results.  
  **Required string length:** `1 - 19`

- **user.fields**  
  **Type:** enum<string>[]  
  A comma separated list of User fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **expansions**  
  **Type:** enum<string>[]  
  A comma separated list of fields to expand.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "affiliation.user_id",
    "most_recent_tweet_id",
    "pinned_tweet_id"
  ]
  ```

- **tweet.fields**  
  **Type:** enum<string>[]  
  A comma separated list of Tweet fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "article",
    "attachments",
    "author_id",
    "card_uri",
    "community_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "display_text_range",
    "edit_controls",
    "edit_history_tweet_ids",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "media_metadata",
    "non_public_metrics",
    "note_tweet",
    "organic_metrics",
    "possibly_sensitive",
    "promoted_metrics",
    "public_metrics",
    "referenced_tweets",
    "reply_settings",
    "scopes",
    "source",
    "suggested_source_links",
    "text",
    "withheld"
  ]
  ```

## Response

### 200

The request has succeeded.

- **data**  
  **Type:** object[]  
  **Minimum length:** `1`

- **errors**  
  **Type:** object[]  
  **Minimum length:** `1`

- **includes**  
  **Type:** object

- **meta**  
  **Type:** object
```



## Page: https://docs.x.com/x-api/lists/remove-a-list-member

```markdown
## Authorizations

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: **required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

### id

**id**  
*Type*: `string`  
*Required*: **required**  

The ID of the List to remove a member.

**Example**:  
```json
"1146654567674912769"
```

### user_id

**user_id**  
*Type*: `string`  
*Required*: **required**  

The ID of User that will be removed from the List.

**Example**:  
```json
"2244994945"
```

## Response

**200**  
*Content-Type*: `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type*: `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type*: `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/posts/adddelete-rules

```markdown
<div class="mdx-content relative" data-page-title="Page Not Found" id="content">

404
# Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Filtered Stream Webhooks API](/x-api/webhooks/stream/introduction#)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
- [Streaming](/xdks/python/streaming#streaming)

</div>
```



## Page: https://docs.x.com/fundamentals/authentication/guides/authentication-best-practices

Your API keys and tokens should be guarded very carefully.   
These credentials are directly tied to your [developer App](/resources/fundamentals/developer-apps) and those X account that have authorized you to make requests on behalf of them. If your keys are compromised, bad actors could use them to make requests to the X endpoints on behalf of your developer App or its authorized users, which could mean their requests might cause you to hit unexpected rate limits, use up your paid access allotment, or even cause your developer App to be suspended.  
The following sections include best practices that should be considered when managing your API keys and tokens.

## Regenerate API keys and tokens

In the event that you believe that your API keys has been exposed, you should regenerate your API keys by following these steps:

1. Navigate to the [developer portal’s “Projects and Apps” page](https://developer.x.com/en/portal/projects-and-apps.html).
2. Click on the “Keys and tokens” icon (🗝 ) next to the relevant App.
3. Click on the “Regenerate” button next to the set of keys and tokens that you would like to regenerate. 

If you would prefer to regenerate your Access Tokens or Bearer Tokens programmatically, you can do so using our authentication endpoints.

- If you would like to regenerate your Access Tokens, you must invalidate your tokens using the [POST oauth/invalidate_token](/resources/fundamentals/authentication/api-reference#post-oauth2-invalidate-token) endpoint, then regenerate your tokens using the [3-legged OAuth flow](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens).
- If you would like to regenerate your Bearer Token, you must invalidate your token using the [POST oauth2/invalidate_token](/resources/fundamentals/authentication/api-reference#post-oauth2-invalidate-token) endpoint, then regenerate your token using the [POST oauth2/token](/resources/fundamentals/authentication/api-reference#post-oauth2-token) endpoint.

## Having a central file for your secrets

Having a file such as .ENV file or any other sort of .yaml file to contain your secrets is an option that could be helpful but be sure to have a strong .gitignore file that can prevent you from accidentally committing these to a git repository. 

## Environment variables

Writing code that utilizes environment variables might be helpful.   
An example of this is as follows written in Python:

```python
import os

consumer_key = os.environ.get("CONSUMER_KEY")
consumer_secret = os.environ.get("CONSUMER_SECRET")
```

Inside of your terminal you would want to write something like this:

```shell
export CONSUMER_KEY='xxxxxxxxxxxxxxxxxxx'
export CONSUMER_SECRET='xxxxxxxxxxxxxxxxxxxxxxx'
```

## Source code and version control

The most common security mistakes made by developers are having API keys and tokens committed to source code in accessible version control systems like GitHub and BitBucket. Many of these code repositories are publicly accessible. This mistake is made so often in public code repositories that there are lucrative bots that scrape for API keys.

- Use server environment variables. By storing API keys in environment variables, you keep them out of your code and version control. This also allows you to use different keys for different environments easily.
- Use a configuration file excluded from source control. Add the filename to your [.gitignore](https://git-scm.com/docs/gitignore) file to exclude the file from being tracked by version control.
- If you remove the API keys from your code after you have used version control, the API keys are likely still accessible by accessing previous versions of your codebase. Regenerate your API keys, as described in the next section.

## Databases

If you need to store your access tokens in a database, please keep the following in mind:

- Restrict access to the database in a way such that the access tokens are only readable by the owner of the token.
- Restrict edit/write privileges to the database table for access tokens - this should be automated with the key management system.
- Encrypt access tokens before storing in any data stores.

## Password management tools

Password management tools such as 1password or Last Pass can be helpful in keeping your keys and tokens in secure place. You might want to avoid sharing these in side of a shared team password management tool.

## Web storage & cookies

There are two types of web storage: LocalStorage and SessionStorage. These were created as improvements to using Cookies since the storage capacity for web storage is much higher than Cookie storage. However, there are different pros and cons to each of these storage options.  

**Web Storage: LocalStorage**  
Anything stored in local web storage is persistent. This means that the data will persist until the data is explicitly deleted. Depending on the needs of your project, you might view this as a positive. However, you should be mindful of using LocalStorage, since any changes/additions to data will be available on all future visits to the webpage in question. We would not usually recommend using LocalStorage, although there may be a few exceptions to this. If you decide to use LocalStorage, it is good to know that it supports the same-origin policy, so all data stored here will only be available via the same origin. An added performance perk of using LocalStorage would be a resulting decrease in client-server traffic since the data does not have to be sent back to the server for every HTTP request.  

**Web Storage: SessionStorage**  
SessionStorage is similar to LocalStorage, but the key difference is that SessionStorage is not persistent. Once the window (or tab, depending on which browser you are using) that was used to write to SessionStorage is closed, the data will be lost. This is useful in restricting read access to your token within a user session. Using SessionStorage is normally more preferable than LocalStorage when thinking in terms of security. Like LocalStorage, the perks of same-origin policy support and decreased client-server traffic apply to SessionStorage as well.  

**Cookies**  
Cookies are the more traditional way to store session data. You can set an expiration time for each cookie, which would allow for ease of revocability and restriction of access. However, the client-server traffic would definitely increase when using cookies, since the data is being sent back to the server for every HTTP request. If you decide to use cookies, you need to protect against session hijacking. By default, cookies are sent in plaintext over HTTP, which makes their contents vulnerable to packet sniffing and/or man-in-the-middle attacks where attackers may modify your traffic. You should always enforce HTTPS to protect your data in transit. This will provide confidentiality, integrity (of the data), and authentication. However, if your web application or site is available both through HTTP and HTTPS, you will also want to use the ‘Secure’ flag on the cookie. This will prevent attackers from being able to send links to the HTTP version of your site to a user and listening in on the resulting HTTP request generated.  
Another secondary defense against session hijacking when using cookies would be to validate the user’s identity again before any high-impact actions are carried out. One other flag to consider for improving the security of your cookies would be the ‘HttpOnly’ flag. This flag tells the browser that the cookie in question shall only be accessible from the server specified. Any attempts made by client-side scripts would be forbidden by this flag, therefore helping to protect against most cross-site scripting (XSS) attacks.



## Page: https://docs.x.com/fundamentals/developer-apps

## Overview

If you have existing Apps, you can view, edit, or delete them via the [developer portal’s App page](https://developer.x.com/en/portal/projects-and-apps).

Accessing the X API and X Ads API requires a set of [authentication](https://developer.x.com/resources/fundamentals/authentication) credentials, also known as keys and tokens, that you must pass with each request. These credentials can come in different forms depending on the type of authentication that is required by the specific endpoint that you are using.

Here are the different credentials that you can generate in your App and how to use them:

- **[API Key and Secret](https://developer.x.com/resources/fundamentals/authentication#api-key-and-secret)**: Essentially the username and password for your App. You will use these to authenticate requests that require [OAuth 1.0a User Context](https://developer.x.com/resources/fundamentals/authentication#oauth-1-0a-2), or to generate other tokens such as user Access Tokens or App Access Token.
  
- **[Access Token and Secret](https://developer.x.com/resources/fundamentals/authentication#obtaining-access-tokens-using-3-legged-oauth-flow)**: In general, Access Tokens represent the user that you are making the request on behalf of. The ones that you can generate via the developer portal represent the user that owns the App. You will use these to authenticate requests that require [OAuth 1.0a User Context](https://developer.x.com/resources/fundamentals/authentication#oauth-1-0a-2). If you would like to make requests on behalf of another user, you will need to use the 3-legged OAuth flow for them to authorize you.
  
- **[Client ID and Client Secret](https://developer.x.com/resources/fundamentals/authentication#oauth-2-0)**: These credentials are used to obtain a user Access Token with OAuth 2.0 authentication. Similar to OAuth 1.0a, the user Access Tokens are used to authenticate requests that provide private user account information or perform actions on behalf of another account but, with fine-grained scope for greater control over what access the client application has on the user.
  
- **[App only Access Token](https://developer.x.com/resources/fundamentals/authentication#bearer-token-also-known-as-app-only)**: You will use this token when making requests to endpoints that respond with information publicly available on X.

In addition to generating the keys and tokens necessary to make X API requests, you will also be able to set access [permissions](https://developer.x.com/resources/fundamentals/developer-apps#app-permissions), document the use case or purpose for the App, define a [callback URL](https://developer.x.com/resources/fundamentals/developer-apps#callback-urls), and modify other settings related to your App developer environment from within the [management dashboard](https://developer.x.com/en/portal/projects-and-apps).

### Apps and Projects

You can use Apps and [Projects](https://developer.x.com/resources/fundamentals/projects) to help organize your work with the X Developer Platform by use case. Each Project can include one App with the Free X API plan, up to two Apps with the Basic plan, and up to three Apps with the Pro plan.

If you would like to access the new [X API v2](https://developer.x.com/x-api/introduction) endpoints, you will be required to use keys and tokens from an App that is associated with a Project.

If you have Apps that were created before we launched Projects, they will be visible in the section entitled “Standalone Apps”. Standalone Apps are Apps outside of the Project structure. If you attach a Standalone App to a Project, it will then be able to make requests to the v2 endpoints.

### Developer portal dashboard

You can [visit the dashboard](https://developer.x.com/content/developer-twitter/en/apps) to manage the Apps associated with your account. To learn more, please visit our documentation page on the [developer portal](https://developer.x.com/resources/fundamentals/developer-portal). The dashboard allows developers to quickly and easily perform the following tasks:

- View your existing Standalone Apps and their associated App ID.
- Create a new Project, App, or standalone App.
- Delete an unused Project or App.
- Review or update a specific App’s settings, including updating name, description, website, callback URL, and [permissions](https://developer.x.com/resources/fundamentals/developer-apps#app-permissions).
- Regenerate App specific credentials like API Key & Secret, App Access Token, and the App owner’s user Access Tokens.

### Signing up for access

If you have existing X Apps, you can view and edit your Apps via the X [App dashboard](https://developer.x.com/content/developer-twitter/en/portal/projects-and-apps) if you are logged into your X account on developer.x.com. Please note you will **not** need to sign up for an account to manage any and all Apps that were previously created on developer.x.com.

If you need to create a new X App, you will need to have [signed up for a developer account](https://developer.x.com/en/portal/petition/essential/basic-info). If you are a member of a [team account](https://developer.x.com/resources/fundamentals/developer-portal#team-management), you must be assigned an admin role to create a new App.

### Automated Account labeling for bots

You can add an Automated Account label to your bot accounts to let users on X know that your bot is an automated account. These bots perform programmed actions through the X API. When you add an Automated Account label to your bot, you build trust with your audience, legitimize your account, and set yourself apart from spammy bots. This helps people on X better understand your account’s purpose when interacting with your bot.

To attach a label to your bot account, follow these steps:

1. Go to your account settings
2. Select “Your account”
3. Select “Automation”
4. Select “Managing account”
5. Next, select the X account, which runs your bot account
6. Enter your password to log in
7. Finally, you should see confirmation that the label has been applied to your account.

---

## App management

### Introduction

The [X App dashboard](https://developer.x.com/en/portal/projects-and-apps) allows developers to quickly and easily perform the following tasks:

- View your existing Apps and [Projects](https://developer.x.com/resources/fundamentals/projects) and their associated App ID.
- Create a new Project or standalone App.
- Delete a Project, App, or standalone App.
- Open up a specific App’s settings by clicking into the App’s settings. Within the settings, you can see the App details, keys and tokens, and permissions.
- Update your App’s user authentication settings to use either OAuth 1.0a or OAuth 2.0.

> **Note:** All App keys and tokens are no longer viewable within the Developer Portal and must be saved securely once generated. We recommend using a password manager to store your keys and tokens. You can reveal an API Key hint to help you match your credential to their corresponding App.

### App Settings

#### App details

Here you can edit the App icon, App name, App description, your website URL, [callback URLs/redirect URIs](https://developer.x.com/resources/fundamentals/developer-apps#callback-urls), terms of service URL, privacy policy URL, organization name, organization URL, and purpose or use case of the App.

OAuth 2.0 and OAuth 1.0a are authentication methods that allow users to sign in to your App with X. They also allow your App to make specific requests on behalf of authenticated users. You can turn on one, or both methods for your App.

It is important to keep this information up to date. Your App name and website URL will be shown as the source within metadata for any Tweets created programmatically by your application. If you change the use case of a X App, be sure to update the use case in these settings in order to ensure you are in compliance with the [Developer Terms](https://developer.x.com/content/developer-twitter/en/developer-terms/agreement-and-policy).

If your application has a tag showing ‘suspended’ this is because your app is in violation of one or more of X’s [developer terms](https://developer.x.com/en/developer-terms.html) such as our [automation rules](https://help.x.com/en/rules-and-policies/twitter-automation). The developer platform policy team will communicate with developers through the email address set up on the App owner’s X account, to review this email address please review your [X account settings](https://x.com/settings/your_twitter_data/account). Notification emails about suspensions will be sent to this email address with the title similar to “Application suspension notice” and will have specific information on what to do next. To work with the X team to address suspensions, please check your email for specific instructions, or use our [platform help form](https://help.x.com/forms/platform).

#### Keys and tokens

Inside of an App in a Project or via a standalone App you can view, regenerate, or revoke the following tokens:

- [API Key (Consumer Key) and API Secret (Consumer Secret)](https://developer.x.com/resources/fundamentals/authentication#api-key-and-secret)
- [App Access Token](https://developer.x.com/resources/fundamentals/authentication#bearer-token-also-known-as-app-only)
- [User Access Token and Access Token Secret](https://developer.x.com/resources/fundamentals/authentication#obtaining-access-tokens-using-3-legged-oauth-flow) - The Access Token and Secret available within the developer portal relates to the user that owns the App.

**Please note** - If you would like to make requests on behalf of a different user (in other words, not the user that owns the App), you will have to use either the [OAuth 1.0a 3-legged OAuth flow](https://developer.x.com/resources/fundamentals/authentication/obtaining-user-access-tokens) or OAuth 2.0 [Authorization Code with PKCE flow](https://developer.x.com/resources/fundamentals/authentication#oauth-2-0-authorization-code-flow-with-pkce-2) to generate a set of user Access Tokens. You will then use these user-specific tokens in your request to the API.

#### User Authentication Settings

You can select your App’s authentication settings to be OAuth 1.0a or OAuth 2.0. OAuth 2.0 can be used with the X API v2 only. OAuth 2.0 allows you to pick specific fine-grained scopes which give you specific permissions on behalf of a user. OAuth 1.0a can be used with X API v1.1 and v2 and uses broad authorization with coarse scopes.

#### OAuth 1.0a Application-user Permissions

If you are the App owner, you can adjust the permissions of the App (read-only; read and write; or read, write and direct messages). This controls which resources and events you have access to via X APIs (note: some resources require further permission from X directly).

You can also toggle on and off your Apps’ ability to ask for user email addresses on this page (this requires a Terms of Service URL and a Privacy Policy URL to be present on the “App details” page).

#### OAuth 2.0 Type of App

If you select OAuth 2.0 as your user authentication method you will need to select the type of App you are creating. Your options are Native App, Single page App, Web App, Automated App or bot. Native App and Single page Apps are public clients and Web App and Automated App or bots are confidential clients.

Confidential clients securely authenticate with the authorization server. They keep your client secret safe. Public clients are applications usually running in a browser or on a mobile device and are unable to use your client secrets. If you select a type of App that is a confidential client, you will be provided with a client secret.

---

## App permissions

### OAuth 1.0a App permissions

App permissions describe the access level for OAuth 1.0a application-user authentication. App permissions are configured per application within your [X App](https://developer.x.com/resources/fundamentals/developer-apps) settings.

There are three levels of permission available:

1. Read only
2. Read and write
3. Read, write and access Direct Messages

An additional permission exists to request visibility of a user’s email address - this can be combined with any of the three levels listed above.

If a permission level is changed, any user tokens already issued to that X app must be discarded and users must re-authorize the App in order for the token to inherit the updated permissions.

A good practice is to request *only the minimum level of access* to a user’s account data that an application or service requires.

### Read only

This permission level permits read access to X resources, including (for example) a user’s Tweets, home timeline, and profile information. It does not allow access to read a user’s Direct Messages, and it does not allow to update any element or object.

### Read and write

This permission level permits read and write access to X resources. In addition to allowing read access, it also allows posting Tweets, following users, or updating elements of a user’s profile information. It also allows hiding replies on behalf of the authenticating user. This permission level does not allow any access to Direct Messages (including read, write, or delete).

### Read, write and access Direct Messages

This permission level includes access to all of the above and adds the ability to read, write and delete Direct Messages on behalf of a user.

- [POST /2/dm_conversations/:dm_conversation_id/messages](https://developer.x.com/x-api/direct-messages/send-a-new-message-to-a-dm-conversation)
- [POST /2/dm_conversations/](https://developer.x.com/x-api/direct-messages/create-a-new-dm-conversation)
- [POST /2/dm_conversations/with/:participant_id/messages](https://developer.x.com/x-api/direct-messages/send-a-new-message-to-a-user)
- [GET /2/dm_conversations/with/:user_id/dm_events](https://developer.x.com/x-api/direct-messages/get-dm-events-for-a-dm-conversation)
- [GET /2/dm_conversations/:dm_conversation_id/dm_events](https://developer.x.com/x-api/direct-messages/get-dm-events-for-a-dm-conversation-1)
- [GET /2/dm_events](https://developer.x.com/x-api/direct-messages/get-recent-dm-events)

### Determining permissions

All authenticated API requests return an `x-access-level` header in the HTTP response. The value of the header shows the current permission level in use. Possible values are read, read-write, and read-write-directmessages.

---

## Callback URLs

The OAuth 1.0a User Context and OAuth 2.0 Authorization Code with PKCE authentication methods enable developers to make requests on behalf of different X users that have worked through a specific sign-in flow. Currently, there are two flows that you can use to enable users to authorize your application:

- [OAuth 2.0 authorization code flow with PKCE](https://developer.x.com/resources/fundamentals/authentication#oauth-2-0-authorization-code-flow-with-pkce-2)
- [OAuth 1.0a 3-legged OAuth flow](https://developer.x.com/resources/fundamentals/authentication#obtaining-access-tokens-using-3-legged-oauth-flow) (and separately, the [Sign in with X flow](https://developer.x.com/resources/fundamentals/authentication#log-in-with-x))

As users work through these flows, they need a web page or location to be sent to after they have successfully logged in and provided authorization to the developer’s App. This follow-up webpage or location is called a callback URL.

When setting up these flows for their potential users to work through, developers must pass a callback URL with their requests to the authentication endpoints that make up the flows mentioned earlier. For example, developers using OAuth 1.0a User Context must pass the `callback_url` parameter when making a request to the [GET oauth/request_token](https://developer.x.com/resources/fundamentals/authentication#post-oauth-request-token) endpoint. Similarly, developers using OAuth 2.0 Authorization Code with PKCE must pass the `redirect_uri` parameter with their request to the GET oauth2/authorize endpoint.

In addition to using these parameters, the developer must also make sure that the callback URL has also been added to their [App’s](https://developer.x.com/resources/fundamentals/developer-apps) callback URL allowlist, which can be found on the [developer portal’s](https://developer.x.com/resources/fundamentals/developer-portal) App settings page.

If set up properly, developers will be directed to the callback URL after successfully signing in to X as part of these flows.

### Things to keep in mind

When you are setting up your callback URLs, there are a few things that you should keep in mind:

**HTTP encode your query parameters**  
Since you are passing the callback URL as a query parameter with the `callback_url` or `redirect_uri` parameters, please make sure that you HTTP encode the URL.

**Callback URL limits**  
There is a hard limit of 10 callback URLs in the X Apps dashboard. Your callback URL should always be an exact match between your allow listed callback URL that you add to the Apps dashboard and the parameter you add in the authorization flow.

If you wish to include request-specific data in the callback URL, you can use the `state` parameter to store data that will be included after the user is redirected. It can either encode the data in the `state` parameter itself or use the parameter as a session ID to store the state on the server.

**Don’t use localhost as a callback URL**  
Instead of using localhost, please use a custom host locally or http(s)://127.0.0.1.

**Custom protocol URLs**  
If you would like to take advantage of mobile deep linking, you can utilize custom protocol URLs with a path and domain part, such as twitter://callback/path. However, we do have a list of disallowed protocols that you will need to avoid. You can review the list of disallowed protocols below.

**Disallowed protocols**

| Protocol    | Protocol    |
|-------------|-------------|
| `vbscript`  | `ldap`      |
| `javascript`| `mailto`    |
| `vbs`       | `mmst`      |
| `data`      | `mmsu`      |
| `mocha`     | `msbd`      |
| `keyword`   | `rtsp`      |
| `livescript`| `mso-offdap`|
| `ftp`       | `snews`     |
| `file`      | `news`      |
| `gopher`    | `nntp`      |
| `acrobat`   | `outlook`   |
| `callto`    | `stssync`   |
| `daap`      | `rlogin`    |
| `itpc`      | `telnet`    |
| `itms`      | `tn3270`    |
| `firefoxurl`| `shell`    |
| `hcp`       | `sip`       |

### Error Example

If you use a callback URL that hasn’t been properly added to your App’s settings in the developer portal, you will receive the following error message:

**OAuth 1.0a**

```
HTTP 403 - Forbidden
{
  "errors": [
    {
      "code": 415,
      "message": "Callback URL not approved for this client application. Approved callback URLs can be adjusted in your application settings."
    }
  ]
}
```

**OR**

**OAuth 2.0**

```
HTTP 400
{
  "error": "invalid_request",
  "error_description": "Value passed for the redirect uri did not match the uri of the authorization code."
}
```

**Troubleshooting**  
If you receive an error, please make sure that the callback URL that you are using in your authentication requests is HTTP encoded, and that it matches a callback URL that has been added to the allowlist for the App whose keys and tokens you are using in your request.



## Page: https://docs.x.com/x-api/posts/firehose-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Streaming](/xdks/python/streaming#streaming)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
- [X API v2](/x-api/introduction#x-api-v2)
```



## Page: https://docs.x.com/resources/api-reference-index

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [OAuth API reference index](/fundamentals/authentication/api-reference#)
- [Web conversions](/x-ads-api/measurement/web-conversions#api-reference-index)
- [PowerTrack API](/x-api/enterprise-gnip-2.0/powertrack-api#api-reference-index)
```



## Page: https://docs.x.com/x-api/lists/add-a-list-member

```markdown
## Authorizations

- **Authorization**  
  The access token received from the authorization server in the OAuth 2.0 flow.  
  **Type:** `string`  
  **Location:** header  
  **Required:** Yes  

## Path Parameters

- **id**  
  The ID of the List for which to add a member.  
  **Type:** `string`  
  **Required:** Yes  
  **Example:**  
  ```json
  "1146654567674912769"
  ```

## Body

**Content-Type:** `application/json`

- **user_id**  
  Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.  
  **Type:** `string`  
  **Required:** Yes  
  **Example:**  
  ```json
  "2244994945"
  ```

## Response

**Status Code:** `200`  
**Content-Type:** `application/json`  
The request has succeeded.

- **data**  
  **Type:** `object`  

- **errors**  
  **Type:** `object[]`  
  Minimum length: `1`
```



## Page: https://docs.x.com/x-api/posts/hide-replies

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**tweet_id**  
*Type:* `string`  
*Status:* required  

The ID of the reply that you want to hide or unhide.

**Example:**
```json
"1346889436626259968"
```

## Body

*Content-Type:* `application/json`

**hidden**  
*Type:* `boolean`  
*Status:* required  

## Response

### 200

*Content-Type:* `application/json`  

The request has succeeded.

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/overview

X APIs handle enormous amounts of data. The way we ensure this data is secured for developers and users alike is through authentication. There are a few methods for authentication, each listed below.

Most developers will not need to deal with the complexities surrounding authentication since client libraries automatically handle these difficulties.

You can find a list of available client libraries on our [Tools and libraries](https://example.com/resources/tools-and-libraries) page.

## Authentication methods

<div class="card-group not-prose grid gap-x-4 sm:grid-cols-2">
- [OAuth 1.0a User Context](https://example.com/resources/fundamentals/authentication/oauth-1-0a/api-key-and-secret)
  - OAuth 1.0a allows an authorized X developer App to access private account information or perform a X action on behalf of a X account.  
  - [Learn More](https://example.com/resources/fundamentals/authentication/oauth-1-0a/api-key-and-secret)

- [App only](https://example.com/resources/fundamentals/authentication/oauth-2-0/overview)
  - App only Access Token allows a X developer app to access information publicly available on X.  
  - [Learn More](https://example.com/resources/fundamentals/authentication/oauth-2-0/overview)

- [Basic authentication](https://example.com/resources/fundamentals/authentication/basic-auth)
  - Many of X’s enterprise APIs require the use of HTTP Basic Authentication.  
  - [Learn More](https://example.com/resources/fundamentals/authentication/basic-auth)

- [OAuth 2.0 Authorization Code Flow with PKCE](https://example.com/resources/fundamentals/authentication/oauth-2-0/authorization-code)
  - OAuth 2.0 User Context allows you to authenticate on behalf of another account with greater control over an application’s scope, and authorization flows across multiple devices.  
  - [Learn More](https://example.com/resources/fundamentals/authentication/oauth-2-0/authorization-code)
</div>

<div class="callout my-4 px-5 py-4 overflow-hidden rounded-2xl flex gap-3 border border-sky-500/20 bg-sky-50/50 dark:border-sky-500/30 dark:bg-sky-500/10">
**Note:**  
Your App’s API Keys and App only Access Token, as well as your personal Access Token and Access Token Secret can be obtained from the [X developer Apps](https://example.com/resources/fundamentals/developer-apps) section found in the [developer portal](https://example.com/resources/fundamentals/developer-portal).

**If you would like to make requests on behalf of another user**, you will need to generate a separate set of Access Tokens for that user using the [3-legged OAuth flow](https://developer.x.com/resources/fundamentals/authentication/obtaining-user-access-tokens), and pass that user’s tokens with your OAuth 1.0a User Context or OAuth 2.0 user context requests.

## Additional resources

<div class="card-group not-prose grid gap-x-4 sm:grid-cols-2">
- [Guides](https://example.com/resources/fundamentals/authentication/guides)
  - Learn how to generate tokens and authenticate requests using our integration guides.

- [API reference](https://example.com/resources/fundamentals/authentication/api-reference)
  - Review our reference guides for our authentication endpoints.

- [Best practices](https://example.com/resources/fundamentals/authentication/guides/authentication-best-practices)
  - Make sure you protect yourself and understand the best practices for storing your keys and tokens.

- [FAQs](https://example.com/resources/fundamentals/authentication/faq)
  - Question? Visit our FAQs.
</div>



## Page: https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token

### How to connect to endpoints using OAuth 2.0 Authorization Code Flow with PKCE

#### How to connect to the endpoints

To authenticate your users, your App will need to implement an authorization flow. This authorization flow lets you direct your users to an authorization dialog on X. From there, the primary X experience will show the authorization dialog and handle the authorization on behalf of your App. Your users will be able to authorize your App or decline permission. After the user makes their choice, X will redirect the user to your App, where you can exchange the authorization code for an access token (if the user authorized your App), or handle a rejection (if the user did not authorize your App).

#### Working with confidential clients

If you are working with confidential clients, you will need to use a [basic authentication](https://datatracker.ietf.org/doc/html/rfc2617#section-2) scheme for generating an authorization header with base64 encoding while making requests to the token endpoints.

The `userid` and `password` are separated by a single colon (”:”) character within a base64 encoded string in the credentials.

An example would look like this:

```
-header 'Authorization: Basic V1ROclFTMTRiVWhwTWw4M2FVNWFkVGQyTldNNk1UcGphUTotUm9LeDN4NThKQThTbTlKSXQyZm1BanEzcTVHWC1icVozdmpKeFNlR3NkbUd0WEViUA=='
```

If the user agent wishes to send the Client ID “Aladdin” and password “open sesame,” it would use the following header field:

```
Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```

To create the basic authorization header you will need to base64 encoding on your Client ID and Client Secret which can be obtained from your App’s “Keys and Tokens” page inside of the [developer portal.](https://developer.x.com/en/portal/dashboard)

#### Steps to connect using OAuth 2.0

**Step 1: Construct an Authorize URL**

Your App will need to build an authorize URL to X, indicating the scopes your App needs to authorize. For example, if your App needs to lookup Tweets, users and to manage follows, it should request the following scopes:

```
tweet.read%20users.read%20follows.read%20follows.write
```

The URL will also contain the `code_challenge` and state parameters, in addition to the other required parameters. In production you should use a random string for the `code_challenge`.

**Step 2: GET oauth2/authorize**

Have the user authenticate and send the application an authorization code. If you have enabled OAuth 2.0 for your App you can find your Client ID inside your App’s “Keys and Tokens” page.

An example URL to redirect the user to would look like this:

```
https://x.com/i/oauth2/authorize?response_type=code&client_id=M1M5R3BMVy13QmpScXkzTUt5OE46MTpjaQ&redirect_uri=https://www.example.com&scope=tweet.read%20users.read%20follows.read%20follows.write&state=state&code_challenge=challenge&code_challenge_method=plain
```

An example URL with offline_access would look like this:

```
https://x.com/i/oauth2/authorize?response_type=code&client_id=M1M5R3BMVy13QmpScXkzTUt5OE46MTpjaQ&redirect_uri=https://www.example.com&scope=tweet.read%20users.read%20follows.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain
```

Upon successful authentication, the redirect_uri you would receive a request containing the auth_code parameter. Your application should verify the state parameter.

An example request from client’s redirect would be:

```
https://www.example.com/?state=state&code=VGNibzFWSWREZm01bjN1N3dicWlNUG1oa2xRRVNNdmVHelJGY2hPWGxNd2dxOjE2MjIxNjA4MjU4MjU6MToxOmFjOjE
```

**Step 3: POST oauth2/token - Access Token**

At this point, you can use the authorization code to create an access token and refresh token (only if `offline.access` scope is requested). You can make a POST request to the following endpoint:

```
https://api.x.com/2/oauth2/token
```

You will need to pass in the `Content-Type` of `application/x-www-form-urlencoded` via a header. Additionally, you should have in your request: `code`, `grant_type`, `client_id` and `redirect_uri`, and the `code_verifier`.

Here is an example token request for a public client:

```
curl --location --request POST 'https://api.x.com/2/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'code=VGNibzFWSWREZm01bjN1N3dicWlNUG1oa2xRRVNNdmVHelJGY2hPWGxNd2dxOjE2MjIxNjA4MjU4MjU6MToxOmFjOjE' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'client_id=rG9n6402A3dbUJKzXTNX4oWHJ' \
--data-urlencode 'redirect_uri=https://www.example.com' \
--data-urlencode 'code_verifier=challenge'
```

Here is an example using a confidential client:

```
curl --location --request POST 'https://api.x.com/2/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Basic V1ROclFTMTRiVWhwTWw4M2FVNWFkVGQyTldNNk1UcGphUTotUm9LeDN4NThKQThTbTlKSXQyZm1BanEzcTVHWC1icVozdmpKeFNlR3NkbUd0WEViUA==' \
--data-urlencode 'code=VGNibzFWSWREZm01bjN1N3dicWlNUG1oa2xRRVNNdmVHelJGY2hPWGxNd2dxOjE2MjIxNjA4MjU4MjU6MToxOmFjOjE' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'redirect_uri=https://www.example.com' \
--data-urlencode 'code_verifier=challenge'
```

**Step 4: Connect to the APIs**

You are now ready to connect to the endpoints using OAuth 2.0. To do so, you will request the API as you would using [Bearer Token authentication](/resources/fundamentals/authentication/oauth-2-0/application-only). Instead of passing your Bearer Token, you’ll want to use the access token you generated in the last step. As a response, you should see the appropriate payload corresponding to the endpoint you are requesting. This request is the same for both public and confidential clients.

An example of the request you would make would look as follows:

```
curl --location --request GET 'https://api.x.com/2/tweets?ids=1261326399320715264,1278347468690915330' \
--header 'Authorization: Bearer Q0Mzb0VhZ0V5dmNXSTEyNER2MFNfVW50RzdXdTN6STFxQlVkTGhTc1lCdlBiOjE2MjIxNDc3NDM5MTQ6MToxOmF0OjE'
```

**Step 5: POST oauth2/token - refresh token**

A refresh token allows an application to obtain a new access token without prompting the user. You can create a refresh token by making a POST request to the following endpoint: [https://api.x.com/2/oauth2/token](https://api.x.com/2/oauth2/token). You will need to add in the `Content-Type` of `application/x-www-form-urlencoded` via a header. In addition, you will also need to pass in your refresh_token, set your grant_type to be a `refresh_token`, and define your `client_id`.

This request will work for public clients:

```
curl --location --request POST 'https://api.x.com/2/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'refresh_token=bWRWa3gzdnk3WHRGU1o0bmRRcTJ5VUxWX1lZTDdJSUtmaWcxbTVxdEFXcW5tOjE' \
--data-urlencode 'grant_type=refresh_token' \
--data-urlencode 'client_id=rG9n6402A3dbUJKzXTNX4oWHJ'
```

Here is an example of one for confidential clients:

```
curl --location --request POST 'https://api.x.com/2/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Basic V1ROclFTMTRiVWhwTWw4M2FVNWFkVGQyTldNNk1UcGphUTotUm9LeDN4NThKQThTbTlKSXQyZm1BanEzcTVHWC1icVozdmpKeFNlR3NkbUd0WEViUA==' \
--data-urlencode 'refresh_token=bWRWa3gzdnk3WHRGU1o0bmRRcTJ5VUxWX1lZTDdJSUtmaWcxbTVxdEFXcW5tOjE' \
--data-urlencode 'grant_type=refresh_token'
```

**Step 6: POST oauth2/revoke - Revoke Token**

A revoke token invalidates an access token or refresh token. This is used to enable a “log out” feature in clients, allowing you to clean up any security credentials associated with the authorization flow that may no longer be necessary. The revoke token is for an App to revoke a token and not a user. You can create a revoke token request by making a POST request to the following URL if the App wants to programmatically revoke the access given to it:

```
https://api.x.com/2/oauth2/revoke
```

You will need to pass in the `Content-Type` of `application/x-www-form-urlencoded` via a header, your token, and your client_id.

In some cases, a user may wish to revoke access given to an App, they can revoke access by visiting the [connected Apps page](https://x.com/settings/connected_apps).

Here is an example for public clients:

```
curl --location --request POST 'https://api.x.com/2/oauth2/revoke' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'token=Q0Mzb0VhZ0V5dmNXSTEyNER2MFNfVW50RzdXdTN6STFxQlVkTGhTc1lCdlBiOjE2MjIxNDc3NDM5MTQ6MToxOmF0OjE' \
--data-urlencode 'client_id=rG9n6402A3dbUJKzXTNX4oWHJ'
```

This request will work for confidential clients:

```
curl --location --request POST 'https://api.x.com/2/oauth2/revoke' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Basic V1ROclFTMTRiVWhwTWw4M2FVNWFkVGQyTldNNk1UcGphUTotUm9LeDN4NThKQThTbTlKSXQyZm1BanEzcTVHWC1icVozdmpKeFNlR3NkbUd0WEViUA==' \
--data-urlencode 'token=Q0Mzb0VhZ0V5dmNXSTEyNER2MFNfVW50RzdXdTN6STFxQlVkTGhTc1lCdlBiOjE2MjIxNDc3NDM5MTQ6MToxOmF0OjE' \
--data-urlencode 'client_id=rG9n6402A3dbUJKzXTNX4oWHJ'
```



## Page: https://docs.x.com/forms/government-end-user-request

```markdown
<div class="mdx-content relative mt-8 mb-14 prose prose-gray dark:prose-invert" data-page-href="/forms/government-end-user-request" data-page-title="Government End User Request Form" id="content">

<div class="flex justify-center w-full" data-as="iframe">

<iframe class="object-contain form" frameborder="0" src="https://developer.x.com/en/products/x-api/enterprise/government-end-user-request" style="aspect-ratio: 500 / 1000; height: 1000px; width: 500px;"></iframe>

</div>

</div>
```



## Page: https://docs.x.com/enterprise/partner-directory

## Build your business with X Official Partners

Tap into the public conversation on X and turn insights into action with solutions from our partners.

<div style="display: flex; gap: 1rem; align-items: center;">
  <div class="not-prose mint-group">
    [Find a partner](https://partners.x.com/en/find-a-partner)
  </div>
  <div class="not-prose mint-group">
    [Learn more](https://partners.x.com/en/about-the-program)
  </div>
</div>

## Work with a trusted X Official Partner to expand what’s possible for your business

Our partners are vetted for excellence and can provide technology to help you:

- Understand consumer trends and preferences 
- Collect and analyze product and service feedback 
- Engage with customers and resolve issues 
- Be alerted to breaking news and events 
- Create, publish, and analyze content across social channels 
- And more!

## Discover the right Official Partner for your business

[Official Partners represent excellence, value, and trust](https://partners.x.com/en/about-the-program)

Each Official Partner has been selected for the program after an extensive evaluation. Our partners are continuously reviewed by X, as this invitation-only program holds its members to the highest performance standards, in order to deliver great experiences for brands.

## See our partners’ impressive work

<div class="card-group not-prose grid gap-x-4 sm:grid-cols-3">
  <a class="link card mint-block not-prose mint-font-normal mint-group mint-relative mint-my-2 mint-ring-2 mint-ring-transparent mint-rounded-xl mint-bg-white/50 dark:bg-codeblock/50 mint-border mint-border-gray-100 mint-shadow-md dark:mint-shadow-none mint-shadow-gray-300/10 dark:mint-border-gray-800/50 mint-overflow-hidden mint-w-full mint-cursor-pointer hover:!border-primary dark:hover:!border-primary-light" href="https://partners.x.com/en/partner-resources/nasa-uses-twitter-audience-insights-to-take-fans-to-new-frontier" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="mint-w-full mint-aspect-[3/2] mint-bg-white">
        <img alt="NASA uses X audience insights to take fans to new frontiers" class="rounded mint-rounded-none mint-pointer-events-none mint-w-full mint-h-full mint-object-cover" src="https://mintlify.s3-us-west-1.amazonaws.com/x-preview/images/Hero.jpg"/>
      </div>
      <div class="mint-flex mint-flex-col mint-justify-center mint-p-4 mint-flex-1">
        <h2 class="mint-font-semibold mint-text-sm">NASA uses X audience insights to take fans to new frontiers</h2>
      </div>
    </div>
  </a>
  <a class="link card mint-block not-prose mint-font-normal mint-group mint-relative mint-my-2 mint-ring-2 mint-ring-transparent mint-rounded-xl mint-bg-white/50 dark:bg-codeblock/50 mint-border mint-border-gray-100 mint-shadow-md dark:mint-shadow-none mint-shadow-gray-300/10 dark:mint-border-gray-800/50 mint-overflow-hidden mint-w-full mint-cursor-pointer hover:!border-primary dark:hover:!border-primary-light" href="https://partners.x.com/en/partner-resources/the-beauty-in-twitter" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="mint-w-full mint-aspect-[3/2] mint-bg-white">
        <img alt="The beauty in X" class="rounded mint-rounded-none mint-pointer-events-none mint-w-full mint-h-full mint-object-cover" src="https://mintlify.s3-us-west-1.amazonaws.com/x-preview/images/thumbnail-sprinklr.png"/>
      </div>
      <div class="mint-flex mint-flex-col mint-justify-center mint-p-4 mint-flex-1">
        <h2 class="mint-font-semibold mint-text-sm">The beauty in X</h2>
      </div>
    </div>
  </a>
  <a class="link card mint-block not-prose mint-font-normal mint-group mint-relative mint-my-2 mint-ring-2 mint-ring-transparent mint-rounded-xl mint-bg-white/50 dark:bg-codeblock/50 mint-border mint-border-gray-100 mint-shadow-md dark:mint-shadow-none mint-shadow-gray-300/10 dark:mint-border-gray-800/50 mint-overflow-hidden mint-w-full mint-cursor-pointer hover:!border-primary dark:hover:!border-primary-light" href="https://developer.x.com/en/use-cases/build-for-good/extreme-weather" rel="noreferrer" target="_blank">
    <div class="mint-flex mint-flex-col mint-h-full">
      <div class="mint-w-full mint-aspect-[3/2] mint-bg-white">
        <img alt="Analyze #ExtremeWeather conversation on X" class="rounded mint-rounded-none mint-pointer-events-none mint-w-full mint-h-full mint-object-cover" src="https://mintlify.s3-us-west-1.amazonaws.com/x-preview/images/Extreme_369x277.png"/>
      </div>
      <div class="mint-flex mint-flex-col mint-justify-center mint-p-4 mint-flex-1">
        <h2 class="mint-font-semibold mint-text-sm">Analyze #ExtremeWeather conversation on X</h2>
      </div>
    </div>
  </a>
</div>



## Page: https://docs.x.com/x-api/lists/pin-a-list

```markdown
## Authorizations

### Authorization

**Type:** `string`  
**Location:** `header`  
**Status:** required  

The access token received from the authorization server in the OAuth 2.0 flow.

---

## Path Parameters

### id

**Type:** `string`  
**Status:** required  

The ID of the authenticated source User that will pin the List.

**Example:**
```json
"2244994945"
```

---

## Body

**Content-Type:** `application/json`

### list_id

**Type:** `string`  
**Status:** required  

The unique identifier of this List.

**Example:**
```json
"1146654567674912769"
```

---

## Response

**Status Code:** 200  
**Content-Type:** `application/json`  

The request has succeeded.

### Response Data

**Type:** `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**Type:** `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/tools-and-libraries

```markdown
## Tools and Libraries

### X API

The X API is a set of programmatic tools that can be used to learn from and engage with the conversation on X.  
[Explore tools](/x-api/tools-and-libraries/overview) 

### X Ads API

The X Ads API allows you to programmatically integrate with the X Ads platform.  

[Explore tools](/x-ads-api/tools-and-libraries) 

### X for Websites

The X for Websites suite allows you to embed X’s live content into your product and optimize links to your site on X.  
[Explore tools](https://developer.x.com/docs/twitter-for-websites/tools-and-libraries) 

## General Tools

### xurl

A command line tool that can be used across the X APIs, and handles authentication for you.  

[Learn more](https://github.com/xdevplatform/xurl) 

### Postman

[Postman](https://www.getpostman.com/) is a REST client that allows us to make requests to APIs inside of a user interface. Use this guide to get started with this tool.  
[Learn more](/tutorials/postman-getting-started) 

### Embed generator

Use our embed generator to automatically build an embeddable Tweet, timeline, or button that you can add to your web property.  
[Visit publish.x.com](https://publish.x.com/#) 
```



## Page: https://docs.x.com/x-api/posts/user-posts-timeline-by-user-id

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: Yes

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

### id

- **Type**: `string`
- **Required**: Yes

The ID of the User to lookup.

**Example**:
```json
"2244994945"
```

## Query Parameters

### since_id

- **Type**: `string`
- **Required**: No

The minimum Post ID to be included in the result set. This parameter takes precedence over `start_time` if both are specified.

**Example**:
```json
"1346889436626259968"
```

### until_id

- **Type**: `string`
- **Required**: No

The maximum Post ID to be included in the result set. This parameter takes precedence over `end_time` if both are specified.

**Example**:
```json
"1346889436626259968"
```

### max_results

- **Type**: `integer`
- **Required**: No

The maximum number of results.

**Required range**: `5 <= x <= 100`

### pagination_token

- **Type**: `string`
- **Required**: No

This parameter is used to get the next 'page' of results.

**Minimum length**: `1`

### exclude

- **Type**: `enum<string>[]`
- **Required**: No

The set of entities to exclude (e.g. 'replies' or 'retweets').

**Minimum length**: `1`

**Example**:
```json
["replies", "retweets"]
```

### start_time

- **Type**: `string<date-time>`
- **Required**: No

`YYYY-MM-DDTHH:mm:ssZ`. The earliest UTC timestamp from which the Posts will be provided. The `since_id` parameter takes precedence if it is also specified.

### end_time

- **Type**: `string<date-time>`
- **Required**: No

`YYYY-MM-DDTHH:mm:ssZ`. The latest UTC timestamp to which the Posts will be provided. The `until_id` parameter takes precedence if it is also specified.

### tweet.fields

- **Type**: `enum<string>[]`
- **Required**: No

A comma separated list of Tweet fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

### expansions

- **Type**: `enum<string>[]`
- **Required**: No

A comma separated list of fields to expand.

**Minimum length**: `1`

**Example**:
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

### media.fields

- **Type**: `enum<string>[]`
- **Required**: No

A comma separated list of Media fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

### poll.fields

- **Type**: `enum<string>[]`
- **Required**: No

A comma separated list of Poll fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

### user.fields

- **Type**: `enum<string>[]`
- **Required**: No

A comma separated list of User fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### place.fields

- **Type**: `enum<string>[]`
- **Required**: No

A comma separated list of Place fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

## Response

### Response Data

- **Type**: `object[]`
- **Minimum length**: `1`

### Response Errors

- **Type**: `object[]`
- **Minimum length**: `1`

### Response Includes

- **Type**: `object`

### Response Meta

- **Type**: `object`
```



## Page: https://docs.x.com/x-api/spaces/retrieve-the-list-of-users-who-purchased-a-ticket-to-the-given-space

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Status:* `required`  

The ID of the Space to be retrieved.

**Example:**
```json
"1SLjjRYNejbKM"
```

## Query Parameters

**pagination_token**  
*Type:* `string`  

This parameter is used to get a specified 'page' of results.  
Minimum length: `16`

**max_results**  
*Type:* `integer`  
*Default:* `100`  

The maximum number of results.  
Required range: `1 <= x <= 100`

**user.fields**  
*Type:* `enum<string>[]`  

A comma separated list of User fields to display.  
Minimum length: `1`  

**Example:**
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**expansions**  
*Type:* `enum<string>[]`  

A comma separated list of fields to expand.  
Minimum length: `1`  

**Example:**
```json
[
  "affiliation.user_id",
  "most_recent_tweet_id",
  "pinned_tweet_id"
]
```

**tweet.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Tweet fields to display.  
Minimum length: `1`  

**Example:**
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

### 200

The request has succeeded.

**data**  
*Type:* `object[]`  

Minimum length: `1`

**errors**  
*Type:* `object[]`  

Minimum length: `1`

**includes**  
*Type:* `object`  

**meta**  
*Type:* `object`  
```



## Page: https://docs.x.com/x-api/media/image-or-subtitle-media-upload

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: `required`

The access token received from the authorization server in the OAuth 2.0 flow.

---

## Body

### media

- **Type**: `file`
- **Required**: `required`

The file to upload.

### media_category

- **Type**: `enum<string>`
- **Required**: `required`

A string enum value which identifies a media use-case. This identifier is used to enforce use-case specific constraints (e.g. file size) and enable advanced features.

Available options: `tweet_image`, `dm_image`, `subtitles`

**Example**:
```json
"tweet_image"
```

### additional_owners

- **Type**: `string[]`

Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

### media_type

- **Type**: `enum<string>`

The type of image or subtitle.

Available options: `text/srt`, `text/vtt`, `image/jpeg`, `image/bmp`, `image/png`, `image/webp`, `image/pjpeg`, `image/tiff`

**Example**:
```json
"image/png"
```

### shared

- **Type**: `boolean`
- **Default**: `false`

Whether this media is shared or not.

---

## Response

### 200

**Content-Type**: `application/json`

The request has succeeded.

A response from getting a media upload request status.

#### data

- **Type**: `object`

<details>
<summary>Show child attributes</summary>
</details>

#### errors

- **Type**: `object[]`

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/webhooks/delete-webhook-config

```markdown
## Authorizations

**Authorization**  
`string` (header) **required**

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

**webhook_id**  
`string` **required**

The ID of the webhook to delete.

**Example:**  
`"1146654567674912769"`

## Response

The request has succeeded.

### Response Data

**data**  
`object`

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
`object[]`

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/posts/get-historical-metrics-for-posts

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

### tweet_ids

**tweet_ids**  
*Type:* `string[]`  
*Status:* required  

List of PostIds for historical metrics.  
Required array length: `1 - 25` elements.  
Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

**Example:**  
```json
["20"]
```

### end_time

**end_time**  
*Type:* `string<date-time>`  
*Status:* required  

YYYY-MM-DDTHH:mm:ssZ. The UTC timestamp representing the end of the time range.

### start_time

**start_time**  
*Type:* `string<date-time>`  
*Status:* required  

YYYY-MM-DDTHH:mm:ssZ. The UTC timestamp representing the start of the time range.

### granularity

**granularity**  
*Type:* `enum<string>`  
*Status:* required  

Granularity of metrics response.  
Available options: `Daily`, `Hourly`, `Weekly`, `Total`.  

**Example:**  
```json
"Total"
```

### requested_metrics

**requested_metrics**  
*Type:* `enum<string>[]`  
*Status:* required  

Request metrics for historical request.  
Minimum length: `1`.

### engagement.fields

**engagement.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Engagement fields to display.  
Minimum length: `1`.

## Response

The request has succeeded.

### Response Data

**data**  
*Type:* `object[]`  
Minimum length: `1`.

### Response Errors

**errors**  
*Type:* `object[]`  
Minimum length: `1`.
```



## Page: https://docs.x.com/x-api/lists/unfollow-a-list

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

### id

**id**  
*Type:* `string`  
*Required:* `required`  

The ID of the authenticated source User that will unfollow the List.

**Example:**  
```json
"2244994945"
```

### list_id

**list_id**  
*Type:* `string`  
*Required:* `required`  

The ID of the List to unfollow.

**Example:**  
```json
"1146654567674912769"
```

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/guides/log-in-with-x

Use Log in with X, also known as Sign in with X, to place a button on your site or application which allows X users to enjoy the benefits of a registered user account in as little as one click. This works on websites, iOS, mobile, and desktop applications.

## Features

- Ease of use - A new visitor to your site only has to click two buttons in order to log in for the first time.
- X integration - The Log in with X flow can grant authorization to use X APIs on your users’ behalf.
- OAuth based - A wealth of client libraries and example code are compatible with the Log in with X API.

## Available for

- Browsers - If your users can access a browser, you can integrate with Log in with X. [Learn about the browser sign in flow.](#)
- Mobile devices - Any web-connected mobile device can take advantage of Log in with X. [Learn about the mobile sign in flow.](#)

## Implementing Log in with X

The browser and mobile web implementations of Log in with X are based on OAuth. This page demonstrates the requests needed to obtain an access token for the sign in flow.

To use the “Log in with X” flow, please go to your [X app settings](/resources/fundamentals/developer-apps) and ensure that the *“Allow this app to be used to Sign in with X?”* option is enabled.

This page assumes that the reader knows how to sign requests using the OAuth 1.0a protocol. If you want to know how to sign a request, read the [Authorizing a request](/resources/fundamentals/authentication/oauth-1-0a/authorizing-a-request) page.

If you want to check the signing of the requests on this page, the consumer secret used is: `L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg`. This value is for test purposes and will not work for real requests.

The three steps for implementing Log in with X through obtaining a request token, redirecting a user, and converting a request token into an access token are listed below.

### Step 1: Obtaining a request token

To start a sign-in flow, your [X app](/resources/fundamentals/developer-apps) must obtain a request token by sending a signed message to [POST oauth/request_token](#). The only unique parameter in this request is `oauth_callback`, which must be a URL-encoded version of the URL you wish your user to be redirected to when they complete step 2. The remaining parameters are added by the OAuth signing process.

> **Note:** Any [callback URL](/resources/fundamentals/developer-apps#callback-urls) that you use with the [POST oauth/request_token](#) endpoint will have to be registered within the [X app settings](/resources/fundamentals/developer-apps) in the [developer portal](/resources/fundamentals/developer-portal).

```http
POST /oauth/request_token HTTP/1.1
User-Agent: themattharris' HTTP Client
Host: api.x.com
Accept: */*
Authorization: 
        OAuth oauth_callback="http%3A%2F%2Flocalhost%2Fsign-in-with-twitter%2F",
              oauth_consumer_key="cChZNFj6T5R0TigYB9yd1w",
              oauth_nonce="ea9ec8429b68d6b77cd5600adbbb0456",
              oauth_signature="F1Li3tvehgcraF8DMJ7OyxO4w9Y%3D",
              oauth_signature_method="HMAC-SHA1",
              oauth_timestamp="1318467427",
              oauth_version="1.0"
```

Your app should examine the HTTP status of the response. Any value other than `200` indicates a failure. The body of the response will contain the `oauth_token`, `oauth_token_secret`, and `oauth_callback_confirmed` parameters. Your app should verify that `oauth_callback_confirmed` is true and store the other two values for the next steps.

**Example response (response body has been wrapped):**

```http
HTTP/1.1 200 OK
Date: Thu, 13 Oct 2011 00:57:06 GMT
Status: 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 146
Pragma: no-cache
Expires: Tue, 31 Mar 1981 05:00:00 GMT
Cache-Control: no-cache, no-store, must-revalidate, pre-check=0, post-check=0
Vary: Accept-Encoding
Server: tfe

oauth_token=NPcudxy0yU5T3tBzho7iCotZ3cnetKwcTIRlX0iwRl0&
oauth_token_secret=veNRnAWe6inFuo8o2u8SLLZLjolYDmDP7SzL0YfYI&
oauth_callback_confirmed=true
```

## Additional resources

### Log in with X Resources

#### Client libraries

The client libraries listed at [X libraries](/resources/tools-and-libraries) will help implement Log in with X. Use the /oauth/authenticate endpoint, as described in the previous steps.

#### Brand Toolkit

X would prefer your application to use the official [X Brand Toolkit](https://about.x.com/en/who-we-are/brand-toolkit) for consistent branding. Save these assets use them when creating a ‘Login with X’ button.



## Page: https://docs.x.com/x-api/posts/get-engagement-analytics

```markdown
## Authorizations

**Authorization**  
- **Type:** string  
- **Location:** header  
- **Required:** required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

### ids

**ids**  
- **Type:** string[]  
- **Required:** required  

A comma separated list of Post IDs. Up to 100 are allowed in a single request.  
Required array length: `1 - 100` elements.  
Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

### end_time

**end_time**  
- **Type:** string<date-time>  
- **Required:** required  

YYYY-MM-DDTHH:mm:ssZ. The UTC timestamp representing the end of the time range.

### start_time

**start_time**  
- **Type:** string<date-time>  
- **Required:** required  

YYYY-MM-DDTHH:mm:ssZ. The UTC timestamp representing the start of the time range.

### granularity

**granularity**  
- **Type:** enum<string>  
- **Default:** total  
- **Required:** required  

The granularity for the search counts results.  
Available options: `hourly`, `daily`, `weekly`, `total`.

### analytics.fields

**analytics.fields**  
- **Type:** enum<string>[]  

A comma separated list of Analytics fields to display.  
Minimum length: `1`.  

**Example:**
```json
[
  "app_install_attempts",
  "app_opens",
  "bookmarks",
  "detail_expands",
  "email_tweet",
  "engagements",
  "follows",
  "hashtag_clicks",
  "id",
  "impressions",
  "likes",
  "media_views",
  "permalink_clicks",
  "quote_tweets",
  "replies",
  "retweets",
  "shares",
  "timestamp",
  "unfollows",
  "url_clicks",
  "user_profile_clicks"
]
```

## Response

### 200

The request has succeeded.

#### data

**data**  
- **Type:** object[]  

#### errors

**errors**  
- **Type:** object[]  

Minimum length: `1`.
```



## Page: https://docs.x.com/fundamentals/counting-characters

This page describes how characters are treated when composing Tweets and across the X API. For more information on the implementation, X provides an Open Source [twitter-text](http://github.com/twitter/twitter-text) library that can be found on [GitHub](https://github.com/twitter).

## Background

X began as an SMS text-based service. This limited the original Tweet length to 140 characters (which was partly driven by the 160 character limit of SMS, with 20 characters reserved for commands and usernames). Over time as X evolved, the maximum Tweet length grew to 280 characters - still short and brief, but enabling more expression.

## Definition of a Character

In most cases, the text content of a Tweet can contain up to 280 characters or [Unicode](https://unicode.org/) glyphs. Some glyphs will count as more than one character.

We refer to whether a glyph counts as one or more characters as its weight. The exact definition of which characters have weights greater than one character is found in the [configuration file](https://github.com/twitter/twitter-text/tree/master/config) for the [twitter-text Tweet parsing library](https://github.com/twitter/twitter-text).

The current version of the configuration file defines a default two-character weight and four ranges of [Unicode code points](https://unicode.org/charts/About.html) that are weighted differently. Currently code points in these ranges are all counted as a single character.

- The first range covers characters across the Latin-1 code pages. (U+0000 - U+10FF).
- The second range is general punctuation up to and including the Zero Width Joiner (used to combine emoji and other glyphs) (U+2000-U+200D).
- The third range is general punctuation excluding U+200E and U+200F, which are Unicode directional marks (U+2010-U+201F).
- The final range covers quotation marks (U+2032-U+2037).

Examples of Tweet text and lengths calculated by the twitter-text library can be found in the library’s [validate.yml](https://github.com/twitter/twitter-text/blob/master/conformance/validate.yml) test configuration file.

**Examples**

| Displayed character | Length | Description                                   | Unicode sequence |
|---------------------|--------|-----------------------------------------------|------------------|
| a                   | 1      | Latin Small Letter a                          | U+0061           |
| á                   | 1      | Latin Small Letter A with acute               | U+00E1           |
| ӑ                   | 1      | Cyrillic Small Letter A with breve            | U+04D1           |
| Ồ                   | 1      | Latin Small Letter o with circumflex and acute| U+1ED2           |

## Emojis

Emoji supported by [twemoji](https://twemoji.x.com/) always count as two characters, regardless of combining modifiers. This includes emoji which have been modified by [Fitzpatrick skin tone](https://emojipedia.org/modifiers/) or [gender modifiers](https://blog.emojipedia.org/unicode-and-the-emoji-gender-gap/), even if they are composed of significantly more Unicode code points. Emoji weight is defined by a regular expression in twitter-text that looks for sequences of standard emoji combined with one or more Unicode Zero Width Joiners (U+200D).

**Examples**

| Displayed Emoji | Length | Description                                      | Unicode sequence |
|------------------|--------|--------------------------------------------------|------------------|
| 👾               | 2      | Default length of known emoji                     | —                |
| 🙋🏽              | 2      | Emoji with skin tone modifier                     | 🙋 U+1F64B, 🏽 U+1F3FD |
| 👨‍🎤            | 2      | Emoji sequence using combining glyph (zero-width joiner) | [👨 U+1F468](https://emojipedia.org/emoji/%F0%9F%91%A8/), [U+200D](https://emojipedia.org/emoji/%E2%80%8D/), [🎤 U+1F3A4](https://emojipedia.org/emoji/%F0%9F%8E%A4/) |
| 👨‍👩‍👧‍👦        | 2      | Emoji sequence using multiple combining glyphs (zero-width joiners) | [👨 U+1F468](https://emojipedia.org/emoji/%F0%9F%91%A8/), [U+200D](https://emojipedia.org/emoji/%E2%80%8D/), [👩 U+1F469](https://emojipedia.org/emoji/%F0%9F%91%A9/), [U+200D](https://emojipedia.org/emoji/%E2%80%8D/), [👧 U+1F467](https://emojipedia.org/emoji/%F0%9F%91%A7/), [U+200D](https://emojipedia.org/emoji/%E2%80%8D/), [👦 U+1F466](https://emojipedia.org/emoji/%F0%9F%91%A6/) |

## Chinese / Japanese / Korean Glyphs

Glyphs used in CJK (Chinese / Japanese / Korean) languages also count as two characters. Therefore, a Tweet composed of only CJK text can only have a maximum of 140 of these types of glyphs.

## Entity Objects

Tweets can contain [Entity Objects](/x-api/fundamentals/data-dictionary), some of which impact the length of a Tweet.

URLs: [All URLs are wrapped in t.co links](https://developer.x.com/content/developer-twitter/en/docs/basics/tco). This means a URL’s length is defined by the `transformedURLLength` parameter in the [twitter-text configuration file](https://github.com/twitter/twitter-text/tree/master/config). The current length of a URL in a Tweet is 23 characters, even if the length of the URL would normally be shorter.

Replies: @names that auto-populate at the start of a reply Tweet will not count towards the character limit. New non-reply Tweets starting with a @mention will count, as will @mentions added explicitly by the user in the body of the Tweet.

Media: media attached to a Tweet, represented as a pic.x.com URL, if posted from an official client, counts for 0 characters.

For more on Entity Objects, see the [developer documentation](/x-api/fundamentals/data-dictionary).

## X Character Encoding

X API endpoints only accept UTF-8 encoded text. All other encodings must be converted to UTF-8 before sending the text to the API.

X counts the length of a Tweet using the Normalization Form C (NFC) version of the text.

As an example: the word “café”. There are two byte sequences that visually look and read the same, but use a different number of bytes:

|                   |                             |                                           |
|-------------------|-----------------------------|-------------------------------------------|
| café              | 0x63 0x61 0x66 0xC3 0xA9   | Using the “é” character, the “composed character”. |
| café              | 0x63 0x61 0x66 0x65 0xCC 0x81 | Using the combining diacritical, which overlaps the “e” |

Normalization Form C favors the use of a fully combined character (0xC3 0xA9 from the café example) over the long-form version (0x65 0xCC 0x81).

X counts the number of code points in the text, rather than UTF-8 bytes. The 0xC3 0xA9 from the café example is one code point (U+00E9) that is encoded as two bytes in UTF-8, whereas 0x65 0xCC 0x81 is two code points encoded as three bytes.



## Page: https://docs.x.com/resources/enterprise/:slug*

```markdown
<div class="mdx-content relative" data-page-title="Page Not Found" id="content">

## 404

### Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Enterprise](/x-api/enterprise-gnip-2.0/enterprise-gnip#)
- [Rules and filtering: Enterprise](/x-api/enterprise-gnip-2.0/fundamentals/rules-filtering#)
- [Enterprise data customers](/enterprise/customer-directory#)

</div>
```



## Page: https://docs.x.com/x-api/users/user-search

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* **required**

The access token received from the authorization server in the OAuth 2.0 flow.

## Query Parameters

**query**  
*Type:* `string`  
*Status:* **required**

The query string by which to query for users.

**max_results**  
*Type:* `integer`  
*Default:* `100`  

The maximum number of results.  
Required range: `1 <= x <= 1000`

**next_token**  
*Type:* `string`  

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
Minimum length: `1`

**user.fields**  
*Type:* `enum<string>[]`  

A comma separated list of User fields to display.  
Minimum length: `1`

**expansions**  
*Type:* `enum<string>[]`  

A comma separated list of fields to expand.  
Minimum length: `1`

**tweet.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Tweet fields to display.  
Minimum length: `1`

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type:* `object[]`  
Minimum length: `1`

### Response Errors

**errors**  
*Type:* `object[]`  
Minimum length: `1`

### Response Includes

**includes**  
*Type:* `object`  

### Response Meta

**meta**  
*Type:* `object`  
```



## Page: https://docs.x.com/x-api/direct-messages/delete-dm

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**event_id**  
*Type:* `string`  
*Required:* `required`  

The ID of the direct-message event to delete.

**Example:**  
```json
"1146654567674912769"
```

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/likes/likes-firehose-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [About the X API](/x-api/getting-started/about-x-api#about-the-x-api)
- [X API endpoint map](/x-api/migrate/x-api-endpoint-map#)
- [X API v2](/x-api/introduction#x-api-v2)
```



## Page: https://docs.x.com/fundamentals/developer-portal

## Overview

### Introduction

The X developer portal contains a set of self-serve tools that developers can use to manage their access to the X API and X Ads API.

In the portal, you have the opportunity to:

- Create and manage your X [Projects](/resources/fundamentals/projects) and [Apps](/resources/fundamentals/developer-apps) (and the authentication keys and tokens that they provide).
- Manage your access levels and integrations with the X API standard v1.1 and v2 endpoints.
- Learn more about different endpoints and features available.

### Ready to get access?

You can get started using the X API by signing up for an account.

If you need additional functionality or higher [Tweet caps](/x-api/fundamentals/post-cap), you can purchase Basic or Pro within the developer portal. For those interested in Enterprise, please apply [here](https://docs.x.com/enterprise/forms/enterprise-api-interest).

[Sign up for a developer account](https://developer.x.com/en/portal/dashboard)

## What to expect within the developer portal

### Onboarding

The onboarding wizard guides you through the process of setting up your first [Project](/resources/fundamentals/projects) and [App](/resources/fundamentals/developer-apps). You will need to create a Project and App to receive the credentials required to authenticate your API requests. You will see the wizard if you are accessing your developer account for the first time.

Through this process, you will receive a set of authentication keys and tokens, which you can learn more about on our [App overview page](/resources/fundamentals/developer-apps#overview). To learn more about what is needed to authenticate with the X API, take a look at the [authentication section](/resources/fundamentals/authentication).

**Please note:** You will need to [store your keys and tokens in a secure location](/resources/fundamentals/authentication/guides/authentication-best-practices) so you can access them later on. There is no way to reference these credentials without regenerating them.

### Project and App management

One of the primary roles of the developer account is to enable you to [manage your Projects and Apps](/resources/fundamentals/developer-apps#app-management). Developers can both create and manage X Projects and Apps from the Dashboard in the developer portal. This is where you can find your App IDs; edit an App’s setting, permissions, and callback URLs; and generate and revoke keys and tokens.

### Learn more about what’s available with X API v2

The developer portal hosts a products section where you can go to learn more about the different versions and access levels of the X API.

The X API v2 product section contains important information about the Free, Basic, Pro, and Enterprise access tiers. This page contains details on Project-level App limitations, Tweet cap, and costs, as well as endpoint-specific rate limits and special attributes. You can also compare and contrast the different access levels and apply for additional access if available.

Review [all v2 access levels](/x-api/introduction#access-levels).

---

## Team management

<div class="callout my-4 px-5 py-4 overflow-hidden rounded-2xl flex gap-3 border border-sky-500/20 bg-sky-50/50 dark:border-sky-500/30 dark:bg-sky-500/10">
<strong>Only available to Enterprise v2 accounts.</strong>
</div>

[View the “team” page within the developer portal.](https://developer.twitter.com/en/portal/teams)

### Why use team functionality?

Team functionality facilitates collaborative development of Projects and Apps within the X Developer Platform. Often, teams have different people responsible for access control, billing/payments, and this allows you to invite those people to contribute to your project.

### Inviting team members

In order to invite someone to join a team, an admin can invite them via their X handle. They will receive an email and they can accept it via that email invitation. Once they accept, they will need to agree to the Developer Agreement & Policy, and can then access the main account’s team page.

**Please note:** Team management does not currently grant/limit API access based on [App](/resources/fundamentals/developer-apps) credentials. It is not possible to share App management across your team. Apps (keys/tokens) cannot be edited, created, or deleted by non-owners.

### Team dashboard

On the “members” tab of the team dashboard, you will view all the members and their roles. If you are an administrator of a team, you will be able to manage developer access and edit the roles of each member.

Administrators also have access to the “pending” tab of the team dashboard. Here, admins can view the details and manage each invitation that has been sent out.

### Team roles

**Administrator role**

- Ability to manage team projects and apps
- Ability to manage all app environments
- Ability to choose/upgrade subscriptions
- Ability to update billing/payment methods
- Ability to add/remove team members
- Ability to edit roles of team members

**Developer role**

- Ability to manage own projects and apps
- Read-only access to team projects and apps
- Ability to leave the team



## Page: https://docs.x.com/x-api/account-activity/check-if-a-subscription-exists-for-a-given-webhook-and-user

```markdown
## Authorizations

**Authorization**  
The access token received from the authorization server in the OAuth 2.0 flow.

- **Type**: `string`
- **Location**: `header`
- **Required**: Yes

---

## Path Parameters

**webhook_id**  
The webhook ID to check subscription against.

- **Type**: `string`
- **Required**: Yes

**Example**:  
```json
"1146654567674912769"
```

---

## Response

**200**  
The request has succeeded.

### Response Data

**data**  
- **Type**: `object`

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
- **Type**: `object[]`  
Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/posts/japanese-language-firehose-stream

```markdown
<div class="mdx-content relative" data-page-title="Page Not Found" id="content">

404
===

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream Japanese Posts](/x-api/stream/stream-japanese-posts#)
- [Streaming](/xdks/python/streaming#streaming)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)

</div>
```



## Page: https://docs.x.com/x-api/spaces/space-lookup-up-space-ids

```markdown
## Authorizations

- **Authorization**  
  **Type:** `string`  
  **Location:** `header`  
  **Required:** `required`  

  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

- **ids**  
  **Type:** `string[]`  
  **Required:** `required`  

  The list of Space IDs to return.  
  Required array length: `1 - 100` elements  
  The unique identifier of this Space.

- **space.fields**  
  **Type:** `enum<string>[]`  

  A comma separated list of Space fields to display.  
  Minimum length: `1`  

  **Available options:**  
  `created_at`, `creator_id`, `ended_at`, `host_ids`, `id`, `invited_user_ids`, `is_ticketed`, `lang`, `participant_count`, `scheduled_start`, `speaker_ids`, `started_at`, `state`, `subscriber_count`, `title`, `topic_ids`, `updated_at`  

  **Example:**
  ```json
  [
    "created_at",
    "creator_id",
    "ended_at",
    "host_ids",
    "id",
    "invited_user_ids",
    "is_ticketed",
    "lang",
    "participant_count",
    "scheduled_start",
    "speaker_ids",
    "started_at",
    "state",
    "subscriber_count",
    "title",
    "topic_ids",
    "updated_at"
  ]
  ```

- **expansions**  
  **Type:** `enum<string>[]`  

  A comma separated list of fields to expand.  
  Minimum length: `1`  

  **Example:**
  ```json
  [
    "creator_id",
    "host_ids",
    "invited_user_ids",
    "speaker_ids",
    "topic_ids"
  ]
  ```

- **user.fields**  
  **Type:** `enum<string>[]`  

  A comma separated list of User fields to display.  
  Minimum length: `1`  

  **Example:**
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **topic.fields**  
  **Type:** `enum<string>[]`  

  A comma separated list of Topic fields to display.  
  Minimum length: `1`  

  **Example:**
  ```json
  [
    "description",
    "id",
    "name"
  ]
  ```

## Response

### 200

**Content-Type:** `application/json`  

The request has succeeded.

- **data**  
  **Type:** `object[]`  
  Minimum length: `1`  

- **errors**  
  **Type:** `object[]`  
  Minimum length: `1`  

- **includes**  
  **Type:** `object`  
```



## Page: https://docs.x.com/x-api/bookmarks/bookmarks-by-user

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* required  

The ID of the authenticated source User for whom to return results.

**Example:**  
```json
"2244994945"
```

## Query Parameters

**max_results**  
*Type:* `integer`  

The maximum number of results.  
*Required range:* `1 <= x <= 100`

**pagination_token**  
*Type:* `string`  

This parameter is used to get the next 'page' of results.  
*Minimum length:* `1`

**tweet.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Tweet fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

**expansions**  
*Type:* `enum<string>[]`  

A comma separated list of fields to expand.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

**media.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Media fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

**poll.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Poll fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

**user.fields**  
*Type:* `enum<string>[]`  

A comma separated list of User fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**place.fields**  
*Type:* `enum<string>[]`  

A comma separated list of Place fields to display.  
*Minimum length:* `1`  

**Example:**  
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

## Response

### 200

The request has succeeded.

**data**  
*Type:* `object[]`  

*Minimum length:* `1`

**errors**  
*Type:* `object[]`  

*Minimum length:* `1`

**includes**  
*Type:* `object`  

**meta**  
*Type:* `object`  
```



## Page: https://docs.x.com/x-api/posts/causes-the-user-in-the-path-to-unlike-the-specified-post

```markdown
## Authorizations

### Authorization

- **Type:** `string`
- **Location:** `header`
- **Required:** `required`

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

### id

- **Type:** `string`
- **Required:** `required`

The ID of the authenticated source User that is requesting to unlike the Post.

**Example:**
```json
"2244994945"
```

### tweet_id

- **Type:** `string`
- **Required:** `required`

The ID of the Post that the User is requesting to unlike.

**Example:**
```json
"1346889436626259968"
```

## Response

### 200

**Content-Type:** `application/json`

The request has succeeded.

#### Response Data

- **Type:** `object`

<details>
<summary>Show child attributes</summary>
</details>

#### Response Errors

- **Type:** `object[]`

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/causes-dms-tofrom-the-target-user-in-the-path-to-be-blocked-by-the-authenticated-request-user

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* required  

The ID of the target User that the authenticated user requesting to block dms for.

**Example:**  
```json
"2244994945"
```

## Response

The request has succeeded.

**Response Data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**Response Errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/user-lookup-by-id

```markdown
## Authorizations

- **Authorization**: 
  - **Type**: `string`
  - **Location**: `header`
  - **Required**: Yes
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**: 
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: The ID of the User to lookup.
  - **Example**: 
    ```json
    "2244994945"
    ```

## Query Parameters

- **user.fields**: 
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Available options**: 
    - `affiliation`
    - `confirmed_email`
    - `connection_status`
    - `created_at`
    - `description`
    - `entities`
    - `id`
    - `is_identity_verified`
    - `location`
    - `most_recent_tweet_id`
    - `name`
    - `parody`
    - `pinned_tweet_id`
    - `profile_banner_url`
    - `profile_image_url`
    - `protected`
    - `public_metrics`
    - `receives_your_dm`
    - `subscription`
    - `subscription_type`
    - `url`
    - `username`
    - `verified`
    - `verified_followers_count`
    - `verified_type`
    - `withheld`
  - **Example**: 
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **expansions**: 
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**: 
    ```json
    [
      "affiliation.user_id",
      "most_recent_tweet_id",
      "pinned_tweet_id"
    ]
    ```

- **tweet.fields**: 
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Tweet fields to display.
  - **Minimum length**: `1`
  - **Example**: 
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

## Response

- **Status Code**: `200`
- **Content-Type**: `application/json`
- **Description**: The request has succeeded.
  
### Response Data

- **data**: 
  - **Type**: `object`
  - **Description**: The X User object.
  - **Example**: 
    ```json
    {
      "created_at": "2013-12-14T04:35:55Z",
      "id": "2244994945",
      "name": "X Dev",
      "protected": false,
      "username": "TwitterDev"
    }
    ```

### Response Errors

- **errors**: 
  - **Type**: `object[]`
  - **Minimum length**: `1`

### Response Includes

- **includes**: 
  - **Type**: `object`
```



## Page: https://docs.x.com/fundamentals/authentication/basic-auth

## Basic authentication

Many of X’s enterprise APIs require the use of HTTP Basic Authentication. To make a successful request to an API that requires Basic Authentication, you must pass a valid email address and password combination as an authorization header for each request. The email and password combination are the same ones that you will use to access the [enterprise API console](https://console.gnip.com/), and can be edited from within this console.

When building a request using Basic Authentication, make sure you add the `Authentication: Basic` HTTP header with encoded credentials over HTTPS.

In the following cURL request example, you would replace `<email_address>` and `<password>` with your credentials before sending the request:

```shell
curl -v --compressed -u <email_address>:<password> "https://gnip-api.x.com/search/30day/accounts/<account-name>/prod/counts.json?query=from%3Axdevelopers"
```

**APIs that require basic authentication:**

- [PowerTrack API](https://localhost:3000/x-api/enterprise-gnip-2.0/powertrack-api) enterprise
- [Decahose stream API](http://localhost:3000/x-api/enterprise-gnip-2.0/fundamentals/decahose-api) enterprise
- [30-Day Search API](https://localhost:3000/x-api/enterprise-gnip-2.0/fundamentals/search-api) enterprise
- [Full-Archive Search API](https://localhost:3000/x-api/enterprise-gnip-2.0/fundamentals/search-api) enterprise
- [Usage API](https://localhost:3000/x-api/enterprise-gnip-2.0/fundamentals/usage) enterprise



## Page: https://docs.x.com/x-api/posts/causes-the-user-in-the-path-to-unretweet-the-specified-post

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* `required`  

The ID of the authenticated source User that is requesting to repost the Post.

**Example:**
```json
"2244994945"
```

**source_tweet_id**  
*Type:* `string`  
*Required:* `required`  

The ID of the Post that the User is requesting to unretweet.

**Example:**
```json
"1346889436626259968"
```

## Response

The request has succeeded.

**Response Data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**Response Errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/bookmarks/remove-a-bookmarked-post

```markdown
## Authorizations

**Authorization**  
- **Type:** string  
- **Location:** header  
- **Required:** required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

### id

**id**  
- **Type:** string  
- **Required:** required  

The ID of the authenticated source User whose bookmark is to be removed.

**Example:**  
```json
"2244994945"
```

### tweet_id

**tweet_id**  
- **Type:** string  
- **Required:** required  

The ID of the Post that the source User is removing from bookmarks.

**Example:**  
```json
"1346889436626259968"
```

## Response

The request has succeeded.

### data

**data**  
- **Type:** object  

<details>
<summary>Show child attributes</summary>
</details>

### errors

**errors**  
- **Type:** object[]  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/posts/rules-lookup

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Filtered Stream Webhooks API](/x-api/webhooks/stream/introduction#)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
- [Streaming](/xdks/python/streaming#streaming)
```



## Page: https://docs.x.com/x-api/posts/causes-the-user-in-the-path-to-repost-the-specified-post

```markdown
## Authorizations

- **Authorization**
  - Type: `string`
  - Location: `header`
  - Required: **required**
  
  The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

- **id**
  - Type: `string`
  - Required: **required**
  
  The ID of the authenticated source User that is requesting to repost the Post.

  **Example**:
  ```json
  "2244994945"
  ```

## Body

- **tweet_id**
  - Type: `string`
  - Required: **required**
  
  Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

  **Example**:
  ```json
  "1346889436626259968"
  ```

## Response

- **200**
  - Content-Type: `application/json`
  
  The request has succeeded.

- **data**
  - Type: `object`
  
  <details>
  <summary>Show child attributes</summary>
  </details>

- **errors**
  - Type: `object[]`
  
  Minimum length: `1`
  
  <details>
  <summary>Show child attributes</summary>
  </details>
```



## Page: https://docs.x.com/x-api/posts/creation-of-a-post

```markdown
## Authorizations

**Authorization**  
- **Type:** string  
- **Location:** header  
- **Required:** required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Body

**Content-Type:** application/json

### card_uri

**card_uri**  
- **Type:** string  

Card Uri Parameter. This is mutually exclusive from Quote Tweet Id, Poll, Media, and Direct Message Deep Link.

### community_id

**community_id**  
- **Type:** string  

The unique identifier of this Community.  
**Example:**  
```json
"1146654567674912769"
```

### direct_message_deep_link

**direct_message_deep_link**  
- **Type:** string  

Link to take the conversation from the public timeline to a private Direct Message.

### edit_options

**edit_options**  
- **Type:** object  

Options for editing an existing Post. When provided, this request will edit the specified Post instead of creating a new one.

<details>
<summary>Show child attributes</summary>
</details>

### for_super_followers_only

**for_super_followers_only**  
- **Type:** boolean  
- **Default:** false  

Exclusive Tweet for super followers.

### geo

**geo**  
- **Type:** object  

Place ID being attached to the Tweet for geo location.

<details>
<summary>Show child attributes</summary>
</details>

### media

**media**  
- **Type:** object  

Media information being attached to created Tweet. This is mutually exclusive from Quote Tweet Id, Poll, and Card URI.

<details>
<summary>Show child attributes</summary>
</details>

### nullcast

**nullcast**  
- **Type:** boolean  
- **Default:** false  

Nullcasted (promoted-only) Posts do not appear in the public timeline and are not served to followers.

### poll

**poll**  
- **Type:** object  

Poll options for a Tweet with a poll. This is mutually exclusive from Media, Quote Tweet Id, and Card URI.

<details>
<summary>Show child attributes</summary>
</details>

### quote_tweet_id

**quote_tweet_id**  
- **Type:** string  

Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.  
**Example:**  
```json
"1346889436626259968"
```

### reply

**reply**  
- **Type:** object  

Tweet information of the Tweet being replied to.

<details>
<summary>Show child attributes</summary>
</details>

### reply_settings

**reply_settings**  
- **Type:** enum<string>  

Settings to indicate who can reply to the Tweet.  
**Available options:** `following`, `mentionedUsers`, `subscribers`, `verified`  

### share_with_followers

**share_with_followers**  
- **Type:** boolean  
- **Default:** false  

Share community post with followers too.

### text

**text**  
- **Type:** string  

The content of the Tweet.  
**Example:**  
```json
"Learn how to use the user Tweet timeline and user mention timeline endpoints in the X API v2 to explore Tweet… https://t.co/56a0vZUx7i"
```

## Response

**Status Code:** 201  
**Content-Type:** application/json  

The request has succeeded.

### Response Data

**data**  
- **Type:** object  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
- **Type:** object[]  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/usage/post-usage

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* **required**

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### days

**days**  
*Type:* `integer`  
*Default:* `7`

The number of days for which you need usage for.  
Required range: `1 <= x <= 90`

### usage.fields

**usage.fields**  
*Type:* `enum<string>[]`

A comma separated list of Usage fields to display.  
Minimum length: `1`

**Available options:**  
`cap_reset_day`, `daily_client_app_usage`, `daily_project_usage`, `project_cap`, `project_id`, `project_usage`

**Example:**
```json
[
  "cap_reset_day",
  "daily_client_app_usage",
  "daily_project_usage",
  "project_cap",
  "project_id",
  "project_usage"
]
```

## Response

The request has succeeded.

### data

**data**  
*Type:* `object`

Usage per client app

### errors

**errors**  
*Type:* `object[]`  
Minimum length: `1`
```



## Page: https://docs.x.com/x-api/posts/causes-the-user-in-the-path-to-like-the-specified-post

```markdown
## Authorizations

- **Authorization**  
  The access token received from the authorization server in the OAuth 2.0 flow.  
  - Type: `string`
  - Location: `header`
  - Required: **required**

## Path Parameters

- **id**  
  The ID of the authenticated source User that is requesting to like the Post.  
  - Type: `string`
  - Required: **required**  
  **Example:**  
  ```json
  "2244994945"
  ```

## Body

- Content-Type: `application/json`

- **tweet_id**  
  Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.  
  - Type: `string`
  - Required: **required**  
  **Example:**  
  ```json
  "1346889436626259968"
  ```

## Response

- **200**  
  The request has succeeded.  
  - Content-Type: `application/json`

- **data**  
  - Type: `object`

### Response Attributes

- **errors**  
  Minimum length: `1`  
  - Type: `object[]`
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/api-key-and-secret

### API Key and Secret

The API Key and Secret (also known as Consumer Key and Secret) are the most fundamental credentials required to access the X API. These credentials act as the username and password for your X App, and are used by the X API to understand which App requests are coming from.

These credentials can be used by [authentication endpoints](/resources/fundamentals/authentication/api-reference) to generate additional credentials, such as [user Access Tokens and Secrets](/resources/fundamentals/authentication/oauth-1-0a/api-key-and-secret), and [Bearer Tokens](/resources/fundamentals/authentication/oauth-2-0/bearer-tokens). You also need to use these credentials along with Access Tokens and other authorization parameters to [authorize requests](/resources/fundamentals/authentication/oauth-1-0a/authorizing-a-request) that require OAuth 1.0a User Context authentication.

#### How to acquire an API Key and Secret

To acquire a X API Key and Secret, please follow these steps:

1. [Sign up for a X developer account](https://developer.x.com/en/apply-for-access)
2. Create a [X App](/resources/fundamentals/developer-apps) within the [developer portal](/resources/fundamentals/developer-portal). Note that if you would like to use [X API v2](/x-api/introduction), you must add your X App to a [Project](/resources/fundamentals/projects).

When you create your X App, you will be presented with your API Key and Secret, along with a Bearer Token. Please note that we only display these credentials once, so make sure to save them in your password manager or somewhere secure.

We have more recommendations on how to handle your keys and tokens within our [authentication best practices](/resources/fundamentals/authentication/guides/authentication-best-practices) page, including details on what you should do if your credentials have been compromised.

#### How to find and regenerate your API Key and Secret after App creation

If you’ve already created an App and need to find or regenerate your API Key and Secret, please follow these steps:

1. Navigate to the developer portal
2. Expand the ‘Projects and Apps’ dropdown in the sidenav
3. Open the App which is associated with the API Key and Secret that you would like to find or regenerate
4. Navigate to the Keys and tokens tab

From there, you will find all of the credentials associated with your App.

#### How to use your API Key and Secret

If you are just exploring the X Developer Platform, we recommend that you use a [tool or library](/resources/tools-and-libraries) to see what’s available on the platform. These tools handle authentication gracefully, and can save you a lot of time and frustration. We specifically recommend [getting started with Postman](/tutorials/postman-getting-started) or [Insomnia](https://insomnia.rest/) for beginner developers.

If you are interested in building a request from scratch, please read our guide on [authorizing an OAuth 1.0a request](/resources/fundamentals/authentication/oauth-1-0a/authorizing-a-request).



## Page: https://docs.x.com/x-api/connection/force-kills-all-streaming-connections-of-the-authenticated-application

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Connection to X API using TLS](/fundamentals/authentication/guides/tls#connection-to-x-api-using-tls)
- [ConnectionsClient](/xdks/typescript/reference/classes/ConnectionsClient#connectionsclient)
- [Terminate all connections](/x-api/connections/terminate-all-connections#)
```



## Page: https://docs.x.com/x-api/posts/post-lookup-by-post-ids

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: Yes

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### ids

- **Type**: `string[]`
- **Required**: Yes

A comma separated list of Post IDs. Up to 100 are allowed in a single request.

Required array length: `1 - 100` elements

Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

### tweet.fields

- **Type**: `enum<string>[]`

A comma separated list of Tweet fields to display.

Minimum length: `1`

#### Example:

```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

### expansions

- **Type**: `enum<string>[]`

A comma separated list of fields to expand.

Minimum length: `1`

#### Example:

```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

### media.fields

- **Type**: `enum<string>[]`

A comma separated list of Media fields to display.

Minimum length: `1`

#### Example:

```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

### poll.fields

- **Type**: `enum<string>[]`

A comma separated list of Poll fields to display.

Minimum length: `1`

#### Example:

```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

### user.fields

- **Type**: `enum<string>[]`

A comma separated list of User fields to display.

Minimum length: `1`

#### Example:

```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### place.fields

- **Type**: `enum<string>[]`

A comma separated list of Place fields to display.

Minimum length: `1`

#### Example:

```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

## Response

### Response Code

- **200**: The request has succeeded.

### Response Data

- **Type**: `object[]`

Minimum length: `1`

### Response Errors

- **Type**: `object[]`

Minimum length: `1`

### Response Includes

- **Type**: `object`
```



## Page: https://docs.x.com/x-api/lists/get-users-followed-lists

```markdown
## Authorizations

- **Authorization** (string, header, required)
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id** (string, required)

  The ID of the User to lookup.

  **Example:**  
  `"2244994945"`

## Query Parameters

- **max_results** (integer, default: 100)

  The maximum number of results.  
  Required range: `1 <= x <= 100`

- **pagination_token** (string)

  This parameter is used to get a specified 'page' of results.  
  Required string length: `1 - 19`

- **list.fields** (enum<string>[])

  A comma separated list of List fields to display.  
  Minimum length: `1`

  **Example:**  
  ```json
  [
    "created_at",
    "description",
    "follower_count",
    "id",
    "member_count",
    "name",
    "owner_id",
    "private"
  ]
  ```

- **expansions** (enum<string>[])

  A comma separated list of fields to expand.  
  Minimum length: `1`

  **Example:**  
  ```json
  ["owner_id"]
  ```

- **user.fields** (enum<string>[])

  A comma separated list of User fields to display.  
  Minimum length: `1`

  **Example:**  
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

## Response

- **200**  
  The request has succeeded.

### Response Data

- **data** (object[])

  Minimum length: `1`

### Response Errors

- **errors** (object[])

  Minimum length: `1`

### Response Includes

- **includes** (object)

### Response Meta

- **meta** (object)
```



## Page: https://docs.x.com/x-api/lists/get-a-users-owned-lists

```markdown
## Authorizations

- **Authorization**  
  **Type:** string  
  **Location:** header  
  **Required:** required  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**  
  **Type:** string  
  **Required:** required  
  The ID of the User to lookup.  
  **Example:**  
  ```json
  "2244994945"
  ```

## Query Parameters

- **max_results**  
  **Type:** integer  
  **Default:** 100  
  The maximum number of results.  
  **Required range:** `1 <= x <= 100`

- **pagination_token**  
  **Type:** string  
  This parameter is used to get a specified 'page' of results.  
  **Required string length:** `1 - 19`

- **list.fields**  
  **Type:** enum<string>[]  
  A comma separated list of List fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "created_at",
    "description",
    "follower_count",
    "id",
    "member_count",
    "name",
    "owner_id",
    "private"
  ]
  ```

- **expansions**  
  **Type:** enum<string>[]  
  A comma separated list of fields to expand.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  ["owner_id"]
  ```

- **user.fields**  
  **Type:** enum<string>[]  
  A comma separated list of User fields to display.  
  **Minimum length:** `1`  
  **Example:**  
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

## Response

- **200**  
  **Content-Type:** application/json  
  The request has succeeded.

### Response Data

- **data**  
  **Type:** object[]  
  **Minimum length:** `1`

### Response Errors

- **errors**  
  **Type:** object[]  
  **Minimum length:** `1`

### Response Includes

- **includes**  
  **Type:** object

### Response Meta

- **meta**  
  **Type:** object
```



## Page: https://docs.x.com/x-api/posts/user-mention-timeline-by-user-id

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: Yes

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

---

## Path Parameters

### id

- **Type**: `string`
- **Required**: Yes

The ID of the User to lookup.

**Example**: 
```json
"2244994945"
```

---

## Query Parameters

### since_id

- **Type**: `string`

The minimum Post ID to be included in the result set. This parameter takes precedence over `start_time` if both are specified.

**Example**: 
```json
"1346889436626259968"
```

### until_id

- **Type**: `string`

The maximum Post ID to be included in the result set. This parameter takes precedence over `end_time` if both are specified.

**Example**: 
```json
"1346889436626259968"
```

### max_results

- **Type**: `integer`

The maximum number of results.

**Required range**: `5 <= x <= 100`

### pagination_token

- **Type**: `string`

This parameter is used to get the next 'page' of results.

**Minimum length**: `1`

### start_time

- **Type**: `string<date-time>`

`YYYY-MM-DDTHH:mm:ssZ`. The earliest UTC timestamp from which the Posts will be provided. The `since_id` parameter takes precedence if it is also specified.

### end_time

- **Type**: `string<date-time>`

`YYYY-MM-DDTHH:mm:ssZ`. The latest UTC timestamp to which the Posts will be provided. The `until_id` parameter takes precedence if it is also specified.

### tweet.fields

- **Type**: `enum<string>[]`

A comma separated list of Tweet fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

### expansions

- **Type**: `enum<string>[]`

A comma separated list of fields to expand.

**Minimum length**: `1`

**Example**:
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

### media.fields

- **Type**: `enum<string>[]`

A comma separated list of Media fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

### poll.fields

- **Type**: `enum<string>[]`

A comma separated list of Poll fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

### user.fields

- **Type**: `enum<string>[]`

A comma separated list of User fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### place.fields

- **Type**: `enum<string>[]`

A comma separated list of Place fields to display.

**Minimum length**: `1`

**Example**:
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

---

## Response

### Response Data

- **Type**: `object[]`

Minimum length: `1`

### Response Errors

- **Type**: `object[]`

Minimum length: `1`

### Response Includes

- **Type**: `object`

### Response Meta

- **Type**: `object`
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens

### Obtaining Access Tokens using 3-legged OAuth flow

To perform actions on behalf of another user, you’ll need to obtain their access tokens. Access tokens specify the X account the request is made on behalf of, so for you to obtain these they will need to first grant you access. These tokens do not expire but can be revoked by the user at any time.

X allows you to obtain user access tokens through the 3-legged OAuth flow, which allows your application to obtain an **access token** and access token secret by redirecting a user to X and having them authorize your application. This flow is almost identical to the flow described in [implementing Log in with X](/resources/fundamentals/authentication/guides/log-in-with-x), with two exceptions:

- The [GET oauth/authorize](https://api.x.com/resources/fundamentals/authentication/api-reference#get-oauth-authorize) endpoint is used instead of [GET oauth/authenticate](https://api.x.com/resources/fundamentals/authentication/api-reference#get-oauth-authenticate).
- The user will **always** be prompted to authorize access to your application, even if access was previously granted.

Before you get started, you will need to check your [application’s](https://api.x.com/resources/fundamentals/developer-apps) permissions and know the consumer keys and callback URL. If you don’t have a callback URL or publicly accessible UI, consider using [PIN-based authorization](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/pin-based-oauth), which is intended for applications that cannot access or embed a web browser in order to redirect the user after authorization.

The possible states for the 3-legged sign in interaction are illustrated in the following flowchart:

![Flowchart](https://cdn.cms-twdigitalassets.com/content/dam/developer-twitter/docs/obtaining-access-tokens.png.twimg.1920.png)

#### Overview of the process

At a high level, the 3-Legged OAuth process will:

1. Create a request for a consumer application to obtain a request token.
2. Have the user authenticate, and send the consumer application a request token.
3. Convert the request token into a usable user access token.

**Terminology clarification**

In the guide below, you may see different terms referring to the same thing.

**Client credentials:**

- App Key === API Key === Consumer API Key === Consumer Key === Customer Key === `oauth_consumer_key`
- App Key Secret === API Secret Key === Consumer Secret === Consumer Key === Customer Key === `oauth_consumer_secret`
- Callback URL === `oauth_callback`

**Temporary credentials:**

- Request Token === `oauth_token`
- Request Token Secret === `oauth_token_secret`
- oauth_verifier

**Token credentials:**

- Access token === Token === resulting `oauth_token`
- Access token secret === Token Secret === resulting `oauth_token_secret`

#### Walkthrough steps

**Step 1: [POST oauth/request_token](https://api.x.com/resources/fundamentals/authentication/api-reference#post-oauth-request-token)**

Create a request for a consumer application to obtain a request token.

The only unique parameter in this request is oauth_callback, which must be a [URL encoded](https://api.x.com/resources/fundamentals/authentication/oauth-1-0a/percent-encoding-parameters) version of the URL you wish your user to be redirected to when they complete step 2. The remaining parameters are added by the OAuth signing process.

Please note - any callback URL that you use with the [POST oauth/request_token](https://api.x.com/resources/fundamentals/authentication/api-reference#post-oauth-request-token) endpoint will have to be configured within your [developer App’s](https://api.x.com/resources/fundamentals/developer-apps) settings in the app details page of developer portal.

**Request includes:**

```
oauth_callback="https%3A%2F%2FyourCallbackUrl.com"
oauth_consumer_key="cChZNFj6T5R0TigYB9yd1w"
```

Your app should examine the HTTP status of the response. Any value other than 200 indicates a failure. The body of the response will contain the `oauth_token`, `oauth_token_secret`, and `oauth_callback_confirmed` parameters. Your app should verify that `oauth_callback_confirmed` is true and store the other two values for the next steps.

**Response includes:**

```
oauth_token=NPcudxy0yU5T3tBzho7iCotZ3cnetKwcTIRlX0iwRl0
oauth_token_secret=veNRnAWe6inFuo8o2u8SLLZLjolYDmDP7SzL0YfYI
oauth_callback_confirmed=true
```

**Step 2: [GET oauth/authorize](https://api.x.com/resources/fundamentals/authentication/api-reference#get-oauth-authorize)**

Have the user authenticate, and send the consumer application a request token.

**Example URL to redirect user to:**

```
https://api.x.com/oauth/authorize?oauth_token=NPcudxy0yU5T3tBzho7iCotZ3cnetKwcTIRlX0iwRl0
```

Upon successful authentication, your `callback_url` would receive a request containing the `oauth_token` and `oauth_verifier` parameters. Your application should verify that the token matches the request token received in step 1.

**Request from client’s redirect:**

```
https://yourCallbackUrl.com?oauth_token=NPcudxy0yU5T3tBzho7iCotZ3cnetKwcTIRlX0iwRl0&oauth_verifier=uw7NjWHT6OJ1MpJOXsHfNxoAhPKpgI8BlYDhxEjIBY
```

**Step 3: [POST oauth/access_token](https://api.x.com/resources/fundamentals/authentication/api-reference#post-oauth-access-token)**

Convert the request token into a usable access token.

To render the request token into a usable access token, your application must make a request to the [POST oauth/access_token](https://api.x.com/resources/fundamentals/authentication/api-reference#post-oauth-access-token) endpoint, containing the `oauth_verifier` value obtained in step 2. The request token is also passed in the `oauth_token` portion of the header, but this will have been added by the signing process.

**Request includes:**

```
POST /oauth/access_token
oauth_consumer_key=cChZNFj6T5R0TigYB9yd1w
oauth_token=NPcudxy0yU5T3tBzho7iCotZ3cnetKwcTIRlX0iwRl0
oauth_verifier=uw7NjWHT6OJ1MpJOXsHfNxoAhPKpgI8BlYDhxEjIBY
```

A successful response contains the `oauth_token`, `oauth_token_secret` parameters. The token and token secret should be stored and used for future authenticated requests to the X API. To determine the identity of the user, use [GET account/verify_credentials](https://api.x.com/resources/fundamentals/authentication/api-reference).

**Response includes:**

```
oauth_token=7588892-kagSNqWge8gB1WwE3plnFsJHAZVfxWD7Vb57p0b4
oauth_token_secret=PbKfYqSryyeKDWz4ebtY3o5ogNLG11WJuZBc9fQrQo
```

**Using these credentials for OAuth 1.0a (application-user) required requests**

Now you’ve obtained the user access tokens; you can use them to access certain APIs such as [POST statuses/update](https://api.x.com/x-api/posts/manage-tweets/introduction) to create Tweets on the users’ behalf.

**Request includes:**

```
POST statuses/update.json
oauth_consumer_key=cChZNFj6T5R0TigYB9yd1w
oauth_token=7588892-kagSNqWge8gB1WwE3plnFsJHAZVfxWD7Vb57p0b4
```

#### Sample use case

The standard flow is web-based and uses the 3-legged authorization OAuth flow. The screenshots outlined here are part of a sample that you can view the source of at [https://github.com/xdevplatform/twauth-web](https://github.com/xdevplatform/twauth-web).

At some point in your application, you will want to redirect to X in order to authorize your application.

![Sample Use Case Step 1](https://mintcdn.com/x-preview/VdW8U-B9RRDINhor/images/twauth-web-2.png?fit=max&auto=format&n=VdW8U-B9RRDINhor&q=85&s=92b7bfb29c9eec83ed3cf71bd84844cd)

When you redirect to X with the request token, the user will be prompted to authorize your application.

![Sample Use Case Step 2](https://mintcdn.com/x-preview/VdW8U-B9RRDINhor/images/twauth-web-3.png?fit=max&auto=format&n=VdW8U-B9RRDINhor&q=85&s=f40c363e291d95c1c1bfaa4363f0500f)

Upon authorizing your application, the user will be redirected to the callback URL provided when you generated the request token. You will use this to obtain the permanent access token for this user and store it locally.

![Sample Use Case Step 3](https://mintcdn.com/x-preview/VdW8U-B9RRDINhor/images/twauth-web-4.png?fit=max&auto=format&n=VdW8U-B9RRDINhor&q=85&s=e5ea3a285deaff16eac044a1c0586f3e)



## Page: https://docs.x.com/x-api/webhooks/webhook-crc-check

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

**webhook_id**  
*Type:* `string`  
*Required:* `required`  

The ID of the webhook to check.

**Example:**  
`"1146654567674912769"`

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/spaces/retrieve-posts-from-a-space

```markdown
## Authorizations

- **Authorization**
  - **Type**: `string`
  - **Location**: `header`
  - **Required**: Yes
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: The ID of the Space to be retrieved.
  - **Example**: `"1SLjjRYNejbKM"`

## Query Parameters

- **max_results**
  - **Type**: `integer`
  - **Default**: `100`
  - **Description**: The number of Posts to fetch from the provided space. If not provided, the value will default to the maximum of 100.
  - **Required range**: `1 <= x <= 100`
  - **Example**: `25`

- **tweet.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Tweet fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

- **expansions**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article.cover_media",
      "article.media_entities",
      "attachments.media_keys",
      "attachments.media_source_tweet",
      "attachments.poll_ids",
      "author_id",
      "edit_history_tweet_ids",
      "entities.mentions.username",
      "geo.place_id",
      "in_reply_to_user_id",
      "entities.note.mentions.username",
      "referenced_tweets.id",
      "referenced_tweets.id.attachments.media_keys",
      "referenced_tweets.id.author_id"
    ]
    ```

- **media.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Media fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "alt_text",
      "duration_ms",
      "height",
      "media_key",
      "non_public_metrics",
      "organic_metrics",
      "preview_image_url",
      "promoted_metrics",
      "public_metrics",
      "type",
      "url",
      "variants",
      "width"
    ]
    ```

- **poll.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Poll fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "duration_minutes",
      "end_datetime",
      "id",
      "options",
      "voting_status"
    ]
    ```

- **user.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **place.fields**
  - **Type**: `enum<string>[]`
  - **Description**: A comma separated list of Place fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "contained_within",
      "country",
      "country_code",
      "full_name",
      "geo",
      "id",
      "name",
      "place_type"
    ]
    ```

## Response

- **Status Code**: `200`
- **Content Type**: `application/json`
- **Description**: The request has succeeded.

### Response Data

- **data**
  - **Type**: `object[]`
  - **Minimum length**: `1`

### Response Errors

- **errors**
  - **Type**: `object[]`
  - **Minimum length**: `1`

### Response Includes

- **includes**
  - **Type**: `object`

### Response Meta

- **meta**
  - **Type**: `object`
```



## Page: https://docs.x.com/x-api/direct-messages/create-a-new-dm-conversation

```markdown
## Authorizations

**Authorization**  
Type: `string`  
Location: `header`  
**Required**  

The access token received from the authorization server in the OAuth 2.0 flow.

## Body

Content-Type: `application/json`

### conversation_type

**conversation_type**  
Type: `enum<string>`  
**Required**  

The conversation type that is being created.  
Available options: `Group`

### message

**message**  
Type: `object`  
**Required**  

#### message.text

**message.text**  
Type: `string`  
**Required**  
Text of the message.  
Minimum length: `1`

#### message.attachments

**message.attachments**  
Type: `object[]`  

Attachments to a DM Event.

### participant_ids

**participant_ids**  
Type: `string[]`  
**Required**  

Participants for the DM Conversation.  
Required array length: `2 - 49` elements  
Unique identifier of this User. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.

## Response

### 201

The request has succeeded.

#### data

**data**  
Type: `object`  

#### errors

**errors**  
Type: `object[]`  
Minimum length: `1`
```



## Page: https://docs.x.com/x-api/posts/sample-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream sampled Posts](/x-api/stream/stream-sampled-posts#)
- [Streaming](/xdks/python/streaming#streaming)
- [Explore a user’s Posts and mentions with the X API v2](/tutorials/explore-a-users-posts#)
```



## Page: https://docs.x.com/x-api/users/returns-user-objects-that-have-retweeted-the-provided-post-id

```markdown
## Authorizations

- **Authorization** (string, header) `required`
  
  Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id** (string) `required`
  
  A single Post ID.

  **Example**: 
  ```json
  "1346889436626259968"
  ```

## Query Parameters

- **max_results** (integer) 
  - **default**: 100
  
  The maximum number of results. Required range: `1 <= x <= 100`.

- **pagination_token** (string) 
  
  This parameter is used to get the next 'page' of results. Minimum length: `1`.

- **user.fields** (enum<string>[]) 
  
  A comma separated list of User fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **expansions** (enum<string>[]) 
  
  A comma separated list of fields to expand. Minimum length: `1`.

  **Example**:
  ```json
  [
    "affiliation.user_id",
    "most_recent_tweet_id",
    "pinned_tweet_id"
  ]
  ```

- **tweet.fields** (enum<string>[]) 
  
  A comma separated list of Tweet fields to display. Minimum length: `1`.

  **Example**:
  ```json
  [
    "article",
    "attachments",
    "author_id",
    "card_uri",
    "community_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "display_text_range",
    "edit_controls",
    "edit_history_tweet_ids",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "media_metadata",
    "non_public_metrics",
    "note_tweet",
    "organic_metrics",
    "possibly_sensitive",
    "promoted_metrics",
    "public_metrics",
    "referenced_tweets",
    "reply_settings",
    "scopes",
    "source",
    "suggested_source_links",
    "text",
    "withheld"
  ]
  ```

## Response

- **200**: The request has succeeded.

### Response Data

- **data** (object[]) 

  Minimum length: `1`.

### Response Errors

- **errors** (object[]) 

  Minimum length: `1`.

### Response Includes

- **includes** (object) 

### Response Meta

- **meta** (object) 
```



## Page: https://docs.x.com/x-api/posts/recent-search

```markdown
## Authorizations

### Authorization

- **Type**: `string`
- **Location**: `header`
- **Required**: Yes

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

---

## Query Parameters

### query

- **Type**: `string`
- **Required**: Yes

One query/rule/filter for matching Posts. Refer to [https://t.co/rulelength](https://t.co/rulelength) to identify the max query length.

Required string length: `1 - 4096`

**Example**:
```json
"(from:TwitterDev OR from:TwitterAPI) has:media -is:retweet"
```

### start_time

- **Type**: `string<date-time>`

YYYY-MM-DDTHH:mm:ssZ. The oldest UTC timestamp from which the Posts will be provided. Timestamp is in second granularity and is inclusive (i.e. 12:00:01 includes the first second of the minute).

### end_time

- **Type**: `string<date-time>`

YYYY-MM-DDTHH:mm:ssZ. The newest, most recent UTC timestamp to which the Posts will be provided. Timestamp is in second granularity and is exclusive (i.e. 12:00:01 excludes the first second of the minute).

### since_id

- **Type**: `string`

Returns results with a Post ID greater than (that is, more recent than) the specified ID.

**Example**:
```json
"1346889436626259968"
```

### until_id

- **Type**: `string`

Returns results with a Post ID less than (that is, older than) the specified ID.

**Example**:
```json
"1346889436626259968"
```

### max_results

- **Type**: `integer`
- **Default**: `10`

The maximum number of search results to be returned by a request.

Required range: `10 <= x <= 100`

### next_token

- **Type**: `string`

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.

Minimum length: `1`

### pagination_token

- **Type**: `string`

This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.

Minimum length: `1`

### sort_order

- **Type**: `enum<string>`

This order in which to return results.

Available options: `recency`, `relevancy`

### tweet.fields

- **Type**: `enum<string>[]`

A comma separated list of Tweet fields to display.

Minimum length: `1`

**Example**:
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

### expansions

- **Type**: `enum<string>[]`

A comma separated list of fields to expand.

Minimum length: `1`

**Example**:
```json
[
  "article.cover_media",
  "article.media_entities",
  "attachments.media_keys",
  "attachments.media_source_tweet",
  "attachments.poll_ids",
  "author_id",
  "edit_history_tweet_ids",
  "entities.mentions.username",
  "geo.place_id",
  "in_reply_to_user_id",
  "entities.note.mentions.username",
  "referenced_tweets.id",
  "referenced_tweets.id.attachments.media_keys",
  "referenced_tweets.id.author_id"
]
```

### media.fields

- **Type**: `enum<string>[]`

A comma separated list of Media fields to display.

Minimum length: `1`

**Example**:
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

### poll.fields

- **Type**: `enum<string>[]`

A comma separated list of Poll fields to display.

Minimum length: `1`

**Example**:
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

### user.fields

- **Type**: `enum<string>[]`

A comma separated list of User fields to display.

Minimum length: `1`

**Example**:
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### place.fields

- **Type**: `enum<string>[]`

A comma separated list of Place fields to display.

Minimum length: `1`

**Example**:
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

---

## Response

### Response Data

- **Type**: `object[]`

Minimum length: `1`

### Response Errors

- **Type**: `object[]`

Minimum length: `1`

### Response Includes

- **Type**: `object`

### Response Meta

- **Type**: `object`
```



## Page: https://docs.x.com/x-api/users/causes-dms-tofrom-the-target-user-in-the-path-to-be-unblocked-by-the-authenticated-request-user

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* header  
*Status:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* `string`  
*Status:* required  

The ID of the target User that the authenticated user requesting to unblock dms for.

**Example:**  
```json
"2244994945"
```

## Response

**200**  
*Content-Type:* application/json  

The request has succeeded.

### Response Data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/media/media-upload-finalize

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

---

## Path Parameters

**id**  
*Type:* `string`  
*Status:* required  

The media id of the targeted media to finalize.

**Example:**  
```json
"1146654567674912769"
```

---

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

A response from getting a media upload request status.

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/users/returns-user-objects-that-are-blocked-by-provided-user-id

```markdown
## Authorizations

**Authorization**  
*Type:* string  
*Location:* header  
*Required:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**id**  
*Type:* string  
*Required:* required  

The ID of the authenticated source User for whom to return results.

**Example:**
```json
"2244994945"
```

## Query Parameters

**max_results**  
*Type:* integer  

The maximum number of results.  
Required range: `1 <= x <= 1000`

**pagination_token**  
*Type:* string  

This parameter is used to get a specified 'page' of results.  
Minimum length: `16`

**user.fields**  
*Type:* enum<string>[]  

A comma separated list of User fields to display.  
Minimum length: `1`

**Example:**
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**expansions**  
*Type:* enum<string>[]  

A comma separated list of fields to expand.  
Minimum length: `1`

**Example:**
```json
[
  "affiliation.user_id",
  "most_recent_tweet_id",
  "pinned_tweet_id"
]
```

**tweet.fields**  
*Type:* enum<string>[]  

A comma separated list of Tweet fields to display.  
Minimum length: `1`

**Example:**
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

**200**  
*Content-Type:* application/json  

The request has succeeded.

### Response Data

**data**  
*Type:* object[]  
Minimum length: `1`

### Response Errors

**errors**  
*Type:* object[]  
Minimum length: `1`

### Response Includes

**includes**  
*Type:* object  

### Response Meta

**meta**  
*Type:* object  
```



## Page: https://docs.x.com/resources/tools-and-libraries

```markdown
## Tools and Libraries

### X API

The X API is a set of programmatic tools that can be used to learn from and engage with the conversation on X.  
[Explore tools](/x-api/tools-and-libraries/overview)  

### X Ads API

The X Ads API allows you to programmatically integrate with the X Ads platform.  

[Explore tools](/x-ads-api/tools-and-libraries)  

### X for Websites

The X for Websites suite allows you to embed X’s live content into your product and optimize links to your site on X.  
[Explore tools](https://developer.x.com/docs/twitter-for-websites/tools-and-libraries)  

## General Tools

### xurl

A command line tool that can be used across the X APIs, and handles authentication for you.  
[Learn more](https://github.com/xdevplatform/xurl)  

### Postman

[Postman](https://www.getpostman.com/) is a REST client that allows us to make requests to APIs inside of a user interface. Use this guide to get started with this tool.  
[Learn more](/tutorials/postman-getting-started)  

### Embed generator

Use our embed generator to automatically build an embeddable Tweet, timeline, or button that you can add to your web property.  
[Visit publish.x.com](https://publish.x.com/#)  
```



## Page: https://docs.x.com/newsletter

Sign up for emails about the latest news, product updates, and events from the X Developer team.

<div class="flex justify-center w-full" data-as="iframe">
<iframe class="object-contain form" frameborder="0" src="https://developer.x.com/en/embedded-xdev-news-subscription" style="aspect-ratio: 500 / 1000; height: 1000px; width: 500px;"></iframe>
</div>



## Page: https://docs.x.com/x-api/posts/full-archive-search

```markdown
## Authorizations

**Authorization**  
*string* (header) **required**  
Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### query  

*string* **required**  
One query/rule/filter for matching Posts. Refer to [https://t.co/rulelength](https://t.co/rulelength) to identify the max query length.  
Required string length: `1 - 4096`  
**Example**:  
```json
"(from:TwitterDev OR from:TwitterAPI) has:media -is:retweet"
```

### start_time  

*string<date-time>*  
YYYY-MM-DDTHH:mm:ssZ. The oldest UTC timestamp from which the Posts will be provided. Timestamp is in second granularity and is inclusive (i.e. 12:00:01 includes the first second of the minute).

### end_time  

*string<date-time>*  
YYYY-MM-DDTHH:mm:ssZ. The newest, most recent UTC timestamp to which the Posts will be provided. Timestamp is in second granularity and is exclusive (i.e. 12:00:01 excludes the first second of the minute).

### since_id  

*string*  
Returns results with a Post ID greater than (that is, more recent than) the specified ID.  
**Example**:  
```json
"1346889436626259968"
```

### until_id  

*string*  
Returns results with a Post ID less than (that is, older than) the specified ID.  
**Example**:  
```json
"1346889436626259968"
```

### max_results  

*integer*  
The maximum number of search results to be returned by a request.  
**Required range**: `10 <= x <= 500`  
**default**: `10`

### next_token  

*string*  
This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
**Minimum length**: `1`

### pagination_token  

*string*  
This parameter is used to get the next 'page' of results. The value used with the parameter is pulled directly from the response provided by the API, and should not be modified.  
**Minimum length**: `1`

### sort_order  

*enum<string>*  
This order in which to return results.  
Available options: `recency`, `relevancy`

### tweet.fields  

*enum<string>[]*  
A comma separated list of Tweet fields to display.  
**Minimum length**: `1`  
**Example**:  
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

### expansions  

*enum<string>[]*  
A comma separated list of fields to expand.  
**Minimum length**: `1`

### media.fields  

*enum<string>[]*  
A comma separated list of Media fields to display.  
**Minimum length**: `1`  
**Example**:  
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

### poll.fields  

*enum<string>[]*  
A comma separated list of Poll fields to display.  
**Minimum length**: `1`  
**Example**:  
```json
[
  "duration_minutes",
  "end_datetime",
  "id",
  "options",
  "voting_status"
]
```

### user.fields  

*enum<string>[]*  
A comma separated list of User fields to display.  
**Minimum length**: `1`  
**Example**:  
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

### place.fields  

*enum<string>[]*  
A comma separated list of Place fields to display.  
**Minimum length**: `1`  
**Example**:  
```json
[
  "contained_within",
  "country",
  "country_code",
  "full_name",
  "geo",
  "id",
  "name",
  "place_type"
]
```

## Response

### data  

*object[]*  
Minimum length: `1`

### errors  

*object[]*  
Minimum length: `1`

### includes  

*object*  

### meta  

*object*
```



## Page: https://docs.x.com/x-api/posts/list-posts-timeline-by-list-id

```markdown
## Authorizations

- **Authorization**
  - **Type**: string
  - **Location**: header
  - **Required**: required
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: string
  - **Required**: required
  - **Description**: The ID of the List.
  - **Example**: `"1146654567674912769"`

## Query Parameters

- **max_results**
  - **Type**: integer
  - **Default**: 100
  - **Description**: The maximum number of results.
  - **Required range**: `1 <= x <= 100`

- **pagination_token**
  - **Type**: string
  - **Description**: This parameter is used to get the next 'page' of results.
  - **Minimum length**: `1`

- **tweet.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Tweet fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

- **expansions**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article.cover_media",
      "article.media_entities",
      "attachments.media_keys",
      "attachments.media_source_tweet",
      "attachments.poll_ids",
      "author_id",
      "edit_history_tweet_ids",
      "entities.mentions.username",
      "geo.place_id",
      "in_reply_to_user_id",
      "entities.note.mentions.username",
      "referenced_tweets.id",
      "referenced_tweets.id.attachments.media_keys",
      "referenced_tweets.id.author_id"
    ]
    ```

- **media.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Media fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "alt_text",
      "duration_ms",
      "height",
      "media_key",
      "non_public_metrics",
      "organic_metrics",
      "preview_image_url",
      "promoted_metrics",
      "public_metrics",
      "type",
      "url",
      "variants",
      "width"
    ]
    ```

- **poll.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Poll fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "duration_minutes",
      "end_datetime",
      "id",
      "options",
      "voting_status"
    ]
    ```

- **user.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **place.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Place fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "contained_within",
      "country",
      "country_code",
      "full_name",
      "geo",
      "id",
      "name",
      "place_type"
    ]
    ```

## Response

- **200**: The request has succeeded.
- **Content-Type**: application/json

### Response Data

- **data**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Errors

- **errors**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Includes

- **includes**
  - **Type**: object

### Response Meta

- **meta**
  - **Type**: object
```



## Page: https://docs.x.com/x-api/compliance/list-compliance-jobs

```markdown
## Authorizations

### Authorization

**Authorization**  
*Type*: `string`  
*Location*: `header`  
*Required*: `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Query Parameters

### type

**type**  
*Type*: `enum<string>`  
*Required*: `required`  

Type of Compliance Job to list. Available options: `tweets`, `users`.

### status

**status**  
*Type*: `enum<string>`  

Status of Compliance Job to list. Available options: `created`, `in_progress`, `failed`, `complete`.

### compliance_job.fields

**compliance_job.fields**  
*Type*: `enum<string>[]`  

A comma separated list of ComplianceJob fields to display.  
Minimum length: `1`  

**Example**:
```json
[
  "created_at",
  "download_expires_at",
  "download_url",
  "id",
  "name",
  "resumable",
  "status",
  "type",
  "upload_expires_at",
  "upload_url"
]
```

## Response

The request has succeeded.

### data

**data**  
*Type*: `object[]`  

Minimum length: `1`  

### errors

**errors**  
*Type*: `object[]`  

Minimum length: `1`  

### meta

**meta**  
*Type*: `object`  
```



## Page: https://docs.x.com/x-api/account-activity/get-a-count-of-subscriptions-that-are-currently-active-on-your-account

```markdown
## Authorizations

### Authorization

**Type:** `string`  
**Location:** `header`  
**Required:** `required`

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Response

The request has succeeded.

### Response Data

**data**: `object`  
The count of active subscriptions across all webhooks.

#### Child Attributes

- **data.account_name**: `string`  
  The account name.

- **data.provisioned_count**: `string`  
  The limit for subscriptions for this app.

- **data.subscriptions_count_all**: `string`  
  The number of active subscriptions across all webhooks.

- **data.subscriptions_count_direct_messages**: `string`  
  The number of active direct message subscriptions.

### Response Errors

**errors**: `object[]`  
Minimum length: `1`
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/oauth-echo

### OAuth Echo

OAuth Echo is a means to securely delegate OAuth authorization with a third party while interacting with an API.

There are four parties involved in this interaction:

- **the User** who is using X through a particular, authorized X application
- **the Consumer**, or the X application that is attempting to interact with the 3rd party media provider (e.g. the photo-sharing site)
- **the Delegator**, or the 3rd party media provider
- **the Service Provider** a.k.a. X itself

Essentially, prepare a request for the delegator to send to the X API on behalf of an application and a user. Add what would otherwise be a signed OAuth request into an HTTP header and ask the delegator to send that request to X after completing the intermediary operation.

Here’s an example: the User wants to upload a photo. The Consumer is going to call upload on the Delegator with a POST. The POST should contain the image, but it should also contain two additional items as HTTP headers:

- `x-auth-service-provider` — effectively, this is the realm that identity delegation should be sent to — in the case of X, set this to [https://api.x.com/1.1/account/verify_credentials.json](https://api.x.com/1.1/account/verify_credentials.json). iOS5-based X integrations will add an additional application_id parameter to this URL that will also be used to calculate the oauth_signature used in `x-verify-credentials-authorization`.
- `x-verify-credentials-authorization` — Consumer should create all the OAuth parameters necessary so it could call [https://api.x.com/1.1/account/verify_credentials.json](https://api.x.com/1.1/account/verify_credentials.json) using OAuth in the HTTP header (e.g. it should look like OAuth oauth_consumer_key=”…”, oauth_token=”…”, oauth_signature_method=”…”, oauth_signature=”…”, oauth_timestamp=”…”, oauth_nonce=”…”, oauth_version=”…”).

Keep in mind that the entire transaction period needs to occur within an amount of time where the `oauth_timestamp` will still be valid.

Alternatively, instead of sending these two parameters in the header, they could be sent in the POST as `x_auth_service_provider` and `x_verify_credentials_authorization` — in this case, remember to escape and include the parameters in the OAuth signature base string — similar to encoding parameters in any request. It’s best to use HTTP headers to keep the operations as separate as possible.

The Delegator's goal, at this point, is to verify that the User is who they say they are before it saves the media. Once the Delegator receives all the data above via its upload method, it should temporarily store the image, and then construct a call to the endpoint specified in the `x-auth-service-provider` header — in this case, [https://api.x.com/1.1/account/verify_credentials.json](https://api.x.com/1.1/account/verify_credentials.json), using the same OAuth authentication header provided by the Consumer in the `x-verify-credentials-authorization` header.

#### OAuth Echo best practices

Use the URL provided by `x-auth-service-provider` to perform the lookup, *not* a hard-coded value. Apple iOS, for example, adds an additional application_id parameter to all OAuth requests, and its existence should be maintained at each stage of OAuth Echo.

For the OAuth authorization portion, take the header value in `x-verify-credentials-authorization`, and place that into its own Authorization header for its call to the service provider. For good measure, confirm that the value in `x-auth-service-provider` is what it should be.

- If the Service Provider returns an HTTP 200, then good. The Delegator should permanently store the image, generate a URL, and return it.
- If the Service Provider doesn’t return an HTTP 200, then dump the image, and then return an error back to the Consumer.



## Page: https://docs.x.com/fundamentals/authentication/oauth-2-0/application-only

### App only authentication and OAuth 2.0 Bearer Token

X offers applications the ability to issue authenticated requests on behalf of the application itself, as opposed to on behalf of a specific user. X’s implementation is based on the [Client Credentials Grant](http://tools.ietf.org/html/rfc6749#section-4.4) flow of the [OAuth 2 specification](http://tools.ietf.org/html/rfc6749).

Application-only authentication doesn’t include any user-context and is a form of authentication where an application makes API requests on its own behalf. This method is for developers that just need read-only access to public information.

You can do application-only authentication using your apps consumer API keys, or by using a App only Access Token (Bearer Token). This means that the only requests you can make to a X API must not require an authenticated user.

With application-only authentication, you can perform actions such as:

- Pull user timelines
- Access friends and followers of any account
- Access lists resources
- Search Tweets

Please note that only [OAuth 1.0a](/resources/fundamentals/authentication/oauth-1-0a/api-key-and-secret) or [OAuth 2.0 Authorization Code Flow](https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code/) with PKCE is required to issue requests on behalf of users. The [API reference](/resources/fundamentals/authentication/api-reference) page describes the authentication method required to use an API. You will need user-authentication, user-context, with an [access token](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) to perform the following:

- Post Tweets or other resources
- Search for users
- Use any geo endpoint
- Access Direct Messages or account credentials
- Retrieve user’s email addresses

#### Auth Flow

To use this method, you need to use a [App only Access Token](/resources/fundamentals/authentication/oauth-2-0/application-only) (also known as [Bearer Token](/resources/fundamentals/authentication/oauth-2-0/bearer-tokens)). You can generate an App only Access Token (Bearer Token) by passing your consumer key and secret through the [POST oauth2/token](https://developer.x.com/en/docs/authentication/api-reference#post-oauth2-token) endpoint.

The application-only auth flow follows these steps:

1. An application encodes its consumer key and secret into a specially encoded set of credentials.
2. An application makes a request to the [POST oauth2/token](https://developer.x.com/en/docs/authentication/api-reference#post-oauth2-token) endpoint to exchange these credentials for an [App only Access Token](/resources/fundamentals/authentication/oauth-2-0/application-only).
3. When accessing the REST API, the application uses the App only Access Token to authenticate.

Because there is no need to sign a request, this approach is much simpler than the standard OAuth 1.0a model.

#### About application-only auth

**Tokens are passwords**

Keep in mind that the consumer key & secret and the App only Access Token (Bearer Token) itself grant access to make requests on behalf of an application. These values should be considered as sensitive as passwords, and must not be shared or distributed to untrusted parties.

**SSL required**

All requests (both to obtain and use the tokens) *must* use HTTPS endpoints. Follow the best practices detailed in [Connecting to X API using TLS](/resources/fundamentals/authentication/guides/tls) — peers should **always** be verified.

**No user-context**

When issuing requests using application-only auth, there is no concept of a “current user”. Therefore, endpoints such as [POST statuses/update](/x-api/posts/creation-of-a-post) will not function with application-only auth. See [using OAuth](/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) for more information for issuing requests on behalf of a user.

**Rate limiting**

Applications have two kinds of rate limiting pools.

Requests made on behalf of users with access tokens, also known as user-context, deplete from a different rate limiting context than that used in application-only authentication. So, in other words, requests made on behalf of users will not deplete from the rate limits available through app-only auth, and requests made through app-only auth will not deplete from the rate limits used in user-based auth.

Read more about [API Rate Limiting](/x-api/fundamentals/rate-limits) and [review the limits](https://developer.x.com/en/portal/products).

#### Issuing application-only requests

**Step 1: Encode consumer key and secret**

The steps to encode an application’s consumer key and secret into a set of credentials to obtain a Bearer Token are:

1. URL encode the consumer key and consumer secret according to [RFC 1738](http://www.ietf.org/rfc/rfc1738.txt). Note that at the time of writing, this will not actually change the consumer key and secret, but this step should still be performed in case the format of those values changes in the future.
2. Concatenate the encoded consumer key, a colon character ”:”, and the encoded consumer secret into a single string.
3. [Base64 encode](http://en.wikipedia.org/wiki/Base64) the string from the previous step.

Below are example values showing the result of this algorithm. Note that the consumer secret used in this page is for test purposes and will not work for real requests.

| Consumer key | xvz1evFS4wEEPTGEFPHBog |
|--------------|-------------------------|
| Consumer secret | L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg |
| RFC 1738 encoded consumer key (does not change) | xvz1evFS4wEEPTGEFPHBog |
| RFC 1738 encoded consumer secret (does not change) | L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg |
| Bearer Token credentials | xvz1evFS4wEEPTGEFPHBog:L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg |
| Base64 encoded Bearer Token credentials | eHZ6MWV2RlM0d0VFUFRHRUZQSEJvZzpMOHFxOVBaeVJnNmllS0dFS2hab2xHQzB2SldMdzhpRUo4OERSZHlPZw== |

**Step 2: Obtain an App only Access Token (Bearer Token)**

The value calculated in step 1 must be exchanged for an App only Access Token by issuing a request to [POST oauth2/token](https://developer.x.com/en/docs/authentication/api-reference#post-oauth2-token):

- The request must be an HTTP POST request.
- The request must include an `Authorization` header with the value of `Basic <base64 encoded value from step 1>.`
- The request must include a `Content-Type` header with the value of `application/x-www-form-urlencoded;charset=UTF-8.`
- The body of the request must be `grant_type=client_credentials.`

**Example request (Authorization header has been wrapped):**

```
POST /oauth2/token HTTP/1.1
Host: api.x.com
User-Agent: My X App v1.0.23
Authorization: Basic eHZ6MWV2RlM0d0VFUFRHRUZQSEJvZzpMOHFxOVBaeVJnNmllS0dFS2hab2xHQzB2SldMdzhpRUo4OERSZHlPZw==
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Content-Length: 29
Accept-Encoding: gzip

grant_type=client_credentials
```

If the request was formatted correctly, the server would respond with a JSON-encoded payload:

**Example response:**

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 140

{
  "token_type": "bearer",
  "access_token": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%2FAAAAAAAAAAAAAAAAAAAA%3DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
}
```

Applications should verify that the value associated with the `token_type` key of the returned object is `bearer`. The value associated with the `access_token` key is the App only Access Token (Bearer Token).

Note that one App only Access Token is valid for an application at a time. Issuing another request with the same credentials to `/oauth2/token` will return the same token until it is invalidated.

**Step 3: Authenticate API requests with the App only Access Token (Bearer Token)**

The App only Access Token (Bearer Token) may be used to issue requests to API endpoints that support application-only auth. To use the App Access Token, construct a normal HTTPS request and include an `Authorization` header with the value of `Bearer <base64 bearer token value from step 2>. Signing is not required.

**Example request (Authorization header has been wrapped):**

```
GET /1.1/statuses/user_timeline.json?count=100&screen_name=twitterapi HTTP/1.1
Host: api.x.com
User-Agent: My X App v1.0.23
Authorization: Bearer AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%2FAAAAAAAAAAAA
                      AAAAAAAA%3DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Accept-Encoding: gzip
```

**Invalidating an App only Access Token (Bearer Token)**

Should an App only Access Token become compromised or need to be invalidated for any reason, issue a call to [POST oauth2/invalidate_token](https://developer.x.com/en/docs/authentication/api-reference#post-oauth2-invalidate-token).

**Example request (Authorization header has been wrapped):**

```
POST /oauth2/invalidate_token HTTP/1.1
Authorization: Basic eHZ6MWV2RlM0d0VFUFRHRUZQSEJvZzpMOHFxOVBaeVJnNmllS0dFS2hab2xHQzB2SldMdzhpRUo4OERSZHlPZw==
User-Agent: My X App v1.0.23
Host: api.x.com
Accept: */*
Content-Length: 119
Content-Type: application/x-www-form-urlencoded

access_token=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%2FAAAAAAAAAAAAAAAAAAAA%3DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

**Example response:**

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 127

{
  "access_token": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%2FAAAAAAAAAAAAAAAAAAAA%3DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
}
```

#### Common error cases

This section describes some common mistakes involved in the negotiation and use of Bearer Tokens. Be aware that not all possible error responses are covered here - be observant of unhandled error codes and responses.

**Invalid requests to obtain or revoke an App only Access Token**

Attempts to:

- Obtain a App only Access Token (Bearer Token) with an invalid request (for example, leaving out `grant_type=client_credentials`).
- Obtain or revoke an App only Access Token (Bearer Token) with incorrect or expired app credentials.
- Invalidate an incorrect or revoked App only Access Token (Bearer Token).
- Obtain an App only Access Token (Bearer Token) too frequently in a short period of time.

Will result in:

```
HTTP/1.1 403 Forbidden
Content-Length: 105
Content-Type: application/json; charset=utf-8

{
  "errors": [{
    "code": 99,
    "label": "authenticity_token_error",
    "message": "Unable to verify your credentials"
  }]
}
```

#### API request contains invalid App only Access Token (Bearer Token)

Using an incorrect or revoked Access Token to make API requests will result in:

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
Content-Length: 61

{
  "errors": [{
    "message": "Invalid or expired token",
    "code": 89
  }]
}
```

#### App only Access Token (Bearer Token) used on endpoint which doesn’t support application-only auth

Requesting an endpoint which requires a user context (such as `statuses/home_timeline`) with an App only Access Token (Bearer Token) will produce:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Content-Length: 91

{
  "errors": [{
    "message": "Your credentials do not allow access to this resource",
    "code": 220
  }]
}
```



## Page: https://docs.x.com/fundamentals/authentication/api-reference

### OAuth 1.0a

| Purpose                                                                                                       | Method                              |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------|
| Step 1 of the 3-legged OAuth flow and Sign in with X  <br/>Allows a Consumer application to obtain an OAuth Request Token to request user authorization. | [POST oauth/request_token](/resources/fundamentals/authentication/api-reference#post-oauth-request-token) |
| Step 2 of the 3-legged OAuth flow and Sign in with X  <br/>Allows a Consumer application to use an OAuth Request Token to request user authorization. | [GET oauth/authenticate](/resources/fundamentals/authentication/api-reference#get-oauth-authenticate) |
| Step 2 of the 3-legged OAuth flow and Sign in with X  <br/>Allows a Consumer application to use an OAuth Request Token to request user authorization. | [GET oauth/authorize](/resources/fundamentals/authentication/api-reference#get-oauth-authorize) |
| Step 3 of the 3-legged OAuth flow and Sign in with X  <br/>Allows a Consumer application to exchange the OAuth Request Token for an OAuth Access Token. | [POST oauth/access_token](/resources/fundamentals/authentication/api-reference#post-oauth-access-token) |
| Allows a registered application to revoke an issued OAuth Access Token.                                      | [POST oauth/invalidate_token](/resources/fundamentals/authentication/api-reference#post-oauth-invalidate-token) |

### OAuth 2.0 Bearer Token

| Purpose                                                                                                       | Method                              |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------|
| Allows a registered App to generate an OAuth 2 app-only Bearer Token, which can be used to make API requests on an App’s behalf, without user context. | [POST oauth2/token](/resources/fundamentals/authentication/api-reference#post-oauth2-token) |
| Allows a registered App to revoke an issued OAuth 2 app-only Bearer Token.                                   | [POST oauth2/invalidate_token](/resources/fundamentals/authentication/api-reference#post-oauth2-invalidate-token) |

### POST oauth/request_token

Allows a Consumer application to obtain an OAuth Request Token to request user authorization. This method fulfills [Section 6.1](https://oauth.net/core/1.0/#auth_step1) of the [OAuth 1.0 authentication flow](http://oauth.net/core/1.0/#anchor9).

**We require you use HTTPS for all OAuth authorization steps.**

**Usage Note:** Only ASCII values are accepted for the `oauth_nonce`

**Resource URL**  
`https://api.x.com/oauth/request_token`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | No   |
| Rate limited?            | Yes  |

**Parameters**

| Name            | Required | Description                                                                                                                                                                                                                                                                                                                                                                          | Example                             |
|-----------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| oauth_callback   | required | For OAuth 1.0a compliance this parameter is **required**. The value you specify here will be used as the URL a user is redirected to should they approve your application’s access to their account. Set this to `oob` for out-of-band pin mode. This is also how you specify custom callbacks for use in desktop/mobile applications. Always send an `oauth_callback` on this step, regardless of a pre-registered callback. | `http://themattharris.local/auth.php` `twitterclient://callback` |
| x_auth_access_type | optional | Overrides the access level an application requests to a user's account. Supported values are `read` or `write`. This parameter is intended to allow a developer to register a read/write application but also request read-only access when appropriate.                                                                                                                                                       |                                     |

Learn more about how to approve your callback URLs on [this page](/resources/fundamentals/developer-apps#callback-urls).

**Please note** - You can view and edit your existing [X apps](/resources/fundamentals/developer-apps) via the [X app dashboard](https://developer.x.com/en/apps) if you are logged into your X account on developer.x.com.

**Example request**  
Request URL: `POST https://api.x.com/oauth/request_token`  
Request POST Body: *N/A*  
Authorization Header: 
```
OAuth oauth_nonce="K7ny27JTpKVsTgdyLdDfmQQWVLERj2zAK5BslRsqyw", oauth_callback="http%3A%2F%2Fmyapp.com%3A3005%2Ftwitter%2Fprocess_callback", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1300228849", oauth_consumer_key="OqEqJeafRSF11jBMStrZz", oauth_signature="Pc%2BMLdv028fxCErFyi8KXFM%2BddU%3D", oauth_version="1.0"
```
Response: 
```
oauth_token=Z6eEdO8MOmk394WozF5oKyuAv855l4Mlqo7hhlSLik&oauth_token_secret=Kd75W4OQfb2oJTV0vzGzeXftVAwgMnEK9MumzYcM&oauth_callback_confirmed=true
```

### GET oauth/authorize

Allows a Consumer application to use an OAuth Request Token to request user authorization. This method fulfills [Section 6.2](http://oauth.net/core/1.0/#auth_step2) of the [OAuth 1.0 authentication flow](http://oauth.net/core/1.0/#anchor9). Desktop applications must use this method (and cannot use [GET oauth / authenticate](/resources/fundamentals/authentication/api-reference#get-oauth-authenticate)).

**Usage Note:** An `oauth_callback` is never sent to this method, provide it to [POST oauth / request_token](/resources/fundamentals/authentication/api-reference#post-oauth-request-token) instead.

**Resource URL**  
`https://api.x.com/oauth/authorize`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | Yes  |
| Rate limited?            | Yes  |

**Parameters**

| Name        | Required | Description                                                                                                           | Default Value | Example |
|-------------|----------|-----------------------------------------------------------------------------------------------------------------------|---------------|---------|
| force_login | optional | Forces the user to enter their credentials to ensure the correct user's account is authorized.                       |               |         |
| screen_name | optional | Prefills the username input box of the OAuth login screen with the given value.                                     |               |         |

**Example request**  
Send the user to the `oauth/authorize` step in a web browser, including an oauth_token parameter:  
```
https://api.x.com/oauth/authorize?oauth_token=Z6eEdO8MOmk394WozF5oKyuAv855l4Mlqo7hhlSLik
```

### GET oauth/authenticate

Allows a Consumer application to use an OAuth `request_token` to request user authorization. This method is a replacement of [Section 6.2](http://oauth.net/core/1.0/#auth_step2) of the [OAuth 1.0 authentication flow](http://oauth.net/core/1.0/#anchor9) for applications using the callback authentication flow. The method will use the currently logged in user as the account for access authorization unless the `force_login` parameter is set to `true`.

This method differs from [GET oauth / authorize](/resources/fundamentals/authentication/api-reference#get-oauth-authorize) in that if the user has already granted the application permission, the redirect will occur without the user having to re-approve the application. To realize this behavior, you must enable the *Use Sign in with X* setting on your [application record](https://developer.x.com/apps).

**Resource URL**  
`https://api.x.com/oauth/authenticate`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | Yes  |
| Rate limited?            | Yes  |

**Parameters**

| Name        | Required | Description                                                                                                           | Default Value | Example |
|-------------|----------|-----------------------------------------------------------------------------------------------------------------------|---------------|---------|
| force_login | optional | Forces the user to enter their credentials to ensure the correct user's account is authorized.                       |               | *true*  |
| screen_name | optional | Prefills the username input box of the OAuth login screen with the given value.                                     |               |         |

**Example request**  
Send the user to the `oauth/authenticate` step in a web browser, including an oauth_token parameter:  
```
https://api.x.com/oauth/authenticate?oauth_token=Z6eEdO8MOmk394WozF5oKyuAv855l4Mlqo7hhlSLik
```

### POST oauth/access_token

Allows a Consumer application to exchange the OAuth Request Token for an OAuth Access Token. This method fulfills [Section 6.3](http://oauth.net/core/1.0/#auth_step3) of the [OAuth 1.0 authentication flow](http://oauth.net/core/1.0/#anchor9).

**Resource URL**  
`https://api.x.com/oauth/access_token`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | Yes  |
| Rate limited?            | Yes  |

**Parameters**

| Name            | Required | Description                                                                                                           | Default Value | Example |
|-----------------|----------|-----------------------------------------------------------------------------------------------------------------------|---------------|---------|
| oauth_token     | required | The oauth_token here must be the same as the oauth_token returned in the request_token step.                        |               |         |
| oauth_verifier  | required | If using the OAuth web-flow, set this parameter to the value of the *oauth_verifier* returned in the callback URL. If you are using out-of-band OAuth, set this value to the pin-code. For OAuth 1.0a compliance this parameter is **required**. OAuth 1.0a is strictly enforced and applications not using the *oauth_verifier* will fail to complete the OAuth flow. |               |         |

**Example request**  
```
POST https://api.x.com/oauth/access_token?oauth_token=qLBVyoAAAAAAx72QAAATZxQWU6P&oauth_verifier=ghLM8lYmAxDbaqL912RZSRjCCEXKDIzx
```
From PIN-based 
```
POST https://api.x.com/oauth/access_token?oauth_token=9Npq8AAAAAAAx72QBRABZ4DAfY9&oauth_verifier=4868795
```

**Example response**  
```
oauth_token=6253282-eWudHldSbIaelX7swmsiHImEL4KinwaGloHANdrY&oauth_token_secret=2EEfA6BG5ly3sR3XjE0IBSnlQu4ZrUzPiYTmrkVU&user_id=6253282&screen_name=xapi
```

### POST oauth/invalidate_token

Allows a registered application to revoke an issued OAuth access_token by presenting its client credentials. Once an access_token has been invalidated, new creation attempts will yield a different Access Token and usage of the invalidated token will no longer be allowed.

**Resource URL**  
`https://api.x.com/1.1/oauth/invalidate_token`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | Yes - User context with the access tokens that you would like to invalidate |
| Rate limited?            | Yes  |

**Example request**
```
curl --request POST
  --url 'https://api.x.com/1.1/oauth/invalidate_token.json'
  --header 'authorization: OAuth oauth_consumer_key="CLIENT_KEY",
         oauth_nonce="AUTO_GENERATED_NONCE", oauth_signature="AUTO_GENERATED_SIGNATURE",
         oauth_signature_method="HMAC-SHA1", oauth_timestamp="AUTO_GENERATED_TIMESTAMP",
         oauth_token="ACCESS_TOKEN", oauth_version="1.0"'
```

**Example response**
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 127
...
{
  "access_token": "ACCESS_TOKEN"
}
```

**Example error response after token has been invalidated**
```
HTTP/1.1 401 Authorization Required
...
{
  "errors": [{
      "code": 89,
      "message": "Invalid or expired token."
  }]
}
```

### POST oauth2/token

Allows a registered application to obtain an OAuth 2 Bearer Token, which can be used to make API requests on an application’s own behalf, without a user context. This is called [Application-only authentication](/resources/fundamentals/authentication/oauth-2-0/application-only).

A Bearer Token may be invalidated using oauth2/invalidate_token. Once a Bearer Token has been invalidated, new creation attempts will yield a different Bearer Token and usage of the previous token will no longer be allowed.

Only one bearer token may exist outstanding for an application, and repeated requests to this method will yield the same already-existent token until it has been invalidated.

Successful responses include a JSON-structure describing the awarded Bearer Token.

Tokens received by this method should be cached. If attempted too frequently, requests will be rejected with a HTTP 403 with code 99.

**Resource URL**  
`https://api.x.com/oauth2/token`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | Yes - Basic auth with your API key as your username and API key secret as your password |
| Rate limited?            | Yes  |

**Parameters**

| Name        | Required | Description                                                                                                           | Default Value | Example           |
|-------------|----------|-----------------------------------------------------------------------------------------------------------------------|---------------|-------------------|
| grant_type  | required | Specifies the type of grant being requested by the application. At this time, only *client_credentials* is allowed. See [Application-Only Authentication](/resources/fundamentals/authentication/oauth-2-0/application-only) for more information. |               | *client_credentials* |

**Example request**
```
POST /oauth2/token HTTP/1.1
Host: api.x.com
User-Agent: My X App v1.0.23
Authorization: Basic eHZ6MWV2R...o4OERSZHlPZw==
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Content-Length: 29
Accept-Encoding: gzip

grant_type=client_credentials
```

**Example response:**
```
HTTP/1.1 200 OK
Status: 200 OK
Content-Type: application/json; charset=utf-8
...
{
  "access_token": "AAAA%2FAAA%3DAAAAAAAA"
}
```

### POST oauth2/invalidate_token

Allows a registered application to revoke an issued OAuth 2.0 Bearer Token by presenting its client credentials. Once a Bearer Token has been invalidated, new creation attempts will yield a different Bearer Token and usage of the invalidated token will no longer be allowed.

Successful responses include a JSON-structure describing the revoked Bearer Token.

**Resource URL**  
`https://api.x.com/oauth2/invalidate_token`

**Resource Information**

| Response formats         | JSON |
|--------------------------|------|
| Requires authentication? | Yes - [oAuth 1.0a](/resources/fundamentals/authentication/oauth-1-0a) with the application’s consumer API keys and the application owner’s access token & access token secret |
| Rate limited?            | Yes  |

**Parameters**

| Name         | Required | Description                                                                                                           |
|--------------|----------|-----------------------------------------------------------------------------------------------------------------------|
| access_token | required | The value of the bearer token that you would like to invalidate                                                       |

**Example request**
```
curl --request POST
  --url 'https://api.x.com/oauth2/invalidate_token?access_token=AAAA%2FAAA%3DAAAAAAAA'
  --header 'authorization: OAuth oauth_consumer_key="CLIENT_KEY",
         oauth_nonce="AUTO_GENERATED_NONCE", oauth_signature="AUTO_GENERATED_SIGNATURE",
         oauth_signature_method="HMAC-SHA1", oauth_timestamp="AUTO_GENERATED_TIMESTAMP",
         oauth_token="ACCESS_TOKEN", oauth_version="1.0"'
```

**Example response**
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 135
...
{
  "access_token": "AAAA%2FAAA%3DAAAAAAAA"
}
```



## Page: https://docs.x.com/x-api/users/followers-by-user-id

```markdown
## Authorizations

- **Authorization**
  - **Type**: string
  - **Location**: header
  - **Required**: required
  - **Description**: Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

- **id**
  - **Type**: string
  - **Required**: required
  - **Description**: The ID of the User to lookup.
  - **Example**: `"2244994945"`

## Query Parameters

- **max_results**
  - **Type**: integer
  - **Description**: The maximum number of results.
  - **Required range**: `1 <= x <= 1000`

- **pagination_token**
  - **Type**: string
  - **Description**: This parameter is used to get a specified 'page' of results.
  - **Minimum length**: `16`

- **user.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of User fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation",
      "confirmed_email",
      "connection_status",
      "created_at",
      "description",
      "entities",
      "id",
      "is_identity_verified",
      "location",
      "most_recent_tweet_id",
      "name",
      "parody",
      "pinned_tweet_id",
      "profile_banner_url",
      "profile_image_url",
      "protected",
      "public_metrics",
      "receives_your_dm",
      "subscription",
      "subscription_type",
      "url",
      "username",
      "verified",
      "verified_followers_count",
      "verified_type",
      "withheld"
    ]
    ```

- **expansions**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of fields to expand.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "affiliation.user_id",
      "most_recent_tweet_id",
      "pinned_tweet_id"
    ]
    ```

- **tweet.fields**
  - **Type**: enum<string>[]
  - **Description**: A comma separated list of Tweet fields to display.
  - **Minimum length**: `1`
  - **Example**:
    ```json
    [
      "article",
      "attachments",
      "author_id",
      "card_uri",
      "community_id",
      "context_annotations",
      "conversation_id",
      "created_at",
      "display_text_range",
      "edit_controls",
      "edit_history_tweet_ids",
      "entities",
      "geo",
      "id",
      "in_reply_to_user_id",
      "lang",
      "media_metadata",
      "non_public_metrics",
      "note_tweet",
      "organic_metrics",
      "possibly_sensitive",
      "promoted_metrics",
      "public_metrics",
      "referenced_tweets",
      "reply_settings",
      "scopes",
      "source",
      "suggested_source_links",
      "text",
      "withheld"
    ]
    ```

## Response

- **Status Code**: 200
- **Content Type**: application/json
- **Description**: The request has succeeded.

### Response Data

- **data**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Errors

- **errors**
  - **Type**: object[]
  - **Minimum length**: `1`

### Response Includes

- **includes**
  - **Type**: object

### Response Meta

- **meta**
  - **Type**: object
```



## Page: https://docs.x.com/x-api/direct-messages/get-dm-events-by-id

```markdown
## Authorizations

**Authorization**  
*Type*: string  
*Location*: header  
*Required*: required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**event_id**  
*Type*: string  
*Required*: required  

dm event id.  
**Example**:  
```json
"1146654567674912769"
```

## Query Parameters

**dm_event.fields**  
*Type*: enum<string>[]  

A comma separated list of DmEvent fields to display.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
Available options: 
- `attachments`
- `created_at`
- `dm_conversation_id`
- `entities`
- `event_type`
- `id`
- `participant_ids`
- `referenced_tweets`
- `sender_id`
- `text`
</details>

**Example**:
```json
[
  "attachments",
  "created_at",
  "dm_conversation_id",
  "entities",
  "event_type",
  "id",
  "participant_ids",
  "referenced_tweets",
  "sender_id",
  "text"
]
```

**expansions**  
*Type*: enum<string>[]  

A comma separated list of fields to expand.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

**Example**:
```json
[
  "attachments.media_keys",
  "participant_ids",
  "referenced_tweets.id",
  "sender_id"
]
```

**media.fields**  
*Type*: enum<string>[]  

A comma separated list of Media fields to display.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

**Example**:
```json
[
  "alt_text",
  "duration_ms",
  "height",
  "media_key",
  "non_public_metrics",
  "organic_metrics",
  "preview_image_url",
  "promoted_metrics",
  "public_metrics",
  "type",
  "url",
  "variants",
  "width"
]
```

**user.fields**  
*Type*: enum<string>[]  

A comma separated list of User fields to display.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

**Example**:
```json
[
  "affiliation",
  "confirmed_email",
  "connection_status",
  "created_at",
  "description",
  "entities",
  "id",
  "is_identity_verified",
  "location",
  "most_recent_tweet_id",
  "name",
  "parody",
  "pinned_tweet_id",
  "profile_banner_url",
  "profile_image_url",
  "protected",
  "public_metrics",
  "receives_your_dm",
  "subscription",
  "subscription_type",
  "url",
  "username",
  "verified",
  "verified_followers_count",
  "verified_type",
  "withheld"
]
```

**tweet.fields**  
*Type*: enum<string>[]  

A comma separated list of Tweet fields to display.  
Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

**Example**:
```json
[
  "article",
  "attachments",
  "author_id",
  "card_uri",
  "community_id",
  "context_annotations",
  "conversation_id",
  "created_at",
  "display_text_range",
  "edit_controls",
  "edit_history_tweet_ids",
  "entities",
  "geo",
  "id",
  "in_reply_to_user_id",
  "lang",
  "media_metadata",
  "non_public_metrics",
  "note_tweet",
  "organic_metrics",
  "possibly_sensitive",
  "promoted_metrics",
  "public_metrics",
  "referenced_tweets",
  "reply_settings",
  "scopes",
  "source",
  "suggested_source_links",
  "text",
  "withheld"
]
```

## Response

**200**  
*Content-Type*: application/json  

The request has succeeded.

**data**  
*Type*: object  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
*Type*: object[]  

Minimum length: `1`  

<details>
<summary>Show child attributes</summary>
</details>

**includes**  
*Type*: object  

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/authentication/oauth-1-0a/pin-based-oauth

### PIN-based authorization

The PIN-based OAuth flow is a version of the [3-legged OAuth](https://example.com/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) process and is intended for applications that cannot access or embed a web browser to redirect the user after authorization. Examples of such applications would be command-line applications, embedded systems, game consoles, and certain types of mobile apps.

PIN-based OAuth flow is initiated by an app in the `request_token` with the `oauth_callback` set to `oob`. The term `oob` means out-of-band OAuth. The user still visits X to login or authorize the app, but they will not be automatically redirected to the application upon approving access. Instead, they will see a numerical PIN code, with instructions to return to the application and enter this value.

> **Note:** The `callback_url` within the X app settings is still required, even when using PIN-based auth.

#### Implementing the PIN-based OAuth flow

The PIN-based flow is implemented in the same way as [3-legged authorization](https://example.com/resources/fundamentals/authentication/oauth-1-0a/obtaining-user-access-tokens) (and [Sign in with X](https://example.com/resources/fundamentals/authentication#log-in-with-x)), with the following differences:

1. The value for `oauth_callback` must be set to `oob` during the [POST oauth/request_token](https://example.com/resources/fundamentals/authentication/api-reference#post-oauth-request-token) call.
2. After the user is sent to X to authorize your app using either a [GET oauth/authenticate](https://example.com/resources/fundamentals/authentication/api-reference#get-oauth-authenticate) or [GET oauth/authorize URL](https://example.com/resources/fundamentals/authentication/api-reference#get-oauth-authorize), they will not be redirected to your `callback_url`, instead they will see a screen with a X generated ~7 digit PIN with directions to enter the PIN into your application's name.
3. The user enters this PIN into your application, and your application uses the PIN number as the `oauth_verifier` in the [POST oauth/access_token](https://example.com/resources/fundamentals/authentication/api-reference#post-oauth-access-token) to obtain an access_token.

> **Note:** PIN numbers are not reusable, and the `access_token` obtained should be used for application-user requests.



## Page: https://docs.x.com/x-api/users/returns-user-objects-that-are-muted-by-the-provided-user-id

```markdown
### Authorizations

- **Authorization**
  - Type: `string`
  - Location: `header`
  - **Required**: Yes
  - The access token received from the authorization server in the OAuth 2.0 flow.

### Path Parameters

- **id**
  - Type: `string`
  - **Required**: Yes
  - The ID of the authenticated source User for whom to return results.
  
  **Example**:
  ```json
  "2244994945"
  ```

### Query Parameters

- **max_results**
  - Type: `integer`
  - Default: `100`
  - The maximum number of results.
  
  **Required range**: `1 <= x <= 1000`

- **pagination_token**
  - Type: `string`
  - This parameter is used to get the next 'page' of results.
  
  **Required string length**: `1 - 19`

- **user.fields**
  - Type: `enum<string>[]`
  - A comma separated list of User fields to display.
  
  **Minimum length**: `1`
  
  **Example**:
  ```json
  [
    "affiliation",
    "confirmed_email",
    "connection_status",
    "created_at",
    "description",
    "entities",
    "id",
    "is_identity_verified",
    "location",
    "most_recent_tweet_id",
    "name",
    "parody",
    "pinned_tweet_id",
    "profile_banner_url",
    "profile_image_url",
    "protected",
    "public_metrics",
    "receives_your_dm",
    "subscription",
    "subscription_type",
    "url",
    "username",
    "verified",
    "verified_followers_count",
    "verified_type",
    "withheld"
  ]
  ```

- **expansions**
  - Type: `enum<string>[]`
  - A comma separated list of fields to expand.
  
  **Minimum length**: `1`
  
  **Example**:
  ```json
  [
    "affiliation.user_id",
    "most_recent_tweet_id",
    "pinned_tweet_id"
  ]
  ```

- **tweet.fields**
  - Type: `enum<string>[]`
  - A comma separated list of Tweet fields to display.
  
  **Minimum length**: `1`
  
  **Example**:
  ```json
  [
    "article",
    "attachments",
    "author_id",
    "card_uri",
    "community_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "display_text_range",
    "edit_controls",
    "edit_history_tweet_ids",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "media_metadata",
    "non_public_metrics",
    "note_tweet",
    "organic_metrics",
    "possibly_sensitive",
    "promoted_metrics",
    "public_metrics",
    "referenced_tweets",
    "reply_settings",
    "scopes",
    "source",
    "suggested_source_links",
    "text",
    "withheld"
  ]
  ```

### Response

- **Response Code**: `200`
- **Content Type**: `application/json`
- **Description**: The request has succeeded.

#### Response Data

- **data**
  - Type: `object[]`
  
  **Minimum length**: `1`

#### Response Errors

- **errors**
  - Type: `object[]`
  
  **Minimum length**: `1`

#### Response Includes

- **includes**
  - Type: `object`

#### Response Meta

- **meta**
  - Type: `object`
```



## Page: https://docs.x.com/x-api/compliance/get-compliance-job

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Required:* `required`  

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

## Path Parameters

**id**  
*Type:* `string`  
*Required:* `required`  

The ID of the Compliance Job to retrieve.

**Example:**  
`"1372966999991541762"`

## Query Parameters

**compliance_job.fields**  
*Type:* `enum<string>[]`  

A comma separated list of ComplianceJob fields to display.  
Minimum length: `1`

**Example:**  
```json
[
  "created_at",
  "download_expires_at",
  "download_url",
  "id",
  "name",
  "resumable",
  "status",
  "type",
  "upload_expires_at",
  "upload_url"
]
```

## Response

**200**  
*Content-Type:* `application/json`  

The request has succeeded.

### Response Data

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

### Response Errors

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/fundamentals/x-ids

Each object within X - a Tweet, Direct Message, User, List, and so on - has a unique ID.

At the very beginning of the platform, these IDs were small enough numbers that they could be generated sequentially. Over time, to accommodate growth, the IDs moved from being 32-bit, to 64-bit. Today, X IDs are unique 64-bit unsigned integers, which are based on time, instead of being sequential. The full ID is composed of a timestamp, a worker number, and a sequence number. X developed an internal service known as “Snowflake” in order to consistently generate these IDs ([read more about this on the X blog](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake.html)).

Numbers as large as 64-bits can cause issues with programming languages that represent integers with fewer than 64-bits. An example of this is JavaScript, where integers are limited to 53-bits in size. In order to provide a workaround for this, in the original designs of the X API (v1/1.1), ID values were returned in two formats: both as integers, and as strings.

```json
{
  "id": 10765432100123456789,
  "id_str": "10765432100123456789"
}
```

If you run the command `(10765432100123456789).toString()` in a browser JavaScript console, the result will be `"10765432100123458000"` - the 64-bit integer loses accuracy as a result of the translation (this is sometimes called “munging” - a destructive change to a piece of data).

In X APIs up to version 1.1, you should always use the string representation of the number to avoid losing accuracy.

In newer versions of the API, all large integer values are represented as strings by default.



## Page: https://docs.x.com/x-api/direct-messages/send-a-new-message-to-a-dm-conversation

```markdown
## Authorizations

**Authorization**  
*Type:* `string`  
*Location:* `header`  
*Status:* required  

The access token received from the authorization server in the OAuth 2.0 flow.

## Path Parameters

**dm_conversation_id**  
*Type:* `string`  
*Status:* required  

The DM Conversation ID.

## Body

*Content-Type:* `application/json`

### Option 1

**text**  
*Type:* `string`  
*Status:* required  

Text of the message.  
Minimum length: `1`

**attachments**  
*Type:* `object[]`  

Attachments to a DM Event.

<details>
<summary>Show child attributes</summary>
</details>

## Response

*Status:* `201`  
*Content-Type:* `application/json`  

The request has succeeded.

**data**  
*Type:* `object`  

<details>
<summary>Show child attributes</summary>
</details>

**errors**  
*Type:* `object[]`  

Minimum length: `1`

<details>
<summary>Show child attributes</summary>
</details>
```



## Page: https://docs.x.com/x-api/compliance/users-compliance-stream

```markdown
# 404

## Page Not Found

We couldn't find the page. Maybe you were looking for one of these pages below?

- [Stream Users compliance data](/x-api/stream/stream-users-compliance-data#)
- [Compliance Firehose API](/x-api/enterprise-gnip-2.0/fundamentals/firehouse#compliance-firehose-api)
- [About the X API](/x-api/getting-started/about-x-api#about-the-x-api)
```