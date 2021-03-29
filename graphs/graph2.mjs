let cleaned_data = undefined
let ordering = undefined
let range = undefined

const width = (MAX_WIDTH / 2),
      height = MAX_HEIGHT - BUTTON_HEIGHT,
      duration = 500

const cap = 50
const padding = 10;

const suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"]

const svg = d3.select("#graph3")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${large_margin.left}, ${large_margin.top})`);

const ordering_to_clipper = {
    release_year: clip_data_release_year,
    average_runtime: clip_data_average_runtime
}

const x = d3.scaleLinear()
    .range([0, width - large_margin.left - large_margin.right]);

const y = d3.scaleBand()
    .range([0, height - large_margin.top - large_margin.bottom])
    .padding(0.1);

const countRef = svg.append("g");
const y_axis_label = svg.append("g");
const x_axis_label = svg.append("g");

x_axis_label.attr("transform", `translate(0, ${height - 120})`)

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
    .attr("transform", `translate(${(width - large_margin.left - large_margin.right) / 2}, ${height - large_margin.top - large_margin.bottom + 4 * padding})`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text("Average Runtime (Minutes)");

svg.append("text")
    .attr("transform", `translate(${-2 * large_margin.left / 3}, ${(height - large_margin.top - large_margin.bottom) / 2}), rotate(-90)`)
    .attr("font-size", "12px")
    .style("text-anchor", "middle")
    .text(`Release Years`);

const title = svg.append("text")
    .attr("transform", `translate(0, -32)`)
    .attr("font-weight", "bold")
    .style("font-size", 15);

const subtitle = svg.append("text")
    .attr("transform", `translate(0, -14)`)
    .style("font-size", 12);

render_graph2 = async args => {
    const transition = document.getElementById('transition').checked

    const full_data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv("../data/netflix.csv")))

    if (args.init) {
        range = undefined
    }

    let min = d3.min(full_data, ({ average_runtime }) => average_runtime)
    let max = d3.max(full_data, ({ average_runtime }) => average_runtime)
    x.domain([min, max]);

    const ranked_data = [...full_data].sort((a, b) => b.average_runtime - a.average_runtime)

    const { data, title_text, subtitle_text } = ordering_to_clipper[ordering = args.ordering || ordering](args, full_data)

    y.domain(data.map(({ release_year }) => release_year));

    const y_offset = y.bandwidth() / 2

    x_axis_label.call(d3.axisBottom(x))

    const _show = ({ release_year, average_runtime }) => {
        const this_y = y(release_year) + y_offset
        const this_x = x(average_runtime)
        const ranking = ranked_data.findIndex(d => d.average_runtime === average_runtime) + 1
        show({ release_year, average_runtime, this_y, this_x, ranking })
    }

    let temp = y_axis_label
    if (transition) {
        temp = y_axis_label.transition().duration(duration)
    }
    temp.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    y_axis_label.selectAll("text")
        .style("cursor", "pointer")
        .on("mouseover", release_year => {
            const { average_runtime } = data.find(d => d.release_year === release_year)
            _show({ release_year, average_runtime })
        })
        .on("mouseout", hide)

    const area = svg.selectAll(".area").data([data], function(d){ return d.average_runtime })

    temp = area
        .enter()
        .append("path")
        .merge(area)

    if (transition) {
        temp = temp
            .transition()
            .duration(duration)
    }

    temp
        .attr("fill", "steelblue")
        .attr("fill-opacity", .3)
        .attr("stroke", "none")
        .attr("class", "area")
        .attr("d", d3.area()
            .x0(0)
            .x1(({ average_runtime }) => x(average_runtime))
            .y(({ release_year }) => y(release_year) + y_offset)
        )

    const line = svg.selectAll(".line").data([data], function(d){ return d.average_runtime })

    temp = line.
        enter()
        .append("path")
        .attr("class", "line")
        .merge(line)

    if (transition) {
        temp = temp
            .transition()
            .duration(duration)
    }

    temp
        .attr("d", d3.line()
            .x(({ average_runtime }) => x(average_runtime))
            .y(({ release_year }) => y(release_year) + y_offset)
        )
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)

    const points = svg.selectAll("circle").data(data, function(d){ return d.average_runtime })

    temp = points
        .enter()
        .append("circle")
        .merge(points)
        .on("mouseover", _show)
        .on("mouseout", hide)

    if (transition) {
        temp = temp
            .transition()
            .duration(duration)
    }

    temp
        .attr("fill", "steelblue")
        .attr("stroke", "none")
        .attr("title", ({ average_runtime }) => average_runtime)
        .attr("cx", ({ average_runtime }) => x(average_runtime))
        .attr("cy", ({ release_year }) => y(release_year) + y_offset)
        .attr("r", 4)
        .style("cursor", "pointer")

    title.text(title_text)
    subtitle.text(subtitle_text)

    line.exit().remove()
    points.exit().remove()
    area.exit().remove()
}

function clip_data_release_year(args, full_data) {
    const min = d3.min(full_data, ({ release_year }) => release_year)
    const max = d3.max(full_data, ({ release_year }) => release_year)

    const [low, high] = range = (args.range || range || [max - (cap - 1), max])

    args.init && render_slider({ min, max, limit: cap - 1, ordering })

    let data = full_data.sort((a, b) => b.release_year - a.release_year)

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

    return {
        data,
        title_text: `${full_data.length} Sequential Release Years' Average Movie Runtimes`,
        subtitle_text: `(${low} - ${high}) ${high - low + 1} years, ${data.length} samples`
    }
}

