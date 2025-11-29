import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

/**
 * Reusable Search Bar Component
 * Features: Real-time search with debounce, clear button
 */
export const SearchBar = ({ 
  placeholder = "Search...", 
  onSearch, 
  debounceMs = 500,
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

/**
 * Advanced Filter Component
 * Features: Multiple filter options (dropdowns, date pickers)
 */
export const AdvancedFilter = ({ 
  filters, 
  onFilterChange,
  onClear
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {filters.map((filter, index) => (
        <div key={index} className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">{filter.label}</label>
          {filter.component}
        </div>
      ))}
      <Button variant="outline" onClick={onClear} className="mb-0">
        Clear Filters
      </Button>
    </div>
  );
};
