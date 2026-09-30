using System;
using UnityEditor;
using UnityEngine;

namespace Baseball.PitchingMvp.Editor
{
    /// <summary>Dependency-free editor checks. Calls the actual runtime math and aim components.</summary>
    public static class PitchMvpChecks
    {
        [MenuItem("Tools/Baseball MVP/2. Run Math and Scene Checks")]
        public static void RunChecks()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                EditorUtility.DisplayDialog("Pitch MVP", "Stop Play Mode before running these checks.", "OK");
                return;
            }
            int passed = 0;
            Action<bool, string> check = (condition, message) =>
            {
                if (!condition) throw new InvalidOperationException(message);
                passed++;
            };
            GameObject temporary = null;
            try
            {
                Vector3 start = new Vector3(0, 1.8f, 0);
                foreach (float speed in new[] { 70f, 90f, 130f, 160f, 180f })
                foreach (float x in new[] { -1.2f, 0f, 1.2f })
                foreach (float y in new[] { 0.15f, 1.05f, 1.95f })
                foreach (Vector3 gravity in new[] { Vector3.zero, new Vector3(0, -9.81f, 0) })
                {
                    Vector3 target = new Vector3(x, y, 18);
                    PitchTrajectory flight;
                    check(PitchTrajectory.TryCreate(start, target, speed, gravity, out flight), "Reachable pitch rejected.");
                    check(Vector3.Distance(flight.Evaluate(0), start) < 0.00001f, "Incorrect starting point.");
                    check(Vector3.Distance(flight.Evaluate(flight.Duration), target) < 0.001f, "Endpoint error exceeds 1 mm.");
                    check(Mathf.Abs(flight.InitialVelocity.magnitude * 3.6f - speed) < 0.01f, "Incorrect release speed.");
                    check(Vector3.Distance(flight.Evaluate(flight.Duration * 2), target) < 0.001f, "Time overshoot did not clamp.");
                    foreach (int fps in new[] { 15, 30, 60, 144, 240 })
                    {
                        float t = 0;
                        int steps = 0;
                        while (t < flight.Duration && steps++ < 10000) t = Mathf.Min(t + 1f / fps, flight.Duration);
                        check(Vector3.Distance(flight.Evaluate(t), target) < 0.001f, "Frame-rate endpoint mismatch.");
                    }
                }
                PitchTrajectory invalid;
                check(!PitchTrajectory.TryCreate(start, start, 130, Vector3.zero, out invalid), "Zero distance accepted.");
                check(!PitchTrajectory.TryCreate(start, new Vector3(0, 1, 18), 0, Vector3.zero, out invalid), "Zero speed accepted.");
                check(!PitchTrajectory.TryCreate(start, new Vector3(0, 1, 18), float.NaN, Vector3.zero, out invalid), "NaN accepted.");
                check(!PitchTrajectory.TryCreate(start, new Vector3(0, 1, 18), 1, new Vector3(0, -9.81f, 0), out invalid), "Impossible pitch accepted.");

                temporary = new GameObject("PitchMVP_TemporaryChecks") { hideFlags = HideFlags.HideAndDontSave };
                temporary.transform.position = new Vector3(0, 1.05f, 18);
                PitchAimPlane plane = temporary.AddComponent<PitchAimPlane>();
                check(plane.Contains(new Vector3(0, 1.05f, 18)), "Centre missing from aim area.");
                check(plane.Contains(new Vector3(1.2f, 1.95f, 18)), "Aim boundary excluded.");
                check(!plane.Contains(new Vector3(1.25f, 1.05f, 18)), "Outside aim area accepted.");
                check(!plane.Contains(new Vector3(0, 1.05f, 17)), "Off-plane point accepted.");
                check(plane.IsInsideTrainingZone(new Vector3(0, 1.05f, 18)), "Training zone centre rejected.");
                check(!plane.IsInsideTrainingZone(new Vector3(0.7f, 1.05f, 18)), "Outside zone incorrectly classified.");

                GameObject cameraObject = new GameObject("TemporaryCamera") { hideFlags = HideFlags.HideAndDontSave };
                cameraObject.transform.SetParent(temporary.transform, false);
                cameraObject.transform.position = new Vector3(0, 2.2f, -4);
                cameraObject.transform.LookAt(temporary.transform.position);
                Camera camera = cameraObject.AddComponent<Camera>();
                camera.enabled = false;
                camera.fieldOfView = 28f;
                camera.pixelRect = new Rect(0, 0, 1920, 1080);
                foreach (Vector3 target in new[] { new Vector3(0, 1.05f, 18), new Vector3(-1f, 0.25f, 18), new Vector3(1f, 1.85f, 18) })
                {
                    Vector3 screen = camera.WorldToScreenPoint(target);
                    Vector3 reconstructed;
                    check(plane.TryGetTarget(camera, screen, out reconstructed) &&
                        Vector3.Distance(target, reconstructed) < 0.001f, "Screen-to-target round trip failed.");
                }
                Vector3 outside;
                check(!plane.TryGetTarget(camera, new Vector2(-10, -10), out outside), "Off-screen pointer accepted.");

                // Test the actual motor without Play Mode, events, or frame timing dependencies.
                GameObject motorObject = new GameObject("TemporaryBall") { hideFlags = HideFlags.HideAndDontSave };
                motorObject.transform.SetParent(temporary.transform, false);
                PitchBallMotor motor = motorObject.AddComponent<PitchBallMotor>();
                PitchTrajectory motion;
                check(PitchTrajectory.TryCreate(start, new Vector3(0.7f, 1.4f, 18), 130f,
                    new Vector3(0, -9.81f, 0), out motion), "Motor test trajectory failed.");
                check(motor.Launch(motion), "First launch rejected.");
                check(!motor.Launch(motion), "Double launch not blocked.");
                motor.Advance(0.1f);
                check(motor.IsFlying && Vector3.Distance(motor.transform.position, start) > 0.1f, "Motor failed to advance.");
                motor.ResetAt(start);
                check(!motor.IsFlying && motor.transform.position == start, "Midflight reset failed.");
                check(motor.Launch(motion), "Launch after reset failed.");
                check(motor.Advance(10f), "Large timestep failed to arrive.");
                check(motor.ArrivalErrorMetres < 0.001f, "Motor arrival residual exceeds 1 mm.");
                check(!motor.Advance(1f), "Repeated arrival event.");

                PitchingController controller = UnityEngine.Object.FindFirstObjectByType<PitchingController>();
                string error = null;
                if (controller != null)
                    check(controller.ValidateConfiguration(out error), error ?? "Scene configuration failed.");
                else
                    Debug.LogWarning("[Pitch MVP] Math passed; no PitchingController in the active loaded scenes. Create the scene first.");

                Debug.Log("[Pitch MVP] PASS: " + passed + " checks. Play Mode interaction still requires the manual checklist.");
                EditorUtility.DisplayDialog("Pitch MVP checks", passed + " checks passed.\n\nNow test aim, click, reset and auto-reset in Game view.", "OK");
            }
            catch (Exception exception)
            {
                Debug.LogError("[Pitch MVP] FAIL after " + passed + " checks: " + exception.Message);
                EditorUtility.DisplayDialog("Pitch MVP checks failed", exception.Message + "\nSee Console for details.", "OK");
            }
            finally
            {
                // Destroy only the disposable test objects created by this method.
                if (temporary != null) UnityEngine.Object.DestroyImmediate(temporary);
            }
        }
    }
}
