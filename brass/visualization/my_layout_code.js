			/*	
				//var vec_x = root.children[o[i-1]].x;
				//var vec_y = root.children[o[i-1]].y;

				//vector it "flies in" toward
				var vec_ang = i*i*i;

				var vec_x = Math.sin(vec_ang);
				var vec_y = Math.cos(vec_ang);

				var longest_len = 0;
				var longest_id = -1;

				for(var j=0; j<i; j++) { //problem if other is behind incoming?
					var otherChild = root.children[o[j]];
					var circle_rad = child.r + otherChild.r;

					var sec_x1 = -otherChild.x;
					var sec_y1 = -otherChild.y;
					var sec_x2 = sec_x1 + vec_x;
					var sec_y2 = sec_y1 + vec_y;
					var vec_rsq = distSq(vec_x, vec_y);
					var big_d = (sec_x1*sec_y2)-(sec_x2*sec_y1);
					var discrim = (circle_rad*circle_rad*vec_rsq)-(big_d*big_d);

					if (discrim > 0) {
						discrim = sign(vec_y)*Math.sqrt(discrim);

						var int1_x = ((big_d*vec_y) + (vec_x*discrim))/vec_rsq;
						var int1_y = ((big_d*vec_x) + (vec_y*discrim))/vec_rsq; 

						var int2_x = ((big_d*vec_y) - (vec_x*discrim))/vec_rsq;
						var int2_y = ((big_d*vec_x) - (vec_y*discrim))/vec_rsq; 

						int1_x-=sec_x1;
						int1_y-=sec_y1;
						int2_x-=sec_x1;
						int2_y-=sec_y1;

						if (((int1_x*vec_x)+(int1_y*vec_y)) < ((int2_x*vec_x)+(int2_y*vec_y))) {
							int1_x=int2_x;
							int1_y=int2_y;
						}

						if (longest_len < ((int1_x*vec_x)+(int1_y*vec_y))) {
							longest_len = ((int1_x*vec_x)+(int1_y*vec_y));
							longest_id = j;
						}
					} else {
						// no collision
					}

				}

				if (longest_id==-1) {console.log('ERROR: nolongest');} */

