import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'

const MAX_FILE_SIZE_MB = 2
const MAX_WIDTH_OR_HEIGHT = 1920
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function useImageUpload() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo inválido. Aceitos: JPEG, PNG, WebP, GIF.'
    }
    return null
  }

  async function compressIfNeeded(file: File): Promise<File> {
    if (file.size <= MAX_FILE_SIZE_MB * 1024 * 1024) {
      return file
    }
    return await imageCompression(file, {
      maxSizeMB: MAX_FILE_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      useWebWorker: true,
    })
  }

  async function uploadImage(file: File, basePath: string): Promise<string | null> {
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
      const processedFile = await compressIfNeeded(file)

      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `users/${user.value.uid}/${basePath}/${timestamp}_${safeName}`

      const fileRef = storageRef(storage, path)
      const uploadTask = uploadBytesResumable(fileRef, processedFile, {
        contentType: processedFile.type,
      })

      return await new Promise<string>((resolve, reject) => {
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
            resolve(downloadURL)
          }
        )
      })
    } catch (err) {
      console.error('Image upload error:', err)
      error.value = 'Falha no upload. Tente novamente.'
      uploading.value = false
      return null
    }
  }

  return {
    uploadImage,
    uploading: readonly(uploading),
    progress: readonly(progress),
    error: readonly(error),
  }
}
