const apiKey = "6d0b5a223205f8e88b2b9d45a0ad532a"; // Get your API key from https://openweathermap.org/api

async function getWeather() {
    const city = document.getElementById("cityInput").value;
    if (!city) {
        alert("Please enter a city name!");
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            document.getElementById("weatherResult").innerHTML = `
                <h2>${data.name}, ${data.sys.country}</h2>
                <p>Temperature: ${data.main.temp}°C</p>
                <p>Weather: ${data.weather[0].description}</p>
                <p>Humidity: ${data.main.humidity}%</p>
            `;
        } else {
            document.getElementById("weatherResult").innerHTML = `<p>City not found!</p>`;
        }
    } catch (error) {
        document.getElementById("weatherResult").innerHTML = `<p>Error fetching weather data.</p>`;
    }
}
