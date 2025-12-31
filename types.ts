export enum Move {
  Rock = 'Rock',
  Paper = 'Paper',
  Scissors = 'Scissors',
  None = 'None'
}

export enum GameState {
  Loading = 'LOADING',
  Idle = 'IDLE',
  Countdown = 'COUNTDOWN',
  Result = 'RESULT'
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
