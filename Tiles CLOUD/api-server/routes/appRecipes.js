var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var AppRecipe = mongoose.model('AppRecipe');
var appRepository = require('../appcode-repository.js');
var templateBuilder = require('../appcode-template-builder.js');

router.post('/:userId', function(req, res, next) {
    var userId = req.params.userId;
    var name = req.body.name;
    var code = req.body.template ? templateBuilder.build(userId, req.body.template) : '';
    var config = req.body.config || {};
    var group = req.body.group;

    if (typeof name !== 'undefined') {
        AppRecipe.create({
            name: name,
            user: userId,
            group: group
        }, function(err, appRecipe) {
            if (err) return next(err);
            appRepository.create(appRecipe._id, userId, code, config);
            return res.json(appRecipe);
        })
    } else {
        return res.status(400).end();
    }
});

router.get('/:userId', function(req, res, next) {
    var userId = req.params.userId;

    AppRecipe.find({
        user: userId
    }, function(err, appRecipes) {
        if (err) return next(err);
        return res.json(appRecipes);
    });
});

router.put('/:userId/:appId', function(req, res, next) {
    var appId = req.params.appId;
    var userId = req.params.userId;
    var code = req.body.code;
    var group = req.body.group;

    if (typeof code !== 'undefined') {
        appRepository.update(appId, userId, code);
        if (typeof group !== 'undefined') {
            AppRecipe.findByIdAndUpdate(appId, {group : group}, {new: true}, function(err, appRecipe){
                if (err) return next(err);
                return res.json(appRecipe);
            });
        } else {
            return res.status(200).end();
        }
    } else {
        return res.status(400).end();
    }
});

router.get('/:userId/:appId', function(req, res, next) {
    var appId = req.params.appId;

    AppRecipe.findById(appId, function(err, appRecipe) {
        if (err) return next(err);
        return res.json(appRecipe);
    });
});

router.get('/:userId/:appId/code', function(req, res, next) {
    var appId = req.params.appId;
    var userId = req.params.userId;

    appRepository.read(appId, userId, function(err, data) {
        if (err) {
            console.log(err);
            res.status(404).end();
        } else {
            res.json(data);
        }
    })
});

router.delete('/:userId/:appId', function(req, res, next) {
    var appId = req.params.appId;
    var userId = req.params.userId;

    AppRecipe.findByIdAndRemove(appId, function(err) {
        if (err) return next(err);
        appRepository.delete(appId, userId, function(err){
            if (err) return next(err);
            return res.status(204).end();
        });
    });
});

router.put('/:userId/:appId/active', function(req, res, next) {
    var appId = req.params.appId;
    var active = req.body.active;

    if (typeof active !== 'undefined') {
        console.log('Active: ' + active + ' type: ' + (typeof active));
        AppRecipe.findById(appId, function(err, appRecipe) {
            if (err) return next(err);
            if (active) {
                appRecipe.activate(function(err, appRecipe) {
                    if (err) return next(err);
                    return res.json(appRecipe);
                });
            } else {
                appRecipe.deactivate(function(err, appRecipe) {
                    if (err) return next(err);
                    return res.json(appRecipe);
                });
            }
        });
    } else {
        return res.status(400).end();
    }
});

router.put('/:userId/:appId/config', function(req, res, next) {
    var appId = req.params.appId;
    var userId = req.params.userId;
    var config = req.body;

    if (typeof config !== 'undefined') {
        appRepository.update(appId, userId, null, config);
        return res.status(200).end();
    } else {
        return res.status(400).end();
    }
});

module.exports = router;