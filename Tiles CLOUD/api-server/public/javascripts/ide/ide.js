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
	addConsoleEntry('appConsole', d, false, true);
});

socket.on('app_status', function(d) {
	if (d === 'started') {
		addConsoleEntry('appConsole', '[APP STARTED]\n', true);
	} else if (d === 'closed') {
		addConsoleEntry('appConsole', '[APP EXITED]\n', true);
	}
});

function addConsoleEntry(consoleId, d, isInfo, isError) {
	var styleClass = 'log';
	if (isInfo) styleClass = 'info';
	else if (isError) styleClass = 'error';

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