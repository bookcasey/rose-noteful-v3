'use strict';
const mongoose = require('mongoose');

const noteSchema = new mongoose ({
  title: {
    type: String, required: true, unique: true
  },
  content: String
}); 

noteSchema.set('timestamps', true);

const NoteModel = mongoose.model('Note', noteSchema);

module.exports = NoteModel; 