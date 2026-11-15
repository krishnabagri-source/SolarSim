import struct

def leb128_u(val):
    res = bytearray()
    while True:
        b = val & 0x7f
        val >>= 7
        if val != 0:
            b |= 0x80
            res.append(b)
        else:
            res.append(b)
            break
    return bytes(res)

def leb128_s(val):
    res = bytearray()
    more = True
    while more:
        b = val & 0x7f
        val >>= 7
        if (val == 0 and (b & 0x40) == 0) or (val == -1 and (b & 0x40) != 0):
            more = False
        else:
            b |= 0x80
        res.append(b)
    return bytes(res)

def make_section(sec_id, payload):
    return bytes([sec_id]) + leb128_u(len(payload)) + payload

# WASM Type bytes
I32 = 0x7F
I64 = 0x7E
F32 = 0x7D
F64 = 0x7C

# Opcodes
UNREACHABLE = 0x00
NOP = 0x01
BLOCK = 0x02
LOOP = 0x03
IF = 0x04
ELSE = 0x05
END = 0x0B
BR = 0x0C
BR_IF = 0x0D
RETURN = 0x0F
CALL = 0x10
DROP = 0x1A

LOCAL_GET = 0x20
LOCAL_SET = 0x21
LOCAL_TEE = 0x22

I32_LOAD = 0x28
F64_LOAD = 0x2B
I32_STORE = 0x36
F64_STORE = 0x39

I32_CONST = 0x41
I64_CONST = 0x42
F64_CONST = 0x44

I32_EQZ = 0x45
I32_EQ = 0x46
I32_NE = 0x47
I32_LT_S = 0x48
I32_LE_S = 0x4C
I32_GE_S = 0x4E

I32_ADD = 0x6A
I32_SUB = 0x6B
I32_MUL = 0x6C
I32_AND = 0x71
I32_SHL = 0x74

F64_ADD = 0xA0
F64_SUB = 0xA1
F64_MUL = 0xA2
F64_DIV = 0xA3

# -------------------------------------------------------------
# Function 0: simpsons_one_third(ptr: i32, length: i32, h: f64) -> f64
# Locals:
#   0: ptr (i32)
#   1: length (i32)
#   2: h (f64)
#   --- local variables ---
#   3: n (i32)
#   4: i (i32)
#   5: endpoint_sum (f64)
#   6: odd_sum (f64)
#   7: even_sum (f64)
# -------------------------------------------------------------
b0 = bytearray()

# n = length - 1
b0.append(LOCAL_GET); b0.extend(leb128_u(1))
b0.append(I32_CONST); b0.extend(leb128_s(1))
b0.append(I32_SUB)
b0.append(LOCAL_SET); b0.extend(leb128_u(3))

# if (n <= 0 || (n & 1) != 0) return 0.0;
b0.append(LOCAL_GET); b0.extend(leb128_u(3))
b0.append(I32_CONST); b0.extend(leb128_s(0))
b0.append(I32_LE_S)
b0.append(LOCAL_GET); b0.extend(leb128_u(3))
b0.append(I32_CONST); b0.extend(leb128_s(1))
b0.append(I32_AND)
b0.append(I32_ADD)
b0.append(IF); b0.append(0x40)
b0.append(F64_CONST); b0.extend(struct.pack('<d', 0.0))
b0.append(RETURN)
b0.append(END)

# endpoint_sum = y[0] + y[n]
b0.append(LOCAL_GET); b0.extend(leb128_u(0))
b0.append(F64_LOAD); b0.append(3); b0.append(0)

b0.append(LOCAL_GET); b0.extend(leb128_u(0))
b0.append(LOCAL_GET); b0.extend(leb128_u(3))
b0.append(I32_CONST); b0.extend(leb128_s(3))
b0.append(I32_SHL) # n * 8
b0.append(I32_ADD)
b0.append(F64_LOAD); b0.append(3); b0.append(0)

b0.append(F64_ADD)
b0.append(LOCAL_SET); b0.extend(leb128_u(5))

# odd_sum = 0.0
b0.append(F64_CONST); b0.extend(struct.pack('<d', 0.0))
b0.append(LOCAL_SET); b0.extend(leb128_u(6))

# i = 1
b0.append(I32_CONST); b0.extend(leb128_s(1))
b0.append(LOCAL_SET); b0.extend(leb128_u(4))

