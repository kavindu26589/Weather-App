const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; // Get your API key from https://openweathermap.org/api

const apiKey = "YOUR_OPENWEATHER_API_KEY"; // Replace with your API key
let isCelsius = true;

async function getWeather(city = null, lat = null, lon = null) {
    let url, forecastUrl;

    if (city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        document.getElementById("errorMessage").textContent = "Enter a city or use location!";
        return;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            displayWeather(data);
            getForecast(forecastUrl);
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
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
        <p>Temperature: ${temp.toFixed(1)}${unit}</p>
        <p>Weather: ${data.weather[0].description} ⛅</p>
        <p>Humidity: ${data.main.humidity}%</p>
    `;
    document.getElementById("errorMessage").textContent = "";
}

async function getForecast(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === "200") {
            displayForecast(data);
        }
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

function displayForecast(data) {
    const forecastContainer = document.getElementById("forecast");
    forecastContainer.innerHTML = ""; // Clear previous results

    const dailyForecasts = {};
    data.list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0]; // Extract date
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    Object.keys(dailyForecasts).slice(0, 7).forEach((date) => {
        const dayData = dailyForecasts[date];
        let temp = isCelsius ? dayData.main.temp : (dayData.main.temp * 9/5) + 32;
        let unit = isCelsius ? "°C" : "°F";
        
        const forecastDay = document.createElement("div");
        forecastDay.classList.add("forecast-day");
        forecastDay.innerHTML = `
            <p>${new Date(date).toLocaleDateString("en-US", { weekday: "short" })}</p>
            <img src="https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png" alt="Weather Icon">
            <p>${temp.toFixed(1)}${unit}</p>
        `;
        forecastContainer.appendChild(forecastDay);
    });
}

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

document.getElementById("unitToggle").addEventListener("change", function() {
    isCelsius = !isCelsius;
    let label = isCelsius ? "Switch to °F" : "Switch to °C";
    this.nextElementSibling.textContent = label;

    let city = document.getElementById("cityInput").value;
    if (city) getWeather(city);
});
