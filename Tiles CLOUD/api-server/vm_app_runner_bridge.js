var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var child_process = require('child_process');
var appProcesses = [];

var wsPort = 3001;
http.listen(wsPort, function() {
    console.log('WebSocket server listening on port: ' + wsPort );
});

var appRunner = {};

io.sockets.on('connection', function(socket) {
	socket.on('room', function(room) {
		var prevRoom = Object.keys(socket.rooms)[1];
		if (prevRoom) socket.leave(prevRoom);
		socket.join(room);
	});

    socket.on('input', function(input) {
        var p = appProcesses[input.appId]
        if (p) p.stdin.write(input.message);
    });
});

var _deactivateApp = function(appRecipe, kill, save, callback) {
    var process = appProcesses[appRecipe._id];
    if (process) {
        process.kill();
        appProcesses[appRecipe._id] = null;
    }
    if (save) {
        appRecipe.active = false;
        appRecipe.save(callback);
    }
}

appRunner.activateApp = function(appRecipe, callback) {
	// Kill previous process if it's still running
    _deactivateApp(appRecipe, true, true);

    io.to(appRecipe._id).emit('app_status', 'started');

    var args = [appRecipe._id, appRecipe.user, appRecipe.group];
    var options = {silent: true};

    var cp = child_process.fork('vm_app_runner', args, options);
    appProcesses[appRecipe._id] = cp;

    cp.on('uncaughtException', function(err) {
        console.log('Caught exception: ' + err);
        _deactivateApp(appRecipe, false, true);
    });

    cp.on('close', function(code) {
        console.log('Child process exited with code: ' + code);
        io.to(appRecipe._id).emit('app_status', 'closed');
        _deactivateApp(appRecipe, false, true);
    });

    cp.stdin.setEncoding('utf-8');

    cp.stdout.setEncoding('utf-8');
    cp.stdout.on('data', function(data) {
        io.to(appRecipe._id).emit('stdout_data', data);
    });
    
    cp.stderr.setEncoding('utf-8');
    cp.stderr.on('data', function (data) {
        io.to(appRecipe._id).emit('stderr_data', data);
    });

    appRecipe.active = true;
    appRecipe.save(callback);
}

appRunner.deactivateApp = function(appRecipe, callback) {
	_deactivateApp(appRecipe, true, true, callback);
}

module.exports = appRunner;