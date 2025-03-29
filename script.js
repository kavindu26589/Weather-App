/**************************************************************
 * Replace "YOUR_OPENWEATHER_API_KEY" below with your actual
 * OpenWeather API key.
 **************************************************************/
const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a";
const airQualityKey = apiKey; // Reuse the same key

let isCelsius = true;
const defaultCity = "Colombo";

// Favorites stored in localStorage
let favorites = []; // Each item: { cityName: "Colombo", selected: false }

// Leaflet Map & Chart.js references
let map;
let mapMarker;
let comparisonChart;

document.addEventListener("DOMContentLoaded", function () {
  // Load favorites from localStorage
  loadFavorites();

  // Initialize map (Leaflet)
  initMap();

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
      // Re-fetch weather for current city or default if none in input
      const city = (document.getElementById("cityInput").value || defaultCity).trim();
      getWeather(city);
    });
  }

  // Search button
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

  // Compare button
  const compareBtn = document.getElementById("compareBtn");
  if (compareBtn) {
    compareBtn.addEventListener("click", async function () {
      // Filter selected favorites
      const selectedFavorites = favorites.filter(f => f.selected);
      if (selectedFavorites.length < 2) {
        alert("Please select at least two favorites to compare!");
        return;
      }
      // Build data for chart
      showSpinner(true);
      await buildComparisonChart(selectedFavorites);
      showSpinner(false);
    });
  }
});
function updateBackground(condition) {
  const body = document.body;
  const main = condition.toLowerCase();

  if (main.includes("clear")) {
    // Sunny gradient
    body.style.background = "linear-gradient(135deg, #FFD93D, #FFA800)";
  } else if (main.includes("cloud")) {
    // Cloudy
    body.style.background = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
  } else if (main.includes("rain") || main.includes("drizzle")) {
    // Rainy
    body.style.background = "linear-gradient(135deg, #4a90e2, #145da0)";
  } else if (main.includes("thunder")) {
    // Thunderstorm
    body.style.background = "linear-gradient(135deg, #2c3e50, #1e272e)";
  } else if (main.includes("snow")) {
    // Snow
    body.style.background = "linear-gradient(135deg, #e6f7ff, #ffffff)";
  } else {
    // Default subtle gradient
    body.style.background = "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)";
  }
}
/** =========================
 *       MAP & CHART INIT
 *  ========================= */

function initMap() {
  // Leaflet map with OpenStreetMap tiles
  map = L.map("map").setView([6.9271, 79.8612], 10); // default to Colombo
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  mapMarker = L.marker([6.9271, 79.8612]).addTo(map);
}

function updateMap(lat, lon) {
  if (map) {
    map.setView([lat, lon], 10);
    mapMarker.setLatLng([lat, lon]);
  }
}

function initComparisonChart() {
  const ctx = document.getElementById("comparisonChart").getContext("2d");
  if (comparisonChart) {
    comparisonChart.destroy(); // If there's an old chart, destroy it
  }
  comparisonChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: isCelsius ? "Temperature (°C)" : "Temperature (°F)"
          }
        }
      }
    }
  });
}

/** =========================
 *    LOADING SPINNER
 *  ========================= */

function showSpinner(visible) {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) {
    spinner.style.display = visible ? "block" : "none";
  }
}

/** =========================
 *    WEATHER FETCH & DISPLAY
 *  ========================= */

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

      // Optionally add city to favorites if not already present
      addToFavoritesList(city);
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

