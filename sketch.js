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
let colors = [
  "#96BAFF",
  "#DEADFF",
  "#89E1E6",
  "#B4B6FF",
  "#BDD0DB"
];

var run = false;

function setup() {
  const id = "118EpNxeOf2Ly7ObSThWU76uCJbNlj7zfEs1Ng5sJFvI";
  fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json`)
    .then(response => response.text())
    .then(text => {
      json = JSON.parse(text.substr(47).slice(0, -2)).table.rows;
      parse();
      visual();
      build();
    });
  $(".main").eq(0).animate({
    opacity: 1
  }, 1000);
  $(".circle").eq(0).css({
    left: $(".next").eq(0).offset().left - 30,
    background: colors[1]
  });
  $(".next").each((index, link) => {
    $(link).hover(() => {
      $(".circle").eq(index).animate({
        width: $(link).width() + 40
      }, 300);
    }, () => {
      $(".circle").eq(index).animate({
        width: 16
      }, 300);
    });
    $(link).click(() => {
      let page = $(".main");
      page.eq(index).addClass("d-none");
      page.eq(index).css({
        opacity: 0
      });
      if (index == 4)
        index = -1;
      page.eq(index + 1).removeClass("d-none");
      window.scrollTo(0, 0);
      $(".circle").eq(index + 1).css({
        left: $(".next").eq(index + 1).offset().left - 30,
        background: colors[index + 2] || colors[0]
      });
      page.eq(index + 1).animate({
        opacity: 1
      }, 1000);
    });
  });
  $(".prev").each((index, link) => {
    $(link).click(() => {
      let page = $(".main");
      page.eq(index + 1).addClass("d-none");
      page.eq(index + 1).css({
        opacity: 0
      });
      page.eq(index).removeClass("d-none");
      window.scrollTo(0, 0);
      $(".circle").eq(index).css({
        left: $(".next").eq(index).offset().left - 30,
        background: colors[index + 1]
      });
      page.eq(index).animate({
        opacity: 1
      }, 1000);
    });
  });
}

function parse() {
  for (let row of json) {
    let name = row.c[1].v.trim().toLowerCase();
    let space = name.indexOf(' ');
    if (space != -1)
      name = name.substring(0, space);
    name = name.charAt(0).toUpperCase() + name.slice(1);
    let time = row.c[0].f;
    time = time.substring(0, time.indexOf(' '));
    let date = time.split("/");
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    date[0] = months[Number(date[0]) - 1];
    let user = {};
    user.date = date;
    user.name = name;
    user.answer1 = row.c[2].v;
    user.case1 = (/steer/i).test(user.answer1) ? 5 : 1;
    user.answer2 = row.c[3].v;
    user.case2 = (/organs/i).test(user.answer2) ? 5 : 1;
    user.answer3 = row.c[4].v;
    user.case3 = (/execute/i).test(user.answer3) ? 5 : 1;
    user.answer4 = row.c[5].v;
    user.case4 = (/initial/i).test(user.answer4) ? 1 : 5;
    user.answer5 = row.c[6].v;
    user.case5 = (/manufacture/i).test(user.answer5) ? 5 : 1;
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
  for (let name of list) {
    let user = responses[name];
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
    .force("link", d3.forceLink(links).id(d => d.name).distance(10).strength(1))
    .force("charge", d3.forceManyBody().strength(-90))
    .force("center", d3.forceCenter(width / 4, height / 2));

  const link = svg.append("g")
    .attr("stroke", "#E7E7E7")
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
    .attr("r", d => d.data.name == "root" ? 0 : 3.7)
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

  $("circle").hover(function(e) {
    let user = responses[$(this).find("text").text()];
    if (user) {
      let card = $(".card");
      let p = card.find("p");
      p.eq(0).text(user.date[1] + " " + user.date[0] + " " + user.date[2]);
      p.eq(1).html("1. " + user.answer1 + "<br>2. " + user.answer2 + "<br>3. " + user.answer3 + "<br>4. " + user.answer4 + "<br>5. " + user.answer5);
      p.eq(2).text(user.name);
      card.css({
        left: e.pageX + 20,
        top: e.pageY - 50
      });
      card.removeClass("invisible");
    }
  }, () => $(".card").addClass("invisible"));
}

function build() {
  philippa = new Network(6, 10, 2);
  let responses2 = JSON.parse(JSON.stringify(responses));
  for (let name of list) {
    ["case1", "case2", "case3", "case4", "case5"].forEach(prop => responses2[name][prop] = responses2[name][prop] == 5 ? [1, 0] : [0, 1]);
  }
  for (let name of list) {
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
  run = true;
}

function draw() {
  if (run) {
    for (let set of dataset) {
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
}