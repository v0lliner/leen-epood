import { useState, useEffect } from 'react';
import { getOmnivaParcelMachines, searchParcelMachines, getUniqueCities } from '../utils/omnivaApi';

/**
 * Custom hook for managing Omniva parcel machines
 */
export function useOmniva(country = 'EE') {
  const [parcelMachines, setParcelMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Fetch parcel machines on mount
  useEffect(() => {
    async function fetchParcelMachines() {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching Omniva parcel machines from ${country}...`);
        const machines = await getOmnivaParcelMachines(country);
        console.log(`Received ${machines.length} parcel machines`);
        setParcelMachines(machines);
        setFilteredMachines(machines);
        
        const uniqueCities = getUniqueCities(machines);
        setCities(uniqueCities);
        
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch Omniva parcel machines:', err);
        setParcelMachines([]);
        setFilteredMachines([]);
      } finally {
        setLoading(false);
      }
    }

    fetchParcelMachines();
  }, [country]);

  // Filter machines based on search query and selected city
  useEffect(() => {
    let filtered = parcelMachines;

    // Filter by city if selected
    if (selectedCity) {
      filtered = filtered.filter(machine => machine.city === selectedCity);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = searchParcelMachines(filtered, searchQuery);
    }

    setFilteredMachines(filtered);
  }, [parcelMachines, searchQuery, selectedCity]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCityFilter = (city) => {
    setSelectedCity(city);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
  };

  return {
    parcelMachines: filteredMachines,
    allParcelMachines: parcelMachines,
    cities,
    loading,
    error,
    searchQuery,
    selectedCity,
    handleSearch,
    handleCityFilter,
    clearFilters,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-trigger the effect by changing a dependency
      setParcelMachines([]);
    }
  };
}