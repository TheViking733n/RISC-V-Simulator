class Simulator {
    constructor() {
        this.CYCLE = 0;  // Cycle number
        this.PC = 0;     // Program counter
        this.INSTRUCTION = "";   // Stores current instruction from Fetch
        this.RF = new Array(32);   // Register file
        this.RF.fill(0);
        this.OP = "";   // Stores operator decoded from Decode
        this.RS1 = 0;  // 0 to 31 for each register
        this.RS2 = 0;  // 0 to 31 for each register
        this.RD = 0;  // 0 to 31 for each register
        this.IMM = 0; // Stores immediate value
        this.ALURESULT = 0; // Stores result of ALU
    }

    fetch() {

    }

    decode() {

    }

    execute() {

    }

    memoryAccess() {

    }

    writeBack() {

    }
}