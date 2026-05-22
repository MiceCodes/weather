//Configuration
const API_KEY = "42f8a6a63e007b592d7d4d126207971e";

// Global Elements
const searchInput = document.querySelector('input[type="search"]');
const searchBtn = document.querySelector('button[type="submit"]');
const navDropdown = document.getElementById('navigation-dropdown');

// Home Page Elements
const locationEl = document.querySelector('.location');
const dateEl = document.querySelector('.date');
const tempEl = document.querySelector('.temperature');
const conditionEl = document.querySelector('.condition');
const iconEl = document.querySelector('.weather-icon');
const detailValues = document.querySelectorAll('.detail-item .value');
const humidityEl = detailValues ? detailValues[0] : null;
const windEl = detailValues ? detailValues[1] : null;
const waterTempEl = detailValues ? detailValues[2] : null;

// Settings Page Elements
const themeRadios = document.querySelectorAll('input[name="theme"]');
const unitRadios = document.querySelectorAll('input[name="temp-unit"]');

// Warnings Page Elements
const warningsList = document.getElementById('warnings-list');

// Year Module Elements
const yearSelect = document.getElementById('year-select');
const yearDisplay = document.getElementById('yearly-data-display');

// Map Page Elements
const mapContainer = document.getElementById('weather-map');

//Home Page Logic
async function getWeatherData(city) {
    // Check localStorage to see if the user selected Fahrenheit in the settings
    const savedUnit = localStorage.getItem('unit') || 'metric';
    
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${savedUnit}&appid=${API_KEY}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        updateUI(data);
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Could not fetch weather data. Please check the city name and try again.");
    }
}

function updateUI(data) {
    if (!locationEl) return; // Exit if not on home page
    
    // Inject text data
    locationEl.textContent = data.name;
    tempEl.textContent = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    conditionEl.textContent = desc.charAt(0).toUpperCase() + desc.slice(1);
    
    //Custom Local Image Logic
    // Grab the main overarching condition from the API (e.g., "Clear", "Clouds")
    const mainCondition = data.weather[0].main;
    let imageFileName = 'Sunny.jpg'; // Set a default fallback image

    // Map the API condition to your exact local filenames
    switch (mainCondition) {
        case 'Clear':
            imageFileName = 'Sunny.jpg';
            break;
        case 'Clouds':
            imageFileName = 'Cloudy.jpg';
            break;
        case 'Rain':
        case 'Drizzle':
            imageFileName = 'Rain.jpg';
            break;
        case 'Thunderstorm':
            imageFileName = 'Thunderstorm.jpg';
            break;
        case 'Snow':
            imageFileName = 'Snow.jpg';
            break;
        case 'Mist':
        case 'Smoke':
        case 'Haze':
        case 'Dust':
        case 'Fog':
            imageFileName = 'Fog.jpg';
            break;
    }
    // (10 m/s is roughly 36 km/h, which is quite breezy)
    if (data.wind.speed > 10) {
        imageFileName = 'Windy.jpg';
    }

    // Point the image source to the local folder
    iconEl.src = `images/${imageFileName}`;
    iconEl.alt = desc;

    // Inject extra details
    humidityEl.textContent = `${data.main.humidity}%`;
    
    const savedUnit = localStorage.getItem('unit') || 'metric';
    
    if (savedUnit === 'metric') {
        // Multiply by 3.6 and round to the nearest whole number
        const windKmh = Math.round(data.wind.speed * 3.6);
        windEl.textContent = `${windKmh} km/h`;
    } else {
        // Keep mph if the user selected Fahrenheit in settings
        windEl.textContent = `${data.wind.speed} mph`;
    }
    waterTempEl.textContent = `${Math.round(data.main.temp - 3)} °C`;

    const alertBanner = document.getElementById('home-alert-banner');
    
    if (alertBanner) {
        alertBanner.style.display = 'none'; // Hide it by default on every new search
        
        // Trigger 1: Very high winds (greater than 15 m/s or roughly 55 km/h)
        if (data.wind.speed > 15) {
            alertBanner.textContent = "HIGH WIND WARNING: Secure loose outdoor objects.";
            alertBanner.style.display = 'block';
        } 
        // Trigger 2: Dangerous conditions like Thunderstorms or Snow
        else if (mainCondition === 'Thunderstorm' || mainCondition === 'Tornado') {
            alertBanner.textContent = `SEVERE WEATHER ALERT: ${desc.toUpperCase()}`;
            alertBanner.style.display = 'block';
        }
        // Trigger 3: Extreme Heat (over 35°C)
        else if (data.main.temp > 35) {
            alertBanner.textContent = "EXTREME HEAT ADVISORY: Stay hydrated and indoors.";
            alertBanner.style.display = 'block';
        }
    }

}

function setDate() {
    if (!dateEl) return; 
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString(undefined, options);
}


