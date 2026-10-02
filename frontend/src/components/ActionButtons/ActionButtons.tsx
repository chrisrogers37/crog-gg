import site from "virtual:site-config";
import { useCooldown } from "../../hooks/useCooldown";
import "./ActionButtons.css";

type ActionButtonsProps = {
  onRegenerate: () => void;
  onReset: () => void;
  isRegenerating: boolean;
  hasModifiedContent: boolean;
};

/**
 * ActionButtons Component
 *
 * Renders the regeneration and reset buttons with fantasy theming
 * and a WoW-style cooldown sweep on the regenerate button.
 */
export function ActionButtons({
  onRegenerate,
  onReset,
  isRegenerating,
  hasModifiedContent,
}: ActionButtonsProps) {
  // Read here rather than passed in, so the countdown re-renders the button,
  // not the page (#196 M44). The daily cap holds until a reload, since the
  // server's window is a rolling 24 h and nothing reports when it frees up.
  const {
    remaining: cooldownRemaining,
    total: cooldownTotal,
    isOnCooldown,
    isReady,
    dailyCapReached,
  } = useCooldown();
  const isDisabled = isRegenerating || isOnCooldown || dailyCapReached;

  // Calculate sweep progress (1 = full cover, 0 = fully revealed)
  const sweepProgress =
    cooldownTotal > 0 ? cooldownRemaining / cooldownTotal : 0;
  const sweepDegrees = sweepProgress * 360;

  // The words are site.yaml's (#189); the API tells the rewrite to keep the
  // button's, since the About text's last line names it.
  const { labels } = site.regenerate;
  const buttonText = isRegenerating
    ? labels.busy
    : isOnCooldown
      ? ""
      : dailyCapReached
        ? "Daily limit reached"
        : labels.button;

  return (
    <div className="action-buttons">
      <div
        className={`cooldown-btn-wrapper ${isReady ? "cooldown-ready" : ""}`}
      >
        <button
          className={`generate-btn ${isOnCooldown ? "on-cooldown" : ""} ${isReady ? "ready-flash" : ""}`}
          onClick={onRegenerate}
          disabled={isDisabled}
          // Each button is named by the words on it, so a voice-control user
          // can say what they see; what it does is its description.
          aria-describedby="generate-btn-description"
        >
          <span className="btn-text">{buttonText}</span>

          {/* WoW-style cooldown overlay */}
          {isOnCooldown && !isRegenerating && (
            <div className="cooldown-overlay">
              <div
                className="cooldown-sweep"
                style={{
                  background: `conic-gradient(
                    rgba(0, 0, 0, 0.7) ${sweepDegrees}deg,
                    transparent ${sweepDegrees}deg
                  )`,
                }}
              />
              <span className="cooldown-number">{cooldownRemaining}</span>{" "}
              <span className="sr-only">seconds of cooldown left</span>
            </div>
          )}

          {/* Casting animation while regenerating */}
          {isRegenerating && (
            <div className="casting-overlay">
              <div className="casting-bar" />
            </div>
          )}
        </button>

        {/* Ready glow ring */}
        {isReady && <div className="ready-glow" />}
      </div>
      <span id="generate-btn-description" className="sr-only">
        Regenerates the text with AI
      </span>

      {hasModifiedContent && (
        <>
          <button
            className="reset-btn"
            onClick={onReset}
            disabled={isRegenerating}
            aria-describedby="reset-btn-description"
          >
            {labels.reset}
          </button>
          <span id="reset-btn-description" className="sr-only">
            Restores the original text
          </span>
        </>
      )}
    </div>
  );
}
