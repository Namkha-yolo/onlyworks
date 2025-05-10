// Simple animations for Partime website
document.addEventListener('DOMContentLoaded', function() {
  // Animate sections on scroll
  animateSectionsOnScroll();
  
  // Add hover effects to interactive elements
  addHoverEffects();
  
  // Animate form sections if they exist
  animateFormSections();
});

// Animate sections when they come into view
function animateSectionsOnScroll() {
  // Elements to animate
  const elementsToAnimate = {
    '.feature-card': 'fadeInUp',
    '.job-card': 'fadeInUp',
    '.testimonial': 'fadeInUp',
    '.cta-title': 'fadeInUp',
    '.cta-subtitle': 'fadeInUp',
    '.btn-cta': 'pulse'
  };
  
  // Create observers for each type of element
  for (const [selector, animation] of Object.entries(elementsToAnimate)) {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length === 0) continue;
    
    // Set initial state
    elements.forEach(element => {
      element.style.opacity = '0';
      if (animation === 'fadeInUp') {
        element.style.transform = 'translateY(20px)';
      }
    });
    
    // Create observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Add animation with delay based on index
          const index = Array.from(elements).indexOf(element);
          setTimeout(() => {
            element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            element.style.opacity = '1';
            if (animation === 'fadeInUp') {
              element.style.transform = 'translateY(0)';
            } else if (animation === 'pulse') {
              element.classList.add('pulse');
              setTimeout(() => element.classList.remove('pulse'), 1000);
            }
          }, index * 100);
          
          // Unobserve after animation
          observer.unobserve(element);
        }
      });
    }, { threshold: 0.2 });
    
    // Observe elements
    elements.forEach(element => observer.observe(element));
  }
}

// Add hover effects to interactive elements
function addHoverEffects() {
  // Add hover effects to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-3px)';
      this.style.boxShadow = 'var(--shadow-lg)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
    });
  });
  
  // Add hover effects to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px)';
      this.style.boxShadow = 'var(--shadow-lg)';
      this.style.borderColor = 'var(--primary)';
      
      // Change icon color
      const icon = this.querySelector('.feature-icon');
      if (icon) {
        icon.style.backgroundColor = 'var(--primary)';
        icon.style.color = 'var(--white)';
      }
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
      this.style.borderColor = '';
      
      // Reset icon color
      const icon = this.querySelector('.feature-icon');
      if (icon) {
        icon.style.backgroundColor = '';
        icon.style.color = '';
      }
    });
  });
  
  // Add hover effects to job cards
  const jobCards = document.querySelectorAll('.job-card');
  jobCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = 'var(--shadow-lg)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
    });
  });
  
  // Add hover effects to testimonials
  const testimonials = document.querySelectorAll('.testimonial');
  testimonials.forEach(testimonial => {
    testimonial.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = 'var(--shadow)';
      this.style.backgroundColor = 'var(--white)';
    });
    
    testimonial.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
      this.style.backgroundColor = '';
    });
  });
  
  // Add hover effects to social icons
  const socialIcons = document.querySelectorAll('.social-icon');
  socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-3px)';
      this.style.backgroundColor = 'var(--primary)';
      this.style.color = 'var(--white)';
    });
    
    icon.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.backgroundColor = '';
      this.style.color = '';
    });
  });
}

// Animate form sections
function animateFormSections() {
  const formSections = document.querySelectorAll('.form-section');
  
  if (formSections.length === 0) return;
  
  formSections.forEach((section, index) => {
    // Set initial state
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    
    // Animate with delay based on index
    setTimeout(() => {
      section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, 300 + (index * 150));
  });
  
  // Animate form inputs on focus
  const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 0 0 3px var(--primary-lighter)';
      this.style.borderColor = 'var(--primary)';
    });
    
    input.addEventListener('blur', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
      this.style.borderColor = '';
    });
  });
  
  // Animate form check labels
  const formCheckLabels = document.querySelectorAll('.form-check-label, .day-label');
  formCheckLabels.forEach(label => {
    label.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.borderColor = 'var(--primary)';
    });
    
    label.addEventListener('mouseleave', function() {
      if (!this.previousElementSibling.checked) {
        this.style.transform = '';
        this.style.borderColor = '';
      }
    });
  });
}

// Create scrolling parallax effect for hero section
function createParallaxEffect() {
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;
  
  window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    
    // Move hero text and image at different speeds
    const heroText = document.querySelector('.hero-text');
    const heroImg = document.querySelector('.hero-img');
    
    if (heroText && heroImg) {
      heroText.style.transform = `translateY(${scrollPosition * 0.1}px)`;
      heroImg.style.transform = `translateY(${scrollPosition * 0.05}px)`;
    }
  });
}

// Add typing animation to CTA title
function addTypingAnimation() {
  const ctaTitle = document.querySelector('.cta-title');
  if (!ctaTitle) return;
  
  const text = ctaTitle.textContent;
  ctaTitle.textContent = '';
  ctaTitle.style.borderRight = '2px solid white';
  
  let i = 0;
  const typeWriter = function() {
    if (i < text.length) {
      ctaTitle.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 50);
    } else {
      ctaTitle.style.borderRight = 'none';
    }
  };
  
  // Create intersection observer to start typing animation when in view
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      typeWriter();
      observer.unobserve(ctaTitle);
    }
  }, { threshold: 0.5 });
  
  observer.observe(ctaTitle);
}

// Show confetti effect (used in form submission)
function showConfetti() {
  const colors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444'];
  
  for (let i = 0; i < 100; i++) {
    createConfettiPiece(colors);
  }
}

// Create a single confetti piece
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

// Add scroll indicator to hero section
function addScrollIndicator() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'scroll-indicator';
  scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i>';
  scrollIndicator.addEventListener('click', function() {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  });
  
  hero.appendChild(scrollIndicator);
}