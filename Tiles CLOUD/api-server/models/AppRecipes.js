var mongoose = require('mongoose');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var child_process = require('child_process');
var appProcesses = [];

var wsPort = 3001;
http.listen(wsPort, function(){
    console.log('WebSocket server listening on port: ' + wsPort );
});

var AppRecipeSchema = new mongoose.Schema({
    name: String,
    active: Boolean,
    group: String,
    user: {type: String, ref: 'User'}
});

AppRecipeSchema.methods.activate = function(callback) {
    var args = [this._id, this.user, this.group];
    var options = {silent: true};

    var cp = child_process.fork('vm_exec', args, options);
    var that = this;

    var nsp = io.of('/'+this._id);
    nsp.emit('app_status', 'started');

    nsp.on('connection', function(socket){
        console.log('Someone connected');
    });

    cp.on('uncaughtException', function(err) {
        console.log('Caught exception: ' + err);
    });

    cp.on('close', function(code) {
        console.log('Child process exited with code: ' + code);
        nsp.emit('app_status', 'closed');
        that.active = false;
        that.save();
    });

    cp.stdout.setEncoding('utf-8');
    cp.stdout.on('data', function(data){
        nsp.emit('stdout_data', data);
        console.log('stdout_data: ' + data);
    } );
    
    cp.stderr.setEncoding('utf-8');
    cp.stderr.on('data', function (data) {
        nsp.emit('stderr_data', data);
        console.log('stdout_err: ' + data);
    })

    this.active = true;
    this.save(callback);

    appProcesses[this._id] = cp;
}

AppRecipeSchema.methods.deactivate = function(callback) {
    var process = appProcesses[this._id];
    if (process) process.kill();

    this.active = false;
    this.save(callback);
}

mongoose.model('AppRecipe', AppRecipeSchema);