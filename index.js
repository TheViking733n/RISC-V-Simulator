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

// var PREV_PC = -1;
function displayDecodedInstructionAndHazard(pc, ins_to_print, hazard) {
  // "data" -> data hazard; "control" -> Control hazard; otherwise no hazard
  // document.getElementById("instruction-rowd-" + this.pc[1]).innerText =  ins_to_print;

  let row = document.querySelector("#instruction-rowd-" + pc);

  // Bringing row element in view

  ensureInView(document.getElementsByClassName("instructions")[0], row);

  row.innerText = ins_to_print;
  let hazardClass = "no-hazard";
  // row.parentElement.style.backgroundColor = "white";
  if (row.parentElement.classList.contains(hazardClass)) {
    row.parentElement.classList.remove(hazardClass);
  }
  if (row.parentElement.classList.contains("control-hazard")) {
    row.parentElement.classList.remove("control-hazard");
  }
  if (row.parentElement.classList.contains("data-hazard")) {
    row.parentElement.classList.remove("data-hazard");
  }
  if (hazard == "control" || hazard == "data") {
    hazardClass = hazard + "-hazard";
  }

  void row.parentElement.offsetWidth;

  row.parentElement.classList.add(hazardClass);
  
  // row.parentElement.style.animationPlayState = "revert";

  // // Removing loop animation from previous row
  // if (PREV_PC != -1) {
  //   let prevRow = document.querySelector("#instruction-rowd-" + PREV_PC);
  //   prevRow.parentElement.style.animationPlayState = "paused";
  //   prevRow.parentElement.style.backgroundColor = "white";
  // }
  // PREV_PC = pc;
}



// File Chooser: stores contents of file in a a global variable inputString

function inputStringParser() {
  let parsedString = "";
  let lines = inputString.split("\n");
  let lineNo = 0;
  for (let i = 0; i < lines.length; i++) {
    let words = lines[i].replace("0x").split(" ");
    if (words.length > 1) {
      parsedString += `${words[0]} ${words[1]}\n`;
    } else if (words.length == 1) {
      let lineNoHex = lineNo.toString(16);
      parsedString += `${lineNoHex} ${words[0]}\n`;
      lineNo += 4;
    }
  }
  inputString = parsedString.trim();

  instList = inputString.split("\n");
  instList.pop();
  // console.log(instList);
  // console.log(instList.length);
}

