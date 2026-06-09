// Tells Convex to accept identity tokens issued by our own Next.js app.
// `domain` must equal CONVEX_ISSUER in lib/convexAuthKeys.ts and be the origin
// serving /.well-known/openid-configuration. `applicationID` = the token `aud`.
export default {
  providers: [
    {
      domain: "https://simpletuition.com.au",
      applicationID: "convex",
    },
  ],
};
