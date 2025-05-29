import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    city: string;
    isPremium: boolean;
    isVerified: boolean;
    minAge: string;
    maxAge: string;
    preferences: string[];
  };
  onFiltersChange: (filters: any) => void;
}

const HUMBOLDT_CITIES = [
  "All Cities",
  "Eureka", 
  "Arcata",
  "Fortuna",
  "McKinleyville",
  "Ferndale",
  "Blue Lake",
  "Trinidad",
  "Garberville",
  "Crescent City"
];

const PREFERENCES = [
  "Outdoor Activities",
  "Arts & Culture", 
  "Fitness & Health",
  "Coffee & Conversation",
  "Adventure Sports",
  "Music & Entertainment",
  "Food & Dining",
  "Photography",
  "Travel",
  "Reading",
  "Movies & TV",
  "Gaming",
  "Dancing",
  "Yoga & Meditation",
  "Beach Activities",
  "Hiking & Nature",
  "Wine Tasting",
  "Live Music",
  "Art Galleries",
  "Local Events"
];

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const handleCityChange = (city: string) => {
    onFiltersChange({
      ...filters,
      city: city === "All Cities" ? "" : city
    });
  };

  const handlePremiumChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      isPremium: checked
    });
  };

  const handleVerifiedChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      isVerified: checked
    });
  };

  const handleAgeChange = (field: 'minAge' | 'maxAge', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handlePreferenceChange = (preference: string, checked: boolean) => {
    const newPreferences = checked
      ? [...filters.preferences, preference]
      : filters.preferences.filter(p => p !== preference);
    
    onFiltersChange({
      ...filters,
      preferences: newPreferences
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      city: "",
      isPremium: false,
      isVerified: false,
      minAge: "",
      maxAge: "",
      preferences: []
    });
  };

  return (
    <Card className="filter-sidebar">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Filter */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Location</Label>
          <Select onValueChange={handleCityChange} value={filters.city || "All Cities"}>
            <SelectTrigger>
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {HUMBOLDT_CITIES.map((city) => (
                <SelectItem key={city} value={city === "All Cities" ? "All Cities" : city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Premium Filter */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="premium"
              checked={filters.isPremium}
              onCheckedChange={handlePremiumChange}
            />
            <Label htmlFor="premium" className="text-sm text-gray-700 flex items-center">
              Premium only
              <div className="ml-2">
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
            </Label>
          </div>
        </div>

        {/* Verified Filter */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.isVerified}
              onCheckedChange={handleVerifiedChange}
            />
            <Label htmlFor="verified" className="text-sm text-gray-700 flex items-center">
              Verified users only
              <div className="ml-2">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </Label>
          </div>
        </div>

        {/* Age Range */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Age Range</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minAge}
              onChange={(e) => handleAgeChange('minAge', e.target.value)}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxAge}
              onChange={(e) => handleAgeChange('maxAge', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="available" />
              <Label htmlFor="available" className="text-sm text-gray-700">Available Now</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="photos" />
              <Label htmlFor="photos" className="text-sm text-gray-700">Photos Required</Label>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Preferences</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {PREFERENCES.slice(0, 10).map((preference) => (
              <div key={preference} className="flex items-center space-x-2">
                <Checkbox
                  id={preference}
                  checked={filters.preferences.includes(preference)}
                  onCheckedChange={(checked) => handlePreferenceChange(preference, checked as boolean)}
                />
                <Label htmlFor={preference} className="text-sm text-gray-700">
                  {preference}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full text-secondary text-sm hover:text-gray-900 transition-colors"
        >
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
}
