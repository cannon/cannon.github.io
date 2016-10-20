
var data = {};

var SHOW_VALUES = false;

var sc_gpa_sc_sat_BLEND = 0.0;
var DOB_MIN = 0;
var DOB_MAX = 364;

//auto-increment when filter changed
var FILTER_COUNTER = 1;

var TOTAL_SCHOOLS = 0;
var TOTAL_CLASSES = 0;
var TOTAL_STUDENTS = 0;

function gpa_sat_slider() {
	sc_gpa_sc_sat_BLEND = document.getElementById("gpa_sat_slider").value/100;
	layout_all();
}

function dob_slider() {
	DOB_MIN = document.getElementById("dob_slider").valueLow;
	DOB_MAX = document.getElementById("dob_slider").valueHigh;

	FILTER_COUNTER++; //clears cached summation data

	layout_all();
}

function generate() {
	var num_school = document.getElementById("num_school").value;
	var num_class = document.getElementById("num_class").value;
	var num_student = document.getElementById("num_student").value;

	var var_school = document.getElementById("var_school").value/100.0;
	var var_class = document.getElementById("var_class").value/100.0;

	var school_sat = document.getElementById("school_sat").value/100.0;
	var gpa_sat = document.getElementById("gpa_sat").value/100.0;

	SHOW_VALUES = document.getElementById("stinfo_enabled").checked;

	data = { "children":[] }

	TOTAL_SCHOOLS = 0;
	TOTAL_CLASSES = 0;
	TOTAL_STUDENTS = 0;

	var hue = 0;
	var hue_step = 1.0/num_school;

	for (var i = 0; i<num_school; i++) {
		data.children.push(generate_school(Math.max(1,Math.floor(num_class*(1.0-(Math.random()*var_school)))),num_student,var_class,Math.random(),school_sat,gpa_sat,hue));
		TOTAL_SCHOOLS++;
		hue+=hue_step;
	}

	sum_child_arrays(data);

	document.getElementById("outputinfo").innerHTML = TOTAL_SCHOOLS +" Schools/"+ TOTAL_CLASSES +" Classes/"+ TOTAL_STUDENTS +" Students";

	layout_all();
	
}

function generate_school(num_class,num_student,var_class,sat_avg,school_sat,gpa_sat,hue) {
	var root = { "children":[], "hue":hue }

	for (var i = 0; i<num_class; i++) {
		var sat = lerp(0.6,1,Math.random());
		var val = lerp(0.6,1,Math.random());
		root.children.push(generate_class(Math.max(1,Math.floor(num_student*(1.0-(Math.random()*var_class)))),sat_avg,school_sat,gpa_sat,hue,sat,val));
		TOTAL_CLASSES++;
	}

	sum_child_arrays(root);

	return root;
}

function generate_class(num_student, sat_avg, school_sat, gpa_sat, hue, sat, val) {
	var root = { "children":[], "hue":hue, "sat":sat, "val":val }

	for (var i = 0; i<num_student; i++) {
		var sat_rnd = lerp(Math.random(), sat_avg, school_sat);
		var gpa_rnd = lerp(Math.random(), sat_rnd, gpa_sat);
		root.children.push({ "sc_gpa": (gpa_rnd*99)+1, "sc_sat": (sat_rnd*99)+1, "DOB": Math.floor(Math.random()*365), "volume":1, "hue":hue, "sat":sat, "val":val });
		TOTAL_STUDENTS++;
	}

	root.sc_gpa_totals = [];
	root.sc_sat_totals = [];

	for (var i = 0; i<num_student; i++) {
		var dob = root.children[i].DOB;
		root.sc_gpa_totals[dob] = (root.sc_gpa_totals[dob] || 0) + root.children[i].sc_gpa;
		root.sc_sat_totals[dob] = (root.sc_sat_totals[dob] || 0) + root.children[i].sc_sat;
	}

	return root;
}

