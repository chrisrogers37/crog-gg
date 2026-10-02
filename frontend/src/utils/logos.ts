/**
 * Organisation logos are self-hosted, one 64px PNG per domain in
 * site/public/logos/ (#178). The third-party sources they came from never rendered
 * in production: logo.clearbit.com no longer resolves, and Google's favicon
 * endpoint redirects to a host the CSP does not allow.
 */
export const logoUrl = (domain: string) => `/logos/${domain}.png`;
