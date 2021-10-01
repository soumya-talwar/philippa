var json;
var philippa;

var responses = {};
var list = [];
var groups = {};
var dataset = [];

var data = {
  "name": "root",
  "children": []
};

function setup() {
  noLoop();
  noCanvas();
  const id = "118EpNxeOf2Ly7ObSThWU76uCJbNlj7zfEs1Ng5sJFvI";
  fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json`)
    .then(response => response.text())
    .then(text => {
      json = JSON.parse(text.substr(47).slice(0, -2)).table.rows;
      parse();
      visual();
      build();
    });
  let links = $(".show");
  links.eq(0).click(() => $("#hidden1").toggleClass("d-none"));
  links.eq(1).click(() => {
    $("#hidden2").toggleClass("d-none");
    loop();
  });
  links.eq(2).click(() => $("#hidden3").toggleClass("d-none"));
  $(".heading").hover(function() {
    $(this).siblings("span").toggleClass("invisible");
  });
  $(".heading").mouseover(function() {
    $(this).find("circle").attr("r", "7");
  });
  $(".heading").mouseout(function() {
    $(this).find("circle").attr("r", "5");
  });
}

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

    if (!responses[name])
      responses[name] = user;
    else {
      let count = 2;
      let name2 = name;
      while (responses[name2]) {
        name2 = name + count++;
      }
      responses[name2] = user;
      responses[name2].name = name2;
    }
  }

  list = Object.keys(responses);
  for (let i = 0; i < list.length; i++) {
    let user = responses[list[i]];
    let code = user.code;
    if (!groups[code])
      groups[code] = [];
    groups[code].push(user);
  }
}

function visual() {
  let width = $(window).width();
  let height = $(window).height();
  $("#visualisation").attr({
    "width": width,
    "height": height
  });

  let arr = Object.keys(groups);
  let colors = [
    "#96BAFF",
    "#DEADFF",
    "#B4B6FF",
    "#89E1E6",
    "#FFADAD"
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
    let user = responses[$(this).find("text").text()];
    if (user) {
      let card = $(".card");
      let p = card.find("p");
      p.eq(0).text(user.date[1] + " " + user.date[0] + " " + user.date[2]);
      p.eq(1).html("1. " + user.answer1 + "<br>2. " + user.answer2 + "<br>3. " + user.answer3 + "<br>4. " + user.answer4 + "<br>5. " + user.answer5);
      p.eq(2).text(user.name);
      card.css({
        left: e.pageX + 10,
        top: e.pageY - 50
      });
      card.removeClass("invisible");
    }
  });

  $("circle").mouseout(() => $(".card").addClass("invisible"));
}

function build() {
  philippa = new Network(6, 10, 2);
  let responses2 = JSON.parse(JSON.stringify(responses));
  for (let i = 0; i < list.length; i++) {
    let name = list[i];
    ["answer1", "answer2", "answer3", "answer4", "answer5", "code", "date"].forEach(k => delete responses2[name][k]);
    for (let j = 1; j <= 5; j++) {
      if (responses2[name]["case" + j] == 5)
        responses2[name]["case" + j] = [1, 0];
      else
        responses2[name]["case" + j] = [0, 1];
    }
  }
  for (let i = 0; i < list.length; i++) {
    let name = list[i];
    let set1 = {};
    set1.inputs = [1, 1, 1, 1, 1, 1];
    set1.output = responses2[name].case1;
    dataset.push(set1);
    let set2 = {};
    set2.inputs = [1, 0, 0, 1, 1, 1];
    set2.output = responses2[name].case2;
    dataset.push(set2);
    let set3 = {};
    set3.inputs = [0, 0, 0, 1, 1, 1];
    set3.output = responses2[name].case3;
    dataset.push(set3);
    let set4 = {};
    set4.inputs = [1, 1, 0, 1, 1, 0];
    set4.output = responses2[name].case4;
    dataset.push(set4);
    let set5 = {};
    set5.inputs = [1, 1, 0, 1, 1, 1];
    set5.output = responses2[name].case5;
    dataset.push(set5);
  }
}

function draw() {
  for (let i = 0; i < dataset.length; i++) {
    let set = dataset[i];
    philippa.train(set.inputs, set.output);
  }
  let case1 = [1, 1, 1, 1, 1, 1];
  let values1 = philippa.predict(case1);
  $("#kill1-1").text(Math.floor(values1[0] * 100) + "%");
  $("#kill5-1").text(Math.floor(values1[1] * 100) + "%");

  let case2 = [1, 0, 0, 1, 1, 1];
  let values2 = philippa.predict(case2);
  $("#kill1-2").text(Math.floor(values2[0] * 100) + "%");
  $("#kill5-2").text(Math.floor(values2[1] * 100) + "%");

  let case3 = [0, 0, 0, 1, 1, 1];
  let values3 = philippa.predict(case3);
  $("#kill1-3").text(Math.floor(values3[0] * 100) + "%");
  $("#kill5-3").text(Math.floor(values3[1] * 100) + "%");

  let case4 = [1, 1, 0, 1, 1, 0];
  let values4 = philippa.predict(case4);
  $("#kill1-4").text(Math.floor(values4[0] * 100) + "%");
  $("#kill5-4").text(Math.floor(values4[1] * 100) + "%");

  let case5 = [1, 1, 0, 1, 1, 1];
  let values5 = philippa.predict(case5);
  $("#kill1-5").text(Math.floor(values5[0] * 100) + "%");
  $("#kill5-5").text(Math.floor(values5[1] * 100) + "%");
}
