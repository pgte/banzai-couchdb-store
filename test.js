var store  = require('./')({db: 'test_doc_store'})
  , assert = require('assert')
  , EventEmitter = require('events').EventEmitter
  , nano = require('nano')
  , server = nano('http://localhost:5984')
  , done = new EventEmitter();

server.db.destroy('test_doc_store', function(err) {
  done.emit('done');
});

module.exports.test_1 = function(beforeExit) {
  var cb1 = false
    , cb2 = false
    , doc_id;
  
  done.once('done', function() {
    store.save({a:1, b:2}, function(err, doc) {
      assert.ok(! cb1);
      cb1 = true;
      assert.isNull(err);
      assert.isNotNull(doc.id);
      doc_id = doc._id;
      delete doc._id;
      delete doc._rev;
      assert.eql(doc, {a:1, b:2});

      store.load(doc_id, function(err, doc) {
        assert.ok(! cb2);
        cb2 = true;
        assert.isNull(err);
        assert.isNotNull(doc.id);
        assert.eql(doc.id, doc_id);
        delete doc.id;
        delete doc._rev;
        assert.eql(doc, {a:1, b:2});
      });

    });
  });
  
  beforeExit(function() {
    assert.ok(cb1);
    assert.ok(cb2);
  });
};

module.exports.test_2 = function(beforeExit) {
  var cb1 = false
    , cb2 = false
    , doc_id;

  done.once('done', function() {
    store.save({c:1, d:2}, function(err, doc) {
      assert.ok(! cb1);
      cb1 = true;
      assert.isNull(err);
      assert.isNotNull(doc.id);
      doc_id = doc._id;
      delete doc._id;
      delete doc._rev;
      assert.eql(doc, {c:1, d:2});

      store.load(doc_id, function(err, doc) {
        assert.ok(! cb2);
        cb2 = true;
        assert.isNull(err);
        assert.isNotNull(doc.id);
        assert.eql(doc.id, doc_id);
        delete doc.id;
        delete doc._rev;
        assert.eql(doc, {c:1, d:2});
      });

    });
  });  
  
  beforeExit(function() {
    assert.ok(cb1);
    assert.ok(cb2);
  });
};