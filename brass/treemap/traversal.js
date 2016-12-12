function traverse_down(root, func) {
	func(root);

	if ("children" in root) {
		for(var i=0; i<root.children.length; i++) {
			traverse_down(root.children[i], func);
		}
	}
}

function traverse_up(root, func) {
	if ("children" in root) {
		for(var i=0; i<root.children.length; i++) {
			traverse_up(root.children[i], func);
		}
	}

	func(root);
}

function traverse_layer(root, layer, func) {
	if (layer>0) {
		if ("children" in root) {
			for(var i=0; i<root.children.length; i++) {
				traverse_layer(root.children[i], layer-1, func);
			}
		}
	} else {
		func(root);
	}
}

function traverse_layer_view(root, layer, func) {
	if (!data_in_view(root)) {
		return;
	}
	if (layer>0) {
		if ("children" in root) {
			for(var i=0; i<root.children.length; i++) {
				traverse_layer_view(root.children[i], layer-1, func);
			}
		}
	} else {
		func(root);
	}
}