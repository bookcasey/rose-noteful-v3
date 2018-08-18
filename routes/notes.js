'use strict';

const express = require('express');
const mongoose = require('mongoose');
// const ObjectId = require('mongoose').Types.ObjectId;

const router = express.Router(); //creates router instance (mini-app)

const Note = require('../models/note'); //does the order matter (b4 or after line 7)

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  //why query and not params? 
  //localhost:8080/api/notes endpoint 
  //to use query object need an endpoint like this: localhost:8080/api/notes?searchTerm=cats&&page=1
  //everything after ? is the query string
  //req.query = {searchTerm: cats}  is an object inside express 
  const { searchTerm, folderId, tagId } = req.query; 

  let filter = {};
  console.log(req.query);
  // const filterArray = [];

  if (searchTerm) {
    //searchTerm is in either title or content
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
    // const title = { 'title': {$regex: searchTerm, $options: 'i' }};
    // const content = { 'content': {$regex: searchTerm, $options: 'i' }};
    // filterArray.push(title);
    // filterArray.push(content);
    // filterArray.push(folderId);
    // filter.$or = filterArray; //if searchTerm is in title or the content field = true  
  }

  if(folderId) {
    filter.folderId = folderId;
  }

  if(tagId) {   //event listener refers to tagId 
    filter.tags = tagId; 
  }

  Note
    .find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next(); //404 
      }
    })
    .catch(err => {
      next(err);
    });
});
 
// console.log('Get All Notes');
// res.json([
//   { id: 1, title: 'Temp 1' },
//   { id: 2, title: 'Temp 2' },
//   { id: 3, title: 'Temp 3' }
// ]);


/* ========== GET/READ A SINGLE ITEM ========== */
//path params. paramater inside the path, need : 
//localhost:8080/api/notes/63278
//req.params = {id: 63278}
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The id is not valid');
    err.status = 400;
    return next(err);
  }
  Note
    .findById(id).populate('tags')
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  const newNote = { title, content };

  if (folderId) {  
    try { 
      mongoose.Types.ObjectId.isValid(folderId);
    } catch(err) {
      return next(err);
    } 
    newNote.folderId = folderId;
  }
  //add for loop to check each tags indexes valid 
  if (tags) {  //verify each tag id is valid Object Id 
    for (let i = 0; i < tags.length; i++) {
      try {
        mongoose.Types.ObjectId.isValid(tags);
      } catch(err) {
        return next(err);
      }
    } 
    newNote.tags = tags;
  }
    
  Note
    .create(newNote)
    .then(result => {
      res
        .location(`http://${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result); 
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;  

  //validate input
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The id is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId) {
    try {
      mongoose.Types.ObjectId.isValid(folderId);
    } catch(err) {
      return next(err);
    }
  } 

  if (tags) {  //verify each tag id is valid Object Id 
    try {
      mongoose.Types.ObjectId.isValid(tags);
    } catch(err) {
      return next(err);
    }
  } 
  const updateNote = { title, content, folderId };

  //Original beautiful solution by Burke
  //Object.keys(req.body).forEach(key => updateItem[key] = req.body[key]);

  Note
    .findByIdAndUpdate(id, updateNote, {new: true})
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  //validate input
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note
    .findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204).end(); //review .end() 
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;