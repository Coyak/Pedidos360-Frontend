import { LogLevel } from "@azure/msal-browser";

/**
 * Configuración de Microsoft Authentication Library (MSAL)
 * para integración con Microsoft Entra ID (Azure AD).
 * Parametrizado mediante variables de entorno VITE_* sin localhost hardcodeado.
 */
const clientId = import.meta.env?.VITE_AZURE_CLIENT_ID || "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4";
const tenantId = import.meta.env?.VITE_AZURE_TENANT_ID || "e5372bf0-c5e3-4286-887c-79069f209c1f";

const getOriginUri = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return "";
};

export const msalConfig = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: import.meta.env?.VITE_AZURE_REDIRECT_URI || getOriginUri(),
    postLogoutRedirectUri: import.meta.env?.VITE_AZURE_REDIRECT_URI || getOriginUri(),
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) {
          console.error("[MSAL Error]:", message);
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

export const apiRequest = {
  scopes: ["openid", "profile", "email", `api://${clientId}/.default`],
};

export default msalConfig;
