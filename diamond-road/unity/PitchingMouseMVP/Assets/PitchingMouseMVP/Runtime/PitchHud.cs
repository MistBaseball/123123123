using UnityEngine;

namespace Baseball.PitchingMvp
{
    /// <summary>Read-only prototype HUD; no Canvas, TMP fonts or UI package required.</summary>
    [DisallowMultipleComponent]
    public sealed class PitchHud : MonoBehaviour
    {
        [SerializeField] private PitchingController controller;
        private GUIStyle textStyle;
        private GUIStyle headingStyle;
        private static readonly Rect Panel = new Rect(12f, 12f, 370f, 242f);
        private static float UiScale { get { return Mathf.Clamp(Screen.height / 900f, 0.6f, 1.5f); } }

        public void Configure(PitchingController value) { controller = value; }

        public static bool ContainsScreenPoint(Vector2 point)
        {
            return Panel.Contains(new Vector2(point.x / UiScale, (Screen.height - point.y) / UiScale));
        }

        private void OnGUI()
        {
            if (controller == null) return;
            if (textStyle == null)
            {
                textStyle = new GUIStyle(GUI.skin.label) { fontSize = 14, wordWrap = true };
                textStyle.normal.textColor = Color.white;
                headingStyle = new GUIStyle(textStyle) { fontSize = 18, fontStyle = FontStyle.Bold };
            }
            Matrix4x4 oldMatrix = GUI.matrix;
            GUI.matrix = Matrix4x4.Scale(new Vector3(UiScale, UiScale, 1f));
            GUI.Box(Panel, GUIContent.none);
            GUI.Label(new Rect(24, 21, 344, 28), "MOUSE PITCH / MVP", headingStyle);
            string stateText = controller.State.ToString().ToUpperInvariant();
            if (controller.State == PitchingController.PitchState.Ready)
                stateText += controller.AimValid ? " - LEFT CLICK TO THROW" : " - AIM INSIDE CYAN FRAME";
            string message = "State: " + stateText +
                "\nMouse: aim + left click    |    R: reset" +
                "\nRelease: " + controller.ReleaseSpeedKmh.ToString("0") + " km/h  |  Sim: " +
                controller.SimulationSpeed.ToString("0.00") + "x" +
                "\nThrown / completed: " + controller.PitchesThrown + " / " + controller.PitchesCompleted +
                "\nInput: " + PitchInputReader.Backend;
            if (controller.HasResult)
                message += "\nLast: " + (controller.LastInsideZone ? "IN TRAINING ZONE" : "OUTSIDE ZONE") +
                    "\nFlight: " + controller.LastFlightSeconds.ToString("0.000") + " s | Error: " +
                    controller.LastErrorMm.ToString("0.000") + " mm";
            else
                message += "\nNo completed pitch yet.";
            if (!string.IsNullOrEmpty(controller.ConfigurationError))
                message = "SETUP ERROR\n" + controller.ConfigurationError;
            GUI.Label(new Rect(24, 53, 344, 175), message, textStyle);
            GUI.Label(new Rect(24, 230, 344, 20), "Zone is a test guide, not an umpire system.", textStyle);
            GUI.matrix = oldMatrix;
        }
    }
}
