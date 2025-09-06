// ใช้เฉพาะ UI (ไม่มี logic ฝั่ง data)
export type Review = {
  id: string;
  gameId: string;
  title: string;
  rating: number;   // 0-5 (allowHalf)
  text: string;
  user: string;
  createdAt: string;
  updatedAt?: string;
};

export type Promotion = {
  id: string;
  title: string;
  description?: string;
  discountPercent: number; // 0-100
  startDate: string;       // ISO string
  endDate: string;         // ISO string
  active: boolean;
  imageUrl?: string;
  gameIds: string[];
};

export type GameLite = {
  id: string;
  title: string;
};
