// src/utils/fileType.js
const EXT_GROUPS = {
  image: ["png","jpg","jpeg","webp","bmp","svg","heic","heif"],
  gif:   ["gif"],
  video: ["mp4","webm","mov","m4v","ogg","ogv","avi","mkv"],
  pdf:   ["pdf"],
};

function pickByExt(ext) {
  const e = (ext || "").toLowerCase();
  if (EXT_GROUPS.gif.includes(e))   return "gif";
  if (EXT_GROUPS.image.includes(e)) return "image";
  if (EXT_GROUPS.video.includes(e)) return "video";
  if (EXT_GROUPS.pdf.includes(e))   return "pdf";
  return "file";
}

function extFromNameOrUrl(name, url) {
  const from = (name || url || "").split("?")[0].split("#")[0];
  const m = from.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1] : "";
}

/**
 * Trả về: "image" | "gif" | "video" | "pdf" | "file"
 * Ưu tiên contentType nếu bạn muốn truyền vào (optional).
 */
export function getFileType({ name, url, contentType } = {}) {
  // 1) đoán theo content-type nếu có
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.startsWith("image/gif")) return "gif";
    if (ct.startsWith("image/"))    return "image";
    if (ct.startsWith("video/"))    return "video";
    if (ct === "application/pdf")   return "pdf";
  }
  // 2) fallback theo đuôi file
  const ext = extFromNameOrUrl(name, url);
  return pickByExt(ext);
}
