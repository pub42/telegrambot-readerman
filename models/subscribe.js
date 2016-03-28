'use strict';

/**
 * Module dependencies.
 */

const
  mongoose      = require('mongoose'),
  timestamp     = require('mongoose-timestamp'),
  deepPopulate  = require('mongoose-deep-populate');


/**
 * Subscribe Model Definition.
 * @type {Schema}
 */
const SubscribeSchema = new mongoose.Schema({
  feed: {
    type: mongoose.Schema.ObjectId,
    ref: 'Feed'
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

SubscribeSchema.plugin(timestamp);
SubscribeSchema.plugin(deepPopulate(mongoose));

mongoose.model('Subscribe', SubscribeSchema);
module.exports = exports = SubscribeSchema;