function decode2(a) {
  a = a.toUpperCase();
  function toint(a) {
    let l = a.length;
    let ans = 0;
    let m = 1;
    for (let i = l - 1; i >= 0; i--) {
      if (a[i] == "1") {
        ans = ans + m;
      }
      m = m * 2;
    }

    return ans;
  }
  function negative(a) {
    let m = 1;
    let ans = 0;
    for (let i = a.length - 1; i > 0; i--) {
      if (a[i] == "1") {
        ans += m;
      }
      m *= 2;
    }
    ans -= m;
    return ans;
  }
  function tobin(a) {
    let s = "";
    if (a == "0") {
      a = 0;
    }
    if (a == "1") {
      a = 1;
    }
    if (a == "2") {
      a = 2;
    }
    if (a == "3") {
      a = 3;
    }
    if (a == "4") {
      a = 4;
    }
    if (a == "5") {
      a = 5;
    }
    if (a == "6") {
      a = 6;
    }
    if (a == "7") {
      a = 7;
    }
    if (a == "8") {
      a = 8;
    }
    if (a == "9") {
      a = 9;
    }
    if (a == "A") {
      a = 10;
    }
    if (a == "B") {
      a = 11;
    }
    if (a == "C") {
      a = 12;
    }
    if (a == "D") {
      a = 13;
    }
    if (a == "E") {
      a = 14;
    }
    if (a == "F") {
      a = 15;
    }

    for (let i = 0; i < 4; i++) {
      let x = a % 2;
      // x.toString();
      s = s + x;
      a = Math.floor(a / 2);
    }
    // reverse(s);
    let s2 = "";
    let l = s.length;
    for (let i = 0; i < l; i++) {
      s2 = s[i] + s2;
    }
    return s2;
  }
  let s = "";
  let l = a.length;
  for (let i = 0; i < l; i++) {
    let s1 = tobin(a[i]);
    s = s + s1;
  }
  let opcode = "";
  for (let i = 25; i < 32; i++) {
    opcode = opcode + s[i];
  }

  if (opcode == "0110011") {
    let ret = { op: "", rd: 0, rs1: 0, rs2: 0, imm: 0 };
    let r = "";
    for (let i = 20; i < 25; i++) {
      r = r + s[i];
    }
    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let r1 = "";
    for (let i = 12; i < 17; i++) {
      r1 = r1 + s[i];
    }
    let r2 = "";
    for (let i = 7; i < 12; i++) {
      r2 = r2 + s[i];
    }

    let fun7 = "";
    for (let i = 0; i < 7; i++) {
      fun7 = fun7 + s[i];
    }
    ret.rs1 = toint(r1);
    ret.rs2 = toint(r2);
    ret.rd = toint(r);
    if (fun3 == "000" && fun7 == "0000000") {
      ret.op = "add";
    } else if (fun3 == "000" && fun7 == "0100000") {
      ret.op = "sub";
    } else if (fun3 == "100" && fun7 == "0000000") {
      ret.op = "xor";
    } else if (fun3 == "110" && fun7 == "0000000") {
      ret.op = "or";
    } else if (fun3 == "111" && fun7 == "0000000") {
      ret.op = "and";
    } else if (fun3 == "001" && fun7 == "0000000") {
      ret.op = "sll";
    } else if (fun3 == "101" && fun7 == "0000000") {
      ret.op = "srl";
    } else if (fun3 == "101" && fun7 == "0100000") {
      ret.op = "sra";
    } else if (fun3 == "010" && fun7 == "0000000") {
      ret.op = "slt";
    } else if (fun3 == "011" && fun7 == "0000000") {
      ret.op = "sltu";
    }

    return ret;
  } else if (opcode == "0010011") {
    let ret = { op: 0, rd: 0, rs1: 0, imm: 0, rs2: 0 };
    let r = "";
    for (let i = 20; i < 25; i++) {
      r = r + s[i];
    }
    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let r1 = "";
    for (let i = 12; i < 17; i++) {
      r1 = r1 + s[i];
    }

    let imm = "";
    for (let i = 0; i < 12; i++) {
      imm = imm + s[i];
    }

    let fun7 = "";
    for (let i = 0; i < 7; i++) {
      fun7 += imm[i];
    }

    ret.rs1 = toint(r1);
    ret.rd = toint(r);
    if (imm[0] == 1) {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }

    if (fun3 == "000") {
      ret.op = "add";
    } else if (fun3 == "100") {
      ret.op = "xor";
    } else if (fun3 == "110") {
      ret.op = "or";
    } else if (fun3 == "111") {
      ret.op = "and";
    } else if (fun3 == "001" && fun7 == "0000000") {
      ret.op = "sll";
    } else if (fun3 == "101" && fun7 == "0000000") {
      ret.op = "srl";
    } else if (fun3 == "101" && fun7 == "0100000") {
      ret.op = "sra";
    } else if (fun3 == "010") {
      ret.op = "slt";
    } else if (fun3 == "011") {
      ret.op = "sltu";
    }
    ret.op = ret.op + "i";

    return ret;
  } else if (opcode == "0000011") {
    let ret = { op: "", rd: 0, rs1: 0, imm: 0, rs2: 0 };
    let r = "";
    for (let i = 20; i < 25; i++) {
      r = r + s[i];
    }
    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let r1 = "";
    for (let i = 12; i < 17; i++) {
      r1 = r1 + s[i];
    }

    let imm = "";
    for (let i = 0; i < 12; i++) {
      imm = imm + s[i];
    }

    ret.rs1 = toint(r1);
    ret.rd = toint(r);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }

    if (fun3 == "000") {
      ret.op = "lb";
    } else if (fun3 == "001") {
      ret.op = "lh";
    } else if (fun3 == "010") {
      ret.op = "lw";
    } else if (fun3 == "100") {
      ret.op = "lbu";
    } else if (fun3 == "101") {
      ret.op = "lhu";
    }
    return ret;
  } else if (opcode == "0100011") {
    let ret = { op: "", rs1: 0, rs2: 0, imm: 0, rd: 0 };
    let imm = "";
    for (let i = 0; i < 7; i++) {
      imm = imm + s[i];
    }
    for (let i = 20; i < 25; i++) {
      imm = imm + s[i];
    }
    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let rs1 = "";
    for (let i = 12; i < 17; i++) {
      rs1 = rs1 + s[i];
    }

    let rs2 = "";
    for (let i = 7; i < 12; i++) {
      rs2 = rs2 + s[i];
    }

    ret.rs1 = toint(rs1);
    ret.rs2 = toint(rs2);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }

    if (fun3 == "000") {
      ret.op = "sb";
    } else if (fun3 == "001") {
      ret.op = "sh";
    } else if (fun3 == "010") {
      ret.op = "sw";
    }

    return ret;
  } else if (opcode == "1100011") {
    let ret = { op: "", rs1: 0, rs2: 0, imm: 0, rd: 0 };
    let imm = "";
    imm = imm + s[0];
    imm = imm + s[24];

    for (let i = 1; i < 7; i++) {
      imm = imm + s[i];
    }
    for (let i = 20; i < 24; i++) {
      imm = imm + s[i];
    }

    imm += "0";

    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let rs1 = "";
    for (let i = 12; i < 17; i++) {
      rs1 = rs1 + s[i];
    }

    let rs2 = "";
    for (let i = 7; i < 12; i++) {
      rs2 = rs2 + s[i];
    }

    ret.rs1 = toint(rs1);
    ret.rs2 = toint(rs2);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }

    if (fun3 == "000") {
      ret.op = "beq";
    } else if (fun3 == "001") {
      ret.op = "bne";
    } else if (fun3 == "100") {
      ret.op = "blt";
    } else if (fun3 == "101") {
      ret.op = "bge";
    } else if (fun3 == "110") {
      ret.op = "bltu";
    } else if (fun3 == "111") {
      ret.op = "bgeu";
    }

    return ret;
  } else if (opcode == "0110111" || opcode == "0010111") {
    let ret = { op: 0, rd: 0, imm: 0, rs1: 0, rs2: 0 };
    let rd = "";
    for (let i = 20; i < 25; i++) {
      rd = rd + s[i];
    }

    let imm = "";
    for (let i = 0; i < 20; i++) {
      imm = imm + s[i];
    }

    ret.rd = toint(rd);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }

    if (opcode == "0010111") {
      ret.op = "auipc";
    } else {
      ret.op = "lui";
    }

    return ret;
  } else if (opcode == "1101111") {
    let ret = { op: "", rd: 0, imm: 0, rs1: 0, rs2: 0 };
    let rd = "";
    for (let i = 20; i < 25; i++) {
      rd = rd + s[i];
    }

    let imm = "";
    imm = imm + s[0];
    for (let i = 12; i < 20; i++) {
      imm = imm + s[i];
    }
    imm = imm + s[11];
    for (let i = 1; i < 11; i++) {
      imm = imm + s[i];
    }
    imm += "0";

    ret.rd = toint(rd);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }
    ret.op = "jal";

    return ret;
  } else if (opcode == "1100111") {
    let ret = { op: "", rd: 0, rs1: 0, imm: 0, rd: 0 };
    let r = "";
    for (let i = 20; i < 25; i++) {
      r = r + s[i];
    }

    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let r1 = "";
    for (let i = 12; i < 17; i++) {
      r1 = r1 + s[i];
    }

    let imm = "";
    for (let i = 0; i < 12; i++) {
      imm = imm + s[i];
    }

    let fun7 = "";
    for (let i = 0; i < 7; i++) {
      fun7 += imm[i];
    }

    ret.rs1 = toint(r1);
    ret.rd = toint(r);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }

    if (fun3 == "000") {
      ret.op = "jalr";
    }

    return ret;
  } else if (opcode == "1110011") {
    let ret = { op: "", rd: 0, rs1: 0, imm: 0, rs2: 0 };
    let r = "";
    for (let i = 20; i < 25; i++) {
      r = r + s[i];
    }

    let fun3 = "";

    for (let i = 17; i < 20; i++) {
      fun3 = fun3 + s[i];
    }

    let r1 = "";
    for (let i = 12; i < 17; i++) {
      r1 = r1 + s[i];
    }

    let imm = "";
    for (let i = 0; i < 12; i++) {
      imm = imm + s[i];
    }

    let fun7 = "";
    for (let i = 0; i < 7; i++) {
      fun7 += imm[i];
    }

    ret.rs1 = toint(r1);
    ret.rd = toint(r);
    if (imm[0] == "1") {
      ret.imm = negative(imm);
    } else {
      ret.imm = toint(imm);
    }
    imm = toint(imm);
    if ((fun3 = "000")) {
      if (imm == 0) {
        ret.op = "ecall";
      } else if (imm == 1) {
        ret.op = "ebreak";
      }
    }

    return ret;
  } else {
    let ret = { op: "error", rs1: 0, rs2: 0, rd: 0, imm: 0 };
    return ret;
  }
}
function print_ins(obj) {
  let op = obj.op;
  if (
    op == "add" ||
    op == "sub" ||
    op == "xor" ||
    op == "or" ||
    op == "and" ||
    op == "sll" ||
    op == "srl" ||
    op == "sra" ||
    op == "slt" ||
    op == "sltu"
  ) {
    let s =
      obj.op + " " + "x" + obj.rd + " " + "x" + obj.rs1 + " " + "x" + obj.rs2;
    return s;
  }
  if (
    op == "addi" ||
    op == "xori" ||
    op == "ori" ||
    op == "andi" ||
    op == "slli" ||
    op == "srli" ||
    op == "srai" ||
    op == "slti" ||
    op == "sltiu"
  ) {
    let s = obj.op + " " + "x" + obj.rd + " " + "x" + obj.rs1 + " " + obj.imm;
    return s;
  }
  if (op == "lb" || op == "lh" || op == "lw" || op == "lbu" || op == "lhu") {
    let s = obj.op + " " + "x" + obj.rd + " " + obj.imm + "(x" + obj.rs1 + ")";
    return s;
  }
  if (op == "sb" || op == "sh" || op == "sw") {
    let s = obj.op + " " + "x" + obj.rs2 + " " + obj.imm + "(x" + obj.rs1 + ")";
    return s;
  }
  if (
    op == "beq" ||
    op == "bne" ||
    op == "blt" ||
    op == "bge" ||
    op == "bltu" ||
    op == "bgeu"
  ) {
    let s = obj.op + " " + "x" + obj.rs1 + " " + "x" + obj.rs2 + " " + obj.imm;
    return s;
  }

  if (op == "jal" || op == "jalr") {
    let s = obj.op + " x" + obj.rd + " " + obj.imm;
    return s;
  }
  if (op == "lui" || op == "auipc") {
    let s = obj.op + " x" + obj.rd + " " + obj.imm;
    return s;
  }
  if (op == "ecall" || op == "ebreak") {
    let s = op;
    return s;
  }
}

function cycles(op) {
  let operations = new Array(5);
  operations.fill(1);
  operations[3] = 0;
  if (
    op === "lw" ||
    op === "lh" ||
    op === "lb" ||
    op === "lhu" ||
    op === "lbu" ||
    op === "sh" ||
    op === "sw" ||
    op === "sb"
  )
    operations[3] = 1;
  if (op === "sb" || op === "sw" || op === "sh" || op[0] === "b")
    operations[4] = 0;
  return operations;
}

