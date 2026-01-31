import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'

const BUCKET_NAME = 'languagehub-ph-audio'
const REGION = process.env.AWS_REGION || 'ap-southeast-1'
const URL_EXPIRATION = 3600

const s3Client = new S3Client({
  region: REGION
})

async function generateUploadUrl(fileName, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: contentType
  })

  return getSignedUrl(s3Client, command, {
    expiresIn: URL_EXPIRATION
  })
}

async function generateDownloadUrl(fileName) {
  if (!fileName) return null

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName
  })

  return getSignedUrl(s3Client, command, {
    expiresIn: URL_EXPIRATION
  })
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

function generateS3Key(originalFileName) {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).slice(2)
  const extension = originalFileName.split('.').pop().toLowerCase()

  return `audio/${timestamp}-${randomString}.${extension}`
}

async function deleteAudioFile(fileName) {
  if (!fileName) return

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName
  })

  await s3Client.send(command)
}

s3Service = {
  generateUploadUrl,
  generateDownloadUrl,
  generateDownloadUrls,
  generateS3Key,
  deleteAudioFile
}

export default s3Service