# Loop odd_sum: for (i = 1; i < n; i += 2)
b0.append(BLOCK); b0.append(0x40)
b0.append(LOOP); b0.append(0x40)
b0.append(LOCAL_GET); b0.extend(leb128_u(4))
b0.append(LOCAL_GET); b0.extend(leb128_u(3))
b0.append(I32_GE_S)
b0.append(BR_IF); b0.extend(leb128_u(1))

# odd_sum += y[i]
b0.append(LOCAL_GET); b0.extend(leb128_u(6))
b0.append(LOCAL_GET); b0.extend(leb128_u(0))
b0.append(LOCAL_GET); b0.extend(leb128_u(4))
b0.append(I32_CONST); b0.extend(leb128_s(3))
b0.append(I32_SHL)
b0.append(I32_ADD)
b0.append(F64_LOAD); b0.append(3); b0.append(0)
b0.append(F64_ADD)
b0.append(LOCAL_SET); b0.extend(leb128_u(6))

# i += 2
b0.append(LOCAL_GET); b0.extend(leb128_u(4))
b0.append(I32_CONST); b0.extend(leb128_s(2))
b0.append(I32_ADD)
b0.append(LOCAL_SET); b0.extend(leb128_u(4))

b0.append(BR); b0.extend(leb128_u(0))
b0.append(END)
b0.append(END)

# even_sum = 0.0
b0.append(F64_CONST); b0.extend(struct.pack('<d', 0.0))
b0.append(LOCAL_SET); b0.extend(leb128_u(7))

# i = 2
b0.append(I32_CONST); b0.extend(leb128_s(2))
b0.append(LOCAL_SET); b0.extend(leb128_u(4))

# Loop even_sum: for (i = 2; i < n; i += 2)
b0.append(BLOCK); b0.append(0x40)
b0.append(LOOP); b0.append(0x40)
b0.append(LOCAL_GET); b0.extend(leb128_u(4))
b0.append(LOCAL_GET); b0.extend(leb128_u(3))
b0.append(I32_GE_S)
b0.append(BR_IF); b0.extend(leb128_u(1))

# even_sum += y[i]
b0.append(LOCAL_GET); b0.extend(leb128_u(7))
b0.append(LOCAL_GET); b0.extend(leb128_u(0))
b0.append(LOCAL_GET); b0.extend(leb128_u(4))
b0.append(I32_CONST); b0.extend(leb128_s(3))
b0.append(I32_SHL)
b0.append(I32_ADD)
b0.append(F64_LOAD); b0.append(3); b0.append(0)
b0.append(F64_ADD)
b0.append(LOCAL_SET); b0.extend(leb128_u(7))

# i += 2
b0.append(LOCAL_GET); b0.extend(leb128_u(4))
b0.append(I32_CONST); b0.extend(leb128_s(2))
b0.append(I32_ADD)
b0.append(LOCAL_SET); b0.extend(leb128_u(4))

b0.append(BR); b0.extend(leb128_u(0))
b0.append(END)
b0.append(END)

# return (h / 3.0) * (endpoint_sum + 4.0 * odd_sum + 2.0 * even_sum)
b0.append(LOCAL_GET); b0.extend(leb128_u(2))
b0.append(F64_CONST); b0.extend(struct.pack('<d', 3.0))
b0.append(F64_DIV)

b0.append(LOCAL_GET); b0.extend(leb128_u(5)) # endpoint_sum
b0.append(F64_CONST); b0.extend(struct.pack('<d', 4.0))
b0.append(LOCAL_GET); b0.extend(leb128_u(6)) # odd_sum
b0.append(F64_MUL)
b0.append(F64_ADD)

b0.append(F64_CONST); b0.extend(struct.pack('<d', 2.0))
b0.append(LOCAL_GET); b0.extend(leb128_u(7)) # even_sum
b0.append(F64_MUL)
b0.append(F64_ADD)

b0.append(F64_MUL)
b0.append(END)

# Func 0 local declarations: 2 x i32, 3 x f64
func0_locals = leb128_u(2) + leb128_u(2) + bytes([I32]) + leb128_u(3) + bytes([F64])
func0_body = leb128_u(len(func0_locals) + len(b0)) + func0_locals + b0

