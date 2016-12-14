
function cp_create_dom(root) {
	if ("children" in root) {
		for (var i = 0; i<root.children.length; i++) {
			var child = root.children[i];

			child.rect = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			child.rect.setAttribute('display', 'none');
			child.rect.setAttributeNS(null, 'fill', HSVtoColor(child.hue || 0,child.sat || 1,child.val || 1));
			child.rect.setAttributeNS(null, 'stroke', "black");
			child.rect.setAttributeNS(null, 'stroke-width', "1");			
			root.svg.appendChild(child.rect);

			if ("children" in child) {
				child.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				child.svg.setAttribute('display', 'none');
				child.svg.setAttribute('overflow','visible');
				//child.svg.setAttributeNS(null, 'viewBox', "-500 -500 1000 1000");
				root.svg.appendChild(child.svg);
			}
		}
	}
}

function cp_draw_layers(root, layer, count, nocull) {
	//shouldn't be reached
	if (!("children" in root)) {
		console.log("warning: drawing on leaf");
		return;
	}

	if ("rect" in root) {
		//root.rect.setAttribute('display', 'none');
	}

	if (nocull || (data_in_view(root) && (root.volume || 0.0) > 0.0)) {
		root.svg.setAttribute('display', 'inline');
	} else {
		root.svg.setAttribute('display', 'none');
		return;
	}

	if (count > layer) {
		for(var i=0; i<root.children.length; i++) {
			var child = root.children[i];
			if (child.volume>0) {
				child.rect.setAttributeNS(null, 'cx', (child.x*VIEW_SCALE)-VIEW_X);
				child.rect.setAttributeNS(null, 'cy', (child.y*VIEW_SCALE)-VIEW_Y);
				child.rect.setAttributeNS(null, 'r', child.r*VIEW_SCALE);
				child.rect.setAttribute('display', 'inline');
			} else {
				child.rect.setAttribute('display', 'none');
			}
			if ("svg" in child) {
				child.svg.setAttributeNS(null, 'x', (child.x*VIEW_SCALE));
				child.svg.setAttributeNS(null, 'y', (child.y*VIEW_SCALE));
				child.svg.setAttribute('display', 'none');
			}
		}
	}
	if (layer > 0) {
		for(var i=0; i<root.children.length; i++) {
			draw_layers(root.children[i], layer-1, count, nocull);
		}
	}

}

function cp_data_in_view(root) {
	return ((root.xt - root.r) < VIEW_XMAX && (root.yt - root.r) < VIEW_YMAX && (root.xt + root.r) > VIEW_XMIN && (root.yt + root.r) > VIEW_YMIN);
}

function cp_update_view() {
	VIEW_XMIN = (VIEW_X - 500) / VIEW_SCALE;
	VIEW_YMIN = (VIEW_Y - 500) / VIEW_SCALE;
	VIEW_XMAX = VIEW_XMIN + (1000 / VIEW_SCALE);
	VIEW_YMAX = VIEW_YMIN + (1000 / VIEW_SCALE);
}

