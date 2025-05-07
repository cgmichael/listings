// HubSpot Integration Script
// This script handles the integration with HubSpot for property listings

// HubSpot Configuration
const HUBSPOT_CONFIG = {
  enabled: true,
  portalId: '24160521',
  formId: 'a00f1f67-1490-44a7-a571-142da5377383',
  formUrl: 'https://share.hsforms.com/1oA8fZxSQRKelcRQtpTdzgwedudl'
};

// Track user state in localStorage
const getUserData = () => {
  try {
    const userData = localStorage.getItem('cg-user');
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('Error reading user data:', e);
    return null;
  }
};

const saveUserData = (data) => {
  try {
    localStorage.setItem('cg-user', JSON.stringify(data));
  } catch (e) {
    console.error('Error saving user data:', e);
  }
};

// Function to check if we have the HubSpot tracking cookie
const getHubSpotCookie = () => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf('hubspotutk=') === 0) {
      return cookie.substring('hubspotutk='.length, cookie.length);
    }
  }
  return null;
};

// Project Mapping Function
function getProjectFromPropertyTitle(propertyTitle) {
  if (!propertyTitle) return 'General Enquiry';
  
  // Standardize the input
  const title = propertyTitle.toLowerCase().trim();
  
  // Mapping table of project names based on README.md requirements
  const projectMappings = {
    // Official project mappings
    'ashton gardens': 'Ashton Gardens',
    'bloomfield': 'Bloomfield',
    'botanica': 'Botanica',
    'garfield': 'Garfield Grange',
    'grange': 'Garfield Grange',
    'one fairway': 'One FairWay',
    'onefairway': 'One FairWay',
    'fairway': 'One FairWay',
    'paddington': 'Paddington Estate',
    'park avenue': 'Park Avenue',
    'parkave': 'Park Avenue',
    'park ave ii': 'Park Avenue II',
    'parkave2': 'Park Avenue II',
    'river oaks': 'River Oaks',
    'riviere': 'Rivière',
    'the grace': 'The Grace',
    'grace': 'The Grace',
    'rouse hill': 'The Rouse Hill Estate',
    'valley rise': 'Valley Rise',
    '30-32 advance': 'Advance St',
    'advance st': 'Advance St',
    'ed.ave': 'Ed.Ave (350 Edmondson Ave)',
    'edmondson': 'Ed.Ave (350 Edmondson Ave)',
    '172 guntawong': '172 Guntawong Rd',
    'guntawong': '172 Guntawong Rd',
    '627 windsor': '627 Windsor Rd',
    '567 windsor': '567 Windsor Rd',
    '505-535 fifteenth': '505-535 Fifteenth Ave',
    'fifteenth ave': '505-535 Fifteenth Ave',
    '155 boyd': '155 Boyd St',
    'boyd st': '155 Boyd St',
    'castle luxe': 'cg_castle_luxe',
    'luxe': 'cg_castle_luxe',
    
    // Legacy mappings for backward compatibility
    'coastal heights': 'One FairWay',
    'ocean view': 'One FairWay',
    'bay apartments': 'Botanica', 
    'harbourside': 'Rivière',
    'sydney central': 'The Grace',
    'sky tower': 'Park Avenue',
    'the parkside': 'Park Avenue II',
    'garden villas': 'Garfield Grange',
    'metro apartments': 'Bloomfield',
    'urban lofts': 'Ashton Gardens',
    'city view': 'The Grace'
  };
  
  // Check for direct matches first
  for (const [key, value] of Object.entries(projectMappings)) {
    if (title.includes(key)) {
      return value;
    }
  }
  
  // Check for specific addresses or patterns
  if (title.includes('advance') && title.includes('30')) {
    return 'Advance St';
  } else if (title.includes('windsor') && title.includes('627')) {
    return '627 Windsor Rd';
  } else if (title.includes('windsor') && title.includes('567')) {
    return '567 Windsor Rd';
  } else if (title.includes('edmondson') || title.includes('350')) {
    return 'Ed.Ave (350 Edmondson Ave)';
  } else if (title.includes('guntawong') || title.includes('172')) {
    return '172 Guntawong Rd';
  } else if (title.includes('fifteenth') || title.includes('505')) {
    return '505-535 Fifteenth Ave';
  } else if (title.includes('boyd') || title.includes('155')) {
    return '155 Boyd St';
  }
  
  // Return General Enquiry as the default fallback
  return 'General Enquiry';
}

