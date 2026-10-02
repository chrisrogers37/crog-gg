import type { ReactNode } from "react";

type CountsProps = { items: { label: string; value: ReactNode }[] };

/**
 * Figures as label and value. .cl-counts shows the value first; screen readers
 * still hear "label: value".
 */
export function Counts({ items }: CountsProps) {
  return (
    <dl className="cl-counts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
