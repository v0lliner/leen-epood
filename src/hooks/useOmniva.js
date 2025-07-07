import { useState, useEffect } from 'react';
import { getOmnivaParcelMachines, searchParcelMachines, getUniqueCities } from '../utils/omnivaApi';

// Maximum number of retries for fetching parcel machines
const MAX_RETRIES = 3;

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
      let retryCount = 0;
      
      try {
        setLoading(true);
        setError(null);
        
        while (retryCount < MAX_RETRIES) {
          try {
            console.log(`Fetching Omniva parcel machines from ${country}... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            const machines = await getOmnivaParcelMachines(country);
            
            if (machines && Array.isArray(machines) && machines.length > 0) {
              console.log(`Successfully received ${machines.length} parcel machines`);
              setParcelMachines(machines);
              setFilteredMachines(machines);
              
              const uniqueCities = getUniqueCities(machines);
              setCities(uniqueCities);
              
              // Success - exit retry loop
              break;
            } else {
              console.warn(`Received empty or invalid machines array (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
              retryCount++;
              
              if (retryCount >= MAX_RETRIES) {
                throw new Error('Failed to load parcel machines after multiple attempts');
              }
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (attemptError) {
            console.error(`Attempt ${retryCount + 1}/${MAX_RETRIES} failed:`, attemptError);
            retryCount++;
            
            if (retryCount >= MAX_RETRIES) {
              throw attemptError;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
      } catch (err) {
        setError('Failed to load parcel machines');
        console.error('Error loading Omniva parcel machines:', err);
        setParcelMachines([]);
        setFilteredMachines([]);
        setCities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchParcelMachines();
  }, [country]);

  // Filter machines based on search query and selected city
  useEffect(() => {
    let filtered = parcelMachines;
    
    if (!Array.isArray(filtered) || filtered.length === 0) {
      setFilteredMachines([]);
      return;
    }

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
      // Force re-fetch with a new country parameter (same value)
      const currentCountry = country.toUpperCase();
      const tempCountry = currentCountry === 'EE' ? 'ee' : 'EE';
      setParcelMachines([]); // Clear current data
      
      // This will re-trigger the effect
      setTimeout(() => {
        getOmnivaParcelMachines(country)
          .then(machines => {
            setParcelMachines(machines);
            setFilteredMachines(machines);
            const uniqueCities = getUniqueCities(machines);
            setCities(uniqueCities);
            setLoading(false);
          })
          .catch(err => {
            setError('Failed to load parcel machines');
            console.error('Error reloading Omniva parcel machines:', err);
            setParcelMachines([]);
            setFilteredMachines([]);
            setCities([]);
            setLoading(false);
          });
      }, 100);
    }
  };
}