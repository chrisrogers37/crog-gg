import { ActionButtonsProps } from "../../types";
import "./ActionButtons.css";

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
  cooldownRemaining,
  cooldownTotal,
  isReady,
}: ActionButtonsProps) {
  const isOnCooldown = cooldownRemaining > 0;
  const isDisabled = isRegenerating || isOnCooldown;

  // Calculate sweep progress (1 = full cover, 0 = fully revealed)
  const sweepProgress =
    cooldownTotal > 0 ? cooldownRemaining / cooldownTotal : 0;
  const sweepDegrees = sweepProgress * 360;

  const buttonText = isRegenerating
    ? "Weaving Epic Saga..."
    : isOnCooldown
      ? ""
      : "SUMMON NEW LORE";

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
            DISPEL ENCHANTMENT
          </button>
          <span id="reset-btn-description" className="sr-only">
            Restores the original text
          </span>
        </>
      )}
    </div>
  );
}
