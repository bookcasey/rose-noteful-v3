'use strict';

const mongoose = require('mongoose');

// const mongoose = require('mongoose'); don't need because line 9 references Note model

const folderSchema = new mongoose.Schema({
  name: {type: String, required: true, unique: true}
});

folderSchema.set('timestamps', true);

const Folder = mongoose.model('Folder', folderSchema);

folderSchema.set('toObject', {
  virtuals: true,     // include built-in virtual `id`
  versionKey: false,  // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
  }
});

module.exports = Folder;