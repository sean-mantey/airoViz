app = new Object();
app.server = 'localhost:8080';
// app.server ='direct-electron-537.appspot.com';
app.nodes = [];
app.links = [];
Network = function(){
  // variables we want to access
  // in multiple places of Network
  var  width = app.width;
  var  height = app.height;
  //  allData will store the unfiltered data
  var allData = []
  var allRawData = [];
  var  curLinksData = [];
  var  curNodesData = [];
  var  linkedByIndex = {};
  // these will hold the svg groups fora
  // accessing the nodes and links display
  var  nodesG = null;
  // var  linksG = null;
  // these will point to the circles and lines
  // of the nodes and links
  var  node = "Power";
  // var  link = "Distance";

  var nodesMap = d3.map();
  var routersMap = d3.map();
  var clientsMap = d3.map();
  var ramp = d3.map();

  // variables to refect the current settings
  // of the visualization
  var  nodeColor = null;
  var layout = null;
  var tooltip = Tooltip("vis-tooltip", 230)



  var  force = d3.layout.force()
      .friction(.65)
      .charge([-200])
      .size([width, height]);
      force.on("tick", forceTick);
      force.on("end",function(){console.log("Over");});

  // color function used to color nodes
  var nodeColors = d3.scale.category20();

  function network(selection, data){
    setNodeColor("Power");
    setLayout("Connections");

    // format data
    allData = setupData(data)

    // create svg and groups
    vis = d3.select(selection).append("svg")
      .attr("width", width)
      .attr("height", height);

    vis.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "black");

    linksG = vis.append("g").attr("id", "links");
    nodesG = vis.append("g").attr("id", "nodes");

    force.size([width, height]);

    // perform rendering and start force layout
    update();
  }

  function update(){
    //  filter data to show based on current filter settings.
    curNodesData = allData.nodes;
    // curLinksData = allData.links;

    // reset nodes
    force.nodes(curNodesData)

    // enter / exit for nodes
    updateNodes();

    if(layout == "Distance"){
      force
        .friction(.65)
        .charge([-200])
        .size([width, height]);
    }
    else if (layout == "Connections"){
      force
        .friction(.9)
        .charge([-250])
        .size([width, height]);
    }

    force.start();
  }

  function updateNodes(){
    node = nodesG.selectAll(".node")
      .data(curNodesData, function(d) { return d.name ;});

    node
      .attr("attr","update")
      .attr("xlink:href", function(d,i){return "../badgeIcons/"+i%19+".png"}  )
      .attr("height",  function(d){return d.size ;});

    node.enter().append("image")
      .attr("class", "node")
      // .attr("xlink:href", "../badgeIcons/2.png  ")
      .attr("xlink:href", function(d,i){return "../badgeIcons/"+i%19+".png"}  )
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", function(d){ console.log(d.size); return d.size;})
      .attr("height",  function(d){return d.size;})
      .call(force.drag);

    node.on("click", showDetails);

    node.exit().remove();
  }

  // Toggle children on click.
  // function click(d) {
  //   if (d3.event.defaultPrevented) return; // ignore drag
  //   // if (d.children) {
  //   //   d._children = d.children;
  //   //   d.children = null;
  //   // } else {
  //   //   d.children = d._children;
  //   //   d._children = null;
  //   // }
  //   showDetails();
  // }

  setNodeColor = function(newColor){
    nodeColor = newColor;
  }

  setLayout = function(newLayout){
    layout = newLayout;
  }

  network.toggleNodeColor = function(newColor){
    // # public function
    force.stop()
    setNodeColor(newColor);
    allData = setupData(allRawData);
    update();
  }

  network.toggleLayout = function(newLayout){
    force.stop()
    setLayout(newLayout);
    allData = setupData(allRawData);
    update();
  }

  network.updateData = function(newData){
      allRawData = newData;
      allData = setupData(newData);
      update()
  }

  // tick function for force directed layout
  function forceTick(e){
    // node
      // .attr("cx", function(d){ return d.x;})
      // .attr("cy", function(d){ return d.y;});

  node
    .attr("x", function(d){ return d.x;})
    .attr("y", function(d){ return d.y;});
    // link
    //   .attr("x1", function(d){ return d.source.x;})
    //   .attr("y1", function(d){ return d.source.y;})
    //   .attr("x2", function(d){ return d.target.x;})
    //   .attr("y2", function(d){ return d.target.y;});
  }

  // called once to clean up raw data and switch links to
  // point to node instances
  // Returns modified data
  setupData = function(_data){

    data = new Object();
    data.links = new Array();
    data.nodes = new Array();

    data.nodes.push({'name' : "Listener", 'power': -10, 'kind': "Listener"});
    for (var i = 0; i < _data.length; i++) {

      var node = JSON.parse(_data[i]);
      var n = {'name' : $.trim(node.BSSID), 'power': node.power, 'kind': node.kind};

      if(n.kind == "Client"){
        n.essid = node.AP;
        n.probedESSID = node.probedESSID;

        if(layout=="Distance"){
            var l = {'source' : data.nodes[0].name, 'target': $.trim(node.BSSID), 'power':node.power};
            data.links.push(l);
        }
        else if(layout = "Connections"){

          var AP = n.essid.split("|");
          var networkName = $.trim(AP[0]);

          if(networkName === "(not associated)" || networkName === ""){
            // console.log(networkName);
          }
          else{

            // console.log(networkName);
            // networkName ="AP: "+ nodesMap.get($.trim(AP[0])).essid
            var l = {'source' : networkName, 'target': $.trim(node.BSSID), 'power':node.power};
            data.links.push(l);

          }
        }
        data.nodes.push(n);
      }
      // else{
      //
      //   if(layout=="Distance"){
      //       var l = {'source' : data.nodes[0].name, 'target': $.trim(node.BSSID), 'power':node.power};
      //       data.links.push(l);
      //   }
      //   n.essid =  node.ESSID;
      // }
      //clients only!!!

    }
    return refreshD3Data(data);
  }

  refreshD3Data = function(data){

    // countExtent = d3.extent(data.nodes, function(d){ d.probedESSID.length;});
    countExtent = d3.extent(data.nodes, function(d){
        if(d.kind == "Client" && d.probedESSID.length >0){
            return d.probedESSID.length;
        }
        else{
          return 1;
        }
    });

    range = [32,64,128,320]
    data.nodes.forEach( function(n){
      // set initial x/y to values within the width/height
      // of the visualization
      if(nodesMap.has(n.name)){
          _n = nodesMap.get(n.name);
          n.x = _n.x;
          n.y = _n.y;
          n.px = _n.px;
          n.py = _n.py;
      }
      else{
        n.x = randomnumber=Math.floor(Math.random()*width);
        n.y = randomnumber=Math.floor(Math.random()*height);
      }

      if(n.kind == "Client" && n.probedESSID.length >0){
        scale = d3.scale.linear().rangeRound([32,128]).domain(countExtent);//(range,n.probedESSID.length);
        n.size = scale(n.probedESSID.length);
      }
      else{
        n.size = 32;
      }
    });

    // id's -> node objects
    mapNodes(data.nodes);

    return data;

  }

  // Helper function to map node id's to node objects.
  // Returns d3.map of ids -> nodes
  mapNodes = function(nodes){
    nodesMap = d3.map();
    nodes.forEach (function(n,i){

      if(typeof(nodesMap.get(n.name)) !=="undefined"){
      }
      else{
        nodesMap.set(n.name, n);
      }

    });
    return nodesMap;
  }

  showDetails = function (d,i){

    content = '<img src =../badgeIcons/'+i%19+'.png width =160 height = 160 style = "position: relative; left: 70;"></img>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="main">' + d.kind.toUpperCase() + " : "+ d.name + '</span></p>';
    content += '<hr class="tooltip-hr">';
    if(d.kind == "Client"){

      var AP = d.essid.split("|");
      //contains
      var networkName = $.trim(AP[0]);
      if(networkName === "(not associated)"){
        networkName =  "Currently Connected To: "+"unassociated";
      }
      else{

        // console.log(ty(nodesMap.get($.trim(AP[0])).essid));
        if(typeof(nodesMap.get($.trim(AP[0]))) !=="undefined"){
          networkName ="Currently Connected To: "+ nodesMap.get($.trim(AP[0])).essid;
        }
        else{
          networkName ="Currently Connected To: "+ "Uncertain";
        }
        // if(nodesMap.get($.trim(AP[0])).essid== "Happy House"){console.log(d);}
      }
      content += '<p class="main">' + networkName    + '</span></p>';
      content += '<hr class="tooltip-hr">';
      content += '<p class="main">' +"RSSI: " + d.power  + '</span></p>';

      if(d.probedESSID.length > 0){
        content += '<hr class="tooltip-hr">';
        content += '<p class="main">' + "PROBED NETWORKS:"  + '</span></p>';
        d.probedESSID.forEach(function(n){

          content += '<p class="main">' + n  + '</span></p>';
        });
      }
    }
    else{
      content += '<p class="main">' + "NAME:" + d.essid  + '</span></p>';
      content += '<hr class="tooltip-hr">';
      content += '<p class="main">' +"RSSI: " + d.power  + '</span></p>';
    }

    content += "<a class=\"main\" id=\"closebtn\" class=\"close\">HIDE</a>";

    tooltip.showTooltip(content,d3.event);



  }
  network.attachButtonListener = function(){
    console.log("closing side page");
    tooltip.closeSidepage();
  }


  hideDetails = function(d,i){
    tooltip.hideTooltip();
  }



    return network
  }
