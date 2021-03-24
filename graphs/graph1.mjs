let cleaned_data = undefined

const width = MAX_WIDTH / 2,
      height = MAX_HEIGHT / 2 - BUTTON_HEIGHT,
      duration = 500

const label_offset = 2,
      padding = 10;

const svg = d3.select("#graph1")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = d3.scaleLinear()
    .range([0, width - margin.left - margin.right]);

const y = d3.scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .padding(0.1);

const countRef = svg.append("g");
const y_axis_label = svg.append("g");

svg.append("text")
    .attr("transform", `translate(${(width - margin.left - margin.right) / 2}, ${height - margin.top - margin.bottom + 2 * padding})`)
    .attr("font-size", "12px")
    .attr("text-align", "center")
    .style("text-anchor", "middle")
    .text("Number of Titles");

const y_axis_text = svg.append("text")
    .attr("transform", `translate(${-5 * margin.left / 6}, ${(height - margin.top - margin.bottom) / 2}), rotate(-90)`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle");

const title = svg.append("text")
    .attr("transform", `translate(0, -14)`)
    .style("font-weight", "bold")
    .style("font-size", 15);

render_graph1 = async (category) => {
    const data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv("../data/netflix.csv")))[category]

    x.domain([0, d3.max(data, ({ count }) => count)]);
    y.domain(data.map(({ genre }) => genre));

    y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    const bars = svg.selectAll("rect").data(data);

    const color = d3.scaleOrdinal()
        .domain(data.map(({ genre }) => genre))
        .range(d3.quantize(d3.interpolateHcl("#ffcc33", "#66a0e2"), data.length));

    bars.enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(duration)
        .attr("fill", ({ genre }) => color(genre))
        .attr("x", x(0))
        .attr("y", ({ genre }) => y(genre))
        .attr("width", ({ count }) => x(count))
        .attr("height", y.bandwidth());

    const counts = countRef.selectAll("text").data(data);

    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(duration)
        .attr("font-size", "10px")
        .attr("x", ({ count }) => x(count) + label_offset)
        .attr("y", ({ genre }) => y(genre) + 8)
        .style("text-anchor", "start")
        .text(({ count }) => count);

    y_axis_text.text(`${category}s`)
    title.text(`Number of Titles Per Genre (${category}s)`);

    bars.exit().remove();
    counts.exit().remove();
}

function clean_data(data) {
    const genre_count_mapper = {}

    for (const { listed_in, type } of data) {
        for (const genre of listed_in.split(", ")) {
            (genre_count_mapper[genre] = genre_count_mapper[genre] ?? { "Movie": 0, "TV Show": 0 })[type]++
        }
    }

    const aggregated = Object.keys(genre_count_mapper).map(genre => ({ genre, count: genre_count_mapper[genre] }))

    const partitions = { "Movie": [], "TV Show": [] }
    for (const { genre, count } of aggregated) {
        const title_test = /tv|show|series/ig.test(genre)
        const movie_count = count["Movie"]
        const tv_count = count["TV Show"]
        if (tv_count) {
            console.assert(!movie_count && title_test)
            partitions["TV Show"].push({ genre, count: tv_count })
        } else {
            console.assert(!tv_count && !title_test)
            partitions["Movie"].push({ genre, count: movie_count })
        }
    }

    for (const type of Object.keys(partitions)) {
        partitions[type] = partitions[type].sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    }

    return partitions
}

await render_graph1("Movie")
