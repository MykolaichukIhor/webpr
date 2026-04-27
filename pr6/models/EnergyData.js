const mongoose = require('mongoose');

const solarGenerationSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  power: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
  panelCount: Number,
  efficiency: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const windGenerationSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  power: {
    type: Number,
    required: true,
    min: 0
  },
  windSpeed: {
    type: Number,
    required: true
  },
  turbine: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SolarGeneration = mongoose.model('SolarGeneration', solarGenerationSchema);
const WindGeneration = mongoose.model('WindGeneration', windGenerationSchema);

module.exports = { SolarGeneration, WindGeneration };