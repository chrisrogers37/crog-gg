import { claudlobby } from "../../../content/claudlobby";
import { factoryStats } from "../../../content/factory";
import { formatDay } from "../../../utils/formatDate";
import { Counts } from "./Counts";

const { proof, factory } = claudlobby;

const mergedLast30Days = factory.apps.reduce(
  (total, app) => total + factoryStats.apps[app.slug].mergedLast30Days.value,
  0,
);

const ITEMS = [
  { label: proof.mergedLast30Days, value: mergedLast30Days.toLocaleString("en-US") },
  { label: proof.apps, value: factory.apps.length },
  { label: proof.tracker, value: `#${factoryStats.tracker.latestNumber}` },
];

/**
 * A few sourced, dated numbers directly under the hero (#176). Star counts are
 * never among them: at this size they read as "unused", not "early".
 */
export function ProofBar() {
  return (
    <section className="cl-proof" aria-label={proof.label}>
      <Counts items={ITEMS} />
      <p className="cl-source">
        {proof.source} As of {formatDay(factoryStats.asOf)}.
      </p>
    </section>
  );
}
