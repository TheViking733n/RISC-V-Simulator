function timelineAppendRow(cycle, row) {
    // cycle is value of current cycle number
    // row is an array of size 5 containing 5 numbers which represent the instruction number being executed
    // row value 0 means stall
    cycleDiv = document.createElement("div");
    cycleDiv.className = "timeline-cell";
    cycleDiv.innerHTML = cycle;
    document.getElementById("cycle").appendChild(cycleDiv);

    let timelineHeaderId = ["fetch", "decode", "execute", "memoryaccess", "writeback"];
    for (let i = 0; i < row.length; i++) {
        let instructionDiv = document.createElement("div");
        instructionDiv.className = "timeline-cell";
        if (row[i] != 0) {
            instructionDiv.innerHTML = row[i];
        } else {
            // let stallDiv = document.createElement("div");
            // stallDiv.className = "stall";
            // instructionDiv.appendChild(stallDiv);
            instructionDiv.innerHTML = "O";

        }
        document.getElementById(timelineHeaderId[i]).appendChild(instructionDiv);
    }
}
for (let i = 1; i < 51; i++) {
    timelineAppendRow(i, [i, i, (i%7!=0)+i, (i%7==0)+i, i&1]);
}

class Simulator {
    constructor() {
        this.CYCLE = 0;   // Cycle number
        this.PC = 0;      // Program counter
        this.INSTRUCTION = "";     // Stores current instruction from Fetch
        this.RF = new Array(32);   // Register file
        this.RF.fill(0);
        this.OP = "";       // Stores operator decoded from Decode
        this.RS1 = 0;       // 0 to 31 for each register
        this.RS2 = 0;       // 0 to 31 for each register
        this.RD = 0;        // 0 to 31 for each register
        this.IMM = 0;       // Stores immediate value
        this.ALURESULT = 0; // Stores result of ALU or Memory value
        this.MEMORY = {}
    }

    fetch() {

    }

    decode() {

    }

    execute() {
        let rs1 = Math.round(this.RF[Math.round(this.RS1)]);
        let rs2 = Math.round(this.RF[Math.round(this.RS2)]);
        let imm = Math.round(this.IMM);
        switch (this.OP) {
          case "add":
            this.ALURESULT = rs1 + rs2;
            break;
          case "sub":
            this.ALURESULT = rs1 - rs2;
            break;
          case "xor":
            this.ALURESULT = rs1 ^ rs2;
            break;
          case "or":
            this.ALURESULT = rs1 | rs2;
            break;
          case "and":
            this.ALURESULT = rs1 & rs2;
            break;
          case "sll":
            this.ALURESULT = rs1 << rs2;
            break;
          case "srl":
            this.ALURESULT = rs1 >>> rs2;
            break;
          case "sra":
            this.ALURESULT = rs1 >> rs2;
            break;
          case "slt":
            this.ALURESULT = rs1 < rs2 ? 1 : 0;
            break;
          case "sltu":
            this.ALURESULT = Math.abs(rs1) < Math.abs(rs2) ? 1 : 0;
            break;
          case "addi":
            this.ALURESULT = rs1 + imm;
            break;
          case "xori":
            this.ALURESULT = rs1 ^ imm;
            break;
          case "ori":
            this.ALURESULT = rs1 | imm;
            break;
          case "andi":
            this.ALURESULT = rs1 & imm;
            break;
          case "slli":
            this.ALURESULT = rs1 << imm;
            break;
          case "srli":
            this.ALURESULT = rs1 >> imm;
            break;
          case "srai":
            this.ALURESULT = rs1 >> imm;
            break;
          case "slti":
            this.ALURESULT = rs1 < imm ? 1 : 0;
            break;
          case "sltiu":
            this.ALURESULT = Math.abs(rs1) < Math.abs(imm) ? 1 : 0;
            break;
          case "lb":
          case "lh":
          case "lw":
          case "lbu":
          case "lhu":
          case "sb":
          case "sh":
          case "sw":
            this.ALURESULT = rs1 + imm;
            break;
          case "beq":
            if (rs1 == rs2) this.PC += (imm >> 2);
            else this.PC += 1;
            break;
          case "bne":
            if (rs1 != rs2) this.PC += (imm >> 2);
            else this.PC += 1;
            break;
          case "blt":
            if (rs1 < rs2) this.PC += (imm >> 2);
            else this.PC += 1;
            break;
          case "bge":
            if (rs1 >= rs2) this.PC += (imm >> 2);
            else this.PC += 1;
            break;
          case "bltu":
            if (Math.abs(rs1) < Math.abs(rs2)) this.PC += (imm >> 2);
            else this.PC += 1;
            break;
          case "bgeu":
            if (Math.abs(rs1) >= Math.abs(rs2)) this.PC += (imm >> 2);
            break;
          case "jal":
            this.ALURESULT = 4 * (this.PC + 1);
            this.PC += (imm >> 2);
            break;
          case "jalr":
            this.ALURESULT = 4 * (this.PC + 1);
            this.PC = (rs1 >> 2) + (imm >> 2);
            break;
          case "lui":
            this.ALURESULT = imm << 12;
            break;
          case "auipc":
            this.ALURESULT = 4*this.PC + (imm << 12);
            break;
            default:
                console.error("Error");
                break;
        }
    
    }

    memoryAccess() {
        function numberToHexString(number) {
            let hexString = number.toString(16);
            while (hexString.length < 8) hexString = "0" + hexString;
            return hexString;
        }
        let address = this.ALURESULT;
        if(this.OP[0] === 's'){
            let hexNum = numberToHexString(this.RS2);
            this.MEMORY[address] = hexNum[6] + hexNum[7];
            switch(this.OP[1]){
              case 'w':
                this.MEMORY[address+2] = hexNum[2]+hexNum[3];
                this.MEMORY[address+3] = hexNum[0]+hexNum[1];
              case 'h':
                this.MEMORY[address+1] = hexNum[4] + hexNum[5];
            }
        }
        else if(this.OP[0] === 'l'){
            let hexNum = '';
            switch(this.OP[1]){
                case 'w':
                    hexNum += this.MEMORY[address+3]===undefined?'00':this.MEMORY[address+3]  + this.MEMORY[address+2]===undefined?'00':this.MEMORY[address+2];
                case 'h':
                    hexNum += this.MEMORY[address+1]===undefined?'00':this.MEMORY[address+1];
                default:
                    hexNum += this.MEMORY[address]===undefined?'00':this.MEMORY[address];
            }

            let decimalNumber = parseInt(hexNum, 16);
            if(this.OP[2]!=='u'){
              switch(this.OP[1]){
                case 'b':
                  if(decimalNumber & 0xff) decimalNumber -= 0xff+1;
                case 'h':
                  if(decimalNumber & 0xffff) decimalNumber -= 0xffff+1;
                case 'w':
                  if(decimalNumber & 0xffffffff) decimalNumber -= 0xffffffff+1;
              }
            }
            this.ALURESULT = decimalNumber;
        }
    }

    writeBack() {
      if(Number(this.RD) !== 0) this.RF[this.RD] = this.ALURESULT;
    }
}