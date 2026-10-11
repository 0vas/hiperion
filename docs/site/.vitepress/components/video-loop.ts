/** Crossfade moving frames before EOF; never rewind the visible layer. */
type Player = Pick<
  HTMLVideoElement,
  'currentTime' | 'duration' | 'readyState' | 'play' | 'pause'
> & {
  style: Pick<CSSStyleDeclaration, 'opacity' | 'zIndex'>;
};
export function createVideoLoop(players: [Player, Player]) {
  let front: 0 | 1 = 0;
  let enabled = false;
  let blending = false;
  let overlap = 2;
  players[0].style.opacity = '1';
  players[0].style.zIndex = '1';
  players[1].style.opacity = '0';
  players[1].style.zIndex = '0';
  function play(player: Player) {
    void player
      .play()
      .catch(() => {
        // Leave the visible frame in place if autoplay or buffering fails.
      })
      .then(() => {
        if (!enabled) player.pause();
      });
  }
  return {
    reset() {
      enabled = false;
      blending = false;
      front = 0;
      players.forEach((player, index) => {
        player.pause();
        player.style.opacity = index === 0 ? '1' : '0';
        player.style.zIndex = index === 0 ? '1' : '0';
      });
    },
    setEnabled(value: boolean) {
      enabled = value;
      players.forEach((player, index) => {
        if (enabled && (index === front || blending)) play(player);
        else player.pause();
      });
    },
    tick() {
      if (!enabled) return;
      const outgoing = players[front];
      const incoming = players[front === 0 ? 1 : 0];
      if (!blending) {
        if (!Number.isFinite(outgoing.duration) || outgoing.duration <= 0)
          return;
        overlap = Math.min(2, outgoing.duration / 3);
        if (
          outgoing.currentTime < outgoing.duration - overlap ||
          incoming.readyState < 2
        )
          return;
        incoming.style.opacity = '0';
        incoming.style.zIndex = '2';
        incoming.currentTime = 0;
        blending = true;
        play(incoming);
      }
      // The incoming media clock freezes naturally when paused or buffering.
      const progress = Math.min(1, incoming.currentTime / overlap);
      incoming.style.opacity = String(progress * progress * (3 - 2 * progress));
      if (progress >= 1) {
        outgoing.style.opacity = '0';
        outgoing.style.zIndex = '0';
        outgoing.pause();
        incoming.style.zIndex = '1';
        front = front === 0 ? 1 : 0;
        blending = false;
      }
    },
  };
}
