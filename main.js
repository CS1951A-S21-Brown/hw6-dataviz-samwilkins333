import render_graph1 from "./graphs/graph1.mjs"
import render_graph2 from "./graphs/graph2.mjs"
import render_graph3 from "./graphs/graph3.mjs"

// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

const data = await d3.csv("../data/netflix.csv")

await render_graph1(data)
await render_graph2(data)
await render_graph3(data)
