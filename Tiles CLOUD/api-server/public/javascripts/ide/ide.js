var socket = io('http://localhost:3001');
var socketConnected = false;

socket.on('connect', function () {
	console.log('Connected to WS server');
	socketConnected = true;
});

socket.on('stdout_data', function(d) {
	addConsoleEntry('appConsole', d);
});
  
socket.on('stderr_data', function(d) {
	addConsoleEntry('appConsole', d, 'error');
});

socket.on('app_status', function(d) {
	if (d === 'started') {
		addConsoleEntry('appConsole', '[APP STARTED]\n', 'info');
	} else if (d === 'closed') {
		addConsoleEntry('appConsole', '[APP EXITED]\n', 'info');
	} else if (d === 'cpu_limit') {
		addConsoleEntry('appConsole', '[CPU limit is exceeded. Killing process.]\n', 'error');
	}
});

function addConsoleEntry(consoleId, d, type) {
	var styleClass = type || 'log';

	$('#' + consoleId).append('<span class="' + styleClass + '">' + d + '</span>');

	// Scroll to bottom
	var elem = document.getElementById(consoleId);
	elem.scrollTop = elem.scrollHeight;
}

function clearConsole(consoleId) {
	$('#' + consoleId).empty();
}

function setAppConsoleSocketRoom(appId, callback) {
	if (socketConnected) {
		socket.emit('room', appId);
	} else {
		socket.on('connect', function() {
   			socket.emit('room', appId);
		});
	}

	if (callback) callback();
}

function sendConsoleInput(appId, message) {
	if (socketConnected) {
		var data = {
			appId: appId,
			message: message
		};
		socket.emit('input', data);
	} else {
		console.log('Unable to send data. WebSocket is not connected.');
	}
}