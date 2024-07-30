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
const gb_1 = __importStar(require("./gb"));
const mmu_1 = __importDefault(require("./mmu"));
const ppu_1 = __importDefault(require("./ppu"));
require("index.less");
// Vertex shader source code
const shaderSourceVS = `
precision mediump float;
in vec2 pos;
out vec2 frag_texcoord;

void main() {
    vec2 screenpos = 2.0 * pos - vec2(1.0, 1.0);
    gl_Position = vec4(screenpos.xy, 0.0, 1.0);
    frag_texcoord.xy = vec2(pos.x, 1.0 - pos.y);
}
`;
// Fragment shader source code without the grid effect
const shaderSourceFS = `
precision mediump float;
in vec2 frag_texcoord;
out vec4 frag_color;
uniform sampler2D tex;
uniform sampler2D tex_palette;

void main() {
    float pal0 = texture(tex, frag_texcoord.xy).r;
    vec3 r_color = texture(tex_palette, vec2(pal0, 0.0)).rgb;
    frag_color = vec4(r_color, 1.0);
}
`;
function glCreateProgram(gl, vs, fs) {
    const program = gl.createProgram();
    if (!program) {
        throw ('Unable to create program');
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw ('Unable to link program ' + gl.getProgramInfoLog(program));
    }
    return program;
}
function glCompileShader(gl, src, shaderType) {
    const shader = gl.createShader(shaderType);
    if (!shader) {
        throw ('Unable to create shader of type ' + shaderType);
    }
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw ('Unable to compile shader ' + src + ' ' + gl.getShaderInfoLog(shader));
    }
    return shader;
}
function updateClientSize() {
    const canvasElement = document.getElementById('gb-canvas');
    const scaleX = (document.body.clientWidth - 32) / 160;
    const scaleY = (document.body.clientHeight - 96) / 144;
    const scale = Math.floor(Math.max(1, Math.min(...[5, scaleX, scaleY])));
    canvasElement.width = 160 * scale;
    canvasElement.height = 144 * scale;
}
async function sceneInit() {
    const roms = [
        { title: 'ROM: Ball game', data: new Uint8Array(await (await fetch('roms/ballgame.gb')).arrayBuffer()) }
    ];
    updateClientSize();
    Array.from(document.getElementsByClassName('loading')).forEach((e) => e.style.display = 'none');
    Array.from(document.getElementsByClassName('loaded')).forEach((e) => e.style.display = 'inherit');
    let romIndex = 0;
    document.getElementById('rom-title').textContent = roms[romIndex].title;
    let mmu = new mmu_1.default(new Uint8Array(roms[romIndex].data));
    let ppu = new ppu_1.default(mmu);
    let gb = new gb_1.default(mmu);
    let gbTimer = new gb_1.GBTimer(mmu);
    const loadNewROM = () => {
        document.getElementById('rom-title').textContent = roms[romIndex].title;
        mmu = new mmu_1.default(new Uint8Array(roms[romIndex].data));
        ppu = new ppu_1.default(mmu);
        gb = new gb_1.default(mmu);
        gbTimer = new gb_1.GBTimer(mmu);
    };
    const canvasElement = document.getElementById('gb-canvas');
    const gl = canvasElement.getContext('webgl2');
    const texRender = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texRender);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 160, 144, 0, gl.RED, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const texPalette = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texPalette);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, 4, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([
        0x00, 0x00, 0x00,
        0x14, 0x00, 0x00,
        0x64, 0xFF, 0x64,
        0xFF, 0xFF, 0xFF, // white
    ]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const shaderFS = glCompileShader(gl, '#version 300 es\n' + shaderSourceFS, gl.FRAGMENT_SHADER);
    const shaderVS = glCompileShader(gl, '#version 300 es\n' + shaderSourceVS, gl.VERTEX_SHADER);
    const shaderProg = glCreateProgram(gl, shaderVS, shaderFS);
    gl.useProgram(shaderProg);
    const vb = gl.createBuffer();
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    const attribPos = gl.getAttribLocation(shaderProg, 'pos');
    const uniformTex = gl.getUniformLocation(shaderProg, 'tex');
    const uniformTexPalette = gl.getUniformLocation(shaderProg, 'tex_palette');
    gl.enableVertexAttribArray(attribPos);
    gl.vertexAttribPointer(attribPos, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    let accFrameCycles = 0;
    const maxFrameCycles = 17556;
    const animFrame = () => {
        while (accFrameCycles < maxFrameCycles) {
            const clks = gb.Step();
            ppu.Step(clks, true);
            gbTimer.Step(clks);
            accFrameCycles += clks;
        }
        accFrameCycles -= maxFrameCycles;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texPalette);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texRender);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 160, 144, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(ppu.getFramebuffer()));
        gl.useProgram(shaderProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.enableVertexAttribArray(attribPos);
        gl.uniform1i(uniformTex, 0);
        gl.uniform1i(uniformTexPalette, 1);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        window.requestAnimationFrame(animFrame);
    };
    document.addEventListener('keydown', (ev) => {
        switch (ev.code) {
            case 'ArrowUp':
                gb.ButtonOn(64 /* Button.Up */);
                break;
            case 'ArrowDown':
                gb.ButtonOn(128 /* Button.Down */);
                break;
            case 'ArrowLeft':
                gb.ButtonOn(32 /* Button.Left */);
                break;
            case 'ArrowRight':
                gb.ButtonOn(16 /* Button.Right */);
                break;
            case 'KeyX':
                gb.ButtonOn(1 /* Button.A */);
                break;
            case 'KeyZ':
                gb.ButtonOn(2 /* Button.B */);
                break;
            case 'Enter':
                gb.ButtonOn(8 /* Button.Start */);
                break;
            case 'Backspace':
                gb.ButtonOn(4 /* Button.Select */);
                break;
            case 'KeyN':
                romIndex = (romIndex == 0 ? (roms.length - 1) : (romIndex - 1));
                loadNewROM();
                break;
            case 'KeyM':
                romIndex = (romIndex + 1 == roms.length ? 0 : (romIndex + 1));
                loadNewROM();
                break;
            default:
        }
    });
    document.addEventListener('keyup', (ev) => {
        switch (ev.code) {
            case 'ArrowUp':
                gb.ButtonOff(64 /* Button.Up */);
                break;
            case 'ArrowDown':
                gb.ButtonOff(128 /* Button.Down */);
                break;
            case 'ArrowLeft':
                gb.ButtonOff(32 /* Button.Left */);
                break;
            case 'ArrowRight':
                gb.ButtonOff(16 /* Button.Right */);
                break;
            case 'KeyX':
                gb.ButtonOff(1 /* Button.A */);
                break;
            case 'KeyZ':
                gb.ButtonOff(2 /* Button.B */);
                break;
            case 'Enter':
                gb.ButtonOff(8 /* Button.Start */);
                break;
            case 'Backspace':
                gb.ButtonOff(4 /* Button.Select */);
                break;
            default:
        }
    });
    window.requestAnimationFrame(animFrame);
}
if (document.readyState === 'complete') {
    sceneInit();
}
else {
    window.onload = (ev) => sceneInit();
}
window.onresize = () => updateClientSize();
//# sourceMappingURL=index.js.map