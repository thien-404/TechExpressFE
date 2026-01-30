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
  if (!userId) return
  const avatarRef = ref(storage, `users/${userId}/avatar.jpg`)
  await deleteObject(avatarRef)
}
