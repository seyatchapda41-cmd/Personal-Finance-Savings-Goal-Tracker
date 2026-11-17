export const REVIEW_MAX_STARS = 5;
export const REVIEW_BODY_MAX = 1500;
export const REPLY_BODY_MAX = 800;

export const STAR_LABELS = [
  "",
  "Poor",
  "Fair",
  "Good",
  "Very good",
  "Excellent",
] as const;

export type ProjectReply = {
  id: string;
  reviewId: string;
  userId: string;
  authorLabel: string;
  body: string;
  createdAt: string;
};

export type ProjectReview = {
  id: string;
  userId: string;
  rating: number;
  body: string;
  authorLabel: string;
  createdAt: string;
  updatedAt: string;
  replies: ProjectReply[];
};

export type ReviewSummary = {
  count: number;
  average: number;
  buckets: [number, number, number, number, number];
};

export function summarizeReviews(
  reviews: Pick<ProjectReview, "rating">[],
): ReviewSummary {
  const buckets: ReviewSummary["buckets"] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const review of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(review.rating)));
    buckets[star - 1] += 1;
    sum += star;
  }
  const count = reviews.length;
  return {
    count,
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    buckets,
  };
}

export function validateReview(rating: number, body: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > REVIEW_MAX_STARS) {
    return "Choose a rating from 1 to 5 stars.";
  }
  if (body.length > REVIEW_BODY_MAX) {
    return `Keep your impression under ${REVIEW_BODY_MAX} characters.`;
  }
  return null;
}

export function validateReply(body: string) {
  const text = body.trim();
  if (text.length < 2) return "Write a short reply.";
  if (text.length > REPLY_BODY_MAX) {
    return `Keep replies under ${REPLY_BODY_MAX} characters.`;
  }
  return null;
}

export function nestReplies(
  reviews: Omit<ProjectReview, "replies">[],
  replies: ProjectReply[],
): ProjectReview[] {
  const byReview = new Map<string, ProjectReply[]>();
  for (const reply of replies) {
    const list = byReview.get(reply.reviewId) ?? [];
    list.push(reply);
    byReview.set(reply.reviewId, list);
  }
  return reviews
    .map((review) => ({
      ...review,
      replies: (byReview.get(review.id) ?? []).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
