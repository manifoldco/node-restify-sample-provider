"use strict";

var _ = require("lodash");
var restify = require("restify");
var plugins = require('restify-plugins');
var manifoldSignature = require("@manifoldco/signature");

var MASTER_KEY = process.env.MASTER_KEY ||  manifoldSignature.MASTER_KEY;

var server = restify.createServer();

server.use(plugins.bodyParser({
  mapParams: true
}));
server.use(plugins.queryParser());

server.use(function(req, res, next) {
  var verifier = new manifoldSignature.Verifier(MASTER_KEY);
  verifier.test(req).then(function() {
    next();
  }).catch(function(err) {
    res.statusCode = err.statusCode || 500;
    return res.json({ message: err.message });
  });
});

var data = {
  products: ["bonnets"],
  plans: ["small", "large"],
  regions: ["aws::us-east-1"],
};

var db = {
  resources: {},
  credentials: {},
};

server.put("/v1/resources/:id", function(req, res, next) {
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
server.patch("/v1/resources/:id", function(req, res, next) {
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
server.del("/v1/resources/:id", function(req, res, next) {
  var resource = db.resources[req.params.id];
  if (!resource) {
    res.statusCode = 404;
    return res.json({ message: "no such resource" });
  }
  delete db.resources[req.params.id];

  res.statusCode = 204;
  res.end();
});

// Create credential
server.put("/v1/credentials/:id", function(req, res, next) {
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
      password: "meow",
    },
  });
});

// Delete credential
server.del("/v1/credentials/:id", function(req, res, next) {
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
