var socket;

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

function initAppConsoleSocket(appId) {
	// Disconnect client from previous namespace
	if (socket) socket.disconnect();

	socket = io('http://localhost:3001/' + appId);

	socket.on('stdout_data', function(d){
    	console.log(appId + ' stdout: ' + d);
    	addConsoleEntry(d);
    });
	  
	socket.on('stderr_data', function(d){
		console.log(appId + ' stderr: ' + d);
		addConsoleEntry(d, false, true);
	});

	socket.on('app_status', function(d){
		console.log(appId + ' ' + d);
		if (d === 'started') {
			addConsoleEntry('[APP STARTED]\n', true);
		} else if (d === 'closed') {
			addConsoleEntry('[APP EXITED]\n', true);
		}
	});
}