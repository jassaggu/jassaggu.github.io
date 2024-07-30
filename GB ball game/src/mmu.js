"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemoryRange {
}
;
class MMU {
    mem;
    rom;
    // private mbc1RamEnable: boolean;
    // private mbc2RamEnable: boolean;
    mbc1RomBank;
    mbc2RomBank;
    // private mbc1RamBank: number;
    mbc1RomMode;
    mbc;
    constructor(rom) {
        this.rom = rom;
        this.mem = new Uint8Array(0x10000);
        // this.mbc1RamEnable = this.mbc2RamEnable = false;
        // this.mbc1RamBank = 0;
        this.mbc1RomMode = 0;
        this.mbc1RomBank = this.mbc2RomBank = 1;
        this.mbc = 0;
        switch (rom[0x147]) {
            case 0:
                this.mbc = 0;
                break;
            case 0x1:
            case 0x2:
            case 0x3:
                this.mbc = 1;
                break;
            case 0xF:
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
                this.mbc = 3;
                break;
            default:
                console.log('Unhandled rom type', rom[0x147]);
        }
        for (let i = 0; i < 0x8000; i++) {
            this.mem[i] = rom[i];
        }
    }
    read(addr) {
        if (addr >= 0x4000 && addr < 0x8000) {
            switch (this.mbc) {
                case 1:
                case 3:
                    if (this.mbc1RomBank) {
                        return this.rom[(this.mbc1RomBank << 14) + (addr & 0x3FFF)];
                    }
                    break;
                case 2:
                    if (this.mbc2RomBank) {
                        return this.rom[(this.mbc2RomBank << 14) + (addr & 0x3FFF)];
                    }
                    break;
            }
        }
        return this.mem[addr];
    }
    write(addr, v) {
        v &= 0xFF;
        if (addr >= 0xFF00) {
            if (addr == 0xFF46) {
                const dmaAddr = v << 8;
                for (let i = 0; i < 0xA0; i++) {
                    this.mem[0xFE00 + i] = this.mem[dmaAddr + i];
                }
                return;
            }
        }
        switch (this.mbc) {
            case 1:
            case 3:
                if (addr < 0x2000) {
                    // this.mbc1RamEnable = v > 0;
                }
                else if (addr < 0x4000) {
                    this.mbc1RomBank = v & 0x1F;
                    if (v == 0x00 || v == 0x20 || v == 0x40 || v == 0x60) {
                        ++this.mbc1RomBank;
                    }
                }
                else if (addr < 0x6000) {
                    if (this.mbc1RomMode == 0) {
                        this.mbc1RomBank |= (v & 3) << 5;
                    }
                    else {
                        this.mbc1RomBank = v & 3;
                    }
                }
                else if (addr < 0x8000) {
                    this.mbc1RomMode = v > 0 ? 1 : 0;
                }
                else {
                    this.mem[addr] = v;
                }
                break;
            case 2:
                if (addr < 0x2000) {
                    // this.mbc2RamEnable = v > 0;
                }
                else if (addr < 0x4000) {
                    this.mbc2RomBank = v & 0x1F;
                    if (v == 0x00 || v == 0x20 || v == 0x40 || v == 0x60) {
                        ++this.mbc2RomBank;
                    }
                }
                else if (addr >= 0x8000) {
                    this.mem[addr] = v;
                }
                break;
            case 0:
            default:
                if (addr >= 0x8000) {
                    this.mem[addr] = v;
                }
                break;
        }
    }
    readReg(reg) {
        return this.read(65280 /* MMUBase.REGS */ + reg);
    }
    writeReg(reg, v) {
        this.write(65280 /* MMUBase.REGS */ | reg, v);
    }
}
exports.default = MMU;
//# sourceMappingURL=mmu.js.map