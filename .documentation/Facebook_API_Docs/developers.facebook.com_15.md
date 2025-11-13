# API Documentation

**Source URL:** https://developers.facebook.com/docs/pages-api/
**Scraped Date:** 2025-11-12 16:13:54

---



## Page: https://developers.facebook.com/docs/pages-api/

```markdown
# API de páginas de Facebook

La API de páginas de Facebook de Meta permite que las apps accedan y actualicen la configuración y el contenido de una página de Facebook, creen y obtengan publicaciones, reciban comentarios sobre el contenido de la página, obtengan estadísticas de la página, actualicen las acciones que los usuarios pueden realizar en la página y mucho más.

Este documento contiene las guías que te proporcionarán más información sobre la API de páginas de Facebook y cómo implementarla.

## Contenido de la documentación

Te recomendamos leer cada guía en el orden que se describe en este documento, a continuación.

1. [Información general](https://developers.facebook.com/docs/pages/overview): aprende sobre la API de páginas y su funcionamiento.
2. [Primeros pasos](https://developers.facebook.com/docs/pages/getting-started): tutorial introductorio que muestra cómo hacer una publicación en tu página de Facebook.
3. [Gestionar una página](https://developers.facebook.com/docs/pages/managing): consigue una lista de tus páginas con tareas que puedes realizar en cada uno de los tokens de acceso de páginas y actualiza la configuración de estas.
4. [Publicaciones y comentarios](https://developers.facebook.com/docs/pages/publishing): crear, publicar, actualizar y eliminar publicaciones y comentarios de páginas.
5. [Estadísticas de páginas](https://developers.facebook.com/docs/platforminsights/page): obtén estadísticas de tus publicaciones de páginas.
6. [Búsqueda de páginas](https://developers.facebook.com/docs/pages/searching): busca páginas.
7. [Pestañas de páginas](https://developers.facebook.com/docs/pages/tabs): obtén una lista de pestañas para tu página.
8. [Webhooks de Meta](https://developers.facebook.com/docs/pages/webhooks): haz que lleguen notificaciones en tiempo real a tu servidor sobre eventos que tengan lugar en tu página.
9. [Cambios futuros](https://developers.facebook.com/docs/pages/upcoming-changes): recibe notificaciones sobre cambios venideros que Meta implementará en tu página.
10. [Códigos de error](https://developers.facebook.com/docs/pages/error-codes): mira códigos de error y sus descripciones para hallar errores que puedas encontrar al implementar la API de páginas.
11. [Registro de cambios](https://developers.facebook.com/docs/pages/changelog): visualiza el registro de cambios de la API de páginas.
```



## Page: https://developers.facebook.com/docs/pages/upcoming-changes

```markdown
# Page Upcoming Changes API

This document explains how to use the Page Upcoming Changes API to view and accept or reject changes suggested by Facebook to fix possible errors on your Facebook Page.

## Before You Start

You will need:

- the [pages_manage_metadata permission](https://developers.facebook.com/docs/pages/overview-1#permissions)
- a [Page access token](https://developers.facebook.com/docs/pages/access-tokens/) requested by a person who is able to perform the [MODERATE task](https://developers.facebook.com/docs/pages/access-tokens#page-tasks) on the Page that is being queried

## Get Proposed Changes

Send a `GET` request to the `/{page-id}`:

```bash
curl -i -X GET "https://graph.facebook.com/{page-id}?access_token={page-access-token}"
```

On success, your app receives the following response:

```json
{
  "data": [
    {
      "id": "{proposed-change-1-id}",
      "page": {
        "name": "My Page",
        "id": "{page-id}"
      },
      "effective_time": "2017-10-16T10:19:49+0000",
      "timer_status": "stopped",           // this proposal was accepted or rejected
      "change_type": "knowledge_proposal",
      "proposal": {
        "id": "1570719759662530",
        "category": "category",
        "current_value": "273819889375819, 161516070564222, 152142351517013",
        "proposed_value": "273819889375819, 161516070564222, 152142351517013, 273819889375819"
      }
    },
    {
      "id": "{proposed-change-2-id}",
      "page": {
        "name": "My Page",
        "id": "{page-id}"
      },
      "effective_time": "2017-11-21T07:03:54+0000",
      "timer_status": "already_fired",   // this proposal was automatically accepted
      "change_type": "knowledge_proposal",
      "proposal": {
        "id": "1603101113091061",
        "category": "category",
        "current_value": "273819889375819, 161516070564222, 152142351517013",
        "proposed_value": "273819889375819, 161516070564222, 152142351517013, 273819889375819",
        "acceptance_status": "accepted"
      }
    }
  ]
}
```

## Accept or Reject a Proposed Change

Send a `POST` request to the `/{proposal-id}` endpoint with the `accept` field set to `true` to accept the change or `false` to reject it:

```bash
curl -i -X POST "https://graph.facebook.com/{proposal-id}?accept=true&access_token={page-access-token}"
```

On success, your app receives the following response:

```json
{
  "succeed": true
}
```

## Page Change Webhooks

[Subscribe](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages) to the `page_upcoming_change` and/or the `page_change_proposal`.

Your callback URL will receive the following notification for the `page_upcoming_change` webhook:

```json
{
  "field": "page_upcoming_change",
  "action": "pending",           // can also be accepted_manually, accepted_automatically and rejected_manually
  "value": {
    "id": "123456",              // id of upcoming change
    "page": {
      "id": "7878832",           // id of page where the action is taken
      "name": "Page Name"
    },
    "effective_time": "2017-03-01 12:00:00",
    "change_type": "knowledge_proposal",
    "timer_status": "active",
    "proposal": {
      "id": "id of the page change proposal",
      "category": "menu link",
      "acceptance_status": "pending", // can also be accepted or rejected
      "current_value": "https://www.oldmenu.com/",
      "proposed_value": "https://www.newmenu.com/"
    }
  }
}
```

Your callback URL will receive the following notification for the `page_change_proposal` webhook:

```json
{
  "field": "page_change_proposal",
  "action": "created",
  "value": {
    "id": "{change-proposal-id}",
    "category": "menu link",
    "current_value": "https://www.menuold.com/",
    "proposed_value": "https://www.menunew.com/",
    "acceptance_status": "pending"
  }
}
```

## Reference

### Webhooks

| Webhook Field                  | Description                                                                                     |
|--------------------------------|-------------------------------------------------------------------------------------------------|
| [`page_change_proposal`](https://developers.facebook.com/docs/graph-api/webhooks/reference/page#page_change_proposal) | Get real-time notifications of proposed changes suggested by Facebook for your Facebook Page. |
| [`page_upcoming_change`](https://developers.facebook.com/docs/graph-api/webhooks/reference/page#page_upcoming_change) | Get real-time notifications about upcoming changes that will occur on your Facebook Page. These changes have been suggested by Facebook and may or may not have a deadline to accept or reject before automatically taking effect. |

### Page Change Proposal Categories

A **Page Change Proposal** is a change proposed for your Page. It contains information such as category, the current page value, and the proposed value.

| Category Name                     | Parameter                             | Example Values                                                                                       |
|-----------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------------|
| Hotel Booking Service Link        | `place_scraped_hotel_booking_website` | Current Value is always `-`, proposed value is a link to a hotel booking service.                   |
| Business Address                   | `place_address`                       | An array with format: `{"street" : "{street-change}", "zip" : "{zip-code-change}", "city" : "{city-name-change}"}` Only changed fields are shown in the response. |
| Business Type                      | `page_business_type`                 | `E-commerce`, `Service Area`, `Public Storefront`, `Workplace`, etc.                                |
| Category                           | `place_topic`                        | `Financial Service`, `Restaurant`, etc.                                                              |
| Coordinates                        | `place_coordinates`                   | Coordinates of the physical store.                                                                    |
| Cover Photo                       | `timeline_cover_photo`                | Link of the cover photo.                                                                              |
| Email                              | `page_email`                          | Ex. mypagebiz@email.com                                                                                |
| Meal Type Served                   | `place_restaurant_good_for`          | `Breakfast`, `Lunch`, `Dinner`, and `Coffee`                                                          |
| Menu Link                          | `place_scraped_menu`                 | Current Value is always `-`, proposed value is a link to a restaurant's menu.                        |
| Open Hours                         | `place_hours`                        | `Always Open`, `Permanently Closed` or `Hours Not Available` or the values shown in the [hours field](https://developers.facebook.com/docs/graph-api/reference/page/). |
| Phone                              | `page_phone`                          | Ex. 650-555-1000                                                                                     |
| Place Price Range                  | `place_price_range`                   | `$`, `$$`, `$$$`, `$$$$`                                                                              |
| General Services Website           | `place_scraped_service_website`      | Current Value is always `-`. proposed value is a website.                                            |
| Website                            | `page_website`                        | Ex. https://MyWebsite.com                                                                             |

### See Also

- [Page Upcoming Change Reference Guide](https://developers.facebook.com/docs/graph-api/reference/page-upcoming-change)
```



## Page: https://developers.facebook.com/docs/platforminsights/page

