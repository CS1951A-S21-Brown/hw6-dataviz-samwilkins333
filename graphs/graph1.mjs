let cleaned_data = undefined
let _category = undefined
let prev_focused = [null]
let focus_index = 0

const width = MAX_WIDTH / 2,
    height = MAX_HEIGHT / 2 - BUTTON_HEIGHT - 1,
    duration = 500

const padding = 10,
    mar = 40;

const svg = d3.select("#graph1")
    .append("svg")
    .attr("width", height)
    .attr("height", height)
    .style("border-left", "1px solid #00000011")
    .append("g")
    .attr("transform", `translate(${height / 2}, ${height / 2})`);

const { x: offset_x, y: offset_y } = document.getElementById("graph1").getBoundingClientRect()

const x = d3.scaleLinear()
    .range([0, width - margin.left - margin.right]);

const y = d3.scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .padding(0.1);

const back = document.getElementById("back-pie")
const select = document.getElementById("select-pie")
const clear = document.getElementById("clear-pie")

const movie = document.getElementById("movie")
const show = document.getElementById("show")

const countRef = svg.append("g");

const title = d3
    .select("#title1")
    .append("svg")
    .attr("width", "300")
    .attr("height", "34")
    .append("text")
    .attr("transform", `translate(140, 22)`)
    .style("font-weight", "bold")
    .style("font-size", 15)
    .style("text-anchor", "middle")

function focus(id, color) {
    id = id.replace(/\s+/g, "")

    const slices = [...document.getElementsByClassName("slice")]
    const items = [...document.getElementsByClassName("item")]

    for (let i = 0; i < slices.length; i++) {
        const item = items[i]
        const slice = slices[i]
        if (!item.children.item(0).checked) {
            item.style.opacity = "0.5"
            slice.style.opacity = "0.5"
        }
    }
    for (const target of [...document.getElementsByClassName(id)]) {
        target.style.backgroundColor = color || "white"
        target.style.opacity = "1"
    }
}

function relax() {
    const items = [...document.getElementsByClassName("item")]
    const slices = [...document.getElementsByClassName("slice")]

    if (!focused.size) {
        slices.forEach(s => s.style.opacity = "1")
        items.forEach(i => {
            i.style.opacity = "1"
            i.style.backgroundColor = "white"
        })
    } else {
        for (let i = 0; i < slices.length; i++) {
            const item = items[i]
            const slice = slices[i]
            if (!item.children.item(0).checked) {
                item.style.opacity = "0.5"
                slice.style.opacity = "0.5"
                item.style.backgroundColor = "white"
            }
        }
    }
}

function toggleSelect(genre, logical_update = true) {
    const id = genre.replace(/\s+/g, "")
    const relevant = document.getElementsByClassName(id)
    const checkbox = relevant.item(0).children.item(0)
    checkbox.checked = !checkbox.checked
    relevant.item(1).style.opacity = "1"
    if (logical_update) {
        if (focused.has(genre)) {
            focused.delete(genre)
        } else {
            focused.add(genre)
        }
        ensure_button_focus()
    }
}

