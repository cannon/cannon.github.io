
function tm_create_dom(root) {
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

function tm_draw_layers(root, layer, count, nocull) {
	//shouldn't be reached
	if (!("children" in root)) {
		console.log("warning: drawing on leaf");
		return;
	}

	if ("rect" in root) {
		root.rect.setAttribute('display', 'none');
	}

	if (nocull || (data_in_view(root) && (root.volume || 0.0) > 0.0)) {
		root.svg.setAttribute('display', 'inline');
	} else {
		root.svg.setAttribute('display', 'none');
		return;
	}

	if (layer == 0) {
		for(var i=0; i<root.children.length; i++) {
			var child = root.children[i];
			if (child.volume>0) {
				var txp = (child.xt*VIEW_SCALE)-VIEW_X;
				var typ = (child.yt*VIEW_SCALE)-VIEW_Y;
				child.rect.setAttributeNS(null, 'x', Math.trunc(txp));
				child.rect.setAttributeNS(null, 'y', Math.trunc(typ));
				child.rect.setAttributeNS(null, 'width', Math.max(Math.trunc(child.width*VIEW_SCALE + (txp % 1.0)) - 1,0));
				child.rect.setAttributeNS(null, 'height', Math.max(Math.trunc(child.height*VIEW_SCALE + (typ % 1.0)) - 1,0));
				child.rect.setAttribute('display', 'inline');
			} else {
				child.rect.setAttribute('display', 'none');
			}
			if ("svg" in child) {
				child.svg.setAttribute('display', 'none');
			}
		}
	} else {
		for(var i=0; i<root.children.length; i++) {
			draw_layers(root.children[i], layer-1, 1);
		}
	}

}

function tm_data_in_view(root) {
	return (root.xt < VIEW_XMAX && root.yt < VIEW_YMAX && (root.xt + root.width) > VIEW_XMIN && (root.yt + root.height) > VIEW_YMIN);
}

function tm_update_view() {
	VIEW_XMIN = VIEW_X / VIEW_SCALE;
	VIEW_YMIN = VIEW_Y / VIEW_SCALE;
	VIEW_XMAX = VIEW_XMIN + (parseInt(window.getComputedStyle(output).width, 10) / VIEW_SCALE);
	VIEW_YMAX = VIEW_YMIN + (parseInt(window.getComputedStyle(output).height, 10) / VIEW_SCALE);
}

function tm_wheel_callback(e) {
	var rect = output.getBoundingClientRect();

	var msx = e.clientX - rect.left;
	var msy = e.clientY - rect.top;

	var mouse_cx = (msx + VIEW_X)/VIEW_SCALE;
	var mouse_cy = (msy + VIEW_Y)/VIEW_SCALE;
	
	if(e.deltaY < 0) {
		VIEW_SCALE *= 1.2;
	} else {
		VIEW_SCALE /= 1.2;
	}
	VIEW_SCALE = Math.min(20, Math.max(VIEW_SCALE,0.5));

	VIEW_X = (mouse_cx*VIEW_SCALE) - msx;
	VIEW_Y = (mouse_cy*VIEW_SCALE) - msy;

	update_view();
	trigger_layout();

	if(!e){ e = window.event; } /* IE7, IE8, Chrome, Safari */
    if(e.preventDefault) { e.preventDefault(); } /* Chrome, Safari, Firefox */
    e.returnValue = false; /* IE7, IE8 */
}

//todo: make it also try horizantal layouts (columns instead of rows)
function tm_compute_layout_rows(root) {
	if (!("children" in root)) {
		return;
	}

	var layout = [];

	//sqrt of aspect ratio - used for choosing row size
	root.asprsqrt = Math.sqrt(root.width/root.height);
	var this_pref_row = 0;

	for(var i=0; i<root.children.length; i++) {
		layout.push({});
		var temp = Math.max(Math.floor(root.asprsqrt*Math.sqrt(root.layoutvolume/root.children[i].layoutvolume)),1);
		//preferred number of items to share a row with
		layout[i].pref_row = temp;
		this_pref_row = Math.max(temp,this_pref_row);
	}

	if (this_pref_row==0) {
		alert("layout no children error");
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

	root.rows = rows;

	child_sizes(root,"layoutvolume");
}

function tm_compute_layout(root) {
	if (root == data) {
		compute_volume(root);
	}
	if ("children" in root) {
		for(var i=0; i<root.children.length; i++) {
			compute_volume(root.children[i]);
		}
	}
	child_sizes(root,"volume");
	if ("children" in root) {
		for(var i=0; i<root.children.length; i++) {
			root.children[i].xt = root.xt + root.children[i].x;
			root.children[i].yt = root.yt + root.children[i].y;
		}
	}
}

function tm_compute_volume(root) {
	if (root.filtercounter != FILTER_COUNTER) {
		root.filtered_gpa = compute_volume_key(root, "sc_gpa");
		root.filtered_sat = compute_volume_key(root, "sc_sat");
		root.filtercounter = FILTER_COUNTER;
	}
	root.volume = lerp(root.filtered_gpa, root.filtered_sat, sc_gpa_sc_sat_BLEND);
}

function tm_compute_volume_key(root, key) {
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

function child_sizes(root, key) {
	var rows = root.rows;

	if (rows == undefined) {
		return;
	}

	var curr_y = 0;
	for (var i = 0; i<rows.length; i++) {
		var row = rows[i];
		var this_volume = 0;
		for (var j = 0; j<row.length; j++) {
			this_volume += root.children[row[j]][key];
		}
		var proportion = 1.0/rows.length;
		if (root[key] > 0) {
			proportion = this_volume/root[key];
		}
		var height = proportion*root.height;

		var curr_x = 0;
		for (var j = 0; j<row.length; j++) {
			if (this_volume == 0) {
				proportion = 1.0/row.length;
			} else {
				proportion = root.children[row[j]][key]/this_volume;
			}
			var width = proportion*root.width;
			root.children[row[j]].x = curr_x;
			root.children[row[j]].y = curr_y;
			root.children[row[j]].width = width;
			root.children[row[j]].height = height;
			curr_x += width;
		}

		curr_y += height;
	}
}