function RFSync(rf, format) {
  if(INSTRUCTION > Custom_instruction) not_update_register = 1;
  if(not_update_register == 1) return;
  if(knobs.rf_knob == false) return;
  switch (format) {
    case "hex":
      document.querySelector(".dropbtn").textContent = "Hexadecimal";
      break;
    case "dec":
      document.querySelector(".dropbtn").textContent = "Decimal";
      break;
    case "udec":
      document.querySelector(".dropbtn").textContent = "Unsigned Decimal";
  }

  let registerFile = document.querySelectorAll(".register-value");
  for (let i = 1; i < registerFile.length; i++) {
    let value = rf[i - 1];
    value = value < 0 ? value + (0xffffffff + 1) : value;
    // console.log(value); 
    if (format === "hex") value = value.toString(16);
    else if (format === "dec") value &= 0xffffffff;
    registerFile[i].textContent = `${format === "hex" ? "0x" : ""}${value}`;
  }
}

function timelineAppendRow(cycle, row) {
  // cycle is value of current cycle number
  // row is an array of size 5 containing 5 numbers which represent the instruction number being executed
  // row value 0 means stall
  cycleDiv = document.createElement("div");
  cycleDiv.className = "timeline-cell";
  cycleDiv.innerHTML = cycle;
  document.getElementById("cycle").appendChild(cycleDiv);
  let timelineHeaderId = [
    "fetch",
    "decode",
    "execute",
    "memoryaccess",
    "writeback",
  ];
  for (let i = 0; i < row.length; i++) {
    let timelineCellDiv = document.createElement("div");
    timelineCellDiv.className = "timeline-cell";
    if (row[i] != 0) {
      timelineCellDiv.innerHTML = row[i];
    } else {
      let stallDiv = document.createElement("div");
      stallDiv.className = "stall";
      timelineCellDiv.appendChild(stallDiv);
    }
    let container = document.getElementById(timelineHeaderId[i]);
    container.appendChild(timelineCellDiv);
    // Bringing this cellDiv parent to view
    ensureInViewHor(container.parentElement, timelineCellDiv);
  }
}
// for (let i = 1; i < 3; i++) {
//     timelineAppendRow(i, [i, i, (i%7!=0)+i, (i%7==0)+i, i&1]);
// }
function register_update(register_file) {
  let type = document.getElementsByClassName("dropbtn")[0].innerText;
  for (let i = 1; i < 32; i++) {
    if (type == "Hexadecimal") {
      document.getElementById("register-x" + i).innerText =
        "0x" + register_file[i].toString(16);
    } else if (type == "Decimal") {
      document.getElementById("register-x" + i).innerText = register_file[i];
    } else if (type == "Unsigned") {
      if (register_file[i] < 0) register_file[i] = register_file[i];
      document.getElementById("register-x" + i).innerText = register_file[i];
    }
  }
}
// var cnt = 1;
// var intervalId = setInterval(() => {
//   let i = cnt;

//   timelineAppendRow(i, [i, i, (i%7!=0)+i, (i%7==0)+i, i&1]);
//   cnt++;
//   if (cnt == 1) {  // rows to generate
//     clearInterval(intervalId);
//   }
// }, 0);  // time in milisec

class Simulator {
  constructor() {
    this.DONE = 0;
    this.CYCLE = 0; // Cycle number
    this.PC = 0; // Program counter
    this.INSTRUCTION = ""; // Stores current instruction from Fetch
    this.RF = new Array(32); // Register file
    this.RF.fill(0);
    this.OP = ""; // Stores operator decoded from Decode
    this.RS1 = 0; // 0 to 31 for each register
    this.RS2 = 0; // 0 to 31 for each register
    this.RD = 0; // 0 to 31 for each register
    this.IMM = 0; // Stores immediate value
    this.ALURESULT = 0; // Stores result of ALU or Memory value
    this.MEMORY = {};
    this.RF[2] = 2147483632;
    this.pc = new Array(5);
    this.pc.fill(-1);
    // Now creating Instruction div elements
    for (let i = 0; i < instList.length; i++) {
      // console.log(i);
      let pc_inst = instList[i].split(" ")[0].replace("0x", "");
      let a_inst = instList[i].split(" ")[1].replace("0x", "");
      let instructionDiv = document.createElement("div");
      instructionDiv.className = "instruction-row";
      instructionDiv.innerHTML = `<div class="instruction-addr">0x${pc_inst}</div>
            <div class="instruction-hex">0x${a_inst}</div>
            <div class="instruction-decoded" id="instruction-rowd-${i}">---</div>`;
      document
        .getElementsByClassName("instructions")[0]
        .appendChild(instructionDiv);
    }

    // Now creating Timeline div elements

    // Now creating register div elements
    document
      .getElementById("register")
      .getElementsByClassName("register-container")[0].innerHTML = "";
    for (let i = 0; i < 32; i++) {
      let registerDiv = document.createElement("div");
      registerDiv.className = "register-row";
      registerDiv.innerHTML = `<div class="register-name">x${i}</div>
          <div class="register-value" id="register-x${i}">${this.RF[i]}</div>`;
      document
        .getElementById("register")
        .getElementsByClassName("register-container")[0]
        .appendChild(registerDiv);
    }

    // Now creating memory div elements
    document
      .getElementById("memory")
      .getElementsByClassName("memory-container")[0].innerHTML = "";
    for (let i = 0; i < 10; i++) {
      let memoryDiv = document.createElement("div");
      memoryDiv.className = "memory-row";
      memoryDiv.id = `memory-row-${i}`;
      memoryDiv.innerHTML = `<div class="memory-address"></div>
          <div class="memory-value">
              <div class="memory-cell"></div>
              <div class="memory-cell"></div>
              <div class="memory-cell"></div>
              <div class="memory-cell"></div>
          </div>`;
      document
        .getElementById("memory")
        .getElementsByClassName("memory-container")[0]
        .appendChild(memoryDiv);
    }

    document.querySelector("#but-hex").addEventListener("click", function () {
      RFSync(simulator.RF, "hex");
      memSync(simulator.MEMORY, "hex");
    });
    document.querySelector("#but-dec").addEventListener("click", function () {
      RFSync(simulator.RF, "dec");
      memSync(simulator.MEMORY, "dec");
    });
    document.querySelector("#but-udec").addEventListener("click", function () {
      RFSync(simulator.RF, "udec");
      memSync(simulator.MEMORY, "udec");
    });
  }


  step() {
    this.fetch();
    if (this.DONE) return;
    this.decode();
    let oper = new Array(5);
    if (this.OP == "error") {
      alert("!Wrong code.");
      wrong_code = true;
      location.reload();
    }
    oper = cycles(this.OP);
    let obj2 = decode2(this.INSTRUCTION);
    let ins_to_print = print_ins(obj2);
    // document.getElementById("instruction-rowd-" + this.PC).innerText =  ins_to_print;
    displayDecodedInstructionAndHazard(this.PC, ins_to_print, "ok")
    // Keywords to pass for different types of hazards
    // "data" -> data hazard; "control" -> Control hazard; otherwise no hazard

    for (let i = 0; i < oper.length; i++) oper[i] *= this.PC + 1;
    timelineAppendRow(this.CYCLE + 1, oper);
    INSTRUCTION++;    
    this.execute();
    // console.log("Hi\n");
    if (oper[3] != 0) { this.memoryAccess();}
    if (oper[4] != 0) {this.writeBack();}
    let type = document.getElementsByClassName("dropbtn")[0].innerText;
    // console.log(type);
    let numberFormat = "hex";
    if (type === "Unsigned Decimal") numberFormat = "udec";
    if (type === "Decimal") numberFormat = "dec";
    RFSync(this.RF, numberFormat);
    this.CYCLE += 1;
    // document.querySelector(".cycle-count").innerHTML = this.CYCLE;
    CYCLE = this.CYCLE;
    updateStats();
    if (this.CYCLE > 10000) {
      wrong_code = true;
      alert("Infinite loop");
      location.reload();
    }
  }





