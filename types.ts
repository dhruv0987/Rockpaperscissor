export enum Move {
  Rock = 'Rock',
  Paper = 'Paper',
  Scissors = 'Scissors',
  None = 'None'
}

export enum GameState {
  Loading = 'LOADING',
  Registration = 'REGISTRATION',
  Idle = 'IDLE',
  Countdown = 'COUNTDOWN',
  Result = 'RESULT'
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}