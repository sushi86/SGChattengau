import { NextRequest } from 'next/server'
import { saveUploadedFile } from '@/lib/upload'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError, UnauthorizedError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw new ValidationError('Keine Datei hochgeladen')
    }

    const result = await saveUploadedFile(file)
    return apiSuccess(result, 201)
  } catch (err) {
    return apiError(err)
  }
}