function sum_child_arrays(root) {
	root.sc_gpa_totals = [];
	root.sc_sat_totals = [];

	for (var i = 0; i<root.children.length; i++) {
		var child = root.children[i];
		for (var j = 0; j<child.sc_gpa_totals.length; j++) {
			root.sc_gpa_totals[j] = (root.sc_gpa_totals[j] || 0) + (child.sc_gpa_totals[j] || 0);
			root.sc_sat_totals[j] = (root.sc_sat_totals[j] || 0) + (child.sc_sat_totals[j] || 0);
		}
	}

}

var latest_layout_timer;
function layout_all() {
	var output = document.getElementById("output");

	data.width = parseInt(window.getComputedStyle(output).width,10);
	data.height = parseInt(window.getComputedStyle(output).height,10);
	data.dom = output;

	// layout until stop for generic tree (any length)
	/*
		var i = 0;
		while (layout_data(data,i)) {
			i++;
		}
	*/

	do_timer(function() {
		compute_volume(data);
		layout_data(data,0);
		layout_data(data,1);
	}, "outertimer");
	if (document.getElementById("opt_enabled").checked == false) {
		do_timer( function() {
			layout_data(data,2);
		}, "innertimer");
		return;
	}

	var local_timeout = setTimeout(layout_all_later,parseInt(document.getElementById("opt_delay").value,10));
	latest_layout_timer = local_timeout;

	function layout_all_later() {
		if(local_timeout==latest_layout_timer) {
			do_timer(function() {
				layout_data(data,2);
			}, "innertimer");
		}
	}
}

function do_timer(func, output) {
	var t = new Date().getTime();
	func();
	document.getElementById(output).innerHTML = new Date().getTime()-t+"ms";
}


function layout_data(root, layer) {
	var output = false; //did we do anything this pass?
	if (layer > 0) {
		layer -= 1;
		if ("children" in root) {
			for(var i=0; i<root.children.length; i++) {
				output |= layout_data(root.children[i], layer);
			}
		}
	} else {
		output = true;
		if ("children" in root) {
			while (root.dom.hasChildNodes()) {
			  	root.dom.removeChild(root.dom.lastChild);
			}
			//compute_volume(root);
			if ((root.volume || 0.0) == 0.0) {
				return false;
			}
			for(var i=0; i<root.children.length; i++) {
				compute_volume(root.children[i]);
			}

			//finds a good box layout, outputting to x/y/width/height properties
			find_layout(root);
			
			for(var i=0; i<root.children.length; i++) {
				var child = root.children[i];
				if (child.volume>0) {

					var proportion = child.volume/root.volume;

					child.dom = document.createElement("DIV");
					child.dom.className = "part";
					child.dom.style.left = (child.x) + "px";
					child.dom.style.top = (child.y) + "px";
					child.dom.style.right = (root.width - (child.x + child.width)) + "px";
					child.dom.style.bottom = (root.height - (child.y + child.height)) + "px";
					root.dom.appendChild(child.dom);

					var childinner = document.createElement("DIV");
					childinner.className = "part-inner";
					childinner.style.backgroundColor = HSVtoColor(child.hue || 0,child.sat || 1,child.val || 1);
					child.dom.appendChild(childinner);

					if (SHOW_VALUES) {
						var value = "";
						if ("sc_gpa" in child) {
							value += "GPA: " +(child.sc_gpa*4/100).toFixed(1)+"<br>";
						}
						if ("sc_sat" in child) {
							value += "SAT: " +(child.sc_gpa*2400/100).toFixed(0)+"<br>";
						}
						if ("DOB" in child) {
							value += "DOB: " +(child.DOB+1).toFixed(0)+"<br>";
						}
						childinner.innerHTML = value;
					}
				}
			}
		}
	}
	return output;
}

function compute_volume(root) {
	if (root.filtercounter != FILTER_COUNTER) {
		root.filtered_gpa = compute_volume_key(root, "sc_gpa");
		root.filtered_sat = compute_volume_key(root, "sc_sat");
		root.filtercounter = FILTER_COUNTER;

		delete root.asprsqrt;
		root.layoutvolume = lerp(root.filtered_gpa, root.filtered_sat, 0.5);
	}
	root.volume = lerp(root.filtered_gpa, root.filtered_sat, sc_gpa_sc_sat_BLEND);
}

