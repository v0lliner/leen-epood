// file: src/hooks/useOmniva.js
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
        
        console.log(`useOmniva: Starting initial fetch for ${country}...`);
        const machines = await getOmnivaParcelMachines(country); // This calls the omnivaApi.js function

        console.log('useOmniva: Raw machines received from getOmnivaParcelMachines:', machines);

        if (machines && Array.isArray(machines) && machines.length > 0) {
          console.log(`useOmniva: Data is valid. Setting ${machines.length} parcel machines.`);
          setParcelMachines(machines);
          setFilteredMachines(machines); // Initialize filtered with all machines

          const uniqueCities = getUniqueCities(machines);
          console.log('useOmniva: Unique cities generated:', uniqueCities);
          setCities(uniqueCities);
          
          console.log('useOmniva: All state updates initiated successfully in initial fetch.');
        } else {
          console.warn('useOmniva: Received empty or invalid machines array from getOmnivaParcelMachines.');
          setError('No parcel machines found or invalid data received.');
          setParcelMachines([]);
          setFilteredMachines([]);
          setCities([]);
        }
        
      } catch (err) {
        setError('Failed to load parcel machines');
        console.error('useOmniva: Error caught during fetchParcelMachines:', err);
        setParcelMachines([]);
        setFilteredMachines([]);
        setCities([]);
      } finally {
        console.log('useOmniva: fetchParcelMachines finally block executed. Setting loading to false.');
        setLoading(false);
      }
    }

    fetchParcelMachines();
  }, [country]);

  // Filter machines based on search query and selected city
  useEffect(() => {
    console.log('useOmniva: Filtering effect triggered.');
    let filtered = parcelMachines; // This `parcelMachines` is the state from the previous useEffect
    
    if (!Array.isArray(filtered) || filtered.length === 0) {
      console.log('useOmniva: No machines to filter or invalid array.');
      setFilteredMachines([]);
      return;
    }

    // Filter by city if selected
    if (selectedCity) {
      console.log('useOmniva: Filtering by city:', selectedCity);
      filtered = filtered.filter(machine => machine.city === selectedCity);
    }

    // Filter by search query
    if (searchQuery) {
      console.log('useOmniva: Filtering by search query:', searchQuery);
      filtered = searchParcelMachines(filtered, searchQuery);
    }

    console.log(`useOmniva: Filtered machines count: ${filtered.length}`);
    setFilteredMachines(filtered);
  }, [parcelMachines, searchQuery, selectedCity]); // Dependencies for this effect

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
    parcelMachines: filteredMachines, // This is the value consumed by Checkout.jsx
    allParcelMachines: parcelMachines, // Keep this for debugging if needed
    cities,
    loading,
    error,
    searchQuery,
    selectedCity,
    handleSearch,
    handleCityFilter,
    clearFilters,
    refetch: () => {
      // Simplified refetch for debugging
      setLoading(true);
      setError(null);
      setParcelMachines([]); // Clear current data to force re-render and re-fetch
      
      async function reFetchData() {
        try {
          console.log('useOmniva: Refetching data...');
          const machines = await getOmnivaParcelMachines(country);
          setParcelMachines(machines);
          setFilteredMachines(machines);
          setCities(getUniqueCities(machines));
          console.log('useOmniva: Refetch completed successfully.');
        } catch (err) {
          setError('Failed to load parcel machines');
          console.error('useOmniva: Error during refetch:', err);
        } finally {
          setLoading(false);
        }
      }
      reFetchData();
    }
  };
}