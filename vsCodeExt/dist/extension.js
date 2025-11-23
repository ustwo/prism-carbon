"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/tiktoken/tiktoken_bg.cjs
var require_tiktoken_bg = __commonJS({
  "node_modules/tiktoken/tiktoken_bg.cjs"(exports2, module2) {
    var wasm;
    module2.exports.__wbg_set_wasm = function(val) {
      wasm = val;
    };
    var lTextDecoder = typeof TextDecoder === "undefined" ? (0, module2.require)("util").TextDecoder : TextDecoder;
    var cachedTextDecoder = new lTextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    var cachedUint8ArrayMemory0 = null;
    function getUint8ArrayMemory0() {
      if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
      }
      return cachedUint8ArrayMemory0;
    }
    function getStringFromWasm0(ptr, len) {
      ptr = ptr >>> 0;
      return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }
    var heap = new Array(128).fill(void 0);
    heap.push(void 0, null, true, false);
    var heap_next = heap.length;
    function addHeapObject(obj) {
      if (heap_next === heap.length) heap.push(heap.length + 1);
      const idx = heap_next;
      heap_next = heap[idx];
      heap[idx] = obj;
      return idx;
    }
    function handleError(f, args) {
      try {
        return f.apply(this, args);
      } catch (e) {
        wasm.__wbindgen_export_0(addHeapObject(e));
      }
    }
    function getObject(idx) {
      return heap[idx];
    }
    function dropObject(idx) {
      if (idx < 132) return;
      heap[idx] = heap_next;
      heap_next = idx;
    }
    function takeObject(idx) {
      const ret = getObject(idx);
      dropObject(idx);
      return ret;
    }
    var WASM_VECTOR_LEN = 0;
    var lTextEncoder = typeof TextEncoder === "undefined" ? (0, module2.require)("util").TextEncoder : TextEncoder;
    var cachedTextEncoder = new lTextEncoder("utf-8");
    var encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
      return cachedTextEncoder.encodeInto(arg, view);
    } : function(arg, view) {
      const buf = cachedTextEncoder.encode(arg);
      view.set(buf);
      return {
        read: arg.length,
        written: buf.length
      };
    };
    function passStringToWasm0(arg, malloc, realloc) {
      if (realloc === void 0) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr2 = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr2;
      }
      let len = arg.length;
      let ptr = malloc(len, 1) >>> 0;
      const mem = getUint8ArrayMemory0();
      let offset = 0;
      for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 127) break;
        mem[ptr + offset] = code;
      }
      if (offset !== len) {
        if (offset !== 0) {
          arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
      }
      WASM_VECTOR_LEN = offset;
      return ptr;
    }
    function isLikeNone(x) {
      return x === void 0 || x === null;
    }
    var cachedDataViewMemory0 = null;
    function getDataViewMemory0() {
      if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
      }
      return cachedDataViewMemory0;
    }
    var cachedUint32ArrayMemory0 = null;
    function getUint32ArrayMemory0() {
      if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
      }
      return cachedUint32ArrayMemory0;
    }
    function getArrayU32FromWasm0(ptr, len) {
      ptr = ptr >>> 0;
      return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
    }
    function passArray8ToWasm0(arg, malloc) {
      const ptr = malloc(arg.length * 1, 1) >>> 0;
      getUint8ArrayMemory0().set(arg, ptr / 1);
      WASM_VECTOR_LEN = arg.length;
      return ptr;
    }
    function passArray32ToWasm0(arg, malloc) {
      const ptr = malloc(arg.length * 4, 4) >>> 0;
      getUint32ArrayMemory0().set(arg, ptr / 4);
      WASM_VECTOR_LEN = arg.length;
      return ptr;
    }
    function getArrayU8FromWasm0(ptr, len) {
      ptr = ptr >>> 0;
      return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
    }
    module2.exports.get_encoding = function(encoding, extend_special_tokens) {
      if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(encoding, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        wasm.get_encoding(retptr, ptr0, len0, addHeapObject(extend_special_tokens));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
          throw takeObject(r1);
        }
        return Tiktoken.__wrap(r0);
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    };
    module2.exports.encoding_for_model = function(model, extend_special_tokens) {
      if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(model, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        wasm.encoding_for_model(retptr, ptr0, len0, addHeapObject(extend_special_tokens));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
          throw takeObject(r1);
        }
        return Tiktoken.__wrap(r0);
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    };
    module2.exports.get_encoding_name_for_model = function(model) {
      if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
      let deferred3_0;
      let deferred3_1;
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(model, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        wasm.get_encoding_name_for_model(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
          ptr2 = 0;
          len2 = 0;
          throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_3(deferred3_0, deferred3_1, 1);
      }
    };
    var TiktokenFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
    }, unregister: () => {
    } } : new FinalizationRegistry((ptr) => wasm.__wbg_tiktoken_free(ptr >>> 0, 1));
    var Tiktoken = class _Tiktoken {
      /**
       * @param {string} tiktoken_bfe
       * @param {any} special_tokens
       * @param {string} pat_str
       */
      constructor(tiktoken_bfe, special_tokens, pat_str) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        const ptr0 = passStringToWasm0(tiktoken_bfe, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(pat_str, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.tiktoken_new(ptr0, len0, addHeapObject(special_tokens), ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        TiktokenFinalization.register(this, this.__wbg_ptr, this);
        return this;
      }
      /** @returns {string | undefined} */
      get name() {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.tiktoken_name(retptr, this.__wbg_ptr);
          var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
          var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
          let v1;
          if (r0 !== 0) {
            v1 = getStringFromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_3(r0, r1 * 1, 1);
          }
          return v1;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(_Tiktoken.prototype);
        obj.__wbg_ptr = ptr;
        TiktokenFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
      }
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TiktokenFinalization.unregister(this);
        return ptr;
      }
      free() {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tiktoken_free(ptr, 0);
      }
      /**
       * @param {string} text
       * @param {any} allowed_special
       * @param {any} disallowed_special
       * @returns {Uint32Array}
       */
      encode(text, allowed_special, disallowed_special) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
          const len0 = WASM_VECTOR_LEN;
          wasm.tiktoken_encode(retptr, this.__wbg_ptr, ptr0, len0, addHeapObject(allowed_special), addHeapObject(disallowed_special));
          var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
          var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
          var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
          var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
          if (r3) {
            throw takeObject(r2);
          }
          var v2 = getArrayU32FromWasm0(r0, r1).slice();
          wasm.__wbindgen_export_3(r0, r1 * 4, 4);
          return v2;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
       * @param {string} text
       * @returns {Uint32Array}
       */
      encode_ordinary(text) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
          const len0 = WASM_VECTOR_LEN;
          wasm.tiktoken_encode_ordinary(retptr, this.__wbg_ptr, ptr0, len0);
          var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
          var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
          var v2 = getArrayU32FromWasm0(r0, r1).slice();
          wasm.__wbindgen_export_3(r0, r1 * 4, 4);
          return v2;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
       * @param {string} text
       * @param {any} allowed_special
       * @param {any} disallowed_special
       * @returns {any}
       */
      encode_with_unstable(text, allowed_special, disallowed_special) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
          const len0 = WASM_VECTOR_LEN;
          wasm.tiktoken_encode_with_unstable(retptr, this.__wbg_ptr, ptr0, len0, addHeapObject(allowed_special), addHeapObject(disallowed_special));
          var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
          var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
          var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
       * @param {Uint8Array} bytes
       * @returns {number}
       */
      encode_single_token(bytes) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tiktoken_encode_single_token(this.__wbg_ptr, ptr0, len0);
        return ret >>> 0;
      }
      /**
       * @param {Uint32Array} tokens
       * @returns {Uint8Array}
       */
      decode(tokens) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          const ptr0 = passArray32ToWasm0(tokens, wasm.__wbindgen_export_1);
          const len0 = WASM_VECTOR_LEN;
          wasm.tiktoken_decode(retptr, this.__wbg_ptr, ptr0, len0);
          var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
          var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
          var v2 = getArrayU8FromWasm0(r0, r1).slice();
          wasm.__wbindgen_export_3(r0, r1 * 1, 1);
          return v2;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
       * @param {number} token
       * @returns {Uint8Array}
       */
      decode_single_token_bytes(token) {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.tiktoken_decode_single_token_bytes(retptr, this.__wbg_ptr, token);
          var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
          var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
          var v1 = getArrayU8FromWasm0(r0, r1).slice();
          wasm.__wbindgen_export_3(r0, r1 * 1, 1);
          return v1;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /** @returns {any} */
      token_byte_values() {
        if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
        const ret = wasm.tiktoken_token_byte_values(this.__wbg_ptr);
        return takeObject(ret);
      }
    };
    module2.exports.Tiktoken = Tiktoken;
    module2.exports.__wbg_parse_def2e24ef1252aff = function() {
      return handleError(function(arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
      }, arguments);
    };
    module2.exports.__wbg_stringify_f7ed6987935b4a24 = function() {
      return handleError(function(arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
      }, arguments);
    };
    module2.exports.__wbindgen_error_new = function(arg0, arg1) {
      const ret = new Error(getStringFromWasm0(arg0, arg1));
      return addHeapObject(ret);
    };
    module2.exports.__wbindgen_is_undefined = function(arg0) {
      const ret = getObject(arg0) === void 0;
      return ret;
    };
    module2.exports.__wbindgen_object_drop_ref = function(arg0) {
      takeObject(arg0);
    };
    module2.exports.__wbindgen_string_get = function(arg0, arg1) {
      if (wasm == null) throw new Error("tiktoken: WASM binary has not been propery initialized.");
      const obj = getObject(arg1);
      const ret = typeof obj === "string" ? obj : void 0;
      var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
      var len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    module2.exports.__wbindgen_throw = function(arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    };
  }
});

