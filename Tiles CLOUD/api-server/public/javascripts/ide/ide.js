var socket = io('http://localhost:3001');
var socketConnected = false;

socket.on('connect', function () {
	console.log('Connected to WS server');
	socketConnected = true;
});

socket.on('stdout_data', function(d) {
	addConsoleEntry(d);
});
  
socket.on('stderr_data', function(d) {
	addConsoleEntry(d, false, true);
});

socket.on('app_status', function(d) {
	if (d === 'started') {
		addConsoleEntry('[APP STARTED]\n', true);
	} else if (d === 'closed') {
		addConsoleEntry('[APP EXITED]\n', true);
	}
});

function addConsoleEntry(d, isInfo, isError) {
	var styleClass = 'log';
	if (isInfo) styleClass = 'info';
	else if (isError) styleClass = 'error';

	$('#console').append('<span class="' + styleClass + '">' + d + '</span>');
	
	// Scroll to bottom
	var elem = document.getElementById('console');
	elem.scrollTop = elem.scrollHeight;
}

function clearAppConsole() {
	$('#console').empty();
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