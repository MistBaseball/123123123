"""Independent float32 numerical cross-check, NOT a Unity execution test.

Requires Python 3 and numpy. Run: python Validation/verify_numeric.py
The actual C# checks are available under Tools > Baseball MVP in Unity.
"""
import math
import numpy as np


def solve(start, target, speed_kmh, gravity):
    start, target, gravity = [np.asarray(x, dtype=np.float32) for x in (start, target, gravity)]
    speed_kmh = float(np.float32(speed_kmh))
    if not all(np.isfinite(x).all() for x in (start, target, gravity)) or not math.isfinite(speed_kmh) or speed_kmh <= 0:
        return None
    delta = np.float32(target - start)
    d2 = sum(float(x) * float(x) for x in delta)
    if d2 < 1e-6:
        return None
    speed = speed_kmh / 3.6
    g2 = sum(float(x) * float(x) for x in gravity)
    if g2 < 1e-8:
        t = math.sqrt(d2) / speed
    else:
        b = speed * speed + sum(float(x) * float(y) for x, y in zip(delta, gravity))
        discriminant = b * b - g2 * d2
        if b <= 0 or discriminant < 0:
            return None
        t = math.sqrt(2 * d2 / (b + math.sqrt(discriminant)))
    if not math.isfinite(t) or t <= 1e-5:
        return None
    t = np.float32(t)
    velocity = np.float32(delta / t - np.float32(np.float32(.5) * gravity) * t)
    return start, target, velocity, gravity, t


def evaluate(flight, time):
    start, _, velocity, gravity, duration = flight
    t = np.float32(min(max(float(time), 0), duration))
    return np.float32(start + np.float32(velocity * t) + np.float32(np.float32(np.float32(.5) * gravity) * t) * t)


def run():
    start = (0, 1.8, 0)
    max_error = 0
    max_speed_error = 0
    trajectories = 0
    frame_checks = 0
    rng = np.random.default_rng(421)
    targets = [(x, y, 18) for x in (-1.2, 0, 1.2) for y in (.15, 1.05, 1.95)]
    targets += [(float(rng.uniform(-1.2, 1.2)), float(rng.uniform(.15, 1.95)), 18) for _ in range(100)]
    for speed in (70, 90, 130, 160, 180):
        for target in targets:
            for gravity in ((0, 0, 0), (0, -9.81, 0)):
                flight = solve(start, target, speed, gravity)
                assert flight is not None, (target, speed, gravity)
                error = float(np.linalg.norm(evaluate(flight, flight[-1]) - flight[1]))
                speed_error = abs(float(np.linalg.norm(flight[2])) * 3.6 - speed)
                max_error = max(max_error, error)
                max_speed_error = max(max_speed_error, speed_error)
                assert error < .001, error
                assert speed_error < .01, speed_error
                assert np.linalg.norm(evaluate(flight, 0) - np.array(start, np.float32)) < 1e-5
                for fps in (15, 30, 60, 144, 240):
                    t = np.float32(0)
                    while t < flight[-1]:
                        t = np.minimum(np.float32(t + np.float32(1 / fps)), flight[-1])
                    assert np.linalg.norm(evaluate(flight, t) - flight[1]) < .001
                    frame_checks += 1
                assert np.linalg.norm(evaluate(flight, 100) - flight[1]) < .001
                # Default vertical gravity yields a concave-down arc: the minimum
                # centre height is at one of the endpoints, above the ball radius.
                for t in np.linspace(0, flight[-1], 30):
                    assert evaluate(flight, t)[1] > .0375
                trajectories += 1
    invalid = [
        (start, start, 130, (0, 0, 0)),
        (start, (0, 1, 18), 0, (0, 0, 0)),
        (start, (0, 1, 18), -1, (0, 0, 0)),
        (start, (0, 1, 18), float("nan"), (0, 0, 0)),
        (start, (0, 1, 18), float("inf"), (0, 0, 0)),
        (start, (float("nan"), 1, 18), 130, (0, 0, 0)),
        (start, (0, 1, 18), 1, (0, -9.81, 0)),
    ]
    for args in invalid:
        assert solve(*args) is None
    centre = solve(start, (0, 1.05, 18), 130, (0, -9.81, 0))
    print(f"PASS: {trajectories} trajectories; {frame_checks} FPS/endpoint checks; {len(invalid)} invalid inputs.")
    print(f"Maximum unsnapped endpoint residual: {max_error * 1000:.6f} mm")
    print(f"Maximum initial-speed error: {max_speed_error:.8f} km/h")
    print(f"Default centre-target flight time: {centre[-1]:.6f} s")
    print("Unity compilation, scene generation, rendering and real input: NOT RUN.")


if __name__ == "__main__":
    run()
