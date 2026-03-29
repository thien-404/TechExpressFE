import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "../config/firebase";

export const MAX_TICKET_ATTACHMENTS = 5;
export const MAX_TICKET_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const TICKET_ATTACHMENT_ACCEPT =
  "image/*,video/mp4,video/webm,video/quicktime,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar";

const ALLOWED_TICKET_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
]);

function sanitizeFileName(fileName) {
  return String(fileName || "tep-dinh-kem")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildTicketUploadPath(ownerKey, fileName) {
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `tickets/${ownerKey}/${uniqueId}-${sanitizeFileName(fileName)}`;
}

export function validateTicketAttachmentFile(file) {
  if (!file) {
    return { valid: false, error: "Không tìm thấy tệp đính kèm." };
  }

  if (!ALLOWED_TICKET_ATTACHMENT_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Tệp "${file.name}" không được hỗ trợ.`,
    };
  }

  if (file.size > MAX_TICKET_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: `Tệp "${file.name}" vượt quá 10MB.`,
    };
  }

  return { valid: true };
}

export async function uploadTicketAttachments({ files, ownerKey = "khach" }) {
  const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!normalizedFiles.length) {
    return [];
  }

  if (normalizedFiles.length > MAX_TICKET_ATTACHMENTS) {
    throw new Error(`Chỉ được đính kèm tối đa ${MAX_TICKET_ATTACHMENTS} tệp.`);
  }

  const uploadTasks = normalizedFiles.map(async (file) => {
    const validation = validateTicketAttachmentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const storageRef = ref(storage, buildTicketUploadPath(ownerKey, file.name));
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: "public,max-age=31536000",
    });

    return getDownloadURL(storageRef);
  });

  return Promise.all(uploadTasks);
}
