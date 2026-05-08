import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type SuggestionApiField =
  | "complaint"
  | "accessories"
  | "physicalCondition";

export function useSuggestions(
  field: SuggestionApiField,
  deviceTypeId?: string,
) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current !== undefined) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({ field, q: query });
      if (deviceTypeId) params.append("deviceTypeId", deviceTypeId);

      const res = await fetch(`/api/suggestions?${params}`);
      const data = (await res.json()) as { suggestions?: string[] };

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, field, deviceTypeId]);

  const handleKeyDown = (
    e: KeyboardEvent,
    onSelect: (val: string) => void,
  ) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const picked = suggestions[selectedIndex];
      if (picked !== undefined) onSelect(picked);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (val: string, onSelect: (val: string) => void) => {
    onSelect(val);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return {
    query,
    setQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    handleKeyDown,
    selectSuggestion,
  };
}
