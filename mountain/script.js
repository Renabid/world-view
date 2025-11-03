// === CONFIG ===
// ⚠️ Replace these with your real API tokens
const CESIUM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwNDJkZTIxNC02ZTFlLTQxNjktOTA3YS1jN2FhY2ExMDlhYTIiLCJpZCI6MzU2NDYyLCJpYXQiOjE3NjIxNDExMTJ9.nrnwCrINmzdcG2_Fuobg5XRWu9pUxpDhC9eHL8gD_ho";
const WEATHER_API_KEY = "cff8c558e71eeba45e47665ce76ad50d";

// Mount Everest coordinates
const lat = 27.9881;
const lon = 86.9250;

// === CESIUM SETUP ===
Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  animation: false,
  timeline: false,
  baseLayerPicker: true,
  fullscreenButton: true,
});

// Enable realistic lighting based on the sun position
viewer.scene.globe.enableLighting = true;

// Fly the camera to Mount Everest
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(lon, lat, 9000.0),
  orientation: {
    heading: Cesium.Math.toRadians(0.0),
    pitch: Cesium.Math.toRadians(-45.0),
  },
  duration: 3,
});

// === WEATHER FETCH ===
async function loadWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    document.getElementById("condition").innerText =
      `🌤 Condition: ${data.weather[0].main} (${data.weather[0].description})`;
    document.getElementById("temp").innerText =
      `🌡️ Temperature: ${data.main.temp.toFixed(1)} °C`;
    document.getElementById("wind").innerText =
      `💨 Wind: ${data.wind.speed} m/s`;
    document.getElementById("humidity").innerText =
      `💧 Humidity: ${data.main.humidity}%`;

    // Adjust lighting based on weather
    const w = data.weather[0].main.toLowerCase();
    const sky = viewer.scene.skyAtmosphere;

    if (w.includes("cloud")) {
      sky.hueShift = -0.1;
      sky.saturationShift = -0.25;
      sky.brightnessShift = -0.2;
    } else if (w.includes("snow")) {
      sky.brightnessShift = 0.3;
      sky.hueShift = 0.1;
      sky.saturationShift = -0.2;
    } else if (w.includes("rain")) {
      sky.brightnessShift = -0.3;
      sky.saturationShift = -0.3;
    } else {
      sky.hueShift = 0;
      sky.saturationShift = 0;
      sky.brightnessShift = 0;
    }

  } catch (err) {
    console.error("Weather fetch failed:", err);
    document.getElementById("condition").innerText = "⚠️ Weather data unavailable.";
  }
}

// Load once and refresh every 10 minutes
loadWeather();
setInterval(loadWeather, 600000);

// === OPTIONAL: Real-time daylight simulation ===
function updateSunlight() {
  const now = new Date();
  viewer.scene.light = new Cesium.DirectionalLight({
    direction: Cesium.SunDirection.compute(now),
  });
}
updateSunlight();
setInterval(updateSunlight, 60000);
