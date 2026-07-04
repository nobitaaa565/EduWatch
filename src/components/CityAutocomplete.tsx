import React, { useState, useEffect, useRef } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPin, Loader2 } from "lucide-react";

interface CityAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "e.g. Dhaka, Bangladesh",
  className,
  types = ["(cities)"],
}: CityAutocompleteProps) {
  if (!hasKey) {
    return (
      <OsmAutocompleteInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly" solutionChannel="gmp_mcp_codeassist_v1_aistudio">
      <AutocompleteInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        types={types}
      />
    </APIProvider>
  );
}

// Google Places Autocomplete Input (Fallback when key exists)
function AutocompleteInput({
  value,
  onChange,
  placeholder,
  className,
  types,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  types: string[];
}) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const placesLib = useMapsLibrary("places");
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep internal input value in sync with prop when changed externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (placesLib) {
      setAutocompleteService(new placesLib.AutocompleteService());
    }
  }, [placesLib]);

  useEffect(() => {
    if (!autocompleteService || !inputValue.trim() || inputValue === value) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        {
          input: inputValue,
          types: types,
        },
        (results, status) => {
          setLoading(false);
          if (status === "OK" && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, autocompleteService, value, types]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPrediction = (prediction: any) => {
    const mainText = prediction.structured_formatting.main_text;
    const secondaryText = prediction.structured_formatting.secondary_text;
    const fullName = secondaryText ? `${mainText}, ${secondaryText}` : mainText;
    
    setInputValue(fullName);
    onChange(fullName);
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
            if (e.target.value === "") {
              onChange("");
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={`${className} pr-8`}
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-surface-container border border-outline-variant/15 rounded-xl shadow-lg divide-y divide-outline-variant/10 py-1 font-manrope">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-on-surface hover:bg-primary/5 transition-colors cursor-pointer text-left font-medium"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="font-bold block text-on-surface">
                  {prediction.structured_formatting.main_text}
                </span>
                {prediction.structured_formatting.secondary_text && (
                  <span className="text-[10px] text-secondary font-medium">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// OpenStreetMap (Nominatim) Autocomplete Input (Free, No API Key Required)
const STATIC_CITIES = [
  "Dhaka, Bangladesh",
  "Chittagong, Bangladesh",
  "Sylhet, Bangladesh",
  "Khulna, Bangladesh",
  "Rajshahi, Bangladesh",
  "Barisal, Bangladesh",
  "Rangpur, Bangladesh",
  "Mymensingh, Bangladesh",
  "Comilla, Bangladesh",
  "Narayanganj, Bangladesh",
  "Gazipur, Bangladesh",
  "New York, United States",
  "London, United Kingdom",
  "Tokyo, Japan",
  "Paris, France",
  "Berlin, Germany",
  "Brussels, Europe",
  "Madrid, Spain",
  "Sydney, Australia",
  "Toronto, Canada",
  "Singapore",
  "Mumbai, India",
  "Kolkata, India",
  "Delhi, India",
  "Dubai, United Arab Emirates",
  "Stamford, United Kingdom",
  "Oxford, United Kingdom",
  "Cambridge, United Kingdom",
  "San Francisco, United States",
  "Los Angeles, United States",
  "Chicago, United States",
  "Boston, United States",
  "Seattle, United States",
];

function getStaticLocationFallback(query: string) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  return STATIC_CITIES
    .filter(city => city.toLowerCase().includes(normalizedQuery))
    .slice(0, 5)
    .map((city, index) => ({
      display_name: city,
      place_id: `fallback-${index}-${city}`,
    }));
}

function OsmAutocompleteInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep internal input value in sync with prop when changed externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!inputValue.trim() || inputValue === value) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            inputValue
          )}&limit=5`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Osm fetch HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPredictions(data);
        } else {
          setPredictions(getStaticLocationFallback(inputValue));
        }
      } catch (error) {
        console.warn("OSM Location search failed, using local fallback:", error);
        setPredictions(getStaticLocationFallback(inputValue));
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, value]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPrediction = (prediction: any) => {
    const fullName = prediction.display_name;
    setInputValue(fullName);
    onChange(fullName);
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
            if (e.target.value === "") {
              onChange("");
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={`${className} pr-8`}
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-surface-container border border-outline-variant/15 rounded-xl shadow-lg divide-y divide-outline-variant/10 py-1 font-manrope">
          {predictions.map((prediction, index) => {
            const parts = prediction.display_name.split(",");
            const mainText = parts[0]?.trim() || "";
            const secondaryText = parts.slice(1).join(",").trim();

            return (
              <button
                key={prediction.place_id || index}
                type="button"
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-on-surface hover:bg-primary/5 transition-colors cursor-pointer text-left font-medium"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold block text-on-surface truncate">
                    {mainText}
                  </span>
                  {secondaryText && (
                    <span className="text-[10px] text-secondary font-medium block truncate">
                      {secondaryText}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