```markdown
# Get Page Insights

This guide explains how to get [metrics](https://developers.facebook.com/docs/graph-api/reference/insights) for your Facebook Pages. Get the total number of people who liked your Page or the number of people who shared stories about your Page.

On November 15, 2025, a [number of the Page Insights metrics](https://developers.facebook.com/docs/platforminsights/page/deprecated-metrics) will be deprecated for all API versions. The API returns an invalid metric error when calling any of these metrics. [Read our blog to learn more.](https://developers.facebook.com/blog/post/2025/08/15/page-insights-api-updates/)

On November 1, 2023, a [number of the Page Insights metrics](https://developers.facebook.com/docs/platforminsights/page/deprecated-metrics) were deprecated for all API versions. The API returns an invalid metric error when calling any of these metrics. [Read our blog to learn more.](https://developers.facebook.com/blog/post/2023/12/14/page-insights-metrics-deprecation)

## Limitations

- Metric data of public Pages is stored by Facebook for 2 years.
- Metric data of unpublished Pages is stored for only 5 days.
- When viewing daily metrics with `since` and `until`, the first `end_time` value will be the date specified by `since` plus 1 so that it includes the `since` date data. For example, if you set `since` to January 1, 2018, the `end_time` will be January 2, 2018 at 8:00 GMT.

## Before You Start

- [`pages_read_engagement`](https://developers.facebook.com/docs/apps/review/login-permissions#manage-pages) permission
- [`read_insights`](https://developers.facebook.com/docs/apps/review/login-permissions#read-insights) permission
- A [Page Access Token](https://developers.facebook.com/docs/pages/access-tokens) - The person requesting the token must be able to perform the [analyze](https://developers.facebook.com/docs/pages/overview#tasks) task on the Page.

## Get a Single Metric

Send a `GET` request to the `/{page-id}/insights/{metric-name}` endpoint:

```bash
curl -i -X GET "https://graph.facebook.com/{page-id}/insights/page_impressions_unique?access_token={page-access-token}"
```

On success your app receives the following response:

```json
{
  "data": [
    {
      "name": "page_impressions_unique",
      "period": "day",
      "values": [
        {
          "value": 66226,
          "end_time": "2020-03-10T07:00:00+0000"
        },
        {
          "value": 78037,
          "end_time": "2020-03-11T07:00:00+0000"
        }
      ],
      "title": "Daily Total Reach",
      "description": "Daily: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)",
      "id": "{page-id}/insights/page_impressions_unique/day"
    },
    {
      "name": "page_impressions_unique",
      "period": "week",
      "values": [
        {
          "value": 202229,
          "end_time": "2020-03-10T07:00:00+0000"
        },
        {
          "value": 206982,
          "end_time": "2020-03-11T07:00:00+0000"
        }
      ],
      "title": "Weekly Total Reach",
      "description": "Weekly: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)",
      "id": "{page-id}/insights/page_impressions_unique/week"
    },
    {
      "name": "page_impressions_unique",
      "period": "days_28",
      "values": [
        {
          "value": 427380,
          "end_time": "2020-03-10T07:00:00+0000"
        },
        {
          "value": 432909,
          "end_time": "2020-03-11T07:00:00+0000"
        }
      ],
      "title": "28 Days Total Reach",
      "description": "28 Days: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)",
      "id": "{page-id}/insights/page_impressions_unique/days_28"
    }
  ],
  "paging": {
    "previous": "https://graph.facebook.com/{page-id}/insights?access_token={page-access-token}&pretty=0&metric=page_impressions_unique&since=1583568000&until=1583737200",
    "next": "https://graph.facebook.com/{page-id}/insights?access_token={page-access-token}&pretty=0&metric=page_impressions_unique&since=1583910000&until=1584082800"
  }
}
```

## Get Multiple Metrics

Send a `GET` request to the `/{page-id}/insights` endpoint with the `metric` field:

```bash
curl -i -X GET "https://graph.facebook.com/{page-id}/insights?metric=page_impressions_unique,page_impressions_paid&access_token={page-access-token}"
```

On success, your app receives the following response:

```json
{
  "data": [
    {
      "name": "page_impressions_unique",
      "period": "day",
      "values": [
        {
          "value": 60,
          "end_time": "2024-03-11T07:00:00+0000"
        },
        {
          "value": 50,
          "end_time": "2024-03-12T07:00:00+0000"
        }
      ],
      "title": "Daily Total Reach",
      "description": "Daily: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)",
      "id": "PAGE_ID/insights/page_impressions_unique/day"
    },
    {
      "name": "page_impressions_paid",
      "period": "day",
      "values": [
        {
          "value": 8,
          "end_time": "2024-03-11T07:00:00+0000"
        },
        {
          "value": 10,
          "end_time": "2024-03-12T07:00:00+0000"
        }
      ],
      "title": "Daily Paid Impressions",
      "description": "Daily: The number of times any post or story content from your Page or about your Page entered a person's screen through paid distribution such as an ad. (Total Count)",
      "id": "PAGE_ID/insights/page_impressions_paid/day"
    }
  ],
  "paging": {
    "previous": "https://graph.facebook.com/{page-id}/insights?access_token={page-access-token}&pretty=0&metric=page_impressions_unique,page_impressions_paid&since=1583568000&until=1583737200",
    "next": "https://graph.facebook.com/{page-id}/insights?access_token={page-access-token}&pretty=0&metric=page_impressions_unique,page_impressions_paid&since=1583910000&until=1584082800"
  }
}
```

## Get Metrics of a Page Post

Send a `GET` request to the `/{page-post-id}/insights` endpoint with the `metric` fields:

```bash
curl -i -X GET "https://graph.facebook.com/{page-post-id}/insights?metric=post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total&access_token={page-access-token}"
```

On success, your app receives the following response:

```json
{
  "data": [
    {
      "name": "post_reactions_like_total",
      "period": "lifetime",
      "values": [
        {
          "value": 226
        }
      ],
      "title": "Lifetime Total Like Reactions of a post.",
      "description": "Lifetime: Total like reactions of a post.",
      "id": "{page-post-id}/insights/post_reactions_like_total/lifetime"
    },
    {
      "name": "post_reactions_love_total",
      "period": "lifetime",
      "values": [
        {
          "value": 17
        }
      ],
      "title": "Lifetime Total Love Reactions of a post.",
      "description": "Lifetime: Total love reactions of a post.",
      "id": "{page-post-id}/insights/post_reactions_love_total/lifetime"
    },
    {
      "name": "post_reactions_wow_total",
      "period": "lifetime",
      "values": [
        {
          "value": 1
        }
      ],
      "title": "Lifetime Total wow Reactions of a post.",
      "description": "Lifetime: Total wow Reactions of a post.",
      "id": "{page-post-id}/insights/post_reactions_wow_total/lifetime"
    }
  ],
  "paging": {
    "previous": "https://graph.facebook.com/{page-post-id}/insights?access_token={page-access-token}&pretty=0&metric=post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total&since=1583568000&until=1583737200",
    "next": "https://graph.facebook.com/{page-post-id}/insights?access_token={page-access-token}&pretty=0&metric=post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total&since=1583910000&until=1584082800"
  }
}
```

## Get Video Ad Breaks Impressions

### Additional Requirements

- The person requesting the Page access token must be able to [access the monetization insights](https://developers.facebook.com/business/help/442345745885606?id=180505742745347).

Send a `GET` request to the `/{page-id}` endpoint to get daily Video Ad Breaks impressions for a Page:

```bash
curl -i -X GET "https://graph.facebook.com/{page-id}/insights?metric=page_daily_video_ad_break_ad_impressions_by_crosspost_status&period=day&since=2017-12-10&until=2017-12-14"
```

On success, your app receives the following response:

```json
{
  "data": [
    {
      "name": "page_daily_video_ad_breaks_ad_impressions_by_crosspost_status",
      "period": "day",
      "values": [
        {
          "value": {
            "crossposted": 27584,
            "owned": 692730
          },
          "end_time": "2017-12-11T08:00:00+0000"
        },
        {
          "value": {
            "owned": 757456,
            "crossposted": 20593
          },
          "end_time": "2017-12-12T08:00:00+0000"
        },
        {
          "value": {
            "owned": 690092,
            "crossposted": 15372
          },
          "end_time": "2017-12-13T08:00:00+0000"
        },
        {
          "value": {
            "owned": 0,
            "crossposted": 0
          },
          "end_time": "2017-12-14T08:00:00+0000"
        }
      ],
      "title": "Daily page level videos ad impression",
      "description": "Number of times an ad was shown during ad breaks in your Page's videos, by distribution type (page_owned and crossposted).",
      "id": "{page-id}/insights/page_daily_video_ad_break_ad_impressions_by_crosspost_status/day"
    }
  ]
}
```

## Get Daily Video Ad Break Impressions of a Page Post

Send a `GET` request to the `/{page-post-id}/insights` endpoint with the `metric` field:

```bash
curl -i -X GET "https://graph.facebook.com/{page-post-id}/insights?metric=post_video_ad_break_ad_impressions&period=day&since=2017-12-10&until=2017-12-14&access_token={page-access-token}"
```

On success, your app will receive the following response:

```json
{
  "data": [
    {
      "name": "total_video_ad_break_ad_impressions",
      "period": "day",
      "values": [
        {
          "value": 2612,
          "end_time": "2017-12-11T08:00:00+0000"
        },
        {
          "value": 1038,
          "end_time": "2017-12-12T08:00:00+0000"
        },
        {
          "value": 818,
          "end_time": "2017-12-13T08:00:00+0000"
        },
        {
          "value": 553,
          "end_time": "2017-12-14T08:00:00+0000"
        }
      ],
      "title": "Daily Video Ad Break Ad Impressions",
      "description": "Number of times an ad was shown during your video ad breaks.",
      "id": "{video-id}/video_insights/total_video_ad_break_ad_impressions/day"
    }
  ]
}
```

## Get Lifetime Video Ad Break Impressions of a Page Post

```bash
curl -i -X GET "https://graph.facebook.com/{page-post-id}/insights?metric=post_video_ad_break_ad_impressions&period=lifetime&access_token={page-access-token}"
```

On success, your app will receive the following response:

```json
{
  "data": [
    {
      "name": "total_video_ad_break_ad_impressions",
      "period": "lifetime",
      "values": [
        {
          "value": 55468
        }
      ],
      "title": "Lifetime Video Ad Break Ad Impressions",
      "description": "Number of times an ad was shown during your video ad breaks.",
      "id": "{video-id}/video_insights/total_video_ad_break_ad_impressions/lifetime"
    }
  ]
}
```

## Common Error Codes

| Error Code | Error Message                                         | Description                                                                                          |
|------------|------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| None       | An empty dataset is returned.                         | You need the `read_insights` permission in order to access this endpoint.                          |
| 100        | "(#100) The value must be a valid insights metric"  | There may be a spelling or syntax issue.                                                            |
| 3001       | "No metric was specified to be fetched. Please specify one or more metrics to be fetched and try again." | When using the `metric` parameter, at least one metric must be included in the query.              |

## See Also

- [Insights Dashboard](https://www.facebook.com/insights)
- [Insights Reference Guide](https://developers.facebook.com/docs/graph-api/reference/insights)
- [Page Video Ad Breaks Metrics Reference Guide](https://developers.facebook.com/docs/graph-api/reference/insights#video-ad-breaks)
- [Video Insights Reference Guide](https://developers.facebook.com/docs/graph-api/reference/video/video_insights/)
```



## Page: https://developers.facebook.com/docs/pages-api

```markdown
# API de páginas de Facebook

La API de páginas de Facebook de Meta permite que las apps accedan y actualicen la configuración y el contenido de una página de Facebook, creen y obtengan publicaciones, reciban comentarios sobre el contenido de la página, obtengan estadísticas de la página, actualicen las acciones que los usuarios pueden realizar en la página y mucho más.

Este documento contiene las guías que te proporcionarán más información sobre la API de páginas de Facebook y cómo implementarla.

## Contenido de la documentación

Te recomendamos leer cada guía en el orden que se describe en este documento, a continuación.

1. [Información general](https://developers.facebook.com/docs/pages/overview): aprende sobre la API de páginas y su funcionamiento.
2. [Primeros pasos](https://developers.facebook.com/docs/pages/getting-started): tutorial introductorio que muestra cómo hacer una publicación en tu página de Facebook.
3. [Gestionar una página](https://developers.facebook.com/docs/pages/managing): consigue una lista de tus páginas con tareas que puedes realizar en cada uno de los tokens de acceso de páginas y actualiza la configuración de estas.
4. [Publicaciones y comentarios](https://developers.facebook.com/docs/pages/publishing): crear, publicar, actualizar y eliminar publicaciones y comentarios de páginas.
5. [Estadísticas de páginas](https://developers.facebook.com/docs/platforminsights/page): obtén estadísticas de tus publicaciones de páginas.
6. [Búsqueda de páginas](https://developers.facebook.com/docs/pages/searching): busca páginas.
7. [Pestañas de páginas](https://developers.facebook.com/docs/pages/tabs): obtén una lista de pestañas para tu página.
8. [Webhooks de Meta](https://developers.facebook.com/docs/pages/webhooks): haz que lleguen notificaciones en tiempo real a tu servidor sobre eventos que tengan lugar en tu página.
9. [Cambios futuros](https://developers.facebook.com/docs/pages/upcoming-changes): recibe notificaciones sobre cambios venideros que Meta implementará en tu página.
10. [Códigos de error](https://developers.facebook.com/docs/pages/error-codes): mira códigos de error y sus descripciones para hallar errores que puedas encontrar al implementar la API de páginas.
11. [Registro de cambios](https://developers.facebook.com/docs/pages/changelog): visualiza el registro de cambios de la API de páginas.
```



## Page: https://developers.facebook.com/docs/pages-api/error-codes

# New Pages Experience Error Codes

This guide displays common error codes, error messages, and descriptions related to the new Pages experience.