  fetch() {
    if (this.PC >= instList.length) {
      this.DONE = 1;
    }
    if (!this.DONE) {
      this.INSTRUCTION = instList[this.PC].split(" ")[1];
    }
  }
  decode() {
    let obj = decode2(this.INSTRUCTION);
    // console.log(obj);
    this.IMM = obj.imm;
    this.OP = obj.op;
    this.RS1 = obj.rs1;
    this.RS2 = obj.rs2;
    this.RD = obj.rd;
  }
    execute() {
    let rs1 = Math.round(this.RF[Math.round(this.RS1)]);
    let rs2 = Math.round(this.RF[Math.round(this.RS2)]);
    let imm = Math.round(this.IMM);
    switch (this.OP) {
      case "add":
        ALU_instructions++;
        this.ALURESULT = rs1 + rs2;
        break;
      case "sub":
        ALU_instructions++;
        this.ALURESULT = rs1 - rs2;
        break;
      case "xor":
        ALU_instructions++;
        this.ALURESULT = rs1 ^ rs2;
        break;
      case "or":
        ALU_instructions++;
        this.ALURESULT = rs1 | rs2;
        break;
      case "and":
        ALU_instructions++;
        this.ALURESULT = rs1 & rs2;
        break;
      case "sll":
        ALU_instructions++;
        this.ALURESULT = rs1 << rs2;
        break;
      case "srl":
        ALU_instructions++;
        this.ALURESULT = rs1 >>> rs2;
        break;
      case "sra":
        ALU_instructions++;
        this.ALURESULT = rs1 >> rs2;
        break;
      case "slt":
        ALU_instructions++;
        this.ALURESULT = rs1 < rs2 ? 1 : 0;
        break;
      case "sltu":
        ALU_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        rs2 = rs2 < 0 ? 0xffffffff - 1 - rs2 : rs2;
        if (rs1 < rs2) this.ALURESULT = 1;
        else this.ALURESULT = 0;
        break;
      case "addi":
        ALU_instructions++;
        this.ALURESULT = rs1 + imm;
        break;
      case "xori":
        this.ALURESULT = rs1 ^ imm;
        break;
      case "ori":
        ALU_instructions++;
        this.ALURESULT = rs1 | imm;
        break;
      case "andi":
        ALU_instructions++;
        this.ALURESULT = rs1 & imm;
        break;
      case "slli":
        ALU_instructions++;
        this.ALURESULT = rs1 << imm;
        break;
      case "srli":
        ALU_instructions++;
        this.ALURESULT = rs1 >> imm;
        break;
      case "srai":
        ALU_instructions++;
        this.ALURESULT = rs1 >> imm;
        break;
      case "slti":
        ALU_instructions++;
        this.ALURESULT = rs1 < imm ? 1 : 0;
        break;
      case "sltiu":
        ALU_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        imm = imm < 0 ? 0xffffffff - 1 - imm : imm;
        if (rs1 < imm) this.ALURESULT = 1;
        else this.ALURESULT = 0;
        break;
      case "lb":
      case "lh":
      case "lw":
      case "lbu":
      case "lhu":
      case "sb":
      case "sh":
      case "sw":
        Data_transfer_instructions++;
        this.ALURESULT = rs1 + imm;
        break;
      case "beq":
        Control_instructions++;
        if (rs1 == rs2) this.PC += (imm >> 2);
        else this.PC += 1;
        break;
      case "bne":
        Control_instructions++;
        if (rs1 != rs2) this.PC += (imm >> 2);
        else this.PC += 1;
        break;
      case "blt":
        Control_instructions++;
        if (rs1 < rs2) this.PC += (imm >> 2);
        else this.PC += 1;
        break;
      case "bge":
        Control_instructions++;
        if (rs1 >= rs2) this.PC += (imm >> 2);
        else this.PC += 1;
        break;
      case "bltu":
        Control_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        rs2 = rs2 < 0 ? 0xffffffff - 1 - rs2 : rs2;
        if (rs1 < rs2) this.PC += (imm >> 2);
        else this.PC += 1;
        break;
      case "bgeu":
        Control_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        rs2 = rs2 < 0 ? 0xffffffff - 1 - rs2 : rs2;
        if (rs1 >= rs2) this.PC += (imm >> 2);
        else this.PC += 1;
        break;
      case "jal":
        Control_instructions++;
        this.ALURESULT = 4 * (this.PC + 1);
        this.PC += (imm >> 2);
        break;
      case "jalr":
        Control_instructions++;
        this.ALURESULT = 4 * (this.PC + 1);
        this.PC = (rs1 >> 2) + (imm >> 2);
        break;
      case "lui":
        ALU_instructions++;
        this.ALURESULT = imm << 12;
        break;
      case "auipc":
        this.ALURESULT = 4 * this.PC + (imm << 12);
        break;
      default:
        console.error("Error");
        break;
    }
    if (this.OP[0] != "b" && this.OP[0] != "j") this.PC += 1;
    // console.log(this.ALURESULT);
  }

  memoryAccess() {
    // console.log("HEOEJ\n");
    function numberToHexString(number) {
      let hexString = (
        number < 0 ? number + (0xffffffff + 1) : number
      ).toString(16);
      while (hexString.length < 8) hexString = "0" + hexString;
      return hexString;
    }
    let address = this.ALURESULT;
    if (this.OP[0] === "s") {
      let hexNum = numberToHexString(this.RF[this.RS2]);
      this.MEMORY[address] = hexNum[6] + hexNum[7];
      switch (this.OP[1]) {
        case "w":
          this.MEMORY[address + 2] = hexNum[2] + hexNum[3];
          this.MEMORY[address + 3] = hexNum[0] + hexNum[1];
        case "h":
          this.MEMORY[address + 1] = hexNum[4] + hexNum[5];
      }
      // console.log(
      //   this.MEMORY[address] +
      //     this.MEMORY[address + 1] +
      //     this.MEMORY[address + 2] +
      //     this.MEMORY[address + 3]
      // );
      let type = document.getElementsByClassName("dropbtn")[0].innerText;
      let numberFormat = "hex";
      if (type === "Unsigned Decimal") numberFormat = "udec";
      if (type === "Decimal") numberFormat = "dec";
      memSync(this.MEMORY, numberFormat);
    } else if (this.OP[0] === "l") {
      let hexNum = "";
      switch (this.OP[1]) {
        case "w":
          hexNum +=
            (this.MEMORY[address + 3] === undefined
              ? "00"
              : this.MEMORY[address + 3]) +
            (this.MEMORY[address + 2] === undefined
              ? "00"
              : this.MEMORY[address + 2]);
        case "h":
          hexNum +=
            this.MEMORY[address + 1] === undefined
              ? "00"
              : this.MEMORY[address + 1];
        default:
          hexNum +=
            this.MEMORY[address] === undefined ? "00" : this.MEMORY[address];
      }
      let decimalNumber = parseInt(hexNum, 16);
      if (this.OP[2] == "u") {
        switch (this.OP[1]) {
          case "b":
            if (decimalNumber & 0x80) decimalNumber -= 0xff + 1;
          case "h":
            if (decimalNumber & 0x8000) decimalNumber -= 0xffff + 1;
          case "w":
            if (decimalNumber & 0x80000000) decimalNumber -= 0xffffffff + 1;
        }
      }
      this.ALURESULT = decimalNumber;
    }
  }

  writeBack() {
    if (Number(this.RD) !== 0) this.RF[this.RD] = this.ALURESULT;
  }
}

var simulator = new Simulator();
RFSync(simulator.RF, "hex");

document.querySelector(".step").addEventListener("click", () => {
  if (wrong_code) {
  } else if (filechoosen) {
    simulator.step();
  } else {
    alert("!Please choose a file");
  }
});
document.querySelector(".run").addEventListener("click", () => {
  let time_delay = 500 - 5 * document.querySelector("#speed").value;
  if (filechoosen) {
    let currentInterval = setInterval(function () {
      if (wrong_code) {
      }
      simulator.step();
      if (simulator.DONE) {
        clearInterval(currentInterval);
      }
    }, time_delay);
  } else {
    alert("!Please choose a file");
  }
});
document.querySelector(".reset").addEventListener("click", () => {
  location.reload(true);
});

