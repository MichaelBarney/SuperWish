import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import type { TransportationDocument } from '~/types'

const MAX_FILE_SIZE_MB = 10
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

type FileType = 'pdf' | 'image' | 'other'

function getFileType(mimeType: string): FileType {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  return 'other'
}

export function useFileUpload() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo inválido. Aceitos: PDF, JPEG, PNG, WebP, GIF.'
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB.`
    }
    return null
  }

  async function uploadFile(
    file: File,
    basePath: string
  ): Promise<TransportationDocument | null> {
    const storage = nuxtApp.$storage
    if (!storage || !user.value) {
      error.value = 'Não autenticado ou storage indisponível'
      return null
    }

    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      return null
    }

    uploading.value = true
    progress.value = 0
    error.value = null

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `users/${user.value.uid}/${basePath}/${timestamp}_${safeName}`

      const fileRef = storageRef(storage, path)
      const uploadTask = uploadBytesResumable(fileRef, file, {
        contentType: file.type,
      })

      return await new Promise<TransportationDocument>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            progress.value = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            )
          },
          (err) => {
            error.value = 'Falha no upload. Tente novamente.'
            uploading.value = false
            reject(err)
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            uploading.value = false
            progress.value = 100
            resolve({
              id: crypto.randomUUID(),
              name: file.name,
              type: getFileType(file.type),
              url: downloadURL,
              uploadedAt: new Date(),
            })
          }
        )
      })
    } catch (err) {
      console.error('File upload error:', err)
      error.value = 'Falha no upload. Tente novamente.'
      uploading.value = false
      return null
    }
  }

  async function deleteFile(url: string): Promise<boolean> {
    const storage = nuxtApp.$storage
    if (!storage) {
      error.value = 'Storage indisponível'
      return false
    }

    try {
      const fileRef = storageRef(storage, url)
      await deleteObject(fileRef)
      return true
    } catch (err) {
      console.error('File delete error:', err)
      // If file doesn't exist, consider it a success
      return true
    }
  }

  return {
    uploadFile,
    deleteFile,
    uploading: readonly(uploading),
    progress: readonly(progress),
    error: readonly(error),
  }
}
