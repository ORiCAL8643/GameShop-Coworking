export interface Request {
      ID: number;
      reason: string;
      release_date: string;
      user_obj: { ID: number, username: string};
      game_obj: { ID: number, game_name: string};
  }