// Function to track property interests
window.trackPropertyInterest = function(propertyTitle, propertyId, interactionType = 'favorite') {
  // Get current user, create if doesn't exist
  let userData = getUserData() || { 
    listings_of_interest: [],
    projects_of_interest: []
  };
  
  // Determine project from property title
  const project = getProjectFromPropertyTitle(propertyTitle);
  
  // Create the interaction data
  const interactionData = {
    propertyTitle,
    propertyId,
    project,
    interactionType,
    timestamp: new Date().toISOString()
  };
  
  // Track in localStorage
  if (interactionType === 'unfavorite') {
    // Remove from listings of interest
    userData.listings_of_interest = (userData.listings_of_interest || []).filter(
      item => item !== propertyTitle
    );
  } else {
    // Add to listings if not already present
    if (!userData.listings_of_interest) {
      userData.listings_of_interest = [];
    }
    
    if (!userData.listings_of_interest.includes(propertyTitle)) {
      userData.listings_of_interest.push(propertyTitle);
    }
    
    // For comparison, just track project
    if (interactionType === 'compare' && project) {
      if (!userData.projects_of_interest) {
        userData.projects_of_interest = [];
      }
      
      if (!userData.projects_of_interest.includes(project)) {
        userData.projects_of_interest.push(project);
      }
    }
  }
  
  // Save updated user data
  saveUserData(userData);
  
  // Update HubSpot if we have an email 
  if (userData.email) {
    updateHubSpotContact(userData);
  }
  
  return interactionData;
};

// Function to track property inquiry
window.trackPropertyInquiry = async function(interactionData, userData = null) {
  // If no user data provided, try to get from localStorage
  if (!userData) {
    userData = getUserData();
  }
  
  // Update tracking information
  if (interactionData.propertyTitle) {
    if (!userData) {
      userData = {};
    }
    
    if (!userData.listings_of_interest) {
      userData.listings_of_interest = [];
    }
    
    if (!userData.listings_of_interest.includes(interactionData.propertyTitle)) {
      userData.listings_of_interest.push(interactionData.propertyTitle);
    }
    
    // Save tracking information
    saveUserData(userData);
  }
  
  // Update HubSpot if we have user email
  if (userData && userData.email) {
    return updateHubSpotContact(userData);
  }
  
  return false;
};

