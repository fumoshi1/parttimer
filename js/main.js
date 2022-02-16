var ratios = [15, 35, 50];

function reset() {
	localforage.setItem("timerStatus", null);
};

function getTotal(interval) {
	return (interval.end || Date.now()) - interval.start;
};

function add(a,b){
	return a+b;
};

function enabled(interval) {
	return !interval.disabled;
};

function computeTimerTotalMilliseconds(timer) {
	if (!timer) {
		return 0;
	}

	return timer.base + timer.intervals
		.filter(enabled)
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
		if (!timerStatus) {
			timerStatus = [];
		}

		var minMilliSeconds = Infinity;
		var minTimer = -1;

		forEachTimer(function(i) {
			var totalMilliSeconds;
			if (!timerStatus) {
				totalMilliSeconds = 0;
			} else {
				totalMilliSeconds = computeTimerTotalMilliseconds(timerStatus[i]);
			}

			if (timerStatus[i] && (!timerStatus[i].locked) && totalMilliSeconds / ratios[i] < minMilliSeconds) {
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
  				// update production timer table
  				$("#timer" + i + " button").text("STOP");
  			} else {
  				$("#timer" + i + " button").text("START/CONTINUE");
  			}
		});

		$("#timer" + minTimer).addClass("behind");

			var secondMinTimer = -1;
			var secondMinMilliSeconds = Infinity;
			forEachTimer(function(i) {
				if (i !== minTimer) {
					if (!timerStatus) {
						totalMilliSeconds = 0;
					} else {
						totalMilliSeconds = computeTimerTotalMilliseconds(timerStatus[i]);
					}

					if (timerStatus[i] && (!timerStatus[i].locked) && totalMilliSeconds / ratios[i] < secondMinMilliSeconds) {
						secondMinTimer = i;
						secondMinMilliSeconds = totalMilliSeconds / ratios[i];
					}

					$("#timer" + i + " .display-remaining").text("-");
				}
			});

			if (secondMinTimer !== -1) {
				//var remaining = minMilliSeconds / ratios[minTimer] - secondMinMilliSeconds / ratios[secondMinTimer];
				//remaining = remaining * ratios[minTimer];
				var remaining = (secondMinMilliSeconds - minMilliSeconds) * ratios[minTimer];
				$("#timer" + minTimer + " .display-remaining").text(secondsToHour(remaining));
			}

	});
};

var escape = document.createElement('textarea');
function escapeHTML(html) {
    escape.textContent = html;
    return escape.innerHTML;
}

function updateTimerList(timerStatus) {
	var tbody = $("#productionlist tbody")
	tbody.empty();

	if (timerStatus && timerStatus[2]) {
		timerStatus[2].intervals.forEach(function(interval, index) {
		  	var d = new Date(interval.start);
		  	var a = d.toLocaleDateString() + " " + d.toLocaleTimeString();
		  	var b = secondsToHour(interval.end - interval.start);
		  	var c = '<input type="text" value="' + escapeHTML(interval.label) + '" index='+index+'></input>';
		  	tbody.prepend("<tr><td>"+a+"</td><td>"+b+"</td><td>"+c+"</td></tr>")
		});

		$(tbody).find("input").change(function(e) {
			var attributes = e.currentTarget.attributes;
			var index = parseInt(attributes.index.value);
			localforage.getItem("timerStatus").then(function(timerStatus) {
				timerStatus[2].intervals[index].label = e.currentTarget.value;
				localforage.setItem("timerStatus", timerStatus);
			});
		});
	}
};

var currentTimerStatus;
$.when( $.ready ).then(function() {
  // Document is ready.

  localforage.getItem("timerStatus").then(function(timerStatus) {
  	if (!timerStatus) {
  		return;
  	}

  	updateTimerList(timerStatus);
    currentTimerStatus = timerStatus || ratios.map(function() { return {}; });
	forEachTimer(function(i) {
  		var checked = timerStatus[i] && timerStatus[i].locked ? '1' : 'false';

  		if (timerStatus[i] && timerStatus[i].locked) {
 			$("#timer" + i + " input[type=checkbox]").attr("checked", true);
 		} else {
 			$("#timer" + i + " input[type=checkbox]").removeAttr("checked");
 		}

 		$("#timer" + i + " input[type=checkbox]").click(function(event) {
 			currentTimerStatus[i] = currentTimerStatus[i] || {};
 			currentTimerStatus[i].locked = event.currentTarget.checked;

 			localforage.getItem("timerStatus").then(function(ts) {
 				ts[i] = ts[i] || {};
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

  				// disable intervals
	  			timerStatus[i] = {
	  				base: computeTimerTotalMilliseconds(timerStatus[i]),
	  				intervals: timerStatus[i].intervals.slice(-32)
	  			};

	  			timerStatus[i].intervals.forEach(function(interval) {
	  				interval.disabled = true;
	  			});

	  			if (i == 2) {
		  			updateTimerList(timerStatus);
		  		}
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