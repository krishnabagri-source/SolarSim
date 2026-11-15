/**
 * ============================================================================
 * SolarSim — Computational Methods Laboratory
 * C++ Numerical Integration Engine for Photovoltaic Telemetry
 * 
 * Algorithms:
 *   - Composite Simpson's 1/3 Rule: (h / 3.0) * [ y0 + yn + 4 * sum(y_odd) + 2 * sum(y_even) ]
 *   - Composite Trapezoidal Rule:   (h / 2.0) * [ y0 + yn + 2 * sum(y_interior) ]
 * 
 * Standalone compilation:
 *   g++ -O3 solarsim_engine.cpp -o solarsim_engine.exe
 * 
 * WebAssembly compilation (via Emscripten):
 *   emcc -O3 solarsim_engine.cpp -s WASM=1 -s SIDE_MODULE=0 \
 *        -s EXPORTED_FUNCTIONS='["_simpson", "_trapezoidal", "_compute_audit"]' \
 *        -o solarsim_engine.wasm
 * ============================================================================
 */

#include <iostream>
#include <iomanip>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define WASM_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define WASM_EXPORT
#endif

using namespace std;

// Simpson's 1/3 Rule
double simpson(double y[], int n, double h) {
    double sum = y[0] + y[n];

    for (int i = 1; i < n; i++) {
        if (i % 2 == 0)
            sum += 2 * y[i];
        else
            sum += 4 * y[i];
    }

    return (h / 3.0) * sum;
}

// Trapezoidal Rule
double trapezoidal(double y[], int n, double h) {
    double sum = y[0] + y[n];

    for (int i = 1; i < n; i++) {
        sum += 2 * y[i];
    }

    return (h / 2.0) * sum;
}

// WebAssembly bridge for dynamic browser execution without manual terminal input
extern "C" {

WASM_EXPORT
double simpson_wasm(const double* y, int n, double h) {
    if (!y || n <= 0 || n % 2 != 0) return 0.0;
    return simpson(const_cast<double*>(y), n, h);
}

WASM_EXPORT
double trapezoidal_wasm(const double* y, int n, double h) {
    if (!y || n <= 0) return 0.0;
    return trapezoidal(const_cast<double*>(y), n, h);
}

WASM_EXPORT
int compute_audit(const double* gen, const double* cons, int length, double h, double* out) {
    if (!gen || !cons || !out || length < 3) return -1;
    int n = length - 1;
    if (n % 2 != 0) return -1;

    double* net = new double[length];
    for (int i = 0; i <= n; i++) {
        net[i] = gen[i] - cons[i];
    }

    double Egen = simpson(const_cast<double*>(gen), n, h);
    double Econs = simpson(const_cast<double*>(cons), n, h);
    double Enet = simpson(net, n, h);

    double Tgen = trapezoidal(const_cast<double*>(gen), n, h);
    double Tcons = trapezoidal(const_cast<double*>(cons), n, h);
    double Tnet = trapezoidal(net, n, h);

    delete[] net;

    out[0] = Egen;
    out[1] = Econs;
    out[2] = Enet;
    out[3] = Tgen;
    out[4] = Tcons;
    out[5] = Tnet;
    out[6] = Egen - Tgen;
    out[7] = Econs - Tcons;
    out[8] = Enet - Tnet;

    return 0;
}

}

int main() {
    const int n = 12;
    double h = 1.0;

    double gen[n + 1], cons[n + 1], net[n + 1];

    // Input solar generation
    cout << "Enter 13 solar power readings:\n";
    for (int i = 0; i <= n; i++) {
        cin >> gen[i];
    }

    // Input building consumption
    cout << "Enter 13 consumption readings:\n";
    for (int i = 0; i <= n; i++) {
        cin >> cons[i];
    }

    // Calculate net power
    for (int i = 0; i <= n; i++) {
        net[i] = gen[i] - cons[i];
    }

    // Simpson's Rule calculations
    double Egen = simpson(gen, n, h);
    double Econs = simpson(cons, n, h);
    double Enet = simpson(net, n, h);

    // Trapezoidal Rule calculations
    double Tgen = trapezoidal(gen, n, h);
    double Tcons = trapezoidal(cons, n, h);
    double Tnet = trapezoidal(net, n, h);

    cout << fixed << setprecision(4);

    cout << "\n--- SIMPSON'S 1/3 RULE ---\n";
    cout << "Generated Energy: " << Egen << " kWh\n";
    cout << "Consumed Energy: " << Econs << " kWh\n";
    cout << "Net Energy: " << Enet << " kWh\n";

    cout << "\n--- TRAPEZOIDAL RULE ---\n";
    cout << "Generated Energy: " << Tgen << " kWh\n";
    cout << "Consumed Energy: " << Tcons << " kWh\n";
    cout << "Net Energy: " << Tnet << " kWh\n";

    cout << "\n--- DIFFERENCE BETWEEN METHODS ---\n";
    cout << "Generation: " << Egen - Tgen << " kWh\n";
    cout << "Consumption: " << Econs - Tcons << " kWh\n";
    cout << "Net Energy: " << Enet - Tnet << " kWh\n";

    return 0;
}
