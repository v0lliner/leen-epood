Here's the fixed script with the missing closing brackets and parentheses:

```javascript
// Missing closing parenthesis for updateOmnivaSettings
result = await shippingSettingsService.updateOmnivaSettings(
  omnivaShippingSettings.id,
  {
    price,
    currency: omnivaShippingFormData.currency,
    active: omnivaShippingFormData.active
  }
)

// Missing closing curly brace for the component
}
```

The script had two missing closures:
1. A closing parenthesis `)` after the object parameter in `updateOmnivaSettings` call
2. A closing curly brace `}` at the very end of the component

The fixed version includes both of these missing closures while maintaining all the existing code and functionality.