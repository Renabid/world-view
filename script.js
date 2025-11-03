// === CONFIG ===
const CESIUM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwNDJkZTIxNC02ZTFlLTQxNjktOTA3YS1jN2FhY2ExMDlhYTIiLCJpZCI6MzU2NDYyLCJpYXQiOjE3NjIxNDExMTJ9.nrnwCrINmzdcG2_Fuobg5XRWu9pUxpDhC9eHL8gD_ho";
const WEATHER_API_KEY = "cff8c558e71eeba45e47665ce76ad50d";

// === INITIAL STATE ===
let currentLat = null;
let currentLon = null;

// === CESIUM SETUP ===
Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  animation: false,
  timeline: false,
  baseLayerPicker: true,
  fullscreenButton: true,
});

viewer.scene.globe.enableLighting = true;

// Fly to full Earth on load
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000.0),
  orientation: {
    heading: Cesium.Math.toRadians(0.0),
    pitch: Cesium.Math.toRadians(-90.0),
  },
  duration: 3,
});

// === WEATHER FUNCTION ===
async function loadWeather(lat, lon) {
  if (lat === null || lon === null) return; // Do nothing if no location

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.cod !== 200) throw new Error(data.message);

    document.getElementById("locationName").innerText =
      `📍 ${data.name || "Unknown Location"}`;
    document.getElementById("condition").innerText =
      `🌤 ${data.weather[0].main} (${data.weather[0].description})`;
    document.getElementById("temp").innerText =
      `🌡️ Temp: ${data.main.temp.toFixed(1)} °C`;
    document.getElementById("wind").innerText =
      `💨 Wind: ${data.wind.speed} m/s`;
    document.getElementById("humidity").innerText =
      `💧 Humidity: ${data.main.humidity}%`;

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
    document.getElementById("condition").innerText = "⚠️ Unable to load weather.";
  }
}

// === CLICK EVENT TO GET WEATHER ANYWHERE ===
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((click) => {
  const pickedPosition = viewer.scene.pickPosition(click.position);
  if (Cesium.defined(pickedPosition)) {
    const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lon = Cesium.Math.toDegrees(cartographic.longitude);

    currentLat = lat;
    currentLon = lon;

    // Fly smoothly to clicked location
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 8000.0),
      duration: 2,
    });

    loadWeather(lat, lon);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// === REAL-TIME LIGHTING (DAY/NIGHT) ===
function updateSunlight() {
  const now = new Date();
  viewer.scene.light = new Cesium.DirectionalLight({
    direction: Cesium.SunDirection.compute(now),
  });
}
updateSunlight();
setInterval(updateSunlight, 60000);

// === INITIAL WEATHER PANEL BLANK ===
document.getElementById("locationName").innerText = "";
document.getElementById("condition").innerText = "";
document.getElementById("temp").innerText = "";
document.getElementById("wind").innerText = "";
document.getElementById("humidity").innerText = "";
