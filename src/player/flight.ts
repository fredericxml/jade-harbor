/** Flight descent uses raw key input; physical crouch clearance is irrelevant to noclip. */
export function flightControls(pressedCrouch: boolean, pressedJump: boolean, flying: boolean, wasCrouching: boolean, obstructedStanding: boolean) {
  const crouching = !flying && (pressedCrouch || (wasCrouching && obstructedStanding));
  return { crouching, verticalIntent: flying ? Number(pressedJump) - Number(pressedCrouch) : 0 };
}

/** Spectator is noclip and cannot fall or take void damage. Other modes retain a floor. */
export function shouldVoidRespawn(mode: string, y: number, minY: number) {
  return mode !== "spectator" && y < minY - 4;
}
