import axios from "axios";
import User from "../models/User.js";

// 🌦️ Weather Service
const getWeatherForecast = async (lat, lon) => {
  try {
    const response = await axios.get(
      process.env.WEATHER_API_URL || "https://api.open-meteo.com/v1/forecast",
      {
        params: {
          latitude: lat,
          longitude: lon,
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
          hourly: "relativehumidity_2m",
          timezone: "auto",
        },
        timeout: 5000,
      }
    );

    const daily = response.data?.daily || {};
    const hourly = response.data?.hourly || {};

    const maxTemps = daily.temperature_2m_max || [];
    const minTemps = daily.temperature_2m_min || [];
    const rains = daily.precipitation_sum || [];
    const humidityArr = hourly.relativehumidity_2m || [];

    const days = Math.min(7, maxTemps.length, minTemps.length, rains.length);
    const hours = Math.min(days * 24, humidityArr.length);

    let totalTemp = 0;
    let totalRain = 0;
    let totalHumidity = 0;

    for (let i = 0; i < days; i++) {
      totalTemp += (maxTemps[i] + minTemps[i]) / 2;
      totalRain += rains[i];
    }

    for (let i = 0; i < hours; i++) {
      totalHumidity += humidityArr[i];
    }

    return {
      temperature: days ? totalTemp / days : 30,
      rainfall: totalRain,
      humidity: hours ? totalHumidity / hours : 60,
      fallback: false,
    };

  } catch (error) {
    console.error("❌ Weather Error:", error.message);

    return {
      temperature: 30,
      rainfall: 0,
      humidity: 60,
      fallback: true,
    };
  }
};

// 🌾 Season Detection
const getSeason = () => {
  const month = new Date().getMonth() + 1;

  if (month >= 6 && month <= 10) return "Kharif";
  if (month >= 11 || month <= 3) return "Rabi";
  return "Zayad";
};

// 🌱 MAIN CONTROLLER
export const predictCrop = async (req, res) => {
  try {
    let { lat, lon, nitrogen, phosphorus, potassium, ph, soil } = req.body || {};

    // ✅ Convert & validate
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const n = Number(nitrogen);
    const p = Number(phosphorus);
    const k = Number(potassium);
    const phVal = Number(ph);

    if (
      isNaN(latNum) || isNaN(lonNum) ||
      isNaN(n) || isNaN(p) || isNaN(k) || isNaN(phVal) ||
      !soil
    ) {
      return res.status(400).json({ error: "Invalid or missing input values" });
    }

    // 🌦️ Weather
    const weather = await getWeatherForecast(latNum, lonNum);

    const season = getSeason();

    const finalData = {
      nitrogen: n,
      phosphorus: p,
      potassium: k,
      ph: phVal,
      soil,
      season,
      temperature: weather.temperature,
      rainfall: weather.rainfall,
      humidity: weather.humidity,
    };

    // 🤖 ML Prediction
    let prediction;

    try {
      if (!process.env.ML_CROP_API) {
        throw new Error("ML API not configured");
      }

      const mlResponse = await axios.post(
        `${process.env.ML_CROP_API}/predict`,
        finalData,
        { timeout: 5000 }
      );

      prediction = mlResponse.data;

    } catch (err) {
      console.error("❌ ML Error:", err.message);

      // ✅ DEMO FALLBACK (controlled)
      prediction = {
        fallback: true,
        message: "Demo mode: showing sample recommendation",
        best_crop: "Rice",
        probability: 0.8,
        top_3_recommendations: [
          { crop: "Rice", probability: 0.8 },
          { crop: "Maize", probability: 0.6 },
          { crop: "Wheat", probability: 0.5 },
        ],
      };
    }

    // 💾 Save History (safe)
    if (req.user?._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            cropHistory: {
              input: finalData,
              result: prediction,
              createdAt: new Date(),
            },
          },
        },
        { returnDocument: "before" }
      );
    }

    // 📤 Response
    res.json({
      soilType: soil,
      season,
      weather: {
        temperature: weather.temperature,
        rainfall: weather.rainfall,
        humidity: weather.humidity,
        fallback: weather.fallback,
      },
      recommendedCrops: prediction,
    });

  } catch (error) {
    console.error("❌ Prediction Error:", error.message);

    res.status(500).json({
      error: "Prediction failed",
    });
  }
};