// Set dimensions and margins of the graph
let margin = { top: 100, right: 200, bottom: 110, left: 110 },
  width = 1040 - margin.left - margin.right,
  height = 670 - margin.top - margin.bottom;

// Append svg object to body of the page
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

  let periods = [
    "3 yrs before",
    "2 yrs before",
    "1 yr before",
    "Injury year",
    "1 yr after",
    "2 yrs after",
    "3 yrs after",
  ];

  let x = d3.scaleBand().domain(periods).range([0, width]).padding(0.1);

  let y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.Yards)])
    .nice()
    .range([height, 0]);

  // Add horizontal gridlines
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
    .call((g) => g.selectAll("line").attr("stroke", "#ddd")) // style grid lines
    .call((g) => g.select(".domain").remove());

  svg
    .select(".grid")
    .selectAll("line")
    .filter((d, i, nodes) => i === 0)
    .attr("stroke", "black");

  let xAxis = svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Style x-axis labels
  xAxis
    .selectAll(".tick text")
    .attr("class", "axis-label")
    .attr("dy", "12px")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-family", "PT Sans");

  // Remove the vertical domain line (left and right ticks)
  xAxis.select(".domain").attr("stroke", "none");

  // Add Y axis
  let yAxis = svg.append("g").call(d3.axisLeft(y).ticks(4).tickPadding(10));

  // Style the Y-axis text labels
  yAxis
    .selectAll(".tick text")
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .style("fill", "#4d4d4d")
    .style("font-size", "14px")
    .style("font-family", "PT Sans");

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
    .attr("stroke", "#4d4d4d")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5");

  let benchmarkText = svg
    .append("text")
    .attr("x", width)
    .attr("y", y(62.5))
    .attr("text-anchor", "end")
    .style("font-size", "14px")
    .style("font-family", "PT Sans")
    .style("fill", "#4d4d4d");

  benchmarkText
    .append("tspan")
    .attr("x", width + 152)
    .attr("dy", "-0.3em")
    .text("Benchmark yards/game");

  benchmarkText
    .append("tspan")
    .attr("x", width + 156)
    .attr("dy", "1.2em")
    .text("for a team's top receiver");

  let customColors = {
    "Odell Beckham Jr.": "#3150ec", // NYG
    "A.J. Green": "#f86926", // CIN
    "Dez Bryant": "#869397", // DAL
  };

  // Create color scale
  let colorScale = (d) => customColors[d] || "#ccc";

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
    .append(function (d) {
      if (d.ProBowl === "y") {
        return document.createElementNS(d3.namespaces.svg, "path");
      } else {
        return document.createElementNS(d3.namespaces.svg, "circle");
      }
    })
    .attr("class", "dot")
    .attr("transform", (d) => {
      let xPos = x(d.Period) + x.bandwidth() / 2;
      let yPos = y(d.Yards);
      return `translate(${xPos},${yPos})`;
    })
    .attr("d", function (d) {
      if (d.ProBowl === "y") {
        // SVG path for a 5-point star
        return d3.symbol().type(d3.symbolStar).size(150)();
      }
      return null;
    })
    .attr("r", function (d) {
      return d.ProBowl === "y" ? null : 6;
    })
    .attr("fill", (d) => colorScale(d.Name))
    .attr("stroke", (d) => (d.ProBowl === "y" ? "#FFD700" : "none"))
    .attr("stroke-width", (d) => (d.ProBowl === "y" ? 2 : 0))
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
        )}.png" style="width: 120px; height: 76px; margin-right: 5px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span><strong style="color: ${colorScale(
            d.Name
          )}; font-size: 14px;">${d.Name}</strong></span>
          <span style="font-size: 12px;">${d.Yards} yds/game ${
        d.Period
      } injury</span>
          <span style="font-size: 12px;">Played ${d.Games} games for ${
        d.Team
      } in ${d.Year}</span>
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

  d3.selectAll(".tick text")
    .filter((d) => d === "Injury year")
    .style("font-weight", "bold")
    .style("font-size", "16px")
    .style("fill", "#de2d26"); // deep red

  // Add vertical injury line at Injury year
  svg
    .append("line")
    .attr("x1", x("Injury year") + x.bandwidth() / 2)
    .attr("x2", x("Injury year") + x.bandwidth() / 2)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#de2d26")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5"); // dashed line

  // Title
  svg
    .append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -margin.top + 30)
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-family", "PT Serif")
    .style("font-weight", "bold")
    .selectAll("tspan")
    .data([
      "Odell Beckham Jr., A.J. Green, and Dez Bryant among stars whose",
      "careers were never the same after non-contact leg injuries",
    ])
    .enter()
    .append("tspan")
    .attr("x", width / 2)
    .attr("dy", (d, i) => (i === 0 ? 0 : "1.3em"))
    .text((d) => d);

  // Subtitle
  svg
    .append("text")
    .attr("class", "subtitle")
    .attr("x", width / 2)
    .attr("y", -15)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-family", "PT Sans")
    .text(
      "Performance (in yards/game) of Pro-Bowl receivers before and after non-contact injuries"
    );

  // Add Y-axis label
  svg
    .append("text")
    .attr("x", -margin.left) // adjust left/right spacing
    .attr("y", height / 2) // center it vertically
    .style("text-anchor", "start")
    .style("font-size", "16px")
    .style("font-family", "PT Sans")
    .text("Yards/Game");

  // Caption
  svg
    .append("text")
    .attr("x", 100)
    .attr("y", height + 60)
    .style("text-anchor", "start")
    .style("fill", "#4d4d4d")
    .style("font-size", "12px")
    .style("font-family", "PT Sans")
    .selectAll("tspan")
    .data([
      "Source: Pro Football Reference (for player statistics) and Draft Sharks (for injury histories).",
      "Note: the benchmark yards/game for a team's top receiver (62.5 yards/game) is based off of the commonly",
      "accepted threshold of 1000+ receiving yards over a 16 game regular season for a team's top wide receiver.",
    ])
    .enter()
    .append("tspan")
    .attr("x", 100)
    .attr("dy", (d, i) => {
      if (i === 0) return 0;
      if (i === 1) return "2em"; // extra gap between line 1 and 2
      return "1.2em";
    })
    .text((d) => d);

  // Add legend
  let legend = svg
    .selectAll(".legend")
    .data(players)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width + 20},${i * 20 + 30})`);

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
    .attr("font-size", "14px")
    .style("font-family", "PT Sans")
    .text((d) => d.key);

  // Add legend item for Pro Bowl selection
  let proBowlLegend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, ${players.length * 20 + 40})`);

  proBowlLegend
    .append("path")
    .attr("d", d3.symbol().type(d3.symbolStar).size(150))
    .attr("fill", "white")
    .attr("stroke", "#FFD700")
    .attr("stroke-width", 2)
    .attr("transform", "translate(6, 8)"); // centers the star visually

  proBowlLegend
    .append("text")
    .attr("x", 23)
    .attr("y", 13)
    .attr("font-size", "14px")
    .style("font-family", "PT Sans")
    .text("Selected to Pro Bowl");
});