function displayWeather(data) {
  const weatherResult = document.getElementById("weatherResult");
  updateBackground(data.weather[0].main);
  if (!weatherResult) return;

  let temp = data.main.temp;
  let feelsLike = data.main.feels_like;
  if (!isCelsius) {
    temp = (temp * 9) / 5 + 32;
    feelsLike = (feelsLike * 9) / 5 + 32;
  }
  const unit = isCelsius ? "°C" : "°F";

  const sunrise = formatTime(data.sys.sunrise);
  const sunset = formatTime(data.sys.sunset);
  const lastUpdate = formatTime(data.dt);
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
    <button id="favoriteCityBtn">Add to Favorites</button>
  `;

  updateBackground(data.weather[0].main);
  updateMap(data.coord.lat, data.coord.lon);

  // "Add to Favorites" button
  const favBtn = document.getElementById("favoriteCityBtn");
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      addToFavoritesList(data.name);
    });
  }
}

/** =========================
 *    BACKGROUND / UTILS
 *  ========================= */

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
    body.style.background = "linear-gradient(135deg, #00c6ff, #0072ff)";
  }
}

function calculateWindDirection(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function formatTime(unixTime) {
  if (!unixTime) return "";
  const date = new Date(unixTime * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** =========================
 *        AIR QUALITY
 *  ========================= */

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

/** =========================
 *         FORECAST
 *  ========================= */

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
    showSpinner(false);
  }
}

function aggregateDailyForecast(forecastList) {
  const dailyMap = {};

  forecastList.forEach(item => {
    const dateObj = new Date(item.dt * 1000);
    const dateKey = dateObj.toISOString().split("T")[0];

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        minTemp: item.main.temp,
        maxTemp: item.main.temp,
        icon: item.weather[0].icon,
        weatherMain: item.weather[0].main,
        date: dateObj,
        description: item.weather[0].description // for textual forecast
      };
    } else {
      if (item.main.temp < dailyMap[dateKey].minTemp) {
        dailyMap[dateKey].minTemp = item.main.temp;
        dailyMap[dateKey].icon = item.weather[0].icon;
        dailyMap[dateKey].description = item.weather[0].description;
      }
      if (item.main.temp > dailyMap[dateKey].maxTemp) {
        dailyMap[dateKey].maxTemp = item.main.temp;
      }
    }
  });

  const dailyArray = Object.values(dailyMap).sort((a, b) => a.date - b.date);
  return dailyArray.slice(0, 5);
}

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

    const options = { weekday: "short", day: "numeric", month: "short" };
    const dateStr = day.date.toLocaleDateString(undefined, options);

    forecastDay.innerHTML = `
      <p>${dateStr}</p>
      <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="Icon">
      <p>${minTemp.toFixed(1)}${unit} / ${maxTemp.toFixed(1)}${unit}</p>
      <p style="font-size: 0.9em; color: #555;">${day.description}</p>
    `;
    forecastContainer.appendChild(forecastDay);
  });
}

/** =========================
 *   FAVORITES & MULTI-CITY
 *  ========================= */

function loadFavorites() {
  const stored = localStorage.getItem("favorites");
  if (stored) {
    favorites = JSON.parse(stored);
  } else {
    favorites = [];
  }
  renderFavorites();
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function addToFavoritesList(cityName) {
  const found = favorites.some(f => f.cityName.toLowerCase() === cityName.toLowerCase());
  if (!found) {
    favorites.push({ cityName, selected: false });
    saveFavorites();
    renderFavorites();
  }
}

function toggleFavoriteSelection(cityName) {
  favorites = favorites.map(f => {
    if (f.cityName.toLowerCase() === cityName.toLowerCase()) {
      return { ...f, selected: !f.selected };
    }
    return f;
  });
  saveFavorites();
  renderFavorites();
}

function removeFavorite(cityName) {
  favorites = favorites.filter(f => f.cityName.toLowerCase() !== cityName.toLowerCase());
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  const list = document.getElementById("favoritesList");
  if (!list) return;
  list.innerHTML = "";

  favorites.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label>
        <input type="checkbox" ${f.selected ? "checked" : ""}/>
        ${f.cityName}
      </label>
      <button class="removeFavBtn" style="margin-left:5px;">X</button>
    `;
    list.appendChild(li);

    const checkbox = li.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", () => {
      toggleFavoriteSelection(f.cityName);
    });

    const removeBtn = li.querySelector(".removeFavBtn");
    removeBtn.addEventListener("click", () => {
      removeFavorite(f.cityName);
    });
  });
}

/** =========================
 *   MULTI-CITY COMPARISON
 *  ========================= */

async function buildComparisonChart(selectedFavorites) {
  initComparisonChart();

  let firstCity = true;

  for (const fav of selectedFavorites) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(fav.cityName)}&appid=${apiKey}&units=metric`;
    try {
      const response = await fetch(forecastUrl);
      const data = await response.json();
      if (!data.list) continue;

      const dailyData = aggregateDailyForecast(data.list);
      const cityDates = [];
      const cityTemps = [];

      dailyData.forEach(day => {
        const avgTemp = (day.minTemp + day.maxTemp) / 2;
        let finalTemp = avgTemp;
        if (!isCelsius) {
          finalTemp = (avgTemp * 9) / 5 + 32;
        }
        const options = { weekday: "short", day: "numeric", month: "short" };
        const dateStr = day.date.toLocaleDateString(undefined, options);

        cityDates.push(dateStr);
        cityTemps.push(finalTemp.toFixed(1));
      });

      if (firstCity) {
        comparisonChart.data.labels = cityDates;
        firstCity = false;
      }

      comparisonChart.data.datasets.push({
        label: fav.cityName,
        data: cityTemps,
        borderColor: getRandomColor(),
        fill: false
      });

    } catch (error) {
      console.error("Error fetching city forecast for comparison:", error);
    }
  }

  comparisonChart.update();
}

function initComparisonChart() {
  const ctx = document.getElementById("comparisonChart").getContext("2d");
  if (comparisonChart) {
    comparisonChart.destroy();
  }
  comparisonChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: isCelsius ? "Temperature (°C)" : "Temperature (°F)"
          }
        }
      }
    }
  });
}

function getRandomColor() {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
}
