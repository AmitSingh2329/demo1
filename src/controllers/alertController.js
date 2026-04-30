import { getWeatherForAlerts } from "../services/weatherService.js";

export const getUserAlerts = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // ✅ Convert to number
    const latNum = Number(lat);
    const lonNum = Number(lon);

    // ✅ Validation
    if (!lat || !lon || isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({
        message: "Invalid latitude/longitude",
      });
    }

    // 🔥 Fetch weather safely
    const weather = await getWeatherForAlerts(latNum, lonNum);

    // ✅ Safe destructuring
    const next3Hours = weather?.next3Hours || {};
    const fullDay = weather?.fullDay || {};

    let alerts = [];

    // ⚡ NEXT 3 HOURS (HIGH PRIORITY)
    if (next3Hours.maxTemp && next3Hours.maxTemp > 40) {
      alerts.push({
        type: "Heatwave (Soon)",
        severity: "High",
        message: "High temperature expected in next 3 hours",
      });
    }

    if (next3Hours.totalRain && next3Hours.totalRain > 8) {
      alerts.push({
        type: "Rain (Soon)",
        severity: "High",
        message: "Rain expected in next few hours",
      });
    }

    // 📅 FULL DAY (MEDIUM PRIORITY)
    if (fullDay.maxTemp && fullDay.maxTemp > 42) {
      alerts.push({
        type: "Heatwave (Today)",
        severity: "Medium",
        message: "Extreme heat expected today",
      });
    }

    if (fullDay.maxRain && fullDay.maxRain > 20) {
      alerts.push({
        type: "Heavy Rain (Today)",
        severity: "Medium",
        message: "Heavy rainfall expected today",
      });
    }

    if (fullDay.minTemp && fullDay.minTemp < 3) {
      alerts.push({
        type: "Frost (Today)",
        severity: "Low",
        message: "Frost risk today",
      });
    }

    // ✅ Default alert
    if (alerts.length === 0) {
      alerts.push({
        type: "Normal",
        severity: "Low",
        message: "No significant alerts",
      });
    }

    // ✅ Response
    res.status(200).json({
      location: {
        lat: latNum,
        lon: lonNum,
      },
      weather,
      alerts,
    });

  } catch (error) {
    console.error("Alert Error:", error);

    res.status(500).json({
      message: "Failed to generate alerts",
      error: error.message, // 🔥 helpful for debugging
    });
  }
};