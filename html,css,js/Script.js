// script.js

// My OpenWeatherMap API key 
const apiKey = 'cf41fe8ef3952fb53d76ef41aee36fb4'; 

// Grab all the elements from the HTML that we'll need to update
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const refreshButton = document.getElementById("refresh-button");
const cityName = document.getElementById("city");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const highLow = document.getElementById("high-low");
const windSpeed = document.getElementById("wind-speed");
const humidity = document.getElementById("humidity");
const weeklyForecast = document.querySelector(".weekly-forecast");
const loader = document.querySelector('.loader'); // That spinning thing that shows while we're loading the weather
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const languageSelect = document.getElementById("language-select");
const body = document.body; // The <body> of our HTML document

// Event listeners to make the buttons actually *do* something!
searchButton.addEventListener("click", getWeather);
refreshButton.addEventListener("click", getWeather);

// Let the user press Enter in the text box to search too
cityInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        getWeather();
    }
});

// Let's the user switch between light and dark mode 🌞🌙
themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode"); 
    if (body.classList.contains("dark-mode")) {
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon"); 
    } else {
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun"); 
    }
});

// For future use - let the user change the language
languageSelect.addEventListener("change", () => {
    // TODO: Add actual logic to change the language (maybe use a library like i18next)
    console.log("Selected language:", languageSelect.value);
});

// This function fetches the current weather data from the OpenWeatherMap API
async function getWeatherData(city) {
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await fetch(apiUrl);

        // Check if the API request was successful
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Oops! City not found.");
            } else if (response.status === 429) {
                throw new Error("Whoa there! Too many requests. Please try again later."); 
            } else {
                throw new Error("Hmm, something went wrong while fetching the weather data.");
            }
        }
        // If everything's okay, parse the response as JSON
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert(error.message); // Show a friendly error message to the user
    }
}

// This function fetches the forecast data for the next few days
async function getForecastData(city) {
    try {
        const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
        const forecastResponse = await fetch(forecastApiUrl);
        const forecastData = await forecastResponse.json();
        return forecastData;
    } catch (error) {
        console.error("Error fetching forecast data:", error);
        alert("Error fetching forecast data.");
    }
}

// This function takes the weather data and updates the HTML elements
function displayWeather(data) {
    cityName.textContent = data.name;
    temperature.textContent = Math.round(data.main.temp) + "°C";
    condition.textContent = data.weather[0].description;
    highLow.textContent = `H:${Math.round(data.main.temp_max)}° L:${Math.round(data.main.temp_min)}°`;
    windSpeed.textContent = data.wind.speed + " km/h";
    humidity.textContent = data.main.humidity + "%";
}

// This function takes the forecast data and updates the weekly forecast section
function displayForecast(forecastData) {
    // First, let's get the dates for the next 7 days
    const next7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        next7Days.push(date.toLocaleDateString());
    }

    // Now let's filter the forecast data to get only one entry per day
    const dailyData = forecastData.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (next7Days.includes(date) && !acc[date]) {
            acc[date] = item;
        }
        return acc;
    }, {});

    // Clear out any old forecast data
    weeklyForecast.innerHTML = ""; 

    // Loop through the daily forecast data and create HTML for each day
    for (const date in dailyData) {
        const dayData = dailyData[date];
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = dayData.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const temp = Math.round(dayData.main.temp);

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.innerHTML = `
            <div>${dayOfWeek}</div>
            <div><img src="${iconUrl}" alt="${dayData.weather[0].description}"></div>
            <div>${temp}°C</div>
        `;
        weeklyForecast.appendChild(dayDiv);
    }
}

// This is the main function that gets called when the user searches for a city
async function getWeather() {
    const city = cityInput.value;
    loader.style.display = 'flex'; // Show the loader while we're fetching data
    try {
        const data = await getWeatherData(city);
        if (data) {
            displayWeather(data);
        }

        const forecastData = await getForecastData(city);
        if (forecastData) {
            displayForecast(forecastData);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert(error.message); 
    } finally {
        loader.style.display = 'none'; // Hide the loader once we're done
    }
}

// If the browser supports geolocation, try to get the user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            displayWeather(data); 

            const city = data.name; 
            const forecastData = await getForecastData(city); 
            if (forecastData) {
                displayForecast(forecastData);
            }
        } catch (error) {
            console.error("Error fetching weather data:", error);
            alert(error.message);
        }
    }, (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please search for a city.");
    });
} else {
    console.log("Geolocation is not supported by this browser.");
}

// Update the weather every 10 minutes
setInterval(getWeather, 600000);
