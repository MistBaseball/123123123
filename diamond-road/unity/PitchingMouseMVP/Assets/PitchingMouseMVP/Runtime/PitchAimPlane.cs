using UnityEngine;

namespace Baseball.PitchingMvp
{
    /// <summary>The aim surface is this transform's local XY plane, not the ground.</summary>
    [DisallowMultipleComponent]
    public sealed class PitchAimPlane : MonoBehaviour
    {
        [SerializeField] private Vector2 aimSize = new Vector2(2.4f, 1.8f);
        [SerializeField] private Vector2 trainingZoneSize = new Vector2(0.43f, 0.8f);

        public Vector2 AimSize { get { return aimSize; } }
        public Vector2 TrainingZoneSize { get { return trainingZoneSize; } }

        public bool IsValidConfiguration
        {
            get
            {
                return PitchTrajectory.IsFinite(aimSize.x) && PitchTrajectory.IsFinite(aimSize.y) &&
                    aimSize.x > 0f && aimSize.y > 0f &&
                    PitchTrajectory.IsFinite(trainingZoneSize.x) &&
                    PitchTrajectory.IsFinite(trainingZoneSize.y) &&
                    trainingZoneSize.x > 0f && trainingZoneSize.y > 0f &&
                    trainingZoneSize.x <= aimSize.x && trainingZoneSize.y <= aimSize.y &&
                    (transform.lossyScale - Vector3.one).sqrMagnitude < 0.000001f;
            }
        }

        public bool TryGetTarget(Camera camera, Vector2 screenPoint, out Vector3 target)
        {
            target = default(Vector3);
            if (camera == null || !IsValidConfiguration ||
                !PitchTrajectory.IsFinite(screenPoint.x) || !PitchTrajectory.IsFinite(screenPoint.y) ||
                !camera.pixelRect.Contains(screenPoint))
                return false;

            Ray ray = camera.ScreenPointToRay(screenPoint);
            float distance;
            if (!new Plane(transform.forward, transform.position).Raycast(ray, out distance))
                return false;

            target = ray.GetPoint(distance);
            if (!Contains(target))
                return false;
            Vector3 local = transform.InverseTransformPoint(target);
            local.z = 0f;
            target = transform.TransformPoint(local);
            return true;
        }

        public bool Contains(Vector3 worldPoint)
        {
            if (!IsValidConfiguration || !PitchTrajectory.IsFinite(worldPoint)) return false;
            Vector3 local = transform.InverseTransformPoint(worldPoint);
            const float tolerance = 0.0001f;
            return Mathf.Abs(local.z) <= 0.002f &&
                Mathf.Abs(local.x) <= aimSize.x * 0.5f + tolerance &&
                Mathf.Abs(local.y) <= aimSize.y * 0.5f + tolerance;
        }

        public bool IsInsideTrainingZone(Vector3 worldPoint)
        {
            if (!Contains(worldPoint)) return false;
            Vector3 local = transform.InverseTransformPoint(worldPoint);
            return Mathf.Abs(local.x) <= trainingZoneSize.x * 0.5f &&
                Mathf.Abs(local.y) <= trainingZoneSize.y * 0.5f;
        }

        private void OnDrawGizmosSelected()
        {
            Matrix4x4 previous = Gizmos.matrix;
            Gizmos.matrix = transform.localToWorldMatrix;
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireCube(Vector3.zero, new Vector3(aimSize.x, aimSize.y, 0.001f));
            Gizmos.color = Color.green;
            Gizmos.DrawWireCube(Vector3.zero, new Vector3(trainingZoneSize.x, trainingZoneSize.y, 0.001f));
            Gizmos.matrix = previous;
        }
    }
}
