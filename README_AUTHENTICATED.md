# Authenticated Property Listings

This implementation adds authentication to the property listings, requiring users to sign up through a HubSpot form before they can view the property listings.

## How It Works

1. When a user visits the page, they are presented with a HubSpot form overlay
2. The property listings are initially hidden from view (with CSS)
3. When the user submits the form through HubSpot:
   - Their information is stored in localStorage
   - The form overlay is hidden
   - The property listings are displayed
4. On subsequent visits, the user's authentication status is checked
   - If authenticated, they see the listings immediately
   - If not authenticated, they see the form again

## Features

- **Multiple Form Display Options:**
  - Uses HubSpot Forms API (primary method)
  - Falls back to embedded iframe if API fails
  - Has an ultimate fallback to a basic form if all else fails

- **Persistent Authentication:**
  - Uses localStorage to remember authenticated users
  - No need to re-authenticate on every visit

- **Tracking Integration:**
  - Records favorites, comparisons, and unfavorites
  - Maps properties to projects according to requirements
  - Stores user interaction data locally

## Files

- `authenticated_listings.html` - Use this file for the authenticated version of property listings

## Technical Implementation Notes

1. Authentication is handled client-side through localStorage
2. The HubSpot form is displayed using an overlay with z-index
3. Multiple fallback mechanisms ensure users can always authenticate
4. Property interest tracking works just like in the non-authenticated version

## Configuration

The HubSpot configuration is already set with:
- Portal ID: 24160521
- Form ID: a00f1f67-1490-44a7-a571-142da5377383
- Form URL: https://share.hsforms.com/1oA8fZxSQRKelcRQtpTdzgwedudl

## Testing Notes

- To test re-authentication, clear your browser's localStorage
- The fallback "Continue to Listings" button appears after 10 seconds if the form submission can't be automatically detected