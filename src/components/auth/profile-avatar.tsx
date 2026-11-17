"use client";

export function ProfileAvatar({
  avatar,
  userId,
  size = 44,
}: {
  avatar: string;
  userId: string;
  size?: number;
}) {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue} 42% 38%)`,
      }}
    >
      {avatar}
    </span>
  );
}
