// Simple, clean form handler for registration page
document.addEventListener('DOMContentLoaded', function() {
  // Format phone numbers as user types
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', formatPhoneNumber);
  }
  
  // Handle hours per week slider
  const hoursRange = document.getElementById('hours-per-week');
  const hoursValue = document.querySelector('#hours-per-week + .range-value');
  if (hoursRange && hoursValue) {
    hoursRange.addEventListener('input', function() {
      hoursValue.textContent = `${this.value} hours/week`;
      hoursValue.classList.add('pulse');
      setTimeout(() => hoursValue.classList.remove('pulse'), 300);
    });
  }
  
  // Handle form submission
  const registrationForm = document.getElementById('registration-form');
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleFormSubmit);
  }
});

// Format phone number as (xxx) xxx-xxxx
function formatPhoneNumber(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 0) {
    if (value.length <= 3) {
      value = `(${value}`;
    } else if (value.length <= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    }
  }
  e.target.value = value;
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Validate the form
  if (!validateForm()) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  // Show loading state
  const submitButton = document.querySelector('.btn-submit');
  const originalButtonText = submitButton.innerHTML;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  submitButton.disabled = true;
  
  try {
    // Collect form data
    const formData = {
      personalInfo: {
        name: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        university: document.getElementById('university').value,
        fieldOfStudy: document.getElementById('field-of-study').value
      },
      availability: {
        days: Array.from(document.querySelectorAll('input[name="days"]:checked')).map(input => input.value),
        hoursPerWeek: document.getElementById('hours-per-week').value,
        locations: Array.from(document.querySelectorAll('input[name="location"]:checked')).map(input => input.value)
      },
      jobInterests: Array.from(document.querySelectorAll('input[name="job-types"]:checked')).map(input => input.value),
      additionalInfo: document.getElementById('career-goals').value,
      timestamp: new Date()
    };
    
    // Save to Firebase
    await db.collection('registrations').add(formData);
    
    // Show success message with animation
    document.getElementById('form-container').style.display = 'none';
    
    const successMessage = document.getElementById('success-message');
    successMessage.style.display = 'block';
    showConfetti();
    
  } catch (error) {
    console.error("Error saving data:", error);
    showNotification('Error submitting form. Please try again later.', 'error');
    
    // Reset button
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
  }
}

// Validate the form
function validateForm() {
  let isValid = true;
  
  // Check required fields
  const requiredFields = document.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    // Remove any existing error classes
    field.classList.remove('error');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
    
    // Check if field is empty
    if (field.type === 'checkbox') {
      if (!field.checked) {
        showFieldError(field, 'This field is required');
        isValid = false;
      }
    } else if (!field.value.trim()) {
      showFieldError(field, 'This field is required');
      isValid = false;
    } else if (field.type === 'email' && !isValidEmail(field.value)) {
      showFieldError(field, 'Please enter a valid email address');
      isValid = false;
    }
  });
  
  // Check if at least one day is selected
  const selectedDays = document.querySelectorAll('input[name="days"]:checked');
  if (selectedDays.length === 0) {
    const daysContainer = document.querySelector('.day-selector');
    showContainerError(daysContainer, 'Please select at least one day');
    isValid = false;
  }
  
  // Check if at least one job type is selected
  const selectedJobs = document.querySelectorAll('input[name="job-types"]:checked');
  if (selectedJobs.length === 0) {
    const jobsContainer = document.querySelector('input[name="job-types"]').closest('.form-check-group');
    showContainerError(jobsContainer, 'Please select at least one job type');
    isValid = false;
  }
  
  return isValid;
}

// Show error for form field
function showFieldError(field, message) {
  field.classList.add('error');
  
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  field.parentNode.appendChild(errorElement);
}

// Show error for container
function showContainerError(container, message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  container.appendChild(errorElement);
}

// Validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Add icon
  const icon = document.createElement('i');
  switch (type) {
    case 'error':
      icon.className = 'fas fa-exclamation-circle';
      break;
    case 'success':
      icon.className = 'fas fa-check-circle';
      break;
    case 'warning':
      icon.className = 'fas fa-exclamation-triangle';
      break;
    default:
      icon.className = 'fas fa-info-circle';
  }
  
  notification.appendChild(icon);
  
  // Add message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Create confetti effect
function showConfetti() {
  const colors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444'];
  
  for (let i = 0; i < 100; i++) {
    createConfettiPiece(colors);
  }
}

function createConfettiPiece(colors) {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  
  // Random properties
  const size = Math.random() * 10 + 5;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const duration = Math.random() * 3 + 2;
  
  confetti.style.width = `${size}px`;
  confetti.style.height = `${size}px`;
  confetti.style.backgroundColor = color;
  confetti.style.left = `${left}vw`;
  confetti.style.animationDuration = `${duration}s`;
  
  document.body.appendChild(confetti);
  
  // Remove after animation completes
  setTimeout(() => confetti.remove(), duration * 1000);
}