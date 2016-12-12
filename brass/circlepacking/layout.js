
/*
ALGORITHMS:

https://github.com/d3/d3-hierarchy/blob/master/README.md#pack

Bottom two commands are circle packing and circle enclosing algorithm reference

*/



//todo: make it also try horizantal layouts (columns instead of rows)
function compute_layout_rows(root) {
	if (!("children" in root)) {
		return;
	}

	root.order = [];

	for (var i = 0; i < root.children.length; i++) {
	   root.order.push(i);
	}

	root.order.sort(function(a, b){return root.children[b].layoutvolume-root.children[a].layoutvolume});
}

function compute_layout(root) {
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
		my_circle_packer(root);

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

		PR_S+=volum/(root.r*root.r);
		PR_C++;

		PR_MIN = Math.min(volum/(root.r*root.r),PR_MIN);
		PR_MAX = Math.max(volum/(root.r*root.r),PR_MIN);
	}
}

var PR_S = 0;
var PR_C = 0;
var PR_MIN = 1.0;
var PR_MAX = 0.0;

function packRatio() { return PR_S/PR_C; }

function compute_volume(root) {
	if (root.filtercounter != FILTER_COUNTER) {
		root.filtered_gpa = compute_volume_key(root, "sc_gpa");
		root.filtered_sat = compute_volume_key(root, "sc_sat");
		root.filtercounter = FILTER_COUNTER;
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


function my_circle_packer(root) {
		var o = root.order;

		for(var i=0; i<root.children.length; i++) {
			var child = root.children[o[i]];
			child.r=Math.sqrt(child.volume);

			if (i==0) {
				child.x=0;
				child.y=1;
			} else if(i==1) {
				child.x=child.r + root.children[o[0]].r;
				child.y=1;
			} else {
				var keep_checking = true;
				var longest_id=i-1;

				while (keep_checking) {
					var otherChild = root.children[o[longest_id]];


					//first, place child next to otherChild
					var d = dist(otherChild.x,otherChild.y);
					var circle_rad = child.r + otherChild.r + d;
					child.x = otherChild.x*circle_rad/d;
					child.y = otherChild.y*circle_rad/d;


					//then, rotate around it
					var greatest_CDangle = -10;
					var thirdChild_id = -1;

					for(var j=0; j<i; j++) {
						if (j!=longest_id) {
							var thirdChild = root.children[o[j]];

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
					for(var j=0; j<i; j++) {
						if (j!=longest_id && j!=thirdChild_id) {
							var collChild = root.children[o[j]];
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
			
		}
}