/**
 * The platform lib files (twitterApi, linkedinApi, etc.) were written against
 * DOM-style `Response.json(): Promise<any>`. In @types/node for Node 18+,
 * json() returns Promise<unknown>, which breaks those files.
 *
 * This ambient override re-aligns the API project with the web app's behavior.
 * When we move the platform files to packages/platforms in Phase 8, we can add
 * proper runtime type guards there.
 */
declare global {
  interface Response {
    json(): Promise<any>  // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export {}
