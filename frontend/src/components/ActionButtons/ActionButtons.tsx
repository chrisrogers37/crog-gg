import { ActionButtonsProps } from '../../types';
import './ActionButtons.css';

/**
 * ActionButtons Component
 *
 * Renders the regeneration and reset buttons with fantasy theming.
 * - "SUMMON NEW LORE" triggers content regeneration via API
 * - "DISPEL ENCHANTMENT" resets content to original YAML data
 */
export function ActionButtons({
  onRegenerate,
  onReset,
  isRegenerating,
  hasModifiedContent,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button
        className="generate-btn"
        onClick={onRegenerate}
        disabled={isRegenerating}
      >
        {isRegenerating ? 'Weaving Epic Saga...' : 'SUMMON NEW LORE'}
      </button>

      {hasModifiedContent && (
        <button
          className="reset-btn"
          onClick={onReset}
          disabled={isRegenerating}
        >
          DISPEL ENCHANTMENT
        </button>
      )}
    </div>
  );
}