# -------------------------------------------------------------
# Function 1: trapezoidal_rule(ptr: i32, length: i32, h: f64) -> f64
# Locals:
#   0: ptr (i32)
#   1: length (i32)
#   2: h (f64)
#   --- local variables ---
#   3: n (i32)
#   4: i (i32)
#   5: interior_sum (f64)
# -------------------------------------------------------------
b1 = bytearray()

# n = length - 1
b1.append(LOCAL_GET); b1.extend(leb128_u(1))
b1.append(I32_CONST); b1.extend(leb128_s(1))
b1.append(I32_SUB)
b1.append(LOCAL_SET); b1.extend(leb128_u(3))

# if (n <= 0) return 0.0;
b1.append(LOCAL_GET); b1.extend(leb128_u(3))
b1.append(I32_CONST); b1.extend(leb128_s(0))
b1.append(I32_LE_S)
b1.append(IF); b1.append(0x40)
b1.append(F64_CONST); b1.extend(struct.pack('<d', 0.0))
b1.append(RETURN)
b1.append(END)

# interior_sum = 0.0
b1.append(F64_CONST); b1.extend(struct.pack('<d', 0.0))
b1.append(LOCAL_SET); b1.extend(leb128_u(5))

# i = 1
b1.append(I32_CONST); b1.extend(leb128_s(1))
b1.append(LOCAL_SET); b1.extend(leb128_u(4))

# Loop: for (i = 1; i < n; i++)
b1.append(BLOCK); b1.append(0x40)
b1.append(LOOP); b1.append(0x40)
b1.append(LOCAL_GET); b1.extend(leb128_u(4))
b1.append(LOCAL_GET); b1.extend(leb128_u(3))
b1.append(I32_GE_S)
b1.append(BR_IF); b1.extend(leb128_u(1))

# interior_sum += y[i]
b1.append(LOCAL_GET); b1.extend(leb128_u(5))
b1.append(LOCAL_GET); b1.extend(leb128_u(0))
b1.append(LOCAL_GET); b1.extend(leb128_u(4))
b1.append(I32_CONST); b1.extend(leb128_s(3))
b1.append(I32_SHL)
b1.append(I32_ADD)
b1.append(F64_LOAD); b1.append(3); b1.append(0)
b1.append(F64_ADD)
b1.append(LOCAL_SET); b1.extend(leb128_u(5))

# i++
b1.append(LOCAL_GET); b1.extend(leb128_u(4))
b1.append(I32_CONST); b1.extend(leb128_s(1))
b1.append(I32_ADD)
b1.append(LOCAL_SET); b1.extend(leb128_u(4))

b1.append(BR); b1.extend(leb128_u(0))
b1.append(END)
b1.append(END)

# return (h / 2.0) * (y[0] + y[n] + 2.0 * interior_sum)
b1.append(LOCAL_GET); b1.extend(leb128_u(2))
b1.append(F64_CONST); b1.extend(struct.pack('<d', 2.0))
b1.append(F64_DIV)

# y[0]
b1.append(LOCAL_GET); b1.extend(leb128_u(0))
b1.append(F64_LOAD); b1.append(3); b1.append(0)

# y[n]
b1.append(LOCAL_GET); b1.extend(leb128_u(0))
b1.append(LOCAL_GET); b1.extend(leb128_u(3))
b1.append(I32_CONST); b1.extend(leb128_s(3))
b1.append(I32_SHL)
b1.append(I32_ADD)
b1.append(F64_LOAD); b1.append(3); b1.append(0)
b1.append(F64_ADD)

# 2.0 * interior_sum
b1.append(F64_CONST); b1.extend(struct.pack('<d', 2.0))
b1.append(LOCAL_GET); b1.extend(leb128_u(5))
b1.append(F64_MUL)
b1.append(F64_ADD)

b1.append(F64_MUL)
b1.append(END)

# Func 1 local declarations: 2 x i32, 1 x f64
func1_locals = leb128_u(2) + leb128_u(2) + bytes([I32]) + leb128_u(1) + bytes([F64])
func1_body = leb128_u(len(func1_locals) + len(b1)) + func1_locals + b1