function clip_data_average_runtime(args, full_data) {
    const min = 1
    const max = full_data.length

    const [low, high] = range = (args.range || range || [min, cap])

    args.init && render_slider({ min, max, limit: cap - 1, ordering })

    const data = full_data.sort((a, b) => b.average_runtime - a.average_runtime).slice(low - 1, high)

    return {
        data,
        title_text: `${full_data.length} Release Years Ranked By Average Movie Runtime`,
        subtitle_text: `(${low} - ${high}) ${data.length} samples`
    }
}

function show({ release_year, average_runtime, this_y, this_x, ranking }) {
    horizontal_connector.transition().duration(duration).style("opacity", .9);
    horizontal_connector.attr("d", `M 0 ${this_y} H ${this_x}`)

    vertical_connector.transition().duration(duration).style("opacity", .9);
    vertical_connector.attr("d", `M ${this_x} ${this_y} v ${height - large_margin.bottom - this_y - 40}`)

    tooltip.transition()
        .duration(duration)
        .style("opacity", .9);
    const suffix = ranking < 11 || ranking > 19 ? suffixes[ranking % 10] : "th"
    tooltip.html(`${average_runtime} minutes in ${release_year} [${ranking}${suffix}]`)
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

    const present = Object.keys(release_year_mapper).map(release_year => {
        const runtimes = release_year_mapper[release_year]
        const average_runtime = runtimes.reduce((acc, next) => acc + next, 0) / runtimes.length
        return {
            release_year: +release_year,
            average_runtime: +average_runtime.toFixed(2)
        }
    })

    const years = new Set(present.map(({ release_year }) => release_year))
    const min = Math.min(...years)
    const max = Math.max(...years)

    for (let year = min + 1; year < max; year++) {
        if (!years.has(year)) {
            present.push({ release_year: year, average_runtime: 0 })
        }
    }

    return present
}

const slider = document.getElementById('slider');

function render_slider({ min, max, limit, ordering }) {
    slider.noUiSlider?.destroy()

    slider.style.height = `${height - large_margin.bottom - large_margin.top - 22}px`

    noUiSlider.create(slider, {
        range: { min, max },
        start: ordering === "release_year" ? [max - limit, max] : [min, limit + 1],
        margin: 9,
        limit,
        connect: true,
        direction: ordering === "release_year" ? "rtl" : "ltr",
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
    init: true,
    transition: true
})