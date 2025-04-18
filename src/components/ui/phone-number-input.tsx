/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useId, useState } from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { PhoneIcon } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_CODES } from "@/constants/country-codes";

// Common countries with their codes for reference
const COUNTRIES: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  SG: "Singapore",
  DE: "Germany",
  FR: "France",
};

export interface PhoneNumberInputProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  country: string;
  onCountryChange: (value: string) => void;
}

export default function PhoneNumberInput({
  id: externalId,
  label = "Phone number",
  value: externalValue,
  onChange: externalOnChange,
  placeholder = "Enter phone number",
  className,
  required = false,
  disabled = false,
  error,
  country,
  onCountryChange,
}: PhoneNumberInputProps) {
  const internalId = useId();
  const id = externalId || internalId;
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue !== undefined ? externalValue : internalValue;

  const handleChange = (newValue: string | undefined) => {
    const finalValue = newValue ?? "";
    if (externalOnChange) {
      externalOnChange(finalValue);
    } else {
      setInternalValue(finalValue);
    }
  };

  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-2 w-full", className)}
    >
      {label && (
        <Label
          htmlFor={id}
          className={cn(
            required &&
              "after:content-['*'] after:ml-0.5 after:text-destructive",
            error && "text-destructive"
          )}
        >
          {label}
        </Label>
      )}

      <div className="flex items-stretch gap-0 w-full max-w-full">
        <div className="flex-shrink-0">
          <CountrySelect
            value={country}
            onChange={handleCountryChange}
            disabled={disabled}
          />
        </div>
        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          className="rounded-s-none focus-visible:z-10 shadow-none border-l-0"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </motion.div>
  );
}

type CountrySelectProps = {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const CountrySelect = ({ disabled, value, onChange }: CountrySelectProps) => {
  // List of common countries to show at the top
  const topCountries = ["IN", "US", "GB", "CA", "AU"];

  // All available countries
  const allCountries = Object.keys(COUNTRIES).map((code) => ({
    value: code,
    label: COUNTRIES[code],
    code: COUNTRY_CODES[code] || "",
  }));

  return (
    <Select
      disabled={disabled}
      value={value}
      onValueChange={(val: string) => {
        if (val) {
          onChange(val);
        }
      }}
    >
      <SelectTrigger
        className={cn(
          "w-20 border-r-0 rounded-e-none !h-10 pl-3 pr-1",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-1">
          <FlagComponent country={value} countryName={COUNTRIES[value] || ""} />
          <span className="text-xs">+{COUNTRY_CODES[value] || ""}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* Top countries first */}
        {topCountries.map((code) => (
          <SelectItem key={`top-${code}`} value={code}>
            <div className="flex items-center gap-2">
              <FlagComponent
                country={code}
                countryName={COUNTRIES[code] || ""}
              />
              <span>
                {COUNTRIES[code]}{" "}
                <span className="text-xs text-gray-500">
                  +{COUNTRY_CODES[code] || ""}
                </span>
              </span>
            </div>
          </SelectItem>
        ))}

        <div className="py-2 px-2">
          <div className="h-px bg-gray-200"></div>
        </div>

        {/* All other countries */}
        {allCountries
          .filter((country) => !topCountries.includes(country.value))
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((country) => (
            <SelectItem key={country.value} value={country.value}>
              <div className="flex items-center gap-2">
                <FlagComponent
                  country={country.value}
                  countryName={country.label}
                />
                <span>
                  {country.label}{" "}
                  <span className="text-xs text-gray-500">+{country.code}</span>
                </span>
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

const FlagComponent = ({
  country,
  countryName,
}: {
  country: string;
  countryName: string;
}) => {
  const Flag =
    country && country in flags ? flags[country as keyof typeof flags] : null;
  return (
    <span className="w-5 h-5 overflow-hidden rounded-sm flex items-center justify-center">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <PhoneIcon size={16} aria-hidden="true" />
      )}
    </span>
  );
};
