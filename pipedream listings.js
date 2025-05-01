// Updated Pipedream Code for Property Listings with Enhanced Sorting & Filtering
export default defineComponent({
  async run({ steps, $ }) {
    try {
      console.log("Request received:", new Date().toISOString());
      
      // Set response headers
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      };
      
      // Get API key from environment variables
      const apiKey = process.env.HUBSPOT_API_KEY;
      if (!apiKey) {
        throw new Error("HubSpot API key not configured");
      }
      
      // Define specific properties to request 
      // Added land-focused properties to align with detailed view
      const properties = [
        // Basic information
        "name", "hs_object_id", "cg_project", "cg_stage", "cg_dp_lot", "cg_mp_lot", 
        "cg_status", "hs_price", "cg_build_list_price", "cg_listed_package_price", 
        "cg_land_release_price", "cg_land_type", "hs_lot_size", "cg_total_build_size", 
        "hs_bedrooms", "hs_bathrooms", "cg_car", "cg_house_type", "cg_facade", 
        "cg_title_type", "hs_listing_type", "hs_address_1",
        
        // Location details
        "hs_city", "hs_neighborhood",
        
        // Additional land-focused properties
        "cg_orientation", "cg_setback", "cg_frontage", "cg_depth", "cg_aspect",
        
        // New requested fields
        "cg_registration_date", "cg_storeys", 
        
        // Timing properties for sorting by newest
        "createdate", "hs_lastmodifieddate"
      ].join(',');
      
      // Set a higher limit per page (100 is max for HubSpot API)
      const limit = 100;
      let after = undefined;
      let allResults = [];
      let hasMore = true;
      
      // Define included statuses - matching property detail view
      const includedStatuses = [
        "cg_exclusive",
        "cg_available",
        "cg_under_offer",
        "cg_hold"
      ];
      
      // Build filter for included statuses
      const filters = [{
        propertyName: "cg_status",
        operator: "IN",
        values: includedStatuses
      }];
      
      const filterGroups = encodeURIComponent(JSON.stringify([
        { filters }
      ]));
      
      console.log("Using status inclusion filter:", JSON.stringify(includedStatuses));
      
      // Pagination loop to get all results
      const startTime = Date.now();
      while (hasMore) {
        // Build URL with pagination
        let url = `https://api.hubapi.com/crm/v3/objects/0-420?limit=${limit}&properties=${properties}`;
        if (after) {
          url += `&after=${after}`;
        }
        
        // Add filter for included statuses
        url += `&filterGroups=${filterGroups}`;
        
        console.log(`Making request to HubSpot: ${url.substring(0, 100)}...`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HubSpot API error: ${response.status}, ${errorText}`);
          throw new Error(`API error ${response.status}: ${errorText.substring(0, 100)}`);
        }
        
        const data = await response.json();
        console.log(`Retrieved page with ${data.results?.length || 0} properties`);
        
        if (data.results && data.results.length > 0) {
          allResults = [...allResults, ...data.results];
          
          if (data.paging && data.paging.next && data.paging.next.after) {
            after = data.paging.next.after;
            console.log(`More pages available, next after: ${after}`);
          } else {
            hasMore = false;
            console.log("No more pages available");
          }
        } else {
          hasMore = false;
          console.log("No results returned or empty page");
        }
      }
      
      console.log(`Retrieved ${allResults.length} properties in ${Date.now() - startTime}ms`);
      
      // Double-check: Make sure only included statuses came through
      let filteredResults = allResults.filter(property => {
        const status = property.properties?.cg_status;
        return status && includedStatuses.includes(status);
      });
      
      if (filteredResults.length < allResults.length) {
        console.log(`Filtered out ${allResults.length - filteredResults.length} properties with non-included statuses`);
        allResults = filteredResults;
      }
      
      // Add debugging info about available statuses
      const availableStatuses = [...new Set(allResults.map(p => p.properties?.cg_status).filter(Boolean))];
      console.log("Available statuses in results:", JSON.stringify(availableStatuses));
      
      // Log available title types for debugging
      const availableTitleTypes = [...new Set(allResults.map(p => p.properties?.cg_title_type).filter(Boolean))];
      console.log("Available title types:", JSON.stringify(availableTitleTypes));
      
      // Log available suburbs for debugging
      const availableSuburbs = [...new Set(allResults.map(p => p.properties?.hs_city).filter(Boolean))];
      console.log("Available suburbs:", JSON.stringify(availableSuburbs));
      
      // Log storeys values for debugging
      const storeysValues = [...new Set(allResults.map(p => p.properties?.cg_storeys).filter(Boolean))];
      console.log("Available storeys values:", JSON.stringify(storeysValues));
      
      // Default sorting: prioritize land-focused options first
      allResults.sort((a, b) => {
        // First prioritize available properties
        if (a.properties?.cg_status === 'cg_available' && b.properties?.cg_status !== 'cg_available') {
          return -1;
        }
        if (a.properties?.cg_status !== 'cg_available' && b.properties?.cg_status === 'cg_available') {
          return 1;
        }
        
        // Get lot sizes
        const lotSizeA = parseFloat(a.properties?.hs_lot_size || 0);
        const lotSizeB = parseFloat(b.properties?.hs_lot_size || 0);
        
        // Then prioritize properties with frontage values
        const frontageA = parseFloat(a.properties?.cg_frontage || 0);
        const frontageB = parseFloat(b.properties?.cg_frontage || 0);
        
        if (frontageA && !frontageB) return -1;
        if (!frontageA && frontageB) return 1;
        
        // Then prioritize properties with lot sizes
        if (lotSizeA && !lotSizeB) return -1;
        if (!lotSizeA && lotSizeB) return 1;
        
        // Land-only listings next
        const isLandOnlyA = a.properties?.hs_listing_type?.toLowerCase().includes('land');
        const isLandOnlyB = b.properties?.hs_listing_type?.toLowerCase().includes('land');
        if (isLandOnlyA && !isLandOnlyB) return -1;
        if (!isLandOnlyA && isLandOnlyB) return 1;
        
        // Finally sort by frontage (larger first)
        return frontageB - frontageA;
      });
      
      // Return the data
      return $.respond({
        status: 200,
        headers,
        body: {
          results: allResults,
          total: allResults.length,
          success: true,
          included_statuses: includedStatuses
        }
      });
      
    } catch (error) {
      console.error(`Error processing request: ${error.message}`);
      if (error.stack) console.error(error.stack);
      
      return $.respond({
        status: 200, // Still return 200 to avoid CORS issues
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: {
          results: [],
          success: false,
          error: error.message
        }
      });
    }
  }
});