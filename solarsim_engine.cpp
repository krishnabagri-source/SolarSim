/**
 * ============================================================================
 * SolarSim — Computational Methods Laboratory
 * C++ Numerical Integration Engine for Photovoltaic Telemetry
 * 
 * Algorithms:
 *   - Composite Simpson's 1/3 Rule (Quadratic O(h^4) Quadrature)
 *   - Composite Trapezoidal Rule (Linear O(h^2) Quadrature)
 * 
 * Compilable as:
 *   1. Native C++ Executable: g++ -O3 solarsim_engine.cpp -o solarsim_engine.exe
 *   2. WebAssembly Module via Emscripten:
 *      emcc -O3 solarsim_engine.cpp -s WASM=1 -s SIDE_MODULE=0 \
 *           -s EXPORTED_FUNCTIONS='["_simpsons_one_third", "_trapezoidal_rule", "_compute_audit"]' \
 *           -o solarsim_engine.wasm
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <iomanip>
#include <stdexcept>
#include <cmath>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define WASM_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define WASM_EXPORT
#endif

using namespace std;

// ============================================================================
// Core Computational Methods Functions (Matching Project Report)
// ============================================================================

/**
 * Composite Simpson's 1/3 Rule
 * Approximates: integral_{a}^{b} f(x) dx
 * Formula: (h / 3) * [ y0 + yn + 4 * sum(y_odd) + 2 * sum(y_even) ]
 * 
 * @param y Vector of sampled function values (size N)
 * @param h Uniform step size between consecutive samples (hours)
 * @return Computed cumulative energy integral
 */
double simpsons_one_third(const vector<double>& y, double h) {
    int n = static_cast<int>(y.size()) - 1;

    if (n <= 0) {
        throw invalid_argument("At least two data points required.");
    }

    if (n % 2 != 0) {
        throw invalid_argument("Simpson's Rule requires an even number of subintervals (even n).");
    }

    double endpoint_sum = y[0] + y[n];
    double odd_sum = 0.0;
    double even_sum = 0.0;

    // Odd-indexed interior points (weight 4)
    for (int i = 1; i < n; i += 2) {
        odd_sum += y[i];
    }

    // Even-indexed interior points (weight 2)
    for (int i = 2; i < n; i += 2) {
        even_sum += y[i];
    }

    return (h / 3.0) * (endpoint_sum + 4.0 * odd_sum + 2.0 * even_sum);
}

/**
 * Composite Trapezoidal Rule
 * Approximates: integral_{a}^{b} f(x) dx
 * Formula: (h / 2) * [ y0 + yn + 2 * sum(y_interior) ]
 * 
 * @param y Vector of sampled function values (size N)
 * @param h Uniform step size between consecutive samples (hours)
 * @return Computed cumulative energy integral
 */
double trapezoidal_rule(const vector<double>& y, double h) {
    int n = static_cast<int>(y.size()) - 1;

    if (n <= 0) {
        throw invalid_argument("At least two data points required.");
    }

    double interior_sum = 0.0;

    // Interior points (weight 2)
    for (int i = 1; i < n; i++) {
        interior_sum += y[i];
    }

    return (h / 2.0) * (y[0] + 2.0 * interior_sum + y[n]);
}

// ============================================================================
// WebAssembly Interoperability Exports (C-Linkage for Dynamic Arrays)
// ============================================================================

extern "C" {

/**
 * Dynamic C++ Simpson's 1/3 Rule for WebAssembly
 * Accepts raw pointer to arbitrary user-supplied array in linear memory.
 */
WASM_EXPORT
double simpsons_one_third_wasm(const double* y, int length, double h) {
    if (!y || length < 3) return 0.0;
    int n = length - 1;
    if (n % 2 != 0) return 0.0;

    double endpoint_sum = y[0] + y[n];
    double odd_sum = 0.0;
    double even_sum = 0.0;

    for (int i = 1; i < n; i += 2) {
        odd_sum += y[i];
    }
    for (int i = 2; i < n; i += 2) {
        even_sum += y[i];
    }

    return (h / 3.0) * (endpoint_sum + 4.0 * odd_sum + 2.0 * even_sum);
}

/**
 * Dynamic C++ Trapezoidal Rule for WebAssembly
 */
WASM_EXPORT
double trapezoidal_rule_wasm(const double* y, int length, double h) {
    if (!y || length < 2) return 0.0;
    int n = length - 1;

    double interior_sum = 0.0;
    for (int i = 1; i < n; i++) {
        interior_sum += y[i];
    }

    return (h / 2.0) * (y[0] + 2.0 * interior_sum + y[n]);
}

/**
 * Full C++ Computational Methods Energy Audit Engine
 * Dynamically processes solar generation and building load arrays of arbitrary length N,
 * computing:
 *   - out[0]: Generated Energy via Simpson's 1/3 (kWh)
 *   - out[1]: Consumed Energy via Simpson's 1/3 (kWh)
 *   - out[2]: Net Energy Balance via Simpson's 1/3 (kWh)
 *   - out[3]: Generated Energy via Trapezoidal Rule (kWh)
 *   - out[4]: Consumed Energy via Trapezoidal Rule (kWh)
 *   - out[5]: Net Energy Balance via Trapezoidal Rule (kWh)
 *   - out[6]: Generation Discrepancy (Simpson - Trapezoidal) (kWh)
 *   - out[7]: Consumption Discrepancy (Simpson - Trapezoidal) (kWh)
 *   - out[8]: Net Energy Discrepancy (Simpson - Trapezoidal) (kWh)
 * 
 * @return 0 on success, -1 on validation failure (n not even or N < 3)
 */
WASM_EXPORT
int compute_audit(const double* p_gen, const double* p_cons, int length, double h, double* out) {
    if (!p_gen || !p_cons || !out || length < 3) return -1;
    int n = length - 1;
    if (n % 2 != 0) return -1; // Simpson's 1/3 requirement

    // Wrap raw pointers in lightweight C++ vectors without heap reallocation
    vector<double> v_gen(p_gen, p_gen + length);
    vector<double> v_cons(p_cons, p_cons + length);
    vector<double> v_net(length);

    for (int i = 0; i < length; i++) {
        v_net[i] = v_gen[i] - v_cons[i];
    }

    // Simpson's 1/3 Rule calculations
    double e_gen_simp = simpsons_one_third(v_gen, h);
    double e_cons_simp = simpsons_one_third(v_cons, h);
    double e_net_simp = e_gen_simp - e_cons_simp;

    // Trapezoidal Rule calculations
    double e_gen_trap = trapezoidal_rule(v_gen, h);
    double e_cons_trap = trapezoidal_rule(v_cons, h);
    double e_net_trap = e_gen_trap - e_cons_trap;

    // Discrepancies between methods (curvatures)
    double diff_gen = e_gen_simp - e_gen_trap;
    double diff_cons = e_cons_simp - e_cons_trap;
    double diff_net = e_net_simp - e_net_trap;

    out[0] = e_gen_simp;
    out[1] = e_cons_simp;
    out[2] = e_net_simp;
    out[3] = e_gen_trap;
    out[4] = e_cons_trap;
    out[5] = e_net_trap;
    out[6] = diff_gen;
    out[7] = diff_cons;
    out[8] = diff_net;

    return 0; // Success
}

} // extern "C"

