'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSorted = require('chai-sorted');
const chaiId = require('chaid');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');

const seedFolders = require('../db/seed/folders');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSorted);
chai.use(chaiId);

describe('Noteful API resource', function() {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  
  beforeEach(function () {
    return Promise.all([ 
      Folder.insertMany(seedFolders),
      Folder.createIndexes()
    ]);
  });
  
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });
  
  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function() {
    it('should return all existing folders sorted by name', function() {
      let res;
      return chai.request(app)
        .get('/api/folders')
        .then(function(_res) {
          res = _res; //make res available outside scope of this block
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.lengthOf.at.least(1);
          expect(res.body).to.be.sortedBy('name');
          return Folder.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
    it('should return folder with right fields', function() {
      
      let resFolder;
      return chai.request(app)
        .get('/api/folders')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(folder) {
            expect(folder).to.be.an('object');
            expect(folder).to.include.keys(
              'id', 'name', 'createdAt', 'updatedAt');    
          });
          resFolder = res.body[0];
          return Folder.findById(resFolder.id);
        })
        .then(function(folder) {
          expect(resFolder.id).to.equal(folder.id);
          expect(resFolder.title).to.equal(folder.title);
          expect(resFolder.content).to.equal(folder.content);
          expect(new Date(resFolder.createdAt)).to.eql(folder.createdAt);
          expect(new Date(resFolder.updatedAt)).to.eql(folder.updatedAt);
          
        });
    });
  });
   
  describe('GET /api/folders/:id', function () {
    it('should return correct folder', function () {
      let data;
      // 1) First, call the database
      return Folder.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('POST /api/folders', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'name': 'New Folder Name',
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/folders')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Folder.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT /api/folders/:id', function() {
    it('should update folder when passed valid data', function() {
      const updateData = {
        name: 'updated name',
      };

      let res;
      return Folder
        .findOne()
        .then(function(folder) {
          updateData.id = folder.id;

          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .send(updateData);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(updateData.id);
          expect(res.body.name).to.equal(updateData.name);

          return Folder.findById(res.body.id);
        })
        .then(function(folder) {
          expect(folder.id).to.equal(res.body.id);
          expect(folder.name).to.equal(res.body.name);
          expect(new Date(res.body.createdAt)).to.eql(folder.createdAt); //eql (objects or arrays) vs equal (strings or numbers)
          expect(new Date(res.body.updatedAt)).to.eql(folder.updatedAt);
        });
    });
  });

  describe('DELETE /api/folder/:id', function() {
    it('should delete a folder by id', function() {
      let folder;

      return Folder
        .findOne()
        .then(function(_folder) {
          folder = _folder;
          return chai.request(app).delete(`/api/folders/${folder.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Folder.findById(folder.id);
        })
        .then(function(_folder) {
          expect(_folder).to.be.null;
        });
    });
  });

});