let cleaned_data = undefined

const width = (MAX_WIDTH / 2),
      height = MAX_HEIGHT / 2 - BUTTON_HEIGHT,
      duration = 500

const label_offset = 2,
      padding = 10;

const svg = d3.select("#graph3")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = d3.scaleLinear()
    .range([0, width - margin.left - margin.right]);

const y = d3.scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .padding(0.3);

const countRef = svg.append("g");
const y_axis_label = svg.append("g");

svg.append("text")
    .attr("transform", `translate(${(width - margin.left - margin.right) / 2}, ${height - margin.top - margin.bottom + 2 * padding})`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text("Number of Shared Movies");

svg.append("text")
    .attr("transform", `translate(${-7 * margin.left / 8}, ${(height - margin.top - margin.bottom) / 2}), rotate(-90)`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text(`(Director, Actor) Pairs`);


const title = svg.append("text")
    .attr("transform", `translate(0, -14)`)
    .attr("font-weight", "bold")
    .style("font-size", 15);

render_graph3 = async () => {
    const cap = 15

    const allowSelfPairs = document.getElementById("repeats").checked
    const langVersionsUnique = document.getElementById("lang_versions").checked

    let data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv("../data/netflix.csv")))
    data = data[langVersionsUnique ? 1 : 0]

    if (!allowSelfPairs) {
        data = data.filter(({ director, actor }) => director !== actor)
    }

    data = data
        .map(({ director, actor, count }) => ({
                pair: `${director}, ${actor}`,
                count
            }))
        .sort((a, b) => b.count - a.count || a.pair.localeCompare(b.pair))
        .slice(0, cap)

    x.domain([0, d3.max(data, ({ count }) => count)]);
    y.domain(data.map(({ pair }) => pair));

    y_axis_label
        .transition()
        .duration(duration)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(5));

    const bars = svg.selectAll("rect").data(data);

    const buckets = new Set(data.map(({ count }) => count)).size
    const color = d3.scaleOrdinal()
        .domain(data.map(({ count }) => count))
        .range(d3.quantize(d3.interpolateHcl("mediumaquamarine", "aquamarine"), buckets));

    bars.enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(duration)
        .attr("fill", ({ count }) => color(count))
        .attr("x", x(0))
        .attr("y", ({ pair }) => y(pair))
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
        .attr("y", ({ pair }) => y(pair) + 8)
        .style("text-anchor", "start")
        .text(({ count }) => count);

    title.text(`Top ${cap} Most Frequent Movie (Director, Actor) Pairs`);

    bars.exit().remove();
    counts.exit().remove();
}

function clean_data(data) {
    const director_actor_pairs = {}
    for (const { director, cast, title } of data.filter(({ type }) => type === "Movie")) {
        const directors = director.split(", ").filter(d => d.length)
        const actors = cast.split(", ").filter(a => a.length)
        for (const d of directors) {
            for (const a of actors) {
                const joint = `${d}, ${a}`
                let existing = director_actor_pairs[joint]
                if (!existing) {
                    existing = director_actor_pairs[joint] = [new Set(), new Set()]
                }
                existing[0].add(title.replace(/ \(.* Version\)/, ""))
                existing[1].add(title)
            }
        }
    }

    const unique = [], collapsed = []

    Object.keys(director_actor_pairs).forEach(joint => {
        const [d, a] = joint.split(", ")
        const [c, u] = director_actor_pairs[joint]
        collapsed.push({ director: d, actor: a, count: c.size })
        unique.push({ director: d, actor: a, count: u.size })
    })

    return [collapsed, unique]
}

await render_graph3()