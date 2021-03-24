let cleaned_data = undefined

const width = (MAX_WIDTH / 2),
      height = MAX_HEIGHT - 44,
      duration = 500

const padding = 10;

const margin_left = 80
const margin_bottom = 60


const svg = d3.select("#graph3")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin_left}, ${margin.top})`);

const key_to_label = { average_runtime: "Average Runtime", release_year: "Release Year" }

let x = d3.scaleLinear()
    .range([0, width - margin_left - margin.right]);

let y = d3.scaleBand()
    .range([0, height - margin.top - margin_bottom])
    .padding(0.1);

let countRef = svg.append("g");
let y_axis_label = svg.append("g");
let x_axis_label = svg.append("g");

x_axis_label.attr("transform", `translate(0, ${height - 100})`)

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const horizontal_connector = svg.append("path")
    .attr("class", "connector")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5")
    .style("opacity", 0);

const vertical_connector = svg.append("path")
    .attr("class", "connector")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5")
    .style("opacity", 0);

svg.append("text")
    .attr("transform", `translate(${(width - margin_left - margin.right) / 2}, ${height - margin.top - margin_bottom + 1.5 * padding + 20})`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text("Average Runtime (Minutes)");

svg.append("text")
    .attr("transform", `translate(${-2 * margin_left / 3}, ${(height - margin.top - margin_bottom) / 2}), rotate(-90)`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text(`Release Years`);

let title = svg.append("text")
    .attr("transform", `translate(0, -14)`)
    .attr("font-weight", "bold")
    .style("font-size", 15);

render_graph2 = async (ordering) => {
    let data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv("../data/netflix.csv")))
    data = data
        .sort((a, b) => b[ordering] - a[ordering])
        .slice(0, 50)

    const min = d3.min(data, ({ average_runtime }) => average_runtime)
    const max = d3.max(data, ({ average_runtime }) => average_runtime)
    x.domain([min, max]);
    y.domain(data.map(({ release_year }) => release_year));

    x_axis_label.call(d3.axisBottom(x))
    y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    const y_offset = y.bandwidth() / 2

    svg.append("path")
        .datum(data)
        .attr("fill", "steelblue")
        .attr("fill-opacity", .3)
        .attr("stroke", "none")
        .transition()
        .duration(duration)
        .attr("d", d3.area()
            .x0(0)
            .x1(({ average_runtime }) => x(average_runtime))
            .y(({ release_year }) => y(release_year) + y_offset)
        )

    const circles = svg.selectAll("myCircles")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", "steelblue")
        .attr("stroke", "none")
        .attr("title", ({ average_runtime }) => average_runtime)
        .attr("cx", function(d) { return x(d.average_runtime) })
        .attr("cy", function(d) { return y(d.release_year) + y_offset })
        .attr("r", 4)
        .style("cursor", "pointer")
        .on("mouseover", ({ average_runtime, release_year }) => {
            const this_y = y(release_year) + y_offset
            const this_x = x(average_runtime)

            horizontal_connector.transition().duration(duration).style("opacity", .9);
            horizontal_connector.attr("d", `M 0 ${this_y} H ${this_x}`)

            vertical_connector.transition().duration(duration).style("opacity", .9);
            vertical_connector.attr("d", `M ${this_x} ${this_y} v ${height - margin_bottom - this_y - 40}`)

            tooltip.transition()
                .duration(duration)
                .style("opacity", .9);
            tooltip.html(`${average_runtime} minutes in ${release_year}`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", () => {
            tooltip.transition().duration(duration).style("opacity", 0)
            horizontal_connector.transition().duration(duration).style("opacity", 0)
            vertical_connector.transition().duration(duration).style("opacity", 0)
        })

    circles.transition().duration(duration)

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .transition()
        .duration(duration)
        .attr("d", d3.line()
            .x(function(d) { return x(d.average_runtime) })
            .y(function(d) { return y(d.release_year) + y_offset })
        )

    title.text(`Top 50 Average Movie Runtime Per Release Year (Descending by ${key_to_label[ordering]})`);
}

function clean_data(data) {
    data = data
            .filter(({ type }) => type === "Movie")
            .map(({ duration, release_year }) => ({
                minutes: +duration.split(" ")[0],
                release_year: +release_year
            }))

    const release_year_mapper = {}

    for (const { minutes, release_year } of data) {
        const existing = (release_year_mapper[release_year] ?? [])
        existing.push(minutes)
        release_year_mapper[release_year] = existing
    }

    return Object.keys(release_year_mapper).map(release_year => {
        const runtimes = release_year_mapper[release_year]
        const average_runtime = runtimes.reduce((acc, next) => acc + next, 0) / runtimes.length
        return {
            release_year,
            average_runtime: Math.round(average_runtime)
        }
    })
}

await render_graph2("release_year")