// Function to fetch HubSpot contact
async function fetchHubSpotContact(email) {
  if (!email) return null;
  
  try {
    // Check if we have a cached version
    const cachedData = localStorage.getItem(`hs_contact_${email}`);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Use cache if less than 1 hour old
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed.data;
      }
    }
    
    // Try API endpoint if configured
    if (window.CONFIG && window.CONFIG.apiEndpoint) {
      const response = await fetch(`${window.CONFIG.apiEndpoint}/hubspot/contact?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        
        // Cache the result
        localStorage.setItem(`hs_contact_${email}`, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
        
        return data;
      }
    }
  } catch (error) {
    console.error('Error fetching HubSpot contact:', error);
  }
  
  return null;
}

// Function to update HubSpot contact
async function updateHubSpotContact(userData) {
  if (!userData || !userData.email) return false;
  
  try {
    // Prepare the data to send to HubSpot
    const hubspotData = {
      email: userData.email,
      firstname: userData.firstName || '',
      lastname: userData.lastName || '',
      phone: userData.phone || ''
    };
    
    // Add listings of interest as multi-line text
    if (userData.listings_of_interest && userData.listings_of_interest.length > 0) {
      hubspotData.cg_listings_of_interest = userData.listings_of_interest.join('\n');
    }
    
    // Add projects of interest as multi-checkbox values
    if (userData.projects_of_interest && userData.projects_of_interest.length > 0) {
      hubspotData.all_projects_of_interest = userData.projects_of_interest;
    }
    
    // Add verification fields if relevant
    if (userData.verified !== undefined) {
      hubspotData.cg_verified = userData.verified ? 'Yes' : 'No';
    }
    
    if (userData.verificationToken) {
      hubspotData.cg_verification_token = userData.verificationToken;
    }
    
    if (userData.needsVerification) {
      hubspotData.cg_needs_verification = 'Yes';
    }
    
    // Try to use the API endpoint if configured
    if (window.CONFIG && window.CONFIG.apiEndpoint) {
      try {
        const response = await fetch(`${window.CONFIG.apiEndpoint}/hubspot/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(hubspotData)
        });
        
        if (response.ok) {
          console.log('Contact updated in HubSpot via API');
          return true;
        }
      } catch (apiError) {
        console.error('API update error:', apiError);
        // Continue to fallback
      }
    }
    
    // Try to use HubSpot Forms API as the primary fallback
    if (typeof hbspt !== 'undefined') {
      // Create a hidden form container
      const formContainer = document.createElement('div');
      formContainer.id = 'hubspot-form-container-' + Date.now();
      formContainer.style.position = 'absolute';
      formContainer.style.left = '-9999px';
      formContainer.style.bottom = '-9999px';
      formContainer.style.width = '1px';
      formContainer.style.height = '1px';
      formContainer.style.overflow = 'hidden';
      document.body.appendChild(formContainer);
      
      // Create a promise to track form completion
      return new Promise((resolve) => {
        try {
          // Create the form
          hbspt.forms.create({
            portalId: HUBSPOT_CONFIG.portalId,
            formId: HUBSPOT_CONFIG.formId,
            region: "na1",
            target: '#' + formContainer.id,
            onFormSubmitted: function() {
              // Form submitted successfully
              console.log('HubSpot form submitted');
              
              // Remove the form container
              setTimeout(() => {
                if (document.body.contains(formContainer)) {
                  document.body.removeChild(formContainer);
                }
              }, 2000);
              
              resolve(true);
            },
            onFormReady: function() {
              // Wait for the form to be ready, then set field values
              setTimeout(() => {
                try {
                  // Get form elements
                  const form = formContainer.querySelector('form');
                  if (!form) return resolve(false);
                  
                  // Get form fields
                  const emailInput = form.querySelector('input[name="email"]');
                  const firstNameInput = form.querySelector('input[name="firstname"]');
                  const lastNameInput = form.querySelector('input[name="lastname"]');
                  const phoneInput = form.querySelector('input[name="phone"]');
                  const listingsTextarea = form.querySelector('textarea[name="cg_listings_of_interest"]');
                  
                  // Set values if fields exist
                  if (emailInput) emailInput.value = hubspotData.email;
                  if (firstNameInput) firstNameInput.value = hubspotData.firstname;
                  if (lastNameInput) lastNameInput.value = hubspotData.lastname;
                  if (phoneInput) phoneInput.value = hubspotData.phone;
                  if (listingsTextarea && hubspotData.cg_listings_of_interest) {
                    listingsTextarea.value = hubspotData.cg_listings_of_interest;
                  }
                  
                  // Submit the form
                  const submitButton = form.querySelector('input[type="submit"]');
                  if (submitButton) {
                    submitButton.click();
                  } else {
                    // If no submit button, try form.submit()
                    form.submit();
                  }
                } catch (error) {
                  console.error('Error submitting HubSpot form:', error);
                  resolve(false);
                }
              }, 500);
            }
          });
        } catch (error) {
          console.error('Error creating HubSpot form:', error);
          resolve(false);
        }
      });
    }
    
    // Final fallback: use iframe method
    const formUrl = HUBSPOT_CONFIG.formUrl;
    if (formUrl) {
      // Create an iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.bottom = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.overflow = 'hidden';
      iframe.src = formUrl;
      document.body.appendChild(iframe);
      
      // Remove after a delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating HubSpot contact:', error);
    return false;
  }
}

