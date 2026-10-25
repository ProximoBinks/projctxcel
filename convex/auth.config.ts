// Tells Convex to accept identity tokens issued by our own Next.js app.
// `domain` must equal CONVEX_ISSUER in lib/convexAuthKeys.ts and be the origin
// serving /.well-known/openid-configuration. `applicationID` = the token `aud`.
const config = {
  providers: [
    {
      domain: "https://simpletuition.com.au",
      applicationID: "convex",
    },
  ],
};

export default config;
