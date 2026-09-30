using UnityEngine;

namespace Baseball.PitchingMvp
{
    [DisallowMultipleComponent]
    public sealed class PitchingController : MonoBehaviour
    {
        public enum PitchState { Ready, Flying, Result, ConfigurationError }

        [Header("Scene references")]
        [SerializeField] private Camera aimCamera;
        [SerializeField] private PitchAimPlane aimPlane;
        [SerializeField] private Transform releasePoint;
        [SerializeField] private PitchBallMotor ball;
        [SerializeField] private PitchInputReader inputReader;
        [SerializeField] private Transform aimMarker;
        [SerializeField] private Transform lockedMarker;
        [SerializeField] private Transform impactMarker;
        [SerializeField] private LineRenderer trajectoryPreview;

        [Header("Pitch configuration")]
        [SerializeField, Range(40f, 180f)] private float releaseSpeedKmh = 130f;
        [SerializeField] private Vector3 gravity = new Vector3(0f, -9.81f, 0f);
        [SerializeField] private bool autoReset = true;
        [SerializeField, Min(0f)] private float resultHoldSeconds = 1.2f;
        [SerializeField, Range(0.1f, 2f)] private float simulationSpeed = 1f;
        [SerializeField] private bool showTrajectoryPreview = true;

        private readonly Vector3[] previewPoints = new Vector3[48];
        private PitchTrajectory candidate;
        private float resultTimer;
        private bool initialized;
        private Vector3 lastTarget;

        public PitchState State { get; private set; }
        public bool AimValid { get; private set; }
        public int PitchesThrown { get; private set; }
        public int PitchesCompleted { get; private set; }
        public float LastErrorMm { get; private set; }
        public float LastFlightSeconds { get; private set; }
        public bool LastInsideZone { get; private set; }
        public bool HasResult { get; private set; }
        public Vector3 LastTarget { get { return lastTarget; } }
        public float ReleaseSpeedKmh { get { return releaseSpeedKmh; } }
        public float SimulationSpeed { get { return simulationSpeed; } }
        public string ConfigurationError { get; private set; }

        public void Configure(Camera camera, PitchAimPlane plane, Transform release,
            PitchBallMotor motor, PitchInputReader input, Transform aim,
            Transform locked, Transform impact, LineRenderer preview)
        {
            aimCamera = camera; aimPlane = plane; releasePoint = release;
            ball = motor; inputReader = input; aimMarker = aim;
            lockedMarker = locked; impactMarker = impact; trajectoryPreview = preview;
        }

        public bool ValidateConfiguration(out string message)
        {
            message = null;
            if (aimCamera == null || aimPlane == null || releasePoint == null ||
                ball == null || inputReader == null || aimMarker == null ||
                lockedMarker == null || impactMarker == null || trajectoryPreview == null)
                message = "Assign all scene references on PitchingSystem.";
            else if (!aimPlane.IsValidConfiguration)
                message = "AimPlane sizes must be valid and its world scale must be (1, 1, 1).";
            else if (releasePoint == ball.transform || releasePoint.IsChildOf(ball.transform))
                message = "ReleasePoint must not be the ball or a child of the ball.";
            else if (ball.GetComponent<Rigidbody>() != null)
                message = "Remove Rigidbody from this analytic MVP ball (do not run two movement systems).";
            else if (!PitchTrajectory.IsFinite(releaseSpeedKmh) || releaseSpeedKmh < 40f || releaseSpeedKmh > 180f ||
                !PitchTrajectory.IsFinite(gravity) || !PitchTrajectory.IsFinite(simulationSpeed) ||
                simulationSpeed <= 0f || !PitchTrajectory.IsFinite(resultHoldSeconds) || resultHoldSeconds < 0f)
                message = "Pitch settings are invalid. Use speed 40-180 km/h and positive simulation speed.";
            else if (!aimCamera.isActiveAndEnabled || !ball.isActiveAndEnabled || !inputReader.isActiveAndEnabled)
                message = "Camera, ball and input reader must be enabled.";
            else if (PitchInputReader.Backend == "Unavailable")
                message = "No active input backend. Enable Input System in Player Settings.";
            else
            {
                // The motor owns the ball. Detect the previously supplied demo script too.
                MonoBehaviour[] scripts = ball.GetComponents<MonoBehaviour>();
                foreach (MonoBehaviour script in scripts)
                    if (script != null && script != ball && script.enabled &&
                        script.GetType().Name == "SimplePitchController")
                        message = "Disable SimplePitchController on this ball; keep only PitchBallMotor.";
            }
            return message == null;
        }

