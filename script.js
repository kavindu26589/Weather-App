const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; 
const airQualityKey = apiKey;  // Reuse the same key

let isCelsius = true;
const defaultCity = "Colombo"; // Fixed to Colombo

// Ensure DOM is fully loaded before running script
document.addEventListener("DOMContentLoaded", function() {
    getWeather(defaultCity);

    const unitToggle = document.getElementById("unitToggle");
    if (unitToggle) {
        unitToggle.addEventListener("change", function() {
            isCelsius = !isCelsius;
            let label = isCelsius ? "Switch to °F" : "Switch to °C";
            this.nextElementSibling.textContent = label;

            getWeather(defaultCity);
        });
    }
});

// Fetch weather data for Colombo
async function getWeather(city) {
    document.getElementById("errorMessage").textContent = ""; 

    let url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    console.log("Fetching Weather Data:", url);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            displayWeather(data);
            getAQI(data.coord.lat, data.coord.lon);
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