// Add CastleApp extensions
function extendCastleApp() {
  // Don't proceed if CastleApp isn't available
  if (typeof window.CastleApp === 'undefined') {
    console.warn('CastleApp not found, HubSpot tracking extensions not applied');
    return;
  }
  
  // Extend the existing toggleFavorite function to track in HubSpot
  if (typeof CastleApp.toggleFavorite === 'function') {
    const originalToggleFavorite = CastleApp.toggleFavorite;
    CastleApp.toggleFavorite = function(propertyId, button) {
      // Get current state before calling original function
      const wasAlreadyFavorite = this.state.favorites.includes(propertyId);
      
      // Call original function
      originalToggleFavorite.call(this, propertyId, button);
      
      // Check the new state after the function call
      const isNowFavorite = this.state.favorites.includes(propertyId);
      
      // Find the property in the list
      const property = this.state.allProperties.find(p => p.id === propertyId) || {};
      
      // Get property title or use ID if not found
      const propertyTitle = property.title || property.name || `Property ${propertyId}`;
      
      // Track the interest in HubSpot
      if (isNowFavorite && !wasAlreadyFavorite) {
        // Added to favorites
        trackPropertyInterest(propertyTitle, propertyId, 'favorite');
      } else if (!isNowFavorite && wasAlreadyFavorite) {
        // Removed from favorites
        trackPropertyInterest(propertyTitle, propertyId, 'unfavorite');
      }
    };
  }
  
  // Extend the property comparison function if it exists
  if (typeof CastleApp.togglePropertyComparison === 'function') {
    const originalToggleComparison = CastleApp.togglePropertyComparison;
    CastleApp.togglePropertyComparison = function(propertyId, button) {
      // Get current state
      const wasAlreadyCompared = this.state.comparisonList.includes(propertyId);
      
      // Call original function
      originalToggleComparison.call(this, propertyId, button);
      
      // Check new state
      const isNowCompared = this.state.comparisonList.includes(propertyId);
      
      // Find the property
      const property = this.state.allProperties.find(p => p.id === propertyId) || {};
      const propertyTitle = property.title || property.name || `Property ${propertyId}`;
      
      // Track comparison in HubSpot differently than favorites
      if (isNowCompared && !wasAlreadyCompared) {
        // Added to comparison list - just track project interest, not the specific property
        trackPropertyInterest(propertyTitle, propertyId, 'compare');
      }
    };
  }
  
  // Extend property inquiry functionality if it exists
  if (typeof CastleApp.propertyInquiry === 'function') {
    const originalPropertyInquiry = CastleApp.propertyInquiry;
    CastleApp.propertyInquiry = function(propertyId, formData) {
      // Call original function
      const result = originalPropertyInquiry.call(this, propertyId, formData);
      
      // Find the property
      const property = this.state.allProperties.find(p => p.id === propertyId) || {};
      const propertyTitle = property.title || property.name || `Property ${propertyId}`;
      
      // Create user data from form submission
      const userData = {
        email: formData.email || '',
        firstName: formData.firstName || formData.firstname || '',
        lastName: formData.lastName || formData.lastname || '',
        phone: formData.phone || formData.phoneNumber || ''
      };
      
      // Add to listings of interest
      if (!userData.listings_of_interest) {
        userData.listings_of_interest = [];
      }
      
      if (!userData.listings_of_interest.includes(propertyTitle)) {
        userData.listings_of_interest.push(propertyTitle);
      }
      
      // Track the inquiry in HubSpot
      const interactionData = {
        propertyTitle,
        propertyId,
        project: getProjectFromPropertyTitle(propertyTitle),
        interactionType: 'inquiry',
        timestamp: new Date().toISOString()
      };
      
      // Save user data and track in HubSpot
      trackPropertyInquiry(interactionData, userData);
      
      return result;
    };
  }
}

// Add event listeners for inquiry forms
function setupInquiryListeners() {
  // Look for inquiry forms or buttons
  const inquiryForms = document.querySelectorAll('form[data-property-inquiry], .property-inquiry-form');
  const inquiryButtons = document.querySelectorAll('.inquiry-button, .contact-agent, button[data-action="inquire"]');
  
  // Handle inquiry forms
  inquiryForms.forEach(form => {
    form.addEventListener('submit', function(event) {
      // Get property ID from form attributes
      const propertyId = this.getAttribute('data-property-id') || '';
      const propertyTitle = this.getAttribute('data-property-title') || '';
      
      // If we have property information, track the inquiry
      if (propertyId || propertyTitle) {
        const formData = new FormData(this);
        const userData = {
          email: formData.get('email') || '',
          firstName: formData.get('firstName') || formData.get('firstname') || '',
          lastName: formData.get('lastName') || formData.get('lastname') || '',
          phone: formData.get('phone') || formData.get('phoneNumber') || ''
        };
        
        const interactionData = {
          propertyTitle: propertyTitle || `Property ${propertyId}`,
          propertyId,
          project: getProjectFromPropertyTitle(propertyTitle),
          interactionType: 'inquiry',
          timestamp: new Date().toISOString()
        };
        
        // Track the inquiry in HubSpot
        trackPropertyInquiry(interactionData, userData);
      }
    });
  });
  
  // Handle inquiry buttons
  inquiryButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      // Get property ID from button attributes
      const propertyId = this.getAttribute('data-property-id') || '';
      const propertyTitle = this.getAttribute('data-property-title') || '';
      
      // If we have property information, track the click (we'll track form submission separately)
      if (propertyId || propertyTitle) {
        const interactionData = {
          propertyTitle: propertyTitle || `Property ${propertyId}`,
          propertyId,
          project: getProjectFromPropertyTitle(propertyTitle),
          interactionType: 'inquiry_click',
          timestamp: new Date().toISOString()
        };
        
        // Just track the click for now, actual inquiry tracked on form submission
        trackPropertyInterest(interactionData.propertyTitle, propertyId, 'inquiry_click');
      }
    });
  });
}

// Initialize HubSpot Integration when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Make CONFIG available to the window if not already defined
  if (!window.CONFIG) {
    window.CONFIG = {};
  }
  
  // Add HubSpot configuration
  window.CONFIG.hubspot = HUBSPOT_CONFIG;
  
  // Extend CastleApp methods with HubSpot tracking
  extendCastleApp();
  
  // Set up event listeners for inquiry forms/buttons
  setupInquiryListeners();
  
  console.log('HubSpot integration initialized');
});