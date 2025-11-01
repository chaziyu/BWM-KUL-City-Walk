document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL-ISH VARIABLES ---
    let allSitesData = [];
    let allMarkersLayer = L.layerGroup();
    let userLocation = null;

    // --- 2. GET ALL HTML ELEMENTS ---
    const map = L.map('map').setView([3.1483, 101.6938], 16); // Default view
    
    // Site Modal (for info)
    const siteModal = document.getElementById('siteModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalImage = document.getElementById('modalImage');
    const modalBuilt = document.getElementById('modalBuilt');
    const modalArchitects = document.getElementById('modalArchitects');
    const modalInfo = document.getElementById('modalInfo');
    const closeSiteModal = document.getElementById('closeSiteModal');

    // Search Bar
    const searchBox = document.getElementById('searchBox');
    const searchResults = document.getElementById('searchResults');

    // Filter Modal
    const filterModal = document.getElementById('filterModal');
    const openFilterButton = document.getElementById('openFilterButton');
    const closeFilterModal = document.getElementById('closeFilterModal');
    const filterContainer = document.getElementById('filterContainer');

    // "Find Closest" Button
    const findClosestButton = document.getElementById('findClosestButton');

    // --- 3. INITIALIZE THE MAP ---
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    allMarkersLayer.addTo(map);

    // --- 4. HELPER FUNCTIONS ---

    // Function to show the Site Info Modal
    function showSiteInfo(site) {
        modalTitle.textContent = `${site.id}. ${site.name}`;
        
        if (site.imageUrl) {
            modalImage.src = site.imageUrl;
            modalImage.alt = site.name;
            modalImage.classList.remove('hidden');
            modalImage.onerror = () => {
                modalImage.src = "https://via.placeholder.com/400x250?text=Image+Not+Found";
            };
        } else {
            modalImage.classList.add('hidden');
        }

        modalBuilt.textContent = site.built || "N/A";
        modalArchitects.textContent = site.architects || "N/A";
        modalInfo.textContent = site.info;
        
        // "Get Directions" code has been removed.

        siteModal.classList.remove('hidden');
    }
    const hideSiteInfo = () => siteModal.classList.add('hidden');

    // --- 5. LOAD ALL DATA AND SET UP FEATURES ---
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok. Check data.json for errors.');
            }
            return response.json();
        })
        .then(sites => {
            allSitesData = sites;
            let categories = new Set(); // To auto-find all categories

            sites.forEach(site => {
                // Add category to the set
                if (site.category) {
                    categories.add(site.category);
                }

                // Create marker and add to layer group
                const marker = L.marker(site.coordinates);
                marker.siteData = site; // Attach site data to marker
                
                marker.on('click', () => {
                    showSiteInfo(site);
                });
                
                allMarkersLayer.addLayer(marker);
            });

            // Focus map on all markers
            map.fitBounds(allMarkersLayer.getBounds(), { padding: [50, 50] });

            // --- 6. SET UP SEARCH BAR ---
            searchBox.addEventListener('keyup', (e) => {
                const query = e.target.value.toLowerCase();
                searchResults.innerHTML = '';
                searchResults.classList.add('hidden');

                if (query.length < 2) return;

                const results = allSitesData.filter(site => site.name.toLowerCase().includes(query));
                
                if (results.length > 0) {
                    searchResults.classList.remove('hidden');
                    results.forEach(site => {
                        const li = document.createElement('li');
                        li.className = 'p-2 hover:bg-gray-100 cursor-pointer';
                        li.textContent = `${site.id}. ${site.name}`;
                        li.onclick = () => {
                            map.setView(site.coordinates, 18);
                            showSiteInfo(site);
                            searchBox.value = '';
                            searchResults.classList.add('hidden');
                        };
                        searchResults.appendChild(li);
                    });
                }
            });

            // --- 7. SET UP FILTERS ---
            // Create filter checkboxes dynamically
            categories.forEach(category => {
                const label = document.createElement('label');
                label.className = 'flex items-center';
                label.innerHTML = `
                    <input type="checkbox" class="filter-checkbox" value="${category}" checked>
                    <span class="ml-2">${category}</span>
                `;
                filterContainer.appendChild(label);
            });
            
            // Add listener to all filter checkboxes
            filterContainer.addEventListener('change', (e) => {
                let selectedCategories = [];
                const checkboxes = filterContainer.querySelectorAll('.filter-checkbox');
                
                // Special "Show All" logic
                if (e.target.value === 'All') {
                    checkboxes.forEach(cb => cb.checked = e.target.checked);
                } else if (!e.target.checked) {
                    filterContainer.querySelector('.filter-checkbox[value="All"]').checked = false;
                }
                
                let allUnchecked = true;
                checkboxes.forEach(cb => {
                    if (cb.checked && cb.value !== 'All') {
                        selectedCategories.push(cb.value);
                        allUnchecked = false;
                    }
                });
                
                if (allUnchecked && !filterContainer.querySelector('.filter-checkbox[value="All"]').checked) {
                     filterContainer.querySelector('.filter-checkbox[value="All"]').checked = true;
                }

                if (filterContainer.querySelector('.filter-checkbox[value="All"]').checked) {
                    selectedCategories = Array.from(categories); // All categories
                }

                // Filter the markers
                allMarkersLayer.eachLayer(marker => {
                    if (selectedCategories.includes(marker.siteData.category)) {
                        marker.addTo(map);
                    } else {
                        marker.removeFrom(map);
                    }
                });
            });

            // --- 8. SET UP "FIND CLOSEST" ---
            findClosestButton.addEventListener('click', () => {
                if (!userLocation) {
                    alert("Please enable location services first.");
                    return;
                }
                
                let closestSite = null;
                let minDistance = Infinity;

                allSitesData.forEach(site => {
                    const siteLatLng = L.latLng(site.coordinates[0], site.coordinates[1]);
                    const distance = userLocation.distanceTo(siteLatLng);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestSite = site;
                    }
                });

                if (closestSite) {
                    map.setView(closestSite.coordinates, 18);
                    showSiteInfo(closestSite);
                }
            });
        })
        .catch(error => {
            console.error('CRITICAL ERROR: Could not load data.json.', error);
            alert('Error: Could not load heritage site data. Please check data.json for syntax errors.');
        });

    // --- 9. MODAL & BUTTON LISTENERS (that don't need data) ---
    
    // Site Modal
    closeSiteModal.addEventListener('click', hideSiteInfo);
    siteModal.addEventListener('click', (e) => {
        if (e.target === siteModal) hideSiteInfo();
    });

    // Filter Modal
    openFilterButton.addEventListener('click', () => filterModal.classList.remove('hidden'));
    closeFilterModal.addEventListener('click', () => filterModal.classList.add('hidden'));

    // --- 10. SETUP GEOLOCATION ---
    map.on('locationfound', (e) => {
        userLocation = e.latlng; // Store user's location
        const radius = e.accuracy / 2;
        
        // Create or update the user's marker
        if (map.hasLayer(L.marker.userMarker)) {
            L.marker.userMarker.setLatLng(e.latlng);
            L.circle.userCircle.setLatLng(e.latlng).setRadius(radius);
        } else {
            L.marker.userMarker = L.marker(e.latlng).addTo(map).bindPopup("You are here!");
            L.circle.userCircle = L.circle(e.latlng, {
                radius: radius,
                color: '#007bff',
                fillColor: '#007bff',
                fillOpacity: 0.1
            }).addTo(map);
        }
    });

    map.on('locationerror', (e) => {
        console.error(e.message);
        alert("Geolocation failed. 'Find Closest' will not work.");
    });

    map.locate({ watch: true, enableHighAccuracy: true });
});
