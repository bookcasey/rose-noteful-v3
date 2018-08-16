'use strict';
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema ({
  title: {
    type: String, required: true, unique: true
  },
  content: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }
}); 
//Adds createdAt and updatedAt fields and also updates those each times doc inserted or created
noteSchema.set('timestamps', true);

const Note = mongoose.model('Note', noteSchema);

noteSchema.set('toObject', {
  virtuals: true,     // include built-in virtual `id`
  versionKey: false,  // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
  }
});

module.exports = Note; 