document
  .querySelector("#thefile")
  .addEventListener("change", async function (e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      inputString = e.target.result;

      inputStringParser();
      filechoosen = true;
      // Creating new simulator object.
      if(knobs.pipeline_knob) {
        // console.log("PipelineSimulator");
        simulator = new PipelineSimulator();
      }
      else {
        // console.log("Simulator");
        simulator = new Simulator();
      }
      RFSync(simulator.RF, "hex");
    };
    reader.readAsText(file);
  });

let rowsCreated = 10;
function addRow() {
  // document.getElementById("memory").getElementsByClassName("memory-container")[0].innerHTML = "";
  let memoryDiv = document.createElement("div");
  memoryDiv.className = "memory-row";
  memoryDiv.id = `memory-row-${rowsCreated}`;
  memoryDiv.innerHTML = `<div class="memory-address"></div>
    <div class="memory-value">
        <div class="memory-cell"></div>
        <div class="memory-cell"></div>
        <div class="memory-cell"></div>
        <div class="memory-cell"></div>
    </div>`;
  document
    .getElementById("memory")
    .getElementsByClassName("memory-container")[0]
    .appendChild(memoryDiv);
}

function memSync(memory, format) {
  function numberToHexString(number) {
    let hexString = (number < 0 ? number + (0xffffffff + 1) : number).toString(
      16
    );
    while (hexString.length < 8) hexString = "0" + hexString;
    return hexString;
  }
  let lastAccess = -1;
  let memoryLocations = document.querySelectorAll(".memory-cell");
  let rowWritten = 0;
  for (let address in memory) {
    let value = memory[address];
    if (format[0] !== "h") value = parseInt(value, 16);
    if (format[0] === "u" && value & 0x80) value -= 0xff + 1;

    if (address >> 2 === lastAccess) {
      memoryLocations[4 * rowWritten + (address % 4)].textContent = value;
    } else {
      lastAccess = address >> 2;
      if (rowsCreated - rowWritten < 2) {
        addRow();
        rowsCreated++;
      }
      rowWritten++;
      for (let i = 0; i < 4; i++)
        if (memoryLocations[4 * rowWritten + i].textContent === "")
          memoryLocations[4 * rowWritten + i].textContent =
            format === "hex" ? "00" : "0";
      let memoryAddress = document.querySelectorAll(".memory-address");
      memoryAddress[rowWritten].textContent =
        "0x" + numberToHexString(address - (address % 4));
      memoryLocations[4 * rowWritten + (address % 4)].textContent = value;
    }
  }
}

























function dependency(a, b, c, d){
  if(a < 0) return 0;
  let inst1 = decode2(a>=0?instList[a].split(" ")[1]:"00000033");
  let inst2 = decode2(b>=0?instList[b].split(" ")[1]:"00000033");
  let inst3 = decode2(c>=0?instList[c].split(" ")[1]:"00000033");
  let inst4 = decode2(d>=0?instList[d].split(" ")[1]:"00000033");
  // console.log(inst1);
  // console.log(inst2);
  if(inst1.rs1 === inst2.rd && inst2.rd !== 0) return 1;
  if(inst1.rs2 === inst2.rd && inst2.rd !== 0) return 2;
  if(inst1.rs1 === inst3.rd && inst3.rd !== 0) return 1;
  if(inst1.rs2 === inst3.rd && inst3.rd !== 0) return 2;
  if(inst1.rs1 === inst4.rd && inst4.rd !== 0) return 1;
  if(inst1.rs2 === inst4.rd && inst4.rd !== 0) return 2;
  return 0;
}


function forwardingDepencency(b, a){
  let inst1 = decode2(a>=0?instList[a].split(" ")[1]:"00000033");
  let inst2 = decode2(b>=0?instList[b].split(" ")[1]:"00000033");
  if(inst1.op[0]==="l" && inst1.op[1]!=="u")
      if((inst1.rd  ===  inst2.rs1 || inst1.rd  ===  inst2.rs2) && inst1.rd!==0)
          return 1;
  return 0;
}





class set_associative_cache {
constructor(size, ass, remove_policy) {
  console.log("asss is ", ass);
    this.size = size;
    this.assoc = ass;
    this.remove_policy = remove_policy;
    this.curr = 0;
    this.div = this.size / this.assoc;
    this.addr={};
    this.usage={};
    this.receny=[];
    this.queue=new Array(this.div).fill(0);
    this.array = new Array(this.div);
    for (let i = 0; i < this.div; i++) {
        this.array[i] = new Array();
        this.receny[i] = new Array();
    }
}

cache_sync(type, format) {
  function numberToHexString(number) {
    let hexString = (number < 0 ? number + (0xffffffff + 1) : number).toString(
      16
    );
    while (hexString.length < 8) hexString = "0" + hexString;
    return hexString;
  }
  let lastAccess = -1;
  let cache_type_int = 0;
  if(type==='icache') cache_type_int = 1;
  let cache_class = cache_type_int?".icache-cell":".dcache-cell";
  let cacheLocations = document.querySelectorAll(cache_class);
  let rowWritten = 0;
  let rowsCreated = icache_rows;
  if(type===1) rowsCreated = dcache_rows;
  let block_size = cache_type_int?icache_block:dcache_block;
  let cache = {};
  let cache_memory = cache_type_int?"INST_MEMORY":"MEMORY";
  
  // if(cache_type_int===1){
  // for(let i=0; i<this.array.length; i++)
  //   for(let j=0; j<this.array[i].length; j++)
  //       for(let k=0; k<block_size/4; k++)
  //         for(let l=0; l<4; l++);
  //           cache[j*block_size+k] = simulator[cache_memory][j*block_size+k];

  // }
  // else{
    if(cache_type_int===1)
    {
      for(let i=0; i<this.array.length; i++)
        for(let j=0; j<this.array[i].length; j++)
            for(let k=0; k<block_size; k++)
                cache[parseInt(this.array[i])*block_size+k] = simulator[cache_memory][parseInt(this.array[i])*block_size+k];
    }
    else{
      for(let i=0; i<this.array.length; i++)
        for(let j=0; j<this.array[i].length; j++)
            for(let k=0; k<block_size; k++)
                cache[parseInt(this.array[i])+k] = simulator[cache_memory][parseInt(this.array[i])+k];
    }
// 
  // }

  
          
    console.log(cache);
    
    for (let address in cache) {
        let value = cache[address];
        if(value===undefined)
        {
            // console.error("block overflow");
            value=0;
        }
        if (format[0] !== "h") value = parseInt(value, 16);
        if (format[0] === "u" && value & 0x80) value -= 0xff + 1;

        if (address >> 2 === lastAccess) {
            cacheLocations[4 * rowWritten + (address % 4)].textContent = value;
        } else {
            lastAccess = address >> 2;
            if (rowsCreated - rowWritten < 2) {
            if(cache_type_int===1)
              this.addInstCacheRow();
            else
              this.addDataCacheRow();
            }
            rowWritten++;
            for (let i = 0; i < 4; i++)
            if (cacheLocations[4 * rowWritten + i].textContent === "")
                cacheLocations[4 * rowWritten + i].textContent =
                format === "hex" ? "00" : "0";
            let cache_type_address = cache_type_int?".icache-address":".dcache-address";
            let cacheaddress = document.querySelectorAll(cache_type_address);
            cacheaddress[rowWritten].textContent =
            "0x" + numberToHexString(address - (address % 4));
            cacheLocations[4 * rowWritten + (address % 4)].textContent = value;
    }
  }
}





addInstCacheRow() {
    icache_rows++;
  // document.getElementById("memory").getElementsByClassName("memory-container")[0].innerHTML = "";
  let memoryDiv = document.createElement("div");
  memoryDiv.className = "icache-row";
  memoryDiv.id = `icache-row-${rowsCreated}`;
  memoryDiv.innerHTML = `<div class="icache-address"></div>
    <div class="icache-value">
        <div class="icache-cell"></div>
        <div class="icache-cell"></div>
        <div class="icache-cell"></div>
        <div class="icache-cell"></div>
    </div>`;
  document
    .getElementById("icache")
    .getElementsByClassName("icache-container")[0]
    .appendChild(memoryDiv);
}

addDataCacheRow() {
    dcache_rows++;
    // document.getElementById("memory").getElementsByClassName("memory-container")[0].innerHTML = "";
    let memoryDiv = document.createElement("div");
    memoryDiv.className = "dcache-row";
    memoryDiv.id = `dcache-row-${rowsCreated}`;
    memoryDiv.innerHTML = `<div class="dcache-address"></div>
      <div class="dcache-value">
          <div class="dcache-cell"></div>
          <div class="dcache-cell"></div>
          <div class="dcache-cell"></div>
          <div class="dcache-cell"></div>
      </div>`;
    document
      .getElementById("dcache")
      .getElementsByClassName("dcache-container")[0]
      .appendChild(memoryDiv);
  }
  
readcache(addr){
    if(this.find(addr)=="present")
    {
        if(this.usage[addr]==undefined)
            this.usage[addr]=1;
        else
            this.usage[addr]++;
        return "hit";
    }
    else
        return "miss";
}
find(addr)
{
    let pos = addr % this.div;
    for(let i=0;i<this.array[pos].length;i++)
        if(this.array[pos][i]==addr)
            return "present";
    return "not present";
}
insert(addr) {
  if(this.type==='dcache')
    console.error("1234567890123w4er5tfgyrsedr5gygfdxrtfgyftrgyuhbgcftrgyuh")
    if(this.find(addr)=="not present"){
        let pos = addr % this.div;
        if (this.array[pos].length < this.assoc) {
            this.array[pos].push(addr);
            this.usage[addr]=0;
            for(let i=0; i<this.receny[pos].length; i++)
                if(this.receny[pos][i]>0)
                    this.receny[pos][i]--;
            this.receny[pos][this.receny.length-1] = this.assoc-1;
            console.log(addr + " is added")
        }
        else {
            let ind=this.remove(this.remove_policy,addr);
            console.log(this.array[pos][ind] + " is removed")
            this.array[pos][ind]=addr;
            this.usage[addr]=0;
            for(let i=0; i<this.receny[pos].length; i++)
                if(this.receny[pos][i]>0)
                    this.receny[pos][i]--;
            this.receny[pos][ind] = this.assoc-1;
            console.log(addr + " is added")
        }
    }
    else
        console.log("already present");
}
remove(policy,addr)
{
    let pos=addr%this.div;
    if(policy=="random"){
        let rn=Math.floor(Math.random()*this.assoc);
        return rn;
    }
    if(policy=="lfu")
    {
        let ind=0;
        let rem=0;
        for(let i=0;i<this.assoc;i++){
            if(this.usage[this.array[pos][i]]<=this.usage[this.array[pos][ind]]){
                ind=rem;
                rem=i;
            }
        }
        return rem;
    }
    if(policy=="fifo"){
        let rem=this.queue[pos];
        this.queue[pos]++;
        return rem%this.assoc;
    }
    if(policy==="lru"){
        for(let i=0; i<this.assoc; i++)
            if(this.receny[pos][i]===undefined || this.receny[pos][i]===0)
                return i;
    }
}
}




