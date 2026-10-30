export const HOTES_API_PRODUCTION: string[]
export function apiProdEnPreview(options: {
  apiUrl: string | undefined
  vercelEnv: string | undefined
  hotesSupplementaires?: string[]
  autorise?: boolean
}): string | null
