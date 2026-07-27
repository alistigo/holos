import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import type { JSX, KeyboardEvent } from "react";
import { useState } from "react";
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

  function submit(): void {
    if (!canSubmit) return;
    onAdd(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label={_(msg`Add element`)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={_(msg`Add an element…`)}
      />
      <Button type="button" disabled={!canSubmit} onClick={submit}>
        <Trans>Add</Trans>
      </Button>
    </div>
  );
}
