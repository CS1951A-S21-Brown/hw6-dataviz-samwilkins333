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
        "To explore a specific subset of genres, select (1 < number < total_visible) genres by clicking on either the slice or the list element and press 'Apply' to view just those genres in a smaller subgraph. In a subgraph, genre slices' colors are not reinterpolated: rather, original global colors are transferred to preserve global scale information. The smallest subgraph may contain two genres, but no fewer. With this setup, one can either view global relationships among all genres, or focus in on comparing particular genres of interest. This is particularly helpful when comparing genres with small global slices.",
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
    ],
    container: [
        ["[1.] Dashboard Description", { fontWeight: "bold" }],
        "See individual graph information panels. Note that the icon in the right of the header toggles focus mode, in which only the graph panel with mouse focus has full opacity. This can also be toggled with each press of the 'f' key.",
        ["[2. & 3.] Strengths and Weaknesses of D3", { fontWeight: "bold" }],
        "✅ The fact that D3 is data-bound has been exceedingly helpful. Once a pipeline is finalized, it became very straightforward to manipulate data in code and, after re-rendering, see the visuals fall into place. This was extremely useful when designing reactions to user input.",
        "✅ Likewise, the common APIs and concepts between graphs that are very visually distinct is empowering. While there were particular functions and routines unique to each graph type, the general approaches all followed the same blueprint even though the visuals differ substantially.",
        "✅ Finally, the fact that D3 is functional (in that one defines a template function for attributes to be applied elementwise at runtime) helped code conciseness, and the fact that it exposes wrappers around transitions, color interpolation and more complicated SVG path routines like arcs and areas made involved designs practically feasible.",
        "❌ D3 is highly flexible, but can be labor intensive to use. Other resources may provide reasonable defaults for simpler needs.",
        "❌ Since D3 is performant at scale and data-focused, it might not be the correct tool for an informal visualization, or for visualizing small data sets. It can still be used, of course, but the complexity is not amortized as it would be for a large dataset.",
        "❌ It may be the case that building a visualization in a native application rather than the browser is better suited to the needs of one's audience, the format of one's data or, though less likely, even in response to DOM-related performance bottlenecks for sufficiently large datasets. In this case, D3 would be out of the running.",
        ["[3. & 4.] Accessibility Evaluation", { fontWeight: "bold" }],
        "The first article discusses a number of techniques to provide an equivalent experience for all users. I attempted to use differentiable colors (though this is not formal, as I did not use a palette generator) and added white space in between elements involved in background color interpolation sequences. Wherever I used an image, I added a CSS title and alt text to assist with screen readers, though I did not, as the author offers, consciously structure my SVG markup 'to allow users to tab through each data point'. Given more time, I would implement this functionality for all three graphs to increase the dashboard's accessibility. For the largest and most visually busy graph, I allow the user to enable or disable the transition animation. Thus, I would characterize my dashboard as reasonably accessible, but I would really value feedback from actual users before making any firm claims.",
        "Somewhat reiterating, I could have spent more time formalizing my color palette and structuring my SVG to be keyboard navigable. I believe the former of these would have been reasonably manageable, but I didn't necessarily invest the time since I knew it would require changing minimal code, and could be done down the road even after my sense of the project architecture had become stale. For the SVG structuring, on the other hand, I found that prospect daunting in the context of an introductory (to D3) project, and I wanted to finalize my functionality before working on accessibility outright. I ran out of time this project, but I feel optimistic that I can make my next project more accessible as a result of this process."
    ]
}
let _heights = {
    graph1_wrapper: `${MAX_HEIGHT / 2 - BUTTON_HEIGHT - 1}px`,
    graph2_wrapper: `${MAX_HEIGHT - BUTTON_HEIGHT}px`,
    graph3_wrapper: `${MAX_HEIGHT / 2 - BUTTON_HEIGHT}px`,
    container: `${MAX_HEIGHT}px`
}

function toggleInfo(contentsId, toggleId) {
    const contents = document.getElementById(contentsId)
    const toggle = document.getElementById(toggleId)

    if (contents.classList.contains("info_active")) {
        toggle.src = "icons/info.png"
        toggle.alt = toggle.title = "More Information"

        contents.classList.remove("info_active")

        contents.innerHTML = ""

        for (const child of _contents[contentsId]) {
            contents.append(child)
        }
    } else {
        toggle.src = "icons/clear.png"
        toggle.alt = toggle.title = "Less Information"

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
            if (Array.isArray(p)) {
                const [text, style] = p
                span.textContent = text
                for (const key of Object.keys(style)) {
                    span.style[key] = style[key]
                }
            } else {
                span.textContent = p
            }
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
