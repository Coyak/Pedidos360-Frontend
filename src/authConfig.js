import { LogLevel } from "@azure/msal-browser";

/**
 * Configuración principal de MSAL (Microsoft Authentication Library)
 * para integración con Microsoft Entra ID (Azure AD).
 */
export const msalConfig = {
  auth: {
    clientId: "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4", 
    authority: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f", // Tenant ID de Pedidos360
    redirectUri: typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : "http://localhost:5173",
    postLogoutRedirectUri: typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : "http://localhost:5173",
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

/**
 * Scopes estándar requeridos para inicio de sesión en Azure Entra ID (guía docente)
 */
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

/**
 * Scopes requeridos para invocar las APIs protegidas del backend en AWS
 */
export const apiRequest = {
  scopes: ["openid", "profile", "email", "api://5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
};
