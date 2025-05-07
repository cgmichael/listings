# HubSpot Implementation Guide for Property Listings

This guide outlines the required server-side implementations needed to fully enable HubSpot integration with your property listings directory.

## Required Server-Side Endpoints

### 1. Contact Retrieval Endpoint

Create a new API endpoint for retrieving contact data from HubSpot:

```
GET /hubspot/contact?email={email}
```

**Implementation Requirements:**
- Secure this endpoint with authentication (bearer token)
- Utilize the HubSpot API to fetch contact data
- Return contact properties including custom fields

**Sample Implementation (Node.js):**
```javascript
const hubspot = require('@hubspot/api-client');
const hubspotClient = new hubspot.Client({ apiKey: process.env.HUBSPOT_API_KEY });

app.get('/hubspot/contact', authMiddleware, async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Search for contact by email
    const contactsResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: email
        }]
      }]
    });
    
    if (contactsResponse.results && contactsResponse.results.length > 0) {
      const contact = contactsResponse.results[0];
      
      // Get all properties for this contact
      const contactDetail = await hubspotClient.crm.contacts.basicApi.getById(
        contact.id, 
        ['email', 'firstname', 'lastname', 'phone', 'cg_listings_of_interest', 'all_projects_of_interest', 'cg_verified', 'cg_needs_verification']
      );
      
      return res.json(contactDetail);
    }
    
    return res.status(404).json({ error: 'Contact not found' });
  } catch (error) {
    console.error('Error fetching HubSpot contact:', error);
    return res.status(500).json({ error: 'Error retrieving contact' });
  }
});
```

### 2. UTK Lookup Endpoint (Optional but Recommended)

Create an endpoint for looking up contacts by HubSpot User Token:

```
GET /hubspot/contact-by-utk?utk={hubspot_utk_cookie}
```

**Implementation Requirements:**
- Secure with authentication
- Use HubSpot's UTK APIs to find contact by cookie value

**Sample Implementation:**
```javascript
app.get('/hubspot/contact-by-utk', authMiddleware, async (req, res) => {
  try {
    const utk = req.query.utk;
    if (!utk) {
      return res.status(400).json({ error: 'UTK is required' });
    }
    
    // Use HubSpot API to get contact by UTK
    const response = await axios.get(
      `https://api.hubapi.com/contacts/v1/contact/utk/${utk}/profile`, 
      { headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` } }
    );
    
    if (response.data && response.data.properties) {
      return res.json({
        properties: {
          email: response.data.properties.email?.value,
          firstname: response.data.properties.firstname?.value,
          lastname: response.data.properties.lastname?.value,
          phone: response.data.properties.phone?.value,
          cg_verified: response.data.properties.cg_verified?.value,
          cg_listings_of_interest: response.data.properties.cg_listings_of_interest?.value
        }
      });
    }
    
    return res.status(404).json({ error: 'Contact not found' });
  } catch (error) {
    console.error('Error fetching HubSpot contact by UTK:', error);
    return res.status(500).json({ error: 'Error retrieving contact' });
  }
});
```

## Required HubSpot Setup

### 1. Custom Properties

Create the following custom contact properties in HubSpot:

| Property Name | Field Type | Description |
|--------------|------------|-------------|
| `cg_listings_of_interest` | Multi-line text | Stores property listings the user is interested in |
| `all_projects_of_interest` | Multiple checkboxes | Tracks which projects the user is interested in |
| `cg_verification_token` | Single-line text | Stores verification token for email verification |
| `cg_verification_link` | Single-line text | Full verification link sent in emails |
| `cg_needs_verification` | Yes/No | Indicates if contact needs verification |
| `cg_verified` | Yes/No | Whether contact has been verified |
| `cg_verification_date` | Date | When verification occurred |
| `notes_last_updated` | Date | Tracks last activity date |

### 2. HubSpot Workflow for Email Verification

Create a workflow in HubSpot with:

1. **Trigger**: When contact property `cg_needs_verification` = Yes
2. **Action**: Send email using the template with verification link
3. **Delay**: Optional 15-minute delay for reminder emails

## Authentication Integration

Ensure your authentication system:

1. Stores the authenticated user in:
   - `window.currentUser` or
   - `CastleApp.state.user` or
   - `localStorage` as 'cg-user'

2. Creates an access token for API calls:
   - Store in localStorage as 'listings_access_token'
   - Use for authentication with the `/hubspot/contact` endpoint

## Verification UI

Create a verification overlay screen with:
1. Message explaining verification is needed
2. Button to resend verification email
3. Call to check inbox and click the link

## Testing

After implementing the server-side components, test:

1. User registration with HubSpot contact creation
2. Property interest tracking (favorites and inquiries)
3. Unfavoriting to remove from listings_of_interest
4. Comparison tracking (should update project interest only)
5. Email verification flow

## Troubleshooting

Common issues:
1. CORS errors when calling HubSpot APIs
2. Authorization errors with HubSpot API keys
3. Form submissions failing due to missing required fields
4. Verification emails not sending

## Support

For questions on HubSpot integration, contact:
- HubSpot Developer Support: developers.hubspot.com
- API Documentation: developers.hubspot.com/docs/api/overview