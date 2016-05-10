var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var child_process = require('child_process');
var pusage = require('pidusage');
var appProcesses = [];

var wsPort = 3001;
http.listen(wsPort, function() {
    console.log('WebSocket server listening on port: ' + wsPort );
});

var appRunner = {};

const PROCESS_MONITOR_INTERVAL = 5000; // milliseconds
const MAX_TOTAL_CPU_USAGE = 90; // percentage
var cpuLimit = MAX_TOTAL_CPU_USAGE;

setInterval(function() {
    var count = 0;
    for (var appId in appProcesses) {
        if (appProcesses.hasOwnProperty(appId)) {
            var appProcess = appProcesses[appId];
            if (appProcess) {
                count++;
                pusage.stat(appProcess.pid, function(appId) { 
                    return function(err, stat) {
                        if (err) console.log(err);
                        else {
                            console.log('App %s CPU usage is %s %.', appId, stat.cpu);
                            if (stat.cpu > cpuLimit) {
                                console.log('App %s exceeded CPU limit. Killing process.', appId);
                                io.to(appId).emit('app_status', 'cpu_limit');
                                _killAppProcess(appId);
                            }
                        }
                    }
                }(appId));
            } else {
                console.log('PID not found for app ' + appId);
            }
        }
    }
    if (count !== 0) {
        cpuLimit = MAX_TOTAL_CPU_USAGE / count;
        console.log('CPU limit set to: ' + cpuLimit);
    }
}, PROCESS_MONITOR_INTERVAL);

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

var _killAppProcess = function(appId) {
    var process = appProcesses[appId];
    if (process) {
        process.kill();
        delete appProcesses[appId];
    }
}

var _deactivateApp = function(appRecipe, kill, save, callback) {
    if (kill) _killAppProcess(appRecipe._id);
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

    var cp = child_process.fork('lib/vm/apprunner', args, options);
    appProcesses[appRecipe._id] = cp;

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