import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../../config/queryClient";
import { toast } from "sonner";
import { FiImage, FiUpload, FiTrash2 } from "react-icons/fi";

import { apiService } from "../../../../config/axios";
import {
  uploadProductImages,
  deleteProductImage,
  validateImageFiles,
} from "../../../../utils/uploadImage";

/* =========================
 * PRODUCT IMAGES TAB
 * ========================= */
export default function ProductImagesTab({ product }) {
  const [uploading, setUploading] = useState(false);

  if (!product) return null;

  const productId = product.id;
  const images = product.thumbnailUrl || [];

  /* =========================
   * IMAGE UPLOAD MUTATION
   * ========================= */
  const uploadImagesMutation = useMutation({
    mutationFn: async (files) => {
      // 1. Upload to Firebase
      const uploadedUrls = await uploadProductImages({
        files,
        productId,
      });

      // 2. Update product images in backend
      const currentImages = product.thumbnailUrl || [];
      const newImages = [...currentImages, ...uploadedUrls];

      const res = await apiService.put("/product/images", {
        productId,
        images: newImages,
      });

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Cập nhật ảnh thất bại");
      }

      return uploadedUrls;
    },
    onSuccess: async () => {
      toast.success("Thêm ảnh thành công");
      await queryClient.refetchQueries({
        queryKey: ["product-detail", productId],
      });
    },
    onError: (err) => {
      toast.error(err?.message || "Upload ảnh thất bại");
    },
  });

  /* =========================
   * DELETE IMAGE MUTATION
   * ========================= */
  const deleteImageMutation = useMutation({
    mutationFn: async (imageUrl) => {
      // 1. Delete from Firebase
      await deleteProductImage({ imageUrl });

      // 2. Update product images in backend
      const currentImages = product.thumbnailUrl || [];
      const newImages = currentImages.filter((url) => url !== imageUrl);

      const res = await apiService.put("/product/images", {
        productId,
        images: newImages,
      });

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Cập nhật ảnh thất bại");
      }
    },
    onSuccess: () => {
      toast.success("Đã xóa ảnh");
      queryClient.invalidateQueries({
        queryKey: ["product-detail", productId],
      });
    },
    onError: (err) => {
      toast.error(err?.message || "Xóa ảnh thất bại");
    },
  });

  /* =========================
   * HANDLERS
   * ========================= */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate
    const validation = validateImageFiles(files);
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setUploading(true);
    try {
      await uploadImagesMutation.mutateAsync(files);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteImage = (imageUrl) => {
    if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    deleteImageMutation.mutate(imageUrl);
  };

  const isImageProcessing =
    uploading ||
    uploadImagesMutation.isPending ||
    deleteImageMutation.isPending;

  /* =========================
   * RENDER
   * ========================= */
  return (
    <div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiImage size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">
                Hình ảnh sản phẩm
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {images.length} hình ảnh
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Upload Area */}
          <div>
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageUpload}
                disabled={isImageProcessing}
                className="hidden"
              />
              <div
                className={`w-full h-24 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
                  isImageProcessing
                    ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                    : "border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 cursor-pointer"
                }`}
              >
                <FiUpload
                  size={24}
                  className={
                    isImageProcessing ? "text-slate-400" : "text-slate-500"
                  }
                />
                <span className="text-sm text-slate-600 font-medium">
                  {isImageProcessing
                    ? "Đang xử lý..."
                    : "Click để thêm hình ảnh"}
                </span>
                <span className="text-xs text-slate-500">
                  JPG, PNG, WebP · Tối đa 5MB mỗi ảnh
                </span>
              </div>
            </label>
          </div>

          {/* Image Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-lg border-2 border-slate-200 overflow-hidden hover:border-blue-400 transition-all"
                >
                  {/* IMAGE */}
                  <img
                    src={url}
                    alt={`${product.name} - ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* OVERLAY (chỉ để hiệu ứng, KHÔNG che ảnh) */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition pointer-events-none" />

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(url)}
                    disabled={isImageProcessing}
                    className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      <FiTrash2 size={18} />
                    </div>
                  </button>

                  {/* INDEX BADGE */}
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <FiImage size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                Chưa có hình ảnh sản phẩm
              </h3>
              <p className="text-xs text-slate-500">
                Click vào khu vực phía trên để thêm hình ảnh
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
