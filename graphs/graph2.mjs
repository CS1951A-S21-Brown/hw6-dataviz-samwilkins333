let cleaned_data = undefined
let ordering = undefined
let range = undefined

const width = (MAX_WIDTH / 2),
      height = MAX_HEIGHT - BUTTON_HEIGHT,
      duration = 500

const cap = 50
const padding = 10;

const margin_left = 80
const margin_bottom = 60
const margin_right = 175

const svg = d3.select("#graph3")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin_left}, ${margin.top})`);

const key_to_title = {
    average_runtime: { prefix: "Top", label: "Average Runtime" },
    release_year: (low, high, count) => `${count} Average Movie Runtimes By Release Year (${low} - ${high}, ${high - low + 1} years)`
}

const x = d3.scaleLinear()
    .range([0, width - margin_left - margin_right]);

const y = d3.scaleBand()
    .range([0, height - margin.top - margin_bottom])
    .padding(0.1);

const countRef = svg.append("g");
const y_axis_label = svg.append("g");
const x_axis_label = svg.append("g");

x_axis_label.attr("transform", `translate(0, ${height - 100})`)

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("left", 0)
    .style("top", 0)
    .style("opacity", 0);

const horizontal_connector = svg.append("path")
    .attr("class", "connector")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5")
    .style("opacity", 0);

const vertical_connector = svg.append("path")
    .attr("class", "connector")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5")
    .style("opacity", 0);

svg.append("text")
    .attr("transform", `translate(${(width - margin_left - margin_right) / 2}, ${height - margin.top - margin_bottom + 4 * padding})`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text("Average Runtime (Minutes)");

svg.append("text")
    .attr("transform", `translate(${-2 * margin_left / 3}, ${(height - margin.top - margin_bottom) / 2}), rotate(-90)`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text(`Release Years`);

const title = svg.append("text")
    .attr("transform", `translate(0, -14)`)
    .attr("font-weight", "bold")
    .style("font-size", 15);

render_graph2 = async args => {
    svg.selectAll("circle").remove()
    svg.selectAll("path.area").remove()
    svg.selectAll("path.line").remove()

    let data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv("../data/netflix.csv")))

    let min = d3.min(data, ({ release_year }) => release_year)
    let max = d3.max(data, ({ release_year }) => release_year)

    ordering = ordering || args.ordering
    const [low, high] = range = (args.range || range || [max - (cap - 1), max])

    args.init && render_slider({ min, max, limit: cap - 1 })

    min = d3.min(data, ({ average_runtime }) => average_runtime)
    max = d3.max(data, ({ average_runtime }) => average_runtime)

    x.domain([min, max]);

    data = data.sort((a, b) => b[ordering] - a[ordering] || b.release_year - a.release_year)

    let low_index = 0
    for (let i = 0; i < data.length; i++) {
        if (data[i].release_year <= high) {
            low_index = i
            break
        }
    }

    let high_index = 50
    for (let i = low_index; i < data.length; i++) {
        const { release_year } = data[i]
        if (release_year === low) {
            high_index = i + 1
            break
        } else if (release_year < low) {
            high_index = i
            break
        }
    }

    data = data.slice(low_index, high_index)

    y.domain(data.map(({ release_year }) => release_year));

    const y_offset = y.bandwidth() / 2

    x_axis_label.call(d3.axisBottom(x))

    const _show = ({ release_year, average_runtime }) => {
        const this_y = y(release_year) + y_offset
        const this_x = x(average_runtime)
        show({ release_year, average_runtime, this_y, this_x })
    }

    y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    y_axis_label.selectAll("text")
        .style("cursor", "pointer")
        .on("mouseover", release_year => {
            const { average_runtime } = data.find(d => d.release_year === release_year)
            _show({ release_year, average_runtime })
        })
        .on("mouseout", hide)

    svg.append("path")
        .datum(data)
        .attr("fill", "steelblue")
        .attr("fill-opacity", .3)
        .attr("stroke", "none")
        .attr("class", "area")
        .attr("d", d3.area()
            .x0(0)
            .x1(({ average_runtime }) => x(average_runtime))
            .y(({ release_year }) => y(release_year) + y_offset)
        )

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("class", "line")
        .attr("d", d3.line()
            .x(({ average_runtime }) => x(average_runtime))
            .y(({ release_year }) => y(release_year) + y_offset)
        )

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", "steelblue")
        .attr("stroke", "none")
        .attr("title", ({ average_runtime }) => average_runtime)
        .attr("cx", ({ average_runtime }) => x(average_runtime))
        .attr("cy", ({ release_year }) => y(release_year) + y_offset)
        .attr("r", 4)
        .style("cursor", "pointer")
        .on("mouseover", _show)
        .on("mouseout", hide)

    title.text(key_to_title[ordering](low, high, data.length));
}

function show({ release_year, average_runtime, this_y, this_x }) {
    horizontal_connector.transition().duration(duration).style("opacity", .9);
    horizontal_connector.attr("d", `M 0 ${this_y} H ${this_x}`)

    vertical_connector.transition().duration(duration).style("opacity", .9);
    vertical_connector.attr("d", `M ${this_x} ${this_y} v ${height - margin_bottom - this_y - 40}`)

    tooltip.transition()
        .duration(duration)
        .style("opacity", .9);
    tooltip.html(`${average_runtime} minutes in ${release_year}`)
        .style("left", `${d3.event.pageX + 7}px`)
        .style("top", `${d3.event.pageY - 28}px`);
}

function hide() {
    tooltip.transition().duration(duration).style("opacity", 0)
    horizontal_connector.transition().duration(duration).style("opacity", 0)
    vertical_connector.transition().duration(duration).style("opacity", 0)
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
            release_year: +release_year,
            average_runtime: +average_runtime.toFixed(2)
        }
    })
}

const slider = document.getElementById('slider');

function render_slider({ min, max, limit }) {

    slider.style.height = `${height - margin_bottom - margin.top - 22}px`

    noUiSlider.create(slider, {
        range: { min, max },
        start: [max - limit, max],
        margin: 9,
        limit,
        connect: true,
        direction: 'rtl',
        orientation: 'vertical',
        behaviour: 'tap-drag',
        tooltips: true,
        format: wNumb({ decimals: 0 }),
        pips: {
            mode: 'steps',
            stepped: true,
            density: 10
        }
    });

    slider.noUiSlider.on("change", ([start, end]) => render_graph2({ range: [+start, +end]}))

}

await render_graph2({
    ordering: "release_year",
    init: true
})