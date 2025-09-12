export type ThreadImage = {
  id: number;
  url: string;      // URL พร้อมแสดง (ต่อ BASE_URL มาแล้ว)
};

export type Thread = {
  id: number;
  title: string;
  content: string;
  author?: string;
  createdAt?: string;
  likeCount: number;
  commentCount: number;
  images: ThreadImage[];
};

export type ThreadComment = {
  id: number;
  content: string;
  userName?: string;
  createdAt?: string;
};
