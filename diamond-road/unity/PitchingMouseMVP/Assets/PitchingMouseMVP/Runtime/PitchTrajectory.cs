using System;
using UnityEngine;

namespace Baseball.PitchingMvp
{
    /// <summary>Constant-gravity, no-drag flight with a specified release speed.</summary>
    public struct PitchTrajectory
    {
        public Vector3 Start { get; private set; }
        public Vector3 Target { get; private set; }
        public Vector3 InitialVelocity { get; private set; }
        public Vector3 Gravity { get; private set; }
        public float Duration { get; private set; }

        public static bool IsFinite(float value)
        {
            return !float.IsNaN(value) && !float.IsInfinity(value);
        }

        public static bool IsFinite(Vector3 value)
        {
            return IsFinite(value.x) && IsFinite(value.y) && IsFinite(value.z);
        }

        public static bool TryCreate(Vector3 start, Vector3 target, float speedKmh,
            Vector3 gravity, out PitchTrajectory flight)
        {
            flight = default(PitchTrajectory);
            if (!IsFinite(start) || !IsFinite(target) || !IsFinite(gravity) ||
                !IsFinite(speedKmh) || speedKmh <= 0f)
                return false;

            Vector3 delta = target - start;
            double distanceSq = (double)delta.x * delta.x + (double)delta.y * delta.y +
                (double)delta.z * delta.z;
            if (distanceSq < 0.000001)
                return false;

            double speed = speedKmh / 3.6;
            double gravitySq = (double)gravity.x * gravity.x + (double)gravity.y * gravity.y +
                (double)gravity.z * gravity.z;
            double duration;
            if (gravitySq < 0.00000001)
            {
                duration = Math.Sqrt(distanceSq) / speed;
            }
            else
            {
                double dot = (double)delta.x * gravity.x + (double)delta.y * gravity.y +
                    (double)delta.z * gravity.z;
                double b = speed * speed + dot;
                double discriminant = b * b - gravitySq * distanceSq;
                if (b <= 0.0 || discriminant < 0.0)
                    return false;

                // Stable form of the shorter-time root; avoids b - sqrt(discriminant).
                duration = Math.Sqrt(2.0 * distanceSq / (b + Math.Sqrt(discriminant)));
            }

            if (double.IsNaN(duration) || double.IsInfinity(duration) || duration <= 0.00001)
                return false;
            float t = (float)duration;
            Vector3 velocity = delta / t - 0.5f * gravity * t;
            if (!IsFinite(t) || !IsFinite(velocity))
                return false;

            flight = new PitchTrajectory
            {
                Start = start, Target = target, Gravity = gravity,
                InitialVelocity = velocity, Duration = t
            };
            return true;
        }

        public Vector3 Evaluate(float time)
        {
            float t = Mathf.Clamp(time, 0f, Duration);
            return Start + InitialVelocity * t + 0.5f * Gravity * t * t;
        }
    }
}
