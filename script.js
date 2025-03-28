/*******************************************************
 * 1) Replace "6d0b5a223205f8e88b2b9d45a0ad532a" below.
 * 2) Ensure One Call (v2.5) is enabled in your
 *    OpenWeather account (for 7-day forecast).
 *******************************************************/
const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; 
const airQualityKey = apiKey; // Reuse the same key

let isCelsius = true;
const defaultCity = "Colombo"; // Fixed to Colombo

document.addEventListener("DOMContentLoaded", function () {
  // Fetch current weather for Colombo on page load.
  getWeather(defaultCity);

  // Set up the °C/°F toggle.
  const unitToggle = document.getElementById("unitToggle");
  if (unitToggle) {
    unitToggle.addEventListener("change", function () {
      isCelsius = !isCelsius;
      const labelElement = this.nextElementSibling;
      if (labelElement) {
        labelElement.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
      }
      // Re-fetch weather, AQI, and forecast with the new unit.
      getWeather(defaultCity);
    });
  }
});

/**
 * Fetch current weather for the given city.
 * Then fetch AQI and forecast using the obtained coordinates.
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
    }
  } catch (error) {
    if (errorMessageEl) {
      errorMessageEl.textContent = "Error fetching weather data.";
    }
    console.error("Weather API error:", error);
  }
}

/**
 * Display current weather information in #weatherResult.
 */
function displayWeather(data) {
  const weatherResult = document.getElementById("weatherResult");
  if (!weatherResult) return;

  let temp = data.main.temp;
  if (!isCelsius) {
    temp = (temp * 9) / 5 + 32;
  }
  let unit = isCelsius ? "°C" : "°F";

  weatherResult.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
    <p>Temperature: ${temp.toFixed(1)}${unit}</p>
    <p>Weather: ${data.weather[0].description}</p>
    <p>Humidity: ${data.main.humidity}%</p>
  `;

  // Display map using the provided coordinates.
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
 * Fetch Air Quality Index (AQI) using latitude and longitude.
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
 * Fetch 5-Day/3-Hour Forecast using OpenWeather's forecast endpoint.
 * We filter for forecasts at 12:00:00 to represent each day.
 */
async function getForecast(lat, lon) {
  if (!lat || !lon) return;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  console.log("Fetching Forecast Data:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Log response for debugging.
    console.log("Forecast API response:", data);

    if (data.list && data.list.length > 0) {
      // Filter forecasts for 12:00:00 each day.
      const dailyForecasts = data.list.filter(forecast => forecast.dt_txt.includes("12:00:00"));
      if (dailyForecasts.length > 0) {
        displayForecast(dailyForecasts);
      } else {
        console.error("No daily forecast entries found for 12:00:00", data);
      }
    } else {
      console.error("Forecast API response does not contain a list.", data);
    }
  } catch (error) {
    console.error("Forecast fetch error:", error);
  }
}

/**
 * Display forecast cards in #forecast.
 */
function displayForecast(dailyData) {
  const forecastContainer = document.getElementById("forecast");
  if (!forecastContainer) return;
  forecastContainer.innerHTML = "";

  dailyData.forEach(forecast => {
    const forecastDay = document.createElement("div");
    forecastDay.classList.add("forecast-day");

    let dayTemp = forecast.main.temp;
    let unit = "°C";
    if (!isCelsius) {
      dayTemp = (dayTemp * 9) / 5 + 32;
      unit = "°F";
    }

    // Format the date (e.g., "Mon 27")
    const dateObj = new Date(forecast.dt * 1000);
    const options = { weekday: "short", day: "numeric" };
    const dateStr = dateObj.toLocaleDateString(undefined, options);

    forecastDay.innerHTML = `
      <p>${dateStr}</p>
      <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="Forecast Icon">
      <p>${dayTemp.toFixed(1)}${unit}</p>
    `;
    forecastContainer.appendChild(forecastDay);
  });
}

