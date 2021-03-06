var nano         = require('nano')
  , EventEmitter = require('events').EventEmitter;

module.exports = function(config) {
  var creatingDB = false
    , server, db;
  
  if (typeof(config) !== 'object') { throw new Error('Please define the config argument to this module as an object with .url and .db'); }
  if (! config.url) { config.url = 'http://localhost:5984'; }
  if (! config.db) { throw new Error('Please define config.db'); }
  
  server = nano(config.url);
  db = server.use(config.db);
  
  function createDB(done) {
    var replied = false;
    
    if (! creatingDB) {
      creatingDB = new EventEmitter();
      server.db.create(config.db, function(err) {

        if (replied) { throw new Error('replied earlier!'); }
        replied = true;

        if (err) {
          done(err);
          creatingDB.emit('done', err);
        } else {
          done();
          creatingDB.emit('done');
        }
        creatingDB = false
      });
    } else {
      creatingDB.on('done', done);
    }
  }
  
  function load(docId, done, dontRepeat) {
    var replied = false;
    
    db.get(docId, function(err, doc) {
      if (replied) { throw new Error('replied earlier!'); }
      replied = true;
      if (err) {
        if (err.message == 'no_db_file' && ! dontRepeat) {
          return createDB(function(err) {
            if (err) { return done(err); }
            return load(docId, done, true);
          })
        }
        return done(err);
      }
      done(null, doc);
    });
  }
  
  function save(doc, done, dontRepeat) {
    var insertArgs = [doc]
      , docId = doc.id || doc._id
      , replied = false;
      
    if (docId) { insertArgs.push(docId); }
    insertArgs.push(function(err, response) {

      if (replied) { throw new Error('replied earlier!'); }
      replied = true;
      
      if (err) {
        if (err.message == 'no_db_file' && ! dontRepeat) {
          return createDB(function(err) {
            if (err) { return done(err); }
            return save(doc, done, true);
          })
        }
        return done(err);
      }
      
      if (response.id) { doc._id = response.id; }
      if (response.rev) { doc._rev = response.rev; }
      done(null, doc);
    });
    
    db.insert.apply(db, insertArgs);
  }
  
  function backToRevision(docId, revision, done, dontRepeat) {
    if (typeof(docId) === 'object') { docId = docId.id || docId._id; }
    db.get(docId, {rev: revision}, function(err, oldVer) {
      if (err) {
        if (err.message == 'no_db_file' && ! dontRepeat) {
          return createDB(function(err) {
            if (err) { return done(err); }
            return backToRevision(docId, revision, done, true);
          })
        }
        return done(err);
      }
      if (err) { return done(err); }
      db.get(docId, function(err, doc) {
        if (err) { return done(err); }
        oldVer._rev = doc._rev;
        db.insert(oldVer, function(err, response) {
          if (err) { return done(err); }
          if (response.id) { oldVer._id = response.id; }
          if (response.rev) { oldVer._rev = response.rev; }
          done(null, oldVer);
        });
      });
    });
  }
  
  return {
      load: load
    , save: save
    , backToRevision: backToRevision
  };
};