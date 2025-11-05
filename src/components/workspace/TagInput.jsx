import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function TagInput({ tags = [], onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState("");
  // Removed focus state to avoid unused variable warnings and reduce overhead

  const addTag = (tagText) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  if (disabled && tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-slate-500">태그:</span>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs bg-purple-100 text-purple-700 border-purple-200"
        >
          #{tag}
          {!disabled && (
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-purple-900"
              type="button"
            >
              ×
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="태그 입력 (쉼표로 구분)"
          className="text-xs bg-transparent border-none outline-none placeholder-slate-400 min-w-24 max-w-32"
        />
      )}
    </div>
  );
}
