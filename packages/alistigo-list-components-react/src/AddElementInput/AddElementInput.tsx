import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { type FormEvent, type JSX, useState } from "react";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";

export interface AddElementInputProps {
  onAdd: (text: string) => void;
  disabled?: boolean;
}

export function AddElementInput({ onAdd, disabled = false }: AddElementInputProps): JSX.Element {
  const { _ } = useLingui();
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const canSubmit = !disabled && trimmed.length > 0;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) return;
    onAdd(trimmed);
    setText("");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        aria-label={_(msg`Add element`)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={_(msg`Add an element…`)}
      />
      <Button type="submit" disabled={!canSubmit}>
        <Trans>Add</Trans>
      </Button>
    </form>
  );
}
