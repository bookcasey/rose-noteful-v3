'use strict';

const express = require('express');

const router = express.Router();

// const mongoose = require('mongoose'); don't need because line 9 references Note model

const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  //why query and not params? 
  //localhost:8080/api/notes endpoint 
  //to use query object need an endpoint like this: localhost:8080/api/notes?searchTerm=cats&&page=1
  //everything after ? is the query string
  //req.query = {searchTerm: cats}  is an object inside express 
  const searchTerm = req.query.searchTerm; 
  let filter = {};
  const filterArray = [];

  if (searchTerm) {
    const title = { 'title': {$regex: searchTerm, $options: 'i' }};
    const content = { 'content': {$regex: searchTerm, $options: 'i' }};
    filterArray.push(title);
    filterArray.push(content);
    filter.$or = filterArray; //if searchTerm is in title or the content field = true  
  }
  
  Note
    .find(filter)
    .sort({ updatedAt: 'desc' })
    .then(notes => {
      res.json(notes);
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
  Note
    .findById(id)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  if (!('title' in req.body)) {
    const message = 'Missing title in request body';
    console.error(message);
    return res.status(400).send(message);
  }

  const newItem = {
    title: req.body.title,
    content: req.body.content
  };
    
  Note
    .create(newItem)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
    
  // console.log('Create a Note');
  // res.location('path/to/new/document').status(201).json({ id: 2, title: 'Temp 2' });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
    
  const updateItem = {};

  //Review documentation
  Object.keys(req.body).forEach(key => updateItem[key] = req.body[key]);

  Note
    .findByIdAndUpdate(id, updateItem, {new: true})
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });

  // console.log('Update a Note');
  // res.json({ id: 1, title: 'Updated Temp 1' });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const idRemove = '5b73299d6bf68dc852d73799';
  Note
    .findByIdAndRemove(idRemove)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;