function compute_volume_key(root, key) {
	var volume = 0;
	if (key in root) {
		if (root.DOB >= DOB_MIN && root.DOB <= DOB_MAX) {
			volume = root[key];
		}
	} else if (key+"_totals" in root) {
		var totals = root[key+"_totals"];
		for(var i=DOB_MIN; i<=DOB_MAX; i++) {
			volume += totals[i] || 0;
		}
	}
	return volume;
}

//todo: make it also try horizantal layouts (columns instead of rows)
function find_layout(root) {
	var layout = [];

	//sqrt of aspect ratio - used for choosing row size
	//calculation is saved to prevent rows from rearranging
	//note: not the best one-time calculation, since this should calculate based on width/height when volume is halfway between sc_gpa/sc_sat
	if (!("asprsqrt" in root)) {
		root.asprsqrt = Math.sqrt(root.width/root.height);
	}
	var this_pref_row = 0;

	//sc = showing children
	var sc = [];

	for(var i=0; i<root.children.length; i++) {
		if (root.children[i].volume > 0) {
			sc.push(i);
		}
	}

	for(var i=0; i<sc.length; i++) {
		layout.push({});
		var temp = Math.max(Math.floor(root.asprsqrt*Math.sqrt(root.layoutvolume/root.children[sc[i]].layoutvolume)),1);
		//preferred number of items to share a row with
		layout[i].pref_row = temp;
		this_pref_row = Math.max(temp,this_pref_row);
	}

	//this shouldn't be reached, but sometimes it is...
	if (this_pref_row==0) {
		//console.log("layout no children error");
		//console.log(root);
		//alert("layout no children error");
		return;
	}

	var rows = [];
	var items_assigned = 0;
	while (this_pref_row > 0) {
		next_row = [];
		for(var i=0; i<layout.length; i++) {
			if (layout[i].pref_row >= this_pref_row && !("assigned" in layout[i])) {
				if (next_row.length < this_pref_row) {
					next_row.push(i);
				} else {
					var lowest = layout[i].pref_row;
					var lowest_idx = -1;
					for (var j=0; j<next_row.length; j++) {
						if(layout[next_row[j]].pref_row < lowest) {
							lowest = layout[next_row[j]].pref_row;
							lowest_idx = j;
						}
					}
					//replace larger items with smaller for more populated rows
					if (lowest_idx != -1) {
						next_row[lowest_idx] = i;
					}
				}
			}
		}
		if (next_row.length < this_pref_row) {
			this_pref_row--;
		} else {
			rows.push(next_row);
			for (var j=0; j<next_row.length; j++) {
				layout[next_row[j]].assigned = true;
			}
		}
	}

	//shuffleArray(rows);

	var curr_y = 0;
	for (var i = 0; i<rows.length; i++) {
		var row = rows[i];
		var this_volume = 0;
		for (var j = 0; j<row.length; j++) {
			this_volume += root.children[sc[row[j]]].volume;
		}
		var proportion = this_volume/root.volume;
		var height = proportion*root.height;

		var curr_x = 0;
		for (var j = 0; j<row.length; j++) {
			if (this_volume == 0) {
				proportion = 1.0/row.length;
			} else {
				proportion = root.children[sc[row[j]]].volume/this_volume;
			}
			var width = proportion*root.width;
			root.children[sc[row[j]]].x = curr_x;
			root.children[sc[row[j]]].y = curr_y;
			root.children[sc[row[j]]].width = width;
			root.children[sc[row[j]]].height = height;
			curr_x += width;
		}

		curr_y += height;
	}
}

function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function HSVtoColor(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return "rgb("+Math.round(r * 255)+","+Math.round(g * 255)+","+Math.round(b * 255)+")";
}