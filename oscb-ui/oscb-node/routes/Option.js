const express = require('express');
const router = express.Router();
const Option = require('../models/Option');

// Retrieve options using Mongoose
router.get('/node/options', async (req, res) => {
  try {
    const options = await Option.aggregate([
      {
        $group: {
          _id: '$field',
          options: { $addToSet: '$name' },
        },
      },
    ]);

    const optionsByField = options.reduce((acc, option) => {
      acc[option._id] = option.options;
      return acc;
    }, {});

    res.status(200).json(optionsByField);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
