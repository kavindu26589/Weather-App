/**************************************************************
 * Replace "YOUR_OPENWEATHER_API_KEY" below with your actual
 * OpenWeather API key.
 **************************************************************/
const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a";
const airQualityKey = apiKey; // Reuse the same key

let isCelsius = true;
// Default city on page load
const defaultCity = "Colombo";

document.addEventListener("DOMContentLoaded", function () {
  // Show spinner and fetch default city's weather on page load
  showSpinner(true);
  getWeather(defaultCity);

  // °C/°F toggle
  const unitToggle = document.getElementById("unitToggle");
  if (unitToggle) {
    unitToggle.addEventListener("change", function () {
      isCelsius = !isCelsius;
      const labelElement = this.nextElementSibling;
      if (labelElement) {
        labelElement.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
      }
      showSpinner(true);
      // Re-fetch weather for current city (or default if none searched)
      const city = document.getElementById("cityInput").value.trim() || defaultCity;
      getWeather(city);
    });
  }

  // Search button for user-input city
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      const cityInput = document.getElementById("cityInput").value.trim();
      if (cityInput) {
        showSpinner(true);
        getWeather(cityInput);
      }
    });
  }
});

/**
 * Show or hide the loading spinner.
 */
function showSpinner(visible) {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) {
    spinner.style.display = visible ? "block" : "none";
  }
}

/**
 * Fetch current weather data for the given city.
 * Then fetch AQI and 5-day forecast using the coordinates.
 */
async function getWeather(city) {
  const errorMessageEl = document.getElementById("errorMessage");
  if (errorMessageEl) errorMessageEl.textContent = "";

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  console.log("Fetching Weather Data:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      displayWeather(data);
      getAQI(data.coord.lat, data.coord.lon);
      getForecast(data.coord.lat, data.coord.lon);
    } else {
      console.error("Weather API Error:", data);
      if (errorMessageEl) {
        errorMessageEl.textContent = `Error: ${data.message}`;
      }
      showSpinner(false);
    }
  } catch (error) {
    if (errorMessageEl) {
      errorMessageEl.textContent = "Error fetching weather data.";
    }
    console.error("Weather API error:", error);
    showSpinner(false);
  }
}

/**
 * Display current weather in #weatherResult and update background.
 */
