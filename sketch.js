var json;
var list = {};
var groups = {};
var data = {
  "name": "root",
  "children": []
};

$(document).ready(() => {
  const id = "118EpNxeOf2Ly7ObSThWU76uCJbNlj7zfEs1Ng5sJFvI";
  fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json`)
    .then(response => response.text())
    .then(text => {
      json = JSON.parse(text.substr(47).slice(0, -2)).table.rows;
      parse();
      draw();
    });
  $("#show1").click(() => $(".hidden1").toggleClass("d-none"));
  $("#show2").click(() => $(".hidden2").toggleClass("d-none"));
});

function parse() {
  for (let i = 0; i < json.length; i++) {
    let name = json[i].c[1].v.trim().toLowerCase();
    let space = name.indexOf(' ');
    if (space != -1)
      name = name.substring(0, space);
    name = name.charAt(0).toUpperCase() + name.slice(1);
    let time = json[i].c[0].f;
    space = time.indexOf(' ');
    time = time.substring(0, space);
    let date = time.split("/");
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    date[0] = months[Number(date[0]) - 1];

    let user = {};
    user.date = date;
    user.name = name;
    user.answer1 = json[i].c[2].v;
    if (user.answer1 == "Steer the trolley & kill 1 worker")
      user.case1 = 5;
    else
      user.case1 = 1;
    user.answer2 = json[i].c[3].v;
    if (user.answer2 == "Use the healthy patient's organs to save 5 lives")
      user.case2 = 5;
    else
      user.case2 = 1;
    user.answer3 = json[i].c[4].v;
    if (user.answer3 == "Execute the innocent person & save 5 lives")
      user.case3 = 5;
    else
      user.case3 = 1;
    user.answer4 = json[i].c[5].v;
    if (user.answer4 == "Give the dose to the initial patient")
      user.case4 = 1;
    else
      user.case4 = 5;
    user.answer5 = json[i].c[6].v;
    if (user.answer5 == "Manufacture the gas & let the 1 patient die")
      user.case5 = 5;
    else
      user.case5 = 1;
    user.code = "" + user.case1 + user.case2 + user.case3 + user.case4 + user.case5;

    if (!list[name])
      list[name] = user;
    else {
      let count = 2;
      let name2 = name;
      while (list[name2]) {
        name2 = name + count++;
      }
      list[name2] = user;
      list[name2].name = name2;
    }
  }

  let arr = Object.keys(list);

  for (let i = 0; i < arr.length; i++) {
    let user = list[arr[i]];
    let code = user.code;
    if (!groups[code])
      groups[code] = [];
    groups[code].push(user);
  }
}

function draw() {
  let width = $(window).width();
  let height = $(window).height();
  $("#visualisation").attr({
    "width": width,
    "height": height
  });

  let arr = Object.keys(groups);
  let colors = [
    "#FFD6D6",
    "#DFBBD4",
    "#BE93C5",
    "#AEA0C7",
    "#9DADC9",
    "#8CBACB",
    "#7BC6CC",
    "#91C3DA",
    "#A7BFE8"
  ];

  for (let i = 0; i < arr.length; i++) {
    let node = {};
    node.name = arr[i];
    node.color = colors[i % colors.length];
    node.children = [];
    for (let j = 0; j < groups[arr[i]].length; j++) {
      let child = {};
      child.name = groups[arr[i]][j].name;
      child.color = colors[i % colors.length];
      node.children.push(child);
    }
    data.children.push(node);
  }

  const svg = d3.select("#visualisation");
  const root = d3.hierarchy(data);
  const links = root.links();
  const nodes = root.descendants();

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.name).distance(30).strength(1))
    .force("charge", d3.forceManyBody().strength(-70))
    .force("center", d3.forceCenter(width / 4, height / 2));

  const link = svg.append("g")
    .attr("stroke", "#EEE")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");

  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("fill", d => d.children ? "#FFF" : d.data.color)
    .attr("stroke", d => d.children ? d.data.color : "transparent")
    .attr("r", d => d.data.name == "root" ? 0 : 3)
    .call(
      d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  node.append("text")
    .text(d => d.data.name)
    .attr("class", "d-none");

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  function dragstarted(d) {
    if (!d3.event.active)
      simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active)
      simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  $("circle").mouseover(function(e) {
    let user = list[$(this).find("text").text()];
    let card = $(".card");
    let p = card.find("p");
    if (user.date)
      p.eq(0).text(user.date[1] + " " + user.date[0] + " " + user.date[2]);
    p.eq(1).html("1. " + user.answer1 + "<br>2. " + user.answer2 + "<br>3. " + user.answer3 + "<br>4. " + user.answer4 + "<br>5. " + user.answer5);
    p.eq(2).text(user.name);
    card.css({
      left: e.pageX + 10,
      top: e.pageY - 50
    });
    card.removeClass("invisible");
  });

  $("circle").mouseout(() => $(".card").addClass("invisible"));
}