        private void Start()
        {
            string error;
            if (!ValidateConfiguration(out error))
            {
                ConfigurationError = error;
                State = PitchState.ConfigurationError;
                Debug.LogError("[Pitch MVP] " + error, this);
                SetVisible(aimMarker, false); SetVisible(lockedMarker, false); SetVisible(impactMarker, false);
                if (trajectoryPreview != null) trajectoryPreview.enabled = false;
                return;
            }
            initialized = true;
            ResetPitch();
        }

        private void OnEnable()
        {
            if (initialized) ResetPitch();
        }

        private void OnDisable()
        {
            if (!initialized) return;
            if (ball != null && releasePoint != null) ball.ResetAt(releasePoint.position);
            SetVisible(aimMarker, false); SetVisible(lockedMarker, false); SetVisible(impactMarker, false);
            if (trajectoryPreview != null) trajectoryPreview.enabled = false;
            AimValid = false;
            State = PitchState.Ready;
        }

        private void Update()
        {
            if (!initialized) return;
            PitchInputFrame input = inputReader.ReadFrame();
            if (input.ResetPressed) { ResetPitch(); return; }
            if (Time.timeScale <= 0f || !Application.isFocused) return;

            if (State == PitchState.Flying)
            {
                if (ball.Advance(Time.deltaTime * simulationSpeed)) CompletePitch();
                return;
            }
            if (State == PitchState.Result)
            {
                resultTimer += Time.deltaTime;
                if (autoReset && resultTimer >= resultHoldSeconds) ResetPitch();
                return;
            }

            Vector3 target = default(Vector3);
            AimValid = input.HasPointer && !PitchHud.ContainsScreenPoint(input.PointerPosition) &&
                aimPlane.TryGetTarget(aimCamera, input.PointerPosition, out target);
            if (AimValid)
            {
                AimValid = PitchTrajectory.TryCreate(releasePoint.position, target,
                    releaseSpeedKmh, gravity, out candidate);
            }

            SetVisible(aimMarker, AimValid);
            trajectoryPreview.enabled = AimValid && showTrajectoryPreview;
            if (!AimValid) return;
            PlaceMarker(aimMarker, candidate.Target);
            if (showTrajectoryPreview) DrawPreview(candidate);
            if (input.ThrowPressed) TryThrowAt(candidate.Target);
        }

        // Future touch or gamepad input can call this without changing ball flight code.
        public bool TryThrowAt(Vector3 worldTarget)
        {
            if (!initialized || !isActiveAndEnabled || State != PitchState.Ready ||
                Time.timeScale <= 0f || !aimPlane.Contains(worldTarget)) return false;
            PitchTrajectory flight;
            if (!PitchTrajectory.TryCreate(releasePoint.position, worldTarget,
                releaseSpeedKmh, gravity, out flight) || !ball.Launch(flight)) return false;

            lastTarget = worldTarget;
            LastFlightSeconds = flight.Duration;
            State = PitchState.Flying;
            PitchesThrown++;
            AimValid = false;
            SetVisible(aimMarker, false);
            PlaceMarker(lockedMarker, worldTarget);
            SetVisible(lockedMarker, true);
            SetVisible(impactMarker, false);
            trajectoryPreview.enabled = showTrajectoryPreview;
            if (showTrajectoryPreview) DrawPreview(flight);
            return true;
        }

        private void CompletePitch()
        {
            State = PitchState.Result;
            resultTimer = 0f;
            PitchesCompleted++;
            LastErrorMm = ball.ArrivalErrorMetres * 1000f;
            LastInsideZone = aimPlane.IsInsideTrainingZone(ball.CalculatedArrival);
            HasResult = true;
            PlaceMarker(impactMarker, ball.CalculatedArrival);
            SetVisible(impactMarker, true);
            trajectoryPreview.enabled = false;
        }

        public void ResetPitch()
        {
            if (!initialized || ball == null || releasePoint == null) return;
            ball.ResetAt(releasePoint.position);
            State = PitchState.Ready;
            AimValid = false;
            resultTimer = 0f;
            SetVisible(aimMarker, false); SetVisible(lockedMarker, false); SetVisible(impactMarker, false);
            trajectoryPreview.enabled = false;
            // Session statistics and the last result intentionally survive an R reset.
        }

        private void DrawPreview(PitchTrajectory flight)
        {
            for (int i = 0; i < previewPoints.Length; i++)
                previewPoints[i] = flight.Evaluate(flight.Duration * i / (previewPoints.Length - 1));
            trajectoryPreview.positionCount = previewPoints.Length;
            trajectoryPreview.SetPositions(previewPoints);
        }

        private void PlaceMarker(Transform marker, Vector3 point)
        {
            marker.SetPositionAndRotation(point - aimPlane.transform.forward * 0.04f, aimPlane.transform.rotation);
        }

        private static void SetVisible(Transform marker, bool visible)
        {
            if (marker != null && marker.gameObject.activeSelf != visible) marker.gameObject.SetActive(visible);
        }
    }
}