// ============================================================================
// Native Command-Line Entry Point
// ============================================================================

int main(int argc, char* argv[]) {
    // Step size = 1.0 hour (Default 12-hour academic laboratory dataset)
    double h = 1.0;

    vector<int> hours;
    for (int i = 6; i <= 18; i++) {
        hours.push_back(i);
    }

    // Solar power generation in kW (from project report page 5)
    vector<double> p_gen = {
        0.20, 1.45, 3.60, 5.85, 7.70,
        8.95, 9.40, 8.80, 7.40, 5.35,
        3.10, 1.15, 0.10
    };

    // Facility power consumption in kW
    vector<double> p_cons = {
        1.80, 2.10, 2.90, 3.80, 4.40,
        4.85, 5.10, 4.95, 4.60, 4.20,
        3.75, 3.30, 2.80
    };

    // Calculate net power vector: P_net = P_gen - P_cons
    vector<double> p_net;
    for (size_t i = 0; i < p_gen.size(); i++) {
        p_net.push_back(p_gen[i] - p_cons[i]);
    }

    // Simpson's 1/3 Rule (Quadratic O(h^4))
    double e_gen_simp = simpsons_one_third(p_gen, h);
    double e_cons_simp = simpsons_one_third(p_cons, h);
    double e_net_simp = simpsons_one_third(p_net, h);

    // Trapezoidal Rule (Linear O(h^2))
    double e_gen_trap = trapezoidal_rule(p_gen, h);
    double e_cons_trap = trapezoidal_rule(p_cons, h);
    double e_net_trap = trapezoidal_rule(p_net, h);

    cout << fixed << setprecision(3);

    cout << "=========================================================\n";
    cout << "  SOLARSIM C++ COMPUTATIONAL METHODS ENGINE (WASM CORE)  \n";
    cout << "=========================================================\n\n";

    cout << "Hourly Power Data:\n";
    cout << "Hour\tGeneration (kW)\tConsumption (kW)\tNet Power (kW)\n";
    cout << "---------------------------------------------------------\n";

    for (size_t i = 0; i < hours.size(); i++) {
        cout << hours[i] << ":00\t"
             << setw(10) << p_gen[i] << "\t"
             << setw(12) << p_cons[i] << "\t"
             << setw(12) << (p_net[i] >= 0 ? "+" : "") << p_net[i] << "\n";
    }

    cout << "\nSIMPSON'S 1/3 RULE RESULTS:\n";
    cout << "---------------------------------------------------------\n";
    cout << "Generated Energy: " << e_gen_simp << " kWh\n";
    cout << "Consumed Energy:  " << e_cons_simp << " kWh\n";
    cout << "Net Energy:       " << (e_net_simp >= 0 ? "+" : "") << e_net_simp << " kWh\n";

    cout << "\nTRAPEZOIDAL RULE RESULTS:\n";
    cout << "---------------------------------------------------------\n";
    cout << "Generated Energy: " << e_gen_trap << " kWh\n";
    cout << "Consumed Energy:  " << e_cons_trap << " kWh\n";
    cout << "Net Energy:       " << (e_net_trap >= 0 ? "+" : "") << e_net_trap << " kWh\n";

    cout << "\nDIFFERENCE BETWEEN METHODS (Simpson - Trapezoidal):\n";
    cout << "---------------------------------------------------------\n";
    cout << "Generation Difference:  +" << (e_gen_simp - e_gen_trap) << " kWh (+0.106%)\n";
    cout << "Consumption Difference: +" << (e_cons_simp - e_cons_trap) << " kWh (+0.108%)\n";
    cout << "Net Energy Difference:  +" << (e_net_simp - e_net_trap) << " kWh\n";
    cout << "=========================================================\n";

    return 0;
}
