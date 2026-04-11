const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  field: { type: String, required: true },
  name: { type: String, required: true },
});

// Create a unique compound index on 'field' and 'name' fields
optionSchema.index({ field: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Option', optionSchema);
