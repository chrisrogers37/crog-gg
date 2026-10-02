/**
 * Renders copy from content/claudlobby.ts, where code terms are wrapped in
 * backticks (`fleet.yaml`), with those terms as <code>.
 */
export function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text
        .split("`")
        .map((part, index) =>
          index % 2 === 1 ? <code key={index}>{part}</code> : part,
        )}
    </>
  );
}
