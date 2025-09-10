// src/interfaces/User.ts
export interface User {
  ID: number;
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday: string; // ISO date string
  role_id: number;
  // relations
  threads?: Thread[];
  comments?: Comment[];
  reactions?: Reaction[];
  attachments?: Attachment[];
  notifications?: Notification[];
  user_games?: UserGame[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday: string;
  //role_id: number;
}

export interface UpdateUserRequest {
  ID: number;
  username?: string;
  password?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  birthday?: string;
  role_id?: number;
}

// forward type references
import type { Thread } from "./Thread";
import type { Comment } from "./Comment";
import type { Reaction } from "./Reaction";
import type { Attachment } from "./Attachment";
import type { Notification } from "./Notification";
import type { UserGame } from "./UserGame";
