function gpa_sat_slider() {
	sc_gpa_sc_sat_BLEND = document.getElementById("gpa_sat_slider").value/100;
	trigger_layout();
}

function dob_slider() {
	DOB_MIN = document.getElementById("dob_slider").valueLow;
	DOB_MAX = document.getElementById("dob_slider").valueHigh;

	FILTER_COUNTER++; //clears cached summation data

	trigger_layout();
}

var MIN_LAYERS_BACKUP = 0;

function optimization_checkbox() {
	MIN_LAYERS_LOCKED = !document.getElementById("opt_enabled").checked;
	if (MIN_LAYERS_LOCKED) {
		MIN_LAYERS_BACKUP = MIN_LAYERS;
		MIN_LAYERS = MAX_LAYERS;
	} else {
		MIN_LAYERS = MIN_LAYERS_BACKUP;
	}
	update_timer_area();
}

function update_timer_area(basetime) {
	var timers = document.getElementById("timerzone");
	while (timers.hasChildNodes()) {
	  	timers.removeChild(timers.lastChild);
	}

	e = document.createElement("div");
	timers.appendChild(e);
	var f = document.createElement("label");
	f.innerHTML = "Layers 0 - "+(MIN_LAYERS-1)+": ";
	if (MIN_LAYERS==1) { f.innerHTML = "Layer 0: "; }
	e.appendChild(f);
	f = document.createElement("span");
	f.id="timer_o";
	f.innerHTML = basetime || "";
	e.appendChild(f);

	for (var i = MIN_LAYERS; i<MAX_LAYERS; i++) {
		e = document.createElement("div");
		timers.appendChild(e);
		var f = document.createElement("label");
		f.innerHTML = "Layer "+i+": ";
		e.appendChild(f);
		f = document.createElement("span");
		f.id="timer_l"+i;
		e.appendChild(f);
	}
}

window.addEventListener("load", update_timer_area);