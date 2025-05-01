// Updated Property Detail Pipedream Code
export default defineComponent({
  async run({ steps, $ }) {
    try {
      console.log("Property Detail request received:", new Date().toISOString());
      
      // Debug: Log available event structures to understand the environment
      console.log("Event structure:", JSON.stringify({
        eventKeys: Object.keys($.event || {}),
        hasTrigger: !!steps.trigger,
        triggerKeys: steps.trigger ? Object.keys(steps.trigger) : [],
        hasParams: !!($.event && $.event.params),
        paramsKeys: ($.event && $.event.params) ? Object.keys($.event.params) : []
      }));
      
      // Set response headers for CORS
      const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      };
      
      // Try multiple possible locations for query parameters
      let propertyId;
      
      // Method 1: Try steps.trigger.event
      if (steps.trigger && steps.trigger.event) {
        if (steps.trigger.event.query && steps.trigger.event.query.id) {
          propertyId = steps.trigger.event.query.id;
          console.log("Found property ID in steps.trigger.event.query.id");
        } else if (steps.trigger.event.params && steps.trigger.event.params.id) {
          propertyId = steps.trigger.event.params.id;
          console.log("Found property ID in steps.trigger.event.params.id");
        }
      }
      
      // Method 2: Try HTTP raw query string if available
      if (!propertyId && steps.trigger && steps.trigger.event && steps.trigger.event.url) {
        const url = steps.trigger.event.url;
        const urlObj = new URL(url);
        propertyId = urlObj.searchParams.get('id');
        if (propertyId) {
          console.log("Found property ID from URL search params");
        }
      }
      
      // If we still don't have an ID, return a mock property for testing
      if (!propertyId) {
        console.log("No property ID found in request, returning mock property");
        
        // Create a mock property with properly formatted values (no cg_ prefixes, capitalized values)
        return $.respond({
          status: 200,
          headers,
          body: {
            success: true,
            property: {
              id: "mock-property",
              properties: {
                hs_object_id: "mock-property",
                name: "Mock Property",
                project: "Sample Project", // cg_ prefix removed
                stage: "1", // cg_ prefix removed
                dp_lot: "123", // cg_ prefix removed
                status: "Available", // cg_ prefix removed and capitalized
                hs_price: "650000",
                hs_bedrooms: "4",
                hs_bathrooms: "2",
                car: "2", // cg_ prefix removed
                house_type: "Single Story", // cg_ prefix removed
                hs_listing_type: "House & Land Package",
                description: "This is a mock property since no ID was provided.", // cg_ prefix removed
                title: "Torrens", // cg_ prefix removed
                frontage: "15", // cg_ prefix removed
                depth: "32", // cg_ prefix removed
                aspect: "North", // cg_ prefix removed
                hs_lot_size: "450",
                land_type: "Corner", // cg_ prefix removed
                registration_date: "2024-06-15", // cg_ prefix removed
                storeys: "1", // cg_ prefix removed
                hs_neighborhood: "Valley View",
                hs_city: "Springfield"
              }
            },
            message: "No property ID was provided, so a mock property is being returned."
          }
        });
      }
      
      // Get API key from environment variables
      const apiKey = process.env.HUBSPOT_API_KEY;
      
      if (!apiKey) {
        console.log("HubSpot API key not configured");
        return $.respond({
          status: 200,
          headers,
          body: {
            success: false,
            error: "HubSpot API key not configured"
          }
        });
      }
      
      // Define specific properties to request
      const properties = [
        // Basic information
        "name", "hs_object_id", "cg_project", "cg_stage", "cg_dp_lot", "cg_mp_lot", 
        "cg_status", "hs_price", "cg_build_list_price", "cg_listed_package_price", 
        "cg_land_release_price", "cg_land_type", "hs_lot_size", "cg_total_build_size", 
        "hs_bedrooms", "hs_bathrooms", "cg_car", "cg_house_type", "cg_facade", 
        "cg_title", "hs_listing_type", "cg_listing_type", "cg_description", "cg_features_list",
        "hs_address_1", 
        
        // Location details
        "hs_city", "hs_neighborhood",
        
        // Additional property details
        "cg_orientation", "cg_setback", "cg_frontage", "cg_depth", "cg_aspect",
        "cg_ceiling_height", "cg_construction_type", "cg_energy_rating",
        "cg_estimated_completion", "cg_settlement_date", "cg_land_title_date",
        
        // New requested fields
        "cg_registration_date", "cg_storeys",
        
        // Document links
        "cg_brochure_url", "cg_masterplan_url", "cg_floorplan_url", "cg_contract_url",
        "cg_inclusions_url", "cg_specifications_url"
      ].join(',');
      
      // Build URL to fetch single property by ID
      const url = `https://api.hubapi.com/crm/v3/objects/0-420/${propertyId}?properties=${properties}`;
      console.log(`Looking up property: ${propertyId}`);
      
      // Fetch property details from HubSpot
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`HubSpot API error: ${response.status}`);
        return $.respond({
          status: 200,
          headers,
          body: {
            success: false,
            error: `Failed to retrieve property (Status ${response.status})`
          }
        });
      }
      
      // Parse property data
      let property;
      try {
        property = await response.json();
        console.log("Successfully parsed property data");
        
        // Process property fields to remove cg_ prefixes and capitalize values
        if (property.properties) {
          const processedProps = {};
          
          // Process each property value
          for (const [key, value] of Object.entries(property.properties)) {
            if (key.startsWith('cg_')) {
              // Create a new key without prefix
              const newKey = key.replace('cg_', '');
              
              // Format and capitalize value if it's a string
              let processedValue = value;
              if (typeof value === 'string' && !value.match(/^\d+(\.\d+)?$/)) {
                // Don't capitalize numbers
                processedValue = formatValueWithCapitalization(value);
              }
              
              processedProps[newKey] = processedValue;
            } else {
              // Keep non-cg properties as they are
              processedProps[key] = value;
            }
          }
          
          // Replace original properties with processed ones
          property.properties = processedProps;
        }
        
        // Log some key fields for debugging
        console.log(`Property ID: ${property.id}`);
        console.log(`Property Type: ${property.properties?.hs_listing_type || property.properties?.listing_type}`);
        console.log(`Property Suburb: ${property.properties?.hs_city}`);
        console.log(`Property Storeys: ${property.properties?.storeys}`);
        console.log(`Property Title Type: ${property.properties?.title}`);
      } catch (e) {
        console.error(`JSON parse error: ${e.message}`);
        return $.respond({
          status: 200,
          headers,
          body: {
            success: false,
            error: "Failed to parse property data"
          }
        });
      }
      
      // Return successfully with property data
      return $.respond({
        status: 200,
        headers,
        body: {
          success: true,
          property: property
        }
      });
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
      
      return $.respond({
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: {
          success: false,
          error: "Failed to load property details"
        }
      });
    }
  }
});

// Helper function to format values with capitalization
function formatValueWithCapitalization(value) {
  if (!value) return '';
  
  // Split by underscores, spaces or hyphens
  return String(value)
    .split(/[_\s-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}