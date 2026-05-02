import axios from "axios";
import User from "../models/User.js";

// 🌧️ Get annual rainfall using Open-Meteo (scaled)
const getAnnualRainfall = async (lat, lon) => {
  try {
    const response = await axios.get(
      "https://api.open-meteo.com/v1/forecast",
      {
        params: {
          latitude: lat,
          longitude: lon,
          daily: "precipitation_sum",
          past_days: 7, // recent history
          timezone: "auto",
        },
        timeout: 5000,
      }
    );

    const rainArray = response.data?.daily?.precipitation_sum || [];

    if (!rainArray.length) return 1000; // fallback

    const totalRecentRain = rainArray.reduce((sum, val) => sum + val, 0);

    const avgDailyRain = totalRecentRain / rainArray.length;

    // 📊 Convert to yearly rainfall
    const annualRainfall = avgDailyRain * 365;

    return Number(annualRainfall.toFixed(2));

  } catch (err) {
    console.error("❌ Rainfall API Error:", err.message);
    return 1000; // safe fallback
  }
};

export const predictYield = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    let {
      crop,
      year,
      state,
      area,
      fertilizer,
      pesticide,
      lat,
      lon,
    } = req.body;

    // ✅ Validation
    if (
      !crop || !year || !state ||
      area == null || fertilizer == null ||
      pesticide == null || lat == null || lon == null
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including location are required",
      });
    }

    const yearNum = Number(year);
    const areaNum = Number(area);
    const fertNum = Number(fertilizer);
    const pestNum = Number(pesticide);

    if (
      isNaN(yearNum) ||
      isNaN(areaNum) ||
      isNaN(fertNum) ||
      isNaN(pestNum)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid numeric values",
      });
    }

    // 🌧️ Fetch rainfall from Open-Meteo
    const rainfall = await getAnnualRainfall(lat, lon);

    // 📅 Season = Whole Year (dataset aligned)
    const season = "WholeYear";

    const inputData = {
      crop,
      year: yearNum,
      season,
      state,
      area: areaNum,
      rainfall,
      fertilizer: fertNum,
      pesticide: pestNum,
    };

    let result;

    // 🤖 ML API
    try {
      if (!process.env.ML_YIELD_API) {
        throw new Error("ML API missing");
      }

      const response = await axios.post(
        `${process.env.ML_YIELD_API}/predict`,
        inputData,
        { timeout: 5000 }
      );

      result = response.data;

    } catch (mlError) {
      console.error("❌ ML Yield Error:", mlError.message);

      result = {
        fallback: true,
        message: "Prediction service unavailable",
        predicted_yield: "N/A",
      };
    }

    // 💾 Save history
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          yieldHistory: {
            $each: [
              {
                input: inputData,
                result,
                createdAt: new Date(),
              },
            ],
            $slice: -20,
          },
        },
      },
      { returnDocument: "before" }
    );

    // 📤 Response
    res.json({
      success: true,
      season,
      rainfallUsed: rainfall,
      result,
    });

  } catch (err) {
    console.error("❌ Yield Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Yield prediction failed",
    });
  }
};