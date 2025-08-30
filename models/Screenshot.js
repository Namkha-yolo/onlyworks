const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  imageUrl: { type: String, required: true },
  imagePath: { type: String, required: true },
  trigger: { type: String, required: true },
  goal: { type: String, required: true },
  aiAnalysis: {
    productivityScore: { type: Number, min: 0, max: 100 },
    activity: String,
    insights: [String]
  },
  fileSize: Number,
  capturedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Screenshot', screenshotSchema);