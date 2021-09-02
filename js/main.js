var ratios = [25, 25, 50];

function reset() {
	localforage.setItem("timerStatus", null);
};

function getTotal(interval) {
	return (interval.end || Date.now()) - interval.start;
};

function add(a,b){
	return a+b;
};

function computeTimerTotalMilliseconds(timer) {
	if (!timer) {
		return 0;
	}

	return timer.base + timer.intervals
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
	for (var i=0; i<ratios.length; i++) {
		f(i)
	}
};

function updateTimers() {
	localforage.getItem("timerStatus").then(function(timerStatus) {
		var minMilliSeconds = Infinity;
		var minTimer = -1;
		forEachTimer(function(i) {
			var totalMilliSeconds;
			if (!timerStatus) {
				totalMilliSeconds = 0;
			} else {
				totalMilliSeconds = computeTimerTotalMilliseconds(timerStatus[i]);
			}

			if ((!currentTimerStatus[i].locked) && totalMilliSeconds / ratios[i] < minMilliSeconds) {
				minTimer = i;
				minMilliSeconds = totalMilliSeconds / ratios[i];
			}

			$("#timer" + i + " .display").text(secondsToHour(totalMilliSeconds));

			var running = timerStatus &&
				timerStatus[i] &&
				timerStatus[i].intervals[0] &&
				!timerStatus[i].intervals.slice(-1)[0].end;

			$("#timer" + i).removeClass("behind");
  			if (running) {
  				$("#timer" + i + " button").text("STOP");
  			} else {
  				$("#timer" + i + " button").text("START/CONTINUE");
  			}
		});

		$("#timer" + minTimer).addClass("behind");
	});
};

var currentTimerStatus;
$.when( $.ready ).then(function() {
  // Document is ready.

  localforage.getItem("timerStatus").then(function(timerStatus) {
  	currentTimerStatus = timerStatus;
	forEachTimer(function(i) {
  		var checked = timerStatus[i].locked ? '1' : 'false';

  		if (timerStatus[i].locked) {
 			$("#timer" + i + " input[type=checkbox]").attr("checked", true);
 		} else {
 			$("#timer" + i + " input[type=checkbox]").removeAttr("checked");
 		}

 		$("#timer" + i + " input[type=checkbox]").click(function(event) {
 			currentTimerStatus[i].locked = event.currentTarget.checked;

 			localforage.getItem("timerStatus").then(function(ts) {
 				ts[i].locked = event.currentTarget.checked;
	 			localforage.setItem("timerStatus", ts);
 			});
 		});
	});
  });

  forEachTimer(function(i) {
  	$("#timer" + i + " .ratio").text(ratios[i] + "%");
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

	  			timerStatus[i] = {
	  				base: computeTimerTotalMilliseconds(timerStatus[i]),
	  				intervals: []
	  			};
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