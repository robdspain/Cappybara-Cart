# 04 — Physics & Driving Model (Arcade)
**Stats per kart:** accel (m/s²), top speed (m/s), handling (0.85–1.15), boostCap (units), mass (130–160 kg)

## Movement
- Throttle adds longitudinal force; clamp to top speed
- Lateral grip = baseGrip * handling * (1 - driftSlip)
- Surfaces: tarmac(1.0), mud(0.75 accel, 0.8 grip), curb(0.9 accel/0.95 grip)
- Boost pad: +8 m/s instant, 1.0 s decay

## Drift & Mini-Turbo
- Enter drift when |steer| > threshold and drift held
- DriftSlip 0.15–0.35; charge mini-turbo by time held
- Mini-turbo: 0.25 / 0.5 / 0.9 s (3 tiers)

## Collisions & Air
- Wall scrape slows 1.5 m/s per sec; 0.2 damping on hits
- Simple ballistic airtime; landing timing window ±120 ms grants tiny boost
