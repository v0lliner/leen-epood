import React, { useState, useEffect } from 'react';
import { fetchOmnivaParcelMachines } from './ShippingService';

/**
 * Omniva parcel machine selector component
 * 
 * @param {Object} props
 * @param {string} props.country - Selected country code
 * @param {Object} props.selectedLocation - Currently selected location
 * @param {Function} props.onSelect - Selection handler function
 * @param {Object} props.error - Validation error
 */
const OmnivaPicker = ({ country, selectedLocation, onSelect, error }) => {
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Convert country to Omniva format
  const getOmnivaCountry = (country) => {
    const countryMap = {
      'estonia': 'ee',
      'latvia': 'lv',
      'lithuania': 'lt',
      'finland': 'fi'
    };
    return countryMap[country] || 'ee';
  };
  
  // Load parcel machines when country changes
  useEffect(() => {
    const loadParcelMachines = async () => {
      if (!country) return;
      
      setLoading(true);
      setFetchError('');
      
      try {
        const omnivaCountry = getOmnivaCountry(country);
        const machines = await fetchOmnivaParcelMachines(omnivaCountry);
        setParcelMachines(machines);
      } catch (err) {
        console.error('Failed to load parcel machines:', err);
        setFetchError('Pakiautomaatide laadimine ebaõnnestus');
      } finally {
        setLoading(false);
      }
    };
    
    loadParcelMachines();
  }, [country]);
  
  // Filter parcel machines by search term
  const filteredMachines = searchTerm
    ? parcelMachines.filter(machine => 
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : parcelMachines;
  
  return (
    <div className="omniva-picker">
      <div className="form-group">
        <label htmlFor="omnivaSearch">Otsi pakiautomaati</label>
        <input
          type="text"
          id="omnivaSearch"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          placeholder="Sisesta asukoht või pakiautomaadi nimi..."
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="omnivaLocation">Vali pakiautomaat *</label>
        
        {loading ? (
          <div className="loading-indicator">Laadin pakiautomaate...</div>
        ) : fetchError ? (
          <div className="error-message">{fetchError}</div>
        ) : filteredMachines.length === 0 ? (
          <div className="info-message">
            {searchTerm 
              ? 'Otsingule vastavaid pakiautomaate ei leitud' 
              : 'Sellest riigist ei leitud pakiautomaate'}
          </div>
        ) : (
          <select
            id="omnivaLocation"
            value={selectedLocation?.id || ''}
            onChange={(e) => {
              const selected = parcelMachines.find(machine => machine.id === e.target.value);
              onSelect(selected || null);
            }}
            className={`form-input ${error ? 'error' : ''}`}
          >
            <option value="">Vali pakiautomaat...</option>
            {filteredMachines.map(machine => (
              <option key={machine.id} value={machine.id}>
                {machine.name} - {machine.address}
              </option>
            ))}
          </select>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default OmnivaPicker;