// node_modules/tiktoken/tiktoken.cjs
var require_tiktoken = __commonJS({
  "node_modules/tiktoken/tiktoken.cjs"(exports2) {
    var wasm = require_tiktoken_bg();
    var imports = {};
    imports["./tiktoken_bg.js"] = wasm;
    var path = require("path");
    var fs = require("fs");
    var candidates = __dirname.split(path.sep).reduce((memo, _, index, array) => {
      const prefix = array.slice(0, index + 1).join(path.sep) + path.sep;
      if (!prefix.includes("node_modules" + path.sep)) {
        memo.unshift(
          path.join(
            prefix,
            "node_modules",
            "tiktoken",
            "",
            "./tiktoken_bg.wasm"
          )
        );
      }
      return memo;
    }, []);
    candidates.unshift(path.join(__dirname, "./tiktoken_bg.wasm"));
    var bytes = null;
    for (const candidate of candidates) {
      try {
        bytes = fs.readFileSync(candidate);
        break;
      } catch {
      }
    }
    if (bytes == null) throw new Error("Missing tiktoken_bg.wasm");
    var wasmModule = new WebAssembly.Module(bytes);
    var wasmInstance = new WebAssembly.Instance(wasmModule, imports);
    wasm.__wbg_set_wasm(wasmInstance.exports);
    exports2["get_encoding"] = wasm["get_encoding"];
    exports2["encoding_for_model"] = wasm["encoding_for_model"];
    exports2["get_encoding_name_for_model"] = wasm["get_encoding_name_for_model"];
    exports2["Tiktoken"] = wasm["Tiktoken"];
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var import_tiktoken = __toESM(require_tiktoken());
function activate(context) {
  var barManager = new statusBarManager();
  const treeDataProvider = new MyTreeDataProvider();
  vscode.window.registerTreeDataProvider(
    "myPrimaryView",
    treeDataProvider
  );
  function convert(x) {
    treeDataProvider.addMessage(String(x));
    return x;
  }
  function getTextAroundCursor(linesBefore = 150, linesAfter = 150) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return "";
    }
    const docu = editor.document;
    const cursorPos = editor.selection.active;
    const startLine = Math.max(0, cursorPos.line - linesBefore);
    const endLine = Math.min(docu.lineCount - 1, cursorPos.line + linesAfter);
    const start = new vscode.Position(startLine, 0);
    const end = new vscode.Position(endLine, docu.lineAt(endLine).text.length);
    const range = new vscode.Range(start, end);
    return docu.getText(range);
  }
  var accept = false;
  const disposables = [];
  const aiCommands = [
    "editor.action.inlineSuggest.trigger",
    "github.copilot.generate",
    "cursor._executeCompletionItemProvider"
  ];
  const inline = vscode.commands.registerCommand("vsCodeExt.wrappedInline", async () => {
    accept = true;
    vscode.window.showInformationMessage("in wrapped inline" + String(accept));
    await vscode.commands.executeCommand("editor.action.inlineSuggest.commit");
  });
  disposables.push(vscode.workspace.onDidChangeTextDocument(async (evt) => {
    const enc = await (0, import_tiktoken.encoding_for_model)("gpt-4o");
    if (accept) {
      for (const change of evt.contentChanges) {
        if (change.text.length > 2) {
          const tokens = enc.encode(change.text + getTextAroundCursor());
          convert(tokens.length);
        }
      }
      accept = false;
    }
  }));
  console.log('Congratulations, your extension "vsCodeExt" is now active!');
  const disposable = vscode.commands.registerCommand("vsCodeExt.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from EstimatingCarbon!");
  });
  const input = vscode.commands.registerCommand("vsCodeExt.inputdisplay", async () => {
    const limit = await vscode.window.showInputBox({
      //opens an input box currently representing the carbon footprint
      prompt: "enter your carbon limit",
      placeHolder: "eg. 5",
      ignoreFocusOut: true
      // keep input box open even if focus moves away from window
    });
    var num = Number(limit);
    barManager.updateBar(num, 8);
    treeDataProvider.addMessage("Carbon Emissions level: " + num);
  });
  context.subscriptions.push(input);
  context.subscriptions.push(inline);
  context.subscriptions.push(disposable);
}
function deactivate() {
}
var MyTreeDataProvider = class {
  _onDidChangeTreeData = new vscode.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  items = [];
  //creates a list of tree items starts empty obviously
  constructor() {
    this.items.push(new vscode.TreeItem(
      "Emission Levels:",
      vscode.TreeItemCollapsibleState.None
    ));
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.items);
    }
  }
  addMessage(message) {
    this.items.push(new vscode.TreeItem(
      //adds a new item to the side bar
      message,
      vscode.TreeItemCollapsibleState.None
    ));
    this._onDidChangeTreeData.fire();
  }
};
var statusBarManager = class {
  mainItem = vscode.window.createStatusBarItem();
  //creates a status bar item for limit word
  loading = [];
  //creates a list of statusbar items for the loading bar items
  defaultColour = "statusBarItem.activeBackground";
  newColour;
  constructor() {
    this.newColour = this.defaultColour;
    this.mainItem.text = "Limit:";
    this.mainItem.show();
  }
  updateBar(input, limit) {
    if (input) {
      if (input >= limit) {
        this.newColour = "statusBarItem.errorBackground";
        vscode.window.showInformationMessage("passed limit");
      } else {
        this.newColour = "statusBarItem.warningBackground";
        vscode.window.showInformationMessage("below limit");
      }
      var i = 0;
    } else {
      this.newColour = "statusBarItem.activeBackground";
      input = 0;
      vscode.window.showInformationMessage("not satisfied!");
    }
    this.mainItem.backgroundColor = new vscode.ThemeColor(this.newColour);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
