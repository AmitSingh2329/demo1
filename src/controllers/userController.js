import User from "../models/User.js";

// 🗑 Delete Crop History
export const deleteCropHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);

    // 🔥 FIX: safe filter
    user.cropHistory = user.cropHistory.filter(
      (item) => item._id.toString() !== id
    );

    await user.save();

    res.json({ message: "Crop deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
};

// 🗑 Delete Disease History
export const deleteDiseaseHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);

    user.diseaseHistory = user.diseaseHistory.filter(
      (item) => item._id.toString() !== id
    );

    await user.save();

    res.json({ message: "Disease deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};