# -------------------------------------------------------------
# Function 2: compute_audit(p_gen_ptr: i32, p_cons_ptr: i32, length: i32, h: f64, out_ptr: i32) -> i32
# Computes Simpson & Trapezoidal for Gen, Cons, Net, differences,
# and stores into out_ptr (array of 10 x f64):
#   out[0]: e_gen_simp
#   out[1]: e_cons_simp
#   out[2]: e_net_simp
#   out[3]: e_gen_trap
#   out[4]: e_cons_trap
#   out[5]: e_net_trap
#   out[6]: diff_gen
#   out[7]: diff_cons
#   out[8]: diff_net
# Returns 0 on success, -1 on invalid n.
# Locals:
#   0: p_gen_ptr (i32)
#   1: p_cons_ptr (i32)
#   2: length (i32)
#   3: h (f64)
#   4: out_ptr (i32)
#   --- local variables ---
#   5: n (i32)
#   6: g_s (f64)
#   7: c_s (f64)
#   8: g_t (f64)
#   9: c_t (f64)
# -------------------------------------------------------------
b2 = bytearray()

# n = length - 1
b2.append(LOCAL_GET); b2.extend(leb128_u(2))
b2.append(I32_CONST); b2.extend(leb128_s(1))
b2.append(I32_SUB)
b2.append(LOCAL_SET); b2.extend(leb128_u(5))

# if (n <= 0 || (n & 1) != 0) return -1;
b2.append(LOCAL_GET); b2.extend(leb128_u(5))
b2.append(I32_CONST); b2.extend(leb128_s(0))
b2.append(I32_LE_S)
b2.append(LOCAL_GET); b2.extend(leb128_u(5))
b2.append(I32_CONST); b2.extend(leb128_s(1))
b2.append(I32_AND)
b2.append(I32_ADD)
b2.append(IF); b2.append(0x40)
b2.append(I32_CONST); b2.extend(leb128_s(-1))
b2.append(RETURN)
b2.append(END)

# g_s = simpsons_one_third(p_gen_ptr, length, h)
b2.append(LOCAL_GET); b2.extend(leb128_u(0))
b2.append(LOCAL_GET); b2.extend(leb128_u(2))
b2.append(LOCAL_GET); b2.extend(leb128_u(3))
b2.append(CALL); b2.extend(leb128_u(0))
b2.append(LOCAL_SET); b2.extend(leb128_u(6))

# c_s = simpsons_one_third(p_cons_ptr, length, h)
b2.append(LOCAL_GET); b2.extend(leb128_u(1))
b2.append(LOCAL_GET); b2.extend(leb128_u(2))
b2.append(LOCAL_GET); b2.extend(leb128_u(3))
b2.append(CALL); b2.extend(leb128_u(0))
b2.append(LOCAL_SET); b2.extend(leb128_u(7))

# g_t = trapezoidal_rule(p_gen_ptr, length, h)
b2.append(LOCAL_GET); b2.extend(leb128_u(0))
b2.append(LOCAL_GET); b2.extend(leb128_u(2))
b2.append(LOCAL_GET); b2.extend(leb128_u(3))
b2.append(CALL); b2.extend(leb128_u(1))
b2.append(LOCAL_SET); b2.extend(leb128_u(8))

# c_t = trapezoidal_rule(p_cons_ptr, length, h)
b2.append(LOCAL_GET); b2.extend(leb128_u(1))
b2.append(LOCAL_GET); b2.extend(leb128_u(2))
b2.append(LOCAL_GET); b2.extend(leb128_u(3))
b2.append(CALL); b2.extend(leb128_u(1))
b2.append(LOCAL_SET); b2.extend(leb128_u(9))

def store_f64_offset(offset_bytes, local_idx):
    b2.append(LOCAL_GET); b2.extend(leb128_u(4)) # out_ptr
    b2.append(LOCAL_GET); b2.extend(leb128_u(local_idx))
    b2.append(F64_STORE); b2.append(3); b2.append(offset_bytes)

# out[0] = g_s (offset 0)
store_f64_offset(0, 6)

# out[1] = c_s (offset 8)
store_f64_offset(8, 7)

# out[2] = g_s - c_s (offset 16)
b2.append(LOCAL_GET); b2.extend(leb128_u(4))
b2.append(LOCAL_GET); b2.extend(leb128_u(6))
b2.append(LOCAL_GET); b2.extend(leb128_u(7))
b2.append(F64_SUB)
b2.append(F64_STORE); b2.append(3); b2.append(16)

# out[3] = g_t (offset 24)
store_f64_offset(24, 8)

# out[4] = c_t (offset 32)
store_f64_offset(32, 9)

