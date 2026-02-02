import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { storage } from '../config/firebase'

/**
 * Upload avatar cho user (overwrite)
 */
export async function uploadUserAvatar({ file, userId }) {
  if (!file || !userId) throw new Error('Missing file or userId')

  const avatarRef = ref(storage, `users/${userId}/avatar.jpg`)

  await uploadBytes(avatarRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000'
  })

  return await getDownloadURL(avatarRef)
}

/**
 * Xóa avatar user
 */
export async function deleteUserAvatar(userId) {
  if (!userId) throw new Error('Missing userId')
  const avatarRef = ref(storage, `users/${userId}/avatar.jpg`)
  await deleteObject(avatarRef)
}

/* =========================
 * PRODUCT IMAGES
 * ========================= */

/**
 * Upload nhiều ảnh cho sản phẩm
 * @param {File[]} files - Mảng các file ảnh
 * @param {string} productId - ID sản phẩm
 * @returns {Promise<string[]>} - Mảng URLs của ảnh đã upload
 */
export async function uploadProductImages({ files, productId }) {
  if (!files || files.length === 0) throw new Error('No files provided')
  if (!productId) throw new Error('Missing productId')

  const uploadPromises = files.map(async (file, index) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error(`File ${file.name} is not an image`)
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File ${file.name} exceeds 5MB limit`)
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${index}.${extension}`
    
    const imageRef = ref(storage, `products/${productId}/images/${filename}`)

    await uploadBytes(imageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000'
    })

    return await getDownloadURL(imageRef)
  })

  return await Promise.all(uploadPromises)
}

/**
 * Xóa ảnh sản phẩm theo URL
 * @param {string} imageUrl - URL của ảnh cần xóa
 * @param {string} productId - ID sản phẩm
 */
export async function deleteProductImage({ imageUrl }) {
  if (!imageUrl) throw new Error("Missing imageUrl");

  try {
    // 🔥 Firebase tự parse path từ URL
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    // Nếu file không tồn tại thì coi như đã xoá
    if (error.code === "storage/object-not-found") {
      return;
    }
    throw error;
  }
}

/**
 * Xóa tất cả ảnh của sản phẩm
 * @param {string[]} imageUrls - Mảng URLs của ảnh
 * @param {string} productId - ID sản phẩm
 */
export async function deleteAllProductImages({ imageUrls, productId }) {
  if (!imageUrls || imageUrls.length === 0) return
  if (!productId) throw new Error('Missing productId')

  const deletePromises = imageUrls.map(url => 
    deleteProductImage({ imageUrl: url, productId })
  )

  await Promise.all(deletePromises)
}

/* =========================
 * VALIDATION HELPERS
 * ========================= */

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateImageFile(file) {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be JPG, PNG, or WebP' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  return { valid: true }
}

/**
 * Validate multiple image files
 * @param {File[]} files - Files to validate
 * @returns {Object} - { valid: boolean, errors?: string[] }
 */
export function validateImageFiles(files) {
  if (!files || files.length === 0) {
    return { valid: false, errors: ['No files provided'] }
  }

  const errors = []
  
  files.forEach((file, index) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`)
    }
  })

  return errors.length > 0 
    ? { valid: false, errors } 
    : { valid: true }
}
