var data1 = [];
var data2 = [];
var bars = [];

var lodata1 = [];
var lodata2 = [];
var lobars = [];

var lodata_factor = 10;

var height_scale = 1.0;
var width_scale = 1.0;

var current_dataset_view = "1";

var dataset_params = [
{ "constant":50,"noise":0,"linear":100,"sine":0,"exponent":0,"sineparam":10,"exponentparam":25,"linearparam":false },
{ "constant":50,"noise":0,"linear":0,"sine":100,"exponent":0,"sineparam":10,"exponentparam":25,"linearparam":false }
];

function change_dataset() {
	current_dataset = dataset_params[0];
	if (current_dataset_view=="2") { current_dataset = dataset_params[1]; }
	current_dataset.constant = document.getElementById("constant").value;
	current_dataset.noise = document.getElementById("noise").value;
	current_dataset.linear = document.getElementById("linear").value;
	current_dataset.sine = document.getElementById("sine").value;
	current_dataset.exponent = document.getElementById("exponent").value;
	current_dataset.sineparam = document.getElementById("sineparam").value;
	current_dataset.exponentparam = document.getElementById("exponentparam").value;
	current_dataset.linearparam = document.getElementById("linearparam").checked;

	current_dataset_view = document.getElementById("dataset").value;

	current_dataset = dataset_params[0];
	if (current_dataset_view=="2") { current_dataset = dataset_params[1]; }
	document.getElementById("constant").value = current_dataset.constant;
	document.getElementById("noise").value = current_dataset.noise;
	document.getElementById("linear").value = current_dataset.linear;
	document.getElementById("sine").value = current_dataset.sine;
	document.getElementById("exponent").value = current_dataset.exponent;
	document.getElementById("sineparam").value = current_dataset.sineparam;
	document.getElementById("exponentparam").value = current_dataset.exponentparam;
	document.getElementById("linearparam").checked = current_dataset.linearparam;
}

function generate() {
	//get the latest values
	change_dataset();

	var count = document.getElementById("count").value;
	data1 = generate_data(dataset_params[0], count);
	data2 = generate_data(dataset_params[1], count);


	var output = document.getElementById("output");

	width_scale = parseInt(window.getComputedStyle(output).width, 10)/count;
	height_scale = parseInt(window.getComputedStyle(output).height,10);

	while (output.hasChildNodes()) {
	    output.removeChild(output.lastChild);
	}

	bars = [];
	for (var i = 0; i<count; i++) {
		var bar = document.createElement("DIV");
		bar.className = "data";
		bar.style.left = (i*width_scale) + "px";
		bar.style.width = Math.ceil(width_scale) + "px";
		output.appendChild(bar);
		bars[bars.length] = bar;
	}

	update_lodata();

	set_fullbars();
}

function update_lodata() {
	lodata_factor = parseInt(document.getElementById("lodatafactor").value,10);

	var output = document.getElementById("outputlo");
		while (output.hasChildNodes()) {
	    output.removeChild(output.lastChild);
	}

	lodata1 = [];
	lodata2 = [];
	lobars = [];
	for (var i = 0; i<data1.length;) {
		var first_i = i;
		var this_1 = 0;
		var this_2 = 0;
		for (var j = 0; j<lodata_factor; j++) {
			this_1 += data1[i];
			this_2 += data2[i];
			i++;
		}
		this_1 /= lodata_factor;
		this_2 /= lodata_factor;

		lodata1[lodata1.length] = this_1;
		lodata2[lodata2.length] = this_2;

		var bar = document.createElement("DIV");
		bar.className = "data";
		bar.style.left = (first_i*width_scale) + "px";
		bar.style.width = Math.ceil(width_scale*lodata_factor) + "px";
		output.appendChild(bar);
		lobars[lobars.length] = bar;
	}

}

function generate_data(params, count) {
	var data = [];
	var total = 100;
	var constant_m = parseInt(params.constant, 10)/total;
	var noise_m = parseInt(params.noise, 10)/total;
	var linear_m = parseInt(params.linear, 10)/total;
	var sine_m = parseInt(params.sine, 10)/total;
	var exponent_m = parseInt(params.exponent, 10)/total;
	for (var i = 0; i<count; i++) {
		var point = constant_m;
		point += (Math.random()-0.5)*noise_m;
		point += (((params.linearparam ? (count-i) : i)/count)-0.5)*linear_m;
		point += (Math.sin((i*0.628*parseInt(params.sineparam, 10))/count)*0.5)*sine_m;
		point += (Math.pow((i/count),parseInt(params.exponentparam, 10)*0.1)-0.5)*exponent_m;
		data[data.length] = point;
	}

	return data;
}

var latest_fullbar_timeout;
function slider_change() {
	if (document.getElementById("lodataenabled").checked == false) {
		set_fullbars();
		return;
	}
	set_lobars();

	var local_timeout = setTimeout(slider_change_later,parseInt(document.getElementById("lodatadelay").value,10));
	latest_fullbar_timeout = local_timeout;

	function slider_change_later() {
		if(local_timeout==latest_fullbar_timeout) {
			set_fullbars();
		}
	}
}

function set_fullbars() {
	document.getElementById("output").style.display="block";
	document.getElementById("outputlo").style.display="none";
	re_layout(true);
}

function set_lobars() {
	document.getElementById("output").style.display="none";
	document.getElementById("outputlo").style.display="block";
	re_layout(false);
}

function re_layout(full) {
	var t = new Date().getTime();
	var slider = Math.min(Math.max(parseInt(document.getElementById("slider").value,10)/100.0,0.0),1.0);
	var color = "rgb("+(((1-slider)*100)+100)+",120,"+(((slider)*100)+100)+")";
	if (full) {
		for (var i = 0; i<bars.length; i++) {
			bars[i].style.height = Math.max(((data1[i]*(1-slider)) + (data2[i]*slider) )*height_scale, 0) + "px";
			bars[i].style.backgroundColor = color;
		}
	} else {
		for (var i = 0; i<lobars.length; i++) {
			lobars[i].style.height = Math.max(((lodata1[i]*(1-slider)) + (lodata2[i]*slider) )*height_scale, 0) + "px";
			lobars[i].style.backgroundColor = color;
		}
	}
	document.getElementById("timer").innerHTML = new Date().getTime()-t+"ms";
}

window.onload= function() { generate(); };