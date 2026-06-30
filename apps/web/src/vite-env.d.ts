/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the platform API. Empty in dev (same-origin via the Vite proxy);
   *  set to the API host (e.g. https://api.stage.contracthubs.com) at build time
   *  in stage/prod so the browser calls the API directly. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
