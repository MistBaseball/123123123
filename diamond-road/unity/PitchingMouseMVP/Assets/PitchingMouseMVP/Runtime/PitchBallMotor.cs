using UnityEngine;

namespace Baseball.PitchingMvp
{
    /// <summary>Only this component writes the ball position. Do not add a Rigidbody.</summary>
    [DisallowMultipleComponent]
    public sealed class PitchBallMotor : MonoBehaviour
    {
        [SerializeField] private TrailRenderer trail;
        private PitchTrajectory flight;
        private float elapsed;

        public bool IsFlying { get; private set; }
        public float FlightDuration { get { return flight.Duration; } }
        public Vector3 CalculatedArrival { get; private set; }
        public float ArrivalErrorMetres { get; private set; }

        public void Configure(TrailRenderer value) { trail = value; }

        public void ResetAt(Vector3 position)
        {
            IsFlying = false;
            elapsed = 0f;
            if (trail != null) { trail.emitting = false; trail.Clear(); }
            transform.position = position;
            if (trail != null) trail.Clear();
        }

        public bool Launch(PitchTrajectory trajectory)
        {
            if (IsFlying || trajectory.Duration <= 0f) return false;
            flight = trajectory;
            ResetAt(flight.Start);
            IsFlying = true;
            ArrivalErrorMetres = 0f;
            if (trail != null) trail.emitting = true;
            return true;
        }

        // Called by the controller, so stepping and completion have explicit ordering.
        public bool Advance(float deltaTime)
        {
            if (!IsFlying || !PitchTrajectory.IsFinite(deltaTime) || deltaTime <= 0f) return false;
            elapsed = Mathf.Min(elapsed + deltaTime, flight.Duration);
            transform.position = flight.Evaluate(elapsed);
            if (elapsed < flight.Duration) return false;

            CalculatedArrival = transform.position;
            ArrivalErrorMetres = Vector3.Distance(CalculatedArrival, flight.Target);
            // Only hide floating-point residuals after recording the unsnapped error.
            transform.position = flight.Target;
            IsFlying = false;
            if (trail != null) trail.emitting = false;
            return true;
        }

        private void OnDisable()
        {
            IsFlying = false;
            if (trail != null) { trail.emitting = false; trail.Clear(); }
        }
    }
}
