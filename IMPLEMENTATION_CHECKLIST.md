# HubSpot Integration Implementation Checklist

## 1. HubSpot Property Configuration

- [ ] Log into HubSpot portal (ID: 24160521)
- [ ] Create custom contact properties:
  - [ ] `cg_listings_of_interest`: Multi-line text field
  - [ ] `all_projects_of_interest`: Multiple checkbox field with 22 project options
  - [ ] `cg_verification_token`: Single-line text field
  - [ ] `cg_verification_link`: Single-line text field
  - [ ] `cg_needs_verification`: Yes/No dropdown field
  - [ ] `cg_verified`: Yes/No dropdown field
  - [ ] `cg_verification_date`: Date field
  - [ ] `notes_last_updated`: Date field

## 2. Email Verification Setup

- [ ] Create/update workflow
  - [ ] Trigger: Contact property `cg_needs_verification` equals "Yes"
  - [ ] Action: Send email using template ID 189778092695
  - [ ] Optional: 15-minute delay with reminder email
  - [ ] Activate workflow

## 3. User Authentication Integration

- [x] Store user data in localStorage after login:
```javascript
localStorage.setItem('cg-user', JSON.stringify({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  verified: true // Set based on verification status
}));
```

- [x] Add verification overlay HTML/CSS from verification-overlay.html

- [x] Add verification check after login:
```javascript
// After successful login
const user = getLoggedInUser();
if (user && user.email) {
  verifyHubSpotUser(user.email).then(result => {
    if (!result.verified) {
      showVerificationScreen(user.email);
    }
  });
}
```

- [x] Add URL verification parameter processing:
```javascript
// In initializeAuthenticationState function
const urlParams = new URLSearchParams(window.location.search);
const verifyToken = urlParams.get('verify');
  
if (verifyToken) {
  // Process verification token if present
  processVerification(verifyToken).then(() => {
    // Remove the token from URL to prevent reuse
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  });
}
```

- [x] Force authentication before viewing listings:
```javascript
// In initializeAuthenticationState function
const shouldRequireAuth = CONFIG.validation && CONFIG.validation.emailVerification;

// For required authentication, stop and show login form if no user
if (shouldRequireAuth && !userData) {
  // Show login/registration form
  showLoginForm();
  return; // Stop execution
}
```

## 4. Property Display Enhancement

- [ ] Ensure properties have a project field
- [ ] If not, extract project from title or another source
- [ ] Test project mapping with `getProjectFromPropertyTitle` function

## 5. Testing the Integration

- [ ] Test new user registration
  - [ ] Verify contact created in HubSpot
  - [ ] Check verification email delivery
  - [ ] Confirm verification link works
  
- [ ] Test property interactions
  - [ ] Favorite a property -> check `cg_listings_of_interest`
  - [ ] Unfavorite -> confirm removal from list
  - [ ] Compare properties -> check `all_projects_of_interest` checkbox
  
- [ ] Test form submission
  - [ ] Complete a form with existing email
  - [ ] Verify data merged properly in HubSpot

## 6. Troubleshooting Tips

- If verification emails aren't sending, check:
  - HubSpot workflow is activated
  - Email template ID is correct (189778092695)
  - `cg_needs_verification` is being set correctly
  
- If tracking not working, check:
  - HubSpot script is loading (check browser console)
  - User authentication is storing data properly
  - Form submissions are including the tracking cookie (hutk)

## 7. Contact Lookup Implementation (Optional)

- [ ] Set up a simple server endpoint that:
  - [ ] Authenticates requests with a token
  - [ ] Calls HubSpot API to get contact by email
  - [ ] Returns contact data in expected format
  
- [ ] Update CONFIG.apiEndpoint to point to your server

## Notes

- The email template ID (189778092695) is already configured in the code
- All client-side HubSpot integration code is already implemented
- This checklist focuses on HubSpot configuration and connecting existing auth