function cp_wheel_callback(e) {
	var rect = output.getBoundingClientRect();

	var view_scale = Math.max(rect.right-rect.left,rect.bottom-rect.top)/1000;

	var msx = (e.clientX - ((rect.left+rect.right)/2))/view_scale;
	var msy = (e.clientY - ((rect.top+rect.bottom)/2))/view_scale;

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

/*
ALGORITHMS:

https://github.com/d3/d3-hierarchy/blob/master/README.md#pack

Bottom two commands are circle packing and circle enclosing algorithm reference
*/

//todo: make it also try horizantal layouts (columns instead of rows)
function cp_compute_layout_rows(root) {
	if (!("children" in root)) {
		return;
	}

	root.order = [];

	for (var i = 0; i < root.children.length; i++) {
	   root.order.push(i);
	}

	root.order.sort(function(a, b){return root.children[b].layoutvolume-root.children[a].layoutvolume});
}

var PR_MIN = 1.0;
var PR_MAX = 0.0;

function cp_compute_layout(root) {
	if (root == data) {
		compute_volume(root);
	}
	if ("children" in root) {
		for(var i=0; i<root.children.length; i++) {
			var child = root.children[i];
			compute_volume(child);
			child.r=Math.sqrt(child.volume);
		}

		//d3 algorithm: 64% volume efficiency w/ default data
		//d3.packSiblings(root.children);

		//my algorithm: 69% volume efficiency + no "jumping" when slider is moved
		var count = my_circle_packer(root);

		if (count == 0) { return; }

		//d3 does heavy lifting here
		var newOuter = d3.packEnclose(root.children);

		//consistent scaling - most accurate visualization scale (0.707 for 50% volume per layer)
		var factor = Math.pow(0.75, root.layer+1);

		//volume filling scaling
		//var factor = root.r/newOuter.r;

		var volum = 0;

		for(var i=0; i<root.children.length; i++) {
			var child = root.children[i];
			child.x -= newOuter.x;
			child.y -= newOuter.y;

			child.x *= factor;
			child.y *= factor;
			child.r *= factor;

			child.xt = root.xt + child.x;
			child.yt = root.yt + child.y;

			volum+=child.r*child.r;
		}	

		PR_MIN = Math.min(volum/(root.r*root.r),PR_MIN);
		PR_MAX = Math.max(volum/(root.r*root.r),PR_MIN);
	}
}

function cp_compute_volume(root) {
	if (root.filtercounter != FILTER_COUNTER) {
		root.filtered_gpa = compute_volume_key(root, "sc_gpa");
		root.filtered_sat = compute_volume_key(root, "sc_sat");
		root.filtercounter = FILTER_COUNTER;
	}
	root.volume = lerp(root.filtered_gpa, root.filtered_sat, sc_gpa_sc_sat_BLEND);
}

function cp_compute_volume_key(root, key) {
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

function my_circle_packer(root) {
	var o = root.order;

	var placed = [];

	for(var i=0; i<root.children.length; i++) {
		var child = root.children[o[i]];
		
		if (child.r == 0) { 
			//just put empty children at the center for packenclose later
			child.x=0;
			child.y=1;
			continue;
		}

		if (placed.length==0) {
			child.x=0;
			child.y=1;
		} else if(placed.length==1) {
			child.x=child.r + placed[0].r;
			child.y=1;
		} else {
			var keep_checking = true;
			var longest_id=placed.length-1;

			while (keep_checking) {
				var otherChild = placed[longest_id];


				//first, place child next to otherChild
				var d = dist(otherChild.x,otherChild.y);
				var circle_rad = child.r + otherChild.r + d;
				child.x = otherChild.x*circle_rad/d;
				child.y = otherChild.y*circle_rad/d;


				//then, rotate around it
				var greatest_CDangle = -10;
				var thirdChild_id = -1;

				for(var j=0; j<placed.length; j++) {
					if (j!=longest_id) {
						var thirdChild = placed[j];

						//child = new one getting inserted
						//otherChild = one child is rotating around
						//thirdChild = one that new child is getting tested against for second collision

						if (dist(thirdChild.x-otherChild.x,thirdChild.y-otherChild.y) <= thirdChild.r + otherChild.r + (child.r*2)) {

							//a = line: otherChild-thirdChild
							//b = line: otherChild-child
							//c = line: thirdChild-child
							//d = line: thirdChild-center
							//e = line: otherChild-center

							var sideAsq = distSq(thirdChild.x-otherChild.x,thirdChild.y-otherChild.y);
							var sideB = otherChild.r + child.r;
							var sideC = thirdChild.r + child.r;
							var sideDsq = distSq(thirdChild.x,thirdChild.y);
							var sideEsq = distSq(otherChild.x,otherChild.y);

							var angleD = Math.acos((sideAsq+sideEsq-sideDsq)/(2*Math.sqrt(sideAsq*sideEsq)));
							var angleC = Math.acos((sideAsq+(sideB*sideB)-(sideC*sideC))/(2*sideB*Math.sqrt(sideAsq)));

							//note: ERROR when other or third is at (0,0)!!

							//check which side of the line since we're rotating CCW
							if ((otherChild.x*thirdChild.y) - (otherChild.y*thirdChild.x) < 0) {
								angleD = -angleD;
							}

							if (angleC+angleD > greatest_CDangle) {
								greatest_CDangle = angleC+angleD;
								thirdChild_id = j;
							}
						}
					}
				}

				if (thirdChild_id==-1) {console.log('ERROR: no thirdChild'); }

				var oc2cx=child.x-otherChild.x;
				var oc2cy=child.y-otherChild.y;

				var offset_angle = Math.PI-greatest_CDangle;
				var the_sin = Math.sin(offset_angle);
				var the_cos = Math.cos(offset_angle);

				var oc2cx2 = (oc2cx*the_cos) - (oc2cy*the_sin);
				var oc2cy2 = (oc2cy*the_cos) + (oc2cx*the_sin);

				child.x = otherChild.x+oc2cx2;
				child.y = otherChild.y+oc2cy2;

				var found_other = -1;
				for(var j=0; j<placed.length; j++) {
					if (j!=longest_id && j!=thirdChild_id) {
						var collChild = placed[j];
						if (dist(child.x-collChild.x,child.y-collChild.y) < child.r+collChild.r) {
							found_other = j;
						}
					}
				}

				if (found_other==-1) {
					keep_checking = false;
				} else {
					longest_id = found_other;
				}
			}

		}

		placed.push(child);
		
	}

	return placed.length;
}