"use client";

import { useState } from "react";

type Base = {
  label: string;
  name: string;
  hint?: React.ReactNode;
  secret?: boolean;
  className?: string;
  emptyText?: string;
};

export function VisibleField({
  label,
  name,
  hint,
  secret,
  className,
  emptyText = "Nothing entered yet",
  as = "input",
  type,
  value,
  defaultValue,
  onChange,
  children,
  ...rest
}: Base & {
  as?: "input" | "textarea" | "select";
  type?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  children?: React.ReactNode;
} & Omit<
    React.InputHTMLAttributes<HTMLInputElement> &
      React.TextareaHTMLAttributes<HTMLTextAreaElement> &
      React.SelectHTMLAttributes<HTMLSelectElement>,
    "className" | "type" | "value" | "defaultValue" | "onChange" | "name"
  >) {
  const isSecret = Boolean(secret || type === "password");
  const [show, setShow] = useState(!isSecret);
  const [draft, setDraft] = useState(() => String(value ?? defaultValue ?? ""));
  const current = value !== undefined ? String(value) : draft;
  const hidden = isSecret && !show;

  let echo = emptyText;
  if (current.trim()) {
    echo = hidden
      ? `${current.length} character${current.length === 1 ? "" : "s"} hidden — tap Show to read them`
      : current;
  }

  const shared = {
    name,
    value,
    defaultValue: value === undefined ? defaultValue : undefined,
    ...rest,
  };

  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {isSecret ? (
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-azure"
            onClick={() => setShow((open) => !open)}
          >
            {show ? "Hide" : "Show"}
          </button>
        ) : null}
      </span>
      {as === "textarea" ? (
        <textarea
          {...shared}
          className="input mt-1 min-h-28"
          onChange={(event) => {
            setDraft(event.target.value);
            onChange?.(event);
          }}
        />
      ) : as === "select" ? (
        <select
          {...shared}
          className="input mt-1"
          onChange={(event) => {
            const picked =
              event.target.selectedOptions[0]?.text ?? event.target.value;
            setDraft(picked);
            onChange?.(event);
          }}
        >
          {children}
        </select>
      ) : (
        <input
          {...shared}
          className="input mt-1"
          type={isSecret ? (show ? "text" : "password") : type}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange?.(event);
          }}
        />
      )}
      <span className="mt-1 block text-xs">
        <span className="text-mute">You entered: </span>
        <span className="break-all font-medium text-ink">{echo}</span>
      </span>
      {hint ? <span className="mt-1 block text-xs text-mute">{hint}</span> : null}
    </label>
  );
}
