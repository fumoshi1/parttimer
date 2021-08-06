function reset() {
	localforage.setItem("timerStatus", null);
};

function getTotal(interval) {
	return (interval.end || Date.now()) - interval.start;
};

function add(a,b){
	return a+b;
};

function computeTimerTotalSeconds(timer) {
	if (!timer) {
		return 0;
	}

	return timer.intervals
		.map(getTotal)
		.reduce(add, 0);
};

function payload(number) {
	if (number < 10) {
		return "0" + number;
	};

	return number;
};

function secondsToHour(milliseconds) {
	var seconds = Math.floor(milliseconds / 1000);
	var hour = Math.floor(seconds / 3600);
	var minute = Math.floor((seconds % 3600) / 60);
	var seconds = Math.floor(seconds % 60);

	return payload(hour) + ":" + payload(minute) + ":" + payload(seconds);
};

function forEachTimer(f) {
	for (var i=0; i<2; i++) {
		f(i)
	}
};

function updateTimers() {
	localforage.getItem("timerStatus").then(function(timerStatus) {
		forEachTimer(function(i) {
			var totalSeconds;
			if (!timerStatus) {
				totalSeconds = 0;
			} else {
				totalSeconds = computeTimerTotalSeconds(timerStatus[i]);
			}

			$("#timer" + i + " .display").text(secondsToHour(totalSeconds));

			var running = timerStatus &&
				timerStatus[i] &&
				timerStatus[i].intervals[0] &&
				!timerStatus[i].intervals.slice(-1)[0].end;

  			if (running) {
  				$("#timer" + i + " button").text("STOP");
  			} else {
  				$("#timer" + i + " button").text("START/CONTINUE");
  			}
		});
	});
};

$.when( $.ready ).then(function() {
  // Document is ready.
  forEachTimer(function(i) {
  	$("#timer" + i + " button").click(function() {
  		localforage.getItem("timerStatus").then(function(timerStatus) {
  			if (!timerStatus) {
  				timerStatus = [];
  			}

  			if (!timerStatus[i]) {
  				timerStatus[i] = {
  					intervals: [],
  					base: 0
  				};
  			}

  			var now = Date.now();
  			var running = timerStatus &&
				timerStatus[i] &&
				timerStatus[i].intervals[0] &&
				!timerStatus[i].intervals.slice(-1)[0].end;

  			if (running) {
				timerStatus[i].intervals.slice(-1)[0].end = now;
  				$("#timer" + i + " button").text("START/CONTINUE");
  			} else {
  				timerStatus[i].intervals.push({start: now});
  				$("#timer" + i + " button").text("STOP");
  			}

  			localforage.setItem("timerStatus", timerStatus);
  		});
  	});
  });

  setInterval(updateTimers, 500);
});