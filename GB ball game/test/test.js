"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const gb_1 = __importStar(require("./../src/gb"));
const mmu_1 = __importDefault(require("./../src/mmu"));
const ppu_1 = __importDefault(require("../src/ppu"));
const fs_1 = __importDefault(require("fs"));
const tests = {};
const loadRom = (path) => fs_1.default.readFileSync(path);
const testRom = (path) => {
    console.log('Testing', path);
    const mmu = new mmu_1.default(loadRom(path));
    const ppu = new ppu_1.default(mmu);
    const gb = new gb_1.default(mmu);
    const gbTimer = new gb_1.GBTimer(mmu);
    let serialOut = '';
    let step = 0;
    while (true) {
        ++step;
        if (mmu.readReg(2 /* IORegister.SerialControl */) == 0x81) {
            const c = mmu.readReg(1 /* IORegister.SerialData */);
            serialOut += String.fromCharCode(c);
            mmu.writeReg(2 /* IORegister.SerialControl */, 0);
            if (serialOut.endsWith('Passed')) {
                return true;
            }
            if (serialOut.includes('Failed')) {
                assert_1.default.fail('Failed ' + path);
            }
        }
        const clks = gb.Step();
        ppu.Step(clks, true);
        gbTimer.Step(clks);
    }
};
testRom('./build/roms/cpu_instrs/individual/01-special.gb');
testRom('./build/roms/cpu_instrs/individual/02-interrupts.gb');
testRom('./build/roms/cpu_instrs/individual/03-op sp,hl.gb');
testRom('./build/roms/cpu_instrs/individual/04-op r,imm.gb');
testRom('./build/roms/cpu_instrs/individual/05-op rp.gb');
testRom('./build/roms/cpu_instrs/individual/06-ld r,r.gb');
testRom('./build/roms/cpu_instrs/individual/07-jr,jp,call,ret,rst.gb');
testRom('./build/roms/cpu_instrs/individual/08-misc instrs.gb');
testRom('./build/roms/cpu_instrs/individual/09-op r,r.gb');
testRom('./build/roms/cpu_instrs/individual/10-bit ops.gb');
testRom('./build/roms/cpu_instrs/individual/11-op a,(hl).gb');
// testRom('./build/roms/cpu_instrs/cpu_instrs.gb');
testRom('./build/roms/instr_timing/instr_timing.gb');
// testRom('./build/roms/bgbtest.gb');
// tests['foo'] = () => { assert.strictEqual(2, 3); }
for (let t in tests) {
    console.log('Test', t);
    tests[t]();
}
//# sourceMappingURL=test.js.map