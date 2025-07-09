import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../utils/supabase/client';
import { maksekeskusConfigService } from '../../utils/supabase/maksekeskusConfig';
import { shippingSettingsService } from '../../utils/supabase/shippingSettings';

export default function PaymentSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Payment config state
  const [paymentConfig, setPaymentConfig] = useState({
    shop_id: '',
    api_secret_key: '',
    api_open_key: '',
    test_mode: true,
    active: true
  });

  // Shipping settings state
  const [omnivaShippingSettings, setOmnivaShippingSettings] = useState(null);
  const [omnivaShippingFormData, setOmnivaShippingFormData] = useState({
    price: '3.99',
    currency: 'EUR',
    active: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load payment config
      const paymentData = await maksekeskusConfigService.getConfig();
      if (paymentData) {
        setPaymentConfig(paymentData);
      }

      // Load shipping settings
      const shippingData = await shippingSettingsService.getOmnivaSettings();
      if (shippingData) {
        setOmnivaShippingSettings(shippingData);
        setOmnivaShippingFormData({
          price: shippingData.price.toString(),
          currency: shippingData.currency,
          active: shippingData.active
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfigChange = (field, value) => {
    setPaymentConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleShippingChange = (field, value) => {
    setOmnivaShippingFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const savePaymentConfig = async () => {
    try {
      setSaving(true);
      await maksekeskusConfigService.updateConfig(paymentConfig);
      setMessage('Payment configuration saved successfully');
    } catch (error) {
      console.error('Error saving payment config:', error);
      setMessage('Error saving payment configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveShippingSettings = async () => {
    try {
      setSaving(true);
      const price = parseFloat(omnivaShippingFormData.price);
      
      let result;
      if (omnivaShippingSettings) {
        result = await shippingSettingsService.updateOmnivaSettings(
          omnivaShippingSettings.id,
          {
            price,
            currency: omnivaShippingFormData.currency,
            active: omnivaShippingFormData.active
          }
        );
      } else {
        result = await shippingSettingsService.createOmnivaSettings({
          price,
          currency: omnivaShippingFormData.currency,
          active: omnivaShippingFormData.active
        });
      }
      
      setOmnivaShippingSettings(result);
      setMessage('Shipping settings saved successfully');
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      setMessage('Error saving shipping settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Payment & Shipping Settings</h1>
      
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Payment Configuration */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Maksekeskus Payment Configuration</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop ID
            </label>
            <input
              type="text"
              value={paymentConfig.shop_id}
              onChange={(e) => handlePaymentConfigChange('shop_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret Key
            </label>
            <input
              type="password"
              value={paymentConfig.api_secret_key}
              onChange={(e) => handlePaymentConfigChange('api_secret_key', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Open Key
            </label>
            <input
              type="text"
              value={paymentConfig.api_open_key}
              onChange={(e) => handlePaymentConfigChange('api_open_key', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={paymentConfig.test_mode}
                onChange={(e) => handlePaymentConfigChange('test_mode', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Test Mode</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={paymentConfig.active}
                onChange={(e) => handlePaymentConfigChange('active', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
          
          <button
            onClick={savePaymentConfig}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Payment Configuration'}
          </button>
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Omniva Shipping Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Price
            </label>
            <input
              type="number"
              step="0.01"
              value={omnivaShippingFormData.price}
              onChange={(e) => handleShippingChange('price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={omnivaShippingFormData.currency}
              onChange={(e) => handleShippingChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={omnivaShippingFormData.active}
              onChange={(e) => handleShippingChange('active', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
          
          <button
            onClick={saveShippingSettings}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Shipping Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}