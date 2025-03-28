const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; // Replace with your API key 
const apiKey = "YOUR_OPENWEATHER_API_KEY"; 
const airQualityKey = apiKey;  // Reuse the same key

let isCelsius = true;
let lastSearchedCity = "";

// Ensure DOM is fully loaded before running script
document.addEventListener("DOMContentLoaded", function() {
    let lastCity = localStorage.getItem("lastCity");
    if (lastCity) {
        document.getElementById("cityInput").value = lastCity;
        getWeather(lastCity);
    }

    document.getElementById("unitToggle").addEventListener("change", function() {
        isCelsius = !isCelsius;
        let label = isCelsius ? "Switch to °F" : "Switch to °C";
        this.nextElementSibling.textContent = label;

        let city = document.getElementById("cityInput").value;
        if (city) getWeather(city);
    });

    document.getElementById("voiceSearch").addEventListener("click", () => {
        let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.start();
        recognition.onresult = (event) => {
            document.getElementById("cityInput").value = event.results[0][0].transcript;
            getWeather(event.results[0][0].transcript);
        };
    });
});

// Fetch city suggestions from OpenWeather API
async function fetchCitySuggestions(query) {
    if (query.length < 3) return;

    const cityApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

    try {
        const response = await fetch(cityApiUrl);
        const cities = await response.json();

        let datalist = document.getElementById("citySuggestions");
        datalist.innerHTML = "";

        cities.forEach(city => {
            let option = document.createElement("option");
            option.value = `${city.name}, ${city.country}`;
            datalist.appendChild(option);
        });

    } catch (error) {
        console.error("City suggestion error:", error);
    }
}

// **Debounce API Calls**
let debounceTimer;
function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

document.getElementById("cityInput").addEventListener("input", function () {
    debounce(() => fetchCitySuggestions(this.value), 500);
});

// Get weather data
async function getWeather(city = null, lat = null, lon = null) {
    document.getElementById("errorMessage").textContent = ""; 

    if (!city && (lat === null || lon === null)) {
        document.getElementById("errorMessage").textContent = "Please enter a valid city or enable location!";
        return;
    }

    let url;
    if (city) {
        // **Fix City Formatting for API**
        city = city.trim().split(",")[0]; // Remove country code and trim input
        if (city === "") {
            document.getElementById("errorMessage").textContent = "City name cannot be empty!";
            return;
        }
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else if (lat !== null && lon !== null) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        console.error("Invalid API call: No city or coordinates provided");
        return;
    }

    console.log("Fetching Weather Data:", url); // Debugging Log

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("API Response:", data); // Debugging Log to check API response

        if (response.ok) {
            displayWeather(data);
            getAQI(data.coord.lat, data.coord.lon);
            localStorage.setItem("lastCity", city);
        } else {
            console.error("Weather API Error Response:", data);
            document.getElementById("errorMessage").textContent = `Error: ${data.message}`;
        }
    } catch (error) {
        document.getElementById("errorMessage").textContent = "Error fetching weather data.";
        console.error("Weather API error:", error);
    }
}

// Display weather details
function displayWeather(data) {
    if (!data || !data.main || !data.weather) {
        document.getElementById("errorMessage").textContent = "Weather data not available!";
        return;
    }

    let temp = isCelsius ? data.main.temp : (data.main.temp * 9/5) + 32;
    let unit = isCelsius ? "°C" : "°F";

    document.getElementById("weatherResult").innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">
        <p>Temperature: ${temp.toFixed(1)}${unit}</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
    `;

    document.getElementById("map").innerHTML = `
        <iframe width="100%" height="200" src="https://maps.google.com/maps?q=${data.coord.lat},${data.coord.lon}&z=10&output=embed"></iframe>
    `;
}

// Fetch Air Quality Index (AQI)
async function getAQI(lat, lon) {
    if (!lat || !lon) return;
    
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${airQualityKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const aqi = data.list[0].main.aqi;

        document.getElementById("aqiResult").innerHTML = `<p>Air Quality Index: ${aqi} (1-Good, 5-Very Poor)</p>`;
    } catch (error) {
        console.error("AQI fetch error:", error);
    }
}
