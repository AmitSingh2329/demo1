import axios from "axios";

const api = axios.create({
  baseURL: process.env.WEATHER_API_URL || "https://api.open-meteo.com/v1",
  timeout: 5000,
});

export const getWeatherForAlerts = async (lat, lon) => {
  try {
    const response = await api.get("/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m,precipitation",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
      },
    });

    if (!response.data?.hourly || !response.data?.daily) {
      throw new Error("Invalid weather API response");
    }

    const hourly = response.data.hourly;
    const daily = response.data.daily;

    const temps = hourly.temperature_2m || [];
    const rains = hourly.precipitation || [];

    const nextTemps = temps.slice(0, 3);
    const nextRains = rains.slice(0, 3);

    const next3Hours = {
      maxTemp: nextTemps.length ? Math.max(...nextTemps) : 0,
      totalRain: nextRains.reduce((a, b) => a + b, 0),
    };

    const fullDay = {
      maxTemp: daily.temperature_2m_max?.[0] || 0,
      minTemp: daily.temperature_2m_min?.[0] || 0,
      maxRain: daily.precipitation_sum?.[0] || 0,
    };

    return { next3Hours, fullDay, fallback: false };

  } catch (err) {
    console.error("❌ Weather API Error:", err.message);

    return {
      next3Hours: { maxTemp: 0, totalRain: 0 },
      fullDay: { maxTemp: 0, minTemp: 0, maxRain: 0 },
      fallback: true,
    };
  }
};