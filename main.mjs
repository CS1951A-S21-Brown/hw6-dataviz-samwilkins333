let focus_mode = false

document.addEventListener("keypress", e => e.key === "f" && toggleFocusMode())

function toggleFocusMode() {
    const toggle = document.getElementById("focus-toggle")
    const container = document.getElementById("container")
    const targets = Array.from(document.getElementsByClassName("blurrable"))
    focus_mode = !focus_mode
    if (focus_mode) {
        toggle.src = "./icons/no_focus.png"
        toggle.alt = toggle.title = "Disable Focus Mode"
        targets.forEach(element => element.classList.add("blurred"))
        container.classList.add("focus-active")
    } else {
        toggle.src = "./icons/focus.png"
        toggle.alt = toggle.title = "Enable Focus Mode"
        targets.forEach(element => element.classList.remove("blurred"))
        container.classList.remove("focus-active")
    }
}
