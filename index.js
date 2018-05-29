"use strict";

var _ = require("lodash");
var request = require("request");
var restify = require("restify");
var plugins = require("restify-plugins");
var session = require("restify-memory-session");
var auth = require('basic-auth');
var manifoldSignature = require("@manifoldco/signature");

var MASTER_KEY = process.env.MASTER_KEY ||  manifoldSignature.MASTER_KEY;
var CONNECTOR_URL = process.env.CONNECTOR_URL;
var CLIENT_SECRET = process.env.CLIENT_SECRET;
var CLIENT_ID = process.env.CLIENT_ID;

var data = {
  products: ["bonnets"],
  plans: ["small", "large"],
  regions: ["aws::us-east-1"],
};

var db = {
  resources: {},
  credentials: {},
};

var verifyMiddleware = function(req, res, next) {
  var verifier = new manifoldSignature.Verifier(MASTER_KEY);
  verifier.test(req).then(function() {
    next();
  }).catch(function(err) {
    res.statusCode = err.statusCode || 500;
    return res.json({ message: err.message });
  });
};

var server = restify.createServer();

server.use(plugins.bodyParser({
  mapParams: true
}));
server.use(plugins.queryParser());
server.use(session().sessionManager);

server.get("/dashboard", function(req, res, next) {
  if (!req.session.token) {
    res.statusCode = 401;
    return res.send("you must be logged in with Manifold");
  }

  request.get({
    url: CONNECTOR_URL + "/v1/users/self",
    headers: {
      authorization: "Bearer " + req.session.token,
    }
  }, function(err, resp) {
    var html = "";
    res.end(html);
  });
});

server.get('/test', function(req, res, next) {
  res.redirect('/dashboard', next);
});

// NOTE: Verifier middleware is not used for SSO requests
server.get("/v1/sso", function(req, res, next) {
  request.post({
    url: CONNECTOR_URL + "/v1/oauth/tokens",
    auth: {
      user: CLIENT_ID,
      pass: CLIENT_SECRET,
    },
    form: {
      grant_type: "authorization_code",
      code: req.query.code,
    },
    json: true,
  }, function(err, resp) {
    if (err || (resp.body && resp.body.error)) {
      res.statusCode = 401;
      return res.send("This is a page that the user would see");
    }

    if (resp.statusCode !== 200) {
      res.statusCode = 500;
      return res.send("Could not complete request authentication")
    }
    req.session.token = resp.body.access_token;
    req.session.resource = req.query.resource_id;
    res.redirect(302, '/dashboard', next);
  });
});

// Update resource
server.put("/v1/resources/:id", verifyMiddleware, function(req, res, next) {
  if (data.plans.indexOf(req.body.plan) === -1) {
    res.statusCode = 400;
    return res.json({ message: "bad plan" });
  }
  if (data.products.indexOf(req.body.product) === -1) {
    res.statusCode = 400;
    return res.json({ message: "bad product" });
  }
  if (data.regions.indexOf(req.body.region) === -1) {
    res.statusCode = 400;
    return res.json({ message: "bad region" });
  }

  var existing = db.resources[req.params.id];
  if (existing && !_.isEqual(existing, req.body)) {
    res.statusCode = 409;
    return res.json({
      message: "resource already exists",
    });
  }

  db.resources[req.params.id] = req.body;

  res.statusCode = 201;
  res.json({
    message: "your digital cat bonnet is ready",
  });
});

// Update resource
server.patch("/v1/resources/:id", verifyMiddleware, function(req, res, next) {
  if (data.plans.indexOf(req.body.plan) === -1) {
    res.statusCode = 400;
    return res.json({ message: "bad plan" });
  }
  var resource = db.resources[req.params.id];
  if (!resource) {
    res.statusCode = 404;
    return res.json({ message: "no such resource" });
  }

  res.json({
    message: "your digital cat bonnet has been changed",
  });
});

// Delete resource
server.del("/v1/resources/:id", verifyMiddleware, function(req, res, next) {
  var resource = db.resources[req.params.id];
  if (!resource) {
    res.statusCode = 404;
    return res.json({ message: "no such resource" });
  }
  delete db.resources[req.params.id];

  res.statusCode = 204;
  res.end();
});

// Get measures resource
server.get("/v1/resources/:id/measures", verifyMiddleware, function(req, res, next) {
  var resource = db.resources[req.params.id];
  if (!resource) {
    res.statusCode = 404;
    return res.json({ message: "no such resource" });
  }

  res.statusCode = 200;
  res.json({
    resource_id: req.params.id,
    period_start: "2018-05-01T00:00:00.000Z",
    period_end: "2018-05-31T23:59:59.000Z",
    measures: { "feature-a": 0, "feature-b": 1000 }
  });
});

// Create credential
server.put("/v1/credentials/:id", verifyMiddleware, function(req, res, next) {
  var resource = db.resources[req.body.resource_id];
  if (!resource) {
    res.statusCode = 404;
    return res.json({ message: "no such resource" });
  }
  db.credentials[req.params.id] = req.body;

  res.statusCode = 201;
  res.json({
    message: "your cat bonnet password is ready",
    credentials: {
      PASSWORD: "meow",
    },
  });
});

// Delete credential
server.del("/v1/credentials/:id", verifyMiddleware, function(req, res, next) {
  var credential = db.credentials[req.params.id];
  if (!credential) {
    res.statusCode = 404;
    return res.json({ message: "no such credential" });
  }
  delete db.credentials[req.params.id];

  res.statusCode = 204;
  res.end();
});

module.exports = server;
