"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Field primitives shared by every form in the app.
 *
 * Each one owns its label / control / error-message triple so a form file reads
 * as a list of fields rather than a wall of divs, and so error styling is
 * applied identically everywhere.
 */

type BaseFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  error,
  hint,
  required,
  className,
  ...props
}: BaseFieldProps & React.ComponentProps<typeof Input>) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Input id={id} aria-invalid={Boolean(error)} {...props} />
    </FieldShell>
  );
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  required,
  className,
  ...props
}: BaseFieldProps & React.ComponentProps<typeof Textarea>) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Textarea id={id} aria-invalid={Boolean(error)} {...props} />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  required,
  className,
  value,
  onValueChange,
  options,
  placeholder,
}: BaseFieldProps & {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  // Base UI renders the selected item's label in the trigger when it is given
  // the value→label map, so the trigger never shows a raw enum value.
  const items = React.useMemo(
    () => Object.fromEntries(options.map((o) => [o.value, o.label])),
    [options],
  );

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Select
        items={items}
        value={value}
        onValueChange={(next) => onValueChange(next as string)}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}>
          <SelectValue placeholder={placeholder ?? "اختر…"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function SwitchField({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border border-border p-3",
        className,
      )}
    >
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next)}
      />
    </div>
  );
}

/** Form-level error banner — for failures that belong to no single field. */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
