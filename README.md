# Listing Directory HubSpot Integration - Enhanced API Version

This guide explains how to set up HubSpot to capture leads from the property listings directory.

## API Integration Improvements

The enhanced version includes several improvements to API integration:

- More robust error handling for API calls
- Enhanced debugging tools to diagnose API issues
- Cache management for real property data
- Visual indicators for API call status
- Protection against sample data fallback
- Debug panel for API response inspection

## HubSpot Setup Instructions

### 1. Create Custom Properties

Create the following custom properties in HubSpot:

| Property Name | Field Type | Description |
|--------------|------------|-------------|
| `cg_verification_token` | Single-line text | Stores verification token for email verification |
| `cg_verification_link` | Single-line text | Full verification link sent in emails |
| `cg_needs_verification` | Yes/No | Indicates if contact needs verification |
| `cg_verified` | Yes/No | Whether contact has been verified |
| `cg_verification_date` | Date | When verification occurred |
| `cg_listings_of_interest` | Multi-line text | Stores property listings the user has shown interest in (one per line) |
| `notes_last_updated` | Date | Tracks the last activity date |

### 2. Create Multi-Checkbox Field

Create a multi-checkbox field called `all_projects_of_interest` with the following options:

1. Ashton Gardens
2. Bloomfield
3. Botanica
4. Garfield Grange
5. One FairWay
6. Paddington Estate
7. Park Avenue 
8. Park Avenue II
9. River Oaks
10. Rivière
11. The Grace
12. The Rouse Hill Estate 
13. Valley Rise
14. 30-32 Advance St
15. Ed.Ave (350 Edmondson Ave)
16. 172 Guntawong Rd
17. 627 Windsor Rd
18. 567 Windsor Rd
19. 505-535 Fifteenth Ave
20. 155 Boyd St
21. General Enquiry
22. cg_castle_luxe

### 3. Create Verification Email

1. Create an email template in HubSpot Marketing
2. Add a button with the verification link: `{{% cg_verification_link %}}`
3. Add your email template ID to the code configuration

### 4. Create Verification Workflow

1. Create a workflow triggered when `cg_needs_verification = Yes`
2. Action: Send email using your template
3. Add email reminder after 15 minutes if still unverified

## Code Implementation Notes

The implementation uses:

- HubSpot Forms API for submitting lead data
- HubSpot tracking API for event tracking
- Custom properties to track verification status
- Multi-checkbox field for project tracking
- Multi-line text field for detailed listings interest

For multiple listings of interest, each new inquiry adds the property to both:
1. `all_projects_of_interest` checkbox field
2. `cg_listings_of_interest` text field (as a new line)

This allows you to see both a summary of which projects interest the lead and specific property details.