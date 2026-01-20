// services/TestUpload.js
import instance from '../config/axios'

function buildControllerUrl(controllerName, suffix = '') {
  if (!controllerName) throw new Error('controllerName is required')
  const c = String(controllerName).replace(/^\/+|\/+$/g, '')
  const s = String(suffix || '').replace(/^\/+/, '')
  return s ? `/${c}/${s}` : `/${c}`
}


export function makeDownloadUrl({ controllerName = 'User', key, filename }) {
  if (!key) throw new Error('key is required')
  const safeKey = String(key).split('/').map(encodeURIComponent).join('/')
  const fileName = encodeURIComponent(filename || key)
  // ✅ backend route: GET /api/User/download/{**key}
  return buildControllerUrl(controllerName, `download/${safeKey}`) + `?filename=${fileName}`
}

export async function reconcileUserFiles({ userId, keep, files, meta }, opts = {}) {
  const {
    controllerName = 'User',     // ✅ đúng controller: UserController
    keepField = 'keepJson',
    metaField = 'meta',
    filesField = 'files'
  } = opts

  if (!userId) throw new Error('userId is required')

  const fd = new FormData()
  fd.append(keepField, JSON.stringify(keep || []))
  if (meta != null) fd.append(metaField, JSON.stringify(meta))
  ;(files || []).forEach((f) => fd.append(filesField, f, f.name))

  console.group('[reconcileUserFiles] Payload preview')
  console.log('👤 userId:', userId)
  console.log('🧾 keepJson:', JSON.stringify(keep || []))
  console.log('📂 files:', (files || []).map((f) => f?.name))
  console.log('🪶 meta:', meta)
  console.groupEnd()

  // ✅ backend route: POST /api/User/{userId}
  const url = buildControllerUrl(controllerName, `${userId}/files`)
  const res = await instance.post(url, fd, { responseType: 'json' })
  return res.data
}

export async function reconcileProductFiles(
  { productId, keep, files, meta },
  opts = {}
) {
  const {
    controllerName = 'Product',   // ✅ ProductController
    keepField = 'keepJson',
    metaField = 'meta',
    filesField = 'files'
  } = opts

  if (!productId) throw new Error('productId is required')

  const fd = new FormData()
  fd.append(keepField, JSON.stringify(keep || []))
  if (meta != null) fd.append(metaField, JSON.stringify(meta))
  ;(files || []).forEach((f) => fd.append(filesField, f, f.name))

  console.group('[reconcileProductFiles] Payload preview')
  console.log('📦 productId:', productId)
  console.log('🧾 keepJson:', JSON.stringify(keep || []))
  console.log('📂 files:', (files || []).map((f) => f?.name))
  console.log('🪶 meta:', meta)
  console.groupEnd()

  // ✅ backend route: POST /api/Product/{productId}/files
  const url = buildControllerUrl(controllerName, `${productId}/files`)
  const res = await instance.post(url, fd, { responseType: 'json' })
  return res.data
}

// New function for ProductDetail files
export async function reconcileProductDetailFiles(
  { detailId, keep, files, meta },
  opts = {}
) {
  const {
    controllerName = 'ProductDetail',
    keepField = 'keepJson',
    metaField = 'meta',
    filesField = 'files'
  } = opts

  if (!detailId) throw new Error('detailId is required')

  const fd = new FormData()
  fd.append(keepField, JSON.stringify(keep || []))
  if (meta != null) fd.append(metaField, JSON.stringify(meta))
  ;(files || []).forEach((f) => fd.append(filesField, f, f.name))

  console.group('[reconcileProductDetailFiles] Payload preview')
  console.log('📦 detailId:', detailId)
  console.log('🧾 keepJson:', JSON.stringify(keep || []))
  console.log('📂 files:', (files || []).map((f) => f?.name))
  console.log('🪶 meta:', meta)
  console.groupEnd()

  // Backend route: POST /api/ProductDetail/{detailId}/files
  const url = buildControllerUrl(controllerName, `${detailId}/files`)
  const res = await instance.post(url, fd, { responseType: 'json' })
  return res.data
}

export async function reconcileCategoryFiles(
  { categoryId, keep, files, meta },
  opts = {}
) {
  const {
    controllerName = 'Category',
    keepField = 'keepJson',
    metaField = 'meta',
    filesField = 'files'
  } = opts

  if (!categoryId) throw new Error('categoryId is required')

  const fd = new FormData()
  fd.append(keepField, JSON.stringify(keep || []))
  if (meta != null) fd.append(metaField, JSON.stringify(meta))
  ;(files || []).forEach((f) => fd.append(filesField, f, f.name))

  console.group('[reconcileCategoryFiles] Payload preview')
  console.log('📦 categoryId:', categoryId)
  console.log('🧾 keepJson:', JSON.stringify(keep || []))
  console.log('📂 files:', (files || []).map((f) => f?.name))
  console.log('🪶 meta:', meta)
  console.groupEnd()

  // Backend route: POST /api/Category/{categoryId}/files
  const url = buildControllerUrl(controllerName, `${categoryId}/files`)
  const res = await instance.post(url, fd, { responseType: 'json' })
  return res.data
}

