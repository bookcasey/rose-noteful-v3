'use strict';
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

//Find/Search for notes using Note.find 
mongoose.connect(MONGODB_URI)
//{$or: [{"title": {$regex: searchTerm}}, {"content": {$regex: searchTerm} ] })
  .then(() => {
    const searchTerm = ' '; 
    let filter = {};

    const filterArray = [];

    if (searchTerm) {
      const title = { 'title': {$regex: searchTerm, $options: 'i' }};
      const content = { 'content': {$regex: searchTerm, $options: 'i' }};
      filterArray.push(title);
      filterArray.push(content);
      filter.$or = filterArray; 
    }
    
    return Note.find(filter).sort({ updatedAt: 'desc' });
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

// //Find note by id using Note.findById
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchId = '000000000000000000000003';

//     return Note.findById(searchId);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

//Create a new note using Note.create
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const newItem = {
//       title: 'new item',
//       content: 'new content'
//     };

//     return Note.create(newItem);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

//Update a note by id using Note.findByIdAndUpdate
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const idUpdate = '5b73299d6bf68dc852d73799';
//     const updateItem = {
//       title: 'updated item',
//       content: 'updated content',
//       new: true
//     };

//     return Note.findByIdAndUpdate(idUpdate, updateItem);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

//Delete a note by id using Note.findByIdAndRemove
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const idRemove = '5b73299d6bf68dc852d73799';
  
//     return Note.findByIdAndRemove(idRemove);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });