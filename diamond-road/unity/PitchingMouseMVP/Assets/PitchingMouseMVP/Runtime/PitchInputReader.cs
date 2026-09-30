using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace Baseball.PitchingMvp
{
    public struct PitchInputFrame
    {
        public bool HasPointer;
        public Vector2 PointerPosition;
        public bool ThrowPressed;
        public bool ResetPressed;
    }

    /// <summary>Device adapter. Gameplay and trajectory code have no device dependency.</summary>
    [DisallowMultipleComponent]
    public sealed class PitchInputReader : MonoBehaviour
    {
        private bool requireRelease = true;
        public static string Backend
        {
            get
            {
#if ENABLE_INPUT_SYSTEM
                return "Input System";
#elif ENABLE_LEGACY_INPUT_MANAGER
                return "Legacy Input Manager";
#else
                return "Unavailable";
#endif
            }
        }

        private void OnEnable() { requireRelease = true; }
        private void OnApplicationFocus(bool focused) { requireRelease = true; }

        public PitchInputFrame ReadFrame()
        {
            PitchInputFrame result = default(PitchInputFrame);
            if (!isActiveAndEnabled || !Application.isFocused)
            {
                requireRelease = true;
                return result;
            }

            bool held = false;
            bool pressed = false;
#if ENABLE_INPUT_SYSTEM
            if (Keyboard.current != null)
                result.ResetPressed = Keyboard.current.rKey.wasPressedThisFrame;
            if (Mouse.current != null)
            {
                result.HasPointer = true;
                result.PointerPosition = Mouse.current.position.ReadValue();
                held = Mouse.current.leftButton.isPressed;
                pressed = Mouse.current.leftButton.wasPressedThisFrame;
            }
#elif ENABLE_LEGACY_INPUT_MANAGER
            result.ResetPressed = Input.GetKeyDown(KeyCode.R);
            result.HasPointer = Input.mousePresent;
            result.PointerPosition = Input.mousePosition;
            held = Input.GetMouseButton(0);
            pressed = Input.GetMouseButtonDown(0);
#endif
            if (requireRelease)
            {
                if (!held) requireRelease = false;
                return result;
            }
            result.ThrowPressed = pressed;
            return result;
        }
    }
}
