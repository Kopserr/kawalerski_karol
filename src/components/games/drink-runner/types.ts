export type ObstacleVariant = "low" | "tall" | "fly";

export interface Obstacle {
  active: boolean;
  x: number;
  y: number; // top of hitbox (fixed — visual bob on "fly" never affects collision)
  hitW: number;
  hitH: number;
  variant: ObstacleVariant;
  bobPhase: number;
}

export interface Drink {
  active: boolean;
  x: number;
  y: number;
  bobPhase: number;
}

export type EngineStatus = "running" | "gameover" | "won";

export interface EngineSnapshot {
  status: EngineStatus;
  drinksCollected: number;
  speed: number;
}