# out[5] = g_t - c_t (offset 40)
b2.append(LOCAL_GET); b2.extend(leb128_u(4))
b2.append(LOCAL_GET); b2.extend(leb128_u(8))
b2.append(LOCAL_GET); b2.extend(leb128_u(9))
b2.append(F64_SUB)
b2.append(F64_STORE); b2.append(3); b2.append(40)

# out[6] = g_s - g_t (offset 48)
b2.append(LOCAL_GET); b2.extend(leb128_u(4))
b2.append(LOCAL_GET); b2.extend(leb128_u(6))
b2.append(LOCAL_GET); b2.extend(leb128_u(8))
b2.append(F64_SUB)
b2.append(F64_STORE); b2.append(3); b2.append(48)

# out[7] = c_s - c_t (offset 56)
b2.append(LOCAL_GET); b2.extend(leb128_u(4))
b2.append(LOCAL_GET); b2.extend(leb128_u(7))
b2.append(LOCAL_GET); b2.extend(leb128_u(9))
b2.append(F64_SUB)
b2.append(F64_STORE); b2.append(3); b2.append(56)

# out[8] = (g_s - c_s) - (g_t - c_t) (offset 64)
b2.append(LOCAL_GET); b2.extend(leb128_u(4))
b2.append(LOCAL_GET); b2.extend(leb128_u(6))
b2.append(LOCAL_GET); b2.extend(leb128_u(7))
b2.append(F64_SUB)
b2.append(LOCAL_GET); b2.extend(leb128_u(8))
b2.append(LOCAL_GET); b2.extend(leb128_u(9))
b2.append(F64_SUB)
b2.append(F64_SUB)
b2.append(F64_STORE); b2.append(3); b2.append(64)

# return 0
b2.append(I32_CONST); b2.extend(leb128_s(0))
b2.append(END)

# Func 2 local declarations: 1 x i32, 4 x f64
func2_locals = leb128_u(2) + leb128_u(1) + bytes([I32]) + leb128_u(4) + bytes([F64])
func2_body = leb128_u(len(func2_locals) + len(b2)) + func2_locals + b2

# -------------------------------------------------------------
# Module Structure Assemble
# -------------------------------------------------------------
# Magic & Version
wasm = bytearray(b'\x00asm\x01\x00\x00\x00')

# Section 1: Type Section
# Types:
# 0: (i32, i32, f64) -> f64
# 1: (i32, i32, i32, f64, i32) -> i32
type0 = bytes([0x60]) + leb128_u(3) + bytes([I32, I32, F64]) + leb128_u(1) + bytes([F64])
type1 = bytes([0x60]) + leb128_u(5) + bytes([I32, I32, I32, F64, I32]) + leb128_u(1) + bytes([I32])
sec1_payload = leb128_u(2) + type0 + type1
wasm.extend(make_section(1, sec1_payload))

# Section 3: Function Section
# Func 0 -> Type 0
# Func 1 -> Type 0
# Func 2 -> Type 1
sec3_payload = leb128_u(3) + leb128_u(0) + leb128_u(0) + leb128_u(1)
wasm.extend(make_section(3, sec3_payload))

# Section 5: Memory Section
# 1 memory, initial 1 page, no max limit specified
sec5_payload = leb128_u(1) + bytes([0x00]) + leb128_u(1)
wasm.extend(make_section(5, sec5_payload))

# Section 7: Export Section
# Exports:
# - memory (kind 2, idx 0)
# - simpsons_one_third (kind 0, idx 0)
# - trapezoidal_rule (kind 0, idx 1)
# - compute_audit (kind 0, idx 2)
def make_export(name, kind, idx):
    name_bytes = name.encode('utf-8')
    return leb128_u(len(name_bytes)) + name_bytes + bytes([kind]) + leb128_u(idx)

sec7_payload = leb128_u(4) + \
    make_export('memory', 2, 0) + \
    make_export('simpsons_one_third', 0, 0) + \
    make_export('trapezoidal_rule', 0, 1) + \
    make_export('compute_audit', 0, 2)
wasm.extend(make_section(7, sec7_payload))

# Section 10: Code Section
sec10_payload = leb128_u(3) + func0_body + func1_body + func2_body
wasm.extend(make_section(10, sec10_payload))

with open('c:/Users/DELL/OneDrive/Desktop/SolarSim/solarsim_engine.wasm', 'wb') as f:
    f.write(wasm)

print(f'Successfully generated solarsim_engine.wasm ({len(wasm)} bytes)')
