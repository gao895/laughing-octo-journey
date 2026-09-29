import type { MutableRefObject } from 'react';

/** Movement requested by the on-screen joystick: x = right, y = forward (both -1..1). */
export interface MoveInput {
  x: number;
  y: number;
}

export type MoveInputRef = MutableRefObject<MoveInput>;

/** Where the camera should glide to (e.g. to face a selected artwork in the editor). */
export interface CameraFocus {
  x: number;
  z: number;
  yaw: number;
  /** Changes every time a new focus is requested. */
  key: number;
}
