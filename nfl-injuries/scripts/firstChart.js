// Set the dimensions and margins of the graph
let margin = { top: 60, right: 200, bottom: 60, left: 70 },
  width = 1000 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// Append the svg object to the body of the page
let svg = d3
  .select("#myChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.csv("data/IndivPlayerStats.csv", (data) => {
  data.forEach(function (d) {
    d.Yards = +d.Yards;
    d.Period = d.Period;
  });

  // Set up scales
  let periods = [
    "3 yr before",
    "2 yr before",
    "1 yr before",
    "Injury year",
    "1 yr after",
    "2 yr after",
    "3 yr after",
  ];
  let x = d3.scaleBand().domain(periods).range([0, width]).padding(0.1);

  let y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.Yards)])
    .nice()
    .range([height, 0]);

  // Add horizontal gridlines (more lines)
  svg
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(y)
        .tickSize(-width) // makes the lines stretch across the chart
        .tickFormat("") // hide the labels
        .ticks(4) // increase number of gridlines
    )
    .selectAll("line")
    .attr("stroke", "#ddd"); // light gray gridline color

  // Add X axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll(".tick text")
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .style("font-size", "12px");

  // Add Y axis
  let yAxis = svg.append("g").call(d3.axisLeft(y).ticks(4).tickPadding(10));

  // Style the Y-axis text labels
  yAxis
    .selectAll(".tick text")
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .style("font-size", "12px");

  // Hide the tick marks (lines)
  yAxis.selectAll(".tick line").attr("stroke", "none");

  // Hide the domain path (vertical Y-axis line)
  yAxis.select(".domain").attr("stroke", "none");

  // Add horizontal benchmark line at 62.5
  svg
    .append("line")
    .attr("x1", 0)
    .attr("y1", y(62.5))
    .attr("x2", width)
    .attr("y2", y(62.5))
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5");

  // Add label for benchmark line
  svg
    .append("text")
    .attr("x", width - 5)
    .attr("y", y(62.5) - 5)
    .attr("text-anchor", "end")
    .style("font-size", "12px")
    .style("fill", "gray")
    .text("Benchmark yds/game for a team's top receiver");

  let customColors = {
    "Odell Beckham Jr.": "#0B2265", // NYG
    "A.J. Green": "#fb4f14", // CIN
    "Dez Bryant": "#869397", // DAL
  };

  // Create color scale
  let colorScale = (d) => customColors[d] || "#ccc"; //d3.scaleOrdinal(d3.schemeCategory10);

  // Group data by player name
  let players = d3
    .nest()
    .key((d) => d.Name)
    .entries(data);

  // Create lines for each player
  svg
    .selectAll(".line")
    .data(players)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", function (d) {
      let line = d3
        .line()
        .x((d) => x(d.Period) + x.bandwidth() / 2)
        .y((d) => y(d.Yards));
      return line(d.values);
    })
    .attr("stroke", (d) => colorScale(d.key))
    .attr("fill", "none")
    .attr("stroke-width", 2);

  // Add dots for each data point
  svg
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.Period) + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.Yards))
    .attr("r", 6)
    .attr("fill", (d) => colorScale(d.Name))
    .attr("stroke", (d) => (d.ProBowl === "y" ? "#FFD700" : "none"))
    .attr("stroke-width", (d) => (d.ProBowl === "y" ? 2 : 0))
    // .style("opacity", 0.8)
    .on("mouseover", function (d) {
      d3.select(this)
        .transition()
        .duration(400)
        .attr("r", 8)
        .style("filter", "drop-shadow(0 0 3px #999)");
      let tooltipText = `
      <div style="display: flex; align-items: center;">
        <img src="images/${d.Name.replaceAll(
          " ",
          "_"
        )}.png" style="width: 90px; height: 57px; margin-right: 10px;">
        <div>
          <strong style="color: ${colorScale(d.Name)}">${d.Name}</strong><br>
          ${d.Yards} yds/game ${d.Period} injury<br>
          Played ${d.Games} games for ${d.Team} in ${d.Year}
        </div>
      </div>`;
      d3.select("#myTooltip")
        .html(tooltipText)
        .transition()
        .duration(200)
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .style("opacity", 1.0);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(400)
        .attr("r", 6)
        .style("filter", null);
      d3.select("#myTooltip").transition().duration(200).style("opacity", 0);
    });

  // Highlight Injury Year column
  svg
    .append("rect")
    .attr("x", x("Injury year"))
    .attr("y", 0)
    .attr("width", x.bandwidth())
    .attr("height", height)
    .attr("fill", "#fce4ec") // light pink highlight
    .lower(); // send to back

  d3.selectAll(".tick text")
    .filter((d) => d === "Injury year")
    .style("font-weight", "bold")
    .style("fill", "#b71c1c"); // deep red

  // Title
  svg
    .append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -30)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text(
      "Odell Beckham Jr., A.J. Green, and Dez Bryant among the stars whose careers were never the same after field-related injuries"
    );

  // Subtitle
  svg
    .append("text")
    .attr("class", "subtitle")
    .attr("x", width / 2)
    .attr("y", -10)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-style", "italic")
    .text(
      "Performance of Pro-Bowl receivers before and after non-contact injuries"
    );

  // Add Y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50) // Adjust left/right spacing
    .attr("x", -height / 2) // Center it vertically
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Yards/Game");

  // Caption
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Data sourced from Pro Football Reference");

  // Add legend
  let legend = svg
    .selectAll(".legend")
    .data(players)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", (d) => colorScale(d.key));

  legend
    .append("text")
    .attr("x", 15)
    .attr("y", 9)
    .attr("font-size", "12px")
    .text((d) => d.key);

  // Add legend item for Pro Bowl selection
  let proBowlLegend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, ${players.length * 20 + 10})`);

  proBowlLegend
    .append("circle")
    .attr("cx", 5)
    .attr("cy", 5)
    .attr("r", 6)
    .attr("fill", "white") // neutral fill color
    .attr("stroke", "#FFD700") // black border
    .attr("stroke-width", 2);

  proBowlLegend
    .append("text")
    .attr("x", 15)
    .attr("y", 9)
    .attr("font-size", "12px")
    .text("Selected to Pro Bowl");
});