// Settings Page Logic
function initSettings() {
    //Apply global theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');

    //wire up the buttons of the settings page
    if (themeRadios.length > 0) {
        const savedUnit = localStorage.getItem('unit') || 'metric';
        
        // Visually check the correct radio buttons based on saved data
        document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
        document.querySelector(`input[name="temp-unit"][value="${savedUnit}"]`).checked = true;

        // Listen for theme changes
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                localStorage.setItem('theme', e.target.value);
                if (e.target.value === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            });
        });

        // Listen for unit changes
        unitRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                localStorage.setItem('unit', e.target.value);
            });
        });
    }
}

// Warnings Page Logic
function loadWarnings() {
    if (!warningsList) return; // Exit if not on warnings page

    // Standard free APIs don't easily provide alerts, so we simulate them here
    const mockAlerts = [
        { title: "Severe Thunderstorm Warning", desc: "Heavy downpours expected leading to localized flooding." },
        { title: "High Fire Danger", desc: "Favorable weather conditions for runaway fires are expected in Gauteng." }
    ];

    warningsList.innerHTML = ''; // Clear the "fetching" text
    
    mockAlerts.forEach(alert => {
        const alertCard = document.createElement('div');
        alertCard.innerHTML = `<h3>${alert.title}</h3><p>${alert.desc}</p><hr>`;
        warningsList.appendChild(alertCard);
    });
}

//Year Module Logic
function loadYearModule() {
    if (!yearSelect || !yearDisplay) return; // Exit if not on year module page

    //Realistic base average temperatures for Johannesburg across the year (in Celsius)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const baseTemps = [26, 25, 24, 21, 19, 16, 17, 20, 24, 25, 25, 26]; 

    // Function to generate the data grid based on the chosen year
    function renderClimateData(year) {
        // Check if the user prefers Celsius or Fahrenheit from their Settings
        const savedUnit = localStorage.getItem('unit') || 'metric';
        
        let htmlContent = `<h3>Climate Averages for ${year}</h3>`;
        
        // Loop through each month and generate a mini data card
        months.forEach((month, index) => {
            // Add a tiny bit of math to slightly alter the temps based on the year selected
            let tempC = baseTemps[index];
            if (year === "2025") tempC -= 1;
            if (year === "2024") tempC += 1;

            // Convert to Fahrenheit if the user prefers imperial units
            let displayTemp = savedUnit === 'metric' ? `${tempC}°C` : `${Math.round((tempC * 9/5) + 32)}°F`;

            // Append the HTML for this specific month
            htmlContent += `
                <div class="month-card" style="border: 1px solid #ccc; padding: 10px; margin: 5px 0;">
                    <strong>${month}</strong>: ${displayTemp}
                </div>
            `;
        });

        // Inject the final block of HTML onto the page
        yearDisplay.innerHTML = htmlContent;
    }

    // Render the default year (2026) immediately when the page loads
    renderClimateData(yearSelect.value);

    //Listen for the user picking a different year from the dropdown
    yearSelect.addEventListener('change', (e) => {
        renderClimateData(e.target.value);
    });
}
//Map Page Logic
function loadMap() {
    if (!mapContainer) return; // Exit if not on map page

    // Initialize the map and set the starting view to Johannesburg
    const map = L.map('weather-map').setView([-26.2041, 28.0473], 10);

    // Load the visual map tiles from OpenStreetMap (Free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Listen for clicks on the map
    map.on('click', async (e) => {
        // Grab the exact latitude and longitude of where the user clicked
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        
        try {
            const savedUnit = localStorage.getItem('unit') || 'metric';
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${savedUnit}&appid=${API_KEY}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Location not found');
            const data = await response.json();
            
            // Format the data for the popup
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            const unitSymbol = savedUnit === 'metric' ? '°C' : '°F';
            const locationName = data.name || "Unknown Location";
            
            // Create and open a popup on the map
            L.popup()
                .setLatLng(e.latlng)
                .setContent(`<strong>${locationName}</strong><br>${temp}${unitSymbol} - ${desc}`)
                .openOn(map);
                
        } catch (error) {
            console.error("Map fetch error:", error);
        }
    });
}

//Global Event Listeners
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        const city = searchInput.value.trim();
        if (city && locationEl) { // Only fetch if on home page
            getWeatherData(city);
            searchInput.value = ''; 
        }
    });
}

if (navDropdown) {
    navDropdown.addEventListener('change', (e) => {
        const selectedPage = e.target.value;
        if (selectedPage) {
            window.location.href = selectedPage;
        }
    });
}

//Initialize App on Load
function init() {
    initSettings();     // Runs on every page to check Dark/Light mode
    setDate();          // Only runs if on Home page
    loadWarnings();     // Only runs if on Warnings page
    loadYearModule(); 
    loadMap();  // Only runs if on Year Module page
    
    if (locationEl) {
        getWeatherData('Johannesburg'); 
    }
}

document.addEventListener('DOMContentLoaded', init);