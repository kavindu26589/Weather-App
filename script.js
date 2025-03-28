/***********************************************
 * 1) Replace "YOUR_OPENWEATHER_API_KEY" below
 * 2) Ensure One Call API is enabled in your
 *    OpenWeather account
 ***********************************************/
const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; 
const airQualityKey = apiKey;  // Reuse the same key
let isCelsius = true;
const defaultCity = "Colombo"; // Always show Colombo's weather

document.addEventListener("DOMContentLoaded", function () {
  // On page load, fetch Colombo weather
  getWeather(defaultCity);

  // Setup the °C/°F toggle
  const unitToggle = document.getElementById("unitToggle");
  if (unitToggle) {
    unitToggle.addEventListener("change", function () {
      isCelsius = !isCelsius;
      const labelElement = this.nextElementSibling;
      if (labelElement) {
        labelElement.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
      }
      // Re-fetch weather & forecast with the new unit
      getWeather(defaultCity);
    });
  }
});

/**
 * Fetch current weather for 'city' (Colombo).
 * Then fetch forecast & AQI using the lat/lon.
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
 * Display current weather in #weatherResult
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
 * Fetch Air Quality Index (AQI) data
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
 * Fetch 7-Day Forecast using One Call API
 */
async function getForecast(lat, lon) {
  if (!lat || !lon) return;

  // Exclude other data if you only want daily
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=metric&appid=${apiKey}`;
  console.log("Fetching Forecast Data:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.daily) {
      displayForecast(data.daily);
    }
  } catch (error) {
    console.error("Forecast fetch error:", error);
  }
}

/**
 * Display 7-Day Forecast in #forecast
 */
function displayForecast(dailyData) {
  const forecastContainer = document.getElementById("forecast");
  if (!forecastContainer) return;
  forecastContainer.innerHTML = "";

  // We'll show the next 7 days (including today).
  // If you want to skip today's forecast, do dailyData.slice(1, 8).
  dailyData.slice(0, 7).forEach((day, index) => {
    const forecastDay = document.createElement("div");
    forecastDay.classList.add("forecast-day");

    // Convert temps if user toggled to °F
    let dayTemp = day.temp.day;
    let nightTemp = day.temp.night;
    if (!isCelsius) {
      dayTemp = (dayTemp * 9) / 5 + 32;
      nightTemp = (nightTemp * 9) / 5 + 32;
    }
    const unit = isCelsius ? "°C" : "°F";

    // Format the date (e.g. "Mon, 27")
    const dateObj = new Date(day.dt * 1000);
    const options = { weekday: "short", day: "numeric" };
    const dateStr = dateObj.toLocaleDateString(undefined, options);

    forecastDay.innerHTML = `
      <p>${dateStr}</p>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Forecast Icon">
      <p>Day: ${dayTemp.toFixed(1)}${unit}</p>
      <p>Night: ${nightTemp.toFixed(1)}${unit}</p>
    `;
    forecastContainer.appendChild(forecastDay);
  });
}
