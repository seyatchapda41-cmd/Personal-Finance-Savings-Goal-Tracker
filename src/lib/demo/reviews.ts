import { cookies } from "next/headers";
import type { ProjectReply, ProjectReview } from "@/lib/reviews";

const COOKIE = "tempora_reviews";
const MAX_REVIEWS = 80;

type Store = {
  reviews: Omit<ProjectReview, "replies">[];
  replies: ProjectReply[];
};

async function readStore(): Promise<Store> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return { reviews: [], replies: [] };
  try {
    const parsed = JSON.parse(raw) as Store;
    return {
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      replies: Array.isArray(parsed.replies) ? parsed.replies : [],
    };
  } catch {
    return { reviews: [], replies: [] };
  }
}

async function writeStore(next: Store) {
  const store = await cookies();
  store.set(
    COOKIE,
    JSON.stringify({
      reviews: next.reviews.slice(0, MAX_REVIEWS),
      replies: next.replies.slice(0, MAX_REVIEWS * 8),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    },
  );
}

export async function readDemoReviews() {
  return readStore();
}

export async function upsertDemoReview(review: Omit<ProjectReview, "replies">) {
  const store = await readStore();
  const rest = store.reviews.filter((row) => row.userId !== review.userId);
  await writeStore({ ...store, reviews: [review, ...rest] });
}

export async function deleteDemoReview(id: string, userId: string) {
  const store = await readStore();
  const review = store.reviews.find((row) => row.id === id);
  if (!review || review.userId !== userId) return false;
  await writeStore({
    reviews: store.reviews.filter((row) => row.id !== id),
    replies: store.replies.filter((row) => row.reviewId !== id),
  });
  return true;
}

export async function addDemoReply(reply: ProjectReply) {
  const store = await readStore();
  if (!store.reviews.some((row) => row.id === reply.reviewId)) return false;
  await writeStore({ ...store, replies: [...store.replies, reply] });
  return true;
}

export async function deleteDemoReply(id: string, userId: string) {
  const store = await readStore();
  const reply = store.replies.find((row) => row.id === id);
  if (!reply || reply.userId !== userId) return false;
  await writeStore({
    ...store,
    replies: store.replies.filter((row) => row.id !== id),
  });
  return true;
}

export async function adminDeleteDemoReview(id: string) {
  const store = await readStore();
  await writeStore({
    reviews: store.reviews.filter((row) => row.id !== id),
    replies: store.replies.filter((row) => row.reviewId !== id),
  });
}