class PipelineSimulator {
  constructor() {
    this.done = 0;
    this.DONE = 0;
    this.CYCLE = 0; // Cycle number
    this.PC = 0; // Program counter
    this.INSTRUCTION = ""; // Stores current instruction from Fetch
    this.RF = new Array(32); // Register file
    this.RF.fill(0);
    this.OP = new Array(instList.length); // Stores operator decoded from Decode
    this.RS1 = new Array(instList.length); // 0 to 31 for each register
    this.RS2 = new Array(instList.length); // 0 to 31 for each register
    this.RD = new Array(instList.length);// 0 to 31 for each register
    this.IMM = new Array(instList.length); // Stores immediate value
    this.ALURESULT = new Array(instList.length); // Stores result of ALU or Memory value
    this.MEMORY = {};
    this.INST_MEMORY = {};
    this.RF[2] = 2147483632;
    this.pc = new Array(5);
    this.pc.fill(-1);
    this.stalls_fetch = 0;
    this.stalls_memoryAccess = 0;
    this.fetchhit = 0;
    this.memoryhit = 0;
    this.dataHit = 0;
    this.BTB = new Array(instList.length);
    for(let i = 0; i<instList.length; i++){
      this.BTB[i] = i+1;
    }  
    
    for(let i=0; i<instList.length; i++){
        let hexInst = instList[i].split(' ')[1];
        for(let j=0; j<4; j++){
            this.INST_MEMORY[4*i+3-j]=hexInst[2*j]+hexInst[2*j+1];
        }    
    }    
    
    
    dcache_assoc=dcache_type==='direct'?1:(dcache_type==='fully'?dcache_size:dcache_assoc)
    icache_assoc=icache_type==='direct'?1:(icache_type==='fully'?icache_size:icache_assoc)
    // console.log(dcache_assoc, icache_assoc)
    this.data_cache = new set_associative_cache(dcache_size, dcache_assoc, cachePolicy);
    this.instruction_cache = new set_associative_cache(icache_size, icache_assoc, cachePolicy);

    



    // Now creating Instruction div elements
    for (let i = 0; i < instList.length; i++) {
      // console.log(i);
      let pc_inst = instList[i].split(" ")[0].replace("0x", "");
      let a_inst = instList[i].split(" ")[1].replace("0x", "");
      let instructionDiv = document.createElement("div");
      instructionDiv.className = "instruction-row";
      instructionDiv.innerHTML = `<div class="instruction-addr">0x${pc_inst}</div>
            <div class="instruction-hex">0x${a_inst}</div>
            <div class="instruction-decoded" id="instruction-rowd-${i}">---</div>`;
      document      
        .getElementsByClassName("instructions")[0]
        .appendChild(instructionDiv);
    }    

    // Now creating Timeline div elements

    // Now creating register div elements
    document
      .getElementById("register")
      .getElementsByClassName("register-container")[0].innerHTML = "";
    for (let i = 0; i < 32; i++) {
      let registerDiv = document.createElement("div");
      registerDiv.className = "register-row";
      registerDiv.innerHTML = `<div class="register-name">x${i}</div>
          <div class="register-value" id="register-x${i}">${this.RF[i]}</div>`;
      document    
        .getElementById("register")
        .getElementsByClassName("register-container")[0]
        .appendChild(registerDiv);
    }    

    // Now creating memory div elements
    document
      .getElementById("memory")
      .getElementsByClassName("memory-container")[0].innerHTML = "";
    for (let i = 0; i < 10; i++) {
      let memoryDiv = document.createElement("div");
      memoryDiv.className = "memory-row";
      memoryDiv.id = `memory-row-${i}`;
      memoryDiv.innerHTML = `<div class="memory-address"></div>
          <div class="memory-value">
              <div class="memory-cell"></div>
              <div class="memory-cell"></div>
              <div class="memory-cell"></div>
              <div class="memory-cell"></div>
          </div>`;    
      document    
        .getElementById("memory")
        .getElementsByClassName("memory-container")[0]
        .appendChild(memoryDiv);
    }    

    document.querySelector("#but-hex").addEventListener("click", function () {
      RFSync(simulator.RF, "hex");
      memSync(simulator.MEMORY, "hex");
    });  
    document.querySelector("#but-dec").addEventListener("click", function () {
      RFSync(simulator.RF, "dec");
      memSync(simulator.MEMORY, "dec");
    });  
    document.querySelector("#but-udec").addEventListener("click", function () {
      RFSync(simulator.RF, "udec");
      memSync(simulator.MEMORY, "udec");
    });  
  }  



