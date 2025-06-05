// Unified Theme JavaScript
// This script enhances the theme functionality

document.addEventListener('DOMContentLoaded', function() {
    // Add scroll effect to header
    const header = document.querySelector('#header, header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Enhanced mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            document.body.classList.toggle('mobile-menu-open');
            
            // Create overlay if it doesn't exist
            if (!document.querySelector('.mobile-menu-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'mobile-menu-overlay';
                overlay.addEventListener('click', function() {
                    document.body.classList.remove('mobile-menu-open');
                });
                document.body.appendChild(overlay);
            }
        });
    }
    
    // Add scroll to top button
    const scrollToTop = document.createElement('div');
    scrollToTop.className = 'scroll-to-top';
    scrollToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollToTop);
    
    scrollToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTop.classList.add('visible');
        } else {
            scrollToTop.classList.remove('visible');
        }
    });
    
    // Add animation to elements on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .job-card, .testimonial, .form-container');
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0;
            
            if (isVisible && !element.classList.contains('animated')) {
                element.classList.add('animated');
                element.style.animationDelay = Math.random() * 0.3 + 's';
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Initial check
    
    // Enhanced form interactions
    const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
    formInputs.forEach(input => {
        // Add floating label effect
        if (input.value) {
            input.classList.add('has-value');
        }
        
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add hover effect to cards
    const cards = document.querySelectorAll('.feature-card, .job-card, .testimonial, .form-container');
    cards.forEach(card => {
        card.classList.add('card-hover-effect');
    });
    
    // Enhanced range slider
    const rangeSliders = document.querySelectorAll('.form-slider');
    rangeSliders.forEach(slider => {
        const updateSlider = function() {
            const value = slider.value;
            const min = slider.min || 0;
            const max = slider.max || 100;
            const percentage = ((value - min) / (max - min)) * 100;
            
            slider.style.background = `linear-gradient(to right, var(--primary-purple) 0%, var(--primary-purple) ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
        };
        
        slider.addEventListener('input', updateSlider);
        updateSlider(); // Initial update
    });
    
    // Add loading state to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('.btn-submit');
            if (submitButton && !submitButton.disabled) {
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<span class="loading"></span> Processing...';
                submitButton.disabled = true;
                
                // Store original text for restoration if needed
                submitButton.dataset.originalText = originalText;
            }
        });
    });
    
    // Add tooltips
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.classList.add('tooltip');
    });
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        });
    }
});

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        animation: rippleEffect 0.6s ease-out;
    }
    
    @keyframes rippleEffect {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animated {
        animation: fadeIn 0.6s ease-out forwards;
    }
`;
document.head.appendChild(style);
