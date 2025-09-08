export type ThreadComment = {
  id: number;
  author: string;
  content: string;
  datetime: string;         // เช่น "3 ชม.ที่แล้ว" หรือ ISO ก็ได้
  children?: ThreadComment[];
};

// src/pages/Community/types.ts
export type Thread = {
  id: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  likes: number;
  commentCount: number;
  comments?: ThreadComment[];
  images?: string[];           // ✅ แนบรูปในเธรด
};

export type CreateThreadPayload = { title: string; body: string };
export type CreateReplyPayload  = { parentId?: number; content: string };
