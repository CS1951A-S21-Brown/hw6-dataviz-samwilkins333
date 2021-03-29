let focus_mode = false

document.addEventListener("keypress", e => {
    switch (e.key) {
        case "f":
            toggleFocusMode()
            break
    }
})

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
