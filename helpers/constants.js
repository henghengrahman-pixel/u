const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

module.exports = {
  DATA_DIR,
  ORDER_STATUSES: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']
};
