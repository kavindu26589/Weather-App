const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; 
const airQualityKey = apiKey;  // Reuse the same key
let isCelsius = true;
const defaultCity = "Colombo"; // Fixed to Colombo

// Wait until the DOM is fully loaded before running any code.
document.addEventListener("DOMContentLoaded", function () {
  // Set up the unit toggle event listener.
  const unitToggle = document.getElementById("unitToggle");
  if (unitToggle) {
    unitToggle.addEventListener("change", function () {
      isCelsius = !isCelsius;
      const labelElement = this.nextElementSibling; // The label for the toggle.
      if (labelElement) {
        labelElement.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
      }
      // Re-fetch weather data for Colombo when unit is switched.
      getWeather(defaultCity);
    });
  }

  // Fetch weather for Colombo on page load.
  getWeather(defaultCity);
});

// Get weather data for the given city.
async function getWeather(city) {
  const errorMessageEl = document.getElementById("errorMessage");
  if (errorMessageEl) errorMessageEl.textContent = "";

  // Build the API URL.
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;
  console.log("Fetching Weather Data:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      displayWeather(data);
      getAQI(data.coord.lat, data.coord.lon);
    } else {
      console.error("Weather API Error Response:", data);
      if (errorMessageEl)
        errorMessageEl.textContent = `Error: ${data.message}`;
    }
  } catch (error) {
    if (errorMessageEl)
      errorMessageEl.textContent = "Error fetching weather data.";
    console.error("Weather API error:", error);
  }
}

// Display weather details on the page.
function displayWeather(data) {
  let temp = isCelsius ? data.main.temp : (data.main.temp * 9) / 5 + 32;
  let unit = isCelsius ? "°C" : "°F";

  const weatherResult = document.getElementById("weatherResult");
  if (weatherResult) {
    weatherResult.innerHTML = `
      <h2>${data.name}, ${data.sys.country}</h2>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
      <p>Temperature: ${temp.toFixed(1)}${unit}</p>
      <p>Weather: ${data.weather[0].description}</p>
      <p>Humidity: ${data.main.humidity}%</p>
    `;
  }

  const mapDiv = document.getElementById("map");
  if (mapDiv) {
    mapDiv.innerHTML = `
      <iframe width="100%" height="200" src="https://maps.google.com/maps?q=${data.coord.lat},${data.coord.lon}&z=10&output=embed"></iframe>
    `;
  }
}

// Fetch Air Quality Index (AQI) data.
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
