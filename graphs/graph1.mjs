let cleaned_data = undefined

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

const x = d3.scaleLinear()
    .range([0, width - margin.left - margin.right]);

const y = d3.scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .padding(0.1);

const countRef = svg.append("g");

const title = d3.select("#title1").append("svg").attr("width", "350").attr("height", "34").append("text")
    .attr("transform", `translate(140, 22)`)
    .style("font-weight", "bold")
    .style("font-size", 15)
    .style("text-anchor", "middle")

function focus(id, color) {
    id = id.replace(/\s+/g, "")

    for (const slice of [...document.getElementsByClassName("slice")]) {
        slice.style.opacity = "0.5"
    }
    for (const item of [...document.getElementsByClassName("item")]) {
        item.style.opacity = "0.5"
    }
    for (const target of [...document.getElementsByClassName(id)]) {
        target.style.backgroundColor = color || "white"
        target.style.opacity = "1"
        target.scrollIntoView({ behavior: "smooth", block: "end" })
        for (const child of [...target.children]) {
            child.style.fontSize = "14px"
        }
    }
}

function relax() {
    for (const slice of [...document.getElementsByClassName("slice")]) {
        slice.style.opacity = "1"
    }
    for (const item of [...document.getElementsByClassName("item")]) {
        item.style.opacity = "1"
        item.style.backgroundColor = "white"
        for (const child of [...item.children]) {
            child.style.fontSize = "10px"
        }
    }
}

render_graph1 = async (category) => {
    const data = (cleaned_data = cleaned_data ?? clean_data(await d3.csv("../data/netflix.csv")))[category]

    const pie_data_view = document.getElementById("pie-data")
    pie_data_view.style.height = `${height}px`

    const labels_list = document.getElementById("labels-list")
    labels_list.innerHTML = ""

    const color = d3.scaleOrdinal()
        .domain(data.map(({ genre }) => genre))
        .range(d3.quantize(d3.interpolateHcl("#ffcc33", "lightsteelblue"), data.length));

    data.forEach((d, i) => {
        const div = document.createElement("div")
        const genre = document.createElement("span")
        const count = document.createElement("span")

        genre.style.fontSize = count.style.fontSize = "10px"
        genre.style.padding = "0 2px 0 2px"
        genre.style.borderRadius = "2px"
        genre.textContent = `${i + 1}. ${d.genre}`
        count.textContent = d.count

        div.append(genre)
        div.append(count)

        const id = d.genre.replace(/\s+/g, "")

        div.classList.add("item")
        div.classList.add(id)

        div.addEventListener("mouseenter", () => focus(d.genre, color(d.genre)))
        div.addEventListener("mouseleave", relax)

        labels_list.append(div)
    })

    const radius = (Math.min(width, height) + mar) / 2

    const data_ready = d3.pie()
        .sort(({ count }) => count)
        .value(({ count }) => count)(data)

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
        .attr('fill', ({ data }) => color(data.genre))
        .attr("stroke", "white")
        .attr("class", ({ data }) => `slice ${data.genre.replace(/\s+/g, "")}`)
        .style("cursor", "pointer")
        .style("stroke-width", "1px")
        .on("mouseover", ({ data: { genre } }) => focus(genre, color(genre)))
        .on("mouseout", relax)

    title.text(`Number of Titles Per Genre (${category}s)`);

    slices.transition().duration(duration)

    slices.exit().remove()
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
