import { getWeatherForAlerts } from "../services/weatherService.js";

export const getUserAlerts = async (req, res) => {
  try {
    const latNum = parseFloat(req.query.lat);
    const lonNum = parseFloat(req.query.lon);

    // ✅ Proper validation
    if (
      isNaN(latNum) || isNaN(lonNum) ||
      latNum < -90 || latNum > 90 ||
      lonNum < -180 || lonNum > 180
    ) {
      return res.status(400).json({
        message: "Invalid latitude/longitude",
      });
    }

    const weather = await getWeatherForAlerts(latNum, lonNum);

    // ✅ Handle API failure properly
    if (weather.fallback) {
      return res.status(200).json({
        location: { lat: latNum, lon: lonNum },
        alerts: [
          {
            type: "Unavailable",
            severity: "LOW",
            message: "Weather data temporarily unavailable",
          },
        ],
      });
    }

    const next3Hours = weather.next3Hours || {};
    const fullDay = weather.fullDay || {};

    const alerts = [];

    // ⚡ NEXT 3 HOURS
    if (next3Hours.maxTemp > 40) {
      alerts.push({
        type: "Heatwave (Soon)",
        severity: "HIGH",
        message: "High temperature expected in next 3 hours",
      });
    }

    if (next3Hours.totalRain > 8) {
      alerts.push({
        type: "Rain (Soon)",
        severity: "HIGH",
        message: "Rain expected in next few hours",
      });
    }

    // 📅 FULL DAY
    if (fullDay.maxTemp > 42) {
      alerts.push({
        type: "Heatwave (Today)",
        severity: "MEDIUM",
        message: "Extreme heat expected today",
      });
    }

    if (fullDay.maxRain > 20) {
      alerts.push({
        type: "Heavy Rain (Today)",
        severity: "MEDIUM",
        message: "Heavy rainfall expected today",
      });
    }

    if (fullDay.minTemp < 3) {
      alerts.push({
        type: "Frost (Today)",
        severity: "LOW",
        message: "Frost risk today",
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "Normal",
        severity: "LOW",
        message: "No significant alerts",
      });
    }

    res.status(200).json({
      location: { lat: latNum, lon: lonNum },
      weather: {
        next3Hours,
        fullDay,
      },
      alerts,
    });

  } catch (error) {
    console.error("❌ Alert Error:", error.message);

    res.status(500).json({
      message: "Failed to generate alerts",
    });
  }
};