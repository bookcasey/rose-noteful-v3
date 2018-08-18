'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Folder = require('../models/folder');
const Note = require('../models/note');


/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  return Folder.find()
    .sort('name') 
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ ONE ITEM BY ID ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params; 
  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The id entered is not a valid ID');
    err.status = 400;
    return next(err);
  }
  Folder
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
  const {name} = req.body;
  if (!name) {
    const message = 'Missing name in request body';
    console.error(message);
    return res.status(400).send(message);
  }
  const newFolder = {name};
  
  Folder
    .create(newFolder)
    .then(result => {
      if(result) {
        res.location(`http://${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result); 
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const {id} = req.params;
  const {name} = req.body;
  
  if (!name) {
    const err = new Error('Missing name in request body');
    err.status = 400;
    return next(err);
  } 
  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The id entered is not a valid ID');
    err.status = 400;
    return next(err);
  } 
  const updateFolder = {name};
  Folder
    .findByIdAndUpdate(id, updateFolder, {new: true})
    .then(results => {
      res.json(results);
      next();
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The id entered is not a valid ID');
    err.status = 400;
    return next(err);
  } 
  const folderRemove = Folder.findByIdAndRemove(id);
  const noteRemove = Note.updateMany( 
    { folderId: id }, { $unset: {folderId: '' } }
  );

  Promise.all([folderRemove, noteRemove])
    .then(() => {
      res.status(204).end()
        .catch(err => {
          next(err);
        });
    });

  // Folder
  //   .findByIdAndRemove(req.params.id)
  //   .then(() => {
  //     res.sendStatus(204);
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
});


module.exports = router;