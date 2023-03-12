

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
        this.
        this.MEMORY = {}
    }

    fetch() {

    }

    decode() {

    }

    execute() {

    }

    memoryAccess() {
        function numberToHexString(number) {
            let hexString = number.toString(16);
            while (hexString.length < 8) {
              hexString = "0" + hexString;
            }
            return hexString;
        }
          


        if(this.OP === 'sb' || this.OP === 'sh' || this.OP === 'sw'){
            let hexNum = numberToHexString(this.RS2);
            let address = this.ALURESULT;
            this.MEMORY[address] = hexNum[6] + hexNum[7];
            if(this.OP === 'sh' || this.OP === 'sw'){
                this.MEMORY[address+1] = hexNum[4] + hexNum[5];
            }
            if(this.OP === 'sw'){
                this.MEMORY[address+2] = hexNum[2]+hexNum[3];
                this.MEMORY[address+3] = hexNum[0]+hexNum[1];
            }
        }

        else if(this.OP[0] === 'l'){
            let address = this.ALURESULT;
            let hexNum = '';
            switch(this.OP[1]){
                case 'w':
                    hexNum += this.MEMORY[address+3]===undefined?'00':this.MEMORY[address+3]  + this.MEMORY[address+2]===undefined?'00':this.MEMORY[address+2];
                case 'h':
                    hexNum += this.MEMORY[address+1]===undefined?'00':this.MEMORY[address+1];
                default:
                    hexNum += this.MEMORY[address]===undefined?'00':this.MEMORY[address];
            }
            this.ALURESULT = parseInt(hexNum, 16);
        }
    }

    writeBack() {

    }
}