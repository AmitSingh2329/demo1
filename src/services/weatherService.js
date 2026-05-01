import axios from "axios";

export const getWeatherForAlerts = async (lat, lon) => {
  try {
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
      withCredentials: false, // 🔥 ADD THIS LINE
      params: {
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m,precipitation",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
      },
      timeout: 5000,
    });

    const hourly = response.data?.hourly || {};
    const daily = response.data?.daily || {};

    const temps = hourly.temperature_2m || [];
    const rains = hourly.precipitation || [];

    const next3Hours = {
      maxTemp: temps.length ? Math.max(...temps.slice(0, 3)) : 0,
      totalRain: rains.length
        ? rains.slice(0, 3).reduce((a, b) => a + b, 0)
        : 0,
    };

    const fullDay = {
      maxTemp: daily.temperature_2m_max?.[0] || 0,
      minTemp: daily.temperature_2m_min?.[0] || 0,
      maxRain: daily.precipitation_sum?.[0] || 0,
    };

    return { next3Hours, fullDay };
  } catch (err) {
    console.log("Weather API Failed → Using fallback");

    // ✅ NEVER crash — return safe fallback
    return {
      next3Hours: {
        maxTemp: 0,
        totalRain: 0,
      },
      fullDay: {
        maxTemp: 0,
        minTemp: 0,
        maxRain: 0,
      },
    };
  }
};