  step(){
    this.memoryhit = 1;
    this.fetchhit = 1;
    let type = document.getElementsByClassName("dropbtn")[0].innerText;
    let numberFormat = "hex";
    if (type === "Unsigned Decimal") numberFormat = "udec";
    if (type === "Decimal") numberFormat = "dec";
    // console.log(this.RF);
    RFSync(this.RF, numberFormat);
    // memSync();
    let flag = 0;
    let flag1 = 0;
    let flag2 = 0;
    // console.log(this.pc);
    if(dependency(this.pc[1], this.pc[2], this.pc[3], this.pc[4]) > 0   && !knobs.data_knob){
      flag = 1;
      Data_Hazards++;
      Data_hazards_stalls++;
    }
    if(knobs.data_knob   &&  forwardingDepencency(this.pc[1], this.pc[2])){
      
      flag = 1;
      Data_Hazards++;
      Data_hazards_stalls++;
    }
    for(let i = 4; i>=0; i--){
      if(this.pc[i] != -1) break;
      else if(i == 0  && this.PC >= instList.length){
        this.DONE = 1;
      }
    }
    this.pc[4] = -1;
    if(this.stalls_memoryAccess <= 0 || !knobs.cache){
    if(this.pc[3] != -1 && this.pc[4] == -1){
      this.pc[4] = this.pc[3];
      this.pc[3] = -1;
      if(cycles(decode2(instList[this.pc[4]].split(" ")[1]).op)[4] != 0){
      this.writeBack();
      }
    }
  }
    if(this.pc[2] != -1 && this.pc[3] == -1){
      this.pc[3] = this.pc[2];
      this.pc[2] = -1;
      if(cycles(decode2(instList[this.pc[3]].split(" ")[1]).op)[3] != 0)
      {
        this.memoryAccess();
      }
    }
    if(flag == 0){
    if(this.pc[1] != -1 && this.pc[2] == -1){
      this.pc[2] = this.pc[1];
      this.pc[1] = -1;
      INSTRUCTION++;
      if(this.execute() == 1){
        Control_Hazards++;
        Control_hazards_stalls += 2;
        this.pc[1] = -1;
        this.pc[0] = -1;
        flag1 = 1;
      }
    }
    if(flag1 == 0){
      if(this.stalls_fetch <= 0 || !knobs.cache){
          if(this.pc[0] != -1 && this.pc[1] == -1){
          this.pc[1] = this.pc[0];
          this.pc[0] = -1;
          let obj2 = decode2(instList[this.pc[1]].split(" ")[1]);
          let ins_to_print = print_ins(obj2);
          // document.getElementById("instruction-rowd-" + this.pc[1]).innerText =  ins_to_print;
          displayDecodedInstructionAndHazard(this.pc[1], ins_to_print, "ok");
          // Keywords to pass for different types of hazards
          // "data" -> data hazard; "control" -> Control hazard; otherwise no hazard
  
          this.decode();
          if(this.OP[this.pc[1]][0] == 'b'  ||    this.OP[this.pc[1]][0] == 'j'){
              this.PC = this.BTB[this.pc[1]];
          }
          }
      }
      if(this.PC < instList.length && this.pc[0] == -1){
        this.pc[0] = this.PC;
        // console.log("step");
        // console.log(this.PC);
        this.fetch();
      }
      
    }
  }
    if(flag == 1  && this.pc[1] != -1){
      let obj2 = decode2(instList[this.pc[1]].split(" ")[1]);
        let ins_to_print = print_ins(obj2);
        displayDecodedInstructionAndHazard(this.pc[1], ins_to_print, "data");
    }
    if(flag1 == 1  && this.pc[2] != -1){
      let obj2 = decode2(instList[this.pc[2]].split(" ")[1]);
      let ins_to_print = print_ins(obj2);
      displayDecodedInstructionAndHazard(this.pc[2], ins_to_print, "control");
    }
    if(this.stalls_fetch > 0){
      total_memory_stall++;
      this.stalls_fetch--;
    }
    if(this.stalls_memoryAccess > 0){
      total_memory_stall++;
      this.stalls_memoryAccess--;
    }
// console.log(this.fetchhit)
    if(this.stalls_fetch <= 0 && this.fetchhit == 0){
      this.stalls_fetch = CACHE_STALLS;
    }
// console.log(this.stalls_fetch)
    if(this.stalls_memoryAccess <= 0 && this.memoryhit == 0){
      this.stalls_memoryAccess = CACHE_STALLS;
    }
    let row = new Array(5);
    for(let i = 0; i<5; i++){
      if(this.pc[i] == -1) row[i] = 0;
      else row[i] = this.pc[i] + 1;
    }
    CYCLE = this.CYCLE;
    this.CYCLE++;
    updateStats();
    // console.log(this.pc);
    timelineAppendRow(this.CYCLE, row);
    if (this.CYCLE > 10000) {
      wrong_code = true;
      alert("Infinite loop");
      location.reload();
    }
  }



