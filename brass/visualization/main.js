//stubs to be overridden by circlepacking or treemap
function create_dom() {}
function draw_layers() {}
function data_in_view() {}
function update_view() {}
function wheel_callback() {}
function compute_layout_rows() {}
function compute_layout() {}
function compute_volume() {}
function compute_volume_key() {}

var data = {};

var SHOW_VALUES = false;

var sc_gpa_sc_sat_BLEND = 0.0;
var DOB_MIN = 0;
var DOB_MAX = 364;

//auto-increment when filter changed
var FILTER_COUNTER = 1;

var LAYOUT_COUNTER = 1;

var TOTAL_CITIES = 0;
var TOTAL_SCHOOLS = 0;
var TOTAL_CLASSES = 0;
var TOTAL_STUDENTS = 0;

var MIN_LAYERS = 1;
var MAX_LAYERS = 4;

var MIN_LAYERS_LOCKED = false;

var OPTIMIZE_START_TIME;

var OPTIMIZE_CURRENT_LAYER;

var OPTIMIZE_FRAME_TIME = 50;

var OPTIMIZE_BASETIME = 0;

var OPTIMIZE_SLOW_FRAMES = 0;
var OPTIMIZE_FAST_FRAMES = 0;

var TRIGGER_LAYOUT = false;

function trigger_layout() {
	TRIGGER_LAYOUT = true;
}

function run_layout() {
	LAYOUT_COUNTER++;
	
	var delay = parseInt(document.getElementById("opt_delay").value,10);

	do_timer_render(function(){
		for (var i=0; i<MIN_LAYERS; i++) {
			traverse_layer_view(data, i, compute_layout);
		}
		draw_layers(data, MIN_LAYERS-1, MIN_LAYERS);
	}, "timer_o", layout_callback, {"next":MIN_LAYERS, "delay":delay, "counter":LAYOUT_COUNTER});
}

function layout_callback(outputid, t, t_layout, args) {
	optimizer_callback(outputid, t, t_layout);
	if (args.next < MAX_LAYERS) {
		setTimeout(function() {
			if (args.counter != LAYOUT_COUNTER) {
				return;
			}
			do_timer_render(function(){
				traverse_layer_view(data, args.next, compute_layout);
				draw_layers(data, args.next, 1);
			}, "timer_l"+args.next, layout_callback, {"next":args.next+1, "delay":args.delay, "counter":args.counter}, true); //Render isn't run until the second frame...?
		}, args.delay);
	}
}

function optimizer_callback(outputid, t, t_layout) {
	timer_logging(outputid=="timer_o"?0:parseInt(outputid.substring(7)),outputid=="timer_o"?MIN_LAYERS-1:parseInt(outputid.substring(7)), t-t_layout, t_layout);
	if (MIN_LAYERS_LOCKED) {
		return;
	}
	if (outputid=="timer_o") {
		if (t>OPTIMIZE_FRAME_TIME) {
			OPTIMIZE_SLOW_FRAMES++;
			if (t>(OPTIMIZE_FRAME_TIME*3)) {
				OPTIMIZE_SLOW_FRAMES++;
			}
		} else {
			OPTIMIZE_SLOW_FRAMES = 0; //Math.max(OPTIMIZE_SLOW_FRAMES-1, 0);
		}
		if (OPTIMIZE_SLOW_FRAMES > 2) {
			if (MIN_LAYERS > 1) {
				MIN_LAYERS = MIN_LAYERS-1;
				update_timer_area();
			}
			OPTIMIZE_SLOW_FRAMES = 0;
		}
		OPTIMIZE_BASETIME=t_layout;
	} else {
		if (OPTIMIZE_BASETIME+t < OPTIMIZE_FRAME_TIME) {
			OPTIMIZE_FAST_FRAMES++;
		} else {
			OPTIMIZE_FAST_FRAMES = 0; //Math.max(OPTIMIZE_FAST_FRAMES-1, 0);
		}
		if (OPTIMIZE_FAST_FRAMES>0) {
			if (MIN_LAYERS < MAX_LAYERS) {
				MIN_LAYERS = MIN_LAYERS+1;
				update_timer_area((OPTIMIZE_BASETIME+t)+"ms");
			}
			OPTIMIZE_FAST_FRAMES = 0;
		}
		OPTIMIZE_BASETIME += t_layout;
	}
}

function do_timer_render(func, output, callback, callback_args, twoframes) {
	var t = curTime();
	func();
	var t_layout = curTime()-t;

	var fn = twoframes?delayTwoFrames:delayFrame;

	fn(function() {
		t = curTime()-t;
		
		if (callback != undefined) {
			callback(output, t, t_layout, callback_args);
		}
		var out = document.getElementById(output);
		if (out!=null) {
			out.innerHTML = t+"ms";
		}
	});
}

frame_functions = [];
frame_functions_next = [];

function delayFrame(func) {
	frame_functions_next.push(func);
}

function delayTwoFrames(func) {
	frame_functions_next.push(function(){ delayFrame(func); });
}

function frame() {
    requestAnimationFrame(frame);

    frame_functions = frame_functions_next;
    frame_functions_next = [];

    while(frame_functions.length > 0) {
    	(frame_functions.pop())();
    }

    if (TRIGGER_LAYOUT) {
    	run_layout();
    	TRIGGER_LAYOUT = false;
    }
}
frame();


var VIEW_X = 0;
var VIEW_Y = 0;
var VIEW_SCALE = 1;
//for quicker culling optimization
var VIEW_XMIN = -100000;
var VIEW_YMIN = -100000;
var VIEW_XMAX = 100000;
var VIEW_YMAX = 100000;

window.addEventListener("load", function(){
	var output = document.getElementById("output_outer");

	var is_mouse_down = false;
	var mouse_x_last = 0;
	var mouse_y_last = 0;
	output.addEventListener("mousedown", function(evt){
	    is_mouse_down = true;
	    mouse_x_last = evt.clientX;
	    mouse_y_last = evt.clientY;
	}, false);
	document.body.addEventListener("mousemove", function(evt){
		//for some bizarre reason, moving the data causes a lot more lag
		if (is_mouse_down) {
		    VIEW_X -= evt.clientX - mouse_x_last;
		    VIEW_Y -= evt.clientY - mouse_y_last;
		    mouse_x_last = evt.clientX;
	    	mouse_y_last = evt.clientY;

	    	update_view();
	    	trigger_layout();
		}
	}, false);
	document.body.addEventListener("mouseup", function(){
		is_mouse_down = false;
	}, false);
	output.addEventListener("wheel", function(e){
		wheel_callback(e);
	}, false);
}, false);