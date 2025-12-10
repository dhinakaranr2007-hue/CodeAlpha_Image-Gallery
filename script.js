// --- Global Variables and Utility Functions (Placed outside DOMContentLoaded) ---

// Global variable for Focus Management (Accessibility)
let lastFocusedElement; 

// Debounce function limits how often a function can run (Performance)
const debounce = (func, delay) => {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Element Selection ---
    const galleryContainer = document.getElementById('gallery-container');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // NEW: Select the lightbox caption element
    const lightboxCaption = document.getElementById('lightbox-caption'); 

    // Collect all image elements for initial navigation array
    const allGalleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    let currentVisibleImages = allGalleryItems; // Array of items currently visible
    let currentImageIndex = 0;

    // --- Advanced: Staggered Load Animation ---
    allGalleryItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`; 
        item.style.opacity = '1';
    });


    // --- Advanced: Image Preloading for Performance ---
    const preloadImage = (index) => {
        let nextIndex = (index + 2) % currentVisibleImages.length; 
        
        if (currentVisibleImages[nextIndex]) {
            const imgElement = currentVisibleImages[nextIndex].querySelector('.gallery-img');
            const tempImg = new Image();
            tempImg.src = imgElement.src; // Triggers browser caching
        }
    };


    // --- Navigation Logic ---
    const updateLightboxImage = () => {
        // Ensure index wraps around (circular navigation)
        if (currentImageIndex < 0) {
            currentImageIndex = currentVisibleImages.length - 1;
        } else if (currentImageIndex >= currentVisibleImages.length) {
            currentImageIndex = 0;
        }
        
        const currentItem = currentVisibleImages[currentImageIndex];
        const currentImgSrc = currentItem.querySelector('.gallery-img').src;
        const currentImgAlt = currentItem.querySelector('.gallery-img').alt;

        lightboxImg.src = currentImgSrc;
        lightboxImg.alt = currentImgAlt;
        
        // NEW FEATURE: Update the caption text using the alt attribute
        lightboxCaption.textContent = currentImgAlt; 

        // Call preloading function
        preloadImage(currentImageIndex);
    };

    prevBtn.addEventListener('click', () => {
        currentImageIndex--;
        updateLightboxImage();
    });

    nextBtn.addEventListener('click', () => {
        currentImageIndex++;
        updateLightboxImage();
    });

    
    // --- Lightbox Close Function (Handles Focus Management) ---
    const closeLightbox = () => {
        lightbox.style.display = "none";
        // Return focus to the element that was previously active (the thumbnail)
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    };

    // Close Lightbox listener
    closeBtn.addEventListener('click', closeLightbox);
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    
    // --- Lightbox Open Function (Handles Focus Management) ---
    galleryContainer.addEventListener('click', (e) => {
        // Target the inner image but use the parent item for tracking
        if (e.target.classList.contains('gallery-img')) {
            const clickedItem = e.target.closest('.gallery-item');
            
            // 1. Store the element that was focused before the modal opened
            lastFocusedElement = document.activeElement; 
            
            lightbox.style.display = "block";

            // 2. Move focus to the close button (for easy closing via keyboard)
            closeBtn.focus();
            
            // Recalculate the array of visible images
            currentVisibleImages = allGalleryItems.filter(item => !item.classList.contains('hidden'));
            
            // Find the index of the clicked image for navigation
            currentImageIndex = currentVisibleImages.findIndex(item => item === clickedItem);
            
            updateLightboxImage();
        }
    });


    // --- Category Filtering (Fixed Smooth Fade + Grid Reflow) ---

    // Define the core filter function separately
    const applyFilter = (filterValue) => {
        // NEW FEATURE: 1. Set the loading state visually (CSS transition handles the opacity fade)
        galleryContainer.classList.add('is-loading'); 
        
        // Update active button state
        filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.filter-btn[data-filter="${filterValue}"]`).classList.add('active');

        // 2. Filter the items
        allGalleryItems.forEach(item => {
            const img = item.querySelector('.gallery-img');
            const imgCategory = img.getAttribute('data-category');

            if (filterValue === 'all' || imgCategory === filterValue) {
                // Show the item
                item.classList.remove('hidden');
                item.style.opacity = '1';
            } else {
                // Hide the item with a delay to allow the fade-out transition (0.4s from CSS)
                
                // Step A: Immediately start the fade out by setting opacity to 0
                item.style.opacity = '0';
                
                // Step B: After the fade-out duration (400ms from CSS), apply the 'hidden' class 
                // which contains 'display: none' to force grid reflow and hide completely.
                setTimeout(() => {
                    item.classList.add('hidden');
                }, 400); 
            }
        });

        // 3. Update the visible images array after filtering
        currentVisibleImages = allGalleryItems.filter(item => !item.classList.contains('hidden'));
        
        // 4. Delay the removal of the loading state and scrolling 
        // This ensures the 400ms fade-out completes before the grid reflows and scrolls.
        setTimeout(() => {
            galleryContainer.classList.remove('is-loading');
            
            // NEW FEATURE: Smooth scroll to the top of the gallery container
            galleryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        }, 500); // 500ms covers the 400ms transition time + a small buffer.
    };

    // Create a debounced version of the filter application
    const debouncedApplyFilter = debounce(applyFilter, 200);

    // Update your event listener to use the debounced function
    filterBtns.forEach(button => {
        button.addEventListener('click', (e) => {
            const filterValue = e.target.getAttribute('data-filter');
            // Use debounced function
            debouncedApplyFilter(filterValue);
        });
    });


    // --- Keyboard Navigation (A11Y and UX) ---
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                prevBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextBtn.click();
            } else if (e.key === 'Escape') {
                closeLightbox(); // Use the closeLightbox function
            }
        }
    });

});