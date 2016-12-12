
timer_log = {}

function timer_logging(firstlayer, lastlayer, t_render, t_layout) {
	var key = ""+firstlayer+"-"+lastlayer;
	if (firstlayer==lastlayer) { key = ""+firstlayer; }
	if (!(key in timer_log)) {
		timer_log[key] = {"layout":[], "render":[], "both":[]}
	}
	timer_log[key].layout.push(t_layout);
	timer_log[key].render.push(t_render);
	timer_log[key].both.push(t_layout+t_render);
}

function timer_logging_reset() {
	timer_log = {}
	document.getElementById("timer_graphs").innerHTML = "";
}

function timer_logging_graph() {
	var outer = document.getElementById("timer_graphs");
	outer.innerHTML = "";

	for (var key in timer_log) {
		var next = document.createElement("p");
		next.innerHTML = "<strong>Level: "+key+"</strong>";
		next.style="margin: 2px;";
		outer.appendChild(next);
		next = document.createElement("div");
		next.style="overflow:auto;";
		outer.appendChild(next);

		var inner = document.createElement("div");
		next.appendChild(inner);
		create_bargraph(inner, timer_log[key].layout, 0);
		inner = document.createElement("div");
		next.appendChild(inner);
		create_bargraph(inner, timer_log[key].render, 1);
		inner = document.createElement("div");
		next.appendChild(inner);
		create_bargraph(inner, timer_log[key].both, 2);
		
	}
}


function create_bargraph(dom, data, which) {
	var graphHeight = 400;
	var graphWidth = Math.floor(document.body.clientWidth/3)-10;
	dom.style = "float:left;";
	var oldDom = dom;
	dom = document.createElement("div");
	dom.style = "width:"+graphWidth+"px; height:"+graphHeight+"px; position:relative;";

	var max = 0;
	var min = 100000;
	for (var i = 0; i < data.length; i++) {
		max = Math.max(max, data[i]);
		min = Math.min(min, data[i]);
	}

	var title = document.createElement("p");
	title.innerHTML = (which==0?"layout":(which==1?"render":"both")) + " ("+min+"-"+max+" ms) ";
	dom.appendChild(title);
	if(max==min) { 
		dom.style = "height:20px;";
	}
	oldDom.appendChild(dom);
	if(max==min) {
		return;
	}

	var steps = Math.min(Math.floor(document.body.clientWidth/40),(max+1-min));

	var sum_data = [];
	for (var i=0; i<steps; i++) {
		sum_data.push(0);
	}
	for (var i = 0; i < data.length; i++) {
		sum_data[Math.floor((data[i]-min)*steps/((max+1)-min))]++;
	}

	var height_max = 0;
	for (var i=0; i<sum_data.length; i++) {
		height_max = Math.max(height_max,sum_data[i]);
	}

	console.log(sum_data);

	var marginX = 20;
	var marginY = 24;
	
	var barWidth = (graphWidth-(marginX*2))/steps;
	var barHeight = graphHeight-(marginY*2);

	for (var i=0; i<sum_data.length; i++) {
		var next = document.createElement("div");
		var style = "position: absolute;";
		style+= "left:"+((i*barWidth)+marginX)+"px;";
		style+= "right:"+(graphWidth-(((i+1)*barWidth)+marginX))+"px;";
		style+= "top:"+(marginY+((1.0-(sum_data[i]/height_max))*barHeight))+"px;";
		style+= "bottom:"+marginY+"px;";
		style+= "background-color: "+(which==0?"orange":(which==1?"red":"cyan"))+";";
		console.log(style);
		next.style = style;
		if (sum_data[i]>0) { next.innerHTML = Math.floor(min + ((i/sum_data.length)*(max-min))); }
		dom.appendChild(next);
	}


}

