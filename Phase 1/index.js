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
        this.MEMORY = {};

        // Now creating Instruction div elements
        for (let i = 0; i <= 50; i++) {
            let instructionDiv = document.createElement("div");
            instructionDiv.className = "instruction-row";
            instructionDiv.innerHTML = `<div class="instruction-addr">Addr: ${i}</div>
            <div class="instruction-hex">Hex: ${i}</div>
            <div class="instruction-decoded">Decoded: ${i}</div>`;
            document.getElementsByClassName("instructions")[0].appendChild(instructionDiv);
        }

        // Now creating Timeline div elements


        // Now creating register div elements
        for (let i = 0; i < 32; i++) {
          let registerDiv = document.createElement("div");
          registerDiv.className = "register-row";
          registerDiv.innerHTML = `<div class="register-name">x${i}</div>
          <div class="register-value">${this.RF[i]}</div>`;
          document.getElementById("register").getElementsByClassName("register-container")[0].appendChild(registerDiv);
        }

        // Now creating memory div elements
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
          document.getElementById("memory").getElementsByClassName("memory-container")[0].appendChild(memoryDiv);
        }
    }

    fetch() {

    }

    decode() {
      function toint(a) {
        let l = a.length
        let ans = 0
        let m = 1
        for (let i = l - 1; i >= 0; i--) {
            if (a[i] == '1') {
                ans = ans + m
            }
            m = m * 2
        }
    
        return ans
    }
    function negative(a) {
        let m = 1
        let ans = 0;
        for (let i = a.length - 1; i > 0; i--) {
            if (a[i] == '1') {
                ans += m;
            }
            m *= 2;
        }
        ans -= m;
        return ans
    }
    function tobin(a) {
        let s = "";
        if (a == '0') {
            a = 0
        }
        if (a == '1') {
            a = 1
        }
        if (a == '2') {
            a = 2
        }
        if (a == '3') {
            a = 3
        }
        if (a == '4') {
            a = 4
        }
        if (a == '5') {
            a = 5
        }
        if (a == '6') {
            a = 6
        }
        if (a == '7') {
            a = 7
        }
        if (a == '8') {
            a = 8
        }
        if (a == '9') {
            a = 9
        }
        if (a == 'A') {
            a = 10;
        }
        if (a == 'B') {
            a = 11;
        }
        if (a == 'C') {
            a = 12;
        }
        if (a == 'D') {
            a = 13;
        }
        if (a == 'E') {
            a = 14;
        }
        if (a == 'F') {
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
            s2 = s[i] + s2
        }
        return s2;
    
    }
    let s = "";
    let l = a.length
    for (let i = 0; i < l; i++) {
        let s1 = tobin(a[i])
        console.log()
        s = s + s1
    }
    let opcode = ""
    for (let i = 25; i < 32; i++) {
        opcode = opcode + s[i]
    }

    if (opcode == "0110011") {
        let ret = { op: "", rd: 0, rs1: 0, rs2: 0,imm: 0 }
        let r = ""
        for (let i = 20; i < 25; i++) {
            r = r + s[i]
        }
        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }

        let r1 = ""
        for (let i = 12; i < 17; i++) {
            r1 = r1 + s[i]
        }
        let r2 = ""
        for (let i = 7; i < 12; i++) {
            r2 = r2 + s[i]
        }

        let fun7 = ""
        for (let i = 0; i < 7; i++) {
            fun7 = fun7 + s[i]
        }
        ret.rs1 = toint(r1)
        ret.rs2 = toint(r2)
        ret.rd = toint(r)
        if (fun3 == "000" && fun7 == "0000000") {
            ret.op = "add"

        }
        else if (fun3 == "000" && fun7 == "0100000") {
            ret.op = "sub"
        }
        else if (fun3 == "100" && fun7 == "0000000") {
            ret.op = "xor"
        }
        else if (fun3 == "110" && fun7 == "0000000") {
            ret.op = "or"
        }
        else if (fun3 == "111" && fun7 == "0000000") {
            ret.op = "and"
        }
        else if (fun3 == "001" && fun7 == "0000000") {
            ret.op = "sll"
        }
        else if (fun3 == "101" && fun7 == "0000000") {
            ret.op = "srl"
        }
        else if (fun3 == "101" && fun7 == "0100000") {
            ret.op = "sra"
        }
        else if (fun3 == "010" && fun7 == "0000000") {
            ret.op = "slt"
        }
        else if (fun3 == "011" && fun7 == "0000000") {
            ret.op = "sltu"
        }

        return ret
    }

    else if (opcode == "0010011") {
        let ret = { op: 0, rd: 0, rs1: 0, imm:0,rs2:0 }
        let r = ""
        for (let i = 20; i < 25; i++) {
            r = r + s[i]
        }
        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }


        let r1 = ""
        for (let i = 12; i < 17; i++) {
            r1 = r1 + s[i]
        }

        let imm = ""
        for (let i = 0; i < 12; i++) {
            imm = imm + s[i]
        }

        let fun7 = ""
        for (let i = 0; i < 7; i++) {
            fun7 += imm[i]
        }

        ret.rs1 = toint(r1)
        ret.rd = toint(r)
        if (imm[0] == 1) {
            ret.imm = negative(imm)
        }
        else {
            ret.imm = toint(imm)

        }

        if (fun3 == "000") {
            ret.op = "add"

        }
        else if (fun3 == "100") {
            ret.op = "xor"
        }
        else if (fun3 == "110") {
            ret.op = "or"
        }
        else if (fun3 == "111") {
            ret.op = "and"
        }
        else if (fun3 == "001" && fun7 == "0000000") {
            ret.op = "sll"
        }
        else if (fun3 == "101" && fun7 == "0000000") {
            ret.op = "srl"
        }
        else if (fun3 == "101" && fun7 == "0100000") {
            ret.op = "sra"
        }
        else if (fun3 == "010") {
            ret.op = "slt"
        }
        else if (fun3 == "011") {
            ret.op = "sltu"
        }
        ret.op = ret.op + 'i'

        return ret

    }
    else if (opcode == "0000011") {
        let ret = { op: "", rd: 0, rs1: 0, imm: 0,rs2:0}
        let r = ""
        for (let i = 20; i < 25; i++) {
            r = r + s[i]
        }
        // console.log("rd : " + toint(r))
        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }

        // console.log("fun3 : " + fun3)

        let r1 = ""
        for (let i = 12; i < 17; i++) {
            r1 = r1 + s[i]
        }
        // console.log("rs1 : "+toint(r1))

        let imm = ""
        for (let i = 0; i < 12; i++) {
            imm = imm + s[i]
        }

        // console.log("imm : "+toint(imm))
        ret.rs1 = toint(r1)
        ret.rd = toint(r)
        if (imm[0] == "1") {

            ret.imm = tnegative(imm)
        }
        else {
            ret.imm = toint(imm)

        }

        if (fun3 == "000") {
            ret.op = "lb"
        }
        else if (fun3 == "001") {
            ret.op = "lh"
        }
        else if (fun3 == "010") {
            ret.op = "lw"
        }
        else if (fun3 == "100") {
            ret.op = "lbu"
        }
        else if (fun3 == "101") {
            ret.op = "lhu"
        }
        return ret

    }
    else if (opcode == "0100011") {
        let ret = { op: "", rs1: 0, rs2: 0, imm: 0,rd:0 }
        let imm = ""
        for (let i = 0; i < 7; i++) {
            imm = imm + s[i]
        }
        for (let i = 20; i < 25; i++) {
            imm = imm + s[i]
        }
        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }

        // console.log("fun3 : " + fun3)

        let rs1 = ""
        for (let i = 12; i < 17; i++) {
            rs1 = rs1 + s[i]
        }
        // console.log("rs1 : "+toint(rs1))

        let rs2 = ""
        for (let i = 7; i < 12; i++) {
            rs2 = rs2 + s[i]
        }

        // console.log("rs2 : "+toint(rs2))



        // console.log("fun7 : "+fun7)
        // console.log("imm : " + toint(imm))

        ret.rs1 = toint(rs1)
        ret.rs2 = toint(rs2)
        if (imm[0] == "1") {
            ret.imm = negative(imm)

        }
        else {
            ret.imm = toint(imm)

        }

        if (fun3 == "000") {
            ret.op = "sb"
        }
        else if (fun3 == "001") {
            ret.op = "sh"
        }
        else if (fun3 == "010") {
            ret.op = "sw"
        }

        return ret

    }

    else if (opcode == "1100011") {
        let ret = { op: "", rs1:0, rs2: 0, imm: 0,rd:0 }
        let imm = ""
        imm = imm + s[0]
        imm = imm + s[24]

        for (let i = 1; i < 7; i++) {
            imm = imm + s[i]
        }
        for (let i = 20; i < 25; i++) {
            imm = imm + s[i]
        }

        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }

        // console.log("fun3 : " + fun3)

        let rs1 = ""
        for (let i = 12; i < 17; i++) {
            rs1 = rs1 + s[i]
        }
        // console.log("rs1 : "+toint(rs1))

        let rs2 = ""
        for (let i = 7; i < 12; i++) {
            rs2 = rs2 + s[i]
        }

        // console.log("rs2 : "+toint(rs2))
        // console.log("imm : " + toint(imm))
        ret.rs1 = toint(rs1)
        ret.rs2 = toint(rs2)
        if (imm[0] == "1") {
            ret.imm = negative(imm)

        }
        else {
            ret.imm = toint(imm)

        }

        if (fun3 == "000") {
            ret.op = "beq"
        }
        else if (fun3 == "001") {
            ret.op = "bne"
        }
        else if (fun3 == "100") {
            ret.op = "blt"
        }
        else if (fun3 == "101") {
            ret.op = "bge"
        }
        else if (fun3 == "110") {
            ret.op = "bltu"
        }
        else if (fun3 == "111") {
            ret.op = "bgeu"
        }


        return ret

        // console.log("fun7 : "+fun7)



    }
    else if (opcode == "0110111" || opcode == "0010111") {
        let ret = { op: 0, rd: 0, imm: 0,rs1:0,rs2:0 }
        let rd = ""
        for (let i = 20; i < 25; i++) {
            rd = rd + s[i]
        }
        // console.log("rd : " + toint(rd))

        let imm = ""
        for (let i = 0; i < 20; i++) {
            imm = imm + s[i]
        }

        // console.log("imm : "+toint(imm))

        ret.rd = toint(rd)
        if (imm[0] == "1") {
            ret.imm = negative(imm)

        }
        else {
            ret.imm = toint(imm)

        }

        if (opcode == "0010111") {
            ret.op = "auipc"
        }
        else {
            ret.op = "lui"
        }

        return ret

    }
    else if (opcode == "1101111") {
        let ret = { op: "", rd: 0, imm: 0,rs1:0,rs2:0}
        let rd = ""
        for (let i = 20; i < 25; i++) {
            rd = rd + s[i]
        }
        // console.log("rd : " + toint(rd))

        let imm = ""
        imm = imm + s[0]
        for (let i = 12; i < 20; i++) {
            imm = imm + s[i]
        }
        imm = imm + s[11]
        for (let i = 1; i < 11; i++) {
            imm = imm + s[i]
        }
        imm += '0'

        // console.log("imm : "+toint(imm))

        ret.rd = toint(rd)
        if (imm[0] == "1") {
            ret.imm = negative(imm)

        }
        else {
            ret.imm = toint(imm)

        }
        ret.op = "jal"

        return ret

    }
    else if (opcode == "1100111") {
        let ret = { op: "", rd: 0, rs1: 0, imm: 0,rd:0 }
        let r = ""
        for (let i = 20; i < 25; i++) {
            r = r + s[i]
        }
        // console.log("rd : " + toint(r))
        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }

        // console.log("fun3 : " + fun3)

        let r1 = ""
        for (let i = 12; i < 17; i++) {
            r1 = r1 + s[i]
        }
        // console.log("rs1 : "+toint(r1))

        let imm = ""
        for (let i = 0; i < 12; i++) {
            imm = imm + s[i]
        }

        // console.log("imm : "+toint(imm))
        let fun7 = ""
        for (let i = 0; i < 7; i++) {
            fun7 += imm[i]
        }

        ret.rs1 = toint(r1)
        ret.rd = toint(r)
        if (imm[0] == "1") {
            ret.imm = negative(imm)

        }
        else {
            ret.imm = toint(imm)

        }

        if (fun3 == "000") {
            ret.op = "jalr"
        }

        return ret
    }
    else if (opcode == "1110011") {
        let ret = { op: "", rd: 0, rs1: 0, imm:0 ,rs2: 0 }
        let r = ""
        for (let i = 20; i < 25; i++) {
            r = r + s[i]
        }
        // console.log("rd : " + toint(r))
        let fun3 = ""

        for (let i = 17; i < 20; i++) {
            fun3 = fun3 + s[i]
        }

        // console.log("fun3 : " + fun3)

        let r1 = ""
        for (let i = 12; i < 17; i++) {
            r1 = r1 + s[i]
        }
        // console.log("rs1 : "+toint(r1))

        let imm = ""
        for (let i = 0; i < 12; i++) {
            imm = imm + s[i]
        }

        // console.log("imm : "+toint(imm))
        let fun7 = ""
        for (let i = 0; i < 7; i++) {
            fun7 += imm[i]
        }

        ret.rs1 = toint(r1)
        ret.rd = toint(r)
        if (imm[0] == "1") {
            ret.imm = negative(imm)

        }
        else {
            ret.imm = toint(imm)

        }
        imm = toint(imm)
        if (fun3 = "000") {
            if (imm == 0) {
                ret.op = "ecall"
            }
            else if (imm == 1) {
                ret.op = "ebreak"
            }
        }

        return ret
    }



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

var simulator = new Simulator();