import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  location: {
    lat: Number,
    lon: Number
  },

 cropHistory: [
  {
    input: Object,
    result: Object,
    createdAt: { type: Date, default: Date.now }
  }
],
  diseaseHistory: [
    {
      image: String,
      result: {
        disease: String
      },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  yieldHistory: [],

}, { timestamps: true });

export default mongoose.model("User", userSchema);