const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; // Replace with your API key
const airQualityKey = "cf5e9dddc2888b05fc9113c54400f53a"; 

let isCelsius = true;
let lastSearchedCity = "";

// Load last searched city on page load
document.addEventListener("DOMContentLoaded", () => {
    let lastCity = localStorage.getItem("lastCity");
    if (lastCity) {
        document.getElementById("cityInput").value = lastCity;
        getWeather(lastCity);
    }
});

// Fetch city list from OpenWeather API
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

async function getWeather(city = null, lat = null, lon = null) {
    if (city && city === lastSearchedCity) return;
    lastSearchedCity = city;

    let url = city ? 
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric` : 
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            displayWeather(data);
            getAQI(data.coord.lat, data.coord.lon);
            document.getElementById("errorMessage").textContent = "";
            saveLastCity(city);
        } else {
            document.getElementById("errorMessage").textContent = "City not found!";
        }
    } catch (error) {
        document.getElementById("errorMessage").textContent = "Error fetching weather data.";
    }
}

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

async function getAQI(lat, lon) {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${airQualityKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const aqi = data.list[0].main.aqi;

        document.getElementById("aqiResult").innerHTML = `<p>Air Quality Index: ${aqi} (1-Good, 5-Very Poor)</p>`;
    } catch (error) {
        console.error("AQI fetch error:", error);
    }
}