| Error Codes | Error Message | Description |
|-------------|---------------|-------------|
| `1713216` | You can't create a video engagement Custom Audience with video {object_id} because this video isn't associated with a Page or New Page Experience. | This video must be associated with a classic Page or a new Page experience to create a [video engagement Custom Audience](https://developers.facebook.com/docs/marketing-api/reference/custom-audience/). |
| `200` with subcode `2069030` | This endpoint is not supported in the new Pages experience. | The endpoint in your call is not supported. Visit the [New Pages Experience Overview](https://developers.facebook.com/docs/pages/npe-reference/npe-endpoints) for more information. |
| `200` with subcode `2069031` | This field is not supported in the new Pages experience. | The field of the endpoint in your call is not supported. Visit the [New Pages Experience Overview](https://developers.facebook.com/docs/pages/npe-reference/npe-endpoints) for more information. |
| `190` with subcode `2069032` | A Page access token is required for this call for the new Pages experience. | This endpoint must be called with a [Page access token](https://developers.facebook.com/docs/pages/npe-reference/npe-endpoints#access-tokens--features--permissions--and-tasks). |
| `200` with subcode `2069033` | The corresponding UI feature of this API is deprecated or not available on New Page Experience | The corresponding UI feature of this API is deprecated or not available on New Page Experience. Please review the [Graph API Reference](https://developers.facebook.com/docs/graph-api/reference) or the [New Pages Experience Overview](https://developers.facebook.com/docs/pages/npe-reference/npe-endpoints) for more information about this endpoint and its fields. |
| `2446158` | This ad objective is not supported for New Page Experience yet. You can create it with a Page instead. | This [ad objective](https://developers.facebook.com/docs/marketing-api/campaign-structure#objectives) is not supported for the new Pages experience. |
| `1` with subcode `2853006` | Viewer doesn't have permission to perform this action. | You do not have permission to [perform this task](https://developers.facebook.com/docs/pages/overview/permissions-features#tasks). Contact an admin of the Page to request access. |
| `2874008` | New Pages experience insights are only available for Pages with at least 100 Page followers. | [Page insights](https://developers.facebook.com/docs/graph-api/reference/page/insights/) are only available for Pages that have at least 100 followers. |
| `2932001` | To access this info, the post needs to be set to public. | [Page insights](https://developers.facebook.com/docs/platforminsights/page) are only available for public posts. |
| `2932003` | You can only get insights on the original post of a shared post but only if you own the original post. You can only boost the original post of a shared post but only if you own the original post. | You can only get insights on the original post, as long as you are the owner, of a [shared post](https://developers.facebook.com/docs/graph-api/reference/page-post/sharedposts/). |
| `2932004` | To access this info, you need to be the creator of the post. | To get insights or boost a [shared Page post](https://developers.facebook.com/docs/graph-api/reference/page-post/sharedposts/), you must be the owner of the original post and must use the original post to get insights or boost the post. |
| `2932005` | {Name} tagged you in this post. To access this info, you need to be the creator of the post. | To get insights or boost a post in which your [Page was mentioned](https://developers.facebook.com/docs/pages/mentions), you must own the post. |
| `2932006` | This info isn't available for profile pictures. To get insights or boost a post, you can add this photo to a new post. | Insights or boosting a [profile picture](https://developers.facebook.com/docs/graph-api/reference/page/picture) change is not supported. Create a post with the new profile picture to boost and get insights. |
| `2932007` | This info isn't available for cover photos. To get insights or boost a post, you can add this photo to a new post. | Insights or boosting a [cover photo](https://developers.facebook.com/docs/graph-api/reference/cover-photo/) change is not supported. Create a post with the new cover photo to boost and get insights. |
| `2932009` | This info isn't available for live videos. | Insights or boosting a [live video](https://developers.facebook.com/docs/live-video-api/guides/streaming) is not supported. |
| `2932010` | This info isn't available right now. | Insights are not available for this post. |



## Page: https://developers.facebook.com/docs/pages-api/getting-started

# Primeros pasos

Este documento te brinda información sobre cómo llamar correctamente a la API de páginas para hacer una publicación en tu página.

## Antes de empezar

Necesitarás lo siguiente:

- Una página de Facebook (puede tratarse de una página publicada o sin publicar, en la que se puede realizar la tarea `CREATE_CONTENT`).
- Un token de acceso a la página.
- Los siguientes permisos:
  - `pages_manage_metadata`
  - `pages_manage_posts`
  - `pages_manage_read_engagement`
  - `pages_show_list`

### Prácticas recomendadas

Al probar una llamada a la API, puedes incluir el parámetro `access_token` configurado en tu token de acceso. Sin embargo, para hacer llamadas seguras desde tu app, usa la [clase de token de acceso](https://developers.facebook.com/docs/facebook-login/guides/access-tokens#portabletokens).

## Paso 1. Obtén el identificador de la página

Para obtener una lista de identificadores y tokens de acceso a la página de Facebook en las que se puede realizar una tarea, envía una solicitud `GET` al punto de conexión `/user_id/accounts` en el que `user_id` es tu identificador de usuario.

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

```bash
curl -i -X GET "https://graph.facebook.com/v24.0/user_id/accounts?access_token=user_access_token"
```

Si la operación se procesa correctamente, tu app recibirá la siguiente respuesta JSON con una matriz de objetos. Los objetos contienen información sobre una página específica, que incluye el nombre, el identificador, un token de acceso a la página de corta duración, tareas que puedes realizar en la página y más:

```json
{
  "data": [
    {
      "access_token": "page_access_token",
      "category": "Internet Company",
      "category_list": [
        {
          "id": "2256",
          "name": "Internet Company"
        }
      ],
      "name": "Name of this Page",
      "id": "page_id",
      "tasks": [
        "ANALYZE",
        "ADVERTISE",
        "MODERATE",
        "CREATE_CONTENT"
      ]
    },
    ...
  ]
}
```

## Paso 2. Haz una publicación

Si deseas hacer una publicación, envía una solicitud `POST` al punto de conexión `/page_id/feed`, en el que `page_id` es el identificador de la página en la que haces la publicación, con el parámetro `message` configurado en el contenido de tu mensaje, y el parámetro `access_token` configurado en el token de acceso a la página:

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

```bash
curl -X POST "https://graph.facebook.com/v24.0/page_id/feed" \
     -H "Content-Type: application/json" \
     -d '{
           "message":"your_message_text",
           "access_token":"page_access_token"
         }'
```

La publicación se publicará de inmediato.

Si la operación se procesa correctamente, tu app recibirá la siguiente respuesta JSON con el identificador de la publicación:

```json
{
  "id": "page_post_id"
}
```

Visita tu [página de Facebook](https://www.facebook.com/) para ver la publicación.

## Paso 3. Verifica tu publicación

Si deseas verificar que se realizó la publicación en la página, envía una solicitud `GET` al punto de conexión `/page_id/feed`:

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

```bash
curl -i -X GET "https://graph.facebook.com/v24.0/page_id/feed?access_token=page_access_token"
```

Si la operación se procesa correctamente, tu app recibirá la siguiente respuesta JSON con una matriz de objetos. Los objetos incluyen el identificador de la publicación, el contenido del mensaje y la fecha y hora en que se creó la publicación:

```json
{
  "data": [
    {
      "created_time": "2020-03-25T17:33:34+0000",
      "message": "Hello World!",
      "id": "422575694827569_917077345377399"
    },
    ...
  ]
}
```

## Usa el explorador de la API Graph

La [herramienta del explorador de la API Graph](https://developers.facebook.com/tools/explorer) es una interfaz de usuario que te permite experimentar con las API de Facebook sin necesidad de agregar código a tu app o sitio web. Puedes seleccionar permisos, obtener tokens de acceso, probar métodos `GET`, `POST` y `DELETE`, y obtener fragmentos de código relacionados con estas consultas para Android, iOS, JavaScript, PHP y cURL.

Ten en cuenta que es necesario contar con un [identificador de app de Facebook](https://developers.facebook.com/docs/apps#register) para utilizar el explorador de la API Graph.

### Paso 1. Obtén el identificador de la página

Selecciona los permisos `pages_manage_metadata`, `pages_manage_posts`, `pages_manage_read_engagement` y `pages_show_list`, que se muestran en el menú desplegable de Permiso, establece la consulta `GET` en el punto de conexión `/me/accounts` ubicado en la casilla de consultas y haz clic en **Enviar**.

![Ejemplo de explorador](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/90753453_681635615710365_5353285943979671552_n.png?_nc_cat=109&ccb=1-7&_nc_sid=e280be&_nc_ohc=zeG-Zz1R7nIQ7kNvwEv1nPB&_nc_oc=AdnAlNHOR9iTzpsz4Zt6Oqp_E03qH_dJjwYqyIkJaHv7mOWX78imzxt5l-pETEYJoIY6KvF2Wwb6f-xYFtbb7CSl&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=2YWfJdSfE2vypJakSZ33lQ&oh=00_AfgY1Dxd_me-ZsL2obMFCNK1aaNhoWa2IswvScZBjW4byw&oe=692F29AF)

Para mover el identificador a la casilla de consultas, haz clic en el identificador de tu página, que se muestra directamente abajo del nombre de la página.

### Paso 2. Haz una publicación en nombre de la página

En el menú desplegable de **usuario o página**, selecciona el token de acceso a tu página. Luego, selecciona el método `POST` y configura el punto de conexión `/{page-id}/feed` como destino de la solicitud. A continuación, configura los siguientes **parámetros**: `key` con el valor `message` y `value` con el texto de tu publicación. Haz clic en **Enviar**.

Si estos pasos se realizaron correctamente, el explorador de la API Graph mostrará el identificador de la publicación de la página.

![Ejemplo de publicación](https://scontent.fsti4-1.fna.fbcdn.net/v/t39.2365-6/90633006_2691623697632705_6919549723854503936_n.png?_nc_cat=108&ccb=1-7&_nc_sid=e280be&_nc_ohc=67L20rKXWsAQ7kNvwEWOHsS&_nc_oc=Adl80OEmtzjPQwNTfF6R1KAtnNS0e9uS8d8dKv_aqCNsn0_TVsWG-BkGgFrDM8g10zgB1GYMBh_lNS7nSRnNoY9v&_nc_zt=14&_nc_ht=scontent.fsti4-1.fna&_nc_gid=2YWfJdSfE2vypJakSZ33lQ&oh=00_Afi1JEB3o0wJr6szIovykAMspGUYeHvNt-UXoDpr4fXL9Q&oe=692F2C53)

Visita tu [página de Facebook](https://www.facebook.com/) para ver la publicación.

### Paso 3. Verifica tu publicación

Envía una solicitud `GET` al punto de conexión `/page-id/feed`.

Si dicha solicitud se envió correctamente, el explorador de la API Graph mostrará la fecha y hora en que se creó la publicación, el texto de dicha publicación y el identificador de la publicación de la página.

![Ejemplo de verificación](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/91310472_212075259856088_1405481786523254784_n.png?_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=Q-or3Bo0YTMQ7kNvwH6ZmZV&_nc_oc=Admzq9VdLOI9AjRYrQHqt0ntt576VXOp9Wwx4dWyIdCsKDZbdOmptbUeqS0LAbqbBP6ZZ_MbEKFY_9qiM5kNEjwN&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=2YWfJdSfE2vypJakSZ33lQ&oh=00_Afh-EHiho1FOY2-7zzFF8-yyZxYZDgqeMcdY0M85Nd2OgA&oe=692F15E2)

## Próximos pasos

Consulta la [guía sobre cómo gestionar una página de Facebook](https://developers.facebook.com/docs/pages-api/manage-pages) para descubrir cómo obtener y actualizar la información referida a tu página de Facebook, incluye detalles de la página, tokens de acceso, usuarios bloqueados y recomendaciones de los usuarios.

Obtén información sobre cómo [publicar enlaces, fotos y videos en tu página](https://developers.facebook.com/docs/pages-api/posts).

## Más información

### Guías de la API Graph

- [Tokens de acceso](https://scontent.fsti4-2.fna.fbcdn.net/v/t39.2365-6/310307727_3347317042262105_1088877051262827250_n.png?_nc_cat=107&ccb=1-7&_nc_sid=e280be&_nc_ohc=S3Dn3nIVhiIQ7kNvwH1ViT4&_nc_oc=AdmkUfhAfcgfNTpQUxp3n2gdRwg7i1DHk-C4GDbnnTl9Wvq0Or12OtfA5v13osfQ9LyZ__2YDsFNp1z8F0n6K8-y&_nc_zt=14&_nc_ht=scontent.fsti4-2.fna&_nc_gid=2YWfJdSfE2vypJakSZ33lQ&oh=00_AfgeVvp66e9MSoZgCLw7kz_OfZBN86_8WOfzwZhkU0qN_w&oe=692F42A2)
- [Guía de usuario de la API Graph](https://developers.facebook.com/docs/graph-api/using-graph-api)
- [Guía de usuario del explorador de la API Graph](https://developers.facebook.com/docs/graph-api/explorer)
- [Descripción general de la API de páginas, tareas](https://developers.facebook.com/docs/pages/overview#tasks)

### Referencias

- [Referencia de la página](https://developers.facebook.com/docs/graph-api/reference/page)
- [Referencia de feed de páginas](https://developers.facebook.com/docs/graph-api/reference/page/feed)
- [Referencia de la publicación de la página](https://developers.facebook.com/docs/graph-api/reference/page-post)
- [Referencia sobre permisos](https://developers.facebook.com/docs/permissions)
- [Referencia de cuentas de usuario](https://developers.facebook.com/docs/graph-api/reference/user/accounts)



## Page: https://developers.facebook.com/docs/pages-api/changelog

# Changelog

Facebook Pages and related endpoints and fields will be made available for the new Pages experience in the future.

## November, 15 2025

### Page Insights API Updates

*Applies to all versions.*

On November 15, 2025, a number of the Page Insights metrics will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2025/08/15/page-insights-api-updates/)

- `page_fans (Alternative: page_follows)`
- `Page_fans_locale`
- `Page_fans_city (Alternative: page_follows_city)`
- `Page_fans_country (Alternative: page_follows_country)`
- `Page_fan_adds`
- `Page_fan_adds_unique`
- `Page_fan_removes`
- `page_fan_removes_unique*`
- `page_impressions* (Alternative: page_media_view)`
- `page_impressions_paid* (Alternative: page_media_view with is_from_ads breakdown)`
- `page_impressions_viral*`
- `page_impressions_nonviral*`
- `post_impressions* (Alternative: post_media_view)`
- `post_impressions_paid* (Alternative: post_media_view with is_from_ads breakdown)`
- `post_impressions_fan* (Alternative: post_media_view with is_from_followers breakdown)`
- `post_impressions_organic* (Alternative: post_media_view with is_from_ads breakdown)`
- `post_impressions_viral*`
- `post_impressions_nonviral*`

## September, 16 2024

### Page Insights API Updates

*Applies to all versions.*

The following Page Insights metrics have been deprecated for all API versions. The API returns an invalid metric error when calling any of these metrics.

- `page_call_phone_clicks_logged_in_by_locale_unique`
- `page_call_phone_clicks_logged_in_count`
- `page_call_phone_clicks_logged_in_unique`
- `page_consumptions_by_consumption_type`
- `page_consumptions_by_consumption_type_unique`
- `page_consumptions_unique`
- `page_cta_clicks_logged_in_total`
- `page_cta_clicks_logged_in_unique`
- `page_daily_follows_by_paid_non_paid_unique`
- `page_daily_follows_by_source`
- `page_daily_follows_by_source_unique`
- `page_daily_unfollows_by_source`
- `page_daily_unfollows_by_source_unique`
- `page_fans_by_like_source`
- `page_fans_by_like_source_unique`
- `page_fans_by_unlike_source`
- `page_fans_by_unlike_source_unique`
- `page_fans_online`
- `page_fans_online_per_day`
- `page_get_directions_clicks_logged_in_count`
- `page_get_directions_clicks_logged_in_unique`
- `page_impressions_by_age_gender_unique`
- `page_impressions_by_city_unique`
- `page_impressions_by_country_id_unique`
- `page_impressions_by_country_unique`
- `page_impressions_by_locale_unique`
- `page_impressions_by_paid_non_paid`
- `page_impressions_by_paid_non_paid_unique`
- `page_impressions_by_story_type`
- `page_impressions_by_story_type_unique`
- `page_impressions_organic_unique_v2`
- `page_impressions_organic_v2`
- `page_impressions_frequency_distribution`
- `page_impressions_viral_frequency_distribution`
- `page_negative_feedback`
- `page_negative_feedback_by_type`
- `page_negative_feedback_by_type_unique`
- `page_negative_feedback_unique`
- `page_places_checkin_total`
- `page_places_checkin_total_unique`
- `page_palces_checkins_by_age_gender`
- `page_places_checkins_by_city`
- `page_places_checkins_by_country`
- `page_places_checkins_by_locale`
- `page_posts_impressions_by_paid_non_paid`
- `page_posts_impressions_by_paid_non_paid_unique`
- `page_posts_impressions_frequency_distribution`
- `page_posts_impressions_organic`
- `page_posts_impressions_organic_unique`
- `page_posts_impressions_organic_v2 (on hold)`
- `page_story_adds_by_country_unique`
- `page_tab_views_login_top`
- `page_tab_views_login_top_unique`
- `page_tab_views_logout_top`
- `page_views`
- `page_views_external_referrals`
- `page_views_login_unique`
- `page_views_login`
- `page_views_logout`
- `page_views_unique`
- `page_website_clicks_logged_in_by_city_unique`
- `page_website_clicks_logged_in_by_country_unique`
- `page_website_clicks_logged_in_by_locale_unique`
- `page_website_clicks_logged_in_count`
- `page_website_clicks_logged_in_unique`
- `post_clicks_unique*`
- `post_clicks_by_type_unique`
- `post_cta_clicks_by_type`
- `post_cta_clicks_total`
- `post_engaged_fan`
- `post_engaged_users*`
- `post_impressions_by_paid_non_paid`
- `post_impressions_by_story_type*`
- `post_impressions_by_story_type_unique*`
- `post_negative_feedback*`
- `post_negative_feedback_by_type*`
- `post_negative_feedback_by_type_unique*`
- `post_negative_feedback_unique*`

## June 17, 2024

### Page Insights API Updates

*Applies to all versions.*

On September 16, 2024, a number of the Page Insights metrics will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2024/06/17/page-insights-metrics-removal/)

- `page_call_phone_clicks_logged_in_by_locale_unique`
- `page_call_phone_clicks_logged_in_count`
- `page_call_phone_clicks_logged_in_unique`
- `page_consumptions_by_consumption_type`
- `page_consumptions_by_consumption_type_unique`
- `page_consumptions_unique`
- `page_cta_clicks_logged_in_total`
- `page_cta_clicks_logged_in_unique`
- `page_daily_follows_by_paid_non_paid_unique`
- `page_daily_follows_by_source`
- `page_daily_follows_by_source_unique`
- `page_daily_unfollows_by_source`
- `page_daily_unfollows_by_source_unique`
- `page_fans_by_like_source`
- `page_fans_by_like_source_unique`
- `page_fans_by_unlike_source`
- `page_fans_by_unlike_source_unique`
- `page_fans_online`
- `page_fans_online_per_day`
- `page_get_directions_clicks_logged_in_count`
- `page_get_directions_clicks_logged_in_unique`
- `page_impressions_by_age_gender_unique`
- `page_impressions_by_city_unique`
- `page_impressions_by_country_id_unique`
- `page_impressions_by_country_unique`
- `page_impressions_by_locale_unique`
- `page_impressions_by_paid_non_paid`
- `page_impressions_by_paid_non_paid_unique`
- `page_impressions_by_story_type`
- `page_impressions_by_story_type_unique`
- `page_impressions_organic_unique_v2`
- `page_impressions_organic_v2`
- `page_impressions_frequency_distribution`
- `page_impressions_viral_frequency_distribution`
- `page_negative_feedback`
- `page_negative_feedback_by_type`
- `page_negative_feedback_by_type_unique`
- `page_negative_feedback_unique`
- `page_places_checkin_total`
- `page_places_checkin_total_unique`
- `page_palces_checkins_by_age_gender`
- `page_places_checkins_by_city`
- `page_places_checkins_by_country`
- `page_places_checkins_by_locale`
- `page_posts_impressions_by_paid_non_paid`
- `page_posts_impressions_by_paid_non_paid_unique`
- `page_posts_impressions_frequency_distribution`
- `page_posts_impressions_organic`
- `page_posts_impressions_organic_unique`
- `page_posts_impressions_organic_v2 (on hold)`
- `page_story_adds_by_country_unique`
- `page_tab_views_login_top`
- `page_tab_views_login_top_unique`
- `page_tab_views_logout_top`
- `page_views`
- `page_views_external_referrals`
- `page_views_login_unique`
- `page_views_login`
- `page_views_logout`
- `page_views_unique`
- `page_website_clicks_logged_in_by_city_unique`
- `page_website_clicks_logged_in_by_country_unique`
- `page_website_clicks_logged_in_by_locale_unique`
- `page_website_clicks_logged_in_count`
- `page_website_clicks_logged_in_unique`
- `post_clicks_unique*`
- `post_clicks_by_type_unique`
- `post_cta_clicks_by_type`
- `post_cta_clicks_total`
- `post_engaged_fan`
- `post_engaged_users*`
- `post_impressions_by_paid_non_paid`
- `post_impressions_by_story_type*`
- `post_impressions_by_story_type_unique*`
- `post_negative_feedback*`
- `post_negative_feedback_by_type*`
- `post_negative_feedback_by_type_unique*`
- `post_negative_feedback_unique*`

## March 14, 2024

### Page Insights Metrics Deprecation

*Applies to all versions.*

On March 14, 2024, a number of the [Page Insights metrics](https://developers.facebook.com/docs/platforminsights/page/deprecated-metrics) will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2023/12/14/page-insights-metrics-deprecation)

## December 14, 2023

### Page Insights Metrics Deprecation

*Applies to all versions on March 14, 2024.*

On March 14, 2024, a number of the Page Insights metrics will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2023/12/14/page-insights-metrics-deprecation)

- ~~`page_actions_post_reactions_anger_total`~~
- ~~`page_actions_post_reactions_haha_total`~~
- ~~`page_actions_post_reactions_like_total`~~
- ~~`page_actions_post_reactions_love_total`~~
- ~~`page_actions_post_reactions_sorry_total`~~
- ~~`page_actions_post_reactions_total`~~
- ~~`page_actions_post_reactions_wow_total`~~
- `page_call_phone_clicks_by_age_gender_logged_in_unique`
- `page_call_phone_clicks_by_site_logged_in_unique`
- `page_call_phone_clicks_logged_in_by_city_unique`
- `page_call_phone_clicks_logged_in_by_country_unique`
- `page_call_phone_clicks_logged_in_by_locale_unique`
- `page_consumptions`
- `page_content_activity`
- `page_content_activity_by_action_type`
- `page_content_activity_by_action_type_unique`
- `page_content_activity_by_age_gender_unique`
- `page_content_activity_by_city_unique`
- `page_content_activity_by_country_unique`
- `page_content_activity_by_locale_unique`
- `page_content_activity_unique`
- `page_cta_clicks_by_age_gender_logged_in_unique`
- `page_cta_clicks_by_site_logged_in_unique`
- `page_cta_clicks_logged_in_by_city_unique`
- `page_cta_clicks_logged_in_by_country_unique`
- `page_cta_clicks_logged_in_by_locale_unique`
- `page_daily_follows_by_source_unique`
- `page_daily_unfollows_by_source_unique`
- `page_engaged_users`
- `page_fans_by_like_source_unique`
- `page_fans_by_like_source`
- `page_fans_by_unlike_source_unique`
- `page_fans_by_unlike_source`
- `page_fans_gender_age`
- `page_follows_city`
- `page_follows_country`
- `page_follows_gender_age`
- `page_follows_locale`
- `page_get_directions_clicks_by_age_gender_logged_in_unique`
- `page_get_directions_clicks_by_site_logged_in_unique`
- `page_get_directions_clicks_logged_in_by_city_unique`
- `page_get_directions_clicks_logged_in_by_country_unique`
- `page_impressions_frequency_distribution`
- `page_places_checkin_mobile_unique`
- `page_places_checkin_mobile`
- `page_places_checkins_by_age_gender`
- `page_places_checkins_by_city`
- `page_places_checkins_by_country`
- `page_places_checkins_by_locale`
- `page_positive_feedback_by_type_unique`
- `page_positive_feedback_by_type`
- `page_positive_feedback_unique`
- `page_positive_feedback`
- `page_posts_impressions_frequency_distribution`
- `page_views_by_age_gender_logged_in_unique`
- `page_views_by_city_logged_in_unique`
- `page_views_by_country_logged_in_unique`
- `page_views_by_internal_referer_logged_in_unique`
- `page_views_by_locale_logged_in_unique`
- `page_views_by_profile_tab_logged_in_unique`
- `page_views_by_profile_tab_total`
- `page_views_by_referers_logged_in_unique`
- `page_views_by_site_logged_in_unique`
- `page_views_external_referrals`
- `page_views_logged_in_total`
- `page_views_logged_in_unique`
- `page_views_login_unique`
- `page_views_login`
- `page_views_logout`
- `page_views_unique`
- `page_website_clicks_by_age_gender_logged_in_unique`
- `page_website_clicks_by_site_logged_in_unique`
- `page_website_clicks_logged_in_by_city_unique`
- `page_website_clicks_logged_in_by_country_unique`
- `page_website_clicks_logged_in_by_locale_unique`
- `post_activity`
- ~~`post_activity_by_action_type`~~
- ~~`post_activity_by_action_type_unique`~~
- `post_activity_unique`
- `post_impressions_fan_paid_unique*`
- `post_impressions_fan_paid*`

## 2021-06-21

- The Page `impressum` field is now available.

## 2021-03-18

- To determine if a Page has been migrated to the new Pages experience, use the new [Page `has_transitioned_to_new_page_experience` field](https://developers.facebook.com/docs/graph-api/reference/page/).

## 2021-03-25

- [POST /{page-id}/messages](https://developers.facebook.com/docs/graph-api/reference/page/messages)
- [POST /{page-id}/messenger_profile](https://developers.facebook.com/docs/graph-api/reference/page/messenger_profile)

## 2021-01-04

Additional endpoints are now available for the new Pages experience.

| Endpoint | Unavailable Fields |
|----------|--------------------|
| [/{album-id}](https://developers.facebook.com/docs/graph-api/reference/album/photos) |  |
| [/{canvas-button-id}](https://developers.facebook.com/docs/graph-api/reference/canvas-button) |  |
| [/{canvas-carousel-id}](https://developers.facebook.com/docs/graph-api/reference/canvas-carousel) |  |
| [/{canvas-text-id}](https://developers.facebook.com/docs/graph-api/reference/canvas-text) |  |
| [DELETE /{comment-id}/likes](https://developers.facebook.com/docs/graph-api/reference/object/likes) |  |
| [GET /{comment-id}/reactions](https://developers.facebook.com/docs/graph-api/reference/object/reactions) |  |
| [GET /{lead-id}](https://developers.facebook.com/docs/marketing-api/reference/user-lead-gen-info/) |  |
| [GET /{link-id}/comments](https://developers.facebook.com/docs/graph-api/reference/object/comments) |  |
| [/{media-fingerprint-id}](https://developers.facebook.com/docs/graph-api/reference/media-fingerprint) |  |
| [DELETE /{page-id}/blocked](https://developers.facebook.com/docs/graph-api/reference/page/blocked) |  |
| [/{page-id}/copyright_whitelisted_partners](https://developers.facebook.com/docs/graph-api/reference/page/copyright_whitelisted_partners) |  |
| [/{page-id}?fields=copyright_whitelisted_ig_partners](https://developers.facebook.com/docs/graph-api/reference/page#fields) |  |
| [GET /{page-id}/crosspost_whitelisted_pages](https://developers.facebook.com/docs/graph-api/reference/page/crosspost_whitelisted_pages) |  |

| Endpoint | Unavailable Fields |
|----------|--------------------|
| [POST /{page-id}/picture](https://developers.facebook.com/docs/graph-api/reference/page/picture) |  |
| [GET /{page-id}/roles](https://developers.facebook.com/docs/graph-api/reference/page/roles) |  |
| [/{page-id}/settings](https://developers.facebook.com/docs/graph-api/reference/page/settings) |  |
| [GET /{pagepost-id}/to](https://developers.facebook.com/docs/graph-api/reference/pagepost) |  |
| [DELETE /{photo-id}](https://developers.facebook.com/docs/graph-api/reference/photo/) |  |
| [GET /{photo-id}/likes](https://developers.facebook.com/docs/graph-api/reference/photo/likes) |  |
| [GET /{photo-id}/picture](https://developers.facebook.com/docs/graph-api/reference/photo/picture) |  |
| [DELETE /{post-id}/likes](https://developers.facebook.com/docs/graph-api/reference/object/likes) |  |
| [POST /{video-id}/thumbnails](https://developers.facebook.com/docs/graph-api/reference/video/thumbnails) |  |

## 2020-10-02

Facebook begins migrating select Pages to the [new Pages experience](https://www.facebook.com/business/help/NewPagesExperience).

### Available Endpoints for the New Pages Experience

| Endpoint | Unavailable Fields |
|----------|--------------------|
| [/{comment-id}](https://developers.facebook.com/docs/graph-api/reference/comment) |  |
| [/{comment-id}/comments](https://developers.facebook.com/docs/graph-api/reference/object/comments) |  |
| [/{live-video-id}](https://developers.facebook.com/docs/graph-api/reference/live-video) |  |
| [/{media-fingerprint-id}](https://developers.facebook.com/docs/graph-api/reference/media-fingerprint) |  |
| [/{page-id}/conversations](https://developers.facebook.com/docs/graph-api/reference/page/conversations) |  |
| [/{page-id}/copyright_whitelisted_partners](https://developers.facebook.com/docs/graph-api/reference/page/copyright_whitelisted_partners) |  |
| [/{page-id}/feed](https://developers.facebook.com/docs/graph-api/reference/page/feed) | <p><code>GET</code> fields:</p><ul><li><code>child_attachments</code></li><li><code>feed_targeting</code></li><li><code>scheduled_publish_time</code></li></ul><p><code>POST</code> fields:</p><ul><li><code>backdated_time_granularity</code></li><li><code>child_attachments</code></li><li><code>feed_targeting</code></li><li><code>multi_share_end_card</code></li><li><code>multi_share_optimized</code></li><li><code>published</code></li><li><code>scheduled_publish_time</code></li></ul> |
| [/{page-id}/live_videos](https://developers.facebook.com/docs/graph-api/reference/page/live_videos) |  |
| [/{page-id}/media_fingerprints](https://developers.facebook.com/docs/graph-api/reference/page/media_fingerprints) |  |
| [/{page-id}/posts](https://developers.facebook.com/docs/graph-api/reference/page/feed) |  |
| [/{page-id}/promotable_posts](https://developers.facebook.com/docs/graph-api/reference/page/feed/#promotable-ids) | <p><code>GET</code> fields:</p><ul><li><code>child_attachments</code> </li><li><code>feed_targeting</code></li></ul> |
| [/{page-id}/videos](https://developers.facebook.com/docs/graph-api/reference/page/videos) |  |
| [/{page-id}/videos](https://developers.facebook.com/docs/graph-api/reference/page/videos) |  |
| [GET /{page-name}/feed](https://developers.facebook.com/docs/graph-api/reference/page/feed) |  |
| [GET /{page-name}/posts](https://developers.facebook.com/docs/graph-api/reference/page/feed) |  |
| [/{pagepost-id}](https://developers.facebook.com/docs/graph-api/reference/pagepost) | <p><code>GET</code> fields:</p><ul><li><code>backdated_time</code></li><li><code>child_attachments</code></li><li><code>feed_targeting</code></li><li><code>scheduled_publish_time</code> </li></ul> |
| [/{pagepost-id}/comments](https://developers.facebook.com/docs/graph-api/reference/pagepost/comments) |  |
| [/{pagepost-id}/likes](https://developers.facebook.com/docs/graph-api/reference/pagepost/likes) |  |
| [/{pagepost-id}/reactions](https://developers.facebook.com/docs/graph-api/reference/pagepost/reactions) |  |
| [/{post-id}](https://developers.facebook.com/docs/graph-api/reference/post) |  |
| [/{post-id}/comments](https://developers.facebook.com/docs/graph-api/reference/post/comments) |  |
| [/{post-id}/reactions](https://developers.facebook.com/docs/graph-api/reference/post/reactions) |  |
| [GET /{user-id}/accounts](https://developers.facebook.com/docs/graph-api/reference/user/accounts) |  |
| [/{video-id}](https://developers.facebook.com/docs/graph-api/reference/video) |  |
| [/{video-id}/video_insights](https://developers.facebook.com/docs/graph-api/reference/video/video_insights) |  |
| [/{video_copyright_rule-id}](https://developers.facebook.com/docs/graph-api/reference/video-copyright-rule) |  |



## Page: https://developers.facebook.com/docs/pages-api/comments-mentions

```markdown
## Comments and @mentions

This guide explains how to comment on a Facebook Page post or comment on a Facebook Page post and @mention or tag a specific person or Page who has published a post on your Page or commented on a Page post using the Pages API from Meta.

## Before you start

This guide assumes you have read the [Overview](https://developers.facebook.com/docs/pages/overview) and the [Posts guide](https://developers.facebook.com/docs/pages/publishing) for the Facebook Pages API.

#### Permissions

For a person who can perform tasks on the page, you will need to implement Facebook Login or Business on your app to ask for the following permissions and receive a Page access token:

- `pages_manage_engagement`
- `pages_read_engagement`
- `pages_read_user_engagement`

#### Page tasks

Your app user must be able to perform the following tasks on the in the API requests:

- `MODERATE`
- `CREATE_CONTENT`

#### Page features

Your app will need the following features:

- Page Mentioning

#### IDs

- The Page Post ID for the Page post
- The Page-scoped ID for the person who created the Page post or comment, if you want to @mention that person

### Best Practices

Al probar una llamada a la API, puedes incluir el parámetro `access_token` configurado en tu token de acceso. Sin embargo, para hacer llamadas seguras desde tu app, usa la [clase de token de acceso](https://developers.facebook.com/docs/facebook-login/guides/access-tokens#portabletokens).

## Comments

You can comment on a Page post or a comment on a comment. The author of the comment will be the Page.

#### Limitations

- If a Page is unpublished no one will be able to comment on a Page post or comment.
- If you try to comment as a User you will see a `1705` error code with `"message":"(#1705) There was an error posting to this wall"`.

### Comment on a Post

To comment on a Page post, send a `POST` request to the `/page_post_id/comments` endpoint with the `message` parameter set to the content for your comment.

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_post_id**, with your values.*

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/page_post_id/comments" \
     -H "Content-Type: application/json" \
     -d '{
           "message":"your_message_text",
         }'
```

On success, your app receives the following JSON response with `id` set to the comment ID:

```json
{
  "id": "comment_id"
}
```

### Comment on a comment

To comment on a comment, you will need to get the comments for a Page post, then get the ID for the comment you want to comment on.

#### Get comments

To get the comments for a Page post, send a `GET` request to the `/page_post_id/comments` endpoint with the `fields` parameter set to a comma-separated list that includes the `message` field, to get the content for the comment and the `from` field, to get the Page-scoped ID (PSID) for the person or Page who commented on the post, if you would like to @mention the person or Page in the comment.

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_post_id**, with your values.*

```bash
curl -i -X GET "https://graph.facebook.com/page_post_id/comments?fields=from,message"
```

On success, your app receives the following JSON response with the commentor's name, PSID, message and the comment ID:

```json
{
  "data": [
    {
      "created_time": "2020-02-19T23:05:53+0000",
      "from": {
        "name": "commentor_name",
        "id": "commentor_PSID"
      },
      "message": "comment_content",
      "id": "comment_id"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MQZDZD",
      "after": "MQZDZD"
    }
  }
}
```

### @mention or tag

You can reply to a specific person or Facebook Page by mentioning, or tagging, the person in a comment. A notification will be sent to the person who has been mentioned by the Page. The most common uses for @mentions are:

- Replying to a specific Facebook Page or person who commented on a Page post or Page post comment that received multiple comments
- Batch replying to multiple people who commented on a Page post or commented on a Page post comment.

#### Limitations

- In the **Settings** of your Page, you must have allowed **Others Tagging this Page**.
- A Page can only mention a person if the person commented on a Page post or if the person created the Page post.

#### Testing

When testing your app before going live, you must be an admin or a developer of the app and use Pages (both to make the API call, and to be used in a mention) for which you are an admin.

### Reply to a Post

To mention a person or a Page who published a post on your Facebook Page, send a `POST` request to the ID for the Page post with the `message` parameter set to your comment content that includes the `@` symbol with the person's PSID or the Page's ID.

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_post_id**, with your values.*

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/page_post_id" \
     -H "Content-Type: application/json" \
     -d '{
           "message":"your_message_text @[PSID]"
         }'
```

On success, your app receives the following JSON response with `id` set to the ID for your comment:

```json
{
  "id": "comment_id"
}
```

### Reply to a Comment

To mention a person or a Page who commented on your Facebook Page post, send a `POST` request to the ID for the comment with the `message` parameter set to your comment content that includes the `@` symbol followed by an array with the person's PSID or the Page's ID.

To mention multiple people, use an array of a comma-separated of PSIDs.

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **comment_id**, with your values.*

```bash
curl -i -X POST "https://graph.facebook.com/comment_id" \
     -H "Content-Type: application/json" \
     -d '{
           "message":"your_message_text @[PSID,PSID,PSID]"
         }'
```

On success, your app receives the following JSON response with `id` set to the ID for your comment:

```json
{
  "id": "comment_id"
}
```

## Next Steps

Learn how to [start conversations with people](https://developers.facebook.com/docs/messenger-platform/) who are interested in your Page and how to [send a private reply](https://developers.facebook.com/docs/messenger-platform/discovery/private-replies) to a specific person who has posted or commented on your Page.

## See Also

- [How do People Mention Your Page - Facebook Help Center](https://www.facebook.com/help/218027134882349?helpref=search&sr=1&query=mention%20a%20page)
- [Comment Comments Reference Guide](https://developers.facebook.com/docs/graph-api/reference/object/comments/#publish)
- [Page Post Comments Reference Guide](https://developers.facebook.com/docs/graph-api/reference/page-post)
```



## Page: https://developers.facebook.com/docs/

# Documentación para desarrolladores de Meta

*Obtén información básica sobre cómo enviar y recibir datos de la gráfica social de Meta y cómo implementar las API, las plataformas, los productos y los SDK para que se adapten a las necesidades de tu app.*

## Desarrollo de la app de Meta

Regístrate como desarrollador, ajusta la configuración de tu app en el panel de apps y compila, prueba y lanza tu app. [Documentos](https://developers.facebook.com/docs/development)

## API Graph

El método principal de las apps para leer y escribir en la gráfica social de Meta. [Documentos](https://developers.facebook.com/docs/graph-api)

## Iniciativas de plataforma responsable

Verifica si tu app cuenta con aprobación para usar nuestros productos y API. [Documentos](https://developers.facebook.com/docs/resp-plat-initiatives)

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



## Page: https://developers.facebook.com/docs/pages-api/search-pages

# Search for a Page

This guide explains how to get information about Facebook Pages including names, locations, and more. Find Pages to [@Mention](https://developers.facebook.com/docs/pages/mentions), Page locations, and tag a Page to show [branded content](https://www.facebook.com/business/help/788160621327601).

## Before You Start

You will need:

- A [User access token](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) and the [app secret](https://developers.facebook.com/docs/facebook-login/security/#appsecret) if the app user is logged into Facebook.
- An [App access token](https://developers.facebook.com/docs/facebook-login/access-tokens) with the [Page Public Metadata Access](https://developers.facebook.com/docs/apps/features-reference#page-public-metadata-access) feature if the app user is not logged into Facebook and is searching for public Page information.
- An [App access token](https://developers.facebook.com/docs/facebook-login/access-tokens) with the [Page Public Content Access](https://developers.facebook.com/docs/apps/features-reference#page-public-content-access) feature if the app user is not logged into Facebook and is searching Pages to conduct competitive analysis.

### Sample Request

```bash
curl -i -X GET \
  "https://graph.facebook.com/pages/search?q=Facebook&fields=id,name,location,link&access_token={access-token}"
```

Returns a list of [Pages](https://developers.facebook.com/docs/graph-api/reference/page) that meet the query's criteria. Set the `q` parameter value to a keyword or search term (e.g. `q=Facebook`). Use the `fields` parameter to list any [fields](#fields) you want included with each Page returned in the response.

### Sample Response

```json
{
  "data": [
    {
      "id": "309968765748101",
      "name": "Facebook HQ",
      "location": {
        "city": "Menlo Park",
        "country": "United States",
        "latitude": 37.483183,
        "longitude": -122.149999,
        "state": "CA",
        "street": "1 Hacker Way",
        "zip": "94025"
      },
      "link": "https://www.facebook.com/Facebook-HQ-166793820034304/"
    },
    {
      "id": "194776097220801",
      "name": "Facebook Seattle",
      "location": {
        "city": "Seattle",
        "country": "United States",
        "latitude": 47.628293260721,
        "longitude": -122.34263420105,
        "state": "WA",
        "street": "1101 Dexter Ave N",
        "zip": "98109"
      },
      "link": "https://www.facebook.com/fbseattle/"
    },
    ...
  ]
}
```

## Fields

| Field Name                               | Description                                                                                          |
|------------------------------------------|------------------------------------------------------------------------------------------------------|
| `id`                                     | The ID of the Facebook Page.                                                                         |
| `is_eligible_for_branded_content`       | Display whether the Facebook Page is eligible to post [branded content](https://www.facebook.com/business/help/788160621327601?id=1912903575666924). |
| `is_unclaimed`                           | Display whether [a Facebook Page that was automatically generated has been claimed](#) by the business it represents, `is_unclaimed=false`, or not, `is_unclaimed=true`. |
| `link`                                   | The link to the Facebook Page.                                                                        |
| `location`                               | The physical location of the business represented by the Facebook Page, if applicable.               |
| `city`                                   | The city where the business represented by the Facebook Page is located.                             |
| `country`                                | The country where the business represented by the Facebook Page is located.                          |
| `latitude`                               | The latitude of the business represented by the Facebook Page.                                       |
| `longitude`                              | The longitude of the business represented by the Facebook Page.                                      |
| `state`                                  | The state where the business represented by the Facebook Page is located.                            |
| `street`                                 | The street on which the business represented by the Facebook Page is located.                        |
| `zip`                                    | The postal code of the business represented by the Facebook Page.                                    |
| `name`                                   | The name of the Facebook Page.                                                                        |
| `verification_status`                    | The [verification status of the Facebook Page](#) that represents a business, `blue_verified` or `not_verified`. |

## Limitations

- The `GET /search?type=place` endpoint is deprecated in v8.0+ and in all versions on Nov. 2, 2020.
- This endpoint does not return a Page's profile picture. Please see the [Page Reference](https://developers.facebook.com/docs/graph-api/reference/page/picture/) for information on getting a Page's profile picture.
- Alias-based searches are not strongly supported and might not return pages that have a low fan following.

## Learn More

- [Branded Content Guide](https://developers.facebook.com/docs/marketing-api/guides/branded-content)
- [Getting Started Guide](https://developers.facebook.com/docs/pages/)
- [@Mention Guide](https://developers.facebook.com/docs/pages/mentions)
- [Page Locations Reference Doc](https://developers.facebook.com/docs/graph-api/reference/page/locations)
- [Page Reference Doc](https://developers.facebook.com/docs/graph-api/reference/page/)
- [Rate Limit Guide](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)



## Page: https://developers.facebook.com/docs/pages-api/posts

```markdown
# Publicaciones

En esta guía, se explica cómo crear, publicar y actualizar una publicación, a responder a una publicación en tu página de Facebook como la página, y a eliminar una publicación usando la API de páginas de Meta.

## Antes de empezar

This guide assumes you have read the [Overview](https://developers.facebook.com/docs/pages/overview).

For a person who can perform tasks on the page, you will need to implement Facebook Login to ask for the following permissions and receive a Page access token:

- `pages_manage_engagement`
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_read_user_engagement`
- `publish_video` permission, if you are publishing a video to the Page

Your app user must be able to perform the `CREATE_CONTENT`, `MANAGE`, and `MODERATE` tasks on the Page in the API requests.

If your app users do not own or manage the Page in the API requests, your app will need a User access token and the following features:

- Page Public Content Access

### Prácticas recomendadas

Al probar una llamada a la API, puedes incluir el parámetro `access_token` configurado en tu token de acceso. Sin embargo, para hacer llamadas seguras desde tu app, usa la [clase de token de acceso](https://developers.facebook.com/docs/facebook-login/guides/access-tokens#portabletokens).

## Realizar publicaciones

Para realizar una publicación en una página, enviar una solicitud `POST` al punto de conexión `/page_id/feed`, donde `page_id` es el identificador de la página, con los siguientes parámetros:

- `message` configurado en el texto de la publicación
- `link` configurado en la URL si deseas publicar un enlace
- `published` configurado en `true` para realizar la publicación de manera inmediata (predeterminado) o `false` para publicarlo después

  - Incluye `scheduled_publish_time` si está configurado en `false` con la fecha en alguno de los siguientes formatos:
    - Una marca de tiempo UNIX entera [en segundos] (por ejemplo, `1530432000`)
    - Una cadena de marca de tiempo [ISO 8061](https://en.wikipedia.org/wiki/ISO_8601) (por ejemplo, `2018-09-01T10:15:30+01:00`)
    - Cualquier cadena analizable mediante la función [`strtotime()`](http://php.net/manual/en/function.strtotime.php) de PHP (por ejemplo, `+2 weeks`, `tomorrow`)

#### Notas sobre publicaciones programadas

- La fecha de publicación debe ser un período de entre 10 minutos y 30 días a partir de la solicitud de la API.
- Si te basas en cadenas de fecha relativas de `strtotime()`, puedes realizar la [lectura después de escritura](https://developers.facebook.com/docs/graph-api/advanced#read-after-write) de la `scheduled_publish_time` de la publicación creada para asegurarte de que quede como se espera.

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

```bash
curl -X POST "https://graph.facebook.com/v24.0/page_id/feed" \
     -H "Content-Type: application/json" \
     -d '{
           "message":"your_message_text",
           "link":"your_url",
           "published":"false",
           "scheduled_publish_time":"unix_time_stamp_of_a_future_date",
         }'
```

Si la operación se procesa correctamente, tu app recibirá la siguiente respuesta JSON con el identificador de la publicación:

```json
{
  "id": "page_post_id" 
}
```

## Agregar la segmentación de audiencia

Para limitar quién puede ver una publicación de la página, puedes agregar el objeto `targeting.geo_locations` o el parámetro `feed_targeting.geo_locations` en la solicitud `POST`.

```bash
-d '{
      ...
      "targeting": {
        "geo_locations": {
          "countries": [
            "CA"
          ],
          "cities": [
            {
              "key": "296875",
              "name": "Toronto"
            }
          ]
        }
      },
      ...
    }'
```

### Solución de problemas

En algunos casos, si se usa un país y una región, se produce el siguiente error: "Algunos de tus lugares se superponen. Elimina un lugar". En tales casos, segmenta la región o el país según la cobertura que quieras.

## Realizar publicaciones de contenido multimedia

Puedes publicar fotos y vídeos en una página.

### Publicar una foto

Para realizar una publicación en una página, envía una solicitud `POST` al punto de conexión `/page_id/photos`, donde `page_id` es el identificador de la página, con el parámetro `url` configurado en la foto de tu publicación.

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

```bash
curl -X POST "https://graph.facebook.com/v24.0/page_id/photos" \
     -H "Content-Type: application/json" \
     -d '{
           "url":"path_to_photo",
         }'
```

Si la operación se procesa correctamente, tu app recibirá la siguiente respuesta JSON con el identificador de la foto y de la publicación:

```json
{
  "id": "photo_id",
  "post_id": "page_post_id"
}
```

### Publicar un video

Consulta la [documentación de la API de video](https://developers.facebook.com/docs/video-api/guides/publishing) para realizar una publicación con video en la página.

## Obtener publicaciones

Para obtener una lista de las publicaciones de la página, envía una solicitud `GET` al punto de conexión `/page_id/feed`.

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

```bash
curl -i -X GET "https://graph.facebook.com/v24.0/page_id/feed"
```

Si la operación se realiza correctamente, la app recibe la siguiente respuesta JSON con una matriz de objetos que incluyen el identificador de la publicación, la hora en que se creó la publicación, y el contenido de la publicación de cada publicación en la página:

```json
{
  "data": [
    {
      "created_time": "2019-01-02T18:31:28+0000",
      "message": "This is my test post on my Page.",
      "id": "page_post_id"
    }
  ],
  ...
}
```

### Limitaciones

- **Videos en vivo**: si la publicación de una página contiene un video que caducó, como una transmisión en vivo, puedes obtener algunos campos de la publicación, pero no los relacionados con el video. El video tiene sus propias reglas de privacidad. Si el video caducó, debes ser el administrador de la página para ver la información.
- **Llamada a la acción de mensajes**: se pueden usar los tokens de acceso para solicitar publicaciones de páginas compartidas públicamente, siempre que tu app cuente con la aprobación de la [función de acceso al contenido público de la página](https://developers.facebook.com/docs/apps/review/feature/#reference-PAGES_ACCESS). Sin embargo, no es posible acceder a las publicaciones con llamadas a la acción de mensajes si se usa otro token de acceso a la página, ya que las páginas no pueden enviar mensajes a otras páginas.

### URL de publicación de la página

La URL, o enlace permanente, de una publicación de la página es `https://www.facebook.com/page_post_id`.

## Actualizar una publicación

Si deseas actualizar una publicación en una página, envía una solicitud `POST` al punto de conexión `/{page-post-id}` con los parámetros que deseas actualizar configurados en el nuevo contenido.

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_post_id**, por tus propios valores.*

```bash
curl -X POST "https://graph.facebook.com/v24.0/page_post_id" \
     -H "Content-Type: application/json" \
     -d '{
           "message":"I am updating my Page post",
         }'
```

Si se hace correctamente, tu app recibirá la siguiente respuesta JSON con `success` configurado en "verdadero":

```json
{
  "success": true
}
```

### Limitaciones

Una app solo puede actualizar una publicación de la página si se realizó con esa app.

## Eliminar una publicación

Si deseas eliminar una publicación en una página, envía una solicitud `DELETE` al punto de conexión `page_post_id`, donde `page_post_id` es el identificador de la publicación que deseas eliminar.

#### Ejemplo de solicitud

*El formato se modificó para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_post_id**, por tus propios valores.*

```bash
curl -i -X DELETE "https://graph.facebook.com/v24.0/page_post_id"
```

Si se hace correctamente, tu app recibirá la siguiente respuesta JSON con `success` configurado en `true`:

```json
{
  "success": true
}
```

## Próximos pasos

Obtén información sobre cómo [comentar en publicaciones de la página y @mencionar](https://developers.facebook.com/docs/pages/comments) a una persona o página específica que publicó o comentó en tu página.

## Más información

### Guías sobre API de video

- [Guía de subida de videos](https://developers.facebook.com/docs/video-api/guides/publishing)
- [Guía de la API de video](https://developers.facebook.com/docs/graph-api/video)

### Referencias

- [Referencia de la página](https://developers.facebook.com/docs/graph-api/reference/page)
- [Referencia de feed de páginas](https://developers.facebook.com/docs/graph-api/reference/page/feed)
- [Referencia de la publicación de la página](https://developers.facebook.com/docs/graph-api/reference/page-post)
- [Referencia sobre permisos](https://developers.facebook.com/docs/permissions)
- [Referencia sobre fotos](https://developers.facebook.com/docs/graph-api/reference/photo)
- [Tareas de la página](https://developers.facebook.com/docs/pages/overview#tasks)
```



## Page: https://developers.facebook.com/docs/pages-api/overview

# Información general

La API de páginas es un conjunto de puntos de conexión de la API Graph de Facebook que las apps pueden usar para crear y administrar la configuración y el contenido de una página.

## Componentes

### Tokens de acceso

La autenticación de la API se realiza mediante tokens de acceso. La mayoría de los puntos de conexión requieren tokens de acceso a la página, que son únicos de cada página, usuario de la app y app, y no tienen fecha de vencimiento. Para obtener un token de usuario de la app, el usuario debe ser el dueño de la página o tener la posibilidad de realizar una tarea en ella.

Puedes obtener tokens de acceso desde los usuarios de tu app al implementar el inicio de sesión con Facebook para empresas.

### API Graph

Si no estás familiarizado con la API Graph, lee la documentación sobre la API Graph antes de continuar, a fin de obtener más información sobre la gráfica social de Meta.

### Inicio de sesión con Facebook

El inicio de sesión con Facebook permite a los usuarios iniciar sesión en tu app y a tu app la posibilidad de solicitar a los usuarios permisos de acceso a los datos.

### Inicio de sesión con Facebook para empresas

El inicio de sesión con Facebook para empresas es la solución de autenticación y autorización ideal para los proveedores de tecnología y los desarrolladores de apps de negocios que necesitan contar con acceso a los recursos de los clientes de negocios.

### Funciones

Algunos puntos de conexión requieren una función que se debe aprobar mediante el proceso de revisión de apps. De esta manera, tu app podrá usarlos cuando se publica. Las funciones te permiten acceder a datos de páginas públicas sin permiso o realizar una tarea en ellas. Consulta la referencia de cada punto de conexión para determinar qué función de página requiere.

### Menciones

Con las @menciones, tu página puede responder de manera pública a una persona específica, que hizo una publicación en tu página o comentó una publicación de la página, ya sea en un comentario o en una respuesta.

### Identificadores de usuario específicos de la página

Los usuarios que interactúan con las páginas se identifican mediante identificadores de usuario específicos de la página (PSID). Los PSID son identificadores únicos de cada pareja de usuario y página. Los puntos de conexión de la API de páginas y la plataforma de Messenger dependen de los identificadores de usuario específicos de la página (PSID), así que puedes usar un PSID para identificar las interacciones de un usuario con una página, además de las conversaciones de Messenger públicas del usuario con la página.

### Permisos

La mayoría de los puntos de conexión requieren uno o más permisos, que los usuarios de la app deben otorgar a tu app. Normalmente, esto se puede hacer mediante el inicio de sesión con Facebook, pero también se puede hacer a través del administrador comercial, si una empresa reclamó tu app.

Todos los permisos requieren una revisión de apps antes de que un usuario de la app pueda otorgarlos a su app después de su activación. En el caso de las apps comerciales, que no tienen modos de app, los permisos deben aprobarse para el acceso avanzado antes de que un usuario pueda otorgarlos a tu app sin un rol en esta en sí o un rol en una empresa que la haya reclamado.

### Búsqueda en la página

Encuentra información sobre las páginas de Facebook, incluidos los nombres y ubicaciones; encuentra páginas para @mencionar y ubicaciones de páginas; y etiqueta una página para mostrar contenido de marca.

### Límites de frecuencia

Todas las solicitudes de puntos de conexión de las páginas están sujetas a límites de frecuencia. Puedes ver el consumo actual de llamadas de tu app en el **panel de apps**.

### Tareas

Permiten a los usuarios realizar acciones específicas en una página. Cuando un usuario usa una app para interactuar con una página, según el tipo de acción que intente realizar, primero comprobaremos que el usuario tenga aprobada una tarea que permita ese tipo de acción.

Puedes autorizar las siguientes tareas para usuarios individuales:

| Tarea                      | Acciones permitidas                                                                                                 |
|----------------------------|---------------------------------------------------------------------------------------------------------------------|
| `ADVERTISE`                | - Crear anuncios <br> - Crear publicaciones de página ocultas <br> - Crear anuncios si una cuenta de Instagram está conectada a la página |
| `ANALYZE`                  | - Ver estadísticas de la página <br> - Ver qué administrador de la página hizo una publicación o un comentario      |
| `CREATE_CONTENT`           | - Publicar contenido en la página en nombre de ella                                                                |
| `MANAGE`                   | - Asignar y administrar tareas de la página                                                                         |
| `MANAGE_LEADS`             | - Ver y administrar clientes potenciales                                                                             |
| `MESSAGING`                | - Enviar mensajes en nombre de la página                                                                             |
| `MODERATE`                 | - Responder comentarios en las publicaciones de la página actuando en nombre de ella. <br> - Eliminar comentarios en las publicaciones de la página. <br> - Si una cuenta de Instagram está conectada a la página, publicar contenido en Instagram desde Facebook, responder a comentarios y eliminarlos, enviar mensajes directos, sincronizar la información de contacto de la empresa y crear anuncios. |
| `VIEW_MONETIZATION_INSIGHTS` | - Ver estadísticas de monetización                                                                                 |

Si a una persona se le da acceso de administrador a una página en la UI, puede realizar todas las tareas en esa página.

### Plataforma de Messenger

Mantén conversaciones de Messenger con tus clientes y con las personas interesadas en tu página.

### Webhooks de Meta para páginas

Recibe notificaciones en tiempo real cuando un usuario realice un comentario en una publicación de la página o reaccione a una publicación.

## Revisión de apps

Todos los permisos y funciones relacionados con la página requieren aprobación mediante el proceso de revisión de apps. Una vez aprobados, tu app puede usarlos cuando esté activa.

Las apps en modo de desarrollo pueden solicitar permisos de cualquier usuario que tenga un rol en la app.

## Cómo funciona

Este es un proceso típico para acceder a la API de páginas:

1. Obtener un token de acceso del usuario de tu app a través del inicio de sesión con Facebook para empresas.
2. Consultar el punto de conexión `/me/accounts` para obtener el identificador y el token de acceso a la página según el acceso permitido a la app por el usuario.
3. Capturar el identificador de página y el token de acceso a la página devueltos.
4. Usar el identificador y el token para consultar el nodo de la página.

Ten en cuenta que, en algunos casos, el usuario de la app puede concederle a esta acceso a más de una página. En ese caso, debes capturar cada identificador de la página y su token correspondiente, además de proporcionar una manera de que el usuario de la app pueda llegar a cada una de las páginas.

## Próximos pasos

Consulta nuestra [Guía de primeros pasos](https://developers.facebook.com/docs/pages/getting-started) para obtener información sobre cómo hacer publicaciones en una página mediante la API de páginas.

## Consulta también:

### Desarrollo de apps con Meta

- [Roles de la app](https://developers.meta.com/development/build-and-test/app-roles)
- [Desarrollo con Meta](https://developers.meta.com/development)
- [API Graph](https://developers.meta.com/graph-api/)
- [Punto de conexión `/me`](https://developers.meta.com/graph-api/overview#me)
- [Límites de frecuencia](https://developers.meta.com/graph-api/overview/rate-limiting#pages)

### Autenticación y autorización

- [Tokens de acceso](https://developers.meta.com/facebook-login/access-tokens)
- [Acceso avanzado para apps de negocios](https://developers.meta.com/graph-api/overview/access-levels)
- [Inicio de sesión con Facebook](https://developers.meta.com/facebook-login)
- [Inicio de sesión con Facebook para empresas](https://developers.meta.com/facebook-login/facebook-login-for-business)
- [Identificadores de usuario específicos de la página](https://developers.meta.com/pages/access-tokens/psid-api)

### Guías de páginas

- [Menciones](https://developers.meta.com/pages/mentions)
- [Documentación de la plataforma de Messenger](https://developers.meta.com/messenger-platform)
- [Búsqueda en páginas](https://developers.meta.com/pages/searching)

### Referencias

- [Referencia de funciones](https://developers.meta.com/features-reference)
- [Referencia de puntos de conexión de la página](https://developers.meta.com/graph-api/reference/page)
- [Referencia de permisos](https://developers.meta.com/permissions#p)
- [Referencia de dependencias de permisos](https://developers.meta.com/permissions#permission-dependencies)
- [Referencia de puntos de conexión de cuentas de usuario](https://developers.meta.com/graph-api/reference/user/accounts)



## Page: https://developers.facebook.com/docs/pages-api/create-an-app

```markdown
El siguiente contenido proviene de la documentación para desarrollo de la app de Meta. Consulta la documentación de desarrollo para obtener más información sobre el [proceso de desarrollo de la app de Meta](https://developers.facebook.com/docs/development).

# Customize a Meta app with the Manage everything on your Page Use Case

This document shows you how to customize the **Manage everything on your Page** use case you added to your app during the [app creation process](/docs/development/create-an-app/).

## Use case customization

1. Click **Dashboard** in menu to the left in the App Dashboard. Each use case that you have added to your app is listed here.
2. Select the use case you want to customize. This allows you to add settings and permissions to make your app work the way you want it to.
3. Add permissions that your app needs and remove permissions that your app doesn't need.
4. Click **Ready to test** to test each use case. If you need to submit your app for Meta App Review, you must test each use case. The [**Meta's Graph API Explorer**](https://developers.facebook.com/tools/explorer) allows you to test your queries and get access tokens and code samples for your queries.
5. Click **Dashboard** to repeat the above for each use case.

### Permissions

1. To customize the Pages API use case select **Customize the Manage everything on your Page use case**. You are redirected to a list of permissions available for this use case. The following permissions are required for this use case and added by default:
   - `business_management`
   - `pages_show_list`
   - `public_profile`
2. Click **Add** next to each additional features or permissions that your app needs to work the way you want it to.

Si estás implementando el [inicio de sesión con Facebook para empresas](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/) en tu app, sigue estos pasos.

### Configuración

1. Haz clic en **Inicio de sesión con Facebook para empresas** en el menú a la izquierda en el panel de apps.
2. Selecciona **Configuración**.
3. Agrega tu **URI de redireccionamiento** y haz clic en **Comprobar URI** para validarlo.
4. Personaliza la **configuración del cliente de OAuth**.
5. Agrega tu **URL de devolución de llamada para autorización cancelada**.
6. Agrega tu **URL de la solicitud de eliminación de datos**.
7. Haz clic en **Guardar cambios**.

### Inicio rápido

Usa la función "Inicio rápido" para agregar el inicio de sesión con Facebook para empresas a tu app.

1. Haz clic en **Inicio rápido**.
2. Selecciona y personaliza cada plataforma en la app.
3. Agrega el **botón de inicio de sesión con Facebook** a tu app.

### Configuración

Esta característica opcional del inicio de sesión con Facebook para empresas te permite crear múltiples configuraciones y presentarlas a diferentes conjuntos de usuarios. Las configuraciones te permiten elegir lo siguiente:

- El tipo de variación de inicio de sesión para presentar a los usuarios de tu app.
- El tipo de token de acceso que deseas solicitar a tus clientes de negocios, un token de acceso de usuario o un token de acceso de usuario del sistema y la fecha de caducidad del token.
  - Si seleccionas "Token de usuario del sistema", los usuarios de tu app iniciarán sesión con sus cuentas personales de Facebook.
  - Si seleccionas "Token de acceso del usuario del sistema", los usuarios de tu app deberán iniciar sesión con un portfolio comercial. Esto es obligatorio únicamente si la configuración necesita acceso continuo a los activos comerciales, como páginas de Facebook, cuentas publicitarias o cuentas de Instagram.
- Los activos comerciales que deseas solicitar a tus clientes.
- Los permisos que los usuarios de tu app deben otorgar a tu app.

## Become a Tech Provider

If your app needs to access business data owned by other business portfolios to provide services or functionality to those businesses, you must become a Tech Provider. This option will require additional data questions and approval through App Review before publishing.

1. Click **Become a Tech Provider**.
2. Click **Yes, I'm a Tech Provider**. The App Dashboard is updated to include additional items listed on **Dashboard** for your use cases.
3. Click **Business verification** to add a verified business portfolio or add a business portfolio and start the verification process.

## App Review

1. In the left side menu go to **Review > App Review**. Click the **Edit** button to start your submission. All permissions and features you are requesting, with links to the documentation for each, are listed here.
2. **Complete App Settings** – Click **Review your app settings** to add or update any [app settings](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings) such as app icon, privacy policy URL, and app category. **This step must be complete before continuing.**
3. **Reviewer instructions** – Click **Provide reviewer instructions**. A popup dialog appears for each platform on which your app is available. Select each platform and answer the questions with questions for our reviewers to test your use case implementations. Click **Done**.
4. Click each permission and feature you requested.
5. Click the checkbox to agree to use each permission or feature in accordance with its allowed usage. If your app doesn't use a permission or feature listed, remove it by clicking the trashcan icon.
6. Click the **Submit for Review** button in the lower right.

## Publish your app

**Note:** Some use cases require your app to be published.

1. When you are ready to publish, select **Publish** in the left side menu.
2. **Review** your use cases and requirements.
3. Click **Publish** in the lower right corner.

## See Also

Visit the following to learn more about the app development process:

- [App Development](/docs/development)
- [Business verification](https://developers.facebook.com/docs/development/release/business-verification)
- [Permissions Reference](/docs/permissions)
- [Pages API Developer Documentation](/docs/pages-api)
```



## Page: https://developers.facebook.com/docs/pages-api/webhooks-for-pages

# Webhooks de páginas

Los webhooks para [páginas](https://developers.facebook.com/docs/pages) pueden enviarte notificaciones en tiempo real sobre cambios en tus páginas. Por ejemplo, puedes recibir actualizaciones en tiempo real cada vez que los usuarios publiquen en tu lista, comenten una publicación o indiquen que les gustan tus publicaciones.

Para configurar el webhook de una página:

1. [Configura tu punto de conexión y el producto Webhooks](#set-up-endpoint-and-product).
2. [Instala tu app](#install-app) usando tu página de Facebook.

## Configuración de tu punto de conexión y el producto Webhooks

Sigue nuestra [Guía introductoria](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) para crear tu punto de conexión y configurar el producto Webhooks. Durante la configuración, asegúrate de elegir el objeto **Página** y suscribirte a uno o más de los siguientes campos de Página.

| Campo      | Descripción                                                                                                                                                             |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `feed`     | Te notifica cuando la lista de una página ha cambiado; publicaciones, reacciones, contenido compartido, etc.                                                            |
| `messages` | Te notifica cuando la página recibió un mensaje mediante Messenger. Consulta la [guía de webhooks de Messenger](https://developers.facebook.com/docs/messenger-platform/webhook#events) para obtener una lista de todos los campos de webhooks de mensajes disponibles. |

## Instala tu app

Las notificaciones del webhook solo se enviarán si tu página tiene instalada la app configurada para Webhooks y si la página no tiene la plataforma **App** desactivada en la [Configuración de la app](https://www.facebook.com/settings?tab=applications). Para que tu página instale la app, haz que envíe una solicitud `POST` al perímetro [subscribed_apps](https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps) de la página usando el token de acceso a la página.

### Requisitos

- Un token de acceso a la página que solicitó una persona que puede realizar la tarea [CREATE_CONTENT, MANAGE o MODERATE](https://developers.facebook.com/docs/pages/overview#tasks) en la página que se está consultando.
- Los permisos [pages_manage_metadata](https://developers.facebook.com/docs/pages/overview/permissions-features#permission-dependencies) y [pages_show_list](https://developers.facebook.com/docs/pages/overview/permissions-features#permission-dependencies) son obligatorios en el caso de los webhooks `feed`.
- El permiso [pages_messaging](https://developers.facebook.com/docs/pages/overview/permissions-features#permission-dependencies) también es obligatorio en el caso de los mensajes `messages`.

Solo en el caso de los campos relacionados con mensajes:

- Un token de acceso a la página que solicitó una persona que puede realizar la tarea [MESSAGING](https://developers.facebook.com/docs/pages/overview#tasks) en la página que se está consultando.
- [pages_messaging](https://developers.facebook.com/docs/permissions/reference/pages_messaging).

#### Ejemplo de solicitud

```bash
curl -i -X POST "https://graph.facebook.com/{page-id}/subscribed_apps?subscribed_fields=feed&access_token={page-access-token}"
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
curl -i -X GET "https://graph.facebook.com/{page-id}/subscribed_apps&access_token={page-access-token}"
```

#### Ejemplo de respuesta

```json
{
  "data": [
    {
      "category": "Business",
      "link": "https://my-clever-domain-name.com/app",
      "name": "My Sample App",
      "id": "{page-id}"
    }
  ]
}
```

Si no hay apps instaladas en tu página, la API devolverá un conjunto de datos vacío.

### Explorador de la API Graph

Si no quieres instalar tu app mediante programación, puedes hacerlo fácilmente con el [Explorador de la API Graph](https://developers.facebook.com/tools/explorer):

1. Selecciona tu app en el menú desplegable **App**. Esto te devolverá el token de acceso a tu app.
2. Haz clic en el menú desplegable **Obtener token**, selecciona **Obtener token de acceso de usuario** y luego elige el permiso `pages_manage_metadata`. Esto cambiará el token de tu app por un token de acceso de usuario con el permiso `pages_manage_metadata` otorgado.
3. Vuelve a hacer clic en **Obtener token** y selecciona tu página. Esto cambiará tu token de acceso de usuario por un token de acceso a la página.
4. Cambia el modo de operación haciendo clic en el menú desplegable `GET` y seleccionando `POST`.
5. Reemplaza la consulta predeterminada `me?fields=id,name` por el **identificador** de la página seguido por `/subscribed_apps` y luego envía la consulta.

## Usos comunes

### Obtener detalles de las noticias de la página

Tu app puede suscribirse a las noticias de una página y recibir notificaciones cada vez que ocurra un cambio relacionado con la lista. Por ejemplo, esta es una notificación que se envía cuando un usuario publica en una página.

#### Ejemplo de respuesta de webhook

```json
[
  {
    "entry": [
      {
        "changes": [
          {
            "field": "feed",
            "value": {
              "from": {
                "id": "{user-id}",
                "name": "Cinderella Hoover"
              },
              "item": "post",
              "post_id": "{page-post-id}",
              "verb": "add",
              "created_time": 1520544814,
              "is_hidden": false,
              "message": "It's Thursday and I want to eat cake."
            }
          }
        ],
        "id": "{page-id}",
        "time": 1520544816
      }
    ],
    "object": "page"
  }
]
```

Usa el `post_id` de la notificación para [comentar en esa publicación de la página](https://developers.facebook.com/docs/pages/publishing#comment_on_post).

#### Ejemplo de solicitud a la API

```bash
curl -i -X POST "https://graph.facebook.com/{page-post-id}/comments?message=I%20want%20chocolate%20cake%20!&access_token=page-access-token"
```

#### Ejemplo de respuesta de la API

```json
{
  "id": "{comment-id}"
}
```



## Page: https://developers.facebook.com/docs/pages-api/manage-pages

```markdown
# Administrar una página

En este documento, se explica cómo realizar las siguientes tareas para una página de Facebook:

- Obtener una lista de páginas en las que se puede realizar una tarea, incluidas las siguientes:
  - Tareas específicas que puedes realizar en cada página
  - Tokens de acceso de cada página que puedes usar para probar las llamadas a la API
- Obtener y actualizar los detalles de una página
- Obtener y actualizar la configuración de una página 
- Recibir notificaciones sobre cambios sugeridos que Meta implementará en una página
  - Aceptar o rechazar estos cambios sugeridos
- Obtener opiniones sobre una página
- Bloquear a una persona en una página

## Antes de empezar

En esta guía, se presume que leíste la [información general sobre la API de páginas](https://developers.facebook.com/docs/pages/overview).

En relación con una persona que puede realizar tareas en la página, es necesario que implementes el inicio de sesión con Facebook para empresas a fin de solicitar los siguientes permisos y recibir un token de acceso a la página o de usuario:

- `pages_manage_engagement`
- `pages_manage_metadata`
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_read_user_engagement`
- `pages_show_list`
- el permiso `publish_video` si publicas un video en la página

Si utilizas un usuario del sistema comercial en tus solicitudes a la API, es necesario que cuentes con el permiso `business_management`.

El usuario de tu app debe poder realizar las tareas `CREATE_CONTENT`, `MANAGE` y/o `MODERATE` de la página en las solicitudes de la API.

### Prácticas recomendadas

Al probar una llamada a la API, puedes incluir el parámetro `access_token` configurado en tu token de acceso. Sin embargo, para hacer llamadas seguras desde tu app, usa la [clase de token de acceso](https://developers.facebook.com/docs/facebook-login/guides/access-tokens#portabletokens).

*Se modificó el formato de los ejemplos de solicitudes para facilitar la lectura. Reemplaza los **valores en negrita y en cursiva**, como **page_id**, por tus propios valores.*

## Páginas, tareas y tokens

Con una sola llamada a la API puedes obtener mucha información sobre las páginas en las que puedes realizar una tarea.

### Obtener tus páginas

Para obtener una lista de todas las páginas en las que puedes realizar tareas, las tareas que puedes realizar en cada página y un token de acceso de corta duración para cada página, envía una solicitud `GET` al punto de conexión `/user_id/accounts` usando un token de acceso de usuario.

#### Ejemplo de solicitud

```bash
curl -i -X GET "https://graph.facebook.com/user_id/accounts"
```

Si la operación se procesa correctamente, tu app recibirá una respuesta JSON con una matriz de objetos de página. Cada objeto de página contiene lo siguiente:

- El nombre de la página
- El identificador de la página
- La categoría de la página, el nombre de la categoría y el identificador
- Un token de acceso a la página de corta duración
- Todas las tareas que el usuario puede realizar en la página

#### Ejemplo de respuesta

```json
{
  "data": [
    {
      "access_token": "{facebook-for-developers-page-access-token}",
      "category": "Internet Company",
      "category_list": [
        {
          "id": "2256",
          "name": "Internet Company"
        }
      ],
      "name": "Facebook for Developers",
      "id": "{facebook-for-developers-page-id}",
      "tasks": [
        "ANALYZE",
        "ADVERTISE",
        "MODERATE",
        "CREATE_CONTENT"
      ]
    },
    {
      "access_token": "{my-outlandish-stories-page-access-token}",
      "category": "Blogger",
      "category_list": [
        {
          "id": "361282040719868",
          "name": "Blogger"
        }
      ],
      "name": "My Outlandish Stories",
      "id": "{my-outlandish-stories-page-id}",
      "tasks": [
        "ANALYZE",
        "ADVERTISE",
        "MODERATE",
        "CREATE_CONTENT",
        "MANAGE"
      ]
    },
    ...
  ]
}
```

### Consultar tareas de otros

Si puedes realizar la tarea `MANAGE` en la página, puedes obtener una lista de otras personas que pueden realizar tareas en esa página, incluidas las tareas que cada persona puede realizar.

Para obtener una lista de personas y las tareas que pueden realizar en la página, envía una solicitud `GET` al punto de conexión `/page_id/roles`.

#### Ejemplo de solicitud

```bash
curl -i -X GET "https://graph.facebook.com/page_id/roles"
```

Si la solicitud se procesa correctamente, tu app recibirá una respuesta JSON con el nombre de la persona, su identificador específico de la página y las tareas que cada persona puede realizar en una página.

#### Ejemplo de respuesta

```json
{
  "data": [
    {
      "name": "Person One",
      "id": "page_scoped_id_for_one",
      "tasks": [
        "ANALYZE"
      ]
    },
    {
      "name": "Person Two",
      "id": "page_scoped_id_for_two",
      "tasks": [
        "ANALYZE",
        "ADVERTISE",
        "MODERATE",
        "CREATE_CONTENT",
        "MANAGE"
      ]
    },
    ...
  ]
}
```

### Detalles de la página

Si puedes realizar la tarea `MANAGE` en la página, puedes usar un token de acceso a la página o, si tu app cuenta con la aprobación para usar la función de acceso al contenido público de la página, puedes usar un token de acceso de usuario para ver los detalles de una página, como la información general, el correo electrónico, los horarios de operación, etc.

#### Obtener detalles

Para obtener los detalles de una página, envía una solicitud `GET` al punto de conexión `/page_id` con el parámetro `fields` configurado en los detalles de la página que deseas ver.

**Nota:** Puedes usar el punto de conexión `/pages/search` para encontrar identificadores de la página cuando usas la función de acceso al contenido público de la página.

#### Ejemplo de solicitud

```bash
curl -i -X GET "https://graph.facebook.com/page_id?fields=about,attire,bio,location,parking,hours,emails,website"
```

Si la operación se procesa correctamente, la app recibirá una respuesta JSON con el valor de los campos que solicitaste. Si no se muestra un campo en la respuesta, significa que la página no tiene ese valor configurado. Por ejemplo, si la página no tiene definido el campo `attire`, este campo no aparecerá en la respuesta.

### Actualizar detalles

Si puedes realizar la tarea `MANAGE` en la página, puedes utilizar un token de acceso a la página para enviar una solicitud `POST` al punto de conexión `/page_id` con los parámetros que deseas actualizar, como `about`.

#### Ejemplo de solicitud

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/page_id" \
-H "Content-Type: application/json" \
-d '{
      "about":"This is an awesome cafe located downtown!"
    }'
```

Si la operación se procesa correctamente, tu app recibirá una respuesta JSON con `success` configurado en `true`.

### Cambios propuestos por Meta

En algunas ocasiones, Meta propondrá cambios en los detalles de tu página, como corregir un error tipográfico o actualizar las categorías de la página para ayudar a las personas a encontrar tu página de manera más efectiva. Para recibir estas notificaciones, debes estar suscrito a los webhooks `page_upcoming_change` y/o `page_change_proposal`.

Una vez que recibas la notificación, tienes las dos siguientes opciones:

- No hacer nada y los cambios se implementarán en el momento designado en la notificación
- Aceptar activamente los cambios, que se implementarán de inmediato
- Rechazar activamente los cambios, que no se implementarán

#### Aceptar o rechazar un cambio propuesto

Para aceptar o rechazar un cambio propuesto de manera activa, envía una solicitud `POST` al punto de conexión `/page_change_proposal_id` con el campo `accept` configurado en `true` para aceptar el cambio o en `false` para rechazarlo. El `page_change_proposal_id` es el valor de `proposal.id` que recibiste en la notificación de webhook `page_upcoming_change` o el valor de `value.id` que recibiste en la notificación de webhook `page_change_proposal`.

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/page_change_proposal_id" \
-H "Content-Type: application/json" \
-d '{
      "accept":"true"
    }'
```

Si la operación se procesa correctamente, tu app recibirá una respuesta JSON con `success` configurado en `true`.

### Configuración de la página

Si puedes realizar la tarea `MANAGE` en la página, puedes utilizar un token de acceso a la página para enviar una solicitud `GET` al punto de conexión `/page_id/settings` para obtener una lista de todas las configuraciones de esa página.

#### Ejemplo de solicitud

```bash
curl -i -X GET "https://graph.facebook.com/v24.0/page_id/settings"
```

Si la operación se procesa correctamente, tu app recibirá una respuesta JSON con una matriz de objetos, donde cada objeto tiene el campo `setting` configurado en una configuración de la página y el campo value configurado en `true` o en `false`.

#### Ejemplo de respuesta

```json
{
  "data": [
    {
      "setting": "USERS_CAN_POST",
      "value": false
    },
    {
      "setting": "USERS_CAN_MESSAGE",
      "value": true
    },
    {
      "setting": "USERS_CAN_POST_PHOTOS",
      "value": true
    },
    ...
  ]
}
```

### Actualizar una configuración

Para actualizar las configuraciones de una página, envía una solicitud `POST` al punto de conexión `/page_id/settings` donde el valor del parámetro `option` sea la configuración que deseas actualizar.

#### Ejemplo de solicitud

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/page_id/settings" \
-H "Content-Type: application/json" \
-d '{
      "option":{"USERS_CAN_MESSAGE": "true"}
    }'
```

Si la operación se procesa correctamente, tu app recibirá una respuesta JSON con `success` configurado en `true`.

### Consultar opiniones

Puedes consultar las opiniones de una página, incluido el nombre del autor, su identificador específico de la página, si se trata de una recomendación positiva o negativa, y el texto de la opinión. Para hacerlo, envía una solicitud `GET` al punto de conexión `/page_id/ratings`.

#### Ejemplo de solicitud

```bash
curl -i -X GET "https://graph.facebook.com/page_id/ratings"
```

Si la operación se completa correctamente, la app recibirá una matriz JSON con los objetos de opinión. Cada objeto contiene lo siguiente:

- `created_time` configurado en la hora en que se creó la opinión
- `recommendation_type` configurado en `positive` o `negative`
- `review_text` configurado en el contenido de la opinión
- un objeto `reviewer` con el `name` y `id` de la persona que escribió la opinión

```json
{
  "data": [
    {
      "created_time": "unixtimestamp",
      "recommendation_type": "positive",
      "review_text": "I love this page!",
      "reviewer": {
        "name": "Person One",
        "id": "psid_for_one"
      }
    },
    {
      "created_time": "unixtimestamp",
      "recommendation_type": "positive",
      "review_text": "This page is wonderful!",
      "reviewer": {
        "name": "Person Two",
        "id": "psid_for_two"
      }
    },
    ...
  ]
}
```

### Bloquear a una persona

Para bloquear a una persona y evitar que deje comentarios en una página, envía una solicitud `POST` al punto de conexión `/page_id/blocked` con el parámetro `user` configurado en el identificador específico de la página de la persona que deseas bloquear.

#### Ejemplo de solicitud

```bash
curl -i -X POST "https://graph.facebook.com/v24.0/page_id/blocked" \
-H "Content-Type: application/json" \
-d '{
      "user":"psid_to_block"
    }'
```

Si la operación se procesa correctamente, tu app recibirá una respuesta JSON con el identificador específico de la página configurado en `true`.

```json
{
  "psid_to_block": true
}
```

## Próximos pasos

Obtén información sobre cómo [publicar enlaces, fotos y videos en tu página](https://developers.facebook.com/docs/pages-api/posts).

## Consulta también

- [Webhooks de Meta para páginas](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages)
- [Servicio de ayuda de Meta para empresas – Usuario del sistema de negocios](https://www.facebook.com/business/help/327596604689624)

### Referencias

- [Referencia de la página](https://developers.facebook.com/docs/graph-api/reference/page)
- [Referencia de página bloqueada](https://developers.facebook.com/docs/graph-api/reference/page/blocked)
- [Referencia de feed de páginas](https://developers.facebook.com/docs/graph-api/reference/page/feed)
- [Referencia de publicación de la página](https://developers.facebook.com/docs/graph-api/reference/page-post)
- [Configuración de la página](https://developers.facebook.com/docs/graph-api/reference/page/settings)
- [Referencia de próximos cambios en la página](https://developers.facebook.com/docs/graph-api/reference/page-upcoming-change)
- [Referencia sobre permisos](https://developers.facebook.com/docs/permissions)
- [Referencia de cuentas de usuario](https://developers.facebook.com/docs/graph-api/reference/user/accounts)
```