render_graph1 = async ({category, focus_action}) => {
    back.disabled = clear.disabled = select.disabled = true

    if (category) {
        movie.disabled = category === "Movie"
        show.disabled = category === "TV Show"
        clear_focus()
    }

    _category = category ?? _category

    let data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv(DATA_PATH)))[_category]

    if (focus_action) {
        switch (focus_action) {
            case "back":
                focus_index -= 1
                focused = prev_focused[focus_index] ?? new Set()
                if (focused.size) {
                    data = data.filter(d => focused.has(d.genre))
                }
                focused = prev_focused[focus_index + 1]
                select.disabled = focused.size === 0
                for (const genre of focused) {
                    toggleSelect(genre, false)
                }
                prev_focused = prev_focused.slice(0, focus_index + 1)
                break
            case "clear":
                clear_focus()
                break
        }
    } else {
        if (focused.size > 1) {
            prev_focused.push(new Set(focused))
            focus_index = prev_focused.length - 1
            data = data.filter(d => focused.has(d.genre))
        }
        focused = new Set()
    }

    const pie_data_view = document.getElementById("pie-data")
    pie_data_view.style.height = `${height}px`

    const labels_list = document.getElementById("labels-list")
    labels_list.innerHTML = ""

    const color = d3.scaleOrdinal()
        .domain(data.map(({genre}) => genre))
        .range(d3.quantize(d3.interpolateHcl("#ffcc33", "lightsteelblue"), data.length));

    data.forEach((d, i) => {
        const div = document.createElement("div")
        const genre = document.createElement("span")
        const count = document.createElement("span")

        const is_base_case = data.length === 2

        genre.style.fontSize = count.style.fontSize = "10px"
        genre.style.padding = `0 2px 0 ${is_base_case ? 2 : 5}px`
        genre.style.borderRadius = "2px"
        genre.textContent = `${i + 1}. ${d.genre}`
        count.textContent = d.count

        if (!is_base_case) {
            const check = document.createElement("input")
            check.setAttribute("type", "checkbox")
            check.style.pointerEvents = "none"
            check.checked = focused.has(d.genre)
            check.classList.add("check")
            div.append(check)
        }

        const wrapper = document.createElement("div")
        wrapper.classList.add("wrapper")
        wrapper.classList.add("cent")

        wrapper.append(genre)
        wrapper.append(count)
        wrapper.style.justifyContent = "space-between"
        wrapper.style.padding = "2px 0 2px 0"
        div.append(wrapper)

        const id = d.genre.replace(/\s+/g, "")

        div.classList.add("item")
        div.classList.add(id)

        div.addEventListener("click", () => toggleSelect(d.genre))
        div.addEventListener("mouseenter", () => focus(d.genre, color(d.genre)))
        div.addEventListener("mouseleave", relax)

        labels_list.append(div)
    })

    const radius = (Math.min(width, height) + mar) / 2

    const data_ready = d3.pie()
        .sort(({count}) => count)
        .value(({count}) => count)(data)

    // noinspection JSCheckFunctionSignatures
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8)

    const slices = svg.selectAll('path').data(data_ready)

    slices
        .enter()
        .append('path')
        .merge(slices)
        .attr('d', arc)
        .attr('fill', ({data}) => color(data.genre))
        .attr("stroke", "white")
        .attr("class", ({data}) => `slice ${data.genre.replace(/\s+/g, "")}`)
        .style("cursor", "pointer")
        .style("stroke-width", "1px")
        .on("mouseover", d => {
            const [x, y] = arc.centroid(d)
            const { genre, count } = d.data
            tooltip
                .transition()
                .duration(duration)
                .style("opacity", .9)
            tooltip
                .html(`${genre} [${count}]`)
                .style("left", `${offset_x + x + height / 2}px`)
                .style("top", `${offset_y + y + height / 2}px`);
            focus(genre, color(genre))
        })
        .on("mouseout", () => {
            tooltip.transition().duration(duration).style("opacity", 0)
            relax()
        })
        .on("click", ({data: {genre}}) => toggleSelect(genre))

    title.text(`Number of Titles Per Genre [${_category}s]`);

    slices.transition().duration(duration)

    slices.exit().remove()

    for (const genre of [...focused]) {
        focus(genre, color(genre))
    }

    relax()
    ensure_button_focus()
}

function clear_focus() {
    prev_focused = [null]
    focus_index = 0
    focused = new Set()
}

function ensure_button_focus() {
    const numItems = document.getElementsByClassName("item").length
    select.disabled = focused.size <= 1 || numItems === 2 || numItems === focused.size
    back.disabled = prev_focused.length === 1
    clear.disabled = focused.size === 0 && prev_focused.length === 1
}

function clean_data(data) {
    const genre_count_mapper = {}

    for (const {listed_in, type} of data) {
        for (const genre of listed_in.split(", ")) {
            (genre_count_mapper[genre] = genre_count_mapper[genre] ?? {"Movie": 0, "TV Show": 0})[type]++
        }
    }

    const aggregated = Object.keys(genre_count_mapper).map(genre => ({genre, count: genre_count_mapper[genre]}))

    const partitions = {"Movie": [], "TV Show": []}
    for (const {genre, count} of aggregated) {
        const title_test = /tv|show|series/ig.test(genre)
        const movie_count = count["Movie"]
        const tv_count = count["TV Show"]
        if (tv_count) {
            console.assert(!movie_count && title_test)
            partitions["TV Show"].push({genre, count: tv_count})
        } else {
            console.assert(!tv_count && !title_test)
            partitions["Movie"].push({genre, count: movie_count})
        }
    }

    for (const type of Object.keys(partitions)) {
        partitions[type] = partitions[type].sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    }

    return partitions
}

await render_graph1({category: "Movie"})
