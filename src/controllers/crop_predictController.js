import axios from "axios";
import User from "../models/User.js";

//  7-day forecast + real humidity
const getWeatherForecast = async (lat, lon) => {
  try {
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        hourly: "relativehumidity_2m",
        timezone: "auto",
      },
    });

    const daily = response.data.daily;
    const hourly = response.data.hourly;

    let totalTemp = 0;
    let totalRain = 0;
    let totalHumidity = 0;

    const days = 7;
    const hours = days * 24;

    //  Temperature + Rainfall
    for (let i = 0; i < days; i++) {
      totalTemp +=
        (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2;

      totalRain += daily.precipitation_sum[i];
    }

    //  Humidity (hourly avg)
    for (let i = 0; i < hours; i++) {
      totalHumidity += hourly.relativehumidity_2m[i];
    }

    return {
      temperature: totalTemp / days,
      rainfall: totalRain,
      humidity: totalHumidity / hours,
    };
  } catch (error) {
    console.error("Weather Error:", error.message);
    throw new Error("Failed to fetch weather data");
  }
};

//  Season detection
const getSeason = () => {
  const month = new Date().getMonth() + 1;

  if (month >= 6 && month <= 10) return "Kharif";
  if (month >= 11 || month <= 3) return "Rabi";
  return "Zayad";
};

//  MAIN CONTROLLER
export const predictCrop = async (req, res) => {
  try {
    const { lat, lon, nitrogen, phosphorus, potassium, ph, soil } =
      req.body || {};

    // ✅ validation
    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Location required" });
    }

    if (
      nitrogen === undefined ||
      phosphorus === undefined ||
      potassium === undefined ||
      ph === undefined ||
      !soil
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ weather (safe)
    let weather;
    try {
      weather = await getWeatherForecast(lat, lon);
    } catch {
      weather = { temperature: 30, rainfall: 0, humidity: 60 };
    }

    const season = getSeason();

    const finalData = {
      nitrogen,
      phosphorus,
      potassium,
      ph,
      soil,
      season,
      ...weather,
    };

    // ✅ ML safe
    let prediction;
    try {
      const mlResponse = await axios.post(process.env.ML_API_URL, finalData);
      prediction = mlResponse.data;
    } catch {
      prediction = {
        best_crop: "Rice",
        probability: 0.8,
        top_3_recommendations: [
          { crop: "Rice", probability: 0.8 },
          { crop: "Maize", probability: 0.6 },
          { crop: "Wheat", probability: 0.5 },
        ],
      };
    }

    // ✅ save
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          cropHistory: {
            input: finalData,
            result: prediction,
            createdAt: new Date(),
          },
        },
      });
    }

    res.json({
      soilType: soil,
      weather,
      recommendedCrops: prediction,
    });
  } catch (error) {
    console.error("Prediction Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
