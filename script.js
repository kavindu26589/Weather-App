const apiKey = "cf5e9dddc2888b05fc9113c54400f53a"; // Replace with your API key
const airQualityKey = "cf5e9dddc2888b05fc9113c54400f53a"; 

let isCelsius = true;
let lastSearchedCity = "";

// Ensure DOM is fully loaded before running script
document.addEventListener("DOMContentLoaded", function() {
    // Load last searched city
    let lastCity = localStorage.getItem("lastCity");
    if (lastCity) {
        document.getElementById("cityInput").value = lastCity;
        getWeather(lastCity);
    }

    // Toggle temperature unit (°C / °F)
    document.getElementById("unitToggle").addEventListener("change", function() {
        isCelsius = !isCelsius;
        let label = isCelsius ? "Switch to °F" : "Switch to °C";
        this.nextElementSibling.textContent = label;

        let city = document.getElementById("cityInput").value;
        if (city) getWeather(city);
    });

    // Enable voice search
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

    const cityApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;

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

// Listen for user typing in city input
document.getElementById("cityInput").addEventListener("input", function () {
    fetchCitySuggestions(this.value);
});

// Get weather data
async function getWeather(city = null, lat = null, lon = null) {
    if (!city && (lat === null || lon === null)) {
        document.getElementById("errorMessage").textContent = "Please enter a city or enable location!";
        return;
    }

    let url = city 
        ? `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric` 
        : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            displayWeather(data);
            getAQI(data.coord.lat, data.coord.lon);
            document.getElementById("errorMessage").textContent = "";
            localStorage.setItem("lastCity", city);
        } else {
            document.getElementById("errorMessage").textContent = "City not found!";
        }
    } catch (error) {
        document.getElementById("errorMessage").textContent = "Error fetching weather data.";
    }
}

// Get user's location and fetch weather
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeather(null, position.coords.latitude, position.coords.longitude);
            },
            () => {
                document.getElementById("errorMessage").textContent = "Location access denied!";
            }
        );
    } else {
        document.getElementById("errorMessage").textContent = "Geolocation not supported!";
    }
}

// Display weather details
function displayWeather(data) {
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
