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

    document.body.style.background = 
        data.weather[0].main.includes("Clear") ? "#ffcc33" :
        data.weather[0].main.includes("Clouds") ? "#bdc3c7" :
        data.weather[0].main.includes("Rain") ? "#4a90e2" : "#0072ff";

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

document.getElementById("voiceSearch").addEventListener("click", () => {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = (event) => {
        document.getElementById("cityInput").value = event.results[0][0].transcript;
        getWeather(event.results[0][0].transcript);
    };
});
