import { apiService } from "../config/axios";

function normalizeEnvelope(response) {
  const statusCode = response?.statusCode ?? response?.status;
  const succeeded = statusCode === 200 || statusCode === 201 || statusCode === 204;

  return {
    succeeded,
    statusCode,
    message: response?.message || "",
    value: response?.value,
  };
}

function normalizePagination(value) {
  return {
    items: value?.items || value?.data || value?.results || [],
    page: value?.page ?? value?.pageNumber ?? value?.currentPage ?? 1,
    pageSize: value?.pageSize ?? value?.size ?? 10,
    totalPages: value?.totalPages ?? value?.pageCount ?? 1,
    totalItems: value?.totalItems ?? value?.totalCount ?? value?.count ?? 0,
    averageRating: value?.averageRating ?? value?.avgRating ?? null,
    totalReviews: value?.totalReviews ?? value?.reviewCount ?? value?.totalItems ?? value?.totalCount ?? 0,
  };
}

function normalizeReview(review) {
  if (!review) return null;

  return {
    id: review.id ?? review.reviewId ?? review.reviewID ?? "",
    fullName: review.fullName ?? review.reviewerName ?? review.customerName ?? review.name ?? "Anonymous",
    comment: review.comment ?? review.content ?? review.reviewText ?? "",
    rating: Number(review.rating ?? review.star ?? review.stars ?? 0) || 0,
    mediaUrls: review.mediaUrls ?? review.images ?? review.imageUrls ?? [],
    createdAt: review.createdAt ?? review.createdDate ?? review.createdOn ?? review.creationTime ?? null,
    userId:
      review.userId ??
      review.customerId ??
      review.ownerId ??
      review.createdBy ??
      review.accountId ??
      null,
  };
}

export const REVIEW_SORT_BY = {
  CREATED_AT: 0,
  RATING: 1,
};

export const REVIEW_SORT_DIRECTION = {
  ASC: 0,
  DESC: 1,
};

export const reviewService = {
  async getProductReviews(productId, params = {}) {
    const response = await apiService.get(`/review/product/${productId}`, params);
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: normalizePagination(normalized.value),
    };
  },

  async createReview(productId, payload) {
    const response = await apiService.post(`/review/product/${productId}`, payload);
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: normalizeReview(normalized.value),
    };
  },

  async deleteReview(reviewId) {
    const response = await apiService.delete(`/review/${reviewId}`);
    return normalizeEnvelope(response);
  },

  normalizeReview,
  normalizePagination,
};