  fetch() {
    if (!this.DONE && this.PC < instList.length){
      this.INSTRUCTION = instList[this.PC].split(" ")[1];
    }  
    let hit = 1;
    hit *= this.instruction_cache.readcache(this.PC-this.PC%(icache_block/4))==='miss'?0:1;
    this.instruction_cache.insert(this.PC-this.PC%(icache_block/4));
    // console.error(hit)
    this.fetchhit = hit;
    if(this.stalls_fetch==0 || this.fetchhit!=0)
    {
      let type = document.getElementsByClassName("dropbtn")[0].innerText;
      let numberFormat = "hex";
      if (type === "Unsigned Decimal") numberFormat = "udec";
      if (type === "Decimal") numberFormat = "dec";
      this.instruction_cache.cache_sync('icache', numberFormat);

    } 
    if(knobs.pipeline_info_knob)
    console.log(this.INSTRUCTION);
      this.PC += 1;
      // console.log("fetch");
      // console.log(this.PC);
    
    if(hit==1)
      icache_hit++;
    else
      icache_miss++;
  }    
  decode() {
    let obj = decode2(instList[this.pc[1]].split(" ")[1]);
    if(knobs.pipeline_info_knob)
    console.log(obj);
    this.IMM[this.pc[1]] = obj.imm;
    this.OP[this.pc[1]]= obj.op;
    this.RS1[this.pc[1]] = obj.rs1;
    this.RS2[this.pc[1]] = obj.rs2;
    this.RD[this.pc[1]] = obj.rd;
  }  
  execute() {
    let rs1 = Math.round(this.RF[Math.round(this.RS1[this.pc[2]])]);

    let rs2 = Math.round(this.RF[Math.round(this.RS2[this.pc[2]])]);
    if(knobs.data_knob  && dependency(this.pc[2], this.pc[3], -1, -1)   &&    (!forwardingDepencency(this.pc[2], this.pc[4]))){
      // console.log("HDFHUEDFHUIHSDGIHDSIPHF\n");
      if(dependency(this.pc[2], this.pc[3], -1, -1) == 1) rs1 = this.ALURESULT[this.pc[3]]
      else {
            // console.log("hello\n");
            rs2 = this.ALURESULT[this.pc[3]];
            // console.log(rs2);
            // console.log(this.pc[2]);
            // console.log(this.pc[3])
          }  
    }      


    // console.log(rs2);
    let imm = Math.round(this.IMM[this.pc[2]]);
    let dum;
    let flag = 0;
    // console.log(this.pc[2] + "    " +  this.OP[this.pc[2]]);  
    switch (this.OP[this.pc[2]]) {
      case "add":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 + rs2;
        break;
      case "sub":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 - rs2;
        break;
      case "xor":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 ^ rs2;
        break;
      case "or":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 | rs2;
        break;
      case "and":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 & rs2;
        break;
      case "sll":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 << rs2;
        break;
      case "srl":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 >>> rs2;
        break;
      case "sra":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 >> rs2;
        break;
      case "slt":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 < rs2 ? 1 : 0;
        break;
      case "sltu":
        ALU_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        rs2 = rs2 < 0 ? 0xffffffff - 1 - rs2 : rs2;
        if (rs1 < rs2) this.ALURESULT[this.pc[2]] = 1;
        else this.ALURESULT[this.pc[2]] = 0;
        break;
      case "addi":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 + imm;
        break;
      case "xori":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 ^ imm;
        break;
      case "ori":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 | imm;
        break;
      case "andi":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 & imm;
        break;
      case "slli":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 << imm;
        break;
      case "srli":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 >> imm;
        break;
      case "srai":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 >> imm;
        break;
      case "slti":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 < imm ? 1 : 0;
        break;
      case "sltiu":
        ALU_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        imm = imm < 0 ? 0xffffffff - 1 - imm : imm;
        if (rs1 < imm) this.ALURESULT[this.pc[2]] = 1;
        else this.ALURESULT[this.pc[2]] = 0;
        break;
      case "lb":
      case "lh":
      case "lw":
      case "lbu":
      case "lhu":
      case "sb":
      case "sh":
      case "sw":
        Data_transfer_instructions++;
        this.ALURESULT[this.pc[2]] = rs1 + imm;
        break;
      case "beq":
        Control_instructions++;
        if (rs1 == rs2) dum = this.pc[2] + (imm >> 2);
        else dum = this.pc[2] + 1;
        if(dum == this.BTB[this.pc[2]]);
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum; 
          this.PC = dum;
        }  
        return flag;
        break;
      case "bne":
        Control_instructions++;
        if (rs1 != rs2) dum = this.pc[2] + (imm >> 2);
        else dum = this.pc[2] + 1;
        if(dum == this.BTB[this.pc[2]]) ;
        else{
          this.BTB[this.pc[2]] = dum; 
          this.PC = dum;
          flag = 1;
        }  
        return flag;
        break;
      case "blt":
        Control_instructions++;
        if (rs1 < rs2){ dum = this.pc[2] + imm/4;}
        else dum = this.pc[2] + 1;
        if(dum == this.BTB[this.pc[2]]);
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum; 
          this.PC = dum;
        }  
        return flag;
        break;
      case "bge":
        Control_instructions++;
        // console.log(this.pc[2] + "       " + imm);
        if (rs1 >= rs2) dum = this.pc[2] + imm/4;
        else dum = this.pc[2] + 1;
        // console.log("         " + dum);
        if(dum == this.BTB[this.pc[2]]);
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum; 
          this.PC = dum;
        }  
        // console.log("Value of flag - "+flag);
        return flag;
        break;
      case "bltu":
        Control_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        rs2 = rs2 < 0 ? 0xffffffff - 1 - rs2 : rs2;
        if (rs1 < rs2) dum = this.pc[2] + imm/4;
        else dum = this.pc[2] + 1;
        if(dum == this.BTB[this.pc[2]]) ;
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum; 
          this.PC = dum;
        }  
        return flag;
        break;
      case "bgeu":
        Control_instructions++;
        rs1 = rs1 < 0 ? 0xffffffff - 1 - rs1 : rs1;
        rs2 = rs2 < 0 ? 0xffffffff - 1 - rs2 : rs2;
        if (rs1 > rs2) dum = this.pc[2] + (imm >> 2);
        else dum = this.pc[2] + 1;
        if(dum == this.BTB[this.pc[2]]) ;
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum; 
          this.PC = dum;
        }  
        return flag;
        break;
      case "jal":
        Control_instructions++;
        this.ALURESULT[this.pc[2]] = 4 * (this.pc[2] + 1);
        dum = this.pc[2] + (imm >> 2);
        if(dum == this.BTB[this.pc[2]]) ;
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum;
          this.PC = dum;
        }  
        return flag;
        break;
      case "jalr":
        Control_instructions++;
        this.ALURESULT[this.pc[2]] = 4 * (this.pc[2] + 1);
        dum = (rs1 >> 2) + (imm >> 2);
        if(dum == this.BTB[this.pc[2]]) ;
        else{
          flag = 1;
          this.BTB[this.pc[2]] = dum;
          this.PC = dum;
        }  
        return flag;
        break;
      case "lui":
        ALU_instructions++;
        this.ALURESULT[this.pc[2]] = imm << 12;
        break;
      case "auipc":
        this.ALURESULT[this.pc[2]] = 4 * this.PC + (imm << 12);
        break;
      default:
        console.error("Error");
        break;
    }    
    // if (this.OP[0] != "b" && this.OP[0] != "j") this.PC += 1;
    if(knobs.pipeline_info_knob)
    console.log(this.ALURESULT[this.pc[2]]);
  }  
  
  memoryAccess() {
    function numberToHexString(number) {
      let hexString = (
        number < 0 ? number + (0xffffffff + 1) : number
        ).toString(16);
        while (hexString.length < 8) hexString = "0" + hexString;
        return hexString;
      }  
      let address = this.ALURESULT[this.pc[3]];
      // console.log(address);
      let hit = 1;
    if (this.OP[this.pc[3]][0] === "s") {
      let hexNum = numberToHexString(this.RF[this.RS2[this.pc[3]]]);
      this.MEMORY[address] = hexNum[6] + hexNum[7];
      switch (this.OP[this.pc[3]][1]) {
        case "w":
          this.MEMORY[address + 2] = hexNum[2] + hexNum[3];
          this.MEMORY[address + 3] = hexNum[0] + hexNum[1];
        case "h":
          this.MEMORY[address + 1] = hexNum[4] + hexNum[5];
      }    
      // console.log(
      //   this.MEMORY[address] +  
      //     this.MEMORY[address + 1] +
      //     this.MEMORY[address + 2] +
      //     this.MEMORY[address + 3]
      // );
      let type = document.getElementsByClassName("dropbtn")[0].innerText;
      let numberFormat = "hex";
      if (type === "Unsigned Decimal") numberFormat = "udec";
      if (type === "Decimal") numberFormat = "dec";
      memSync(this.MEMORY, numberFormat);
    } else if (this.OP[this.pc[3]][0] === "l") {
      let hexNum = "";
      switch (this.OP[this.pc[3]][1]) {
        case "w":
          hexNum +=
            (this.MEMORY[address + 3] === undefined
              ? "00"
              : this.MEMORY[address + 3]) +
            (this.MEMORY[address + 2] === undefined
              ? "00"
              : this.MEMORY[address + 2]);
              hit *= this.data_cache.readcache((address+3)-(address+3)%dcache_block)==='miss'?0:1
              this.data_cache.insert((address+3)-(address+3)%dcache_block)
              hit *= this.data_cache.readcache((address+2)-(address+2)%dcache_block)==='miss'?0:1
              this.data_cache.insert((address+2)-(address+2)%dcache_block)
        case "h":    
          hexNum +=
            this.MEMORY[address + 1] === undefined
              ? "00"
              : this.MEMORY[address + 1];
              hit *= this.data_cache.readcache((address+1)-(address+1)%dcache_block)==='miss'?0:1
            this.data_cache.insert((address+1)-(address+1)%dcache_block)  
        default:  
          hexNum +=
            this.MEMORY[address] === undefined ? "00" : this.MEMORY[address];
            hit *= this.data_cache.readcache((address)-(address)%dcache_block)==='miss'?0:1
            this.data_cache.insert((address)-(address)%dcache_block)
      }      
      let decimalNumber = parseInt(hexNum, 16);
      if (this.OP[this.pc[3]][2] == "u") {
        switch (this.OP[this.pc[3]][1]) {
          case "b":
            if (decimalNumber & 0x80) decimalNumber -= 0xff + 1;
          case "h":
            if (decimalNumber & 0x8000) decimalNumber -= 0xffff + 1;
          case "w":
            if (decimalNumber & 0x80000000) decimalNumber -= 0xffffffff + 1;
        }    
      }  
      this.ALURESULT[this.pc[3]] = decimalNumber;
      if(hit==1)
        dcache_hit++;
      else
        dcache_miss++;
    }  
    this.memoryhit = hit;
    if(this.stalls_memoryAccess==0)
    {
      let type = document.getElementsByClassName("dropbtn")[0].innerText;
      let numberFormat = "hex";
      if (type === "Unsigned Decimal") numberFormat = "udec";
      if (type === "Decimal") numberFormat = "dec";
      this.data_cache.cache_sync('dcache', numberFormat);

    } 
  }  

  writeBack() {
    if (Number(this.RD[this.pc[4]]) !== 0) this.RF[this.RD[this.pc[4]]] = this.ALURESULT[this.pc[4]];
    if(knobs.pipeline_info_knob)
    console.log(this.RF[this.RD[this.pc[4]]]);
  }  
}  












document.getElementById("speed").addEventListener("input", function () {
  document.getElementById("speed-value").innerText = this.value;
});  


