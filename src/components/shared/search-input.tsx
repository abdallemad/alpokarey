"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Milliseconds to wait after typing stops before reporting the value. */
  debounceMs?: number;
  className?: string;
};

/**
 * Debounced search box.
 *
 * Keeps its own state so typing stays responsive, and only reports upward once
 * the user pauses — one request per pause instead of one per keystroke. An
 * external change to `value` (a cleared filter, a back navigation) resyncs the
 * field.
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder = "بحث…",
  debounceMs = 400,
  className,
}: SearchInputProps) {
  const [draft, setDraft] = React.useState(value);
  const onValueChangeRef = React.useRef(onValueChange);

  React.useEffect(() => {
    onValueChangeRef.current = onValueChange;
  });

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (draft === value) return;

    const timer = setTimeout(() => onValueChangeRef.current(draft), debounceMs);
    return () => clearTimeout(timer);
  }, [draft, value, debounceMs]);

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        className="ps-8 pe-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="مسح البحث"
          onClick={() => setDraft("")}
          className="absolute end-1.5 top-1/2 -translate-y-1/2"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
