
function generate() {
	var num_city = document.getElementById("num_city").value;
	var num_school = document.getElementById("num_school").value;
	var num_class = document.getElementById("num_class").value;
	var num_student = document.getElementById("num_student").value;

	var var_city = document.getElementById("var_city").value/100.0;
	var var_school = document.getElementById("var_school").value/100.0;
	var var_class = document.getElementById("var_class").value/100.0;

	var school_sat = document.getElementById("school_sat").value/100.0;
	var gpa_sat = document.getElementById("gpa_sat").value/100.0;

	data = { "children":[] }

	TOTAL_CITIES = 0;
	TOTAL_SCHOOLS = 0;
	TOTAL_CLASSES = 0;
	TOTAL_STUDENTS = 0;

	VIEW_X = 0;
	VIEW_Y = 0;
	VIEW_SCALE = 1;
	VIEW_XMIN = -100000;
	VIEW_YMIN = -100000;
	VIEW_XMAX = 100000;
	VIEW_YMAX = 100000;

	var hue = 0;
	var hue_step = 1.0/num_city;

	for (var i = 0; i<num_city; i++) {
		data.children.push(generate_city(Math.max(1,Math.floor(num_school*(1.0-(Math.random()*var_city)))),num_class,num_student,var_school,var_class,Math.random(),school_sat,gpa_sat,hue));
		TOTAL_CITIES++;
		hue+=hue_step;
	}

	traverse_up(data, sum_children);
	traverse_up(data, compute_layout_volume);

	var output = document.getElementById("output");

	data.width = parseInt(window.getComputedStyle(output).width, 10);
	data.height = parseInt(window.getComputedStyle(output).height, 10);
	data.svg = output;
	data.xt = 0;
	data.yt = 0;

	traverse_down(data, compute_layout_rows);

	//clear old elements if any
	while (data.svg.hasChildNodes()) {
	  	data.svg.removeChild(data.svg.lastChild);
	}

	traverse_down(data, create_dom);

	document.getElementById("outputinfo").innerHTML = TOTAL_SCHOOLS +" Schools/"+ TOTAL_CLASSES +" Classes/"+ TOTAL_STUDENTS +" Students";

	trigger_layout();
	
}

function generate_city(num_school,num_class,num_student,var_school,var_class,sat_avg,school_sat,gpa_sat,hue) {
	var root = { "children":[], "hue":hue }

	for (var i = 0; i<num_school; i++) {
		root.children.push(generate_school(Math.max(1,Math.floor(num_class*(1.0-(Math.random()*var_school)))),num_student,var_class,Math.random(),school_sat,gpa_sat,hue,lerp(0.5,1,Math.random())));
		TOTAL_SCHOOLS++;
	}

	return root;
}

function generate_school(num_class,num_student,var_class,sat_avg,school_sat,gpa_sat,hue,sat) {
	hue = Math.min(1,hue+(Math.random()*0.05))

	var root = { "children":[], "hue":hue }

	for (var i = 0; i<num_class; i++) {
		//var sat = lerp(0.6,1,Math.random());
		var val = lerp(0.7,1,Math.random());
		root.children.push(generate_class(Math.max(1,Math.floor(num_student*(1.0-(Math.random()*var_class)))),sat_avg,school_sat,gpa_sat,hue,sat,val));
		TOTAL_CLASSES++;
	}

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

	return root;
}


function sum_children(root) {
	if ("children" in root) {

		root.sc_gpa_totals = [];
		root.sc_sat_totals = [];

		for (var i = 0; i<root.children.length; i++) {
			var child = root.children[i];
			if ("DOB" in child) {
				root.sc_gpa_totals[child.DOB] = (root.sc_gpa_totals[child.DOB] || 0) + child.sc_gpa;
				root.sc_sat_totals[child.DOB] = (root.sc_sat_totals[child.DOB] || 0) + child.sc_sat;
			} else {
				for (var j = 0; j<child.sc_gpa_totals.length; j++) {
					root.sc_gpa_totals[j] = (root.sc_gpa_totals[j] || 0) + (child.sc_gpa_totals[j] || 0);
					root.sc_sat_totals[j] = (root.sc_sat_totals[j] || 0) + (child.sc_sat_totals[j] || 0);
				}
			}
		}
	}
}

function compute_layout_volume(root) {
	if ("children" in root) {
		root.layoutvolume = 0;
		for (var i = 0; i<root.children.length; i++) {
			root.layoutvolume += root.children[i].layoutvolume;
		}
	} else {
		root.layoutvolume = (root.sc_gpa + root.sc_sat) / 2;
	}
}

function create_dom(root) {
	if ("children" in root) {
		for (var i = 0; i<root.children.length; i++) {
			var child = root.children[i];

			child.rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			child.rect.setAttribute('display', 'none');
			child.rect.setAttributeNS(null, 'fill', HSVtoColor(child.hue || 0,child.sat || 1,child.val || 1));
			root.svg.appendChild(child.rect);

			if ("children" in child) {
				child.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				child.svg.setAttribute('display', 'none');
				root.svg.appendChild(child.svg);
			}
		}
	}
}