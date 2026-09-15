/* MSAL configuration for Microsoft Authentication Library */

import { Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "YOUR_CLIENT_ID",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || "common"}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (_level, message) => console.log(message),
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "Group.Read.All", "Mail.Read"],
};

export const graphScopes = {
  scopes: ["https://graph.microsoft.com/.default"],
};
