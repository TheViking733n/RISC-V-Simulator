var inputString = "";
var instList = "";
var filechoosen = false;
var wrong_code = false;
var INSTRUCTION = 0;
var Data_transfer_instructions = 0;
var ALU_instructions = 0;
var Control_instructions = 0;
var Control_Hazards = 0; 
var Data_Hazards = 0;
var Branch_mispredictions = 0;
var Data_hazards_stalls = 0;
var Control_hazards_stalls = 0;
var INF = 1 << 30;
var Custom_instruction = INF;
var CYCLE = 0;
var not_update_register = 0;
// Cache stats
var icache_hit = 0;
var icache_miss = 0;
var dcache_hit = 0;
var dcache_miss = 0;
var total_memory_stall = 0;
//Cache variables
var icache_size = 16;
var icache_block = 4;
var icache_assoc = 2;
var dcache_size = 16;
var dcache_block = 4;
var dcache_assoc = 2;
var icache_type = "direct";  // "direct", "fully", "set"
var dcache_type = "direct";  // "direct", "fully", "set"
var cachePolicy = "lru";  // "lru", "fifo", "random", "lfu"
var CACHE_STALLS = 20;
var icache_rows = 10;
var dcache_rows = 10;


// Knobs
var knobs = {
  "pipeline_knob": false,
  "data_knob": false,
  "rf_knob": false,
  "pipeline_info_knob": false,
  "custom_info_knob": false,
  "text_segment_knob": false,
  "cache": false
}
var knobID = {
  "pipeline_knob": "toggle1",
  "data_knob": "toggle2",
  "rf_knob": "toggle3",
  "pipeline_info_knob": "toggle4",
  "custom_info_knob": "toggle5",
  "cache": "toggle6"
  // "text_segment_knob": "toggle6"
}

CACHE_STALLS--;

// Adding event listener to all the knobs
for (let knob in knobs) {
  try {
    let knobElement = document.getElementById(knobID[knob]);
    knobElement.addEventListener("click", function() {
      knobs[knob] = !knobs[knob];
      knobElement.checked = knobs[knob];
      console.log(knobs);
      // Adding prompt for custom_info_knob
      if (knob == "custom_info_knob" && knobs[knob]) {
        Custom_instruction = prompt("Enter instruction number for which you want to see the pipeline trace");
        if (isNaN(Custom_instruction)) {
          Custom_instruction = INF;
        }
      }
    });
  }
  catch {continue;}
}

let cache_dropdown_ids = [
  "but-icache-direct",
  "but-icache-fully",
  "but-icache-set",
  "but-policy-lru",
  "but-policy-fifo",
  "but-policy-random",
  "but-policy-lfu",
  "but-dcache-direct",
  "but-dcache-fully",
  "but-dcache-set"
]
for (let id of cache_dropdown_ids) {
  let ele = document.getElementById(id);
  ele.style.fontWeight = "bold";
  ele.style.fontSize = "1.2rem";
  let par = ele.parentElement.parentElement.firstElementChild;
  par.style.fontWeight = "bold";
  par.style.fontSize = "1.4rem";

  
  ele.addEventListener("click", function() {
    let par = ele.parentElement.parentElement;
    par.firstElementChild.textContent = ele.textContent;
    if (id.includes("icache")) {
      icache_type = id.split("-")[2];
    } else if (id.includes("dcache")) {
      dcache_type = id.split("-")[2];
    } else {
      cachePolicy = id.split("-")[2];
    }
  });
}
document.getElementById("icache_size").addEventListener("change", function() {
  icache_size = document.getElementById("icache_size").value;
});
document.getElementById("icache_block").addEventListener("change", function() {
  icache_block = document.getElementById("icache_block").value;
});
document.getElementById("icache_assoc").addEventListener("change", function() {
  icache_assoc = document.getElementById("icache_assoc").value;
});
document.getElementById("dcache_size").addEventListener("change", function() {
  dcache_size = document.getElementById("dcache_size").value;
});
document.getElementById("dcache_block").addEventListener("change", function() {
  dcache_block = document.getElementById("dcache_block").value;
});
document.getElementById("dcache_assoc").addEventListener("change", function() {
  dcache_assoc = document.getElementById("dcache_assoc").value;
});



function updateStats() {
  document.getElementById("cycle-count").innerHTML = CYCLE;
  document.getElementById("instruction-count").innerHTML = INSTRUCTION;
  document.getElementById("cpi-count").innerHTML = (CYCLE / INSTRUCTION).toPrecision(3);

  document.getElementById("stat-0").innerHTML = Data_transfer_instructions;
  document.getElementById("stat-1").innerHTML = ALU_instructions;
  document.getElementById("stat-2").innerHTML = Control_instructions;
  document.getElementById("stat-3").innerHTML = Data_Hazards;
  document.getElementById("stat-4").innerHTML = Control_Hazards;
  document.getElementById("stat-5").innerHTML = Control_Hazards;
  document.getElementById("stat-6").innerHTML = Data_hazards_stalls + Control_hazards_stalls;
  document.getElementById("stat-7").innerHTML = Data_hazards_stalls;
  document.getElementById("stat-8").innerHTML = Control_hazards_stalls;
  document.getElementById("stat-9").innerHTML = icache_hit;
  document.getElementById("stat-10").innerHTML = icache_miss;
  document.getElementById("stat-11").innerHTML = dcache_hit;
  document.getElementById("stat-12").innerHTML = dcache_miss;
  document.getElementById("stat-13").innerHTML = total_memory_stall;
}






function ensureInView(container, element) {

  //Determine container top and bottom
  let cTop = container.scrollTop + container.offsetTop;
  let cBottom = cTop + container.clientHeight;

  //Determine element top and bottom
  let eTop = element.offsetTop;
  let eBottom = eTop + element.clientHeight;

  //Check if out of view
  if (eTop < cTop) {
    container.scrollTop -= (cTop - eTop);
  }
  else if (eBottom > cBottom) {
    container.scrollTop += (eBottom - cBottom);
  }
  
}


function ensureInViewHor(container, element) {

  //Determine container Left and Rigth
  let cLeft = container.scrollLeft + container.offsetLeft;
  let cRigth = cLeft + container.clientWidth;

  //Determine element Left and Rigth
  let eLeft = element.offsetLeft;
  let eRigth = eLeft + element.clientWidth;

  //Check if out of view
  if (eLeft < cLeft) {
    container.scrollLeft -= (cLeft - eLeft);
  }
  else if (eRigth > cRigth) {
    container.scrollLeft += (eRigth - cRigth);
  }
  
}
