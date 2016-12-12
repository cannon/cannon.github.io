TreeMap Data Visualization ReadMe

Welcome to my TreeMap test! To start, open index.html in a modern web browser.

Upon starting, you'll see a treemap containing 4 hierarchical levels of colored boxes. In our imaginary data set, the smallest boxes represent students. Groups of student boxes, which have a matching color, represent classrooms. Groups of classrooms with equal color intensity represent schools, and finally, groups of schools which have the same hue represent cities.

First, locate the "Visualization" slider with a green outline, and move it around a bit. The boxes will change relative size, as you can see how the imaginary students compare by GPA and SAT score. You might notice that while dragging, the lowest "student" boxes don't show - this is done automatically to keep the visualization smooth, and it's re-calibrated on the fly. To force the engine to always draw the most detailed level (for benchmarking), uncheck the "Optimization" Enabled checkbox.

Use your mouse to click and drag the data around, or your mouse wheel to zoom in and out. When the data is zoomed in, anything outside the viewing area is culled for performance. You can also use the "Filter" sliders to select a date-of-birth range and display a subset of the students.

To create your own data, play with the sliders in the "Data" box, and click "Generate". The first four sliders are the main way to make the data set larger or smaller. The "variance" sliders affect how much randomization is used to generate the data set.

