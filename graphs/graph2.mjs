let cleaned_data = undefined

const width = (MAX_WIDTH / 2),
      height = MAX_HEIGHT - 44,
      duration = 500

const label_offset = 2,
      padding = 10;

const margin_left = 80

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
    .range([0, height - margin.top - margin.bottom])
    .padding(0.1);

let countRef = svg.append("g");
let y_axis_label = svg.append("g");

svg.append("text")
    .attr("transform", `translate(${(width - margin_left - margin.right) / 2}, ${height - margin.top - margin.bottom + 1.5 * padding})`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text("Average Runtime");

svg.append("text")
    .attr("transform", `translate(${-2 * margin_left / 3}, ${(height - margin.top - margin.bottom) / 2}), rotate(-90)`)
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

    x.domain([0, d3.max(data, ({ average_runtime }) => average_runtime)]);
    y.domain(data.map(({ release_year }) => release_year));

    y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    let bars = svg.selectAll("rect").data(data);

    let color = d3.scaleOrdinal()
        .domain(data.map(({ release_year }) => release_year))
        .range(d3.quantize(d3.interpolateHcl("#ffcc33", "#66a0e2"), data.length));

    bars.enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(duration)
        .attr("fill", ({ release_year }) => color(release_year))
        .attr("x", x(0))
        .attr("y", ({ release_year }) => y(release_year))
        .attr("width", ({ average_runtime }) => x(average_runtime))
        .attr("height", y.bandwidth());

    let counts = countRef.selectAll("text").data(data);

    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(duration)
        .attr("font-size", "10px")
        .attr("x", ({ average_runtime }) => x(average_runtime) + label_offset)
        .attr("y", ({ release_year }) => y(release_year) + 8)
        .style("text-anchor", "start")
        .text(({ average_runtime }) => average_runtime);

    title.text(`Top 50 Average Runtime Per Release Year (Descending by ${key_to_label[ordering]})`);

    bars.exit().remove();
    counts.exit().remove();
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