function displayWeather(data) {
  const weatherResult = document.getElementById("weatherResult");
  if (!weatherResult) return;

  // Convert main.temp & main.feels_like if user toggled to °F
  let temp = data.main.temp;
  let feelsLike = data.main.feels_like;
  if (!isCelsius) {
    temp = (temp * 9) / 5 + 32;
    feelsLike = (feelsLike * 9) / 5 + 32;
  }
  const unit = isCelsius ? "°C" : "°F";

  // Format sunrise & sunset
  const sunrise = formatTime(data.sys.sunrise);
  const sunset = formatTime(data.sys.sunset);

  // Format last update time
  const lastUpdate = formatTime(data.dt);

  // Calculate wind direction
  const windDir = calculateWindDirection(data.wind.deg);

  weatherResult.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
    <p>Temperature: ${temp.toFixed(1)}${unit} (Feels like: ${feelsLike.toFixed(1)}${unit})</p>
    <p>Weather: ${data.weather[0].description}</p>
    <p>Humidity: ${data.main.humidity}%</p>
    <p>Wind: ${data.wind.speed} m/s ${windDir}</p>
    <p>Sunrise: ${sunrise} | Sunset: ${sunset}</p>
    <p>Last Update: ${lastUpdate}</p>
  `;

  // Update background based on weather condition
  updateBackground(data.weather[0].main);

  // Display map
  const mapDiv = document.getElementById("map");
  if (mapDiv) {
    mapDiv.innerHTML = `
      <iframe
        width="100%"
        height="200"
        src="https://maps.google.com/maps?q=${data.coord.lat},${data.coord.lon}&z=10&output=embed">
      </iframe>
    `;
  }
}

/**
 * Update body background based on weather condition.
 */
function updateBackground(condition) {
  const body = document.body;
  const main = condition.toLowerCase();

  if (main.includes("clear")) {
    body.style.background = "linear-gradient(135deg, #FFD93D, #FFA800)";
  } else if (main.includes("cloud")) {
    body.style.background = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
  } else if (main.includes("rain") || main.includes("drizzle")) {
    body.style.background = "linear-gradient(135deg, #4a90e2, #145da0)";
  } else if (main.includes("thunder")) {
    body.style.background = "linear-gradient(135deg, #2c3e50, #1e272e)";
  } else if (main.includes("snow")) {
    body.style.background = "linear-gradient(135deg, #e6f7ff, #ffffff)";
  } else {
    // Default
    body.style.background = "linear-gradient(135deg, #00c6ff, #0072ff)";
  }
}

/**
 * Calculate cardinal wind direction (N, NE, E, etc.) from degrees.
 */
function calculateWindDirection(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

/**
 * Format a Unix timestamp into local time string (e.g. "6:15 AM").
 */
function formatTime(unixTime) {
  if (!unixTime) return "";
  const date = new Date(unixTime * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Fetch Air Quality Index (AQI) data.
 */
async function getAQI(lat, lon) {
  if (!lat || !lon) return;
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${airQualityKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const aqi = data.list[0].main.aqi;
    const aqiResult = document.getElementById("aqiResult");
    if (aqiResult) {
      aqiResult.innerHTML = `<p>Air Quality Index: ${aqi} (1-Good, 5-Very Poor)</p>`;
    }
  } catch (error) {
    console.error("AQI fetch error:", error);
  }
}

/**
 * Fetch 5-Day/3-Hour forecast and compute daily min/max temperatures.
 */
async function getForecast(lat, lon) {
  if (!lat || !lon) return;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  console.log("Fetching Forecast Data:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Forecast API response:", data);

    if (data.list && data.list.length > 0) {
      const dailyData = aggregateDailyForecast(data.list);
      displayForecast(dailyData);
    } else {
      console.error("Forecast API response does not contain a list.", data);
    }
  } catch (error) {
    console.error("Forecast fetch error:", error);
  } finally {
    // Hide spinner after all calls are done
    showSpinner(false);
  }
}

/**
 * Aggregate the forecast data by day to find min/max and pick a representative icon.
 */
function aggregateDailyForecast(forecastList) {
  // A map of date -> { min, max, icon, date }
  const dailyMap = {};

  forecastList.forEach(item => {
    const dateObj = new Date(item.dt * 1000);
    const dateKey = dateObj.toISOString().split("T")[0]; // e.g. "2023-07-14"

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        minTemp: item.main.temp,
        maxTemp: item.main.temp,
        icon: item.weather[0].icon,
        weatherMain: item.weather[0].main,
        date: dateObj
      };
    } else {
      // Update min & max
      if (item.main.temp < dailyMap[dateKey].minTemp) {
        dailyMap[dateKey].minTemp = item.main.temp;
        dailyMap[dateKey].icon = item.weather[0].icon; 
      }
      if (item.main.temp > dailyMap[dateKey].maxTemp) {
        dailyMap[dateKey].maxTemp = item.main.temp;
      }
    }
  });

  // Convert dailyMap to array, sort by date, limit to 5 days
  const dailyArray = Object.values(dailyMap).sort((a, b) => a.date - b.date);
  return dailyArray.slice(0, 5);
}

/**
 * Display the aggregated 5-day forecast in #forecast, single row with horizontal scroll.
 */
function displayForecast(dailyData) {
  const forecastContainer = document.getElementById("forecast");
  if (!forecastContainer) return;
  forecastContainer.innerHTML = "";

  dailyData.forEach(day => {
    const forecastDay = document.createElement("div");
    forecastDay.classList.add("forecast-day");

    let minTemp = day.minTemp;
    let maxTemp = day.maxTemp;
    let unit = "°C";
    if (!isCelsius) {
      minTemp = (minTemp * 9) / 5 + 32;
      maxTemp = (maxTemp * 9) / 5 + 32;
      unit = "°F";
    }

    // Format date (e.g., "Fri, 28 Jul")
    const options = { weekday: "short", day: "numeric", month: "short" };
    const dateStr = day.date.toLocaleDateString(undefined, options);

    forecastDay.innerHTML = `
      <p>${dateStr}</p>
      <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="Forecast Icon">
      <p>${minTemp.toFixed(1)}${unit} / ${maxTemp.toFixed(1)}${unit}</p>
    `;
    forecastContainer.appendChild(forecastDay);
  });
}
