import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

interface UploadResult {
  url: string
  filename: string
}

export async function saveUploadedFile(file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Dateityp ${file.type} nicht erlaubt. Erlaubt: JPEG, PNG, WebP, AVIF`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Datei zu groß. Maximal 5 MB.')
  }

  const yearMonth = new Date().toISOString().slice(0, 7)
  const dir = path.join(UPLOAD_DIR, yearMonth)
  await mkdir(dir, { recursive: true })

  const ext = file.name.split('.').pop() || 'jpg'
  const hash = crypto.randomBytes(8).toString('hex')
  const filename = `${hash}.${ext}`
  const filepath = path.join(dir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return {
    url: `/uploads/${yearMonth}/${filename}`,
    filename,
  }
}
