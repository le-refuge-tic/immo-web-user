/**
 * Compresse une photo dans le navigateur avant envoi : côté le plus long ramené
 * à `maxSide` px, export WebP (JPEG si le navigateur ne sait pas encoder le WebP).
 * Les connexions mobiles lentes envoient ainsi ~300 Ko au lieu de 4 à 8 Mo.
 * En cas d'échec ou si le résultat n'est pas plus léger, le fichier d'origine est conservé.
 */
const PHOTO_MAX_SIDE = 1600
const QUALITE = 0.8
const SEUIL_OCTETS = 400 * 1024 // en dessous, inutile de recompresser

export function targetSize(width: number, height: number, maxSide = PHOTO_MAX_SIDE): { width: number; height: number } {
  const ratio = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

export async function compressImage(file: File, maxSide = PHOTO_MAX_SIDE): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < SEUIL_OCTETS) return file
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = targetSize(bitmap.width, bitmap.height, maxSide)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const toBlob = (type: string) => new Promise<Blob | null>(res => canvas.toBlob(res, type, QUALITE))
    let blob = await toBlob('image/webp')
    let type = 'image/webp'
    if (!blob || blob.type !== 'image/webp') { blob = await toBlob('image/jpeg'); type = 'image/jpeg' }
    if (!blob || blob.size >= file.size) return file
    const nom = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg')
    return new File([blob], nom, { type, lastModified: Date.now() })
  } catch {
    return file
  }
}
