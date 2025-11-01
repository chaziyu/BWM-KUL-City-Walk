// Wait for the HTML document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GET MODAL ELEMENTS ---
    const siteModal = document.getElementById('siteModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalImage = document.getElementById('modalImage'); // Added image element
    const modalBuilt = document.getElementById('modalBuilt');
    const modalArchitects = document.getElementById('modalArchitects');
    const modalInfo = document.getElementById('modalInfo');
    const closeModal = document.getElementById('closeModal');

    // Function to close the modal
    const hideSiteInfo = () => siteModal.classList.add('hidden');
    
    // Add click event to the "close" button
    closeModal.addEventListener('click', hideSiteInfo);
    
    // Also close the modal if the user clicks the dark background
    siteModal.addEventListener('click', (e) => {
        if (e.target === siteModal) {
            hideSiteInfo();
        }
    });

    // --- 2. INITIALIZE THE MAP ---
    const map = L.map('map'); // Removed initial setView

    // Add the free OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // --- 3. MAKE IT "INTERACTIVE" (LOAD MARKERS & FOCUS MAP) ---
    fetch('data.json')
        .then(response => response.json())
        .then(sites => {
            const markers = []; // Array to store all marker coordinates
            
            sites.forEach(site => {
                const marker = L.marker(site.coordinates).addTo(map);
                markers.push(site.coordinates); // Add coordinates to array
                
                // Add a click event to each marker
                marker.on('click', () => {
                    // 1. Populate the modal with data from the JSON
                    modalTitle.textContent = `${site.id}. ${site.name}`;
                    
                    // Handle image: show if available, hide if not
                    if (site.imageUrl) {
                        modalImage.src = site.imageUrl;
                        modalImage.alt = site.name;
                        modalImage.classList.remove('hidden'); // Ensure image is visible
                        // Fallback in case image fails to load
                        modalImage.onerror = () => {
                            modalImage.src = "https://via.placeholder.com/400x250?text=Image+Not+Found";
                        };
                    } else {
                        modalImage.classList.add('hidden'); // Hide if no image URL
                    }

                    modalBuilt.textContent = site.built || "N/A";
                    modalArchitects.textContent = site.architects || "N/A";
                    modalInfo.textContent = site.info;
                    
                    // 2. Show the modal
                    siteModal.classList.remove('hidden');
                });
            });

            // --- Focus map on all markers after they are loaded ---
            if (markers.length > 0) {
                const bounds = L.latLngBounds(markers);
                map.fitBounds(bounds, { padding: [50, 50] }); // Add some padding
            }
        })
        .catch(error => console.error('Error loading heritage data:', error));

    // --- 4. ADD USER'S LIVE GPS LOCATION ---
    // This adds the "blue dot" to the map
    
    let userMarker = null; // To hold the user's location marker
    let userCircle = null; // To hold the user's accuracy circle

    function onLocationFound(e) {
        const radius = e.accuracy / 2;

        if (userMarker) { // If marker already exists, update its position
            userMarker.setLatLng(e.latlng);
            userCircle.setLatLng(e.latlng).setRadius(radius);
        } else { // Create marker and circle if they don't exist
            userMarker = L.marker(e.latlng).addTo(map)
                         .bindPopup("You are here.").openPopup();
            userCircle = L.circle(e.latlng, {
                radius: radius,
                color: '#007bff',
                fillColor: '#007bff',
                fillOpacity: 0.1
            }).addTo(map);
        }
        
        // Optionally, uncomment the line below to auto-follow the user
        // map.setView(e.latlng, 17);
    }

    function onLocationError(e) {
        console.error("Geolocation failed:", e.message);
        // You can add a visual indication to the user here if desired
    }

    // Start watching the user's position
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    map.locate({
        watch: true,        // Continuously update location
        setView: false,     // Don't auto-center the map on the user on first load (we want it to focus on all sites)
        maxZoom: 18,
        enableHighAccuracy: true
    });
});
