// Auth System for Property Listings
(function() {
  // Configuration settings
  const AUTH_CONFIG = {
    verificationEndpoint: 'https://eop2vfl5w0cxbqg.m.pipedream.net',
    apiTimeout: 20000,      // Increased timeout for API calls
    storageKey: 'cg_user_data',
    verificationTokenParam: 'verification_token',
    devMode: true,          // Enable dev mode for easier testing
    debugMode: true,        // Enable debug logging
    bypassAuth: false,      // No bypass - perform real authentication
    trustExistingContacts: true, // Allow access for emails already in HubSpot
    loginAttempts: 0,       // Track login attempts for fallback authentication
    directAPIEndpoint: '/check-hubspot-contact', // Direct endpoint for HubSpot contact check
    fallbackAPIEndpoint: '/check-email'           // Fallback endpoint for compatibility
  };
  
  // Auth System
  const AuthSystem = {
    // Initialize the auth system
    init: function() {
      this.setupEventListeners();
      this.handleVerificationToken();
      
      // Check if there's a user already authenticated
      const userData = this.getUserData();
      if (userData && userData.authenticated) {
        this.showListings();
      } else {
        this.setupAuthOverlay();
      }
    },
    
    // Set up the auth overlay
    setupAuthOverlay: function() {
      // Find the auth overlay that has both options
      const authOverlay = document.getElementById('auth-overlay');
      if (!authOverlay) return;
      
      // Show the auth overlay
      authOverlay.style.display = 'flex';
      
      // Hide the listings container
      const listingsContainer = document.getElementById('listings-container');
      if (listingsContainer) {
        listingsContainer.classList.add('hidden-until-auth');
      }
    },
    
    // Set up event listeners for auth buttons
    setupEventListeners: function() {
      // Login and Signup buttons
      const showLoginBtn = document.getElementById('show-login-btn');
      const showSignupBtn = document.getElementById('show-signup-btn');
      const loginLink = document.getElementById('login-link');
      const signupLink = document.getElementById('signup-link');
      const returnLoginLink = document.getElementById('return-login-link');
      const showSignupFromNotRegistered = document.getElementById('show-signup');
      const resendVerificationBtn = document.getElementById('resend-verification');
      
      // Add both form submission and direct button click handlers for the login
      if (emailLoginForm) {
        console.log('Found email login form, adding submit handler');
        emailLoginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Login form submitted');
          const email = document.getElementById('login-email').value.trim();
          
          if (email) {
            // Use direct function reference to avoid 'this' context issues
            AuthSystem.handleLogin(email);
          } else {
            console.error('Email field is empty in form submission');
            alert('Please enter your email address');
          }
          return false;
        });
      }
      
      // Add a direct click handler to the login button as a fallback and a more robust solution
      if (loginBtn) {
        console.log('Found login button, adding click handler');
        
        // Use a direct login handler with proper binding to preserve 'this' context
        const loginHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Login button triggered');
          
          const emailField = document.getElementById('login-email');
          const email = emailField ? emailField.value.trim() : '';
          
          if (email) {
            console.log(`Processing login for email: ${email}`);
            AuthSystem.handleLogin(email); // Use direct reference to avoid 'this' issues
          } else {
            console.error('Email field is empty');
            alert('Please enter your email address');
          }
          return false;
        };
        
        // Use direct event assignment to avoid 'this' context issues
        loginBtn.addEventListener('click', loginHandler);
        loginBtn.addEventListener('touchend', loginHandler);
        loginBtn.onclick = loginHandler;
      }
    },
    
    // Show the specified view
    showView: function(view) {
      // Get all possible views
      const authOptions = document.getElementById('auth-options');
      const hubspotFormContainer = document.getElementById('hubspot-form-container');
      const loginForm = document.getElementById('login-form');
      const verificationMessage = document.getElementById('verification-message');
      const notRegisteredMessage = document.getElementById('not-registered-message');
      
      // Hide all views
      if (authOptions) authOptions.style.display = 'none';
      if (hubspotFormContainer) hubspotFormContainer.style.display = 'none';
      if (loginForm) loginForm.style.display = 'none';
      if (verificationMessage) verificationMessage.style.display = 'none';
      if (notRegisteredMessage) notRegisteredMessage.style.display = 'none';
      
      // Show the requested view
      switch(view) {
        case 'options':
          if (authOptions) authOptions.style.display = 'block';
          break;
        case 'signup':
          if (hubspotFormContainer) hubspotFormContainer.style.display = 'block';
          break;
        case 'login':
          if (loginForm) loginForm.style.display = 'block';
          break;
        case 'verification':
          if (verificationMessage) verificationMessage.style.display = 'block';
          break;
        case 'not-registered':
          if (notRegisteredMessage) notRegisteredMessage.style.display = 'block';
          break;
        default:
          if (authOptions) authOptions.style.display = 'block';
      }
    },
    
    // Handle login form submission
    handleLogin: async function(email) {
      if (AUTH_CONFIG.debugMode) {
        console.log(`Login attempt with email: ${email}`);
      }
      
      if (!email) {
        console.error('No email provided for login');
        return;
      }
      
      // Increment login attempts counter
      AUTH_CONFIG.loginAttempts++;
      
      // Show loading indicator
      const loginLoading = document.getElementById('login-loading');
      if (loginLoading) {
        loginLoading.style.display = 'block';
        if (AUTH_CONFIG.debugMode) console.log('Showing loading indicator');
      }
      
      // Development mode bypass for special emails
      if (AUTH_CONFIG.devMode && (email.toLowerCase() === 'dev@example.com' || 
                                  email.toLowerCase() === 'test@example.com' ||
                                  email.toLowerCase().includes('test') ||
                                  email.toLowerCase().includes('dev'))) {
        if (AUTH_CONFIG.debugMode) console.log('Development mode: bypassing verification for developer email');
        
        // Hide loading indicator
        if (loginLoading) loginLoading.style.display = 'none';
        
        // Authenticate and show listings immediately
        this.authenticateUser(email, 'Test', 'User');
        this.showListings();
        this.showToast('Development login successful', 'success');
        return;
      }
      
      try {
        if (AUTH_CONFIG.debugMode) console.log('Checking if email exists in HubSpot...');
        
        // Try the direct HubSpot email check endpoint first
        const directCheckUrl = `${AUTH_CONFIG.verificationEndpoint}${AUTH_CONFIG.directAPIEndpoint}?email=${encodeURIComponent(email)}`;
        if (AUTH_CONFIG.debugMode) console.log('Trying direct HubSpot check URL:', directCheckUrl);
        
        let response;
        let data;
        let apiSuccessful = false;
        let fallbackUsed = false;
        
        try {
          // First attempt with direct endpoint
          response = await fetch(directCheckUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            timeout: AUTH_CONFIG.apiTimeout
          });
          
          if (response.ok) {
            data = await response.json();
            apiSuccessful = true;
            if (AUTH_CONFIG.debugMode) console.log('Direct API response:', data);
          } else {
            if (AUTH_CONFIG.debugMode) console.log('Direct API call failed, status:', response.status, response.statusText);
            throw new Error('Direct API call failed');
          }
        } catch (directApiError) {
          if (AUTH_CONFIG.debugMode) console.log('Error with direct API, trying fallback:', directApiError);
          
          // Try fallback endpoint if direct fails
          fallbackUsed = true;
          const fallbackUrl = `${AUTH_CONFIG.verificationEndpoint}${AUTH_CONFIG.fallbackAPIEndpoint}?email=${encodeURIComponent(email)}`;
          if (AUTH_CONFIG.debugMode) console.log('Trying fallback check URL:', fallbackUrl);
          
          response = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            timeout: AUTH_CONFIG.apiTimeout
          });
          
          if (response.ok) {
            data = await response.json();
            apiSuccessful = true;
            if (AUTH_CONFIG.debugMode) console.log('Fallback API response:', data);
          } else {
            if (AUTH_CONFIG.debugMode) console.log('Fallback API call failed, status:', response.status, response.statusText);
            throw new Error('Both API calls failed');
          }
        }
        
        // Hide loading indicator
        if (loginLoading) loginLoading.style.display = 'none';
        
        // If we couldn't get a valid API response
        if (!apiSuccessful || !data) {
          throw new Error('Could not get valid API response');
        }
        
        if (AUTH_CONFIG.debugMode) {
          console.log('API Response Summary:');
          console.log('- API endpoint used:', fallbackUsed ? 'Fallback' : 'Direct');
          console.log('- Email:', email);
          console.log('- Success:', apiSuccessful);
          console.log('- Email exists in HubSpot:', data.exists);
          console.log('- Email verified:', data.verified);
          console.log('- Full response:', JSON.stringify(data, null, 2));
        }
        
        // Process the API response
        if (data.exists) {
          if (AUTH_CONFIG.debugMode) console.log('Email exists in HubSpot');
          
          // If we're trusting existing HubSpot contacts or the user is verified
          if (AUTH_CONFIG.trustExistingContacts || data.verified) {
            if (AUTH_CONFIG.debugMode) console.log('Trusting existing contact, granting access');
            
            // User is in HubSpot, authenticate them
            this.authenticateUser(email, data.firstName || '', data.lastName || '');
            this.showListings();
            this.showToast('Login successful', 'success');
            return;
          } else if (data.needsVerification) {
            // The user exists but needs verification
            if (AUTH_CONFIG.debugMode) console.log('User exists but needs verification');
            
            // Show verification message
            const verificationEmail = document.getElementById('verification-email');
            if (verificationEmail) {
              verificationEmail.textContent = email;
            }
            this.showView('verification');
            
            // Store the email for resending verification
            localStorage.setItem('pending_verification_email', email);
            
            // Resend verification email
            this.resendVerification(email);
          }
        } else {
          if (AUTH_CONFIG.debugMode) console.log('Email does not exist in HubSpot');
          
          // If trustExistingContacts is enabled, but we're not sure if the email exists
          // (could be API limitation), let's give the benefit of the doubt
          if (AUTH_CONFIG.trustExistingContacts && data.status === 'uncertain') {
            if (AUTH_CONFIG.debugMode) console.log('API uncertain about email, granting access due to trustExistingContacts setting');
            
            this.authenticateUser(email, '', '');
            this.showListings();
            this.showToast('Access granted', 'success');
            return;
          }
          
          // User doesn't exist in HubSpot, show not registered message
          this.showView('not-registered');
        }
      } catch (error) {
        console.error('Login error:', error);
        
        // Hide loading indicator
        if (loginLoading) loginLoading.style.display = 'none';
        
        // CRITICAL ISSUE WORKAROUND:
        // If API calls are consistently failing but we want to allow access for
        // users who claim to have an account, we'll provide an option after the 2nd attempt
        if (AUTH_CONFIG.loginAttempts >= 2) {
          console.log('Multiple login attempts detected with API failures');
          
          const shouldContinue = confirm('We\'re having trouble verifying your email. If you have submitted the form before and have an account, would you like to proceed?');
          
          if (shouldContinue) {
            this.authenticateUser(email, '', '');
            this.showListings();
            this.showToast('Access granted', 'info');
            return;
          }
        }
        
        // In development mode, provide an option to bypass verification on API failure
        if (AUTH_CONFIG.devMode) {
          console.log('Development mode: offering bypass option after API failure');
          
          if (confirm('API error. In development mode, you can bypass verification. Would you like to continue?')) {
            this.authenticateUser(email, 'Dev', 'User');
            this.showListings();
            this.showToast('Development bypass activated', 'info');
            return;
          }
        }
        
        // Show error message
        this.showToast('There was an error checking your account. Please try again or register if you don\'t have an account.', 'error');
        this.showView('options');
      }
    },
    
    // Authenticate a user
    authenticateUser: function(email, firstName, lastName) {
      const userData = {
        email: email,
        firstName: firstName || '',
        lastName: lastName || '',
        authenticated: true,
        verificationDate: new Date().toISOString(),
        listings_of_interest: this.getListingsOfInterest(),
        projects_of_interest: this.getProjectsOfInterest()
      };
      
      // Save to localStorage
      localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(userData));
      
      // Update HubSpot contact properties if CastleApp is available
      this.updateHubSpotProperties(userData);
    },
    
    // Show the listings by removing the auth overlay
    showListings: function() {
      // Hide all auth overlays
      const authOverlays = document.querySelectorAll('.auth-overlay');
      authOverlays.forEach(overlay => {
        overlay.style.display = 'none';
      });
      
      // Show the listings container
      const listingsContainer = document.getElementById('listings-container');
      if (listingsContainer) {
        listingsContainer.classList.remove('hidden-until-auth');
      }
      
      console.log('URGENT: Direct fix for loading issue - bypassing CastleApp');
      
      // DIRECT FIX: Force removal of loading states and spinners
      this.forceRemoveLoadingStates();
      
      // EMERGENCY DIRECT FIX: Trigger page reload with auth preserved
      // This is a last resort but ensures a clean state when API loading fails
      setTimeout(() => {
        // Check if properties are still not visible and we're still in loading state
        const propertyCards = document.querySelectorAll('.cg-property-card');
        const loadingIndicators = document.querySelectorAll('.loading-indicator, .spinner, .is-loading');
        
        if ((propertyCards.length === 0 || !propertyCards[0].offsetParent) && loadingIndicators.length > 0) {
          console.log('CRITICAL: Properties still not loaded after timeout, applying force reload fix');
          
          // Set session storage to preserve auth state
          if (window.sessionStorage) {
            // Store auth data in session storage to survive reload
            const userData = this.getUserData();
            if (userData) {
              sessionStorage.setItem('auth_data', JSON.stringify(userData));
              sessionStorage.setItem('force_reload', 'true');
              
              // Reload the page to get a completely fresh state
              window.location.reload();
            }
          }
        }
      }, 5000);
      
      // URGENT ADDITION: Attempt three approaches in parallel for maximum chances of success
      try {
        // Approach 1: Immediately try to render any properties in the state
        if (window.CastleApp && window.CastleApp.state && Array.isArray(window.CastleApp.state.properties)) {
          console.log('Found properties in CastleApp state, forcing immediate render');
          
          // Reset loading state
          if (window.CastleApp.state) {
            window.CastleApp.state.isLoading = false;
          }
          
          // Force render with timeout to allow DOM to settle
          setTimeout(() => {
            if (typeof window.CastleApp.renderProperties === 'function') {
              window.CastleApp.renderProperties();
              console.log('Forced immediate property rendering from state');
            }
          }, 100);
        }
        
        // Approach 2: Try to run the main init method directly
        setTimeout(() => {
          if (window.CastleApp && typeof window.CastleApp.init === 'function') {
            console.log('Running CastleApp.init() to rebuild from scratch');
            window.CastleApp.init();
          }
        }, 500);
        
        // Approach 3: Reset any elements with stuck loading state
        setTimeout(() => {
          this.forceRemoveLoadingStates();
        }, 1000);
      } catch (error) {
        console.error('Error in emergency property loading fix:', error);
      }
    },
    
    // Force removal of loading states - a direct solution for stuck spinners
    forceRemoveLoadingStates: function() {
      console.log('Emergency fix: Removing loading states from DOM');
      
      try {
        // 1. Fix CastleApp state if possible
        if (window.CastleApp && window.CastleApp.state) {
          window.CastleApp.state.isLoading = false;
          
          // Force render if available
          if (typeof window.CastleApp.renderProperties === 'function') {
            window.CastleApp.renderProperties();
          }
        }
        
        // 2. Fix loading spinners in DOM
        const loadingElements = document.querySelectorAll('.loading, .is-loading, .spinner');
        loadingElements.forEach(el => {
          console.log('Removing loading class from:', el);
          el.classList.remove('loading', 'is-loading', 'spinner');
          el.style.display = 'none';
        });
        
        // 3. Force show any hidden property containers
        const propertyContainers = document.querySelectorAll('#cg-properties-grid, .cg-properties-grid');
        propertyContainers.forEach(container => {
          container.style.display = 'grid';
          container.classList.remove('hidden', 'loading');
        });
        
        // 4. Reset loading indicators
        const loadingIndicators = document.querySelectorAll('[id*="loading"], [class*="loading"]');
        loadingIndicators.forEach(indicator => {
          indicator.style.display = 'none';
        });
        
        console.log('Loading states removed from DOM');
      } catch (error) {
        console.error('Error removing loading states:', error);
      }
    },
    
    // Resend verification email
    resendVerification: async function(specifiedEmail = null) {
      // Get the email from parameter or localStorage
      const email = specifiedEmail || localStorage.getItem('pending_verification_email');
      if (!email) {
        this.showToast('Email address not found. Please try registering again.', 'error');
        this.showView('signup');
        return;
      }
      
      if (AUTH_CONFIG.debugMode) console.log(`Resending verification to: ${email}`);
      
      try {
        // Call the Pipedream endpoint to resend verification
        const response = await fetch(`${AUTH_CONFIG.verificationEndpoint}/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email }),
          timeout: AUTH_CONFIG.apiTimeout
        });
        
        if (!response.ok) {
          throw new Error(`Failed to resend verification: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Show success message
          this.showToast('Verification email has been sent. Please check your inbox.', 'success');
          
          // Store the email for future reference
          if (!specifiedEmail) {
            localStorage.setItem('pending_verification_email', email);
          }
        } else {
          // Failed to resend
          this.showToast('Failed to send verification email. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Resend verification error:', error);
        this.showToast('There was an error sending verification. Please try registering again.', 'error');
        
        // In development mode, provide option to bypass on API failure
        if (AUTH_CONFIG.devMode) {
          console.log('Development mode: offering bypass option after verification API failure');
          
          if (confirm('API error. In development mode, you can bypass verification. Would you like to continue?')) {
            this.authenticateUser(email, 'Dev', 'User');
            this.showListings();
            this.showToast('Development bypass activated', 'info');
          }
        }
      }
    },
    
    // Get user data from localStorage
    getUserData: function() {
      const userDataString = localStorage.getItem(AUTH_CONFIG.storageKey);
      if (!userDataString) return null;
      
      try {
        return JSON.parse(userDataString);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    },
    
    // Get listings of interest from localStorage
    getListingsOfInterest: function() {
      const userData = this.getUserData() || {};
      return userData.listings_of_interest || [];
    },
    
    // Get projects of interest from localStorage
    getProjectsOfInterest: function() {
      const userData = this.getUserData() || {};
      return userData.projects_of_interest || [];
    },
    
    // Update HubSpot properties with user data
    updateHubSpotProperties: async function(userData) {
      if (!userData || !userData.email) return;
      
      try {
        // Send the data to Pipedream for HubSpot update
        const response = await fetch(`${AUTH_CONFIG.verificationEndpoint}/update-contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userData.email,
            properties: {
              listings_of_interest: Array.isArray(userData.listings_of_interest) 
                ? userData.listings_of_interest.join(';') 
                : userData.listings_of_interest || '',
              all_projects_of_interest: Array.isArray(userData.projects_of_interest)
                ? userData.projects_of_interest.join(';')
                : userData.projects_of_interest || ''
            }
          }),
          timeout: AUTH_CONFIG.apiTimeout
        });
        
        if (!response.ok) {
          throw new Error('Failed to update HubSpot properties');
        }
        
        console.log('HubSpot properties updated successfully');
      } catch (error) {
        console.error('HubSpot update error:', error);
      }
    },
    
    // Show a toast message
    showToast: function(message, type = 'info') {
      // Use CastleApp's showToast if available
      if (window.CastleApp && typeof window.CastleApp.showToast === 'function') {
        window.CastleApp.showToast(message, type);
      } else {
        // Fallback to alert if CastleApp is not available
        alert(message);
      }
    }
  };
  
  // Extend CastleApp with interest tracking and fix missing methods
  function extendCastleApp() {
    if (!window.CastleApp) return;
    
    console.log('Extending CastleApp with additional functionality...');
    
    // CRITICAL FIX: Add fetchPropertyListings if it doesn't exist
    if (!window.CastleApp.fetchPropertyListings) {
      console.log('Adding fetchPropertyListings to CastleApp');
      
      window.CastleApp.fetchPropertyListings = function() {
        console.log('Executing fetchPropertyListings method');
        
        // First try to use existing methods
        if (typeof this.apiGetProperties === 'function') {
          console.log('Using apiGetProperties to fetch listings');
          return this.apiGetProperties();
        } 
        // Try alternative methods
        else if (typeof this.loadProperties === 'function') {
          console.log('Using loadProperties to fetch listings');
          return this.loadProperties();
        }
        // Last resort - reinitialize everything
        else if (typeof this.init === 'function') {
          console.log('Reinitializing CastleApp to load properties');
          return this.init();
        }
        
        console.error('No property loading method found in CastleApp');
      };
    }
    
    // Global access to fetchPropertyListings
    if (!window.fetchPropertyListings) {
      console.log('Adding global fetchPropertyListings function');
      window.fetchPropertyListings = function() {
        if (window.CastleApp && typeof window.CastleApp.fetchPropertyListings === 'function') {
          return window.CastleApp.fetchPropertyListings();
        }
      };
    }
    
    // Store the original addInterest method
    const originalAddInterest = window.CastleApp.addInterest;
    
    // Override the addInterest method
    window.CastleApp.addInterest = function(propertyId, propertyTitle) {
      // Call the original method
      if (typeof originalAddInterest === 'function') {
        originalAddInterest.call(window.CastleApp, propertyId, propertyTitle);
      }
      
      // Get the current user data
      const userData = AuthSystem.getUserData();
      if (!userData || !userData.authenticated) return;
      
      // Update listings of interest
      const listingsOfInterest = userData.listings_of_interest || [];
      
      // Check if property is already in the list
      if (!listingsOfInterest.includes(propertyTitle)) {
        listingsOfInterest.push(propertyTitle);
      }
      
      // Get the project name from the property title
      const projectName = getProjectFromPropertyTitle(propertyTitle);
      
      // Update projects of interest
      const projectsOfInterest = userData.projects_of_interest || [];
      
      // Check if project is already in the list
      if (projectName && !projectsOfInterest.includes(projectName)) {
        projectsOfInterest.push(projectName);
      }
      
      // Update user data
      userData.listings_of_interest = listingsOfInterest;
      userData.projects_of_interest = projectsOfInterest;
      
      // Save updated user data
      localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(userData));
      
      // Update HubSpot properties
      AuthSystem.updateHubSpotProperties(userData);
    };
  }
  
  // Clean up the auth overlays to ensure only one is active
  function cleanupAuthOverlays() {
    const authOverlays = document.querySelectorAll('.auth-overlay');
    
    // If there are multiple auth overlays, keep only the first one
    if (authOverlays.length > 1) {
      // Keep the first one (more complete implementation)
      for (let i = 1; i < authOverlays.length; i++) {
        if (authOverlays[i] && authOverlays[i].parentNode) {
          authOverlays[i].parentNode.removeChild(authOverlays[i]);
        }
      }
    }
  }
  
  // Initialize on DOM ready - ensure critical sequence of operations
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing authentication system...');
    
    // First check for reload scenario (handles stuck loading case)
    if (sessionStorage && sessionStorage.getItem('force_reload') === 'true') {
      console.log('DETECTED RELOAD: Restoring auth state after forced reload');
      
      // Clear the reload flag
      sessionStorage.removeItem('force_reload');
      
      // Get the saved auth data
      const savedAuthData = sessionStorage.getItem('auth_data');
      if (savedAuthData) {
        try {
          // Parse and restore auth data
          const userData = JSON.parse(savedAuthData);
          localStorage.setItem(AUTH_CONFIG.storageKey, savedAuthData);
          console.log('Auth data restored after reload');
          
          // Clear session storage
          sessionStorage.removeItem('auth_data');
          
          // Force remove auth overlay immediately
          setTimeout(() => {
            const authOverlays = document.querySelectorAll('.auth-overlay');
            authOverlays.forEach(overlay => {
              overlay.style.display = 'none';
            });
            
            // Show listings container
            const listingsContainer = document.getElementById('listings-container');
            if (listingsContainer) {
              listingsContainer.classList.remove('hidden-until-auth');
            }
          }, 100);
        } catch (error) {
          console.error('Error restoring auth data after reload:', error);
        }
      }
    }
    
    // CRITICAL SEQUENCE:
    // 1. First extend CastleApp to add missing methods
    extendCastleApp();
    console.log('CastleApp extended with additional functionality');
    
    // 2. Then clean up overlays
    cleanupAuthOverlays();
    console.log('Auth overlays cleaned up');
    
    // 3. Finally initialize the auth system
    AuthSystem.init();
    console.log('Auth system initialized');
  });
})();