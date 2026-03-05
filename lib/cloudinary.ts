import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'duh17omed',
  api_key: process.env.CLOUDINARY_API_KEY || '668241156937667',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Y85d6jHjIqTb0-i51F8WhozEQwg',
  secure: true
})

export async function uploadImage(file: Buffer, folder: string = 'vitapharm'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve(result.secure_url)
        } else {
          reject(new Error('Upload failed'))
        }
      }
    )
    
    uploadStream.end(file)
  })
}

export async function uploadImageFromBase64(base64Data: string, folder: string = 'vitapharm'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    })
    return result.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

export default cloudinary
