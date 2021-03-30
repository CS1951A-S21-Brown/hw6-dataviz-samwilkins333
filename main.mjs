let focus_mode = false

document.addEventListener("keypress", e => {
    switch (e.key) {
        case "f":
            toggleFocusMode()
            break
    }
})

let _contents = {}
let _text = {
    graph1_wrapper: [
        "This interactive donut graph allows exploration and comparison of the number of titles within each set of mutually exclusive genres (either among movies or television shows). Hover over a slice to view its genre name and title count.",
        "To explore a specific subset of genres, select (1 < number < total_visible) genres by clicking on either the slice or the list element and press 'Apply' to view just those genres in a smaller subgraph. The smallest subgraph may contain two genres, but no fewer. With this setup, one can either view global relationships among all genres, or focus in on comparing particular genres of interest. This is particularly helpful when comparing genres with small global slices.",
        "'Back' returns to the previous selection. 'Clear' resets all state. Switching between movies and television shows resets all state."
    ],
    graph2_wrapper: [
        "This interactive line graph displays the average movie runtime per release year, or 0 if the year is absent from the data. It can be ordered from newest to oldest release year or by descending rank, where a higher rank corresponds to a larger average runtime.",
        "The accompanying slider acts as a minimap, contextualizing the current range shown on screen. This was implemented to balance readability with a comprehensive representation of the data. Hovering over each blue point reveals, regardless of the selected ordering, a tooltip with the runtime average, release year and rank.",
        "Thus, over time ranges of various offsets and scales, one can gain a better understanding of how average runtimes changed over time. Likewise, given the rankings, one can view outliers as well as clusters of common years.",
        "The transition checkbox determines whether or not future changes to the graph will be smoothly interpolated."
    ],
    graph3_wrapper: [
        "This interactive bar graph displays pairs of directors and actors, subject to the filters and conditions, ordered by the number of movies in the data in which both have been involved.",
        "In any event, it will display up to 15 pairs to preserve readability. To view all pairs featuring a particular actor, use the filter input and autocomplete. For example, to find all directors with whom Matt Damon has worked, ordered by the number of shared films, search a:Matt Damon and select the entry from the dropdown. To find all actors that Martin Scorsese has directed, search d:Martin Scorsese. This filter can be cleared by pressing 'Escape' if the input has focus, or clicking the circular button within the input.",
        "In some cases, a single individual is both a director and an actor in a movie, resulting in a pair with the same name. These are disallowed by default, but can be displayed by checking 'Director Allowed As Actor'. Likewise, there are instances where the same movie is released in different languages. By default, these versions are collapsed and collectively contribute 1 to the shared movie counts, but they can each be treated as unique movies by checking 'Language Versions Unique'.",
        "The title will indicate whether all relevant pairs are being shown. If there are more than can be displayed, the total is included. For both the title and axes, if a filter is applied, the name will appear in the appropriate slot, either 'Actor' or 'Director'.",
        "With this setup, you can explore relationships between directors and actors, and expand your search by observing and then filtering names that appear in association with previous queries."
    ]
}
let _heights = {
    graph1_wrapper: `${MAX_HEIGHT / 2 - BUTTON_HEIGHT - 1}px`,
    graph2_wrapper: `${MAX_HEIGHT - BUTTON_HEIGHT}px`,
    graph3_wrapper: `${MAX_HEIGHT / 2 - BUTTON_HEIGHT}px`
}

function toggleInfo(contentsId) {
    const contents = document.getElementById(contentsId)

    if (contents.classList.contains("info_active")) {
        contents.classList.remove("info_active")

        contents.innerHTML = ""

        for (const child of _contents[contentsId]) {
            contents.append(child)
        }
    } else {
        contents.classList.add("info_active")
        _contents[contentsId] = [...contents.children]

        contents.innerHTML = ""

        const div = document.createElement("div")
        div.classList.add("wrapper")
        div.classList.add("_col")
        div.style.height = _heights[contentsId]
        div.style.overflowY = "scroll"
        div.style.padding = "5px 10px 5px 10px"

        _text[contentsId].forEach(p => {
            const span = document.createElement("span")
            span.style.marginBottom = "10px"
            span.textContent = p
            div.append(span)
        })

        contents.append(div)
    }
}

tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("left", 0)
    .style("top", 0)
    .style("opacity", 0);

function toggleFocusMode() {
    const toggle = document.getElementById("focus-toggle")
    const container = document.getElementById("container")
    const targets = Array.from(document.getElementsByClassName("blurrable"))
    focus_mode = !focus_mode
    if (focus_mode) {
        toggle.src = "./icons/no_focus.png"
        toggle.alt = toggle.title = "Disable Focus Mode"
        targets.forEach(element => element.classList.add("mutable"))
        container.classList.add("focus-active")
    } else {
        toggle.src = "./icons/focus.png"
        toggle.alt = toggle.title = "Enable Focus Mode"
        targets.forEach(element => element.classList.remove("mutable"))
        container.classList.remove("focus-active")
    }
}
