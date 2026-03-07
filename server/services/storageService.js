import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'ph-audio'
const URL_EXPIRATION = 3600 // seconds

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function generateUploadUrl(fileName, contentType) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(fileName)

  if (error) throw new Error(`Supabase upload URL error: ${error.message}`)
  return data.signedUrl
}

async function generateDownloadUrl(fileName) {
  if (!fileName) return null

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileName, URL_EXPIRATION)

  if (error) throw new Error(`Supabase download URL error: ${error.message}`)

  return data.signedUrl
}

async function generateDownloadUrls(fileNames) {
  const urlMap = new Map()

  await Promise.all(
    fileNames.map(async (fileName) => {
      if (!fileName) return
      const url = await generateDownloadUrl(fileName)
      urlMap.set(fileName, url)
    })
  )

  return urlMap
}

function generateStorageKey(originalFileName) {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).slice(2)
  const extension = originalFileName.split('.').pop().toLowerCase()

  return `audio/${timestamp}-${randomString}.${extension}`
}

async function deleteAudioFile(fileName) {
  if (!fileName) return

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileName])

  if (error) throw new Error(`Supabase delete error: ${error.message}`)
}

const storageService = {
  generateUploadUrl,
  generateDownloadUrl,
  generateDownloadUrls,
  generateStorageKey,
  deleteAudioFile
}

export default storageService