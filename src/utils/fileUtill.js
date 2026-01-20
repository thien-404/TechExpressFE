import { makeDownloadUrl } from "../services/FileUploadService"; // nếu cần fallback từ key

export function parseFileRefs(fileJson) {
  if (!fileJson) return [];

  const mapOne = (f, i) => {
    const key = f.key ?? f.Key;
    const url = (f.url ?? f.Url) || (key ? makeDownloadUrl(key) : undefined);
    const name = f.name ?? f.Name ?? f.originalFileName ?? f.OriginalFileName ?? key ?? url;
    const size = f.size ?? f.Size ?? 0;
    const contentType = f.contentType ?? f.ContentType ?? undefined;
    const uploadedAtUtc = f.uploadedAtUtc ?? f.UploadedAtUtc ?? undefined;

    return {
      id: key || url || `srv-${i}`,
      url,
      storageKey: key,
      name,
      size,
      contentType,
      uploadedAtUtc,
      uploaded: true,
      uploading: false,
      isServer: true,
    };
  };

  // 1) BE trả array/object
  if (Array.isArray(fileJson)) {
    return fileJson
      .filter(f => f && (f.url || f.Url || f.key || f.Key))
      .map(mapOne);
  }

  // 2) JSON string
  try {
    const list = JSON.parse(fileJson);
    return (Array.isArray(list) ? list : [])
      .filter(f => f && (f.url || f.Url || f.key || f.Key))
      .map(mapOne);
  } catch {
    // 3) CSV fallback
    return String(fileJson)
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map((u, i) => ({
        id: `srv-${i}`,
        url: u,
        name: u,
        size: 0,
        uploaded: true,
        uploading: false,
        isServer: true,
      }));
  }
}



