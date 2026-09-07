import { LogLevel } from "@azure/msal-browser";

/**
 * Configuración principal de MSAL (Microsoft Authentication Library)
 * para integración con Microsoft Entra ID (Azure AD).
 */
export const msalConfig = {
  auth: {
    clientId: "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4", 
    authority: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f", // Tenant ID de Pedidos360
    redirectUri: "http://localhost:5173",
    postLogoutRedirectUri: "http://localhost:5173",
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage", // Guarda el estado en sessionStorage de la pestaña actual
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error("[MSAL Error]:", message);
            return;
          case LogLevel.Info:
            console.info("[MSAL Info]:", message);
            return;
          case LogLevel.Verbose:
            console.debug("[MSAL Verbose]:", message);
            return;
          case LogLevel.Warning:
            console.warn("[MSAL Warning]:", message);
            return;
          default:
            return;
        }
      },
    },
  },
};

/**
 * Scopes requeridos para iniciar sesión y emitir el token con la audiencia de la API
 */
export const loginRequest = {
  scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
};

/**
 * Scopes requeridos para invocar las APIs protegidas del backend en AWS
 */
export const apiRequest = {
  scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
};
