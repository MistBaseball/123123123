using System;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace Baseball.PitchingMvp.Editor
{
    /// <summary>Creates a separate scene. Never rewrites the user's scene or project settings.</summary>
    public static class PitchMvpSceneBuilder
    {
        private const string Root = "Assets/PitchingMouseMVP";

        [MenuItem("Tools/Baseball MVP/1. Create Mouse Pitch Scene")]
        public static void CreateScene()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                EditorUtility.DisplayDialog("Pitch MVP", "Stop Play Mode before creating a scene.", "OK");
                return;
            }
            Shader unlit = Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Unlit/Color");
            Shader lit = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            if (unlit == null || lit == null)
            {
                EditorUtility.DisplayDialog("Pitch MVP", "URP or Built-in shaders are required. No scene was changed.", "OK");
                return;
            }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

            // New assets always get a new folder; repeating the command cannot overwrite a scene.
            EnsureFolder(Root + "/Generated");
            string folder = AssetDatabase.GenerateUniqueAssetPath(Root + "/Generated/MousePitch");
            AssetDatabase.CreateFolder(Root + "/Generated", System.IO.Path.GetFileName(folder));

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            try
            {
                Material grass = MakeMaterial(folder, "Ground", lit, new Color(0.13f, 0.24f, 0.19f));
                Material dark = MakeMaterial(folder, "Backstop", unlit, new Color(0.045f, 0.065f, 0.09f));
                Material white = MakeMaterial(folder, "BallWhite", unlit, new Color(0.98f, 0.96f, 0.86f));
                Material cyan = MakeMaterial(folder, "AimCyan", unlit, new Color(0.15f, 0.88f, 1f));
                Material green = MakeMaterial(folder, "ZoneGreen", unlit, new Color(0.35f, 0.95f, 0.45f));
                Material orange = MakeMaterial(folder, "LockedOrange", unlit, new Color(1f, 0.62f, 0.15f));
                Material trajectory = MakeMaterial(folder, "Path", unlit, new Color(0.58f, 0.72f, 0.8f));

                Transform root = new GameObject("PitchingMVP").transform;
                Transform environment = Child("Environment", root);
                CreateCube("Ground", environment, new Vector3(0, -0.05f, 9), new Vector3(30, 0.1f, 30), grass, true);
                CreateCube("Backstop", environment, new Vector3(0, 1.35f, 18.35f), new Vector3(4.2f, 2.7f, 0.06f), dark, false);
                CreateCube("HomePlateMarker", environment, new Vector3(0, 0.025f, 18), new Vector3(0.43f, 0.05f, 0.43f), white, false);
                CreateCube("PitcherRubber", environment, new Vector3(0, 0.025f, -0.2f), new Vector3(0.6f, 0.05f, 0.15f), white, false);

                Transform release = Child("ReleasePoint", root);
                release.position = new Vector3(0, 1.8f, 0);
                Transform planeTransform = Child("AimPlane", root);
                planeTransform.position = new Vector3(0, 1.05f, 18);
                PitchAimPlane plane = planeTransform.gameObject.AddComponent<PitchAimPlane>();
                DrawRectangle("AimBoundary", planeTransform, plane.AimSize, cyan, 0.015f);
                DrawRectangle("TrainingZone", planeTransform, plane.TrainingZoneSize, green, 0.018f);

                Transform cameraTransform = Child("Main Camera", root);
                cameraTransform.tag = "MainCamera";
                cameraTransform.position = new Vector3(0, 2.2f, -4);
                cameraTransform.LookAt(planeTransform.position);
                Camera camera = cameraTransform.gameObject.AddComponent<Camera>();
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = new Color(0.16f, 0.22f, 0.29f);
                camera.fieldOfView = 28f;
                camera.nearClipPlane = 0.05f;
                camera.farClipPlane = 100f;
                cameraTransform.gameObject.AddComponent<AudioListener>();

                Transform lightTransform = Child("Directional Light", root);
                lightTransform.rotation = Quaternion.Euler(48f, -30f, 0f);
                Light light = lightTransform.gameObject.AddComponent<Light>();
                light.type = LightType.Directional;
                light.intensity = 1.2f;
                light.shadows = LightShadows.Soft;
                RenderSettings.ambientMode = AmbientMode.Flat;
                RenderSettings.ambientLight = new Color(0.42f, 0.46f, 0.5f);

                GameObject baseball = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                baseball.name = "Baseball";
                baseball.transform.SetParent(root, false);
                baseball.transform.position = release.position;
                baseball.transform.localScale = Vector3.one * 0.075f;
                baseball.GetComponent<Renderer>().sharedMaterial = white;
                // Analytic flight intentionally has no collision response in this MVP.
                baseball.GetComponent<SphereCollider>().enabled = false;
                TrailRenderer trail = baseball.AddComponent<TrailRenderer>();
                trail.sharedMaterial = orange;
                trail.time = 0.22f;
                trail.startWidth = 0.035f;
                trail.endWidth = 0.003f;
                trail.minVertexDistance = 0.015f;
                trail.emitting = false;
                trail.shadowCastingMode = ShadowCastingMode.Off;
                trail.receiveShadows = false;
                PitchBallMotor ball = baseball.AddComponent<PitchBallMotor>();
                ball.Configure(trail);

                Transform aim = DrawCircle("AimMarker", root, cyan, 0.065f, 0.012f).transform;
                Transform locked = DrawCross("LockedTarget", root, orange).transform;
                Transform impact = DrawCircle("ImpactMarker", root, green, 0.035f, 0.012f).transform;
                aim.gameObject.SetActive(false); locked.gameObject.SetActive(false); impact.gameObject.SetActive(false);

                LineRenderer preview = CreateLine("TrajectoryPreview", root, trajectory, 0.009f);
                preview.useWorldSpace = true;
                preview.positionCount = 0;
                preview.enabled = false;

                GameObject system = Child("PitchingSystem", root).gameObject;
                PitchInputReader input = system.AddComponent<PitchInputReader>();
                PitchingController controller = system.AddComponent<PitchingController>();
                controller.Configure(camera, plane, release, ball, input, aim, locked, impact, preview);
                system.AddComponent<PitchHud>().Configure(controller);

                string error;
                if (!controller.ValidateConfiguration(out error)) throw new InvalidOperationException(error);
                string scenePath = folder + "/MousePitchMVP.unity";
                EditorSceneManager.MarkSceneDirty(scene);
                if (!EditorSceneManager.SaveScene(scene, scenePath))
                    throw new InvalidOperationException("Could not save the new scene. Save it manually; the old scene is unchanged.");
                AssetDatabase.SaveAssets();
                Selection.activeGameObject = system;
                Debug.Log("[Pitch MVP] Created " + scenePath +
                    ". Run Tools > Baseball MVP > 2. Run Math and Scene Checks, then press Play.");
                EditorUtility.DisplayDialog("Mouse Pitch MVP ready", "New scene created and references connected.\n\n" +
                    "Press Play, move inside the cyan frame, then left click.\nR resets the ball.\n\n" +
                    "Original scenes and project settings were not changed.\n" + scenePath, "OK");
            }
            catch (Exception exception)
            {
                Debug.LogException(exception);
                EditorUtility.DisplayDialog("Pitch MVP setup stopped", exception.Message +
                    "\n\nThe original scene was not overwritten. The partially created scene/assets remain for inspection.", "OK");
            }
        }

        private static void EnsureFolder(string path)
        {
            string[] parts = path.Split('/');
            string current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next)) AssetDatabase.CreateFolder(current, parts[i]);
                current = next;
            }
        }

        private static Material MakeMaterial(string folder, string name, Shader shader, Color color)
        {
            Material material = new Material(shader) { name = name };
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", 0.15f);
            AssetDatabase.CreateAsset(material, folder + "/" + name + ".mat");
            return material;
        }

        private static Transform Child(string name, Transform parent)
        {
            Transform child = new GameObject(name).transform;
            child.SetParent(parent, false);
            return child;
        }

        private static GameObject CreateCube(string name, Transform parent, Vector3 position,
            Vector3 scale, Material material, bool colliderEnabled)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obj.name = name;
            obj.transform.SetParent(parent, false);
            obj.transform.position = position;
            obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            obj.GetComponent<BoxCollider>().enabled = colliderEnabled;
            return obj;
        }

        private static LineRenderer CreateLine(string name, Transform parent, Material material, float width)
        {
            LineRenderer line = Child(name, parent).gameObject.AddComponent<LineRenderer>();
            line.useWorldSpace = false;
            line.sharedMaterial = material;
            line.startWidth = width; line.endWidth = width;
            line.numCapVertices = 3;
            line.numCornerVertices = 3;
            line.shadowCastingMode = ShadowCastingMode.Off;
            line.receiveShadows = false;
            return line;
        }

        private static void DrawRectangle(string name, Transform parent, Vector2 size, Material material, float width)
        {
            LineRenderer line = CreateLine(name, parent, material, width);
            line.loop = true;
            line.positionCount = 4;
            float x = size.x * 0.5f, y = size.y * 0.5f;
            line.SetPositions(new[] { new Vector3(-x, -y, -0.015f), new Vector3(x, -y, -0.015f),
                new Vector3(x, y, -0.015f), new Vector3(-x, y, -0.015f) });
        }

        private static LineRenderer DrawCircle(string name, Transform parent, Material material, float radius, float width)
        {
            LineRenderer line = CreateLine(name, parent, material, width);
            line.loop = true;
            Vector3[] points = new Vector3[32];
            for (int i = 0; i < points.Length; i++)
            {
                float angle = i * Mathf.PI * 2f / points.Length;
                points[i] = new Vector3(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius, 0f);
            }
            line.positionCount = points.Length;
            line.SetPositions(points);
            return line;
        }

        private static GameObject DrawCross(string name, Transform parent, Material material)
        {
            Transform root = Child(name, parent);
            LineRenderer horizontal = CreateLine("Horizontal", root, material, 0.012f);
            horizontal.positionCount = 2;
            horizontal.SetPositions(new[] { new Vector3(-0.07f, 0, 0), new Vector3(0.07f, 0, 0) });
            LineRenderer vertical = CreateLine("Vertical", root, material, 0.012f);
            vertical.positionCount = 2;
            vertical.SetPositions(new[] { new Vector3(0, -0.07f, 0), new Vector3(0, 0.07f, 0) });
            return root.gameObject;
        }
    }
}
