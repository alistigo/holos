interface CheckboxLeadingProps {
  elementId: string;
  metadata: Record<string, unknown>;
  onCommand: (name: string, payload: unknown) => void;
}

export function CheckboxLeading({ elementId, metadata, onCommand }: CheckboxLeadingProps) {
  const selected = metadata.selected === true;
  return (
    <input
      type="checkbox"
      checked={selected}
      onChange={(e) =>
        onCommand("checkListElement", {
          elementId,
          checked: e.target.checked,
        })
      }
      aria-label="Mark as done"
    />
  );
}
