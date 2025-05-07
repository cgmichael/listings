// Function to show login form
function showLoginForm() {
  // Create login form if it doesn't exist
  if (!document.getElementById('login-overlay')) {
    const loginHTML = `
    <div id="login-overlay" class="cg-overlay" style="display: none;">
      <div class="cg-overlay-content login-content">
        <div class="cg-overlay-header">
          <h2>Account Required</h2>
        </div>
        
        <div class="cg-overlay-body">
          <div class="auth-tabs">
            <button class="auth-tab-btn active" data-tab="login">Login</button>
            <button class="auth-tab-btn" data-tab="register">Register</button>
          </div>
          
          <div class="auth-tab-content" id="login-tab">
            <form id="login-form" class="cg-form">
              <div class="form-group">
                <label for="login-email">Email Address</label>
                <input type="email" id="login-email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" name="password" required>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="cg-button">Login</button>
              </div>
              
              <div id="login-error" class="error-message"></div>
            </form>
          </div>
          
          <div class="auth-tab-content" id="register-tab" style="display: none;">
            <form id="register-form" class="cg-form">
              <div class="form-group">
                <label for="register-firstname">First Name</label>
                <input type="text" id="register-firstname" name="firstName" required>
              </div>
              
              <div class="form-group">
                <label for="register-lastname">Last Name</label>
                <input type="text" id="register-lastname" name="lastName" required>
              </div>
              
              <div class="form-group">
                <label for="register-email">Email Address</label>
                <input type="email" id="register-email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="register-phone">Phone Number</label>
                <input type="tel" id="register-phone" name="phone">
              </div>
              
              <div class="form-group">
                <label for="register-password">Password</label>
                <input type="password" id="register-password" name="password" required>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="cg-button">Register</button>
              </div>
              
              <div id="register-error" class="error-message"></div>
            </form>
          </div>
        </div>
      </div>
    </div>`;
    
    // Append to body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = loginHTML;
    document.body.appendChild(tempDiv.firstElementChild);
    
    // Set up tab switching
    document.querySelectorAll('.auth-tab-btn').forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.auth-tab-content').forEach(content => {
          content.style.display = 'none';
        });
        
        // Show selected tab content
        const tabId = this.getAttribute('data-tab') + '-tab';
        document.getElementById(tabId).style.display = 'block';
      });
    });
    
    // Set up form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      processAuthForm(formData, false);
    });
    
    document.getElementById('register-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      processAuthForm(formData, true);
    });
  }
  
  // Show the login overlay
  document.getElementById('login-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Hide login overlay
function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  }
}