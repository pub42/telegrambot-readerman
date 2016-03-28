'use strict';

/**
 * Module dependencies.
 */

const
  mongoose      = require('mongoose'),
  timestamp     = require('mongoose-timestamp'),
  deepPopulate  = require('mongoose-deep-populate'),
  autoIncrement = require('mongoose-auto-increment');

/**
 * Feed Model Definition.
 * @type {Schema}
 */
const FeedSchema = new mongoose.Schema({
  url: String,
  title: String,
  lastModified: Date,
  lastRecordLink: String,
  number: Number
});

FeedSchema.plugin(timestamp);
FeedSchema.plugin(autoIncrement.plugin, {
  model: 'Feed',
  field: 'number',
  startAt: 1
});
FeedSchema.plugin(deepPopulate(mongoose));

mongoose.model('Feed', FeedSchema);
module.exports = exports = FeedSchema;